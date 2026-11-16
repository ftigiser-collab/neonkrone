// Offline-Cache: Netz zuerst, Cache als Rückfall
const CACHE = 'sandthron-v22';
const FILES = ['./', 'index.html', 'style.css', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png',
  'src/main.js', 'src/game.js', 'src/map.js', 'src/hex.js', 'src/data.js', 'src/ai.js', 'src/ui.js', 'src/render.js', 'src/sprites.js', 'src/fx.js', 'src/util.js', 'src/campaign.js', 'src/art.js', 'src/bart.js', 'src/vart.js', 'src/iart.js', 'src/menubg.js', 'src/poiart.js', 'src/shipart.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
