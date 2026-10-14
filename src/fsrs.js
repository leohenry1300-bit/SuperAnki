/* ============================================================
   FSRS-5 (Free Spaced Repetition Scheduler), default parameters.
   Memory state per card: s = stability (days to drop to 90% recall),
   d = difficulty (1..10). Same maths as the Anki implementation.
   ============================================================ */
const FSRS_W0 = [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621];
const FSRS_W = FSRS_W0.slice();   // active parameters (replaced in place when the user optimizes)
const fsrsApplyParams = arr => { const w = Array.isArray(arr) && arr.length === FSRS_W0.length && arr.every(Number.isFinite) ? arr : FSRS_W0; w.forEach((v, i) => { FSRS_W[i] = v; }); };
const FSRS_DECAY = -0.5, FSRS_FACTOR = 19 / 81;
const fsrsR = (t, s) => Math.pow(1 + FSRS_FACTOR * Math.max(0, t) / Math.max(0.01, s), FSRS_DECAY);
const fsrsIvl = (s, r) => s / FSRS_FACTOR * (Math.pow(r, 1 / FSRS_DECAY) - 1);
const fsrsInitS = (g, w = FSRS_W) => Math.max(0.1, w[g - 1]);
const fsrsClampD = d => clamp(d, 1, 10);
const fsrsInitD = (g, w = FSRS_W) => fsrsClampD(w[4] - Math.exp(w[5] * (g - 1)) + 1);
function fsrsNextD(d, g, w = FSRS_W) {
    const delta = -w[6] * (g - 3);
    const lin = d + delta * (10 - d) / 9;
    return fsrsClampD(w[7] * fsrsInitD(4, w) + (1 - w[7]) * lin);
}
function fsrsRecallS(s, d, r, g, w = FSRS_W) {
    const hard = g === 2 ? w[15] : 1, easy = g === 4 ? w[16] : 1;
    return s * (1 + Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp((1 - r) * w[10]) - 1) * hard * easy);
}
function fsrsForgetS(s, d, r, w = FSRS_W) {
    const n = w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp((1 - r) * w[14]);
    return Math.max(0.1, Math.min(s, n));
}
function fsrsShortS(s, g, w = FSRS_W) {
    const n = s * Math.exp(w[17] * (g - 3 + w[18]));
    return Math.max(0.1, g >= 3 ? Math.max(n, s) : n);
}
/* Memory state for a card that was reviewed with SM-2 (or has none yet). */
function fsrsFromCard(card) {
    if (card.fs && card.fs.s > 0) return { ...card.fs };
    if (card.state === 'new') return null;
    const ease = card.ease || 2.5;
    return { s: Math.max(0.5, card.interval || 1), d: fsrsClampD(10 - (ease - 1.3) * (5.5 / 1.2)), t: card.lastReview || Date.now() };
}
function fsrsRetrievability(card, now = Date.now()) {
    const fs = fsrsFromCard(card);
    if (!fs || card.state === 'new') return null;
    const last = card.lastReview || fs.t || now;
    return fsrsR((now - last) / DAY, fs.s);
}
