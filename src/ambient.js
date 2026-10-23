/* ============================================================
   Ambiance sonore (comme « A Soft Murmur »): a mixer of soft background sounds with one slider each.
   Everything is synthesized in the browser (no audio file): rain, thunder, wind, waves, waterfall, fire, birds, crickets,
   stream, café, singing bowl, train, fan, leaves, white and brown noise.
   The mix goes through a real <audio> element (MediaStream), which is what lets the sound keep playing when the screen
   locks or the app goes to the background on most phones; lock-screen play/pause buttons are provided (Media Session).
   Settings only: nothing is added to the study screens.
   ============================================================ */
const AMB_KEY = 'superanki_ambient';
const AMB_LEN = 12;                       // seconds per loop
const AMB_SOUNDS = [
    ['rain', '🌧️', 'Pluie'], ['thunder', '⛈️', 'Orage'], ['wind', '🍃', 'Vent'], ['waves', '🌊', 'Vagues'],
    ['waterfall', '💧', 'Cascade'], ['fire', '🔥', 'Feu de bois'], ['birds', '🐦', 'Oiseaux'], ['crickets', '🦗', 'Grillons'], ['cicadas', '☀️', 'Cigales'],
    ['stream', '🏞️', 'Ruisseau'], ['cafe', '☕', 'Café'], ['bowl', '🔔', 'Bol chantant'], ['train', '🚆', 'Train'],
    ['fan', '🌀', 'Ventilateur'], ['leaves', '🍂', 'Feuilles'], ['white', '⚪', 'Bruit blanc'], ['brown', '🟤', 'Bruit brun']
];
const AMB_DEFAULT = { vols: {}, master: 0.7, timer: 0, link: false, presets: [], bowl: 'strike' };
const AMB_BOWLS = [['strike', 'Frappé doux'], ['deep', 'Frappé grave'], ['rub', 'Frotté (chantant)'], ['crystal', 'Cristal']];
/* the sound file used for a mixer slot (the singing bowl has several styles) */
function ambKey(id) { return id === 'bowl' ? 'bowl_' + (AMB_BOWLS.some(b => b[0] === AMB.bowl) ? AMB.bowl : 'strike') : id; }
const AMB = (() => { let st = { ...AMB_DEFAULT, vols: {}, presets: [] }; try { const x = JSON.parse(localStorage.getItem(AMB_KEY) || 'null'); if (x && typeof x === 'object') st = { ...st, ...x, vols: { ...(x.vols || {}) }, presets: Array.isArray(x.presets) ? x.presets.slice(0, 12) : [] }; } catch { /* ignore */ } st.master = Math.min(1, Math.max(0, Number(st.master) || 0.7)); return st; })();
function ambSave() { try { localStorage.setItem(AMB_KEY, JSON.stringify(AMB)); } catch { /* ignore */ } }

/* ---------- sample generators (each returns [left, right] Float32Array, seamless loop) ---------- */
function ambRng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function ambNoise(n, rnd) { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = rnd() * 2 - 1; return a; }
function ambPink(n, rnd) { const o = new Float32Array(n); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0; for (let i = 0; i < n; i++) { const w = rnd() * 2 - 1; b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; o[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926; } return o; }
function ambBrown(n, rnd) { const o = new Float32Array(n); let l = 0; for (let i = 0; i < n; i++) { l = (l + 0.02 * (rnd() * 2 - 1)) / 1.02; o[i] = l * 3.5; } return o; }
function ambLP(x, hz, sr) { const a = 1 - Math.exp(-2 * Math.PI * hz / sr), o = new Float32Array(x.length); let y = 0; for (let i = 0; i < x.length; i++) { y += a * (x[i] - y); o[i] = y; } return o; }
function ambHP(x, hz, sr) { const l = ambLP(x, hz, sr), o = new Float32Array(x.length); for (let i = 0; i < x.length; i++) o[i] = x[i] - l[i]; return o; }
function ambBP(x, lo, hi, sr) { return ambLP(ambHP(x, lo, sr), hi, sr); }
/* state-variable band-pass with a cutoff that moves over time */
function ambSweep(x, fn, q, sr) { const o = new Float32Array(x.length); let lo = 0, bp = 0; for (let i = 0; i < x.length; i++) { const f = 2 * Math.sin(Math.PI * Math.min(0.45, fn(i) / sr)), hp = x[i] - lo - bp / q; bp += f * hp; lo += f * bp; o[i] = bp; } return o; }
function ambNorm(x, rms) { let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i]; const k = rms / (Math.sqrt(s / x.length) || 1); for (let i = 0; i < x.length; i++) x[i] *= k; return x; }
/* make a continuous signal loop: cross-fade its tail over its head (x has L + fade samples) */
function ambLoop(x, L, fade) { const o = new Float32Array(L); for (let i = 0; i < L; i++) o[i] = x[i]; for (let i = 0; i < fade; i++) { const w = i / fade; o[i] = x[i] * w + x[L + i] * (1 - w); } return o; }
/* add a sound event at position p with wrap-around, so loops stay seamless */
function ambAdd(out, ev, p) { const n = out.length; for (let i = 0; i < ev.length; i++) out[(p + i) % n] += ev[i]; }
const AMB_GEN = {
    white(sr, L, fade, rnd) { return ambNorm(ambLoop(ambNoise(L + fade, rnd), L, fade), 0.12); },
    brown(sr, L, fade, rnd) { return ambNorm(ambLoop(ambBrown(L + fade, rnd), L, fade), 0.2); },
    rain(sr, L, fade, rnd) {
        const n = L + fade, base = ambBP(ambPink(n, rnd), 500, 9000, sr), hiss = ambHP(ambNoise(n, rnd), 5000, sr);
        const o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = base[i] * 1.2 + hiss[i] * 0.12;
        const drops = new Float32Array(n), cnt = Math.floor(n / sr * 55);
        for (let d = 0; d < cnt; d++) { const p = Math.floor(rnd() * (n - 400)), a = 0.15 + rnd() * 0.4, f = 0.04 + rnd() * 0.1; for (let k = 0; k < 300; k++) drops[p + k] += Math.sin(k * f * 6) * Math.exp(-k / 40) * a * (rnd() * 0.5 + 0.5); }
        const dl = ambHP(drops, 1200, sr); for (let i = 0; i < n; i++) o[i] += dl[i] * 0.45;
        return ambNorm(ambLoop(o, L, fade), 0.13);
    },
    thunder(sr, L, fade, rnd) {
        const n = L, o = new Float32Array(n), rumble = ambLP(ambBrown(n + sr, rnd), 160, sr);
        [[0.18, 1], [0.62, 0.7]].forEach(([at, amp]) => {
            const p = Math.floor(n * at), len = Math.floor(sr * 4.5), ev = new Float32Array(len);
            for (let k = 0; k < len; k++) { const t = k / sr, env = Math.min(1, t / 0.25) * Math.exp(-t / 1.3) * (0.75 + 0.25 * Math.sin(t * 9 + rnd())); ev[k] = rumble[(k + p) % rumble.length] * env * amp; }
            ambAdd(o, ev, p);
        });
        const bed = ambNorm(ambLP(ambLoop(ambBrown(n + fade, rnd), n, fade), 120, sr), 0.012); for (let i = 0; i < n; i++) o[i] += bed[i];
        return ambNorm(o, 0.1);
    },
    wind(sr, L, fade, rnd) {
        const n = L + fade, x = ambPink(n, rnd), p1 = rnd() * 6, p2 = rnd() * 6;
        const s = ambSweep(x, i => 380 + 260 * Math.sin(2 * Math.PI * i / sr / 7 + p1) + 120 * Math.sin(2 * Math.PI * i / sr / 3.1 + p2), 1.6, sr);
        for (let i = 0; i < n; i++) s[i] *= 0.55 + 0.45 * Math.sin(2 * Math.PI * i / sr / 9 + p2);
        return ambNorm(ambLoop(s, L, fade), 0.12);
    },
    waves(sr, L, fade, rnd) {
        const n = L + fade, period = 6, o = new Float32Array(n), pink = ambPink(n, rnd), body = ambLP(pink, 900, sr), foam = ambHP(ambLP(pink, 5500, sr), 1200, sr);
        for (let i = 0; i < n; i++) { const t = (i / sr) % period / period, env = t < 0.5 ? Math.pow(t / 0.5, 1.8) : Math.exp(-(t - 0.5) * 5); o[i] = body[i] * (0.25 + 0.9 * env) + foam[i] * env * 0.9 * (t > 0.42 ? 1 : 0.4); }
        return ambNorm(ambLoop(o, L, fade), 0.13);
    },
    waterfall(sr, L, fade, rnd) { const x = ambBP(ambPink(L + fade, rnd), 150, 7000, sr), w = ambHP(ambNoise(L + fade, rnd), 3000, sr); for (let i = 0; i < x.length; i++) x[i] += w[i] * 0.15; return ambNorm(ambLoop(x, L, fade), 0.14); },
    fire(sr, L, fade, rnd) {
        const n = L, o = ambNorm(ambLP(ambLoop(ambBrown(n + fade, rnd), n, fade), 260, sr), 0.07);
        const cnt = Math.floor(L / sr * 7);
        for (let c = 0; c < cnt; c++) { const p = Math.floor(rnd() * n), len = Math.floor(sr * (0.01 + rnd() * 0.05)), ev = new Float32Array(len), a = 0.2 + rnd() * 0.6; for (let k = 0; k < len; k++) ev[k] = (rnd() * 2 - 1) * Math.exp(-k / (len * 0.25)) * a; ambAdd(o, ambBP(ev, 800, 5000, sr), p); }
        const crackleBed = ambHP(ambLoop(ambNoise(n + fade, rnd), n, fade), 3000, sr); for (let i = 0; i < n; i++) o[i] += crackleBed[i] * 0.02 * (0.5 + 0.5 * Math.sin(i / sr * 11));
        return ambNorm(o, 0.1);
    },
    birds(sr, L, fade, rnd) {
        const n = L, o = new Float32Array(n), phrases = 7;
        for (let b = 0; b < phrases; b++) {
            const p = Math.floor((b + rnd() * 0.6) / phrases * n), base = 2200 + rnd() * 2200, notes = 2 + Math.floor(rnd() * 4), pan = rnd();
            let at = p;
            for (let k = 0; k < notes; k++) {
                const len = Math.floor(sr * (0.07 + rnd() * 0.08)), up = rnd() > 0.4, f0 = base * (1 + rnd() * 0.2), f1 = f0 * (up ? 1.4 : 0.7), ev = new Float32Array(len); let ph = 0;
                for (let i = 0; i < len; i++) { const t = i / len, f = f0 + (f1 - f0) * t + 90 * Math.sin(i / sr * 220); ph += 2 * Math.PI * f / sr; ev[i] = Math.sin(ph) * Math.sin(Math.PI * t) * 0.5; }
                ambAdd(o, ev, at); at += len + Math.floor(sr * (0.05 + rnd() * 0.08));
            }
            void pan;
        }
        return ambNorm(ambLP(o, 7000, sr), 0.045);
    },
    crickets(sr, L, fade, rnd) {
        const n = L, o = new Float32Array(n);
        for (let c = 0; c < 3; c++) { const f = 4200 + c * 260 + rnd() * 80, ph0 = rnd(), rate = 0.55 + c * 0.07; for (let i = 0; i < n; i++) { const t = i / sr, gate = Math.max(0, Math.sin(2 * Math.PI * (t * rate + ph0))), pulse = Math.pow(Math.max(0, Math.sin(2 * Math.PI * t * 32)), 3); o[i] += Math.sin(2 * Math.PI * f * t) * pulse * (gate > 0.35 ? 1 : 0) * 0.35; } }
        const bed = ambNorm(ambLoop(ambLP(ambPink(n + fade, rnd), 600, sr), n, fade), 0.008); for (let i = 0; i < n; i++) o[i] += bed[i];
        return ambNorm(o, 0.05);
    },
    stream(sr, L, fade, rnd) {
        const n = L + fade, x = ambPink(n, rnd), ph = [rnd() * 6, rnd() * 6, rnd() * 6];
        const a = ambSweep(x, i => 1100 + 500 * Math.sin(i / sr * 5.3 + ph[0]), 2.2, sr), b = ambSweep(x, i => 1900 + 700 * Math.sin(i / sr * 7.9 + ph[1]), 2.4, sr), c = ambSweep(x, i => 2800 + 800 * Math.sin(i / sr * 11.3 + ph[2]), 2.6, sr);
        const o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = a[i] * 0.9 + b[i] * 0.7 + c[i] * 0.45;
        const rush = ambBP(ambPink(n, rnd), 300, 3500, sr); for (let i = 0; i < n; i++) o[i] += rush[i] * 0.5;
        return ambNorm(ambLoop(o, L, fade), 0.12);
    },
    cafe(sr, L, fade, rnd) {
        const n = L + fade, o = new Float32Array(n), room = ambLP(ambPink(n, rnd), 1400, sr);
        [[500, 0.13], [850, 0.2], [1300, 0.12], [2100, 0.06]].forEach(([f, sp], k) => { const x = ambSweep(ambNoise(n, rnd), i => f + 160 * Math.sin(i / sr * (1.1 + k * 0.4) + k), 3.2, sr); for (let i = 0; i < n; i++) o[i] += x[i] * (0.5 + 0.5 * Math.max(0, Math.sin(i / sr * (sp * 6 + 0.7) + k * 2))); });
        for (let i = 0; i < n; i++) o[i] = o[i] * 0.8 + room[i] * 0.5;
        const out = ambNorm(ambLoop(o, L, fade), 0.1), clinks = Math.floor(L / sr * 0.8);
        for (let c = 0; c < clinks; c++) { const p = Math.floor(rnd() * L), f = 2500 + rnd() * 2600, len = Math.floor(sr * 0.35), ev = new Float32Array(len); for (let k = 0; k < len; k++) { const t = k / sr; ev[k] = (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(2 * Math.PI * f * 2.7 * t)) * Math.exp(-t / 0.05) * 0.035; } ambAdd(out, ev, p); }
        return out;
    },
    bowl(sr, L, fade, rnd) {
        const n = L, o = new Float32Array(n), f0 = 196, period = n / 2;
        for (let s = 0; s < 2; s++) { const start = Math.floor(s * period + 0.05 * sr), len = Math.floor(period * 0.97), ev = new Float32Array(len); for (let i = 0; i < len; i++) { const t = i / sr, env = Math.min(1, t / 0.04) * Math.exp(-t / 2.6); ev[i] = (Math.sin(2 * Math.PI * f0 * t) + 0.55 * Math.sin(2 * Math.PI * (f0 * 2.76 + 1.1) * t) * Math.exp(-t / 1.2) + 0.3 * Math.sin(2 * Math.PI * (f0 * 5.4) * t) * Math.exp(-t / 0.6) + 0.35 * Math.sin(2 * Math.PI * (f0 + 0.7) * t)) * env; } ambAdd(o, ev, start); }
        return ambNorm(o, 0.05);
    },
    cicadas(sr, L, fade, rnd) {
        const n = L + fade, o = new Float32Array(n);
        [[4600, 71, 0.31], [5300, 83, 0.23], [6100, 64, 0.17]].forEach(([f, pulse, slow], k) => {
            const x = ambBP(ambNoise(n, rnd), f - 700, f + 900, sr), ph = rnd() * 6;
            for (let i = 0; i < n; i++) { const t = i / sr, gate = 0.5 + 0.5 * Math.sin(2 * Math.PI * t * pulse + 2 * Math.sin(t * 2.1 + ph)), swell = 0.35 + 0.65 * Math.max(0, Math.sin(2 * Math.PI * t * slow + ph + k)); o[i] += x[i] * gate * swell; }
        });
        return ambNorm(ambLoop(o, L, fade), 0.07);
    },
    train(sr, L, fade, rnd) {
        const n = L, o = ambNorm(ambLP(ambLoop(ambBrown(n + fade, rnd), n, fade), 220, sr), 0.05), beat = 0.42, hits = Math.floor(L / sr / beat);
        for (let h = 0; h < hits; h++) { const p = Math.floor((h * beat + (h % 2 ? 0.07 : 0)) * sr), len = Math.floor(sr * 0.12), ev = new Float32Array(len); for (let k = 0; k < len; k++) ev[k] = (rnd() * 2 - 1) * Math.exp(-k / (sr * 0.018)) * (h % 4 < 2 ? 0.5 : 0.35); ambAdd(o, ambBP(ev, 120, 1800, sr), p); }
        const hiss = ambNorm(ambHP(ambLoop(ambNoise(n + fade, rnd), n, fade), 2500, sr), 0.012); for (let i = 0; i < n; i++) o[i] += hiss[i];
        return ambNorm(o, 0.1);
    },
    fan(sr, L, fade, rnd) {
        const n = L + fade, air = ambBP(ambPink(n, rnd), 180, 4500, sr), hum = new Float32Array(n);
        for (let i = 0; i < n; i++) { const t = i / sr; hum[i] = Math.sin(2 * Math.PI * 118 * t) * 0.18 + Math.sin(2 * Math.PI * 236 * t) * 0.06; }
        const o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = air[i] * (1 + 0.06 * Math.sin(i / sr * 2 * Math.PI * 1.7)) + hum[i] * 0.4;
        return ambNorm(ambLoop(o, L, fade), 0.1);
    },
    leaves(sr, L, fade, rnd) {
        const n = L + fade, x = ambHP(ambNoise(n, rnd), 2200, sr), env = new Float32Array(n); let v = 0;
        for (let i = 0; i < n; i++) { if (rnd() < 14 / sr) v = Math.min(1, v + 0.4 + rnd() * 0.5); v *= 0.9993; env[i] = v; }
        const o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = x[i] * env[i];
        const breeze = ambNorm(ambLP(ambPink(n, rnd), 700, sr), 0.02); for (let i = 0; i < n; i++) o[i] += breeze[i];
        return ambNorm(ambLoop(o, L, fade), 0.09);
    }
};
function ambBuffer(ac, id) {
    const sr = ac.sampleRate, L = Math.floor(sr * AMB_LEN), fade = Math.floor(sr * 1.2), buf = ac.createBuffer(2, L, sr);
    for (let ch = 0; ch < 2; ch++) { const rnd = ambRng(7919 * (ch + 1) + id.length * 131 + id.charCodeAt(0) * 17); const d = AMB_GEN[id](sr, L, fade, rnd); buf.copyToChannel(d instanceof Float32Array && d.length === L ? d : d.subarray(0, L), ch); }
    return buf;
}

/* ---------- the engine: Web Audio mix -> MediaStream -> <audio> ---------- */
const AMB_ENG = { ac: null, audio: null, master: null, fade: null, dest: null, srcs: {}, bufs: {}, playing: false, timer: null, tick: null, endsAt: 0 };
function ambEnsure() {
    const E = AMB_ENG;
    if (E.ac) { if (E.ac.state !== 'running') E.ac.resume(); return true; }
    try { sndUnlock(); } catch { /* ignore */ }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const ac = new AC();
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.knee.value = 12; comp.attack.value = 0.01; comp.release.value = 0.3;
    E.master = ac.createGain(); E.fade = ac.createGain(); E.fade.gain.value = 0;
    E.master.connect(E.fade); E.fade.connect(comp);
    try {
        E.dest = ac.createMediaStreamDestination(); comp.connect(E.dest);
        E.audio = document.createElement('audio'); E.audio.setAttribute('playsinline', ''); E.audio.srcObject = E.dest.stream; E.audio.style.display = 'none'; document.body.appendChild(E.audio);
    } catch { comp.connect(ac.destination); E.audio = null; }
    E.ac = ac;
    return true;
}
function ambCurve(v) { return Math.pow(Math.max(0, Math.min(1, v)), 1.7); }
/* real recordings (sounds/*.mp3, listed in sounds/index.json): loaded on demand, cached by the service worker.
   While a recording is not available (first use offline, file missing), the synthesized version plays instead. */
const AMB_REAL = { idx: null, idxP: null, bufs: {}, loading: {} };
function ambRealIndex() {
    if (!AMB_REAL.idxP) AMB_REAL.idxP = fetch('sounds/index.json').then(r => (r.ok ? r.json() : null)).catch(() => null).then(j => { AMB_REAL.idx = j; AMB_REAL.done = true; return j; });
    return AMB_REAL.idxP;
}
function ambRealLoad(id) {
    const E = AMB_ENG, info = AMB_REAL.idx && AMB_REAL.idx[id];
    if (!info || !E.ac || AMB_REAL.bufs[id] || AMB_REAL.loading[id]) return;
    AMB_REAL.loading[id] = true;
    fetch('sounds/' + info.f).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('http')))).then(ab => new Promise((ok, ko) => E.ac.decodeAudioData(ab, ok, ko)))
        .then(buf => { AMB_REAL.bufs[id] = { buf, ls: info.pad / info.sr, le: (info.pad + info.len) / info.sr }; if (E.ac) ambApply(); })
        .catch(() => { AMB_REAL.bufs[id] = null; }).finally(() => { delete AMB_REAL.loading[id]; });
}
function ambApply() {
    const E = AMB_ENG; if (!E.ac) return;
    const t = E.ac.currentTime;
    E.master.gain.setTargetAtTime(ambCurve(AMB.master) * 1.3, t, 0.08);
    const kill = s => { setTimeout(() => { try { s.src.stop(); s.src.disconnect(); s.g.disconnect(); } catch { /* ignore */ } }, 700); };
    AMB_SOUNDS.forEach(([id]) => {
        const v = AMB.vols[id] || 0;
        let s = E.srcs[id];
        const key = ambKey(id), real = AMB_REAL.bufs[key];
        if (v > 0.001) {
            if (!AMB_REAL.idxP) ambRealIndex().then(() => { if (AMB_ENG.ac) ambApply(); });   // once: if the index cannot be read, the generated sounds keep playing
            else if (AMB_REAL.idx && AMB_REAL.idx[key] && real === undefined) ambRealLoad(key);
        }
        /* swap a synthesized source for the real recording as soon as it is ready, or change the singing-bowl style */
        if (s && ((real && s.kind !== 'real') || (s.key && s.key !== key))) { s.g.gain.setTargetAtTime(0, t, 0.25); kill(s); delete E.srcs[id]; s = null; }
        if (v > 0.001 && !s) {
            const src = E.ac.createBufferSource(), g = E.ac.createGain();
            let kind = 'synth';
            if (real) { src.buffer = real.buf; src.loopStart = real.ls; src.loopEnd = real.le; kind = 'real'; src.loop = true; g.gain.value = 0; src.connect(g); g.connect(E.master); src.start(0, real.ls + Math.random() * (real.le - real.ls)); }
            else {
                if (!E.bufs[id]) E.bufs[id] = ambBuffer(E.ac, id);
                src.buffer = E.bufs[id]; src.loop = true; g.gain.value = 0; src.connect(g); g.connect(E.master); src.start(0, Math.random() * AMB_LEN);
            }
            s = E.srcs[id] = { src, g, kind, key };
        }
        if (s) { s.g.gain.setTargetAtTime(ambCurve(v), t, 0.12); if (v <= 0.001) { const dead = s; delete E.srcs[id]; kill(dead); } }
    });
}
function ambPlay() {
    const E = AMB_ENG;
    if (!ambEnsure()) return false;
    if (!Object.values(AMB.vols).some(v => v > 0.001)) { AMB.vols = { rain: 0.5, wind: 0.2 }; ambSave(); }
    ambApply();
    E.fade.gain.cancelScheduledValues(E.ac.currentTime); E.fade.gain.setTargetAtTime(1, E.ac.currentTime, 0.6);
    E.playing = true;
    if (E.audio) { const p = E.audio.play(); if (p && p.catch) p.catch(() => { /* needs a tap: the button is one */ }); }
    ambMedia();
    ambTimerArm();
    return true;
}
function ambPause(fast) {
    const E = AMB_ENG; if (!E.ac || !E.playing) return;
    E.playing = false;
    E.fade.gain.cancelScheduledValues(E.ac.currentTime); E.fade.gain.setTargetAtTime(0, E.ac.currentTime, fast ? 0.05 : 0.7);
    clearTimeout(E.timer); clearInterval(E.tick);
    setTimeout(() => { if (!E.playing && E.audio) { try { E.audio.pause(); } catch { /* ignore */ } } }, fast ? 200 : 2800);
    try { if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'; } catch { /* ignore */ }
}
function ambMedia() {
    try {
        if (!('mediaSession' in navigator)) return;
        navigator.mediaSession.metadata = new MediaMetadata({ title: 'Ambiance sonore', artist: 'LH Cards', album: 'Concentration', artwork: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }] });
        navigator.mediaSession.playbackState = 'playing';
        navigator.mediaSession.setActionHandler('play', () => { ambPlay(); window.app && app.ambRefresh(); });
        navigator.mediaSession.setActionHandler('pause', () => { ambPause(); window.app && app.ambRefresh(); });
    } catch { /* ignore */ }
}
function ambTimerArm() {
    const E = AMB_ENG; clearTimeout(E.timer); clearInterval(E.tick); E.endsAt = 0;
    if (!AMB.timer) return;
    E.endsAt = Date.now() + AMB.timer * 60000;
    E.timer = setTimeout(() => { ambPause(); if (window.app) { app.ambRefresh(); app.toast('Ambiance sonore arrêtée (minuteur)', 'success'); } }, AMB.timer * 60000);
    E.tick = setInterval(() => { if (window.app) app.ambRefresh(true); }, 15000);
}
const AMB_PRESETS = {
    'Pluie douce': { rain: 0.6, wind: 0.15 }, 'Orage': { rain: 0.55, thunder: 0.6, wind: 0.3 }, 'Plage': { waves: 0.7, wind: 0.25, birds: 0.15 },
    'Forêt': { birds: 0.45, stream: 0.4, leaves: 0.25, wind: 0.15 }, 'Cheminée': { fire: 0.7, rain: 0.2 }, 'Café': { cafe: 0.7, rain: 0.15 },
    'Nuit': { crickets: 0.5, wind: 0.2, stream: 0.25 }, 'Provence': { cicadas: 0.6, wind: 0.15, birds: 0.1 }, 'Concentration': { brown: 0.5, rain: 0.25 }
};

Object.assign(SuperAnki.prototype, {
    ambientSettingsHtml() {
        const on = AMB_ENG.playing, left = AMB_ENG.endsAt ? Math.max(0, Math.ceil((AMB_ENG.endsAt - Date.now()) / 60000)) : 0;
        const presets = [...Object.keys(AMB_PRESETS).map(n => ({ n, built: true })), ...AMB.presets.map(p => ({ n: p.name, user: true }))];
        return `<div class="panel panel-pad set-section" id="amb-panel">
            <h3>${ic('volume')} Ambiance sonore</h3>
            <p class="small muted">Des sons doux en fond pour te concentrer, à mélanger comme tu veux. Rien n'est affiché ailleurs dans l'appli : tout se règle ici. L'ambiance continue quand l'écran se verrouille sur la plupart des téléphones (à confirmer sur le tien) ; coupe-la depuis l'écran de verrouillage ou ici.</p>
            <div class="amb-top"><button class="btn btn-primary" data-amb="toggle" id="amb-toggle">${ic(on ? 'pause' : 'play')}<span>${on ? 'Mettre en pause' : 'Lancer l\'ambiance'}</span></button>
                <button class="btn btn-soft btn-sm" data-amb="random">Mélange au hasard</button><button class="btn btn-soft btn-sm" data-amb="zero">Tout à zéro</button></div>
            <div class="amb-row"><label for="amb-master">Volume général</label><input type="range" id="amb-master" min="0" max="100" value="${Math.round(AMB.master * 100)}"></div>
            <div class="amb-grid">${AMB_SOUNDS.map(([id, em, name]) => `<label class="amb-tile ${(AMB.vols[id] || 0) > 0 ? 'on' : ''}" data-s="${id}"><span class="amb-name"><span aria-hidden="true">${em}</span>${name}</span><input type="range" class="amb-range" data-s="${id}" min="0" max="100" value="${Math.round((AMB.vols[id] || 0) * 100)}" aria-label="${name}"></label>`).join('')}</div>
            <div class="amb-row"><label for="amb-bowl">🔔 Style du bol chantant</label><select class="select select-sm" id="amb-bowl">${AMB_BOWLS.map(([v, l]) => `<option value="${v}" ${AMB.bowl === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
            <div class="amb-row"><span class="label">Mélanges</span><span class="amb-presets">${presets.map(p => `<button class="chip" data-amb="preset" data-n="${esc(p.n)}">${esc(p.n)}</button>${p.user ? `<button class="icon-btn icon-btn-sm" data-amb="del" data-n="${esc(p.n)}" aria-label="Supprimer ${esc(p.n)}">${ic('x')}</button>` : ''}`).join('')}<button class="chip" data-amb="save">${ic('plus')}Enregistrer le mien</button></span></div>
            <details class="amb-credits"><summary>Crédits des enregistrements</summary><div id="amb-credits-body">${this.ambCreditsHtml()}</div></details>
            <div class="amb-row"><label for="amb-timer">Arrêt automatique</label><select class="select select-sm" id="amb-timer">${[[0, 'Jamais'], [15, '15 min'], [30, '30 min'], [45, '45 min'], [60, '1 h'], [90, '1 h 30'], [120, '2 h']].map(([v, l]) => `<option value="${v}" ${AMB.timer === v ? 'selected' : ''}>${l}</option>`).join('')}</select><span class="small faint" id="amb-left">${on && left ? `encore ~${left} min` : ''}</span></div>
            <div class="set-row"><div class="txt"><b>Suivre le minuteur de concentration</b><span>L'ambiance joue pendant le temps de travail et se met en pause pendant les pauses.</span></div><label class="switch"><input type="checkbox" id="amb-link" ${AMB.link ? 'checked' : ''} aria-label="Suivre le minuteur"><span></span></label></div>
        </div>`;
    },
    ambCreditsHtml() {
        const idx = AMB_REAL.idx;
        if (!idx) {
            if (AMB_REAL.done) return '<p class="small muted">Les enregistrements ne sont pas disponibles ici (hors ligne ou fichier ouvert directement) : les sons générés par l\'appli sont utilisés.</p>';
            ambRealIndex().then(() => { const b = $('#amb-credits-body'); if (b) b.innerHTML = this.ambCreditsHtml(); });
            return '<p class="small muted">Chargement…</p>';
        }
        const item = (em, name, c) => `<li><b>${em} ${name}</b> — ${esc(c.credit || '')}${c.lic ? ` · ${esc(c.lic)}` : ''}${c.src ? ` · <a href="${esc(c.src)}" target="_blank" rel="noopener">source</a>` : ''}</li>`;
        const rows = AMB_SOUNDS.flatMap(([id, em, name]) => (id === 'bowl' ? AMB_BOWLS.filter(b => idx['bowl_' + b[0]]).map(b => item(em, name, idx['bowl_' + b[0]])) : idx[id] ? [item(em, name, idx[id])] : []));
        const synth = AMB_SOUNDS.filter(([id]) => (id === 'bowl' ? !AMB_BOWLS.some(b => idx['bowl_' + b[0]]) : !idx[id])).map(x => x[2]).join(', ');
        return `<p class="small muted">Vrais enregistrements libres de droits (domaine public, CC0 ou CC BY), recoupés et mis en boucle pour l'appli.${synth ? ` Sons générés par l'appli : ${esc(synth)}.` : ''}</p><ul class="amb-credit-list">${rows.join('')}</ul>`;
    },
    ambRefresh(light) {
        const b = $('#amb-toggle'); if (!b) return;
        const on = AMB_ENG.playing;
        if (!light) b.innerHTML = `${ic(on ? 'pause' : 'play')}<span>${on ? 'Mettre en pause' : 'Lancer l\'ambiance'}</span>`;
        const l = $('#amb-left'); if (l) { const m = AMB_ENG.endsAt ? Math.max(0, Math.ceil((AMB_ENG.endsAt - Date.now()) / 60000)) : 0; l.textContent = on && m ? `encore ~${m} min` : ''; }
    },
    ambInit() {
        document.addEventListener('input', e => {
            const t = e.target;
            if (t.id === 'amb-master') { AMB.master = Number(t.value) / 100; ambSave(); ambApply(); }
            else if (t.classList && t.classList.contains('amb-range')) {
                AMB.vols[t.dataset.s] = Number(t.value) / 100; ambSave();
                const tile = t.closest('.amb-tile'); if (tile) tile.classList.toggle('on', Number(t.value) > 0);
                if (AMB_ENG.playing) ambApply();
            }
        });
        document.addEventListener('change', e => {
            const t = e.target;
            if (t.id === 'amb-timer') { AMB.timer = Number(t.value); ambSave(); if (AMB_ENG.playing) ambTimerArm(); this.ambRefresh(); }
            else if (t.id === 'amb-link') { AMB.link = t.checked; ambSave(); this.ambSyncFocus(); }
            else if (t.id === 'amb-bowl') { AMB.bowl = t.value; ambSave(); if (AMB_ENG.ac && (AMB.vols.bowl || 0) > 0.001) ambApply(); else if (!AMB_ENG.playing) { AMB.vols.bowl = Math.max(AMB.vols.bowl || 0, 0.55); ambSave(); const r = $('.amb-range[data-s="bowl"]'); if (r) r.value = 55; const tl = $('.amb-tile[data-s="bowl"]'); if (tl) tl.classList.add('on'); } }
        });
        document.addEventListener('click', async e => {
            const b = e.target.closest('[data-amb]'); if (!b) return;
            const a = b.dataset.amb;
            const redraw = () => { const p = $('#amb-panel'); if (p) { const y = window.scrollY; p.outerHTML = this.ambientSettingsHtml(); window.scrollTo(0, y); } };
            if (a === 'toggle') { if (AMB_ENG.playing) ambPause(); else if (!ambPlay()) this.toast('Le son n\'est pas disponible sur ce navigateur.', 'warning'); this.ambRefresh(); }
            else if (a === 'zero') { AMB.vols = {}; ambSave(); if (AMB_ENG.ac) ambApply(); redraw(); }
            else if (a === 'random') {
                const ids = AMB_SOUNDS.map(x => x[0]).sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 2));
                AMB.vols = {}; ids.forEach(id => { AMB.vols[id] = 0.25 + Math.random() * 0.5; }); ambSave(); if (AMB_ENG.playing) ambApply(); redraw();
            }
            else if (a === 'preset') {
                const mix = AMB_PRESETS[b.dataset.n] || (AMB.presets.find(p => p.name === b.dataset.n) || {}).vols;
                if (mix) { AMB.vols = { ...mix }; ambSave(); if (AMB_ENG.playing) ambApply(); redraw(); }
            }
            else if (a === 'save') {
                const name = (await this.promptText?.({ title: 'Nom du mélange', placeholder: 'Ex : Révisions du soir' })) || window.prompt('Nom du mélange ?');
                if (name && name.trim()) { const nm = name.trim().slice(0, 24); AMB.presets = AMB.presets.filter(p => p.name !== nm); AMB.presets.push({ name: nm, vols: { ...AMB.vols } }); AMB.presets = AMB.presets.slice(-12); ambSave(); redraw(); }
            }
            else if (a === 'del') { AMB.presets = AMB.presets.filter(p => p.name !== b.dataset.n); ambSave(); redraw(); }
        });
        /* follow the focus timer: play while studying, pause on breaks and when it is stopped */
        const base = SuperAnki.prototype.focusRender;
        if (typeof base === 'function') SuperAnki.prototype.focusRender = function (...a) { const r = base.apply(this, a); try { this.ambSyncFocus(); } catch { /* ignore */ } return r; };
    },
    ambSyncFocus() {
        const f = this.focus; if (!AMB.link || !f) return;
        const want = f.running && f.phase === 'study';
        if (want && !AMB_ENG.playing) { if (ambPlay()) this.ambRefresh(); }
        else if (!want && AMB_ENG.playing) { ambPause(); this.ambRefresh(); }
    }
});
