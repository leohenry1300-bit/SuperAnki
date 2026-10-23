/* ============================================================
   Features: note types (cloze, linked reverse), flags, bury / suspend,
   undo / redo, card info, custom study, bulk editing, study options,
   automatic backups and exports.
   ============================================================ */
Object.assign(ICONS, {
    more: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
    flag: '<path d="M4 22V4"/><path d="M4 4h13l-2 4.5 2 4.5H4"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.3" fill="currentColor"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    eyeOff: '<path d="M17.9 17.9A10.1 10.1 0 0 1 12 20c-6.5 0-10-8-10-8a18 18 0 0 1 5.1-5.9M9.9 4.2A9 9 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-2.2 3.2"/><path d="M1 1l22 22M14.1 14.1a3 3 0 1 1-4.2-4.2"/>',
    folder: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/>',
    redo: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    brain: '<path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v0A2.5 2.5 0 0 0 4.5 7 2.5 2.5 0 0 0 3 9.4a3 3 0 0 0 .8 5.3A2.7 2.7 0 0 0 7 18a2.5 2.5 0 0 0 5 .5V4.5A2.5 2.5 0 0 0 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 1 17 4.5 2.5 2.5 0 0 1 19.5 7 2.5 2.5 0 0 1 21 9.4a3 3 0 0 1-.8 5.3A2.7 2.7 0 0 1 17 18a2.5 2.5 0 0 1-5 .5"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    checkSq: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m8 12 3 3 5-6"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    sparkles: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/>'
});
const FLAGS = [null,
    { name: 'Rouge', color: '#ef4444' }, { name: 'Orange', color: '#f97316' }, { name: 'Vert', color: '#22c55e' },
    { name: 'Bleu', color: '#3b82f6' }, { name: 'Rose', color: '#ec4899' }, { name: 'Turquoise', color: '#14b8a6' }, { name: 'Violet', color: '#8b5cf6' }];

/* ---------- Note types ---------- */
const CLOZE_RE = /\{\{c(\d+)::([\s\S]*?)(?:::([\s\S]*?))?\}\}/g;
const NOTE_TYPES = { basic: 'Basique', rev: 'Basique + inversée (liées)', cloze: 'Texte à trous', occl: 'Image à masquer' };
function clozeNumbers(text) {
    const set = new Set();
    String(text || '').replace(CLOZE_RE, (m, n) => { set.add(Number(n)); return m; });
    return [...set].sort((a, b) => a - b);
}
function renderCloze(text, ord, side) {
    return String(text || '').replace(CLOZE_RE, (m, n, ans, hint) => {
        if (Number(n) !== ord) return ans;
        return side === 'front' ? `<span class="cloze">[${hint ? hint : '...'}]</span>` : `<span class="cloze">${ans}</span>`;
    });
}
function clozeAnswerHtml(c) {
    if (!c.nf) return c.back;
    const out = [];
    c.nf.text.replace(CLOZE_RE, (m, n, ans) => { if (Number(n) === c.ord) out.push(ans); return m; });
    return out.join(', ') || c.back;
}
/* front/back are always stored materialized, so the rest of the app never needs to know about note types */
function materializeCard(c) {
    if (c.kind === 'custom' && c.nf && c.nf.t) { const r = customRender(c); c.front = r.front; c.back = r.back; return c; }
    if (c.kind === 'occl' && c.nf) { const o = occlusionHtml(c); c.front = o.front; c.back = o.back; return c; }
    if (c.kind === 'cloze' && c.nf) {
        c.front = sanitizeHtml(renderCloze(c.nf.text, c.ord, 'front'));
        const extra = isBlank(c.nf.extra) ? '' : `<br><br><div>${c.nf.extra}</div>`;
        c.back = sanitizeHtml(renderCloze(c.nf.text, c.ord, 'back') + extra);
    } else if (c.kind === 'rev' && c.nf) {
        c.front = c.ord === 1 ? c.nf.back : c.nf.front;
        c.back = c.ord === 1 ? c.nf.front : c.nf.back;
    }
    return c;
}
const freshCard = () => ({ state: 'new', step: 0, interval: 0, ease: 2.5, due: Date.now(), reps: 0, lapses: 0, lastReview: null, errors: 0, wrong: 0, right: 0, suspended: false, flag: 0, marked: false, buriedUntil: 0, fs: null, mod: 0 });
const noteFieldsOf = c => (c.nf ? (c.kind === 'cloze' ? { front: c.nf.text, back: c.nf.extra } : { front: c.nf.front, back: c.nf.back }) : { front: c.front, back: c.back });

/* Replaces text inside HTML without touching tags */
function replaceInHtml(html, find, repl, caseSens) {
    if (!find) return html;
    const t = document.createElement('template');
    t.innerHTML = html;
    const rx = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSens ? 'g' : 'gi');
    const w = document.createTreeWalker(t.content, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach(n => { n.nodeValue = n.nodeValue.replace(rx, () => repl); });
    return t.innerHTML;
}
function parseDueSpec(str) {
    const m = /^\s*(\d+)(?:\s*-\s*(\d+))?\s*(!)?\s*$/.exec(String(str || ''));
    if (!m) return null;
    const a = Number(m[1]), b = m[2] !== undefined ? Number(m[2]) : a;
    return { min: Math.min(a, b), max: Math.max(a, b), setIvl: !!m[3] };
}

Object.assign(SuperAnki.prototype, {
    /* ============================================================
       Undo / redo for card and deck edits (sessions keep their own "undo last answer")
       ============================================================ */
    snapCards(ids) {
        const m = new Map();
        ids.forEach(id => { const c = this.card(id); m.set(id, c ? structuredClone(c) : null); });
        return m;
    },
    /* Runs fn (which edits cards) and records it so it can be undone. fn may return the ids of cards it created. */
    change(label, ids, fn, { decks = false } = {}) {
        const before = this.snapCards(ids), decksBefore = decks ? structuredClone(this.data.decks) : null;
        const created = fn() || [];
        created.forEach(id => { if (!before.has(id)) before.set(id, null); });
        const after = this.snapCards([...before.keys()]);
        this.undoStack.push({ label, before, after, decksBefore, decksAfter: decks ? structuredClone(this.data.decks) : null });
        if (this.undoStack.length > 40) this.undoStack.shift();
        this.redoStack = [];
        this.searchCache.clear();
        this.save();
        return created;
    },
    applyEntry(entry, dir) {
        const target = dir === 'undo' ? entry.before : entry.after;
        target.forEach((state, id) => {
            const i = this.data.cards.findIndex(c => c.id === id);
            if (state === null) { if (i >= 0) this.data.cards.splice(i, 1); }
            else if (i >= 0) this.data.cards[i] = structuredClone(state);
            else this.data.cards.push(structuredClone(state));
        });
        const decks = dir === 'undo' ? entry.decksBefore : entry.decksAfter;
        if (decks) this.data.decks = structuredClone(decks);
        this.searchCache.clear();
        this.save();
        const s = this.session;
        if (s) {
            const gone = id => !this.card(id) || this.card(id).suspended;
            s.queue = s.queue.filter(id => !gone(id));
            if (s.learning) s.learning = s.learning.filter(l => !gone(l.id));
            if (!s.current || gone(s.current)) this.nextCard(); else this.renderSession();
        } else this.render();
    },
    undoGlobal() {
        const e = this.undoStack.pop();
        if (!e) { this.toast('Rien à annuler', 'warning'); return; }
        this.applyEntry(e, 'undo');
        this.redoStack.push(e);
        this.toast(`Annulé : ${e.label}`, 'success', ic('undo'), { label: 'Rétablir', fn: () => this.redoGlobal() });
    },
    redoGlobal() {
        const e = this.redoStack.pop();
        if (!e) { this.toast('Rien à rétablir', 'warning'); return; }
        this.applyEntry(e, 'redo');
        this.undoStack.push(e);
        this.toast(`Rétabli : ${e.label}`, 'success', ic('redo'));
    },
    /* Sensitive actions (reset progress / reset app): a full copy is kept first, so the user can always go back (7 days) */
    async sensitiveSnapshot(label) {
        const json = this.serialize(); let key = null;
        if (Storage.db) { try { key = await Storage.backupSave(`avant : ${label}`, json, this.data); } catch (e) { console.warn(e); } }
        this.lastSens = { at: Date.now(), label, json };
        try { localStorage.setItem('superanki_last_sens', JSON.stringify({ at: this.lastSens.at, label, key })); } catch { /* ignore */ }
    },
    sensitiveInfo() {
        try { const x = JSON.parse(localStorage.getItem('superanki_last_sens') || 'null'); if (x && x.at && Date.now() - x.at < 7 * 86400000) return x; } catch { /* ignore */ }
        return null;
    },
    async sensitiveUndo() {
        const info = this.sensitiveInfo(); if (!info) { this.toast('Rien à annuler.', 'warning'); return; }
        let json = this.lastSens && this.lastSens.at === info.at ? this.lastSens.json : null;
        if (!json && info.key) json = await Storage.backupLoad(info.key);
        const data = json && normalizeState(json);
        if (!data) { this.toast('Impossible de revenir en arrière : la copie est introuvable.', 'error'); return; }
        data.settings = Object.assign({}, data.settings, { syncKey: this.data.settings.syncKey, cloudSync: this.data.settings.cloudSync });
        data.updatedAt = Date.now();
        this.replaceData(data); this.save();
        try { localStorage.removeItem('superanki_last_sens'); } catch { /* ignore */ }
        this.toast('Retour en arrière effectué', 'success', ic('undo'));
        if (this.view === 'settings') this.renderSettings(); else this.render();
    },
    undoToast(msg, icon) { this.toast(msg, 'success', icon, { label: 'Annuler', fn: () => this.undoGlobal() }); },

    /* ============================================================
       Notes (basic / linked reverse / cloze)
       ============================================================ */
    noteSiblings(card) { return card.nid ? this.data.cards.filter(c => c.nid === card.nid) : [card]; },
    expandNotes(ids) {
        const out = new Set(ids);
        ids.forEach(id => { const c = this.card(id); if (c && c.nid) this.data.cards.forEach(x => { if (x.nid === c.nid) out.add(x.id); }); });
        return [...out];
    },
    /* Creates the card(s) of a new note. Returns the created card ids, or null if the note is invalid. */
    createNote({ type, deckId, front, back, hint, detail, tags }) {
        const now = Date.now(), nid = uid('n'), made = [];
        const common = { deckId, hint, detail, tags: [...tags], created: now, nid: type === 'basic' ? '' : nid };
        const add = (extra, i) => { const c = { id: uid('c'), ...freshCard(), ...common, created: now + i, front: '', back: '', kind: type, ord: 0, nf: null, ...extra }; materializeCard(c); this.data.cards.push(c); made.push(c.id); };
        if (type === 'basic') add({ front, back }, 0);
        else if (type === 'rev') { const nf = { front, back, text: '', extra: '' }; add({ nf, ord: 0 }, 0); add({ nf: { ...nf }, ord: 1 }, 1); }
        else {
            const nums = clozeNumbers(front);
            if (!nums.length) return null;
            nums.forEach((n, i) => add({ nf: { front: '', back: '', text: front, extra: back }, ord: n }, i));
        }
        return made;
    },
    /* Applies edited fields to an existing note (all its sibling cards). Returns ids of created cards. */
    updateNote(card, { deckId, front, back, hint, detail, tags }) {
        const sibs = this.noteSiblings(card), created = [];
        sibs.forEach(c => { Object.assign(c, { deckId, hint, detail, tags: [...tags] }); });
        if (card.kind === 'basic' || !card.nf) { Object.assign(card, { front, back }); return created; }
        if (card.kind === 'rev') {
            sibs.forEach(c => { c.nf = { front, back, text: '', extra: '' }; materializeCard(c); });
            return created;
        }
        const nums = clozeNumbers(front), now = Date.now();
        sibs.forEach(c => { c.nf = { front: '', back: '', text: front, extra: back }; });
        const have = new Set(sibs.map(c => c.ord));
        sibs.filter(c => !nums.includes(c.ord)).forEach(c => { this.data.cards.splice(this.data.cards.indexOf(c), 1); });
        nums.filter(n => !have.has(n)).forEach((n, i) => {
            const c = { id: uid('c'), ...freshCard(), deckId, hint, detail, tags: [...tags], created: now + i, nid: card.nid, kind: 'cloze', ord: n, nf: { front: '', back: '', text: front, extra: back }, front: '', back: '' };
            this.data.cards.push(c); created.push(c.id);
        });
        this.data.cards.filter(c => c.nid === card.nid).forEach(materializeCard);
        return created;
    },

    /* ============================================================
       Card operations (flag, mark, suspend, bury, due date, reset, move, tags, delete)
       ============================================================ */
    cardsByIds(ids) { return ids.map(id => this.card(id)).filter(Boolean); },
    afterOp(ids) {
        const s = this.session;
        if (s) {
            const hidden = id => { const c = this.card(id); return !c || c.suspended || c.buriedUntil > Date.now(); };
            s.queue = s.queue.filter(id => !hidden(id));
            if (s.learning) s.learning = s.learning.filter(l => !hidden(l.id));
            if (s.kind !== 'quiz' && s.kind !== 'chrono') { if (s.current && hidden(s.current)) this.nextCard(); else this.renderSession(); }
        } else this.render();
    },
    opFlag(ids, n) {
        const cards = this.cardsByIds(ids);
        const target = cards.every(c => c.flag === n) ? 0 : n;
        this.change(target ? `drapeau ${FLAGS[n].name.toLowerCase()}` : 'drapeau retiré', ids, () => { cards.forEach(c => { c.flag = target; }); });
        this.afterOp(ids);
        this.toast(target ? `Drapeau ${FLAGS[n].name.toLowerCase()} posé` : 'Drapeau retiré', 'success', ic('flag'));
    },
    opMark(ids) {
        const all = this.expandNotes(ids), cards = this.cardsByIds(all), target = !cards.every(c => c.marked);
        this.change(target ? 'marquage' : 'marquage retiré', all, () => { cards.forEach(c => { c.marked = target; }); });
        this.afterOp(all);
        this.toast(target ? 'Note marquée ⭐' : 'Marque retirée', 'success', ic('star'));
    },
    opSuspend(ids, note) {
        const all = note ? this.expandNotes(ids) : ids, cards = this.cardsByIds(all), target = !cards.every(c => c.suspended);
        this.change(target ? 'suspension' : 'réactivation', all, () => { cards.forEach(c => { c.suspended = target; }); });
        this.afterOp(all);
        this.undoToast(target ? `${plural(cards.length, 'carte')} suspendue${cards.length > 1 ? 's' : ''}` : `${plural(cards.length, 'carte')} réactivée${cards.length > 1 ? 's' : ''}`, ic('pause'));
    },
    opBury(ids, note) {
        const all = note ? this.expandNotes(ids) : ids, cards = this.cardsByIds(all), now = Date.now();
        const target = cards.every(c => c.buriedUntil > now) ? 0 : addDays(now, 1);
        this.change(target ? 'enfouissement' : 'déterrement', all, () => { cards.forEach(c => { c.buriedUntil = target; }); });
        this.afterOp(all);
        this.undoToast(target ? `${plural(cards.length, 'carte')} enfouie${cards.length > 1 ? 's' : ''} jusqu'à demain` : 'Cartes déterrées', ic('eyeOff'));
    },
    opDue(ids, spec) {
        const cards = this.cardsByIds(ids), now = Date.now(), cfg = d => this.deckCfg(d);
        this.change('date d\'échéance', ids, () => {
            cards.forEach(c => {
                const days = spec.min + Math.floor(Math.random() * (spec.max - spec.min + 1));
                if (c.state !== 'review') { c.state = 'review'; c.step = 0; c.ease = cfg(c.deckId).startEase; c.interval = Math.max(1, days); if (!c.reps) c.reps = 0; }
                else if (spec.setIvl) c.interval = Math.max(1, days);
                c.due = addDays(now, days);
                c.buriedUntil = 0;
                if (c.fs && spec.setIvl) c.fs = { ...c.fs, s: Math.max(0.5, days) };
            });
        });
        this.afterOp(ids);
        this.undoToast(`Date d'échéance : ${spec.min === spec.max ? `dans ${plural(spec.min, 'jour')}` : `dans ${spec.min} à ${spec.max} jours`}`, ic('calendar'));
    },
    opReset(ids) {
        const cards = this.cardsByIds(ids);
        this.change('réinitialisation', ids, () => { cards.forEach(c => Object.assign(c, { state: 'new', step: 0, interval: 0, ease: this.deckCfg(c.deckId).startEase, due: Date.now(), reps: 0, lapses: 0, lastReview: null, errors: 0, fs: null, buriedUntil: 0 })); });
        this.afterOp(ids);
        this.undoToast(`${plural(cards.length, 'carte')} remise${cards.length > 1 ? 's' : ''} à zéro`, ic('reset'));
    },
    opMove(ids, deckId) {
        const cards = this.cardsByIds(this.expandNotes(ids));
        this.change('déplacement', cards.map(c => c.id), () => { cards.forEach(c => { c.deckId = deckId; }); });
        this.render();
        this.undoToast(`${plural(cards.length, 'carte')} déplacée${cards.length > 1 ? 's' : ''}`, ic('folder'));
    },
    opTags(ids, add, remove) {
        const cards = this.cardsByIds(this.expandNotes(ids)), rm = remove.map(fold);
        this.change('tags', cards.map(c => c.id), () => { cards.forEach(c => { c.tags = [...c.tags.filter(t => !rm.includes(fold(t))), ...add.filter(t => !c.tags.some(x => fold(x) === fold(t)))]; }); });
        this.render();
        this.undoToast(`Tags modifiés (${plural(cards.length, 'carte')})`, ic('tag'));
    },
    opReplace(ids, find, repl, scope, caseSens) {
        const cards = this.cardsByIds(this.expandNotes(ids));
        let n = 0;
        this.change('chercher / remplacer', cards.map(c => c.id), () => {
            const seen = new Set();
            cards.forEach(c => {
                const key = c.nid || c.id;
                if (c.kind === 'occl' || c.kind === 'custom' || (c.nf && seen.has(key))) return;
                seen.add(key);
                const sibs = this.noteSiblings(c), f = noteFieldsOf(c);
                const nf = { front: f.front, back: f.back };
                if (scope !== 'back') nf.front = replaceInHtml(f.front, find, repl, caseSens);
                if (scope !== 'front') nf.back = replaceInHtml(f.back, find, repl, caseSens);
                if (nf.front !== f.front || nf.back !== f.back) {
                    n++;
                    if (c.nf) sibs.forEach(x => { x.nf = c.kind === 'cloze' ? { ...x.nf, text: nf.front, extra: nf.back } : { ...x.nf, front: nf.front, back: nf.back }; materializeCard(x); });
                    else { c.front = nf.front; c.back = nf.back; }
                }
            });
        });
        this.render();
        this.undoToast(n ? `${plural(n, 'note modifiée', 'notes modifiées')}` : 'Aucune occurrence trouvée', ic('check'));
    },
    async opDelete(ids, note = true) {
        const all = note ? this.expandNotes(ids) : ids, cards = this.cardsByIds(all);
        if (!cards.length) return false;
        const ok = await this.confirm({
            title: cards.length > 1 ? `Supprimer ${cards.length} cartes ?` : 'Supprimer la carte ?',
            message: cards.length > 1 ? `Ces ${cards.length} cartes seront supprimées. Tu pourras annuler juste après.` : `« ${esc(truncate(stripHtml(cards[0].front), 90))} » sera supprimée${cards[0].nid && all.length > 1 ? ' avec ses cartes liées' : ''}. Tu pourras annuler juste après.`,
            ok: 'Supprimer', danger: true
        });
        if (!ok) return false;
        const set = new Set(all);
        this.change('suppression', all, () => { this.data.cards = this.data.cards.filter(c => !set.has(c.id)); });
        this.ui.sel = new Set([...this.ui.sel].filter(id => !set.has(id)));
        const s = this.session;
        if (s) {
            s.queue = s.queue.filter(id => !set.has(id));
            if (s.learning) s.learning = s.learning.filter(l => !set.has(l.id));
            if (set.has(s.current)) this.nextCard(); else if (set.has(s.quizCard)) this.nextQuestion();
        } else this.render();
        this.undoToast(`${plural(cards.length, 'carte supprimée', 'cartes supprimées')}`, ic('trash'));
        return true;
    },

    /* ---------- Small dialogs ---------- */
    askText({ title, label, value = '', help = '', ok = 'Valider', placeholder = '', multi = false }) {
        return new Promise(resolve => {
            let done = false;
            const m = this.openModal({
                title, size: 'narrow',
                body: `<div class="field"><label class="label" for="ask-in">${label}</label>${multi ? `<textarea class="textarea" id="ask-in" placeholder="${esc(placeholder)}">${esc(value)}</textarea>` : `<input class="input" id="ask-in" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off">`}${help ? `<p class="help">${help}</p>` : ''}</div>`,
                foot: `<button class="btn btn-soft" data-close>Annuler</button><button class="btn btn-primary" id="ask-ok">${ok}</button>`,
                onClose: () => { if (!done) resolve(null); }
            });
            const input = $('#ask-in', m), go = () => { done = true; this.closeModal(m); resolve(input.value); };
            $('#ask-ok', m).addEventListener('click', go);
            input.addEventListener('keydown', e => { if (e.key === 'Enter' && !multi) { e.preventDefault(); go(); } });
            setTimeout(() => { input.focus(); input.select && input.select(); }, 40);
        });
    },
    async promptDue(ids) {
        const v = await this.askText({ title: 'Date d\'échéance', label: 'Dans combien de jours ?', value: '1', placeholder: '3  ou  3-7', help: 'Un nombre (<b>0</b> = aujourd\'hui) ou une plage (<b>3-7</b>, tirée au hasard). Ajoute <b>!</b> (ex. <b>10!</b>) pour changer aussi l\'intervalle.', ok: 'Valider' });
        if (v === null) return;
        const spec = parseDueSpec(v);
        if (!spec) { this.toast('Format invalide : écris par exemple 5 ou 3-7', 'warning'); return; }
        this.opDue(ids, spec);
    },
    promptMove(ids) {
        const first = this.card(ids[0]);
        const m = this.openModal({
            title: 'Déplacer vers un paquet', size: 'narrow',
            body: `<div class="pick-list">${this.sortedDecks().map(d => `<button class="pick-item ${first && d.id === first.deckId ? 'active' : ''}" data-deck="${esc(d.id)}" style="padding-left:${12 + this.deckDepth(d.id) * 14}px"><span>${esc(d.emoji)}</span>${esc(d.name)}<span class="ct">${this.cardsOf(d.id).length}</span></button>`).join('')}</div>`
        });
        m.addEventListener('click', e => { const b = e.target.closest('[data-deck]'); if (b) { this.closeModal(m); this.opMove(ids, b.dataset.deck); } });
    },
    async promptTags(ids) {
        const m = this.openModal({
            title: 'Modifier les tags', size: 'narrow',
            body: `<div class="field"><label class="label" for="tg-add">Ajouter (séparés par des virgules)</label><input class="input" id="tg-add" placeholder="chapitre2, à revoir" autocomplete="off"></div>
                   <div class="field"><label class="label" for="tg-rm">Retirer</label><input class="input" id="tg-rm" placeholder="ancien-tag" autocomplete="off"></div>
                   <p class="help">Tags existants : ${[...new Set(this.data.cards.flatMap(c => c.tags))].slice(0, 20).map(t => `<code>${esc(t)}</code>`).join(' ') || 'aucun'}</p>`,
            foot: `<button class="btn btn-soft" data-close>Annuler</button><button class="btn btn-primary" id="tg-ok">${ic('check')}Appliquer</button>`
        });
        const parse = id => $(id, m).value.split(/[,;]+/).map(t => t.trim().replace(/\s+/g, '_')).filter(Boolean);
        $('#tg-ok', m).addEventListener('click', () => { const add = parse('#tg-add'), rm = parse('#tg-rm'); this.closeModal(m); if (add.length || rm.length) this.opTags(ids, add, rm); });
        setTimeout(() => $('#tg-add', m).focus(), 40);
    },
    promptReplace(ids) {
        const m = this.openModal({
            title: 'Chercher et remplacer', size: 'narrow',
            body: `<p class="small muted" style="margin-bottom:12px">Sur les ${plural(ids.length, 'carte sélectionnée', 'cartes sélectionnées')}.</p>
                   <div class="field"><label class="label" for="rp-find">Chercher</label><input class="input" id="rp-find" autocomplete="off"></div>
                   <div class="field"><label class="label" for="rp-repl">Remplacer par</label><input class="input" id="rp-repl" autocomplete="off"></div>
                   <div class="field"><label class="label" for="rp-scope">Dans</label><select class="select" id="rp-scope"><option value="both">Recto et verso</option><option value="front">Recto seulement</option><option value="back">Verso seulement</option></select></div>
                   <label class="check"><input type="checkbox" id="rp-case"> Respecter la casse</label>`,
            foot: `<button class="btn btn-soft" data-close>Annuler</button><button class="btn btn-primary" id="rp-ok">${ic('check')}Remplacer</button>`
        });
        $('#rp-ok', m).addEventListener('click', () => {
            const find = $('#rp-find', m).value;
            if (!find) { $('#rp-find', m).focus(); return; }
            const repl = $('#rp-repl', m).value, scope = $('#rp-scope', m).value, cs = $('#rp-case', m).checked;
            this.closeModal(m);
            this.opReplace(ids, find, repl, scope, cs);
        });
        setTimeout(() => $('#rp-find', m).focus(), 40);
    },

    /* ---------- Generic popover menu ---------- */
    showMenu(anchor, items, { flagCur = null, onFlag = null } = {}) {
        if (this.popover && this.popoverAnchor === anchor) { this.closePopover(); return; }
        this.closePopover();
        const pop = document.createElement('div');
        pop.className = 'popover menu';
        pop.dataset.kind = 'menu';
        pop.innerHTML = items.map((it, i) => {
            if (it.sep) return '<div class="menu-sep"></div>';
            if (it.flags) return `<div class="menu-flags">${FLAGS.slice(1).map((f, k) => `<button data-flag="${k + 1}" class="${flagCur === k + 1 ? 'on' : ''}" title="${f.name}" style="--c:${f.color}">${ic('flag', 'i-flag')}</button>`).join('')}</div>`;
            return `<button class="menu-item ${it.danger ? 'danger' : ''}" data-mi="${i}">${it.icon ? ic(it.icon) : '<span class="i"></span>'}<span>${it.label}</span>${it.kbd ? `<kbd class="k">${it.kbd}</kbd>` : ''}</button>`;
        }).join('');
        document.body.appendChild(pop);
        this.popover = pop; this.popoverAnchor = anchor; this.popoverY = scrollY;
        const r = anchor.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
        pop.style.left = `${clamp(r.right - w, 10, innerWidth - w - 10)}px`;
        pop.style.top = `${r.bottom + 8 + h > innerHeight - 10 ? Math.max(10, r.top - h - 8) : r.bottom + 8}px`;
        pop.addEventListener('click', e => {
            const f = e.target.closest('[data-flag]');
            if (f) { this.closePopover(); onFlag && onFlag(Number(f.dataset.flag)); return; }
            const b = e.target.closest('[data-mi]');
            if (b) { const it = items[Number(b.dataset.mi)]; this.closePopover(); it.fn && it.fn(); }
        });
    },
    cardMenuItems(ids, { inSession = false } = {}) {
        const cards = this.cardsByIds(ids), c = cards[0], single = cards.length === 1;
        const allSusp = cards.every(x => x.suspended), allBur = cards.every(x => x.buriedUntil > Date.now());
        const items = [];
        if (single) {
            items.push({ icon: 'pencil', label: 'Modifier', kbd: 'E', fn: () => this.openCardModal(c.id) });
            items.push({ icon: 'info', label: 'Informations sur la carte', kbd: 'I', fn: () => this.openCardInfo(c.id) });
            items.push({ sep: true });
        }
        items.push({ flags: true });
        items.push({ icon: 'star', label: cards.every(x => x.marked) ? 'Retirer la marque' : 'Marquer la note', kbd: '*', fn: () => this.opMark(ids) });
        items.push({ sep: true });
        items.push({ icon: 'pause', label: allSusp ? 'Réactiver la carte' : 'Suspendre la carte', kbd: '@', fn: () => this.opSuspend(ids, false) });
        if (cards.some(x => x.nid)) items.push({ icon: 'pause', label: 'Suspendre la note (toutes ses cartes)', kbd: '!', fn: () => this.opSuspend(ids, true) });
        items.push({ icon: 'eyeOff', label: allBur ? 'Déterrer la carte' : 'Enfouir jusqu\'à demain', kbd: '-', fn: () => this.opBury(ids, false) });
        if (cards.some(x => x.nid)) items.push({ icon: 'eyeOff', label: 'Enfouir la note', kbd: '=', fn: () => this.opBury(ids, true) });
        items.push({ sep: true });
        items.push({ icon: 'calendar', label: 'Définir la date d\'échéance…', fn: () => this.promptDue(ids) });
        items.push({ icon: 'reset', label: 'Réinitialiser (remettre à zéro)', fn: () => this.opReset(ids) });
        if (!inSession) {
            items.push({ icon: 'folder', label: 'Déplacer vers un paquet…', fn: () => this.promptMove(ids) });
            items.push({ icon: 'tag', label: 'Modifier les tags…', fn: () => this.promptTags(ids) });
            items.push({ icon: 'refresh', label: 'Chercher / remplacer…', fn: () => this.promptReplace(ids) });
        }
        items.push({ sep: true });
        items.push({ icon: 'trash', label: single ? 'Supprimer la note' : `Supprimer ${cards.length} cartes`, danger: true, fn: () => this.opDelete(ids, true) });
        return items;
    },
    sessionMenu(anchor) {
        const s = this.session;
        if (!s || !s.current) return;
        const ids = [s.current], c = this.card(s.current);
        this.showMenu(anchor, this.cardMenuItems(ids, { inSession: true }), { flagCur: c.flag, onFlag: n => this.opFlag(ids, n) });
    },

    /* ============================================================
       Card information
       ============================================================ */
    openCardInfo(id) {
        const c = this.card(id);
        if (!c) return;
        const cfg = this.cfgFor(c), fsr = cfg.scheduler === 'fsrs', now = Date.now();
        const log = this.data.revlog.filter(r => r[1] === id);
        const fmt = t => (t ? new Date(t).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-');
        const first = log.length ? log[0][0] : null, last = c.lastReview || (log.length ? log[log.length - 1][0] : null);
        const fs = fsrsFromCard(c), R = fsrsRetrievability(c, now);
        const total = log.reduce((a, r) => a + (r[6] || 0), 0) / 1000;
        const typeName = ['Apprentissage', 'Révision', 'Réapprentissage', 'Entraînement'];
        const btn = ['', 'Raté', 'Difficile', 'Bien', 'Facile'];
        const stateName = { new: 'Nouvelle', learning: 'En apprentissage', review: c.interval >= MATURE_IVL ? 'Maîtrisée' : 'En révision', relearning: 'Réapprentissage' }[c.state];
        const rows = [
            ['Paquet', esc(this.deckPath(c.deckId))],
            ['Type de note', c.kind === 'custom' ? this.noteTypeName(c) : (NOTE_TYPES[c.kind] || 'Basique')],
            ['État', stateName + (c.suspended ? ' · suspendue' : '') + (c.buriedUntil > now ? ' · enfouie' : '')],
            ['Ajoutée le', fmt(c.created)],
            ['Première révision', fmt(first)], ['Dernière révision', fmt(last)],
            ['Prochaine révision', c.state === 'new' ? '-' : fmt(c.due) + ` (${fmtRelativeFuture(c.due)})`],
            ['Intervalle', c.state === 'review' || c.state === 'relearning' ? fmtDays(Math.max(1, c.interval)) : '-'],
            fsr && fs ? ['Stabilité', `${fmtNum(fs.s)} jours`] : ['Facilité', `${Math.round(c.ease * 100)} %`],
            fsr && fs ? ['Difficulté', `${fmtNum(fs.d)} / 10`] : null,
            fsr && R !== null ? ['Probabilité de souvenir', `${Math.round(R * 100)} %`] : null,
            ['Révisions', c.reps], ['Oublis', c.lapses], ['Erreurs en cours', c.errors],
            ['Temps total', fmtDuration(total)], ['Tags', c.tags.length ? esc(c.tags.join(', ')) : '-']
        ].filter(Boolean);
        this.openModal({
            title: 'Informations sur la carte', size: 'wide',
            body: `<div class="rich info-q">${c.front}</div>
                <dl class="info-grid">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
                <h4 class="stat-title" style="margin:18px 0 8px">Historique des révisions</h4>
                ${log.length ? `<div class="table-scroll"><table class="stat-table info-log"><thead><tr><th>Date</th><th>Type</th><th>Réponse</th><th>Intervalle</th><th>Durée</th></tr></thead><tbody>
                    ${[...log].reverse().slice(0, 60).map(r => `<tr><td>${fmt(r[0])}</td><td>${typeName[r[3]] || ''}</td><td class="g${r[2]}">${btn[r[2]] || '-'}</td><td>${r[4] ? fmtDays(r[4]) : '-'}</td><td>${r[6] ? fmtDuration(r[6] / 1000) : '-'}</td></tr>`).join('')}
                    </tbody></table></div>` : '<p class="muted small">Pas encore d\'historique pour cette carte.</p>'}`,
            foot: `<button class="btn btn-soft" data-close>Fermer</button>`
        });
    },

    /* ============================================================
       Custom study
       ============================================================ */
    openCustomStudy(presetDeck) {
        const modes = [
            ['ahead', 'Réviser en avance', 'Les cartes qui ne sont pas encore à revoir mais le seront bientôt.', 'jours', 3],
            ['forgot', 'Réviser les cartes oubliées', 'Les cartes que tu as ratées récemment.', 'derniers jours', 3],
            ['new', 'Apprendre plus de nouvelles cartes', 'Dépasse la limite quotidienne.', 'cartes', 10],
            ['hard', 'Les cartes les plus difficiles', 'Celles que tu rates le plus (sans impact sur le planning).', 'cartes', 20],
            ['tag', 'Réviser par tag', 'Toutes les cartes portant un tag (sans impact sur le planning).', 'cartes max', 30],
            ['all', 'Tout réviser (bachotage)', 'Un échantillon aléatoire, idéal avant un examen (sans impact sur le planning).', 'cartes', 50]
        ];
        let mode = 'ahead';
        const m = this.openModal({
            title: `${ic('sliders')} Révisions personnalisées`,
            body: `<div class="field"><label class="label" for="cs-deck">Paquet</label><select class="select" id="cs-deck"><option value="">Tous les paquets</option>${this.sortedDecks().map(d => `<option value="${esc(d.id)}" ${d.id === presetDeck ? 'selected' : ''}>${esc(d.emoji)} ${esc(this.deckPath(d.id))}</option>`).join('')}</select></div>
                <div class="field"><span class="label">Que veux-tu faire ?</span>
                <div class="pick-list" id="cs-modes" style="max-height:none">${modes.map(([k, t, d]) => `<button class="pick-item ${k === mode ? 'active' : ''}" data-mode="${k}" style="flex-direction:column;align-items:flex-start;gap:2px"><b>${t}</b><span class="small muted" style="font-weight:500">${d}</span></button>`).join('')}</div></div>
                <div class="field" id="cs-tag-wrap" style="display:none"><label class="label" for="cs-tag">Tag</label><input class="input" id="cs-tag" placeholder="chapitre1" autocomplete="off"></div>
                <div class="field"><label class="label" for="cs-n" id="cs-n-label">Nombre</label><input class="input" id="cs-n" type="number" min="1" max="9999" value="3" inputmode="numeric"></div>
                <p class="help" id="cs-count"></p>`,
            foot: `<button class="btn btn-soft" data-close>Annuler</button><button class="btn btn-primary" id="cs-go">${ic('play')}Commencer</button>`
        });
        const deckIds = () => { const v = $('#cs-deck', m).value; return v ? [v] : null; };
        const pool = () => { const set = deckIds() ? new Set(deckIds().flatMap(id => this.descendantIds(id))) : null; return this.data.cards.filter(c => !c.suspended && (!set || set.has(c.deckId))); };
        const select = () => {
            const meta = modes.find(x => x[0] === mode);
            $('#cs-n-label', m).textContent = `Nombre de ${meta[3]}`;
            $('#cs-n', m).value = meta[4];
            $('#cs-tag-wrap', m).style.display = mode === 'tag' ? '' : 'none';
            $$('[data-mode]', m).forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
            count();
        };
        const pick = () => {
            const n = Math.max(1, Math.round(Number($('#cs-n', m).value) || 1)), now = Date.now(), eod = endOfDay(now), cards = pool();
            if (mode === 'ahead') return cards.filter(c => c.state === 'review' && c.due > eod && c.due <= eod + n * DAY);
            if (mode === 'forgot') { const since = now - n * DAY, ids = new Set(this.data.revlog.filter(r => r[0] >= since && r[2] === 1 && r[3] !== 3).map(r => r[1])); return cards.filter(c => ids.has(c.id)); }
            if (mode === 'new') return cards.filter(c => c.state === 'new').slice(0, n);
            if (mode === 'hard') return [...cards].filter(c => c.state !== 'new').sort((a, b) => b.errors - a.errors || b.lapses - a.lapses || a.ease - b.ease).slice(0, n);
            if (mode === 'tag') { const t = fold($('#cs-tag', m).value.trim()); return t ? shuffle(cards.filter(c => c.tags.some(x => fold(x) === t))).slice(0, n) : []; }
            return shuffle([...cards]).slice(0, n);
        };
        const count = () => { const k = pick().length; $('#cs-count', m).textContent = `${plural(k, 'carte trouvée')}.`; $('#cs-go', m).disabled = !k; };
        $('#cs-modes', m).addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (b) { mode = b.dataset.mode; select(); } });
        ['#cs-deck', '#cs-n', '#cs-tag'].forEach(sel => $(sel, m).addEventListener('input', count));
        $('#cs-go', m).addEventListener('click', () => {
            const cards = pick();
            if (!cards.length) return;
            const ids = cards.map(c => c.id), title = `${modes.find(x => x[0] === mode)[1]}`;
            this.closeModal(m);
            if (mode === 'ahead' || mode === 'forgot') this.startSrsIds(title, ids);
            else if (mode === 'new') this.startStudy(deckIds() ? deckIds()[0] : null, ids.length);
            else this.startPractice(null, 'flip', 9999, title, ids);
        });
        select();
    },

    /* ============================================================
       Study options (global + per deck)
       ============================================================ */
    optionFields() {
        const S = (sec, key, label, type, extra = {}) => ({ sec, key, label, type, ...extra });
        return [
            S('Limites journalières', 'newPerDay', 'Nouvelles cartes par jour', 'limit', { min: 0, max: 9999 }),
            S('Limites journalières', 'maxReviews', 'Révisions maximum par jour', 'limit', { min: 0, max: 9999, help: '9999 = illimité.' }),
            S('Nouvelles cartes', 'learnSteps', 'Étapes d\'apprentissage', 'text', { help: 'Ex. « 1m 10m 1h » (m = minutes, h = heures, d = jours).' }),
            S('Nouvelles cartes', 'gradIvl', 'Intervalle de passe (jours)', 'int', { min: 1, max: 365, only: 'sm2', help: 'Intervalle après la dernière étape.' }),
            S('Nouvelles cartes', 'easyIvl', 'Intervalle pour les cartes faciles (jours)', 'int', { min: 1, max: 365 }),
            S('Nouvelles cartes', 'newOrder', 'Ordre d\'insertion', 'select', { options: [['ordered', 'Séquentiel (les plus anciennes d\'abord)'], ['random', 'Aléatoire']] }),
            S('Échecs', 'relearnSteps', 'Étapes de ré-apprentissage', 'text', { help: 'Après un oubli. Ex. « 10m 1h ».' }),
            S('Échecs', 'minIvl', 'Intervalle minimum (jours)', 'int', { min: 1, max: 365, help: 'Plus petit intervalle après un oubli.' }),
            S('Échecs', 'leechThreshold', 'Seuil de pénibilité (oublis)', 'int', { min: 0, max: 99, help: '0 = désactivé.' }),
            S('Échecs', 'leechAction', 'Traitement des pénibles', 'select', { options: [['suspend', 'Suspendre la carte'], ['tag', 'Seulement ajouter le tag « leech »']] }),
            S('Ordre d\'affichage', 'newReviewOrder', 'Ordre nouvelle / à réviser', 'select', { options: [['mix', 'Mélanger avec les cartes à réviser'], ['after', 'Après les cartes à réviser'], ['before', 'Avant les cartes à réviser']] }),
            S('Ordre d\'affichage', 'reviewSort', 'Ordre de classement des cartes à réviser', 'select', { options: [['random', 'Aléatoire'], ['due', 'Par échéance'], ['added', 'Ordre d\'ajout'], ['ivlAsc', 'Intervalles croissants'], ['ivlDesc', 'Intervalles décroissants'], ['easeAsc', 'Plus difficiles d\'abord']] }),
            S('Algorithme', 'scheduler', 'Algorithme de planification', 'select', { options: [['sm2', 'SM-2 (Anki classique)'], ['fsrs', 'FSRS (moderne, recommandé)']], help: 'FSRS prédit ta probabilité de souvenir et espace les révisions pour la viser : en général moins de révisions pour le même résultat.' }),
            S('Algorithme', 'retention', 'Rétention visée (FSRS)', 'pct', { min: 70, max: 99, unit: '%', only: 'fsrs', help: '90 % est un bon équilibre. Plus c\'est haut, plus tu révises souvent.' }),
            S('Enfouissement', 'buryNewSib', 'Enfouir les nouvelles cartes sœurs', 'bool'),
            S('Enfouissement', 'buryRevSib', 'Enfouir les cartes sœurs à réviser', 'bool'),
            S('Enfouissement', 'buryLearnSib', 'Enfouir les cartes sœurs en cours d\'apprentissage', 'bool', { help: 'Évite de voir la question et sa version inversée le même jour.' }),
            S('Chronomètre', 'maxAnswerSecs', 'Temps de réponse maximum (s)', 'int', { min: 5, max: 600, help: 'Au-delà, le temps passé n\'est plus compté.' }),
            S('Avance automatique', 'autoQSecs', 'Temps d\'affichage de la question (s)', 'float', { min: 0, max: 300, help: '0 = désactivé. Affiche la réponse tout seul.' }),
            S('Avance automatique', 'autoASecs', 'Temps d\'affichage de la réponse (s)', 'float', { min: 0, max: 300 }),
            S('Avance automatique', 'autoAAction', 'Action de la réponse', 'select', { options: [['none', 'Rien'], ['bury', 'Enfouir la carte'], ['again', 'Réponse à revoir'], ['hard', 'Réponse difficile'], ['good', 'Réponse correcte'], ['easy', 'Réponse facile']] }),
            S('Jours faciles', 'easyDays', 'Jours de la semaine', 'days', { help: 'Les révisions évitent les jours « réduit » ou « minimum » quand c\'est possible.' }),
            S('Avancé', 'maxIvl', 'Intervalle maximum (jours)', 'int', { min: 1, max: 36500 }),
            S('Avancé', 'startEase', 'Facilité initiale', 'pct', { min: 130, max: 500, unit: '%', only: 'sm2' }),
            S('Avancé', 'easyBonus', 'Bonus facile', 'pct', { min: 100, max: 300, unit: '%', only: 'sm2' }),
            S('Avancé', 'ivlMult', 'Modificateur d\'intervalle', 'pct', { min: 30, max: 300, unit: '%', help: '100 % = normal. 80 % = révisions plus fréquentes.' }),
            S('Avancé', 'hardMult', 'Intervalle difficile', 'pct', { min: 100, max: 200, unit: '%', only: 'sm2' }),
            S('Avancé', 'lapseMult', 'Nouvel intervalle après un oubli', 'pct', { min: 0, max: 100, unit: '%', only: 'sm2', help: 'Part de l\'ancien intervalle conservée.' })
        ];
    },
    /* ctx.lim = per-deck limit state (deck options) or undefined (global form) */
    optionsFormHtml(vals, idPrefix = 'op', ctx = {}) {
        const fsr = vals.scheduler === 'fsrs', wd = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'], wdIdx = [1, 2, 3, 4, 5, 6, 0];
        let html = '', cur = '';
        this.optionFields().forEach(f => {
            if (f.sec !== cur) { cur = f.sec; html += `<h4 class="opt-sec">${f.sec}</h4>`; }
            const id = `${idPrefix}-${f.key}`, v = vals[f.key];
            const hide = f.only && ((f.only === 'fsrs') !== fsr) ? 'style="display:none"' : '';
            let input = '', block = false;
            if (f.type === 'limit' && ctx.lim) {
                const L = ctx.lim[f.key], tabs = [['preset', 'Préréglage'], ['deck', 'Ce paquet'], ['today', 'Juste aujourd\'hui']];
                block = true;
                input = `<div class="segmented seg-sm limit-tabs" data-limtabs="${f.key}">${tabs.map(([k, l]) => `<button type="button" data-limtab="${k}" class="${L.tab === k ? 'active' : ''}">${l}</button>`).join('')}</div>
                         <input class="input" data-lim="${f.key}" type="number" min="${f.min}" max="${f.max}" value="${L.vals[L.tab] ?? ''}" inputmode="numeric">`;
            }
            else if (f.type === 'select') input = `<select class="select" id="${id}" data-opt="${f.key}">${f.options.map(([o, l]) => `<option value="${o}" ${String(v) === o ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
            else if (f.type === 'bool') input = `<label class="switch"><input type="checkbox" id="${id}" data-opt="${f.key}" ${v === true || v === 'true' ? 'checked' : ''}><span></span></label>`;
            else if (f.type === 'pct') input = `<div class="opt-num"><input class="input" id="${id}" data-opt="${f.key}" type="number" min="${f.min}" max="${f.max}" value="${Math.round(num(v, 0) * 100)}" inputmode="numeric"><span>${f.unit}</span></div>`;
            else if (f.type === 'int' || f.type === 'limit') input = `<input class="input opt-short" id="${id}" data-opt="${f.key}" type="number" min="${f.min}" max="${f.max}" value="${num(v, 0)}" inputmode="numeric">`;
            else if (f.type === 'float') input = `<input class="input opt-short" id="${id}" data-opt="${f.key}" type="number" min="${f.min}" max="${f.max}" step="0.5" value="${String(num(v, 0)).replace(',', '.')}" inputmode="decimal">`;
            else if (f.type === 'days') {
                block = true;
                const str = String(v || '0000000');
                input = `<div class="days-grid"><span></span><span>Normal</span><span>Réduit</span><span>Minimum</span>${wd.map((d, i) => `<span class="dname">${d}</span>${[0, 1, 2].map(k => `<label class="dradio"><input type="radio" name="${id}-${wdIdx[i]}" data-day="${wdIdx[i]}" value="${k}" ${str[wdIdx[i]] === String(k) ? 'checked' : ''}><i></i></label>`).join('')}`).join('')}</div>`;
            }
            else input = `<input class="input" id="${id}" data-opt="${f.key}" value="${esc(v)}" autocomplete="off">`;
            html += `<div class="set-row opt-row ${block ? 'opt-block' : ''}" data-optrow="${f.key}" ${hide}><div class="txt"><b>${f.label}</b>${f.help ? `<span>${f.help}</span>` : ''}</div><div class="opt-ctl">${input}</div></div>`;
        });
        return html;
    },
    readOptions(root) {
        const out = {};
        this.optionFields().forEach(f => {
            if (f.type === 'days') {
                const arr = ['0', '0', '0', '0', '0', '0', '0'];
                $$('[data-day]', root).forEach(r => { if (r.checked) arr[Number(r.dataset.day)] = r.value; });
                out.easyDays = arr.join('');
                return;
            }
            const el = $(`[data-opt="${f.key}"]`, root);
            if (!el) return;
            if (f.type === 'bool') out[f.key] = el.checked;
            else if (f.type === 'pct') out[f.key] = clamp(num(el.value, f.min) / 100, f.min / 100, f.max / 100);
            else if (f.type === 'int' || f.type === 'limit') out[f.key] = clamp(Math.round(num(el.value, f.min)), f.min, f.max);
            else if (f.type === 'float') out[f.key] = clamp(num(String(el.value).replace(',', '.'), f.min), f.min, f.max);
            else out[f.key] = el.value;
        });
        return out;
    },
    bindOptionsForm(root) {
        $$('[data-opt], [data-lim]', root).forEach(el => { if (!el.getAttribute('aria-label')) { const b = el.closest('.opt-row'); const t = b && b.querySelector('.txt b'); if (t) el.setAttribute('aria-label', t.textContent); } });
        const sync = () => {
            const fsr = ($('[data-opt="scheduler"]', root) || {}).value === 'fsrs';
            this.optionFields().forEach(f => { const row = $(`[data-optrow="${f.key}"]`, root); if (row && f.only) row.style.display = ((f.only === 'fsrs') === fsr) ? '' : 'none'; });
        };
        const sel = $('[data-opt="scheduler"]', root);
        if (sel) sel.addEventListener('change', sync);
        sync();
    },
    /* Deck options, like Anki: named presets (shared by several decks), per-deck daily limits, "just today" limits */
    openDeckOptions(deckId) {
        const deck = this.deck(deckId);
        if (!deck) return;
        const today = dayKey(), L = deck.limits || {}, T = L.today && L.today.date === today ? L.today : {};
        const work = { def: this.defaultOpts(), presets: structuredClone(this.data.presets), sel: this.presetIdFor(deckId), kids: false };
        const valsOf = id => ({ ...work.def, ...(id ? (work.presets.find(p => p.id === id) || { opts: {} }).opts : {}) });
        const lim = {};
        ['newPerDay', 'maxReviews'].forEach(k => {
            lim[k] = { tab: T[k] !== undefined ? 'today' : L[k] !== undefined ? 'deck' : 'preset', vals: { preset: valsOf(work.sel)[k], deck: L[k], today: T[k] } };
        });
        const m = this.openModal({ title: `${ic('sliders')} Options du paquet`, size: 'wide', body: '<div id="do-root"></div>', foot: `<button class="btn btn-soft" data-close>Annuler</button><button class="btn btn-primary" id="do-save">${ic('check')}Enregistrer</button>` });
        const root = $('#do-root', m);
        const usedBy = id => this.data.decks.filter(d => this.presetIdFor(d.id) === id).length;
        const stash = () => {
            const o = this.readOptions(root);
            ['newPerDay', 'maxReviews'].forEach(k => { o[k] = lim[k].vals.preset ?? o[k]; });
            if (work.sel === '') work.def = { ...work.def, ...o };
            else { const p = work.presets.find(x => x.id === work.sel); if (p) p.opts = { ...p.opts, ...o }; }
        };
        const render = () => {
            const names = [{ id: '', name: 'Par défaut' }, ...work.presets];
            root.innerHTML = `
                <div class="preset-bar">
                    <select class="select" id="do-preset" aria-label="Préréglage">${names.map(p => `<option value="${esc(p.id)}" ${p.id === work.sel ? 'selected' : ''}>${esc(p.name)} (utilisé par ${plural(usedBy(p.id) + (p.id === work.sel && this.presetIdFor(deckId) !== work.sel ? 1 : 0) - (p.id !== work.sel && this.presetIdFor(deckId) === p.id ? 1 : 0), 'paquet')})</option>`).join('')}</select>
                    <button class="icon-btn" id="do-more" title="Gérer les préréglages" aria-label="Gérer les préréglages">${ic('more')}</button>
                </div>
                <p class="small muted" style="margin:8px 0 2px"><b>${esc(this.deckPath(deckId))}</b> : les sous-paquets héritent de ce préréglage. Un préréglage s'applique à tous les paquets qui l'utilisent.</p>
                ${this.optionsFormHtml(valsOf(work.sel), 'do', { lim })}`;
            this.bindOptionsForm(root);
        };
        render();
        root.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.lim; if (k) lim[k].vals[lim[k].tab] = e.target.value === '' ? undefined : clamp(Math.round(num(e.target.value, 0)), 0, 9999); });
        root.addEventListener('click', e => {
            const t = e.target.closest('[data-limtab]');
            if (!t) return;
            const k = t.parentElement.dataset.limtabs, L2 = lim[k], inp = $(`[data-lim="${k}"]`, root);
            L2.tab = t.dataset.limtab;
            if (L2.vals[L2.tab] === undefined) L2.vals[L2.tab] = L2.vals.deck !== undefined && L2.tab === 'today' ? L2.vals.deck : L2.vals.preset;
            inp.value = L2.vals[L2.tab];
            $$('[data-limtab]', t.parentElement).forEach(b => b.classList.toggle('active', b === t));
        });
        root.addEventListener('change', e => {
            if (e.target.id !== 'do-preset') return;
            stash();
            work.sel = e.target.value;
            ['newPerDay', 'maxReviews'].forEach(k => { lim[k].vals.preset = valsOf(work.sel)[k]; });
            render();
        });
        const names2 = () => [{ id: '', name: 'Par défaut' }, ...work.presets];
        root.addEventListener('click', e => {
            const btn = e.target.closest('#do-more');
            if (!btn) return;
            this.showMenu(btn, [
                { icon: 'plus', label: 'Ajouter un préréglage…', fn: async () => { const n = await this.askText({ title: 'Nouveau préréglage', label: 'Nom', ok: 'Créer' }); if (!n || !n.trim()) return; stash(); const id = uid('p'); work.presets.push({ id, name: n.trim().slice(0, 60), opts: { ...this.defaultOpts() }, mod: 0 }); work.sel = id; ['newPerDay', 'maxReviews'].forEach(k => { lim[k].vals.preset = valsOf(id)[k]; }); render(); } },
                { icon: 'copy', label: 'Cloner ce préréglage…', fn: async () => { const cur = names2().find(p => p.id === work.sel); const n = await this.askText({ title: 'Cloner le préréglage', label: 'Nom', value: `${cur.name} (copie)`, ok: 'Cloner' }); if (!n || !n.trim()) return; stash(); const id = uid('p'); work.presets.push({ id, name: n.trim().slice(0, 60), opts: { ...valsOf(work.sel) }, mod: 0 }); work.sel = id; render(); } },
                ...(work.sel ? [{ icon: 'pencil', label: 'Renommer…', fn: async () => { const p = work.presets.find(x => x.id === work.sel); const n = await this.askText({ title: 'Renommer', label: 'Nom', value: p.name, ok: 'Renommer' }); if (n && n.trim()) { stash(); p.name = n.trim().slice(0, 60); render(); } } },
                    { icon: 'trash', label: 'Supprimer ce préréglage', danger: true, fn: () => { stash(); work.presets = work.presets.filter(x => x.id !== work.sel); work.sel = ''; ['newPerDay', 'maxReviews'].forEach(k => { lim[k].vals.preset = valsOf('')[k]; }); render(); } }] : []),
                { icon: 'folder', label: work.kids ? '✓ Appliquer aux sous-paquets' : 'Appliquer à tous les sous-paquets', fn: () => { work.kids = !work.kids; this.toast(work.kids ? 'Sera appliqué aux sous-paquets à l\'enregistrement' : 'Sous-paquets inchangés', 'success'); } }
            ]);
        });
        $('#do-save', m).addEventListener('click', () => {
            stash();
            const now = Date.now(), inherited = deck.parent ? this.presetIdFor(deck.parent) : '';
            Object.assign(this.data.settings, work.def);
            this.data.settings.settingsMod = now;
            this.data.presets = work.presets;
            deck.preset = work.sel === inherited ? null : (work.sel === '' ? '__default' : work.sel);
            if (work.kids) this.descendantIds(deckId).slice(1).forEach(id => { const d = this.deck(id); d.preset = null; d.limits = null; });
            const nl = {};
            ['newPerDay', 'maxReviews'].forEach(k => {
                const x = lim[k];
                if (x.tab === 'deck' && x.vals.deck !== undefined) nl[k] = x.vals.deck;
                if (x.tab === 'today' && x.vals.today !== undefined) { nl.today = nl.today || { date: dayKey() }; nl.today[k] = x.vals.today; if (x.vals.deck !== undefined) nl[k] = x.vals.deck; }
            });
            deck.limits = Object.keys(nl).length ? nl : null;
            this.save();
            this.closeModal(m);
            this.render();
            this.toast('Options enregistrées', 'success', ic('sliders'));
        });
    },

    /* ============================================================
       Library of ready-made packs (content/*.txt, built into PACKS)
       ============================================================ */
    packCardIds(pack) {
        const ids = [];
        let n = 0;
        pack.decks.forEach(d => d.cards.forEach(c => {
            n++;
            if (c[0] === 'b') ids.push(`pk_${pack.id}_${n}`);
            else clozeNumbers(c[1]).forEach(k => ids.push(`pk_${pack.id}_${n}_c${k}`));
        }));
        return ids;
    },
    packStatus(pack) {
        const have = new Set(this.data.cards.map(c => c.id)), ids = this.packCardIds(pack);
        return { total: ids.length, owned: ids.filter(id => have.has(id)).length };
    },
    /* Adds a pack (missing cards only) under group > pack > sub-deck decks. Returns the number of cards added. */
    addPack(packId) {
        const pack = PACKS.find(p => p.id === packId);
        if (!pack) return 0;
        const g = PACK_GROUPS[pack.group], now = Date.now(), have = new Set(this.data.cards.map(c => c.id));
        const ensureDeck = (id, name, emoji, parent, description = '') => {
            let d = this.deck(id);
            if (!d) { d = { id, name, emoji, description, created: now, parent, opts: null, mod: 0, preset: id === 'pk_g_anglais' && this.data.presets.some(x => x.id === TOEIC_PRESET_ID) ? TOEIC_PRESET_ID : null, limits: null }; this.data.decks.push(d); }
            return d.id;
        };
        let added = 0, n = 0;
        this.change(`ajout du paquet ${pack.title}`, [], () => {
            const made = [], gid = ensureDeck(`pk_g_${pack.group}`, g.name, g.emoji, null, g.desc);
            const pid = ensureDeck(`pk_${pack.id}`, pack.title, pack.emoji, gid, pack.desc);
            pack.decks.forEach((sd, si) => {
                const did = ensureDeck(`pk_${pack.id}_d${si}`, sd.name, sd.emoji, pid);
                sd.cards.forEach(c => {
                    n++;
                    const base = { ...freshCard(), deckId: did, tags: [...pack.tags], hint: '', detail: '', created: now + n, nid: '', kind: 'basic', ord: 0, nf: null };
                    if (c[0] === 'b') {
                        const id = `pk_${pack.id}_${n}`;
                        if (have.has(id)) return;
                        this.data.cards.push({ ...base, id, front: sanitizeHtml(c[1]), back: sanitizeHtml(c[2]), hint: sanitizeHtml(c[3] || '') });
                        made.push(id); added++;
                    } else {
                        const nid = `pk_${pack.id}_${n}n`;
                        clozeNumbers(c[1]).forEach(k => {
                            const id = `pk_${pack.id}_${n}_c${k}`;
                            if (have.has(id)) return;
                            const card = { ...base, id, nid, kind: 'cloze', ord: k, front: '', back: '', nf: { front: '', back: '', text: sanitizeHtml(c[1]), extra: sanitizeHtml(c[2] || '') } };
                            materializeCard(card);
                            this.data.cards.push(card);
                            made.push(id); added++;
                        });
                    }
                });
            });
            return made;
        }, { decks: true });
        return added;
    },
    openLibrary() {
        const render = () => {
            const groupsHtml = Object.entries(PACK_GROUPS).map(([gk, g]) => {
                const packs = PACKS.filter(p => p.group === gk);
                const stats = packs.map(p => this.packStatus(p));
                const total = stats.reduce((a, s) => a + s.total, 0), owned = stats.reduce((a, s) => a + s.owned, 0);
                return `<div class="lib-group">
                    <div class="lib-group-head"><div><h4>${g.emoji} ${esc(g.name)}</h4><p class="small muted">${esc(g.desc)}</p></div>
                    <button class="btn ${owned >= total ? 'btn-soft' : 'btn-primary'} btn-sm" data-libgroup="${gk}" ${owned >= total ? 'disabled' : ''}>${owned >= total ? `${ic('check')}Tout ajouté` : `Tout ajouter (${total - owned})`}</button></div>
                    ${packs.map((p, i) => { const s = stats[i], done = s.owned >= s.total; return `
                    <div class="lib-pack">
                        <span class="deck-emoji">${esc(p.emoji)}</span>
                        <div class="lib-info"><b>${esc(p.title)}</b><p class="small muted">${esc(p.desc)}</p><p class="tiny faint">${plural(s.total, 'carte')} · ${plural(p.decks.length, 'sous-paquet')}${s.owned && !done ? ` · ${s.owned} déjà ajoutées` : ''}</p></div>
                        <button class="btn ${done ? 'btn-soft' : 'btn-primary'} btn-sm" data-libpack="${esc(p.id)}" ${done ? 'disabled' : ''}>${done ? ic('check') : ic('plus')}${done ? 'Ajouté' : s.owned ? 'Compléter' : 'Ajouter'}</button>
                    </div>`; }).join('')}
                </div>`;
            }).join('');
            return `<p class="small muted" style="margin-bottom:14px">Ajoute les paquets qui t'intéressent : tes cartes et ta progression ne sont jamais modifiées. Tu peux retirer un paquet en le supprimant. <b>Les chiffres réglementaires (taux, plafonds, seuils) sont indicatifs</b> : vérifie les valeurs à jour avant de t'en servir.</p>${groupsHtml}`;
        };
        const m = this.openModal({ title: `${ic('layers')} Bibliothèque de paquets`, size: 'wide', body: '<div id="lib-body"></div>', foot: '<button class="btn btn-soft" data-close>Fermer</button>' });
        const body = $('#lib-body', m);
        const refresh = () => { body.innerHTML = render(); };
        refresh();
        body.addEventListener('click', e => {
            const one = e.target.closest('[data-libpack]'), grp = e.target.closest('[data-libgroup]');
            if (!one && !grp) return;
            const packs = one ? [one.dataset.libpack] : PACKS.filter(p => p.group === grp.dataset.libgroup).map(p => p.id);
            const n = packs.reduce((a, id) => a + this.addPack(id), 0);
            this.settingsSeenLibrary();
            refresh();
            this.render();
            this.undoToast(`${plural(n, 'carte ajoutée', 'cartes ajoutées')}`, ic('layers'));
        });
    },
    settingsSeenLibrary() { if (!this.data.settings.libSeen) { this.data.settings.libSeen = true; this.save(false); } },

    /* ---------- Goal / exam countdown ---------- */
    /* all goals (the old single goal is migrated on first read), nearest first; past ones last */
    goalsRaw() {
        const s = this.data.settings;
        if (!Array.isArray(s.goals)) s.goals = [];
        if (!s.goals.length && s.goalDate && /^\d{4}-\d{2}-\d{2}$/.test(s.goalDate)) { s.goals = [{ id: uid('g'), name: s.goalName || 'Objectif', date: s.goalDate }]; s.goalDate = ''; s.goalName = ''; }
        return s.goals.filter(g => g && /^\d{4}-\d{2}-\d{2}$/.test(g.date));
    },
    goalsAll() {
        const today = dayKey();
        return this.goalsRaw().map(g => ({ ...g, days: daysBetweenKeys(today, g.date) })).sort((a, b) => (a.days < 0) - (b.days < 0) || (a.days < 0 ? b.days - a.days : a.days - b.days));
    },
    goalDateLabel(date) {
        const [y, m, d] = date.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    },
    goalInfo() {
        const g = this.goalsAll()[0];
        return g ? { name: g.name, days: g.days, date: g.date } : null;
    },
    goalsHtml() {
        const all = this.goalsAll();
        if (all.length < 2) return '';
        return `<div><div class="section-head"><h3 class="section-title">Échéances</h3><button class="link" data-nav="settings">Gérer</button></div><div class="goal-chips">${all.slice(0, 8).map(g => `<span class="goal-chip ${g.days < 0 ? 'past' : g.days <= 7 ? 'soon' : ''}">${ic('target')}<b>${esc(g.name)}</b><em>${g.days > 0 ? `J-${g.days}` : g.days === 0 ? "aujourd'hui" : 'terminé'}</em></span>`).join('')}</div></div>`;
    },

    /* ============================================================
       Automatic backups (kept inside the browser's IndexedDB)
       ============================================================ */
    async autoBackup(source) {
        if (!Storage.db || !this.data.settings.autoBackup || source === 'seed') return;
        try {
            const list = await Storage.backups();
            const last = list.filter(b => b.label === 'auto').sort((a, b) => b.at - a.at)[0];
            if (!last || Date.now() - last.at > 20 * 3600000) await Storage.backupSave('auto', this.serialize(), this.data);
        } catch (e) { console.warn('Backup:', e); }
    },
    async manualBackup(label = 'manuel') {
        if (!Storage.db) { this.toast('Sauvegardes automatiques indisponibles sur ce navigateur : utilise « Exporter ».', 'warning'); return; }
        await Storage.backupSave(label, this.serialize(), this.data);
        if (this.view === 'settings') this.renderSettings();
        this.toast('Sauvegarde créée', 'success', ic('file'));
    },
    async restoreBackup(key) {
        const json = await Storage.backupLoad(key);
        const data = json && normalizeState(json);
        if (!data) { this.toast('Sauvegarde illisible.', 'error'); return; }
        const ok = await this.confirm({ title: 'Restaurer cette sauvegarde ?', message: `${plural(data.decks.length, 'paquet')} et ${plural(data.cards.length, 'carte')}. L'état actuel sera lui aussi sauvegardé avant.`, ok: 'Restaurer', danger: true });
        if (!ok) return;
        await Storage.backupSave('avant restauration', this.serialize(), this.data);
        data.settings = Object.assign({}, data.settings, { syncKey: this.data.settings.syncKey, cloudSync: this.data.settings.cloudSync });
        data.updatedAt = Date.now();
        this.replaceData(data);
        this.save();
        this.toast('Sauvegarde restaurée', 'success');
    },
    async downloadBackup(key) {
        const json = await Storage.backupLoad(key);
        if (json) this.downloadFile(`superanki-sauvegarde-${dayKey()}.json`, json, 'application/json');
    },
    downloadFile(name, content, type = 'text/plain') {
        const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
        const a = document.createElement('a');
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    },
    exportTXT() {
        const cell = h => String(h || '').replace(/\t/g, ' ').replace(/\r?\n/g, '<br>');
        const lines = ['#separator:tab', '#html:true', '#tags column:3', '#deck column:4'];
        this.data.cards.forEach(c => lines.push([cell(c.front), cell(c.back), c.tags.map(t => t.replace(/\s+/g, '_')).join(' '), this.deckChain(c.deckId).map(d => d.name).join('::')].join('\t')));
        this.downloadFile(`superanki-cartes-${dayKey()}.txt`, lines.join('\n'), 'text/plain');
        this.toast(`${plural(this.data.cards.length, 'carte exportée', 'cartes exportées')} (importable dans Anki)`, 'success', ic('export'));
    }
});


/* quick filters under the card search: no need to know the query syntax */
Object.assign(SuperAnki.prototype, {
    quickQueryTokens() { return (this.ui.search || '').match(/"[^"]*"|\S+/g) || []; },
    quickQueryHtml() {
        const tok = new Set(this.quickQueryTokens()), counts = {};
        this.data.cards.forEach(c => c.tags.forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
        const tags = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b)).slice(0, 60);
        const cur = [...tok].find(t => /^tag:/i.test(t));
        const chips = [['Difficiles', 'is:error'], ['Sangsues', 'is:leech'], ['À réviser', 'is:due'], ['Nouvelles', 'is:new'], ['Marquées', 'is:marked'], ['Ratées cette semaine', 'rated:7 prop:lapses>=1']];
        return chips.map(([l, q]) => `<button class="chip ${q.split(' ').every(t => tok.has(t)) ? 'active' : ''}" data-action="quick-q" data-q="${esc(q)}">${esc(l)}</button>`).join('')
            + (tags.length ? `<label class="quick-tag"><span class="sr-only">Étiquette</span><select class="select select-sm" data-input="quick-tag"><option value="">Étiquette…</option>${tags.map(t => `<option value="${esc(t)}" ${cur && cur.slice(4).toLowerCase() === t.toLowerCase() ? 'selected' : ''}>${esc(t)} (${counts[t]})</option>`).join('')}</select></label>` : '');
    },
    quickQueryRefresh() { const el = $('#quick-q'); if (el) el.innerHTML = this.quickQueryHtml(); },
    quickQuerySet(tokens) {
        this.ui.search = tokens.join(' '); this.ui.limit = 60;
        const inp = $('#card-search');
        if (inp) { inp.value = this.ui.search; inp.closest('.search-field').classList.toggle('has-value', !!this.ui.search); }
        this.renderDeckSidebar(); this.renderDeckPanel(); this.quickQueryRefresh();
    },
    quickQueryToggle(q) {
        const toks = this.quickQueryTokens(), add = q.split(' '), on = add.every(t => toks.includes(t));
        this.quickQuerySet(on ? toks.filter(t => !add.includes(t)) : [...toks, ...add.filter(t => !toks.includes(t))]);
    },
    quickQueryTag(tag) {
        const toks = this.quickQueryTokens().filter(t => !/^tag:/i.test(t));
        if (tag) toks.push(/\s/.test(tag) ? `tag:"${tag}"` : `tag:${tag}`);
        this.quickQuerySet(toks);
    }
});
