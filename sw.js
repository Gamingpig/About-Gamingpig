// Maintenance-mode Service Worker: forces immediate cache refresh for PWA & installed app users
const SW_VERSION = "24.245.104-maint";
const CACHE_NAME = `gamingpig-maint-${SW_VERSION}`;

self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request, { cache: "no-store" }).catch(() => caches.match("./index.html"))
        );
    }
});
