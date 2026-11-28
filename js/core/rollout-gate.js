/**
 * Client-side Staggered Continent Rollout Gate (20-minute steps, 0€ on GitHub Pages)
 * To activate for a future release: set `enabled: true` and `baseStartIso` to the Europe/DE launch time.
 * Test any continent anytime via URL parameter: ?test_rollout_tz=America/New_York
 */
(function initRolloutGate() {
  const ROLLOUT_CONFIG = {
    enabled: false,
    version: 'v24.245.104',
    baseStartIso: '2026-11-27T20:00:00+01:00',
    // Offset in minutes relative to baseStartIso per timezone region prefix
    offsetsMin: {
      Europe: 0,
      America: 20,
      Asia: 40,
      Africa: 60,
      Australia: 80,
      Pacific: 80,
      Atlantic: 20,
      Indian: 40
    },
    defaultOffsetMin: 60
  };

  try {
    const params = new URLSearchParams(window.location.search);
    const testTz = params.get('test_rollout_tz');
    if (!ROLLOUT_CONFIG.enabled && !testTz) return;

    const tz = testTz || (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin');
    const region = String(tz).split('/')[0] || 'Europe';
    const offsetMin = Object.prototype.hasOwnProperty.call(ROLLOUT_CONFIG.offsetsMin, region)
      ? ROLLOUT_CONFIG.offsetsMin[region]
      : ROLLOUT_CONFIG.defaultOffsetMin;

    const baseMs = new Date(ROLLOUT_CONFIG.baseStartIso).getTime();
    if (!isFinite(baseMs)) return;

    const unlockMs = testTz && !ROLLOUT_CONFIG.enabled
      ? Date.now() + Math.max(15000, offsetMin * 1000) // Quick preview when testing with ?test_rollout_tz=...
      : baseMs + offsetMin * 60 * 1000;

    if (Date.now() >= unlockMs) return;

    const renderGate = function () {
      if (!document.body) {
        requestAnimationFrame(renderGate);
        return;
      }
      document.documentElement.classList.add('overflow-hidden');
      const gate = document.createElement('div');
      gate.id = 'gp-rollout-gate';
      gate.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:radial-gradient(circle at top,#0f172a,#030712 72%);color:#f8fafc;display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,-apple-system,sans-serif;';
      gate.innerHTML =
        '<div style="width:100%;max-width:440px;background:rgba(15,23,42,0.82);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.14);border-radius:28px;padding:30px 24px;text-align:center;box-shadow:0 28px 80px rgba(0,0,0,0.7);">' +
          '<div style="width:74px;height:74px;margin:0 auto 16px;border-radius:20px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.4);display:flex;align-items:center;justify-content:center;">' +
            '<img src="icon-192.png" alt="Gamingpig" style="width:48px;height:48px;border-radius:12px;">' +
          '</div>' +
          '<div style="display:inline-block;padding:5px 12px;border-radius:999px;background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.35);color:#fcd34d;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px;">' +
            'Region-Rollout · ' + region +
          '</div>' +
          '<h1 style="font-size:24px;font-weight:800;margin-bottom:10px;">Aktuell Wartungsarbeiten</h1>' +
          '<p style="font-size:14px;color:#cbd5e1;line-height:1.55;margin-bottom:18px;">Der Rollout für deine Region (<strong>' + tz + '</strong>) startet in Kürze. Vielen Dank für deine Geduld!</p>' +
          '<div id="gp-rg-timer" style="display:inline-block;padding:10px 18px;border-radius:14px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.32);font-family:monospace;font-size:20px;font-weight:800;color:#bae6fd;">--:--</div>' +
        '</div>';
      document.body.appendChild(gate);

      const timerEl = document.getElementById('gp-rg-timer');
      const tick = function () {
        const diff = unlockMs - Date.now();
        if (diff <= 0) {
          gate.remove();
          document.documentElement.classList.remove('overflow-hidden');
          return;
        }
        const sec = Math.floor(diff / 1000);
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        timerEl.textContent = (h > 0 ? String(h).padStart(2, '0') + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        setTimeout(tick, 500);
      };
      tick();
    };
    renderGate();
  } catch (e) {}
})();
