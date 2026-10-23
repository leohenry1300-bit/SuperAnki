/* Léo the lion cub: a clay-style character. He is a still picture (three resting poses: with his ✓ tablet, without it, asleep) plus a library of short
   animated clips (mascot/*.webp, transparent) that play on top of it: he waves, talks, points, yawns, tosses his cap, naps...
   The app decides which clip fits the moment (see leoClipFor); the glow and shadow around him follow the app's theme colour.
   States: s1 = holding the ✓ tablet (home, summaries), s0 = hands free (empty states, comforting a bad session), sleep = dozing. */
const LEO_CACHE = new Map();
const leoMotionOff = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function leoInstall() {
    if (document.getElementById('leo-art')) return;
    const st = document.createElement('style'); st.id = 'leo-art';
    st.textContent = `:root{--leo-s1:url(${LEO_STILL.s1});--leo-s0:url(${LEO_STILL.s0});--leo-sleep:url(${LEO_STILL.sleep})}`;
    document.head.appendChild(st);
}
/* a clip is fetched once, kept in memory as a blob (the service worker also keeps it for offline use) */
function leoLoad(key) {
    if (!LEO_CACHE.has(key)) {
        LEO_CACHE.set(key, fetch(LEO_CLIPS[key].f).then(r => { if (!r.ok) throw new Error('clip'); return r.blob(); }).then(b => URL.createObjectURL(b)).catch(e => { LEO_CACHE.delete(key); throw e; }));
    }
    return LEO_CACHE.get(key);
}
function leoImg(url, cls, key) {
    const img = new Image(); img.className = cls; const r = LEO_CLIPS[key].r, c = LEO_CLIPS[key], l = c.flip ? 2 * LEO_GEO.ax - r[0] - r[2] : r[0]; img.style.cssText = `left:${l}%;top:${r[1]}%;width:${r[2]}%;height:${r[3]}%`; img.alt = ''; img.draggable = false; img.decoding = 'async'; img.src = url;
    return (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => img);
}
function leoSetState(root, st) { root.dataset.state = st; }
/* the looping "alive" clip under everything: breathing, blinking, small movements (only while he rests holding his tablet) */
function leoIdle(root) {
    if (!root || !root.isConnected || leoMotionOff() || document.hidden || root.dataset.state !== 's1') return;
    const fig = root.querySelector('.leo-fig'); if (!fig) return;
    const old = fig.querySelector('.lf-idle'); if (old) old.remove();
    const tok = root._leoTok || 0;
    leoLoad('idle').then(url => leoImg(url, 'lf-clip lf-idle', 'idle')).then(img => {
        if (!root.isConnected || (root._leoTok || 0) !== tok || root.dataset.state !== 's1' || root.classList.contains('lv-clip')) return;
        const o = fig.querySelector('.lf-idle'); if (o) o.remove();
        fig.appendChild(img); root.classList.add('lv-idle');
    }).catch(() => {});
}
function leoPlay(root, key, o = {}) {
    const c = LEO_CLIPS[key];
    if (!root || !c || !root.isConnected || leoMotionOff()) return Promise.resolve(false);
    const fig = root.querySelector('.leo-fig'); if (!fig) return Promise.resolve(false);
    if (o.soft && root._leoBusy > Date.now()) return Promise.resolve(false);   // his entrance is playing: it is not interrupted by a line
    const tok = root._leoTok = (root._leoTok || 0) + 1;
    return leoLoad(key).then(url => leoImg(url, 'lf-clip lf-play' + (c.flip ? ' flip' : ''), key)).then(img => {
        if (root._leoTok !== tok || !root.isConnected) return false;
        if (o.intro) root._leoBusy = Date.now() + c.d * 1000;
        fig.querySelectorAll('.lf-clip').forEach(x => x.remove());
        if (root.dataset.state !== c.from) leoSetState(root, c.from);
        /* he appears over his resting pose with a short cross-fade (the first frame of every clip is the rest pose), so nothing jumps */
        fig.appendChild(img); img.getBoundingClientRect(); img.classList.add('on');
        setTimeout(() => { if (root._leoTok === tok) { root.classList.remove('lv-idle'); root.classList.add('lv-clip'); } }, 140);
        return new Promise(res => setTimeout(() => {
            if (root._leoTok !== tok) return res(false);
            leoSetState(root, c.to || c.from);
            root.classList.remove('lv-clip');            // his resting pose is back underneath...
            img.classList.remove('on'); setTimeout(() => img.remove(), 220);   // ...and the clip fades out over it
            if (!o.hold) leoIdle(root);
            res(true);
        }, c.d * 1000 - 120));
    }).catch(() => {
        if (root._leoTok === tok) {   // the clip could not be loaded: go back to a clean resting pose
            fig.querySelectorAll('.lf-clip').forEach(x => x.remove()); root.classList.remove('lv-clip', 'lv-idle');
            if (o.fallback) leoSetState(root, o.fallback);
            leoIdle(root);
        }
        return false;
    });
}
/* which clip fits what he is saying: the words decide first, then the kind of moment */
function leoClipFor(root, cat = 'ready', text = '') {
    const st = root ? root.dataset.state : 's1', mood = root && root.dataset.mood || 'ready';
    const pick = a => a[Math.floor(Math.random() * a.length)];
    if (st === 'sleep') return 'yawn';
    if (st === 's0') return /idée|crée|ajoute|paquet/i.test(text) ? 'aha0' : pick(cat === 'tap' ? ['hello0'] : cat === 'exam' ? ['aha0', 'talk0'] : ['talk0', 'talk0', 'point0']);
    if (cat === 'roar') return 'roar';
    if (cat === 'tickle') return 'sitwave';
    if (/GRR|RAAW|rugi/i.test(text)) return 'roar';
    if (/plaque|✔|✓/.test(text)) return 'tablet';
    if (cat === 'night' || /bonne nuit|dormir|sommeil|dodo/i.test(text)) return 'yawn';
    if (/zzz|sieste|ronronne/i.test(text)) return 'nap';
    if (cat === 'milestone') return pick(['toss', 'roar']);
    if (cat === 'missed') return /manqu|attend|gard/i.test(text) ? 'foot' : 'wave';
    if (cat === 'exam') return pick(['think', 'talk']);
    if (/bravo|fier|félicit|🎉|🏆|👏|gagné|victoire/i.test(text)) return pick(['roar', 'wave']);
    const T = { ready: ['talk', 'talk', 'talk', 'pointwave', 'tablet'], happy: ['talk', 'talk', 'wave'], calm: ['talk', 'talk', 'tablet'], tap: ['wave', 'talk', 'sitwave'] };
    return pick(T[cat] || T[mood] || T.ready);
}
/* his voice follows what he does: a curious "rrr?" when he talks, a happy "rawrr" when he waves or hops, a soft "grrr, allez" to encourage, a purr when he thinks, a sleepy "rrooh" when he yawns, a ROAAR to celebrate */
const LEO_VOICE = {
    talk: 'leo', tablet: 'leo', pointwave: 'leohappy', wave: 'leohappy', sitwave: 'leotickle', joy: 'leohappy', hop: 'leohappy', toss: 'leocheer', roar: 'leoroar',
    foot: 'leogo', think: 'leopurr', yawn: 'leosad', nap: 'leopurr', sleep: 'leosad', reveal: 'leohappy',
    hello0: 'leohappy', talk0: 'leo', point0: 'leo', aha0: 'leohappy', read0: 'leopurr', arms0: 'leogo', shrug0: 'leogo'
};
/* wires up every Léo that has just appeared on screen: resting pose, idle loop, intro clip, now and then a little spontaneous move */
function leoBoot() {
    document.querySelectorAll('.leo3d:not([data-live])').forEach(root => {
        root.dataset.live = '1';
        const intro = root.dataset.intro, amb = (root.dataset.amb || '').split(',').filter(Boolean);
        if (leoMotionOff()) return;
        if (root.dataset.state === 's1') leoIdle(root);
        if (intro) setTimeout(() => leoPlay(root, intro, { fallback: 's1', intro: true }), 380);
        if (root.dataset.amb) leoPrefetch();
        if (amb.length) {
            const tick = () => {
                if (!root.isConnected) return;
                if (!document.hidden && !root.classList.contains('lv-clip') && root.dataset.state !== 'sleep') leoPlay(root, amb[Math.floor(Math.random() * amb.length)]);
                setTimeout(tick, 32000 + Math.random() * 28000);
            };
            setTimeout(tick, 20000 + Math.random() * 15000);
        }
    });
}
/* the clips he uses most are fetched quietly in the background so that the first tap already answers (skipped on data saver) */
let LEO_PRE = false;
function leoPrefetch() {
    if (LEO_PRE || (navigator.connection && navigator.connection.saveData)) return;
    LEO_PRE = true;
    const go = () => ['idle', 'talk', 'tablet', 'wave', 'roar'].reduce((p, k) => p.then(() => leoLoad(k)).catch(() => {}), Promise.resolve());
    (window.requestIdleCallback || (f => setTimeout(f, 2500)))(go);
}
function leoInit() {
    let q = 0;
    new MutationObserver(() => { if (q) return; q = requestAnimationFrame(() => { q = 0; leoBoot(); }); }).observe(document.body, { childList: true, subtree: true });
    document.addEventListener('visibilitychange', () => {
        document.querySelectorAll('.leo3d').forEach(r => {
            if (document.hidden) { const i = r.querySelector('.lf-idle'); if (i) i.remove(); r.classList.remove('lv-idle'); }
            else leoIdle(r);
        });
    });
    leoBoot();
}
function leoSvg(mood = 'ready', opts = {}) {
    leoInstall();
    const state = opts.intro === 'reveal' && leoMotionOff() ? 's1' : (opts.state || 's1');
    let stars = '';
    const n = mood === 'happy' ? 14 : 8;
    for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.283 + (i % 3) * .4, r = 52 + (i * 37 % 26);
        stars += `<i class="leo-star" style="--x:${(50 + Math.cos(a) * r).toFixed(1)}%;--y:${(46 + Math.sin(a) * r * .9).toFixed(1)}%;--d:${(i * .43 % 3).toFixed(2)}s;--s:${(6 + (i * 5 % 9)).toFixed(0)}px"></i>`;
    }
    const extra = state === 'sleep' ? '<span class="leo-z z1">z</span><span class="leo-z z2">Z</span>' : '';
    const at = k => opts[k] ? ` data-${k}="${opts[k]}"` : '';
    return `<div class="leo3d leo-${mood}" aria-hidden="true" data-state="${state}" data-mood="${mood}"${at('intro')}${at('amb')}${at('hold')} style="--ar:${LEO_GEO.w / LEO_GEO.h}"><span class="leo-glow"></span>${stars}<span class="leo-shadow"></span>
        <span class="leo-pose"><span class="leo-fig"><i class="lf-still"></i></span></span>${extra}</div>`;
}

/* ---------- What Léo says: a big bank of short lines (encouraging, a bit teasing, student-to-student), picked without repeats ---------- */
const LEO_SAYS = {
    ready: [
        "On y va ? Quelques cartes suffisent !", "Une petite session et c'est lancé 💪", "§Ta série de {streak} jours compte sur toi 🔥", "Je t'ai gardé tes cartes au chaud 📚",
        "5 minutes, pas plus. Promis, je chronomètre.", "Tes neurones sont chauds ? Les miens, oui !", "Allez, première carte et le reste suit.", "La flemme ? Je connais, ça passe après 3 cartes 😉",
        "Un petit effort aujourd'hui, un gros soulagement le jour J.", "Je ne te juge pas, mais mes moustaches frétillent d'impatience.", "Révise maintenant, scrolle après. Deal ? 🤝", "Tu es à une carte de réviser pour de bon.",
        "Ton futur toi te dit déjà merci 🙏", "Même une session ratée vaut mieux qu'aucune session.", "Je te promets que c'est plus rapide que de chercher ton cours.", "On fait les cartes, puis on fait une pause. Marché conclu ?",
        "Allez champion, les cartes ne se révisent pas toutes seules.", "Un lion ça rugit, un étudiant ça révise 🦁", "Respire, ouvre une carte, et c'est parti.", "Fais-moi plaisir : une seule session aujourd'hui.",
        "Je sens que ça va bien se passer aujourd'hui ✨", "Je t'attendais, tu sais.", "Ta mémoire est un muscle, on l'entraîne ?", "Tu veux de la motivation ? Tiens : je t'en donne 100 %.",
        "Les partiels ne se préparent pas en dormant (même si je comprends 😴).", "Un clic sur « Réviser » et je me tais, promis.", "Allez, on grignote quelques cartes ?", "Petit à petit, le lion fait son nid 🏆",
        "Je mise sur toi, ne me déçois pas 😏", "Tes cartes te font des yeux doux 🥺"
    ],
    happy: [
        "Bien joué, tu as déjà révisé aujourd'hui !", "§Ta série est sauvée 🔥", "Continue si tu as encore de l'énergie !", "Fier de toi ! 🦁",
        "Mission du jour : accomplie ✅", "Tu gères, franchement.", "Même ton futur toi est impressionné.", "Une session de plus et je te prête ma plaque ✓ !",
        "Là, tu peux te faire plaisir. Tu l'as mérité 🍫", "Voilà comment on prépare un partiel !", "Tes cartes te disent merci 💛", "Je te regarde réviser avec admiration.",
        "T'as vu ? C'était pas si dur.", "§Série +1, motivation +100 🚀", "On ne lâche rien, mais là tu peux souffler.", "Léger bonus : une carte de plus ?",
        "Tu mérites une pause (courte !) ☕", "La régularité, c'est ton super-pouvoir.", "Bravo ! Les autres dorment encore 😎", "Chaque carte vue, c'est un point de plus au partiel.",
        "Je rugis de joie en silence 🦁", "Tu progresses, je le vois dans tes stats 📈", "Fais-moi un check de la patte 🐾", "Journée validée, on se retrouve demain ?"
    ],
    calm: [
        "Tout est à jour, profite 😌", "Rien à réviser : repose-toi !", "Une révision libre pour s'amuser ?", "Pas une carte en retard. Tu es un monstre d'organisation.",
        "Zzz… je fais la sieste aussi 😴", "Si tu t'ennuies, crée une carte : ta mémoire adore ça.", "Journée zen : tout est sous contrôle 🧘", "Un petit quiz pour le plaisir ?",
        "Je ronronne… (oui, je suis un lion, mais en miniature) 🐱", "Ton planning est vide, ta tête aussi ? Profite !", "C'est calme. Trop calme. Une carte « bonus » ? 😏", "Pas de révision aujourd'hui, mais le mental reste actif.",
        "Dis donc, tu as tout fait ! Bravo.", "Le repos fait aussi partie de la mémorisation 😴", "Je garde l'œil ouvert (un seul) 👀", "Ajoute un paquet à la bibliothèque si tu veux du neuf 📚",
        "Tu peux dormir tranquille, tout est révisé.", "Mission : ne rien faire. Bravo, tu réussis ! 😂", "Bientôt de nouvelles cartes, on garde la forme.", "Zen mode activé 🌿"
    ],
    night: [
        "Il est tard… pense à dormir, la mémoire adore ça 🌙", "Zzz… tu devrais dormir, la mémoire adore ça 😴", "Les cartes se rangent mieux après une bonne nuit.", "Encore debout ? Je ne dis rien, mais mes yeux se ferment.",
        "Si tu révises, cinq cartes max, puis dodo, d'accord ?", "À cette heure-là, le mieux c'est le sommeil. Vraiment.", "Même les lions dorment 20 heures par jour 🦁", "Ferme l'écran, je veille sur tes cartes 🌟",
        "Une dernière carte, tout au plus, et tu files au lit ?", "Bonne nuit… et à demain pour une grosse session !", "Je lutte contre le sommeil. Toi aussi ? 😅", "Ta mémoire consolide pendant que tu dors : fais-lui confiance."
    ],
    tap: [
        "Hé, ça chatouille ! 😂", "Encore ? Je suis un lion, pas un bouton 😏", "Moustaches : ne pas toucher !",
        "OK OK, j'arrive !", "Tu cherches quoi, un câlin ? 🤗", "Je suis très occupé à être mignon.", "Continue, je vais bientôt rugir…"
    ],
    wake: ["Mmh… tu m'as réveillé ?!", "Hein ? Quoi ? Je ne dormais pas !", "*bâille* Déjà ? Bon, d'accord…", "Oh… j'ai fait un petit somme 😴"],
    roar: ["GRRRR ! 🦁 Je rugis de fierté !", "RAAAWR ! Ça fait du bien 😤", "GRRR… pardon, c'était plus fort que moi 🙈"],
    milestone: {
        3: ["3 jours de suite ! Les débuts d'une grosse habitude 🌱", "Série de 3 : tu viens de gagner ta première médaille 🥉"],
        7: ["Une semaine entière ! Tu es officiellement régulier 🔥", "7 jours sans lâcher : respect absolu 🏅"],
        14: ["Deux semaines ! Ton cerveau te dit merci 🧠", "14 jours : ça devient une vraie routine."],
        30: ["Un MOIS de révisions ! Je n'en reviens pas 🎉", "30 jours : tu es une légende de la mémoire 🏆"],
        50: ["50 jours ! Tu as dépassé tous mes espoirs 🦁", "Série de 50 : mes moustaches en tremblent d'admiration."],
        100: ["100 JOURS !!! Tu es un lion toi aussi 👑", "Cent jours de suite. Je n'ai pas de mots (ça arrive peu)."],
        200: ["200 jours : ta mémoire doit être indestructible 💎"], 365: ["UNE ANNÉE ENTIÈRE. Je pleure de fierté 🎓"]
    },
    exam: {
        0: ["C'est le grand jour : respire, tu as tout préparé 💪", "Aujourd'hui, tu fais trembler cet examen. Bonne chance ! 🍀"],
        1: ["Demain, c'est {exam} ! Une dernière révision tranquille et dodo tôt.", "J-1 pour {exam} : relis tes cartes difficiles puis repose-toi."],
        2: ["J-2 pour {exam}. Les cartes ratées d'abord, on affine !", "Plus que 2 jours avant {exam} : tu es dans la dernière ligne droite."],
        3: ["J-3 pour {exam}. C'est le moment de répéter tes cartes ratées.", "{exam} dans 3 jours : une grosse session aujourd'hui, une légère demain."],
        5: ["J-5 pour {exam}. On met les bouchées doubles 😤", "Plus que 5 jours avant {exam} : chaque carte compte."],
        7: ["{exam} dans une semaine : on s'organise ? Ton objectif par jour t'attend.", "J-7 pour {exam}. Ni panique ni flemme : un peu chaque jour 📆"],
        14: ["{exam} dans 2 semaines : tu as largement le temps si tu t'y mets.", "J-14 pour {exam} : parfait pour poser un bon rythme."]
    },
    missed: [
        "Hier, on n'a pas révisé… on reprend doucement ? Zéro pression 🐾", "Une pause ne vaut pas un abandon. On y retourne ?", "Ta série s'est arrêtée, mais ta mémoire, elle, t'attend toujours.",
        "Pas grave, tout le monde rate un jour. Même moi (j'ai dormi 20 h).", "¤Ça fait un petit moment ! Une session courte pour se remettre ? 💛", "Je ne te gronde pas. Je te fais juste les yeux doux 🥺",
        "Reprendre, c'est déjà gagner. Cinq cartes ?", "Ta série repart de zéro, mais ta mémoire, non. Allez !"
    ]
};
/* picks a line from a category without repeating the last ones (history kept on this device) */
function leoPick(cat, vars = {}) {
    const list = Array.isArray(cat) ? cat : LEO_SAYS[cat];
    if (!list || !list.length) return '';
    /* lines marked § only make sense with a running streak, lines marked ¤ after a few days away */
    const ok = l => !(l[0] === '§' && !vars.streak) && !(l[0] === '¤' && !(vars.gap >= 4));
    let hist = {}; try { hist = JSON.parse(localStorage.getItem('lh_leo_hist') || '{}'); } catch { hist = {}; }
    const key = Array.isArray(cat) ? 'x' + list.length : cat, seen = hist[key] || [];
    let pool = list.map((_, i) => i).filter(i => !seen.includes(i) && ok(list[i]));
    if (!pool.length) { pool = list.map((_, i) => i).filter(i => ok(list[i])); hist[key] = []; }
    const i = pool[Math.floor(Math.random() * pool.length)];
    hist[key] = [...(hist[key] || []), i].slice(-Math.min(list.length - 1, 14));
    try { localStorage.setItem('lh_leo_hist', JSON.stringify(hist)); } catch { /* ignore */ }
    return list[i].replace(/^[§¤]/, '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
}
LEO_SAYS.ready.push(
    "Ta pile de cartes me regarde. Elle a l'air de t'attendre 👀", "Dis-moi que tu vas réviser. Dis-le-moi.", "Un jour sans réviser, c'est deux jours de rattrapage.", "Ton cerveau en veut encore, je le sens 🧠",
    "Si tu commences maintenant, tu auras fini avant le prochain épisode.", "Ma recette : une carte, un sourire, une autre carte 😄", "Il paraît que les révisions régulières battent les nuits blanches.", "Courage : le plus dur, c'est d'ouvrir l'appli. Et tu l'as fait ✔",
    "Je parie que tu fais 10 cartes sans t'en rendre compte 🎯", "Laisse-moi t'aider à retenir ce que tu oublies.", "Le TOEIC, les partiels, la vie : tout passe par la mémoire 💡", "Tu me dois une session. Je note.",
    "Un lion ne chasse pas le ventre vide, un étudiant ne révise pas sans café ☕", "Tes cartes sont rangées, prêtes, impatientes.", "Fais-le pour toi, pas pour moi. (Mais aussi un peu pour moi.)"
);
LEO_SAYS.happy.push(
    "Voilà, c'est ça l'esprit : régulier et tranquille 😌", "Tu viens de gagner un petit bout de mémoire à long terme 🧠", "Je note : élève sérieux. Très sérieux.", "Tu as gagné le droit de regarder un épisode (un seul !) 📺",
    "Pas mal du tout ! Même les profs seraient fiers.", "Cette session, c'est du solide 🧱", "Tu vois ? Ce n'était pas si terrible 😉", "Je te donnerais bien un biscuit, mais je n'ai que des cartes 🍪",
    "Continue comme ça et ta moyenne va m'applaudir 👏", "Demain on fait pareil, mais en un peu plus ambitieux ?", "Ça se voit que tu t'es appliqué 🌟", "Les étoiles brillent un peu plus fort pour toi ✨"
);
LEO_SAYS.calm.push(
    "Aucune carte en retard. Je suis ému.", "Tu peux profiter, vraiment. Je surveille.", "Plus rien à faire ? Alors respire 🌬️", "Le vide, c'est parfois le bonheur.",
    "Si tu veux, on peut quand même s'entraîner… sans pression.", "Moment calme : parfait pour lire tes stats 📊", "Je ronronne intérieurement 😸", "Pense à ajouter une nouvelle carte quand une idée te vient 💭",
    "Ton planning est à zéro, mon cœur aussi 💛", "Quand tout est fait, c'est aussi une victoire."
);
LEO_SAYS.tap.push(
    "Attention, je mords (un peu) 😁", "Stop, je vais rire et perdre mon chapeau !", "Tu appuies, je m'excite. C'est un cercle vicieux.", "Je suis chatouilleux, tu le sais ? 😆",
    "Oui, c'est bien moi, ta mascotte préférée !", "Si tu continues, je demande une augmentation 😤"
);
LEO_SAYS.missed.push(
    "¤Hé, tu m'as manqué ces derniers jours 🥲", "On n'a pas besoin d'être parfaits, juste réguliers.", "Une carte aujourd'hui et on oublie tout le reste 🤝", "Je t'ai gardé la place au chaud. Reviens !"
);

/* a golden ribbon of sparkles that swirls around Léo (milestones), drawn then faded */
function leoTrail(host) {
    if (!host) return;
    const old = host.querySelector('.leo-trail'); if (old) old.remove();
    let dots = '';
    for (let i = 0; i < 26; i++) { const t = i / 25; dots += `<circle class="td" r="${(1.4 + (i % 3) * .9).toFixed(1)}" style="offset-path:path('M30 240 C120 290 340 250 350 150 S210 20 120 80 S130 230 250 210'); offset-distance:${(t * 100).toFixed(1)}%; animation-delay:${(t * 1.1).toFixed(2)}s" fill="#ffe9a0"/>`; }
    host.insertAdjacentHTML('beforeend', `<svg class="leo-trail" viewBox="0 0 400 300" aria-hidden="true"><defs><linearGradient id="ltg" x1="0" x2="1"><stop offset="0" stop-color="#ffd36b" stop-opacity="0"/><stop offset=".5" stop-color="#ffe9a0"/><stop offset="1" stop-color="#ffb02e"/></linearGradient></defs><path class="tp" d="M30 240 C120 290 340 250 350 150 S210 20 120 80 S130 230 250 210" fill="none" stroke="url(#ltg)" stroke-width="3.4" stroke-linecap="round" pathLength="1"/>${dots}</svg>`);
    setTimeout(() => { const e = host.querySelector('.leo-trail'); if (e) e.remove(); }, 3200);
}
