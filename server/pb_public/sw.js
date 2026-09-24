// Farm Log service worker: keeps the app itself on the phone so it opens without signal.
// Farm data is handled separately (cached by js/adapter.js; server calls under /api/ always go to the network).
// Bump VERSION when releasing so phones pick up the new files.
const VERSION = "farmlog-2026-09-24b";
const SHELL = [
  "/", "/index.html", "/css/app.css", "/js/adapter.js", "/js/app.js",
  "/vendor/pocketbase.umd.js", "/manifest.webmanifest",
  "/icons/icon-192.png", "/icons/apple-touch-icon.png", "/icons/favicon-32.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/_/")) return;

  // Try the Mac mini first so updates show up right away; use the saved copy when there's no signal.
  e.respondWith(fetch(e.request).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request.mode === "navigate" ? "/" : e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request.mode === "navigate" ? "/" : e.request)));
});
