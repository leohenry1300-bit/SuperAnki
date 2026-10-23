/* ============================================================
   Sounds (pleasant, synthesized with Web Audio: no file) + "update now" button.
   - UI sounds: reveal, grades, quiz right/wrong, end of session. On/off + volume, kept on this device.
   - Bell sounds for the focus timer: a list to choose from, one for the end of study and one for the end of the break.
   ============================================================ */
const SND_KEY = 'superanki_sound';
const SND = (() => { let st = { on: true, ui: true, tab: 'swipe', vol: 0.5, mode: 'mix' }; try { const x = JSON.parse(localStorage.getItem(SND_KEY) || 'null'); if (x && typeof x === 'object') st = { on: x.on !== false, ui: x.ui !== false, tab: ['swipe', 'bubble', 'click', 'none'].includes(x.tab) ? x.tab : 'swipe', vol: Math.min(1, Math.max(0, Number(x.vol) || 0.5)), mode: 'mix' }; } catch { /* ignore */ } return st; })();
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
/* tiny interface sounds: very short and quiet, in the same scale */
Object.assign(SFX, {
    /* tab change: choose in the settings (soft swipe by default) */
    tabswipe: (ac, o, t, v) => { const n = Math.floor(ac.sampleRate * 0.16), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let k = 0; k < n; k++) { const x = k / n; d[k] = (Math.random() * 2 - 1) * Math.sin(Math.PI * x) * Math.sin(Math.PI * x); } const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'bandpass'; f.Q.value = 0.8; f.frequency.setValueAtTime(700, t); f.frequency.exponentialRampToValueAtTime(2600, t + 0.15); g.gain.value = v * 0.34; s.buffer = b; s.connect(f); f.connect(g); g.connect(o); s.start(t); },
    tabbubble: (ac, o, t, v) => { const x = sndOsc(ac, sndLP(ac, o, 2600), 'sine', 380, t, 0.2, v * 0.17, 0.006, 0.05); x.o.frequency.exponentialRampToValueAtTime(620, t + 0.08); },
    tabclick: (ac, o, t, v) => { iMarimba(ac, o, t, NOTE.C5, v * 0.12, 0.09); },
    tap: (ac, o, t, v) => { iMarimba(ac, o, t, NOTE.E5, v * 0.15, 0.12); },
    on: (ac, o, t, v) => { iGlass(ac, o, t, NOTE.C6, v * 0.16, 0.35); iGlass(ac, o, t + 0.06, NOTE.G6, v * 0.16, 0.4); },
    off: (ac, o, t, v) => { iGlass(ac, o, t, NOTE.G6, v * 0.12, 0.3); iGlass(ac, o, t + 0.06, NOTE.C6, v * 0.12, 0.35); },
    select: (ac, o, t, v) => { iPluck(ac, o, t, NOTE.A5, v * 0.18, 0.3); },
    tick: (ac, o, t, v) => { iMarimba(ac, o, t, NOTE.D5, v * 0.13, 0.12); },
    open: (ac, o, t, v) => { iPuff(ac, o, t, 0.08, v * 0.22, 1800); iGlass(ac, o, t + 0.02, NOTE.E6, v * 0.11, 0.3); },
    close: (ac, o, t, v) => { iPuff(ac, o, t, 0.06, v * 0.16, 1400); iGlass(ac, o, t + 0.01, NOTE.A5, v * 0.09, 0.25); },
    success: (ac, o, t, v) => { iPluck(ac, o, t, NOTE.G5, v * 0.2, 0.4); iPluck(ac, o, t + 0.07, NOTE.D6, v * 0.2, 0.5); },
    error: (ac, o, t, v) => { iPad(ac, o, t, NOTE.A4, v * 0.14, 0.25); iMarimba(ac, o, t + 0.07, NOTE.E4, v * 0.14, 0.3); }
});
let SND_LAST = 0, SND_LAST_NAME = '';
function sfxUi(name) {
    if (!SND.on || !SND.ui) return;
    const now = performance.now();
    if (now - SND_LAST < 110) return;            // a bigger sound just played (or another tiny one): stay quiet
    sfx(name);
}
function sfx(name) {
    if (!SND.on || !SFX[name]) return;
    try { if (navigator.vibrate) { if (name === 'right' || name === 'g3' || name === 'g4') navigator.vibrate(12); else if (name === 'wrong' || name === 'g1') navigator.vibrate([18, 40, 18]); } } catch { /* ignore */ }
    const ac = sndCtx(); if (!ac) return;
    SND_LAST = performance.now(); SND_LAST_NAME = name;
    if (sndClipsOk()) { const c = sndClip(name, SFX[name], name === 'done' ? 3 : 1.6); if (c) { sndPlayClip(c); return; } }   // clip not ready yet: the synth plays this once
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
    if (sndClipsOk()) {
        const key = 'ring:' + id + (repeat ? ':2' : ':1'), c = sndClip(key, (a, o, t, v) => { [0, ...(repeat ? [r.len + 0.5] : [])].forEach(d => r.play(a, o, t + d, Math.max(0.4, v) * 1.1)); }, r.len * (repeat ? 2 : 1) + 1.5);
        if (c) { sndPlayClip(c); return; }
    }
    const v = Math.max(0.4, SND.vol) * 1.1, t0 = ac.currentTime + 0.05, bus = sndChain(ac).bus;
    try { [0, ...(repeat ? [r.len + 0.5] : [])].forEach(d => r.play(ac, bus, t0 + d, v)); } catch { /* ignore */ }
}


/* Installed web app on iPhone: the ring/silent switch mutes Web Audio but never a real <audio> clip. So there each sound is rendered once
   (same synth, drawn offline into a WAV) and played through a normal audio element: it is heard exactly like in Safari. */
function sndClipsOk() { return sndStandalone() && (!!navigator.audioSession || SND.mode === 'prio') && !!(window.OfflineAudioContext || window.webkitOfflineAudioContext); }
function sndStandalone() { try { return navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches; } catch { return false; } }
const SND_CLIPS = {};   // key -> { url } once rendered, 'wait' while rendering
const SND_ELS = [];     // a few audio elements, unlocked by a real touch, reused for every clip (iOS only allows play() on elements a touch has started)
let SND_ELI = 0;
function sndWav(buf) {
    const ch = Math.min(2, buf.numberOfChannels), n = buf.length, out = new ArrayBuffer(44 + n * ch * 2), v = new DataView(out), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
    v.setUint32(24, buf.sampleRate, true); v.setUint32(28, buf.sampleRate * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * ch * 2, true);
    const d = []; for (let c = 0; c < ch; c++) d.push(buf.getChannelData(c));
    let o = 44; for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const x = Math.max(-1, Math.min(1, d[c][i])); v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true); o += 2; }
    return new Blob([out], { type: 'audio/wav' });
}
async function sndRender(key, play, secs) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!OAC) return null;
    const sr = 44100, oac = new OAC(2, Math.ceil(sr * secs), sr);
    play(oac, sndChain(oac).bus, 0.02, 0.8);
    const buf = await oac.startRendering();
    return URL.createObjectURL(sndWav(buf));
}
const SND_PROM = {};
function sndClipP(key, play, secs) {   // promise of the clip (rendered once)
    if (!SND_PROM[key]) SND_PROM[key] = sndRender(key, play, secs).then(url => { if (url) SND_CLIPS[key] = { url }; return SND_CLIPS[key] || null; }).catch(() => null);
    return SND_PROM[key];
}
function sndClip(key, play, secs) { const c = SND_CLIPS[key]; if (c) return c; sndClipP(key, play, secs); return null; }
/* called on a real touch: wakes the audio elements with a silent clip so later plays (timers, auto-advance, after rendering) are allowed */
function sndWake() {
    try {
        if (SND_ELS.length) return;
        const n = 2205, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
        w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
        v.setUint32(24, 22050, true); v.setUint32(28, 44100, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
        const url = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
        for (let i = 0; i < 6; i++) { const a = new Audio(url); a.setAttribute('playsinline', ''); a.volume = 0.01; SND_ELS.push(a); const p = a.play(); if (p && p.then) p.then(() => a.pause()).catch(() => { SND_ELS.length = 0; }); }
    } catch { SND_ELS.length = 0; }
}
/* plays a clip; resolves to 'ok' or to the name of the error (NotAllowedError = blocked by iOS) */
function sndPlayClip(c) {
    try {
        if (!SND_ELS.length) sndWake();
        const a = SND_ELS[SND_ELI = (SND_ELI + 1) % Math.max(1, SND_ELS.length)]; if (!a) return Promise.resolve('noelement');
        if (a.src !== c.url) a.src = c.url;
        a.volume = Math.max(0.05, Math.min(1, SND.vol / 0.8)); a.currentTime = 0;
        const p = a.play(); return p && p.then ? p.then(() => 'ok', e => (e && e.name) || 'error') : Promise.resolve('ok');
    } catch (e) { return Promise.resolve((e && e.name) || 'error'); }
}
function sndDiagText() {
    const ac = window.app && window.app.audioCtx;
    return `Volume ${Math.round(SND.vol * 100)} % · app installée : ${sndStandalone() ? 'oui' : 'non'} · lecteur : ${sndClipsOk() ? 'fichiers audio' : 'synthé direct'} · état : ${ac ? ac.state : 'en attente'}`;
}
function sndDiag() { const el = document.getElementById('snd-diag'); if (el) el.textContent = sndDiagText(); }
function sndPrerender() { ['reveal', 'g1', 'g2', 'g3', 'g4', 'right', 'wrong', 'done', 'tap', 'pop'].forEach((n, i) => setTimeout(() => SFX[n] && sndClip(n, SFX[n], n === 'done' ? 3 : 1.6), 300 + i * 120)); }

/* iPhone: Web Audio is muted by the ring/silent switch and needs a real touch to start.
   On the first tap we (1) ask for the "playback" audio session, (2) play one silent <audio> clip (what makes iOS treat the page as media),
   (3) resume the context and play a silent buffer. After that every sound works, switch or not. */
/* the audio session decides who wins on the iPhone: "ambient" mixes our small sounds with the music you are listening to (it never stops it),
   "playback" (used only while the ambiance mixer runs, so it can go on with the screen locked) takes the audio over */
function sndSession(t) { try { if (navigator.audioSession && navigator.audioSession.type !== t) navigator.audioSession.type = t; } catch { /* ignore */ } }
sndSession(SND.mode === 'prio' ? 'playback' : 'ambient');
const SND_UNLOCK = { done: false };
function sndUnlock() {
    sndSession((typeof AMB_ENG !== 'undefined' && AMB_ENG.playing) || SND.mode === 'prio' ? 'playback' : 'ambient');
    const ac = sndCtx(); if (!ac) return;
    try { const b = ac.createBuffer(1, 1, 22050), s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.start(0); } catch { /* ignore */ }
    if (sndClipsOk()) sndWake();
    if (SND_UNLOCK.done) return;
    SND_UNLOCK.done = true;
    if (sndClipsOk()) sndPrerender();
}
/* installed web app on iPhone: Web Audio stays muted unless the page is "playing media". A silent clip played in a loop
   (in the page, not muted, a hair above silence) keeps the "playback" audio session alive, so the sounds are heard like in Safari. */
let SND_KEEP = null;
function sndKeepAlive() {
    try {
        if (!SND_KEEP) {
            const n = 22050, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
            w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
            v.setUint32(24, 22050, true); v.setUint32(28, 44100, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
            for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, i % 2 ? 2 : -2, true);   // inaudible (±2 of 32768), but not digital silence
            SND_KEEP = new Audio(URL.createObjectURL(new Blob([buf], { type: 'audio/wav' })));
            SND_KEEP.loop = true; SND_KEEP.volume = 0.05; SND_KEEP.setAttribute('playsinline', ''); SND_KEEP.setAttribute('webkit-playsinline', ''); SND_KEEP.preload = 'auto';
            SND_KEEP.style.display = 'none'; document.body.appendChild(SND_KEEP);
            SND_KEEP.addEventListener('pause', () => { /* resumed on the next touch */ });
        }
        if (SND_KEEP.paused) { const p = SND_KEEP.play(); if (p && p.catch) p.catch(() => { SND_UNLOCK.done = false; }); }
    } catch { /* ignore */ }
}
['touchend', 'pointerup', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, () => { if (!SND_UNLOCK.done || (window.app && window.app.audioCtx && window.app.audioCtx.state !== 'running')) sndUnlock(); }, { passive: true, capture: true }));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && SND_KEEP) { try { SND_KEEP.pause(); } catch { /* ignore */ } } if (document.visibilityState === 'visible') { const a = window.app && window.app.audioCtx; if (a && a.state !== 'running') { try { a.resume(); } catch { /* ignore */ } } } });

/* hook the sounds on the study actions (wrapping the existing methods: nothing duplicated) */
(() => {
    const P = SuperAnki.prototype, wrap = (name, fn) => { const o = P[name]; if (typeof o !== 'function') return; P[name] = function (...a) { const pre = fn.pre ? fn.pre.call(this, ...a) : null; const r = o.apply(this, a); try { fn.post.call(this, pre, ...a); } catch { /* ignore */ } return r; }; };
    wrap('reveal', { pre() { const s = this.session; return !!(s && s.current && !s.revealed); }, post(was) { if (was && this.session && this.session.revealed) sfx('reveal'); } });
    wrap('grade', { pre() { const s = this.session; return !!(s && s.kind === 'srs' && s.revealed); }, post(was, g) { if (was) sfx('g' + g); } });
    wrap('practiceAnswer', { pre() { const s = this.session; return !!(s && s.kind === 'practice' && s.revealed); }, post(was, ok) { if (was) sfx(ok ? 'right' : 'wrong'); } });
    wrap('quizAnswer', { pre(i) { const s = this.session; return s && !s.answered && s.options && s.options[i] ? s.options[i].ok : null; }, post(ok) { if (ok !== null) sfx(ok ? 'right' : 'wrong'); } });
    wrap('showSummary', { post() { sfx('done'); } });
    wrap('openModal', { post() { sfxUi('open'); } });
    wrap('closeModal', { pre() { return !!(this.modals && this.modals.length); }, post(had) { if (had) sfxUi('close'); } });
    wrap('toast', { post(_, msg, type) { if (type === 'success') sfxUi('success'); else if (type === 'error' || type === 'warning') sfxUi('error'); } });
})();

/* ---------- "update now" ---------- */
let APP_VER0 = null, APP_UPD_LAST = 0;
function appFetchVer() {
    return fetch('sw.js?v=' + Date.now(), { cache: 'no-store' }).then(r => (r.ok ? r.text() : '')).then(t => ((t.match(/Version:\s*(\S+)/) || [])[1] || null)).catch(() => null);
}
Object.assign(SuperAnki.prototype, {
    extrasInit() {
        if (/^https?:/.test(location.protocol)) {
            appFetchVer().then(v => { APP_VER0 = v; this.updRefresh(); });
            document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - APP_UPD_LAST > 10 * 60000) this.updCheck(true); });
            setInterval(() => { if (Date.now() - APP_UPD_LAST > 30 * 60000) this.updCheck(true); }, 5 * 60000);
        }
        document.addEventListener('click', e => {
            const b = e.target.closest('[data-ex]'); if (!b) return;
            const a = b.dataset.ex;
            if (a === 'upd') this.updNow();
            else if (a === 'snd-toggle') { SND.on = !SND.on; sndSave(); this.updRefresh(); this.extrasSoundRefresh(); if (SND.on) sfx('pop'); }
            else if (a === 'ui-toggle') { SND.ui = !SND.ui; sndSave(); if (SND.ui) sfx('on'); }
            else if (a === 'snd-test') {
                sndUnlock();
                if (sndClipsOk()) {
                    sndClipP('g3', SFX.g3, 1.6).then(async c => {
                        if (!c) { this.toast('Ce téléphone ne peut pas préparer les sons.', 'warning'); return; }
                        const r = await sndPlayClip(c); setTimeout(() => sndPlayClip(SND_CLIPS.g3), 380);
                        this.toast(r === 'ok' ? 'Son envoyé. Si tu n\'entends rien : monte le volume (boutons du côté) et vérifie l\'interrupteur silencieux.' : `Son refusé par iOS (${r}). Touche l\'écran puis réessaie.`, r === 'ok' ? 'success' : 'warning');
                    });
                } else { sfx('g3'); setTimeout(() => sfx('right'), 450); }
            }
            else if (a === 'snd-play') { const was = SND.on; SND.on = true; sfx(b.dataset.n); SND.on = was; }
            else if (a === 'ring-test') ringPlay(b.dataset.id, false);
        });
        /* tiny interface sounds: tabs, switches, choices, buttons */
        document.addEventListener('click', e => {
            const t = e.target;
            if (!t.closest || t.closest('.modal-back [data-close]')) return;
            if (t.closest('[data-nav]')) { if (SND.tab !== 'none') sfxUi('tab' + SND.tab); }
            else if (t.closest('.segmented button, .chip, .theme-opt, [data-action="set"], [data-action="filter"]')) sfxUi('select');
            else if (t.closest('.btn, .icon-btn, .mode-tile, .deck-card button')) sfxUi('tap');
        });
        document.addEventListener('change', e => {
            const t = e.target;
            if (t.type === 'checkbox' && !t.closest('#fw-sound-x')) sfxUi(t.checked ? 'on' : 'off');
            else if (t.type === 'range') sfxUi('tick');
            else if (t.tagName === 'SELECT') sfxUi('select');
        });
        document.addEventListener('input', e => { if (e.target.id === 'snd-vol') { SND.vol = Number(e.target.value) / 100; sndSave(); } });
        document.addEventListener('change', e => {
            if (e.target.id === 'snd-vol') sfx('pop');
            else if (e.target.id === 'snd-mode') { SND.mode = e.target.value === 'prio' ? 'prio' : 'mix'; sndSave(); sndSession(SND.mode === 'prio' ? 'playback' : 'ambient'); sndDiag(); sfx('g3'); }
            else if (e.target.id === 'snd-tab') { SND.tab = e.target.value; sndSave(); if (SND.tab !== 'none') setTimeout(() => { if (SND.on) sfx('tab' + SND.tab); }, 160); }
        });
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
            <h3>${ic('volume')} Sons</h3>
            <div class="set-row"><div class="txt"><b>Sons de l'application</b><span>Petits sons doux quand tu retournes une carte, réponds ou termines une session. Réglage propre à cet appareil.</span></div>
                <span style="display:flex;gap:10px;align-items:center"><label class="switch"><input type="checkbox" ${SND.on ? 'checked' : ''} data-ex="snd-toggle" aria-label="Sons de l'application"><span></span></label><button class="btn btn-soft btn-sm" data-ex="snd-test">Tester</button></span></div>
            <div class="set-row" style="flex-wrap:wrap"><div class="txt"><b>Écouter chaque son</b></div><span style="display:flex;gap:6px;flex-wrap:wrap">${[['reveal', 'Retourner'], ['g1', 'Raté'], ['g2', 'Difficile'], ['g3', 'Bien'], ['g4', 'Facile'], ['wrong', 'Faux'], ['right', 'Juste'], ['done', 'Fin de session']].map(([n, l]) => `<button class="chip" data-ex="snd-play" data-n="${n}">${l}</button>`).join('')}</span></div>
            <div class="set-row"><div class="txt"><b>Petits sons d'interface</b><span>Un tout petit son discret quand tu changes d'onglet, actives un réglage, ouvres une fenêtre…</span></div>
                <label class="switch"><input type="checkbox" ${SND.ui ? 'checked' : ''} data-ex="ui-toggle" aria-label="Petits sons d'interface"><span></span></label></div>
            <div class="set-row"><div class="txt"><b>Son du changement d'onglet</b></div>
                <select class="select select-sm" id="snd-tab" aria-label="Son du changement d'onglet">${[['swipe', 'Souffle doux'], ['bubble', 'Bulle'], ['click', 'Petit clic'], ['none', 'Aucun']].map(([v, l]) => `<option value="${v}" ${SND.tab === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
            <div class="set-row"><div class="txt"><b>Volume</b></div><input type="range" id="snd-vol" min="5" max="100" value="${Math.round(SND.vol * 100)}" style="width:160px" aria-label="Volume"></div>
        </div>`;
    },
    extrasSoundRefresh() { const cb = $('#ex-settings input[data-ex="snd-toggle"]'); if (cb) cb.checked = SND.on; }
});


/* Settings: the page is regrouped into clear sections (Révision / Sons / Apparence / Données / Avancé),
   advanced panels fold away, and a sticky row of shortcuts jumps to a section. Done on the DOM after each render. */
Object.assign(SuperAnki.prototype, {
    settingsNav() {
        const root = document.getElementById('view-settings'); if (!root) return;
        const stack = root.querySelector('.settings') || root.firstElementChild; if (!stack) return;
        root.querySelectorAll('.set-nav, .set-group').forEach(n => n.remove());
        const all = [...root.querySelectorAll('.set-section')];
        const title = p => ((p.querySelector('h3') || {}).textContent || '').replace(/\s+/g, ' ').trim();
        const by = re => all.find(p => re.test(title(p)));
        const rowOf = re => [...root.querySelectorAll('.set-row')].find(r => re.test(((r.querySelector('.txt > b') || {}).textContent || '')));
        const P = { upd: document.getElementById('ex-update'), rev: by(/^Révision/), goal: by(/^Objectif/), algo: document.getElementById('study-options'), fsrs: document.getElementById('fsrs-panel'),
            snd: document.getElementById('ex-settings'), amb: document.getElementById('amb-panel'), theme: by(/^Thème/), cloud: by(/^Synchronisation/), data: by(/^Données/), tools: by(/^Outils/), keys: by(/^Raccourcis/) };
        if (P.rev) { const h = P.rev.querySelector('h3'); if (h && h.lastChild && h.lastChild.nodeType === 3) h.lastChild.textContent = ' Séance de révision'; }
        /* settings that were in "Données" but belong to the review: moved to "Révision" */
        if (P.rev) ['Réviser par petits groupes', 'Équilibrer la charge'].forEach(t => { const r = rowOf(new RegExp('^' + t)); if (r) P.rev.appendChild(r); });
        /* risky actions get their own panel at the very end */
        const dz = document.createElement('div'); dz.className = 'panel panel-pad set-section set-danger'; dz.id = 'set-danger';
        dz.innerHTML = `<h3>${ic('alert')} Zone sensible</h3><p class="small muted">Ces actions effacent de la progression ou des données. Elles demandent une confirmation, et tu peux toujours revenir en arrière (7 jours).</p>`;
        let nd = 0; ['Remettre la progression', 'Réinitialiser l.application'].forEach(t => { const r = rowOf(new RegExp('^' + t)); if (r) { dz.appendChild(r); nd++; } });
        const sens = this.sensitiveInfo && this.sensitiveInfo();
        if (sens) { const r = document.createElement('div'); r.className = 'set-row'; r.innerHTML = `<div class="txt"><b>Revenir en arrière</b><span>Dernière action : ${sens.label} (${new Date(sens.at).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}). Tu peux tout remettre comme avant pendant 7 jours.</span></div><button class="btn btn-soft btn-sm" data-action="sens-undo">${ic('undo')}Annuler</button>`; dz.insertBefore(r, dz.children[2] || null); nd++; }
        P.danger = nd ? dz : null;
        /* heavy panels fold away (closed by default) */
        const fold = (panel, label) => {
            if (!panel) return;
            const h = panel.querySelector('h3'); if (!h) return;
            const det = document.createElement('details'); det.className = 'set-collapse';
            const sum = document.createElement('summary'); h.after(det); sum.appendChild(h); det.appendChild(sum);
            while (det.nextSibling) det.appendChild(det.nextSibling);
            if (label) { const sm = document.createElement('small'); sm.textContent = label; sum.appendChild(sm); }
        };
        fold(P.algo, 'avancé'); fold(P.fsrs, 'avancé'); fold(P.tools); fold(P.keys);
        const groups = [
            ['grp-rev', '📚', 'Révision', 'Ta façon d\'étudier : objectifs, planification et mémoire.', [P.rev, P.goal, P.algo, P.fsrs]],
            ['grp-snd', '🔊', 'Sons et ambiance', 'Sons de l\'appli et mixeur d\'ambiance.', [P.snd, P.amb]],
            ['grp-look', '🎨', 'Apparence', 'Thème et taille du texte.', [P.theme]],
            ['grp-data', '☁️', 'Données et synchronisation', 'Cloud, sauvegardes, import / export et outils.', [P.cloud, P.data, P.tools]],
            ['grp-adv', '⚙️', 'Avancé', 'Raccourcis clavier et actions sensibles.', [P.keys, P.danger]]
        ];
        const nav = document.createElement('nav'); nav.className = 'set-nav'; nav.setAttribute('aria-label', 'Sections des réglages');
        const chips = [];
        let anchor = P.upd || root.querySelector('.page-title').parentElement;
        groups.forEach(([id, em, name, sub, panels]) => {
            panels = panels.filter(Boolean); if (!panels.length) return;
            const g = document.createElement('section'); g.className = 'set-group'; g.id = id;
            g.innerHTML = `<h2 class="set-group-title"><span>${em}</span>${name}</h2><p class="set-group-sub">${sub}</p>`;
            panels.forEach(pn => g.appendChild(pn));
            anchor.after(g); anchor = g; chips.push([id, name.replace(' et synchronisation', '').replace('Sons et ambiance', 'Sons')]);
        });
        const emo = { 'grp-rev': '📚', 'grp-snd': '🔊', 'grp-look': '🎨', 'grp-data': '☁️', 'grp-adv': '⚙️' };
        nav.innerHTML = chips.map(([id, l]) => `<button class="chip" data-jump="${id}"><span aria-hidden="true">${emo[id] || ''}</span>${l}</button>`).join('');
        nav.addEventListener('click', e => { const b = e.target.closest('[data-jump]'); const t = b && document.getElementById(b.dataset.jump); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        const head = root.querySelector('.page-title'); (head ? head.parentElement : stack.firstElementChild).after(nav);
        /* sticky just under the top bar, and the chip of the section being read is highlighted */
        const top = document.querySelector('.topbar'); nav.style.top = `${(top ? top.getBoundingClientRect().height : 56) + 6}px`;
        if (this._setSpy) window.removeEventListener('scroll', this._setSpy);
        const spy = () => {
            if (this.view !== 'settings') return;
            const line = (top ? top.getBoundingClientRect().height : 56) + nav.getBoundingClientRect().height + 30;
            let cur = chips[0] && chips[0][0];
            chips.forEach(([id]) => { const g = document.getElementById(id); if (g && g.getBoundingClientRect().top <= line) cur = id; });
            nav.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.dataset.jump === cur));
            const act = nav.querySelector('.chip.active'); if (act && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: act.offsetLeft - 16, behavior: 'smooth' });
        };
        this._setSpy = spy; window.addEventListener('scroll', spy, { passive: true }); spy();
    }
});
(() => { const base = SuperAnki.prototype.renderSettings; SuperAnki.prototype.renderSettings = function (...a) { const r = base.apply(this, a); try { this.settingsNav(); } catch { /* ignore */ } return r; }; })();
