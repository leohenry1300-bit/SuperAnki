/* ============================================================
   Custom note types: your own fields and card templates (like Anki).
   Template syntax: {{Field}}, {{FrontSide}}, {{#Field}}...{{/Field}} (shown if filled), {{^Field}}...{{/Field}} (shown if empty),
   <hr id=answer> separates the repeated question from the answer on the back.
   A note stores its values in card.nf.f = {FieldName: html}, its type in card.nf.t, and its template number in card.ord.
   ============================================================ */
function normalizeNoteTypes(list) {
    return toArray(list).filter(t => t && t.id && Array.isArray(t.fields) && Array.isArray(t.templates)).map(t => {
        const fields = [...new Set(t.fields.map(f => String(f).trim().slice(0, 40)).filter(Boolean))];
        const templates = t.templates.filter(x => x && typeof x === 'object').map((x, i) => ({ name: String(x.name || `Carte ${i + 1}`).slice(0, 40), front: String(x.front || '').slice(0, 4000), back: String(x.back || '').slice(0, 4000) }));
        return fields.length && templates.length ? { id: String(t.id), name: String(t.name || 'Type de note').slice(0, 60), fields, templates, mod: num(t.mod, 0) } : null;
    }).filter(Boolean);
}
const noteTypeSig = t => JSON.stringify([t.name, t.fields, t.templates]);
const NOTE_TYPE_STARTERS = [
    { key: 'qa', name: 'Question / Réponse / Source', fields: ['Question', 'Réponse', 'Source'], templates: [{ name: 'Carte 1', front: '{{Question}}', back: '{{FrontSide}}<hr id=answer>{{Réponse}}{{#Source}}<br><small>{{Source}}</small>{{/Source}}' }] },
    { key: 'vocab', name: 'Vocabulaire (2 sens)', fields: ['Mot', 'Sens', 'Exemple', 'Prononciation'], templates: [
        { name: 'Mot → Sens', front: '{{Mot}}', back: '{{FrontSide}}<hr id=answer>{{Sens}}{{#Exemple}}<br><i>{{Exemple}}</i>{{/Exemple}}{{#Prononciation}}<br><small>{{Prononciation}}</small>{{/Prononciation}}' },
        { name: 'Sens → Mot', front: '{{Sens}}', back: '{{FrontSide}}<hr id=answer>{{Mot}}{{#Exemple}}<br><i>{{Exemple}}</i>{{/Exemple}}' }] },
    { key: 'blank', name: 'Vierge', fields: ['Recto', 'Verso'], templates: [{ name: 'Carte 1', front: '{{Recto}}', back: '{{FrontSide}}<hr id=answer>{{Verso}}' }] }
];
const ANSWER_SPLIT = /<hr id=["']?answer["']?\s*\/?>/i;

/* renders one template of a custom note: {front, back} html */
function customRender(c) {
    const nt = typeof app !== 'undefined' && app.data && app.data.noteTypes.find(x => x.id === c.nf.t);
    const fields = c.nf.f || {};
    if (!nt) return { front: sanitizeHtml(Object.values(fields)[0] || ''), back: sanitizeHtml(Object.values(fields).slice(1).join('<br>')) };
    const tpl = nt.templates[c.ord] || nt.templates[0];
    const front = apkgRender(tpl.front, fields, ''), full = apkgRender(tpl.back, fields, front);
    return { front: sanitizeHtml(front), back: sanitizeHtml(full.split(ANSWER_SPLIT).pop()) };
}

Object.assign(SuperAnki.prototype, {
    noteType(id) { return this.data.noteTypes.find(t => t.id === id); },
    noteTypeName(c) { const t = c.nf && this.noteType(c.nf.t); return t ? `${t.name} · ${(t.templates[c.ord] || t.templates[0]).name}` : 'Type supprimé'; },
    /* does the front of template i show anything for these field values? */
    templateHasFront(nt, i, fields) { return !isBlank(sanitizeHtml(apkgRender(nt.templates[i].front, fields, ''))); },
    createCustomNote({ typeId, deckId, fields, tags, hint = '', detail = '' }) {
        const nt = this.noteType(typeId), now = Date.now(), nid = uid('n'), made = [];
        if (!nt) return null;
        nt.templates.forEach((tpl, i) => {
            if (!this.templateHasFront(nt, i, fields)) return;
            const c = { id: uid('c'), ...freshCard(), deckId, hint, detail, tags: [...tags], created: now + i, nid, kind: 'custom', ord: i, nf: { front: '', back: '', text: '', extra: '', t: typeId, f: { ...fields } }, front: '', back: '' };
            materializeCard(c); this.data.cards.push(c); made.push(c.id);
        });
        return made.length ? made : null;
    },
    /* updates the values of an existing note (all its cards) and adds the cards its templates now allow */
    updateCustomNote(card, { deckId, fields, tags }) {
        const nt = this.noteType(card.nf.t), sibs = this.noteSiblings(card), created = [], now = Date.now();
        sibs.forEach(c => { Object.assign(c, { deckId, tags: [...tags], mod: now }); c.nf = { ...c.nf, f: { ...fields } }; materializeCard(c); });
        if (nt) nt.templates.forEach((tpl, i) => {
            if (sibs.some(c => c.ord === i) || !this.templateHasFront(nt, i, fields)) return;
            const c = { id: uid('c'), ...freshCard(), deckId, hint: card.hint, detail: card.detail, tags: [...tags], created: now + i, nid: card.nid, kind: 'custom', ord: i, nf: { front: '', back: '', text: '', extra: '', t: nt.id, f: { ...fields } }, front: '', back: '' };
            materializeCard(c); this.data.cards.push(c); created.push(c.id);
        });
        return created;
    },
    /* after the type itself changed: rename / drop field values, remap or drop cards of removed templates, add cards for new ones */
    applyNoteTypeEdit(typeId, fieldMap, tplMap) {
        const nt = this.noteType(typeId), now = Date.now();
        const notes = new Map();
        this.data.cards.filter(c => c.kind === 'custom' && c.nf && c.nf.t === typeId).forEach(c => (notes.get(c.nid) || notes.set(c.nid, []).get(c.nid)).push(c));
        const drop = new Set();
        notes.forEach(cards => {
            cards.forEach(c => {
                const nf = {}; nt.fields.forEach((name, i) => { const old = fieldMap[i]; nf[name] = old != null ? (c.nf.f[old] || '') : ''; });
                c.nf = { ...c.nf, f: nf };
                const ni = tplMap.indexOf(c.ord);
                if (ni < 0) drop.add(c.id); else c.ord = ni;
                c.mod = now;
            });
            const fields = cards[0].nf.f;
            cards.filter(c => !drop.has(c.id)).forEach(materializeCard);
            nt.templates.forEach((tpl, i) => {
                if (cards.some(c => !drop.has(c.id) && c.ord === i) || !this.templateHasFront(nt, i, fields)) return;
                const c = { id: uid('c'), ...freshCard(), deckId: cards[0].deckId, hint: '', detail: '', tags: [...cards[0].tags], created: now + i, nid: cards[0].nid, kind: 'custom', ord: i, nf: { front: '', back: '', text: '', extra: '', t: typeId, f: { ...fields } }, front: '', back: '' };
                materializeCard(c); this.data.cards.push(c);
            });
        });
        if (drop.size) this.data.cards = this.data.cards.filter(c => !drop.has(c.id));
        return drop.size;
    },

    /* ---------- note editor (cards of a custom type) ---------- */
    openNoteModal(typeId, cardId, presetDeck, prefill) {
        const nt = this.noteType(typeId);
        if (!nt) { this.toast('Ce type de note n\'existe plus.', 'warning'); return; }
        const card = cardId ? this.card(cardId) : null;
        const deckId = card ? card.deckId : presetDeck || (this.ui.deck !== 'all' && this.ui.deck !== 'errors' ? this.ui.deck : this.lastDeckUsed) || this.sortedDecks()[0].id;
        const m = this.openModal({
            title: card ? `Modifier la note · ${esc(nt.name)}` : `Nouvelle note · ${esc(nt.name)}`, size: 'wide',
            body: `<div class="field two-col"><div><label class="label" for="nm-deck">Paquet</label><select class="select" id="nm-deck">${this.sortedDecks().map(d => `<option value="${esc(d.id)}" ${d.id === deckId ? 'selected' : ''}>${esc(d.emoji)} ${esc(this.deckPath(d.id))}</option>`).join('')}</select></div>
                    <div><label class="label">Type de note</label><div class="input type-static">${esc(nt.name)} · ${plural(nt.templates.length, 'carte')}</div></div></div>
                ${nt.fields.map((f, i) => `<div class="field"><span class="label">${esc(f)}</span>${this.editorHtml(`nm-f${i}`, f, i > 0)}</div>`).join('')}
                <div class="field"><label class="label" for="nm-tags">Tags (séparés par des virgules)</label><input class="input" id="nm-tags" value="${esc(card ? card.tags.join(', ') : '')}"></div>
                <p class="help">Cartes générées : ${nt.templates.map(t => esc(t.name)).join(' · ')}. Une carte n'est créée que si le recto du modèle n'est pas vide.</p>`,
            foot: `${card ? `<button class="btn btn-danger-soft" id="nm-del" style="margin-right:auto">${ic('trash')}Supprimer</button>` : ''}<button class="btn btn-soft hide-mobile" data-close>Annuler</button>${card ? '' : `<button class="btn btn-soft" id="nm-next">${ic('plus')}Enregistrer + nouvelle</button>`}<button class="btn btn-primary" id="nm-save">${ic('check')}Enregistrer</button>`
        });
        m.dataset.cardModal = '1';
        const ed = nt.fields.map((_, i) => $(`#nm-f${i}`, m));
        if (card) nt.fields.forEach((f, i) => { ed[i].innerHTML = (card.nf.f || {})[f] || ''; });
        else if (prefill) ed[0].textContent = prefill;
        const save = keep => {
            const fields = {}; nt.fields.forEach((f, i) => { fields[f] = sanitizeHtml(ed[i].innerHTML); });
            const tags = $('#nm-tags', m).value.split(',').map(t => t.trim()).filter(Boolean), dId = $('#nm-deck', m).value;
            if (!nt.templates.some((_, i) => this.templateHasFront(nt, i, fields))) { this.toast('Remplis au moins le champ affiché au recto.', 'warning'); return; }
            this.lastDeckUsed = dId;
            if (card) {
                this.change('modification de note', this.noteSiblings(card).map(c => c.id), () => this.updateCustomNote(card, { deckId: dId, fields, tags }));
                this.toast('Note modifiée', 'success');
            } else {
                const made = this.change('nouvelle note', [], () => this.createCustomNote({ typeId, deckId: dId, fields, tags }) || []);
                this.toast(made.length > 1 ? `${made.length} cartes créées` : 'Carte créée', 'success');
            }
            if (keep) { ed.forEach(e => { e.innerHTML = ''; }); ed[0].focus(); } else this.closeModal(m);
            if (this.view === 'decks') this.renderDecks(); else if (this.view === 'dashboard') this.renderDashboard();
        };
        m._save = () => save(!card);
        $('#nm-save', m).addEventListener('click', () => save(false));
        const nx = $('#nm-next', m); if (nx) nx.addEventListener('click', () => save(true));
        const del = $('#nm-del', m); if (del) del.addEventListener('click', async () => { if (await this.opDelete([card.id], true)) this.closeModal(m); });
        setTimeout(() => (card ? null : ed[0].focus()), 50);
    },

    /* ---------- note type manager ---------- */
    openNoteTypes() {
        const render = () => {
            const rows = this.data.noteTypes.map(t => {
                const n = new Set(this.data.cards.filter(c => c.kind === 'custom' && c.nf && c.nf.t === t.id).map(c => c.nid)).size;
                return `<div class="set-row"><div class="txt"><b>${esc(t.name)}</b><span>${t.fields.map(esc).join(', ')} · ${plural(t.templates.length, 'carte')} par note · ${plural(n, 'note')}</span></div><div class="row-gap"><button class="btn btn-soft btn-sm" data-nt="edit" data-id="${esc(t.id)}">${ic('pencil')}Modifier</button><button class="btn btn-danger-soft btn-sm" data-nt="del" data-id="${esc(t.id)}">${ic('trash')}</button></div></div>`;
            }).join('');
            $('#nt-list', m).innerHTML = `<div class="set-row"><div class="txt"><b>Types intégrés</b><span>Basique, Basique + inversée, Texte à trous, Image à masquer : non modifiables.</span></div></div>${rows || '<p class="muted small" style="padding:10px 0">Aucun type personnalisé pour l\'instant.</p>'}`;
        };
        const m = this.openModal({ title: 'Types de notes', size: 'wide', body: '<div id="nt-list"></div>', foot: `<button class="btn btn-soft" data-close>Fermer</button><button class="btn btn-primary" id="nt-new">${ic('plus')}Nouveau type</button>` });
        render();
        $('#nt-new', m).addEventListener('click', () => this.openNoteTypeEditor(null, render));
        m.addEventListener('click', async e => {
            const b = e.target.closest('[data-nt]');
            if (!b) return;
            if (b.dataset.nt === 'edit') this.openNoteTypeEditor(b.dataset.id, render);
            else {
                const t = this.noteType(b.dataset.id), ids = this.data.cards.filter(c => c.kind === 'custom' && c.nf && c.nf.t === t.id).map(c => c.id);
                if (!(await this.confirm({ title: `Supprimer « ${esc(t.name)} » ?`, message: ids.length ? `Les ${plural(ids.length, 'carte')} de ce type seront aussi supprimées.` : 'Ce type n\'est utilisé par aucune carte.', ok: 'Supprimer', danger: true }))) return;
                const set = new Set(ids);
                this.change('suppression de type de note', ids, () => { this.data.cards = this.data.cards.filter(c => !set.has(c.id)); this.data.noteTypes = this.data.noteTypes.filter(x => x.id !== t.id); });
                render(); this.render();
            }
        });
    },
    openNoteTypeEditor(id, onDone) {
        const old = id ? this.noteType(id) : null;
        const base = old ? structuredClone(old) : structuredClone(NOTE_TYPE_STARTERS[0]);
        const st = { name: old ? old.name : '', fields: base.fields.map((n, i) => ({ name: n, orig: old ? n : null })), tpls: base.templates.map((t, i) => ({ ...t, orig: old ? i : null })), cur: 0 };
        if (!old) st.name = '';
        const m = this.openModal({
            title: old ? `Modifier « ${esc(old.name)} »` : 'Nouveau type de note', size: 'wide',
            body: `${old ? '' : `<div class="field"><span class="label">Partir de</span><div class="chip-row" id="te-start">${NOTE_TYPE_STARTERS.map((s, i) => `<button type="button" class="chip ${i === 0 ? 'active' : ''}" data-i="${i}">${esc(s.name)}</button>`).join('')}</div></div>`}
                <div class="field"><label class="label" for="te-name">Nom du type</label><input class="input" id="te-name" maxlength="60" value="${esc(st.name)}" placeholder="Ex : Vocabulaire anglais"></div>
                <div class="field"><span class="label">Champs</span><div id="te-fields"></div><button class="btn btn-soft btn-sm" id="te-addf" type="button">${ic('plus')}Ajouter un champ</button></div>
                <div class="field"><span class="label">Modèles de cartes</span><div class="chip-row" id="te-tabs" style="flex-wrap:wrap"></div><div id="te-tpl"></div></div>
                <div class="field"><span class="label">Aperçu</span><div id="te-prev" class="te-prev"></div></div>
                <p class="help">Écris <code>{{NomDuChamp}}</code> pour insérer un champ. Au verso, <code>{{FrontSide}}</code> répète le recto. <code>{{#Champ}}…{{/Champ}}</code> n'affiche le bloc que si le champ est rempli.</p>`,
            foot: `<button class="btn btn-soft" data-close>Annuler</button><button class="btn btn-primary" id="te-save">${ic('check')}Enregistrer</button>`
        });
        const fieldsEl = $('#te-fields', m), tabsEl = $('#te-tabs', m), tplEl = $('#te-tpl', m), prevEl = $('#te-prev', m);
        const drawFields = () => {
            fieldsEl.innerHTML = st.fields.map((f, i) => `<div class="te-row"><input class="input" data-f="${i}" value="${esc(f.name)}" maxlength="40" aria-label="Nom du champ ${i + 1}"><button type="button" class="icon-btn" data-up="${i}" ${i ? '' : 'disabled'} aria-label="Monter">↑</button><button type="button" class="icon-btn" data-down="${i}" ${i < st.fields.length - 1 ? '' : 'disabled'} aria-label="Descendre">↓</button><button type="button" class="icon-btn" data-delf="${i}" ${st.fields.length > 1 ? '' : 'disabled'} aria-label="Supprimer">${ic('x')}</button></div>`).join('');
        };
        const drawTpl = () => {
            const t = st.tpls[st.cur];
            tabsEl.innerHTML = st.tpls.map((x, i) => `<button type="button" class="chip ${i === st.cur ? 'active' : ''}" data-tab="${i}">${esc(x.name)}</button>`).join('') + `<button type="button" class="chip" data-addt="1">${ic('plus', 'inl')} Modèle</button>`;
            tplEl.innerHTML = `<div class="field two-col"><div><label class="label">Nom du modèle</label><input class="input" id="te-tname" value="${esc(t.name)}" maxlength="40"></div><div style="align-self:end">${st.tpls.length > 1 ? `<button type="button" class="btn btn-danger-soft btn-sm" id="te-delt">${ic('trash')}Supprimer ce modèle</button>` : ''}</div></div>
                <div class="field"><label class="label">Recto</label><textarea class="textarea te-code" id="te-front" rows="3">${esc(t.front)}</textarea></div>
                <div class="field"><label class="label">Verso</label><textarea class="textarea te-code" id="te-back" rows="3">${esc(t.back)}</textarea></div>`;
            preview();
        };
        const sample = () => { const f = {}; st.fields.forEach(x => { f[x.name] = `<i>${esc(x.name)}</i>`; }); return f; };
        const preview = () => {
            const t = st.tpls[st.cur], f = sample(), fr = apkgRender(t.front, f, ''), bk = apkgRender(t.back, f, fr).split(ANSWER_SPLIT).pop();
            prevEl.innerHTML = `<div class="te-face"><small>Recto</small><div class="rich">${sanitizeHtml(fr) || '<span class="faint">(vide)</span>'}</div></div><div class="te-face"><small>Verso</small><div class="rich">${sanitizeHtml(bk) || '<span class="faint">(vide)</span>'}</div></div>`;
        };
        drawFields(); drawTpl();
        const start = $('#te-start', m);
        if (start) start.addEventListener('click', e => {
            const b = e.target.closest('[data-i]'); if (!b) return;
            const s = NOTE_TYPE_STARTERS[Number(b.dataset.i)];
            $$('.chip', start).forEach(x => x.classList.toggle('active', x === b));
            st.fields = s.fields.map(n => ({ name: n, orig: null })); st.tpls = s.templates.map(t => ({ ...t, orig: null })); st.cur = 0;
            if (!$('#te-name', m).value.trim()) $('#te-name', m).value = s.name;
            drawFields(); drawTpl();
        });
        fieldsEl.addEventListener('input', e => {
            const i = e.target.dataset.f;
            if (i === undefined) return;
            const prev = st.fields[i].name, next = e.target.value;
            if (prev && next && prev !== next) {
                const rx = new RegExp(`(\\{\\{[#^/]?(?:\\w+:)?)${prev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\}\\})`, 'g');
                st.tpls.forEach(t => { t.front = t.front.replace(rx, `$1${next}$2`); t.back = t.back.replace(rx, `$1${next}$2`); });
                st.fields[i].name = next; drawTpl();
            } else { st.fields[i].name = next; preview(); }
        });
        fieldsEl.addEventListener('click', e => {
            const b = e.target.closest('button'); if (!b) return;
            const d = b.dataset;
            if (d.up !== undefined) { const i = Number(d.up); [st.fields[i - 1], st.fields[i]] = [st.fields[i], st.fields[i - 1]]; }
            else if (d.down !== undefined) { const i = Number(d.down); [st.fields[i + 1], st.fields[i]] = [st.fields[i], st.fields[i + 1]]; }
            else if (d.delf !== undefined) st.fields.splice(Number(d.delf), 1);
            drawFields(); preview();
        });
        $('#te-addf', m).addEventListener('click', () => { st.fields.push({ name: `Champ ${st.fields.length + 1}`, orig: null }); drawFields(); });
        tabsEl.addEventListener('click', e => {
            const b = e.target.closest('button'); if (!b) return;
            if (b.dataset.addt) { st.tpls.push({ name: `Carte ${st.tpls.length + 1}`, front: `{{${st.fields[0].name}}}`, back: '{{FrontSide}}<hr id=answer>', orig: null }); st.cur = st.tpls.length - 1; }
            else st.cur = Number(b.dataset.tab);
            drawTpl();
        });
        tplEl.addEventListener('input', e => {
            const t = st.tpls[st.cur];
            if (e.target.id === 'te-tname') { t.name = e.target.value; const tab = tabsEl.querySelector('.chip.active'); if (tab) tab.textContent = t.name || '…'; }
            else if (e.target.id === 'te-front') t.front = e.target.value; else if (e.target.id === 'te-back') t.back = e.target.value;
            preview();
        });
        tplEl.addEventListener('click', e => { if (e.target.closest('#te-delt')) { st.tpls.splice(st.cur, 1); st.cur = Math.max(0, st.cur - 1); drawTpl(); } });
        $('#te-save', m).addEventListener('click', async () => {
            const name = $('#te-name', m).value.trim(), names = st.fields.map(f => f.name.trim());
            if (!name) { this.toast('Donne un nom au type de note.', 'warning'); return; }
            if (names.some(n => !n || /[{}:#^\/]/.test(n))) { this.toast('Noms de champs invalides (pas de { } : # ^ /).', 'warning'); return; }
            if (new Set(names).size !== names.length) { this.toast('Deux champs ont le même nom.', 'warning'); return; }
            const bad = st.tpls.find(t => !new RegExp(`\\{\\{[^}]*(${names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\}\\}`).test(t.front));
            if (bad) { this.toast(`Le recto du modèle « ${bad.name} » ne contient aucun champ.`, 'warning'); return; }
            const fixed = { name, fields: names, templates: st.tpls.map(t => ({ name: t.name.trim() || 'Carte', front: t.front, back: t.back })) };
            if (old) {
                const dropped = old.templates.filter((_, i) => !st.tpls.some(t => t.orig === i)).length;
                if (dropped && !(await this.confirm({ title: 'Supprimer des modèles ?', message: `Les cartes des ${plural(dropped, 'modèle supprimé', 'modèles supprimés')} seront supprimées.`, ok: 'Continuer', danger: true }))) return;
                const ids = this.data.cards.filter(c => c.kind === 'custom' && c.nf && c.nf.t === id).map(c => c.id);
                this.change('modification de type de note', ids, () => {
                    Object.assign(old, fixed, { mod: Date.now() });
                    const fieldMap = st.fields.map(f => f.orig), tplMap = old.templates.map((_, i) => st.tpls.findIndex(t => t.orig === i));
                    this.applyNoteTypeEdit(id, fieldMap, tplMap);
                });
            } else this.data.noteTypes.push({ id: uid('nt'), ...fixed, mod: Date.now() });
            this.cfgCache.clear(); this.save();
            this.closeModal(m); if (onDone) onDone(); this.render();
            this.toast('Type de note enregistré', 'success');
        });
    }
});
