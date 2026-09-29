const CACHE_NAME = 'affiliate-hub-pro-v3';
const ASSETS_TO_CACHE = [
  '/', '/index.html', '/manifest.json', '/assets/logo.svg',
  '/assets/game-hero.svg', '/assets/favicon.svg', '/assets/icon.svg',
  '/assets/icon-192.png', '/assets/icon-512.png',
  '/assets/growth.css', '/assets/growth.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME)
    .then(cache => cache.addAll(ASSETS_TO_CACHE))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(names
    .filter(name => name.startsWith('affiliate-hub-pro-') && name !== CACHE_NAME)
    .map(name => caches.delete(name))))
    .then(() => self.clients.claim()));
});

// Network first: returning players get updates, offline players keep their game.
// Navigation queries are not cached separately for every friend's score.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const navigation = event.request.mode === 'navigate';
  if (!navigation && !ASSETS_TO_CACHE.includes(url.pathname)) return;
  const key = navigation ? '/index.html' : url.pathname;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(key, response.clone());
      return response;
    } catch (_) {
      return (await cache.match(key)) || Response.error();
    }
  })());
});
