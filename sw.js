importScripts('./offline-files.js');

const base = self.registration.scope;
const prefix = 'family-offline:' + new URL(base).pathname + ':';
const cacheName = prefix + OFFLINE_REVISION;
const pack = 'seven-games-v1';
const entries = new Map();
const resources = new Map();
const uniqueAssets = new Map();
const directories = new Set();
let totalBytes = 0;

for (const [path, integrity, bytes] of OFFLINE_FILES) {
  const url = new URL(path, base).href;
  // Scripts, HTML and CSS resolve relative URLs against their own response URL.
  // Only share immutable media, with a matching content type and exact digest.
  const media = path.match(/\.(webp|png|jpg|jpeg|svg|ico|mp3|ogg|wav|woff2?|ttf)$/i);
  const identity = media && media[1].toLowerCase() + ':' + integrity;
  const canonical = (identity && uniqueAssets.get(identity)) || url;
  entries.set(url, canonical);
  if (path.endsWith('/index.html') || path === 'index.html') directories.add(new URL('.', url).href);
  if (resources.has(canonical)) continue;
  if (identity) uniqueAssets.set(identity, canonical);
  resources.set(canonical, { integrity, bytes });
  totalBytes += bytes;
}

function download(url, cache) {
  const request = new Request(url, { cache: 'reload', integrity: resources.get(url).integrity });
  // Fetch validates SRI before any response becomes available for storage.
  return cache.add(request);
}

async function broadcast(done, bytes) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) {
    if (client.url.startsWith(base))
      client.postMessage({ type: 'pack-progress', pack, done, bytes, totalBytes });
  }
}

async function fillCache() {
  const cache = await caches.open(cacheName);
  const present = new Set((await cache.keys()).map((request) => request.url));
  const missing = [];
  let bytes = 0;
  for (const [url, info] of resources) {
    if (present.has(url)) bytes += info.bytes;
    else missing.push(url);
  }
  let done = resources.size - missing.length;
  await broadcast(done, bytes);
  // Keep verified batches in this revision's staging cache if the device goes
  // offline partway through. The worker is activated only after every batch.
  for (let i = 0; i < missing.length; i += 6) {
    const urls = missing.slice(i, i + 6);
    const results = await Promise.allSettled(urls.map((url) => download(url, cache)));
    const failed = results.find((result) => result.status === 'rejected');
    if (failed) throw failed.reason;
    for (const url of urls) bytes += resources.get(url).bytes;
    done += urls.length;
    await broadcast(done, bytes);
  }
}
let filling;
function completePack() {
  if (!filling)
    filling = fillCache().finally(() => {
      filling = null;
    });
  return filling;
}

self.addEventListener('install', (event) => {
  event.waitUntil(completePack().then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      let legacy = false;
      for (const name of await caches.keys()) {
        if (!name.startsWith(prefix) || name === cacheName) continue;
        const old = await caches.open(name);
        if (
          (await old.match(new URL('index.html', base).href)) &&
          !(await old.match(new URL('games/block-maze/index.html', base).href))
        )
          legacy = true;
        await caches.delete(name);
      }
      await self.clients.claim();
      // The previous four-game launcher predates controllerchange handling.
      // Replace a cached legacy home page once. An open game has ?game=... and
      // continues until its next navigation, with its saved progress intact.
      if (legacy) {
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) {
          const url = new URL(client.url);
          if (
            (url.origin + url.pathname === base || url.origin + url.pathname === base + 'index.html') &&
            !url.searchParams.has('game')
          ) {
            // Do not wait for navigation inside activation: its fetch may be
            // queued until activation itself completes.
            client.navigate(client.url).catch(() => {});
          }
        }
      }
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data !== 'offline-status' || !event.ports[0]) return;
  event.waitUntil(
    (async () => {
      try {
        await completePack();
        event.ports[0].postMessage({
          ready: true,
          pack,
          games: 7,
          count: resources.size,
          totalBytes,
          revision: OFFLINE_REVISION,
        });
      } catch {
        event.ports[0].postMessage({ ready: false, pack });
      }
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const clean = url.origin + url.pathname;
  if (!url.pathname.endsWith('/') && directories.has(clean + '/')) {
    url.pathname += '/';
    event.respondWith(Response.redirect(url.href, 308));
    return;
  }
  const key = entries.get(directories.has(clean) ? clean + 'index.html' : clean);
  if (!key) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(cacheName);
      const cached = await cache.match(key);
      if (cached) return cached;
      await download(key, cache);
      return (await cache.match(key)) || Response.error();
    })(),
  );
});
