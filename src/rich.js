/* ============================================================
   Rich content: shared media store (images / audio referenced as media:<id>),
   LaTeX formulas (KaTeX, loaded on demand), audio on cards (file or microphone).
   ============================================================ */
const MEDIA_MAX_AUDIO = 1500 * 1024;
function normalizeMedia(m) {
    const out = {};
    if (m && typeof m === 'object') Object.entries(m).forEach(([k, v]) => { if (/^[a-z0-9]+$/.test(k) && typeof v === 'string' && v.startsWith('data:')) out[k] = v; });
    return out;
}
function mediaHash(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36) + str.length.toString(36);
}
const mediaMime = dataUri => (/^data:([^;,]+)/.exec(dataUri) || [])[1] || '';

Object.assign(SuperAnki.prototype, {
    /* stores a data: URI once and returns the reference to put in card html */
    addMedia(dataUri) {
        const id = mediaHash(dataUri);
        if (!this.data.media) this.data.media = {};
        this.data.media[id] = dataUri;
        return `media:${id}`;
    },
    /* drops stored media no card refers to any more (at startup only, so undo never loses a file) */
    gcMedia(data) {
        const ids = Object.keys(data.media || {});
        if (!ids.length) return;
        const used = new Set();
        const scan = s => { String(s || '').replace(/media:([a-z0-9]+)/g, (m, id) => { used.add(id); return m; }); };
        data.cards.forEach(c => { scan(c.front); scan(c.back); scan(c.hint); scan(c.detail); if (c.nf) { scan(c.nf.front); scan(c.nf.back); scan(c.nf.text); scan(c.nf.extra); if (c.nf.f) Object.values(c.nf.f).forEach(scan); } });
        ids.forEach(id => { if (!used.has(id)) delete data.media[id]; });
    },
    resolveMedia(root = document) {
        const media = this.data && this.data.media;
        if (!media) return;
        root.querySelectorAll('img[src^="media:"], audio[src^="media:"]').forEach(el => {
            const v = media[el.getAttribute('src').slice(6)];
            if (v) el.setAttribute('src', v);
        });
    },
    autoPlayAudio(sel) {
        if (!this.data.settings.autoAudio) return;
        const root = $('#view-session') || document;
        const face = root.querySelector(sel);
        if (!face) return;
        this.resolveMedia(face);
        document.querySelectorAll('#view-session audio').forEach(a => { try { a.pause(); } catch { /* ignore */ } });
        const a = face.querySelector('audio');
        if (a) { const p = a.play(); if (p && p.catch) p.catch(() => {}); }
    },

    /* ---------- LaTeX ---------- */
    insertMath(area) {
        document.execCommand('insertText', false, '\\(  \\)');
        const sel = getSelection();
        if (sel && sel.modify) for (let i = 0; i < 3; i++) sel.modify('move', 'backward', 'character');
        this.toast('Écris ta formule entre \\( et \\) (ex : \\(\\frac{a}{b}\\)). Elle s\'affichera sur la carte.', 'success', ic('info'));
    },

    /* ---------- audio ---------- */
    pickAudio(area) {
        const input = $('#hidden-file');
        input.accept = 'audio/*';
        input.value = '';
        input.onchange = async () => {
            const f = input.files[0];
            if (!f) return;
            if (f.size > MEDIA_MAX_AUDIO) { this.toast('Fichier trop lourd (max ≈ 1,5 Mo). Raccourcis l\'extrait.', 'warning'); return; }
            this.insertAudio(await readAsDataURL(f), area);
        };
        input.click();
    },
    insertAudio(dataUri, area) {
        dataUri = dataUri.replace(/^data:([^;,]+)(;[^,]*?)?;base64,/, 'data:$1;base64,');
        area.focus();
        if (this.editorRange && area.contains(this.editorRange.startContainer)) { const sel = getSelection(); sel.removeAllRanges(); sel.addRange(this.editorRange); }
        document.execCommand('insertHTML', false, `<audio controls src="${dataUri}"></audio><br>`);
        this.toast('Audio ajouté', 'success', ic('volume'));
    },
    async recordAudio(area) {
        if (!navigator.mediaDevices || !window.MediaRecorder) { this.toast('Enregistrement non disponible sur ce navigateur.', 'warning'); return; }
        let stream;
        try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { this.toast('Micro refusé ou introuvable.', 'error'); return; }
        const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
        const rec = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 32000 } : { audioBitsPerSecond: 32000 });
        const chunks = [];
        rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
        let secs = 0, done = false;
        const timer = setInterval(() => { secs++; const t = $('#rec-time'); if (t) t.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`; if (secs >= 90) { const b = $('#rec-stop'); if (b) b.click(); } }, 1000);
        const m = this.openModal({
            title: 'Enregistrement', size: 'narrow',
            body: `<div class="rec-box"><span class="rec-dot"></span><b id="rec-time">0:00</b></div><p class="help" style="text-align:center">Parle près du micro. 90 secondes maximum.</p>`,
            foot: `<button class="btn btn-soft" data-close>Annuler</button><button class="btn btn-primary" id="rec-stop">${ic('check')}Terminer</button>`,
            onClose: () => { clearInterval(timer); if (rec.state !== 'inactive') rec.stop(); stream.getTracks().forEach(t => t.stop()); }
        });
        rec.onstop = async () => {
            if (!done) return;
            const blob = new Blob(chunks, { type: (rec.mimeType || type || 'audio/webm').split(';')[0] });
            if (blob.size > MEDIA_MAX_AUDIO) { this.toast('Enregistrement trop long : raccourcis-le.', 'warning'); return; }
            this.insertAudio(await readAsDataURL(blob), area);
        };
        rec.start();
        $('#rec-stop', m).addEventListener('click', () => { done = true; this.closeModal(m); });
    }
});

/* ---------- KaTeX on demand + media resolution, applied to every card face on screen ---------- */
const Rich = {
    state: 0, queue: false, last: new WeakMap(),
    load() {
        if (this.state) return;
        this.state = 1;
        const css = document.createElement('link');
        css.rel = 'stylesheet'; css.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
        document.head.appendChild(css);
        loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js', 15000)
            .then(() => loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js', 15000))
            .then(() => { this.state = 2; this.schedule(); })
            .catch(() => { this.state = 3; });
    },
    scan() {
        this.queue = false;
        if (typeof app === 'undefined' || !app.data) return;
        app.resolveMedia(document);
        const els = [...document.querySelectorAll('.rich:not([contenteditable]), .missed-item, .tq-stem')].filter(el => /\\\(|\\\[|\$\$/.test(el.textContent) && !el.closest('[contenteditable]'));
        if (!els.length) return;
        if (this.state === 0) this.load();
        if (this.state !== 2 || !window.renderMathInElement) return;
        els.forEach(el => {
            const t = el.textContent;
            if (this.last.get(el) === t) return;
            this.last.set(el, t);
            try { window.renderMathInElement(el, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }], throwOnError: false }); } catch { /* ignore */ }
            this.last.set(el, el.textContent);
        });
    },
    schedule() { if (this.queue) return; this.queue = true; requestAnimationFrame(() => this.scan()); },
    start() { new MutationObserver(() => this.schedule()).observe(document.body, { childList: true, subtree: true }); }
};
Rich.start();
