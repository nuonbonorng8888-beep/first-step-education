// 1st Step Education PWA Service Worker
// Keep ASSET_VERSION equal to the ?v= numbers in index.html.
const ASSET_VERSION = '229';
const CACHE_NAME = '1st-step-v' + ASSET_VERSION;

// Small files needed to open the app offline. Big data files
// (question bank, worksheets, quizzes, ~23 MB) are NOT pre-downloaded:
// they are fetched when first needed and kept for offline use after that.
const V = '?v=' + ASSET_VERSION;
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css' + V,
  './css/box-calc.css' + V,
  './css/accounts.css' + V,
  './lib/katex/katex.min.css',
  './lib/katex/katex.min.js',
  './lib/katex/contrib/auto-render.min.js',
  './js/firebase-config.js' + V,
  './js/cloud.js' + V,
  './js/storage.js' + V,
  './js/question-bank.js' + V,
  './js/app.js' + V,
  './js/visits.js' + V,
  './js/box-calc.js' + V,
  './js/accounts.js' + V,
  './js/scores.js' + V,
  './js/exams.js' + V,
  './data/teachers.json',
  './apple-touch-icon.png',
  './assets/icon-192.png',
  './assets/favicon-32x32.png',
  './assets/mascot.jpg',
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
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('Purging old service worker cache:', key);
          return caches.delete(key);
        }
        return null;
      })
    ))
  );
  self.clients.claim();
});

// Cache key without cache-busting params, so repeated loads of the same
// data file reuse one entry instead of piling up copies.
function stableKey(request) {
  const url = new URL(request.url);
  ['v', '_t', 't', '_bust'].forEach((p) => url.searchParams.delete(p));
  return url.toString();
}

function putInCache(key, response) {
  if (response && response.status === 200 && response.type === 'basic') {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(key, copy));
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Not ours or not cacheable: let the browser handle it
  if (req.method !== 'GET' || url.origin !== self.location.origin ||
      url.pathname.includes('/api/') || url.pathname.includes('/media/') ||
      url.pathname.endsWith('.mp4') || url.pathname.endsWith('.pdf')) {
    return;
  }

  const path = url.pathname;
  const isVersioned = url.searchParams.has('v') && /\.(js|css|jpg|jpeg|png|webp)$/.test(path);
  const isLiveFile = path.endsWith('/version.json') || path.endsWith('/stats.json');

  // 1) Versioned code/images (?v=136): the URL changes on every release,
  //    so a cached copy is always correct — serve it instantly.
  if (isVersioned) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => putInCache(req, res)))
    );
    return;
  }

  // 2) Update check & counters: always from the network
  if (isLiveFile) return;

  // 3) Pages and data (.json): ask the server whether the file changed
  //    ('no-cache' → cheap 304 when unchanged), fall back to cache offline.
  if (req.mode === 'navigate' || path.endsWith('.json') || path.endsWith('.html') || path.endsWith('/')) {
    const key = stableKey(req);
    event.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => putInCache(key, res))
        .catch(() => caches.match(key).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  // 4) Everything else (images, fonts, katex): cached copy first for
  //    speed, refreshed in the background for next time.
  event.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req).then((res) => putInCache(req, res)).catch(() => hit);
      return hit || network;
    })
  );
});
