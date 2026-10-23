#!/usr/bin/env python3
"""Assemble the single-file app (index.html) from src/.

The output is one self-contained HTML file: it can be opened by
double-click, installed on a phone home screen or deployed on Netlify.
"""
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"


def read(name):
    return (SRC / name).read_text(encoding="utf-8")


# ---------------------------------------------------------------
# Library packs: content/*.txt  ->  src/packs-data.js
#   @pack id | title | emoji | description        (one per file)
#   @tags a, b                                    (tags for every card)
#   ## Sub-deck name | emoji
#   front ;; back ;; hint                         (basic card)
#   C: text with {{c1::cloze}} ;; extra           (cloze card)
# ---------------------------------------------------------------
import json, re

PACK_ORDER = [
    ("anglais-bases", "anglais"), ("toeic-vocab", "anglais"), ("toeic-grammaire", "anglais"),
    ("toeic-verbes", "anglais"), ("toeic-faux-amis", "anglais"), ("toeic-expressions", "anglais"),
    ("banque-produits", "banque"), ("assurance", "banque"), ("finance-marches", "banque"), ("credit-fiscalite", "banque"),
    ("but-tc-marketing", "buttc"), ("but-tc-vente", "buttc"), ("but-tc-gestion-droit", "buttc"),
]
GROUPS = {
    "anglais": {"name": "Anglais & TOEIC", "emoji": "🇬🇧", "desc": "Du niveau débutant jusqu'aux pièges du TOEIC."},
    "banque": {"name": "Banque, assurance & finance", "emoji": "🏦", "desc": "Produits bancaires, assurance, marchés, crédit, fiscalité."},
    "buttc": {"name": "BUT TC · Fiches génériques", "emoji": "📚", "desc": "Fiches de base fournies avec l'app (pas tes cours) : marketing, vente, gestion, droit, économie."},
}


def parse_pack(name, group):
    pack = {"group": group, "tags": [], "decks": []}
    deck = None
    for n, raw in enumerate((ROOT / "content" / f"{name}.txt").read_text(encoding="utf-8").splitlines(), 1):
        line = raw.strip()
        if not line:
            continue
        if line.startswith("@pack"):
            p = [x.strip() for x in line[5:].split("|")]
            pack.update(id=p[0], title=p[1], emoji=p[2], desc=p[3])
        elif line.startswith("@tags"):
            pack["tags"] = [t.strip() for t in line[5:].split(",") if t.strip()]
        elif line.startswith("## "):
            p = [x.strip() for x in line[3:].split("|")]
            deck = {"name": p[0], "emoji": p[1] if len(p) > 1 else "📁", "cards": []}
            pack["decks"].append(deck)
        else:
            parts = [x.strip() for x in re.split(r"\s*;;\s*", line)]
            if line.startswith("C:"):
                parts[0] = parts[0][2:].strip()
                if "{{c" not in parts[0]:
                    raise SystemExit(f"{name}.txt:{n}: cloze without {{{{c1::}}}}")
                deck["cards"].append(["c", parts[0], parts[1] if len(parts) > 1 else ""])
            else:
                if len(parts) < 2 or not parts[0] or not parts[1]:
                    raise SystemExit(f"{name}.txt:{n}: card needs 'front ;; back'  -> {line[:60]}")
                deck["cards"].append(["b", parts[0], parts[1], parts[2] if len(parts) > 2 else ""])
    return pack


packs = [parse_pack(n, g) for n, g in PACK_ORDER]
(SRC / "packs-data.js").write_text(
    "const PACK_GROUPS = " + json.dumps(GROUPS, ensure_ascii=False) + ";\nconst PACKS = " + json.dumps(packs, ensure_ascii=False, separators=(",", ":")) + ";\n",
    encoding="utf-8")
print("packs:", sum(len(d["cards"]) for p in packs for d in p["decks"]), "cards in", len(packs), "packs")


# ---------------------------------------------------------------
# Courses: content/courses/*.txt -> src/courses-data.js
#   @course id | title | emoji | description      (added once under "Mes cours BUT TC > Semestre N")
#   @tags a, b ; ## Sub-deck | emoji ; front ;; back ;; hint  or  C: cloze ;; extra
# ---------------------------------------------------------------
courses = []
for f in sorted((ROOT / "content" / "courses").glob("*.txt")):
    course, deck = {"tags": [], "decks": [], "parent": "mes_but_tc_s5"}, None
    for n, raw in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
        line = raw.strip()
        if not line:
            continue
        if line.startswith("@course"):
            p = [x.strip() for x in line[7:].split("|")]
            course.update(id=p[0], title=p[1], emoji=p[2], desc=p[3])
        elif line.startswith("@tags"):
            course["tags"] = [t.strip() for t in line[5:].split(",") if t.strip()]
        elif line.startswith("## "):
            p = [x.strip() for x in line[3:].split("|")]
            deck = {"name": p[0], "emoji": p[1] if len(p) > 1 else "📁", "cards": []}
            course["decks"].append(deck)
        else:
            parts = [x.strip() for x in re.split(r"\s*;;\s*", line)]
            if line.startswith("C:"):
                parts[0] = parts[0][2:].strip()
                if "{{c" not in parts[0]:
                    raise SystemExit(f"{f.name}:{n}: cloze without {{{{c1::}}}}")
                deck["cards"].append(["c", parts[0], parts[1] if len(parts) > 1 else ""])
            else:
                if len(parts) < 2 or not parts[0] or not parts[1]:
                    raise SystemExit(f"{f.name}:{n}: card needs 'front ;; back' -> {line[:60]}")
                deck["cards"].append(["b", parts[0], parts[1], parts[2] if len(parts) > 2 else ""])
    courses.append(course)
(SRC / "courses-data.js").write_text("const COURSES = " + json.dumps(courses, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
print("courses:", sum(len(d["cards"]) for c in courses for d in c["decks"]), "cards in", len(courses), "courses")


# ---------------------------------------------------------------
# TOEIC simulator bank: content/toeic/*.txt  ->  src/toeic-bank.js
#   P1: emojis ;; background ;; correct | w | w | w ;; explanation ;; tag
#   P2 / P5: question ;; correct | w | w(| w) ;; explanation ;; tag
#   @P3 tag / @P4 tag            then  M:/W:/M2:/W2: lines (P3) or T: lines (P4),
#                                optional GRAPHIC: title | row | row, then Q: lines
#   @P6 tag | kind | title       then  X: paragraphs with [1]..[4], Q: lines
#   @P7S tag | kind | title      single passage      (H: X: R: C: L: lines, then Q:)
#   @P7D / @P7T tag              double / triple     (D: kind | title opens each document)
#   Q:  question ;; correct | w | w | w ;; explanation ;; tag      (the 1st option is always the right one)
#   QF: question ;; opt | opt | opt | opt ;; answer number ;; explanation ;; tag   (fixed order)
# ---------------------------------------------------------------
def parse_toeic():
    bank = {k: [] for k in ("p1", "p2", "p3", "p4", "p5", "p6", "p7s", "p7d", "p7t")}
    cnt = {k: 0 for k in bank}
    files = ["p1-p2", "p3", "p4", "p5", "p6", "p7-single", "p7-multi"]

    def newid(kind):
        cnt[kind] += 1
        return f"{kind}-{cnt[kind]:03d}"

    def opts_of(fields, where, n):
        o = [x.strip() for x in fields.split(" | ")]
        if len(o) != n or len(set(o)) != n or not all(o):
            raise SystemExit(f"{where}: expected {n} distinct options -> {fields[:70]}")
        return o

    def parse_q(line, where, fixed):
        f = [x.strip() for x in re.split(r"\s*;;\s*", line)]
        if fixed:
            stem, o, ans = f[0], opts_of(f[1], where, 4), int(f[2]) - 1
            return {"q": stem, "o": o, "a": ans, "x": f[3], "t": f[4] if len(f) > 4 else "", "f": 1}
        if " | " in f[0]:
            return {"q": "", "o": opts_of(f[0], where, 4), "a": 0, "x": f[1], "t": f[2] if len(f) > 2 else ""}
        if len(f) >= 6:
            return {"q": f[0], "o": f[1:5], "a": 0, "x": f[5], "t": f[6] if len(f) > 6 else ""}
        return {"q": f[0], "o": opts_of(f[1], where, 4), "a": 0, "x": f[2], "t": f[3] if len(f) > 3 else ""}

    cur = None
    for fname in files:
        path = ROOT / "content" / "toeic" / f"{fname}.txt"
        for n, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            line = raw.strip()
            if not line:
                continue
            where = f"toeic/{fname}.txt:{n}"
            if line.startswith("P1:"):
                f = [x.strip() for x in re.split(r"\s*;;\s*", line[3:])]
                if f[0].startswith("@"):   # real photo: "@key" (content/toeic/photos/<key>.jpg)
                    bank["p1"].append({"id": newid("p1"), "ph": f[0][1:], "e": [], "bg": "", "o": opts_of(f[1], where, 4), "a": 0, "x": f[2], "t": f[3] if len(f) > 3 else ""})
                else:
                    bank["p1"].append({"id": newid("p1"), "e": f[0].split(), "bg": f[1], "o": opts_of(f[2], where, 4), "a": 0, "x": f[3], "t": f[4] if len(f) > 4 else ""})
            elif line.startswith(("P2:", "P5:")):
                kind = "p2" if line.startswith("P2:") else "p5"
                f = [x.strip() for x in re.split(r"\s*;;\s*", line[3:])]
                bank[kind].append({"id": newid(kind), "q": f[0], "o": opts_of(f[1], where, 3 if kind == "p2" else 4), "a": 0, "x": f[2], "t": f[3] if len(f) > 3 else ""})
            elif line.startswith("@P"):
                head, _, rest = line[1:].partition(" ")
                p = [x.strip() for x in rest.split("|")]
                kind = head.lower().replace("p7s", "p7s").replace("p7d", "p7d").replace("p7t", "p7t")
                if kind not in bank:
                    raise SystemExit(f"{where}: unknown block {head}")
                cur = {"id": newid(kind), "t": p[0], "qs": []}
                if kind in ("p6", "p7s"):
                    cur["k"] = p[1] if len(p) > 1 else ""
                    cur["ti"] = p[2] if len(p) > 2 else ""
                if kind == "p3": cur["sp"] = []
                if kind == "p4": cur["tx"] = []
                if kind == "p6": cur["ps"] = []
                if kind == "p7s": cur["bl"] = []
                if kind in ("p7d", "p7t"): cur["docs"] = []
                cur["_kind"] = kind
                bank[kind].append(cur)
            elif cur is None:
                raise SystemExit(f"{where}: line outside a block -> {line[:50]}")
            elif line.startswith("QF:"):
                cur["qs"].append(parse_q(line[3:], where, True))
            elif line.startswith("Q:"):
                cur["qs"].append(parse_q(line[2:], where, False))
            elif line.startswith("GRAPHIC:"):
                g = [x.strip() for x in line[8:].split(" | ")]
                cur["g"] = {"ti": g[0], "rows": g[1:]}
            elif cur["_kind"] == "p3":
                m = re.match(r"(M2|W2|M|W):\s*(.+)", line)
                if not m:
                    raise SystemExit(f"{where}: bad speaker line -> {line[:50]}")
                cur["sp"].append([m.group(1), m.group(2)])
            elif cur["_kind"] == "p4" and line.startswith("T:"):
                cur["tx"].append(line[2:].strip())
            elif cur["_kind"] == "p6" and line.startswith("X:"):
                cur["ps"].append(line[2:].strip())
            elif cur["_kind"] in ("p7s", "p7d", "p7t"):
                if line.startswith("D:"):
                    d = [x.strip() for x in line[2:].split("|")]
                    cur["docs"].append({"k": d[0], "ti": d[1] if len(d) > 1 else "", "bl": []})
                    continue
                m = re.match(r"([HXRCL]):\s*(.*)", line)
                if not m:
                    raise SystemExit(f"{where}: bad document line -> {line[:50]}")
                t, body = m.group(1).lower(), m.group(2).strip()
                if t == "r": blk = ["r", [c.strip() for c in body.split(" | ")]]
                elif t == "c":
                    who, _, msg = body.partition(";;")
                    name, _, tm = who.partition("|")
                    blk = ["c", name.strip(), tm.strip(), msg.strip()]
                else: blk = [t, body]
                (cur["bl"] if cur["_kind"] == "p7s" else cur["docs"][-1]["bl"]).append(blk)
            else:
                raise SystemExit(f"{where}: unexpected line -> {line[:50]}")
    for k, items in bank.items():
        for it in items:
            it.pop("_kind", None)
    for kind in ("p3", "p4", "p6", "p7s", "p7d", "p7t"):
        for it in bank[kind]:
            if not it["qs"]:
                raise SystemExit(f"{it['id']}: no questions")
    for it in bank["p6"]:
        if len(it["qs"]) != 4:
            raise SystemExit(f"{it['id']}: part 6 needs 4 questions")
    return bank


toeic = parse_toeic()
import base64
_ph = {}
_pdir = ROOT / "content" / "toeic" / "photos"
if _pdir.exists():
    _cr = json.loads((_pdir / "credits.json").read_text(encoding="utf-8"))
    for _f in sorted(_pdir.glob("*.jpg")):
        _ph[_f.stem] = {"s": "data:image/jpeg;base64," + base64.b64encode(_f.read_bytes()).decode(), "c": _cr[_f.stem]["c"], "d": _cr[_f.stem]["d"]}
for _it in toeic["p1"]:
    if _it.get("ph") and _it["ph"] not in _ph:
        raise SystemExit("missing photo " + _it["ph"])
(SRC / "toeic-photos.js").write_text("const TOEIC_PHOTOS = " + json.dumps(_ph, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
(SRC / "toeic-bank.js").write_text("const TOEIC_BANK = " + json.dumps(toeic, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
print("toeic bank:", {k: len(v) for k, v in toeic.items()}, "questions:",
      sum(len(v) if k in ("p1", "p2", "p5") else sum(len(i["qs"]) for i in v) for k, v in toeic.items()))


html = f"""<!DOCTYPE html>
<html lang="fr" data-theme="clair">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="LH Cards">
<meta name="theme-color" content="#4f46e5">
<link rel="manifest" href="manifest.webmanifest">
<meta name="description" content="LH Cards : cartes mémoire avec répétition espacée, quiz, écriture et chrono.">
{read("head-icons.html").strip()}
<title>LH Cards</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&family=Lora:wght@400;600;700&family=Nunito:wght@400;600;700;800&family=Space+Grotesk:wght@400;500;700&family=Playfair+Display:wght@600;700;800&family=Patrick+Hand&family=Press+Start+2P&family=VT323&display=swap" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&family=Lora:wght@400;600;700&family=Nunito:wght@400;600;700;800&family=Space+Grotesk:wght@400;500;700&family=Playfair+Display:wght@600;700;800&family=Patrick+Hand&family=Press+Start+2P&family=VT323&display=swap"></noscript>
<script>
try {{ var t = localStorage.getItem('superanki_theme'); if (t) document.documentElement.dataset.theme = t === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'nuit' : 'clair') : t; }} catch (e) {{}}
</script>
<style>
{read("styles.css")}
</style>
</head>
<body>
{read("body.html")}
<script>
{read("seed-data.js").strip()}
{read("packs-data.js").strip()}
{read("courses-data.js").strip()}
{read("toeic-bank.js").strip()}
{read("toeic-photos.js").strip()}
</script>
<script>
{read("fsrs.js")}
{read("app.js")}
{read("stats.js")}
{read("features.js")}
{read("rich.js")}
{read("occlusion.js")}
{read("apkg.js")}
{read("fsrs-opt.js")}
{read("tools.js")}
{read("notetypes.js")}
{read("export-apkg.js")}
{read("study.js")}
{read("focus.js")}
{read("extras.js")}
{read("ambient.js")}
{read("toeic.js")}
{read("sync.js")}
{read("boot.js")}
if ("serviceWorker" in navigator && /^https?:/.test(location.protocol)) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {{}}));
</script>
</body>
</html>
"""

(ROOT / "index.html").write_text(html, encoding="utf-8")
print(f"index.html written ({len(html.encode('utf-8')) // 1024} Ko)")

import hashlib
ver = hashlib.sha1(html.encode("utf-8")).hexdigest()[:10]
(ROOT / "sw.js").write_text((ROOT / "sw.template.js").read_text(encoding="utf-8").replace("__VERSION__", ver), encoding="utf-8")
print("sw.js written, version", ver)
