// Minimaler Service Worker - Zweck: die Seite als installierbare PWA qualifizieren.
// Chrome verlangt einen registrierten Service Worker mit Fetch-Handler, bevor
// beforeinstallprompt überhaupt ausgelöst wird ("Zum Startbildschirm hinzufügen").
//
// v2: CACHE_NAME hochgezählt (v1 -> v2), damit alte, hartnäckig gecachte Versionen
// (z.B. auf iPhones, die die Seite vorher zum Home-Bildschirm hinzugefügt hatten)
// beim nächsten Aufruf zuverlässig gelöscht und durch die aktuelle Version ersetzt
// werden. Zusätzlich holt fetch() jetzt explizit mit {cache: "no-store"} - vorher
// konnte der interne HTTP-Cache des Browsers eine veraltete Antwort liefern, obwohl
// die Fetch-Strategie eigentlich "network-first" sein sollte.
const CACHE_NAME = "gamingpig-portfolio-v2";
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
// NEW: {cache: "no-store"} zwingt den Browser, wirklich über das Netzwerk zu gehen,
// statt eine evtl. gecachte HTTP-Antwort zu verwenden.
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    event.respondWith(
        fetch(event.request, { cache: "no-store" })
            .then((response) => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
