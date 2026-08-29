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

async function checkEndpoints() {
    const endpoints = [
        { name: 'stats.fm API', url: 'https://api.stats.fm/v1/users/gamingpig/streams/current', okStatuses: [200, 204, 404] },
        { name: 'LrcLib Lyrics', url: 'https://lrclib.net/api/get?track_name=test&artist_name=test', okStatuses: [200, 404] },
        { name: 'Discord API', url: 'https://discord.com/api/v10/invites/E8BS9BDAst?with_counts=true', okStatuses: [200] },
        { name: 'Apple CDN', url: 'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/00/00/00/000000.jpg/100x100bb.jpg', okStatuses: [200, 404] }
    ];

    const failed = [];
    for (const ep of endpoints) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(ep.url, { method: 'GET', signal: controller.signal });
            clearTimeout(timeout);
            if (!ep.okStatuses.includes(res.status)) {
                failed.push(`${ep.name} (HTTP ${res.status})`);
            }
        } catch (e) {
            failed.push(`${ep.name} (${e.name === 'AbortError' ? 'Timeout' : 'Offline'})`);
        }
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
        const subJson = process.argv[3] || process.env.NEW_SUBSCRIPTION;
        if (!subJson) {
            console.error('No subscription JSON provided.');
            process.exit(1);
        }
        try {
            const newSub = JSON.parse(subJson);
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
                title: '🔔 Störungs-Push aktiviert',
                body: 'Dein Gerät empfängt ab sofort Push-Alarme über GitHub Actions – auch bei geschlossener App!',
                url: 'https://gamingpig.github.io/About-Gamingpig/status.html'
            }));
            console.log('Welcome push sent successfully!');
        } catch (e) {
            console.error('Failed to register subscription:', e.message);
            process.exit(1);
        }
        return;
    }

    // Default: Check mode
    console.log('Checking health of monitored services...');
    const failures = await checkEndpoints();
    if (failures.length > 0) {
        console.warn('Failures detected:', failures.join(', '));
        await sendPushToAll({
            title: '🔴 Störung festgestellt – Gamingpig Portfolio',
            body: `Folgende Dienste antworten nicht: ${failures.join(', ')}. Tippe hier für Troubleshooting.`
        });
    } else {
        console.log('✅ All services operational. No push needed.');
    }
}

main().catch(err => {
    console.error('Fatal error in push-monitor:', err);
    process.exit(1);
});
