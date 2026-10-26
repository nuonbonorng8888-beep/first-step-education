// 1st Step Education PWA Service Worker
const CACHE_NAME = '1st-step-v57';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './lib/katex/katex.min.css',
  './lib/katex/katex.min.js',
  './lib/katex/contrib/auto-render.min.js',
  './js/visits.js',
  './js/app.js',
  './js/storage.js',
  './data/courses.json',
  './data/worksheets.json',
  './data/worksheets_g11.json',
  './apple-touch-icon.png',
  './apple-touch-icon-precomposed.png',
  './assets/apple-touch-icon.png',
  './assets/apple-touch-icon-180x180.png',
  './assets/apple-touch-icon-152x152.png',
  './assets/apple-touch-icon-120x120.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/favicon-32x32.png',
  './assets/mascot.jpg',
  './assets/app_logo.jpg',
  './assets/school_logo.png',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Pre-cache partial fail, continuing anyway:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass through non-GET and media/API requests directly to network
  if (event.request.method !== 'GET' || 
      event.request.url.includes('/api/') || 
      event.request.url.includes('/media/') ||
      event.request.url.includes('.mp4') ||
      event.request.url.includes('.pdf')) {
    return;
  }

  // Network-first with dynamic cache update for seamless mobile sync
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
