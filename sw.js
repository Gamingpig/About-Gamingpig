// Minimaler Service Worker - Zweck: die Seite als installierbare PWA qualifizieren.
// Chrome verlangt einen registrierten Service Worker mit Fetch-Handler, bevor
// beforeinstallprompt überhaupt ausgelöst wird ("Zum Startbildschirm hinzufügen").
const CACHE_NAME = "gamingpig-portfolio-v1";
const PRECACHE_URLS = ["./", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Network-first mit Cache-Fallback, damit die Seite auch offline zumindest lädt.
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
