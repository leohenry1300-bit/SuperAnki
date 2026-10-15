/* ============================================================
   Cloud sync (Supabase) with a real merge, so two devices never
   overwrite each other, plus optional end-to-end encryption.
   - Cards, decks and deletions are merged one by one (last change wins).
   - Review history is merged as a union.
   - With a sync key, data is encrypted in the browser (AES-GCM) and stored
     under a row id derived from the key: nobody can read or find it.
   ============================================================ */
const SUPABASE_URL = 'https://opmkdjkvbzfxbeygdvpo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yor28RXd0IEXDGyz6S9jCA_DOZ3wOYf';

const SyncCrypto = {
    cached: null,
    available: () => !!(window.crypto && crypto.subtle),
    enc: s => new TextEncoder().encode(s),
    b64(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); },
    unb64(str) { const s = atob(str), out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; },
    async sha(str) {
        const b = await crypto.subtle.digest('SHA-256', this.enc(str));
        return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    },
    async key(pass) {
        if (this.cached && this.cached.pass === pass) return this.cached.key;
        const base = await crypto.subtle.importKey('raw', this.enc(pass), 'PBKDF2', false, ['deriveKey']);
        const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: this.enc('superanki-sync-v1'), iterations: 150000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
        this.cached = { pass, key };
        return key;
    },
    async rowId(pass) { return pass ? `u_${(await this.sha(`superanki-row:${pass}`)).slice(0, 40)}` : 'main'; },
    async encrypt(obj, pass) {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await this.key(pass), this.enc(JSON.stringify(obj)));
        return { enc: 1, iv: this.b64(iv), ct: this.b64(new Uint8Array(ct)) };
    },
    async decrypt(payload, pass) {
        const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: this.unb64(payload.iv) }, await this.key(pass), this.unb64(payload.ct));
        return JSON.parse(new TextDecoder().decode(buf));
    }
};

const DEVICE_ONLY_SETTINGS = ['theme', 'cardSize', 'syncKey', 'cloudSync', 'autoSpeak', 'autoBackup', 'answerMode', 'showIntervals'];
function mergeMaxMap(a, b) { const out = { ...a }; Object.entries(b || {}).forEach(([k, v]) => { out[k] = Math.max(out[k] || 0, v || 0); }); return out; }
function mergeSeen(a, b) {
    if (!a || a.date !== (b && b.date)) return (b && (!a || String(b.date) > String(a.date))) ? b : a;
    return { date: a.date, count: Math.max(a.count, b.count), by: mergeMaxMap(a.by, b.by) };
}
function mergeStats(a, b) {
    const out = JSON.parse(JSON.stringify(a));
    out.history = mergeMaxMap(a.history, b.history);
    out.timeByDay = mergeMaxMap(a.timeByDay, b.timeByDay);
    out.chronoBest = mergeMaxMap(a.chronoBest, b.chronoBest);
    out.gradeCounts = mergeMaxMap(a.gradeCounts, b.gradeCounts);
    out.hourly = a.hourly.map((v, i) => Math.max(v, b.hourly[i] || 0));
    out.quizBest = Math.max(a.quizBest || 0, b.quizBest || 0);
    out.longestStreak = Math.max(a.longestStreak, b.longestStreak);
    out.studySeconds = Math.max(a.studySeconds, b.studySeconds);
    const useB = (b.lastStudyDate || '') > (a.lastStudyDate || '') || ((b.lastStudyDate || '') === (a.lastStudyDate || '') && b.streak > a.streak);
    if (useB) { out.streak = b.streak; out.lastStudyDate = b.lastStudyDate; out.freezes = b.freezes; }
    out.newSeen = mergeSeen(a.newSeen, b.newSeen);
    out.revSeen = mergeSeen(a.revSeen, b.revSeen);
    return out;
}
/* L = local state, R = remote state (both normalized). Returns the merged state and what changed on each side. */
function mergeStates(L, R) {
    let localChanged = false, remoteChanged = false;
    const Ld = L.deleted || {}, Rd = R.deleted || {}, tomb = { ...Rd };
    Object.entries(Ld).forEach(([k, v]) => { if (!(tomb[k] >= v)) tomb[k] = v; });
    Object.keys(tomb).forEach(k => { if (!(Ld[k] >= tomb[k])) localChanged = true; if (!(Rd[k] >= tomb[k])) remoteChanged = true; });
    const newer = (L.updatedAt || 0) >= (R.updatedAt || 0) ? 'l' : 'r';
    const mergeList = (la, ra, sig) => {
        const lm = new Map(la.map(x => [x.id, x])), rm = new Map(ra.map(x => [x.id, x])), out = [];
        new Set([...lm.keys(), ...rm.keys()]).forEach(id => {
            const l = lm.get(id), r = rm.get(id), t = tomb[id] || 0;
            if (l && r) {
                if (t > Math.max(l.mod, r.mod)) { localChanged = remoteChanged = true; return; }
                if (sig(l) === sig(r)) { out.push(l); return; }
                const pick = l.mod !== r.mod ? (l.mod > r.mod ? 'l' : 'r') : newer;
                if (pick === 'l') { out.push(l); remoteChanged = true; } else { out.push(r); localChanged = true; }
            } else if (l) {
                if (t > 0 && t >= l.mod) localChanged = true; else { out.push(l); remoteChanged = true; }
            } else if (t > 0 && t >= r.mod) remoteChanged = true;
            else { out.push(r); localChanged = true; }
        });
        return out;
    };
    const noteTypes = mergeList(L.noteTypes || [], R.noteTypes || [], noteTypeSig), decks = mergeList(L.decks, R.decks, deckSig), cards = mergeList(L.cards, R.cards, cardSig), presets = mergeList(L.presets || [], R.presets || [], presetSig);
    const stats = mergeStats(L.stats, R.stats);
    if (JSON.stringify(stats) !== JSON.stringify(L.stats)) localChanged = true;
    if (JSON.stringify(stats) !== JSON.stringify(R.stats)) remoteChanged = true;
    const settings = { ...L.settings };
    if ((R.settings.settingsMod || 0) > (L.settings.settingsMod || 0)) {
        Object.keys(R.settings).forEach(k => { if (!DEVICE_ONLY_SETTINGS.includes(k) && settings[k] !== R.settings[k]) { settings[k] = R.settings[k]; localChanged = true; } });
        settings.settingsMod = R.settings.settingsMod;
    } else if ((L.settings.settingsMod || 0) > (R.settings.settingsMod || 0)) remoteChanged = true;
    const seen = new Set(), revlog = [];
    [...L.revlog, ...R.revlog].forEach(r => { const k = `${r[0]}|${r[1]}`; if (!seen.has(k)) { seen.add(k); revlog.push(r); } });
    revlog.sort((a, b) => a[0] - b[0]);
    if (revlog.length > L.revlog.length) localChanged = true;
    if (revlog.length > R.revlog.length) remoteChanged = true;
    const toeic = mergeToeic(L.toeic || normalizeToeic(), R.toeic || normalizeToeic());
    if (toeic.attempts.length > (L.toeic ? L.toeic.attempts.length : 0)) localChanged = true;
    if (toeic.attempts.length > (R.toeic ? R.toeic.attempts.length : 0)) remoteChanged = true;
    const data = normalizeState({ version: 6, decks, cards, presets, stats, settings, revlog, deleted: tomb, noteTypes, trash: mergeTrash(L.trash, R.trash, cards, decks), toeic, media: { ...(R.media || {}), ...(L.media || {}) }, updatedAt: Math.max(L.updatedAt || 0, R.updatedAt || 0) });
    return { data, localChanged, remoteChanged };
}

const Cloud = {
    client: null, status: 'off', timer: null, busy: false, pending: false, lastPull: 0, lastSync: 0, deferred: false, lastError: '',
    async ensure() {
        if (this.client) return true;
        try {
            if (!window.supabase) await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
            if (!window.supabase || !window.supabase.createClient) return false;
            this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            return true;
        } catch { return false; }
    },
    setStatus(s, err = '') {
        this.status = s; this.lastError = err;
        if (typeof app !== 'undefined' && app) { app.renderSyncIndicator(); if (app.popover && app.popover.dataset.kind === 'sync') app.refreshPopover(); }
    },
    key() { return app.data.settings.syncKey || ''; },
    async pull() {
        if (!(await this.ensure())) throw new Error('hors ligne');
        const id = await SyncCrypto.rowId(this.key());
        const res = await this.client.from('game_state').select('data, updated_at').eq('id', id).maybeSingle();
        if (res.error) throw new Error(res.error.message);
        this.lastPull = Date.now();
        return res.data;
    },
    async decode(row) {
        let raw = row.data;
        if (raw && raw.enc) {
            if (!this.key()) throw new Error('Données chiffrées : entre ta clé de synchronisation');
            try { raw = await SyncCrypto.decrypt(raw, this.key()); } catch { throw new Error('Clé de synchronisation incorrecte'); }
        }
        const st = normalizeState(raw);
        if (!st) throw new Error('Données distantes illisibles');
        st.updatedAt = Math.max(st.updatedAt, Date.parse(row.updated_at) || 0);
        return st;
    },
    schedulePush() {
        if (!app.data.settings.cloudSync) return;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.push(), 2500);
    },
    async push() {
        if (!app.data.settings.cloudSync) return;
        if (this.busy) { this.pending = true; return; }
        this.busy = true; this.setStatus('busy');
        try {
            if (!(await this.ensure())) throw new Error('hors ligne');
            if (this.key() && !SyncCrypto.available()) throw new Error('Chiffrement indisponible (ouvre l\'app en https)');
            const payload = JSON.parse(app.serialize()), id = await SyncCrypto.rowId(this.key());
            const data = this.key() ? await SyncCrypto.encrypt(payload, this.key()) : payload;
            const res = await this.client.from('game_state').upsert({ id, data, updated_at: new Date(app.data.updatedAt || Date.now()).toISOString() });
            if (res.error) throw new Error(res.error.message);
            this.lastSync = Date.now();
            this.setStatus('ok');
        } catch (e) {
            console.warn('Sync cloud:', e.message);
            this.setStatus('err', e.message);
        } finally {
            this.busy = false;
            if (this.pending) { this.pending = false; this.schedulePush(); }
        }
    },
    async sync(manual = false) {
        if (!app.data.settings.cloudSync) { this.setStatus('off'); return; }
        if (app.session || app.examActive()) { this.deferred = true; return; }
        this.setStatus('busy');
        try {
            if (this.key() && !SyncCrypto.available()) throw new Error('Chiffrement indisponible (ouvre l\'app en https)');
            const row = await this.pull();
            if (!row || !row.data) { await this.push(); if (manual) app.toast('Sauvegarde envoyée dans le cloud', 'success'); return; }
            const remote = await this.decode(row);
            if (app.session || app.examActive()) { this.deferred = true; this.setStatus('ok'); return; }
            const m = mergeStates(app.data, remote);
            if (m.localChanged) {
                m.data.settings.syncKey = app.data.settings.syncKey; m.data.settings.cloudSync = app.data.settings.cloudSync;
                app.applyMerged(m.data);
                app.toast('Progression synchronisée depuis le cloud', 'success', ic('cloud'));
            }
            if (m.remoteChanged) await this.push();
            else { this.lastSync = Date.now(); this.setStatus('ok'); if (manual && !m.localChanged) app.toast('Déjà à jour', 'success'); }
        } catch (e) {
            console.warn('Sync cloud:', e.message);
            this.setStatus('err', e.message);
            if (manual) app.toast(/clé|chiffr/i.test(e.message) ? e.message : 'Synchronisation impossible (hors ligne ?)', 'error');
        }
    }
};
