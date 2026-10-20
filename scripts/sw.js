// Service worker (web app). Keeps the app's code, fonts and launch images on the phone so it opens
// from local storage instead of the network, and still opens on a weak or no connection.
// Built into dist/sw.js by scripts/stamp-sw.mjs, which fills in the build id and file list.
const BUILD = '__BUILD_ID__';
const CODE = `myspace-code-${BUILD}`; // hashed app code for this build
const MEDIA = 'myspace-media-v1'; // fonts and images (names don't change between builds)
const PRECACHE = __PRECACHE__;

const isCode = (p) => p.startsWith('/_expo/static/') || p.startsWith('/assets/');
const isMedia = (p) => p.startsWith('/fonts/') || /^\/launch-.*\.webp$/.test(p) || /\.(png|webp|jpg|svg|ico)$/.test(p);

self.addEventListener('install', (event) => {
  const media = PRECACHE.filter(isMedia);
  const code = ['/', ...PRECACHE.filter((p) => !isMedia(p))];
  event.waitUntil(
    Promise.all([
      caches.open(CODE).then((c) => c.addAll(code)),
      caches.open(MEDIA).then((c) => c.addAll(media)),
    ]).catch(() => {}),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('myspace-code-') && k !== CODE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && res.type === 'basic') cache.put(request, res.clone());
  return res;
}

// Pages: always try the network first (so a new version shows up right away), but don't wait more
// than a few seconds — then open from the copy on the phone.
async function page(request) {
  const cache = await caches.open(CODE);
  const network = fetch(request).then((res) => {
    if (res.ok) cache.put('/', res.clone());
    return res;
  });
  const timeout = new Promise((resolve) => setTimeout(resolve, 3000, null));
  try {
    const res = await Promise.race([network, timeout]);
    if (res) return res;
  } catch {
    // offline — fall through to the saved copy
  }
  return (await cache.match('/')) || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Supabase, Mapbox etc. go straight to the network
  if (request.mode === 'navigate') return event.respondWith(page(request));
  if (isCode(url.pathname)) return event.respondWith(cacheFirst(request, CODE));
  if (isMedia(url.pathname)) return event.respondWith(cacheFirst(request, MEDIA));
});
