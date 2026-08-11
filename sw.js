// Minimaler Service Worker - Zweck: die Seite als installierbare PWA qualifizieren.
// Chrome verlangt einen registrierten Service Worker mit Fetch-Handler, bevor
// beforeinstallprompt überhaupt ausgelöst wird ("Zum Startbildschirm hinzufügen").
//
// v4: CACHE_NAME erneut hochgezählt, damit hartnäckig gecachte alte
// Versionen beim nächsten Aufruf zuverlässig gelöscht und durch die aktuelle Version
// ersetzt werden. Diesen Wert bei jedem größeren Update mit erhöhen - das ist der
// zuverlässigste Weg, um sicherzustellen, dass alle Geräte (v.a. iPhone mit "Zum
// Home-Bildschirm hinzugefügt") wirklich die neueste Version bekommen.
const CACHE_NAME = "gamingpig-portfolio-v36";
const PRECACHE_URLS = ["./", "./privacy.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./og-v2.jpg"];
const CACHEABLE_DESTINATIONS = new Set(["document", "style", "script", "image", "manifest"]);

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
// {cache: "no-store"} zwingt den Browser, wirklich über das Netzwerk zu gehen,
// statt eine evtl. gecachte HTTP-Antwort zu verwenden.
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.location.origin) return;
    if (!CACHEABLE_DESTINATIONS.has(event.request.destination)) return;

    event.respondWith(
        fetch(event.request, { cache: "no-store" })
            .then((response) => {
                if (response.ok && response.type === "basic") {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
                }
                return response;
            })
            .catch(() => caches.match(event.request).then((cached) =>
                cached || (event.request.mode === "navigate" ? caches.match("./") : undefined)
            ))
    );
});
