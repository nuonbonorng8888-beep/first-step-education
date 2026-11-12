// 1st Step Education PWA Service Worker
const CACHE_NAME = '1st-step-v84';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './version.json',
  './css/style.css',
  './lib/katex/katex.min.css',
  './lib/katex/katex.min.js',
  './lib/katex/contrib/auto-render.min.js',
  './js/visits.js',
  './js/app.js',
  './js/storage.js',
  './js/question-bank.js',
  './data/teachers.json',
  './data/courses.json',
  './data/worksheets.json',
  './data/worksheets_g11.json',
  './data/point_quizzes.json',
  './data/question_bank.json',
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
            console.log('Purging old service worker cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass through non-GET, API, media, and version/teachers files straight to network without stale caching
  if (event.request.method !== 'GET' || 
      event.request.url.includes('/api/') || 
      event.request.url.includes('/media/') ||
      event.request.url.includes('.mp4') ||
      event.request.url.includes('.pdf')) {
    return;
  }

  // Version and teachers data must always bypass cache for instant real-time sync across devices
  if (event.request.url.includes('version.json') || event.request.url.includes('teachers.json')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(event.request))
    );
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
