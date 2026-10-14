/* ============================================================
   FSRS parameter optimizer: fits the 19 parameters to the user's own review history
   (minimizes the log-loss of the predicted recall, Adam + numerical gradient, with a mild pull
   towards the default values and a held-out check so a worse result is never applied).
   ============================================================ */
const FSRS_BOUNDS = [[0.001, 100], [0.001, 100], [0.001, 100], [0.001, 100], [1, 10], [0.001, 4], [0.001, 4], [0.001, 0.75], [0, 4.5], [0, 0.8], [0.001, 3.5], [0.001, 5], [0.001, 0.25], [0.001, 0.9], [0, 4], [0, 1], [1, 6], [0, 2], [0, 2]];
const FSRS_MIN_REVIEWS = 150, FSRS_GOOD_REVIEWS = 1000;

/* review log -> one sequence per card: times and grades of learning / review / relearning answers */
function fsrsSequences(revlog) {
    const by = new Map();
    revlog.forEach(r => {
        if (!(r[3] <= 2) || !(r[2] >= 1 && r[2] <= 4)) return;
        (by.get(r[1]) || by.set(r[1], []).get(r[1])).push([r[0], r[2]]);
    });
    return [...by.entries()].map(([id, list]) => ({ id, rows: list.sort((a, b) => a[0] - b[0]) })).filter(s => s.rows.length >= 2);
}
/* mean log-loss over the reviews that happened at least one day after the previous one */
function fsrsLoss(seqs, w) {
    let sum = 0, n = 0;
    for (const { rows } of seqs) {
        let g = rows[0][1], s = fsrsInitS(g, w), d = fsrsInitD(g, w);
        for (let i = 1; i < rows.length; i++) {
            g = rows[i][1];
            const dt = (rows[i][0] - rows[i - 1][0]) / DAY;
            if (dt < 1) { s = fsrsShortS(s, g, w); d = fsrsNextD(d, g, w); continue; }
            const r = clamp(fsrsR(dt, s), 0.0001, 0.9999);
            sum -= g > 1 ? Math.log(r) : Math.log(1 - r);
            n++;
            s = g === 1 ? fsrsForgetS(s, d, r, w) : fsrsRecallS(s, d, r, g, w);
            d = fsrsNextD(d, g, w);
        }
    }
    return { sum, n };
}
const fsrsScored = seqs => fsrsLoss(seqs, FSRS_W0).n;
/* replays one card's history with parameters w: final stability / difficulty */
function fsrsReplay(rows, w) {
    if (!rows || !rows.length) return null;
    let g = rows[0][1], s = fsrsInitS(g, w), d = fsrsInitD(g, w);
    for (let i = 1; i < rows.length; i++) {
        g = rows[i][1];
        const dt = (rows[i][0] - rows[i - 1][0]) / DAY;
        if (dt < 1) { s = fsrsShortS(s, g, w); d = fsrsNextD(d, g, w); continue; }
        const r = clamp(fsrsR(dt, s), 0.0001, 0.9999);
        s = g === 1 ? fsrsForgetS(s, d, r, w) : fsrsRecallS(s, d, r, g, w);
        d = fsrsNextD(d, g, w);
    }
    return { s, d };
}

async function fsrsTrain(seqs, onProgress) {
    const split = seqs.filter(s => toeicHash(String(s.id)) % 5 !== 0), test = seqs.filter(s => toeicHash(String(s.id)) % 5 === 0);
    const val = fsrsScored(test) >= 60 ? test : split;
    const N = Math.max(1, fsrsScored(split));
    const w0 = FSRS_W0.slice(), eff = FSRS_BOUNDS.map(([lo, hi]) => Math.min(hi - lo, 5));
    const total = w => { const l = fsrsLoss(split, w); let reg = 0; w.forEach((v, i) => { const z = (v - w0[i]) / eff[i]; reg += z * z; }); return l.sum / Math.max(1, l.n) + (5 / N) * reg; };
    const clampW = w => w.map((v, i) => clamp(v, FSRS_BOUNDS[i][0], FSRS_BOUNDS[i][1]));
    let w = w0.slice(), m = new Array(19).fill(0), v = new Array(19).fill(0);
    const EPOCHS = 120, lr = 0.03, b1 = 0.9, b2 = 0.999;
    for (let e = 1; e <= EPOCHS; e++) {
        const grad = w.map((_, i) => {
            const h = 0.01 * eff[i], a = w.slice(), b = w.slice();
            a[i] = Math.min(FSRS_BOUNDS[i][1], w[i] + h); b[i] = Math.max(FSRS_BOUNDS[i][0], w[i] - h);
            return (total(a) - total(b)) / Math.max(1e-9, a[i] - b[i]);
        });
        w = clampW(w.map((x, i) => {
            m[i] = b1 * m[i] + (1 - b1) * grad[i]; v[i] = b2 * v[i] + (1 - b2) * grad[i] * grad[i];
            return x - lr * eff[i] * (m[i] / (1 - Math.pow(b1, e))) / (Math.sqrt(v[i] / (1 - Math.pow(b2, e))) + 1e-8);
        }));
        if (e % 4 === 0) { if (onProgress) onProgress(e / EPOCHS); await new Promise(r => setTimeout(r, 0)); }
    }
    const L0 = fsrsLoss(val, FSRS_W0), L1 = fsrsLoss(val, w);
    return { w: w.map(x => Math.round(x * 10000) / 10000), before: L0.sum / Math.max(1, L0.n), after: L1.sum / Math.max(1, L1.n), nVal: L0.n, nTrain: N };
}

Object.assign(SuperAnki.prototype, {
    /* one entry per preset in use ("default" included): its cards, review history, current parameters */
    fsrsTargets() {
        const all = fsrsSequences(this.data.revlog), names = [{ id: '', name: 'Préréglage par défaut' }, ...this.data.presets];
        return names.map(t => {
            const ids = new Set(this.data.cards.filter(c => this.presetIdFor(c.deckId) === t.id).map(c => c.id));
            const p = t.id ? this.data.presets.find(x => x.id === t.id) : null, seqs = all.filter(x => ids.has(x.id));
            return { ...t, ids, seqs, n: fsrsScored(seqs), w: p ? p.opts.fsrsW : this.data.settings.fsrsW, meta: p ? p.opts.fsrsMeta : this.data.settings.fsrsMeta };
        }).filter((t, i) => i === 0 || t.ids.size > 0);
    },
    fsrsPanelHtml() {
        const rows = this.fsrsTargets().map(t => {
            const own = Array.isArray(t.w);
            const hint = t.n < FSRS_MIN_REVIEWS ? `${t.n} révisions utilisables (il en faut ${FSRS_MIN_REVIEWS} au moins, idéalement ${FSRS_GOOD_REVIEWS}).` : t.n < FSRS_GOOD_REVIEWS ? `${plural(t.n, 'révision utilisable')} : possible, mais plus fiable avec ${FSRS_GOOD_REVIEWS}.` : `${plural(t.n, 'révision utilisable')} : assez pour un bon résultat.`;
            const state = own ? `Optimisé le ${new Date(t.meta ? t.meta.at : Date.now()).toLocaleDateString('fr-FR')}${t.meta ? ` sur ${plural(t.meta.n, 'révision')}` : ''}.` : 'Paramètres standards.';
            return `<div class="set-row"><div class="txt"><b>${esc(t.name)}</b><span>${esc(hint)} ${esc(state)}</span></div><div class="row-gap">
                <button class="btn btn-primary btn-sm" data-action="fsrs-optimize" data-id="${esc(t.id)}" ${t.n < FSRS_MIN_REVIEWS ? 'disabled' : ''}>${ic('sparkle')}Optimiser</button>
                ${own ? `<button class="btn btn-soft btn-sm" data-action="fsrs-reset" data-id="${esc(t.id)}" title="Revenir aux paramètres standards">${ic('reset')}</button>` : ''}</div></div>`;
        }).join('');
        return `<div class="panel panel-pad set-section" id="fsrs-panel">
            <h3>${ic('brain')} Mémoire (FSRS)</h3>
            <p class="small muted" style="margin-bottom:8px">Ajuste les 19 paramètres de FSRS sur ton propre historique, préréglage par préréglage. Ne concerne que les paquets en FSRS.</p>
            ${rows}
            <p class="tiny faint">Les modes Quiz, Écrire et Chrono ne comptent pas dans cet historique.</p>
        </div>`;
    },
    fsrsOptimizeModal(id = '') {
        const t = this.fsrsTargets().find(x => x.id === id);
        if (!t) return;
        if (t.n < FSRS_MIN_REVIEWS) { this.toast(`Il faut au moins ${FSRS_MIN_REVIEWS} révisions (tu en as ${t.n}).`, 'warning'); return; }
        const m = this.openModal({ title: `Optimisation FSRS · ${esc(t.name)}`, size: 'narrow', body: `<p class="muted" id="fo-msg">Calcul en cours sur ${plural(t.n, 'révision')}...</p><div class="progress"><i id="fo-bar" style="width:3%;background:var(--primary)"></i></div><div id="fo-res"></div>`, foot: `<button class="btn btn-soft" data-close>Fermer</button>` });
        let closed = false;
        m._onClose = () => { closed = true; };
        fsrsTrain(t.seqs, p => { const b = $('#fo-bar', m); if (b) b.style.width = `${Math.round(p * 100)}%`; }).then(r => {
            if (closed) return;
            const gain = (r.before - r.after) / r.before * 100, better = r.after < r.before - 0.0005;
            $('#fo-msg', m).textContent = '';
            $('#fo-bar', m).style.width = '100%';
            $('#fo-res', m).innerHTML = `<p style="margin-top:12px">Erreur de prédiction (plus bas = mieux), mesurée sur ${plural(r.nVal, 'révision')} mises de côté :</p>
                <div class="fo-cmp"><div><span>Standard</span><b>${r.before.toFixed(3)}</b></div><div><span>Optimisé</span><b>${r.after.toFixed(3)}</b></div></div>
                <p class="${better ? '' : 'muted'}" style="margin-top:10px">${better ? `Amélioration d'environ <b>${gain.toFixed(1)} %</b>. Les nouveaux paramètres prédisent mieux quand tu oublies.` : 'Pas d\'amélioration nette : je te conseille de garder les paramètres standards (réessaie avec plus de révisions).'}</p>
                ${better ? `<label class="check" style="margin-top:10px"><input type="checkbox" id="fo-resched"> Replanifier aussi les cartes déjà apprises avec ces paramètres <span class="small muted">(sinon, seules les prochaines révisions changent)</span></label>` : ''}`;
            const foot = m.querySelector('.modal-foot');
            if (better) {
                foot.insertAdjacentHTML('beforeend', `<button class="btn btn-primary" id="fo-apply">${ic('check')}Appliquer</button>`);
                $('#fo-apply', m).addEventListener('click', () => {
                    const meta = { at: Date.now(), n: t.n, before: r.before, after: r.after }, resched = $('#fo-resched', m).checked;
                    if (id) { const p = this.data.presets.find(x => x.id === id); p.opts = { ...p.opts, fsrsW: r.w, fsrsMeta: meta }; }
                    else { this.data.settings.fsrsW = r.w; this.data.settings.fsrsMeta = meta; this.data.settings.settingsMod = Date.now(); fsrsApplyParams(r.w); }
                    this.cfgCache.clear();
                    const n = this.fsrsRecompute(t, r.w, resched);
                    this.save();
                    this.closeModal(m); this.renderSettings();
                    this.toast(`Paramètres FSRS appliqués · mémoire recalculée pour ${plural(n, 'carte')}${resched ? ' et replanifiées' : ''}`, 'success', ic('brain'));
                });
            }
        }).catch(e => { console.error(e); if (!closed) $('#fo-msg', m).textContent = 'L\'optimisation a échoué.'; });
    },
    /* new memory state (stability, difficulty) of each FSRS card of the target, replayed from its history */
    fsrsRecompute(t, w, reschedule) {
        const rowsBy = new Map(t.seqs.map(s => [s.id, s.rows]));
        const ids = [...t.ids].filter(id => rowsBy.has(id));
        let n = 0;
        this.change('optimisation FSRS', ids, () => {
            ids.forEach(id => {
                const c = this.card(id), rows = rowsBy.get(id);
                if (!c || c.state === 'new') return;
                const cfg = this.deckCfg(c.deckId);
                if (cfg.scheduler !== 'fsrs') return;
                const st = fsrsReplay(rows, w), last = rows[rows.length - 1][0];
                if (!st) return;
                c.fs = { s: st.s, d: st.d, t: last }; n++;
                if (reschedule && c.state === 'review') {
                    c.interval = clamp(Math.round(fsrsIvl(st.s, cfg.retention) * cfg.ivlMult), 1, cfg.maxIvl);
                    c.due = addDays(c.lastReview || last, c.interval);
                }
            });
        });
        return n;
    },
    fsrsReset(id = '') {
        if (id) { const p = this.data.presets.find(x => x.id === id); if (p) { const o = { ...p.opts }; delete o.fsrsW; delete o.fsrsMeta; p.opts = o; } }
        else { this.data.settings.fsrsW = null; this.data.settings.fsrsMeta = null; this.data.settings.settingsMod = Date.now(); fsrsApplyParams(null); }
        this.cfgCache.clear(); this.save(); this.renderSettings();
        this.toast('Paramètres standards rétablis', 'success');
    }
});
