/* ============================================================
   Study helpers: trash (restore deleted cards and decks), session timer, voice study.
   ============================================================ */
const TRASH_DAYS = 30, TRASH_MAX = 1000;

function normalizeTrash(list) {
    const cut = Date.now() - TRASH_DAYS * DAY, seen = new Set(), out = [];
    toArray(list).forEach(t => {
        if (!t || !t.c || !['card', 'deck'].includes(t.k) || num(t.at) < cut) return;
        const c = t.k === 'card' ? normalizeCard(t.c) : (t.c.id ? { id: String(t.c.id), name: String(t.c.name || 'Sans nom').slice(0, 80), emoji: String(t.c.emoji || '📁').slice(0, 8), description: String(t.c.description || '').slice(0, 300), created: num(t.c.created), parent: t.c.parent ? String(t.c.parent) : null, opts: null, mod: num(t.c.mod), preset: t.c.preset ? String(t.c.preset) : null, limits: t.c.limits && typeof t.c.limits === 'object' ? { ...t.c.limits } : null } : null);
        if (!c || seen.has(`${t.k}${c.id}`)) return;
        seen.add(`${t.k}${c.id}`);
        out.push({ k: t.k, at: num(t.at), c });
    });
    return out.sort((a, b) => b.at - a.at).slice(0, TRASH_MAX);
}
function mergeTrash(a, b, cards, decks) {
    const live = new Set([...cards.map(c => `card${c.id}`), ...decks.map(d => `deck${d.id}`)]);
    const seen = new Map();
    [...(a || []), ...(b || [])].forEach(t => { const k = `${t.k}${t.c.id}`; if (!live.has(k) && (!seen.has(k) || seen.get(k).at < t.at)) seen.set(k, t); });
    return normalizeTrash([...seen.values()]);
}
/* language of a card text, to read it aloud with the right voice */
function guessLang(text) {
    const w = fold(text).split(/[^a-z']+/).filter(Boolean);
    if (!w.length) return 'fr-FR';
    const EN = new Set('the of and to in is are was were you your it that this with for on be have has what which who how do does not can will would we they he she an at from by or as but if about'.split(' '));
    const FR = new Set('le la les un une des du de et est sont pour dans sur avec que qui quoi pas ce cette ces il elle nous vous ils je tu au aux en par ou mais comme plus'.split(' '));
    let en = 0, fr = 0;
    w.forEach(x => { if (EN.has(x)) en++; if (FR.has(x)) fr++; });
    if (/[éèêàùçôî]/i.test(text)) fr += 2;
    return en > fr ? 'en-US' : 'fr-FR';
}

/* ---------- voice commands (French; a few English words too) ----------
   Matching is tolerant: accents, plurals, small recognition mistakes (1-2 letters) and the usual mis-hearings are accepted. */
const VOICE_CMDS = [
    ['stop', ['stop', 'arrete', 'arreter', 'arretes', 'quitter', 'termine', 'terminer', 'fin du mode', 'pause']],
    ['repeat', ['repete', 'repeter', 'repetez', 'relis', 'relire', 'encore une fois', 'rejoue', 'rejouer']],
    ['hint', ['indice', 'indices', 'un indice', 'un indisse', 'indisse', 'hint', 'aide', 'aide moi', 'coup de pouce']],
    ['undo', ['annule', 'annuler', 'retour', 'precedent']],
    [1, ['rate', 'ratee', 'rater', 'rates', 'oublie', 'oublier', 'encore', 'non', 'faux', 'pas su', 'pas bien', 'pas correct', 'je ne savais pas', 'je savais pas', 'again', 'rate pas', 'ra te']],
    [4, ['facile', 'faciles', 'evident', 'evidente', 'trop facile', 'easy', 'parfait', 'fastile']],
    [2, ['difficile', 'difficiles', 'dur', 'dure', 'moyen', 'hesite', 'hard', 'difficil']],
    [3, ['bien', 'bienne', 'bian', 'ok', 'okay', 'correct', 'oui', 'juste', 'vrai', 'je savais', 'bonne reponse', 'good', 'bon', 'ouais']],
    ['next', ['suivant', 'suivante', 'suivants', 'next', 'passe', 'passer', 'continue', 'continuer', 'question suivante', 'on continue']],
    ['reveal', ['reponse', 'reponses', 'montre', 'montrer', 'voir', 'affiche', 'afficher', 'retourne', 'retourner', 'suite', 'je ne sais pas', 'aucune idee', 'show', 'la reponse', 'reponds']]
];
const VOICE_DIGITS = { 1: ['un', '1', 'une'], 2: ['deux', '2'], 3: ['trois', '3'], 4: ['quatre', '4'] };
function vEdit(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const d = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) { let prev = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } }
    return d[b.length];
}
function parseVoice(heard) {
    const clean = fold(heard).replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!clean) return null;
    const t = ` ${clean} `, toks = clean.split(' ');
    for (const [cmd, words] of VOICE_CMDS) if (words.some(w => t.includes(` ${w} `))) return cmd;
    /* a single short word that is a digit: 1 raté · 2 difficile · 3 bien · 4 facile */
    if (toks.length <= 2) for (const [n, ws] of Object.entries(VOICE_DIGITS)) if (toks.some(x => ws.includes(x))) return Number(n);
    /* tolerant match: one-word commands of 5+ letters, up to 1 mistake (2 above 8 letters) */
    let best = null, bd = 9;
    for (const [cmd, words] of VOICE_CMDS) for (const w of words) {
        if (w.length < 5 || w.includes(' ')) continue;
        const lim = w.length >= 9 ? 2 : 1;
        for (const x of toks) { if (x.length < 4) continue; const e = vEdit(x, w); if (e <= lim && e < bd) { bd = e; best = cmd; } }
    }
    return best;
}

Object.assign(SuperAnki.prototype, {
    /* ============ trash ============ */
    trashAdd(kind, obj, now) {
        const t = this.data.trash;
        t.unshift({ k: kind, at: now, c: obj });
        if (t.length > TRASH_MAX) t.length = TRASH_MAX;
    },
    trashDrop(kind, id) {
        const t = this.data.trash, i = t.findIndex(x => x.k === kind && x.c.id === id);
        if (i >= 0) t.splice(i, 1);
    },
    trashRestore(kind, id) {
        const d = this.data, item = d.trash.find(x => x.k === kind && x.c.id === id);
        if (!item) return 0;
        let n = 0;
        const restoreDeck = deck => {
            if (!deck || d.decks.some(x => x.id === deck.id)) return;
            if (deck.parent && !d.decks.some(x => x.id === deck.parent)) { const p = d.trash.find(x => x.k === 'deck' && x.c.id === deck.parent); if (p) restoreDeck(p.c); else deck.parent = null; }
            d.decks.push({ ...deck }); this.trashDrop('deck', deck.id);
        };
        if (kind === 'deck') {
            restoreDeck(item.c);
            d.trash.filter(x => x.k === 'card' && x.c.deckId === id && Math.abs(x.at - item.at) < 5000).forEach(x => { d.cards.push({ ...x.c }); this.trashDrop('card', x.c.id); n++; });
            d.trash.filter(x => x.k === 'deck' && x.c.parent === id).forEach(x => restoreDeck(x.c));
        } else {
            if (!d.decks.some(x => x.id === item.c.deckId)) {
                const dk = d.trash.find(x => x.k === 'deck' && x.c.id === item.c.deckId);
                if (dk) restoreDeck(dk.c);
                else { d.decks.push({ id: item.c.deckId, name: 'Récupérées', emoji: '♻️', description: '', created: Date.now(), parent: null, opts: null, mod: 0, preset: null, limits: null }); }
            }
            d.cards.push({ ...item.c }); this.trashDrop('card', id); n = 1;
        }
        this.searchCache.clear();
        this.save();
        return n;
    },
    openTrash() {
        const html = () => {
            const t = this.data.trash, decks = t.filter(x => x.k === 'deck');
            const inDeck = (x, dk) => x.k === 'card' && x.c.deckId === dk.c.id && Math.abs(x.at - dk.at) < 5000;
            const loose = t.filter(x => x.k === 'card' && !decks.some(dk => inDeck(x, dk)));
            const ago = at => fmtAgo(at);
            const rows = [
                ...decks.map(x => `<div class="set-row"><div class="txt"><b>${esc(x.c.emoji)} ${esc(x.c.name)}</b><span>Paquet · ${plural(t.filter(y => inDeck(y, x)).length, 'carte')} · supprimé ${ago(x.at)}</span></div><div class="row-gap"><button class="btn btn-soft btn-sm" data-tr="restore" data-k="deck" data-id="${esc(x.c.id)}">${ic('undo')}Restaurer</button><button class="icon-btn" data-tr="purge" data-k="deck" data-id="${esc(x.c.id)}" title="Supprimer définitivement" aria-label="Supprimer définitivement">${ic('trash')}</button></div></div>`),
                ...loose.slice(0, 200).map(x => `<div class="set-row"><div class="txt"><b>${esc(truncate(stripHtml(x.c.front) || '(image)', 70))}</b><span>Carte · supprimée ${ago(x.at)}</span></div><div class="row-gap"><button class="btn btn-soft btn-sm" data-tr="restore" data-k="card" data-id="${esc(x.c.id)}">${ic('undo')}Restaurer</button><button class="icon-btn" data-tr="purge" data-k="card" data-id="${esc(x.c.id)}" title="Supprimer définitivement" aria-label="Supprimer définitivement">${ic('trash')}</button></div></div>`)
            ];
            return rows.length ? `<p class="small muted">Les éléments supprimés restent ici ${TRASH_DAYS} jours, puis disparaissent. Restaurer une carte garde sa progression.</p>${rows.join('')}${loose.length > 200 ? `<p class="small muted">… et ${loose.length - 200} autres cartes.</p>` : ''}` : '<p class="muted">La corbeille est vide.</p>';
        };
        const m = this.openModal({ title: 'Corbeille', size: 'wide', body: `<div id="tr-body">${html()}</div>`, foot: `<button class="btn btn-soft" data-close>Fermer</button><button class="btn btn-danger-soft" id="tr-empty">${ic('trash')}Vider la corbeille</button>` });
        const refresh = () => { $('#tr-body', m).innerHTML = html(); };
        m.addEventListener('click', async e => {
            const b = e.target.closest('[data-tr]');
            if (!b) return;
            const { k, id } = b.dataset;
            if (b.dataset.tr === 'restore') { const n = this.trashRestore(k, id); this.render(); refresh(); this.toast(k === 'deck' ? `Paquet restauré (${plural(n, 'carte')})` : 'Carte restaurée', 'success', ic('undo')); }
            else {
                const dk = k === 'deck' ? this.data.trash.find(x => x.k === 'deck' && x.c.id === id) : null;
                if (dk) this.data.trash = this.data.trash.filter(x => !(x.k === 'card' && x.c.deckId === id && Math.abs(x.at - dk.at) < 5000));
                this.trashDrop(k, id); this.save(); refresh();
            }
        });
        $('#tr-empty', m).addEventListener('click', async () => {
            if (!this.data.trash.length) return;
            if (!(await this.confirm({ title: 'Vider la corbeille ?', message: `${plural(this.data.trash.length, 'élément')} seront supprimés pour toujours.`, ok: 'Vider', danger: true }))) return;
            this.data.trash = []; this.save(); refresh();
        });
    },

    /* ============ session decor: mic button, voice bar ============ */
    sessionDecor() {
        const s = this.session;
        if (!s || !s.current || !$('#view-session .session-top')) return;
        const top = $('#view-session .session-top'), usable = s.kind === 'srs' || s.kind === 'practice';
        if (!s.focusSeen) { s.focusSeen = true; if (this.focus && this.focus.open && !this.focus.collapsed) this.focusSet({ collapsed: true }); }
        this.audioBarSync(usable);
        if (usable && this.voice && this.voice.on && !this.voice.rec && !this.voice.starting) this.voiceRun();
        this.bindSwipe();
    },
    /* free revision, answer shown: drag the card right (I knew it) or left (missed) */
    bindSwipe() {
        const s = this.session, card = $('#view-session .flashcard');
        if (!s || s.kind !== 'practice' || !s.revealed || s.answer === 'type' || !card) return;
        card.style.touchAction = 'pan-y';
        if (!$('#swipe-hint')) card.insertAdjacentHTML('afterend', '<p class="swipe-hint" id="swipe-hint"><span>← Raté</span><span>Je savais →</span></p>');
        let x0 = 0, y0 = 0, dx = 0, on = false, id = s.current;
        const reset = () => { card.style.transition = 'transform .18s'; card.style.transform = ''; card.classList.remove('swipe-ok', 'swipe-ko'); };
        card.addEventListener('touchstart', e => { if (e.touches.length !== 1) return; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; on = false; card.style.transition = 'none'; }, { passive: true });
        card.addEventListener('touchmove', e => {
            const t = e.touches[0], mx = t.clientX - x0, my = t.clientY - y0;
            if (!on && Math.abs(mx) > 12 && Math.abs(mx) > Math.abs(my) * 1.4) on = true;
            if (!on) return;
            dx = mx; card.style.transform = `translateX(${dx}px) rotate(${dx / 28}deg)`;
            card.classList.toggle('swipe-ok', dx > 50); card.classList.toggle('swipe-ko', dx < -50);
        }, { passive: true });
        const end = () => {
            if (!on) return;
            on = false;
            if (Math.abs(dx) > 90 && this.session === s && s.current === id && s.revealed) {
                const ok = dx > 0;
                card.style.transition = 'transform .16s, opacity .16s'; card.style.transform = `translateX(${ok ? 520 : -520}px) rotate(${ok ? 16 : -16}deg)`; card.style.opacity = '0';
                setTimeout(() => { if (this.session === s && s.current === id) this.practiceAnswer(ok); }, 130);
            } else reset();
        };
        card.addEventListener('touchend', end, { passive: true });
        card.addEventListener('touchcancel', reset, { passive: true });
    },
    /* two separate switches under the progress bar: reading aloud (speaker) and voice commands (microphone) */
    audioBarSync(usable) {
        let bar = $('#audio-bar');
        if (!usable) { if (bar) bar.remove(); return; }
        const set = this.data.settings, on = !!(this.voice && this.voice.on);
        const html = `<button class="chip ${set.autoSpeak ? 'active' : ''}" data-action="autospeak-toggle" aria-pressed="${!!set.autoSpeak}" title="Lit la question puis la réponse à voix haute">${ic('volume')}Lecture : ${set.autoSpeak ? 'oui' : 'non'}</button>
            <button class="chip ${on ? 'active' : ''}" data-action="voice-toggle" aria-pressed="${on}" title="Dire « réponse », « bien », « suivant »… pour avancer sans toucher l'écran">${ic('mic')}Voix : ${on ? 'oui' : 'non'}</button>`;
        if (!bar) { const pb = $('#view-session .pbar'); if (!pb) return; pb.insertAdjacentHTML('afterend', `<div class="audio-bar" id="audio-bar">${html}</div>`); }
        else if (bar.dataset.h !== html) bar.innerHTML = html;
        const cur = $('#audio-bar'); if (cur) cur.dataset.h = html;
        if (on && !$('#voice-bar')) cur.insertAdjacentHTML('afterend', `<div class="voice-bar" id="voice-bar"><span class="rec-dot"></span><span id="voice-msg">🎤 Dis : « réponse » (ou « indice »), puis « bien », « difficile », « raté », « facile » ou « suivant »</span></div>`);
        if (!on) { const vb = $('#voice-bar'); if (vb) vb.remove(); }
    },
    sessionCleanup() {
        this.voiceStop(true);
    },

    /* ============ voice commands (the microphone only: reading aloud is a separate switch) ============
       One recognition runs for the whole time the mode is on (no restart between cards, so no repeated beep and nothing
       missed), reacts as soon as a command is recognized even before the end of the sentence, shows what it hears live,
       and checks every alternative the recogniser proposes. */
    voiceSupported() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); },
    voiceToggle() {
        if (!this.voice) this.voice = { on: false, rec: null, starting: false, fails: 0, last: 0 };
        if (!this.voiceSupported()) { this.toast('La reconnaissance vocale n\'est pas disponible ici (essaie Chrome, Edge ou Safari récent, en https).', 'warning', ic('mic')); return; }
        const v = this.voice;
        if (v.on) { this.voiceStop(true); this.toast('Commande vocale désactivée', 'success', ic('mic')); this.syncVoiceUi(); return; }
        v.on = true; v.fails = 0;
        this.syncVoiceUi();
        this.voiceRun();
    },
    syncVoiceUi() { const s = this.session; this.audioBarSync(!!(s && s.current && (s.kind === 'srs' || s.kind === 'practice'))); },
    voiceStop(off) {
        const v = this.voice;
        if (!v) return;
        if (off) v.on = false;
        v.starting = false;
        clearTimeout(v.timer);
        try { if (v.rec) { v.rec.onresult = v.rec.onerror = v.rec.onend = null; v.rec.abort(); } } catch { /* ignore */ }
        v.rec = null;
    },
    voiceMsg(t) { const el = $('#voice-msg'); if (el) el.textContent = t; },
    voiceRun() {
        const v = this.voice, SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!v || !v.on || !SR || v.rec) return;
        let rec;
        try { rec = new SR(); } catch { return; }
        v.rec = rec; v.starting = true;
        rec.lang = 'fr-FR'; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 5;
        try { const G = window.SpeechGrammarList || window.webkitSpeechGrammarList; if (G) { const g = new G(); g.addFromString('#JSGF V1.0; grammar c; public <c> = réponse | bien | difficile | raté | facile | suivant | répète | annule | stop ;', 1); rec.grammars = g; } } catch { /* optional */ }
        let handled = -1;
        rec.onstart = () => { v.starting = false; v.fails = 0; };
        rec.onresult = e => {
            const s = this.session;
            if (!s || !s.current || (s.kind !== 'srs' && s.kind !== 'practice')) return;
            for (let i = e.resultIndex; i < e.results.length; i++) {
                if (i <= handled) continue;
                const res = e.results[i], alts = [];
                for (let k = 0; k < res.length; k++) alts.push(res[k].transcript);
                if (alts[0]) this.voiceMsg(`🎤 ${alts[0].trim()}${res.isFinal ? '' : '…'}`);
                if (Date.now() - v.last < 800) continue;
                const cmd = alts.map(parseVoice).find(c => c !== null && c !== undefined);
                if (cmd !== undefined && cmd !== null) { handled = i; v.last = Date.now(); this.voiceAct(cmd, alts[0]); try { rec.abort(); } catch { /* restart clears the buffer */ } return; }
                if (res.isFinal) { handled = i; this.voiceMsg(`« ${alts[0].trim()} » : pas compris. Dis « réponse », « indice », « bien », « suivant »…`); }
            }
        };
        rec.onerror = e => {
            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { this.voiceStop(true); this.syncVoiceUi(); this.toast('Micro refusé : autorise-le dans ton navigateur.', 'error', ic('mic')); }
            else if (e.error !== 'no-speech' && e.error !== 'aborted') v.fails++;
        };
        rec.onend = () => {
            v.rec = null; v.starting = false;
            if (!v.on) return;
            if (v.fails >= 4) { this.voiceStop(true); this.syncVoiceUi(); this.toast('La reconnaissance vocale s\'est arrêtée (micro indisponible). Touche « Commande vocale » pour relancer.', 'warning', ic('mic')); return; }
            v.timer = setTimeout(() => this.voiceRun(), 200 + v.fails * 400);
        };
        try { rec.start(); } catch { v.rec = null; v.starting = false; v.fails++; v.timer = setTimeout(() => this.voiceRun(), 600); }
    },
    /* what a recognized command does, depending on the card state */
    voiceAct(cmd, heard) {
        const s = this.session;
        if (!s || !s.current) return;
        const grades = ['', 'Raté', 'Difficile', 'Bien', 'Facile'];
        if (cmd === 'stop') { this.voiceStop(true); this.syncVoiceUi(); this.toast('Commande vocale désactivée', 'success', ic('mic')); return; }
        if (cmd === 'repeat') { this.voiceMsg('🔊 Je relis'); this.speak(); return; }
        if (cmd === 'hint') {
            const c = this.card(s.current), slot = $('#hint-slot');
            if (s.revealed) { this.voiceMsg('💡 La réponse est déjà affichée'); return; }
            if (!c.hint) { this.voiceMsg('💡 Pas d\'indice pour cette carte'); return; }
            this.voiceMsg('💡 Indice');
            if (slot && !slot.innerHTML) this.handleAction('hint');
            return;
        }
        if (cmd === 'undo') { this.voiceMsg('↩ Annulé'); this.undo(); return; }
        if (cmd === 'reveal' || (!s.revealed && (typeof cmd === 'number' || cmd === 'next'))) { if (!s.revealed) { this.voiceMsg('✔ Réponse'); this.reveal(); } return; }
        if (s.revealed && (typeof cmd === 'number' || cmd === 'next')) {
            const g = cmd === 'next' ? 3 : cmd;
            this.voiceMsg(`✔ ${grades[g]}${cmd === 'next' ? ' · suivante' : ''}`);
            if (s.kind === 'srs') this.grade(g); else this.practiceAnswer(g >= 3);
        }
    }
});
/* the session decorations (timer, mic, voice bar) are added after every render of a card */
(() => { const base = SuperAnki.prototype.renderSession; SuperAnki.prototype.renderSession = function (...a) { const r = base.apply(this, a); this.sessionDecor(); return r; }; })();
(() => { const base = SuperAnki.prototype.showSummary; SuperAnki.prototype.showSummary = function (...a) { this.sessionCleanup(); return base.apply(this, a); }; })();

/* ============================================================
   Quiz: plausible wrong answers.
   Distractors are chosen among cards whose answer LOOKS like the right one (same sub-deck, shared words,
   similar length and shape, similar question) so the right answer can't be guessed from its length or format.
   Numeric answers get close numeric alternatives.
   ============================================================ */
const quizTokens = t => new Set(fold(t).split(/[^a-z0-9]+/).filter(w => w.length > 2));
const jaccard = (a, b) => { if (!a.size || !b.size) return 0; let i = 0; a.forEach(x => { if (b.has(x)) i++; }); return i / (a.size + b.size - i); };
const quizShape = t => ({ num: /^[\s\d.,%€$£+\-–/:x×()]+$/.test(t) && /\d/.test(t), digits: /\d/.test(t), upper: /^[A-ZÀ-ÖØ-Þ]/.test(t), words: t.split(/\s+/).length, pct: /%/.test(t), money: /[€$£]/.test(t), sentence: /[.!?]$/.test(t) });
function numericAlternatives(text, n) {
    const m = text.match(/-?\d[\d\s]*(?:[.,]\d+)?/);
    if (!m) return [];
    const raw = m[0], val = Number(raw.replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(val)) return [];
    const dec = (raw.split(/[.,]/)[1] || '').length, fmt = v => { let s = v.toFixed(dec); if (dec) s = s.replace('.', raw.includes(',') ? ',' : '.'); return text.replace(raw, s); };
    const steps = val === 0 ? [1, 2, 5] : [val * 0.5, val * 2, val * 1.2, val * 0.8, val + Math.max(1, Math.abs(val) * 0.1), val - Math.max(1, Math.abs(val) * 0.1), val * 10, val / 10];
    const out = [];
    for (const v of shuffle(steps)) {
        const w = Number.isInteger(val) ? Math.round(v) : Math.round(v * 10 ** Math.max(dec, 1)) / 10 ** Math.max(dec, 1);
        const t = fmt(w);
        if (w !== val && w > 0 === val > 0 && !out.includes(t)) out.push(t);
        if (out.length >= n) break;
    }
    return out;
}
Object.assign(SuperAnki.prototype, {
    buildOptions(card) {
        const ans = c => stripHtml(this.cardAnswer(c)).trim();
        const correct = ans(card), cNorm = normAnswer(correct) || card.id, cTok = quizTokens(correct), fTok = quizTokens(stripHtml(card.front));
        const cShape = quizShape(correct), cLang = guessLang(correct), cLen = correct.length || 1;
        const deck = this.deck(card.deckId), parent = deck && deck.parent;
        const seen = new Set([cNorm]);
        const usable = this.data.cards.filter(c => c.id !== card.id && (!c.nid || c.nid !== card.nid) && c.kind !== 'cloze' && c.kind !== 'occl' && !c.suspended);
        const scored = [];
        usable.forEach(c => {
            const t = ans(c);
            if (!t) return;
            const n = normAnswer(t) || c.id;
            if (n === cNorm || (n.length > 3 && (cNorm.includes(n) || n.includes(cNorm)) && cNorm.length > 3)) return;   // same answer, or contains it
            const sh = quizShape(t), tok = quizTokens(t);
            let sc = 0;
            if (c.deckId === card.deckId) sc += 3; else { const d2 = this.deck(c.deckId); if (parent && d2 && d2.parent === parent) sc += 1.5; }
            sc += jaccard(cTok, tok) * 4 + jaccard(fTok, quizTokens(stripHtml(c.front))) * 2;
            sc += (1 - Math.abs(t.length - cLen) / Math.max(t.length, cLen)) * 2.5;
            if (sh.num === cShape.num) sc += 1.5; else sc -= 2;
            if (sh.upper === cShape.upper) sc += 0.6;
            if (sh.pct === cShape.pct) sc += 0.6;
            if (sh.money === cShape.money) sc += 0.6;
            if (sh.sentence === cShape.sentence) sc += 0.6;
            if (Math.abs(sh.words - cShape.words) <= 1) sc += 0.8;
            if (card.tags.length && c.tags.some(x => card.tags.includes(x))) sc += 0.8;
            sc += guessLang(t) === cLang ? 1.5 : -2.5;
            scored.push({ c, t, n, tok, sc: sc + Math.random() * 0.9 });
        });
        scored.sort((a, b) => b.sc - a.sc);
        const picks = [];
        for (const x of scored) {
            if (picks.length >= 3) break;
            if (seen.has(x.n) || picks.some(p => jaccard(p.tok, x.tok) > 0.85 && x.tok.size > 1)) continue;
            seen.add(x.n); picks.push(x);
        }
        const options = [{ id: card.id, ok: true }, ...picks.map(x => ({ id: x.c.id, ok: false }))];
        if (cShape.num && picks.length < 3) {       // numbers: close alternatives instead of random cards
            numericAlternatives(correct, 3 - picks.length).forEach(t => options.push({ id: card.id, ok: false, text: t }));
        }
        return shuffle(options);
    }
});
