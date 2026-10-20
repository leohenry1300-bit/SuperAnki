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
/* ---------- small synth engine ----------
   Every sound goes through one chain: gentle compressor + a little room reverb, so nothing is harsh or clipped.
   Instruments: FM bell, glass, plucked string (Karplus-Strong), marimba, warm pad, gong, bird chirp. */
const SND_CHAIN = new WeakMap();
function sndChain(ac) {
    let c = SND_CHAIN.get(ac);
    if (c) return c;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.22;
    const master = ac.createGain(); master.gain.value = 1.15;
    const dry = ac.createGain(), wet = ac.createGain(), conv = ac.createConvolver();
    dry.gain.value = 1; wet.gain.value = 0.2;
    /* synthetic room: decaying stereo noise, darkened */
    const sr = ac.sampleRate, len = Math.floor(sr * 1.5), ir = ac.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let lp = 0; for (let k = 0; k < len; k++) { const w = (Math.random() * 2 - 1) * Math.exp(-k / (sr * 0.32)); lp += (w - lp) * 0.35; d[k] = lp; } }
    conv.buffer = ir;
    const bus = ac.createGain();
    bus.connect(dry); bus.connect(conv); conv.connect(wet);
    dry.connect(comp); wet.connect(comp); comp.connect(master); master.connect(ac.destination);
    c = { bus }; SND_CHAIN.set(ac, c);
    return c;
}
function sndEnv(g, t, vol, atk, tau, hold = 0) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(Math.max(0.0002, vol), t + atk);
    g.gain.setTargetAtTime(0.0001, t + atk + hold, tau);
}
function sndOsc(ac, out, type, hz, t, dur, vol, atk, tau, detune = 0) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(hz, t); if (detune) o.detune.value = detune;
    sndEnv(g, t, vol, atk, tau); o.connect(g); g.connect(out); o.start(t); o.stop(t + dur);
    return { o, g };
}
function sndLP(ac, out, hz, q = 0.5) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = hz; f.Q.value = q; f.connect(out); return f; }
/* FM bell: glassy attack that mellows as the modulation fades */
function iBell(ac, out, t, hz, vol, len = 1.6) {
    const car = ac.createOscillator(), mod = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain();
    car.type = 'sine'; mod.type = 'sine'; car.frequency.value = hz; mod.frequency.value = hz * 3.5;
    mg.gain.setValueAtTime(hz * 1.6, t); mg.gain.setTargetAtTime(0, t + 0.005, len * 0.12);
    mod.connect(mg); mg.connect(car.frequency);
    sndEnv(g, t, vol, 0.004, len * 0.22); car.connect(g); g.connect(out);
    car.start(t); mod.start(t); car.stop(t + len + 0.3); mod.stop(t + len + 0.3);
    sndOsc(ac, out, 'sine', hz * 2, t, len, vol * 0.22, 0.004, len * 0.12);
}
function iGlass(ac, out, t, hz, vol, len = 1.1) {
    const f = sndLP(ac, out, 7000);
    sndOsc(ac, f, 'sine', hz, t, len, vol, 0.003, len * 0.2);
    sndOsc(ac, f, 'sine', hz * 3, t, len, vol * 0.16, 0.003, len * 0.07);
    sndOsc(ac, f, 'sine', hz * 5.04, t, len, vol * 0.06, 0.003, len * 0.04);
}
const KS_CACHE = {};
function ksBuffer(ac, hz, dur) {
    const key = `${Math.round(ac.sampleRate)}|${Math.round(hz * 10)}|${dur}`;
    if (KS_CACHE[key]) return KS_CACHE[key];
    const sr = ac.sampleRate, N = Math.floor(sr * dur), p = Math.max(2, Math.round(sr / hz)), ring = new Float32Array(p);
    let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };
    let lp = 0; for (let k = 0; k < p; k++) { lp += (rnd() - lp) * 0.55; ring[k] = lp; }
    const buf = ac.createBuffer(1, N, sr), d = buf.getChannelData(0);
    for (let k = 0, i = 0; k < N; k++) { const a = ring[i], b = ring[(i + 1) % p], v = (a + b) * 0.5 * 0.9965; ring[i] = v; d[k] = a; i = (i + 1) % p; }
    let pk = 0; for (let k = 0; k < N; k++) pk = Math.max(pk, Math.abs(d[k])); if (pk > 0) for (let k = 0; k < N; k++) d[k] /= pk;
    const fade = Math.floor(sr * 0.05); for (let k = 0; k < fade; k++) d[N - 1 - k] *= k / fade;
    return (KS_CACHE[key] = buf);
}
function iPluck(ac, out, t, hz, vol, len = 1.4) {
    const src = ac.createBufferSource(), g = ac.createGain(), f = sndLP(ac, out, 5200);
    src.buffer = ksBuffer(ac, hz, len); g.gain.value = vol * 0.9; src.connect(g); g.connect(f); src.start(t);
    sndOsc(ac, f, 'sine', hz, t, len, vol * 0.25, 0.004, 0.5);
}
function iMarimba(ac, out, t, hz, vol, len = 0.7) {
    const f = sndLP(ac, out, 4200);
    sndOsc(ac, f, 'sine', hz, t, len, vol, 0.002, len * 0.22);
    sndOsc(ac, f, 'sine', hz * 4, t, len, vol * 0.32, 0.002, 0.03);
    sndOsc(ac, f, 'sine', hz * 10, t, 0.1, vol * 0.06, 0.001, 0.012);
}
function iPad(ac, out, t, hz, vol, len = 1.3) {
    const f = sndLP(ac, out, 2200);
    [-7, 7].forEach(c => sndOsc(ac, f, 'triangle', hz, t, len + 1, vol * 0.5, 0.06, len * 0.3, c));
    sndOsc(ac, f, 'sine', hz / 2, t, len + 1, vol * 0.25, 0.08, len * 0.3);
}
function iGong(ac, out, t, hz, vol, len = 3.2) {
    const f = sndLP(ac, out, 3500);
    [[1, 1, 1], [1.47, 0.6, 0.8], [2.09, 0.45, 0.6], [2.56, 0.3, 0.45], [3.2, 0.18, 0.3]].forEach(([m, v, d], i) => sndOsc(ac, f, 'sine', hz * m + (i % 2 ? 0.6 : -0.4), t, len, vol * v, 0.012, len * 0.2 * d));
    sndOsc(ac, f, 'sine', hz / 2, t, len, vol * 0.5, 0.02, len * 0.25);
}
function iChirp(ac, out, t, f0, f1, dur, vol) {
    const o = ac.createOscillator(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.8);
    lfo.frequency.value = 38; lg.gain.value = f0 * 0.03; lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(sndLP(ac, out, 6000)); o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
}
/* short filtered-noise puff (a soft "paper" sound) */
function iPuff(ac, out, t, dur, vol, hz) {
    const n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let k = 0; k < n; k++) d[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / n, 2.2);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    f.type = 'bandpass'; f.frequency.value = hz; f.Q.value = 0.9; g.gain.value = vol;
    s.buffer = b; s.connect(f); f.connect(g); g.connect(out); s.start(t);
}
const NOTE = { C4: 261.63, D4: 293.66, E4: 329.63, G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98, A6: 1760, C7: 2093, E7: 2637 };

/* UI sounds: short, quiet, in a C major pentatonic so any order of them stays pleasant */
const SFX = {
    reveal: (ac, o, t, v) => { iPuff(ac, o, t, 0.07, v * 0.5, 2400); iMarimba(ac, o, t + 0.01, NOTE.G4, v * 0.28, 0.25); },
    g1: (ac, o, t, v) => { iPad(ac, o, t, NOTE.E4, v * 0.34, 0.35); iMarimba(ac, o, t + 0.11, NOTE.D4, v * 0.3, 0.4); },
    g2: (ac, o, t, v) => { iMarimba(ac, o, t, NOTE.E5, v * 0.42, 0.5); },
    g3: (ac, o, t, v) => { iPluck(ac, o, t, NOTE.G5, v * 0.42, 0.7); iPluck(ac, o, t + 0.09, NOTE.C6, v * 0.46, 0.9); },
    g4: (ac, o, t, v) => { [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((h, i) => iGlass(ac, o, t + i * 0.07, h, v * 0.34, 0.8)); iBell(ac, o, t + 0.2, NOTE.E6, v * 0.14, 0.9); },
    right: (ac, o, t, v) => { iPluck(ac, o, t, NOTE.E5, v * 0.4, 0.6); iPluck(ac, o, t + 0.08, NOTE.A5, v * 0.44, 0.9); },
    wrong: (ac, o, t, v) => { iPad(ac, o, t, NOTE.A4, v * 0.32, 0.3); iMarimba(ac, o, t + 0.1, NOTE.E4, v * 0.28, 0.45); },
    done: (ac, o, t, v) => { [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((h, i) => iPluck(ac, o, t + i * 0.12, h, v * 0.4, 1.2)); iBell(ac, o, t + 0.5, NOTE.G6, v * 0.18, 1.6); iPad(ac, o, t + 0.45, NOTE.C5, v * 0.3, 1.2); },
    pop: (ac, o, t, v) => { const x = sndOsc(ac, sndLP(ac, o, 3800), 'sine', 420, t, 0.18, v * 0.4, 0.004, 0.05); x.o.frequency.exponentialRampToValueAtTime(980, t + 0.09); }
};
function sfx(name) {
    if (!SND.on || !SFX[name]) return;
    const ac = sndCtx(); if (!ac) return;
    try { SFX[name](ac, sndChain(ac).bus, ac.currentTime + 0.02, SND.vol); } catch { /* ignore */ }
}

/* focus timer bells: a phrase of 1-2 s, played twice by the timer */
const RINGTONES = {
    bell: { name: 'Cloche', len: 2.4, play: (ac, o, t, v) => { [NOTE.G5, NOTE.C6, NOTE.E6].forEach((h, i) => iBell(ac, o, t + i * 0.34, h, v * 0.4, i === 2 ? 2.2 : 1.5)); } },
    soft: { name: 'Doux', len: 2.2, play: (ac, o, t, v) => { iPad(ac, o, t, NOTE.E5, v * 0.5, 1.2); iPad(ac, o, t + 0.02, NOTE.B5, v * 0.34, 1.2); iPad(ac, o, t + 0.55, NOTE.G5, v * 0.5, 1.3); iPad(ac, o, t + 0.57, NOTE.C6, v * 0.34, 1.3); } },
    chime: { name: 'Carillon', len: 2.2, play: (ac, o, t, v) => { [NOTE.E6, NOTE.G6, NOTE.C7, NOTE.G6].forEach((h, i) => iGlass(ac, o, t + i * 0.18, h, v * 0.3, 1.3)); } },
    harp: { name: 'Harpe', len: 2.2, play: (ac, o, t, v) => { [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6].forEach((h, i) => iPluck(ac, o, t + i * 0.11, h, v * 0.42, 1.6)); } },
    marimba: { name: 'Marimba', len: 2, play: (ac, o, t, v) => { [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((h, i) => iMarimba(ac, o, t + i * 0.16, h, v * 0.48, 0.7)); } },
    crystal: { name: 'Cristal', len: 2, play: (ac, o, t, v) => { [NOTE.A6, NOTE.E7, NOTE.A6, NOTE.E7].forEach((h, i) => iGlass(ac, o, t + i * 0.22, h, v * 0.26, 1.2)); } },
    gong: { name: 'Gong', len: 3.4, play: (ac, o, t, v) => { iGong(ac, o, t, 110, v * 0.4, 3.4); iBell(ac, o, t + 0.02, NOTE.C5, v * 0.1, 2.4); } },
    birds: { name: 'Oiseaux', len: 1.8, play: (ac, o, t, v) => { [[0, 2300, 3400, 0.16], [0.24, 2700, 3900, 0.14], [0.46, 2100, 3600, 0.2], [0.9, 2500, 3300, 0.14], [1.12, 2900, 4000, 0.18]].forEach(([d, a, b, du]) => iChirp(ac, o, t + d, a, b, du, v * 0.34)); } }
};
function ringPlay(id, repeat = true) {
    const ac = sndCtx(), r = RINGTONES[id] || RINGTONES.bell;
    if (!ac) return;
    const v = Math.max(0.4, SND.vol) * 1.1, t0 = ac.currentTime + 0.05, bus = sndChain(ac).bus;
    try { [0, ...(repeat ? [r.len + 0.5] : [])].forEach(d => r.play(ac, bus, t0 + d, v)); } catch { /* ignore */ }
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
            else if (a === 'snd-play') { const was = SND.on; SND.on = true; sfx(b.dataset.n); SND.on = was; }
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
            <div class="set-row" style="flex-wrap:wrap"><div class="txt"><b>Écouter chaque son</b></div><span style="display:flex;gap:6px;flex-wrap:wrap">${[['reveal', 'Retourner'], ['g1', 'Raté'], ['g2', 'Difficile'], ['g3', 'Bien'], ['g4', 'Facile'], ['wrong', 'Faux'], ['right', 'Juste'], ['done', 'Fin de session']].map(([n, l]) => `<button class="chip" data-ex="snd-play" data-n="${n}">${l}</button>`).join('')}</span></div>
            <div class="set-row"><div class="txt"><b>Volume</b></div><input type="range" id="snd-vol" min="5" max="100" value="${Math.round(SND.vol * 100)}" style="width:160px" aria-label="Volume"></div>
            <div class="set-row"><div class="txt"><b>Mise à jour</b><span id="upd-status">Version <code id="upd-ver">${APP_VER0 ? APP_VER0.slice(0, 8) : '—'}</code></span></div>
                <button class="btn btn-primary btn-sm" data-ex="upd">${ic('reset')}Mettre à jour maintenant</button></div>
        </div>`;
    },
    extrasSoundRefresh() { const cb = $('#ex-settings input[data-ex="snd-toggle"]'); if (cb) cb.checked = SND.on; }
});
