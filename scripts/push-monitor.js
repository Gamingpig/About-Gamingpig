/**
 * Gamingpig Portfolio - Automated Web Push & Health Monitoring Script
 * Runs in GitHub Actions to check services and send Web Push notifications
 * to Android, iOS (PWA), and Desktop browsers even when the app is closed.
 */

const fs = require('fs');
const path = require('path');
const webPush = require('web-push');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BItv0vIf2FPn11TcGv_5Nyp1YHE4c6e7lYHWRONDnGL-ca7EPMbD_DlzkMlB_InZEVJEFASPhkMwOLnPRRxfX-w';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'cS5HGxWt9nsqWNAs_7ljuydLqf8D9uqkYh1WRkM3X8Q';
const VAPID_SUBJECT = 'mailto:support@gamingpig.de';

webPush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

const SUBSCRIBERS_FILE = path.join(__dirname, '..', 'data', 'subscribers.json');

function loadSubscribers() {
    try {
        if (!fs.existsSync(SUBSCRIBERS_FILE)) return [];
        const content = fs.readFileSync(SUBSCRIBERS_FILE, 'utf8');
        return JSON.parse(content || '[]');
    } catch (e) {
        console.error('Failed to load subscribers:', e.message);
        return [];
    }
}

function saveSubscribers(subscribers) {
    try {
        fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf8');
    } catch (e) {
        console.error('Failed to save subscribers:', e.message);
    }
}

async function sendPushToAll(payload) {
    let subscribers = loadSubscribers();
    if (subscribers.length === 0) {
        console.log('No registered push subscribers found in data/subscribers.json.');
        return;
    }

    console.log(`Sending Web Push to ${subscribers.length} subscriber(s)...`);
    const expiredEndpoints = new Set();

    const payloadString = JSON.stringify({
        title: payload.title || '⚠️ Gamingpig System-Status',
        body: payload.body || 'Status-Änderung festgestellt.',
        url: payload.url || 'https://gamingpig.github.io/About-Gamingpig/status.html',
        timestamp: Date.now()
    });

    const sendPromises = subscribers.map(async (sub) => {
        try {
            await webPush.sendNotification(sub, payloadString, {
                TTL: 86400, // 24h
                urgency: 'high'
            });
            console.log(`✅ Push delivered successfully to ${sub.endpoint.substring(0, 45)}...`);
        } catch (err) {
            console.warn(`❌ Push failed for ${sub.endpoint.substring(0, 45)}... [${err.statusCode || err.message}]`);
            // If subscription is expired/unregistered (HTTP 404 or 410 Gone)
            if (err.statusCode === 404 || err.statusCode === 410) {
                expiredEndpoints.add(sub.endpoint);
            }
        }
    });

    await Promise.all(sendPromises);

    if (expiredEndpoints.size > 0) {
        subscribers = subscribers.filter(s => !expiredEndpoints.has(s.endpoint));
        saveSubscribers(subscribers);
        console.log(`Pruned ${expiredEndpoints.size} expired subscription(s).`);
    }
}

const STATE_FILE = path.join(__dirname, '..', 'data', 'status_state.json');

function loadState() {
    try {
        if (!fs.existsSync(STATE_FILE)) return { lastFailures: [], lastChecked: 0 };
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8') || '{}');
    } catch (e) {
        return { lastFailures: [], lastChecked: 0 };
    }
}

function saveState(state) {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
    } catch (e) {
        console.error('Failed to save state:', e.message);
    }
}

async function checkEndpoints() {
    const endpoints = [
        { name: 'stats.fm API', url: 'https://api.stats.fm/api/v1/users/gamingpig/streams/current', okStatuses: [200, 204, 404] },
        { name: 'Spotify / NPC API', url: 'https://npc-api.aikins.xyz/v1/users/gamingpig/now', okStatuses: [200, 204] },
        { name: 'LrcLib Lyrics', url: 'https://lrclib.net/api/get?track_name=test&artist_name=test', okStatuses: [200, 404] },
        { name: 'Discord API', url: 'https://discord.com/api/v10/invites/E8BS9BDAst?with_counts=true', okStatuses: [200] },
        { name: 'Apple CDN', url: 'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/00/00/00/000000.jpg/100x100bb.jpg', okStatuses: [200, 404] }
    ];

    const failed = [];
    let statsData = null;
    let npcData = null;

    for (const ep of endpoints) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(ep.url, { method: 'GET', signal: controller.signal });
            clearTimeout(timeout);

            if (ep.name === 'stats.fm API' && res.ok) {
                try { statsData = await res.json(); } catch (e) {}
            }
            if (ep.name === 'Spotify / NPC API' && res.status === 200) {
                try { npcData = await res.json(); } catch (e) {}
            }

            if (!ep.okStatuses.includes(res.status)) {
                failed.push(`${ep.name} (HTTP ${res.status})`);
            }
        } catch (e) {
            failed.push(`${ep.name} (${e.name === 'AbortError' ? 'Timeout' : 'Offline'})`);
        }
    }

    // Raspberry Pi Live Feed Discrepancy Check:
    // If Spotify is actively streaming on Gamingpig's account, but NPC-API has no data (HTTP 204 / empty),
    // then the Raspberry Pi is offline or its daemon stopped sending data!
    const isSpotifyPlaying = !!(statsData && statsData.item && statsData.item.isPlaying);
    const activeDevice = (statsData && statsData.item && statsData.item.deviceName) ? statsData.item.deviceName : 'Spotify';
    const trackName = (statsData && statsData.item && statsData.item.track) ? statsData.item.track.name : '';

    if (isSpotifyPlaying && !npcData) {
        failed.push(`Raspberry Pi Offline (Musik '${trackName}' läuft auf ${activeDevice}, aber Pi sendet keine NPC-Daten)`);
    }

    return failed;
}

async function main() {
    const mode = process.argv[2] || 'check';

    if (mode === 'send') {
        const title = process.argv[3] || '📲 GitHub Test-Alarm';
        const body = process.argv[4] || 'Echter Web-Push über GitHub Actions erfolgreich empfangen!';
        console.log(`Triggering manual push: "${title}" - "${body}"`);
        await sendPushToAll({ title, body });
        return;
    }

    if (mode === 'register') {
        // Register a new subscription payload passed via argument or env
        const raw = process.argv[3] || process.env.NEW_SUBSCRIPTION;
        if (!raw) {
            console.error('No subscription JSON provided.');
            process.exit(1);
        }
        try {
            let parsed = JSON.parse(raw);
            let newSub = parsed.subscription || parsed;
            if (typeof newSub === 'string') newSub = JSON.parse(newSub);
            if (!newSub.endpoint || !newSub.keys) {
                throw new Error('Invalid subscription format.');
            }
            const subscribers = loadSubscribers();
            const existingIdx = subscribers.findIndex(s => s.endpoint === newSub.endpoint);
            if (existingIdx >= 0) {
                subscribers[existingIdx] = newSub; // Update
                console.log('Updated existing subscription.');
            } else {
                subscribers.push(newSub); // Add
                console.log('Added new subscription.');
            }
            saveSubscribers(subscribers);

            // Send confirmation welcome push!
            await webPush.sendNotification(newSub, JSON.stringify({
                title: '🔔 Gamingpig Störungs-Alarm aktiv',
                body: 'Dein Gerät empfängt ab sofort alle Alarme & Entwarnungen vollautomatisch!',
                url: 'https://gamingpig.github.io/About-Gamingpig/status.html'
            }));
            console.log('Welcome push sent successfully!');
        } catch (e) {
            console.error('Failed to register subscription:', e.message);
            process.exit(1);
        }
        return;
    }

    // Default: Check mode with state-aware deduplication and recovery push
    console.log('Checking health of monitored services...');
    const state = loadState();
    const lastFailures = state.lastFailures || [];
    const failures = await checkEndpoints();

    const failureSig = [...failures].sort().join('|');
    const lastFailureSig = [...lastFailures].sort().join('|');

    if (failures.length > 0) {
        console.warn('Failures detected:', failures.join(', '));
        if (failureSig !== lastFailureSig) {
            await sendPushToAll({
                title: '🔴 Störung festgestellt – Gamingpig Portfolio',
                body: `Folgende Dienste antworten nicht: ${failures.join(', ')}. Tippe hier für Sofort-Hilfen.`,
                url: 'https://gamingpig.github.io/About-Gamingpig/status.html'
            });
        } else {
            console.log('Failure state unchanged from previous check. Skipping duplicate push notification.');
        }
    } else {
        if (lastFailures.length > 0) {
            console.log('🟢 Recovery detected! Sending recovery push notification...');
            await sendPushToAll({
                title: '🟢 Entwarnung – Alle Systeme wieder online',
                body: 'Spotify, stats.fm, Songtexte, Discord und CDNs laufen wieder im einwandfreien Normalbetrieb!',
                url: 'https://gamingpig.github.io/About-Gamingpig/status.html'
            });
        } else {
            console.log('✅ All services operational. No push needed.');
        }
    }

    saveState({
        lastFailures: failures,
        lastChecked: Date.now(),
        lastStatus: failures.length === 0 ? 'operational' : 'degraded'
    });
}

main().catch(err => {
    console.error('Fatal error in push-monitor:', err);
    process.exit(1);
});
