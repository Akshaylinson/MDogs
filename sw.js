const CACHE = "meradogs-v4";
const SHELL = [
  "./index.html",
  "./category.html",
  "./favorites.html",
  "./settings.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/db.js",
  "./js/dashboard.js",
  "./js/categories.js",
  "./js/gallery.js",
  "./js/upload.js",
  "./js/viewer.js",
  "./js/slideshow.js",
  "./js/search.js",
  "./js/favorites.js",
  "./js/tags.js",
  "./js/settings.js",
  "./js/theme.js",
  "./js/notifications.js",
  "./js/helpers.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for shell assets, network-first for everything else
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // Always go network for CDN resources (Tailwind, Google Fonts)
  if (!url.origin.includes(self.location.hostname)) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached || fetch(e.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      })
    )
  );
});
