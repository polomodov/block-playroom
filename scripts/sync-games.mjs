// Rebuild the playable editions from immutable Git commits. Existing sibling clones
// are optional: on a fresh checkout missing objects are fetched into a temporary bare repo.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const releases = {
  'block-maze': '3ab21d0378eb093aa26347e7622346e2a94efe46',
  'block-jump': '88d08276b0b7caedab5c2d206b989ea6d09102d1',
  'block-dash': 'ccb751fde578d0e71c13b61231300e2755aad63a',
};
const check = process.argv.includes('--check');
const ignored = new Set(['manifest.webmanifest', 'offline.js', 'offline.css', 'assets/app-192.png',
  'assets/app-512.png', 'assets/jump-share.png', 'assets/runner-share.jpg',
  'assets/share/story.png', 'assets/share/family.png']);

function git(directory, ...args) {
  return execFileSync('git', ['-C', directory, ...args], { maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
}
function checkout(name, revision, temp) {
  const local = resolve(root, '..', name);
  try {
    git(local, 'cat-file', '-e', revision + '^{commit}');
    return local;
  } catch { /* The game can be rebuilt without its sibling checkout. */ }
  const bare = join(temp, name);
  mkdirSync(bare);
  git(bare, 'init', '--bare', '--quiet');
  git(bare, 'fetch', '--quiet', '--depth=1', 'https://github.com/polomodov/' + name + '.git', revision);
  return bare;
}
function requiredReplace(text, original, replacement, file) {
  const next = text.replace(original, replacement);
  if (next === text) throw new Error('Upstream layout changed in ' + file + ' near ' + original);
  return next;
}
function embedPage(html, name) {
  const page = name + '/index.html';
  // Use the same PWA identity when someone adds an individual game to their home screen.
  html = requiredReplace(html, 'href="./manifest.webmanifest"', 'href="../../manifest.webmanifest"', page);
  html = requiredReplace(html, 'href="./assets/app-192.png"', 'href="../../assets/app-192.png"', page);
  html = requiredReplace(html, /(<meta name="apple-mobile-web-app-title" content=")[^"]+"/, '$1Игротека"', page);
  html = requiredReplace(html, '<link rel="stylesheet" href="./offline.css">',
    '<link rel="stylesheet" href="../../offline.css">\n    <link rel="stylesheet" href="../collection.css">', page);
  html = requiredReplace(html, /\s*<script type="module" src="\.\/offline\.js"><\/script>/, '', page);

  // Retain the actual game-specific resume/history panel and remove the old individual installation controls.
  html = requiredReplace(html, /\s*<div class="offline-line">[\s\S]*?<\/div>/, '', page);
  html = requiredReplace(html, /\s*<details><summary>Как взять игру в дорогу<\/summary>[\s\S]*?<\/details>/, '', page);
  html = requiredReplace(html, 'aria-label="Офлайн и сохранения"', 'aria-label="Сохранения"', page);
  html = requiredReplace(html, /(<section\s+id="lobby"[^>]*>)/,
    '$1\n      <a class="collection-home" data-collection-home href="../../">‹ В игротеку</a>', page);

  // These anchors are in-game navigation. Social metadata continues to identify its original published artwork.
  html = html.replace(/(<a\b[^>]*? href=")https:\/\/games\.polomodov\.tech\/(block-[a-z]+)\/"/g,
    (_, before, target) => {
      if (target === 'block-playroom') return before + '../../"';
      if (!Object.hasOwn(releases, target)) throw new Error('Unbundled game link: ' + target);
      return before + '../' + target + '/"';
    });
  return html;
}
function adapt(path, bytes, name) {
  if (path === 'index.html') return Buffer.from(embedPage(bytes.toString(), name));
  if (path === 'game.js') return Buffer.from("import { enterCollectionGame } from '../collection-navigation.js';\n" +
    bytes.toString() + '\nenterCollectionGame();\n');
  if (path === 'progress.js') return Buffer.from(requiredReplace(bytes.toString(),
    "'family-games:' + new URL('.', import.meta.url).pathname + ':progress:1'",
    "'family-games:/" + name + "/:progress:1'", name + '/progress.js'));
  return bytes;
}
function diskFiles(dir, prefix = '') {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, {withFileTypes: true}).flatMap(item => {
    const path = prefix + item.name;
    return item.isDirectory() ? diskFiles(join(dir, item.name), path + '/') : [path];
  });
}

function sync(name, revision, temp) {
  const repo = checkout(name, revision, temp);
  const source = path => git(repo, 'show', revision + ':' + path);
  const inventory = source('offline-files.js').toString().match(/const OFFLINE_FILES = (\[[\s\S]*\]);/);
  if (!inventory) throw new Error('Missing offline inventory for ' + name);
  const files = new Map();
  for (const [path, integrity] of JSON.parse(inventory[1])) {
    if (!/^(?:[\w.-]+\/)*[\w.-]+$/.test(path) || path.split('/').includes('..')) throw new Error('Invalid release path: ' + path);
    if (ignored.has(path)) continue;
    const original = source(path);
    const actual = 'sha256-' + createHash('sha256').update(original).digest('base64');
    if (actual !== integrity) throw new Error('Invalid upstream checksum for ' + name + '/' + path);
    files.set(path, adapt(path, original, name));
  }
  files.set('LICENSE', source('LICENSE'));
  files.set('assets/FONT-LICENSE.txt', source('assets/FONT-LICENSE.txt'));

  const output = join(root, 'games', name);
  for (const path of diskFiles(output)) {
    if (files.has(path)) continue;
    if (check) throw new Error('Stale embedded game file: ' + name + '/' + path);
    rmSync(join(output, path));
  }
  for (const [path, bytes] of files) {
    const destination = join(output, path);
    if (existsSync(destination) && bytes.equals(readFileSync(destination))) continue;
    if (check) throw new Error('Run node scripts/sync-games.mjs to update ' + name + '/' + path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, bytes);
  }
  console.log(name + ' @ ' + revision.slice(0, 10) + ' · ' + files.size + ' files');
}

const temporary = mkdtempSync(join(tmpdir(), 'playroom-games-'));
try {
  for (const [name, revision] of Object.entries(releases)) sync(name, revision, temporary);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
