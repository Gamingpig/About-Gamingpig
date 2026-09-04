// ==============================================================================
// Gamingpig Portfolio PWA Service Worker (v24.139.0)
// Robust Update- & Cache-Strategie:
// - HTML / Navigation: ECHTES Network-First mit Offline-Fallback
// - Statische Assets (Bilder, Icons, Manifest): Stale-While-Revalidate mit Cache-Fallback
// - Live APIs & Externe Dienste: Network-Only (niemals veraltete Musikdaten)
// - Sofortige Übernahme: self.skipWaiting() & clients.claim()
// ==============================================================================

const SW_VERSION = "24.139.0";
const CACHE_NAME = `gamingpig-cache-v${SW_VERSION}`;
const CACHE_PREFIX = "gamingpig-cache-";

// Wichtige Offline-Kerndateien
const PRECACHE_URLS = [
    "./",
    "./index.html",
    "./status.html",
    "./push-admin.html",
    "./release.html",
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

// Helper: Liest die in der App gespeicherte Nutzersprache aus IndexedDB
function getStoredAppLanguage() {
    return new Promise((resolve) => {
        try {
            const req = indexedDB.open('gamingpig_pwa_db', 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings');
                }
            };
            req.onsuccess = (e) => {
                try {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains('settings')) {
                        resolve(null);
                        return;
                    }
                    const tx = db.transaction('settings', 'readonly');
                    const store = tx.objectStore('settings');
                    const getReq = store.get('app_lang');
                    getReq.onsuccess = () => resolve(getReq.result || null);
                    getReq.onerror = () => resolve(null);
                } catch(err) {
                    resolve(null);
                }
            };
            req.onerror = () => resolve(null);
        } catch (e) {
            resolve(null);
        }
    });
}

// In-Memory Push Deduplication Cache
const recentPushDedupeMap = new Map();

// Web Push Event Handler für Android / iOS / Web Push mit Multi-Language Erkennung & Anti-Doppel-Filter
self.addEventListener("push", (event) => {
    event.waitUntil((async () => {
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

        // 1. Hole vom Nutzer in der Web-App gewählte Sprache
        const storedLang = await getStoredAppLanguage();
        // 2. Fallback: targetLang vom Server oder Browser-Sprache
        const deviceLang = (navigator.language || "de").slice(0, 2).toLowerCase();
        const effectiveLang = (storedLang || data.targetLang || deviceLang || "de").slice(0, 2).toLowerCase();

        let title = data.title;
        let body = data.body;

        if (data.translations && typeof data.translations === 'object') {
            if (data.translations[effectiveLang]) {
                title = data.translations[effectiveLang].title || title;
                body = data.translations[effectiveLang].body || body;
            } else if (data.translations.de) {
                title = data.translations.de.title || title;
                body = data.translations.de.body || body;
            } else if (data.translations.en) {
                title = data.translations.en.title || title;
                body = data.translations.en.body || body;
            }
        }

        // 3. Intelligente Deduplizierung: Verhindert mehrfaches Aufpoppen innerhalb von 45 Sekunden
        const dedupeKey = data.broadcastId || (title + ':::' + body);
        const now = Date.now();
        if (recentPushDedupeMap.has(dedupeKey)) {
            const lastSeen = recentPushDedupeMap.get(dedupeKey);
            if (now - lastSeen < 45000) {
                console.log("[SW] Ignoriere doppelte Push-Nachricht:", dedupeKey);
                return;
            }
        }
        recentPushDedupeMap.set(dedupeKey, now);

        // Aufräumen alter Einträge
        for (const [k, time] of recentPushDedupeMap.entries()) {
            if (now - time > 120000) recentPushDedupeMap.delete(k);
        }

        const tag = data.broadcastId || ('gp-alert-' + Math.floor(now / 30000));
        const options = {
            body: body,
            icon: "icon-192.png",
            badge: "icon-192.png",
            tag: tag,
            renotify: false,
            timestamp: data.timestamp || now,
            data: { url: data.url || "./status.html" }
        };
        return self.registration.showNotification(title, options);
    })());
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
