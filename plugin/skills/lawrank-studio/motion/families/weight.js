/* WEIGHT — "we've got it from here". A car is hit; the road ties itself in a knot; three of life's problems drop onto a
   pile that wobbles more with each one; the firm's mark slides underneath, takes the weight, swallows the pile and
   swells into the accent background; one white icon changes shape for each thing the firm does (phone answered ->
   magnifier over the evidence -> scale that tips your way); a paper circle opens onto the road home; the road curls into
   the mark and the end card settles on paper.
   Best for: why the firm does what it does, what happens after a crash, common mistakes, "you focus on healing".
   Storyboard lines: hook (names the firm, mentions the crash), pile (3 sentences, one per item), turn, a1, a2, a3 (the three
   actions: calls, investigation, compensation), life, cta (3 sentences: firm name; campaign line; offer).
   screen: { head ("…**complicated**…"), knotWord?, items: [label x3: bottom, middle (a phone), top (bills)], turn,
             actions: [3 short lines], life, end, cta, site?, disclaimer? } */
FAMILIES.weight = {
  id: 'weight', label: 'We’ve got it from here (the weight)',
  lines: () => ['hook', 'pile', 'turn', 'a1', 'a2', 'a3', 'life', 'cta'],
  ICON: {   // Material Icons (Apache-2.0): phone and search in their 24-unit box; the scale post is drawn in the same box
    call: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
    search: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    post: 'M11.2 6.4h1.6v12.4h4.6c.6 0 1 .4 1 1v.6c0 .6-.4 1-1 1H6.6c-.6 0-1-.4-1-1v-.6c0-.6.4-1 1-1h4.6z',
  },
  ROAD: 'M-40,1240 C300,1240 700,1240 1120,1240', DENT: 'M-40,1240 C260,1240 560,1236 640,1262 C700,1282 760,1236 1120,1240',
  KNOT: 'M120,1240 C300,1240 380,1100 520,1020 C700,920 760,1120 600,1160 C430,1200 420,960 560,900 C700,840 820,980 700,1060 C600,1130 470,1050 520,980 C560,930 640,960 620,1010 C600,1060 980,1240 960,1240',
  ROAD2: 'M-40,1300 C300,1300 700,1300 1120,1300',
  cues(h, S) {
    const pl = h.L.pile.sentences, cta = h.L.cta.sentences, a3w = h.L.a3.words;
    const c = { crash: h.W('hook', 'crash') + .05, knot: h.W('hook', S.screen.knotWord || 'complicated') - .05, turn: h.L.turn.t - .1,
      calls: h.L.a1.t - .15, evid: h.L.a2.t - .15, owed: h.L.a3.t - .15, tip: a3w[a3w.length - 1].t - .15, life: h.L.life.t - .2, cta: h.L.cta.t - .15 };
    c.drops = [0, 1, 2].map(i => (pl[i] || pl[pl.length - 1]).t - .05 + (pl[i] ? 0 : i));
    c.swell = c.turn + 1.25; c.gotit = (cta[1] || cta[0]).t - .05; c.free = cta.length > 2 ? cta[2].t - .05 : c.gotit + 1.2; c.end = h.L.cta.end + 2.8; return c;
  },
  sfx: c => [{ kind: 'impact', at: c.crash }, { kind: 'soft', at: c.knot }, ...c.drops.map(t => ({ kind: 'thud', at: t + .42 })), ...[0, 1, 2, 3].map(k => ({ kind: 'buzz', at: c.drops[1] + .55 + k * .55 })),
    ...[0, 1, 2].map(k => ({ kind: 'pop', at: c.turn + .55 + k * .12 })), { kind: 'whoosh', at: c.swell }, { kind: 'buzz', at: c.calls + .3 }, { kind: 'buzz', at: c.calls + .75 },
    { kind: 'soft', at: c.evid }, { kind: 'soft', at: c.owed }, { kind: 'clink', at: c.tip + .35 }, { kind: 'whoosh', at: c.life }, { kind: 'whoosh', at: c.cta }],
  poster: T => T.cues.drops[2] + .9,
  html(T, S) {
    const sc = S.screen, I = this.ICON, gray = '#9AA6AE', line = BT.line, fg = BT.onAccent;
    const car = `<g id="car"><path fill="${BT.ink}" d="M20,100 C20,80 30,72 50,70 L90,66 C105,40 130,30 165,30 L200,30 C225,30 245,45 258,66 L280,70 C292,72 300,82 300,95 L300,104 C300,110 296,114 290,114 L30,114 C24,114 20,110 20,104 Z"/>
      <path fill="#E9EEF1" d="M112,64 C121,47 138,40 160,40 L174,40 L174,64 Z"/><path fill="#E9EEF1" d="M184,40 L198,40 C214,40 228,50 238,64 L184,64 Z"/><rect x="286" y="84" width="12" height="10" rx="3" fill="${BT.bright}"/>
      ${[80, 240].map((x, i) => `<g id="wh${i}"><circle cx="${x}" cy="114" r="23" fill="#2A2D31"/><circle cx="${x}" cy="114" r="9" fill="${gray}"/><rect x="${x - 2}" y="95" width="4" height="10" fill="${gray}"/></g>`).join('')}</g>`;
    const env = (x, y, rot, stamp) => `<g transform="rotate(${rot} ${x + 160} ${y + 95})"><rect x="${x}" y="${y}" width="320" height="190" rx="12" fill="#fff" stroke="${line}" stroke-width="5"/>
      <path d="M${x + 10},${y + 12} L${x + 160},${y + 108} L${x + 310},${y + 12}" fill="none" stroke="#C3CAD0" stroke-width="5" stroke-linejoin="round"/>
      ${stamp ? `<circle cx="${x + 262}" cy="${y + 140}" r="30" fill="${BT.accent}"/><text x="${x + 262}" y="${y + 152}" text-anchor="middle" font-family="${BT.head}" font-weight="800" font-size="34" fill="${BT.onAccent}">$</text>` : ''}</g>`;
    const lab = (i, style) => `<div id="lb${i}" class="m-lab h" data-qa="text" style="${style};color:${BT.ink}">${esc(sc.items[i]).replace(' ', '<br>')}</div>`;
    return `<div id="bgc" class="bgc" style="background:${BT.warm}"></div><div class="grain"></div>
  <svg class="svgL" viewBox="0 0 1080 1920">
    <path id="hill2" fill="${mix(BT.warm, '#C9B595', .3)}" d="M-40,1360 C260,1290 520,1390 1120,1320 V1960 H-40 Z" opacity="0"/>
    <circle id="sun" cx="800" cy="640" r="96" fill="${BT.bright}" opacity="0"/>
    <path id="hill1" fill="${mix(BT.warm, '#B9A182', .4)}" d="M-40,1440 C340,1360 700,1500 1120,1420 V1960 H-40 Z" opacity="0"/>
    <path id="road" fill="none" stroke="${BT.ink}" stroke-width="10" stroke-linecap="round" d="${this.ROAD}"/>
    <g id="burst" stroke="${BT.accent}" stroke-width="9" stroke-linecap="round">${[[-50, -40], [-10, -62], [36, -50], [56, -6], [40, 34]].map(([dx, dy]) => `<path d="M${700 + dx * .45},${1150 + dy * .45} L${700 + dx},${1150 + dy}"/>`).join('')}</g>
    <g transform="translate(0,1063) scale(1.3)">${car}</g>
    <ellipse id="shadow" cx="540" cy="1412" rx="250" ry="20" fill="${BT.ink}" fill-opacity=".13" opacity="0"/>
    <path id="hex" fill="${BT.accent}" d="${markPath(540, 1585, 175)}" opacity="0"/>
    <g id="stack">
      <g id="it1"><g transform="rotate(-3 540 1255)"><rect x="330" y="1110" width="420" height="290" rx="22" fill="${BT.ink}"/><rect x="350" y="1134" width="380" height="250" rx="10" fill="#fff"/>
        <rect x="480" y="1092" width="120" height="40" rx="12" fill="${gray}"/><rect x="398" y="1176" width="44" height="14" rx="4" fill="${BT.accent}"/><rect x="413" y="1161" width="14" height="44" rx="4" fill="${BT.accent}"/>
        ${[1176, 1226, 1276].map(y => `<rect x="470" y="${y}" width="${y === 1276 ? 150 : 220}" height="13" rx="6" fill="${line}"/>`).join('')}<rect x="380" y="1326" width="310" height="13" rx="6" fill="${line}"/></g></g>
      <g id="it2"><g transform="rotate(6 550 1010)"><rect x="370" y="920" width="360" height="180" rx="36" fill="${BT.ink}"/><rect x="388" y="936" width="324" height="148" rx="24" fill="#2A2D31"/>
        <text x="550" y="992" text-anchor="middle" font-family="${BT.head}" font-weight="700" font-size="30" fill="#fff">${esc(sc.caller || 'Insurance Co.')}</text>
        <text x="550" y="1026" text-anchor="middle" font-family="${BT.body}" font-size="22" fill="#C9D0D5">Incoming call…</text>
        <circle cx="480" cy="1058" r="14" fill="#E5484D"/><circle cx="620" cy="1058" r="14" fill="#2FD27A"/></g>
        <g id="arcs" fill="none" stroke="${BT.accent}" stroke-width="8" stroke-linecap="round"><path d="M352,930 C334,950 334,980 348,1000"/><path d="M326,912 C300,945 300,990 322,1018"/><path d="M752,960 C770,980 770,1010 756,1030"/><path d="M778,942 C804,975 804,1020 782,1048"/></g></g>
      <g id="it3">${env(380, 735, -8)}${env(392, 712, -2)}${env(372, 688, 5, true)}</g>
    </g>
    <g id="leads" fill="none" stroke="${BT.ink}" stroke-width="4" stroke-linecap="round"><path id="ld1" d="M300,1290 L344,1284"/><path id="ld2" d="M790,1004 L742,1010"/><path id="ld3" d="M300,786 L372,800"/></g>
    <circle id="flipC" cx="540" cy="900" r="0" fill="${BT.warm}"/>
    <g transform="translate(324,616) scale(18)"><g id="icon">
      <path id="ic" fill="${fg}" stroke="${fg}" stroke-width=".35" stroke-linejoin="round" d="${I.call}" opacity="0"/>
      <g id="rings" fill="none" stroke="${fg}" stroke-width=".9" stroke-linecap="round" opacity="0"><path d="M15,3.2 A6,6 0 0 1 20.8,9"/><path d="M15,0.4 A8.8,8.8 0 0 1 23.6,9"/></g>
      <g id="beam" fill="none" stroke="${fg}" stroke-width="1.1" stroke-linecap="round"><path id="bm" d="M3.5,6 H20.5"/><circle id="pv" cx="12" cy="6" r="1.5" fill="${fg}" stroke="none" opacity="0"/></g>
      ${[['pL', 4], ['pR', 20]].map(([id, x]) => `<g id="${id}" fill="none" stroke="${fg}" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round"><path d="M${x},6 L${x - 2.6},12.6 M${x},6 L${x + 2.6},12.6"/><path d="M${x - 3.6},12.6 Q${x},16.4 ${x + 3.6},12.6 Z" fill="${fg}"/></g>`).join('')}
      <g id="coin" opacity="0"><circle cx="20" cy="10.6" r="1.7" fill="#fff"/><text x="20" y="11.55" text-anchor="middle" font-family="${BT.head}" font-weight="800" font-size="2.6" fill="${readable(BT.accent, '#FFFFFF', 4.5)}">$</text></g>
    </g></g>
    <g id="evid" fill="none" stroke="${fg}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
      <g id="ev0"><rect x="250" y="1050" width="120" height="86" rx="16"/><circle cx="310" cy="1093" r="24"/><path d="M282,1050 l10,-16 h36 l10,16"/></g>
      <g id="ev1"><path d="M486,1140 C500,1110 470,1080 488,1046" stroke-dasharray="14 12"/><path d="M546,1140 C560,1110 530,1080 548,1046" stroke-dasharray="14 12"/><path d="M462,1150 h110"/></g>
      <g id="ev2"><path d="M720,1036 h68 l26,26 v80 h-94 z"/><path d="M738,1084 h58 M738,1108 h58"/></g></g>
    <path id="chk" fill="none" stroke="${BT.onAccent}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" d="M488,524 L526,562 L596,486"/>
  </svg>
  <img id="bug" class="m-bug h" src="${BT.logoDark}" alt="${esc(BT.name)}">
  <div id="h1" class="m-hl" data-qa="text" style="top:290px;font-size:84px;color:${BT.ink}">${accentize(sc.head)}</div>
  ${lab(0, 'right:790px;top:1240px;text-align:right')}${lab(1, 'left:800px;top:975px')}${lab(2, 'right:790px;top:756px;text-align:right')}
  <div id="h2" class="m-hl" data-qa="text" style="top:290px;font-size:84px;color:${BT.ink}">${accentize(sc.turn)}</div>
  ${sc.actions.map((a, i) => `<div id="t${i + 1}" class="m-hl" data-qa="text" style="top:1250px;color:${fg}">${accentize(a, 'oe')}</div>`).join('')}
  <div id="h3" class="m-hl" data-qa="text" style="top:290px;font-size:84px;color:${BT.ink}">${accentize(sc.life)}</div>
  ${endCard(sc, { top: 700, bg: BT.warm })}`;
  },
  build(tl, T, $, S) {
    const Q = T.cues, { W } = MK.T(T), I = this.ICON, [d1, d2, d3] = Q.drops;
    tl.set(['#burst path', '#leads path', '#chk'], { drawSVG: '0%' }, 0).set('#road', { drawSVG: '0%' }, 0);
    tl.set(['#it1', '#it2', '#it3', '#evid g', '#pL', '#pR', '#bm'], { autoAlpha: 0 }, 0).set('#bm', { drawSVG: '50% 50%' }, 0);
    tl.set('#car', { x: -420 }, 0);
    tl.to('.grain', { backgroundPosition: '0 -400px', duration: T.end, ease: 'none' }, 0);
    const spin = (t, d, turns) => tl.to(['#wh0', '#wh1'], { rotation: 360 * turns, transformOrigin: '50% 50%', duration: d, ease: 'none' }, t);
    // 1 · the drive, the hit, the knot
    tl.to('#road', { drawSVG: '100%', duration: .8, ease: 'power2.out' }, .02);
    const dv = Math.max(.85, Q.crash - .1);
    tl.to('#car', { x: 300, duration: dv, ease: dv > 1.2 ? 'none' : 'power2.out' }, .05); spin(.05, dv, 2.2 * dv / .85);
    tl.to('#car', { y: -3, duration: .12, yoyo: true, repeat: Math.round(dv / .12) | 1, ease: 'sine.inOut' }, .05);
    M.enter(tl, '#bug', .25, { y: -16, d: .4 }); M.exit(tl, '#bug', d1 - .25);
    MK.head(tl, '#h1', Math.max(.3, W('hook', 'after') - .1), d1 - .25, .08);
    tl.to('#car', { keyframes: [{ x: 278, rotation: -5, transformOrigin: '50% 100%', duration: .08, ease: 'power3.out' }, { x: 292, rotation: 2, duration: .14, ease: 'power2.inOut' }, { x: 288, rotation: 0, duration: .25, ease: 'elastic.out(1,.5)' }] }, Q.crash);
    tl.to('#road', { morphSVG: this.DENT, duration: .18, ease: 'power3.out' }, Q.crash);
    tl.to('#burst path', { drawSVG: '0% 100%', duration: .16, ease: 'power2.out', stagger: .02 }, Q.crash).to('#burst path', { drawSVG: '100% 100%', duration: .3, ease: 'power2.in', stagger: .02 }, Q.crash + .22);
    tl.set('#burst', { opacity: 0 }, Q.crash + .62);
    tl.to('#car', { x: -480, rotation: -8, duration: .55, ease: 'power3.in' }, Q.knot - .1); spin(Q.knot - .1, .55, -1.5);
    tl.to('#road', { morphSVG: this.KNOT, stroke: BT.accent, strokeWidth: 12, duration: .75, ease: 'lr.move' }, Q.knot);
    tl.to('#road', { rotation: 6, transformOrigin: '50% 50%', duration: .9, ease: 'sine.inOut', yoyo: true, repeat: 1 }, Q.knot + .6);
    tl.to('#road', { drawSVG: '50% 50%', duration: .35, ease: 'power2.in' }, d1 - .35); tl.set('#road', { opacity: 0 }, d1 + .01);
    // 2 · life piles up: each thing drops with weight and squashes; the wobble grows with the load
    M.fadeIn(tl, '#shadow', d1 - .1, .3);
    const drop = (id, t, cy, lb, ld) => {
      tl.set(id, { autoAlpha: 1 }, t); tl.fromTo(id, { y: -1250 }, { y: 0, duration: .42, ease: 'power3.in' }, t);
      tl.to(id, { keyframes: [{ scaleY: .9, scaleX: 1.05, duration: .07, ease: 'power2.out' }, { scaleY: 1, scaleX: 1, duration: .45, ease: 'elastic.out(1.1,.35)' }], svgOrigin: `540 ${cy}` }, t + .42);
      tl.to('#shadow', { keyframes: [{ scaleX: 1.08, duration: .07 }, { scaleX: 1, duration: .4, ease: 'elastic.out(1,.4)' }], svgOrigin: '540 1412' }, t + .42);
      tl.to(ld, { drawSVG: '100%', duration: .25, ease: 'power2.out' }, t + .5); M.enter(tl, lb, t + .55, { y: 14, d: .3 });
    };
    drop('#it1', d1, 1400, '#lb0', '#ld1'); drop('#it2', d2, 1100, '#lb1', '#ld2');
    tl.to('#arcs', { keyframes: [{ opacity: 1, duration: .05 }, { opacity: .2, duration: .22 }, { opacity: 1, duration: .05 }, { opacity: .2, duration: .22 }], repeat: 3 }, d2 + .5);
    tl.to('#it2', { keyframes: [{ x: -4, duration: .04 }, { x: 4, duration: .04 }, { x: -3, duration: .04 }, { x: 0, duration: .04 }], repeat: 6, repeatDelay: .28 }, d2 + .55);
    drop('#it3', d3, 900, '#lb2', '#ld3');
    tl.to('#stack', { keyframes: [{ rotation: -1.2, duration: .5 }, { rotation: 1.2, duration: .6 }, { rotation: -.6, duration: .5 }], ease: 'sine.inOut', svgOrigin: '540 1405' }, d2 + .5);
    tl.to('#stack', { keyframes: [{ rotation: 2.6, duration: .45 }, { rotation: -2.2, duration: .5 }, { rotation: 1.4, duration: .45 }], ease: 'sine.inOut', svgOrigin: '540 1405' }, d3 + .5);
    tl.to('#bgc', { backgroundColor: mix(BT.warm, BT.ink, .06), duration: Q.turn - d1, ease: 'none' }, d1);
    // 3 · the mark slides underneath, steadies the pile and takes everything, then swells into the accent
    MK.head(tl, '#h2', Q.turn + .05, Q.swell - .05);
    M.fadeOut(tl, ['#lb0', '#lb1', '#lb2'], Q.turn - .1, .2); tl.to('#leads path', { drawSVG: '0%', duration: .2 }, Q.turn - .1); tl.set('#leads', { opacity: 0 }, Q.turn + .12);
    tl.fromTo('#hex', { opacity: 1, y: 520 }, { opacity: 1, y: 0, duration: .5, ease: 'back.out(1.2)' }, Q.turn);
    tl.to('#stack', { rotation: 0, y: -14, duration: .35, ease: 'power2.out', svgOrigin: '540 1405' }, Q.turn + .32); M.fadeOut(tl, '#shadow', Q.turn + .3, .2);
    [['#it3', 540, 830], ['#it2', 550, 1010], ['#it1', 540, 1255]].forEach(([id, cx, cy], i) => {
      const t = Q.turn + .55 + i * .12;
      tl.to(id, { x: 540 - cx, y: 1585 - cy + 14, scale: .08, svgOrigin: `${cx} ${cy}`, duration: .36, ease: 'power3.in' }, t); tl.set(id, { autoAlpha: 0 }, t + .36);
      tl.to('#hex', { keyframes: [{ scale: 1.07, duration: .06 }, { scale: 1, duration: .3, ease: 'elastic.out(1,.45)' }], svgOrigin: '540 1585' }, t + .34);
    });
    tl.to('#hex', { morphSVG: markPath(540, 960, 1500), duration: .55, ease: 'power3.in' }, Q.swell);
    tl.set('#bgc', { backgroundColor: BT.accent }, Q.swell + .55).set('#hex', { opacity: 0 }, Q.swell + .56).set('.grain', { className: 'grain lt' }, Q.swell + .55);
    // 4 · one icon that keeps changing shape
    const tc = Q.calls;
    tl.set('#ic', { opacity: 1, fillOpacity: 0, drawSVG: '0%' }, tc);
    tl.to('#ic', { drawSVG: '100%', duration: .45, ease: 'power2.inOut' }, tc).to('#ic', { fillOpacity: 1, duration: .25 }, tc + .35);
    tl.fromTo('#icon', { scale: .85 }, { scale: 1, duration: .6, ease: 'back.out(1.6)', svgOrigin: '12 12' }, tc);
    tl.to('#rings', { keyframes: [{ opacity: 1, duration: .05 }, { opacity: .15, duration: .2 }, { opacity: 1, duration: .05 }, { opacity: .15, duration: .2 }, { opacity: 1, duration: .05 }, { opacity: 0, duration: .2 }] }, tc + .4);
    tl.to('#ic', { keyframes: [{ rotation: -8, duration: .05 }, { rotation: 8, duration: .05 }, { rotation: -6, duration: .05 }, { rotation: 0, duration: .05 }], repeat: 2, svgOrigin: '12 12' }, tc + .4);
    MK.head(tl, '#t1', tc + .25, Q.evid);
    tl.to('#ic', { rotation: -22, y: -.8, svgOrigin: '12 12', duration: .35, ease: 'back.out(2)' }, tc + 1.25);
    const te = Q.evid;
    tl.to('#ic', { morphSVG: I.search, rotation: 0, y: 0, duration: .5, ease: 'lr.move' }, te);
    tl.to('#icon', { x: -8.5, duration: .4, ease: 'lr.move' }, te + .3).to('#icon', { x: 8.5, duration: 1.0, ease: 'sine.inOut' }, te + .7).to('#icon', { x: 0, duration: .4, ease: 'lr.move' }, Q.owed);
    ['#ev0', '#ev1', '#ev2'].forEach((id, i) => tl.fromTo(id, { autoAlpha: 0, scale: .5, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: .35, ease: 'back.out(2)' }, te + .55 + i * .3));
    MK.head(tl, '#t2', te + .36, Q.owed);
    const to = Q.owed;
    tl.to('#evid g', { autoAlpha: 0, scale: .6, duration: .2, ease: 'lr.in' }, to);
    tl.to('#ic', { morphSVG: I.post, duration: .5, ease: 'lr.move' }, to + .05);
    tl.set('#bm', { autoAlpha: 1 }, to + .35).to('#bm', { drawSVG: '0% 100%', duration: .35, ease: 'power2.out' }, to + .35);
    M.fadeIn(tl, '#pv', to + .4, .15);
    ['#pL', '#pR'].forEach((p, i) => tl.fromTo(p, { autoAlpha: 0, y: -2 }, { autoAlpha: 1, y: 0, duration: .35, ease: 'back.out(2)' }, to + .55 + i * .08));
    MK.head(tl, '#t3', to + .36, Q.life);
    const th = 13 * Math.PI / 180, dy = 8 * Math.sin(th), dx = 8 * (1 - Math.cos(th)), tt = Q.tip + .45;
    tl.fromTo('#coin', { opacity: 1, y: -9 }, { opacity: 1, y: 0, duration: .4, ease: 'power3.in' }, Q.tip);
    tl.to('#beam', { rotation: 13, svgOrigin: '12 6', duration: .7, ease: 'elastic.out(1,.45)' }, tt);
    tl.to('#pR', { x: -dx, y: dy, duration: .7, ease: 'elastic.out(1,.45)' }, tt).to('#coin', { x: -dx, y: dy, duration: .7, ease: 'elastic.out(1,.45)' }, tt);
    tl.to('#pL', { x: dx, y: -dy, duration: .7, ease: 'elastic.out(1,.45)' }, tt);
    // 5 · a paper circle opens from the scale: the road home, the sun, the car drives on
    const t5 = Q.life;
    tl.to('#icon', { scale: .7, autoAlpha: 0, svgOrigin: '12 12', duration: .3, ease: 'lr.in' }, t5);
    tl.to('#flipC', { attr: { r: 1250 }, duration: .6, ease: 'power3.inOut' }, t5 + .05);
    tl.set('#bgc', { backgroundColor: BT.warm }, t5 + .65).set('#flipC', { attr: { r: 0 } }, t5 + .66).set('.grain', { className: 'grain' }, t5 + .65);
    tl.fromTo('#hill1', { opacity: 1, y: 520 }, { opacity: 1, y: 0, duration: .8, ease: 'lr.out' }, t5 + .45);
    tl.fromTo('#hill2', { opacity: 1, y: 520 }, { opacity: 1, y: 0, duration: .9, ease: 'lr.out' }, t5 + .55);
    tl.fromTo('#sun', { opacity: 1, y: 420 }, { opacity: 1, y: 0, duration: 1.1, ease: 'lr.out' }, t5 + .6);
    tl.set('#road', { attr: { d: this.ROAD2 }, stroke: BT.ink, strokeWidth: 10, rotation: 0, drawSVG: '0%', opacity: 1 }, t5 + .6);
    tl.to('#road', { drawSVG: '100%', duration: .7, ease: 'power2.out' }, t5 + .65);
    tl.set('#car', { x: -420, y: 46, rotation: 0 }, t5 + .6);
    tl.to('#car', { x: 900, duration: 2.6, ease: 'power1.inOut' }, t5 + .8); spin(t5 + .8, 2.6, 6);
    tl.to('#car', { y: 43, duration: .2, yoyo: true, repeat: 11, ease: 'sine.inOut' }, t5 + .8);
    MK.head(tl, '#h3', t5 + .5, Q.cta);
    // 6 · the road curls into the mark; the end card settles on paper
    const tC = Q.cta;
    tl.to('#road', { morphSVG: markPath(540, 520, 118), stroke: BT.accent, strokeWidth: 12, duration: .7, ease: 'lr.move' }, tC);
    tl.to(['#hill1', '#hill2'], { y: 600, duration: .6, ease: 'lr.in' }, tC); tl.to('#sun', { y: -200, opacity: 0, duration: .5, ease: 'lr.in' }, tC);
    tl.to('#road', { fill: BT.accent, duration: .3 }, tC + .65);
    tl.to('#chk', { drawSVG: '100%', duration: .35, ease: 'power2.out' }, tC + .85);
    tl.to(['#road', '#chk'], { keyframes: [{ scale: 1.08, duration: .1 }, { scale: 1, duration: .4, ease: 'elastic.out(1,.4)' }], svgOrigin: '540 520' }, tC + .95);
    M.enter(tl, '#eLogo', tC + .5, { d: .35 }); MK.head(tl, '#eHead', Q.gotit);
    M.enter(tl, '#eBtn', Q.free, { y: 20, d: .35 }); M.enter(tl, '#eSite', Q.free + .12, { d: .3 }); M.fadeIn(tl, '#disc', Q.free + .2, .3);
  },
  client: (T, S) => `<p class="lede">After a crash, life gets heavy fast. This piece shows that weight as a story: a car is hit, the road ties itself in a knot, and ${S.screen.items.map(i => esc(i.toLowerCase())).join(', ').replace(/, ([^,]*)$/, ' and $1')} pile up and start to wobble. Then ${esc(BT.short)}'s mark slides underneath, takes the weight, and the story turns to what the firm does: ${S.screen.actions.map(a => esc(a.replace(/\*\*/g, '').replace(/\.$/, '').toLowerCase())).join('; ')}. It ends on the road home and a clear call to action.</p>
  <h3>Why it works</h3><ul><li><b>The firm is named in the first second,</b> on screen and in the voiceover.</li><li><b>It feels like an illustrated short</b> rather than an ad, so people keep watching past the first few seconds.</li><li><b>Every image is about the viewer's situation,</b> and the firm arrives as the thing that lifts it.</li></ul>`,
};
