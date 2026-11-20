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
// Pages opened before an update keep reading the release they were loaded from,
// so a sprite sheet or script fetched mid-game always matches the code already
// running. The page-to-release map lives in Cache Storage, because the browser
// may stop and restart this worker at any time without running activate again.
const routesCache = prefix + 'routes';
const routesKey = base + '__offline-routes';
let routes;
function loadRoutes() {
  routes ??= caches
    .open(routesCache)
    .then((cache) => cache.match(routesKey))
    .then((response) => (response ? response.json() : {}))
    .catch(() => ({}));
  return routes;
}
async function saveRoutes(map) {
  routes = Promise.resolve(map);
  const cache = await caches.open(routesCache);
  await cache.put(routesKey, new Response(JSON.stringify(map), { headers: { 'Content-Type': 'application/json' } }));
}
// Releases created before this one, oldest first (Cache Storage keeps creation
// order). A newer release may already be installing; it is never touched here.
async function olderReleases() {
  const names = (await caches.keys()).filter((name) => name.startsWith(prefix) && name !== routesCache);
  const index = names.indexOf(cacheName);
  return index < 0 ? [] : names.slice(0, index);
}
// Forget closed pages and delete every older release no open page still uses.
async function pruneReleases(map) {
  const live = {};
  const found = await Promise.all(Object.keys(map).map((id) => self.clients.get(id)));
  for (const client of found) if (client) live[client.id] = map[client.id];
  await saveRoutes(live);
  const used = new Set(Object.values(live));
  const stale = (await olderReleases()).filter((name) => !used.has(name));
  await Promise.all(stale.map((name) => caches.delete(name)));
}

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
// Pruning is only safe once this release serves pages: before that, the
// previous worker is still active and its pages have no route yet.
let activation = null;
// Chromium hands pages to an activating worker and sends their requests before
// the activate event runs, so wait for the activated state as well.
async function activationDone() {
  const worker = self.serviceWorker;
  if (worker?.state === 'activating')
    await new Promise((resolve) => worker.addEventListener('statechange', resolve, { once: true }));
  await activation?.catch(() => {});
}
async function pruneWhenActive() {
  await activationDone();
  if ((self.serviceWorker?.state ?? 'activated') === 'activated') await pruneReleases(await loadRoutes());
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
    (activation = (async () => {
      let legacy = false;
      const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const older = await olderReleases();
      for (const name of older) {
        const old = await caches.open(name);
        if (
          (await old.match(new URL('index.html', base).href)) &&
          !(await old.match(new URL('games/block-maze/index.html', base).href))
        )
          legacy = true;
      }
      const map = { ...(await loadRoutes()) };
      // A page without a route was loaded from the newest older release; a page
      // that already has one keeps it through any number of further updates.
      const loadedFrom = older.at(-1);
      if (loadedFrom) for (const client of open) map[client.id] ??= loadedFrom;
      await pruneReleases(map);
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
    })()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data !== 'offline-status' || !event.ports[0]) return;
  event.waitUntil(
    (async () => {
      try {
        await completePack();
        await pruneWhenActive();
        event.ports[0].postMessage({
          ready: true,
          pack,
          games: 7,
          count: resources.size,
          totalBytes,
          revision: OFFLINE_REVISION,
        });
      } catch {
        // The site may already serve a newer release whose files no longer match
        // this worker's checksums. Ask the browser to fetch that release instead.
        self.registration.update?.().catch(() => {});
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
      // Wait until activation has recorded which release each open page was loaded from.
      await activationDone();
      const release = (await loadRoutes())[event.clientId];
      if (release && (await caches.has(release))) {
        const old = await caches.open(release).then((cache) => cache.match(key));
        if (old) return old;
      }
      const cache = await caches.open(cacheName);
      const cached = await cache.match(key);
      if (cached) return cached;
      await download(key, cache);
      return (await cache.match(key)) || Response.error();
    })(),
  );
});
