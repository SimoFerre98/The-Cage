const CACHE_NAME = 'the-cage-pwa-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.svg',
  '/Logo_Torneo.webp',
  '/sfondo.webp',
  '/3d-field.webp'
];

// Install Event - Pre-cache the App Shell and fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching App Shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Dynamic routing and caching strategy
self.addEventListener('fetch', (event) => {
  // Only handle local GET requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Bypass API calls (Supabase Data API, Auth, Realtime) so they are always live and direct
  if (
    event.request.url.includes('/rest/v1/') || 
    event.request.url.includes('/auth/v1/') ||
    event.request.url.includes('/realtime/')
  ) {
    return;
  }

  // Bypass Vite/Astro dev server specific requests (HMR, hot-updates, node_modules, src)
  if (
    event.request.url.includes('/@vite/') ||
    event.request.url.includes('/@fs/') ||
    event.request.url.includes('hot-update') ||
    event.request.url.includes('/node_modules/') ||
    event.request.url.includes('/src/')
  ) {
    return;
  }

  const url = new URL(event.request.url);

  // Cache-First Strategy for static assets (images, CSS, JS, fonts)
  const isStaticAsset = 
    url.pathname.match(/\.(png|jpg|jpeg|webp|gif|svg|ico|woff|woff2|ttf|eot)$/) ||
    url.pathname.startsWith('/_astro/') ||
    url.pathname.includes('font') ||
    url.pathname.includes('css');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Fail silently for static assets offline
        });
      })
    );
  } else {
    // Stale-While-Revalidate Strategy for HTML and other main routes
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch((err) => {
          // If offline and request is an HTML page, serve the offline.html fallback
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/offline.html');
          }
          throw err;
        });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
