/* ============================================================
   Statistics, modelled on Anki's stats screen.
   Charts are plain SVG drawn at the real container width,
   with hover / tap tooltips and clickable legends.
   Review log entry: [time, cardId, grade, type, ivl, lastIvl, ms]
   type: 0 learning, 1 review, 2 relearning, 3 practice (quiz, chrono...)
   ============================================================ */
const YOUNG_COLOR = 'color-mix(in srgb, var(--mature) 45%, var(--surface))';
const PRACTICE_COLOR = '#8b5cf6';
const fmtNum = n => (Math.round(n * 10) / 10).toLocaleString('fr-FR');
const pctStr = (a, b) => (b ? `${fmtNum(a / b * 100)} %` : 'N/A');
const shortDate = t => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '');
/* Axis max = 4 "round" steps, so tick labels stay whole numbers for counts */
function niceMax(v, minMax = 0) {
    v = Math.max(v, minMax);
    if (v <= 0) return 1;
    const raw = v / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p;
    const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 && p >= 10 ? 2.5 : n <= 5 ? 5 : 10) * p;
    return step * 4;
}
function median(arr) {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b), m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function tipRows(title, rows, foot) {
    return `<b>${title}</b>${rows.map(r => `<div class="tip-row"><span class="sw" style="background:${r.color}"></span>${r.label}<em>${r.value}</em></div>`).join('')}${foot ? `<div class="tip-foot">${foot}</div>` : ''}`;
}
function revKind(r) {
    const t = r[3];
    if (t === 0) return 'learn';
    if (t === 2) return 'relearn';
    if (t === 3) return 'cram';
    return (r[5] || 0) >= MATURE_IVL ? 'mature' : 'young';
}

/* Generic stacked bar chart with optional secondary line */
function barsSVG(W, o) {
    const H = o.height || 230, padT = 14, padB = 28, padL = 42, padR = o.line ? 46 : 12;
    const pw = Math.max(40, W - padL - padR), ph = H - padT - padB;
    const hidden = o.hidden || new Set();
    const vis = o.series.filter(s => !hidden.has(s.key));
    const totals = Array.from({ length: o.n }, (_, i) => vis.reduce((a, s) => a + (s.values[i] || 0), 0));
    const yMax = niceMax(Math.max(0, ...totals), o.minMax ?? 4);
    const yFmt = o.yFmt || fmtNum;
    const bw = pw / o.n, gap = bw > 8 ? Math.min(bw * 0.22, 8) : bw > 3 ? 1 : 0, w = Math.max(0.8, bw - gap);
    let g = '';
    for (let k = 0; k <= 4; k++) {
        const v = yMax * k / 4, y = (padT + ph - (v / yMax) * ph).toFixed(1);
        g += `<line class="grid" x1="${padL}" x2="${padL + pw}" y1="${y}" y2="${y}"/><text x="${padL - 7}" y="${(+y + 3.5).toFixed(1)}" text-anchor="end">${yFmt(v)}</text>`;
    }
    for (let i = 0; i < o.n; i++) {
        let y = padT + ph;
        const x = padL + i * bw + gap / 2;
        vis.forEach(s => {
            const v = s.values[i] || 0;
            if (v <= 0) return;
            const h = Math.max(1, v / yMax * ph);
            y -= h;
            g += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" ${w > 6 ? 'rx="2"' : ''} style="fill:${s.colorAt ? s.colorAt(i) : s.color}"/>`;
        });
    }
    if (o.line && o.line.values.some(v => v !== null && v !== undefined)) {
        const L = o.line, lMax = L.max ?? niceMax(Math.max(1, ...L.values.filter(v => v !== null && v !== undefined)), 1);
        let d = '', started = false;
        L.values.forEach((v, i) => {
            if (v === null || v === undefined) { started = false; return; }
            const x = padL + i * bw + bw / 2, y = padT + ph - (v / lMax) * ph;
            d += `${started ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)} `;
            started = true;
        });
        g += `<path d="${d}" fill="none" style="stroke:${L.color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>`;
        for (let k = 0; k <= 4; k++) {
            const v = lMax * k / 4, y = padT + ph - (v / lMax) * ph;
            g += `<text x="${padL + pw + 7}" y="${(y + 3.5).toFixed(1)}" text-anchor="start" style="fill:${L.color}">${(L.fmt || fmtNum)(v)}</text>`;
        }
    }
    const maxLabels = Math.max(2, Math.floor(pw / (o.labelWidth || 52)));
    const step = Math.max(1, Math.ceil(o.n / maxLabels));
    for (let i = 0; i < o.n; i++) {
        const lab = o.xLabel(i, step);
        if (lab === null || lab === undefined || (i % step && !o.allLabels)) continue;
        g += `<text x="${(padL + i * bw + bw / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle">${esc(lab)}</text>`;
    }
    g += `<line class="axis" x1="${padL}" x2="${padL + pw}" y1="${padT + ph + .5}" y2="${padT + ph + .5}"/>`;
    for (let i = 0; i < o.n; i++) {
        const tip = o.tooltip ? o.tooltip(i) : '';
        if (tip) g += `<rect class="hit" x="${(padL + i * bw).toFixed(2)}" y="${padT}" width="${bw.toFixed(2)}" height="${ph}" data-tip="${esc(tip)}"/>`;
    }
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">${g}</svg>`;
}
function donutSVGi(size, segs, centerTop, centerSub) {
    const total = segs.reduce((a, s) => a + s.value, 0), c = size / 2, R = size / 2 - 14, r = R - 26;
    let a0 = -Math.PI / 2, g = '';
    if (!total) g = `<circle cx="${c}" cy="${c}" r="${(R + r) / 2}" fill="none" stroke-width="${R - r}" style="stroke:var(--surface-3)"/>`;
    segs.forEach(s => {
        if (!s.value) return;
        const frac = s.value / total, a1 = a0 + frac * Math.PI * 2;
        const tip = esc(tipRows(s.label, [{ label: 'Cartes', value: s.value, color: s.color }], `${fmtNum(frac * 100)} % du total`));
        if (frac >= 0.9999) {
            g += `<circle class="slice" cx="${c}" cy="${c}" r="${(R + r) / 2}" fill="none" stroke-width="${R - r}" style="stroke:${s.color}" data-tip="${tip}"/>`;
        } else {
            const large = frac > 0.5 ? 1 : 0;
            const p = (ang, rad) => `${(c + rad * Math.cos(ang)).toFixed(2)} ${(c + rad * Math.sin(ang)).toFixed(2)}`;
            g += `<path class="slice" d="M${p(a0, R)} A${R} ${R} 0 ${large} 1 ${p(a1, R)} L${p(a1, r)} A${r} ${r} 0 ${large} 0 ${p(a0, r)}Z" style="fill:${s.color}" data-tip="${tip}"/>`;
        }
        a0 = a1;
    });
    g += `<text x="${c}" y="${c - 2}" text-anchor="middle" class="donut-num">${centerTop}</text><text x="${c}" y="${c + 16}" text-anchor="middle">${centerSub}</text>`;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${g}</svg>`;
}

Object.assign(SuperAnki.prototype, {
    statsScope() {
        const d = this.statsUi.deck;
        if (d !== 'all' && !this.deck(d)) this.statsUi.deck = 'all';
        if (this.statsUi.deck === 'all') return { cards: this.data.cards, revlog: this.data.revlog, all: true };
        const cards = this.cardsOf(d), ids = new Set(cards.map(c => c.id));
        return { cards, revlog: this.data.revlog.filter(r => ids.has(r[1])), all: false };
    },
    statSeg(key, options) {
        const cur = this.statsUi[key];
        return `<div class="segmented seg-sm">${options.map(([v, l]) => `<button class="${String(cur) === String(v) ? 'active' : ''}" data-action="stats-opt" data-key="${key}" data-value="${v}">${l}</button>`).join('')}</div>`;
    },
    legend(chartId, series) {
        const hidden = this.statsUi.hidden[chartId] || new Set();
        return `<div class="chart-legend">${series.map(s => `<button class="${hidden.has(s.key) ? 'off' : ''}" data-action="chart-toggle" data-chart="${chartId}" data-key="${s.key}" title="Afficher / masquer"><span class="sw" style="background:${s.color}"></span>${s.label}</button>`).join('')}</div>`;
    },
    chartBox(id, extraClass = '') { return `<div class="chart ${extraClass}" data-chart-box="${id}"></div>`; },

    renderStats() {
        const st = this.data.stats, ui = this.statsUi, today = dayKey();
        const scope = this.statsScope();
        this.chartDefs = {};
        const errCount = this.errorCards().length;
        const dstats = this.deckStats();
        const deckRows = this.sortedDecks().map(dk => { const c = dstats.get(dk.id); return { dk, c, n: c.total, pct: this.pctMature(c), seen: this.pctSeen(c), depth: this.deckDepth(dk.id) }; });

        const sections = [
            this.statToday(scope),
            this.statForecast(scope),
            this.statCalendar(scope),
            this.statReviews(scope),
            this.statCounts(scope),
            this.statIntervals(scope),
            this.statEase(scope),
            this.statRetention(scope),
            this.statHourly(scope),
            this.statButtons(scope),
            this.statAdded(scope)
        ];
        $('#view-stats').innerHTML = `
        <div class="stack">
            <div class="stats-head">
                <div><h2 class="page-title">Statistiques</h2><p class="page-sub">Les mêmes analyses qu'Anki, en interactif : survole ou touche un graphique.</p></div>
                <label class="stats-scope"><span class="sr-only">Paquet</span>
                    <select class="select" data-input="stats-deck">
                        <option value="all" ${ui.deck === 'all' ? 'selected' : ''}>📂 Collection (tous les paquets)</option>
                        ${this.sortedDecks().map(d => `<option value="${esc(d.id)}" ${ui.deck === d.id ? 'selected' : ''}>${esc(d.emoji)} ${esc(this.deckPath(d.id))}</option>`).join('')}
                    </select>
                </label>
            </div>
            <div class="kpi-grid">
                <div class="panel kpi"><span>Série actuelle</span><b>🔥 ${st.streak} j</b><em>${ic('snow')} ${plural(st.freezes, 'gel')} de série</em></div>
                <div class="panel kpi"><span>Record de série</span><b>${st.longestStreak} j</b><em>${plural(Object.keys(st.history).filter(k => st.history[k] > 0).length, 'jour actif', 'jours actifs')}</em></div>
                <div class="panel kpi"><span>Aujourd'hui</span><b>${st.history[today] || 0}</b><em>${fmtDuration(st.timeByDay[today] || 0)} d'étude</em></div>
                <div class="panel kpi"><span>Temps total</span><b>${fmtDuration(st.studySeconds)}</b><em>${plural(Object.values(st.history).reduce((a, b) => a + b, 0), 'révision')}</em></div>
            </div>
            <div class="stats-grid">${sections.join('')}</div>
            <div class="panel panel-pad">
                <div class="section-head" style="margin-bottom:6px">
                    <h4 class="stat-title">${ic('target')} Mes erreurs</h4>
                    ${errCount ? `<button class="btn btn-primary btn-sm" data-action="practice-errors">${ic('play')}Retravailler (${errCount})</button>` : ''}
                </div>
                <p class="small muted">${errCount ? `${plural(errCount, 'carte')} ratée${errCount > 1 ? 's' : ''} récemment. Elles sortent de la liste dès que tu les réussis.` : 'Aucune erreur en attente. Les cartes ratées en révision, en quiz ou au chrono apparaîtront ici.'}</p>
            </div>
            <div class="panel panel-pad">
                <h4 class="stat-title" style="margin-bottom:8px">Maîtrise par paquet</h4>
                ${deckRows.map(r => `
                <button class="deck-progress-row" data-action="stats-deck" data-deck="${esc(r.dk.id)}" data-tip="${esc(tipRows(`${esc(r.dk.emoji)} ${esc(this.deckPath(r.dk.id))}`, ['new', 'learn', 'due', 'mature'].map(k => ({ label: STATUS[k].label, value: r.c[k], color: STATUS[k].color }))))}">
                    <span class="nm" style="padding-left:${r.depth * 18}px">${r.depth ? '<span class="faint">└</span> ' : ''}${esc(r.dk.emoji)} ${esc(r.dk.name)}</span>
                    <div class="progress"><i style="width:${r.n ? r.c.mature / r.n * 100 : 0}%;background:var(--mature)"></i><i style="width:${r.n ? r.c.learn / r.n * 100 : 0}%;background:var(--learn)"></i><i style="width:${r.n ? r.c.due / r.n * 100 : 0}%;background:var(--due)"></i></div>
                    <b title="${r.seen} % vu · ${r.pct} % maîtrisé">${r.pct}%</b>
                </button>`).join('') || '<p class="small muted">Aucun paquet.</p>'}
            </div>
        </div>`;
        this.drawCharts();
    },
    drawCharts(onlyId) {
        $$('[data-chart-box]').forEach(box => {
            const id = box.dataset.chartBox, def = this.chartDefs && this.chartDefs[id];
            if (!def || (onlyId && id !== onlyId)) return;
            const W = Math.max(260, Math.floor(box.clientWidth));
            box.innerHTML = def(W);
        });
    },

    /* ---------- Aujourd'hui ---------- */
    statToday({ revlog }) {
        const t0 = startOfDay();
        const today = revlog.filter(r => r[0] >= t0);
        let body;
        if (!today.length) body = `<p class="muted">Aucune carte étudiée aujourd'hui.</p>`;
        else {
            const secs = today.reduce((a, r) => a + (r[6] || 0), 0) / 1000;
            const graded = today.filter(r => r[2]);
            const again = graded.filter(r => r[2] === 1).length;
            const k = { learn: 0, young: 0, mature: 0, relearn: 0, cram: 0 };
            today.forEach(r => { k[revKind(r)]++; });
            const mat = today.filter(r => r[3] === 1 && (r[5] || 0) >= MATURE_IVL);
            const matOk = mat.filter(r => r[2] >= 2).length;
            body = `<p>Étudié <b>${plural(today.length, 'carte')}</b> en <b>${fmtDuration(secs)}</b> aujourd'hui (${fmtNum(secs / today.length)} s/carte).</p>
                <p>Nombre de « Raté » : <b>${again}</b> (${pctStr(graded.length - again, graded.length)} de réponses correctes).</p>
                <p>Apprentissage : <b>${k.learn}</b> · Révision : <b>${k.young + k.mature}</b> · Réapprentissage : <b>${k.relearn}</b> · Entraînement : <b>${k.cram}</b></p>
                ${mat.length ? `<p>Cartes matures : <b>${matOk}/${mat.length}</b> réussies (${pctStr(matOk, mat.length)}).</p>` : ''}`;
        }
        return `<section class="panel panel-pad stat-card"><h4 class="stat-title">Aujourd'hui</h4><div class="stat-text">${body}</div></section>`;
    },

    /* ---------- Charge de travail (prévisions) ---------- */
    statForecast({ cards }) {
        const ui = this.statsUi, today = dayKey(), todayStart = startOfDay();
        const items = cards.filter(c => c.state !== 'new' && !c.suspended).map(c => {
            const idx = Math.max(0, daysBetweenKeys(today, dayKey(c.due)));
            const key = c.state === 'review' ? (c.interval >= MATURE_IVL ? 'mature' : 'young') : 'learn';
            return { idx, key, overdue: c.due < todayStart, ivl: c.interval, review: c.state === 'review' };
        });
        const maxIdx = items.reduce((a, x) => Math.max(a, x.idx), 0);
        const days = ui.fcRange === 'all' ? Math.max(31, maxIdx + 1) : Number(ui.fcRange);
        const inRange = items.filter(x => x.idx < days);
        const total = inRange.length, tomorrow = items.filter(x => x.idx === 1).length, overdue = items.filter(x => x.overdue).length;
        const load = Math.round(items.filter(x => x.review).reduce((a, x) => a + 1 / Math.max(1, x.ivl), 0));
        const series = [
            { key: 'learn', label: 'En apprentissage', color: 'var(--learn)' },
            { key: 'young', label: 'Récentes', color: YOUNG_COLOR },
            { key: 'mature', label: 'Matures', color: 'var(--mature)' }
        ];
        this.chartDefs.forecast = W => {
            const k = Math.max(1, Math.ceil(days / Math.floor((W - 90) / 5)));
            const n = Math.ceil(days / k);
            const hidden = ui.hidden.forecast || new Set();
            const ser = series.map(s => ({ ...s, values: new Array(n).fill(0) }));
            inRange.forEach(x => { ser.find(s => s.key === x.key).values[Math.floor(x.idx / k)]++; });
            let run = 0;
            const cumul = ui.fcCumul ? Array.from({ length: n }, (_, i) => (run += ser.filter(s => !hidden.has(s.key)).reduce((a, s) => a + s.values[i], 0))) : null;
            const dayT = i => addDays(Date.now(), i * k);
            return barsSVG(W, {
                n, series: ser, hidden, minMax: 4,
                line: cumul ? { values: cumul, color: 'var(--text-faint)', label: 'Cumul' } : null,
                xLabel: i => (i === 0 ? 'Auj.' : k === 1 && days <= 31 ? shortDate(dayT(i)) : `+${i * k} j`),
                tooltip: i => {
                    const title = k === 1 ? (i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain' : longDate(dayT(i))) : `Du ${shortDate(dayT(i))} au ${shortDate(dayT(i + 1) - DAY)}`;
                    const tot = ser.reduce((a, s) => a + s.values[i], 0);
                    return tipRows(title, ser.map(s => ({ label: s.label, value: s.values[i], color: s.color })), `Total : ${tot}${cumul ? ` · cumul : ${cumul[i]}` : ''}${i === 0 && overdue ? ` · dont ${overdue} en retard` : ''}`);
                }
            });
        };
        return `<section class="panel panel-pad stat-card wide">
            <div class="stat-head"><div><h4 class="stat-title">Charge de travail</h4><p class="stat-sub">Nombre de cartes à réviser selon leur jour d'échéance et leur statut.</p></div>
            <div class="stat-opts"><label class="check"><input type="checkbox" data-input="stats-check" data-key="fcCumul" ${ui.fcCumul ? 'checked' : ''}> cumul</label>${this.statSeg('fcRange', [[31, '1 mois'], [90, '3 mois'], [365, '1 an'], ['all', 'Tout']])}</div></div>
            ${this.chartBox('forecast')}${this.legend('forecast', series)}
            <dl class="stat-facts"><dt>Total</dt><dd>${plural(total, 'révision')}</dd><dt>Moyenne</dt><dd>${fmtNum(total / days)} révision/jour</dd><dt>Prévues pour demain</dt><dd>${plural(tomorrow, 'révision')}</dd><dt>Charge journalière</dt><dd>${load} révision/jour</dd>${overdue ? `<dt>En retard</dt><dd>${plural(overdue, 'carte')}</dd>` : ''}</dl>
        </section>`;
    },

    /* ---------- Calendrier ---------- */
    statCalendar({ revlog, all }) {
        const ui = this.statsUi, year = ui.calYear;
        const counts = {};
        if (all) Object.assign(counts, this.data.stats.history);
        else revlog.forEach(r => { const k = dayKey(r[0]); counts[k] = (counts[k] || 0) + 1; });
        const vals = Object.values(counts).filter(v => v > 0).sort((a, b) => a - b);
        const q = p => vals.length ? vals[Math.min(vals.length - 1, Math.floor(p * vals.length))] : 1;
        const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
        const first = new Date(year, 0, 1), lead = (first.getDay() + 6) % 7;
        const today = dayKey();
        let cells = '';
        for (let i = 0; i < lead; i++) cells += '<i class="pad"></i>';
        let yearTotal = 0, activeDays = 0;
        for (let d = new Date(year, 0, 1); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
            const k = dateKey(d), v = counts[k] || 0;
            yearTotal += v; if (v) activeDays++;
            const lvl = !v ? '' : v <= q1 ? 'l1' : v <= q2 ? 'l2' : v <= q3 ? 'l3' : 'l4';
            cells += `<i class="${lvl}${k === today ? ' today' : ''}${k > today ? ' future' : ''}" data-tip="${esc(`<b>${longDate(d.getTime())}</b><div>${v ? plural(v, 'révision') : 'Aucune révision'}</div>`)}"></i>`;
        }
        const years = Object.keys(counts).map(k => Number(k.slice(0, 4)));
        const minYear = Math.min(new Date().getFullYear(), ...years);
        return `<section class="panel panel-pad stat-card wide">
            <div class="stat-head"><h4 class="stat-title">Calendrier</h4>
                <div class="year-nav">
                    <button class="icon-btn icon-btn-sm" data-action="cal-year" data-delta="-1" ${year <= minYear ? 'disabled' : ''} aria-label="Année précédente">${ic('arrowLeft')}</button>
                    <b>${year}</b>
                    <button class="icon-btn icon-btn-sm" data-action="cal-year" data-delta="1" ${year >= new Date().getFullYear() ? 'disabled' : ''} aria-label="Année suivante" style="transform:scaleX(-1)">${ic('arrowLeft')}</button>
                </div>
            </div>
            <div class="cal-wrap">
                <div class="cal-days"><span>L</span><span></span><span>M</span><span></span><span>V</span><span></span><span>D</span></div>
                <div class="heatmap-scroll"><div class="heatmap year">${cells}</div></div>
            </div>
            <div class="cal-foot"><span class="small muted">${plural(yearTotal, 'révision')} · ${plural(activeDays, 'jour actif', 'jours actifs')} en ${year}</span>
                <span class="cal-scale">Moins <i></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i> Plus</span></div>
        </section>`;
    },

    /* ---------- Révisions (passé) ---------- */
    statReviews({ revlog, all }) {
        const ui = this.statsUi, today = dayKey();
        const history = this.data.stats.history;
        const firstKeys = [...revlog.map(r => dayKey(r[0])), ...(all ? Object.keys(history) : [])].sort();
        const span = firstKeys.length ? daysBetweenKeys(firstKeys[0], today) + 1 : 1;
        const days = ui.rvRange === 'all' ? Math.max(31, span) : Number(ui.rvRange);
        const useTime = ui.rvTime;
        const series = [
            { key: 'learn', label: 'Apprentissage', color: 'var(--learn)' },
            { key: 'young', label: 'Récentes', color: YOUNG_COLOR },
            { key: 'mature', label: 'Matures', color: 'var(--mature)' },
            { key: 'relearn', label: 'Réapprentissage', color: 'var(--due)' },
            { key: 'cram', label: 'Entraînement', color: PRACTICE_COLOR }
        ];
        const perDay = {}, logCount = {};
        revlog.forEach(r => {
            const k = dayKey(r[0]), ago = daysBetweenKeys(k, today);
            if (ago < 0 || ago >= days) return;
            (perDay[ago] = perDay[ago] || { learn: 0, young: 0, mature: 0, relearn: 0, cram: 0, legacy: 0 })[revKind(r)] += useTime ? (r[6] || 0) / 60000 : 1;
            logCount[k] = (logCount[k] || 0) + 1;
        });
        let legacyTotal = 0;
        if (all && !useTime) {
            Object.entries(history).forEach(([k, v]) => {
                const extra = v - (logCount[k] || 0), ago = daysBetweenKeys(k, today);
                if (extra > 0 && ago >= 0 && ago < days) { (perDay[ago] = perDay[ago] || { learn: 0, young: 0, mature: 0, relearn: 0, cram: 0, legacy: 0 }).legacy += extra; legacyTotal += extra; }
            });
        }
        const allSeries = legacyTotal ? [...series, { key: 'legacy', label: 'Avant le suivi détaillé', color: 'var(--text-faint)' }] : series;
        const dayTotals = Object.values(perDay).map(o => Object.values(o).reduce((a, b) => a + b, 0));
        const studied = dayTotals.filter(v => v > 0).length, total = dayTotals.reduce((a, b) => a + b, 0);
        const unit = v => (useTime ? fmtDuration(v * 60) : plural(Math.round(v), 'révision'));
        this.chartDefs.reviews = W => {
            const k = Math.max(1, Math.ceil(days / Math.floor((W - 90) / 5)));
            const n = Math.ceil(days / k), hidden = ui.hidden.reviews || new Set();
            const ser = allSeries.map(s => ({ ...s, values: new Array(n).fill(0) }));
            Object.entries(perDay).forEach(([ago, o]) => {
                const b = n - 1 - Math.floor(Number(ago) / k);
                if (b < 0) return;
                ser.forEach(s => { s.values[b] += o[s.key] || 0; });
            });
            let run = 0;
            const cumul = Array.from({ length: n }, (_, i) => (run += ser.filter(s => !hidden.has(s.key)).reduce((a, s) => a + s.values[i], 0)));
            const dayT = i => addDays(Date.now(), -((n - 1 - i) * k));
            return barsSVG(W, {
                n, series: ser, hidden, minMax: useTime ? 5 : 4,
                yFmt: v => (useTime ? `${fmtNum(v)} min` : fmtNum(v)),
                line: { values: cumul, color: 'var(--text-faint)', fmt: v => (useTime ? `${Math.round(v)}m` : fmtNum(v)) },
                xLabel: i => (i === n - 1 ? 'Auj.' : k === 1 && days <= 31 ? shortDate(dayT(i)) : `-${(n - 1 - i) * k} j`),
                tooltip: i => {
                    const title = k === 1 ? (i === n - 1 ? "Aujourd'hui" : longDate(dayT(i))) : `Du ${shortDate(dayT(i) - (k - 1) * DAY)} au ${shortDate(dayT(i))}`;
                    const tot = ser.reduce((a, s) => a + s.values[i], 0);
                    return tipRows(title, ser.filter(s => s.values[i] > 0).map(s => ({ label: s.label, value: useTime ? fmtDuration(s.values[i] * 60) : s.values[i], color: s.color })), `Total : ${unit(tot)}`);
                }
            });
        };
        return `<section class="panel panel-pad stat-card wide">
            <div class="stat-head"><div><h4 class="stat-title">Révisions</h4><p class="stat-sub">Le nombre de révisions (ou le temps passé) par jour, selon le statut de la carte.</p></div>
            <div class="stat-opts">${this.statSeg('rvTime', [[false, 'Nombre'], [true, 'Durée']])}${this.statSeg('rvRange', [[30, '1 mois'], [90, '3 mois'], [365, '1 an'], ['all', 'Tout']])}</div></div>
            ${total ? this.chartBox('reviews') + this.legend('reviews', allSeries) : '<div class="no-data">Pas encore de données : révise quelques cartes !</div>'}
            <dl class="stat-facts"><dt>Jours étudiés</dt><dd>${studied} sur ${days} (${pctStr(studied, days)})</dd><dt>Total</dt><dd>${unit(total)}</dd><dt>Moyenne (jours étudiés)</dt><dd>${unit(studied ? total / studied : 0)}/jour</dd><dt>Moyenne sur la période</dt><dd>${unit(total / days)}/jour</dd></dl>
        </section>`;
    },

    /* ---------- Nombre de cartes ---------- */
    statCounts({ cards }) {
        const k = { new: 0, learning: 0, relearning: 0, young: 0, mature: 0, suspended: 0 };
        cards.forEach(c => {
            if (c.suspended) k.suspended++;
            else if (c.state === 'review') k[c.interval >= MATURE_IVL ? 'mature' : 'young']++;
            else k[c.state]++;
        });
        const segs = [
            { key: 'new', label: 'Inédites', color: 'var(--new)', value: k.new },
            { key: 'learning', label: 'À repasser', color: 'var(--learn)', value: k.learning },
            { key: 'relearning', label: 'Réapprentissage', color: 'var(--due)', value: k.relearning },
            { key: 'young', label: 'Récentes', color: YOUNG_COLOR, value: k.young },
            { key: 'mature', label: 'Matures', color: 'var(--mature)', value: k.mature },
            { key: 'suspended', label: 'Suspendues', color: '#eab308', value: k.suspended }
        ];
        const total = cards.length;
        this.chartDefs.counts = W => donutSVGi(Math.min(210, W), segs, total, 'cartes');
        return `<section class="panel panel-pad stat-card">
            <h4 class="stat-title">Nombre de cartes</h4><p class="stat-sub">La répartition de tes cartes selon leur statut.</p>
            <div class="donut-wrap">${this.chartBox('counts', 'donut')}
                <table class="stat-table legend-table"><tbody>${segs.map(s => `<tr><td><span class="sw" style="background:${s.color}"></span>${s.label}</td><td>${s.value}</td><td>${total ? Math.round(s.value / total * 100) : 0}%</td></tr>`).join('')}
                <tr class="total"><td>Total</td><td>${total}</td><td></td></tr></tbody></table>
            </div>
        </section>`;
    },

    /* ---------- Intervalles ---------- */
    statIntervals({ cards }) {
        const ui = this.statsUi;
        const ivls = cards.filter(c => (c.state === 'review' || c.state === 'relearning') && !c.suspended).map(c => Math.max(1, c.interval)).sort((a, b) => a - b);
        const med = median(ivls);
        const sub = `<p class="stat-sub">Le nombre de cartes selon leur intervalle de révision (temps avant leur prochaine apparition).</p>`;
        if (!ivls.length) return `<section class="panel panel-pad stat-card"><h4 class="stat-title">Intervalles de révision</h4>${sub}<div class="no-data">Pas encore de cartes en révision.</div></section>`;
        const pctCut = p => ivls[Math.min(ivls.length - 1, Math.ceil(p * ivls.length) - 1)];
        const maxIvl = ui.ivRange === '1m' ? 31 : ui.ivRange === 'p50' ? pctCut(0.5) : ui.ivRange === 'p95' ? pctCut(0.95) : ivls[ivls.length - 1];
        this.chartDefs.intervals = W => {
            const k = Math.max(1, Math.ceil((maxIvl + 1) / Math.min(60, Math.floor((W - 90) / 8))));
            const n = Math.max(1, Math.ceil((maxIvl + 1) / k));
            const vals = new Array(n).fill(0);
            ivls.forEach(v => { if (v <= maxIvl) vals[Math.floor(v / k)]++; });
            let run = 0;
            const cum = vals.map(v => (run += v) / ivls.length * 100);
            const range = i => (k === 1 ? fmtDays(i) : `${fmtDays(Math.max(1, i * k))} à ${fmtDays(i * k + k - 1)}`);
            return barsSVG(W, {
                n, series: [{ key: 'c', label: 'Cartes', color: 'var(--primary)', values: vals }], minMax: 4,
                line: { values: cum, max: 100, color: 'var(--text-faint)', fmt: v => `${Math.round(v)}%` },
                xLabel: i => (i === 0 && k === 1 ? '' : fmtDays(Math.max(1, i * k))),
                tooltip: i => (vals[i] ? tipRows(range(i), [{ label: 'Cartes', value: vals[i], color: 'var(--primary)' }], `${fmtNum(cum[i])} % des cartes ont un intervalle plus court`) : '')
            });
        };
        return `<section class="panel panel-pad stat-card">
            <div class="stat-head"><div><h4 class="stat-title">Intervalles de révision</h4>${sub}</div>
            <div class="stat-opts">${this.statSeg('ivRange', [['1m', '1 mois'], ['p50', '50%'], ['p95', '95%'], ['all', 'Tout']])}</div></div>
            ${this.chartBox('intervals')}
            <dl class="stat-facts"><dt>Intervalle médian</dt><dd>${fmtDays(Math.round(med))}</dd><dt>Intervalle le plus long</dt><dd>${fmtDays(ivls[ivls.length - 1])}</dd></dl>
        </section>`;
    },

    /* ---------- Facilité ---------- */
    statEase({ cards }) {
        const eases = cards.filter(c => (c.state === 'review' || c.state === 'relearning') && !c.suspended).map(c => Math.round(c.ease * 100));
        const sub = `<p class="stat-sub">Moins une carte est facile, plus souvent elle apparaîtra.</p>`;
        if (!eases.length) return `<section class="panel panel-pad stat-card"><h4 class="stat-title">Facilité des cartes</h4>${sub}<div class="no-data">Pas encore de cartes en révision.</div></section>`;
        const lo = 130, hi = Math.max(300, Math.ceil(Math.max(...eases) / 10) * 10 + 10), step = 10;
        const n = (hi - lo) / step, vals = new Array(n).fill(0);
        eases.forEach(e => { vals[clamp(Math.floor((e - lo) / step), 0, n - 1)]++; });
        const color = i => `color-mix(in srgb, var(--due) ${Math.round(100 - i / (n - 1) * 100)}%, var(--mature))`;
        this.chartDefs.ease = W => barsSVG(W, {
            n, series: [{ key: 'c', label: 'Cartes', color: 'var(--primary)', values: vals, colorAt: color }], minMax: 4,
            xLabel: i => `${lo + i * step}%`, labelWidth: 44,
            tooltip: i => (vals[i] ? tipRows(`Facilité ${lo + i * step} à ${lo + i * step + step - 1} %`, [{ label: 'Cartes', value: vals[i], color: color(i) }]) : '')
        });
        return `<section class="panel panel-pad stat-card">
            <h4 class="stat-title">Facilité des cartes</h4>${sub}
            ${this.chartBox('ease')}
            <dl class="stat-facts"><dt>Facilité médiane</dt><dd>${Math.round(median(eases))} %</dd><dt>Cartes « difficiles » (&lt; 200 %)</dt><dd>${eases.filter(e => e < 200).length}</dd></dl>
        </section>`;
    },

    /* ---------- Rétention réelle ---------- */
    statRetention({ revlog }) {
        const reviews = revlog.filter(r => r[3] === 1 && r[2]);
        const t0 = startOfDay();
        const periods = [
            ["Aujourd'hui", t0, Infinity], ['Hier', t0 - DAY, t0], ['Semaine dernière', t0 - 6 * DAY, Infinity],
            ['Mois dernier', t0 - 29 * DAY, Infinity], ['Année passée', t0 - 364 * DAY, Infinity], ['Depuis le début', 0, Infinity]
        ];
        const rows = periods.map(([label, a, b]) => {
            const inP = reviews.filter(r => r[0] >= a && r[0] < b);
            const y = inP.filter(r => (r[5] || 0) < MATURE_IVL), m = inP.filter(r => (r[5] || 0) >= MATURE_IVL);
            const ok = arr => arr.filter(r => r[2] >= 2).length;
            return `<tr><th>${label}</th><td class="c-young">${pctStr(ok(y), y.length)}</td><td class="c-mature">${pctStr(ok(m), m.length)}</td><td>${pctStr(ok(inP), inP.length)}</td><td class="faint">${inP.length}</td></tr>`;
        }).join('');
        return `<section class="panel panel-pad stat-card">
            <h4 class="stat-title">Rétention réelle</h4><p class="stat-sub">Taux de réussite des cartes révisées avec un intervalle ≥ 1 jour (tout sauf « Raté »).</p>
            <div class="table-scroll"><table class="stat-table retention"><thead><tr><th></th><th class="c-young">Récentes</th><th class="c-mature">Matures</th><th>Total</th><th class="faint">Nombre</th></tr></thead><tbody>${rows}</tbody></table></div>
        </section>`;
    },

    /* ---------- Répartition horaire ---------- */
    statHourly({ revlog }) {
        const ui = this.statsUi, since = startOfDay() - (Number(ui.hrRange) - 1) * DAY;
        const cnt = new Array(24).fill(0), ok = new Array(24).fill(0);
        revlog.forEach(r => {
            if (r[0] < since || !r[2]) return;
            const h = new Date(r[0]).getHours();
            cnt[h]++; if (r[2] >= 2) ok[h]++;
        });
        const rate = cnt.map((c, i) => (c ? ok[i] / c * 100 : null));
        const total = cnt.reduce((a, b) => a + b, 0);
        const best = total ? cnt.map((c, i) => [c >= 3 ? rate[i] : -1, i]).sort((a, b) => b[0] - a[0])[0] : null;
        this.chartDefs.hourly = W => barsSVG(W, {
            n: 24, series: [{ key: 'c', label: 'Révisions', color: 'color-mix(in srgb, var(--primary) 55%, var(--surface))', values: cnt }], minMax: 4,
            line: { values: rate, max: 100, color: 'var(--primary)', fmt: v => `${Math.round(v)}%` },
            xLabel: i => `${i}h`, labelWidth: 30,
            tooltip: i => tipRows(`De ${i}h à ${i + 1}h`, [{ label: 'Révisions', value: cnt[i], color: 'color-mix(in srgb, var(--primary) 55%, var(--surface))' }, { label: 'Réussite', value: rate[i] === null ? 'N/A' : `${fmtNum(rate[i])} %`, color: 'var(--primary)' }])
        });
        return `<section class="panel panel-pad stat-card">
            <div class="stat-head"><div><h4 class="stat-title">Répartition horaire</h4><p class="stat-sub">Nombre de révisions (barres) et taux de réussite (ligne) selon l'heure.</p></div>
            <div class="stat-opts">${this.statSeg('hrRange', [[30, '1 mois'], [90, '3 mois'], [365, '1 an']])}</div></div>
            ${total ? this.chartBox('hourly') : '<div class="no-data">Pas de révision sur cette période.</div>'}
            ${best && best[0] >= 0 ? `<p class="small muted" style="margin-top:8px">Ta meilleure heure : <b>${best[1]}h-${best[1] + 1}h</b> (${fmtNum(best[0])} % de réussite).</p>` : ''}
        </section>`;
    },

    /* ---------- Boutons de réponse ---------- */
    statButtons({ revlog }) {
        const ui = this.statsUi, since = startOfDay() - (Number(ui.btRange) - 1) * DAY;
        const groups = [['learn', 'À repasser'], ['young', 'Récentes'], ['mature', 'Matures']];
        const c = { learn: [0, 0, 0, 0], young: [0, 0, 0, 0], mature: [0, 0, 0, 0] };
        revlog.forEach(r => {
            if (r[0] < since || r[3] === 3 || !r[2]) return;
            const k = r[3] === 1 ? ((r[5] || 0) >= MATURE_IVL ? 'mature' : 'young') : 'learn';
            c[k][r[2] - 1]++;
        });
        const btn = [['Raté', 'var(--again)'], ['Difficile', 'var(--hard)'], ['Bien', 'var(--good)'], ['Facile', 'var(--easy)']];
        const vals = [], colors = [], tips = [];
        groups.forEach(([k, label], gi) => {
            const tot = c[k].reduce((a, b) => a + b, 0);
            c[k].forEach((v, b) => { vals.push(v); colors.push(btn[b][1]); tips.push(tipRows(`${label} · ${btn[b][0]}`, [{ label: 'Réponses', value: v, color: btn[b][1] }], `${pctStr(v, tot)} des réponses ${label.toLowerCase()}`)); });
            if (gi < 2) { vals.push(0); colors.push('transparent'); tips.push(''); }
        });
        const total = vals.reduce((a, b) => a + b, 0);
        this.chartDefs.buttons = W => barsSVG(W, {
            n: vals.length, series: [{ key: 'c', label: 'Réponses', color: 'var(--primary)', values: vals, colorAt: i => colors[i] }], minMax: 4,
            xLabel: i => ({ 1: 'À repasser', 6: 'Récentes', 11: 'Matures' }[i] ?? null), allLabels: true, labelWidth: 20,
            tooltip: i => tips[i]
        });
        const summary = groups.map(([k, label]) => {
            const tot = c[k].reduce((a, b) => a + b, 0);
            return `<dt>${label}</dt><dd>${tot ? `${pctStr(tot - c[k][0], tot)} correctes (${tot})` : 'N/A'}</dd>`;
        }).join('');
        return `<section class="panel panel-pad stat-card">
            <div class="stat-head"><div><h4 class="stat-title">Boutons de réponse</h4><p class="stat-sub">Le choix des boutons selon l'ancienneté de la carte.</p></div>
            <div class="stat-opts">${this.statSeg('btRange', [[30, '1 mois'], [90, '3 mois'], [365, '1 an']])}</div></div>
            ${total ? this.chartBox('buttons') + `<div class="chart-legend static">${btn.map(b => `<span><span class="sw" style="background:${b[1]}"></span>${b[0]}</span>`).join('')}</div>` : '<div class="no-data">Pas de réponse sur cette période.</div>'}
            <dl class="stat-facts">${summary}</dl>
        </section>`;
    },

    /* ---------- Ajoutées ---------- */
    statAdded({ cards }) {
        const ui = this.statsUi, today = dayKey();
        const created = cards.map(c => c.created).filter(t => t > 0);
        const span = created.length ? daysBetweenKeys(dayKey(Math.min(...created)), today) + 1 : 1;
        const days = ui.adRange === 'all' ? Math.max(31, span) : Number(ui.adRange);
        const perAgo = {};
        created.forEach(t => { const ago = daysBetweenKeys(dayKey(t), today); if (ago >= 0 && ago < days) perAgo[ago] = (perAgo[ago] || 0) + 1; });
        const total = Object.values(perAgo).reduce((a, b) => a + b, 0);
        this.chartDefs.added = W => {
            const k = Math.max(1, Math.ceil(days / Math.floor((W - 90) / 5))), n = Math.ceil(days / k);
            const vals = new Array(n).fill(0);
            Object.entries(perAgo).forEach(([ago, v]) => { const b = n - 1 - Math.floor(Number(ago) / k); if (b >= 0) vals[b] += v; });
            let run = 0;
            const cum = vals.map(v => (run += v));
            const dayT = i => addDays(Date.now(), -((n - 1 - i) * k));
            return barsSVG(W, {
                n, series: [{ key: 'c', label: 'Ajoutées', color: 'var(--new)', values: vals }], minMax: 4,
                line: { values: cum, color: 'var(--text-faint)' },
                xLabel: i => (i === n - 1 ? 'Auj.' : k === 1 && days <= 31 ? shortDate(dayT(i)) : `-${(n - 1 - i) * k} j`),
                tooltip: i => tipRows(k === 1 ? longDate(dayT(i)) : `Du ${shortDate(dayT(i) - (k - 1) * DAY)} au ${shortDate(dayT(i))}`, [{ label: 'Cartes ajoutées', value: vals[i], color: 'var(--new)' }], `Cumul : ${cum[i]}`)
            });
        };
        return `<section class="panel panel-pad stat-card wide">
            <div class="stat-head"><div><h4 class="stat-title">Ajoutées</h4><p class="stat-sub">Le nombre de nouvelles cartes que tu as ajoutées.</p></div>
            <div class="stat-opts">${this.statSeg('adRange', [[30, '1 mois'], [90, '3 mois'], [365, '1 an'], ['all', 'Tout']])}</div></div>
            ${total ? this.chartBox('added') : '<div class="no-data">Aucune carte ajoutée sur cette période.</div>'}
            <dl class="stat-facts"><dt>Total</dt><dd>${plural(total, 'carte')}</dd><dt>Moyenne</dt><dd>${fmtNum(total / days)} carte/jour</dd></dl>
        </section>`;
    }
});
