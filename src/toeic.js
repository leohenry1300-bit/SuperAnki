/* ============================================================
   TOEIC simulator (Listening & Reading), in the format of the real test:
   200 questions, 7 parts, 45 min listening (audio played once) + 75 min reading.
   - Questions are original, written in the style of the test (no real ETS items).
   - Audio comes from the device's speech synthesis (no file to download).
   - Scaled scores (5-495 per section) are estimates from the raw score.
   ============================================================ */
Object.assign(ICONS, {
    headphones: '<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><path d="M21 15a2 2 0 0 1-2 2h-1a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3zM3 15a2 2 0 0 0 2 2h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H3z"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    flagq: '<path d="M5 22V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/>'
});

const TOEIC_PARTS = {
    p1: { label: 'Partie 1', name: 'Photographies', sec: 'L', icon: 'image', color: '#0ea5e9', pack: 'toeic-vocab', fr: '6 questions : une image, quatre phrases entendues. Tu choisis celle qui décrit le mieux l\'image.' },
    p2: { label: 'Partie 2', name: 'Question - Réponse', sec: 'L', icon: 'mic', color: '#8b5cf6', pack: 'toeic-expressions', fr: '25 questions : une question entendue, trois réponses entendues. Rien n\'est imprimé.' },
    p3: { label: 'Partie 3', name: 'Conversations', sec: 'L', icon: 'headphones', color: '#10b981', pack: 'toeic-vocab', fr: '39 questions : 13 conversations de 2 ou 3 personnes, 3 questions chacune.' },
    p4: { label: 'Partie 4', name: 'Exposés', sec: 'L', icon: 'volume', color: '#f59e0b', pack: 'toeic-vocab', fr: '30 questions : 10 annonces, messages ou discours, 3 questions chacun.' },
    p5: { label: 'Partie 5', name: 'Phrases à compléter', sec: 'R', icon: 'pencil', color: '#ef4444', pack: 'toeic-grammaire', fr: '30 questions : choisis le mot ou la forme qui complète la phrase (grammaire et vocabulaire).' },
    p6: { label: 'Partie 6', name: 'Textes à compléter', sec: 'R', icon: 'file', color: '#ec4899', pack: 'toeic-grammaire', fr: '16 questions : 4 textes (e-mail, annonce...) avec 4 trous, dont une phrase à insérer.' },
    p7: { label: 'Partie 7', name: 'Lecture de documents', sec: 'R', icon: 'book', color: '#6366f1', pack: 'toeic-expressions', fr: '54 questions : documents simples, doubles et triples (e-mails, annonces, chats, formulaires...).' }
};
const TOEIC_FULL = { p1: 6, p2: 25, p3: 13, p4: 10, p5: 30, p6: 4, p7s: 29, p7d: 2, p7t: 3 };   // items, except p7s = questions
const TOEIC_MINI = { p1: 3, p2: 10, p3: 4, p4: 3, p5: 12, p6: 2, p7s: 9, p7d: 1, p7t: 1 };
/* raw score (0-100) -> scaled score (5-495): approximate anchor points, interpolated */
const TOEIC_SCALE = {
    L: [[0, 5], [10, 40], [20, 85], [30, 130], [40, 175], [50, 225], [60, 280], [70, 335], [80, 395], [90, 450], [100, 495]],
    R: [[0, 5], [10, 30], [20, 70], [30, 110], [40, 155], [50, 205], [60, 260], [70, 320], [80, 385], [90, 445], [100, 495]]
};
const TOEIC_CEFR = [[945, 'C1', 'Avancé'], [785, 'B2', 'Intermédiaire supérieur'], [550, 'B1', 'Intermédiaire'], [225, 'A2', 'Élémentaire'], [120, 'A1', 'Débutant']];
const TOEIC_DIRECTIONS = {
    p1: ['Directions', 'For each question, you will see a picture and hear four statements. Choose the statement that best describes the picture. The statements are not printed.', 'Pour chaque question, tu vois une image et tu entends quatre phrases. Choisis celle qui décrit le mieux l\'image. Les phrases ne sont pas écrites.'],
    p2: ['Directions', 'You will hear a question or statement and three responses. Choose the best response. Nothing is printed on the page.', 'Tu entends une question ou une phrase, puis trois réponses. Choisis la meilleure réponse. Rien n\'est écrit.'],
    p3: ['Directions', 'You will hear conversations between two or more people. Read the questions on the page and choose the best answer to each. Each question is read aloud; you then have a few seconds to answer.', 'Tu entends des conversations. Lis les questions à l\'écran et choisis la bonne réponse. Chaque question est lue à voix haute, puis tu as quelques secondes pour répondre.'],
    p4: ['Directions', 'You will hear short talks given by a single speaker. Read the questions on the page and choose the best answer to each.', 'Tu entends de courts exposés (annonces, messages, discours). Lis les questions à l\'écran et choisis la bonne réponse.'],
    p5: ['Directions', 'A word or phrase is missing in each sentence below. Choose the answer that best completes the sentence.', 'Il manque un mot ou une expression dans chaque phrase. Choisis la réponse qui complète le mieux la phrase.'],
    p6: ['Directions', 'Read the texts. A word, phrase, or sentence is missing in parts of each text. Choose the best answer to each question.', 'Lis les textes. Il manque un mot, une expression ou une phrase à certains endroits. Choisis la meilleure réponse.'],
    p7: ['Directions', 'In this part you will read texts such as e-mails, notices, and text-message chains. Each text or set of texts is followed by several questions. Choose the best answer to each question.', 'Tu lis des documents (e-mails, annonces, conversations par SMS...). Chaque document ou groupe de documents est suivi de plusieurs questions. Choisis la meilleure réponse.']
};
const toeicLetter = i => 'ABCD'[i];

/* ---------- deterministic randomness (the same seed always gives the same answer order) ---------- */
function toeicHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function toeicRng(seed) {
    let a = (typeof seed === 'string' ? toeicHash(seed) : seed) >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function toeicShuffle(arr, rnd) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}

/* ---------- scoring ---------- */
function toeicScaled(raw, n, sec) {
    if (!n || n < 15) return null;
    const pct = raw / n * 100, t = TOEIC_SCALE[sec];
    for (let i = 1; i < t.length; i++) {
        if (pct <= t[i][0]) { const [x0, y0] = t[i - 1], [x1, y1] = t[i]; return clamp(Math.round((y0 + (y1 - y0) * (pct - x0) / (x1 - x0)) / 5) * 5, 5, 495); }
    }
    return 495;
}
function toeicCefr(total) {
    if (total == null) return null;
    const hit = TOEIC_CEFR.find(([min]) => total >= min);
    return hit ? { level: hit[1], label: hit[2] } : { level: '< A1', label: 'Débutant' };
}

/* ---------- speech: voices, accents, chunked playback ---------- */
const TTS = {
    ok: typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined',
    voices: [], gen: 0, waiters: new Set(), speed() { return window.TOEIC_TEST_SPEED || 1; },
    FEMALE: /female|zira|samantha|victoria|karen|moira|tessa|fiona|susan|hazel|linda|heather|catherine|allison|ava|jenny|aria|michelle|sonia|libby|natasha|clara|emma|joanna|kendra|kimberly|salli|amy|nicole|olivia|serena|jessa|zoe|ellie|nora|sara|veena|lisa|laura/i,
    MALE: /\bmale\b|david|mark\b|alex\b|daniel|fred\b|tom\b|oliver|george|james|ryan|guy\b|william|arthur|thomas|liam|brian|russell|matthew|joey|justin|eric\b|davis|christopher|roger|steffan|aaron|gordon|rishi|lee\b|rocko|reed|eddy|sandy/i,
    load() {
        if (!this.ok) return;
        try { this.voices = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)); } catch { this.voices = []; }
    },
    init() {
        if (!this.ok) return;
        this.load();
        try { speechSynthesis.addEventListener('voiceschanged', () => this.load()); } catch { /* old browsers */ }
    },
    available() { this.load(); return this.ok && this.voices.length > 0; },
    accent(v) { return v.lang.replace('_', '-').slice(0, 5).toLowerCase(); },
    gender(v) { return this.MALE.test(v.name) && !this.FEMALE.test(v.name) ? 'm' : this.FEMALE.test(v.name) ? 'f' : ''; },
    accents() { return [...new Set(this.voices.map(v => this.accent(v)))]; },
    /* returns {voice, lang, pitch} for a gender ('f'/'m') and accent; avoids already used voices */
    pick(gender, accent, used = []) {
        this.load();
        const vs = this.voices;
        if (!vs.length) return { voice: null, lang: 'en-US', pitch: gender === 'f' ? 1.12 : 0.88 };
        const free = v => !used.includes(v.name);
        const tiers = [
            v => this.accent(v) === accent && this.gender(v) === gender && free(v),
            v => this.gender(v) === gender && free(v) && this.accent(v) === accent,
            v => this.gender(v) === gender && free(v),
            v => this.accent(v) === accent && free(v) && !this.gender(v),
            v => this.gender(v) === gender,
            v => this.accent(v) === accent,
            () => true
        ];
        for (const t of tiers) {
            const v = vs.find(t);
            if (v) {
                const exact = this.gender(v) === gender;
                return { voice: v, lang: v.lang, pitch: exact ? 1 : gender === 'f' ? 1.15 : 0.85 };
            }
        }
        return { voice: null, lang: 'en-US', pitch: 1 };
    },
    chunks(text) {
        const parts = String(text).replace(/\s+/g, ' ').match(/[^.!?;]+[.!?;]*\s*/g) || [text];
        const out = [];
        parts.forEach(p => { p = p.trim(); if (!p) return; if (p.length > 160) p.split(/,\s*/).forEach((q, i, a) => out.push(q + (i < a.length - 1 ? ',' : ''))); else out.push(p); });
        return out;
    },
    /* speaks text with a voice profile; resolves true if finished, false if cancelled */
    say(text, prof = {}, rate = 1) {
        return new Promise(resolve => {
            const g = this.gen, parts = this.chunks(text);
            let i = 0;
            if (!this.ok || !parts.length) { resolve(g === this.gen); return; }
            if (window.TOEIC_TEST_SPEED) rate = Math.max(rate, 2);
            const next = () => {
                if (g !== this.gen) { resolve(false); return; }
                if (i >= parts.length) { resolve(true); return; }
                const piece = parts[i++];
                let done = false;
                const fin = () => { if (done) return; done = true; clearTimeout(guard); next(); };
                const u = new SpeechSynthesisUtterance(piece);
                u.lang = prof.lang || 'en-US';
                if (prof.voice) u.voice = prof.voice;
                u.rate = rate; u.pitch = prof.pitch || 1;
                u.onend = fin; u.onerror = fin;
                const guard = setTimeout(fin, (piece.length * 95 + 2500) / (window.TOEIC_TEST_SPEED ? 20 : rate));
                try { speechSynthesis.speak(u); } catch { fin(); }
            };
            next();
        });
    },
    /* cancellable pause: resolves true after ms, false if stopped meanwhile */
    wait(ms) {
        return new Promise(resolve => {
            const g = this.gen, w = {};
            w.res = ok => { clearTimeout(w.t); this.waiters.delete(w); resolve(ok); };
            w.t = setTimeout(() => w.res(g === this.gen), ms * this.speed());
            this.waiters.add(w);
        });
    },
    stop() {
        this.gen++;
        if (this.ok) { try { speechSynthesis.cancel(); } catch { /* ignore */ } }
        [...this.waiters].forEach(w => w.res(false));
    }
};
TTS.init();

/* ---------- question bank index ---------- */
const TOEIC_IDX = (() => {
    const idx = new Map();
    const B = TOEIC_BANK;
    ['p1', 'p2', 'p5'].forEach(k => B[k].forEach(it => idx.set(it.id, { part: k, item: it, qi: -1 })));
    ['p3', 'p4', 'p6', 'p7s', 'p7d', 'p7t'].forEach(k => B[k].forEach(it => it.qs.forEach((q, qi) => idx.set(`${it.id}:${qi}`, { part: k.startsWith('p7') ? 'p7' : k, item: it, qi, kind: k }))));
    return idx;
})();
const TOEIC_TOTAL_Q = TOEIC_IDX.size;
const toeicItemOf = uid => uid.split(':')[0];

/* ---------- saved data: attempts, goal ---------- */
function normalizeToeic(t) {
    t = t && typeof t === 'object' ? t : {};
    const sec = s => (s && typeof s === 'object' ? { raw: num(s.raw), n: num(s.n), scaled: s.scaled == null ? null : num(s.scaled) } : { raw: 0, n: 0, scaled: null });
    const attempts = toArray(t.attempts).filter(a => a && a.id && Array.isArray(a.d)).map(a => ({
        id: String(a.id), at: num(a.at), kind: String(a.kind || 'part'), style: a.style === 'train' ? 'train' : 'exam', seed: String(a.seed || a.id), part: a.part ? String(a.part) : '',
        dur: num(a.dur), L: sec(a.L), R: sec(a.R), total: a.total == null ? null : num(a.total),
        d: a.d.filter(x => Array.isArray(x) && x[0]).map(x => [String(x[0]), num(x[1], -1), num(x[2]), x[3] ? 1 : 0])
    })).sort((x, y) => x.at - y.at).slice(-60);
    return { attempts, target: clamp(Math.round(num(t.target, 750) / 5) * 5, 10, 990), goalDate: /^\d{4}-\d{2}-\d{2}$/.test(t.goalDate || '') ? t.goalDate : '', mod: num(t.mod) };
}
function mergeToeic(a, b) {
    const seen = new Map();
    [...(a.attempts || []), ...(b.attempts || [])].forEach(x => { if (!seen.has(x.id)) seen.set(x.id, x); });
    const newer = (a.mod || 0) >= (b.mod || 0) ? a : b;
    return normalizeToeic({ attempts: [...seen.values()], target: newer.target, goalDate: newer.goalDate, mod: Math.max(a.mod || 0, b.mod || 0) });
}

/* ---------- history, selection and expansion into runnable units ---------- */
function toeicIsRight(uid, k) {
    const e = TOEIC_IDX.get(uid);
    if (!e) return false;
    const src = e.qi < 0 ? e.item : e.item.qs[e.qi];
    return k === src.a;
}
function toeicHistory(attempts) {
    const h = new Map();
    attempts.forEach(a => a.d.forEach(([uid, k]) => {
        if (k < 0 && a.kind !== 'full') return;      // unanswered in a partial run: not really seen
        const r = h.get(uid) || { n: 0, ok: false, wrongs: 0 };
        r.n++; r.ok = toeicIsRight(uid, k); if (!r.ok) r.wrongs++;
        h.set(uid, r);
    }));
    return h;
}
const TOEIC_BANK_BY_PART = () => ({ p1: TOEIC_BANK.p1, p2: TOEIC_BANK.p2, p3: TOEIC_BANK.p3, p4: TOEIC_BANK.p4, p5: TOEIC_BANK.p5, p6: TOEIC_BANK.p6, p7s: TOEIC_BANK.p7s, p7d: TOEIC_BANK.p7d, p7t: TOEIC_BANK.p7t });
function toeicItemUids(it) { return it.qs ? it.qs.map((_, i) => `${it.id}:${i}`) : [it.id]; }
/* picks `count` items of a bank list: unseen first, then those answered wrongly, then the oldest */
function toeicPick(list, count, rnd, hist) {
    const prio = it => {
        const rs = toeicItemUids(it).map(u => hist.get(u)).filter(Boolean);
        const seen = rs.length ? Math.max(...rs.map(r => r.n)) : 0;
        return seen * 10 + (rs.some(r => !r.ok) ? -4 : 0) + rnd() * 7;
    };
    return list.map(it => [prio(it), it]).sort((a, b) => a[0] - b[0]).slice(0, count).map(x => x[1]);
}
/* sel = ordered list of [itemId, questionIndexes | null] */
function toeicPlan(spec, hist, rnd) {
    const B = TOEIC_BANK_BY_PART(), sel = [];
    const add = items => items.forEach(it => sel.push([it.id, null]));
    if (spec.p1) add(toeicPick(B.p1, spec.p1, rnd, hist));
    if (spec.p2) add(toeicPick(B.p2, spec.p2, rnd, hist));
    if (spec.p3) add(toeicPick(B.p3, spec.p3, rnd, hist));
    if (spec.p4) add(toeicPick(B.p4, spec.p4, rnd, hist));
    if (spec.p5) add(toeicPick(B.p5, spec.p5, rnd, hist));
    if (spec.p6) add(toeicPick(B.p6, spec.p6, rnd, hist));
    if (spec.p7s) {
        let got = 0;
        toeicPick(B.p7s, B.p7s.length, rnd, hist).forEach(it => {
            if (got >= spec.p7s) return;
            const need = spec.p7s - got;
            if (it.qs.length > need && need >= 2 && !it.qs.some(q => q.f)) { sel.push([it.id, Array.from({ length: need }, (_, i) => i)]); got += need; }
            else { sel.push([it.id, null]); got += it.qs.length; }
        });
    }
    if (spec.p7d) add(toeicPick(B.p7d, spec.p7d, rnd, hist));
    if (spec.p7t) add(toeicPick(B.p7t, spec.p7t, rnd, hist));
    return sel;
}
/* a practice size for part 7 (in questions) -> plan spec */
function toeicP7Spec(nq) {
    const t = Math.round(nq * 0.28 / 5), d = Math.round(nq * 0.19 / 5);
    return { p7s: Math.max(3, nq - t * 5 - d * 5), p7d: d, p7t: t };
}

function toeicExpand(sel, seed) {
    const units = [], qs = [];
    const partOf = id => id.startsWith('p7') ? 'p7' : id.slice(0, 2);
    const mkQ = (uid, src, part, unit) => {
        const rnd = toeicRng(`${seed}|${uid}`), n = src.o.length;
        const order = src.f ? src.o.map((_, i) => i) : toeicShuffle(src.o.map((_, i) => i), rnd);
        const q = { i: qs.length, n: qs.length + 1, uid, part, unit, stem: src.q || '', opts: order.map(k => ({ t: src.o[k], k })), ans: order.indexOf(src.a), x: src.x, t: src.t || '' };
        qs.push(q);
        return q.i;
    };
    let page = null;
    const lookup = {};
    Object.values(TOEIC_BANK).forEach(list => list.forEach(it => { lookup[it.id] = it; }));
    sel.forEach(([id, qis]) => {
        const it = lookup[id];
        if (!it) return;
        const part = partOf(id), sec = TOEIC_PARTS[part].sec;
        if (part === 'p5') {
            if (!page || page.q.length >= 5) { page = { part, sec, type: 'p5', q: [], id: 'p5page' }; units.push(page); }
            page.q.push(mkQ(it.id, it, part, units.length - 1));
            return;
        }
        page = null;
        const u = { part, sec, type: id.startsWith('p7') ? 'p7' : part, id, item: it, q: [] };
        units.push(u);
        if (part === 'p1' || part === 'p2') u.q.push(mkQ(it.id, it, part, units.length - 1));
        else (qis || it.qs.map((_, i) => i)).forEach(qi => u.q.push(mkQ(`${id}:${qi}`, it.qs[qi], part, units.length - 1)));
    });
    return { units, qs };
}

/* ============================================================
   UI + exam engine (methods of SuperAnki)
   ============================================================ */
const TOEIC_RUN_KEY = 'superanki_toeic_run';
const TOEIC_KIND = { full: 'Test complet', mini: 'Mini-test', part: 'Entraînement', errors: 'Mes erreurs' };
const toeicMarks = s => esc(s).replace(/\[(\d)\]/g, '<b class="mk">[$1]</b>');
function toeicMMSS(sec) { sec = Math.max(0, Math.round(sec)); return `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`; }

Object.assign(SuperAnki.prototype, {
    /* ---------- persisted run ---------- */
    toeicSavedRun() {
        try { const r = JSON.parse(localStorage.getItem(TOEIC_RUN_KEY) || 'null'); return r && r.sel && r.seed ? r : null; } catch { return null; }
    },
    exPersist() {
        const ex = this.ex;
        if (!ex || !ex.run || ex.run.phase === 'done' || ex.run.phase === 'intro') return;
        try { localStorage.setItem(TOEIC_RUN_KEY, JSON.stringify(ex.run)); } catch { /* storage full or blocked */ }
    },
    exClearSaved() { try { localStorage.removeItem(TOEIC_RUN_KEY); } catch { /* ignore */ } },

    /* ---------- hub ---------- */
    toeicStats() {
        const T = this.data.toeic, hist = toeicHistory(T.attempts);
        const scored = T.attempts.filter(a => a.total != null);
        const partAcc = {};
        Object.keys(TOEIC_PARTS).forEach(p => { partAcc[p] = { ok: 0, n: 0 }; });
        T.attempts.slice(-12).forEach(a => a.d.forEach(([uid, k]) => {
            const e = TOEIC_IDX.get(uid);
            if (!e || (k < 0 && a.kind !== 'full')) return;
            partAcc[e.part].n++; if (toeicIsRight(uid, k)) partAcc[e.part].ok++;
        }));
        const wrong = [...hist.entries()].filter(([, r]) => !r.ok).map(([u]) => u);
        return { T, hist, scored, partAcc, wrong, last: scored[scored.length - 1], best: scored.reduce((m, a) => Math.max(m, a.total), 0) };
    },
    renderToeic() {
        const S = this.toeicStats(), T = S.T, saved = this.toeicSavedRun();
        const days = T.goalDate ? daysBetweenKeys(dayKey(), T.goalDate) : null;
        const lastTotal = S.last ? S.last.total : null, cefr = toeicCefr(lastTotal);
        const seenPct = Math.round(S.hist.size / TOEIC_TOTAL_Q * 100);
        const savedInfo = saved && (() => { const e = toeicExpand(saved.sel, saved.seed); return { total: e.qs.length, done: Object.keys(saved.ans || {}).length }; })();
        const modeTile = (action, color, ico, title, sub, data = '') => `<button class="panel mode-tile" style="--c:${color}" data-action="${action}" ${data}><span class="mode-ico">${ic(ico)}</span><span><h4>${title}</h4><p>${sub}</p></span>${ic('chevronRight', 'chev')}</button>`;
        const partTile = p => {
            const P = TOEIC_PARTS[p], a = S.partAcc[p], pct = a.n ? Math.round(a.ok / a.n * 100) : null;
            return `<button class="panel tq-part" style="--c:${P.color}" data-action="tq-part" data-part="${p}">
                <div class="tq-part-top"><span class="mode-ico">${ic(P.icon)}</span><span class="tag">${P.sec === 'L' ? 'Listening' : 'Reading'}</span></div>
                <div><b>${P.label}</b><div class="small muted">${P.name}</div></div>
                <div class="progress"><i style="width:${pct || 0}%;background:var(--c)"></i></div>
                <div class="tiny faint">${pct == null ? 'Pas encore essayée' : `${pct} % de réussite (${a.n} q.)`}</div>
            </button>`;
        };
        $('#view-toeic').innerHTML = `<div class="stack">
            <div class="hero tq-hero"><div class="hero-inner"><div>
                <span class="hero-kicker">TOEIC · Listening &amp; Reading${days != null ? ` · <b>${days > 0 ? `J-${days}` : days === 0 ? 'c\'est aujourd\'hui !' : 'date passée'}</b>` : ''}</span>
                <h2 class="hero-title">Simulateur TOEIC</h2>
                <p class="hero-sub">200 questions, 7 parties, audio joué une seule fois, 75 minutes de lecture : comme le jour J. ${lastTotal != null ? `Dernier score estimé : <b>${lastTotal}</b> / 990 (${cefr.level}).` : 'Fais un premier test pour connaître ton niveau.'}</p>
            </div><div class="hero-actions">
                <button class="btn btn-lg btn-hero" data-action="tq-full">${ic('play')}Test complet</button>
                <button class="btn btn-lg btn-hero-ghost" data-action="tq-mini">${ic('timer')}Mini-test</button>
            </div></div></div>
            ${saved ? `<div class="panel panel-pad tq-resume"><div><b>Test en cours</b><div class="small muted">${TOEIC_KIND[saved.kind] || 'Test'} · ${savedInfo.done}/${savedInfo.total} questions répondues · commencé ${fmtAgo(saved.startedAt)}</div></div><div class="row-gap"><button class="btn btn-primary" data-action="tq-resume">${ic('play')}Reprendre</button><button class="btn btn-soft" data-action="tq-abandon">Abandonner</button></div></div>` : ''}
            <div class="kpi-grid">
                <div class="panel kpi"><span>Dernier score</span><b class="kpi-num">${lastTotal != null ? lastTotal : '-'}</b><div class="tiny muted">${S.last ? `L ${S.last.L.scaled ?? '-'} · R ${S.last.R.scaled ?? '-'}` : 'sur 990 (estimation)'}</div></div>
                <div class="panel kpi"><span>Meilleur score</span><b class="kpi-num">${S.best || '-'}</b><div class="tiny muted">${S.best ? toeicCefr(S.best).level + ' · ' + toeicCefr(S.best).label : 'aucun test noté'}</div></div>
                <button class="panel kpi tq-goal" data-action="tq-goal"><span>Objectif ${ic('pencil', 'inl')}</span><b class="kpi-num">${T.target}</b><div class="tiny muted">${days != null && days > 0 ? `${S.best >= T.target ? 'atteint !' : `encore ${Math.max(0, T.target - (lastTotal || 0))} pts`} · J-${days}` : 'touche pour modifier'}</div></button>
                <div class="panel kpi"><span>Questions vues</span><b class="kpi-num">${S.hist.size}<small> / ${TOEIC_TOTAL_Q}</small></b><div class="progress" style="margin-top:6px"><i style="width:${seenPct}%;background:var(--primary)"></i></div></div>
            </div>
            <div><div class="section-head"><h3 class="section-title">Passer un test</h3><button class="link" data-action="tq-sound">${ic('volume')}Tester le son</button></div>
                <div class="mode-grid">
                    ${modeTile('tq-full', '#4f46e5', 'headphones', 'Test complet', '200 questions · ≈ 2 h · conditions réelles')}
                    ${modeTile('tq-mini', '#0ea5e9', 'timer', 'Mini-test', '≈ 70 questions · ≈ 55 min · toutes les parties')}
                    ${modeTile('tq-errors', '#e11d48', 'refresh', 'Mes erreurs', S.wrong.length ? `${S.wrong.length} question${S.wrong.length > 1 ? 's' : ''} à retravailler` : 'Rien à rejouer pour l\'instant')}
                </div></div>
            <div><div class="section-head"><h3 class="section-title">S'entraîner par partie</h3><span class="small muted">avec corrections immédiates ou en conditions d'examen</span></div>
                <div class="tq-parts">${Object.keys(TOEIC_PARTS).map(partTile).join('')}</div></div>
            ${this.toeicHistoryHtml(S)}
            <div class="panel panel-pad"><h3 class="section-title" style="margin-bottom:10px">Stratégies pour le jour J</h3>
                <div class="tq-tips">
                    <details><summary>Gérer son temps en Reading</summary><p>75 minutes pour 100 questions. Vise ≈ 20 min pour la partie 5, ≈ 10 min pour la partie 6, et garde ≈ 45 min pour la partie 7. Ne reste pas bloqué : marque la question ${ic('flagq', 'inl')} et reviens-y.</p></details>
                    <details><summary>Pas de pénalité : réponds à tout</summary><p>Une mauvaise réponse ne retire aucun point. À la fin, remplis chaque question restante au hasard plutôt que de la laisser vide.</p></details>
                    <details><summary>Listening : lis avant d'écouter</summary><p>Dans les parties 3 et 4, parcours les 3 questions et leurs options pendant que l'audio démarre : tu sauras quoi chercher (qui, où, pourquoi, problème, prochaine étape).</p></details>
                    <details><summary>Partie 2 : les pièges</summary><p>Écoute le premier mot (When, Who, Where, Why, How…) et élimine les réponses qui répètent le même son sans répondre à la question.</p></details>
                    <details><summary>Partie 5 : grammaire d'abord</summary><p>Regarde les 4 options : si ce sont des formes du même mot (nom, verbe, adjectif, adverbe), c'est de la grammaire et ça se règle en 10 secondes. Si ce sont des mots différents, c'est du vocabulaire.</p></details>
                </div></div>
            <p class="small faint tq-note">Les questions sont originales, écrites dans le style du TOEIC (ce ne sont pas des sujets officiels ETS). La voix vient de ton appareil. Les scores sont des estimations à partir du nombre de bonnes réponses : l'échelle officielle varie légèrement d'un examen à l'autre.</p>
        </div>`;
    },
    toeicHistoryHtml(S) {
        const att = S.T.attempts.slice().reverse();
        if (!att.length) return '';
        const scored = S.scored.slice(-12);
        let chart = '';
        if (scored.length >= 2) {
            const W = 560, H = 150, px = 34, py = 14, max = 990;
            const x = i => px + i * (W - px - 12) / (scored.length - 1), y = v => py + (1 - v / max) * (H - py - 22);
            const pts = scored.map((a, i) => `${x(i).toFixed(1)},${y(a.total).toFixed(1)}`).join(' ');
            chart = `<svg viewBox="0 0 ${W} ${H}" class="tq-chart" role="img" aria-label="Évolution du score estimé">
                ${[0, 250, 500, 750, 990].map(v => `<line x1="${px}" x2="${W - 8}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${px - 6}" y="${y(v) + 3}" text-anchor="end">${v}</text>`).join('')}
                <line x1="${px}" x2="${W - 8}" y1="${y(S.T.target)}" y2="${y(S.T.target)}" class="goal"/><text x="${W - 10}" y="${y(S.T.target) - 4}" text-anchor="end" class="goal-t">objectif ${S.T.target}</text>
                <polyline points="${pts}" class="line"/>
                ${scored.map((a, i) => `<circle cx="${x(i)}" cy="${y(a.total)}" r="4.5" class="dot"><title>${a.total} · ${new Date(a.at).toLocaleDateString('fr-FR')}</title></circle>`).join('')}
            </svg>`;
        }
        const row = a => {
            const e = a.total != null ? `<b>${a.total}</b> <span class="muted">/ 990</span>` : `<b>${Math.round(a.d.filter(([u, k]) => toeicIsRight(u, k)).length / Math.max(1, a.d.length) * 100)} %</b> <span class="muted">de réussite</span>`;
            return `<button class="tq-hrow" data-action="tq-open-att" data-id="${esc(a.id)}"><span class="tq-hdate">${new Date(a.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span><span class="grow"><b>${TOEIC_KIND[a.kind] || a.kind}${a.part ? ' · ' + TOEIC_PARTS[a.part].label : ''}</b><span class="tiny muted"> · ${a.d.length} q. · ${fmtDuration(a.dur)}${a.style === 'train' ? ' · avec corrections' : ''}</span></span><span>${e}</span>${ic('chevronRight', 'chev')}</button>`;
        };
        return `<div class="panel panel-pad"><div class="section-head"><h3 class="section-title">Historique</h3><span class="small muted">${att.length} tentative${att.length > 1 ? 's' : ''}</span></div>${chart}<div class="tq-hlist">${att.slice(0, 10).map(row).join('')}</div></div>`;
    },

    /* ---------- small modals ---------- */
    toeicGoalModal() {
        const T = this.data.toeic;
        const m = this.openModal({
            title: 'Mon objectif TOEIC', size: 'narrow',
            body: `<div class="field"><label class="label" for="tq-target">Score visé (sur 990)</label><input class="input" id="tq-target" type="number" min="10" max="990" step="5" value="${T.target}"></div>
                <div class="field"><label class="label" for="tq-date">Date de l'examen (optionnel)</label><input class="input" id="tq-date" type="date" value="${esc(T.goalDate)}"></div>
                <p class="small muted" style="margin-top:12px">Repères : 550 ≈ B1 (intermédiaire), 785 ≈ B2, 945 ≈ C1. Beaucoup d'écoles et d'employeurs demandent 600 à 800.</p>`,
            foot: `<button class="btn btn-soft" data-close>Annuler</button><button class="btn btn-primary" id="tq-goal-save">${ic('check')}Enregistrer</button>`
        });
        $('#tq-goal-save', m).addEventListener('click', () => {
            T.target = clamp(Math.round(num($('#tq-target', m).value, 750) / 5) * 5, 10, 990);
            T.goalDate = /^\d{4}-\d{2}-\d{2}$/.test($('#tq-date', m).value) ? $('#tq-date', m).value : '';
            T.mod = Date.now();
            this.save(); this.closeModal(m); this.renderToeic();
        });
    },
    toeicSoundModal() {
        TTS.load();
        const ok = TTS.available(), acc = TTS.accents();
        const m = this.openModal({
            title: 'Test du son', size: 'narrow',
            body: ok ? `<p class="muted">${TTS.voices.length} voix anglaises détectées${acc.length ? ` (accents : ${acc.map(a => a.toUpperCase()).join(', ')})` : ''}. Monte le volume ou mets un casque, puis écoute les exemples.</p>
                <div class="tq-sample-row"><button class="btn btn-soft" data-action="tq-sample" data-g="f" data-a="en-us">${ic('volume')}Voix 1 (US)</button><button class="btn btn-soft" data-action="tq-sample" data-g="m" data-a="en-gb">${ic('volume')}Voix 2 (UK)</button><button class="btn btn-soft" data-action="tq-sample" data-g="f" data-a="en-au">${ic('volume')}Voix 3 (AU)</button></div>
                <p class="small faint" style="margin-top:12px">Les voix dépendent de ton appareil. Pour de meilleures voix : Chrome ou Edge sur ordinateur, Safari sur iPhone (Réglages › Accessibilité › Contenu énoncé › Voix).</p>`
                : `<p class="muted"><b>Aucune voix anglaise n'a été trouvée sur cet appareil.</b> Les parties Listening s'afficheront alors en texte (transcription), ce qui reste utile pour s'entraîner mais ne remplace pas l'écoute.</p>
                <p class="small faint">Sur Windows, ajoute la langue « Anglais » dans les paramètres de langue. Sur Android, installe « Synthèse vocale Google » avec la voix anglaise.</p>`,
            foot: `<button class="btn btn-primary" data-close>Fermer</button>`,
            onClose: () => TTS.stop()
        });
        return m;
    },
    toeicPartModal(part) {
        const P = TOEIC_PARTS[part], listening = P.sec === 'L';
        const presets = { p1: [[3, '3 scènes'], [6, '6 scènes'], [12, '12 scènes']], p2: [[10, '10 q.'], [25, '25 q.'], [40, '40 q.']], p3: [[3, '3 conversations (9 q.)'], [6, '6 conversations (18 q.)'], [13, '13 conversations (39 q.)']], p4: [[3, '3 exposés (9 q.)'], [6, '6 exposés (18 q.)'], [10, '10 exposés (30 q.)']], p5: [[10, '10 q.'], [20, '20 q.'], [30, '30 q.'], [50, '50 q.']], p6: [[2, '2 textes (8 q.)'], [4, '4 textes (16 q.)'], [8, '8 textes (32 q.)']], p7: [[10, '≈ 10 q.'], [20, '≈ 20 q.'], [54, '≈ 54 q. (partie entière)']] }[part];
        const mid = presets[Math.min(1, presets.length - 1)][0];
        const m = this.openModal({
            title: `${P.label} · ${P.name}`, size: 'narrow',
            body: `<p class="muted small">${P.fr}</p>
                <div class="field"><span class="label">Format</span><div class="chip-row" id="tq-style">
                    <button class="chip active" data-v="train">Avec corrections</button><button class="chip" data-v="exam">Conditions d'examen</button></div>
                    <p class="small faint" id="tq-style-help" style="margin-top:8px">${listening ? 'Tu peux réécouter, tu vois la correction et la transcription après chaque réponse.' : 'Correction immédiate après chaque réponse, sans chrono.'}</p></div>
                <div class="field"><span class="label">Nombre de questions</span><div class="chip-row" id="tq-count">${presets.map(([v, l]) => `<button class="chip ${v === mid ? 'active' : ''}" data-v="${v}">${l}</button>`).join('')}</div></div>`,
            foot: `<button class="btn btn-soft" data-close>Annuler</button><button class="btn btn-primary" id="tq-go">${ic('play')}Commencer</button>`
        });
        const pick = id => $(id, m).addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; $$('.chip', $(id, m)).forEach(x => x.classList.toggle('active', x === b)); if (id === '#tq-style') $('#tq-style-help', m).textContent = b.dataset.v === 'train' ? (listening ? 'Tu peux réécouter, tu vois la correction et la transcription après chaque réponse.' : 'Correction immédiate après chaque réponse, sans chrono.') : (listening ? 'Audio joué une seule fois, enchaînement automatique, corrigé à la fin.' : 'Chrono réaliste, corrigé à la fin.'); });
        pick('#tq-style'); pick('#tq-count');
        $('#tq-go', m).addEventListener('click', () => {
            const style = $('#tq-style .active', m).dataset.v, count = Number($('#tq-count .active', m).dataset.v);
            this.closeModal(m);
            this.toeicStart({ kind: 'part', part, count, style });
        });
    },

    /* ---------- starting / resuming ---------- */
    toeicStart(cfg) {
        const S = this.toeicStats(), seed = uid('s'), rnd = toeicRng(seed + 'plan');
        let spec, style = cfg.style || 'exam', sel;
        if (cfg.kind === 'full') spec = TOEIC_FULL;
        else if (cfg.kind === 'mini') spec = TOEIC_MINI;
        else if (cfg.kind === 'part') spec = cfg.part === 'p7' ? toeicP7Spec(cfg.count) : { [cfg.part]: cfg.count };
        if (cfg.kind === 'errors') {
            style = 'train';
            const ids = [...new Set(S.wrong.map(toeicItemOf))];
            const order = Object.keys(TOEIC_PARTS);
            const partOf = id => id.startsWith('p7') ? 'p7' : id.slice(0, 2);
            sel = ids.sort((a, b) => order.indexOf(partOf(a)) - order.indexOf(partOf(b))).slice(0, 24).map(id => {
                const it = Object.values(TOEIC_BANK).flat().find(x => x.id === id);
                return it && it.qs ? [id, it.qs.map((_, i) => i).filter(i => { const r = S.hist.get(`${id}:${i}`); return !r || !r.ok; })] : [id, null];
            });
            sel = sel.filter(([id]) => Object.values(TOEIC_BANK).flat().some(x => x.id === id));
            if (!sel.length) { this.toast('Aucune erreur à rejouer pour le moment.', 'warning'); return; }
        } else sel = toeicPlan(spec, S.hist, rnd);
        const e = toeicExpand(sel, seed);
        if (!e.qs.length) { this.toast('Banque de questions vide.', 'error'); return; }
        const nR = e.qs.filter(q => TOEIC_PARTS[q.part].sec === 'R').length;
        const run = {
            id: uid('t'), kind: cfg.kind, style, seed, part: cfg.part || '', sel, phase: 'intro', unit: 0, ans: {}, flags: {}, ms: {},
            startedAt: Date.now(), readEnd: 0, readBudget: cfg.kind === 'full' ? 4500 : Math.round(nR * 45), resumed: false
        };
        this.exOpen(run);
    },
    exOpen(run) {
        if (this.session) this.endSession(false);
        const e = toeicExpand(run.sel, run.seed);
        this.ex = { run, units: e.units, qs: e.qs, t0: Date.now(), active: 0, timer: null, rv: null, filter: 'all' };
        TTS.stop();
        this.view = 'exam';
        this.render();
        window.scrollTo(0, 0);
        if (run.phase === 'play' && e.units[run.unit]) {
            const u = e.units[run.unit];
            if (u.sec === 'R') { this.exStartTimer(); }
            else { run.phase = 'dir'; run.resumed = true; }
        }
        this.exPersist();
        this.renderExam();
    },
    toeicResume() {
        const run = this.toeicSavedRun();
        if (!run) return;
        this.exOpen(run);
    },
    toeicAbandon() {
        this.exClearSaved();
        this.renderToeic();
        this.toast('Test abandonné', 'success');
    },
    exLeave() {
        const ex = this.ex;
        TTS.stop();
        if (ex && ex.timer) clearInterval(ex.timer);
        if (ex && ex.run && ex.run.phase !== 'done') { this.exAccrue(); this.exPersist(); }
        this.ex = null;
        if (Cloud.deferred) { Cloud.deferred = false; setTimeout(() => Cloud.sync(), 300); }
    },

    /* ---------- exam rendering ---------- */
    exSec() { const u = this.ex.units[this.ex.run.unit]; return u ? u.sec : 'R'; },
    exTitle() {
        const { run, units } = this.ex, u = units[run.unit];
        return `${TOEIC_KIND[run.kind]}${u ? ` · ${TOEIC_PARTS[u.part].label}` : ''}`;
    },
    renderExam() {
        const ex = this.ex, root = $('#view-exam');
        if (!ex) { root.innerHTML = ''; return; }
        const { run } = ex;
        if (run.phase === 'done') { this.renderResults(ex.result); return; }
        let body = '';
        if (run.phase === 'intro') body = this.exIntroHtml();
        else if (run.phase === 'dir') body = this.exDirHtml();
        else if (run.phase === 'break') body = this.exBreakHtml();
        else body = this.exUnitHtml();
        root.innerHTML = `<div class="ex">${this.exBarHtml()}<div class="ex-body">${body}</div>${run.phase === 'play' ? this.exFootHtml() : ''}</div>`;
        this.exAfterRender();
    },
    exBarHtml() {
        const { run, qs } = this.ex, u = this.ex.units[run.unit];
        const reading = run.phase === 'play' && u && u.sec === 'R' && run.readEnd;
        const range = u && run.phase === 'play' ? (u.q.length > 1 ? `Questions ${qs[u.q[0]].n}-${qs[u.q[u.q.length - 1]].n}` : `Question ${qs[u.q[0]].n}`) : '';
        return `<div class="ex-bar">
            <div class="ex-title"><b>${esc(this.exTitle())}</b><span class="small muted">${range}${qs.length ? ` / ${qs.length}` : ''}</span></div>
            ${reading ? `<div class="ex-timer" id="ex-timer" title="Temps restant en Reading">${ic('clock')}<span>${toeicMMSS((run.readEnd - Date.now()) / 1000)}</span></div>` : run.phase === 'play' && u && u.sec === 'L' ? `<div class="ex-timer lis">${ic('headphones')}<span>Listening</span></div>` : '<span></span>'}
            <div class="ex-actions">${run.phase === 'play' && u && u.sec === 'R' ? `<button class="btn btn-soft btn-sm" data-action="tq-sheet">${ic('grid')}<span class="hide-sm">Feuille de réponses</span></button>` : ''}<button class="btn btn-ghost btn-sm" data-action="tq-quit">${ic('x')}<span class="hide-sm">Quitter</span></button></div>
        </div>${run.phase === 'play' ? this.exProgressHtml() : ''}`;
    },
    exProgressHtml() {
        const { run, units, qs } = this.ex, u = units[run.unit];
        const total = qs.length, at = u ? qs[u.q[0]].i : 0;
        return `<div class="progress ex-prog"><i style="width:${Math.round(at / Math.max(1, total) * 100)}%;background:var(--primary)"></i></div>`;
    },
    exIntroHtml() {
        const { run, qs, units } = this.ex;
        const nL = qs.filter(q => TOEIC_PARTS[q.part].sec === 'L').length, nR = qs.length - nL;
        const parts = Object.keys(TOEIC_PARTS).map(p => ({ p, n: qs.filter(q => q.part === p).length })).filter(x => x.n);
        const audio = TTS.available();
        const minutes = nL ? Math.round(nL * 0.23) : 0;
        const exam = run.style === 'exam';
        return `<div class="panel panel-pad ex-card"><span class="hero-kicker" style="color:var(--primary)">${TOEIC_KIND[run.kind]}${run.part ? ' · ' + TOEIC_PARTS[run.part].name : ''}</span>
            <h2 class="page-title" style="margin:4px 0 6px">${run.kind === 'full' ? 'Test complet : Listening & Reading' : run.kind === 'mini' ? 'Mini-test en conditions réelles' : run.kind === 'errors' ? 'Rejouer mes erreurs' : TOEIC_PARTS[run.part].name}</h2>
            <p class="muted">${qs.length} questions${nL ? ` · Listening ≈ ${minutes} min` : ''}${nR ? ` · Reading ${exam ? Math.round(run.readBudget / 60) + ' min chrono' : 'sans chrono'}` : ''}${exam ? '' : ' · correction immédiate'}</p>
            <div class="tq-plan">${parts.map(({ p, n }) => `<span class="tq-plan-i" style="--c:${TOEIC_PARTS[p].color}"><i></i>${TOEIC_PARTS[p].label} <b>${n}</b></span>`).join('')}</div>
            <ul class="tq-rules">
                ${nL && exam ? '<li><b>L\'audio n\'est joué qu\'une seule fois</b> et s\'enchaîne tout seul : pas de pause, pas de retour en arrière.</li>' : ''}
                ${nL && !exam ? '<li>Tu peux <b>réécouter</b> chaque extrait et voir la transcription après ta réponse.</li>' : ''}
                ${nR && exam ? `<li>En Reading, tu navigues librement et tu peux <b>marquer</b> les questions à revoir. Le chrono (${Math.round(run.readBudget / 60)} min) ${nL ? 'démarre quand tu lances cette section' : 'démarre maintenant'}.</li>` : ''}
                <li>Aucune pénalité : <b>réponds à toutes les questions</b>.</li>
                <li>Raccourcis : <kbd>A</kbd>–<kbd>D</kbd> ou <kbd>1</kbd>–<kbd>4</kbd> pour répondre${nR ? ', <kbd>←</kbd> <kbd>→</kbd> pour naviguer, <kbd>F</kbd> pour marquer' : ''}.</li>
            </ul>
            ${nL ? `<div class="tq-sound ${audio ? '' : 'warn'}">${ic('volume')}<div class="grow">${audio ? `<b>Son prêt</b> · ${TTS.voices.length} voix anglaises détectées.` : `<b>Pas de voix anglaise détectée.</b> Le Listening s'affichera en texte (transcription) sur cet appareil.`}</div><button class="btn btn-soft btn-sm" data-action="tq-sound">Tester</button></div>` : ''}
            ${run.resumed ? '<p class="small muted">Test repris : on continue là où tu t\'étais arrêté.</p>' : ''}
            <div class="ex-cta"><button class="btn btn-primary btn-lg" data-action="tq-begin">${ic('play')}Commencer</button></div>
        </div>`;
    },
    exDirHtml() {
        const { run, units, qs } = this.ex, u = units[run.unit], P = TOEIC_PARTS[u.part], D = TOEIC_DIRECTIONS[u.part];
        const first = qs[u.q[0]].n;
        let last = first; units.forEach(x => { if (x.part === u.part) last = qs[x.q[x.q.length - 1]].n; });
        return `<div class="panel panel-pad ex-card"><span class="tq-part-badge" style="--c:${P.color}">${P.label}</span>
            <h2 class="page-title" style="margin:10px 0 4px">${P.name}</h2>
            <p class="small muted">Questions ${first} à ${last}</p>
            <div class="tq-paper"><b>${D[0]}</b><p>${esc(D[1])}</p></div>
            <p class="muted">${esc(D[2])}</p>
            ${run.resumed && u.sec === 'L' ? '<p class="small muted">On reprend à cette question : son audio redémarre depuis le début.</p>' : ''}
            ${P.sec === 'L' && TTS.available() ? '<p class="small faint">' + ic('volume', 'inl') + ' L\'audio démarre dès que tu cliques.</p>' : ''}
            <div class="ex-cta"><button class="btn btn-primary btn-lg" data-action="tq-start-part">${ic('play')}${P.sec === 'L' ? 'Lancer l\'audio' : 'Commencer la partie'}</button></div></div>`;
    },
    exBreakHtml() {
        const { run } = this.ex;
        return `<div class="panel panel-pad ex-card"><span class="tq-part-badge" style="--c:#6366f1">Section Reading</span>
            <h2 class="page-title" style="margin:10px 0 4px">La section Listening est terminée</h2>
            <p class="muted">${run.style === 'exam' ? `Tu as <b>${Math.round(run.readBudget / 60)} minutes</b> pour la section Reading. Le chrono démarre quand tu cliques.` : 'Passe à la lecture quand tu es prêt.'}</p>
            <div class="ex-cta"><button class="btn btn-primary btn-lg" data-action="tq-start-reading">${ic('play')}Démarrer le Reading</button></div></div>`;
    },
    exFootHtml() {
        const { run, units, qs } = this.ex, u = units[run.unit];
        if (u.sec === 'L') {
            if (run.style === 'train' || this.ex.textMode) {
                return `<div class="ex-foot"><button class="btn btn-soft" data-action="tq-replay">${ic('refresh')}Réécouter</button><span class="grow"></span><button class="btn btn-primary" data-action="tq-next">Suite${ic('chevronRight')}</button></div>`;
            }
            return '';
        }
        const last = run.unit >= units.length - 1, flagged = u.q.some(i => run.flags[i]);
        const unanswered = qs.filter(q => TOEIC_PARTS[q.part].sec === 'R' && run.ans[q.i] === undefined).length;
        return `<div class="ex-foot"><button class="btn btn-soft" data-action="tq-prev" ${this.exFirstReading() ? 'disabled' : ''}>${ic('arrowLeft')}<span class="hide-sm">Précédent</span></button>
            <button class="btn ${flagged ? 'btn-primary' : 'btn-soft'}" data-action="tq-flag">${ic('flagq')}<span>${flagged ? 'Marquée' : 'Marquer'}</span></button>
            <span class="grow small muted hide-sm" id="ex-unans">${unanswered ? `${unanswered} sans réponse` : 'Tout est répondu'}</span>
            ${last ? `<button class="btn btn-primary" data-action="tq-finish">${ic('check')}Terminer</button>` : `<button class="btn btn-primary" data-action="tq-next">Suivant${ic('chevronRight')}</button>`}</div>`;
    },
    exFirstReading() {
        const { run, units } = this.ex;
        let first = units.findIndex(u => u.sec === 'R');
        return run.unit <= first;
    },

    /* ---------- one unit on screen ---------- */
    exShowText() { const { run } = this.ex; return run.style === 'train' || this.ex.textMode; },
    exUnitHtml() {
        const { run, units, qs } = this.ex, u = units[run.unit], listening = u.sec === 'L';
        const qh = i => this.exQHtml(qs[i], 'play');
        let top = '';
        if (u.type === 'p1') {
            const it = u.item;
            top = `${toeicSceneHtml(it, false)}${this.exAudioHtml(u)}`;
        } else if (u.type === 'p2') top = this.exAudioHtml(u);
        else if (u.type === 'p3' || u.type === 'p4') top = this.exAudioHtml(u) + (u.item.g ? this.exGraphicHtml(u.item.g) : '');
        else if (u.type === 'p6') top = `${this.toeicWordChip()}<div class="panel panel-pad tq-doc">${u.item.ps.map(p => `<p>${esc(p).replace(/\[(\d)\](\s*_{2,})?/g, (m, d) => `<span class="blank">(${qs[u.q[Number(d) - 1]].n}) ______</span>`)}</p>`).join('')}</div>`;
        else if (u.type === 'p7') top = this.exDocsHtml(u.item);
        const split = u.type === 'p6' || u.type === 'p7';
        return `<div class="ex-unit ${split ? 'split' : ''}" data-unit="${run.unit}"><div class="ex-stim">${top}</div><div class="ex-qs">${u.q.map(qh).join('')}${u.type === 'p5' || !listening ? '' : ''}</div></div>`;
    },
    exAudioHtml(u) {
        const { run } = this.ex;
        if (this.ex.textMode) return this.exTranscriptHtml(u, true);
        return `<div class="tq-aud" id="tq-aud"><div class="tq-aud-ico">${ic('headphones')}</div><div class="grow"><b id="aud-title">Écoute…</b><div class="small muted" id="aud-status">${run.style === 'exam' ? 'L\'audio n\'est joué qu\'une seule fois.' : 'Appuie sur « Réécouter » si besoin.'}</div><div class="tq-win"><i id="aud-bar"></i></div></div><div class="tq-wave" id="aud-wave"><i></i><i></i><i></i><i></i><i></i></div></div><div id="tq-transcript"></div>`;
    },
    exGraphicHtml(g) {
        return `<div class="panel panel-pad tq-graphic"><b>${esc(g.ti)}</b><div class="tq-gr-rows">${g.rows.map(r => { const [a, ...b] = r.split(' : '); return `<div><span>${esc(a)}</span><span>${esc(b.join(' : '))}</span></div>`; }).join('')}</div></div>`;
    },
    exTranscriptHtml(u, always = false) {
        const it = u.item;
        let t = '';
        if (u.type === 'p1') t = it.o.map((o, i) => `<p><b>${toeicLetter(i)}.</b> ${esc(o)}</p>`).join('');
        else if (u.type === 'p2') t = `<p><b>Q.</b> ${esc(it.q)}</p>` + it.o.map((o, i) => `<p><b>${toeicLetter(i)}.</b> ${esc(o)}</p>`).join('');
        else if (u.type === 'p3') t = it.sp.map(([w, x]) => `<p><b class="spk">${w[0] === 'M' ? '♂' : '♀'}</b> ${esc(x)}</p>`).join('');
        else if (u.type === 'p4') t = it.tx.map(x => `<p>${esc(x)}</p>`).join('');
        return `<div class="panel panel-pad tq-transcript"><div class="small muted" style="margin-bottom:6px">${always ? 'Transcription (pas de voix anglaise sur cet appareil) :' : 'Transcription :'}</div>${t}</div>`;
    },
    exDocsHtml(it) {
        const docs = it.docs || [{ k: it.k, ti: it.ti, bl: it.bl }];
        return `${this.toeicWordChip()}<div class="tq-docs">${docs.map((d, i) => `<div class="panel panel-pad tq-doc">${docs.length > 1 ? `<div class="tq-doc-n">Document ${i + 1}</div>` : ''}${d.ti ? `<div class="tq-doc-ti">${esc(d.ti)}</div>` : ''}${this.exBlocksHtml(d.bl)}</div>`).join('')}</div>`;
    },
    exBlocksHtml(bl) {
        let out = '', i = 0;
        while (i < bl.length) {
            const b = bl[i];
            if (b[0] === 'r') {
                const rows = []; while (i < bl.length && bl[i][0] === 'r') rows.push(bl[i++][1]);
                out += `<div class="tq-tbl-wrap"><table class="tq-tbl"><thead><tr>${rows[0].map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
                continue;
            }
            if (b[0] === 'l') {
                const items = []; while (i < bl.length && bl[i][0] === 'l') items.push(bl[i++][1]);
                out += `<ul>${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
                continue;
            }
            if (b[0] === 'c') { out += `<div class="tq-chat ${b[1] === (bl.find(x => x[0] === 'c') || [])[1] ? 'a' : 'b'}"><div class="tq-chat-n">${esc(b[1])} <span>${esc(b[2])}</span></div><div class="tq-chat-m">${esc(b[3])}</div></div>`; i++; continue; }
            out += b[0] === 'h' ? `<div class="tq-doc-h">${esc(b[1])}</div>` : `<p>${toeicMarks(b[1])}</p>`;
            i++;
        }
        return out;
    },
    /* mode: 'play' (exam or training) | 'review' */
    exQHtml(q, mode, chosen) {
        const { run } = this.ex || {};
        const review = mode === 'review';
        const k = review ? chosen : run.ans[q.i];
        const reveal = review || (run.style === 'train' && k !== undefined);
        const hide = !review && TOEIC_PARTS[q.part].sec === 'L' && (q.part === 'p1' || q.part === 'p2') && !this.exShowText();
        const stem = q.part === 'p2' && hide ? '' : q.part === 'p5' ? esc(q.stem).replace(/_{3,}/g, '<span class="blank">______</span>') : q.part === 'p6' ? '' : toeicMarks(q.stem);
        const chosenPos = k === undefined || k < 0 ? -1 : q.opts.findIndex(o => o.k === k);
        const showText = !hide || reveal;
        const flagged = !review && run.flags[q.i];
        return `<div class="tq ${reveal ? 'revealed' : ''} ${review ? 'rv' : ''}" data-q="${q.i}">
            <div class="tq-head"><span class="tq-n">${q.n}</span><div class="tq-stem">${stem}${q.part === 'p6' && !stem ? `<span class="muted">Trou (${q.n})</span>` : ''}${q.part === 'p1' ? '<span class="muted">Choisis la phrase qui décrit l\'image.</span>' : ''}${q.part === 'p2' && hide ? '<span class="muted">Écoute la question puis choisis la meilleure réponse.</span>' : ''}</div>${!review && TOEIC_PARTS[q.part].sec === 'R' ? `<button class="tq-flagbtn ${flagged ? 'on' : ''}" data-action="tq-flag" data-i="${q.i}" title="Marquer pour y revenir" aria-label="Marquer la question ${q.n}">${ic('flagq')}</button>` : ''}</div>
            <div class="tq-opts">${q.opts.map((o, p) => {
                const cls = [p === chosenPos ? 'sel' : '', reveal && p === q.ans ? 'ok' : '', reveal && p === chosenPos && p !== q.ans ? 'bad' : ''].join(' ');
                const letter = toeicLetter(p);
                return review ? `<div class="tq-opt ${cls}"><span class="k">${letter}</span><span class="t">${toeicMarks(o.t)}</span>${p === q.ans ? `<span class="tq-mark ok">${ic('check')}</span>` : p === chosenPos ? `<span class="tq-mark bad">${ic('x')}</span>` : ''}</div>`
                    : `<button type="button" class="tq-opt ${cls} ${showText ? '' : 'letter-only'}" data-action="tq-pick" data-i="${q.i}" data-p="${p}" ${run.style === 'train' && k !== undefined ? 'disabled' : ''}><span class="k">${letter}</span>${showText ? `<span class="t">${toeicMarks(o.t)}</span>` : '<span class="t faint">(écoute)</span>'}</button>`;
            }).join('')}</div>
            ${reveal ? this.exFeedbackHtml(q, chosenPos, k === undefined || k < 0) : ''}
        </div>`;
    },
    exFeedbackHtml(q, chosenPos, none) {
        const ok = chosenPos === q.ans;
        return `<div class="tq-fb ${ok ? 'ok' : 'bad'}"><b>${ok ? 'Bonne réponse' : none ? `Sans réponse · bonne réponse : ${toeicLetter(q.ans)}` : `Faux · bonne réponse : ${toeicLetter(q.ans)}`}</b>${q.x ? `<p>${esc(q.x)}</p>` : ''}${q.t ? `<span class="tag">${esc(q.t)}</span>` : ''}</div>`;
    },
    exPaintQ(i) {
        const q = this.ex.qs[i], el = $(`.tq[data-q="${i}"]`);
        if (!el) return;
        const t = document.createElement('div');
        t.innerHTML = this.exQHtml(q, 'play');
        const fresh = t.firstElementChild;
        if (el.classList.contains('active')) fresh.classList.add('active');
        el.replaceWith(fresh);
        const un = $('#ex-unans');
        if (un) { const n = this.ex.qs.filter(x => TOEIC_PARTS[x.part].sec === 'R' && this.ex.run.ans[x.i] === undefined).length; un.textContent = n ? `${n} sans réponse` : 'Tout est répondu'; }
    },
    exAfterRender() {
        const { run, units } = this.ex;
        if (run.phase !== 'play') return;
        const u = units[run.unit];
        this.exSetActive(this.ex.active >= 0 && u.q.includes(this.ex.active) ? this.ex.active : u.q[0]);
    },
    exSetActive(i) {
        this.ex.active = i;
        $$('.tq').forEach(el => el.classList.toggle('active', Number(el.dataset.q) === i));
    },

    /* ---------- exam flow ---------- */
    exBegin() {
        const ex = this.ex, run = ex.run;
        ex.textMode = !TTS.available();
        run.unit = 0; run.phase = 'dir'; run.resumed = false;
        this.exPersist(); this.renderExam();
    },
    exManual() { return this.ex.run.style === 'train' || this.ex.textMode; },
    exStartPart() {
        const ex = this.ex, run = ex.run, u = ex.units[run.unit];
        if (ex.textMode === undefined) ex.textMode = !TTS.available();
        run.phase = 'play'; run.resumed = false;
        if (u.sec === 'R') {
            if (run.style === 'exam' && !run.readEnd) run.readEnd = Date.now() + run.readBudget * 1000;
            this.exStartTimer();
            this.exEnter(run.unit);
        } else if (this.exManual()) { this.exEnter(run.unit); if (!ex.textMode) this.exStartUnitAudio(run.unit); }
        else this.exListen(run.unit);
    },
    exStartReading() {
        const run = this.ex.run;
        run.phase = 'dir'; this.exPersist(); this.renderExam();
    },
    exEnter(u) {
        const ex = this.ex, run = ex.run;
        run.unit = u; run.phase = 'play'; ex.t0 = Date.now(); ex.active = ex.units[u].q[0];
        this.exPersist(); this.renderExam();
        const main = $('.ex-body'); if (main) main.scrollTop = 0;
        window.scrollTo(0, 0);
    },
    exAccrue() {
        const ex = this.ex;
        if (!ex || !ex.t0 || ex.run.phase !== 'play') { if (ex) ex.t0 = Date.now(); return; }
        const u = ex.units[ex.run.unit], now = Date.now();
        if (u) { const dt = Math.min(now - ex.t0, 20 * 60000) / u.q.length; u.q.forEach(i => { ex.run.ms[i] = Math.round((ex.run.ms[i] || 0) + dt); }); }
        ex.t0 = now;
    },
    exGo(u) {
        const ex = this.ex;
        if (u < 0 || u >= ex.units.length) return;
        this.exAccrue();
        TTS.stop();
        this.exEnter(u);
        if (ex.units[u].sec === 'L' && !ex.textMode) this.exStartUnitAudio(u);
    },
    exNext() {
        const ex = this.ex, run = ex.run, cur = ex.units[run.unit], next = ex.units[run.unit + 1];
        this.exAccrue();
        if (!next) { this.exFinish('end'); return; }
        if (cur.sec === 'L' && next.sec === 'R') { TTS.stop(); this.exAfterListening(run.unit + 1); return; }
        this.exGo(run.unit + 1);
    },
    exPrev() { const ex = this.ex; if (ex.run.unit > 0 && ex.units[ex.run.unit - 1].sec === ex.units[ex.run.unit].sec) this.exGo(ex.run.unit - 1); },
    exAfterListening(nextUnit) {
        const ex = this.ex, run = ex.run;
        if (nextUnit == null) nextUnit = ex.units.findIndex(u => u.sec === 'R');
        if (nextUnit < 0 || nextUnit >= ex.units.length) { this.exFinish('end'); return; }
        run.unit = nextUnit;
        run.phase = run.style === 'exam' ? 'break' : 'dir';
        this.exPersist(); this.renderExam();
    },
    exProfiles(unit) {
        const run = this.ex.run, rnd = toeicRng(`${run.seed}|v|${unit.id}`), accs = TTS.accents();
        const pool = accs.length ? [...accs, ...accs.filter(a => a === 'en-us')] : ['en-us'];
        const pickAcc = () => pool[Math.floor(rnd() * pool.length)];
        const used = [], sp = {};
        const who = unit.type === 'p3' ? [...new Set(unit.item.sp.map(s => s[0]))] : ['W', 'M'];
        who.forEach(w => { const p = TTS.pick(w[0] === 'W' ? 'f' : 'm', pickAcc(), used); if (p.voice) used.push(p.voice.name); sp[w] = p; });
        const narr = TTS.pick(rnd() < 0.5 ? 'f' : 'm', 'en-us', used);
        return { sp, narr, a: sp.W || sp.M, b: sp.M || sp.W };
    },
    exStartUnitAudio(u) {
        TTS.stop();
        const g = TTS.gen;
        this.exPlayUnit(this.ex.units[u], g);
    },
    exWindow(ms) {
        const bar = $('#aud-bar');
        if (bar) { bar.style.transition = 'none'; bar.style.width = '100%'; void bar.offsetWidth; bar.style.transition = `width ${ms * TTS.speed()}ms linear`; bar.style.width = '0%'; }
        return TTS.wait(ms);
    },
    exAudStatus(title, sub, speaking) {
        const t = $('#aud-title'), s = $('#aud-status'), w = $('#aud-wave');
        if (t && title != null) t.textContent = title;
        if (s && sub != null) s.textContent = sub;
        if (w) w.classList.toggle('speaking', !!speaking);
    },
    async exPlayUnit(unit, g) {
        const ex = this.ex, exam = ex.run.style === 'exam', P = this.exProfiles(unit), ok = () => TTS.gen === g && this.ex === ex;
        const qq = i => ex.qs[unit.q[i]];
        const say = async (text, prof, rate = 1) => { this.exAudStatus(null, null, true); const r = await TTS.say(text, prof, rate); this.exAudStatus(null, null, false); return r; };
        const it = unit.item;
        if (unit.type === 'p1' || unit.type === 'p2') {
            const q = qq(0);
            this.exAudStatus(unit.type === 'p1' ? 'Photographie' : 'Question - Réponse', `Question ${q.n}`);
            if (!await say(`Number ${q.n}.`, P.narr)) return;
            if (unit.type === 'p2') { if (!await say(it.q, P.a) || !await TTS.wait(500)) return; }
            for (let p = 0; p < q.opts.length; p++) {
                if (!await say(`${toeicLetter(p)}.`, P.narr, 0.95) || !await say(q.opts[p].t, unit.type === 'p2' ? P.b : P.narr)) return;
                if (!await TTS.wait(350)) return;
            }
            if (exam) { this.exAudStatus('À toi de répondre', 'Choisis ta réponse.'); if (!await this.exWindow(5000)) return; }
            else this.exAudStatus('Terminé', 'Réponds, puis lis la correction.');
        } else {
            this.exAudStatus(unit.type === 'p3' ? 'Conversation' : 'Exposé', 'Écoute attentivement…');
            if (unit.type === 'p3') {
                for (const [w, t] of it.sp) { if (!await say(t, P.sp[w] || P.a)) return; if (!await TTS.wait(380)) return; }
            } else if (!await say(it.tx.join(' '), P.a)) return;
            if (exam) {
                if (!await TTS.wait(1200)) return;
                for (let i = 0; i < unit.q.length; i++) {
                    const q = qq(i);
                    this.exSetActive(q.i);
                    this.exAudStatus(`Question ${q.n}`, 'Lecture de la question…');
                    if (!await say(`Number ${q.n}. ${q.stem}`, P.narr)) return;
                    this.exAudStatus(`Question ${q.n}`, 'À toi de répondre.');
                    if (!await this.exWindow(8000)) return;
                }
            } else this.exAudStatus('Terminé', 'Lis les questions et réponds.');
        }
        if (ok() && !exam) { /* manual flow: wait for the Suite button */ }
    },
    async exListen(from) {
        const ex = this.ex, run = ex.run;
        TTS.stop();
        const g = TTS.gen;
        let u = from;
        while (this.ex === ex && TTS.gen === g) {
            const unit = ex.units[u];
            this.exEnter(u);
            await this.exPlayUnit(unit, g);
            if (this.ex !== ex || TTS.gen !== g) return;
            this.exAccrue();
            const next = ex.units[u + 1];
            if (!next || next.sec !== 'L') { this.exAfterListening(next ? u + 1 : -1); return; }
            if (next.part !== unit.part) { run.unit = u + 1; run.phase = 'dir'; this.exPersist(); this.renderExam(); return; }
            u++;
        }
    },
    exReplay() {
        const ex = this.ex, u = ex.run.unit;
        if (ex.units[u].sec !== 'L' || ex.textMode) return;
        this.exStartUnitAudio(u);
    },
    exStartTimer() {
        const ex = this.ex;
        clearInterval(ex.timer);
        if (!ex.run.readEnd) return;
        const tick = () => {
            if (!this.ex || this.ex !== ex) { clearInterval(ex.timer); return; }
            const left = (ex.run.readEnd - Date.now()) / 1000, el = $('#ex-timer');
            if (el) { el.firstElementChild && (el.lastElementChild.textContent = toeicMMSS(left)); el.classList.toggle('low', left < 300); }
            if (left <= 0) { clearInterval(ex.timer); this.toast('Temps écoulé : le test est terminé.', 'warning', ic('clock')); this.exFinish('time'); }
        };
        ex.timer = setInterval(tick, 1000);
        tick();
    },
    exPick(i, p) {
        const ex = this.ex, run = ex.run, q = ex.qs[i];
        if (!q || !q.opts[p] || run.phase !== 'play') return;
        if (run.style === 'train' && run.ans[i] !== undefined) return;
        run.ans[i] = q.opts[p].k;
        this.exPersist();
        this.exPaintQ(i);
        this.exSetActive(i);
    },
    exFlag(i) {
        const ex = this.ex, run = ex.run;
        if (i == null) i = ex.active;
        if (run.flags[i]) delete run.flags[i]; else run.flags[i] = 1;
        this.exPersist();
        const b = $(`.tq[data-q="${i}"] .tq-flagbtn`); if (b) b.classList.toggle('on', !!run.flags[i]);
        this.exSyncFlag();
    },
    exSyncFlag() {
        const ex = this.ex, b = $('.ex-foot [data-action="tq-flag"]');
        if (!b) return;
        const on = !!ex.run.flags[ex.active];
        b.classList.toggle('btn-primary', on); b.classList.toggle('btn-soft', !on);
        const s = b.querySelector('span'); if (s) s.textContent = on ? 'Marquée' : 'Marquer';
    },
    exSheet() {
        const ex = this.ex, run = ex.run;
        const cells = ex.qs.filter(q => TOEIC_PARTS[q.part].sec === 'R').map(q => {
            const cur = ex.units[run.unit].q.includes(q.i);
            return `<button class="tq-cell ${run.ans[q.i] !== undefined ? 'done' : ''} ${run.flags[q.i] ? 'flag' : ''} ${cur ? 'cur' : ''}" data-action="tq-goto" data-u="${q.unit}">${q.n}</button>`;
        }).join('');
        const left = ex.qs.filter(q => TOEIC_PARTS[q.part].sec === 'R' && run.ans[q.i] === undefined).length;
        this.openModal({
            title: 'Feuille de réponses',
            body: `<div class="tq-sheet">${cells}</div><div class="tq-legend"><span><i class="done"></i>répondue</span><span><i class="flag"></i>marquée</span><span><i></i>sans réponse (${left})</span></div>`,
            foot: `<button class="btn btn-soft" data-close>Fermer</button><button class="btn btn-primary" data-action="tq-finish">${ic('check')}Terminer le test</button>`
        });
    },
    async exFinishAsk() {
        const ex = this.ex, run = ex.run;
        if (run.style === 'train') { this.exFinish('end'); return; }
        const left = ex.qs.filter(q => run.ans[q.i] === undefined).length;
        const ok = await this.confirm({ title: 'Terminer le test ?', message: left ? `Il reste <b>${left} question${left > 1 ? 's' : ''} sans réponse</b>. Aucune pénalité pour une mauvaise réponse : tente ta chance ! Terminer quand même ?` : 'Tu as répondu à toutes les questions. Terminer et voir ton score ?', ok: 'Terminer' });
        if (ok && this.ex === ex) this.exFinish('end');
    },
    exQuitDialog() {
        const ex = this.ex, run = ex.run;
        if (run.phase === 'done') { this.go('toeic'); return; }
        if (run.phase === 'intro') { this.go('toeic'); return; }
        const m = this.openModal({
            title: 'Quitter le test ?', size: 'narrow',
            body: `<p class="muted">${run.readEnd ? 'Attention : le chrono du Reading continue de tourner.' : 'Tu peux reprendre plus tard là où tu t\'es arrêté.'}</p>
                <div class="tq-quit"><button class="btn btn-soft btn-block" data-close>Continuer le test</button>
                <button class="btn btn-primary btn-block" data-q="finish">Terminer maintenant et voir mes résultats</button>
                <button class="btn btn-soft btn-block" data-q="later">Quitter et reprendre plus tard</button>
                <button class="btn btn-danger-soft btn-block" data-q="drop">Abandonner sans enregistrer</button></div>`
        });
        m.addEventListener('click', e => {
            const b = e.target.closest('[data-q]');
            if (!b) return;
            this.closeModal(m);
            if (b.dataset.q === 'finish') this.exFinish('quit');
            else if (b.dataset.q === 'later') this.go('toeic');
            else { this.exClearSaved(); this.ex.run.phase = 'done'; this.go('toeic'); }
        });
    },
    exFinish(reason) {
        const ex = this.ex;
        if (!ex || ex.run.phase === 'done') return;
        const run = ex.run;
        this.exAccrue();
        TTS.stop(); clearInterval(ex.timer);
        [...this.modals].forEach(m => this.closeModal(m));
        const answered = Object.keys(run.ans).length;
        this.exClearSaved();
        if (!answered) { run.phase = 'done'; this.toast('Aucune réponse : test non enregistré.', 'warning'); this.go('toeic'); return; }
        const sec = s => {
            const qs = ex.qs.filter(q => TOEIC_PARTS[q.part].sec === s);
            const raw = qs.filter(q => run.ans[q.i] !== undefined && toeicIsRight(q.uid, run.ans[q.i])).length;
            return { raw, n: qs.length, scaled: run.kind === 'full' || run.kind === 'mini' ? toeicScaled(raw, qs.length, s) : null };
        };
        const L = sec('L'), R = sec('R');
        const total = L.scaled != null && R.scaled != null ? L.scaled + R.scaled : null;
        const att = {
            id: run.id, at: Date.now(), kind: run.kind, style: run.style, seed: run.seed, part: run.part, dur: Math.round((Date.now() - run.startedAt) / 1000),
            L, R, total, d: ex.qs.map(q => [q.uid, run.ans[q.i] === undefined ? -1 : run.ans[q.i], Math.round((run.ms[q.i] || 0) / 1000) * 1000, run.flags[q.i] ? 1 : 0])
        };
        const T = this.data.toeic;
        T.attempts = normalizeToeic({ attempts: [...T.attempts, att], target: T.target, goalDate: T.goalDate }).attempts;
        T.mod = Date.now();
        run.phase = 'done';
        this.save();
        this.toeicShow(att);
    },

    /* ---------- results & correction ---------- */
    toeicReview(att) {
        const sel = [];
        att.d.forEach(([uid]) => {
            const id = toeicItemOf(uid), e = TOEIC_IDX.get(uid);
            if (!e) return;
            const last = sel[sel.length - 1];
            if (e.qi < 0) sel.push([id, null]);
            else if (last && last[0] === id && last[1]) last[1].push(e.qi);
            else sel.push([id, [e.qi]]);
        });
        const ex = toeicExpand(sel, att.seed), by = new Map(att.d.map(x => [x[0], x]));
        return { units: ex.units, qs: ex.qs, by };
    },
    toeicShow(att) {
        const run = this.ex ? this.ex.run : null;
        if (this.ex && this.ex.timer) clearInterval(this.ex.timer);
        TTS.stop();
        this.ex = { run: { phase: 'done', unit: 0 }, units: [], qs: [], result: att, rv: this.toeicReview(att), filter: 'all', timer: null };
        this.view = 'exam';
        this.render();
        window.scrollTo(0, 0);
    },
    toeicWeak(rv) {
        const tags = {};
        rv.qs.forEach(q => {
            if (!q.t) return;
            const d = rv.by.get(q.uid), t = tags[q.t] || (tags[q.t] = { n: 0, bad: 0 });
            t.n++; if (!d || !toeicIsRight(q.uid, d[1])) t.bad++;
        });
        return Object.entries(tags).filter(([, t]) => t.n >= 2 && t.bad / t.n >= 0.4).sort((a, b) => b[1].bad - a[1].bad).slice(0, 5);
    },
    renderResults(att) {
        const ex = this.ex, rv = ex.rv, root = $('#view-exam');
        const right = q => { const d = rv.by.get(q.uid); return d && toeicIsRight(q.uid, d[1]); };
        const scored = att.total != null, cefr = toeicCefr(att.total);
        const nRight = rv.qs.filter(right).length, pct = Math.round(nRight / Math.max(1, rv.qs.length) * 100);
        const parts = Object.keys(TOEIC_PARTS).map(p => {
            const qs = rv.qs.filter(q => q.part === p);
            if (!qs.length) return null;
            const ok = qs.filter(right).length, ms = qs.reduce((a, q) => a + (rv.by.get(q.uid) || [0, 0, 0])[2], 0);
            return { p, n: qs.length, ok, pct: Math.round(ok / qs.length * 100), avg: ms / qs.length / 1000, ms };
        }).filter(Boolean);
        const weak = this.toeicWeak(rv), T = this.data.toeic;
        const wrongUids = rv.qs.filter(q => !right(q)).map(q => q.uid);
        const secBar = (label, s) => s.scaled == null ? '' : `<div class="tq-sec"><div class="tq-sec-top"><span>${label}</span><b>${s.scaled}<small> / 495</small></b></div><div class="progress"><i style="width:${s.scaled / 495 * 100}%;background:var(--primary)"></i></div><div class="tiny muted">${s.raw} bonnes réponses sur ${s.n}</div></div>`;
        const tips = parts.filter(x => x.pct < 70).map(x => {
            const P = TOEIC_PARTS[x.p];
            const t = { p1: 'Apprends le vocabulaire d\'actions et de lieux (« is carrying », « are seated », « is being repaired »).', p2: 'Entraîne-toi sur les mots interrogatifs (When, Where, Who, Why, How) et repère les pièges de sons proches.', p3: 'Lis les 3 questions avant l\'audio et note qui parle, de quoi, et le problème évoqué.', p4: 'Identifie le type d\'exposé (annonce, message, discours) dès la première phrase.', p5: 'Révise la grammaire (natures de mots, temps, prépositions) avec le pack « TOEIC Grammaire ».', p6: 'Lis la phrase entière autour du trou : connecteurs et temps dépendent du contexte.', p7: 'Cherche d\'abord le sujet du document, puis les détails demandés ; élimine les options fausses.' }[x.p];
            return `<li><b>${P.label} · ${P.name} (${x.pct} %)</b> : ${t}</li>`;
        });
        const readParts = parts.filter(x => TOEIC_PARTS[x.p].sec === 'R');
        const pacing = att.kind === 'full' && readParts.length ? `<div class="tq-pace">${readParts.map(x => { const rec = { p5: 20, p6: 10, p7: 45 }[x.p], min = x.ms / 60000; return `<div><span>${TOEIC_PARTS[x.p].label}</span><b class="${min > rec * 1.15 ? 'over' : ''}">${min.toFixed(0)} min</b><span class="tiny faint">repère : ${rec} min</span></div>`; }).join('')}</div>` : '';
        root.innerHTML = `<div class="ex"><div class="ex-bar"><div class="ex-title"><b>Résultats</b><span class="small muted">${TOEIC_KIND[att.kind] || ''}${att.part ? ' · ' + TOEIC_PARTS[att.part].name : ''} · ${new Date(att.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span></div><span></span><div class="ex-actions"><button class="btn btn-soft btn-sm" data-action="tq-home">${ic('arrowLeft')}Simulateur</button></div></div>
        <div class="ex-body stack">
            <div class="hero tq-score"><div class="hero-inner"><div>
                <span class="hero-kicker">${scored ? 'Score estimé' : 'Résultat'}</span>
                ${scored ? `<div class="tq-big">${att.total}<small> / 990</small></div><div class="tq-cefr">${cefr.level} · ${cefr.label}</div>` : `<div class="tq-big">${pct}<small> %</small></div><div class="tq-cefr">${nRight} bonnes réponses sur ${rv.qs.length}</div>`}
                <p class="hero-sub">${scored ? (att.total >= T.target ? `Objectif de ${T.target} atteint !` : `Objectif ${T.target} : encore ${T.target - att.total} points.`) : 'Pour une estimation de score, fais un mini-test ou un test complet.'}${att.kind === 'mini' ? ' (projection sur 200 questions, à prendre avec prudence)' : ''}</p>
            </div><div class="tq-secs">${secBar('Listening', att.L)}${secBar('Reading', att.R)}</div></div></div>
            <div class="tq-actions"><button class="btn btn-primary" data-action="tq-again">${ic('refresh')}Refaire un ${att.kind === 'full' ? 'test complet' : att.kind === 'mini' ? 'mini-test' : 'entraînement'}</button>
                ${wrongUids.length ? `<button class="btn btn-soft" data-action="tq-addall">${ic('card')}Ajouter mes ${wrongUids.length} erreurs aux cartes</button>` : ''}
                <button class="btn btn-soft" data-action="tq-home">Retour au simulateur</button></div>
            <div class="panel panel-pad"><h3 class="section-title" style="margin-bottom:12px">Par partie</h3>
                <div class="tq-bars">${parts.map(x => `<div class="tq-bar-row"><span class="tq-bar-l"><b>${TOEIC_PARTS[x.p].label}</b> ${TOEIC_PARTS[x.p].name}</span><div class="progress"><i style="width:${x.pct}%;background:${TOEIC_PARTS[x.p].color}"></i></div><span class="tq-bar-v">${x.ok}/${x.n}</span><span class="tiny faint tq-bar-t">${x.avg >= 1 ? Math.round(x.avg) + ' s/q' : ''}</span></div>`).join('')}</div>${pacing ? `<h4 style="margin:16px 0 8px">Temps passé en Reading</h4>${pacing}` : ''}</div>
            ${tips.length || weak.length ? `<div class="panel panel-pad"><h3 class="section-title" style="margin-bottom:10px">Pour progresser</h3>${tips.length ? `<ul class="tq-tipl">${tips.join('')}</ul>` : ''}${weak.length ? `<div class="small muted" style="margin:10px 0 6px">Points faibles repérés :</div><div class="chip-row" style="flex-wrap:wrap">${weak.map(([t, v]) => `<span class="chip">${esc(t)} <span class="count">${v.bad}/${v.n}</span></span>`).join('')}</div>` : ''}<div style="margin-top:12px"><button class="link" data-action="open-library">${ic('layers')}Ouvrir la bibliothèque (packs TOEIC)</button></div></div>` : ''}
            <div><div class="section-head"><h3 class="section-title">Correction détaillée</h3></div>
                <div class="chip-row" id="tq-filters">${[['all', 'Toutes', rv.qs.length], ['wrong', 'Fausses', wrongUids.length], ['flag', 'Marquées', rv.qs.filter(q => (rv.by.get(q.uid) || [])[3]).length], ['none', 'Sans réponse', rv.qs.filter(q => (rv.by.get(q.uid) || [0, 0])[1] < 0).length]].map(([k, l, n]) => `<button class="chip ${ex.filter === k ? 'active' : ''}" data-action="tq-filter" data-f="${k}">${l} <span class="count">${n}</span></button>`).join('')}</div>
                <div class="tq-rv" id="tq-rv">${this.toeicReviewHtml()}</div></div>
        </div></div>`;
    },
    toeicReviewHtml() {
        const ex = this.ex, rv = ex.rv, f = ex.filter;
        const match = q => { const d = rv.by.get(q.uid) || [q.uid, -1, 0, 0]; return f === 'all' || (f === 'wrong' && !toeicIsRight(q.uid, d[1])) || (f === 'flag' && d[3]) || (f === 'none' && d[1] < 0); };
        const out = rv.units.filter(u => u.q.some(i => match(rv.qs[i]))).map(u => {
            const first = rv.qs[u.q[0]], P = TOEIC_PARTS[u.part];
            let stim = '';
            if (u.sec === 'L') stim = this.exTranscriptHtml(u) + (u.item.g ? this.exGraphicHtml(u.item.g) : '');
            else if (u.type === 'p6') stim = `<div class="tq-doc">${u.item.ps.map(p => `<p>${esc(p).replace(/\[(\d)\](\s*_{2,})?/g, (m, d) => { const q = rv.qs[u.q[Number(d) - 1]]; return `<span class="blank filled">(${q.n}) ${esc(q.opts[q.ans].t)}</span>`; })}</p>`).join('')}</div>`;
            else if (u.type === 'p7') stim = this.exDocsHtml(u.item);
            const sceneHtml = u.type === 'p1' ? toeicSceneHtml(u.item, true) : '';
            return `<div class="panel panel-pad tq-rv-unit"><div class="tq-rv-head"><span class="tq-part-badge" style="--c:${P.color}">${P.label}</span><span class="small muted">${u.q.length > 1 ? `Questions ${first.n}-${rv.qs[u.q[u.q.length - 1]].n}` : `Question ${first.n}`}</span></div>
                ${sceneHtml}${stim ? `<details class="tq-rv-stim" ${u.type === 'p6' ? 'open' : ''}><summary>${u.sec === 'L' ? 'Transcription' : u.type === 'p6' ? 'Texte complété' : 'Voir les documents'}</summary>${stim}</details>` : ''}
                ${u.q.map(i => { const q = rv.qs[i], d = rv.by.get(q.uid) || [q.uid, -1, 0, 0]; return `${this.exQHtml(q, 'review', d[1] < 0 ? -1 : d[1])}<div class="tq-rv-meta">${d[2] ? `<span>${Math.round(d[2] / 1000)} s</span>` : ''}${d[3] ? `<span class="tag">marquée</span>` : ''}<button class="link" data-action="tq-addcard" data-uid="${esc(q.uid)}">${ic('plus')}Ajouter aux cartes</button></div>`; }).join('')}</div>`;
        });
        return out.length ? out.join('') : '<p class="muted">Rien à afficher pour ce filtre.</p>';
    },

    /* ---------- turn questions into flashcards ---------- */
    toeicCardFor(uid) {
        const e = TOEIC_IDX.get(uid);
        if (!e) return null;
        const it = e.item, tags = ['toeic', `toeic-${e.part}`, ...((e.qi < 0 ? it.t : it.qs[e.qi].t) ? [(e.qi < 0 ? it.t : it.qs[e.qi].t).replace(/\s+/g, '-')] : [])];
        const plain = h => escapePlain(String(h));
        if (e.part === 'p5') return { type: 'cloze', front: plain(it.q.replace(/_{3,}/, `{{c1::${it.o[0]}}}`)), back: plain(it.x), hint: '', detail: '', tags };
        if (e.part === 'p1' && it.ph) { const ph = typeof TOEIC_PHOTOS !== 'undefined' ? TOEIC_PHOTOS[it.ph] : null; return { type: 'basic', front: plain(`Part 1 — photo : ${ph ? ph.d : it.ph}. Quelle phrase la décrit le mieux ?`), back: plain(`${it.o[0]}\n\n${it.x}`), hint: '', detail: '', tags }; }
        if (e.part === 'p1') return { type: 'basic', front: plain(`Scène : ${it.e.join(' ')} — quelle phrase décrit le mieux l'image ?`), back: plain(`${it.o[0]}\n\n${it.x}`), hint: '', detail: '', tags };
        if (e.part === 'p2') return { type: 'basic', front: plain(it.q), back: plain(`${it.o[0]}\n\n${it.x}`), hint: '', detail: '', tags };
        const q = it.qs[e.qi];
        let detail = '';
        if (it.sp) detail = it.sp.map(s => s[1]).join(' ');
        else if (it.tx) detail = it.tx.join(' ');
        else if (it.ps) detail = it.ps.join(' ');
        else detail = (it.docs ? it.docs.flatMap(d => d.bl) : it.bl).map(b => b[0] === 'r' ? b[1].join(' | ') : b[0] === 'c' ? `${b[1]}: ${b[3]}` : b[1]).join(' ');
        const front = q.q || `${it.ti || it.t} : trou n° ${e.qi + 1}`;
        return { type: 'basic', front: plain(front), back: plain(`${q.o[q.a]}\n\n${q.x}`), hint: '', detail: plain(detail.slice(0, 1800)), tags };
    },
    toeicAddCards(uids) {
        const cards = uids.map(u => this.toeicCardFor(u)).filter(Boolean);
        if (!cards.length) return 0;
        const deckId = 'toeic_err', have = new Set(this.data.cards.filter(c => c.deckId === deckId).map(c => c.front));
        let added = 0;
        this.change('cartes TOEIC', [], () => {
            if (!this.deck(deckId)) this.data.decks.push({ id: deckId, name: 'TOEIC : mes erreurs', emoji: '🎯', description: 'Questions du simulateur TOEIC ratées', created: Date.now(), parent: null, opts: null, mod: 0, preset: this.data.presets.some(x => x.id === TOEIC_PRESET_ID) ? TOEIC_PRESET_ID : null, limits: null });
            const made = [];
            cards.forEach(c => {
                const key = c.type === 'cloze' ? c.front : c.front;
                if (have.has(key)) return;
                const ids = this.createNote({ ...c, deckId });
                if (ids) { made.push(...ids); added++; have.add(key); }
            });
            return made;
        }, { decks: true });
        return added;
    },

    /* ---------- keyboard ---------- */
    examKey(e) {
        const ex = this.ex;
        if (!ex || e.ctrlKey || e.metaKey || e.altKey) return;
        const run = ex.run, tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        const k = e.key.toLowerCase();
        if (k === 'escape') { e.preventDefault(); this.exQuitDialog(); return; }
        if (run.phase === 'intro' && k === 'enter') { e.preventDefault(); this.exBegin(); return; }
        if (run.phase === 'dir' && k === 'enter') { e.preventDefault(); this.exStartPart(); return; }
        if (run.phase === 'break' && k === 'enter') { e.preventDefault(); this.exStartReading(); return; }
        if (run.phase !== 'play') return;
        const u = ex.units[run.unit], opt = 'abcd'.indexOf(k) >= 0 ? 'abcd'.indexOf(k) : '1234'.indexOf(k);
        if (opt >= 0) { e.preventDefault(); this.exPick(ex.active, opt); return; }
        const manual = u.sec === 'R' || this.exManual();
        if (!manual) return;
        if (k === 'arrowright') { e.preventDefault(); if (run.unit < ex.units.length - 1) this.exNext(); }
        else if (k === 'arrowleft') { e.preventDefault(); this.exPrev(); }
        else if (k === 'f' && u.sec === 'R') { e.preventDefault(); this.exFlag(); }
        else if (k === 'r' && u.sec === 'L') { e.preventDefault(); this.exReplay(); }
    },
    examActive() { return !!(this.ex && this.ex.run && this.ex.run.phase !== 'done'); },

    /* ---------- actions ---------- */
    async toeicAction(action, el) {
        const ds = el.dataset || {};
        switch (action) {
            case 'tq-full': case 'tq-mini': case 'tq-errors': {
                if (this.toeicSavedRun() && !(await this.confirm({ title: 'Remplacer le test en cours ?', message: 'Un test est déjà en cours. En commencer un nouveau l\'abandonne.', ok: 'Nouveau test', danger: true }))) return;
                this.toeicStart({ kind: action.slice(3), style: action === 'tq-errors' ? 'train' : 'exam' });
                break;
            }
            case 'tq-part': this.toeicPartModal(ds.part); break;
            case 'tq-resume': this.toeicResume(); break;
            case 'tq-abandon': this.toeicAbandon(); break;
            case 'tq-goal': this.toeicGoalModal(); break;
            case 'tq-sound': this.toeicSoundModal(); break;
            case 'tq-sample': {
                TTS.stop();
                const p = TTS.pick(ds.g, ds.a);
                TTS.say('Good morning, everyone. Thank you for joining today\'s meeting.', p);
                break;
            }
            case 'tq-open-att': { const a = this.data.toeic.attempts.find(x => x.id === ds.id); if (a) this.toeicShow(a); break; }
            case 'tq-home': this.go('toeic'); break;
            case 'tq-begin': this.exBegin(); break;
            case 'tq-start-part': this.exStartPart(); break;
            case 'tq-start-reading': this.exStartReading(); break;
            case 'tq-pick': this.exPick(Number(ds.i), Number(ds.p)); break;
            case 'tq-flag': this.exFlag(ds.i === undefined ? null : Number(ds.i)); break;
            case 'tq-next': this.exNext(); break;
            case 'tq-prev': this.exPrev(); break;
            case 'tq-replay': this.exReplay(); break;
            case 'tq-sheet': this.exSheet(); break;
            case 'tq-goto': { this.closeModal(); this.exGo(Number(ds.u)); break; }
            case 'tq-finish': this.closeModal(); this.exFinishAsk(); break;
            case 'tq-quit': this.exQuitDialog(); break;
            case 'tq-filter': { this.ex.filter = ds.f; $$('#tq-filters .chip').forEach(c => c.classList.toggle('active', c.dataset.f === ds.f)); $('#tq-rv').innerHTML = this.toeicReviewHtml(); break; }
            case 'tq-again': {
                const a = this.ex.result, items = new Set(a.d.map(x => toeicItemOf(x[0]))).size;
                this.toeicStart({ kind: a.kind === 'errors' ? 'errors' : a.kind, part: a.part, count: a.part === 'p7' ? a.d.length : items, style: a.style });
                break;
            }
            case 'tq-wordmode': { this.ex.wordMode = !this.toeicWordOn(); this.toeicWordChipsRefresh(); break; }
            case 'tq-word-save': this.toeicWordSave(); break;
            case 'tq-addcard': { const n = this.toeicAddCards([ds.uid]); this.toast(n ? 'Carte ajoutée au paquet « TOEIC : mes erreurs »' : 'Déjà dans tes cartes', n ? 'success' : 'warning'); break; }
            case 'tq-addall': {
                const rv = this.ex.rv, uids = rv.qs.filter(q => !toeicIsRight(q.uid, (rv.by.get(q.uid) || [0, -1])[1])).map(q => q.uid);
                const n = this.toeicAddCards(uids);
                this.toast(n ? `${n} carte${n > 1 ? 's' : ''} ajoutée${n > 1 ? 's' : ''} au paquet « TOEIC : mes erreurs »` : 'Ces erreurs sont déjà dans tes cartes', n ? 'success' : 'warning');
                break;
            }
            default: break;
        }
    }
});

/* Part 1 picture: a real photo (TOEIC_PHOTOS, with credit line) or the emoji scene fallback */
function toeicSceneHtml(it, small) {
    const ph = it.ph && typeof TOEIC_PHOTOS !== 'undefined' ? TOEIC_PHOTOS[it.ph] : null;
    if (ph) return `<figure class="tq-photo${small ? ' small' : ''}"><img src="${ph.s}" alt="" draggable="false"><figcaption>${esc(ph.c)}</figcaption></figure>`;
    return `<div class="tq-scene scene-${esc(it.bg)}${small ? ' small' : ''}"><div class="tq-scene-ground"></div><div class="tq-scene-em">${(it.e || []).map(e => `<span>${esc(e)}</span>`).join('')}</div></div>`;
}

/* ---------- « mot inconnu » : touche un mot d'un texte (parties 6 et 7) pour en faire une carte ---------- */
Object.assign(SuperAnki.prototype, {
    toeicWordOn() { const ex = this.ex; return !!ex && (ex.wordMode === undefined ? (ex.run && ex.run.style === 'train') || !!ex.rv : ex.wordMode); },
    toeicWordChip() { return `<button class="chip tq-wm${this.toeicWordOn() ? ' active' : ''}" data-action="tq-wordmode">🔎 Mot inconnu : ${this.toeicWordOn() ? 'activé — touche un mot' : 'désactivé'}</button>`; },
    toeicWordChipsRefresh() { const on = this.toeicWordOn(); $$('.tq-wm').forEach(b => { b.classList.toggle('active', on); b.textContent = `🔎 Mot inconnu : ${on ? 'activé — touche un mot' : 'désactivé'}`; }); },
    /* word + sentence under a tap, via the browser's caret hit-test */
    toeicWordAt(x, y) {
        let node, off;
        if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(x, y); if (p) { node = p.offsetNode; off = p.offset; } }
        else if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); if (r) { node = r.startContainer; off = r.startOffset; } }
        if (!node || node.nodeType !== 3) return null;
        const t = node.nodeValue, isW = ch => /[A-Za-zÀ-ÿ'’\-]/.test(ch || '');
        let a = Math.min(off, t.length), b = a;
        if (!isW(t[a]) && isW(t[a - 1])) { a--; b--; }
        while (a > 0 && isW(t[a - 1])) a--;
        while (b < t.length && isW(t[b])) b++;
        let w = t.slice(a, b).replace(/^['’\-]+|['’\-]+$/g, '').replace(/['’]s$/i, '');
        if (w.length < 2 || !/[A-Za-z]/.test(w)) return null;
        const blk = node.parentElement && node.parentElement.closest('p,li,td,th,.tq-chat-m,.tq-doc-h,.tq-doc-ti,div') || node.parentElement;
        const full = (blk ? blk.textContent : t).replace(/\s+/g, ' ').trim();
        const sents = full.match(/[^.!?]+[.!?]*/g) || [full], lw = w.toLowerCase();
        const sent = (sents.find(s => s.toLowerCase().includes(lw)) || full).trim().slice(0, 240);
        return { word: w, sent: sent.replace(/_{2,}/g, '…') };
    },
    toeicWordTap(e) {
        if (!this.toeicWordOn() || e.target.closest('button,a,input,textarea,select,summary,.modal-back,.tq-opt,label')) return;
        if (!e.target.closest('.tq-doc,.tq-rv-stim')) return;
        const sel = window.getSelection && String(window.getSelection()).trim();
        const hit = this.toeicWordAt(e.clientX, e.clientY);
        if (!hit) return;
        this.toeicWordAsk(hit.word, hit.sent);
    },
    toeicWordAsk(word, sent) {
        const m = this.openModal({ title: '🔎 Mot inconnu', body: `
            <div class="field"><label>Mot ou expression (modifiable)</label><input class="input" id="tw-word" value="${esc(word.toLowerCase())}" autocapitalize="none" spellcheck="false"></div>
            <div class="field"><label>Traduction en français <span class="muted" id="tw-st"></span></label><input class="input" id="tw-fr" placeholder="Recherche de la traduction…" autocapitalize="none"></div>
            <div class="field"><label>Phrase d'origine (gardée en indice)</label><textarea class="input" id="tw-sent" rows="3">${esc(sent)}</textarea></div>`,
            foot: `<button class="btn ghost" data-close>Annuler</button><button class="btn primary" data-action="tq-word-save">Créer la carte</button>` });
        this._tw = m;
        const fr = $('#tw-fr', m), st = $('#tw-st', m);
        const look = () => {
            const w = $('#tw-word', m).value.trim(); if (!w) return;
            st.textContent = '(recherche…)';
            const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 5000);
            fetch(`https://api.mymemory.translated.net/get?langpair=en|fr&q=${encodeURIComponent(w)}`, { signal: ctl.signal }).then(r => r.json()).then(j => {
                const tr = j && j.responseData && j.responseData.translatedText;
                if (tr && !fr.value && !/MYMEMORY|INVALID/i.test(tr)) { fr.value = tr.toLowerCase(); st.textContent = '(proposition automatique : vérifie-la)'; }
                else st.textContent = '(à compléter)';
            }).catch(() => { st.textContent = navigator.onLine ? '(à compléter)' : '(hors ligne : saisis-la)'; }).finally(() => { clearTimeout(to); fr.placeholder = 'Traduction'; });
        };
        look();
        $('#tw-word', m).addEventListener('change', () => { fr.value = ''; look(); });
        setTimeout(() => fr.focus(), 50);
    },
    toeicWordSave() {
        const m = this._tw; if (!m) return;
        const word = $('#tw-word', m).value.trim(), fr = $('#tw-fr', m).value.trim(), sent = $('#tw-sent', m).value.trim();
        if (!word || !fr) { this.toast('Renseigne le mot et sa traduction', 'warning'); return; }
        const deckId = 'toeic_words', plain = h => escapePlain(String(h));
        const dup = this.data.cards.some(c => c.deckId === deckId && c.front.toLowerCase() === plain(word).toLowerCase());
        if (dup) { this.toast('Ce mot est déjà dans « TOEIC : mots inconnus »', 'warning'); this.closeModal(m); return; }
        this.change('mot inconnu TOEIC', [], () => {
            if (!this.deck(deckId)) this.data.decks.push({ id: deckId, name: 'TOEIC : mots inconnus', emoji: '🔎', description: 'Mots touchés dans les textes du simulateur', created: Date.now(), parent: null, opts: null, mod: 0, preset: this.data.presets.some(x => x.id === TOEIC_PRESET_ID) ? TOEIC_PRESET_ID : null, limits: null });
            return this.createNote({ type: 'basic', deckId, front: plain(word), back: plain(fr), hint: plain(sent), detail: '', tags: ['toeic', 'mot-inconnu'] });
        }, { decks: true });
        this.closeModal(m); this._tw = null;
        this.toast(`« ${word} » ajouté à « TOEIC : mots inconnus »`, 'success');
    }
});
document.addEventListener('click', e => { if (typeof app !== 'undefined' && app && app.toeicWordTap) app.toeicWordTap(e); });
