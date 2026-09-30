// Rough Cut Dezigns Orders service worker: keeps the app itself on the phone so it opens without signal.
// Order data is handled separately (cached by js/adapter.js; server calls under /api/ always go to the network).
// Bump VERSION when releasing so phones pick up the new files.
const VERSION = "shop-2026-09-30a";
// Addresses are relative to where the app is served: the root of its own port, or …/shop/.
const BASE = new URL("./", self.location.href).pathname;
const SHELL = [
  "./", "index.html", "css/app.css", "css/shop.css", "js/adapter.js", "js/app.js",
  "vendor/pocketbase.umd.js", "manifest.webmanifest",
  "fonts/kaushan-script-400.woff2", "fonts/josefin-sans-300.woff2", "fonts/josefin-sans-400.woff2",
  "icons/icon-192.png", "icons/apple-touch-icon.png", "icons/favicon-32.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("shop-") && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  const path = url.pathname.startsWith(BASE) ? url.pathname.slice(BASE.length) : null;
  if (e.request.method !== "GET" || url.origin !== location.origin || path === null || path.startsWith("api/") || path.startsWith("_/")) return;

  // Try the Mac mini first so updates show up right away; use the saved copy when there's no signal.
  const key = e.request.mode === "navigate" ? BASE : e.request;
  e.respondWith(fetch(e.request).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(key, copy)); }
    return res;
  }).catch(() => caches.match(key)));
});
