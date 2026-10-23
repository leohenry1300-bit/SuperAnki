/* Léo the lion cub: the whole character is one hand-drawn SVG (gradients, mane of tufts, expressive eyes, paws, tail, graduation cap).
   Four moods: ready (waves, holds a « ? » card), happy (jumps, « ✓ »), calm (sleeps, « zZ »), tough (frowns, « ! »). A medal appears with a streak. */
function leoSvg(mood = 'ready', opts = {}) {
    const id = 'lg' + (leoSvg.n = (leoSvg.n || 0) + 1);
    const streak = opts.streak || 0;
    /* mane: two rings of tufts (teardrops) around the head */
    const tuft = (cx, cy, r, ang, len, wid, fill) => `<path d="M0 0 C ${wid} ${-len * .35}, ${wid * .7} ${-len * .85}, 0 ${-len} C ${-wid * .7} ${-len * .85}, ${-wid} ${-len * .35}, 0 0 Z" transform="translate(${cx} ${cy}) rotate(${ang}) translate(0 ${-r})" fill="${fill}"/>`;
    let mane = '';
    for (let i = 0; i < 16; i++) { const a = i * 22.5 + 11; mane += `<g class="mc-tuft t${i % 4}">${tuft(110, 98, 44, a, 40, 15, `url(#${id}m1)`)}</g>`; }
    for (let i = 0; i < 14; i++) { const a = i * 25.7; mane += tuft(110, 98, 44, a, 30, 12, `url(#${id}m2)`); }
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
        <radialGradient id="${id}i" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#d98a2b"/><stop offset=".6" stop-color="#8a4510"/><stop offset="1" stop-color="#4a230a"/></radialGradient>
        <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#ffefc7"/></linearGradient>
        <linearGradient id="${id}t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8fa3"/><stop offset="1" stop-color="#e5486a"/></linearGradient>
        <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff176"/><stop offset="1" stop-color="#f59e0b"/></linearGradient>
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
            <g class="mc-cap"><path d="M62 52 L110 31 L158 52 L110 69 Z" fill="url(#${id}k)"/><path d="M62 52 L110 69 L158 52 L158 56.5 L110 74 L62 56.5 Z" fill="#0f1747"/><path d="M87 58 V72 Q110 85 133 72 V58 L110 66 Z" fill="#1b2670"/><path d="M110 31 L158 52 L110 42 Z" fill="#fff" opacity=".12"/><circle cx="110" cy="50" r="3.2" fill="#fbbf24"/>
              <g class="mc-tassel"><path d="M110 50 Q143 52 151 57 V78" fill="none" stroke="#f59e0b" stroke-width="2.8" stroke-linecap="round"/><path d="M146.5 76 h9 l2.4 12.5 h-13.8z" fill="url(#${id}g)"/></g></g></g>
        </g>
    </g>${sparks}${zs}</svg>`;
}
