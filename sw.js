const CACHE_NAME = "next-bite-v2";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./apple-touch-icon-bite.png"
];

// Cache only the core NEXT // BITE app files.
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_FILES);
    })
  );

  self.skipWaiting();
});

// Delete older NEXT // BITE caches.
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

self.addEventListener("fetch", event => {
  const request = event.request;

  // Never interfere with POST/etc.
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // IMPORTANT:
  // Do not cache Cloudflare/API/database requests.
  // Let the browser handle all outside requests normally.
  if (url.origin !== self.location.origin) {
    return;
  }

  // NEXT // BITE files use network-first.
  event.respondWith(
    fetch(request)
      .then(response => {
        // Only cache successful same-origin responses.
        if (response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy);
          });
        }

        return response;
      })
      .catch(async () => {
        const cached =
          await caches.match(request);

        if (cached) {
          return cached;
        }

        // If navigation fails while offline,
        // open the cached app shell.
        if (request.mode === "navigate") {
          return caches.match("./index.html");
        }

        return Response.error();
      })
  );
});
