// 1st Step Education PWA Service Worker
const CACHE_NAME = '1st-step-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/player.js',
  './js/storage.js',
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

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
