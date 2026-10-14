/* ============================================================
   Export to an Anki package (.apkg, classic format): zip writer + a small SQLite file writer.
   Notes, card types (including your custom ones), cloze, tags, media (images, audio), and optionally
   the review state of cards that are in review.
   ============================================================ */
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function sha1Hex(str) {
    const bytes = new TextEncoder().encode(str), ml = bytes.length * 8, padded = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6);
    padded.set(bytes); padded[bytes.length] = 0x80;
    new DataView(padded.buffer).setUint32(padded.length - 4, ml >>> 0); new DataView(padded.buffer).setUint32(padded.length - 8, Math.floor(ml / 4294967296));
    let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;
    const w = new Uint32Array(80), dv = new DataView(padded.buffer), rot = (x, n) => (x << n) | (x >>> (32 - n));
    for (let i = 0; i < padded.length; i += 64) {
        for (let j = 0; j < 16; j++) w[j] = dv.getUint32(i + j * 4);
        for (let j = 16; j < 80; j++) w[j] = rot(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
        let a = h0, b = h1, c = h2, d = h3, e = h4;
        for (let j = 0; j < 80; j++) {
            const [f, k] = j < 20 ? [(b & c) | (~b & d), 0x5A827999] : j < 40 ? [b ^ c ^ d, 0x6ED9EBA1] : j < 60 ? [(b & c) | (b & d) | (c & d), 0x8F1BBCDC] : [b ^ c ^ d, 0xCA62C1D6];
            const t = (rot(a, 5) + f + e + k + w[j]) >>> 0; e = d; d = c; c = rot(b, 30) >>> 0; b = a; a = t;
        }
        h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
    }
    return [h0, h1, h2, h3, h4].map(x => x.toString(16).padStart(8, '0')).join('');
}

/* zip with stored (uncompressed) entries */
function zipStore(files) {
    const enc = new TextEncoder(), parts = [], central = [];
    let off = 0;
    files.forEach(({ name, data }) => {
        const nm = enc.encode(name), crc = crc32(data), lh = new DataView(new ArrayBuffer(30));
        lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true); lh.setUint16(10, 0, true); lh.setUint16(12, 0x21, true);
        lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, nm.length, true); lh.setUint16(28, 0, true);
        const ch = new DataView(new ArrayBuffer(46));
        ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true); ch.setUint16(12, 0, true); ch.setUint16(14, 0x21, true);
        ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
        parts.push(new Uint8Array(lh.buffer), nm, data); central.push(new Uint8Array(ch.buffer), nm);
        off += 30 + nm.length + data.length;
    });
    const cdSize = central.reduce((a, b) => a + b.length, 0), end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, cdSize, true); end.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/octet-stream' });
}

/* minimal SQLite database writer: tables only, rowid b-trees (with overflow pages and interior nodes) */
class SqliteWriter {
    constructor() { this.ps = 4096; this.pages = [new Uint8Array(this.ps)]; this.master = []; }
    static varint(n) {
        n = BigInt(n);
        if (n < 0x80n) return [Number(n)];
        const out = [Number(n & 0x7fn)]; let v = n >> 7n;
        while (v > 0n) { out.unshift(Number(v & 0x7fn) | 0x80); v >>= 7n; }
        return out;
    }
    static record(cols) {
        const types = [], body = [];
        const enc = new TextEncoder();
        cols.forEach(v => {
            if (v === null || v === undefined) { types.push(0); return; }
            if (typeof v === 'number' || typeof v === 'bigint') {
                const n = BigInt(v);
                if (n === 0n) { types.push(8); return; }
                if (n === 1n) { types.push(9); return; }
                const hit = [[1, 1n << 7n, 1], [2, 1n << 15n, 2], [3, 1n << 23n, 3], [4, 1n << 31n, 4], [6, 1n << 47n, 5], [8, 1n << 63n, 6]].find(([, lim]) => n >= -lim && n < lim);
                const len = hit[0];
                types.push(hit[2]);
                let x = BigInt.asUintN(len * 8, n);
                const b = []; for (let i = 0; i < len; i++) { b.unshift(Number(x & 0xffn)); x >>= 8n; }
                body.push(...b); return;
            }
            const bytes = typeof v === 'string' ? enc.encode(v) : v;
            types.push(typeof v === 'string' ? 13 + bytes.length * 2 : 12 + bytes.length * 2);
            body.push(...bytes);
        });
        const th = types.flatMap(t => SqliteWriter.varint(t));
        let hl = th.length + 1; if (hl > 127) hl = th.length + 2;
        const hdr = [...SqliteWriter.varint(hl), ...th];
        return Uint8Array.from([...hdr, ...body]);
    }
    alloc() { this.pages.push(new Uint8Array(this.ps)); return this.pages.length; }
    /* the cell for one row: local payload + pointer to overflow pages */
    cell(rowid, payload) {
        const U = this.ps, X = U - 35, P = payload.length;
        let local = P, ovf = 0;
        if (P > X) {
            const M = Math.floor((U - 12) * 32 / 255) - 23, K = M + ((P - M) % (U - 4));
            local = K <= X ? K : M;
            let pos = local, prev = null;
            while (pos < P) {
                const pg = this.alloc(), take = Math.min(U - 4, P - pos), page = this.pages[pg - 1];
                page.set(payload.subarray(pos, pos + take), 4);
                if (prev) new DataView(this.pages[prev - 1].buffer).setUint32(0, pg); else ovf = pg;
                prev = pg; pos += take;
            }
        }
        const head = [...SqliteWriter.varint(P), ...SqliteWriter.varint(rowid)];
        const out = new Uint8Array(head.length + local + (P > X ? 4 : 0));
        out.set(head); out.set(payload.subarray(0, local), head.length);
        if (P > X) new DataView(out.buffer).setUint32(head.length + local, ovf);
        return out;
    }
    /* writes cells into a page (leaf: type 0x0d, interior: 0x05 with rightmost pointer) */
    fill(pageNo, type, cells, right = 0, base = 0) {
        const page = this.pages[pageNo - 1], dv = new DataView(page.buffer), hl = type === 0x05 ? 12 : 8;
        let end = this.ps;
        cells.forEach((c, i) => { end -= c.length; page.set(c, end); dv.setUint16(base + hl + i * 2, end); });
        page[base] = type; dv.setUint16(base + 3, cells.length); dv.setUint16(base + 5, end);
        if (type === 0x05) dv.setUint32(base + 8, right);
    }
    fits(cells, extra, base, hl) { return base + hl + (cells.length + 1) * 2 + cells.reduce((a, c) => a + c.length, 0) + extra <= this.ps; }
    /* rows: [{id, c: [...columns]}] sorted by id. Returns the root page number. */
    table(rows) {
        let level = [], cells = [], maxId = 0;
        const flush = () => { const pg = this.alloc(); this.fill(pg, 0x0d, cells); level.push({ pg, max: maxId }); cells = []; };
        if (!rows.length) flush();
        rows.forEach(r => {
            const cell = this.cell(r.id, SqliteWriter.record(r.c));
            if (cells.length && !this.fits(cells, cell.length, 0, 8)) flush();
            cells.push(cell); maxId = r.id;
        });
        if (cells.length) flush();
        while (level.length > 1) {
            const next = []; let i = 0;
            while (i < level.length) {
                const group = []; let size = 12 + 2;
                while (i < level.length && (group.length < 2 || size + 2 + 13 <= this.ps)) { group.push(level[i++]); size += 15; }
                if (i === level.length - 1 && size + 17 <= this.ps + 40) group.push(level[i++]);
                const pg = this.alloc(), cs = group.slice(0, -1).map(g => Uint8Array.from([0, 0, 0, 0, ...SqliteWriter.varint(g.max)]));
                cs.forEach((c, k) => new DataView(c.buffer).setUint32(0, group[k].pg));
                this.fill(pg, 0x05, cs, group[group.length - 1].pg);
                next.push({ pg, max: group[group.length - 1].max });
            }
            level = next;
        }
        return level[0].pg;
    }
    addTable(name, sql, rows) { this.master.push(['table', name, name, this.table(rows), sql]); }
    finish() {
        const cells = this.master.map((m, i) => this.cell(i + 1, SqliteWriter.record(m)));
        this.fill(1, 0x0d, cells, 0, 100);
        const h = this.pages[0], dv = new DataView(h.buffer);
        h.set(new TextEncoder().encode('SQLite format 3\0'));
        dv.setUint16(16, this.ps); h[18] = 1; h[19] = 1; h[20] = 0; h[21] = 64; h[22] = 32; h[23] = 32;
        dv.setUint32(24, 1); dv.setUint32(28, this.pages.length); dv.setUint32(40, 1); dv.setUint32(44, 4); dv.setUint32(56, 1); dv.setUint32(92, 1); dv.setUint32(96, 3045000);
        const out = new Uint8Array(this.pages.length * this.ps);
        this.pages.forEach((p, i) => out.set(p, i * this.ps));
        return out;
    }
}

const ANKI_SCHEMA = {
    col: 'CREATE TABLE col (id integer primary key, crt integer not null, mod integer not null, scm integer not null, ver integer not null, dty integer not null, usn integer not null, ls integer not null, conf text not null, models text not null, decks text not null, dconf text not null, tags text not null)',
    notes: 'CREATE TABLE notes (id integer primary key, guid text not null, mid integer not null, mod integer not null, usn integer not null, tags text not null, flds text not null, sfld integer not null, csum integer not null, flags integer not null, data text not null)',
    cards: 'CREATE TABLE cards (id integer primary key, nid integer not null, did integer not null, ord integer not null, mod integer not null, usn integer not null, type integer not null, queue integer not null, due integer not null, ivl integer not null, factor integer not null, reps integer not null, lapses integer not null, left integer not null, odue integer not null, odid integer not null, flags integer not null, data text not null)',
    revlog: 'CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null, ease integer not null, ivl integer not null, lastIvl integer not null, factor integer not null, time integer not null, type integer not null)',
    graves: 'CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null)'
};
const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'image/bmp': 'bmp', 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/aac': 'aac', 'audio/x-m4a': 'm4a' };

Object.assign(SuperAnki.prototype, {
    async exportApkg({ deckId = '', scheduling = true, onProgress } = {}) {
        const d = this.data, now = Date.now(), nowS = Math.floor(now / 1000), enc = new TextEncoder();
        const deckSet = deckId ? new Set(this.descendantIds(deckId)) : null;
        const cards = d.cards.filter(c => !deckSet || deckSet.has(c.deckId));
        if (!cards.length) throw new Error('Aucune carte à exporter.');
        let nextId = now * 1000 % 1e12 + 1e12; const newId = () => ++nextId;
        const crtMs = startOfDay(now) - 365 * DAY;
        /* media */
        const files = new Map(), fileByKey = new Map();
        const mediaFile = (dataUri, key) => {
            if (fileByKey.has(key)) return fileByKey.get(key);
            const mime = mediaMime(dataUri), ext = MIME_EXT[mime] || (mime.startsWith('audio') ? 'mp3' : 'jpg');
            const name = `sa_${mediaHash(key)}.${ext}`;
            try { const bin = atob(dataUri.slice(dataUri.indexOf(',') + 1)), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); files.set(name, u8); } catch { return null; }
            fileByKey.set(key, name);
            return name;
        };
        const resolve = src => src.startsWith('media:') ? [d.media[src.slice(6)], src] : [src.startsWith('data:') ? src : null, src];
        const convert = html => String(html || '')
            .replace(/<img\b[^>]*?\bsrc=["']([^"']+)["'][^>]*>/gi, (m, src) => { const [uri, key] = resolve(src); if (!uri) return /^https?:/i.test(src) ? m : ''; const f = mediaFile(uri, key); return f ? `<img src="${f}">` : ''; })
            .replace(/<audio\b[^>]*?\bsrc=["']([^"']+)["'][^>]*>\s*<\/audio>/gi, (m, src) => { const [uri, key] = resolve(src); const f = uri && mediaFile(uri, key); return f ? `[sound:${f}]` : ''; });
        /* models */
        const base = 1700000000000, models = {};
        const css = '.card {font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white;}\n.cloze {font-weight: bold; color: blue;}';
        const mk = (id, name, type, fields, tmpls) => {
            models[id] = { id, name, type, mod: nowS, usn: -1, sortf: 0, did: 1, tmpls: tmpls.map((t, i) => ({ name: t.name, ord: i, qfmt: t.front, afmt: t.back, bqfmt: '', bafmt: '', did: null, bfont: '', bsize: 0 })), flds: fields.map((f, i) => ({ name: f, ord: i, sticky: false, rtl: false, font: 'Arial', size: 20, media: [] })), css, latexPre: '\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n', latexPost: '\\end{document}', latexsvg: false, req: type === 1 ? [[0, 'all', [0]]] : tmpls.map((t, i) => [i, 'any', [0]]), vers: [], tags: [] };
            return id;
        };
        const M = { basic: mk(base + 1, 'SuperAnki Basique', 0, ['Front', 'Back'], [{ name: 'Card 1', front: '{{Front}}', back: '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}' }]),
            rev: mk(base + 2, 'SuperAnki Basique inversée', 0, ['Front', 'Back'], [{ name: 'Card 1', front: '{{Front}}', back: '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}' }, { name: 'Card 2', front: '{{Back}}', back: '{{FrontSide}}\n\n<hr id=answer>\n\n{{Front}}' }]),
            cloze: mk(base + 3, 'SuperAnki Texte à trous', 1, ['Text', 'Back Extra'], [{ name: 'Cloze', front: '{{cloze:Text}}', back: '{{cloze:Text}}<br>\n{{Back Extra}}' }]) };
        d.noteTypes.forEach((t, i) => { M[`nt:${t.id}`] = mk(base + 10 + i, t.name, 0, t.fields, t.templates); });
        /* decks */
        const ankiDeck = { 1: { id: 1, mod: nowS, name: 'Default', usn: -1, lrnToday: [0, 0], revToday: [0, 0], newToday: [0, 0], timeToday: [0, 0], collapsed: false, browserCollapsed: false, desc: '', dyn: 0, conf: 1, extendNew: 10, extendRev: 50 } };
        const deckNum = new Map();
        const deckFor = id => {
            if (deckNum.has(id)) return deckNum.get(id);
            const n = base + 100 + deckNum.size;
            deckNum.set(id, n);
            ankiDeck[n] = { id: n, mod: nowS, name: this.deckPath(id).split(' › ').join('::'), usn: -1, lrnToday: [0, 0], revToday: [0, 0], newToday: [0, 0], timeToday: [0, 0], collapsed: false, browserCollapsed: false, desc: '', dyn: 0, conf: 1, extendNew: 10, extendRev: 50 };
            return n;
        };
        /* notes and cards */
        const notes = [], cardRows = [], cardIdOf = new Map(), SEP = '\x1f';
        const guid = () => { const a = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&()*+,-./:;<=>?@[]^_`{|}~'; let s = ''; for (let i = 0; i < 10; i++) s += a[Math.floor(Math.random() * a.length)]; return s; };
        const tagsOf = c => ` ${[...c.tags, ...(c.marked ? ['marked'] : [])].map(t => t.replace(/\s+/g, '_')).join(' ')} `.replace(/^  $/, ' ');
        const addNote = (mid, fields, c, ords) => {
            const nid = newId();
            const first = fields[0] || '';
            notes.push({ id: nid, c: [null, guid(), mid, nowS, -1, tagsOf(c), fields.join(SEP), (sf => (/^-?(0|[1-9]\d{0,14})$/.test(sf) ? Number(sf) : /^\s*[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?\s*$/.test(sf) ? `\u200b${sf}` : sf))(stripHtml(first)), parseInt(sha1Hex(stripHtml(first)).slice(0, 8), 16), 0, ''] });
            return nid;
        };
        const addCard = (nid, src, ord) => {
            const id = newId(), did = deckFor(src.deckId), review = scheduling && src.state === 'review', susp = src.suspended;
            const dueDay = review ? Math.round((startOfDay(src.due) - crtMs) / DAY) : 0;
            cardRows.push({ id, c: [null, nid, did, ord, nowS, -1, review ? 2 : 0, susp ? -1 : review ? 2 : 0, review ? dueDay : cardRows.length + 1, review ? Math.max(1, src.interval) : 0, review ? Math.round((src.ease || 2.5) * 1000) : 0, scheduling ? src.reps : 0, scheduling ? src.lapses : 0, 0, 0, 0, src.flag & 7, ''] });
            cardIdOf.set(src.id, id);
        };
        const done = new Set(), list = [...cards];
        let n = 0;
        for (const c of list) {
            if (done.has(c.id)) continue;
            if (++n % 40 === 0) { if (onProgress) onProgress(n / list.length); await new Promise(r => setTimeout(r, 0)); }
            const extra = isBlank(c.detail) ? '' : `<br><br><div>${c.detail}</div>`;
            if (c.kind === 'custom' && c.nf && M[`nt:${c.nf.t}`]) {
                const sibs = cards.filter(x => x.nid === c.nid), nt = this.noteType(c.nf.t);
                const nid = addNote(M[`nt:${c.nf.t}`], nt.fields.map(f => convert((c.nf.f || {})[f] || '')), c);
                sibs.forEach(x => { addCard(nid, x, x.ord); done.add(x.id); });
            } else if (c.kind === 'cloze' && c.nf) {
                const sibs = cards.filter(x => x.nid === c.nid && x.kind === 'cloze'), nid = addNote(M.cloze, [convert(c.nf.text), convert(c.nf.extra)], c);
                sibs.forEach(x => { addCard(nid, x, Math.max(0, x.ord - 1)); done.add(x.id); });
            } else if (c.kind === 'rev' && c.nf) {
                const sibs = cards.filter(x => x.nid === c.nid && x.kind === 'rev'), nid = addNote(M.rev, [convert(c.nf.front), convert(c.nf.back + extra)], c);
                sibs.forEach(x => { addCard(nid, x, x.ord); done.add(x.id); });
            } else if (c.kind === 'occl' && c.nf) {
                const o = await this.occlusionImages(c), nid = addNote(M.basic, [convert(`<img src="${o.front}">`), convert(`<img src="${o.back}">` + (isBlank(c.nf.extra) ? '' : `<br>${c.nf.extra}`))], c);
                addCard(nid, c, 0); done.add(c.id);
            } else {
                const nid = addNote(M.basic, [convert(c.front), convert(c.back + extra)], c);
                addCard(nid, c, 0); done.add(c.id);
            }
        }
        /* review log */
        const rev = []; let lastId = 0;
        if (scheduling) d.revlog.forEach(r => { const cid = cardIdOf.get(r[1]); if (!cid || !(r[3] <= 2)) return; const id = Math.max(r[0], lastId + 1); lastId = id; rev.push({ id, c: [null, cid, -1, r[2], r[4] || 0, r[5] || 0, 0, r[6] || 0, r[3] === 0 ? 0 : r[3]] }); });
        const dconf = { 1: { id: 1, mod: nowS, name: 'Default', usn: -1, maxTaken: 60, autoplay: true, timer: 0, replayq: true, new: { bury: true, delays: [1, 10], initialFactor: 2500, ints: [1, 4, 7], order: 1, perDay: 20, separate: true }, lapse: { delays: [10], leechAction: 0, leechFails: 8, minInt: 1, mult: 0 }, rev: { bury: true, ease4: 1.3, fuzz: 0.05, ivlFct: 1, maxIvl: 36500, perDay: 200, hardFactor: 1.2 }, dyn: false } };
        const conf = { nextPos: 1, estTimes: true, activeDecks: [1], sortType: 'noteFld', timeLim: 0, sortBackwards: false, addToCur: true, curDeck: 1, newBury: true, newSpread: 0, dueCounts: true, curModel: String(base + 1), collapseTime: 1200 };
        const db = new SqliteWriter();
        db.addTable('col', ANKI_SCHEMA.col, [{ id: 1, c: [null, Math.floor(crtMs / 1000), now, now, 11, 0, 0, 0, JSON.stringify(conf), JSON.stringify(models), JSON.stringify(ankiDeck), JSON.stringify(dconf), '{}'] }]);
        db.addTable('notes', ANKI_SCHEMA.notes, notes);
        db.addTable('cards', ANKI_SCHEMA.cards, cardRows);
        db.addTable('revlog', ANKI_SCHEMA.revlog, rev);
        db.addTable('graves', ANKI_SCHEMA.graves, []);
        const dbBytes = db.finish();
        const names = [...files.keys()], mediaJson = {}; names.forEach((nm, i) => { mediaJson[i] = nm; });
        const zip = zipStore([{ name: 'collection.anki2', data: dbBytes }, { name: 'media', data: enc.encode(JSON.stringify(mediaJson)) }, ...names.map((nm, i) => ({ name: String(i), data: files.get(nm) }))]);
        return { blob: zip, notes: notes.length, cards: cardRows.length, media: names.length };
    },
    /* image occlusion card -> two flat images (question with masks, answer) as data URIs */
    async occlusionImages(c) {
        const od = occlusionData(c), src = this.data.media[c.nf.front.slice(6)] || '';
        const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
        const make = back => {
            const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
            const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
            od.m.forEach((r, i) => {
                const [x, y, w, h] = [r[0] / 100 * cv.width, r[1] / 100 * cv.height, r[2] / 100 * cv.width, r[3] / 100 * cv.height], act = i === c.ord - 1;
                if (!back && (od.mode === 'all' || act)) { g.fillStyle = act ? '#4f46e5' : '#475569'; g.fillRect(x, y, w, h); }
                if (back && act) { g.lineWidth = Math.max(3, cv.width / 150); g.strokeStyle = '#059669'; g.strokeRect(x, y, w, h); }
                if (back && !act && od.mode === 'all') { g.fillStyle = '#475569'; g.fillRect(x, y, w, h); }
            });
            return cv.toDataURL('image/jpeg', 0.85);
        };
        return { front: make(false), back: make(true) };
    },
    openExportApkg() {
        const m = this.openModal({
            title: 'Exporter vers Anki (.apkg)', size: 'narrow',
            body: `<div class="field"><label class="label" for="ea-deck">Quoi exporter ?</label><select class="select" id="ea-deck"><option value="">Tous les paquets</option>${this.sortedDecks().map(x => `<option value="${esc(x.id)}">${esc(x.emoji)} ${esc(this.deckPath(x.id))}</option>`).join('')}</select></div>
                <label class="check"><input type="checkbox" id="ea-sched" checked> Inclure ma progression (cartes en révision et historique)</label>
                <p class="help">Format Anki classique : l'application Anki récente sait l'importer (Fichier › Importer). Images, sons, textes à trous, types de notes personnalisés et tags sont conservés. Les images à masquer sont exportées comme des images aplaties.</p>
                <p class="help" id="ea-msg"></p><div class="progress"><i id="ea-bar" style="width:0%;background:var(--primary)"></i></div>`,
            foot: `<button class="btn btn-soft" data-close>Annuler</button><button class="btn btn-primary" id="ea-go">${ic('export')}Exporter</button>`
        });
        $('#ea-go', m).addEventListener('click', async () => {
            const go = $('#ea-go', m); go.disabled = true;
            try {
                const r = await this.exportApkg({ deckId: $('#ea-deck', m).value, scheduling: $('#ea-sched', m).checked, onProgress: p => { $('#ea-bar', m).style.width = `${Math.round(p * 100)}%`; } });
                const url = URL.createObjectURL(r.blob), a = document.createElement('a');
                a.href = url; a.download = `superanki-${dayKey()}.apkg`; document.body.appendChild(a); a.click(); a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 4000);
                $('#ea-bar', m).style.width = '100%';
                $('#ea-msg', m).textContent = `Exporté : ${plural(r.notes, 'note')}, ${plural(r.cards, 'carte')}, ${plural(r.media, 'fichier média', 'fichiers médias')}.`;
                this.toast('Fichier .apkg créé', 'success', ic('export'));
            } catch (e) { console.error(e); this.toast(e.message || 'Export impossible', 'error'); }
            go.disabled = false;
        });
    }
});
