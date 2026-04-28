const CACHE_NAME = "l5r-cards-v3";
const STATIC_CACHE_NAME = "l5r-static-v3";
const DATA_CACHE_NAME = "l5r-data-v3";

// Files to cache for offline use
const STATIC_FILES = [
  "/",
  "/index.html",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
];

// API/data endpoints to cache
const DATA_FILES = ["/cards_v2.json"];

// Install event - cache static files
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    // First, clear all existing caches
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log("Service Worker: Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        // Then cache new files
        return Promise.all([
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            console.log("Service Worker: Caching static files");
            return cache.addAll(STATIC_FILES);
          }),
          caches.open(DATA_CACHE_NAME).then((cache) => {
            console.log("Service Worker: Caching data files");
            return cache.addAll(DATA_FILES);
          }),
        ]);
      })
  );

  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE_NAME &&
            cacheName !== DATA_CACHE_NAME
          ) {
            console.log("Service Worker: Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Handle different types of requests
  if (url.pathname === "/cards.json") {
    // For JSON data, try cache first, then network
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log("Service Worker: Serving JSON from cache");
            return cachedResponse;
          }

          return fetch(request)
            .then((networkResponse) => {
              // Cache the fresh response
              cache.put(request, networkResponse.clone());
              console.log("Service Worker: Cached fresh JSON data");
              return networkResponse;
            })
            .catch(() => {
              // If network fails and no cache, return a basic response
              console.log("Service Worker: Network failed, no cache available");
              return new Response("[]", {
                headers: { "Content-Type": "application/json" },
              });
            });
        });
      })
    );
  } else if (
    url.pathname.startsWith("/static/") ||
    url.pathname === "/" ||
    url.pathname === "/index.html"
  ) {
    // For static files, try cache first, then network
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log("Service Worker: Serving static file from cache");
            return cachedResponse;
          }

          return fetch(request).then((networkResponse) => {
            // Cache the fresh response
            cache.put(request, networkResponse.clone());
            console.log("Service Worker: Cached fresh static file");
            return networkResponse;
          });
        });
      })
    );
  } else {
    // For other requests, try network first, then cache
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Only cache same-origin, successful responses (cross-origin responses
          // from R2 are opaque and cannot be put into the Cache API)
          const isSameOrigin = new URL(request.url).origin === self.location.origin;
          if (networkResponse.status === 200 && isSameOrigin) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone).catch(() => {});
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log(
                "Service Worker: Serving from cache after network failure"
              );
              return cachedResponse;
            }

            // If no cache available, return a basic offline page
            if (request.destination === "document") {
              return caches.match("/index.html");
            }
          });
        })
    );
  }
});

// Background sync for when connection is restored
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    console.log("Service Worker: Background sync triggered");
    event.waitUntil(
      // Refresh data when connection is restored
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch("/cards.json")
          .then((response) => {
            if (response.ok) {
              cache.put("/cards.json", response.clone());
              console.log("Service Worker: Data refreshed in background");
            }
          })
          .catch((error) => {
            console.log("Service Worker: Background sync failed:", error);
          });
      })
    );
  }
});

// Push notifications (for future use)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
      },
      actions: [
        {
          action: "explore",
          title: "Open App",
          icon: "/icons/icon-192x192.png",
        },
        {
          action: "close",
          title: "Close",
          icon: "/icons/icon-192x192.png",
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"));
  }
});
