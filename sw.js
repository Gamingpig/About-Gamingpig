// ==============================================================================
// Gamingpig Portfolio PWA Service Worker (v24.153.0)
// Robust Update- & Cache-Strategie:
// - HTML / Navigation: ECHTES Network-First mit Offline-Fallback
// - Statische Assets (Bilder, Icons, Manifest): Stale-While-Revalidate mit Cache-Fallback
// - Live APIs & Externe Dienste: Network-Only (niemals veraltete Musikdaten)
// - Sofortige Übernahme: self.skipWaiting() & clients.claim()
// ==============================================================================

const SW_VERSION = "24.153.0";
const CURRENT_CACHE_VERSION = `gamingpig-cache-v${SW_VERSION}`;
const CACHE_NAME = CURRENT_CACHE_VERSION;

// Wichtige Offline-Kerndateien
const PRECACHE_URLS = [
    "./",
    "./index.html",
    "./status.html",
    "./push-admin.html",
    "./release.html",
    "./release-v24-115.html",
    "./privacy.html",
    "./impressum.html",
    "./js/read-aloud-service.js",
    "./js/i18n-manager.js",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png",
    "./og-v2.jpg"
];

// Sofortige Installation ohne Warten
self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CURRENT_CACHE_VERSION).then((cache) => {
            return cache.addAll(PRECACHE_URLS);
        }).catch((err) => {
            console.warn("[SW] Precaching Fehler (nicht kritisch):", err);
        })
    );
});

// Aktivierung: Ausnahmslos alle Caches löschen, die nicht mit CURRENT_CACHE_VERSION übereinstimmen
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CURRENT_CACHE_VERSION) {
                        console.log("[SW] Lösche veralteten Cache:", key);
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


// Benachrichtigungs-Klick-Handler (öffnet oder fokussiert die Status-Seite / Ziel-URL)
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const rawUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : "./status.html";
    let targetUrl;
    try {
        targetUrl = new URL(rawUrl, self.location.origin).href;
    } catch(e) {
        targetUrl = new URL("./status.html", self.location.origin).href;
    }

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url === targetUrl || (targetUrl.includes("status.html") && client.url.includes("status.html"))) {
                    if ("focus" in client) return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        }).catch((err) => {
            console.error("[SW] notificationclick error:", err);
        })
    );
});

// Helper: Liest die in der App gespeicherte Nutzersprache aus IndexedDB (mit Timeout)
function getStoredAppLanguage() {
    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), 300);
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
                        clearTimeout(timer);
                        resolve(null);
                        return;
                    }
                    const tx = db.transaction('settings', 'readonly');
                    const store = tx.objectStore('settings');
                    const getReq = store.get('app_lang');
                    getReq.onsuccess = () => {
                        clearTimeout(timer);
                        resolve(getReq.result || null);
                    };
                    getReq.onerror = () => {
                        clearTimeout(timer);
                        resolve(null);
                    };
                } catch(err) {
                    clearTimeout(timer);
                    resolve(null);
                }
            };
            req.onerror = () => {
                clearTimeout(timer);
                resolve(null);
            };
        } catch (e) {
            clearTimeout(timer);
            resolve(null);
        }
    });
}

// Web Push Event Handler für Android / iOS / Desktop
// Robust: Garantiert, dass self.registration.showNotification immer aufgerufen wird und niemals rejected
self.addEventListener("push", (event) => {
    let payload = {
        title: "Gamingpig Update",
        body: "Neue Inhalte verfügbar!",
        url: "./status.html",
        icon: "icon-192.png",
        badge: "icon-192.png"
    };

    if (event.data) {
        try {
            const parsed = event.data.json();
            if (parsed && typeof parsed === "object") {
                payload = Object.assign(payload, parsed);
            }
        } catch (e) {
            try {
                const text = event.data.text();
                if (text) payload.body = text;
            } catch (err) {}
        }
    }

    // Sprach-Unterstützung falls im Payload hinterlegt
    let title = payload.title || "Gamingpig Update";
    let body = payload.body || "Neue Inhalte verfügbar!";
    if (payload.translations && typeof payload.translations === "object") {
        const lang = (navigator.language || "de").slice(0, 2).toLowerCase();
        if (payload.translations[lang]) {
            title = payload.translations[lang].title || title;
            body = payload.translations[lang].body || body;
        } else if (payload.translations.de) {
            title = payload.translations.de.title || title;
            body = payload.translations.de.body || body;
        } else if (payload.translations.en) {
            title = payload.translations.en.title || title;
            body = payload.translations.en.body || body;
        }
    }

    const iconUrl = payload.icon || "icon-192.png";
    const badgeUrl = payload.badge || "icon-192.png";

    event.waitUntil(
        self.registration.showNotification(title, {
            body: body,
            icon: iconUrl,
            badge: badgeUrl,
            data: { url: payload.url || "./status.html" }
        }).catch((err) => {
            console.error("[SW] showNotification error:", err);
        })
    );
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
                    if (networkResponse && networkResponse.ok) {
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
