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

/* ---------- voice commands (French; a few English words too) ---------- */
const VOICE_CMDS = [
    ['stop', ['stop', 'arrete', 'arreter', 'quitter', 'termine', 'terminer', 'fin du mode']],
    ['repeat', ['repete', 'repeter', 'repetez', 'relis', 'relire', 'encore une fois', 'rejoue']],
    ['undo', ['annule', 'annuler']],
    [1, ['rate', 'rater', 'oublie', 'oublier', 'encore', 'non', 'faux', 'pas su', 'pas bien', 'pas correct', 'je ne savais pas', 'je savais pas', 'again']],
    [4, ['facile', 'evident', 'trop facile', 'easy', 'parfait']],
    [2, ['difficile', 'dur', 'moyen', 'hesite', 'hard']],
    [3, ['bien', 'ok', 'okay', 'correct', 'oui', 'juste', 'vrai', 'je savais', 'bonne reponse', 'good', 'bon']],
    ['reveal', ['reponse', 'montre', 'montrer', 'voir', 'affiche', 'afficher', 'retourne', 'retourner', 'suite', 'je ne sais pas', 'aucune idee', 'show']]
];
function parseVoice(heard) {
    const t = ` ${fold(heard).replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
    for (const [cmd, words] of VOICE_CMDS) {
        if (words.some(w => t.includes(` ${w} `))) return cmd;
    }
    return null;
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
        const speak = top.querySelector('[data-action="speak"]');
        if (usable && speak && !top.querySelector('[data-action="voice-toggle"]')) speak.insertAdjacentHTML('beforebegin', `<button class="icon-btn ${this.voice && this.voice.on ? 'voice-on' : ''}" data-action="voice-toggle" title="Étudier à la voix" aria-label="Étudier à la voix">${ic('mic')}</button>`);
        if (this.voice && this.voice.on && !$('#voice-bar')) { const pb = $('#view-session .pbar'); if (pb) pb.insertAdjacentHTML('afterend', `<div class="voice-bar" id="voice-bar"><span class="rec-dot"></span><span id="voice-msg">…</span></div>`); }
        if (usable && this.voice && this.voice.on) {
            const key = `${s.current}:${s.revealed}`;
            if (s.voiceKey !== key) { s.voiceKey = key; this.voiceTurn(); }
        }
    },
    sessionCleanup() {
        this.voiceStop(true);
    },

    /* ============ voice study ============ */
    voiceSupported() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); },
    voiceToggle() {
        if (!this.voice) this.voice = { on: false, tok: 0, rec: null };
        if (!this.voiceSupported()) { this.toast('La reconnaissance vocale n\'est pas disponible ici (essaie Chrome, Edge ou Safari récent, en https).', 'warning', ic('mic')); return; }
        const v = this.voice;
        if (v.on) { this.voiceStop(true); this.toast('Mode voix désactivé', 'success', ic('mic')); this.syncVoiceUi(); return; }
        v.on = true;
        const s = this.session; if (s) s.voiceKey = null;
        this.syncVoiceUi();
        if (s && s.current) this.sessionDecor();
    },
    syncVoiceUi() {
        const b = $('[data-action="voice-toggle"]');
        if (b) b.classList.toggle('voice-on', !!(this.voice && this.voice.on));
        const bar = $('#voice-bar');
        if (this.voice && this.voice.on && !bar) { const pb = $('#view-session .pbar'); if (pb) pb.insertAdjacentHTML('afterend', `<div class="voice-bar" id="voice-bar"><span class="rec-dot"></span><span id="voice-msg">…</span></div>`); }
        if ((!this.voice || !this.voice.on) && bar) bar.remove();
    },
    voiceStop(off) {
        const v = this.voice;
        if (!v) return;
        v.tok++;
        try { if (v.rec) { v.rec.onresult = v.rec.onerror = v.rec.onend = null; v.rec.abort(); } } catch { /* ignore */ }
        v.rec = null;
        if ('speechSynthesis' in window) { try { speechSynthesis.cancel(); } catch { /* ignore */ } }
        if (off) v.on = false;
    },
    voiceMsg(t) { const el = $('#voice-msg'); if (el) el.textContent = t; },
    voiceSay(text, lang, tok) {
        return new Promise(resolve => {
            if (!('speechSynthesis' in window) || !text) { resolve(); return; }
            let done = false;
            const fin = () => { if (!done) { done = true; clearTimeout(g); resolve(); } };
            const u = new SpeechSynthesisUtterance(text.slice(0, 600));
            u.lang = lang; u.onend = fin; u.onerror = fin;
            const g = setTimeout(fin, 2500 + text.length * 90);
            try { speechSynthesis.cancel(); speechSynthesis.speak(u); } catch { fin(); }
        });
    },
    voiceListen(tok) {
        const v = this.voice, SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        return new Promise((resolve, reject) => {
            let rec;
            try { rec = new SR(); } catch (e) { reject(e); return; }
            v.rec = rec;
            rec.lang = 'fr-FR'; rec.interimResults = false; rec.maxAlternatives = 3; rec.continuous = false;
            let done = false;
            const fin = r => { if (done) return; done = true; clearTimeout(guard); resolve(r); };
            rec.onresult = e => { const out = []; for (const res of e.results) for (let i = 0; i < res.length; i++) out.push(res[i].transcript); fin(out); };
            rec.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { done = true; clearTimeout(guard); reject(new Error('denied')); } else fin(null); };
            rec.onend = () => fin(null);
            const guard = setTimeout(() => { try { rec.stop(); } catch { /* ignore */ } fin(null); }, 9000);
            try { rec.start(); } catch (e) { fin(null); }
        });
    },
    async voiceTurn() {
        const v = this.voice, s = this.session;
        if (!v || !v.on || !s || !s.current) return;
        const tok = ++v.tok, id = s.current, revealed = s.revealed, card = this.card(id);
        const alive = () => this.voice && this.voice.on && this.voice.tok === tok && this.session === s && s.current === id && s.revealed === revealed;
        const text = stripHtml(revealed ? card.back : card.front);
        this.voiceMsg(revealed ? '🔊 Je lis la réponse…' : '🔊 Je lis la question…');
        await this.voiceSay(text, guessLang(text), tok);
        for (let attempt = 0; attempt < 4 && alive(); attempt++) {
            this.voiceMsg(revealed ? '🎤 Dis : raté · difficile · bien · facile' : '🎤 Dis : « réponse »');
            let heard;
            try { heard = await this.voiceListen(tok); } catch { this.voiceStop(true); this.syncVoiceUi(); this.toast('Micro refusé : autorise-le dans ton navigateur.', 'error', ic('mic')); return; }
            if (!alive()) return;
            if (!heard) continue;
            const cmds = heard.map(parseVoice), cmd = cmds.find(c => c !== null);
            if (cmd == null) { this.voiceMsg(`Entendu : « ${heard[0]} ». Je n'ai pas compris.`); await new Promise(r => setTimeout(r, 900)); continue; }
            if (cmd === 'stop') { this.voiceStop(true); this.syncVoiceUi(); return; }
            if (cmd === 'repeat') { s.voiceKey = null; this.voiceTurn(); return; }
            if (cmd === 'undo') { this.undo(); return; }
            if (cmd === 'reveal' || (!revealed && typeof cmd === 'number')) { this.voiceMsg('✔ Réponse'); this.reveal(); return; }
            if (typeof cmd === 'number' && revealed) {
                this.voiceMsg(`✔ ${['', 'Raté', 'Difficile', 'Bien', 'Facile'][cmd]}`);
                if (s.kind === 'srs') this.grade(cmd); else this.practiceAnswer(cmd >= 3);
                return;
            }
        }
        if (alive()) { this.voiceMsg('⏸ En pause : touche le micro pour reprendre.'); this.voiceStop(true); this.syncVoiceUi(); }
    }
});
/* the session decorations (timer, mic, voice bar) are added after every render of a card */
(() => { const base = SuperAnki.prototype.renderSession; SuperAnki.prototype.renderSession = function (...a) { const r = base.apply(this, a); this.sessionDecor(); return r; }; })();
(() => { const base = SuperAnki.prototype.showSummary; SuperAnki.prototype.showSummary = function (...a) { this.sessionCleanup(); return base.apply(this, a); }; })();
