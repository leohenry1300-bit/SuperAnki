'use strict';

/* ============================================================
   Icons (inline SVG sprite: works offline, no icon font)
   ============================================================ */
const ICONS = {
    logo: '<rect x="3" y="7" width="13" height="14" rx="2.5"/><path d="M8 3h10.5A2.5 2.5 0 0 1 21 5.5V16"/><path d="M6.5 12h6M6.5 16h4"/>',
    home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
    chart: '<path d="M3 3v18h18"/><path d="M8 17v-5M13 17V8M18 17v-8"/>',
    settings: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    folderPlus: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/><path d="M12 10v6M9 13h6"/>',
    import: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    export: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    search: '<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3"/>',
    play: '<path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z" fill="currentColor" stroke="none"/>',
    pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    keyboard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M10 13h4M7 16h10"/>',
    quiz: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8M13 12h8M13 18h8"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9 2h6"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1.2"/><circle cx="17.5" cy="10.5" r="1.2"/><circle cx="8.5" cy="7.5" r="1.2"/><circle cx="6.5" cy="12.5" r="1.2"/><path d="M12 2a10 10 0 0 0 0 20c.9 0 1.7-.7 1.7-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.8-1.7 1.7-1.7H17a5 5 0 0 0 5-5c0-5-4.5-9.4-10-9.4z"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    pin: '<path d="M12 17v5"/><path d="M9 3h6l-1 6 3.5 3.5H6.5L10 9z"/>',
    listOrdered: '<path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
    eraser: '<path d="M4 7V4h16v3"/><path d="M5 20h6"/><path d="M13 4 8 20"/><path d="m15 15 5 5M20 15l-5 5"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    arrowLeft: '<path d="m12 19-7-7 7-7M19 12H5"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    snow: '<path d="M12 2v20M4.9 4.9l14.2 14.2M2 12h20M4.9 19.1 19.1 4.9"/>',
    sparkle: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/>',
    sprout: '<path d="M5 22h14M5 2h14"/><path d="M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22"/><path d="M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    alert: '<path d="m10.3 3.9-8.1 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    refresh: '<path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    check2: '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>'
};
const ic = (name, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${name}"/></svg>`;
function injectSprite() {
    const symbols = Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('');
    document.body.insertAdjacentHTML('afterbegin', `<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">${symbols}</svg>`);
}

/* ============================================================
   Utilities
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const MIN = 60000, DAY = 86400000;
const pad = n => String(n).padStart(2, '0');
let ROLLOVER = 4 * 3600000;
const setRollover = h => { ROLLOVER = clamp(Math.round(num(h, 4)), 0, 12) * 3600000; };
const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayKey = (t = Date.now()) => dateKey(new Date(t - ROLLOVER));
const keyToUTC = k => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const daysBetweenKeys = (a, b) => Math.round((keyToUTC(b) - keyToUTC(a)) / DAY);
const startOfDay = (t = Date.now()) => { const d = new Date(t - ROLLOVER); d.setHours(0, 0, 0, 0); return d.getTime() + ROLLOVER; };
const addDays = (t, n) => { const d = new Date(startOfDay(t) - ROLLOVER); d.setDate(d.getDate() + n); return d.getTime() + ROLLOVER; };
const endOfDay = (t = Date.now()) => addDays(t, 1) - 1;
const num = (v, def = 0) => { const n = Number(v); return Number.isFinite(n) ? n : def; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const plural = (n, one, many) => `${n} ${n > 1 ? (many || one + 's') : one}`;
const uid = (p = 'c') => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
}
function stripHtml(html) {
    if (!html) return '';
    if (!/[<&]/.test(html)) return html;
    const t = document.createElement('template');
    t.innerHTML = String(html).replace(/<(br|\/p|\/div|\/li|\/h\d)[^>]*>/gi, ' $&');
    return (t.content.textContent || '').replace(/\s+/g, ' ').trim();
}
const hasImage = html => /<img\s/i.test(html || '');
const truncate = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
function fmtDays(d) {
    if (d < 30) return `${d} j`;
    if (d < 365) { const m = Math.round(d / 30 * 10) / 10; return `${String(m).replace('.', ',')} mois`; }
    const y = Math.round(d / 365 * 10) / 10; return `${String(y).replace('.', ',')} an${y >= 2 ? 's' : ''}`;
}
function fmtDelay(ms) {
    const m = Math.max(1, Math.round(ms / MIN));
    if (m < 60) return `${m} min`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} h`;
    return fmtDays(Math.round(ms / DAY));
}
function fmtRelativeFuture(t, now = Date.now()) {
    if (t <= now) return 'maintenant';
    const days = daysBetweenKeys(dayKey(now), dayKey(t));
    if (days === 0) return `dans ${fmtDelay(t - now)}`;
    if (days === 1) return 'demain';
    return `dans ${fmtDays(days)}`;
}
function fmtAgo(t) {
    const s = Math.max(0, (Date.now() - t) / 1000);
    if (s < 45) return "à l'instant";
    if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
    if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
    return `il y a ${plural(Math.round(s / 86400), 'jour')}`;
}
const longDate = t => new Date(t).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
function fmtDuration(sec) {
    sec = Math.round(sec);
    if (sec < 60) return `${sec} s`;
    const m = Math.round(sec / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60), r = m % 60;
    return r ? `${h} h ${pad(r)}` : `${h} h`;
}
function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        const cur = [i];
        for (let j = 1; j <= b.length; j++) {
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        prev = cur;
    }
    return prev[b.length];
}
function loadScript(src, timeout = 8000) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src; s.async = true;
        const t = setTimeout(() => reject(new Error('timeout')), timeout);
        s.onload = () => { clearTimeout(t); resolve(); };
        s.onerror = () => { clearTimeout(t); reject(new Error('load error')); };
        document.head.appendChild(s);
    });
}
const readAsDataURL = file => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(file); });
const readAsText = file => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsText(file); });

/* ============================================================
   HTML sanitizer (card content is rendered as HTML)
   ============================================================ */
const SAFE_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'DEL', 'BR', 'P', 'DIV', 'SPAN', 'UL', 'OL', 'LI', 'IMG', 'SUB', 'SUP', 'MARK', 'CODE', 'PRE', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'SMALL', 'A', 'HR', 'FONT', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'AUDIO']);
const DROP_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'LINK', 'META', 'TEMPLATE', 'NOSCRIPT', 'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'VIDEO', 'HEAD', 'TITLE', 'FRAME', 'FRAMESET', 'CANVAS']);
const SAFE_STYLES = ['color', 'background-color', 'font-weight', 'font-style', 'text-decoration', 'text-decoration-line', 'text-align'];
const TAG_RE = /<\/?[a-z][^>]*>/i;
function escapePlain(s) {
    return s.replace(/&(?![a-z]+;|#\d+;|#x[0-9a-f]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}
function sanitizeHtml(html, opts = {}) {
    if (html === null || html === undefined) return '';
    html = String(html);
    if (!/[<>&\n]/.test(html)) return html.trim();
    if (!TAG_RE.test(html)) return escapePlain(html.trim());
    const keepColors = opts.colors !== false;
    const doc = new DOMParser().parseFromString(`<!doctype html><body>${html}</body>`, 'text/html');
    const walk = node => {
        [...node.childNodes].forEach(ch => {
            if (ch.nodeType === 3) return;
            if (ch.nodeType !== 1) { ch.remove(); return; }
            const tag = ch.tagName;
            if (DROP_TAGS.has(tag)) { ch.remove(); return; }
            walk(ch);
            if (!SAFE_TAGS.has(tag)) { ch.replaceWith(...ch.childNodes); return; }
            if (tag === 'IMG') {
                const src = ch.getAttribute('src') || '';
                if (!/^(data:image\/[a-z+.-]+;base64,|https?:\/\/|media:[a-z0-9]+$)/i.test(src)) { ch.remove(); return; }
            }
            if (tag === 'AUDIO') {
                const src = ch.getAttribute('src') || '';
                if (!/^(data:audio\/[a-z0-9.+-]+;base64,|media:[a-z0-9]+$)/i.test(src)) { ch.remove(); return; }
                ch.setAttribute('controls', ''); ch.setAttribute('preload', 'none');
            }
            [...ch.attributes].forEach(a => {
                const n = a.name.toLowerCase();
                if (n === 'style' && tag === 'SPAN' && /^om( on| off| hit)?$/.test(ch.className)) {
                    const kept = ['left', 'top', 'width', 'height'].map(p => { const v = ch.style.getPropertyValue(p); return /^[\d.]+%$/.test(v) ? `${p}:${v}` : ''; }).filter(Boolean).join(';');
                    if (kept) ch.setAttribute('style', kept); else ch.removeAttribute('style');
                } else if (n === 'style') {
                    const kept = SAFE_STYLES.map(p => {
                        if (!keepColors && (p === 'color' || p === 'background-color')) return '';
                        const v = ch.style.getPropertyValue(p);
                        return v && !/url\(|expression|javascript/i.test(v) ? `${p}:${v}` : '';
                    }).filter(Boolean).join(';');
                    if (kept) ch.setAttribute('style', kept); else ch.removeAttribute('style');
                } else if ((tag === 'IMG' && (n === 'src' || n === 'alt')) || (tag === 'AUDIO' && (n === 'src' || n === 'controls' || n === 'preload'))) {
                    /* keep */
                } else if (tag === 'DIV' && n === 'class' && a.value === 'occl') {
                    /* keep (image occlusion) */
                } else if (tag === 'SPAN' && n === 'class' && /^om( on| off| hit)?$/.test(a.value)) {
                    /* keep (image occlusion masks) */
                } else if (tag === 'SPAN' && n === 'class' && /^(cloze|cloze-hide)$/.test(a.value)) {
                    /* keep (cloze deletions) */
                } else if (tag === 'A' && n === 'href') {
                    if (!/^https?:\/\//i.test(a.value)) ch.removeAttribute('href');
                } else if (tag === 'FONT' && n === 'color' && keepColors) {
                    /* keep */
                } else if ((tag === 'TD' || tag === 'TH') && (n === 'colspan' || n === 'rowspan')) {
                    /* keep */
                } else {
                    ch.removeAttribute(a.name);
                }
            });
            if (tag === 'A') { ch.setAttribute('target', '_blank'); ch.setAttribute('rel', 'noopener noreferrer'); }
            if (tag === 'SPAN' && !ch.attributes.length) ch.replaceWith(...ch.childNodes);
            if (tag === 'SPAN' && ch.className === 'cloze-hide') { /* placeholder only */ }
        });
    };
    walk(doc.body);
    return doc.body.innerHTML.replace(/(<br\s*\/?>\s*)+$/i, '').trim();
}
const isBlank = html => !stripHtml(html).trim() && !hasImage(html) && !/<audio\s/i.test(html || '');

/* ============================================================
   Themes & defaults
   ============================================================ */
const THEMES = [
    { id: 'auto', group: 'clair', name: 'Automatique', desc: 'Suit ton appareil', font: 'Inter', p: { bg: 'linear-gradient(90deg,#f5f6fb 50%,#0b1020 50%)', surface: '#ffffff', primary: '#4f46e5', text: '#151a2d', line: '#c7cbe0', hero: 'linear-gradient(135deg,#4f46e5,#7c3aed)' } },
    { id: 'clair', group: 'clair', name: 'Clair', desc: 'Net et lumineux', font: 'Inter', p: { bg: '#f5f6fb', surface: '#ffffff', primary: '#4f46e5', text: '#151a2d', line: '#d7dbe8', hero: 'linear-gradient(135deg,#4f46e5,#7c3aed)' } },
    { id: 'aurore', group: 'clair', name: 'Aurore', desc: 'Verre dépoli, dégradés', font: 'Inter', p: { bg: 'radial-gradient(circle at 20% 20%,#f9a8d4,transparent 50%),radial-gradient(circle at 80% 30%,#a5b4fc,transparent 50%),radial-gradient(circle at 50% 90%,#67e8f9,transparent 55%),#f5f3ff', surface: 'rgba(255,255,255,.6)', primary: '#7c3aed', text: '#1e1b4b', line: 'rgba(255,255,255,.9)', hero: 'linear-gradient(120deg,#7c3aed,#ec4899,#f59e0b)' } },
    { id: 'ocean', group: 'clair', name: 'Océan', desc: 'Bleu frais', font: 'Inter', p: { bg: '#e9f4fb', surface: '#ffffff', primary: '#0284c7', text: '#0b2a3f', line: '#cfe3f1', hero: 'linear-gradient(135deg,#0369a1,#14b8a6)' } },
    { id: 'sakura', group: 'clair', name: 'Sakura', desc: 'Rose tout doux', font: 'Nunito', p: { bg: '#fff4f6', surface: '#ffffff', primary: '#db2777', text: '#4a1d2c', line: '#fbd5de', hero: 'linear-gradient(135deg,#f472b6,#fda4af)' } },
    { id: 'lavande', group: 'clair', name: 'Lavande', desc: 'Violet pastel', font: 'Nunito', p: { bg: '#f4f1fd', surface: '#ffffff', primary: '#7c3aed', text: '#251a45', line: '#e3dbfa', hero: 'linear-gradient(135deg,#7c3aed,#a78bfa)' } },
    { id: 'solaire', group: 'clair', name: 'Solarisé', desc: 'Doux pour les yeux', font: 'Inter', p: { bg: '#fdf6e3', surface: '#fffbef', primary: '#268bd2', text: '#073642', line: '#e6dfc6', hero: 'linear-gradient(135deg,#268bd2,#2aa198)' } },
    { id: 'papier', group: 'clair', name: 'Papier', desc: 'Sépia, typo livre', font: 'Lora', p: { bg: '#efe6d2', surface: '#fbf6ea', primary: '#9a3412', text: '#33271b', line: '#dccdab', hero: '#3b2c1c' } },
    { id: 'cahier', group: 'clair', name: 'Cahier', desc: 'Lignes et écriture', font: 'Patrick Hand', p: { bg: 'repeating-linear-gradient(#fdfdf8 0 9px,#c9dcf3 9px 10px)', surface: '#fffef9', primary: '#2f5bd3', text: '#1f2a44', line: '#d8e3f0', hero: '#fff3a8' } },
    { id: 'nuit', group: 'sombre', name: 'Nuit', desc: 'Sombre et doux', font: 'Inter', p: { bg: '#0b1020', surface: '#131a2e', primary: '#818cf8', text: '#e8ebf5', line: '#2b3553', hero: 'linear-gradient(135deg,#4f46e5,#7c3aed)' } },
    { id: 'oled', group: 'sombre', name: 'Noir OLED', desc: 'Noir pur, économe', font: 'Inter', p: { bg: '#000', surface: '#0b0b0c', primary: '#f4f4f5', text: '#f4f4f5', line: '#27272a', hero: '#0b0b0c' } },
    { id: 'nord', group: 'sombre', name: 'Nordique', desc: 'Bleu glacier apaisant', font: 'Inter', p: { bg: '#2e3440', surface: '#3b4252', primary: '#88c0d0', text: '#eceff4', line: '#4c566a', hero: 'linear-gradient(135deg,#5e81ac,#88c0d0)' } },
    { id: 'dracula', group: 'sombre', name: 'Dracula', desc: 'Le classique des devs', font: 'Inter', p: { bg: '#282a36', surface: '#303241', primary: '#bd93f9', text: '#f8f8f2', line: '#44475a', hero: 'linear-gradient(135deg,#6272a4,#bd93f9,#ff79c6)' } },
    { id: 'foret', group: 'sombre', name: 'Forêt', desc: 'Vert profond', font: 'Nunito', p: { bg: '#0d1712', surface: '#14231b', primary: '#4ade80', text: '#e3f1e8', line: '#2a4636', hero: 'linear-gradient(135deg,#166534,#3f6212)' } },
    { id: 'cafe', group: 'sombre', name: 'Café', desc: 'Brun chaleureux', font: 'Lora', p: { bg: '#1c1512', surface: '#261d18', primary: '#d4a373', text: '#f3e7dc', line: '#3b2e26', hero: 'linear-gradient(135deg,#7f5539,#b08968)' } },
    { id: 'luxe', group: 'sombre', name: 'Luxe', desc: 'Noir et or', font: 'Playfair Display', p: { bg: '#0c0b09', surface: '#15130f', primary: '#d4af37', text: '#f4ecd8', line: '#4a3f2a', hero: 'linear-gradient(135deg,#1d1a15,#2c2416)' } },
    { id: 'neon', group: 'fun', name: 'Néon', desc: 'Cyberpunk lumineux', font: 'Space Grotesk', p: { bg: '#07000f', surface: '#120823', primary: '#ff2bd6', text: '#f5e9ff', line: '#3a1a5c', hero: 'linear-gradient(120deg,#ff2bd6,#7b2bff,#00e5ff)' } },
    { id: 'synthwave', group: 'fun', name: 'Synthwave', desc: 'Coucher de soleil rétro', font: 'Space Grotesk', p: { bg: 'linear-gradient(180deg,#1a0b2e,#53196b)', surface: '#2a1147', primary: '#ff3cac', text: '#fdf0ff', line: '#4b2380', hero: 'linear-gradient(180deg,#ffb800,#ff3cac 55%,#784ba0)' } },
    { id: 'terminal', group: 'fun', name: 'Terminal', desc: 'Rétro, vert sur noir', font: 'JetBrains Mono', p: { bg: '#020a03', surface: '#031205', primary: '#4dff7a', text: '#4dff7a', line: '#0f4a18', hero: '#031205' } },
    { id: 'gameboy', group: 'fun', name: 'Game Boy', desc: '8 bits, 4 couleurs', font: 'VT323', p: { bg: '#9bbc0f', surface: '#8bac0f', primary: '#0f380f', text: '#0f380f', line: '#306230', hero: '#306230' } },
    { id: 'craie', group: 'fun', name: 'Tableau noir', desc: 'Craie sur ardoise', font: 'Patrick Hand', p: { bg: '#1f3a2e', surface: '#25453a', primary: '#f7f3d6', text: '#f1f5ef', line: '#5d8576', hero: '#2b4f42' } },
    { id: 'brutal', group: 'fun', name: 'Brutaliste', desc: 'Contrasté, audacieux', font: 'Space Grotesk', p: { bg: '#fff8e7', surface: '#ffffff', primary: '#ffd400', text: '#111', line: '#111', hero: '#ff5c8a' } },
    { id: 'contraste', group: 'fun', name: 'Contraste élevé', desc: 'Lisibilité maximale', font: 'Inter', p: { bg: '#000', surface: '#000', primary: '#ffff00', text: '#fff', line: '#fff', hero: '#000' } }
];
const THEME_GROUPS = [['clair', 'Clairs'], ['sombre', 'Sombres'], ['fun', 'Originaux']];
const CARD_SIZES = { s: '1.1rem', m: '1.35rem', l: '1.6rem', xl: '1.9rem' };
/* Study options: global defaults, can be overridden per deck (deck.opts) */
const OPT_DEFAULTS = {
    scheduler: 'sm2', retention: 0.9, learnSteps: '1 10', relearnSteps: '10', gradIvl: 1, easyIvl: 4,
    startEase: 2.5, easyBonus: 1.3, hardMult: 1.2, ivlMult: 1, lapseMult: 0.5, maxIvl: 3650,
    leechThreshold: 8, leechAction: 'suspend', newPerDay: 20, maxReviews: 9999,
    minIvl: 1, buryNewSib: true, buryRevSib: true, buryLearnSib: true, newOrder: 'random', newReviewOrder: 'mix', reviewSort: 'random',
    maxAnswerSecs: 60, autoQSecs: 0, autoASecs: 0, autoAAction: 'none', easyDays: '0000000'
};
const DEFAULT_SETTINGS = {
    theme: 'auto', cardSize: 'm', showIntervals: true,
    autoSpeak: false, autoAudio: false, loadBalance: true, filters: [], sessionSize: 0, fsrsW: null, fsrsMeta: null, answerMode: 'flip', learnAhead: 20, cloudSync: true,
    quizCount: 20, writeCount: 20, chronoDuration: 60,
    rolloverHour: 4, syncKey: '', settingsMod: 0, autoBackup: true, libSeen: false, tipsSeen: false, goalName: '', goalDate: '', goals: [], deckSort: 'recent',
    ...OPT_DEFAULTS
};
function parseSteps(str, def) {
    const out = [];
    String(str ?? '').split(/[\s,;]+/).forEach(tok => {
        const m = /^(\d+(?:[.,]\d+)?)(m|min|h|d|j)?$/i.exec(tok.trim());
        if (!m) return;
        const v = parseFloat(m[1].replace(',', '.')) * ({ h: 60, d: 1440, j: 1440 }[(m[2] || 'm').toLowerCase()] || 1);
        if (v > 0 && v <= 60 * 24 * 30) out.push(v);
    });
    return out.length ? out : def;
}
function buildCfg(o) {
    const g = (k, d) => (o[k] === undefined || o[k] === null || o[k] === '' ? d : o[k]);
    return {
        scheduler: g('scheduler', 'sm2') === 'fsrs' ? 'fsrs' : 'sm2',
        retention: clamp(num(g('retention', 0.9), 0.9), 0.7, 0.99),
        learnSteps: parseSteps(g('learnSteps', '1 10'), [1, 10]), relearnSteps: parseSteps(g('relearnSteps', '10'), [10]),
        gradIvl: clamp(Math.round(num(g('gradIvl', 1), 1)), 1, 365), easyIvl: clamp(Math.round(num(g('easyIvl', 4), 4)), 1, 365),
        startEase: clamp(num(g('startEase', 2.5), 2.5), 1.3, 5), easyBonus: clamp(num(g('easyBonus', 1.3), 1.3), 1, 3),
        hardMult: clamp(num(g('hardMult', 1.2), 1.2), 1, 2), ivlMult: clamp(num(g('ivlMult', 1), 1), 0.3, 3),
        lapseMult: clamp(num(g('lapseMult', 0.5), 0.5), 0, 1), maxIvl: clamp(Math.round(num(g('maxIvl', 3650), 3650)), 1, 36500),
        leechThreshold: clamp(Math.round(num(g('leechThreshold', 8), 8)), 0, 99), leechAction: g('leechAction', 'suspend') === 'tag' ? 'tag' : 'suspend',
        minIvl: clamp(Math.round(num(g('minIvl', 1), 1)), 1, 365),
        buryNewSib: g('buryNewSib', true) !== false && g('buryNewSib', true) !== 'false',
        buryRevSib: g('buryRevSib', true) !== false && g('buryRevSib', true) !== 'false',
        buryLearnSib: g('buryLearnSib', true) !== false && g('buryLearnSib', true) !== 'false',
        newOrder: g('newOrder', 'random') === 'ordered' ? 'ordered' : 'random',
        newReviewOrder: ['mix', 'after', 'before'].includes(g('newReviewOrder', 'mix')) ? g('newReviewOrder', 'mix') : 'mix',
        reviewSort: ['due', 'random', 'ivlAsc', 'ivlDesc', 'easeAsc', 'added'].includes(g('reviewSort', 'random')) ? g('reviewSort', 'random') : 'random',
        maxAnswerSecs: clamp(Math.round(num(g('maxAnswerSecs', 60), 60)), 5, 600),
        autoQSecs: clamp(num(g('autoQSecs', 0), 0), 0, 300), autoASecs: clamp(num(g('autoASecs', 0), 0), 0, 300),
        autoAAction: ['none', 'bury', 'again', 'hard', 'good', 'easy'].includes(g('autoAAction', 'none')) ? g('autoAAction', 'none') : 'none',
        easyDays: /^[012]{7}$/.test(String(g('easyDays', '0000000'))) ? String(g('easyDays', '0000000')) : '0000000',
        newPerDay: clamp(Math.round(num(g('newPerDay', 20), 20)), 0, 9999), maxReviews: clamp(Math.round(num(g('maxReviews', 9999), 9999)), 0, 9999),
        fsrsW: Array.isArray(o.fsrsW) && o.fsrsW.length === 19 && o.fsrsW.every(Number.isFinite) ? o.fsrsW : null
    };
}
const DEFAULT_STATS = () => ({
    streak: 0, longestStreak: 0, lastStudyDate: null, freezes: 1,
    newSeen: { date: null, count: 0, by: {} }, revSeen: { date: null, count: 0, by: {} }, history: {}, timeByDay: {}, studySeconds: 0,
    gradeCounts: { 1: 0, 2: 0, 3: 0, 4: 0 }, hourly: new Array(24).fill(0),
    chronoBest: {}, quizBest: 0
});
const EMOJIS = ['📚', '🧠', '💡', '🔬', '🧪', '📜', '🗺️', '🌍', '💰', '🏛️', '⚖️', '💼', '📈', '💻', '🎨', '🎵', '🗣️', '🇬🇧', '🇪🇸', '🩺', '🍳', '🚗', '🏠', '⭐'];
const STATUS = {
    new: { label: 'Nouvelles', one: 'Nouvelle', color: 'var(--new)', icon: 'sparkle' },
    learn: { label: 'En cours', one: 'En cours', color: 'var(--learn)', icon: 'sprout' },
    due: { label: 'À revoir', one: 'À revoir', color: 'var(--due)', icon: 'repeat' },
    mature: { label: 'Maîtrisées', one: 'Maîtrisée', color: 'var(--mature)', icon: 'award' },
    susp: { label: 'Suspendues', one: 'Suspendue', color: '#eab308', icon: 'pause' },
    buried: { label: 'Enfouies', one: 'Enfouie', color: '#94a3b8', icon: 'pause' }
};
const MATURE_IVL = 21;
const REVLOG_MAX = 40000;

/* ============================================================
   Data normalization: survives corrupted / legacy saves
   (the old version crashed because `cards` was not an array)
   ============================================================ */
function toArray(x) {
    if (Array.isArray(x)) return x;
    if (typeof x === 'string') { try { return toArray(JSON.parse(x)); } catch { return []; } }
    if (x && typeof x === 'object') return Object.values(x).flatMap(v => (Array.isArray(v) ? v : [v]));
    return [];
}
function normalizeCard(c) {
    if (!c || typeof c !== 'object') return null;
    const front = sanitizeHtml(c.front ?? c.question ?? c.recto ?? '');
    const back = sanitizeHtml(c.back ?? c.answer ?? c.verso ?? '');
    if (isBlank(front)) return null;
    const reps = num(c.reps ?? c.repetitions, 0);
    const lapses = num(c.lapses ?? c.laps, 0);
    const interval = Math.max(0, num(c.interval, 0));
    let state = c.state;
    if (!['new', 'learning', 'review', 'relearning'].includes(state)) {
        state = reps === 0 && lapses === 0 ? 'new' : interval >= 1 ? 'review' : 'learning';
    }
    let due = typeof c.due === 'number' ? c.due : Date.parse(c.dueDate);
    if (!Number.isFinite(due)) due = Date.now();
    let tags = c.tags;
    if (typeof tags === 'string') tags = tags.split(',');
    tags = toArray(tags).map(t => String(t).trim()).filter(Boolean);
    return {
        id: String(c.id || uid('c')), deckId: String(c.deckId ?? c.deck ?? ''),
        front, back, hint: sanitizeHtml(c.hint || ''), detail: sanitizeHtml(c.detail || ''), tags,
        created: num(c.created, 0), state, step: Math.max(0, num(c.step, 0)), interval,
        ease: clamp(num(c.ease ?? c.easeFactor, 2.5), 1.3, 5), due, reps, lapses,
        lastReview: c.lastReview ? num(c.lastReview, null) : null,
        errors: Math.max(0, num(c.errors, lapses >= 2 ? 1 : 0)), wrong: num(c.wrong, 0), right: num(c.right, 0),
        suspended: !!c.suspended, flag: clamp(Math.round(num(c.flag, 0)), 0, 7), marked: !!c.marked, buriedUntil: num(c.buriedUntil, 0),
        nid: c.nid ? String(c.nid) : '', kind: ['rev', 'cloze', 'occl', 'custom'].includes(c.kind) ? c.kind : 'basic', ord: Math.max(0, num(c.ord, 0)),
        nf: c.nf && typeof c.nf === 'object' ? { front: sanitizeHtml(c.nf.front || ''), back: sanitizeHtml(c.nf.back || ''), text: sanitizeHtml(c.nf.text || ''), extra: sanitizeHtml(c.nf.extra || ''), ...(c.nf.t ? { t: String(c.nf.t), f: Object.fromEntries(Object.entries(c.nf.f && typeof c.nf.f === 'object' ? c.nf.f : {}).map(([k, v]) => [String(k).slice(0, 40), sanitizeHtml(v || '')])) } : {}) } : null,
        fs: c.fs && num(c.fs.s, 0) > 0 ? { s: num(c.fs.s), d: clamp(num(c.fs.d, 5), 1, 10), t: num(c.fs.t, 0) } : null,
        mod: num(c.mod, 0)
    };
}
function normalizeStats(s) {
    const d = DEFAULT_STATS();
    if (!s || typeof s !== 'object') return d;
    const out = Object.assign(d, {
        streak: Math.max(0, num(s.streak, 0)), longestStreak: Math.max(0, num(s.longestStreak, num(s.streak, 0))),
        lastStudyDate: typeof s.lastStudyDate === 'string' ? s.lastStudyDate.slice(0, 10) : null,
        freezes: clamp(num(s.freezes, 1), 0, 2),
        studySeconds: num(s.studySeconds, num(s.totalStudyMinutes, 0) * 60),
        quizBest: num(s.quizBest, 0)
    });
    if (s.newSeen && typeof s.newSeen === 'object') out.newSeen = { date: s.newSeen.date || null, count: num(s.newSeen.count, 0), by: { ...(s.newSeen.by || {}) } };
    else if (s.newSeenDate) out.newSeen = { date: String(s.newSeenDate).slice(0, 10), count: num(s.newSeenToday, 0), by: {} };
    if (s.revSeen && typeof s.revSeen === 'object') out.revSeen = { date: s.revSeen.date || null, count: num(s.revSeen.count, 0), by: { ...(s.revSeen.by || {}) } };
    if (s.history && typeof s.history === 'object') {
        Object.entries(s.history).forEach(([k, v]) => { if (/^\d{4}-\d{2}-\d{2}$/.test(k)) out.history[k] = num(typeof v === 'object' && v ? v.reviews ?? v.n : v, 0); });
    }
    if (s.timeByDay && typeof s.timeByDay === 'object') Object.entries(s.timeByDay).forEach(([k, v]) => { out.timeByDay[k] = num(v, 0); });
    if (s.gradeCounts) [1, 2, 3, 4].forEach(g => { out.gradeCounts[g] = num(s.gradeCounts[g], 0); });
    if (Array.isArray(s.hourly)) out.hourly = Array.from({ length: 24 }, (_, i) => num(s.hourly[i], 0));
    if (typeof s.chronoBest === 'number') out.chronoBest = { 60: s.chronoBest };
    else if (s.chronoBest && typeof s.chronoBest === 'object') Object.entries(s.chronoBest).forEach(([k, v]) => { out.chronoBest[k] = num(v, 0); });
    return out;
}
function normalizeState(raw) {
    if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { return null; } }
    if (!raw || typeof raw !== 'object') return null;
    const seenDecks = new Set();
    const decks = toArray(raw.decks).filter(d => d && typeof d === 'object').map(d => ({
        id: String(d.id || uid('d')), name: String(d.name || d.title || 'Sans nom').slice(0, 80),
        emoji: String(d.emoji || '📁').slice(0, 8), description: String(d.description || '').slice(0, 300), created: num(d.created, 0),
        parent: d.parent ? String(d.parent) : null, opts: d.opts && typeof d.opts === 'object' && Object.keys(d.opts).length ? { ...d.opts } : null, mod: num(d.mod, 0),
        preset: d.preset ? String(d.preset) : null,
        limits: d.limits && typeof d.limits === 'object' ? { ...d.limits } : null
    })).filter(d => (seenDecks.has(d.id) ? false : seenDecks.add(d.id)));
    decks.forEach(d => { if (d.parent && (d.parent === d.id || !seenDecks.has(d.parent))) d.parent = null; });
    decks.forEach(d => { let n = 0, p = d; while (p && p.parent && n++ < 20) p = decks.find(x => x.id === p.parent); if (n >= 20) d.parent = null; });
    const seenCards = new Set();
    const cards = toArray(raw.cards).map(normalizeCard).filter(Boolean).map(c => {
        if (seenCards.has(c.id)) c.id = uid('c');
        seenCards.add(c.id);
        return c;
    });
    const orphans = cards.filter(c => !seenDecks.has(c.deckId));
    if (orphans.length) {
        let misc = decks.find(d => d.id === 'misc');
        if (!misc) { misc = { id: 'misc', name: 'Divers', emoji: '🗂️', description: '', created: Date.now() }; decks.push(misc); }
        orphans.forEach(c => { c.deckId = 'misc'; });
    }
    const settings = Object.assign({}, DEFAULT_SETTINGS, raw.settings && typeof raw.settings === 'object' ? raw.settings : {});
    if (!raw.settings) {
        if (raw.darkMode) settings.theme = 'nuit';
        if (raw.stats && raw.stats.dailyNewGoal) settings.newPerDay = num(raw.stats.dailyNewGoal, 20);
    }
    if (!THEMES.some(t => t.id === settings.theme)) settings.theme = 'auto';
    if (!CARD_SIZES[settings.cardSize]) settings.cardSize = 'm';
    settings.newPerDay = clamp(num(settings.newPerDay, 20), 0, 9999);
    settings.rolloverHour = clamp(Math.round(num(settings.rolloverHour, 4)), 0, 12);
    settings.syncKey = String(settings.syncKey || '');
    if (settings.burySiblings === false) { settings.buryNewSib = settings.buryRevSib = settings.buryLearnSib = false; }
    delete settings.burySiblings;
    if (settings.autoShow > 0 && !settings.autoQSecs) settings.autoQSecs = settings.autoShow;
    delete settings.autoShow;
    const presets = toArray(raw.presets).filter(x => x && x.id && x.name).map(x => ({ id: String(x.id), name: String(x.name).slice(0, 60), opts: x.opts && typeof x.opts === 'object' ? { ...x.opts } : {}, mod: num(x.mod, 0) }));
    decks.forEach(d => {   // older versions kept per-deck overrides: turn them into a preset
        if (!d.opts) return;
        const id = `pm_${d.id}`;
        if (!presets.some(x => x.id === id)) presets.push({ id, name: `Options de ${d.name}`.slice(0, 60), opts: { ...d.opts }, mod: 0 });
        if (!d.preset) d.preset = id;
        d.opts = null;
    });
    decks.forEach(d => { if (d.preset && d.preset !== '__default' && !presets.some(x => x.id === d.preset)) d.preset = null; });
    const deleted = {};
    if (raw.deleted && typeof raw.deleted === 'object') Object.entries(raw.deleted).forEach(([k, v]) => { if (num(v, 0) > 0) deleted[k] = num(v); });
    const revlog = toArray(raw.revlog).filter(r => Array.isArray(r) && r.length >= 4 && Number.isFinite(r[0])).slice(-REVLOG_MAX);
    return { version: 6, decks, cards, presets, stats: normalizeStats(raw.stats), settings, revlog, deleted, toeic: normalizeToeic(raw.toeic), media: normalizeMedia(raw.media), noteTypes: normalizeNoteTypes(raw.noteTypes), trash: normalizeTrash(raw.trash), updatedAt: num(raw.updatedAt, 0) };
}
function cardSig(c) {
    return [c.deckId, c.state, c.step, c.due, c.interval, c.ease, c.reps, c.lapses, c.suspended ? 1 : 0, c.flag, c.marked ? 1 : 0, c.buriedUntil, c.errors, c.wrong, c.right,
        c.front.length, c.back.length, c.hint.length, c.detail.length, c.tags.join(','), c.fs ? c.fs.s.toFixed(3) : '', c.lastReview, c.nid, c.kind, c.ord, c.kind === 'occl' && c.nf ? mediaHash(c.nf.back + c.nf.front) : c.kind === 'custom' && c.nf ? mediaHash(c.nf.t + JSON.stringify(c.nf.f)) : ''].join('|');
}
const deckSig = d => JSON.stringify([d.name, d.emoji, d.description, d.parent, d.preset, d.limits]);
const presetSig = p => JSON.stringify([p.name, p.opts]);
function seedState() {
    const now = Date.now();
    return normalizeState({
        decks: SEED_DECKS,
        cards: SEED_CARDS_RAW.map((c, i) => ({ ...c, created: now + i, dueDate: null, due: now })),
        settings: DEFAULT_SETTINGS, updatedAt: 0
    });
}

/* ============================================================
   Local storage layer: IndexedDB (large quota, images ok)
   with localStorage fallback
   ============================================================ */
const TOEIC_PRESET_ID = 'p_toeic_fsrs';
const LEGACY_KEY = 'superanki_pro_state_v3';
const LS_KEY = 'superanki_pro_v4';
const Storage = {
    db: null,
    async init() {
        try {
            this.db = await new Promise((resolve, reject) => {
                const req = indexedDB.open('superanki_pro', 1);
                req.onupgradeneeded = () => req.result.createObjectStore('kv');
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
                setTimeout(() => reject(new Error('idb timeout')), 4000);
            });
        } catch (e) { this.db = null; }
    },
    tx(mode, fn) {
        return new Promise((resolve, reject) => {
            const t = this.db.transaction('kv', mode);
            const req = fn(t.objectStore('kv'));
            t.oncomplete = () => resolve(req && req.result);
            t.onerror = () => reject(t.error);
            t.onabort = () => reject(t.error);
        });
    },
    async load() {
        if (this.db) { try { const v = await this.tx('readonly', s => s.get('state')); if (v) return v; } catch (e) { /* fall through */ } }
        try { return localStorage.getItem(LS_KEY); } catch { return null; }
    },
    async save(json) {
        if (this.db) {
            await this.tx('readwrite', s => s.put(json, 'state'));
            try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
            return;
        }
        localStorage.setItem(LS_KEY, json);
    },
    legacy() { try { return localStorage.getItem(LEGACY_KEY); } catch { return null; } },
    async backups() {
        if (!this.db) return [];
        try { return JSON.parse((await this.tx('readonly', st => st.get('backups'))) || '[]'); } catch { return []; }
    },
    async backupSave(label, json, data) {
        const key = `backup:${Date.now()}`, meta = await this.backups();
        await this.tx('readwrite', st => st.put(json, key));
        meta.push({ key, label, at: Date.now(), cards: data.cards.length, decks: data.decks.length, size: json.length });
        const drop = new Set(meta.filter(b => b.label === 'auto').sort((a, b) => b.at - a.at).slice(7).map(b => b.key));
        let kept = meta.filter(b => !drop.has(b.key)).sort((a, b) => b.at - a.at);
        kept.slice(14).forEach(b => drop.add(b.key));
        kept = kept.slice(0, 14);
        await this.tx('readwrite', st => { drop.forEach(k => st.delete(k)); st.put(JSON.stringify(kept), 'backups'); });
        return key;
    },
    async backupLoad(key) { return this.db ? this.tx('readonly', st => st.get(key)) : null; },
    async backupDelete(key) {
        const meta = (await this.backups()).filter(b => b.key !== key);
        await this.tx('readwrite', st => { st.delete(key); st.put(JSON.stringify(meta), 'backups'); });
    }
};

/* ============================================================
   Spaced repetition (SM-2 as in Anki, with learning steps)
   ============================================================ */
/* "Easy days": among the days a card could land on, prefer weekdays you marked as normal over reduced / minimum ones */
let SCHED_LOAD = null;   // Map(start of day -> review cards already due that day), set while answering when load balancing is on
function pickEasyDay(ivl, base, now, easyDays) {
    const easy = easyDays && easyDays !== '0000000';
    if ((!easy && !SCHED_LOAD) || base < 3) return ivl;
    const spread = Math.max(1, Math.round(base * 0.05));
    let best = ivl, bestW = -1, bestL = Infinity;
    for (let d = Math.max(1, ivl - spread); d <= ivl + spread; d++) {
        const day = addDays(now, d), wd = new Date(day).getDay(), w = easy ? ([2, 1, 0][Number(easyDays[wd])] ?? 2) : 0;
        const load = SCHED_LOAD ? (SCHED_LOAD.get(startOfDay(day)) || 0) : 0;
        const better = w > bestW || (w === bestW && (load < bestL || (load === bestL && Math.abs(d - base) < Math.abs(best - base))));
        if (better) { best = d; bestW = w; bestL = load; }
    }
    return best;
}
function fuzzIvl(ivl) {
    if (ivl < 3) return ivl;
    const f = Math.max(1, Math.round(ivl * 0.05));
    return ivl + Math.floor(Math.random() * (2 * f + 1)) - f;
}
/* Returns the new scheduling fields for `card` after answering `grade` (1 = raté .. 4 = facile). */
function schedule(card, grade, now = Date.now(), useFuzz = false, cfg = buildCfg(OPT_DEFAULTS)) {
    const fsr = cfg.scheduler === 'fsrs';
    cfg = cfg.fsrsW ? { ...cfg, w: cfg.fsrsW } : cfg;
    const r = { state: card.state, step: card.step || 0, interval: card.interval || 0, ease: card.ease || 2.5, lapses: card.lapses || 0, due: card.due, fs: card.fs || null };
    const inMin = m => now + Math.round(m * MIN);
    let fs = fsr ? fsrsFromCard(card) : null;
    const finish = ivl => {
        ivl = clamp(Math.round(useFuzz ? pickEasyDay(fuzzIvl(ivl), ivl, now, cfg.easyDays) : ivl), 1, cfg.maxIvl);
        r.state = 'review'; r.step = 0; r.interval = ivl; r.due = addDays(now, ivl);
    };
    const keepFs = () => { if (fs) r.fs = { s: fs.s, d: fs.d, t: now }; };
    if (r.state === 'new' || r.state === 'learning') {
        const steps = cfg.learnSteps;
        if (r.state === 'new') r.ease = cfg.startEase;
        const cur = steps[Math.min(r.step, steps.length - 1)];
        if (fsr) {
            if (!fs || r.state === 'new') fs = { s: fsrsInitS(grade, cfg.w), d: fsrsInitD(grade, cfg.w), t: now };
            else { fs.s = fsrsShortS(fs.s, grade, cfg.w); fs.d = fsrsNextD(fs.d, grade, cfg.w); }
            keepFs();
        }
        /* FSRS would jump straight to ~4 days (Good) or ~16 days (Easy) on a card seen for the first time: the first interval is
           capped by the preset's "graduating" (Good) / "easy" intervals (1 and 4 days by default). The memory state is kept as is. */
        const grad = g => finish(fsr ? Math.max(1, Math.min(fsrsIvl(fs.s, cfg.retention), g === 4 ? cfg.easyIvl : cfg.gradIvl)) : (g === 4 ? cfg.easyIvl : cfg.gradIvl));
        if (grade === 1) { r.state = 'learning'; r.step = 0; r.due = inMin(steps[0]); }
        else if (grade === 2) { r.state = 'learning'; r.due = inMin(r.step === 0 && steps[1] ? (steps[0] + steps[1]) / 2 : cur); }
        else if (grade === 3) {
            if (r.step + 1 < steps.length) { r.state = 'learning'; r.step++; r.due = inMin(steps[r.step]); }
            else grad(3);
        } else grad(4);
    } else if (r.state === 'relearning') {
        const steps = cfg.relearnSteps;
        if (fsr && fs) { fs.s = fsrsShortS(fs.s, grade, cfg.w); fs.d = fsrsNextD(fs.d, grade, cfg.w); keepFs(); }
        const back = bonus => finish(fsr && fs ? Math.max(1, fsrsIvl(fs.s, cfg.retention)) : Math.max(1, r.interval) + bonus);
        if (grade === 1) { r.step = 0; r.due = inMin(steps[0]); }
        else if (grade === 2) { r.due = inMin(steps[Math.min(r.step, steps.length - 1)]); }
        else if (grade === 3) {
            if (r.step + 1 < steps.length) { r.step++; r.due = inMin(steps[r.step]); }
            else back(0);
        } else back(1);
    } else {
        const ivl = Math.max(1, r.interval);
        const elapsed = card.lastReview ? (now - card.lastReview) / DAY : ivl;
        const delay = Math.max(0, elapsed - ivl);
        if (fsr) {
            if (!fs) fs = { s: ivl, d: 5, t: now };
            const rr = fsrsR(card.lastReview ? elapsed : ivl, fs.s);
            if (grade === 1) {
                r.lapses++;
                fs = { s: fsrsForgetS(fs.s, fs.d, rr, cfg.w), d: fsrsNextD(fs.d, 1, cfg.w), t: now };
                r.interval = clamp(Math.round(fsrsIvl(fs.s, cfg.retention)), cfg.minIvl, cfg.maxIvl);
                r.state = 'relearning'; r.step = 0; r.due = inMin(cfg.relearnSteps[0]);
                keepFs();
            } else {
                const raw = g => Math.round(clamp(fsrsIvl(fsrsRecallS(fs.s, fs.d, rr, g, cfg.w), cfg.retention) * cfg.ivlMult, 1, cfg.maxIvl));
                let hard = raw(2), good = raw(3), easy = raw(4);
                hard = Math.min(hard, good); good = Math.max(good, hard + 1); easy = Math.max(easy, good + 1);
                const ivlFor = { 2: hard, 3: good, 4: easy }[grade];
                fs = { s: fsrsRecallS(fs.s, fs.d, rr, grade, cfg.w), d: fsrsNextD(fs.d, grade, cfg.w), t: now };
                keepFs();
                finish(Math.min(ivlFor, cfg.maxIvl));
            }
        } else if (grade === 1) {
            r.lapses++;
            r.ease = Math.max(1.3, r.ease - 0.2);
            r.interval = Math.max(cfg.minIvl, Math.round(ivl * cfg.lapseMult));
            r.state = 'relearning'; r.step = 0; r.due = inMin(cfg.relearnSteps[0]);
        } else {
            const hard = Math.max(ivl + 1, Math.round(ivl * cfg.hardMult * cfg.ivlMult));
            const good = Math.max(hard + 1, Math.round((ivl + delay / 2) * r.ease * cfg.ivlMult));
            const easy = Math.max(good + 1, Math.round((ivl + delay) * r.ease * cfg.easyBonus * cfg.ivlMult));
            if (grade === 2) { r.ease = Math.max(1.3, r.ease - 0.15); finish(hard); }
            else if (grade === 3) finish(good);
            else { r.ease = r.ease + 0.15; finish(easy); }
        }
    }
    return r;
}
function previewLabel(card, grade, now, cfg) {
    const r = schedule(card, grade, now, false, cfg);
    return r.state === 'review' ? fmtDays(r.interval) : fmtDelay(r.due - now);
}
function cardStatus(c, now, eod) {
    if (c.suspended) return 'susp';
    if (c.buriedUntil > now) return 'buried';
    if (c.state === 'new') return 'new';
    if (c.state === 'review' ? c.due <= eod : c.due <= now) return 'due';
    if (c.state === 'review' && c.interval >= MATURE_IVL) return 'mature';
    return 'learn';
}

/* Answer checking for "Écrire" */
const STOP = new Set('le la les un une des de du d l et ou a au aux en dans sur par pour avec sans ce ces cet cette est sont qui que quoi dont se sa son ses leur leurs plus moins ne pas the of and or to in is are'.split(' '));
const normAnswer = s => fold(stripHtml(s)).replace(/[^a-z0-9]+/g, ' ').trim();
function checkAnswer(typed, correctHtml) {
    const t = normAnswer(typed), c = normAnswer(correctHtml);
    if (!t) return { verdict: 'bad', score: 0 };
    const cWords = c.split(' ').filter(Boolean);
    if (cWords.length <= 6) {
        const sim = 1 - levenshtein(t, c) / Math.max(t.length, c.length, 1);
        const contains = c.length >= 3 && (t.includes(c) || (t.length >= 4 && c.includes(t) && t.length / c.length > 0.6));
        const score = contains ? Math.max(sim, 0.9) : sim;
        return { verdict: score >= 0.85 ? 'ok' : score >= 0.6 ? 'close' : 'bad', score };
    }
    const keys = [...new Set(cWords.filter(w => w.length >= 4 && !STOP.has(w)))];
    if (!keys.length) return { verdict: t === c ? 'ok' : 'close', score: t === c ? 1 : 0.5 };
    const tWords = t.split(' ');
    const found = keys.filter(k => tWords.some(w => w === k || (k.length >= 5 && w.length >= 4 && levenshtein(w, k) <= 1) || (w.length >= 5 && k.startsWith(w.slice(0, 5)))));
    const score = found.length / keys.length;
    return { verdict: score >= 0.7 ? 'ok' : score >= 0.35 ? 'close' : 'bad', score, found, keys };
}

/* ============================================================
   Application
   ============================================================ */
class SuperAnki {
    constructor() {
        this.data = null;
        this.view = 'dashboard';
        this.ui = { deck: 'all', filter: 'all', search: '', sort: 'auto', limit: 60, selMode: false, sel: new Set() };
        this.session = null;
        this.modals = [];
        this.saveTimer = null;
        this.editorRange = null;
        this.imageTarget = null;
        this.saveErrorShown = false;
        this.searchCache = new Map();
        this.cfgCache = new Map();
        this.sigs = new Map(); this.dsigs = new Map();
        this.undoStack = []; this.redoStack = [];
        this.chartDefs = {};
        this.statsUi = { deck: 'all', fcRange: 31, fcCumul: true, rvRange: 30, rvTime: false, ivRange: '1m', hrRange: 30, btRange: 30, adRange: 30, calYear: new Date().getFullYear(), hidden: {} };
    }

    /* One-time split: the library's BUT TC cards are renamed "Fiches génériques" (same ids, so progress is kept),
       and an empty "Mes cours BUT TC" deck with S1-S6 is created for the user's own courses. */
    migrateButTc() {
        const st = this.data.settings;
        if (st.butTcSplit) return;
        st.butTcSplit = true;
        const old = this.deck('pk_g_buttc');
        if (old && old.name === 'BUT TC') { old.name = 'BUT TC · Fiches génériques'; if (old.emoji === '🎓') old.emoji = '📚'; old.description = PACK_GROUPS.buttc.desc; }
        if (!this.deck('mes_but_tc')) {
            const now = Date.now(), mk = (id, name, emoji, parent, description = '') => this.data.decks.push({ id, name, emoji, description, created: now, parent, opts: null, mod: 0, preset: null, limits: null });
            mk('mes_but_tc', 'Mes cours BUT TC', '🎓', null, 'Tes propres cours, semestre par semestre.');
            for (let i = 1; i <= 6; i++) mk(`mes_but_tc_s${i}`, `Semestre ${i}`, '📘', 'mes_but_tc');
        }
        this.save();
    }

    /* One-time: course cards written from the user's own course material (content/courses) are added under
       "Mes cours BUT TC > Semestre N", with a saved filter to revise the whole course in one go. */
    migrateCourses() {
        const st = this.data.settings;
        /* course decks that were withdrawn (not based on the user's own course material): removed once from this device */
        ['logsc', 'incosc', 'tdach'].forEach(id => {
            const flag = `course_retired_${id}`;
            if (st[flag]) return;
            st[flag] = true;
            const dids = new Set(this.data.decks.filter(d => d.id === `co_${id}` || d.id.startsWith(`co_${id}_d`)).map(d => d.id));
            if (dids.size) {
                this.data.cards = this.data.cards.filter(c => !dids.has(c.deckId));
                this.data.decks = this.data.decks.filter(d => !dids.has(d.id));
            }
            if (Array.isArray(st.filters)) st.filters = st.filters.filter(f => f.id !== `flt_${id}`);
        });
        (typeof COURSES === 'undefined' ? [] : COURSES).forEach(co => {
            const flag = `course_${co.id}`;
            if (st[flag]) return;
            st[flag] = true;
            const now = Date.now(), have = new Set(this.data.cards.map(c => c.id));
            const ensure = (id, name, emoji, parent, description = '') => { if (!this.deck(id)) this.data.decks.push({ id, name, emoji, description, created: now, parent, opts: null, mod: 0, preset: null, limits: null }); return id; };
            ensure('mes_but_tc', 'Mes cours BUT TC', '🎓', null, 'Tes propres cours, semestre par semestre.');
            const sem = co.parent || 'mes_but_tc_s5';
            ensure(sem, `Semestre ${sem.slice(-1)}`, '📘', 'mes_but_tc');
            const root = ensure(`co_${co.id}`, co.title, co.emoji, sem, co.desc);
            let n = 0;
            co.decks.forEach((sd, si) => {
                const did = ensure(`co_${co.id}_d${si}`, sd.name, sd.emoji, root);
                sd.cards.forEach(c => {
                    n++;
                    const base = { ...freshCard(), deckId: did, tags: [...co.tags], hint: '', detail: '', created: now + n, nid: '', kind: 'basic', ord: 0, nf: null };
                    if (c[0] === 'b') {
                        const id = `co_${co.id}_${n}`;
                        if (!have.has(id)) this.data.cards.push({ ...base, id, front: sanitizeHtml(c[1]), back: sanitizeHtml(c[2]), hint: sanitizeHtml(c[3] || '') });
                    } else {
                        const nid = `co_${co.id}_${n}n`;
                        clozeNumbers(c[1]).forEach(k => {
                            const id = `co_${co.id}_${n}_c${k}`;
                            if (have.has(id)) return;
                            const card = { ...base, id, nid, kind: 'cloze', ord: k, front: '', back: '', nf: { front: '', back: '', text: sanitizeHtml(c[1]), extra: sanitizeHtml(c[2] || '') } };
                            materializeCard(card);
                            this.data.cards.push(card);
                        });
                    }
                });
            });
            if (!st.pinInit) { st.pinInit = true; st.pinnedDecks = [...(st.pinnedDecks || []), 'mes_but_tc']; }
            const fid = `flt_${co.id}`;
            if (!Array.isArray(st.filters)) st.filters = [];
            if (!st.filters.some(f => f.id === fid)) st.filters.push({ id: fid, name: `${co.title.split(' · ')[0]} · révision complète`, query: `tag:${co.tags[co.tags.length - 1]}`, order: 'random', limit: 400 });
        });
        this.save();
    }

    /* One-time: English / TOEIC decks use FSRS at 90 % retention (cards already reviewed with SM-2 are converted on the fly). */
    migrateTunedPreset() {
        const st = this.data.settings;
        if (st.presetToeicV1) return;
        st.presetToeicV1 = true;
        if (!this.data.presets.some(x => x.id === TOEIC_PRESET_ID)) this.data.presets.push({ id: TOEIC_PRESET_ID, name: 'TOEIC et anglais · FSRS 90 %', opts: { scheduler: 'fsrs', retention: 0.9 }, mod: 0 });
        ['pk_g_anglais', 'toeic_err'].forEach(id => { const d = this.deck(id); if (d && !d.preset) d.preset = TOEIC_PRESET_ID; });
        this.save();
    }

    /* ---------- boot ---------- */
    async init() {
        injectSprite();
        this.bindGlobalEvents();
        await Storage.init();
        let data = null, source = 'seed';
        try {
            const stored = await Storage.load();
            if (stored) { data = normalizeState(stored); source = 'local'; }
        } catch (e) { console.error(e); }
        if (!data) {
            const legacy = Storage.legacy();
            if (legacy) { data = normalizeState(legacy); source = 'legacy'; }
        }
        if (!data || !data.cards.length && !data.decks.length) { data = seedState(); source = 'seed'; }
        this.data = data;
        this.gcMedia(data);
        this.applySettings();
        this.initSigs();
        this.migrateButTc();
        this.migrateCourses();
        this.migrateTunedPreset();
        this.checkStreak();
        this.writeNow();
        this.autoBackup(source);
        $('#boot').remove();
        this.go('dashboard');
        if (source === 'legacy') this.toast('Tes cartes et ta progression ont été récupérées', 'success');
        this.focusInit();
        this.extrasInit();
        this.ambInit();
        if (this.data.settings.cloudSync) Cloud.sync();
        else Cloud.setStatus('off');
    }

    serialize() {
        const { version, decks, cards, presets, stats, settings, revlog, deleted, toeic, media, noteTypes, trash, updatedAt } = this.data;
        return JSON.stringify({ version, decks, cards, presets, stats, settings, revlog, deleted, toeic, media, noteTypes, trash, updatedAt });
    }
    /* Change tracking: per-card modification times let two devices merge instead of overwriting each other */
    initSigs() {
        this.sigs = new Map(this.data.cards.map(c => [c.id, cardSig(c)]));
        this.refs = new Map(this.data.cards.map(c => [c.id, c]));
        this.drefs = new Map(this.data.decks.map(d => [d.id, d]));
        this.dsigs = new Map([...this.data.decks.map(d => [d.id, deckSig(d)]), ...this.data.presets.map(x => [x.id, presetSig(x)]), ...this.data.noteTypes.map(x => [x.id, noteTypeSig(x)])]);
    }
    detectChanges(now) {
        const d = this.data, seen = new Set();
        d.cards.forEach(c => {
            seen.add(c.id);
            const sig = cardSig(c);
            if (this.sigs.get(c.id) !== sig) { c.mod = now; this.sigs.set(c.id, sig); delete d.deleted[c.id]; if (d.trash.length) this.trashDrop('card', c.id); }
            this.refs.set(c.id, c);
        });
        [...this.sigs.keys()].forEach(id => { if (!seen.has(id)) { this.sigs.delete(id); d.deleted[id] = now; const gone = this.refs.get(id); if (gone) this.trashAdd('card', gone, now); this.refs.delete(id); } });
        const seenD = new Set();
        d.decks.forEach(k => {
            seenD.add(k.id);
            const sig = deckSig(k);
            if (this.dsigs.get(k.id) !== sig) { k.mod = now; this.dsigs.set(k.id, sig); delete d.deleted[k.id]; if (d.trash.length) this.trashDrop('deck', k.id); }
            this.drefs.set(k.id, k);
        });
        d.presets.forEach(x => {
            seenD.add(x.id);
            const sig = presetSig(x);
            if (this.dsigs.get(x.id) !== sig) { x.mod = now; this.dsigs.set(x.id, sig); delete d.deleted[x.id]; }
        });
        d.noteTypes.forEach(x => {
            seenD.add(x.id);
            const sig = noteTypeSig(x);
            if (this.dsigs.get(x.id) !== sig) { x.mod = now; this.dsigs.set(x.id, sig); delete d.deleted[x.id]; }
        });
        [...this.dsigs.keys()].forEach(id => { if (!seenD.has(id) && this.drefs.has(id)) { this.trashAdd('deck', this.drefs.get(id), now); this.drefs.delete(id); } });
        [...this.dsigs.keys()].forEach(id => { if (!seenD.has(id)) { this.dsigs.delete(id); d.deleted[id] = now; } });
        const keys = Object.keys(d.deleted);
        if (keys.length > 6000) keys.sort((a, b) => d.deleted[a] - d.deleted[b]).slice(0, keys.length - 5000).forEach(k => delete d.deleted[k]);
    }
    save(sync = true) {
        this.data.updatedAt = Date.now();
        this.detectChanges(this.data.updatedAt);
        this.cfgCache.clear();
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.writeNow(), 250);
        if (sync) Cloud.schedulePush();
    }
    async writeNow() {
        clearTimeout(this.saveTimer);
        this.saveTimer = null;
        try {
            await Storage.save(this.serialize());
            this.saveErrorShown = false;
        } catch (e) {
            console.error(e);
            if (!this.saveErrorShown) {
                this.saveErrorShown = true;
                this.toast('Enregistrement impossible : stockage du navigateur plein ou bloqué. Exporte une sauvegarde.', 'error');
            }
        }
    }
    applyMerged(merged) {
        this.data = merged;
        this.searchCache.clear(); this.cfgCache.clear();
        this.initSigs();
        this.applySettings();
        this.checkStreak();
        this.writeNow();
        this.render();
    }
    replaceData(newData, sync = true) {
        this.data = newData;
        this.searchCache.clear(); this.cfgCache.clear();
        this.undoStack = []; this.redoStack = [];
        this.initSigs();
        this.applySettings();
        this.checkStreak();
        this.writeNow();
        if (sync) Cloud.schedulePush();
        if (this.session) this.endSession(false);
        this.render();
    }

    /* ---------- settings / theme ---------- */
    applySettings() {
        const s = this.data.settings;
        setRollover(s.rolloverHour);
        fsrsApplyParams(s.fsrsW);
        const resolved = s.theme === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'nuit' : 'clair') : s.theme;
        document.documentElement.dataset.theme = resolved;
        document.documentElement.style.setProperty('--card-size', CARD_SIZES[s.cardSize] || CARD_SIZES.m);
        requestAnimationFrame(() => {
            const meta = $('meta[name="theme-color"]');
            if (meta) meta.content = getComputedStyle(document.body).getPropertyValue('--surface').trim() || '#ffffff';
        });
    }
    setSetting(key, value) {
        this.data.settings[key] = value;
        this.data.settings.settingsMod = Date.now();
        this.save();
        this.applySettings();
    }

    /* ---------- streak ---------- */
    checkStreak() {
        const st = this.data.stats, today = dayKey();
        this.rollSeen();
        if (!st.lastStudyDate || st.lastStudyDate === today) return;
        const gap = daysBetweenKeys(st.lastStudyDate, today);
        if (gap <= 1) return;
        const missed = gap - 1;
        if (st.streak > 0 && st.freezes >= missed) {
            st.freezes -= missed;
            st.lastStudyDate = dayKey(Date.now() - DAY);
            setTimeout(() => this.toast(`${plural(missed, 'gel de série utilisé')} : ta série de ${st.streak} j tient bon`, 'success', ic('snow')), 600);
        } else if (st.streak > 0) {
            setTimeout(() => this.toast(`Série de ${st.streak} j interrompue. On repart !`, 'warning', ic('flame')), 600);
            st.streak = 0;
        }
    }
    recordStudyDay() {
        const st = this.data.stats, today = dayKey();
        if (st.lastStudyDate === today) return;
        const gap = st.lastStudyDate ? daysBetweenKeys(st.lastStudyDate, today) : null;
        st.streak = gap === 1 ? st.streak + 1 : 1;
        st.lastStudyDate = today;
        st.longestStreak = Math.max(st.longestStreak, st.streak);
        if (st.streak > 0 && st.streak % 7 === 0 && st.freezes < 2) {
            st.freezes++;
            this.toast(`${st.streak} jours de suite ! +1 gel de série`, 'success', ic('snow'));
        }
        this.renderStreak();
    }
    recordReview(grade, seconds) {
        const st = this.data.stats, today = dayKey();
        st.history[today] = (st.history[today] || 0) + 1;
        st.timeByDay[today] = (st.timeByDay[today] || 0) + seconds;
        st.studySeconds += seconds;
        if (grade) st.gradeCounts[grade] = (st.gradeCounts[grade] || 0) + 1;
        st.hourly[new Date().getHours()]++;
        this.recordStudyDay();
    }

    /* ---------- data helpers ---------- */
    card(id) { return this.data.cards.find(c => c.id === id); }
    deck(id) { return this.data.decks.find(d => d.id === id); }
    descendantIds(id) {
        const out = [id];
        for (let i = 0; i < out.length; i++) this.data.decks.forEach(d => { if (d.parent === out[i] && !out.includes(d.id)) out.push(d.id); });
        return out;
    }
    deckChain(id) {
        const chain = []; let d = this.deck(id), n = 0;
        while (d && n++ < 20) { chain.unshift(d); d = d.parent ? this.deck(d.parent) : null; }
        return chain;
    }
    deckPath(id) { return this.deckChain(id).map(d => d.name).join(' › '); }
    deckDepth(id) { return Math.max(0, this.deckChain(id).length - 1); }
    deckLabel(d) { return `${d.emoji} ${this.deckPath(d.id)}`; }
    sortedDecks() {
        const by = new Map();
        this.data.decks.forEach(d => { const k = d.parent || ''; if (!by.has(k)) by.set(k, []); by.get(k).push(d); });
        const out = [], visit = k => (by.get(k) || []).sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base', numeric: true })).forEach(d => { out.push(d); visit(d.id); });
        visit('');
        return out;
    }
    cardsOf(deckId) {
        if (!deckId) return this.data.cards;
        const set = new Set(this.descendantIds(deckId));
        return this.data.cards.filter(c => set.has(c.deckId));
    }
    errorCards() { return this.data.cards.filter(c => c.errors > 0 && !c.suspended); }
    childrenOf(id) {
        return this.data.decks.filter(d => (d.parent || null) === (id || null)).sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base', numeric: true }));
    }
    /* One pass over all cards: per deck, counts including every sub-deck below it */
    deckStats() {
        const now = Date.now(), eod = endOfDay(now), by = new Map(this.data.decks.map(d => [d.id, d])), out = new Map();
        by.forEach((d, id) => out.set(id, { total: 0, seen: 0, new: 0, learn: 0, due: 0, mature: 0, susp: 0 }));
        this.data.cards.forEach(c => {
            const k = c.state === 'new' ? 'new' : c.state === 'review' ? (c.due <= eod ? 'due' : c.interval >= MATURE_IVL ? 'mature' : 'learn') : (c.due <= now ? 'due' : 'learn');
            let d = by.get(c.deckId), n = 0;
            while (d && n++ < 10) {
                const st = out.get(d.id);
                st.total++; st[k]++; if (k !== 'new') st.seen++; if (c.suspended) st.susp++;
                d = d.parent ? by.get(d.parent) : null;
            }
        });
        return out;
    }
    progressHtml(st, cls = '') {
        const t = st.total || 1;
        return `<div class="progress ${cls}" title="Maîtrisées ${st.mature} · En cours ${st.learn} · À revoir ${st.due} · Nouvelles ${st.new}"><i style="width:${st.mature / t * 100}%;background:var(--mature)"></i><i style="width:${st.learn / t * 100}%;background:var(--learn)"></i><i style="width:${st.due / t * 100}%;background:var(--due)"></i></div>`;
    }
    pctSeen(st) { return st.total ? Math.round(st.seen / st.total * 100) : 0; }
    pctMature(st) { return st.total ? Math.round(st.mature / st.total * 100) : 0; }
    /* open / closed state of the deck trees (sidebar + dashboard), remembered on this device */
    openSet(key) {
        if (!this._open) { try { this._open = JSON.parse(localStorage.getItem('superanki_open') || '{}'); } catch { this._open = {}; } }
        if (!this._openSets) this._openSets = {};
        if (!this._openSets[key]) this._openSets[key] = new Set(this._open[key] || []);
        return this._openSets[key];
    }
    toggleOpen(key, id) {
        const set = this.openSet(key);
        set.has(id) ? set.delete(id) : set.add(id);
        this.saveOpen();
    }
    saveOpen() {
        const o = {}; Object.entries(this._openSets || {}).forEach(([k, v]) => { o[k] = [...v]; });
        try { localStorage.setItem('superanki_open', JSON.stringify(o)); } catch { /* ignore */ }
    }
    setAllOpen(key, open) {
        const set = this.openSet(key);
        set.clear();
        if (open) this.data.decks.forEach(d => { if (this.childrenOf(d.id).length) set.add(d.id); });
        this.saveOpen();
    }
    /* Study options: the "default" preset lives in the settings; other presets are assigned to decks
       (a deck inherits the preset of its nearest ancestor that has one). */
    presetIdFor(deckId) {
        const chain = this.deckChain(deckId);
        for (let i = chain.length - 1; i >= 0; i--) if (chain[i].preset) return chain[i].preset === '__default' ? '' : chain[i].preset;
        return '';
    }
    defaultOpts() { const o = {}; Object.keys(OPT_DEFAULTS).forEach(k => { o[k] = this.data.settings[k]; }); return o; }
    optsOfPreset(id) { const p = id && this.data.presets.find(x => x.id === id); return { ...this.defaultOpts(), fsrsW: this.data.settings.fsrsW, ...(p ? p.opts : {}) }; }
    deckCfg(deckId) {
        let cfg = this.cfgCache.get(deckId);
        if (cfg) return cfg;
        cfg = buildCfg(this.optsOfPreset(this.presetIdFor(deckId)));
        this.cfgCache.set(deckId, cfg);
        return cfg;
    }
    defaultCfg() { return buildCfg(this.defaultOpts()); }
    cfgFor(card) { return this.deckCfg(card.deckId); }
    /* Daily limit set for one deck itself: "just today" > "this deck" > its preset */
    deckLimit(deck, key) {
        const l = deck.limits || {}, t = dayKey();
        if (l.today && l.today.date === t && l.today[key] !== undefined) return l.today[key];
        if (l[key] !== undefined) return l[key];
        return this.deckCfg(deck.id)[key];
    }
    /* Deck whose daily limit applies to this deck's cards (nearest deck with its own limit or preset), or null = global limit */
    limitOwner(deckId, key) {
        const chain = this.deckChain(deckId), t = dayKey();
        for (let i = chain.length - 1; i >= 0; i--) {
            const d = chain[i], l = d.limits || {};
            if (d.preset || l[key] !== undefined || (l.today && l.today.date === t && l.today[key] !== undefined)) return d.id;
        }
        return null;
    }
    logReview(card, grade, type, prevIvl, ms) {
        const log = this.data.revlog;
        log.push([Date.now(), card.id, grade, type, card.state === 'review' ? card.interval : 0, prevIvl || 0, Math.round(ms)]);
        if (log.length > REVLOG_MAX + 2000) log.splice(0, log.length - REVLOG_MAX);
    }
    countStatuses(cards) {
        const now = Date.now(), eod = endOfDay(now);
        const out = { new: 0, learn: 0, due: 0, mature: 0, susp: 0, buried: 0, total: cards.length };
        cards.forEach(c => { out[cardStatus(c, now, eod)]++; });
        return out;
    }
    rollSeen() {
        const st = this.data.stats, t = dayKey();
        ['newSeen', 'revSeen'].forEach(k => { if (!st[k] || st[k].date !== t) st[k] = { date: t, count: 0, by: {} }; });
    }
    newBudget() {
        this.rollSeen();
        return Math.max(0, this.data.settings.newPerDay - this.data.stats.newSeen.count);
    }
    /* Applies the global + per-deck daily limit to an ordered list of cards */
    applyLimit(list, key, seen, globalLeft) {
        const used = {}, out = [];
        for (const c of list) {
            if (out.length >= globalLeft) break;
            const owner = this.limitOwner(c.deckId, key);
            if (owner) {
                const left = this.deckLimit(this.deck(owner), key) - (seen.by[owner] || 0) - (used[owner] || 0);
                if (left <= 0) continue;
                used[owner] = (used[owner] || 0) + 1;
            }
            out.push(c);
        }
        return out;
    }
    studyPlan(deckIds, extraNew = 0) {
        const now = Date.now(), eod = endOfDay(now);
        this.rollSeen();
        const st = this.data.stats, set = deckIds ? new Set(deckIds.flatMap(id => this.descendantIds(id))) : null;
        const pool = this.data.cards.filter(c => !c.suspended && !(c.buriedUntil > now) && (!set || set.has(c.deckId)));
        const learning = pool.filter(c => c.state === 'learning' || c.state === 'relearning').map(c => ({ id: c.id, due: c.due }));
        const dueAll = pool.filter(c => c.state === 'review' && c.due <= eod).sort((a, b) => a.due - b.due);
        const reviews = this.applyLimit(dueAll, 'maxReviews', st.revSeen, Math.max(0, this.data.settings.maxReviews - st.revSeen.count));
        let fresh = pool.filter(c => c.state === 'new');
        fresh = this.data.settings.newOrder === 'random' ? shuffle(fresh) : fresh.sort((a, b) => a.created - b.created);
        const news = extraNew ? fresh.slice(0, extraNew) : this.applyLimit(fresh, 'newPerDay', st.newSeen, this.newBudget());
        return { reviews, news, learning, learningDue: learning.filter(l => l.due <= now).length, freshTotal: fresh.length, dueTotal: dueAll.length };
    }
    nextDueTime() {
        let min = Infinity;
        this.data.cards.forEach(c => { if (c.state !== 'new' && !c.suspended && c.due < min) min = c.due; });
        return min;
    }

    /* ============================================================
       Navigation & rendering
       ============================================================ */
    go(view, opts = {}) {
        if (this.session && view !== 'session') this.endSession(false);
        if (this.ex && view !== 'exam') this.exLeave();
        if (view === 'session' && this.view !== 'session' && this.view !== 'exam') this.back = { view: this.view, deck: this.ui.deck, filter: this.ui.filter, y: window.scrollY };   // where to return when the session is closed
        const prevView = this.view;
        if (prevView && prevView !== 'session' && prevView !== 'exam') (this.scrollMem = this.scrollMem || {})[prevView] = window.scrollY;
        this.view = view;
        if (opts.deck !== undefined) { this.ui.deck = opts.deck; this.ui.limit = 60; this.touchDeck(opts.deck); }
        if (opts.filter !== undefined) this.ui.filter = opts.filter;
        this.render();
        const mem = (this.scrollMem || {})[view];
        const restore = mem && prevView !== view && opts.deck === undefined && ['dashboard', 'decks', 'stats', 'settings', 'toeic'].includes(view) && ['dashboard', 'decks', 'stats', 'settings', 'toeic'].includes(prevView);   // coming back to a tab: same place as before
        window.scrollTo({ top: restore ? mem : 0, behavior: 'instant' in window ? 'instant' : 'auto' });
        const el = $(`#view-${view}`); if (el) { el.classList.remove('view-in'); void el.offsetWidth; el.classList.add('view-in'); }
    }
    render() {
        ['dashboard', 'decks', 'stats', 'settings', 'session', 'toeic', 'exam'].forEach(v => $(`#view-${v}`).classList.toggle('hidden', v !== this.view));
        $$('[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === this.view && !b.classList.contains('brand') && !b.classList.contains('streak-chip') && !b.classList.contains('sync-dot')));
        document.body.classList.toggle('in-session', this.view === 'session' || this.view === 'exam');
        document.body.classList.toggle('in-exam', this.view === 'exam');
        if (this.view !== 'decks') document.body.classList.remove('deck-sheet');
        this.renderStreak();
        this.renderSyncIndicator();
        if (this.view === 'dashboard') this.renderDashboard();
        else if (this.view === 'decks') this.renderDecks();
        else if (this.view === 'stats') this.renderStats();
        else if (this.view === 'settings') this.renderSettings();
        else if (this.view === 'toeic') this.renderToeic();
        else if (this.view === 'exam') this.renderExam();
    }
    renderStreak() {
        if (!this.data) return;
        const st = this.data.stats;
        const alive = st.lastStudyDate === dayKey();
        $('#streak-value').textContent = st.streak;
        const chip = $('#streak-chip');
        chip.classList.toggle('cold', !alive);
        chip.title = alive ? `Série : ${st.streak} j (révision du jour faite)` : `Série : ${st.streak} j. Révise aujourd'hui pour la prolonger !`;
    }
    renderSyncIndicator() {
        const el = $('#sync-indicator');
        if (!el || !this.data) return;
        const on = this.data.settings.cloudSync;
        el.classList.toggle('hidden', !on);
        el.classList.remove('ok', 'busy', 'err');
        if (on && ['ok', 'busy', 'err'].includes(Cloud.status)) el.classList.add(Cloud.status);
        el.title = { ok: 'Synchronisé avec le cloud', busy: 'Synchronisation...', err: 'Synchronisation impossible (hors ligne ?)', off: 'Synchronisation désactivée' }[Cloud.status] || 'Synchronisation cloud';
        if (this.view === 'settings') { const st = $('#sync-status'); if (st) st.textContent = el.title + (Cloud.status === 'err' && Cloud.lastError ? ` : ${Cloud.lastError}` : '') + (Cloud.lastSync ? ` · dernière synchro ${fmtAgo(Cloud.lastSync)}` : ''); }
    }

    /* ---------- Dashboard ---------- */
    renderDashboard() {
        const d = this.data, now = Date.now();
        const counts = this.countStatuses(d.cards);
        const plan = this.studyPlan(null);
        const dueCount = plan.reviews.length + plan.learningDue;
        const toStudy = dueCount + plan.news.length;
        const h = new Date().getHours();
        const hello = h < 5 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
        let sub;
        if (toStudy > 0) {
            const parts = [];
            if (dueCount) parts.push(`<b>${plural(dueCount, 'carte')} à revoir</b>`);
            if (plan.news.length) parts.push(`<b>${plural(plan.news.length, 'nouvelle carte', 'nouvelles cartes')}</b>`);
            sub = `Au programme aujourd'hui : ${parts.join(' et ')}.`;
        } else {
            const next = this.nextDueTime();
            sub = `Tout est à jour, bravo ! 🎉 ${next < Infinity ? `Prochaine révision ${fmtRelativeFuture(next, now)}.` : ''}`;
        }
        const extra = toStudy === 0 && plan.freshTotal > 0
            ? `<button class="btn btn-hero-ghost" data-action="extra-new">${ic('plus')}10 nouvelles de plus</button>` : '';
        const pct = k => (counts.total ? Math.round(counts[k] / counts.total * 100) : 0);
        const chronoBest = d.stats.chronoBest[d.settings.chronoDuration] || 0;
        const goal = this.goalInfo();
        const libTotal = PACKS.reduce((n, p) => n + this.packCardIds(p).length, 0);
        const libBanner = !d.settings.libSeen && !d.cards.some(c => c.id.startsWith('pk_')) ? `<div class="panel lib-banner"><span class="lib-ico">${ic('sparkles')}</span><div style="flex:1;min-width:200px"><b>Nouveau : la bibliothèque de paquets</b><p class="small muted">${libTotal.toLocaleString('fr-FR')} cartes prêtes à apprendre : anglais et TOEIC, banque, assurance, finance, BUT TC.</p></div><button class="btn btn-primary btn-sm" data-action="open-library">Découvrir</button><button class="icon-btn icon-btn-sm" data-action="lib-dismiss" aria-label="Fermer" title="Fermer">${ic('x')}</button></div>` : '';

        $('#view-dashboard').innerHTML = `
        <div class="stack">
            <div class="hero">
                <div class="hero-inner">
                    <div>
                        <span class="hero-kicker">${hello} 👋${goal ? ` · <b>${esc(goal.name)} : ${goal.days > 0 ? `J-${goal.days}` : goal.days === 0 ? 'c\'est aujourd\'hui !' : 'terminé'}</b>` : ''}</span>
                        <h2 class="hero-title">Prêt pour ta révision ?</h2>
                        <p class="hero-sub">${sub}</p>
                    </div>
                    <div class="hero-actions">
                        ${toStudy > 0
                            ? `<button class="btn btn-lg btn-hero" data-action="study" data-deck="">${ic('play')}Réviser (${toStudy})</button>`
                            : `<button class="btn btn-lg btn-hero" data-action="practice-all">${ic('repeat')}Révision libre</button>`}
                        ${extra || `<button class="btn btn-lg btn-hero-ghost" data-action="new-card">${ic('plus')}Nouvelle carte</button>`}
                    </div>
                </div>
            </div>

            ${this.resumeHtml()}
            <div class="status-grid">
                ${['new', 'learn', 'due', 'mature'].map(k => `
                <button class="panel status-tile" style="--c:${STATUS[k].color}" data-action="goto-filter" data-filter="${k}">
                    <div class="top"><span class="status-ico">${ic(STATUS[k].icon)}</span><span class="tiny faint">${pct(k)}%</span></div>
                    <div><div class="status-num">${counts[k]}</div><div class="status-label">${STATUS[k].label}</div></div>
                    <div class="bar"><i style="width:${pct(k)}%"></i></div>
                </button>`).join('')}
            </div>

            ${this.goalsHtml()}
            ${this.recentsHtml()}
            <div>
                ${this.secToggle('modes', "Modes d'entraînement", `<button class="link" data-action="custom-study">${ic('sliders')}Révisions personnalisées</button>`)}
                ${this.homeOpen('modes') ? '<div class="mode-grid">' : '<div class="mode-grid hidden">'}
                    <button class="panel mode-tile" style="--c:#0ea5e9" data-action="mode" data-mode="write">
                        <span class="mode-ico">${ic('keyboard')}</span>
                        <span><h4>Écrire</h4><p>Tape la réponse, correction automatique</p></span>${ic('chevronRight', 'chev')}
                    </button>
                    <button class="panel mode-tile" style="--c:#8b5cf6" data-action="mode" data-mode="quiz">
                        <span class="mode-ico">${ic('quiz')}</span>
                        <span><h4>Quiz</h4><p>QCM à 4 choix${d.stats.quizBest ? ` · record ${d.stats.quizBest}%` : ''}</p></span>${ic('chevronRight', 'chev')}
                    </button>
                    <button class="panel mode-tile" style="--c:#f97316" data-action="mode" data-mode="chrono">
                        <span class="mode-ico">${ic('timer')}</span>
                        <span><h4>Chrono</h4><p>${chronoBest ? `Record : ${chronoBest} pts en ${d.settings.chronoDuration} s` : 'Un max de bonnes réponses, vite !'}</p></span>${ic('chevronRight', 'chev')}
                    </button>

                </div>
            </div>

            ${this.filtersHtml()}
            <div>
                <div class="section-head">
                    <h3 class="section-title">Tes paquets</h3>
                    <span class="deck-head-links"><button class="link" data-action="open-library">${ic('layers')}Bibliothèque</button><button class="link" data-nav="decks">Gérer ${ic('chevronRight')}</button></span>
                </div>
                ${d.decks.length ? `<div class="dash-tools"><label class="input-icon dash-find">${ic('search')}<span class="sr-only">Rechercher un paquet</span><input class="input" type="search" placeholder="Rechercher un paquet..." data-input="dash-find" autocomplete="off" spellcheck="false"></label>
                <label class="sort-pick"><span class="sr-only">Trier</span><select class="select select-sm" aria-label="Trier les paquets" data-input="deck-sort">${[['recent', 'Plus récents'], ['due', 'À revoir d\'abord'], ['studied', 'Révisés récemment'], ['alpha', 'A → Z'], ['size', 'Plus de cartes']].map(([v, l]) => `<option value="${v}" ${(d.settings.deckSort || 'recent') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
                <div id="dash-find-res" class="panel dl-results hidden"></div>
                <div id="dash-decks" class="deck-grid ${this.deckCompact() ? 'compact' : ''}">${this.dashboardDeckCards()}</div>`
                    : `<div class="panel empty">${ic('layers')}<p>Aucun paquet pour l'instant.</p><button class="btn btn-primary" style="margin-top:14px" data-action="new-deck">${ic('folderPlus')}Créer un paquet</button></div>`}
            </div>
            ${libBanner}
            ${this.tipsHtml()}
        </div>`;
    }
    tipsHtml() {
        if (this.data.settings.tipsSeen || !this.data.cards.length) return '';
        return `<div class="panel tips-card"><div class="tips-head"><b>${ic('bulb')} 3 astuces</b><button class="icon-btn icon-btn-sm" data-action="tips-dismiss" aria-label="Fermer" title="Fermer">${ic('x')}</button></div>
            <ul><li><b>📌 Épingler</b> : la punaise garde tes paquets importants tout en haut.</li>
            <li><b>↻ Libre · ☰ Ordre</b> : toutes les cartes dans le désordre, ou dans l'ordre du cours (avec reprise). Ni l'un ni l'autre ne touche au planning.</li>
            <li><b>👆 Glisser</b> : en révision libre, glisse la carte vers la droite si tu savais, vers la gauche si tu as raté.</li></ul>
            <button class="btn btn-primary btn-sm" data-action="tips-dismiss">Compris</button></div>`;
    }
    recentsHtml() {
        const ids = (this.data.settings.recentDecks || []).filter(id => this.deck(id)).slice(0, 6);
        if (!ids.length) return '';
        const open = this.homeOpen('recents', true);
        return `<div>${this.secToggle('recents', 'Récemment', '', true)}<div class="recents${open ? '' : ' hidden'}">${ids.map(id => { const d = this.deck(id), path = this.deckPath(id).split(' › '); return `<div class="recent-item"><button class="recent-chip" data-action="open-deck" data-deck="${esc(id)}" title="${esc(this.deckPath(id))}"><span>${esc(d.emoji)}</span><span class="nm">${esc(d.name)}</span>${path.length > 1 ? `<small>${esc(path[path.length - 2])}</small>` : ''}</button><button class="recent-x" data-action="recent-del" data-deck="${esc(id)}" aria-label="Retirer ${esc(d.name)} des récents" title="Retirer">${ic('x')}</button></div>`; }).join('')}</div></div>`;
    }
    deckCompact() {
        const v = this.data.settings.deckView;
        return v ? v === 'compact' : window.matchMedia('(max-width: 767px)').matches;
    }
    dashboardDeckCards() {
        const now = Date.now(), eod = endOfDay(now);
        const budget = this.newBudget();
        const rows = this.sortedDecks().filter(d => !d.parent).map(deck => {
            const cards = this.cardsOf(deck.id);
            const c = { new: 0, learn: 0, due: 0, mature: 0 };
            cards.forEach(x => { c[cardStatus(x, now, eod)]++; });
            return { deck, cards, c, todo: c.due + Math.min(c.new, budget) };
        });
        const lastReview = new Map();
        this.data.cards.forEach(x => { if (x.lastReview) { const t = lastReview.get(x.deckId) || 0; if (x.lastReview > t) lastReview.set(x.deckId, x.lastReview); } });
        const recency = ({ deck, cards }) => Math.max(deck.created || 0, ...cards.map(x => x.created || 0));
        const studied = ({ deck }) => Math.max(0, ...this.descendantIds(deck.id).map(id => lastReview.get(id) || 0));
        const byName = (a, b) => a.deck.name.localeCompare(b.deck.name, 'fr', { sensitivity: 'base' });
        const mode = this.data.settings.deckSort || 'recent';
        rows.sort(mode === 'due' ? (a, b) => (b.c.due > 0) - (a.c.due > 0) || b.c.due - a.c.due || byName(a, b)
            : mode === 'studied' ? (a, b) => studied(b) - studied(a) || byName(a, b)
            : mode === 'alpha' ? byName
            : mode === 'size' ? (a, b) => b.cards.length - a.cards.length || byName(a, b)
            : (a, b) => recency(b) - recency(a) || byName(a, b));
        const pins = this.data.settings.pinnedDecks || [];
        if (pins.length) rows.sort((a, b) => pins.includes(b.deck.id) - pins.includes(a.deck.id));   // pinned decks first (stable)
        const stats = this.deckStats(), openD = this.openSet('dash');
        const subRows = (parentId, depth) => this.childrenOf(parentId).map(k => {
            const st = stats.get(k.id), kids = this.childrenOf(k.id), isOpen = openD.has(k.id);
            return `<div class="sub-row" style="--d:${depth}">
                ${kids.length ? `<button class="dl-chev ${isOpen ? 'open' : ''}" data-action="dash-toggle" data-deck="${esc(k.id)}" aria-label="${isOpen ? 'Replier' : 'Déplier'}" aria-expanded="${isOpen}">${ic('chevronRight')}</button>` : '<span class="dl-chev ph"></span>'}
                <button class="sub-name" data-action="dash-open" data-deck="${esc(k.id)}" title="${kids.length ? 'Voir les sous-paquets' : 'Voir les cartes'}"><span>${esc(k.emoji)}</span><b>${esc(k.name)}</b></button>
                <span class="sub-bar">${this.progressHtml(st)}<small>${this.pctSeen(st)} % vu · ${this.pctMature(st)} % maîtrisé · ${st.total}</small></span>
                ${st.due ? `<span class="due-badge" title="À revoir">${st.due}</span>` : '<span class="due-badge ph"></span>'}
                <button class="icon-btn icon-btn-sm" title="Réviser ce sous-paquet" data-action="study" data-deck="${esc(k.id)}">${ic('play')}</button>
                <button class="icon-btn icon-btn-sm" title="Révision libre : toutes les cartes, sans toucher au planning" data-action="free-deck" data-deck="${esc(k.id)}">${ic('repeat')}</button>
                <button class="icon-btn icon-btn-sm" title="Étudier dans l'ordre" data-action="ordered-deck" data-deck="${esc(k.id)}">${ic('list')}</button>
            </div>${kids.length && isOpen ? `<div class="sub-open-link" style="--d:${depth + 1}"><button class="link" data-action="open-deck" data-deck="${esc(k.id)}">${ic('layers')}Voir les cartes de « ${esc(k.name)} »</button></div>${subRows(k.id, depth + 1)}` : ''}`;
        }).join('');
        return rows.map(({ deck, cards, c, todo }) => {
            const st = stats.get(deck.id), total = st.total || 1;
            const kids = this.childrenOf(deck.id), nSub = this.descendantIds(deck.id).length - 1, isOpen = openD.has(deck.id);
            return `
            <div class="panel deck-card ${kids.length && isOpen ? 'wide' : ''}" data-action="dash-open" data-deck="${esc(deck.id)}">
                <div class="deck-head">
                    <span class="deck-emoji">${esc(deck.emoji)}</span>
                    <div style="min-width:0"><div class="deck-name">${esc(deck.name)}</div><div class="deck-meta">${plural(cards.length, 'carte')} · ${this.pctSeen(st)} % vu · ${this.pctMature(st)} % maîtrisé</div></div>
                    <button class="icon-btn icon-btn-sm pin-btn ${pins.includes(deck.id) ? 'on' : ''}" data-action="pin-deck" data-deck="${esc(deck.id)}" title="${pins.includes(deck.id) ? 'Désépingler' : 'Épingler en haut'}" aria-label="Épingler le paquet" aria-pressed="${pins.includes(deck.id)}">${ic('pin')}</button>
                </div>
                <div class="counts">
                    <span style="color:var(--new)" title="Nouvelles">${ic('sparkle')}${c.new}</span>
                    <span style="color:var(--learn)" title="En cours">${ic('sprout')}${c.learn}</span>
                    <span style="color:var(--due)" title="À revoir">${ic('repeat')}${c.due}</span>
                    <span style="color:var(--mature)" title="Maîtrisées">${ic('award')}${c.mature}</span>
                </div>
                ${this.progressHtml(st)}
                ${kids.length ? `<button class="sub-toggle ${isOpen ? 'open' : ''}" data-action="dash-toggle" data-deck="${esc(deck.id)}" aria-expanded="${isOpen}">${ic('chevronRight')}<span>${plural(nSub, 'sous-paquet')}${isOpen ? '' : ' : voir l\'avancée'}</span></button>` : ''}
                ${kids.length && isOpen ? `<div class="sub-tree"><div class="sub-open-link" style="--d:0"><button class="link" data-action="open-deck" data-deck="${esc(deck.id)}">${ic('layers')}Voir les cartes de « ${esc(deck.name)} »</button></div>${subRows(deck.id, 0)}</div>` : ''}
                <div class="deck-foot">
                    ${todo > 0 ? `<button class="btn btn-primary btn-sm" data-action="study" data-deck="${esc(deck.id)}">${ic('play')}Réviser (${todo})</button>`
                        : `<button class="btn btn-soft btn-sm" data-action="practice-deck" data-deck="${esc(deck.id)}">${ic('check')}À jour</button>`}
                    <div class="modes">
                        <button class="btn btn-soft btn-sm" title="Révision libre : toutes les cartes, sans toucher au planning" data-action="free-deck" data-deck="${esc(deck.id)}">${ic('repeat')}Libre</button>
                        <button class="btn btn-soft btn-sm" title="Étudier dans l'ordre, sans toucher au planning" data-action="ordered-deck" data-deck="${esc(deck.id)}">${ic('list')}Ordre</button>
                        <button class="icon-btn icon-btn-sm" title="Écrire, Quiz, Chrono…" aria-label="Autres modes" data-action="deck-more" data-deck="${esc(deck.id)}">${ic('more')}</button>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    /* ---------- Decks & cards manager ---------- */
    renderDecks() {
        const ui = this.ui;
        if (ui.deck !== 'all' && ui.deck !== 'errors' && !this.deck(ui.deck)) ui.deck = 'all';
        $('#view-decks').innerHTML = `
        <div class="stack">
            <div class="stats-head">
                <div><h2 class="page-title">Paquets &amp; Cartes</h2>
                <p class="page-sub">Choisis un paquet pour gérer tes fiches et lancer une révision.</p></div>
                <div class="head-tools">
                    <button class="icon-btn" data-action="open-library" title="Bibliothèque de paquets" aria-label="Bibliothèque de paquets">${ic('layers')}</button>
                    <button class="icon-btn" data-action="undo-global" title="Annuler la dernière modification (Ctrl+Z)" ${this.undoStack.length ? '' : 'disabled style="opacity:.35"'}>${ic('undo')}</button>
                    <button class="icon-btn" data-action="redo-global" title="Rétablir (Ctrl+Maj+Z)" ${this.redoStack.length ? '' : 'disabled style="opacity:.35"'}>${ic('redo')}</button>
                </div>
            </div>
            <div class="decks-toolbar">
                <button class="btn btn-primary" data-action="new-deck">${ic('folderPlus')}<span>Nouveau paquet</span></button>
                <button class="btn btn-soft" data-action="new-card">${ic('plus')}<span>Nouvelle carte</span></button>
                <button class="btn btn-soft" data-action="import">${ic('import')}<span>Importer</span></button>
            </div>
            <div class="panel search-bar">
                <div class="search-field ${ui.search ? 'has-value' : ''}">
                    <label class="input-icon">${ic('search')}<span class="sr-only">Rechercher</span>
                        <input class="input" type="search" id="card-search" placeholder="Rechercher une carte..." value="${esc(ui.search)}" data-input="search" autocomplete="off" spellcheck="false" enterkeyhint="search">
                    </label>
                    <button class="search-clear" data-action="clear-search" aria-label="Effacer la recherche" title="Effacer (Échap)">${ic('x')}</button>
                </div>
                <details class="search-more" style="grid-column:1/-1" ${ui.sort !== 'auto' || ui.search ? 'open' : ''}><summary>Trier et filtrer</summary>
                <label><span class="sr-only">Trier</span>
                    <select class="select" data-input="sort">
                        ${[['auto', 'Pertinence / récentes'], ['recent', 'Plus récentes'], ['alpha', 'Alphabétique (A → Z)'], ['alpha-rev', 'Alphabétique (Z → A)'], ['due', 'Prochaine révision'], ['hard', 'Plus difficiles d\'abord']]
                            .map(([v, l]) => `<option value="${v}" ${ui.sort === v ? 'selected' : ''}>${l}</option>`).join('')}
                    </select>
                </label>
                <div class="quick-q" id="quick-q">${this.quickQueryHtml()}</div>
                <details class="search-help"><summary>Astuces de recherche</summary><p>Plusieurs mots = tous requis · <code>"mot exact"</code> · <code>-exclure</code> · <code>deck:nom</code> · <code>tag:x</code> · <code>is:due</code> <code>is:new</code> <code>is:suspended</code> <code>is:marked</code> <code>is:leech</code> · <code>flag:1</code> · <code>prop:ivl&gt;30</code> · <code>added:7</code> · <code>rated:1</code> · accents et petites fautes tolérés.</p></details>
                </details>
            </div>
            <div class="manager">
                <button class="btn btn-soft deck-pick" id="deck-pick" data-action="toggle-tree" aria-label="Choisir un paquet"><b></b><span>${ic('chevronDown')}</span></button>
                <aside class="panel deck-list" id="deck-sidebar" aria-label="Paquets"></aside>
                <div class="panel" id="deck-panel" style="overflow:hidden"></div>
            </div>
        </div>`;
        this.renderDeckSidebar();
        this.renderDeckPanel();
    }
    /* Recently used decks (shown on the dashboard) */
    /* what the user did last: shown as the "Reprendre" line on the dashboard */
    noteLast(kind, deckId) {
        this.data.settings.lastRun = { kind, deck: deckId || '', at: Date.now() };
        this.save(false);
    }
    /* foldable home sections (closed by default, remembered) */
    homeOpen(key, def = false) { const o = this.data.settings.homeOpen || {}; return o[key] === undefined ? def : o[key] === true; }
    secToggle(key, title, extra = '', def = false) {
        const open = this.homeOpen(key, def);
        return `<div class="section-head"><button class="sec-toggle ${open ? 'open' : ''}" data-action="home-toggle" data-sec="${key}" aria-expanded="${open}">${ic('chevronRight')}<h3 class="section-title">${title}</h3></button>${open ? extra : ''}</div>`;
    }
    resumeHtml() {
        const r = this.data.settings.lastRun;
        if (!r || r.kind !== 'ordered') return '';   // only worth showing when a saved position can be resumed
        const d = r.deck ? this.deck(r.deck) : null;
        if (r.deck && !d) return '';
        let sub, title = d ? `${d.emoji} ${d.name}` : 'Révision du jour';
        if (r.kind === 'ordered') {
            const pos = (this.data.settings.ordPos || {})[r.deck], n = pos ? pos.n : 0;
            if (!pos || pos.i <= 0 || pos.i >= n) return '';   // nothing left to resume
            sub = `Dans l'ordre · carte ${pos.i + 1} sur ${n}`;
        }
        return `<button class="panel mode-tile resume-tile wide" style="--c:#4f46e5" data-action="resume-last"><span class="mode-ico">${ic('play')}</span><span class="grow"><h4>Reprendre : ${esc(title)}</h4><p>${esc(sub)}</p></span>${ic('chevronRight', 'chev')}</button>`;
    }
    touchDeck(id) {
        if (!id || id === 'all' || id === 'errors' || !this.deck(id)) return;
        const st = this.data.settings, cur = st.recentDecks || [];
        if (cur[0] === id) return;
        st.recentDecks = [id, ...cur.filter(x => x !== id)].slice(0, 8);
        this.save(false);
    }
    /* "Find a deck" results: every deck at any depth whose path contains all the typed words */
    deckFinderHtml(q, action = 'select-deck') {
        const words = fold(q).split(/\s+/).filter(Boolean);
        if (!words.length) return '';
        const stats = this.deckStats();
        const hits = this.data.decks.filter(d => { const path = fold(this.deckPath(d.id)); return words.every(w => path.includes(w)); }).slice(0, 40);
        if (!hits.length) return '<p class="small muted" style="padding:10px">Aucun paquet ne correspond.</p>';
        return hits.map(d => {
            const st = stats.get(d.id), path = this.deckPath(d.id).split(' › ').slice(0, -1).join(' › ');
            return `<button class="dl-item" data-action="${action}" data-deck="${esc(d.id)}"><span class="em">${esc(d.emoji)}</span><span class="nm">${esc(d.name)}${path ? `<small class="muted" style="display:block;font-weight:500;font-size:.72rem;white-space:normal">${esc(path)}</small>` : ''}</span><span class="ct">${st ? st.total : ''}</span></button>`;
        }).join('');
    }
    deckLabel(id) {
        if (id === 'all') return '📂 Toutes les cartes';
        if (id === 'errors') return '🎯 Mes erreurs';
        const d = this.deck(id); return d ? `${d.emoji} ${d.name}` : '📂 Paquets';
    }
    /* phone: the deck picker is a sheet that only opens on request; desktop: always shown */
    treeIsOpen() {
        if (window.matchMedia('(max-width: 960px)').matches) return this.ui.treeOpen === true;
        return this.ui.treeOpen === undefined ? this.ui.deck === 'all' : this.ui.treeOpen;
    }
    renderDeckSidebar() {
        const ui = this.ui, box = $('#deck-sidebar');
        if (!box) return;
        const q = this.searchMatches(), stats = this.deckStats(), open = this.openSet('side');
        const forced = new Set(this.deckChain(ui.deck).slice(0, -1).map(d => d.id));   // path to the selected deck stays visible
        const count = list => (q ? list.filter(c => q.has(c.id)).length : list.length);
        const item = (id, em, name, n, cls = '') => `<div class="dl-row ${ui.deck === id ? 'active' : ''}"><span class="dl-chev ph"></span><button class="dl-item ${cls} ${ui.deck === id ? 'active' : ''} ${q && !n ? 'dim' : ''}" data-action="select-deck" data-deck="${esc(id)}"><span class="em">${em}</span><span class="nm">${esc(name)}</span><span class="ct">${n}</span></button></div>`;
        const node = (d, depth) => {
            const kids = this.childrenOf(d.id), st = stats.get(d.id), isOpen = !!q || open.has(d.id) || forced.has(d.id);
            const n = q ? count(this.cardsOf(d.id)) : st.total;
            const html = `<div class="dl-row ${ui.deck === d.id ? 'active' : ''}" style="--d:${depth}">
                ${kids.length ? `<button class="dl-chev ${isOpen ? 'open' : ''}" data-action="toggle-deck" data-key="side" data-deck="${esc(d.id)}" aria-label="${isOpen ? 'Replier' : 'Déplier'} ${esc(d.name)}" aria-expanded="${isOpen}">${ic('chevronRight')}</button>` : '<span class="dl-chev ph"></span>'}
                <button class="dl-item ${ui.deck === d.id ? 'active' : ''} ${q && !n ? 'dim' : ''}" data-action="select-deck" data-deck="${esc(d.id)}" title="${esc(this.deckPath(d.id))} · ${this.pctSeen(st)} % vu · ${this.pctMature(st)} % maîtrisé">
                    <span class="em">${esc(d.emoji)}</span><span class="nm">${esc(d.name)}</span>${st.due ? `<span class="due-badge" title="À revoir">${st.due}</span>` : ''}<span class="ct">${n}</span>
                    <span class="mini">${this.progressHtml(st)}</span>
                </button></div>`;
            return html + (isOpen ? kids.map(k => node(k, depth + 1)).join('') : '');
        };
        const anyTree = this.data.decks.some(d => d.parent);
        box.classList.toggle('collapsed', !this.treeIsOpen());
        const pick = $('#deck-pick'); if (pick) pick.querySelector('b').textContent = this.deckLabel(ui.deck);
        const sheet = !box.classList.contains('collapsed') && window.matchMedia('(max-width: 960px)').matches;
        document.body.classList.toggle('deck-sheet', sheet && this.view === 'decks');
        box.innerHTML = `
            <div class="dl-sheet-head"><b>Choisir un paquet</b><button class="icon-btn" data-action="toggle-tree" aria-label="Fermer">${ic('x')}</button></div>
            <div class="dl-find"><label class="input-icon">${ic('search')}<span class="sr-only">Rechercher un paquet</span><input class="input" id="deck-find" type="search" placeholder="Rechercher un paquet..." data-input="deck-find" autocomplete="off" spellcheck="false" value="${esc(ui.deckQ || '')}"></label></div>
            <div id="deck-find-res" class="${ui.deckQ ? '' : 'hidden'}">${this.deckFinderHtml(ui.deckQ || '')}</div>
            <div id="deck-tree" class="${ui.deckQ ? 'hidden' : ''}">
            <div class="dl-title"><span>${q ? 'Résultats par paquet' : 'Paquets'}</span>${anyTree ? `<span class="dl-tools"><button data-action="tree-all" data-key="side" data-open="1" title="Tout déplier">${ic('chevronDown')}</button><button data-action="tree-all" data-key="side" data-open="0" title="Tout replier" style="transform:rotate(180deg)">${ic('chevronDown')}</button></span>` : ''}</div>
            ${item('all', '📂', 'Toutes les cartes', count(this.data.cards))}
            ${item('errors', ic('target'), 'Mes erreurs', count(this.errorCards()), 'errors')}
            <div class="dl-sep"></div>
            ${this.childrenOf(null).map(d => node(d, 0)).join('')}</div>`;
    }
    /* Search: accent-insensitive, AND between words, "exact phrase", -exclude, typo tolerant,
       plus Anki-style filters (deck:, tag:, is:, flag:, prop:, added:, rated:, front:, back:, type:) */
    parseQuery(q) {
        const out = { terms: [], phrases: [], excludes: [], filters: [] };
        const KEYS = ['deck', 'tag', 'is', 'flag', 'prop', 'added', 'rated', 'front', 'back', 'type', 'kind'];
        const re = /(-?)(?:(\w+):)?(?:"([^"]*)"?|(\S+))/g;
        let m;
        while ((m = re.exec(q))) {
            const neg = !!m[1], key = m[2] ? m[2].toLowerCase() : null, quoted = m[3], bare = m[4];
            if (key && KEYS.includes(key)) { const val = quoted !== undefined ? quoted : bare; if (val) out.filters.push({ neg, key, val: fold(val) }); continue; }
            if (quoted !== undefined && !key) { const p = fold(quoted).trim(); if (p) (neg ? out.excludes : out.phrases).push(p); continue; }
            const t = fold((key ? `${key}:` : '') + (quoted !== undefined ? quoted : bare)).replace(/^[^\p{L}\p{N}#]+|[^\p{L}\p{N}]+$/gu, '');
            if (!t) continue;
            (neg ? out.excludes : out.terms).push(t.replace(/^#/, ''));
        }
        out.empty = !out.terms.length && !out.phrases.length && !out.excludes.length && !out.filters.length;
        return out;
    }
    matchFilter(c, f, ctx) {
        const v = f.val;
        let ok = false;
        switch (f.key) {
            case 'deck': ok = fold(this.deckPath(c.deckId)).includes(v); break;
            case 'tag': ok = v === 'none' ? !c.tags.length : c.tags.some(t => fold(t) === v || fold(t).startsWith(v)); break;
            case 'flag': ok = c.flag === Number(v); break;
            case 'type': case 'kind': ok = c.kind === v || (v === 'reversed' && c.kind === 'rev') || (c.kind === 'custom' && fold(this.noteTypeName(c)).includes(v)) || (v === 'image' && c.kind === 'occl'); break;
            case 'front': ok = fold(stripHtml(c.front)).includes(v); break;
            case 'back': ok = fold(stripHtml(c.back)).includes(v); break;
            case 'added': ok = c.created >= ctx.now - Number(v) * DAY; break;
            case 'rated': { const n = Number(v); ctx.rated[n] = ctx.rated[n] || new Set(this.data.revlog.filter(r => r[0] >= ctx.now - n * DAY).map(r => r[1])); ok = ctx.rated[n].has(c.id); break; }
            case 'is': {
                const st = cardStatus(c, ctx.now, ctx.eod);
                ok = ({
                    due: st === 'due', new: c.state === 'new', learn: c.state === 'learning' || c.state === 'relearning', learning: c.state === 'learning' || c.state === 'relearning',
                    review: c.state === 'review', suspended: c.suspended, buried: c.buriedUntil > ctx.now, marked: c.marked, leech: c.tags.some(t => fold(t) === 'leech'),
                    mature: c.state === 'review' && c.interval >= MATURE_IVL, young: c.state === 'review' && c.interval < MATURE_IVL, flagged: c.flag > 0, error: c.errors > 0, errors: c.errors > 0
                })[v] === true;
                break;
            }
            case 'prop': {
                const m = /^(ivl|ease|lapses|reps|due|errors|s|d)(<=|>=|!=|=|<|>)(-?\d+(?:[.,]\d+)?)$/.exec(v.replace(/\s/g, ''));
                if (!m) { ok = false; break; }
                let x, y = parseFloat(m[3].replace(',', '.'));
                if (m[1] === 'ivl') x = c.state === 'new' ? null : c.interval;
                else if (m[1] === 'ease') { x = c.ease; if (y > 10) y /= 100; }
                else if (m[1] === 'due') x = c.state === 'new' ? null : daysBetweenKeys(dayKey(ctx.now), dayKey(c.due));
                else if (m[1] === 's' || m[1] === 'd') { const fs = fsrsFromCard(c); x = fs ? fs[m[1]] : null; }
                else x = c[m[1] === 'lapses' ? 'lapses' : m[1]];
                if (x === null || x === undefined) { ok = false; break; }
                ok = { '<': x < y, '>': x > y, '<=': x <= y, '>=': x >= y, '=': x === y, '!=': x !== y }[m[2]];
                break;
            }
            default: ok = false;
        }
        return f.neg ? !ok : ok;
    }
    searchIndex(c) {
        const deck = this.deck(c.deckId);
        const key = `${c.front}\u0001${c.back}\u0001${c.hint}\u0001${c.detail}\u0001${c.tags.join(',')}\u0001${deck ? deck.name : ''}`;
        const hit = this.searchCache.get(c.id);
        if (hit && hit.key === key) return hit;
        const front = fold(stripHtml(c.front)), back = fold(stripHtml(c.back));
        const extra = fold(`${stripHtml(c.hint)} ${stripHtml(c.detail)} ${c.tags.join(' ')} ${deck ? deck.name : ''}`);
        const words = [...new Set(`${front} ${back} ${extra}`.split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 3))];
        const idx = { key, front, back, extra, all: `${front} \u0001 ${back} \u0001 ${extra}`, words };
        this.searchCache.set(c.id, idx);
        return idx;
    }
    matchCard(c, q, ctx) {
        const x = this.searchIndex(c);
        if (q.excludes.some(t => x.all.includes(t))) return null;
        if (q.phrases.some(p => !x.all.includes(p))) return null;
        if (q.filters.some(f => !this.matchFilter(c, f, ctx))) return null;
        let score = q.phrases.length * 4;
        const fuzzy = [];
        for (const t of q.terms) {
            const wordStart = new RegExp(`(^|[^\\p{L}\\p{N}])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'u');
            if (x.front.includes(t)) score += 3 + (wordStart.test(x.front) ? 1 : 0);
            else if (x.back.includes(t)) score += 2 + (wordStart.test(x.back) ? 1 : 0);
            else if (x.extra.includes(t)) score += 1;
            else if (t.length >= 4) {
                const tol = t.length >= 7 ? 2 : 1;
                const w = x.words.find(w => (Math.abs(w.length - t.length) <= tol && levenshtein(w, t) <= tol)
                    || (t.length >= 5 && w.length > t.length && levenshtein(w.slice(0, t.length), t) <= 1));
                if (!w) return null;
                fuzzy.push(w);
                score += 0.5;
            } else return null;
        }
        return { score, fuzzy };
    }
    /* Returns Map(cardId -> match) for the current query over ALL cards, or null when no query */
    searchMatches() {
        const raw = this.ui.search.trim();
        if (!raw) return null;
        if (this._sm && this._sm.raw === raw && this._sm.n === this.data.cards.length && this._sm.at === this.data.updatedAt) return this._sm.map;
        const q = this.parseQuery(raw);
        const map = new Map();
        const ctx = { now: Date.now(), eod: endOfDay(), rated: {} };
        if (!q.empty) this.data.cards.forEach(c => { const m = this.matchCard(c, q, ctx); if (m) map.set(c.id, m); });
        else this.data.cards.forEach(c => map.set(c.id, { score: 0, fuzzy: [] }));
        this._sm = { raw, n: this.data.cards.length, at: this.data.updatedAt, map, q };
        return map;
    }
    filteredCards() {
        const ui = this.ui, now = Date.now(), eod = endOfDay(now);
        let list = ui.deck === 'all' ? this.data.cards : ui.deck === 'errors' ? this.errorCards() : this.cardsOf(ui.deck);
        const matches = this.searchMatches();
        const globalHits = matches ? matches.size : 0;
        if (matches) list = list.filter(c => matches.has(c.id));
        const statusCounts = { all: list.length, new: 0, learn: 0, due: 0, mature: 0, susp: 0, buried: 0 };
        const withStatus = list.map(c => { const s = cardStatus(c, now, eod); statusCounts[s]++; return { c, s }; });
        let rows = ui.filter === 'all' ? withStatus : withStatus.filter(r => r.s === ui.filter);
        const txt = c => { const x = this.searchIndex(c); return x.front.replace(/^[^\p{L}\p{N}]+/u, ''); };
        const cmp = (a, b) => a.localeCompare(b, 'fr', { ignorePunctuation: true });
        const sortKey = ui.sort === 'auto' ? (matches ? 'relevance' : 'recent') : ui.sort;
        const sorters = {
            relevance: (a, b) => matches.get(b.c.id).score - matches.get(a.c.id).score || cmp(txt(a.c), txt(b.c)),
            recent: (a, b) => b.c.created - a.c.created,
            alpha: (a, b) => cmp(txt(a.c), txt(b.c)),
            'alpha-rev': (a, b) => cmp(txt(b.c), txt(a.c)),
            due: (a, b) => (a.c.state === 'new') - (b.c.state === 'new') || a.c.due - b.c.due,
            hard: (a, b) => b.c.errors - a.c.errors || b.c.lapses - a.c.lapses || a.c.ease - b.c.ease
        };
        rows = [...rows].sort(sorters[sortKey] || sorters.recent);
        return { rows, statusCounts, globalHits, searching: !!matches };
    }
    highlightResults() {
        const sm = this._sm;
        if (!this.ui.search.trim() || !sm) return;
        const tokens = [...sm.q.terms, ...sm.q.phrases];
        sm.map.forEach(m => m.fuzzy.forEach(w => tokens.push(w)));
        const uniq = [...new Set(tokens.filter(t => t.length >= 1))].sort((a, b) => b.length - a.length);
        if (!uniq.length) return;
        const ACC = { a: 'aàâäáãå', e: 'eéèêë', i: 'iîïíì', o: 'oôöóòõ', u: 'uùûüú', c: 'cç', y: 'yÿ', n: 'nñ', "'": "'’" };
        const rx = new RegExp(uniq.map(t => [...t].map(ch => (ACC[ch] ? `[${ACC[ch]}]` : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('')).join('|'), 'giu');
        $$('#card-list .q, #card-list .a').forEach(root => {
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            const nodes = [];
            while (walker.nextNode()) nodes.push(walker.currentNode);
            nodes.forEach(node => {
                const text = node.nodeValue;
                rx.lastIndex = 0;
                if (!rx.test(text)) return;
                rx.lastIndex = 0;
                const frag = document.createDocumentFragment();
                let last = 0, m;
                while ((m = rx.exec(text))) {
                    if (!m[0]) { rx.lastIndex++; continue; }
                    frag.append(text.slice(last, m.index));
                    const mk = document.createElement('mark'); mk.className = 'hl'; mk.textContent = m[0];
                    frag.append(mk);
                    last = m.index + m[0].length;
                }
                frag.append(text.slice(last));
                node.replaceWith(frag);
            });
        });
    }
    renderDeckPanel() {
        const ui = this.ui, panel = $('#deck-panel');
        if (!panel) return;
        const deck = this.deck(ui.deck);
        const { rows, statusCounts, globalHits, searching } = this.filteredCards();
        const now = Date.now();
        let title, actions = '';
        if (ui.deck === 'all') title = `📂 Toutes les cartes`;
        else if (ui.deck === 'errors') {
            title = `${ic('target')} Mes erreurs`;
            actions = statusCounts.all ? `<button class="btn btn-primary btn-sm" data-action="practice-errors">${ic('play')}Retravailler</button>` : '';
        } else {
            const chain = this.deckChain(deck.id), parent = chain.length > 1 ? chain[chain.length - 2] : null, dst = this.deckStats().get(deck.id);
            title = `${parent ? `<button class="crumb-back" data-action="select-deck" data-deck="${esc(parent.id)}">${ic('chevronLeft')}${esc(parent.name)}</button>` : `<button class="crumb-back" data-action="select-deck" data-deck="all">${ic('chevronLeft')}Tous les paquets</button>`}${chain.length > 2 ? `<span class="crumb-path">${esc(chain.slice(0, -1).map(d => d.name).join(' › '))}</span>` : ''}<span class="deck-title">${esc(deck.emoji)} ${esc(deck.name)}</span>`;
            actions = `
                <button class="btn btn-primary btn-sm" data-action="study" data-deck="${esc(deck.id)}">${ic('play')}Réviser</button>
                <button class="btn btn-soft btn-sm" data-action="free-deck" data-deck="${esc(deck.id)}" title="Toutes les cartes du paquet et des sous-paquets, sans toucher au planning">${ic('repeat')}Libre</button>
                <button class="btn btn-soft btn-sm" data-action="ordered-deck" data-deck="${esc(deck.id)}" title="Les cartes du paquet et des sous-paquets, dans l'ordre du cours, sans toucher au planning">${ic('list')}Ordre</button>
                <button class="icon-btn" title="Plus d'actions sur ce paquet" aria-label="Plus d'actions sur ce paquet" data-action="deck-admin" data-deck="${esc(deck.id)}">${ic('more')}</button>`;
        }
        const chipDefs = [['all', 'Toutes'], ['new', 'Nouvelles'], ['learn', 'En cours'], ['due', 'À revoir'], ['mature', 'Maîtrisées']];
        if (statusCounts.susp || ui.filter === 'susp') chipDefs.push(['susp', 'Suspendues']);
        if (statusCounts.buried || ui.filter === 'buried') chipDefs.push(['buried', 'Enfouies']);
        const chips = chipDefs.map(([k, l]) => `<button class="chip ${ui.filter === k ? 'active' : ''}" data-action="filter" data-filter="${k}">${k !== 'all' ? `<span class="dot" style="background:${STATUS[k].color}"></span>` : ''}${l} <span class="count">${statusCounts[k]}</span></button>`).join('');
        const shown = rows.slice(0, ui.limit);
        const showDeck = ui.deck === 'all' || ui.deck === 'errors';
        const list = shown.map(({ c, s }) => {
            const dk = showDeck ? this.deck(c.deckId) : null;
            const when = s === 'susp' ? 'Suspendue' : s === 'buried' ? 'Enfouie jusqu\'à demain' : c.state === 'new' ? 'Jamais vue' : s === 'due' ? 'À revoir maintenant' : `Révision ${fmtRelativeFuture(c.due, now)}`;
            const checked = ui.sel.has(c.id);
            return `
            <div class="card-row ${s === 'susp' || s === 'buried' ? 'is-susp' : ''} ${checked ? 'selected' : ''}" data-action="row-click" data-card="${esc(c.id)}">
                ${ui.selMode ? `<span class="row-check ${checked ? 'on' : ''}">${checked ? ic('check') : ''}</span>` : ''}
                <span class="dot" style="background:${STATUS[s].color}" title="${STATUS[s].one}"></span>
                <div class="body">
                    <div class="q rich">${c.front}</div>
                    <div class="a">${esc(truncate(stripHtml(c.back), 220)) || (hasImage(c.back) ? '[image]' : '')}</div>
                    <div class="meta">
                        ${c.flag ? `<span style="color:${FLAGS[c.flag].color}" title="Drapeau ${FLAGS[c.flag].name.toLowerCase()}">${ic('flag', 'i-flag')}</span>` : ''}${c.marked ? `<span style="color:#eab308" title="Marquée">${ic('star', 'i-fill')}</span>` : ''}
                        ${dk ? `<span class="tag">${esc(dk.emoji)} ${esc(this.deckPath(dk.id))}</span>` : ''}
                        ${c.kind !== 'basic' ? `<span class="tag">${c.kind === 'cloze' ? `trou ${c.ord}` : c.kind === 'occl' ? `cadre ${c.ord}` : c.kind === 'custom' ? esc(this.noteTypeName(c)) : c.ord ? 'inversée' : 'liée'}</span>` : ''}
                        <span>${when}</span>
                        ${c.errors ? `<span style="color:var(--due)">${plural(c.errors, 'erreur')}</span>` : ''}
                        ${c.tags.map(t => `<span>#${esc(t)}</span>`).join('')}
                    </div>
                </div>
                <div class="actions">
                    <button class="icon-btn icon-btn-sm" title="Plus d'actions" data-action="row-menu" data-card="${esc(c.id)}">${ic('more')}</button>
                </div>
            </div>`;
        }).join('');
        let emptyMsg;
        if (searching) {
            emptyMsg = globalHits && ui.deck !== 'all'
                ? `Aucun résultat dans ce paquet pour « ${esc(ui.search.trim())} ».<br><button class="btn btn-primary btn-sm" style="margin-top:12px" data-action="select-deck" data-deck="all">${ic('search')}Voir les ${plural(globalHits, 'résultat')} dans tous les paquets</button>`
                : `Aucune carte ne correspond à « ${esc(ui.search.trim())} ».<br><span class="small">Essaie un mot plus court, ou vérifie l'orthographe.</span>`;
            if (!globalHits || ui.deck === 'all') emptyMsg += `<br><button class="btn btn-soft btn-sm" style="margin-top:12px" data-action="new-card-from-search">${ic('plus')}Créer une carte « ${esc(truncate(ui.search.trim(), 30))} »</button>`;
        } else emptyMsg = ui.deck === 'errors' ? 'Aucune erreur à retravailler. Les cartes que tu rates apparaîtront ici. 🎉' : 'Aucune carte ici pour le moment.';
        const resultLine = searching && statusCounts.all ? `<div class="result-line">${ic('search')}<span><b>${plural(statusCounts.all, 'résultat')}</b>${ui.deck !== 'all' ? ' dans ce paquet' : ''}${ui.deck !== 'all' && globalHits > statusCounts.all ? ` · <button class="link" data-action="select-deck" data-deck="all">${globalHits} dans tous les paquets</button>` : ''}</span></div>` : '';
        let progBlock = '';
        if (deck) {
            const stats = this.deckStats(), st = stats.get(deck.id), kids = this.childrenOf(deck.id);
            progBlock = `<div class="deck-prog">
                <div class="deck-prog-main">${this.progressHtml(st, 'lg')}<div class="small muted"><b>${this.pctSeen(st)} %</b> vu · <b>${this.pctMature(st)} %</b> maîtrisé · ${st.due ? `<b style="color:var(--due)">${st.due}</b> à revoir · ` : ''}${st.new} nouvelle${st.new > 1 ? 's' : ''}</div></div>
                ${kids.length ? `<div class="sub-progress"><h5>Sous-paquets</h5>${kids.map(k => { const ks = stats.get(k.id), n = this.childrenOf(k.id).length; return `<button class="sub-card" data-action="select-deck" data-deck="${esc(k.id)}"><span class="sc-top"><span>${esc(k.emoji)}</span><b>${esc(k.name)}</b>${ks.due ? `<span class="due-badge">${ks.due}</span>` : ''}</span>${this.progressHtml(ks)}<small>${this.pctSeen(ks)} % vu · ${this.pctMature(ks)} % maîtrisé · ${plural(ks.total, 'carte')}${n ? ` · ${plural(n, 'sous-paquet')}` : ''}</small></button>`; }).join('')}</div>` : ''}
            </div>`;
        }
        const selCount = ui.selMode ? [...ui.sel].filter(id => this.card(id)).length : 0;
        const bulk = ui.selMode ? `<div class="bulk-bar"><span><b>${selCount}</b> sélectionnée${selCount > 1 ? 's' : ''}</span>
                <button class="btn btn-soft btn-sm" data-action="sel-all">${rows.length && rows.every(r => ui.sel.has(r.c.id)) ? `Tout désélectionner` : `Tout sélectionner (${rows.length})`}</button>
                <button class="btn btn-primary btn-sm" data-action="bulk-menu" ${selCount ? '' : 'disabled'}>${ic('more')}Actions</button>
                <button class="icon-btn" title="Quitter la sélection" data-action="sel-exit">${ic('x')}</button></div>` : '';
        panel.innerHTML = `
            <div class="deck-panel-head"><h3>${title} <span class="tag">${plural(statusCounts.all, 'carte')}</span></h3><div class="deck-panel-actions">${actions}
                <button class="btn ${ui.selMode ? 'btn-primary' : 'btn-soft'} btn-sm" data-action="sel-toggle" title="Sélectionner plusieurs cartes">${ic('checkSq')}<span class="hide-mobile">Sélection</span></button>
                <button class="btn btn-soft btn-sm" data-action="custom-study" data-deck="${deck ? esc(deck.id) : ''}" title="Révisions personnalisées">${ic('sliders')}<span class="hide-mobile">Perso</span></button></div></div>
            ${progBlock}
            <div class="filter-row"><div class="chip-row">${chips}</div></div>
            ${resultLine}
            <div id="card-list">${list || `<div class="empty">${ic('search')}<p>${emptyMsg}</p></div>`}</div>
            ${rows.length > ui.limit ? `<div class="load-more"><button class="btn btn-soft" data-action="more">Afficher plus (${rows.length - ui.limit} restantes)</button></div>` : ''}
            ${bulk}`;
        this.visibleIds = rows.map(r => r.c.id);
        this.highlightResults();
    }

    /* ---------- Settings ---------- */
    renderSettings() {
        const s = this.data.settings;
        const seg = (key, options) => `<div class="segmented">${options.map(([v, l]) => `<button class="${String(s[key]) === String(v) ? 'active' : ''}" data-action="set" data-key="${key}" data-value="${v}">${l}</button>`).join('')}</div>`;
        const sw = (key, label) => `<label class="switch"><input type="checkbox" data-input="toggle" data-key="${key}" ${s[key] ? 'checked' : ''} aria-label="${esc(label)}"><span></span></label>`;
        $('#view-settings').innerHTML = `
        <div class="stack settings">
            <div><h2 class="page-title">Paramètres</h2><p class="page-sub">Personnalise l'apparence et ta façon de réviser.</p></div>

            ${this.extrasSettingsHtml()}
            ${this.ambientSettingsHtml()}
            <div class="panel panel-pad set-section">
                <h3>${ic('palette')} Thème</h3>
                <p class="small muted">Chaque thème change tout le design : couleurs, typographie, formes.</p>
                ${THEME_GROUPS.map(([g, gl]) => `
                <div class="theme-group"><h5>${gl}</h5>
                <div class="theme-grid">
                    ${THEMES.filter(t => t.group === g).map(t => `
                    <button class="theme-opt ${s.theme === t.id ? 'active' : ''}" data-action="set" data-key="theme" data-value="${t.id}" aria-pressed="${s.theme === t.id}">
                        <div class="theme-prev" style="background:${t.p.bg}">
                            <div class="tp-bar" style="background:${t.p.surface};border:1px solid ${t.p.line}"><span style="background:${t.p.primary}"></span></div>
                            <div class="tp-hero" style="background:${t.p.hero}"></div>
                            <div class="tp-row">
                                <div class="tp-card" style="background:${t.p.surface};border:1px solid ${t.p.line}"><div class="tp-line" style="background:${t.p.text};width:80%"></div><div class="tp-line" style="background:${t.p.line};width:50%"></div></div>
                                <div class="tp-card" style="background:${t.p.surface};border:1px solid ${t.p.line}"><div class="tp-btn" style="background:${t.p.primary}"></div></div>
                            </div>
                        </div>
                        <div class="theme-name"><span style="font-family:'${t.font}',system-ui">${t.name}</span><small>${t.desc}</small>${s.theme === t.id ? `<span class="theme-check">${ic('check')}</span>` : ''}</div>
                    </button>`).join('')}
                </div></div>`).join('')}
                <div class="set-row">
                    <div class="txt"><b>Taille du texte des cartes</b><span>Pour la question et la réponse pendant les révisions.</span></div>
                    ${seg('cardSize', [['s', 'S'], ['m', 'M'], ['l', 'L'], ['xl', 'XL']])}
                </div>
            </div>

            <div class="panel panel-pad set-section">
                <h3>${ic('repeat')} Révision</h3>
                <div class="set-row">
                    <div class="txt"><b>Nouvelles cartes par jour</b><span>Combien de cartes jamais vues découvrir chaque jour. Les cartes <b>à revoir</b> (celles dont la date de révision est arrivée) ne sont jamais limitées.</span></div>
                    ${seg('newPerDay', [[5, '5'], [10, '10'], [20, '20'], [30, '30'], [50, '50'], [9999, '∞']])}
                </div>
                <div class="set-row">
                    <div class="txt"><b>Façon de répondre</b><span>Retourner la carte, ou taper la réponse (correction automatique).</span></div>
                    ${seg('answerMode', [['flip', 'Retourner'], ['type', 'Écrire']])}
                </div>
                <div class="set-row">
                    <div class="txt"><b>Afficher le délai sur les boutons</b><span>Montre quand la carte reviendra (ex. « 4 j ») sous chaque bouton.</span></div>
                    ${sw('showIntervals', 'Afficher le délai')}
                </div>
                <div class="set-row">
                    <div class="txt"><b>Lecture audio automatique</b><span>Lit la question à voix haute à chaque carte.</span></div>
                    ${sw('autoSpeak', 'Lecture audio automatique')}
                </div>
                <div class="set-row">
                    <div class="txt"><b>Jouer les sons des cartes</b><span>Lance automatiquement l'audio enregistré sur la carte (question, puis réponse).</span></div>
                    ${sw('autoAudio', 'Jouer les sons des cartes')}
                </div>
                <div class="set-row">
                    <div class="txt"><b>Le jour change à</b><span>Les révisions de la nuit comptent pour la veille, comme dans Anki (4 h par défaut).</span></div>
                    ${seg('rolloverHour', [[0, 'Minuit'], [3, '3 h'], [4, '4 h'], [6, '6 h']])}
                </div>
            </div>

            <div class="panel panel-pad set-section" id="goals-panel">
                <h3>${ic('target')} Objectifs / examens</h3>
                <p class="small muted">Chaque objectif a son compte à rebours sur l'accueil. Ajoute-en autant que tu veux.</p>
                <div class="goal-list">${this.goalsAll().map(g => `<div class="goal-row ${g.days < 0 ? 'past' : ''}"><div class="gr-main"><b>${esc(g.name)}</b><span class="small muted">${esc(this.goalDateLabel(g.date))}</span>${g.deck && this.deck(g.deck) ? `<span class="small gr-deck">${esc(this.deck(g.deck).emoji)} ${esc(this.deck(g.deck).name)}</span>` : ''}</div><span class="goal-days ${g.days <= 7 && g.days >= 0 ? 'soon' : ''}">${g.days > 0 ? `J-${g.days}` : g.days === 0 ? 'Aujourd\'hui' : 'Terminé'}</span><button class="icon-btn" data-action="goal-del" data-id="${esc(g.id)}" title="Supprimer cet objectif" aria-label="Supprimer ${esc(g.name)}">${ic('trash')}</button></div>`).join('') || '<p class="small muted" style="margin:6px 0">Aucun objectif pour l\'instant.</p>'}</div>
                <div class="goal-add">
                    <input class="input" id="goal-name" placeholder="Nom de l'objectif" aria-label="Nom de l'objectif" maxlength="40">
                    <input class="input" id="goal-date" aria-label="Date de l'objectif" type="date">
                    <select class="select" id="goal-deck" aria-label="Cours lié (facultatif)"><option value="">Cours lié : aucun</option>${this.sortedDecks().map(d => `<option value="${esc(d.id)}">${esc(d.emoji)} ${esc(this.deckPath(d.id).split(' › ').slice(-2).join(' › '))}</option>`).join('')}</select>
                    <button class="btn btn-primary btn-sm" data-action="goal-add">${ic('plus')}Ajouter</button>
                </div>
            </div>

            <div class="panel panel-pad set-section" id="study-options">
                <h3>${ic('brain')} Algorithme et options d'étude</h3>
                <p class="small muted">Préréglage « Par défaut », utilisé par tous les paquets. Pour avoir plusieurs préréglages (ex. un pour les langues), ouvre les options d'un paquet (bouton ${ic('sliders')} dans Paquets &amp; Cartes).</p>
                ${this.optionsFormHtml(s, 'gs')}
                <div style="display:flex;justify-content:flex-end;margin-top:16px"><button class="btn btn-primary" data-action="save-options">${ic('check')}Enregistrer les options</button></div>
            </div>

            <div class="panel panel-pad set-section">
                <h3>${ic('cloud')} Synchronisation cloud</h3>
                <div class="set-row">
                    <div class="txt"><b>Synchroniser entre mes appareils</b><span id="sync-status">...</span></div>
                    <div style="display:flex;gap:10px;align-items:center">
                        <button class="btn btn-soft btn-sm" data-action="sync-now" ${s.cloudSync ? '' : 'disabled'}>${ic('refresh')}Synchroniser</button>
                        ${sw('cloudSync', 'Synchronisation cloud')}
                    </div>
                </div>
                <div class="set-row">
                    <div class="txt"><b>${ic('lock')} Clé de synchronisation (chiffrement)</b><span>Une phrase secrète que toi seul connais. Tes données sont chiffrées sur ton appareil avant d'être envoyées : sans la clé, personne ne peut les lire. <b>Entre la même phrase sur tous tes appareils</b> et garde-la : elle ne peut pas être récupérée.</span></div>
                    <div class="opt-ctl" style="min-width:260px;display:flex;gap:8px"><input class="input" id="sync-key-input" type="password" value="${esc(s.syncKey)}" placeholder="${s.syncKey ? '••••••••' : 'au moins 8 caractères'}" autocomplete="off"><button class="btn btn-soft" data-action="save-sync-key">OK</button></div>
                </div>
                ${s.syncKey ? '' : `<p class="small" style="color:var(--learn)">${ic('alert')} Sans clé, tes données sont stockées sans chiffrement dans un espace partagé.</p>`}
                <p class="small muted">Les appareils sont <b>fusionnés carte par carte</b> : tu peux réviser hors ligne sur plusieurs appareils sans rien perdre.</p>
            </div>

            <div class="panel panel-pad set-section">
                <h3>${ic('file')} Données</h3>
                <div class="set-row">
                    <div class="txt"><b>Sauvegarde</b><span>Exporte tout (cartes, images, progression) dans un fichier, ou restaure une sauvegarde.</span></div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                        <button class="btn btn-soft btn-sm" data-action="export">${ic('export')}Exporter</button>
                        <button class="btn btn-soft btn-sm" data-action="import-json">${ic('import')}Restaurer</button>
                    </div>
                </div>
                <div class="set-row">
                    <div class="txt"><b>Importer des fiches</b><span>Depuis un fichier TXT / CSV (ou un export texte d'Anki ou de Quizlet).</span></div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                        <button class="btn btn-soft btn-sm" data-action="import">${ic('import')}Importer</button>
                        <button class="btn btn-soft btn-sm" data-action="export-txt">${ic('export')}Exporter en TXT</button>
                    </div>
                </div>
                <div class="set-row" style="align-items:flex-start">
                    <div class="txt"><b>Sauvegardes automatiques</b><span>Une copie est faite chaque jour dans ton navigateur (7 gardées). Utile en cas d'erreur.</span><div id="backup-list" class="backup-list"></div></div>
                    <div style="display:flex;gap:10px;align-items:center">${sw('autoBackup', 'Sauvegardes automatiques')}<button class="btn btn-soft btn-sm" data-action="backup-now">${ic('plus')}Maintenant</button></div>
                </div>
                <div class="set-row">
                    <div class="txt"><b>Réviser par petits groupes</b><span>Coupe la session après N cartes ; tu peux enchaîner avec le groupe suivant. « Tout » = pas de coupure.</span></div>
                    ${seg('sessionSize', [[0, 'Tout'], [10, '10'], [20, '20'], [30, '30'], [50, '50']])}
                </div>
                <div class="set-row">
                    <div class="txt"><b>Équilibrer la charge de révision</b><span>Quand plusieurs dates sont possibles pour une carte, choisit le jour le moins chargé : moins de jours à pic.</span></div>
                    ${sw('loadBalance', 'Équilibrer la charge')}
                </div>
                <div class="set-row">
                    <div class="txt"><b>Remettre la progression à zéro</b><span>Toutes les cartes redeviennent nouvelles. Les cartes sont conservées.</span></div>
                    <button class="btn btn-danger-soft btn-sm" data-action="reset-progress">${ic('reset')}Remettre à zéro</button>
                </div>
                <div class="set-row">
                    <div class="txt"><b>Réinitialiser l'application</b><span>Efface tout et recharge les ${SEED_CARDS_RAW.length} cartes d'origine.</span></div>
                    <button class="btn btn-danger-soft btn-sm" data-action="reset-all">${ic('trash')}Tout réinitialiser</button>
                </div>
            </div>

            ${this.fsrsPanelHtml()}
            ${this.toolsPanelHtml()}

            <div class="panel panel-pad set-section">
                <h3>${ic('keyboard')} Raccourcis clavier</h3>
                <div class="kbd-list">
                    <span><kbd class="k">Espace</kbd></span><span>Afficher la réponse, puis « Bien »</span>
                    <span><kbd class="k">1</kbd> <kbd class="k">2</kbd> <kbd class="k">3</kbd> <kbd class="k">4</kbd></span><span>Raté · Difficile · Bien · Facile (ou choix du quiz)</span>
                    <span><kbd class="k">Z</kbd></span><span>Annuler la dernière réponse</span>
                    <span><kbd class="k">E</kbd> · <kbd class="k">I</kbd></span><span>Modifier · informations de la carte</span>
                    <span><kbd class="k">*</kbd> · <kbd class="k">@</kbd> · <kbd class="k">!</kbd></span><span>Marquer · suspendre la carte · suspendre la note</span>
                    <span><kbd class="k">-</kbd> · <kbd class="k">=</kbd></span><span>Enfouir la carte · la note (jusqu'à demain)</span>
                    <span><kbd class="k">Ctrl</kbd> + <kbd class="k">Z</kbd> / <kbd class="k">Y</kbd></span><span>Annuler / rétablir une modification (hors révision)</span>
                    <span><kbd class="k">H</kbd></span><span>Afficher l'indice</span>
                    <span><kbd class="k">Échap</kbd></span><span>Quitter la session / fermer une fenêtre</span>
                    <span><kbd class="k">Ctrl</kbd> + <kbd class="k">Entrée</kbd></span><span>Enregistrer une carte</span>
                    <span><kbd class="k">Ctrl</kbd> + <kbd class="k">K</kbd> ou <kbd class="k">/</kbd></span><span>Rechercher une carte</span>
                </div>
            </div>

            <p class="tiny faint" style="text-align:center">LH Cards · ${s.scheduler === 'fsrs' ? 'FSRS' : 'SM-2'} · ${plural(this.data.cards.length, 'carte')} · Stockage ${Storage.db ? 'IndexedDB' : 'local'}</p>
        </div>`;
        this.bindOptionsForm($('#study-options'));
        this.renderSyncIndicator();
        this.fillBackups();
    }
    async fillBackups() {
        const box = $('#backup-list');
        if (!box) return;
        const list = (await Storage.backups()).sort((a, b) => b.at - a.at);
        const el = $('#backup-list');
        if (!el) return;
        el.innerHTML = list.length ? list.map(b => `<div class="backup-row"><span><b>${new Date(b.at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</b> · ${b.label} · ${plural(b.cards, 'carte')}</span>
            <span><button class="btn btn-soft btn-sm" data-action="backup-restore" data-key="${esc(b.key)}">Restaurer</button><button class="icon-btn icon-btn-sm" title="Télécharger" data-action="backup-download" data-key="${esc(b.key)}">${ic('export')}</button><button class="icon-btn icon-btn-sm danger" title="Supprimer" data-action="backup-delete" data-key="${esc(b.key)}">${ic('trash')}</button></span></div>`).join('')
            : `<span class="small faint">${Storage.db ? 'Aucune sauvegarde pour l\'instant.' : 'Indisponible sur ce navigateur.'}</span>`;
    }

    /* ============================================================
       Sessions: srs (Anki review), practice, quiz, chrono
       ============================================================ */
    startStudy(deckId, extraNew = 0) {
        if (deckId) this.touchDeck(deckId);
        this.noteLast('study', deckId || '');
        const deckIds = deckId ? [deckId] : null;
        const plan = this.studyPlan(deckIds, extraNew);
        const cfg0 = deckId ? this.deckCfg(deckId) : this.defaultCfg();
        const sorters = { due: (a, b) => a.due - b.due, ivlAsc: (a, b) => a.interval - b.interval, ivlDesc: (a, b) => b.interval - a.interval, easeAsc: (a, b) => a.ease - b.ease, added: (a, b) => a.created - b.created };
        const revs = cfg0.reviewSort === 'random' ? shuffle([...plan.reviews]) : [...plan.reviews].sort(sorters[cfg0.reviewSort]);
        const revIds = revs.map(c => c.id), newIds = plan.news.map(c => c.id);
        let queue = cfg0.newReviewOrder === 'after' ? [...revIds, ...newIds] : cfg0.newReviewOrder === 'before' ? [...newIds, ...revIds] : interleave(revIds, newIds);
        const group = this.data.settings.sessionSize;
        const grouped = group > 0 && queue.length > group;
        if (grouped) queue = queue.slice(0, group);
        if (!queue.length && !plan.learning.length) {
            if (plan.freshTotal > 0 && !extraNew) {
                this.confirm({
                    title: 'Objectif du jour atteint 🎉', message: `Tu as déjà découvert tes nouvelles cartes du jour (limite : ${this.data.settings.newPerDay}). Veux-tu en apprendre 10 de plus ?`,
                    ok: 'Apprendre 10 de plus'
                }).then(y => { if (y) this.startStudy(deckId, 10); });
            } else {
                this.confirm({ title: 'Tout est à jour 🎉', message: 'Rien à réviser ici pour l\'instant. Veux-tu t\'entraîner quand même (sans impact sur le planning) ?', ok: 'Révision libre' })
                    .then(y => { if (y) { if (deckId) this.startFree(deckId); else this.startPractice(null, 'flip', 20); } });
            }
            return;
        }
        const deck = deckId && this.deck(deckId);
        this.beginSrs(deck ? this.deckLabel(deck) : 'Révision du jour', queue, plan.learning, { deckId: deckId || null, grouped });
    }
    /* Starts a scheduled (Anki-style) session on an explicit list of cards: custom study, review ahead... */
    startSrsIds(title, ids, keepOrder = false) {
        const ok = ids.filter(id => { const c = this.card(id); return c && !c.suspended; });
        const queue = keepOrder ? ok : shuffle(ok);
        const learning = [];
        if (!queue.length) { this.toast('Aucune carte à étudier.', 'warning'); return; }
        this.beginSrs(title, queue, learning);
    }
    beginSrs(title, queue, learning, extra = {}) {
        this.session = {
            kind: 'srs', title, answer: this.data.settings.answerMode, queue, learning, current: null, lastId: null,
            revealed: false, typed: null, done: 0, correct: 0, missed: [], history: [], startedAt: Date.now(), cardStart: Date.now(), ...extra
        };
        this.go('session');
        this.nextCard();
    }
    startPractice(deckIds, answer = 'flip', count = 20, title, fromIds, ordered = false) {
        let ids = fromIds || this.poolFor(deckIds).map(c => c.id);
        if (!ids.length) { this.toast('Aucune carte disponible.', 'warning'); return false; }
        ids = ordered ? ids : shuffle([...ids]).slice(0, count >= 9999 ? ids.length : count);
        const deck = deckIds && deckIds.length === 1 && this.deck(deckIds[0]);
        this.session = {
            kind: 'practice', title: title || (answer === 'type' ? 'Écrire' : 'Entraînement') + (deck ? ` · ${this.deckPath(deck.id)}` : ''),
            answer, queue: ids, total: ids.length, retries: {}, current: null, revealed: false, typed: null,
            done: 0, correct: 0, missed: [], history: [], startedAt: Date.now(), cardStart: Date.now()
        };
        this.go('session');
        this.nextCard();
        return true;
    }
    /* Free revision: every card of the deck and its sub-decks, in random order, no impact on the schedule.
       Missed cards are put back at the end of the queue (see practiceAnswer). */
    async startFree(deckId, ordered = false, auto = false) {
        this.touchDeck(deckId);
        this.noteLast(ordered ? 'ordered' : 'free', deckId);
        const d = this.deck(deckId), name = d ? this.deckPath(d.id) : '';
        if (!ordered) { this.startPractice([deckId], this.data.settings.answerMode, 9999, `Révision libre · ${name}`); return; }
        /* in order: sub-decks as listed (depth first), cards in the order they were written, then cloze number */
        const rank = new Map(); let n = 0;
        const walk = id => { rank.set(id, n++); this.childrenOf(id).forEach(k => walk(k.id)); };
        walk(deckId);
        const all = this.poolFor([deckId]).sort((a, b) => (rank.get(a.deckId) - rank.get(b.deckId)) || (a.created - b.created) || ((a.ord || 0) - (b.ord || 0))).map(c => c.id);
        const pos = (this.data.settings.ordPos || {})[deckId];
        let from = 0;
        if (pos && pos.i > 0 && pos.i < all.length && pos.n === all.length) {
            if (auto) from = pos.i;
            else {
            const pick = await this.choose({ title: 'Reprendre où tu t\'étais arrêté ?', message: `Tu en étais à la carte <b>${pos.i + 1} sur ${all.length}</b> de « ${esc(name)} ».`, options: [{ label: 'Recommencer au début', value: 'restart' }, { label: `Reprendre (carte ${pos.i + 1})`, value: 'resume', primary: true }] });
            if (pick === null) return;
            if (pick === 'resume') from = pos.i;
            }
        }
        const started = this.startPractice([deckId], this.data.settings.answerMode, 9999, `Dans l'ordre · ${name}`, all.slice(from), true);
        if (started && this.session) { this.session.ordKey = deckId; this.session.ordAll = all; this.session.ordMax = from - 1; }
    }
    poolFor(deckIds) {
        if (deckIds === 'errors') return this.errorCards();
        const set = deckIds ? new Set(deckIds.flatMap(id => this.descendantIds(id))) : null;
        return this.data.cards.filter(c => !c.suspended && (!set || set.has(c.deckId)));
    }
    endSession(goHome = true) {
        const s = this.session;
        if (!s) return;
        this.sessionCleanup();
        if (s.timer) clearInterval(s.timer);
        clearTimeout(this.autoTimer);
        if ('speechSynthesis' in window) speechSynthesis.cancel();
        this.session = null;
        document.body.classList.remove('in-session');
        if (Cloud.deferred) { Cloud.deferred = false; setTimeout(() => Cloud.sync(), 300); }
        if (goHome) this.goBack();
    }
    /* After a session: back to the screen it was started from (same deck, same scroll), the dashboard otherwise */
    goBack() {
        const b = this.back; this.back = null;
        if (!b || !['dashboard', 'decks', 'stats', 'toeic'].includes(b.view)) { this.go('dashboard'); return; }
        this.go(b.view, b.view === 'decks' && b.deck !== undefined && (b.deck === 'all' || b.deck === 'errors' || this.deck(b.deck)) ? { deck: b.deck, filter: b.filter } : {});
        if (b.y) window.scrollTo({ top: b.y, behavior: 'instant' in window ? 'instant' : 'auto' });
    }
    quitSession() {
        const s = this.session;
        if (!s) return;
        if (s.kind === 'chrono') { this.finishChrono(); return; }
        if (s.kind !== 'srs' && s.done > 0) { this.showSummary(); return; }
        const done = s.done;
        this.endSession(true);
        if (done) this.toast(`Progression enregistrée (${plural(done, 'carte')})`, 'success');
    }

    nextCard() {
        const s = this.session;
        if (!s) return;
        let id = null;
        if (s.kind === 'srs') {
            const now = Date.now();
            s.learning.sort((a, b) => a.due - b.due);
            const first = s.learning[0];
            if (first && first.due <= now && !(first.id === s.lastId && s.queue.length)) id = s.learning.shift().id;
            else if (s.queue.length) id = s.queue.shift();
            else if (first && first.due - now <= this.data.settings.learnAhead * MIN) id = s.learning.shift().id;
        } else if (s.queue.length) id = s.queue.shift();
        if (!id || !this.card(id)) {
            if (id) return this.nextCard();
            return this.showSummary();
        }
        s.current = id; s.revealed = false; s.typed = null; s.cardStart = Date.now();
        this.renderSession();
        this.autoPlayAudio('.fc-front');
        if (this.data.settings.autoSpeak) this.speak('front');
        this.armAutoAdvance();
    }
    /* Auto-advance (Anki): show the answer after N s, then optionally answer by itself after M s */
    armAutoAdvance() {
        clearTimeout(this.autoTimer);
        const s = this.session;
        if (!s || !s.current || (s.kind !== 'srs' && s.kind !== 'practice')) return;
        const id = s.current, cfg = this.cfgFor(this.card(id));
        const ok = () => this.session === s && s.current === id && !this.modals.length && !this.popover;
        if (!s.revealed) {
            if (cfg.autoQSecs > 0 && s.answer === 'flip') this.autoTimer = setTimeout(() => { if (ok() && !s.revealed) this.reveal(); }, cfg.autoQSecs * 1000);
        } else if (cfg.autoASecs > 0 && cfg.autoAAction !== 'none') {
            this.autoTimer = setTimeout(() => {
                if (!ok() || !s.revealed) return;
                const a = cfg.autoAAction;
                if (a === 'bury') { this.opBury([id], false); return; }
                const g = { again: 1, hard: 2, good: 3, easy: 4 }[a];
                if (s.kind === 'srs') this.grade(g); else this.practiceAnswer(g >= 3);
            }, cfg.autoASecs * 1000);
        }
    }
    sessionCounts() {
        const s = this.session;
        const cur = s.current ? this.card(s.current) : null;
        const c = { new: 0, learn: s.learning ? s.learning.length : 0, due: 0 };
        s.queue.forEach(id => { const x = this.card(id); if (!x) return; if (x.state === 'new') c.new++; else if (x.state === 'review') c.due++; else c.learn++; });
        let curKey = null;
        if (cur) { curKey = cur.state === 'new' ? 'new' : cur.state === 'review' ? 'due' : 'learn'; c[curKey]++; }
        return { c, curKey };
    }
    renderSession() {
        const s = this.session, card = this.card(s.current), deck = this.deck(card.deckId);
        const set = this.data.settings, now = Date.now(), cfg = this.cfgFor(card);
        const typeMode = s.answer === 'type';
        let counter, progress;
        if (s.kind === 'srs') {
            const { c, curKey } = this.sessionCounts();
            counter = `<div class="session-counts">${['new', 'learn', 'due'].map(k => `<span class="${curKey === k ? 'cur' : ''}" style="color:${STATUS[k].color}" title="${STATUS[k].label}">${c[k]}</span>`).join('')}</div>`;
            const remaining = c.new + c.learn + c.due;
            progress = s.done / Math.max(1, s.done + remaining) * 100;
        } else {
            const remaining = s.queue.length + 1;
            counter = `<div class="session-counts"><span>${s.done + 1}<span class="faint">/${s.done + remaining}</span></span></div>`;
            progress = s.done / Math.max(1, s.done + remaining) * 100;
        }
        const grades = s.kind === 'srs'
            ? `<div class="grade-grid">${[[1, 'Raté', 'again'], [2, 'Difficile', 'hard'], [3, 'Bien', 'good'], [4, 'Facile', 'easy']].map(([g, l, v]) => `
                <button class="grade-btn ${s.typed && s.typed.suggest === g ? 'suggested' : ''}" style="--c:var(--${v})" data-action="grade" data-grade="${g}">
                    <span>${l} <kbd>${g}</kbd></span>${set.showIntervals ? `<small>${previewLabel(card, g, now, cfg)}</small>` : ''}
                </button>`).join('')}</div>`
            : `<div class="grade-grid two">
                <button class="grade-btn ${s.typed && s.typed.suggest === 1 ? 'suggested' : ''}" style="--c:var(--again)" data-action="practice-answer" data-ok="0"><span>${ic('x')} Raté <kbd>1</kbd></span></button>
                <button class="grade-btn ${s.typed && s.typed.suggest >= 3 ? 'suggested' : ''}" style="--c:var(--easy)" data-action="practice-answer" data-ok="1"><span>${ic('check')} Je savais <kbd>2</kbd></span></button>
              </div>`;
        const typed = s.typed;
        const typedBox = typeMode ? (s.revealed
            ? `<div class="type-result ${typed.verdict}">
                    <div class="verdict">${typed.verdict === 'ok' ? `${ic('check')} Correct !` : typed.verdict === 'close' ? `${ic('info')} Presque !` : `${ic('x')} Pas tout à fait`}</div>
                    <div class="muted small">Ta réponse : <b>${esc(typed.text) || '<i>(vide)</i>'}</b></div>
               </div>`
            : `<div class="type-box">
                    <textarea class="textarea" id="type-answer" rows="2" style="min-height:64px" placeholder="Tape ta réponse puis Entrée..." data-input="type-answer"></textarea>
               </div>`) : '';
        const csIdx = Object.keys(CARD_SIZES).indexOf(this.data.settings.cardSize);
        $('#view-session').innerHTML = `
        <div class="session">
            <div class="session-top">
                <button class="icon-btn" title="Quitter (Échap)" data-action="quit-session">${ic('x')}</button>
                <div class="session-title"><h3>${esc(s.title)}</h3><p>${s.kind === 'srs' ? 'Révision' : s.answer === 'type' ? 'Écrire · sans impact sur le planning' : 'Révision libre · sans impact sur le planning'}</p></div>
                ${counter}
                <button class="icon-btn sess-extra" title="Écouter" data-action="speak">${ic('volume')}</button>
                <button class="icon-btn" title="Annuler la dernière réponse (Z)" data-action="undo" ${s.history.length ? '' : 'disabled style="opacity:.35"'}>${ic('undo')}</button>
                <button class="icon-btn sess-extra" title="Modifier la carte (E)" data-action="edit-current">${ic('pencil')}</button>
                <button class="icon-btn sess-extra" title="Minuteur de concentration" aria-label="Minuteur" data-action="focus-toggle">${ic('timer')}</button>
                <button class="icon-btn" title="Plus d'actions" data-action="session-menu" aria-label="Plus d'actions">${ic('more')}</button>
            </div>
            <div class="pbar"><i style="width:${progress}%"></i></div>
            <div class="panel flashcard" ${s.revealed || typeMode ? '' : 'data-action="reveal" style="cursor:pointer"'}>
                <div class="fc-top">
                    <span class="tag" title="${esc(deck ? this.deckPath(deck.id) : '')}">${esc(deck ? deck.emoji + ' ' + this.deckPath(deck.id).split(' › ').slice(-2).join(' › ') : '')}</span>
                    <span class="fc-size" role="group" aria-label="Taille du texte"><button class="fc-size-btn" data-action="card-size" data-d="-1" aria-label="Texte plus petit" title="Texte plus petit" ${csIdx === 0 ? 'disabled' : ''}>A<small>−</small></button><button class="fc-size-btn" data-action="card-size" data-d="1" aria-label="Texte plus grand" title="Texte plus grand" ${csIdx === 3 ? 'disabled' : ''}>A<small>+</small></button></span>
                    <span class="tiny faint fc-badges">${card.flag ? `<span style="color:${FLAGS[card.flag].color}" title="${FLAGS[card.flag].name}">${ic('flag', 'i-flag')}</span>` : ''}${card.marked ? `<span style="color:#eab308" title="Marquée">${ic('star', 'i-fill')}</span>` : ''}${card.state === 'new' ? 'Nouvelle' : card.errors ? `${ic('target')} ${plural(card.errors, 'erreur')}` : ''}</span>
                </div>
                <div class="fc-content fc-front rich">${card.front}</div>
                ${!s.revealed && card.hint ? `<div class="fc-extra"><button class="pill-btn hint" data-action="hint">${ic('bulb')}Indice</button><div id="hint-slot"></div></div>` : ''}
                ${typedBox}
                ${s.revealed ? `
                    <hr class="fc-divider">
                    <div class="fc-content fc-back rich">${card.back || '<span class="faint">(pas de réponse)</span>'}</div>
                    ${card.hint || card.detail ? `<div class="fc-extra">
                        ${card.hint ? `<div class="hint-box rich">${ic('bulb')} ${card.hint}</div>` : ''}
                        ${card.detail ? `<button class="pill-btn" data-action="detail">${ic('plus')}En savoir plus</button><div id="detail-slot"></div>` : ''}
                    </div>` : ''}` : (!typeMode ? `<p class="fc-hint-tap">Touche la carte ou appuie sur Espace</p>` : '')}
            </div>
            <div class="study-actions">
                ${s.revealed ? grades
                    : typeMode ? `<button class="btn btn-primary btn-lg btn-block" data-action="submit-typed">${ic('check')}Vérifier</button>`
                    : `<button class="btn btn-primary btn-lg btn-block" data-action="reveal">${ic('eye')}Afficher la réponse</button>`}
            </div>
        </div>`;
        if (typeMode && !s.revealed) {
            const ta = $('#type-answer');
            if (ta && matchMedia('(hover: hover)').matches) setTimeout(() => ta.focus(), 30);
        }
    }
    reveal() {
        const s = this.session;
        if (!s || s.revealed) return;
        if (s.answer === 'type') return this.submitTyped();
        s.revealed = true;
        this.renderSession();
        this.autoPlayAudio('.fc-back');
        if (this.data.settings.autoSpeak) this.speak('back');
        this.armAutoAdvance();
    }
    submitTyped() {
        const s = this.session;
        if (!s || s.revealed) return;
        const card = this.card(s.current);
        const text = ($('#type-answer') || {}).value || '';
        const res = checkAnswer(text, this.cardAnswer(card));
        res.text = text.trim();
        res.suggest = res.verdict === 'ok' ? 3 : res.verdict === 'close' ? 2 : 1;
        s.typed = res; s.revealed = true;
        this.renderSession();
    }
    elapsedSec() {
        const s = this.session, c = s && s.current && this.card(s.current);
        return clamp((Date.now() - s.cardStart) / 1000, 1, c ? this.cfgFor(c).maxAnswerSecs : 60);
    }
    snapshot() {
        const s = this.session, c = this.card(s.current);
        s.history.push({
            card: { ...c, tags: [...c.tags], fs: c.fs ? { ...c.fs } : null }, stats: JSON.stringify(this.data.stats),
            sibs: c.nid ? this.data.cards.filter(x => x.nid === c.nid && x.id !== c.id).map(x => [x.id, x.buriedUntil]) : [],
            queue: [...s.queue], learning: s.learning ? s.learning.map(l => ({ ...l })) : null,
            done: s.done, correct: s.correct, missed: [...s.missed], retries: s.retries ? { ...s.retries } : null, current: s.current, ordMax: s.ordMax,
            revlogLen: this.data.revlog.length
        });
        if (s.history.length > 50) s.history.shift();
    }
    grade(g) {
        const s = this.session;
        if (!s || s.kind !== 'srs' || !s.revealed) return;
        const card = this.card(s.current), now = Date.now(), cfg = this.cfgFor(card);
        this.snapshot();
        const prev = card.state, prevIvl = card.interval, secs = this.elapsedSec();
        SCHED_LOAD = this.data.settings.loadBalance !== false ? this.loadMap(card.id) : null;
        Object.assign(card, schedule(card, g, now, true, cfg));
        SCHED_LOAD = null;
        card.reps++; card.lastReview = now;
        if (g === 1 && prev !== 'new' && prev !== 'learning') { card.errors++; card.wrong++; }
        else if (g >= 3 && prev === 'review') { card.errors = Math.max(0, card.errors - 1); card.right++; }
        this.rollSeen();
        const st = this.data.stats, bump = (seen, key) => {
            seen.count++;
            const owner = this.limitOwner(card.deckId, key);
            if (owner) seen.by[owner] = (seen.by[owner] || 0) + 1;
        };
        if (prev === 'new') bump(st.newSeen, 'newPerDay');
        else if (prev === 'review') bump(st.revSeen, 'maxReviews');
        let leech = false;
        if (g === 1 && prev === 'review' && cfg.leechThreshold > 0 && card.lapses >= cfg.leechThreshold && (card.lapses - cfg.leechThreshold) % Math.max(1, Math.ceil(cfg.leechThreshold / 2)) === 0) {
            leech = true;
            if (!card.tags.includes('leech')) card.tags.push('leech');
            if (cfg.leechAction === 'suspend') card.suspended = true;
        }
        if (card.nid && (cfg.buryNewSib || cfg.buryRevSib || cfg.buryLearnSib)) {
            const until = addDays(now, 1);
            const bury = x => x.nid === card.nid && x.id !== card.id && !x.suspended && !(x.buriedUntil > now)
                && (x.state === 'new' ? cfg.buryNewSib : x.state === 'review' ? cfg.buryRevSib : cfg.buryLearnSib);
            const gone = new Set();
            this.data.cards.forEach(x => { if (bury(x)) { x.buriedUntil = until; gone.add(x.id); } });
            s.queue = s.queue.filter(id => !gone.has(id)); s.learning = s.learning.filter(l => !gone.has(l.id));
        }
        if ((card.state === 'learning' || card.state === 'relearning') && !card.suspended) s.learning.push({ id: card.id, due: card.due });
        s.done++;
        if (g >= 2) s.correct++;
        if (g === 1 && !s.missed.includes(card.id)) s.missed.push(card.id);
        this.recordReview(g, secs);
        this.logReview(card, g, prev === 'review' ? 1 : prev === 'relearning' ? 2 : 0, prevIvl, secs * 1000);
        s.lastId = card.id;
        this.save();
        if (leech) this.toast(cfg.leechAction === 'suspend' ? 'Carte « sangsue » : suspendue (ratée trop souvent). Reformule-la !' : 'Carte « sangsue » : ratée trop souvent', 'warning', ic('alert'));
        this.nextCard();
    }
    practiceAnswer(ok) {
        const s = this.session;
        if (!s || s.kind !== 'practice' || !s.revealed) return;
        const card = this.card(s.current);
        this.snapshot();
        if (ok) { card.right++; card.errors = Math.max(0, card.errors - 1); s.correct++; }
        else {
            card.wrong++; card.errors++;
            if (!s.missed.includes(card.id)) s.missed.push(card.id);
            s.retries[card.id] = (s.retries[card.id] || 0) + 1;
            if (s.retries[card.id] <= 2) s.queue.push(card.id);   // missed cards come back at the very end, not right away
        }
        if (s.ordKey) {   // "in order" session: remember how far the user got, to offer to resume next time
            s.ordMax = Math.max(s.ordMax, s.ordAll.indexOf(card.id));
            const op = { ...(this.data.settings.ordPos || {}) };
            op[s.ordKey] = { i: s.ordMax + 1, n: s.ordAll.length, t: Date.now() };
            this.data.settings.ordPos = op;
        }
        s.done++;   // only the error counters are updated: no scheduling, stats, streak or history
        this.save();
        this.nextCard();
    }
    undo() {
        const s = this.session;
        if (!s || !s.history.length) return;
        const h = s.history.pop();
        const card = this.card(h.card.id);
        if (card) Object.assign(card, h.card);
        (h.sibs || []).forEach(([id, until]) => { const x = this.card(id); if (x) x.buriedUntil = until; });
        this.data.stats = normalizeStats(JSON.parse(h.stats));
        if (this.data.revlog.length > h.revlogLen) this.data.revlog.length = h.revlogLen;
        s.queue = h.queue; if (h.learning) s.learning = h.learning;
        s.done = h.done; s.correct = h.correct; s.missed = h.missed; if (h.retries) s.retries = h.retries;
        if (s.ordKey && h.ordMax !== undefined) {   // "in order" session: the saved position goes back too
            s.ordMax = h.ordMax;
            const op = { ...(this.data.settings.ordPos || {}) }; op[s.ordKey] = { i: s.ordMax + 1, n: s.ordAll.length, t: Date.now() };
            this.data.settings.ordPos = op;
        }
        s.current = h.current; s.revealed = false; s.typed = null; s.cardStart = Date.now();
        this.save();
        this.renderSession();
        this.renderStreak();
        this.toast('Dernière réponse annulée', 'success', ic('undo'));
    }
    speak(side) {
        if (!('speechSynthesis' in window)) { this.toast('Lecture audio non disponible sur ce navigateur', 'warning'); return; }
        const s = this.session;
        let html = '';
        if (s && s.current) { const c = this.card(s.current); html = side === 'back' || (!side && s.revealed) ? c.back : c.front; }
        else if (s && s.quizCard) html = this.card(s.quizCard).front;
        const text = stripHtml(html);
        if (!text) return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = guessLang(text);
        speechSynthesis.speak(u);
    }

    /* ---------- Quiz & Chrono ---------- */
    optionHtml(card) {
        const ans = this.cardAnswer(card), t = stripHtml(ans);
        return t ? esc(truncate(t, 170)) : `<span class="rich">${ans}</span>`;
    }
    /* review cards due per day (used to spread the load when picking a new interval) */
    loadMap(exceptId) {
        const m = new Map();
        this.data.cards.forEach(c => { if (c.state === 'review' && !c.suspended && c.id !== exceptId) { const k = startOfDay(c.due); m.set(k, (m.get(k) || 0) + 1); } });
        return m;
    }
    cardAnswer(c) { return c.kind === 'cloze' ? clozeAnswerHtml(c) : c.back; }
    startQuiz(deckIds, count, chrono = 0) {
        const pool = this.poolFor(deckIds).filter(c => c.kind !== 'cloze' && c.kind !== 'occl');
        if (this.data.cards.filter(c => c.kind !== 'cloze' && c.kind !== 'occl').length < 4) { this.toast('Il faut au moins 4 cartes pour un quiz.', 'warning'); return; }
        if (!pool.length) { this.toast('Aucune carte dans cette sélection.', 'warning'); return; }
        const deck = Array.isArray(deckIds) && deckIds.length === 1 ? this.deck(deckIds[0]) : null;
        const label = deckIds === 'errors' ? 'Mes erreurs' : deck ? deck.name : 'Tous les paquets';
        const ids = shuffle(pool.map(c => c.id));
        this.session = {
            kind: chrono ? 'chrono' : 'quiz', title: `${chrono ? 'Chrono' : 'Quiz'} · ${label}`,
            pool: ids, queue: chrono ? [...ids] : ids.slice(0, count >= 9999 ? ids.length : count),
            total: 0, index: 0, score: 0, answered: false, quizCard: null, options: [], missed: [], history: [],
            done: 0, correct: 0, startedAt: Date.now(), cardStart: Date.now(),
            duration: chrono, timeLeft: chrono, timer: null, combo: 0
        };
        this.session.total = this.session.queue.length;
        this.go('session');
        this.nextQuestion();
        if (chrono) {
            this.session.timer = setInterval(() => {
                const s = this.session;
                if (!s || s.kind !== 'chrono') return;
                s.timeLeft--;
                this.updateChronoHud();
                if (s.timeLeft <= 0) this.finishChrono();
            }, 1000);
        }
    }
    nextQuestion() {
        const s = this.session;
        if (!s) return;
        if (!s.queue.length) {
            if (s.kind === 'chrono') s.queue = shuffle([...s.pool]);
            else return this.showSummary();
        }
        const card = this.card(s.queue.shift());
        if (!card) return this.nextQuestion();
        s.quizCard = card.id; s.options = this.buildOptions(card); s.answered = false; s.cardStart = Date.now();
        this.renderQuiz();
    }
    renderQuiz() {
        const s = this.session, card = this.card(s.quizCard), deck = this.deck(card.deckId);
        const chrono = s.kind === 'chrono';
        const hud = chrono
            ? `<div class="chrono-hud">
                    <div><div class="tiny faint" style="font-weight:700">SCORE</div><div class="chrono-num" id="chrono-score">${s.score}</div></div>
                    <div style="text-align:right"><div class="tiny faint" style="font-weight:700">TEMPS</div><div class="chrono-num ${s.timeLeft <= 10 ? 'low' : ''}" id="chrono-time">${s.timeLeft}s</div></div>
               </div>
               <div class="pbar timer"><i id="chrono-bar" style="width:${s.timeLeft / s.duration * 100}%"></i></div>`
            : `<div class="pbar"><i style="width:${s.done / Math.max(1, s.total) * 100}%"></i></div>`;
        $('#view-session').innerHTML = `
        <div class="session">
            <div class="session-top">
                <button class="icon-btn" title="Quitter (Échap)" data-action="quit-session">${ic('x')}</button>
                <div class="session-title"><h3>${esc(s.title)}</h3><p>${chrono ? 'Bonne réponse +1 · erreur -3 s' : 'Choisis la bonne réponse · sans impact sur le planning'}</p></div>
                ${chrono ? '' : `<div class="session-counts"><span>${Math.min(s.done + 1, s.total)}<span class="faint">/${s.total}</span></span></div>`}
                <button class="icon-btn" title="Minuteur de concentration" aria-label="Minuteur" data-action="focus-toggle">${ic('timer')}</button>
            </div>
            ${hud}
            <div class="panel flashcard" style="min-height:0">
                <div class="fc-top"><span class="tag">${esc(deck ? deck.emoji + ' ' + this.deckPath(deck.id) : '')}</span></div>
                <div class="fc-content fc-front rich" style="padding:10px 0 4px">${card.front}</div>
            </div>
            <div class="quiz-options" id="quiz-options">
                ${s.options.map((o, i) => `<button class="quiz-opt" data-action="quiz-answer" data-i="${i}"><span class="k">${i + 1}</span><span>${o.text ? esc(o.text) : this.optionHtml(this.card(o.id))}</span></button>`).join('')}
            </div>
            <div id="quiz-after"></div>
        </div>`;
    }
    updateChronoHud() {
        const s = this.session;
        const t = $('#chrono-time'), b = $('#chrono-bar'), sc = $('#chrono-score');
        if (t) { t.textContent = `${Math.max(0, s.timeLeft)}s`; t.classList.toggle('low', s.timeLeft <= 10); }
        if (b) b.style.width = `${Math.max(0, s.timeLeft) / s.duration * 100}%`;
        if (sc) sc.textContent = s.score;
    }
    quizAnswer(i, el) {
        const s = this.session;
        if (!s || s.answered || (s.kind !== 'quiz' && s.kind !== 'chrono')) return;
        const opt = s.options[i];
        if (!opt) return;
        s.answered = true;
        const card = this.card(s.quizCard);
        const btns = $$('.quiz-opt');
        $('#quiz-options').classList.add('locked');
        btns.forEach((b, j) => {
            if (s.options[j].ok) b.classList.add('correct');
            else if (j === i) b.classList.add('wrong');
            else b.classList.add('dim');
        });
        s.done++;
        if (opt.ok) {
            s.score++; s.correct++;
            card.right++; card.errors = Math.max(0, card.errors - 1);
        } else {
            card.wrong++; card.errors++;
            if (!s.missed.includes(card.id)) s.missed.push(card.id);
        }
        this.save();   // only the error counters change: no scheduling, stats, streak or history
        if (s.kind === 'chrono') {
            if (!opt.ok) { s.timeLeft = Math.max(0, s.timeLeft - 3); }
            this.floatText(el || btns[i], opt.ok ? '+1' : '-3 s', opt.ok ? 'var(--mature)' : 'var(--due)');
            this.updateChronoHud();
            if (s.timeLeft <= 0) { this.finishChrono(); return; }
            setTimeout(() => { if (this.session === s && s.timeLeft > 0) this.nextQuestion(); }, opt.ok ? 350 : 1100);
            return;
        }
        const full = stripHtml(card.back);
        $('#quiz-after').innerHTML = `
            ${(full.length > 170 || card.detail || hasImage(card.back)) ? `<div class="panel panel-pad rich" style="margin-top:12px;font-size:.95rem">${card.back}${card.detail ? `<div class="detail-box rich" style="margin-top:10px">${card.detail}</div>` : ''}</div>` : ''}
            <div class="study-actions"><button class="btn btn-primary btn-lg btn-block" data-action="quiz-next">${s.queue.length ? 'Question suivante' : 'Voir le résultat'} ${ic('chevronRight')}</button></div>`;
    }
    floatText(anchor, text, color) {
        if (!anchor) return;
        const r = anchor.getBoundingClientRect();
        const f = document.createElement('div');
        f.className = 'float-pts'; f.textContent = text; f.style.color = color;
        f.style.left = `${r.right - 60}px`; f.style.top = `${r.top}px`;
        document.body.appendChild(f);
        setTimeout(() => f.remove(), 800);
    }
    finishChrono() {
        const s = this.session;
        if (!s || s.kind !== 'chrono') return;
        clearInterval(s.timer); s.timer = null;
        const best = this.data.stats.chronoBest[s.duration] || 0;
        s.newRecord = s.score > best && s.score > 0;
        if (s.newRecord) this.data.stats.chronoBest[s.duration] = s.score;
        this.save();
        this.showSummary();
    }
    showSummary() {
        const s = this.session;
        if (!s) return;
        if (s.timer) { clearInterval(s.timer); s.timer = null; }
        const secs = Math.round((Date.now() - s.startedAt) / 1000);
        const acc = s.done ? Math.round(s.correct / s.done * 100) : 0;
        let emoji = acc >= 90 ? '🏆' : acc >= 70 ? '🎉' : acc >= 50 ? '💪' : '📚';
        let title = s.kind === 'srs' ? 'Session terminée !' : s.kind === 'chrono' ? 'Temps écoulé !' : s.kind === 'quiz' ? 'Quiz terminé !' : 'Entraînement terminé !';
        let lead = '';
        if (s.kind === 'chrono') {
            emoji = s.newRecord ? '🏆' : '⏱️';
            lead = s.newRecord ? `Nouveau record : <b>${s.score} points</b> !` : `Score : <b>${s.score}</b> · record ${this.data.stats.chronoBest[s.duration] || 0}`;
        } else if (s.kind === 'quiz') {
            if (s.total >= 5 && acc > (this.data.stats.quizBest || 0)) { this.data.stats.quizBest = acc; this.save(); lead = 'Nouveau record de réussite !'; }
        } else if (s.kind === 'srs') {
            const pending = (s.learning || []).length;
            const next = this.nextDueTime();
            lead = pending ? `${plural(pending, 'carte')} en cours d'apprentissage reviendra bientôt.` : next < Infinity ? `Prochaine révision ${fmtRelativeFuture(next)}.` : '';
        }
        if (!s.done && s.kind !== 'chrono') { this.endSession(true); return; }
        const missed = s.missed.map(id => this.card(id)).filter(Boolean);
        const kind = s.kind;
        let groupLeft = 0;
        if (kind === 'srs' && s.grouped) { const pl = this.studyPlan(s.deckId ? [s.deckId] : null); groupLeft = pl.reviews.length + pl.news.length; }
        const groupDeck = s.deckId || '';
        const replay = { kind, pool: s.pool, duration: s.duration, total: s.total, title: s.title };
        this.session = null;
        this.lastSession = { missed: missed.map(c => c.id), replay };
        document.body.classList.add('in-session');
        $('#view-session').innerHTML = `
        <div class="summary">
            <div class="summary-emoji">${emoji}</div>
            <h2 class="page-title" style="margin-top:12px">${title}</h2>
            ${lead ? `<p class="page-sub">${lead}</p>` : ''}
            <div class="summary-stats">
                <div class="panel"><b>${kind === 'chrono' ? s.score : s.done}</b><span>${kind === 'chrono' ? 'points' : 'cartes'}</span></div>
                <div class="panel"><b>${acc}%</b><span>réussite</span></div>
                <div class="panel"><b>${fmtDuration(secs)}</b><span>durée</span></div>
            </div>
            ${missed.length ? `
            <div class="panel missed-list" style="margin-bottom:18px">
                <div class="section-head" style="padding:14px 16px 0"><h4 style="font-size:.95rem;font-weight:800">À retravailler (${missed.length})</h4></div>
                ${missed.slice(0, 30).map(c => `<div class="missed-item"><div class="rich" style="font-weight:700">${c.front}</div><div class="a">${esc(truncate(stripHtml(c.back), 200))}</div></div>`).join('')}
            </div>` : ''}
            <div style="display:grid;gap:10px">
                ${groupLeft ? `<button class="btn btn-primary btn-lg" data-action="study-next-group" data-deck="${esc(groupDeck)}">${ic('play')}Groupe suivant (${plural(groupLeft, 'carte restante', 'cartes restantes')})</button>` : ''}
                ${missed.length ? `<button class="btn ${groupLeft ? 'btn-soft' : 'btn-primary'} btn-lg" data-action="practice-missed">${ic('target')}Retravailler ces ${plural(missed.length, 'erreur')}</button>` : ''}
                ${kind === 'chrono' || kind === 'quiz' ? `<button class="btn btn-soft btn-lg" data-action="replay">${ic('repeat')}Rejouer</button>` : ''}
                <button class="btn ${missed.length ? 'btn-soft' : 'btn-primary'} btn-lg" data-action="back-origin">${ic('home')}${this.back && this.back.view === 'decks' ? 'Retour aux cartes' : 'Retour à l\'accueil'}</button>
            </div>
        </div>`;
        this.view = 'session';
        this.renderStreak();
    }

    /* ============================================================
       Modals
       ============================================================ */
    openModal({ title, body, foot = '', size = '', onClose }) {
        const back = document.createElement('div');
        back.className = 'modal-back';
        back.innerHTML = `<div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${esc(stripHtml(title))}">
            <div class="modal-head"><h3>${title}</h3><button class="icon-btn" data-close aria-label="Fermer">${ic('x')}</button></div>
            <div class="modal-body">${body}</div>
            ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
        </div>`;
        let downOnBack = false;
        back.addEventListener('mousedown', e => { downOnBack = e.target === back; });
        back.addEventListener('click', e => {
            if ((e.target === back && downOnBack) || e.target.closest('[data-close]')) this.closeModal(back);
        });
        back._onClose = onClose;
        $('#modal-root').appendChild(back);
        this.modals.push(back);
        document.body.style.overflow = 'hidden';
        return back;
    }
    closeModal(el) {
        el = el || this.modals[this.modals.length - 1];
        if (!el) return;
        this.modals = this.modals.filter(m => m !== el);
        if (el._onClose) el._onClose();
        el.remove();
        if (!this.modals.length) document.body.style.overflow = '';
    }
    confirm({ title, message, ok = 'Confirmer', danger = false }) {
        return new Promise(resolve => {
            let answered = false;
            const m = this.openModal({
                title, size: 'narrow',
                body: `<p class="muted">${message}</p>`,
                foot: `<button class="btn btn-soft" data-close>Annuler</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${ok}</button>`,
                onClose: () => { if (!answered) resolve(false); }
            });
            m.querySelector('[data-ok]').addEventListener('click', () => { answered = true; this.closeModal(m); resolve(true); });
            setTimeout(() => m.querySelector('[data-ok]').focus(), 30);
        });
    }

    /* Several-button question: resolves with the chosen value, or null when dismissed */
    choose({ title, message, options }) {
        return new Promise(resolve => {
            let answered = false;
            const m = this.openModal({
                title, size: 'narrow', body: `<p class="muted">${message}</p>`,
                foot: options.map((o, i) => `<button class="btn ${o.primary ? 'btn-primary' : 'btn-soft'}" data-pick-i="${i}">${o.label}</button>`).join(''),
                onClose: () => { if (!answered) resolve(null); }
            });
            m.querySelectorAll('[data-pick-i]').forEach(b => b.addEventListener('click', () => { answered = true; this.closeModal(m); resolve(options[Number(b.dataset.pickI)].value); }));
        });
    }

    /* ---------- Deck modal ---------- */
    openDeckModal(deckId, presetParent = '') {
        const deck = deckId ? this.deck(deckId) : null;
        const emoji = deck ? deck.emoji : '📚';
        const m = this.openModal({
            title: deck ? 'Modifier le paquet' : 'Nouveau paquet', size: 'narrow',
            body: `<form id="deck-form" novalidate>
                <div class="field"><label class="label" for="deck-name">Nom du paquet</label><input class="input" id="deck-name" maxlength="80" placeholder="Ex : Biologie cellulaire" value="${esc(deck ? deck.name : '')}" autocomplete="off"></div>
                <div class="field"><label class="label" for="deck-parent">Placer dans (sous-paquet)</label>
                    <select class="select" id="deck-parent"><option value="">Aucun (paquet principal)</option>${this.sortedDecks().filter(d => !deck || !this.descendantIds(deck.id).includes(d.id)).map(d => `<option value="${esc(d.id)}" ${(deck ? deck.parent : presetParent) === d.id ? 'selected' : ''}>${'\u00a0\u00a0'.repeat(this.deckDepth(d.id))}${esc(d.emoji)} ${esc(d.name)}</option>`).join('')}</select></div>
                <div class="field"><span class="label">Icône</span>
                    <div class="emoji-row" id="emoji-row">${EMOJIS.map(e => `<button type="button" class="${e === emoji ? 'active' : ''}" data-emoji="${e}">${e}</button>`).join('')}</div>
                    <input class="input" id="deck-emoji" maxlength="8" value="${esc(emoji)}" style="margin-top:8px;width:120px;text-align:center" aria-label="Emoji personnalisé">
                </div>
                <div class="field"><label class="label" for="deck-desc">Description (optionnel)</label><textarea class="textarea" id="deck-desc" rows="2" style="min-height:70px" maxlength="300">${esc(deck ? deck.description : '')}</textarea></div>
                <button type="submit" class="hidden"></button>
            </form>`,
            foot: `<button class="btn btn-soft" data-close>Annuler</button><button class="btn btn-primary" id="deck-save">${ic('check')}Enregistrer</button>`
        });
        const emojiInput = $('#deck-emoji', m);
        $('#emoji-row', m).addEventListener('click', e => {
            const b = e.target.closest('[data-emoji]');
            if (!b) return;
            emojiInput.value = b.dataset.emoji;
            $$('#emoji-row button', m).forEach(x => x.classList.toggle('active', x === b));
        });
        const submit = () => {
            const name = $('#deck-name', m).value.trim();
            if (!name) { $('#deck-name', m).focus(); this.toast('Donne un nom au paquet.', 'warning'); return; }
            const payload = { name, emoji: emojiInput.value.trim() || '📁', description: $('#deck-desc', m).value.trim(), parent: $('#deck-parent', m).value || null };
            let id = deckId;
            if (deck) Object.assign(deck, payload);
            else { id = uid('d'); this.data.decks.push({ id, created: Date.now(), opts: null, ...payload }); }
            this.save();
            this.closeModal(m);
            this.toast(deck ? 'Paquet modifié' : 'Paquet créé', 'success');
            if (!deck) { this.ui.deck = id; this.ui.filter = 'all'; }
            this.render();
        };
        $('#deck-save', m).addEventListener('click', submit);
        $('#deck-form', m).addEventListener('submit', e => { e.preventDefault(); submit(); });
        setTimeout(() => $('#deck-name', m).focus(), 30);
    }
    async deleteDeck(deckId) {
        const deck = this.deck(deckId);
        if (!deck) return;
        const ids = this.descendantIds(deckId), set = new Set(ids), kids = ids.length - 1, n = this.cardsOf(deckId).length;
        const ok = await this.confirm({ title: 'Supprimer le paquet ?', message: `« ${esc(this.deckPath(deck.id))} »${kids ? `, ${plural(kids, 'sous-paquet')}` : ''} et ${plural(n, 'carte')} seront supprimés. Tu pourras annuler juste après.`, ok: 'Supprimer', danger: true });
        if (!ok) return;
        this.change('suppression de paquet', this.data.cards.filter(c => set.has(c.deckId)).map(c => c.id), () => {
            this.data.decks = this.data.decks.filter(d => !set.has(d.id));
            this.data.cards = this.data.cards.filter(c => !set.has(c.deckId));
        }, { decks: true });
        this.ui.deck = 'all';
        this.render();
        this.undoToast('Paquet supprimé', ic('trash'));
    }

    /* ---------- Card editor (rich text) ---------- */
    editorHtml(id, placeholder, small = false, cloze = false) {
        const b = (cmd, title, inner) => `<button type="button" class="tb-btn" data-cmd="${cmd}" title="${title}" aria-label="${title}">${inner}</button>`;
        return `<div class="editor ${small ? 'sm' : ''}">
            <div class="toolbar" role="toolbar">
                ${b('bold', 'Gras (Ctrl+B)', '<b>B</b>')}${b('italic', 'Italique (Ctrl+I)', '<i style="font-family:Georgia,serif">I</i>')}${b('underline', 'Souligné (Ctrl+U)', '<u>U</u>')}${b('strikeThrough', 'Barré', '<s>S</s>')}
                <span class="tb-sep"></span>
                ${b('red', 'Texte en rouge', '<span style="color:#e11d48">A</span>')}${b('blue', 'Texte en bleu', '<span style="color:#2563eb">A</span>')}${b('highlight', 'Surligner', '<span style="background:#fde047;color:#111;padding:0 5px;border-radius:3px">A</span>')}
                <span class="tb-sep"></span>
                ${b('insertUnorderedList', 'Liste à puces', ic('list'))}${b('insertOrderedList', 'Liste numérotée', ic('listOrdered'))}
                <span class="tb-sep"></span>
                ${b('image', 'Ajouter une image', ic('image'))}${b('math', 'Formule LaTeX : \\( ... \\)', '<span style="font-weight:800;font-family:Georgia,serif">∑</span>')}${b('audio', 'Joindre un fichier audio', ic('volume'))}${b('record', 'Enregistrer ma voix', ic('mic'))}${b('removeFormat', 'Effacer la mise en forme', ic('eraser'))}
                ${cloze ? `<span class="tb-sep tb-cloze"></span><button type="button" class="tb-btn tb-cloze tb-wide" data-cmd="cloze" title="Créer un trou (Ctrl+Maj+C). Maj+clic : même numéro" aria-label="Créer un trou">[…]</button>` : ''}
            </div>
            <div class="editor-area rich" contenteditable="true" id="${id}" data-placeholder="${esc(placeholder)}" role="textbox" aria-multiline="true"></div>
        </div>`;
    }
    openCardModal(cardId, presetDeck, prefillFront) {
        if (!this.data.decks.length) { this.toast('Crée d\'abord un paquet.', 'warning'); this.openDeckModal(); return; }
        const card = cardId ? this.card(cardId) : null;
        if (card && card.kind === 'occl') { this.openOcclusionModal(card.id); return; }
        if (card && card.kind === 'custom' && card.nf && this.noteType(card.nf.t)) { this.openNoteModal(card.nf.t, card.id); return; }
        const inSession = !!this.session;
        const deckId = card ? card.deckId : presetDeck || (this.ui.deck !== 'all' && this.ui.deck !== 'errors' ? this.ui.deck : this.lastDeckUsed) || this.sortedDecks()[0].id;
        const nf = card ? noteFieldsOf(card) : { front: '', back: '' };
        let type = card ? card.kind : (this.lastNoteType && this.lastNoteType !== 'occl' ? this.lastNoteType : 'basic');
        const m = this.openModal({
            title: card ? 'Modifier la carte' : 'Nouvelle carte', size: 'wide',
            body: `
                <div class="field two-col">
                    <div><label class="label" for="cf-deck">Paquet</label>
                    <select class="select" id="cf-deck">${this.sortedDecks().map(d => `<option value="${esc(d.id)}" ${d.id === deckId ? 'selected' : ''}>${esc(d.emoji)} ${esc(this.deckPath(d.id))}</option>`).join('')}</select></div>
                    <div><label class="label" for="cf-type">Type de carte</label>
                    ${card ? `<div class="input type-static">${NOTE_TYPES[card.kind] || 'Basique'}</div>`
                        : `<select class="select" id="cf-type">${[...Object.entries(NOTE_TYPES), ...this.data.noteTypes.map(t => [`nt:${t.id}`, t.name]), ['manage', '⚙ Gérer les types de notes…']].map(([k, l]) => `<option value="${k}" ${k === type ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`}</div>
                </div>
                <div class="field"><span class="label" id="cf-front-label">Recto · question</span>${this.editorHtml('cf-front', 'Question ou terme... (tu peux coller une image)', false, true)}<p class="help hidden" id="cf-cloze-help">Sélectionne un mot puis clique sur <b>[…]</b> (ou <kbd class="k">Ctrl</kbd>+<kbd class="k">Maj</kbd>+<kbd class="k">C</kbd>) pour en faire un trou. Maj+clic réutilise le même numéro (plusieurs mots cachés ensemble). Indice : <code>{{c1::réponse::indice}}</code>.</p></div>
                <div class="field"><span class="label" id="cf-back-label">Verso · réponse</span>${this.editorHtml('cf-back', 'Réponse...')}</div>
                <details class="field" ${card && (card.hint || card.detail || card.tags.length || card.suspended) ? 'open' : ''}>
                    <summary class="label" style="cursor:pointer;display:flex;align-items:center;gap:6px">${ic('chevronDown')}Plus d'options (indice, détails, tags${card ? ', suspendre' : ''})</summary>
                    <div class="field" style="margin-top:12px"><label class="label" for="cf-hint">Indice (affiché sur demande avant la réponse)</label><input class="input" id="cf-hint" placeholder="Un petit coup de pouce..." value="${esc(card ? stripHtml(card.hint) : '')}"></div>
                    <div class="field"><span class="label">Détails (repliés sous « En savoir plus »)</span>${this.editorHtml('cf-detail', 'Explication plus poussée...', true)}</div>
                    <div class="field"><label class="label" for="cf-tags">Tags (séparés par des virgules)</label><input class="input" id="cf-tags" placeholder="chapitre1, dates" value="${esc(card ? card.tags.join(', ') : '')}"></div>
                    ${card ? `<label class="field" style="display:flex;align-items:center;gap:12px;cursor:pointer"><span class="switch"><input type="checkbox" id="cf-susp" ${card.suspended ? 'checked' : ''}><span></span></span><span class="small"><b>Suspendre la carte</b><br><span class="muted">Elle ne sera plus proposée en révision, sans être supprimée.</span></span></label>` : ''}
                </details>
                ${card ? `<p class="help">${card.state === 'new' ? 'Carte jamais révisée.' : `Prochaine révision ${fmtRelativeFuture(card.due)} · ${plural(card.reps, 'révision')} · ${plural(card.lapses, 'oubli')}`}${card.nid ? ` · ${plural(this.noteSiblings(card).length, 'carte')} dans cette note` : ''}</p>` : ''}`,
            foot: `${card ? `<button class="btn btn-danger-soft" id="cf-delete" title="Supprimer" style="margin-right:auto">${ic('trash')}<span class="hide-mobile">Supprimer</span></button><button class="btn btn-soft" id="cf-info" title="Informations">${ic('info')}<span class="hide-mobile">Infos</span></button>` : ''}
                <button class="btn btn-soft hide-mobile" data-close>Annuler</button>
                ${card ? '' : `<button class="btn btn-soft" id="cf-save-next" title="Enregistrer et créer une autre carte (Ctrl+Entrée)">${ic('plus')}Enregistrer + nouvelle</button>`}
                <button class="btn btn-primary" id="cf-save">${ic('check')}Enregistrer</button>`
        });
        m.dataset.cardModal = '1';
        const front = $('#cf-front', m), back = $('#cf-back', m), detail = $('#cf-detail', m), typeSel = $('#cf-type', m);
        if (card) { front.innerHTML = nf.front; back.innerHTML = nf.back; detail.innerHTML = card.detail; }
        else if (prefillFront) front.textContent = prefillFront;
        const dupMsg = document.createElement('p'); dupMsg.className = 'help dup-warn hidden'; front.closest('.field').appendChild(dupMsg);
        const dupCheck = () => {
            if (card) return;
            const key = fold(stripHtml(front.innerHTML)), dk = $('#cf-deck', m).value;
            const hit = key.length > 2 && this.data.cards.find(c => c.deckId === dk && c.ord === 0 && fold(stripHtml(noteFieldsOf(c).front)) === key);
            dupMsg.classList.toggle('hidden', !hit);
            if (hit) dupMsg.textContent = '⚠ Une carte avec ce recto existe déjà dans ce paquet.';
        };
        front.addEventListener('input', dupCheck); $('#cf-deck', m).addEventListener('change', dupCheck);
        const relabel = () => {
            const cloze = type === 'cloze';
            $('#cf-front-label', m).textContent = cloze ? 'Texte à trous' : 'Recto · question';
            $('#cf-back-label', m).textContent = cloze ? 'Infos supplémentaires (optionnel, affichées avec la réponse)' : 'Verso · réponse';
            $('#cf-cloze-help', m).classList.toggle('hidden', !cloze);
            front.closest('.editor').classList.toggle('cloze-on', cloze);
            front.dataset.placeholder = cloze ? 'Ex : La capitale de la France est {{c1::Paris}}.' : 'Question ou terme... (tu peux coller une image)';
            back.dataset.placeholder = cloze ? 'Source, explication, image...' : 'Réponse...';
        };
        if (typeSel) typeSel.addEventListener('change', () => {
            type = typeSel.value;
            if (type === 'occl') { const d = $('#cf-deck', m).value; this.closeModal(m); this.openOcclusionModal(null, d); return; }
            if (type === 'manage') { this.closeModal(m); this.openNoteTypes(); return; }
            if (type.startsWith('nt:')) { const d = $('#cf-deck', m).value; this.closeModal(m); this.openNoteModal(type.slice(3), null, d); return; }
            relabel();
        });
        relabel();
        const save = async keepOpen => {
            const f = sanitizeHtml(front.innerHTML), bk = sanitizeHtml(back.innerHTML);
            if (isBlank(f)) { this.toast(type === 'cloze' ? 'Le texte est vide.' : 'Le recto (question) est vide.', 'warning'); front.focus(); return; }
            if (type === 'cloze') {
                if (!clozeNumbers(f).length) { this.toast('Ajoute au moins un trou : sélectionne un mot puis clique sur […]', 'warning'); front.focus(); return; }
            } else if (isBlank(bk)) { this.toast('Le verso (réponse) est vide.', 'warning'); back.focus(); return; }
            const fields = {
                deckId: $('#cf-deck', m).value, front: f, back: bk,
                hint: sanitizeHtml($('#cf-hint', m).value), detail: isBlank(detail.innerHTML) ? '' : sanitizeHtml(detail.innerHTML),
                tags: $('#cf-tags', m).value.split(/[,;]+/).map(t => t.trim().replace(/\s+/g, '_')).filter(Boolean)
            };
            if (!card) {
                const key = fold(stripHtml(f));
                const dup = this.data.cards.some(c => c.deckId === fields.deckId && c.ord === 0 && fold(stripHtml(noteFieldsOf(c).front)) === key);
                if (dup && !(await this.confirm({ title: 'Doublon', message: 'Une carte avec le même recto existe déjà dans ce paquet. L\'ajouter quand même ?', ok: 'Ajouter' }))) return;
            }
            this.lastDeckUsed = fields.deckId;
            if (card) {
                const ids = this.noteSiblings(card).map(c => c.id), susp = $('#cf-susp', m);
                this.change('modification de carte', ids, () => {
                    const made = this.updateNote(card, fields);
                    if (susp) card.suspended = susp.checked;
                    const t = Date.now();
                    this.noteSiblings(card).forEach(c => { c.mod = t; });
                    return made;
                });
                this.toast('Carte modifiée', 'success');
            } else {
                this.lastNoteType = type;
                const made = this.change('nouvelle carte', [], () => this.createNote({ type, ...fields }));
                this.toast(made.length > 1 ? `${made.length} cartes créées` : 'Carte créée', 'success');
            }
            if (keepOpen) {
                front.innerHTML = ''; back.innerHTML = ''; detail.innerHTML = ''; $('#cf-hint', m).value = ''; dupMsg.classList.add('hidden');
                front.focus();
            } else this.closeModal(m);
            if (inSession && this.session) { if (this.session.quizCard) this.renderQuiz(); else if (this.session.current) this.renderSession(); }
            else if (this.view === 'decks') this.renderDecks();
            else if (this.view === 'dashboard') this.renderDashboard();
        };
        m._save = () => save(!card);
        $('#cf-save', m).addEventListener('click', () => save(false));
        const next = $('#cf-save-next', m);
        if (next) next.addEventListener('click', () => save(true));
        const del = $('#cf-delete', m);
        if (del) del.addEventListener('click', async () => { if (await this.opDelete([card.id], true)) this.closeModal(m); });
        const info = $('#cf-info', m);
        if (info) info.addEventListener('click', () => this.openCardInfo(card.id));
        setTimeout(() => (card ? null : front.focus()), 50);
    }
    deleteCard(cardId) { return this.opDelete([cardId], true); }
    clozeSelection(area, same) {
        const sel = getSelection(), text = sel.rangeCount && area.contains(sel.anchorNode) ? sel.toString() : '';
        const nums = clozeNumbers(area.innerHTML), n = nums.length ? (same ? nums[nums.length - 1] : nums[nums.length - 1] + 1) : 1;
        document.execCommand('insertText', false, `{{c${n}::${text || '...'}}}`);
    }
    execEditor(cmd, area, ev) {
        if (document.activeElement !== area) {
            area.focus();
            if (this.editorRange && area.contains(this.editorRange.startContainer)) {
                const sel = getSelection(); sel.removeAllRanges(); sel.addRange(this.editorRange);
            } else {
                const r = document.createRange(); r.selectNodeContents(area); r.collapse(false);
                const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
            }
        }
        if (cmd === 'image') { this.pickImage(area); return; }
        if (cmd === 'math') { this.insertMath(area); return; }
        if (cmd === 'audio') { this.pickAudio(area); return; }
        if (cmd === 'record') { this.recordAudio(area); return; }
        if (cmd === 'cloze') { this.clozeSelection(area, !!(ev && ev.shiftKey)); return; }
        const css = ['red', 'blue', 'highlight'].includes(cmd);
        try { document.execCommand('styleWithCSS', false, css); } catch { /* ignore */ }
        if (cmd === 'red' || cmd === 'blue') {
            document.execCommand('foreColor', false, cmd === 'red' ? '#e11d48' : '#2563eb');
        } else if (cmd === 'highlight') {
            if (!document.execCommand('hiliteColor', false, '#fde047')) document.execCommand('backColor', false, '#fde047');
        } else if (cmd === 'removeFormat') {
            document.execCommand('removeFormat');
            document.execCommand('unlink');
        } else document.execCommand(cmd);
        this.updateToolbarState(area);
    }
    updateToolbarState(area) {
        const ed = area && area.closest('.editor');
        if (!ed) return;
        ['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList'].forEach(cmd => {
            const b = ed.querySelector(`[data-cmd="${cmd}"]`);
            let on = false;
            try { on = document.queryCommandState(cmd); } catch { /* ignore */ }
            if (b) b.classList.toggle('on', on);
        });
    }
    pickImage(area) {
        this.imageTarget = area;
        const input = $('#hidden-file');
        input.accept = 'image/*';
        input.value = '';
        input.onchange = async () => {
            const file = input.files[0];
            if (file) await this.insertImage(file, area);
        };
        input.click();
    }
    async compressImage(file) {
        if (file.size < 180 * 1024 && /^image\/(png|jpe?g|gif|webp)$/.test(file.type)) return readAsDataURL(file);
        const url = URL.createObjectURL(file);
        try {
            const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
            const max = 1280, scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
            const w = Math.max(1, Math.round(img.naturalWidth * scale)), h = Math.max(1, Math.round(img.naturalHeight * scale));
            const cv = document.createElement('canvas');
            cv.width = w; cv.height = h;
            const ctx = cv.getContext('2d');
            ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            return cv.toDataURL('image/jpeg', 0.82);
        } finally { URL.revokeObjectURL(url); }
    }
    async insertImage(file, area) {
        if (!file || !file.type.startsWith('image/')) { this.toast('Ce fichier n\'est pas une image.', 'warning'); return; }
        try {
            const src = await this.compressImage(file);
            area.focus();
            if (this.editorRange && area.contains(this.editorRange.startContainer)) {
                const sel = getSelection(); sel.removeAllRanges(); sel.addRange(this.editorRange);
            } else {
                const r = document.createRange(); r.selectNodeContents(area); r.collapse(false);
                const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
            }
            document.execCommand('insertHTML', false, `<img src="${src}" alt=""><br>`);
            this.toast('Image ajoutée', 'success', ic('image'));
        } catch (e) {
            console.error(e);
            this.toast('Impossible de lire cette image (format non supporté ?)', 'error');
        }
    }

    /* ---------- Import / export ---------- */
    openImportModal() {
        if (!this.data.decks.length) { this.toast('Crée d\'abord un paquet.', 'warning'); this.openDeckModal(); return; }
        const cur = this.ui.deck !== 'all' && this.ui.deck !== 'errors' ? this.ui.deck : '';
        const m = this.openModal({
            title: 'Importer des fiches', size: 'wide',
            body: `
                <p class="small muted" style="margin-bottom:14px">Une fiche par ligne : <code>question ; réponse</code> (séparateur <code>;</code>, tabulation ou virgule). Une 3e colonne optionnelle sert d'indice. Compatible avec les exports texte d'Anki et Quizlet.</p>
                <div class="field"><label class="label" for="im-deck">Paquet de destination</label>
                    <select class="select" id="im-deck">${this.sortedDecks().map(d => `<option value="${esc(d.id)}" ${d.id === cur ? 'selected' : ''}>${esc(d.emoji)} ${esc(this.deckPath(d.id))}</option>`).join('')}<option value="__new">+ Nouveau paquet...</option></select></div>
                <div class="field hidden" id="im-newdeck-wrap"><label class="label" for="im-newdeck">Nom du nouveau paquet</label><input class="input" id="im-newdeck" placeholder="Ex : Vocabulaire anglais"></div>
                <div class="field"><span class="label">Fichier</span><button class="btn btn-soft btn-block" id="im-file">${ic('file')}Choisir un fichier TXT / CSV</button></div>
                <div class="field"><span class="label">Ou un paquet Anki</span><button class="btn btn-soft btn-block" id="im-apkg">${ic('layers')}Importer un fichier .apkg</button><p class="help">Anki : Fichier › Exporter › « Paquet Anki (.apkg) », en cochant « Prendre en charge les anciennes versions d'Anki ». Les cartes arrivent comme neuves.</p></div>
                <div class="field"><label class="label" for="im-text">... ou colle tes fiches ici</label><textarea class="textarea" id="im-text" rows="6" placeholder="Capitale de l'Italie ; Rome&#10;H2O ; L'eau"></textarea>
                    <div class="im-tr"><button class="btn btn-soft btn-sm" id="im-translate" type="button">Traduire les mots seuls (anglais → français)</button><span class="help" id="im-tr-st">Colle une liste de mots anglais, un par ligne : les traductions proposées s'écrivent à côté. Vérifie-les avant d'importer.</span></div></div>
                <label class="check hidden" id="im-usedecks-wrap" style="margin-bottom:10px"><input type="checkbox" id="im-usedecks" checked> Utiliser les paquets et tags indiqués dans le fichier</label>
                <p class="help" id="im-preview">Aucune fiche détectée pour l'instant.</p>`,
            foot: `<button class="btn btn-soft" data-close>Annuler</button><button class="btn btn-primary" id="im-go" disabled>${ic('import')}Importer</button>`
        });
        const ta = $('#im-text', m), prev = $('#im-preview', m), go = $('#im-go', m), sel = $('#im-deck', m);
        const refresh = () => {
            const rows = parseImport(ta.value);
            prev.innerHTML = rows.length ? `<b>${plural(rows.length, 'fiche')} détectée${rows.length > 1 ? 's' : ''}</b>. Ex. : « ${esc(truncate(stripHtml(rows[0].front), 50))} » → « ${esc(truncate(stripHtml(rows[0].back), 50))} »` : 'Aucune fiche détectée pour l\'instant.';
            go.disabled = !rows.length;
            const hasDecks = rows.some(r => r.deck);
            $('#im-usedecks-wrap', m).classList.toggle('hidden', !hasDecks);
            return rows;
        };
        ta.addEventListener('input', refresh);
        $('#im-translate', m).addEventListener('click', async () => {
            const st = $('#im-tr-st', m), btn = $('#im-translate', m);
            const lines = ta.value.split('\n'), todo = lines.map((l, i) => [i, l.trim()]).filter(([, l]) => l && !/[;\t]/.test(l) && !l.includes(','));
            if (!todo.length) { st.textContent = 'Aucun mot seul à traduire (une ligne = un mot, sans « ; »).'; return; }
            if (!navigator.onLine) { st.textContent = 'Pas de connexion : saisis les traductions à la main.'; return; }
            btn.disabled = true;
            const batch = todo.slice(0, 80); let done = 0, fail = 0;
            const one = async ([i, w]) => {
                try {
                    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 6000);
                    const r = await fetch(`https://api.mymemory.translated.net/get?langpair=en|fr&q=${encodeURIComponent(w)}`, { signal: ctl.signal }).then(x => x.json()); clearTimeout(to);
                    const tr = r && r.responseData && r.responseData.translatedText;
                    if (tr && !/MYMEMORY|INVALID|QUERY LENGTH/i.test(tr) && tr.toLowerCase() !== w.toLowerCase()) lines[i] = `${w} ; ${tr.toLowerCase().replace(/;/g, ',')}`; else fail++;
                } catch { fail++; }
                done++; st.textContent = `Traduction… ${done}/${batch.length}`;
            };
            const queue = [...batch];
            await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) await one(queue.shift()); }));
            ta.value = lines.join('\n'); refresh(); btn.disabled = false;
            st.textContent = `${batch.length - fail} traduction${batch.length - fail > 1 ? 's' : ''} ajoutée${batch.length - fail > 1 ? 's' : ''}${fail ? ` · ${fail} à compléter à la main` : ''}${todo.length > batch.length ? ` · ${todo.length - batch.length} restantes (relance)` : ''}. Vérifie avant d'importer.`;
        });
        sel.addEventListener('change', () => $('#im-newdeck-wrap', m).classList.toggle('hidden', sel.value !== '__new'));
        $('#im-file', m).addEventListener('click', () => {
            const input = $('#hidden-file');
            input.accept = '.txt,.csv,.tsv,text/plain,text/csv';
            input.value = '';
            input.onchange = async () => {
                const f = input.files[0];
                if (!f) return;
                ta.value = await readAsText(f);
                refresh();
                $('#im-file', m).innerHTML = `${ic('check')}${esc(f.name)}`;
            };
            input.click();
        });
        $('#im-apkg', m).addEventListener('click', () => {
            const input = $('#hidden-file');
            input.accept = '.apkg,.colpkg,application/zip';
            input.value = '';
            input.onchange = () => { const f = input.files[0]; if (f) { this.closeModal(m); this.importApkg(f); } };
            input.click();
        });
        go.addEventListener('click', () => {
            const rows = refresh();
            if (!rows.length) return;
            let deckId = sel.value;
            if (deckId === '__new') {
                const name = $('#im-newdeck', m).value.trim();
                if (!name) { this.toast('Donne un nom au nouveau paquet.', 'warning'); return; }
                deckId = uid('d');
                this.data.decks.push({ id: deckId, name, emoji: '📥', description: '', created: Date.now() });
            }
            const now = Date.now(), useDecks = !$('#im-usedecks-wrap', m).classList.contains('hidden') && $('#im-usedecks', m).checked;
            const deckFor = path => {
                let parent = null, found = null;
                String(path).split('::').map(x => x.trim()).filter(Boolean).forEach(name => {
                    found = this.data.decks.find(d => d.name === name && (d.parent || null) === parent);
                    if (!found) { found = { id: uid('d'), name, emoji: '📥', description: '', created: now, parent, opts: null, mod: 0 }; this.data.decks.push(found); }
                    parent = found.id;
                });
                return found ? found.id : deckId;
            };
            this.change('import', [], () => {
                const made = [];
                rows.forEach((r, i) => {
                    const c = { id: uid('c'), ...freshCard(), deckId: useDecks && r.deck ? deckFor(r.deck) : deckId, front: r.front, back: r.back, hint: r.hint || '', detail: '', tags: r.tags || [], created: now + i, nid: '', kind: 'basic', ord: 0, nf: null };
                    this.data.cards.push(c); made.push(c.id);
                });
                return made;
            }, { decks: true });
            this.save();
            this.closeModal(m);
            this.ui.deck = deckId; this.ui.filter = 'all';
            this.go('decks');
            this.toast(`${plural(rows.length, 'fiche importée', 'fiches importées')}`, 'success');
        });
    }
    exportJSON() {
        const json = JSON.stringify(JSON.parse(this.serialize()), null, 1);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `superanki-sauvegarde-${dayKey()}.json`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        this.toast('Sauvegarde exportée', 'success', ic('export'));
    }
    importJSON() {
        const input = $('#hidden-file');
        input.accept = '.json,application/json';
        input.value = '';
        input.onchange = async () => {
            const f = input.files[0];
            if (!f) return;
            let data = null;
            try { data = normalizeState(await readAsText(f)); } catch (e) { data = null; }
            if (!data || !data.cards.length) { this.toast('Fichier de sauvegarde invalide.', 'error'); return; }
            const ok = await this.confirm({ title: 'Restaurer cette sauvegarde ?', message: `${plural(data.decks.length, 'paquet')} et ${plural(data.cards.length, 'carte')}. Tes données actuelles seront remplacées.`, ok: 'Restaurer', danger: true });
            if (!ok) return;
            data.settings = Object.assign({}, this.data.settings, data.settings);
            this.replaceData(data);
            this.save();
            this.toast('Sauvegarde restaurée', 'success');
        };
        input.click();
    }

    /* ---------- Mode launcher ---------- */
    openModeLauncher(mode, presetDeck) {
        const meta = {
            write: { title: `${ic('keyboard')} Écrire`, desc: 'Tape la réponse de mémoire, la correction est automatique (fautes de frappe tolérées).', key: 'writeCount' },
            quiz: { title: `${ic('quiz')} Quiz`, desc: 'Pour chaque question, choisis la bonne réponse parmi 4.', key: 'quizCount' },
            chrono: { title: `${ic('timer')} Chrono`, desc: 'Un maximum de bonnes réponses avant la fin du temps. Chaque erreur coûte 3 secondes.', key: 'chronoDuration' }
        }[mode];
        const s = this.data.settings;
        let sel = presetDeck || 'all';
        let opt = s[meta.key];
        const errCount = this.errorCards().length;
        const item = (id, em, name, n) => `<button class="pick-item ${sel === id ? 'active' : ''}" data-pick="${esc(id)}" ${n ? '' : 'disabled style="opacity:.45"'}><span>${em}</span>${esc(name)}<span class="ct">${n}</span></button>`;
        const choices = mode === 'chrono' ? [[30, '30 s'], [60, '60 s'], [120, '2 min']] : [[10, '10'], [20, '20'], [50, '50'], [9999, 'Tout']];
        const m = this.openModal({
            title: meta.title,
            body: `<p class="muted small" style="margin-bottom:16px">${meta.desc}</p>
                <div class="field"><span class="label">Cartes</span>
                    <label class="input-icon" style="display:block;margin-bottom:8px">${ic('search')}<input class="input" id="pick-filter" placeholder="Filtrer les paquets..." autocomplete="off"></label>
                    <div class="pick-list" id="pick-list">
                        ${item('all', '📂', 'Tous les paquets', this.data.cards.length)}
                        ${item('errors', '🎯', 'Mes erreurs', errCount)}
                        ${this.sortedDecks().map(d => item(d.id, esc(d.emoji), d.name, this.cardsOf(d.id).length)).join('')}
                    </div>
                </div>
                <div class="field"><span class="label">${mode === 'chrono' ? 'Durée' : 'Nombre de questions'}</span>
                    <div class="segmented" id="opt-seg">${choices.map(([v, l]) => `<button class="${opt === v ? 'active' : ''}" data-opt="${v}">${l}</button>`).join('')}</div>
                </div>`,
            foot: `<button class="btn btn-soft" data-close>Annuler</button><button class="btn btn-primary" id="mode-go">${ic('play')}C'est parti</button>`
        });
        $('#pick-list', m).addEventListener('click', e => {
            const b = e.target.closest('[data-pick]');
            if (!b || b.disabled) return;
            sel = b.dataset.pick;
            $$('[data-pick]', m).forEach(x => x.classList.toggle('active', x === b));
        });
        $('#pick-filter', m).addEventListener('input', e => {
            const q = fold(e.target.value.trim());
            $$('[data-pick]', m).forEach(b => { b.classList.toggle('hidden', !!q && !fold(b.textContent).includes(q)); });
        });
        $('#opt-seg', m).addEventListener('click', e => {
            const b = e.target.closest('[data-opt]');
            if (!b) return;
            opt = Number(b.dataset.opt);
            $$('[data-opt]', m).forEach(x => x.classList.toggle('active', x === b));
        });
        const active = $('.pick-item.active', m);
        if (active) setTimeout(() => active.scrollIntoView({ block: 'nearest' }), 30);
        $('#mode-go', m).addEventListener('click', () => {
            s[meta.key] = opt;
            this.save(false);
            this.closeModal(m);
            const deckIds = sel === 'all' ? null : sel === 'errors' ? 'errors' : [sel];
            if (mode === 'write') {
                const pool = this.poolFor(deckIds).filter(c => c.kind !== 'occl').map(c => c.id);
                const d = deckIds && deckIds !== 'errors' ? this.deck(sel) : null;
                this.startPractice(null, 'type', opt, `Écrire · ${sel === 'errors' ? 'Mes erreurs' : d ? d.name : 'Tous les paquets'}`, pool);
            } else if (mode === 'quiz') this.startQuiz(deckIds, opt, 0);
            else this.startQuiz(deckIds, 0, opt);
        });
    }

    /* ---------- Tooltips (charts, calendar...) ---------- */
    showTip(target, x, y) {
        if (!this.tipEl) { this.tipEl = document.createElement('div'); this.tipEl.className = 'chart-tip'; document.body.appendChild(this.tipEl); }
        const tip = this.tipEl;
        if (this.tipTarget !== target) {
            if (this.tipTarget) this.tipTarget.classList.remove('on');
            this.tipTarget = target;
            target.classList.add('on');
            tip.innerHTML = target.dataset.tip;
        }
        tip.style.display = 'block';
        const r = tip.getBoundingClientRect(), pad = 12;
        let left = x + 14, top = y - r.height - 12;
        if (left + r.width > innerWidth - pad) left = x - r.width - 14;
        if (left < pad) left = pad;
        if (top < pad) top = y + 18;
        tip.style.left = `${left}px`; tip.style.top = `${top}px`;
        this.tipTouch = true;
    }
    hideTip() {
        if (this.tipEl) this.tipEl.style.display = 'none';
        if (this.tipTarget) { this.tipTarget.classList.remove('on'); this.tipTarget = null; }
    }

    /* ---------- Popovers (streak, sync) ---------- */
    togglePopover(anchor, build) {
        if (this.popover && this.popoverAnchor === anchor) { this.closePopover(); return; }
        this.closePopover();
        const pop = document.createElement('div');
        pop.className = 'popover';
        pop.dataset.kind = anchor.dataset.action === 'pop-sync' ? 'sync' : 'streak';
        pop.innerHTML = build();
        document.body.appendChild(pop);
        this.popover = pop; this.popoverAnchor = anchor; this.popoverBuild = build; this.popoverY = scrollY;
        const r = anchor.getBoundingClientRect(), w = pop.offsetWidth;
        pop.style.top = `${r.bottom + 8}px`;
        pop.style.left = `${clamp(r.right - w, 10, innerWidth - w - 10)}px`;
    }
    refreshPopover() { if (this.popover) this.popover.innerHTML = this.popoverBuild(); }
    closePopover() {
        if (!this.popover) return;
        this.popover.remove();
        this.popover = null; this.popoverAnchor = null;
    }
    streakPopoverHtml() {
        const st = this.data.stats, today = dayKey(), alive = st.lastStudyDate === today;
        const days = Array.from({ length: 7 }, (_, i) => addDays(Date.now(), i - 6));
        const letters = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        return `
            <div class="pop-head"><span class="pop-flame ${alive ? '' : 'cold'}">${ic('flame')}</span><div><b>${plural(st.streak, 'jour')} de suite</b><div class="small muted">Record : ${plural(st.longestStreak, 'jour')}</div></div></div>
            <div class="week-dots">${days.map(t => { const k = dayKey(t), v = st.history[k] || 0; return `<div class="${v ? 'on' : ''} ${k === today ? 'today' : ''}" title="${esc(longDate(t))} : ${plural(v, 'révision')}"><span>${letters[new Date(t).getDay()]}</span><i>${v ? ic('check') : ''}</i></div>`; }).join('')}</div>
            <p class="small ${alive ? '' : 'muted'}" style="margin:10px 0">${alive ? `✅ Révision du jour faite (${plural(st.history[today] || 0, 'carte')}). Reviens demain !` : `Révise au moins une carte aujourd'hui pour ${st.streak ? 'prolonger' : 'démarrer'} ta série.`}</p>
            <div class="pop-freeze">${ic('snow')}<span><b>${st.freezes}/2 gel${st.freezes > 1 ? 's' : ''} de série</b><br><span class="tiny muted">Un gel protège ta série si tu oublies un jour. +1 tous les 7 jours de suite.</span></span></div>
            <div class="pop-actions">
                ${alive ? '' : `<button class="btn btn-primary btn-sm" data-action="study" data-deck="">${ic('play')}Réviser</button>`}
                <button class="btn btn-soft btn-sm" data-action="go-stats">${ic('chart')}Statistiques</button>
            </div>`;
    }
    syncPopoverHtml() {
        const st = Cloud.status;
        const label = { ok: 'Tout est synchronisé', busy: 'Synchronisation en cours...', err: 'Synchronisation impossible', off: 'Synchronisation désactivée' }[st] || 'Synchronisation cloud';
        const detail = st === 'err' ? 'Tu es peut-être hors ligne. Tes données restent enregistrées sur cet appareil et seront envoyées plus tard.'
            : 'Ta progression est enregistrée sur cet appareil et copiée dans le cloud pour la retrouver sur tes autres appareils.';
        const ago = Cloud.lastSync ? fmtAgo(Cloud.lastSync) : 'pas encore';
        return `
            <div class="pop-head"><span class="pop-cloud ${st}">${ic('cloud')}</span><div><b>${label}</b><div class="small muted">Dernière synchro : ${ago}</div></div></div>
            <p class="small muted" style="margin:10px 0">${detail}</p>
            <div class="pop-actions">
                <button class="btn btn-primary btn-sm" data-action="sync-now" ${st === 'busy' ? 'disabled' : ''}>${ic('refresh')}Synchroniser</button>
                <button class="btn btn-soft btn-sm" data-action="go-settings">${ic('settings')}Réglages</button>
            </div>`;
    }

    /* ============================================================
       Toasts
       ============================================================ */
    toast(msg, type = 'success', icon, action = null) {
        const box = $('#toasts');
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        const ico = icon || ic(type === 'error' ? 'alert' : type === 'warning' ? 'info' : 'check');
        t.innerHTML = `${ico}<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
        const close = () => { t.classList.add('out'); setTimeout(() => t.remove(), 260); };
        if (action) t.querySelector('button').addEventListener('click', () => { close(); action.fn(); });
        box.appendChild(t);
        while (box.children.length > 3) box.firstElementChild.remove();
        setTimeout(close, action ? (action.ms || 6500) : type === 'error' ? 5000 : 3000);
    }

    /* ============================================================
       Events (single delegated handler, no inline onclick)
       ============================================================ */
    bindGlobalEvents() {
        document.addEventListener('click', e => {
            if (this.popover && !this.popover.contains(e.target) && !(this.popoverAnchor && this.popoverAnchor.contains(e.target))) this.closePopover();
            else if (this.popover && e.target.closest('.popover [data-action], .popover [data-nav]')) setTimeout(() => this.closePopover(), 0);
            const nav = e.target.closest('[data-nav]');
            if (nav) { this.go(nav.dataset.nav); return; }
            const tb = e.target.closest('.tb-btn');
            if (tb) { const area = tb.closest('.editor').querySelector('.editor-area'); this.execEditor(tb.dataset.cmd, area, e); return; }
            const el = e.target.closest('[data-action]');
            if (!el || el.disabled) return;
            this.handleAction(el.dataset.action, el, e);
        });
        document.addEventListener('mousedown', e => { if (e.target.closest('.tb-btn')) e.preventDefault(); });
        document.addEventListener('input', e => {
            const el = e.target;
            if (el.classList && el.classList.contains('editor-area')) {
                if (el.innerHTML === '<br>' || el.innerHTML === '<div><br></div>') el.innerHTML = '';
                return;
            }
            const k = el.dataset && el.dataset.input;
            if (k === 'search') {
                this.ui.search = el.value; this.ui.limit = 60;
                const f = el.closest('.search-field');
                if (f) f.classList.toggle('has-value', !!el.value);
                clearTimeout(this.searchTimer);
                this.searchTimer = setTimeout(() => { this.renderDeckSidebar(); this.renderDeckPanel(); this.quickQueryRefresh(); }, 110);
            }
            else if (k === 'deck-find') {
                this.ui.deckQ = el.value; const r = $('#deck-find-res'), t = $('#deck-tree');
                if (r && t) { r.innerHTML = this.deckFinderHtml(el.value); r.classList.toggle('hidden', !el.value.trim()); t.classList.toggle('hidden', !!el.value.trim()); }
            }
            else if (k === 'dash-find') { const r = $('#dash-find-res'); if (r) { r.innerHTML = this.deckFinderHtml(el.value, 'open-deck'); r.classList.toggle('hidden', !el.value.trim()); const g = $('#dash-decks'); if (g) g.classList.toggle('hidden', !!el.value.trim()); } }
        });
        document.addEventListener('change', e => {
            const el = e.target, k = el.dataset && el.dataset.input;
            if (k === 'sort') { this.ui.sort = el.value; this.renderDeckPanel(); }
            else if (k === 'quick-tag') this.quickQueryTag(el.value);
            else if (k === 'deck-sort') { this.setSetting('deckSort', el.value); this.renderDashboard(); }
            else if (k === 'stats-deck') { this.statsUi.deck = el.value; this.renderStats(); }
            else if (k === 'stats-check') { this.statsUi[el.dataset.key] = el.checked; this.renderStats(); }
            else if (k === 'toggle') {
                this.setSetting(el.dataset.key, el.checked);
                if (el.dataset.key === 'cloudSync') {
                    if (el.checked) Cloud.sync(true); else Cloud.setStatus('off');
                    this.renderSettings();
                }
            }
        });
        document.addEventListener('selectionchange', () => {
            const sel = getSelection();
            if (!sel.rangeCount) return;
            const r = sel.getRangeAt(0);
            const node = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement;
            const area = node && node.closest && node.closest('.editor-area');
            if (area) { this.editorRange = r.cloneRange(); this.updateToolbarState(area); }
        });
        document.addEventListener('paste', e => {
            const area = e.target.closest && e.target.closest('.editor-area');
            if (!area) return;
            const dt = e.clipboardData;
            if (!dt) return;
            const fileItem = [...(dt.items || [])].find(i => i.kind === 'file' && i.type.startsWith('image/'));
            if (fileItem) { e.preventDefault(); this.insertImage(fileItem.getAsFile(), area); return; }
            const html = dt.getData('text/html');
            if (html) { e.preventDefault(); document.execCommand('insertHTML', false, sanitizeHtml(html.replace(/<!--[\s\S]*?-->/g, ''), { colors: false })); return; }
            const text = dt.getData('text/plain');
            if (text) { e.preventDefault(); document.execCommand('insertText', false, text); }
        });
        document.addEventListener('drop', e => {
            const area = e.target.closest && e.target.closest('.editor-area');
            if (!area) return;
            const file = [...(e.dataTransfer.files || [])].find(f => f.type.startsWith('image/'));
            if (file) { e.preventDefault(); this.editorRange = null; this.insertImage(file, area); }
        });
        document.addEventListener('keydown', e => this.onKey(e));
        const tipAt = (e) => {
            const t = e.target.closest && e.target.closest('[data-tip]');
            if (!t) { this.hideTip(); return; }
            this.showTip(t, e.clientX, e.clientY);
        };
        document.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') tipAt(e); }, { passive: true });
        document.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') tipAt(e); }, { passive: true });
        window.addEventListener('scroll', () => { if (this.tipEl && this.tipTouch) this.hideTip(); if (this.popover && Math.abs(scrollY - (this.popoverY || 0)) > 80) this.closePopover(); }, { passive: true });
        let rz;
        window.addEventListener('resize', () => {
            clearTimeout(rz);
            rz = setTimeout(() => { if (this.view === 'stats') this.drawCharts(); this.closePopover(); }, 150);
        });
        matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (this.data && this.data.settings.theme === 'auto') this.applySettings(); });
        const flush = () => { if (this.saveTimer) this.writeNow(); };
        window.addEventListener('pagehide', flush);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') { flush(); if (Cloud.timer) { clearTimeout(Cloud.timer); Cloud.push(); } }
            else if (this.data && this.data.settings.cloudSync && !this.session && Date.now() - Cloud.lastPull > 60000) Cloud.sync();
        });
    }
    onKey(e) {
        const tag = (e.target.tagName || '').toLowerCase();
        const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c' && e.target.classList && e.target.classList.contains('editor-area')) { e.preventDefault(); this.clozeSelection(e.target, e.altKey); return; }
        if (this.modals.length) {
            const top = this.modals[this.modals.length - 1];
            if (e.key === 'Escape') { e.preventDefault(); this.closeModal(top); }
            else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && top._save) { e.preventDefault(); top._save(); }
            return;
        }
        if (e.key === 'Escape' && this.popover) { this.closePopover(); return; }
        if (e.target.id === 'card-search' && e.key === 'Escape') { e.preventDefault(); this.handleAction('clear-search'); return; }
        if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing && this.view !== 'session')) {
            e.preventDefault(); this.handleAction('global-search'); return;
        }
        if ((e.ctrlKey || e.metaKey) && !typing && this.view !== 'session') {
            const kk = e.key.toLowerCase();
            if (kk === 'z' && !e.shiftKey) { e.preventDefault(); this.undoGlobal(); return; }
            if (kk === 'y' || (kk === 'z' && e.shiftKey)) { e.preventDefault(); this.redoGlobal(); return; }
        }
        if (this.view === 'exam') { this.examKey(e); return; }
        const s = this.session;
        if (this.view !== 'session') return;
        if (!s) {
            if (e.key === 'Escape' || (e.key === 'Enter' && !typing)) { e.preventDefault(); this.goBack(); }
            return;
        }
        if (e.key === 'Escape') { e.preventDefault(); this.quitSession(); return; }
        if (e.target.id === 'type-answer') {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.submitTyped(); }
            return;
        }
        if (typing || e.ctrlKey || e.metaKey || e.altKey) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); this.undo(); }
            return;
        }
        const k = e.key.toLowerCase();
        if (s.kind === 'quiz' || s.kind === 'chrono') {
            if (['1', '2', '3', '4'].includes(k)) { e.preventDefault(); this.quizAnswer(Number(k) - 1, $$('.quiz-opt')[Number(k) - 1]); }
            else if ((k === 'enter' || k === ' ') && s.answered && s.kind === 'quiz') { e.preventDefault(); this.nextQuestion(); }
            return;
        }
        if (s.current && this.card(s.current)) {
            const ids = [s.current];
            const ops = { '*': () => this.opMark(ids), '@': () => this.opSuspend(ids, false), '!': () => this.opSuspend(ids, true), '-': () => this.opBury(ids, false), '=': () => this.opBury(ids, true), i: () => this.openCardInfo(s.current) };
            if (ops[e.key] || ops[k]) { e.preventDefault(); (ops[e.key] || ops[k])(); return; }
        }
        if (k === 'z') { e.preventDefault(); this.undo(); return; }
        if (k === 'e') { e.preventDefault(); this.openCardModal(s.current); return; }
        if (k === 'h') { e.preventDefault(); this.handleAction('hint'); return; }
        if (!s.revealed) {
            if (k === ' ' || k === 'enter') { e.preventDefault(); this.reveal(); }
            return;
        }
        if (s.kind === 'srs') {
            if (['1', '2', '3', '4'].includes(k)) { e.preventDefault(); this.grade(Number(k)); }
            else if (k === ' ' || k === 'enter') { e.preventDefault(); this.grade(s.typed ? s.typed.suggest : 3); }
        } else {
            if (k === '1' || k === 'arrowleft') { e.preventDefault(); this.practiceAnswer(false); }
            else if (k === '2' || k === 'arrowright') { e.preventDefault(); this.practiceAnswer(true); }
            else if (k === ' ' || k === 'enter') { e.preventDefault(); this.practiceAnswer(s.typed ? s.typed.suggest >= 3 : true); }
        }
    }
    async handleAction(action, el = {}, e) {
        const ds = el.dataset || {};
        switch (action) {
            case 'study': this.startStudy(ds.deck || null); break;
            case 'extra-new': this.startStudy(null, 10); break;
            case 'practice-all': this.startPractice(null, this.data.settings.answerMode, 20); break;
            case 'practice-deck':
            case 'free-deck': this.startFree(ds.deck); break;
            case 'ordered-deck': this.startFree(ds.deck, true); break;
            case 'practice-errors': {
                const ids = this.errorCards().map(c => c.id);
                if (!ids.length) { this.toast('Aucune erreur à retravailler 🎉', 'success'); break; }
                this.startPractice(null, this.data.settings.answerMode, 30, '🎯 Mes erreurs', ids);
                break;
            }
            case 'practice-missed': {
                const ids = (this.lastSession && this.lastSession.missed) || [];
                if (ids.length) this.startPractice(null, 'flip', 9999, '🎯 Erreurs de la session', ids);
                break;
            }
            case 'replay': {
                const r = this.lastSession && this.lastSession.replay;
                if (!r) { this.go('dashboard'); break; }
                if (r.kind === 'chrono') this.startQuizFromIds(r.pool, 0, r.duration, r.title);
                else this.startQuizFromIds(r.pool, r.total, 0, r.title);
                break;
            }
            case 'home': this.endSession(false); this.go('dashboard'); break;
            case 'back-origin': this.goBack(); break;
            case 'mode': this.openModeLauncher(ds.mode, ds.deck); break;
            case 'new-card': this.openCardModal(null, ds.deck); break;
            case 'new-deck': this.openDeckModal(); break;
            case 'edit-deck': this.openDeckModal(ds.deck); break;
            case 'delete-deck': this.deleteDeck(ds.deck); break;
            case 'edit-card': this.openCardModal(ds.card); break;
            case 'delete-card': this.deleteCard(ds.card); break;
            case 'edit-current': if (this.session && this.session.current) this.openCardModal(this.session.current); break;
            case 'import': this.openImportModal(); break;
            case 'import-json': this.importJSON(); break;
            case 'export': this.exportJSON(); break;
            case 'open-deck': this.ui.deckQ = ''; this.ui.treeOpen = false; this.go('decks', { deck: ds.deck, filter: 'all' }); break;
            case 'select-deck': this.ui.deck = ds.deck; this.ui.limit = 60; this.ui.deckQ = ''; this.ui.treeOpen = false; this.touchDeck(ds.deck); this.renderDecks(); break;
            case 'toggle-tree': this.ui.treeOpen = !this.treeIsOpen(); this.renderDeckSidebar(); if (this.ui.treeOpen && !window.matchMedia('(max-width: 960px)').matches) setTimeout(() => { const f = $('#deck-find'); f && f.focus(); }, 60); break;
            case 'filter': this.ui.filter = ds.filter; this.ui.limit = 60; this.renderDeckPanel(); break;
            case 'goto-filter': this.ui.search = ''; this.go('decks', { deck: 'all', filter: ds.filter }); break;
            case 'more': this.ui.limit += 100; this.renderDeckPanel(); break;
            case 'set': {
                const cur = this.data.settings[ds.key];
                const v = typeof cur === 'number' ? Number(ds.value) : ds.value;
                this.setSetting(ds.key, v);
                this.renderSettings();
                break;
            }
            case 'sync-now': Cloud.sync(true); break;
            case 'recent-del': this.data.settings.recentDecks = (this.data.settings.recentDecks || []).filter(x => x !== ds.deck); this.save(false); this.renderDashboard(); break;
            case 'deck-admin': {
                const id = el.dataset.deck;
                this.showMenu(el, [
                    { icon: 'plus', label: 'Nouvelle carte', fn: () => this.handleAction('new-card', { dataset: { deck: id } }) },
                    { icon: 'folderPlus', label: 'Nouveau sous-paquet', fn: () => this.handleAction('new-subdeck', { dataset: { deck: id } }) },
                    { sep: true },
                    { icon: 'keyboard', label: 'Écrire la réponse', fn: () => this.openModeLauncher('write', id) },
                    { icon: 'quiz', label: 'Quiz (QCM)', fn: () => this.openModeLauncher('quiz', id) },
                    { icon: 'timer', label: 'Chrono', fn: () => this.openModeLauncher('chrono', id) },
                    { sep: true },
                    { icon: 'sliders', label: 'Options d\'étude du paquet', fn: () => this.handleAction('deck-options', { dataset: { deck: id } }) },
                    { icon: 'pencil', label: 'Modifier le paquet', fn: () => this.handleAction('edit-deck', { dataset: { deck: id } }) },
                    { icon: 'reset', label: 'Remettre à zéro…', fn: () => this.handleAction('reset-deck', { dataset: { deck: id } }) },
                    { icon: 'trash', label: 'Supprimer le paquet…', fn: () => this.handleAction('delete-deck', { dataset: { deck: id } }) }
                ]);
                break;
            }
            case 'exam-go': {
                if (!this.deck(ds.deck)) break;
                if (ds.mode === 'ordered') this.startFree(ds.deck, true, true); else this.startFree(ds.deck);
                break;
            }
            case 'home-toggle': {
                const o = { ...(this.data.settings.homeOpen || {}) }; o[ds.sec] = !this.homeOpen(ds.sec, ds.sec === 'recents' || ds.sec === 'goals');
                this.setSetting('homeOpen', o); this.renderDashboard(); break;
            }
            case 'resume-last': {
                const r = this.data.settings.lastRun; if (!r) break;
                if (r.kind === 'study') this.startStudy(r.deck || null);
                else if (r.kind === 'free') this.startFree(r.deck);
                else this.startFree(r.deck, true, true);
                break;
            }
            case 'dash-open': {   // home: a deck with sub-decks unfolds in place, a deck without opens its cards
                if (this.childrenOf(ds.deck).length) { this.toggleOpen('dash', ds.deck); this.renderDashboard(); }
                else { this.ui.deckQ = ''; this.ui.treeOpen = false; this.go('decks', { deck: ds.deck, filter: 'all' }); }
                break;
            }
            case 'deck-more': {
                const id = el.dataset.deck;
                this.showMenu(el, [
                    { icon: 'layers', label: 'Voir les cartes du paquet', fn: () => this.handleAction('open-deck', { dataset: { deck: id } }) },
                    { sep: true },
                    { icon: 'keyboard', label: 'Écrire la réponse', fn: () => this.openModeLauncher('write', id) },
                    { icon: 'quiz', label: 'Quiz (QCM)', fn: () => this.openModeLauncher('quiz', id) },
                    { icon: 'timer', label: 'Chrono', fn: () => this.openModeLauncher('chrono', id) },
                    { sep: true },
                    { icon: 'reset', label: 'Remettre à zéro…', fn: () => this.handleAction('reset-deck', { dataset: { deck: id } }) }
                ]);
                break;
            }
            case 'pin-deck': {
                const pins = [...(this.data.settings.pinnedDecks || [])], i = pins.indexOf(ds.deck);
                if (i >= 0) pins.splice(i, 1); else pins.unshift(ds.deck);
                this.setSetting('pinnedDecks', pins); this.renderDashboard();
                this.toast(i >= 0 ? 'Paquet désépinglé' : 'Paquet épinglé en haut', 'success', ic('pin'));
                break;
            }
            case 'reset-deck': {
                const d = this.deck(ds.deck); if (!d) break;
                const ids = this.poolFor([ds.deck]).map(c => c.id);
                const all = this.data.cards.filter(c => this.descendantIds(ds.deck).includes(c.deckId)).map(c => c.id);
                const ok = await this.confirm({ title: `Remettre « ${d.name} » à zéro ?`, message: `${plural(all.length, 'carte')} (paquet et sous-paquets) redeviennent « nouvelles ». Tes cartes sont conservées ; tu pourras annuler juste après.`, ok: 'Remettre à zéro', danger: true });
                if (ok) this.opReset(all.length ? all : ids);
                break;
            }
            case 'reset-progress': {
                const ok = await this.confirm({ title: 'Remettre la progression à zéro ?', message: 'Toutes les cartes redeviennent « nouvelles ». Tes cartes, tes images et ta série sont conservées.', ok: 'Remettre à zéro', danger: true });
                if (!ok) break;
                await this.sensitiveSnapshot('remise à zéro de la progression');
                const now = Date.now();
                this.data.cards.forEach(c => Object.assign(c, { state: 'new', step: 0, interval: 0, ease: this.deckCfg(c.deckId).startEase, due: now, reps: 0, lapses: 0, lastReview: null, errors: 0, fs: null, buriedUntil: 0 }));
                this.data.revlog = [];
                this.data.stats.newSeen = { date: dayKey(), count: 0 };
                this.save(); this.render();
                this.toast('Progression remise à zéro', 'success', undefined, { label: 'Annuler', ms: 15000, fn: () => this.sensitiveUndo() });
                break;
            }
            case 'reset-all': {
                const ok = await this.confirm({ title: 'Tout réinitialiser ?', message: 'Tes paquets, cartes, images et statistiques seront effacés et remplacés par les cartes d\'origine. Pense à exporter une sauvegarde avant.', ok: 'Tout effacer', danger: true });
                if (!ok) break;
                await this.sensitiveSnapshot('réinitialisation de l\'application');
                const fresh = seedState();
                fresh.settings = Object.assign({}, this.data.settings);
                this.replaceData(fresh);
                this.save();
                this.toast('Application réinitialisée', 'success', undefined, { label: 'Annuler', ms: 15000, fn: () => this.sensitiveUndo() });
                break;
            }
            case 'sens-undo': {
                const info = this.sensitiveInfo(); if (!info) break;
                const ok = await this.confirm({ title: 'Revenir en arrière ?', message: `L'application revient à l'état d'avant « ${esc(info.label)} » (${esc(new Date(info.at).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }))}). Ce qui a été fait depuis sera perdu.`, ok: 'Revenir en arrière' });
                if (ok) this.sensitiveUndo();
                break;
            }
            case 'undo-global': this.undoGlobal(); break;
            case 'redo-global': this.redoGlobal(); break;
            case 'deck-options': this.openDeckOptions(ds.deck); break;
            case 'new-subdeck': this.openDeckModal(null, ds.deck); break;
            case 'custom-study': this.openCustomStudy(ds.deck || undefined); break;
            case 'session-menu': this.sessionMenu(el); break;
            case 'sel-toggle': this.ui.selMode = !this.ui.selMode; if (!this.ui.selMode) this.ui.sel = new Set(); this.renderDeckPanel(); break;
            case 'sel-exit': this.ui.selMode = false; this.ui.sel = new Set(); this.renderDeckPanel(); break;
            case 'sel-all': {   // one button: first tap selects every visible card, second tap clears them
                const ids = this.visibleIds || [], all = ids.length && ids.every(id => this.ui.sel.has(id));
                ids.forEach(id => (all ? this.ui.sel.delete(id) : this.ui.sel.add(id)));
                this.renderDeckPanel(); break;
            }
            case 'sel-none': this.ui.sel = new Set(); this.renderDeckPanel(); break;
            case 'row-click': {
                const id = ds.card;
                if (!this.ui.selMode) { this.openCardModal(id); break; }
                if (e && e.shiftKey && this.lastSelId && this.visibleIds) {
                    const a = this.visibleIds.indexOf(this.lastSelId), b = this.visibleIds.indexOf(id);
                    if (a >= 0 && b >= 0) this.visibleIds.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(x => this.ui.sel.add(x));
                } else if (this.ui.sel.has(id)) this.ui.sel.delete(id); else this.ui.sel.add(id);
                this.lastSelId = id;
                this.renderDeckPanel();
                break;
            }
            case 'row-menu': {
                const id = ds.card, c = this.card(id);
                if (c) this.showMenu(el, this.cardMenuItems([id]), { flagCur: c.flag, onFlag: n => this.opFlag([id], n) });
                break;
            }
            case 'bulk-menu': {
                const ids = [...this.ui.sel].filter(id => this.card(id));
                if (ids.length) this.showMenu(el, this.cardMenuItems(ids), { onFlag: n => this.opFlag(ids, n) });
                break;
            }
            case 'export-txt': this.exportTXT(); break;
            case 'open-library': this.openLibrary(); break;
            case 'lib-dismiss': this.setSetting('libSeen', true); this.renderDashboard(); break;
            case 'tips-dismiss': this.setSetting('tipsSeen', true); this.renderDashboard(); break;
            case 'toggle-deck': this.toggleOpen('side', ds.deck); this.renderDeckSidebar(); break;
            case 'dash-toggle': this.toggleOpen('dash', ds.deck); this.renderDashboard(); break;
            case 'tree-all': this.setAllOpen(ds.key, ds.open === '1'); this.renderDeckSidebar(); break;
            case 'goals-manage': this.go('settings'); setTimeout(() => { const g = $('#goals-panel'); if (g) { const sp = g.closest('details'); if (sp) sp.open = true; g.scrollIntoView({ block: 'start' }); window.scrollBy(0, -120); } }, 80); break;
            case 'goal-add': {
                const name = (($('#goal-name') || {}).value || '').trim(), date = ($('#goal-date') || {}).value || '';
                if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { this.toast('Choisis une date pour ton objectif.', 'warning'); break; }
                const deck = ($('#goal-deck') || {}).value || '';
                this.data.settings.goals = [...this.goalsRaw(), { id: uid('g'), name: name || (deck && this.deck(deck) ? this.deck(deck).name : 'Objectif'), date, ...(deck && this.deck(deck) ? { deck } : {}) }];
                this.data.settings.settingsMod = Date.now();
                this.save(); this.renderSettings();
                this.toast('Objectif ajouté', 'success', ic('target'));
                break;
            }
            case 'goal-del': {
                this.data.settings.goals = this.goalsRaw().filter(g => g.id !== ds.id);
                this.data.settings.settingsMod = Date.now();
                this.save(); this.renderSettings();
                this.toast('Objectif supprimé', 'success', ic('target'));
                break;
            }
            case 'backup-now': this.manualBackup(); break;
            case 'backup-restore': this.restoreBackup(ds.key); break;
            case 'backup-download': this.downloadBackup(ds.key); break;
            case 'backup-delete': await Storage.backupDelete(ds.key); this.renderSettings(); break;
            case 'save-options': {
                const o = this.readOptions($('#view-settings'));
                Object.entries(o).forEach(([k, v]) => { this.data.settings[k] = v; });
                this.data.settings.settingsMod = Date.now();
                this.save(); this.applySettings();
                this.toast('Options d\'étude enregistrées', 'success', ic('sliders'));
                break;
            }
            case 'save-sync-key': {
                const v = ($('#sync-key-input') || {}).value || '';
                if (v && v.length < 8) { this.toast('Choisis une phrase d\'au moins 8 caractères.', 'warning'); break; }
                this.data.settings.syncKey = v.trim();
                this.data.settings.settingsMod = Date.now();
                this.save(false);
                Cloud.client && 0;
                this.toast(v ? 'Clé enregistrée : synchronisation chiffrée' : 'Clé supprimée', 'success', ic('lock'));
                Cloud.sync(true);
                this.renderSettings();
                break;
            }
            case 'quit-session': this.quitSession(); break;
            case 'reveal': this.reveal(); break;
            case 'submit-typed': this.submitTyped(); break;
            case 'grade': this.grade(Number(ds.grade)); break;
            case 'practice-answer': this.practiceAnswer(ds.ok === '1'); break;
            case 'card-size': {
                const ks = Object.keys(CARD_SIZES), i = Math.max(0, Math.min(ks.length - 1, ks.indexOf(this.data.settings.cardSize) + Number(ds.d)));
                this.setSetting('cardSize', ks[i]); if (this.session && this.session.current) this.renderSession(); break;
            }
            case 'undo': this.undo(); break;
            case 'speak': this.speak(); break;
            case 'hint': {
                const slot = $('#hint-slot');
                const c = this.session && this.session.current && this.card(this.session.current);
                if (slot && c && c.hint) { slot.innerHTML = slot.innerHTML ? '' : `<div class="hint-box rich">${c.hint}</div>`; }
                if (e) e.stopPropagation();
                break;
            }
            case 'detail': {
                const slot = $('#detail-slot');
                const c = this.session && this.session.current && this.card(this.session.current);
                if (slot && c) slot.innerHTML = slot.innerHTML ? '' : `<div class="detail-box rich">${c.detail}</div>`;
                break;
            }
            case 'quiz-answer': this.quizAnswer(Number(ds.i), el); break;
            case 'quick-q': this.quickQueryToggle(ds.q); break;
            case 'clear-search': {
                this.ui.search = ''; this.ui.limit = 60;
                const inp = $('#card-search');
                if (inp) { inp.value = ''; inp.closest('.search-field').classList.remove('has-value'); inp.focus(); }
                this.renderDeckSidebar(); this.renderDeckPanel();
                break;
            }
            case 'global-search': {
                if (this.view !== 'decks') this.go('decks');
                const inp = $('#card-search');
                if (inp) { inp.focus(); inp.select(); }
                break;
            }
            case 'new-card-from-search': this.openCardModal(null, this.ui.deck !== 'all' && this.ui.deck !== 'errors' ? this.ui.deck : null, this.ui.search.trim()); break;
            case 'stats-opt': {
                const v = ds.value;
                this.statsUi[ds.key] = v === 'true' ? true : v === 'false' ? false : isNaN(Number(v)) ? v : Number(v);
                this.renderStats();
                break;
            }
            case 'chart-toggle': {
                const set = this.statsUi.hidden[ds.chart] || (this.statsUi.hidden[ds.chart] = new Set());
                set.has(ds.key) ? set.delete(ds.key) : set.add(ds.key);
                el.classList.toggle('off', set.has(ds.key));
                this.drawCharts(ds.chart);
                break;
            }
            case 'cal-year': this.statsUi.calYear += Number(ds.delta); this.renderStats(); break;
            case 'stats-deck': this.statsUi.deck = ds.deck; this.renderStats(); window.scrollTo({ top: 0 }); break;
            case 'pop-streak': this.togglePopover(el, () => this.streakPopoverHtml()); break;
            case 'pop-sync': this.togglePopover(el, () => this.syncPopoverHtml()); break;
            case 'go-stats': this.go('stats'); break;
            case 'go-settings': this.go('settings'); break;
            case 'quiz-next': this.nextQuestion(); break;
            case 'filter-edit': this.openFilterModal(ds.id || ''); break;
            case 'filter-start': this.startFilter(ds.id); break;
            case 'tool-filter': this.openFilterModal(''); break;
            case 'tool-export': this.openExportApkg(); break;
            case 'focus-toggle': this.focusToggleOpen(); break;
            case 'study-next-group': this.startStudy(ds.deck || null); break;
            case 'voice-toggle': this.voiceToggle(); break;
            case 'autospeak-toggle': { const on = !this.data.settings.autoSpeak; this.setSetting('autoSpeak', on); this.audioBarSync(true); if (on) this.speak(); else if ('speechSynthesis' in window) speechSynthesis.cancel(); break; }
            case 'tool-trash': this.openTrash(); break;
            case 'tool-types': this.openNoteTypes(); break;
            case 'tool-sim': this.openLoadSim(); break;
            case 'tool-dups': this.openDuplicates(); break;
            case 'tool-empty': this.openEmptyCards(); break;
            case 'tool-check': this.checkDatabase(); break;
            case 'fsrs-optimize': this.fsrsOptimizeModal(ds.id || ''); break;
            case 'fsrs-reset': this.fsrsReset(ds.id || ''); break;
            default: if (action.startsWith('tq-')) this.toeicAction(action, el); break;
        }
    }
    startQuizFromIds(ids, count, chrono, title) {
        const pool = (ids || []).filter(id => this.card(id));
        if (!pool.length) { this.go('dashboard'); return; }
        const s = {
            kind: chrono ? 'chrono' : 'quiz', title: chrono ? 'Chrono' : 'Quiz', pool: shuffle([...pool]),
            total: 0, index: 0, score: 0, answered: false, quizCard: null, options: [], missed: [], history: [],
            done: 0, correct: 0, startedAt: Date.now(), cardStart: Date.now(), duration: chrono, timeLeft: chrono, timer: null
        };
        s.queue = chrono ? [...s.pool] : s.pool.slice(0, count || s.pool.length);
        s.total = s.queue.length;
        if (title) s.title = title;
        this.session = s;
        this.go('session');
        this.nextQuestion();
        if (chrono) {
            s.timer = setInterval(() => {
                if (this.session !== s) { clearInterval(s.timer); return; }
                s.timeLeft--;
                this.updateChronoHud();
                if (s.timeLeft <= 0) this.finishChrono();
            }, 1000);
        }
    }
}

function interleave(reviews, news) {
    if (!news.length) return reviews;
    if (!reviews.length) return news;
    const out = [], every = reviews.length / (news.length + 1);
    let ri = 0;
    news.forEach((n, i) => {
        const upto = Math.round((i + 1) * every);
        while (ri < upto && ri < reviews.length) out.push(reviews[ri++]);
        out.push(n);
    });
    while (ri < reviews.length) out.push(reviews[ri++]);
    return out;
}

/* CSV / TXT parser: ; tab or , separators, quoted fields, Anki "#" headers */
function parseImport(text) {
    const all = String(text || '').replace(/^﻿/, '').split(/\r\n|\n|\r/);
    const meta = { tagsCol: -1, deckCol: -1, sep: null };
    all.forEach(l => {
        let m;
        if ((m = /^#separator:\s*(.+)$/i.exec(l.trim()))) meta.sep = { tab: '\t', comma: ',', semicolon: ';', pipe: '|', space: ' ' }[m[1].trim().toLowerCase()] || null;
        if ((m = /^#tags column:\s*(\d+)/i.exec(l.trim()))) meta.tagsCol = Number(m[1]) - 1;
        if ((m = /^#deck column:\s*(\d+)/i.exec(l.trim()))) meta.deckCol = Number(m[1]) - 1;
    });
    const lines = all.filter(l => l.trim() && !/^#(separator|html|tags|columns|notetype|deck|guid|file)/i.test(l.trim()));
    if (!lines.length) return [];
    const sample = lines.slice(0, 20);
    const sep = meta.sep || (sample.some(l => l.includes('\t')) ? '\t' : sample.some(l => l.includes(';')) ? ';' : ',');
    const split = line => {
        const out = []; let cur = '', q = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (q) {
                if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
                else if (ch === '"') q = false;
                else cur += ch;
            } else if (ch === '"' && cur.trim() === '') { q = true; cur = ''; }
            else if (ch === sep) { out.push(cur); cur = ''; }
            else cur += ch;
        }
        out.push(cur);
        return out.map(x => x.trim());
    };
    const rows = [];
    lines.forEach(l => {
        const f = split(l);
        if (f.length < 2) return;
        const front = sanitizeHtml(f[0]), back = sanitizeHtml(f[1]);
        if (isBlank(front) || isBlank(back)) return;
        const tags = meta.tagsCol >= 0 && f[meta.tagsCol] ? f[meta.tagsCol].split(/\s+/).filter(Boolean) : [];
        const deck = meta.deckCol >= 0 && f[meta.deckCol] ? f[meta.deckCol] : '';
        const hint = f[2] && meta.tagsCol !== 2 && meta.deckCol !== 2 ? sanitizeHtml(f[2]) : '';
        rows.push({ front, back, hint, tags, deck });
    });
    return rows;
}
