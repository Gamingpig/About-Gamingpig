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

self.addEventListener("activate", (event) => {<!DOCTYPE html>
<html lang="de" id="html-root">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title> Gamingpig | Portfolio</title>

    <!-- NEW: PWA / "Add to Home Screen" Support -->
    <meta name="theme-color" content="#020617">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Gamingpig">
    <!--
        manifest.json, sw.js, icon-192.png und icon-512.png müssen im selben Ordner
        wie diese HTML-Datei liegen (gleiches GitHub-Repo, gleiche Ebene) - siehe
        Anleitung. Nur echte, per HTTP(S) abrufbare Dateien machen die Seite in
        Chrome wirklich installierbar (data:/blob:-URIs werden dafür nicht zuverlässig
        erkannt - das war der Grund, warum "App installieren" vorher nirgends auftauchte).
    -->
    <link rel="manifest" href="manifest.json">
    <link rel="apple-touch-icon" href="icon-512.png">
    <link rel="icon" type="image/png" href="icon-512.png">

    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    screens: {
                        'xxs': '200px', /* Extremer Smartwatch Breakpoint */
                        'xs': '320px',  /* S4 Mini Breakpoint */
                    },
                    colors: {
                        techBlue: '#3b82f6',
                        techCyan: '#06b6d4',
                    }
                }
            }
        }
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@500;800&display=swap');
        
        :root {
            /* Apple iOS Spring & Ease Curves */
            --apple-spring: cubic-bezier(0.32, 0.72, 0, 1);
            --apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
            --apple-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
            
            /* Viskose Liquid-Curve für die deepen Morph-Animationen */
            --liquid-fluid: cubic-bezier(0.25, 1, 0.35, 1.2);
            
            /* Liquid Glass Dynamic Shadows */
            --gl-shadow-idle: 0 15px 35px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(255,255,255,0.1);
            --gl-shadow-idle-2: 0 18px 40px rgba(0,0,0,0.12), inset 0 1px 2px rgba(255,255,255,0.7), inset 0 -1px 2px rgba(255,255,255,0.15);
            --gl-shadow-idle-3: 0 12px 30px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.5), inset 0 -1px 1px rgba(255,255,255,0.05);
        }

        html.dark {
            --gl-shadow-idle: 0 15px 35px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -1px 1px rgba(255,255,255,0.05);
            --gl-shadow-idle-2: 0 18px 40px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.25), inset 0 -1px 2px rgba(255,255,255,0.08);
            --gl-shadow-idle-3: 0 12px 30px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -1px 1px rgba(255,255,255,0.03);

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
