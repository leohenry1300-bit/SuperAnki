/* Léo the lion cub: the whole character is one hand-drawn SVG (gradients, mane of tufts, expressive eyes, paws, tail, graduation cap).
   Four moods: ready (waves, holds a « ? » card), happy (jumps, « ✓ »), calm (sleeps, « zZ »), tough (frowns, « ! »). A medal appears with a streak. */
function leoSvg(mood = 'ready', opts = {}) {
    const id = 'lg' + (leoSvg.n = (leoSvg.n || 0) + 1);
    const streak = opts.streak || 0;
    /* mane: three rings of S-curved tufts of different lengths (seeded, so Léo always looks the same) with a light strand in each, plus a ruff under the chin */
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const tuft = (cx, cy, r, ang, len, wid, curl, fill, strand) => `<g transform="translate(${cx} ${cy}) rotate(${ang}) translate(0 ${-r})"><path d="M${-wid * .55} 0 C ${-wid * 1.05} ${-len * .38}, ${-wid * .4 + curl * .35} ${-len * .86}, ${curl} ${-len} C ${wid * .4 + curl * .35} ${-len * .8}, ${wid * 1.05} ${-len * .36}, ${wid * .55} 0 Z" fill="${fill}"/>${strand ? `<path d="M${curl * .15} ${-len * .1} Q${curl * .5} ${-len * .5} ${curl * .75} ${-len * .85}" fill="none" stroke="${strand}" stroke-width="1.7" stroke-linecap="round" opacity=".5"/>` : ''}</g>`;
    let mane = '';
    for (let i = 0; i < 22; i++) { const a = i * (360 / 22) + (rnd() - .5) * 6; mane += `<g class="mc-tuft t${i % 4}">${tuft(110, 98, 40, a, 40 + rnd() * 16, 14 + rnd() * 4, (rnd() - .5) * 16, `url(#${id}m1)`, '#e0782a')}</g>`; }
    for (let i = 0; i < 19; i++) { const a = i * (360 / 19) + 9 + (rnd() - .5) * 6; mane += `<g class="mc-tuft t${(i + 2) % 4}">${tuft(110, 98, 42, a, 30 + rnd() * 12, 12 + rnd() * 3, (rnd() - .5) * 12, `url(#${id}m2)`, '#ffb85a')}</g>`; }
    for (let i = 0; i < 17; i++) { const a = i * (360 / 17) + 4 + (rnd() - .5) * 5; mane += tuft(110, 98, 44, a, 20 + rnd() * 9, 10 + rnd() * 2.5, (rnd() - .5) * 8, `url(#${id}m3)`, '#ffe08a'); }
    let ruff = '';
    for (let i = 0; i < 9; i++) { const a = 118 + i * 15.5; ruff += tuft(110, 132, 6, a, 22 + rnd() * 8, 11 + rnd() * 2, (rnd() - .5) * 8, `url(#${id}${i % 2 ? 'm2' : 'm1'})`, '#ffb85a'); }
    /* outfits: cap (default), santa hat, witch hat, crown, night cap, headband, sunglasses + flower */
    const O = {
        cap: `<g class="mc-hat mc-cap"><path d="M62 52 L110 31 L158 52 L110 69 Z" fill="url(#${id}k)"/><path d="M62 52 L110 69 L158 52 L158 56.5 L110 74 L62 56.5 Z" fill="#0f1747"/><path d="M87 58 V72 Q110 85 133 72 V58 L110 66 Z" fill="#1b2670"/><path d="M110 31 L158 52 L110 42 Z" fill="#fff" opacity=".12"/><circle cx="110" cy="50" r="3.2" fill="#fbbf24"/>
              <g class="mc-tassel"><path d="M110 50 Q143 52 151 57 V78" fill="none" stroke="#f59e0b" stroke-width="2.8" stroke-linecap="round"/><path d="M146.5 76 h9 l2.4 12.5 h-13.8z" fill="url(#${id}g)"/></g></g>`,
        santa: `<g class="mc-hat"><path d="M64 62 C66 30 100 14 140 26 C158 32 170 54 164 82 C158 66 150 58 140 56 L66 66 Z" fill="url(#${id}r)"/><path d="M104 22 C120 24 136 32 148 48" fill="none" stroke="#fff" stroke-width="2" opacity=".25" stroke-linecap="round"/><rect x="58" y="54" width="108" height="19" rx="9.5" fill="#fff"/><g fill="#e8eaf2"><circle cx="72" cy="63" r="2.2"/><circle cx="96" cy="66" r="2"/><circle cx="124" cy="66" r="2.2"/><circle cx="150" cy="63" r="2"/></g><circle cx="165" cy="86" r="10" fill="#fff"/><circle cx="162" cy="83" r="3.4" fill="#e8eaf2"/></g>`,
        witch: `<g class="mc-hat"><ellipse cx="110" cy="62" rx="58" ry="11" fill="#2a1346"/><path d="M72 62 C84 46 96 28 112 4 C116 22 130 44 148 62 Z" fill="url(#${id}w)"/><path d="M76 58 Q110 70 146 58 L148 62 Q110 76 72 62 Z" fill="#f97316"/><rect x="100" y="52" width="20" height="14" rx="3" fill="none" stroke="#fbbf24" stroke-width="3"/><path d="M116 16 q8 -2 10 6" fill="none" stroke="#fff" stroke-width="2" opacity=".25" stroke-linecap="round"/><g fill="#fde047"><path d="M92 38 l1.8 4 4 .6 -3 2.8 .8 4 -3.6 -2 -3.6 2 .8 -4 -3 -2.8 4 -.6z" transform="scale(.8) translate(24 10)"/></g></g>`,
        crown: `<g class="mc-hat"><path d="M66 66 L68 30 L88 48 L110 22 L132 48 L152 30 L154 66 Q110 76 66 66 Z" fill="url(#${id}g)" stroke="#b45309" stroke-width="2.4" stroke-linejoin="round"/><path d="M66 60 Q110 70 154 60" fill="none" stroke="#b45309" stroke-width="2" opacity=".6"/><circle cx="110" cy="48" r="5.6" fill="#e11d48" stroke="#9f1239" stroke-width="1.4"/><circle cx="84" cy="56" r="3.6" fill="#2563eb"/><circle cx="136" cy="56" r="3.6" fill="#2563eb"/><circle cx="68" cy="30" r="3" fill="#fff7c2"/><circle cx="110" cy="22" r="3.2" fill="#fff7c2"/><circle cx="152" cy="30" r="3" fill="#fff7c2"/><path d="M76 44 L82 58" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".5"/></g>`,
        night: `<g class="mc-hat"><path d="M64 64 C68 38 100 24 130 32 C156 40 170 62 172 92 C160 80 150 70 138 66 L66 68 Z" fill="url(#${id}n)"/><rect x="60" y="56" width="104" height="17" rx="8.5" fill="#e0e7ff"/><circle cx="172" cy="96" r="10" fill="#e0e7ff"/><g fill="#fde047"><path d="M96 40 l2 4.6 5 .7 -3.6 3.4 .9 5 -4.3 -2.4 -4.3 2.4 .9 -5 -3.6 -3.4 5 -.7z"/><path d="M130 48 l1.4 3.2 3.4 .5 -2.5 2.3 .6 3.4 -2.9 -1.6 -2.9 1.6 .6 -3.4 -2.5 -2.3 3.4 -.5z"/></g></g>`,
        headband: `<g class="mc-hat"><path d="M58 66 Q110 52 162 66 L162 78 Q110 64 58 78 Z" fill="#fff"/><path d="M58 66 Q110 52 162 66" fill="none" stroke="#e5e7eb" stroke-width="1.6"/><circle cx="110" cy="65" r="8.5" fill="#dc2626"/><path d="M160 70 Q178 66 184 82 M160 74 Q172 82 172 98" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M160 70 Q178 66 184 82 M160 74 Q172 82 172 98" fill="none" stroke="#e5e7eb" stroke-width="1.2" stroke-linecap="round" opacity=".7"/></g>`,
        sun: `<g class="mc-hat"><rect x="64" y="52" width="40" height="22" rx="10" fill="url(#${id}s)" stroke="#111827" stroke-width="3"/><rect x="116" y="52" width="40" height="22" rx="10" fill="url(#${id}s)" stroke="#111827" stroke-width="3"/><path d="M104 60 Q110 55 116 60" fill="none" stroke="#111827" stroke-width="3.4"/><path d="M72 58 l9 -0 M124 58 l9 0" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/><g transform="translate(160 44)"><g fill="#fb7185"><circle cx="0" cy="-8" r="7"/><circle cx="8" cy="-2" r="7"/><circle cx="5" cy="7" r="7"/><circle cx="-5" cy="7" r="7"/><circle cx="-8" cy="-2" r="7"/></g><circle r="4" fill="#fde047"/></g></g>`
    };
    const hat = O[opts.outfit] || O.cap;
    /* eyes */
    const lid = (x) => `<path d="M${x - 11} 87 Q${x} 80 ${x + 11} 87" fill="none" stroke="#7a3a08" stroke-width="2.6" stroke-linecap="round"/>`;
    const openEye = (x, big = 1) => `<g class="mc-eye"><g class="mc-look">
        <ellipse cx="${x}" cy="94" rx="11.5" ry="${13 * big}" fill="#fff"/>
        <ellipse cx="${x}" cy="95" rx="8.6" ry="${10.2 * big}" fill="url(#${id}i)"/>
        <ellipse cx="${x}" cy="95.6" rx="4.6" ry="${5.6 * big}" fill="#1b1209"/>
        <circle cx="${x + 3.4}" cy="90.4" r="3.2" fill="#fff"/><circle cx="${x - 3.2}" cy="99.6" r="1.6" fill="#fff" opacity=".9"/></g>
        <path d="M${x - 12} 86 Q${x} ${86 - 9 * big} ${x + 12} 86" fill="none" stroke="#7a3a08" stroke-width="3" stroke-linecap="round" opacity=".85"/></g>`;
    const happyEye = x => `<path d="M${x - 10} 96 Q${x} 82 ${x + 10} 96" fill="none" stroke="#3b1c06" stroke-width="4.6" stroke-linecap="round"/><path d="M${x - 12} 92 l-5 -3 M${x + 12} 92 l5 -3" stroke="#3b1c06" stroke-width="2.4" stroke-linecap="round"/>`;
    const calmEye = x => `<path d="M${x - 10} 92 Q${x} 101 ${x + 10} 92" fill="none" stroke="#3b1c06" stroke-width="4" stroke-linecap="round"/><path d="M${x - 8} 97 l-2 3 M${x} 99 v3.5 M${x + 8} 97 l2 3" stroke="#3b1c06" stroke-width="2" stroke-linecap="round"/>`;
    const brow = (x, dir, a) => `<path d="M${x - 11} ${74 + a * dir} Q${x} ${70 - a} ${x + 11} ${74 - a * dir}" fill="none" stroke="#8a4510" stroke-width="4.2" stroke-linecap="round"/>`;
    const E = {
        ready: openEye(86) + openEye(134) + brow(86, 0, 1) + brow(134, 0, 3),
        happy: happyEye(86) + happyEye(134),
        calm: calmEye(86) + calmEye(134),
        tough: openEye(86, .86) + openEye(134, .86) + `<path d="M72 71 L100 79" stroke="#8a4510" stroke-width="5" stroke-linecap="round"/><path d="M148 71 L120 79" stroke="#8a4510" stroke-width="5" stroke-linecap="round"/>`
    }[mood] || '';
    const M = {
        ready: `<path d="M98 128 Q104 136 110 129 Q116 136 122 128" fill="none" stroke="#6b2a0a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`,
        happy: `<path d="M94 126 Q110 152 126 126 Q110 133 94 126 Z" fill="#5c1210" stroke="#6b2a0a" stroke-width="3" stroke-linejoin="round"/><path d="M99 136 Q110 146 121 136 Q110 128 99 136 Z" fill="url(#${id}t)"/><path d="M98 127.5 Q110 133 122 127.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>`,
        calm: `<path d="M101 129 Q110 135 119 129" fill="none" stroke="#6b2a0a" stroke-width="3.2" stroke-linecap="round"/>`,
        tough: `<path d="M100 133 Q110 126 120 133" fill="none" stroke="#6b2a0a" stroke-width="3.4" stroke-linecap="round"/>`
    }[mood] || '';
    const cardY = mood === 'happy' ? 146 : 156;
    const cy = cardY + 16;
    const sym = {
        ready: `<text x="110" y="${cy + 11}" text-anchor="middle" font-size="29" font-weight="900" fill="#6366f1" font-family="system-ui,sans-serif">?</text>`,
        happy: `<path d="M93 ${cy + 5} l12 12 22 -24" fill="none" stroke="#10b981" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
        calm: `<text x="110" y="${cy + 12}" text-anchor="middle" font-size="21" font-weight="900" fill="#94a3b8" font-family="system-ui,sans-serif">zZ</text>`,
        tough: `<text x="110" y="${cy + 11}" text-anchor="middle" font-size="29" font-weight="900" fill="#f59e0b" font-family="system-ui,sans-serif">!</text>`
    }[mood] || '';
    const medal = streak >= 3 ? `<g class="mc-medal"><path d="M96 142 L110 168 L124 142" fill="none" stroke="#e11d48" stroke-width="5"/><circle cx="110" cy="172" r="${streak >= 7 ? 12 : 9.5}" fill="url(#${id}g)" stroke="#b45309" stroke-width="2.4"/><path d="M110 164 l2.4 5 5.4 .8 -3.9 3.8 .9 5.4 -4.8 -2.6 -4.8 2.6 .9 -5.4 -3.9 -3.8 5.4 -.8z" fill="#b45309"/></g>` : '';
    const sparks = mood === 'happy' ? `<g class="mc-spark"><path d="M22 52 l3.4 8.6 8.6 3.4 -8.6 3.4 -3.4 8.6 -3.4 -8.6 -8.6 -3.4 8.6 -3.4z" fill="#fde047"/><path d="M196 36 l2.6 6.4 6.4 2.6 -6.4 2.6 -2.6 6.4 -2.6 -6.4 -6.4 -2.6 6.4 -2.6z" fill="#fde047"/><circle cx="188" cy="86" r="3.4" fill="#fff" opacity=".9"/><circle cx="30" cy="120" r="2.6" fill="#fff" opacity=".8"/></g>` : '';
    const zs = mood === 'calm' ? `<g class="mc-z"><text x="168" y="40" font-size="24" font-weight="900" fill="#fff" opacity=".95" font-family="system-ui,sans-serif">z</text><text x="186" y="22" font-size="16" font-weight="900" fill="#fff" opacity=".75" font-family="system-ui,sans-serif">z</text></g>` : '';
    const rightArm = mood === 'ready'
        ? `<g class="mc-wave"><path d="M152 158 Q176 150 182 120" fill="none" stroke="url(#${id}f)" stroke-width="22" stroke-linecap="round"/><ellipse cx="183" cy="112" rx="13" ry="14" fill="url(#${id}f)"/><ellipse cx="183" cy="114" rx="6.5" ry="7" fill="#fff0d0"/><circle cx="177.5" cy="103" r="2.6" fill="#fff0d0"/><circle cx="183.5" cy="100.5" r="2.6" fill="#fff0d0"/><circle cx="189.5" cy="103" r="2.6" fill="#fff0d0"/></g>`
        : `<path d="M154 160 Q154 190 136 ${cardY + 38}" fill="none" stroke="url(#${id}f)" stroke-width="22" stroke-linecap="round"/><ellipse cx="134" cy="${cardY + 40}" rx="12" ry="11" fill="url(#${id}f)"/><ellipse cx="134" cy="${cardY + 41}" rx="6" ry="5.4" fill="#fff0d0"/>`;
    return `<svg class="mc mc-${mood}" viewBox="0 0 220 240" aria-hidden="true"><defs>
        <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd978"/><stop offset=".55" stop-color="#fbb93a"/><stop offset="1" stop-color="#e98d17"/></linearGradient>
        <radialGradient id="${id}h" cx=".4" cy=".28" r=".85"><stop offset="0" stop-color="#ffe49a"/><stop offset=".5" stop-color="#fbbd3f"/><stop offset="1" stop-color="#e4871a"/></radialGradient>
        <linearGradient id="${id}m1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b54a0b"/><stop offset="1" stop-color="#8e3508"/></linearGradient>
        <linearGradient id="${id}m2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3741a"/><stop offset="1" stop-color="#c25a10"/></linearGradient>
        <linearGradient id="${id}m3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6a53a"/><stop offset="1" stop-color="#da7c14"/></linearGradient>
        <radialGradient id="${id}i" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#d98a2b"/><stop offset=".6" stop-color="#8a4510"/><stop offset="1" stop-color="#4a230a"/></radialGradient>
        <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#ffefc7"/></linearGradient>
        <linearGradient id="${id}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8fa3"/><stop offset="1" stop-color="#e5486a"/></linearGradient>
        <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff176"/><stop offset="1" stop-color="#f59e0b"/></linearGradient>
        <linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ef4444"/><stop offset="1" stop-color="#b91c1c"/></linearGradient>
        <linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#3b0f6e"/></linearGradient>
        <linearGradient id="${id}n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#312e81"/></linearGradient>
        <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#374151"/><stop offset="1" stop-color="#030712"/></linearGradient>
        <linearGradient id="${id}k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3a8f"/><stop offset="1" stop-color="#162058"/></linearGradient>
        <radialGradient id="${id}b" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff7a8a" stop-opacity=".7"/><stop offset="1" stop-color="#ff7a8a" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse class="mc-shadow" cx="110" cy="230" rx="72" ry="8" fill="#000" opacity=".2"/>
    <g class="mc-body">
        <g class="mc-mane">${mane}</g>
        <g class="mc-tail"><path d="M148 214 C190 214 208 186 200 158 C197 148 190 144 184 148" fill="none" stroke="#c9700f" stroke-width="13" stroke-linecap="round"/><path d="M148 214 C190 214 208 186 200 158 C197 148 190 144 184 148" fill="none" stroke="url(#${id}f)" stroke-width="9" stroke-linecap="round"/><path d="M178 146 C170 128 182 114 196 120 C204 126 202 140 192 150 Z" fill="url(#${id}m1)"/><path d="M184 142 C180 132 188 124 196 128" fill="none" stroke="#e3741a" stroke-width="3" stroke-linecap="round"/></g>
        <path d="M58 156 C52 196 66 230 110 230 C154 230 168 196 162 156 C156 130 64 130 58 156 Z" fill="url(#${id}f)"/>
        <ellipse cx="110" cy="198" rx="33" ry="30" fill="url(#${id}c)"/>
        <path d="M80 214 Q110 226 140 214" fill="none" stroke="#e0b46a" stroke-width="2" stroke-linecap="round" opacity=".5"/>
        <g><ellipse cx="82" cy="228" rx="25" ry="12" fill="url(#${id}f)"/><ellipse cx="138" cy="228" rx="25" ry="12" fill="url(#${id}f)"/>
        <path d="M70 224 v6 M80 222 v8 M90 224 v6 M126 224 v6 M136 222 v8 M146 224 v6" stroke="#c9700f" stroke-width="2.2" stroke-linecap="round" opacity=".7"/></g>
        ${medal}
        <path d="M66 160 Q66 190 84 ${cardY + 38}" fill="none" stroke="url(#${id}f)" stroke-width="22" stroke-linecap="round"/>
        <g class="mc-card"><rect x="80" y="${cardY}" width="60" height="48" rx="9" fill="url(#${id}c)" stroke="#a5b4fc" stroke-width="3" transform="rotate(-3 110 ${cardY + 21})"/><rect x="85" y="${cardY + 5}" width="50" height="6" rx="3" fill="#c7d2fe" transform="rotate(-3 110 ${cardY + 21})"/>${sym}</g>
        <ellipse cx="86" cy="${cardY + 40}" rx="12" ry="11" fill="url(#${id}f)"/><ellipse cx="86" cy="${cardY + 41}" rx="6" ry="5.4" fill="#fff0d0"/>
        ${rightArm}
        <g class="mc-head">
            <g class="mc-ruff">${ruff}</g>
            <g class="mc-ear l"><circle cx="64" cy="58" r="17" fill="#e98d17"/><circle cx="64" cy="58" r="14" fill="url(#${id}f)"/><circle cx="64.5" cy="60" r="8" fill="#f7a3b4"/></g>
            <g class="mc-ear r"><circle cx="156" cy="58" r="17" fill="#e98d17"/><circle cx="156" cy="58" r="14" fill="url(#${id}f)"/><circle cx="155.5" cy="60" r="8" fill="#f7a3b4"/></g>
            <ellipse cx="110" cy="98" rx="55" ry="49" fill="url(#${id}h)"/>
            <path d="M58 112 Q48 118 52 128 Q60 124 62 118Z M162 112 Q172 118 168 128 Q160 124 158 118Z" fill="#f5a42a"/>
            <ellipse cx="86" cy="64" rx="22" ry="9" fill="#fff" opacity=".18" transform="rotate(-18 86 64)"/>
            <ellipse cx="110" cy="122" rx="32" ry="24" fill="url(#${id}c)"/>
            <ellipse cx="82" cy="116" rx="12" ry="9" fill="url(#${id}b)"/><ellipse cx="138" cy="116" rx="12" ry="9" fill="url(#${id}b)"/>
            <g fill="#e6b676" opacity=".7"><circle cx="97" cy="121" r="1.4"/><circle cx="92" cy="125" r="1.4"/><circle cx="97" cy="128" r="1.4"/><circle cx="123" cy="121" r="1.4"/><circle cx="128" cy="125" r="1.4"/><circle cx="123" cy="128" r="1.4"/></g>
            <path d="M99 107 Q110 100 121 107 Q119 118 110 121 Q101 118 99 107 Z" fill="#a8364b"/><ellipse cx="106" cy="107" rx="5" ry="2.6" fill="#fff" opacity=".55" transform="rotate(-12 106 107)"/>
            <path d="M110 121 V127" stroke="#6b2a0a" stroke-width="2.6" stroke-linecap="round"/>
            ${E}${M}
            <path d="M60 118 q-16 -3 -30 3 M60 124 q-16 2 -28 10 M160 118 q16 -3 30 3 M160 124 q16 2 28 10" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".75"/>
            <path d="M100 52 Q104 40 110 50 Q114 38 120 52 Q112 56 100 52Z" fill="#e98d17"/>
            ${hat}
        </g>
    </g>${sparks}${zs}</svg>`;
}

/* ---------- What Léo says: a big bank of short lines (encouraging, a bit teasing, student-to-student), picked without repeats ---------- */
const LEO_SAYS = {
    ready: [
        "On y va ? Quelques cartes suffisent !", "Une petite session et c'est lancé 💪", "Ta série compte sur toi 🔥", "Je t'ai gardé tes cartes au chaud 📚",
        "5 minutes, pas plus. Promis, je chronomètre.", "Tes neurones sont chauds ? Les miens, oui !", "Allez, première carte et le reste suit.", "La flemme ? Je connais, ça passe après 3 cartes 😉",
        "Un petit effort aujourd'hui, un gros soulagement le jour J.", "Je ne te juge pas, mais mes moustaches frétillent d'impatience.", "Révise maintenant, scrolle après. Deal ? 🤝", "Tu es à une carte d'être en train de réviser.",
        "Ton futur toi te dit déjà merci 🙏", "Même une session ratée vaut mieux qu'aucune session.", "Je te promets que c'est plus rapide que de chercher ton cours.", "On fait les cartes, puis on fait une pause. Marché conclu ?",
        "Allez champion, les cartes ne se révisent pas toutes seules.", "Un lion ça rugit, un étudiant ça révise 🦁", "Respire, ouvre une carte, et c'est parti.", "Fais-moi plaisir : une seule session aujourd'hui.",
        "Je sens que ça va bien se passer aujourd'hui ✨", "Je t'attendais, tu sais.", "Ta mémoire est un muscle, on l'entraîne ?", "Tu veux de la motivation ? Tiens : je t'en donne 100 %.",
        "Les partiels ne se préparent pas en dormant (même si je comprends 😴).", "Un clic sur « Réviser » et je me tais, promis.", "Allez, on grignote quelques cartes avant le déjeuner.", "Petit à petit, le lion fait son nid 🏆",
        "Je mise sur toi, ne me déçois pas 😏", "Tes cartes te font des yeux doux 🥺"
    ],
    happy: [
        "Bien joué, tu as déjà révisé aujourd'hui !", "Ta série est sauvée 🔥", "Continue si tu as encore de l'énergie !", "Fier de toi ! 🦁",
        "Mission du jour : accomplie ✅", "Tu gères, franchement.", "Même ton futur toi est impressionné.", "Une session de plus et je te donne une médaille. (Bon, j'en ai déjà une.)",
        "Là, tu peux te faire plaisir. Tu l'as mérité 🍫", "Voilà comment on prépare un partiel !", "Tes cartes te disent merci 💛", "Je te regarde réviser avec admiration.",
        "T'as vu ? C'était pas si dur.", "Série +1, motivation +100 🚀", "On ne lâche rien, mais là tu peux souffler.", "Léger bonus : une carte de plus ?",
        "Tu mérites une pause (courte !) ☕", "La régularité, c'est ton super-pouvoir.", "Bravo ! Les autres dorment encore 😎", "Chaque carte vue, c'est un point de plus au partiel.",
        "Je rugis de joie en silence 🦁", "Tu progresses, je le vois dans tes stats 📈", "Fais-moi un check de la patte 🐾", "Journée validée, on se retrouve demain ?"
    ],
    calm: [
        "Tout est à jour, profite 😌", "Rien à réviser : repose-toi !", "Une révision libre pour s'amuser ?", "Pas une carte en retard. Tu es un monstre d'organisation.",
        "Zzz… je fais la sieste aussi 😴", "Si tu t'ennuies, crée une carte : ta mémoire adore ça.", "Journée zen : tout est sous contrôle 🧘", "Un petit quiz pour le plaisir ?",
        "Je ronronne… (oui, c'est un lion, je rugis en miniature) 🐱", "Ton planning est vide, ta tête aussi ? Profite !", "C'est calme. Trop calme. Une carte « bonus » ? 😏", "Pas de révision aujourd'hui, mais le mental reste actif.",
        "Dis donc, tu as tout fait ! Bravo.", "Le repos fait aussi partie de la mémorisation 😴", "Je garde l'œil ouvert (un seul) 👀", "Ajoute un paquet à la bibliothèque si tu veux du neuf 📚",
        "Tu peux dormir tranquille, tout est révisé.", "Mission : ne rien faire. Bravo, tu réussis ! 😂", "Bientôt de nouvelles cartes, on garde la forme.", "Zen mode activé 🌿"
    ],
    night: [
        "Il est tard… une petite révision et au lit 🌙", "Zzz… tu devrais dormir, la mémoire adore ça 😴", "Les cartes se rangent mieux après une bonne nuit.", "Encore debout ? Je ne dis rien, mais mes yeux se ferment.",
        "Cinq cartes max, puis dodo, d'accord ?", "À cette heure-là, le mieux c'est le sommeil. Vraiment.", "Même les lions dorment 20 heures par jour 🦁", "Ferme l'écran, je veille sur tes cartes 🌟",
        "Une dernière carte et tu files au lit ?", "Bonne nuit… et à demain pour une grosse session !", "Je lutte contre le sommeil. Toi aussi ? 😅", "Ta mémoire consolide pendant que tu dors : fais-lui confiance."
    ],
    tap: [
        "Hé, ça chatouille ! 😂", "Tu m'as réveillé ?!", "Encore ? Je suis un lion, pas un bouton 😏", "Moustaches : ne pas toucher !",
        "OK OK, j'arrive !", "Tu cherches quoi, un câlin ? 🤗", "Je suis très occupé à être mignon.", "Continue, je vais bientôt rugir…"
    ],
    roar: ["GRRRR ! 🦁 Je rugis de fierté !", "RAAAWR ! Ça fait du bien 😤", "GRRR… pardon, c'était plus fort que moi 🙈"],
    milestone: {
        3: ["3 jours de suite ! Les débuts d'une grosse habitude 🌱", "Série de 3 : tu viens de me gagner une médaille 🥉"],
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
        "Hier c'était calme… on reprend doucement ? Zéro pression 🐾", "Une pause ne vaut pas un abandon. On y retourne ?", "Ta série a pris une pause : ta mémoire, elle, t'attend toujours.",
        "Pas grave, tout le monde rate un jour. Même moi (j'ai dormi 20 h).", "Ça fait un petit moment ! Une session courte pour se remettre ? 💛", "Je ne te gronde pas. Je te fais juste les yeux doux 🥺",
        "Reprendre, c'est déjà gagner. Cinq cartes ?", "Ta série repart de zéro, mais ta mémoire, non. Allez !"
    ]
};
/* picks a line from a category without repeating the last ones (history kept on this device) */
function leoPick(cat, vars = {}) {
    const list = Array.isArray(cat) ? cat : LEO_SAYS[cat];
    if (!list || !list.length) return '';
    let hist = {}; try { hist = JSON.parse(localStorage.getItem('lh_leo_hist') || '{}'); } catch { hist = {}; }
    const key = Array.isArray(cat) ? 'x' + list.length : cat, seen = hist[key] || [];
    let pool = list.map((_, i) => i).filter(i => !seen.includes(i));
    if (!pool.length) { pool = list.map((_, i) => i); hist[key] = []; }
    const i = pool[Math.floor(Math.random() * pool.length)];
    hist[key] = [...(hist[key] || []), i].slice(-Math.min(list.length - 1, 14));
    try { localStorage.setItem('lh_leo_hist', JSON.stringify(hist)); } catch { /* ignore */ }
    return list[i].replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
}
LEO_SAYS.ready.push(
    "Ta pile de cartes me regarde. Elle a l'air de t'attendre 👀", "Dis-moi que tu vas réviser. Dis-le-moi.", "Un jour sans réviser, c'est deux jours de rattrapage.", "Ton cerveau en veut encore, je le sens 🧠",
    "Si tu commences maintenant, tu finis avant le prochain épisode.", "Ma recette : une carte, un sourire, une autre carte 😄", "Il paraît que les révisions régulières battent les nuits blanches.", "Courage : le plus dur, c'est d'ouvrir l'appli. Et tu l'as fait ✔",
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
    "Attention, je mords (un peu) 😁", "Stop, je vais rire et tomber de ma toque !", "Tu appuies, je m'excite. C'est un cercle vicieux.", "Je suis chatouilleux, tu le sais ? 😆",
    "Oui, c'est bien moi, ta mascotte préférée !", "Si tu continues, je demande une augmentation 😤"
);
LEO_SAYS.missed.push(
    "Hé, tu m'as manqué ces derniers jours 🥲", "On n'a pas besoin d'être parfaits, juste réguliers.", "Une carte aujourd'hui et on oublie tout le reste 🤝", "Je t'ai gardé la place au chaud. Reviens !"
);
