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
  'block-maze': 'b0ef0d834e571df1f50081e4b6d7eed509c11101',
  'block-jump': '7c88599b6db09b4be3ebe08a21b32b70d5296811',
  'block-dash': '9ab83636d4fece6de85d6c863d6b797c2c1981d2',
};
const check = process.argv.includes('--check');
const ignored = new Set(['manifest.webmanifest', 'offline.js', 'offline.css', 'audio.js', 'assets/app-192.png',
  'assets/app-512.png', 'assets/app-maskable-512.png', 'assets/jump-share.png', 'assets/runner-share.jpg',
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
  if (name !== 'block-maze') {
    html = requiredReplace(html, 'href="../collection.css">', 'href="../collection.css">\n    <link rel="stylesheet" href="../classic-arcade.css">', page);
    const cover = name === 'block-jump'
      ? '  <link rel="preload" as="image" href="./assets/jump-cover.webp">'
      : '  <link rel="preload" href="./assets/runner-cover.webp" as="image">';
    html = requiredReplace(html, cover, '', page);
  }
  return html;
}
// Keep the games' own camera, action timing and input. Only their painting hooks
// change when they are packaged beside the reference labyrinth.
function classicModule(path, source, name) {
  const file = name + '/' + path;
  const imports = (names) => "import { " + names + " } from '../classic-arcade-art.js';\n";
  if (name === 'block-jump' && path === 'actors-art.js') {
    let art = requiredReplace(source, 'torso(c,s.heroId,h);', "if (!paintedPart(c, s.heroId, 'coat')) torso(c,s.heroId,h);", file);
    art = requiredReplace(art, 'head(c,s.heroId,h,s.time%3.8>3.66);', "if (!paintedPart(c, s.heroId, 'face')) head(c,s.heroId,h,s.time%3.8>3.66);", file);
    art = requiredReplace(art, /function (leg|arm)\(c,phase,run,air,ascent,front,h\) \{/g,
      'function $1(c,phase,run,air,ascent,front,id) {\n  const h = family[id];', file);
    art = requiredReplace(art, '  stroke(c,sign*.75,-8,kneeX', "  if (paintedLimb(c,id,'leg',front,[[sign*.75,-8],[kneeX,kneeY],[footX,footY]])) return;\n  stroke(c,sign*.75,-8,kneeX", file);
    art = requiredReplace(art, '  stroke(c,-1.45,-14.15,elbowX', "  if (paintedLimb(c,id,'arm',front,[[-1.45,-14.15],[elbowX,-11.25],[palmX,palmY]])) return;\n  stroke(c,-1.45,-14.15,elbowX", file);
    art = requiredReplace(art, /(leg|arm)\(c,m\.phase([^;]+),h\);/g, '$1(c,m.phase$2,s.heroId);', file);
    return imports('paintedPart, paintedLimb') + art;
  }
  if (name === 'block-jump' && path === 'renderer.js') {
    let art = requiredReplace(source, /const gemCut = \[[\s\S]*?(?=function checkpoint\()/, '', file);
    art = requiredReplace(art, 'c.drawImage(scene.scenery,-camera*.36,0,scene.scenery.width/density,HEIGHT);', '$&\n  jumpScenery(c, level, camera);', file);
    return imports('platformGem as gem, jumpScenery') + art;
  }
  if (name === 'block-dash' && path === 'actors.js') {
    return imports('trackGem as gem') + requiredReplace(source, /function gem\(c,p,s,o\) \{[\s\S]*?(?=function fret\()/, '', file);
  }
  if (name === 'block-dash' && path === 'scene-art.js') {
    return imports('stonePaving') + requiredReplace(source, "const g=skin.getContext('2d');", "$&\n  stonePaving(g, t.row, index);", file);
  }
  if (name !== 'block-maze' && path === 'game.js') {
    const platform = name === 'block-jump';
    const art = platform
      ? "import { terrainLayer as floor } from './world-art.js?v=studio-1';\n"
      : "import { projection as view, drawTrack as road, themes } from './scene-art.js?v=jump-1';\n";
    return imports('watchClassicCover') + art + source + '\nwatchClassicCover(' + (platform ? '{ floor }' : '{ view, road, themes }') + ');\n';
  }
  return source;
}
function adapt(path, bytes, name) {
  if (path === 'index.html') return Buffer.from(embedPage(bytes.toString(), name));
  if (name !== 'block-maze' && path.endsWith('.js')) bytes = Buffer.from(classicModule(path, bytes.toString(), name));
  if (path === 'game.js') {
    const start = {
      'block-maze': 'function start(hero, levelId) {',
      'block-jump': 'function start() {',
      'block-dash': 'if (!restored?.state) restored = null;',
    }[name];
    const claim = name === 'block-dash' ? 'if (!restored) beginArcadeRound();' : 'beginArcadeRound();';
    const source = requiredReplace(bytes.toString(), start, start + '\n  ' + claim, name + '/game.js');
    return Buffer.from("import { enterCollectionGame } from '../collection-navigation.js';\n" +
      "import { beginArcadeRound } from './progress.js';\n" + source + '\nenterCollectionGame();\n');
  }
  if (path === 'progress.js') {
    const file = name + '/progress.js';
    let source = requiredReplace(bytes.toString(),
      "'family-games:' + new URL('.', import.meta.url).pathname + ':progress:1'",
      "'family-games:/" + name + "/:progress:1'", file);
    // Keep each edition's storage key and its hero/level labels. The library
    // shares the history reader and assigns save ownership when a player starts or resumes.
    source = requiredReplace(source, /let memory = \{saved:null, results:\[\]\};[\s\S]*$/,
      'export const { beginArcadeRound, loadSavedGame, saveGame, clearSavedGame, addResult, bindProgress } =\n' +
      '  arcadeProgress(key, heroes, levels);\n', file);
    return Buffer.from("import { arcadeProgress } from '../arcade-progress.js';\n" + source);
  }
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
  // Playroom editions use the collection mixer and keep the original guitar performance.
  // Apply the per-game entry-point patch to the adapted release without modifying the sibling checkout.
  const audioDir = join(temp, name + '-audio');
  mkdirSync(audioDir);
  const entry = join(audioDir, 'game.js');
  writeFileSync(entry, files.get('game.js'));
  git(audioDir, 'apply', '--no-index', join(root, 'scripts/arcade-audio', name + '.patch'));
  files.set('game.js', readFileSync(entry));
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
