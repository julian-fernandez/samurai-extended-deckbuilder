const CACHE_VERSION = "v5";
const STATIC_CACHE = `l5r-static-${CACHE_VERSION}`;
const DATA_CACHE = `l5r-data-${CACHE_VERSION}`;

// Only pre-cache files that are guaranteed to exist at this exact path.
// Vite JS/CSS bundles use content hashes and must NOT be listed here —
// their paths change with every build.
const PRECACHE_FILES = ["/", "/index.html", "/manifest.json"];

// ── Install ────────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ───────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== DATA_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ──────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // ── Cards JSON: stale-while-revalidate ──────────────────────────────────────
  if (url.pathname === "/cards_v3.json") {
    event.respondWith(
      caches.open(DATA_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request).then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          });
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // ── Vite hashed assets: cache-first (immutable once fetched) ────────────────
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((res) => {
              if (res.ok) cache.put(request, res.clone());
              return res;
            })
        )
      )
    );
    return;
  }

  // ── Card images: network-first, cache on success ────────────────────────────
  if (url.pathname.startsWith("/images/")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            caches
              .open(STATIC_CACHE)
              .then((cache) => cache.put(request, res.clone()).catch(() => {}));
          }
          return res;
        })
        .catch(() =>
          caches
            .open(STATIC_CACHE)
            .then((cache) => cache.match(request))
            .then((cached) => cached || Response.error())
        )
    );
    return;
  }

  // ── Navigation requests (HTML pages): network-first, SPA fallback ──────────
  // IMPORTANT: only return index.html for navigation (document) requests,
  // never for JS/CSS/font/image assets — that causes the MIME-type error.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            caches
              .open(STATIC_CACHE)
              .then((cache) => cache.put(request, res.clone()));
          }
          return res;
        })
        .catch(() =>
          caches
            .open(STATIC_CACHE)
            .then((cache) => cache.match("/index.html"))
        )
    );
    return;
  }

  // ── Everything else: network-only ──────────────────────────────────────────
  // (Supabase API calls, external resources, etc.)
});
