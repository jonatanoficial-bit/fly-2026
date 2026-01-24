// sw.js — cache offline (PWA)
const CACHE_NAME = "flysim-offline-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./admin.html",
  "./css/style.css",
  "./js/data.js",
  "./js/map.js",
  "./js/game.js",
  "./js/ui.js",
  "./manifest.webmanifest",
  "./assets/images/logo.png",
  "./assets/images/cover.png",
  "./assets/images/plane.png",
  "./assets/images/map_bg.png",
  "./assets/images/aircraft_narrow.png",
  "./assets/images/aircraft_wide.png",
  "./assets/images/aircraft_regional.png",
  "./assets/images/aircraft_turboprop.png",
  "./assets/images/aircraft_jumbo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => (k===CACHE_NAME?null:caches.delete(k)))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(()=>{});
      return res;
    }).catch(() => cached))
  );
});
