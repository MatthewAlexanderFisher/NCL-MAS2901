// Bump this to invalidate old caches after content updates
const CACHE_VERSION = 'v1.0.1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;

// Use relative URLs so it works at /repo/ subpaths
const OFFLINE_URL = './pwa/offline.html';

// Files to warm into the cache at install time.
// Keep this list lean; runtime caching will fill in the rest.
const PRECACHE = [
  './',                                // book landing (index.html)
  './pwa/offline.html',                // offline fallback
  './site_libs/quarto-html/quarto.js', // adjust if your build differs
  // Optionally add common assets:
  // './search.json',
  // './site_libs/quarto-html/quarto-syntax-highlighting.css'
].filter(Boolean);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k !== STATIC_CACHE)
        .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Strategy:
// - Navigations (HTML): network-first, fall back to cached page, then offline.html.
// - Static assets (css/js/img/font): stale-while-revalidate.
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(handleNavigation(req));
    return;
  }

  if (['style', 'script', 'image', 'font'].includes(req.destination)) {
    event.respondWith(staleWhileRevalidate(req));
  }
});

async function handleNavigation(req) {
  try {
    const netRes = await fetch(req);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(req, netRes.clone());
    return netRes;
  } catch (err) {
    // Try cache first, then offline page
    const cached = await caches.match(req);
    return cached || (await caches.match(OFFLINE_URL));
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(req);

  const fetchPromise = fetch(req)
    .then(res => {
      cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached); // if network fails, use cache if present

  return cached || fetchPromise;
}
