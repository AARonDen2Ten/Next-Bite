const CACHE_NAME = "next-bite-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./apple-touch-icon-bite.png"
];

// Install and cache the core app files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_FILES);
    })
  );

  self.skipWaiting();
});

// Remove old caches when we update versions later
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );

  self.clients.claim();
});

// Use the network when available.
// Fall back to the cached app when offline.
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, copy);
        });

        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          return cached || caches.match("./index.html");
        });
      })
  );
});
