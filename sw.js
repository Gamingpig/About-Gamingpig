// ==============================================================================
// Gamingpig Portfolio PWA Service Worker (v24.132)
// Robust Update- & Cache-Strategie:
// - HTML / Navigation: ECHTES Network-First mit Offline-Fallback
// - Statische Assets (Bilder, Icons, Manifest): Stale-While-Revalidate mit Cache-Fallback
// - Live APIs & Externe Dienste: Network-Only (niemals veraltete Musikdaten)
// - Sofortige Übernahme: self.skipWaiting() & clients.claim()
// ==============================================================================

const SW_VERSION = "24.133.4";
const CACHE_NAME = `gamingpig-cache-v${SW_VERSION}`;
const CACHE_PREFIX = "gamingpig-cache-";

// Wichtige Offline-Kerndateien
const PRECACHE_URLS = [
    "./",
    "./index.html",
    "./status.html",
    "./push-admin.html",
    "./release-v24-115.html",
    "./privacy.html",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png",
    "./og-v2.jpg"
];

// Sofortige Installation ohne Warten
self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS);
        }).catch((err) => {
            console.warn("[SW] Precaching Fehler (nicht kritisch):", err);
        })
    );
});

// Aktivierung: Alte Gamingpig-Caches gezielt löschen und Clients sofort binden
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    // Lösche alte Versionen dieses Portfolios, fremde Caches nicht anfassen
                    if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) {
                        console.log("[SW] Lösche veralteten Cache:", key);
                        return caches.delete(key);
                    }
                    if (key.startsWith("gamingpig-portfolio-")) {
                        console.log("[SW] Lösche alten Legacy-Cache:", key);
                        return caches.delete(key);
                    }
                    return Promise.resolve();
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Nachrichten-Listener (z. B. für manuelles skipWaiting)
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});


// Benachrichtigungs-Klick-Handler (öffnet oder fokussiert die Status-Seite)
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : "./status.html";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url.includes("status.html") && "focus" in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// Web Push Event Handler für Android / Web Push
self.addEventListener("push", (event) => {
    let data = {
        title: "⚠️ Gamingpig System-Status",
        body: "Status-Änderung bei Spotify, Lyrics oder Server-Verbindung festgestellt.",
        url: "./status.html"
    };
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }
    const options = {
        body: data.body,
        icon: "icon-192.png",
        badge: "icon-192.png",
        vibrate: [200, 100, 200, 100, 300],
        tag: "gamingpig-status-alert",
        data: { url: data.url || "./status.html" }
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
});

// Intelligenter Fetch-Handler
self.addEventListener("fetch", (event) => {
    // Nur GET-Anfragen behandeln
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);
    const isSameOrigin = (url.origin === self.location.origin);
    const isNavigation = (event.request.mode === "navigate" || event.request.destination === "document");

    // 1. Live APIs, Musik-Streams & externe Ressourcen (Spotify, stats.fm, Discord, Apple, etc.)
    // -> IMMER direkt aus dem Netzwerk, niemals aus altem statischen Cache
    if (!isSameOrigin || url.pathname.includes("/api/") || url.searchParams.has("api")) {
        return; // Direkt dem Browser-Netzwerk überlassen
    }

    // 2. HTML-Dokumente & Navigationen: ECHTES NETWORK-FIRST
    // Holt bei bestehender Verbindung IMMER die aktuelle HTML-Version vom Server
    if (isNavigation) {
        event.respondWith(
            fetch(event.request, { cache: "no-cache" })
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.ok && networkResponse.type === "basic") {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        }).catch(() => {});
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Offline-Fallback: Gecachte Version der angeforderten Seite oder Startseite
                    return caches.match(event.request).then((cachedResponse) => {
                        return cachedResponse || caches.match("./index.html") || caches.match("./");
                    });
                })
        );
        return;
    }

    // 3. Statische Assets (Bilder, Icons, Manifest): STALE-WHILE-REVALIDATE
    // Schnelles Laden aus Cache + Revalidierung im Hintergrund
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.ok && networkResponse.type === "basic") {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        }).catch(() => {});
                    }
                    return networkResponse;
                })
                .catch(() => {
                    return null;
                });

            return cachedResponse || fetchPromise;
        })
    );
});
