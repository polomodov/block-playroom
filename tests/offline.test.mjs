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
function setup(previousRelease = false) {
  const prefix = 'family-offline:/block-playroom/:';
  const oldName = prefix + 'old';
  const windows = ['playing', 'lobby'].map((id) => ({
    id,
    url: scope,
    postMessage: (msg) => messages.push(msg),
    navigate() {
      throw new Error('Update interrupted an open window');
    },
  }));
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
      matchAll: async () => windows,
      claim: async () => {},
      get: async (id) => windows.find((w) => w.id === id),
    },
    addEventListener: (name, fn) => (handlers[name] = fn),
    skipWaiting: async () => {
      activated++;
    },
  };
  const routes = new Map();
  const routesCache = {
    match: async (url) => routes.get(url)?.clone(),
    put: async (url, response) => routes.set(url, response),
  };
  const caches = {
    open: async (name) =>
      name === oldName
        ? { match: async (url) => (url === scope + 'photo.js' ? undefined : new Response('old release')) }
        : name.endsWith(':routes')
          ? routesCache
          : cache,
    keys: async () => (previousRelease ? [oldName, prefix + 'test'] : []),
    has: async (name) => previousRelease && name === oldName,
    delete: async () => false,
  };
  runInNewContext(source, {
    self,
    importScripts: () => {},
    OFFLINE_FILES: manifest,
    OFFLINE_GAME_COUNT: 15,
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
  async function status(clientId) {
    await new Promise((resolve, reject) =>
      handlers.message({
        data: 'offline-status',
        source: { id: clientId },
        ports: [{ postMessage: (data) => responses.push(data) }],
        waitUntil: (p) => p.then(resolve, reject),
      }),
    );
    return responses.at(-1);
  }
  return {
    install,
    activate: () =>
      new Promise((resolve, reject) => handlers.activate({ waitUntil: (p) => p.then(resolve, reject) })),
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
  assert.equal(reply.games, 15);
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

test('an upgrade preserves running seven-game windows and reports the expanded release to the next launcher', async () => {
  const sw = setup(true);
  await sw.install();
  await sw.activate();
  const old = await sw.status('playing');
  assert.equal(old.ready, true);
  assert.equal(old.pack, 'seven-games-v1');
  assert.equal(old.games, 7);
  assert.equal(old.library.games, 15);
  const fresh = await sw.status('reopened');
  assert.equal(fresh.games, 15);
  assert.equal(fresh.pack, old.library.pack);
});
