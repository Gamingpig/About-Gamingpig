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
            this.translations = {
                de: {
                    socials_section_title: "Socials & Kanäle",
                    social_tictactoe_title: "Tic-Tac-Toe",
                    cta_tictactoe: "Lass uns ne Runde zocken!",
                    social_gamingpig_tiktok_title: "Gamingpig‘s TikTok",
                    cta_gamingpig_tiktok: "Hier geht's zu meinem Kanal",
                    social_team_title: "Team Gamingpig",
                    social_team_badge: "Offiziell",
                    social_team_sub: "© 2026 Team Gamingpig • Alle Rechte vorbehalten",
                    cta_team_gamingpig_tiktok: "Zum offiziellen Team-Account",
                    social_noel_title: "Noel (MTB Noel)",
                    social_noel_badge: "Co-Owner, Partner & Support",
                    social_noel_sub: "Co-Owner, Partner & Support",
                    cta_noel_tiktok: "Hier geht's zu Noel's Kanal",
                    social_tom_title: "Tom's TikTok",
                    social_tom_badge: "Manager & Co-Owner",
                    social_tom_sub: "Manager, Co-Owner, bester Freund & Bruder",
                    cta_tom: "Hier geht's zu Tom's Kanal",
                    social_jakob_title: "Jakob's TikTok",
                    social_jakob_sub: "© 2026 • Team- & Community-Mitglied",
                    cta_jakob: "Hier geht's zu Jakob's Kanal",
                    social_lukas_title: "Lukas' TikTok",
                    social_lukas_sub: "© 2026 • Team- & Community-Mitglied",
                    cta_lukas: "Hier geht's zu Lukas' Kanal",
                    social_youtube_title: "YouTube",
                    social_youtube_sub: "© 2026 Gamingpig • Offizieller YouTube-Kanal",
                    cta_gamingpig_youtube: "Hier geht's zu meinem Kanal",
                    social_github_title: "GitHub",
                    social_github_sub: "© 2026 Gamingpig • Open-Source Repositories",
                    cta_gamingpig_github: "Hier geht's zu meinem Profil",
                    footer_privacy: "Datenschutz",
                    footer_status: "Live-Status",
                    footer_impressum: "Impressum",
                    footer_release_notes: "Release Notes",
                    footer_roadmap: "Roadmap",
                    footer_admin: "Admin",
                    footer_menu_title: "Navigation & Rechtliches",
                    footer_more: "Mehr",
                    onboard_title: 'Wähle deine Sprache',
                    onboard_subtitle: 'Du kannst das jederzeit später wieder ändern',
                    tutorial_next: 'Weiter', tutorial_back: 'Zurück', tutorial_finish: 'Fertig', tutorial_skip: 'Überspringen',
                    onboarding_step_2_5: 'Schritt 2 von 5',
                    onboarding_intro_done: 'Einführung abgeschlossen',
                    onboarding_exploration_done: 'Erkundung abgeschlossen',
                    onboarding_exploration_desc: 'Du hast alle Stationen des Portfolios erfolgreich kennengelernt.',
                    onboarding_to_whatsnew: 'Weiter zu Neuerungen ➔',
                    onboarding_maybe_later: 'Vielleicht später',
                    onboarding_step_5_5: 'Schritt 5 von 5',
                    onboarding_ready: 'Bereit',
                    onboarding_all_set: 'Alles eingerichtet',
                    onboarding_all_set_desc: 'Deine Konfiguration wurde dauerhaft gespeichert. Viel Spaß beim Erkunden!',
                    onboarding_start_countdown: (s) => `Starten (${s}s) ➔`,
                    onboarding_start_btn: 'Starten ➔',
                    quest_title: 'Gamingpig Quest',
                    quest_skip: 'Überspringen',
                    quest_completed: 'Erledigt ✓',
                    quest_open: 'Offen',
                    quest_dismissed_toast: 'Quest beendet ✓',
                    quest_card_task: '1. Real-Talk Karte antippen',
                    quest_settings_task: '2. Einstellungen öffnen',
                    quest_search_task: '3. Hyper-Suche (⌘K / Suchen)',
                    quest_music_task: '4. StandBy / Ambient starten',
                    settings_title: 'Website-Einstellungen',
                    settings_animations_feedback: 'Animationen & Feedback',
                    settings_animation_style: 'Animationsstil',
                    settings_sound: 'UI-Sounds',
                    settings_haptic: 'Haptik',
                    on_label: 'AN',
                    off_label: 'AUS'
                },
                en: {
                    socials_section_title: "Socials & Channels",
                    social_tictactoe_title: "Tic-Tac-Toe",
                    cta_tictactoe: "Let's play a round!",
                    social_gamingpig_tiktok_title: "Gamingpig's TikTok",
                    cta_gamingpig_tiktok: "Check out my channel here",
                    social_team_title: "Team Gamingpig",
                    social_team_badge: "Official",
                    social_team_sub: "© 2026 Team Gamingpig • All Rights Reserved",
                    cta_team_gamingpig_tiktok: "Go to official team account",
                    social_noel_title: "Noel (MTB Noel)",
                    social_noel_badge: "Co-Owner, Partner & Support",
                    social_noel_sub: "Co-Owner, Partner & Support",
                    cta_noel_tiktok: "Check out Noel's channel here",
                    social_tom_title: "Tom's TikTok",
                    social_tom_badge: "Manager & Co-Owner",
                    social_tom_sub: "Manager, Co-Owner, Best Friend & Brother",
                    cta_tom: "Check out Tom's channel here",
                    social_jakob_title: "Jakob's TikTok",
                    social_jakob_sub: "© 2026 • Team & Community Member",
                    cta_jakob: "Check out Jakob's channel here",
                    social_lukas_title: "Lukas' TikTok",
                    social_lukas_sub: "© 2026 • Team & Community Member",
                    cta_lukas: "Check out Lukas' channel here",
                    social_youtube_title: "YouTube",
                    social_youtube_sub: "© 2026 Gamingpig • Official YouTube Channel",
                    cta_gamingpig_youtube: "Check out my channel here",
                    social_github_title: "GitHub",
                    social_github_sub: "© 2026 Gamingpig • Open-Source Repositories",
                    cta_gamingpig_github: "Check out my profile here",
                    footer_privacy: "Privacy",
                    footer_status: "Live Status",
                    footer_impressum: "Legal Notice",
                    footer_release_notes: "Release Notes",
                    footer_roadmap: "Roadmap",
                    footer_admin: "Admin",
                    footer_menu_title: "Navigation & Legal",
                    footer_more: "More",
                    onboard_title: 'Choose your language',
                    onboard_subtitle: 'You can change this anytime later',
                    tutorial_next: 'Next', tutorial_back: 'Back', tutorial_finish: 'Finish', tutorial_skip: 'Skip',
                    onboarding_step_2_5: 'Step 2 of 5',
                    onboarding_intro_done: 'Tour completed',
                    onboarding_exploration_done: 'Exploration completed',
                    onboarding_exploration_desc: 'You have successfully explored all highlights of the portfolio.',
                    onboarding_to_whatsnew: 'Continue to What\'s New ➔',
                    onboarding_maybe_later: 'Maybe later',
                    onboarding_step_5_5: 'Step 5 of 5',
                    onboarding_ready: 'Ready',
                    onboarding_all_set: 'All Set',
                    onboarding_all_set_desc: 'Your settings have been permanently saved. Enjoy exploring!',
                    onboarding_start_countdown: (s) => `Launch (${s}s) ➔`,
                    onboarding_start_btn: 'Launch ➔',
                    quest_title: 'Gamingpig Quest',
                    quest_skip: 'Skip',
                    quest_completed: 'Done ✓',
                    quest_open: 'Open',
                    quest_dismissed_toast: 'Quest completed ✓',
                    quest_card_task: '1. Tap a Real-Talk card',
                    quest_settings_task: '2. Open settings',
                    quest_search_task: '3. Hyper-Search (⌘K / Search)',
                    quest_music_task: '4. Launch StandBy / Ambient',
                    settings_title: 'Website Settings',
                    settings_animations_feedback: 'Animations & Feedback',
                    settings_animation_style: 'Animation Style',
                    settings_sound: 'UI Sounds',
                    settings_haptic: 'Haptics',
                    on_label: 'ON',
                    off_label: 'OFF'
                }
            };
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
            if (!dict) return;
            for (const lang in dict) {
                this.translations[lang] = Object.assign({}, this.translations[lang] || {}, dict[lang]);
            }
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
