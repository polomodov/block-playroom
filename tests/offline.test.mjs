import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
const scope = 'https://example.test/block-playroom/';
const manifest = [
  ['index.html', 'root', 10],
  ['games/block-maze/index.html', 'maze', 4],
  ['games/block-maze/game.js', 'same-js', 3],
  ['games/block-jump/game.js', 'same-js', 3],
  ['assets/portraits.webp', 'same-image', 100],
  ['games/block-jump/assets/portraits.webp', 'same-image', 100],
  ['games/block-maze/assets/portraits.webp', 'same-image', 100],
  ['assets/portraits.png', 'same-image', 100],
];
function setup() {
  const handlers = {},
    stored = new Map(),
    requests = [],
    messages = [],
    responses = [];
  const expected = new Map(manifest.map(([path, hash]) => [scope + path, hash]));
  let failed = '',
    activated = 0;
  const cache = {
    keys: async () => [...stored.keys()].map((url) => ({ url })),
    match: async (url) => stored.get(url)?.clone(),
    async add(request) {
      requests.push(request.url);
      assert.equal(request.integrity, expected.get(request.url));
      assert.equal(request.cache, 'reload');
      if (request.url === failed) throw new Error('Bad integrity');
      stored.set(request.url, new Response(request.url));
    },
  };
  const self = {
    registration: { scope },
    clients: {
      matchAll: async () => [{ url: scope, postMessage: (data) => messages.push(data) }],
      claim: async () => {},
    },
    addEventListener: (name, fn) => (handlers[name] = fn),
    skipWaiting: async () => {
      activated++;
    },
  };
  const caches = { open: async () => cache, keys: async () => [] };
  runInNewContext(source, {
    self,
    importScripts: () => {},
    OFFLINE_FILES: manifest,
    OFFLINE_REVISION: 'test',
    caches,
    URL,
    Request,
    Response,
  });
  const install = () =>
    new Promise((resolve, reject) => handlers.install({ waitUntil: (p) => p.then(resolve, reject) }));
  const fetch = (path) => {
    let result;
    handlers.fetch({ request: new Request(scope + path), respondWith: (p) => (result = p) });
    return result;
  };
  async function status() {
    await new Promise((resolve, reject) =>
      handlers.message({
        data: 'offline-status',
        ports: [{ postMessage: (data) => responses.push(data) }],
        waitUntil: (p) => p.then(resolve, reject),
      }),
    );
    return responses.at(-1);
  }
  return {
    install,
    fetch,
    status,
    requests,
    messages,
    stored,
    get activated() {
      return activated;
    },
    setFailure: (path) => {
      failed = scope + path;
    },
  };
}
test('one offline copy per identical media file and separate copies of location-dependent scripts', async () => {
  const sw = setup();
  await sw.install();
  assert.equal(sw.activated, 1);
  assert.equal(sw.requests.length, 6);
  const reply = await sw.status();
  assert.equal(reply.ready, true);
  assert.equal(reply.games, 7);
  assert.equal(reply.totalBytes, 220);
  assert.equal(reply.count, 6);
  assert.equal(sw.messages.at(-1).bytes, 220);
  assert.equal(
    await (await sw.fetch('games/block-jump/assets/portraits.webp?version=2')).text(),
    scope + 'assets/portraits.webp',
  );
  assert.equal(await (await sw.fetch('games/block-jump/game.js')).text(), scope + 'games/block-jump/game.js');
});
test('all cached entries resolve offline from slash, query, explicit index and file URLs', async () => {
  const sw = setup();
  await sw.install();
  for (const path of ['', '?game=coop', 'index.html?game=golf'])
    assert.equal(await (await sw.fetch(path)).text(), scope + 'index.html');
  for (const path of [
    'games/block-maze/',
    'games/block-maze/index.html?hero=pasha',
    'games/block-maze/?level=end',
  ])
    assert.equal(await (await sw.fetch(path)).text(), scope + 'games/block-maze/index.html');
  assert.equal(
    (await sw.fetch('games/block-maze?hero=mom')).headers.get('location'),
    scope + 'games/block-maze/?hero=mom',
  );
  assert.equal(sw.fetch('unknown/'), undefined);
});
test('an interrupted pack cannot activate or report ready and its retry reuses verified data', async () => {
  const sw = setup();
  sw.setFailure('games/block-maze/game.js');
  await assert.rejects(sw.install());
  assert.equal(sw.activated, 0);
  assert.equal((await sw.status()).ready, false);
  const before = sw.requests.length;
  sw.setFailure('');
  await sw.install();
  assert.deepEqual(sw.requests.slice(before), [scope + 'games/block-maze/game.js']);
  assert.equal((await sw.status()).ready, true);
  sw.stored.delete(scope + 'index.html');
  sw.setFailure('index.html');
  assert.equal((await sw.status()).ready, false);
  sw.setFailure('');
  assert.equal((await sw.status()).ready, true);
});
