/* ============================================================
   "Temps de concentration": study / break timer (Pomodoro) as a floating widget.
   Presets 20/5, 25/5, 45/10, 50/15 or your own minutes, laps counter, skip, reset, and a bell
   (synthesized with Web Audio, no file) when study time ends and when the break ends.
   State is kept on this device (localStorage) and survives a reload.
   ============================================================ */
Object.assign(ICONS, { bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>' });
const FOCUS_KEY = 'superanki_focus';
const FOCUS_PRESETS = [[20, 5], [25, 5], [45, 10], [50, 15]];
const FOCUS_DEFAULT = { open: false, collapsed: false, phase: 'study', running: false, endsAt: 0, remaining: 25 * 60000, study: 25, brk: 5, laps: 0, sound: true };

Object.assign(SuperAnki.prototype, {
    focusInit() {
        let st = null;
        try { st = JSON.parse(localStorage.getItem(FOCUS_KEY) || 'null'); } catch { st = null; }
        const f = { ...FOCUS_DEFAULT, ...(st && typeof st === 'object' ? st : {}) };
        f.study = clamp(Math.round(num(f.study, 25)), 1, 240); f.brk = clamp(Math.round(num(f.brk, 5)), 1, 120);
        f.phase = f.phase === 'break' ? 'break' : 'study';
        f.remaining = clamp(num(f.remaining, f.study * 60000), 0, 240 * 60000);
        f.laps = Math.max(0, Math.round(num(f.laps, 0)));
        this.focus = f;
        const el = document.createElement('div');
        el.id = 'focus-w'; el.className = 'focus-w hidden'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Temps de concentration');
        document.body.appendChild(el);
        el.addEventListener('click', e => { const b = e.target.closest('[data-fw]'); if (b) this.focusAct(b.dataset.fw, b); });
        el.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.fwin; if (k) this.focusInput(k, e.target); if (e.target.id === 'fw-sound') this.focusSet({ sound: e.target.checked }); });
        this.focusTimer = setInterval(() => this.focusTick(), 500);
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.focusTick(); });
        this.focusRender();
    },
    focusSave() { try { localStorage.setItem(FOCUS_KEY, JSON.stringify(this.focus)); } catch { /* storage blocked */ } },
    focusSet(patch) { Object.assign(this.focus, patch); this.focusSave(); this.focusRender(); },
    focusLeft() { const f = this.focus; return f.running ? Math.max(0, f.endsAt - Date.now()) : f.remaining; },
    focusFull(phase = this.focus.phase) { return (phase === 'study' ? this.focus.study : this.focus.brk) * 60000; },
    focusFmt(ms) { const s = Math.ceil(ms / 1000); return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; },
    focusAct(a, el) {
        const f = this.focus;
        if (a === 'toggle') this.focusToggle();
        else if (a === 'collapse') this.focusSet({ collapsed: !f.collapsed });
        else if (a === 'close') { if (f.running) { f.remaining = this.focusLeft(); f.running = false; } this.focusSet({ open: false }); }
        else if (a === 'skip') this.focusPhaseEnd(false);
        else if (a === 'reset') this.focusSet({ phase: 'study', running: false, endsAt: 0, remaining: f.study * 60000, laps: 0 });
        else if (a === 'preset') { const [s, b] = el.dataset.v.split('/').map(Number); this.focusConfig(s, b); }
        else if (a === 'test') { this.focusUnlock(); this.focusRing('study'); }
    },
    focusInput(k, el) {
        const f = this.focus;
        if (k === 'study') this.focusConfig(clamp(Math.round(num(el.value, f.study)), 1, 240), f.brk, true);
        else this.focusConfig(f.study, clamp(Math.round(num(el.value, f.brk)), 1, 120), true);
    },
    /* new durations: the current phase restarts with its new length (keeps running if it was running).
       `light` = typed in a field: update the widget without rebuilding it (keeps the cursor where it is). */
    focusConfig(study, brk, light = false) {
        const f = this.focus, full = (f.phase === 'study' ? study : brk) * 60000;
        const changedPhase = (f.phase === 'study' ? f.study !== study : f.brk !== brk);
        f.study = study; f.brk = brk;
        if (changedPhase || !light) { f.remaining = full; if (f.running) f.endsAt = Date.now() + full; }
        this.focusSave();
        if (!light) { this.focusRender(); return; }
        $$('#focus-w .fw-chip').forEach(c => { const [s, b] = c.dataset.v.split('/').map(Number); c.classList.toggle('on', s === study && b === brk); });
        this.focusTick();
    },
    focusToggle() {
        const f = this.focus;
        this.focusUnlock();
        if (f.running) { f.remaining = this.focusLeft(); f.running = false; }
        else { if (f.remaining <= 0) f.remaining = this.focusFull(); f.running = true; f.endsAt = Date.now() + f.remaining; }
        this.focusSave(); this.focusRender();
    },
    focusTick() {
        const f = this.focus;
        if (!f) return;
        if (f.running && Date.now() >= f.endsAt) { this.focusPhaseEnd(true); return; }
        const t = $('#fw-time'), left = this.focusLeft();
        if (t) t.textContent = this.focusFmt(left);
        const nav = $('#focus-chip'); if (nav) nav.textContent = f.running ? this.focusFmt(left) : '';
        document.title = f.running ? `${f.phase === 'study' ? '📚' : '☕'} ${this.focusFmt(left)} · SuperAnki Pro` : 'SuperAnki Pro';
    },
    /* natural = the time ran out (rings, laps count). Otherwise it was skipped. */
    focusPhaseEnd(natural) {
        const f = this.focus, was = f.phase;
        if (was === 'study') {
            if (natural) f.laps++;
            f.phase = 'break'; f.remaining = f.brk * 60000;
            f.running = natural ? true : f.running;
            if (f.running) f.endsAt = Date.now() + f.remaining;
        } else {
            f.phase = 'study'; f.remaining = f.study * 60000;
            f.running = natural ? false : f.running;
            if (f.running) f.endsAt = Date.now() + f.remaining;
        }
        if (natural) {
            this.focusRing(was);
            this.toast(was === 'study' ? `Temps de travail terminé ! Pause de ${f.brk} min ☕` : 'Pause terminée : on reprend ? 📚', 'success', ic('bell'));
            try { if ('Notification' in window && Notification.permission === 'granted') new Notification(was === 'study' ? 'Temps de travail terminé' : 'Pause terminée', { body: was === 'study' ? `Pause de ${f.brk} min` : 'Prêt à reprendre ?', icon: 'icon-192.png' }); } catch { /* ignore */ }
        }
        this.focusSave(); this.focusRender(); this.focusTick();
    },
    /* the bell: two bell-like tones sequences, different for end of study and end of break */
    focusUnlock() {
        try {
            if (!this.audioCtx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) this.audioCtx = new AC(); }
            if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
        } catch { /* no audio */ }
    },
    focusRing(kind) {
        const f = this.focus;
        try { if (navigator.vibrate) navigator.vibrate([250, 120, 250]); } catch { /* ignore */ }
        if (!f.sound) return;
        this.focusUnlock();
        const ac = this.audioCtx;
        if (!ac) return;
        const notes = kind === 'study' ? [988, 1319, 1760] : [784, 988];
        const t0 = ac.currentTime + 0.05;
        [0, 1.6].forEach(rep => notes.forEach((hz, i) => {
            const t = t0 + rep + i * 0.28;
            [[1, 0.22], [2.76, 0.07], [5.4, 0.03]].forEach(([mul, vol]) => {
                const o = ac.createOscillator(), g = ac.createGain();
                o.type = 'sine'; o.frequency.value = hz * mul;
                g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
                o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 1.2);
            });
        }));
    },
    focusToggleOpen() {
        const f = this.focus;
        this.focusSet({ open: !f.open });
    },
    focusRender() {
        const f = this.focus, el = $('#focus-w');
        if (!f || !el) return;
        el.classList.toggle('hidden', !f.open);
        el.classList.toggle('collapsed', f.collapsed);
        el.dataset.phase = f.phase;
        const btn = $('[data-action="focus-toggle"]'); if (btn) btn.classList.toggle('active', f.open);
        const act = (f.phase === 'study' ? `${f.study}/${f.brk}` : '');
        el.innerHTML = `<div class="fw-head"><span class="fw-ico">${ic('brain')}</span>
            <div class="fw-title"><small>Temps de concentration</small><b id="fw-time">${this.focusFmt(this.focusLeft())}</b><span class="fw-phase">${f.phase === 'study' ? 'Étude' : 'Pause'}</span></div>
            <button class="icon-btn" data-fw="toggle" aria-label="${f.running ? 'Pause' : 'Démarrer'}" title="${f.running ? 'Mettre en pause' : 'Démarrer'}">${ic(f.running ? 'pause' : 'play')}</button>
            <button class="icon-btn fw-chev" data-fw="collapse" aria-label="Réduire ou agrandir" title="Réduire / agrandir">${ic('chevronDown')}</button>
            <button class="icon-btn" data-fw="close" aria-label="Fermer" title="Fermer">${ic('x')}</button></div>
            <div class="fw-body">
                <div class="fw-presets">${FOCUS_PRESETS.map(([s, b]) => `<button class="fw-chip ${f.study === s && f.brk === b ? 'on' : ''}" data-fw="preset" data-v="${s}/${b}">${s}/${b}</button>`).join('')}</div>
                <div class="fw-fields"><label>Étude (min)<input class="input" type="number" min="1" max="240" value="${f.study}" data-fwin="study" inputmode="numeric"></label>
                    <label>Pause (min)<input class="input" type="number" min="1" max="120" value="${f.brk}" data-fwin="brk" inputmode="numeric"></label></div>
                <div class="fw-foot"><span class="fw-laps">Tours effectués : ${f.laps}</span><button class="btn btn-soft btn-sm" data-fw="skip">Sauter</button><button class="btn btn-soft btn-sm" data-fw="reset">${ic('reset')}Réinitialiser</button></div>
                <div class="fw-sound"><label class="check"><input type="checkbox" id="fw-sound" ${f.sound ? 'checked' : ''}> ${ic('bell', 'inl')} Sonnerie</label><button class="link" data-fw="test">Tester le son</button></div>
            </div>`;
    }
});
