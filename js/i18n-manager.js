/**
 * Global I18nManager (Singleton)
 * Single source of truth for language selection, persistence, dictionary lookups,
 * and cross-view synchronization.
 */
(function(window) {
    'use strict';

    class I18nManagerSingleton {
        constructor() {
            this.SUPPORTED_LANGUAGES = [
                { code: 'de', flag: '🇩🇪', name: 'Deutsch', bcp47: 'de-DE' },
                { code: 'en', flag: '🇬🇧', name: 'English', bcp47: 'en-US' },
                { code: 'es', flag: '🇪🇸', name: 'Español', bcp47: 'es-ES' },
                { code: 'fr', flag: '🇫🇷', name: 'Français', bcp47: 'fr-FR' },
                { code: 'pt', flag: '🇧🇷', name: 'Português', bcp47: 'pt-BR' },
                { code: 'tr', flag: '🇹🇷', name: 'Türkçe', bcp47: 'tr-TR' }
            ];

            this.BCP47_MAP = {
                de: 'de-DE',
                en: 'en-US',
                es: 'es-ES',
                fr: 'fr-FR',
                pt: 'pt-BR',
                tr: 'tr-TR'
            };

            this.currentLang = 'de';
            this.translations = {};
            this.subscribers = new Set();

            this.resolveInitialLanguage();
        }

        resolveInitialLanguage() {
            let lang = null;
            try {
                const saved = localStorage.getItem('app_language') || localStorage.getItem('selectedLanguage');
                if (saved && this.isSupported(saved)) {
                    lang = saved;
                }
            } catch (e) {}

            if (!lang && typeof navigator !== 'undefined' && navigator.language) {
                const browserCode = navigator.language.slice(0, 2).toLowerCase();
                if (this.isSupported(browserCode)) {
                    lang = browserCode;
                }
            }

            this.currentLang = lang || 'de';
            return this.currentLang;
        }

        isSupported(code) {
            return this.SUPPORTED_LANGUAGES.some(l => l.code === code);
        }

        getLanguage() {
            return this.currentLang || 'de';
        }

        getBcp47(code) {
            const lang = code || this.currentLang || 'de';
            return this.BCP47_MAP[lang] || 'de-DE';
        }

        setTranslations(dict) {
            this.translations = dict || {};
        }

        t(key, ...args) {
            const langDict = this.translations[this.currentLang] || this.translations.de || {};
            const fallbackDict = this.translations.de || {};
            const val = langDict[key] !== undefined ? langDict[key] : fallbackDict[key];
            if (typeof val === 'function') return val(...args);
            return val !== undefined ? val : key;
        }

        setLanguage(langCode, options = { syncStorage: true, dispatch: true }) {
            const code = this.isSupported(langCode) ? langCode : 'de';
            this.currentLang = code;

            if (options.syncStorage !== false) {
                try {
                    localStorage.setItem('app_language', code);
                    localStorage.setItem('selectedLanguage', code);
                } catch (e) {}
                this.syncIndexedDB(code);
            }

            if (typeof document !== 'undefined' && document.documentElement) {
                document.documentElement.setAttribute('lang', code);
            }

            if (options.dispatch !== false && typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('app:languageChanged', {
                    detail: { lang: code, bcp47: this.getBcp47(code) }
                }));
            }

            this.subscribers.forEach(cb => {
                try { cb(code, this.getBcp47(code)); } catch (e) { console.error(e); }
            });

            return code;
        }

        subscribe(callback) {
            if (typeof callback === 'function') {
                this.subscribers.add(callback);
                return () => this.subscribers.delete(callback);
            }
            return () => {};
        }

        syncIndexedDB(lang) {
            if (typeof indexedDB === 'undefined') return;
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
                        const tx = db.transaction('settings', 'readwrite');
                        tx.objectStore('settings').put(lang, 'app_lang');
                    } catch (err) {}
                };
            } catch (e) {}
        }
    }

    window.I18nManager = new I18nManagerSingleton();
})(typeof window !== 'undefined' ? window : globalThis);
