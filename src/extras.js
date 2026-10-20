/* ============================================================
   Sounds (pleasant, synthesized with Web Audio: no file) + "update now" button.
   - UI sounds: reveal, grades, quiz right/wrong, end of session. On/off + volume, kept on this device.
   - Bell sounds for the focus timer: a list to choose from, one for the end of study and one for the end of the break.
   ============================================================ */
const SND_KEY = 'superanki_sound';
const SND = (() => { let st = { on: true, vol: 0.5 }; try { const x = JSON.parse(localStorage.getItem(SND_KEY) || 'null'); if (x && typeof x === 'object') st = { on: x.on !== false, vol: Math.min(1, Math.max(0, Number(x.vol) || 0.5)) }; } catch { /* ignore */ } return st; })();
function sndSave() { try { localStorage.setItem(SND_KEY, JSON.stringify(SND)); } catch { /* ignore */ } }
function sndCtx() {
    try {
        const a = window.app; if (!a) return null;
        if (!a.audioCtx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) a.audioCtx = new AC(); }
        if (a.audioCtx && a.audioCtx.state === 'suspended') a.audioCtx.resume();
        return a.audioCtx || null;
    } catch { return null; }
}
/* one soft note: sine/triangle with a quick attack and an exponential fade */
function sndNote(ac, t, hz, dur, vol, type = 'sine', glideTo = 0) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(hz, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
}
function sndBell(ac, t, hz, vol, len = 1.1) { [[1, 1], [2.76, 0.32], [5.4, 0.14]].forEach(([m, v]) => sndNote(ac, t, hz * m, len / Math.sqrt(m), vol * v)); }

/* UI sounds (short, quiet) */
const SFX = {
    reveal: (ac, t, v) => { sndNote(ac, t, 520, 0.09, v * 0.5, 'triangle'); },
    g1: (ac, t, v) => { sndNote(ac, t, 247, 0.16, v * 0.6, 'triangle', 196); },
    g2: (ac, t, v) => { sndNote(ac, t, 392, 0.12, v * 0.55, 'triangle'); },
    g3: (ac, t, v) => { sndNote(ac, t, 523, 0.14, v * 0.6); sndNote(ac, t + 0.08, 659, 0.2, v * 0.6); },
    g4: (ac, t, v) => { [523, 659, 784].forEach((h, i) => sndNote(ac, t + i * 0.07, h, 0.22, v * 0.55)); },
    right: (ac, t, v) => { sndNote(ac, t, 659, 0.12, v * 0.6); sndNote(ac, t + 0.09, 880, 0.24, v * 0.6); },
    wrong: (ac, t, v) => { sndNote(ac, t, 220, 0.22, v * 0.6, 'triangle', 165); },
    done: (ac, t, v) => { [523, 659, 784, 1047].forEach((h, i) => { sndNote(ac, t + i * 0.12, h, 0.5, v * 0.55); sndNote(ac, t + i * 0.12, h * 2, 0.3, v * 0.12); }); },
    pop: (ac, t, v) => { sndNote(ac, t, 700, 0.1, v * 0.55, 'sine', 1000); }
};
function sfx(name) {
    if (!SND.on || !SFX[name]) return;
    const ac = sndCtx(); if (!ac) return;
    try { SFX[name](ac, ac.currentTime + 0.01, SND.vol * 0.9); } catch { /* ignore */ }
}

/* focus timer bells: each plays a short phrase, repeated twice by the timer */
const RINGTONES = {
    bell: { name: 'Cloche', play: (ac, t, v) => { [988, 1319, 1760].forEach((h, i) => sndBell(ac, t + i * 0.28, h, v * 0.22)); } },
    soft: { name: 'Doux', play: (ac, t, v) => { [784, 988].forEach((h, i) => sndBell(ac, t + i * 0.3, h, v * 0.22)); } },
    chime: { name: 'Carillon', play: (ac, t, v) => { [1047, 1319, 1568, 2093].forEach((h, i) => sndNote(ac, t + i * 0.16, h, 0.9, v * 0.2)); } },
    harp: { name: 'Harpe', play: (ac, t, v) => { [392, 494, 587, 784, 988].forEach((h, i) => { sndNote(ac, t + i * 0.12, h, 1.0, v * 0.2, 'triangle'); sndNote(ac, t + i * 0.12, h * 2, 0.5, v * 0.06); }); } },
    marimba: { name: 'Marimba', play: (ac, t, v) => { [523, 659, 784, 659].forEach((h, i) => { sndNote(ac, t + i * 0.18, h, 0.35, v * 0.3, 'triangle'); sndNote(ac, t + i * 0.18, h * 4, 0.08, v * 0.1); }); } },
    digital: { name: 'Digital', play: (ac, t, v) => { [0, 0.22, 0.44].forEach(d => sndNote(ac, t + d, 880, 0.12, v * 0.14, 'square')); } },
    gong: { name: 'Gong', play: (ac, t, v) => { sndBell(ac, t, 196, v * 0.34, 2.6); sndNote(ac, t, 98, 2.2, v * 0.2); } },
    birds: { name: 'Oiseaux', play: (ac, t, v) => { [0, 0.28, 0.5].forEach((d, i) => sndNote(ac, t + d, 1800 + i * 300, 0.14, v * 0.12, 'sine', 2800 + i * 300)); } }
};
function ringPlay(id, repeat = true) {
    const ac = sndCtx(), r = RINGTONES[id] || RINGTONES.bell;
    if (!ac) return;
    const v = Math.max(0.35, SND.vol) * 1.2, t0 = ac.currentTime + 0.05;
    try { [0, ...(repeat ? [1.9] : [])].forEach(d => r.play(ac, t0 + d, v)); } catch { /* ignore */ }
}

/* hook the sounds on the study actions (wrapping the existing methods: nothing duplicated) */
(() => {
    const P = SuperAnki.prototype, wrap = (name, fn) => { const o = P[name]; if (typeof o !== 'function') return; P[name] = function (...a) { const pre = fn.pre ? fn.pre.call(this, ...a) : null; const r = o.apply(this, a); try { fn.post.call(this, pre, ...a); } catch { /* ignore */ } return r; }; };
    wrap('reveal', { pre() { const s = this.session; return !!(s && s.current && !s.revealed); }, post(was) { if (was && this.session && this.session.revealed) sfx('reveal'); } });
    wrap('grade', { pre() { const s = this.session; return !!(s && s.kind === 'srs' && s.revealed); }, post(was, g) { if (was) sfx('g' + g); } });
    wrap('practiceAnswer', { pre() { const s = this.session; return !!(s && s.kind === 'practice' && s.revealed); }, post(was, ok) { if (was) sfx(ok ? 'right' : 'wrong'); } });
    wrap('quizAnswer', { pre(i) { const s = this.session; return s && !s.answered && s.options && s.options[i] ? s.options[i].ok : null; }, post(ok) { if (ok !== null) sfx(ok ? 'right' : 'wrong'); } });
    wrap('showSummary', { post() { sfx('done'); } });
})();

/* ---------- "update now" ---------- */
let APP_VER0 = null, APP_UPD_LAST = 0;
function appFetchVer() {
    return fetch('sw.js?v=' + Date.now(), { cache: 'no-store' }).then(r => (r.ok ? r.text() : '')).then(t => ((t.match(/Version:\s*(\S+)/) || [])[1] || null)).catch(() => null);
}
Object.assign(SuperAnki.prototype, {
    extrasInit() {
        if (!/^https?:/.test(location.protocol)) return;
        appFetchVer().then(v => { APP_VER0 = v; this.updRefresh(); });
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - APP_UPD_LAST > 10 * 60000) this.updCheck(true); });
        setInterval(() => { if (Date.now() - APP_UPD_LAST > 30 * 60000) this.updCheck(true); }, 5 * 60000);
        document.addEventListener('click', e => {
            const b = e.target.closest('[data-ex]'); if (!b) return;
            const a = b.dataset.ex;
            if (a === 'upd') this.updNow();
            else if (a === 'snd-toggle') { SND.on = !SND.on; sndSave(); this.updRefresh(); this.extrasSoundRefresh(); if (SND.on) sfx('pop'); }
            else if (a === 'snd-test') { sfx('g3'); setTimeout(() => sfx('right'), 450); }
            else if (a === 'ring-test') ringPlay(b.dataset.id, false);
        });
        document.addEventListener('input', e => { if (e.target.id === 'snd-vol') { SND.vol = Number(e.target.value) / 100; sndSave(); } });
        document.addEventListener('change', e => { if (e.target.id === 'snd-vol') sfx('pop'); });
    },
    /* quiet background check (adds a banner) or manual check (returns the state) */
    async updCheck(quiet) {
        APP_UPD_LAST = Date.now();
        const v = await appFetchVer();
        if (!v) return 'offline';
        if (!APP_VER0) { APP_VER0 = v; this.updRefresh(); return 'same'; }
        const fresh = v !== APP_VER0;
        this.updRefresh(fresh);
        return fresh ? 'new' : 'same';
    },
    updRefresh(fresh) {
        const st = $('#upd-status'), ver = $('#upd-ver');
        if (ver) ver.textContent = APP_VER0 ? APP_VER0.slice(0, 8) : '—';
        if (st && fresh !== undefined) st.textContent = fresh ? 'Une nouvelle version est disponible.' : 'Tu as la dernière version ✓';
        let bn = $('#upd-banner');
        if (fresh) {
            if (!bn) { bn = document.createElement('div'); bn.id = 'upd-banner'; bn.className = 'upd-banner'; document.body.appendChild(bn); }
            bn.innerHTML = `<span>Nouvelle version disponible</span><button class="btn btn-primary btn-sm" data-ex="upd">Mettre à jour</button><button class="icon-btn icon-btn-sm" aria-label="Plus tard" onclick="this.parentNode.remove()">${ic('x')}</button>`;
        } else if (bn && fresh === false) bn.remove();
    },
    async updNow() {
        const st = $('#upd-status'), say = t => { if (st) st.textContent = t; };
        this.toast('Recherche de mise à jour…', 'info');
        say('Recherche…');
        const r = await this.updCheck(false);
        if (r === 'offline') { this.toast('Impossible de vérifier : pas de connexion.', 'warning'); say('Pas de connexion.'); return; }
        if (r === 'same') { this.toast('Tu as déjà la dernière version ✓', 'success'); return; }
        say('Installation…');
        try {
            const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
            if (reg) await reg.update();
            if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.filter(k => k.startsWith('superanki-')).map(k => caches.delete(k))); }
        } catch { /* ignore */ }
        this.toast('Mise à jour installée : rechargement…', 'success');
        setTimeout(() => location.reload(), 500);
    },
    extrasSettingsHtml() {
        return `<div class="panel panel-pad set-section" id="ex-settings">
            <h3>${ic('volume')} Sons et mises à jour</h3>
            <div class="set-row"><div class="txt"><b>Sons de l'application</b><span>Petits sons doux quand tu retournes une carte, réponds ou termines une session. Réglage propre à cet appareil.</span></div>
                <span style="display:flex;gap:10px;align-items:center"><label class="switch"><input type="checkbox" ${SND.on ? 'checked' : ''} data-ex="snd-toggle" aria-label="Sons de l'application"><span></span></label><button class="btn btn-soft btn-sm" data-ex="snd-test">Tester</button></span></div>
            <div class="set-row"><div class="txt"><b>Volume</b></div><input type="range" id="snd-vol" min="5" max="100" value="${Math.round(SND.vol * 100)}" style="width:160px" aria-label="Volume"></div>
            <div class="set-row"><div class="txt"><b>Mise à jour</b><span id="upd-status">Version <code id="upd-ver">${APP_VER0 ? APP_VER0.slice(0, 8) : '—'}</code></span></div>
                <button class="btn btn-primary btn-sm" data-ex="upd">${ic('reset')}Mettre à jour maintenant</button></div>
        </div>`;
    },
    extrasSoundRefresh() { const cb = $('#ex-settings input[data-ex="snd-toggle"]'); if (cb) cb.checked = SND.on; }
});
