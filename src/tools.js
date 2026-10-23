/* ============================================================
   Tools: filtered decks (saved searches), duplicates, empty cards, database check, workload simulator.
   ============================================================ */
Object.assign(ICONS, {
    wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 12.6 12.6 21a2.1 2.1 0 0 1-3 0l-6.6-6.6a2.1 2.1 0 0 1 0-3L11.4 3 14.7 6.3z"/>',
    filter: '<path d="M3 4h18l-7 8.5V20l-4-2v-5.5z"/>'
});
const FILTER_TEMPLATES = [
    ['À réviser (toutes matières)', 'is:due'],
    ['Cartes difficiles', 'is:error'],
    ['Nouvelles cartes', 'is:new'],
    ['Oubliées cette semaine', 'rated:7 prop:lapses>=1'],
    ['Un tag', 'tag:toeic is:due']
];

Object.assign(SuperAnki.prototype, {
    queryCards(raw) {
        const q = this.parseQuery(raw || '');
        const ctx = { now: Date.now(), eod: endOfDay(), rated: {} };
        if (q.empty) return [];
        return this.data.cards.filter(c => this.matchCard(c, q, ctx));
    },

    /* ---------- filtered decks (saved searches studied like a deck) ---------- */
    filterCards(f) {
        const now = Date.now();
        let list = this.queryCards(f.query).filter(c => !c.suspended && c.buriedUntil <= now);
        const sorters = { random: null, due: (a, b) => a.due - b.due, hard: (a, b) => b.errors - a.errors || b.lapses - a.lapses || a.ease - b.ease, recent: (a, b) => b.created - a.created };
        list = f.order === 'random' || !sorters[f.order] ? shuffle([...list]) : [...list].sort(sorters[f.order]);
        return list.slice(0, f.limit || 100);
    },
    filtersHtml() {
        const fl = this.data.settings.filters || [];
        if (!fl.length) return `<div><div class="section-head"><h3 class="section-title">Paquets filtrés</h3><button class="link" data-action="filter-edit" data-id="">${ic('plus')}Nouveau</button></div><p class="small muted" style="margin-top:-6px">Un paquet filtré rassemble les cartes qui correspondent à une recherche (un tag, un mot…), même si elles sont dans plusieurs paquets.</p></div>`;
        const eod = endOfDay(), now = Date.now();
        return `<div><div class="section-head"><h3 class="section-title">Paquets filtrés</h3><button class="link" data-action="filter-edit" data-id="">${ic('plus')}Nouveau</button></div>
            <div class="mode-grid filter-grid">${fl.map(f => {
                const cards = this.queryCards(f.query).filter(c => !c.suspended), due = cards.filter(c => cardStatus(c, now, eod) === 'due').length;
                return `<div class="panel mode-tile filter-tile" style="--c:#0ea5e9;cursor:default"><span class="mode-ico">${ic('filter')}</span><span class="grow"><h4>${esc(f.name)}</h4><p>${plural(cards.length, 'carte')} · ${due} à réviser</p></span>
                    <button class="btn btn-primary btn-sm" data-action="filter-start" data-id="${esc(f.id)}" aria-label="Lancer : ${esc(f.name)}" title="Lancer la révision" ${cards.length ? '' : 'disabled'}>${ic('play')}</button>
                    <button class="icon-btn" data-action="filter-edit" data-id="${esc(f.id)}" title="Modifier" aria-label="Modifier">${ic('pencil')}</button></div>`;
            }).join('')}</div></div>`;
    },
    startFilter(id) {
        const f = (this.data.settings.filters || []).find(x => x.id === id);
        if (!f) return;
        const cards = this.filterCards(f);
        if (!cards.length) { this.toast('Aucune carte ne correspond à ce paquet filtré.', 'warning'); return; }
        this.startSrsIds(`Filtré · ${f.name}`, cards.map(c => c.id), f.order !== 'random');
    },
    openFilterModal(id) {
        const list = this.data.settings.filters || [], old = id ? list.find(x => x.id === id) : null;
        const f = old ? { ...old } : { id: uid('f'), name: '', query: 'is:due', limit: 100, order: 'random' };
        const m = this.openModal({
            title: old ? 'Modifier le paquet filtré' : 'Nouveau paquet filtré', size: 'narrow',
            body: `<p class="small muted">Un paquet filtré rassemble automatiquement les cartes qui correspondent à une recherche, sans les déplacer. Réviser dedans compte comme une révision normale.</p>
                <div class="field"><label class="label" for="ff-name">Nom</label><input class="input" id="ff-name" maxlength="60" value="${esc(f.name)}" placeholder="Ex : TOEIC à revoir"></div>
                <div class="field"><label class="label" for="ff-q">Recherche</label><input class="input" id="ff-q" value="${esc(f.query)}" autocomplete="off" placeholder="deck:anglais is:due tag:toeic">
                    <div class="chip-row" style="margin-top:8px;flex-wrap:wrap">${FILTER_TEMPLATES.map(([l, q]) => `<button type="button" class="chip" data-q="${esc(q)}">${esc(l)}</button>`).join('')}</div>
                    <p class="help">Mots-clés : <code>deck:</code> <code>tag:</code> <code>is:due|new|learn|mature|error|marked</code> <code>flag:</code> <code>rated:7</code> <code>prop:ivl&lt;10</code> <code>added:3</code>.</p></div>
                <div class="field two-col"><div><label class="label" for="ff-n">Nombre maximum</label><input class="input" id="ff-n" type="number" min="1" max="9999" value="${f.limit}"></div>
                    <div><label class="label" for="ff-o">Ordre</label><select class="select" id="ff-o">${[['random', 'Aléatoire'], ['due', 'Par échéance'], ['hard', 'Les plus difficiles d\'abord'], ['recent', 'Les plus récentes']].map(([v, l]) => `<option value="${v}" ${f.order === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
                <p class="help" id="ff-count"></p>`,
            foot: `${old ? `<button class="btn btn-danger-soft" id="ff-del" style="margin-right:auto">${ic('trash')}Supprimer</button>` : ''}<button class="btn btn-soft" data-close>Annuler</button><button class="btn btn-primary" id="ff-save">${ic('check')}Enregistrer</button>`
        });
        const count = () => { const k = this.queryCards($('#ff-q', m).value).filter(c => !c.suspended).length; $('#ff-count', m).textContent = `${plural(k, 'carte correspond', 'cartes correspondent')} actuellement.`; };
        $('#ff-q', m).addEventListener('input', count); count();
        m.addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) { $('#ff-q', m).value = b.dataset.q; count(); } });
        const del = $('#ff-del', m);
        if (del) del.addEventListener('click', () => { this.data.settings.filters = list.filter(x => x.id !== id); this.data.settings.settingsMod = Date.now(); this.save(); this.closeModal(m); this.render(); });
        $('#ff-save', m).addEventListener('click', () => {
            const name = $('#ff-name', m).value.trim(), query = $('#ff-q', m).value.trim();
            if (!name) { this.toast('Donne un nom au paquet filtré.', 'warning'); return; }
            if (!query) { this.toast('Écris une recherche.', 'warning'); return; }
            Object.assign(f, { name, query, limit: clamp(Math.round(num($('#ff-n', m).value, 100)), 1, 9999), order: $('#ff-o', m).value });
            this.data.settings.filters = old ? list.map(x => (x.id === id ? f : x)) : [...list, f];
            this.data.settings.settingsMod = Date.now();
            this.save(); this.closeModal(m); this.render();
            this.toast('Paquet filtré enregistré', 'success', ic('filter'));
        });
    },

    /* ---------- duplicates ---------- */
    findDuplicates() {
        const groups = new Map();
        this.data.cards.forEach(c => {
            if (c.kind === 'occl') return;
            const f = c.nf && c.kind === 'cloze' ? c.nf.text : c.front;
            const key = `${c.kind}|${c.ord}|${fold(stripHtml(f)).replace(/\s+/g, ' ').trim()}`;
            if (!key.endsWith('|')) (groups.get(key) || groups.set(key, []).get(key)).push(c);
        });
        const dup = [];
        groups.forEach(list => {
            const byNote = new Set(list.map(c => c.nid || c.id));
            if (byNote.size > 1) dup.push(list);
        });
        return dup;
    },
    openDuplicates() {
        const groups = this.findDuplicates();
        const rank = c => (c.reps || 0) * 1000 + (c.state === 'review' ? c.interval : 0);
        const html = () => {
            const gs = this.findDuplicates();
            return gs.length ? `<p class="muted small">${plural(gs.length, 'groupe de doublons', 'groupes de doublons')}. « Nettoyer » garde la carte la plus avancée de chaque groupe (la plus révisée) et supprime les autres.</p>
                ${gs.slice(0, 80).map((g, i) => `<div class="panel panel-pad" style="margin-top:10px"><b>${esc(truncate(stripHtml(g[0].front), 90))}</b><div class="small muted" style="margin-top:4px">${g.map(c => `${esc(this.deckPath(c.deckId))} (${c.reps} rév.)`).join(' · ')}</div></div>`).join('')}${gs.length > 80 ? `<p class="small muted">… et ${gs.length - 80} autres.</p>` : ''}` : `<p class="muted">Aucun doublon trouvé.</p>`;
        };
        const m = this.openModal({ title: 'Doublons', size: 'wide', body: `<div id="dup-body">${html()}</div>`, foot: `<button class="btn btn-soft" data-close>Fermer</button>${groups.length ? `<button class="btn btn-primary" id="dup-clean">${ic('trash')}Nettoyer</button>` : ''}` });
        const b = $('#dup-clean', m);
        if (b) b.addEventListener('click', () => {
            const kill = new Set();
            this.findDuplicates().forEach(g => { const keep = [...g].sort((a, c) => rank(c) - rank(a))[0]; g.forEach(c => { if (c !== keep && (c.nid ? c.nid !== keep.nid : true)) kill.add(c.id); }); });
            this.change('suppression des doublons', [...kill], () => { this.data.cards = this.data.cards.filter(c => !kill.has(c.id)); });
            this.closeModal(m); this.render();
            this.undoToast(`${plural(kill.size, 'doublon supprimé', 'doublons supprimés')}`, ic('trash'));
        });
    },

    /* ---------- empty cards ---------- */
    findEmptyCards() {
        return this.data.cards.filter(c => {
            if (c.kind === 'cloze' && c.nf) return !clozeNumbers(c.nf.text).includes(c.ord);
            if (c.kind === 'occl' && c.nf) return !occlusionData(c).m[c.ord - 1];
            if (c.kind === 'custom') return isBlank(c.front);
            return isBlank(c.front);
        });
    },
    openEmptyCards() {
        const empty = this.findEmptyCards();
        const m = this.openModal({
            title: 'Cartes vides', size: 'narrow',
            body: empty.length ? `<p class="muted">${plural(empty.length, 'carte vide trouvée', 'cartes vides trouvées')} : un trou de texte qui n'existe plus, un cadre supprimé, ou un recto vide.</p><div class="small muted">${empty.slice(0, 8).map(c => `• ${esc(truncate(stripHtml(c.front) || stripHtml(c.nf ? c.nf.text : '') || '(vide)', 60))}`).join('<br>')}</div>` : '<p class="muted">Aucune carte vide.</p>',
            foot: `<button class="btn btn-soft" data-close>Fermer</button>${empty.length ? `<button class="btn btn-primary" id="ec-del">${ic('trash')}Supprimer</button>` : ''}`
        });
        const b = $('#ec-del', m);
        if (b) b.addEventListener('click', () => {
            const ids = new Set(empty.map(c => c.id));
            this.change('suppression des cartes vides', [...ids], () => { this.data.cards = this.data.cards.filter(c => !ids.has(c.id)); });
            this.closeModal(m); this.render();
            this.undoToast(`${plural(ids.size, 'carte supprimée', 'cartes supprimées')}`, ic('trash'));
        });
    },

    /* ---------- database check ---------- */
    checkDatabase() {
        const d = this.data, fixes = [], deckIds = new Set(d.decks.map(x => x.id));
        const touched = [];
        let misc = d.decks.find(x => x.id === 'misc');
        const orphans = d.cards.filter(c => !deckIds.has(c.deckId));
        if (orphans.length) {
            if (!misc) { misc = { id: 'misc', name: 'Divers', emoji: '🗂️', description: '', created: Date.now(), parent: null, opts: null, mod: 0, preset: null, limits: null }; d.decks.push(misc); }
            orphans.forEach(c => { c.deckId = 'misc'; touched.push(c.id); });
            fixes.push(`${plural(orphans.length, 'carte sans paquet déplacée', 'cartes sans paquet déplacées')} dans « Divers »`);
        }
        let bad = 0;
        d.cards.forEach(c => {
            let hit = false;
            if (!Number.isFinite(c.due)) { c.due = Date.now(); hit = true; }
            if (!Number.isFinite(c.interval) || c.interval < 0) { c.interval = 0; hit = true; }
            if (c.state === 'review' && c.interval < 1) { c.interval = 1; hit = true; }
            if (!Number.isFinite(c.ease) || c.ease < 1.3) { c.ease = 2.5; hit = true; }
            if (hit) { bad++; touched.push(c.id); }
        });
        if (bad) fixes.push(`${plural(bad, 'carte avec des valeurs invalides corrigée', 'cartes avec des valeurs invalides corrigées')}`);
        const ids = new Set(d.cards.map(c => c.id));
        const badLog = d.revlog.filter(r => !ids.has(r[1])).length;
        const mediaBefore = Object.keys(d.media || {}).length;
        const probe = { cards: d.cards, media: { ...(d.media || {}) } };
        this.gcMedia(probe);
        const orphanMedia = mediaBefore - Object.keys(probe.media).length;
        if (orphanMedia) { d.media = probe.media; fixes.push(`${plural(orphanMedia, 'fichier inutilisé supprimé', 'fichiers inutilisés supprimés')}`); }
        const empties = this.findEmptyCards().length, dups = this.findDuplicates().length;
        if (fixes.length) { this.cfgCache.clear(); this.save(); this.render(); }
        const info = [`${plural(d.cards.length, 'carte')} · ${plural(d.decks.length, 'paquet')} · ${plural(d.revlog.length, 'révision enregistrée')}`];
        if (badLog) info.push(`${plural(badLog, 'révision', 'révisions')} d'anciennes cartes supprimées (gardées pour les statistiques)`);
        if (empties) info.push(`${plural(empties, 'carte vide', 'cartes vides')} : utilise « Cartes vides »`);
        if (dups) info.push(`${plural(dups, 'groupe de doublons', 'groupes de doublons')} : utilise « Doublons »`);
        this.openModal({ title: 'Vérification de la base', size: 'narrow', body: `${fixes.length ? `<p><b>Réparé :</b></p><ul>${fixes.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p>✅ Rien à réparer, tout est en ordre.</p>'}<p class="small muted" style="margin-top:10px">${info.map(esc).join('<br>')}</p>`, foot: '<button class="btn btn-primary" data-close>OK</button>' });
    },

    /* ---------- workload simulator ---------- */
    simulateLoad({ days = 60, newPerDay, retention, runs = 6 } = {}) {
        const now = Date.now(), today = startOfDay(now), st = this.data.settings;
        const sum = new Array(days).fill(0), fromNew = new Array(days).fill(0);
        const cards = this.data.cards.filter(c => !c.suspended);
        const news = cards.filter(c => c.state === 'new').length;
        const cfgOf = new Map();
        const cfg = c => cfgOf.get(c.deckId) || cfgOf.set(c.deckId, this.deckCfg(c.deckId)).get(c.deckId);
        for (let run = 0; run < runs; run++) {
            const rnd = toeicRng(`sim${run}`);
            const chain = (day, kind, s, d, ivl, ease, cf, isNew) => {
                let guard = 0;
                while (day < days && guard++ < 80) {
                    sum[day] += 1 / runs; if (isNew) fromNew[day] += 1 / runs;
                    const ret = retention != null && cf.scheduler === 'fsrs' ? retention : cf.scheduler === 'fsrs' ? cf.retention : 0.9;
                    if (rnd() < ret) {
                        if (cf.scheduler === 'fsrs') { s = fsrsRecallS(s, d, ret, 3, cf.fsrsW || undefined); d = fsrsNextD(d, 3, cf.fsrsW || undefined); ivl = Math.max(1, Math.round(fsrsIvl(s, retention != null ? retention : cf.retention) * cf.ivlMult)); }
                        else ivl = Math.max(ivl + 1, Math.round(ivl * ease * cf.ivlMult));
                    } else {
                        if (cf.scheduler === 'fsrs') { s = fsrsForgetS(s, d, ret, cf.fsrsW || undefined); d = fsrsNextD(d, 1, cf.fsrsW || undefined); ivl = Math.max(1, Math.round(fsrsIvl(s, retention != null ? retention : cf.retention))); }
                        else { ease = Math.max(1.3, ease - 0.2); ivl = Math.max(1, Math.round(ivl * cf.lapseMult)); }
                        sum[Math.min(days - 1, day)] += 0;
                    }
                    day += Math.min(ivl, 3650);
                    isNew = false;
                }
            };
            cards.forEach(c => {
                if (c.state === 'new') return;
                const cf = cfg(c), fs = fsrsFromCard(c) || { s: Math.max(1, c.interval), d: 5 };
                const day = c.state === 'review' ? Math.max(0, Math.round((startOfDay(c.due) - today) / DAY)) : 0;
                chain(day, 0, fs.s, fs.d, Math.max(1, c.interval || 1), c.ease || 2.5, cf, false);
            });
            const perDay = newPerDay != null ? newPerDay : st.newPerDay;
            let left = news;
            for (let day = 0; day < days && left > 0; day++) {
                const k = Math.min(perDay, left); left -= k;
                for (let i = 0; i < k; i++) chain(day, 0, fsrsInitS(3), fsrsInitD(3), 1, 2.5, this.defaultCfg(), true);
            }
        }
        return { sum, fromNew, newsLeft: news };
    },
    openLoadSim() {
        const st = this.data.settings, state = { n: Math.min(st.newPerDay, 100), r: 0 };
        const secsPer = (() => { const h = st.studySeconds; const tot = Object.values(this.data.stats.history).reduce((a, b) => a + b, 0); return tot > 50 ? clamp(this.data.stats.studySeconds / tot, 3, 40) : 9; })();
        const m = this.openModal({
            title: 'Simulateur de charge de révision', size: 'wide',
            body: `<p class="small muted">Estime combien de cartes tu auras à réviser chaque jour dans les 60 prochains jours, selon ton planning actuel, en supposant que tu les révises toutes.</p>
                <div class="field two-col"><div><label class="label" for="ls-n">Nouvelles cartes par jour</label><select class="select" id="ls-n">${[0, 5, 10, 20, 30, 50, 100].map(v => `<option value="${v}" ${v === state.n ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
                    <div><label class="label" for="ls-r">Rétention visée (FSRS)</label><select class="select" id="ls-r"><option value="0">Celle de chaque paquet</option>${[80, 85, 90, 95].map(v => `<option value="${v}">${v} %</option>`).join('')}</select></div></div>
                <div id="ls-out"></div>`,
            foot: '<button class="btn btn-primary" data-close>Fermer</button>'
        });
        const draw = () => {
            const n = Number($('#ls-n', m).value), r = Number($('#ls-r', m).value) / 100 || null;
            const sim = this.simulateLoad({ newPerDay: n, retention: r });
            const days = sim.sum.length, max = Math.max(1, ...sim.sum), W = 640, H = 170, bw = (W - 30) / days;
            const avg = sim.sum.slice(0, 30).reduce((a, b) => a + b, 0) / 30, peak = Math.max(...sim.sum), pd = sim.sum.indexOf(peak);
            const bars = sim.sum.map((v, i) => { const h = v / max * (H - 24), hn = sim.fromNew[i] / max * (H - 24); return `<g><title>Jour ${i + 1} : ${Math.round(v)} cartes</title><rect x="${25 + i * bw}" y="${H - 14 - h}" width="${Math.max(1, bw - 1.5)}" height="${h}" fill="var(--primary)" opacity=".85"/><rect x="${25 + i * bw}" y="${H - 14 - hn}" width="${Math.max(1, bw - 1.5)}" height="${hn}" fill="var(--learn)"/></g>`; }).join('');
            $('#ls-out', m).innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="tq-chart" role="img" aria-label="Cartes à réviser par jour">${bars}<text x="2" y="12">${Math.round(max)}</text><text x="25" y="${H - 1}">aujourd'hui</text><text x="${W - 4}" y="${H - 1}" text-anchor="end">dans 60 j</text></svg>
                <div class="kpi-grid" style="margin-top:8px"><div class="panel kpi"><span>Moyenne (30 j)</span><b class="kpi-num">${Math.round(avg)}</b><div class="tiny muted">cartes par jour</div></div>
                <div class="panel kpi"><span>Temps estimé</span><b class="kpi-num">${Math.round(avg * secsPer / 60)}<small> min</small></b><div class="tiny muted">par jour (≈ ${Math.round(secsPer)} s / carte)</div></div>
                <div class="panel kpi"><span>Pic</span><b class="kpi-num">${Math.round(peak)}</b><div class="tiny muted">dans ${pd} j</div></div></div>
                <p class="help"><span style="color:var(--primary)">■</span> révisions &nbsp; <span style="color:var(--learn)">■</span> dont les nouvelles cartes en cours d'apprentissage. Estimation : la réalité dépend de tes réponses.</p>`;
        };
        $('#ls-n', m).addEventListener('change', draw); $('#ls-r', m).addEventListener('change', draw);
        draw();
    },

    toolsPanelHtml() {
        const b = (a, ico, t, d) => `<div class="set-row"><div class="txt"><b>${t}</b><span>${d}</span></div><button class="btn btn-soft btn-sm" data-action="${a}">${ic(ico)}Ouvrir</button></div>`;
        return `<div class="panel panel-pad set-section"><h3>${ic('wrench')} Outils</h3>
            ${b('tool-trash', 'trash', 'Corbeille', 'Retrouve les cartes et paquets supprimés (gardés 30 jours).')}
            ${b('tool-export', 'export', 'Exporter vers Anki (.apkg)', 'Crée un fichier que tu peux importer dans Anki, avec tes médias et ta progression.')}
            ${b('tool-types', 'layers', 'Types de notes', 'Crée tes propres modèles de cartes avec les champs de ton choix (comme Anki).')}
            ${b('tool-filter', 'filter', 'Paquet filtré', 'Crée un paquet qui rassemble les cartes d\'une recherche (ex. « à réviser » + tag).')}
            ${b('tool-sim', 'chart', 'Simulateur de charge', 'Prévois combien de cartes tu auras par jour dans les 60 prochains jours.')}
            ${b('tool-dups', 'copy', 'Doublons', 'Trouve les cartes identiques et garde la plus avancée.')}
            ${b('tool-empty', 'eraser', 'Cartes vides', 'Supprime les trous ou cadres qui n\'existent plus.')}
            ${b('tool-check', 'check2', 'Vérifier la base', 'Contrôle et répare les données (cartes orphelines, valeurs invalides, fichiers inutilisés).')}
        </div>`;
    }
});
