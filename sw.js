importScripts('./offline-files.js');
const base = self.registration.scope;
const prefix = 'family-offline:' + new URL(base).pathname + ':';
const cacheName = prefix + OFFLINE_REVISION;
const files = new Map(OFFLINE_FILES.map(([path, integrity]) => [new URL(path, base).href, integrity]));

// addAll is atomic: an interrupted download never advertises a partial game.
function download(cache, urls) {
  return cache.addAll(urls.map((url) => new Request(url, { cache: 'reload', integrity: files.get(url) })));
}
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => download(cache, [...files.keys()])));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys())
        if (name.startsWith(prefix) && name !== cacheName) await caches.delete(name);
      await self.clients.claim();
    })(),
  );
});
self.addEventListener('message', (event) => {
  if (event.data !== 'offline-status' || !event.ports[0]) return;
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(cacheName);
        const present = new Set((await cache.keys()).map((req) => req.url));
        const missing = [...files.keys()].filter((url) => !present.has(url));
        if (missing.length) await download(cache, missing);
        event.ports[0].postMessage({ ready: true, count: files.size, revision: OFFLINE_REVISION });
      } catch {
        event.ports[0].postMessage({ ready: false });
      }
    })(),
  );
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  url.search = '';
  url.hash = '';
  if (url.href === base) url.pathname += 'index.html';
  if (!files.has(url.href)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(cacheName);
      const cached = await cache.match(url.href);
      if (cached) return cached;
      await download(cache, [url.href]);
      return (await cache.match(url.href)) || Response.error();
    })(),
  );
});
