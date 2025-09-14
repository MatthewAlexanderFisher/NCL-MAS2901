// Bump this to invalidate old caches after content updates
const CACHE_VERSION = 'v1.0.4';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// Use relative URLs so it works at /repo/ subpaths
const OFFLINE_URL = './pwa/offline.html';

// Only precache files with stable names
const PRECACHE = [
  './',                                     // book landing (index.html)
  './index.html',                          // explicit index
  './pwa/offline.html',                    // offline fallback
  './site_libs/quarto-html/quarto.js',     // core Quarto JS
  './site_libs/bootstrap/bootstrap.min.js', // Bootstrap JS
  './pwa/manifest.webmanifest',
  './pwa/icons/icon-192.png',
  './pwa/icons/icon-512.png',
].filter(url => url); // Remove any undefined entries

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        // Cache each URL, but don't fail everything if one fails
        return Promise.allSettled(
          PRECACHE.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
            })
          )
        );
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Special handling for critical directories - cache aggressively
  // This includes theming, site_libs (Quarto/Bootstrap files)
  if (url.pathname.includes('/theming/') || 
      url.pathname.includes('/site_libs/')) {
    event.respondWith(cacheFirstWithFallback(req));
    return;
  }

  // Handle navigation requests (HTML pages)
  if (req.mode === 'navigate') {
    event.respondWith(handleNavigation(req));
    return;
  }

  // Handle static assets
  if (isStaticAsset(req)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Handle API/data requests (like search.json)
  if (url.pathname.endsWith('.json')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Default strategy for everything else
  event.respondWith(staleWhileRevalidate(req));
});

// Cache-first strategy for critical assets (theming, site_libs)
async function cacheFirstWithFallback(req) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Check cache first
  const cached = await cache.match(req);
  if (cached) {
    // Return cached version immediately
    return cached;
  }
  
  // Not in cache, try to fetch and cache it
  try {
    const netRes = await fetch(req);
    if (netRes.ok) {
      // Cache it for next time
      await cache.put(req, netRes.clone());
      console.log(`Cached critical file: ${req.url}`);
    }
    return netRes;
  } catch (err) {
    console.error(`Failed to fetch critical file: ${req.url}`, err);
    
    // Return appropriate fallback based on file type
    const url = req.url;
    if (url.includes('.woff') || url.includes('.woff2') || url.includes('.ttf')) {
      return new Response('', { status: 404 });
    }
    if (url.includes('.css')) {
      return new Response('/* Fallback styles */', {
        headers: { 'Content-Type': 'text/css' }
      });
    }
    if (url.includes('.js')) {
      return new Response('// Fallback script', {
        headers: { 'Content-Type': 'application/javascript' }
      });
    }
    return new Response('Resource not found', { status: 404 });
  }
}

// Navigation strategy: Try cache first for offline-first experience
async function handleNavigation(req) {
  const normalizedUrl = normalizeNavigationUrl(req.url);
  
  // Check if we have this page cached
  const cached = await caches.match(normalizedUrl) || 
                 await caches.match(req);
  
  // If offline, return cached immediately if available
  if (!navigator.onLine && cached) {
    return cached;
  }
  
  // Try network, but with a timeout for slow connections
  try {
    const networkPromise = fetch(req);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network timeout')), 3000)
    );
    
    const netRes = await Promise.race([networkPromise, timeoutPromise]);
    
    // Cache successful responses
    if (netRes.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, netRes.clone());
    }
    return netRes;
  } catch (err) {
    // Return cached version if available, otherwise offline page
    if (cached) return cached;
    
    const offlinePage = await caches.match(OFFLINE_URL);
    if (offlinePage) return offlinePage;
    
    // Last resort: return a basic offline message
    return new Response('Offline - Page not cached', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({'Content-Type': 'text/plain'})
    });
  }
}

// Cache-first strategy for static assets
async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  
  try {
    const netRes = await fetch(req);
    if (netRes.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(req, netRes.clone());
    }
    return netRes;
  } catch (err) {
    // Return a 404 for missing static assets
    return new Response('Asset not found', { status: 404 });
  }
}

// Network-first strategy for dynamic content
async function networkFirst(req) {
  try {
    const netRes = await fetch(req);
    if (netRes.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, netRes.clone());
    }
    return netRes;
  } catch (err) {
    const cached = await caches.match(req);
    if (cached) return cached;
    return new Response('{}', {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);

  const fetchPromise = fetch(req)
    .then(res => {
      if (res.ok) {
        cache.put(req, res.clone());
      }
      return res;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// Helper to determine if request is for a static asset
function isStaticAsset(req) {
  const url = req.url;
  const staticExtensions = [
    '.css', '.js', '.woff', '.woff2', '.ttf', '.eot',
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'
  ];
  return staticExtensions.some(ext => url.includes(ext));
}

// Normalize navigation URLs (handle / and /index.html as same)
function normalizeNavigationUrl(url) {
  const urlObj = new URL(url);
  if (urlObj.pathname.endsWith('/')) {
    urlObj.pathname += 'index.html';
  }
  return urlObj.href;
}

// Optional: Pre-cache important pages after activation
self.addEventListener('message', event => {
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE)
        .then(cache => cache.addAll(event.data.urls))
    );
  }
});