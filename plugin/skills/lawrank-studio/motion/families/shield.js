/* SHIELD — "covered". After the crash, a storm: three of life's problems rain down on the viewer's car. The firm's
   mark shape drops in and opens into an umbrella; the rain stops reaching the car; three lightning strikes (the three
   things the firm does) hit the umbrella and it holds; the storm cloud ("Insurance Co.") breaks up; the sky clears; the
   umbrella folds back into the mark and swells into the end card.
   Best for: "do I need an attorney", protection from the insurer, what happens after a crash, who is responsible.
   Storyboard lines: hook (2 sentences: the storm; "<Firm> has you covered."), pile (3 sentences, one per item), turn,
   work (one sentence naming the three strikes), calm, cta (firm name; offer).
   screen: { head, items: [{ kind: bill|phone|pay|letter, label }] x3, cloud, turn, strikes: [3 short lines],
             strikeWords?: [word spoken for each strike], calm, end, cta, site?, disclaimer? } */
FAMILIES.shield = {
  id: 'shield', label: 'Covered (storm + umbrella)',
  lines: () => ['hook', 'pile', 'turn', 'work', 'calm', 'cta'],
  UX: 580,
  can() { const U = this.UX; return `M300,1150 C300,1020 430,960 ${U},960 C730,960 860,1020 860,1150 Q823,1126 787,1150 Q750,1126 713,1150 Q676,1126 640,1150 Q603,1126 567,1150 Q530,1126 493,1150 Q456,1126 420,1150 Q383,1126 347,1150 Q323,1132 300,1150 Z`; },
  strikeWords: S => S.screen.strikeWords || S.screen.strikes.map(s => s.replace(/\*\*/g, '').replace(/[.!]$/, '').split(' ').pop()),
  cues(h, S) {
    const hk = h.L.hook.sentences, pl = h.L.pile.sentences, cta = h.L.cta.sentences, sw = this.strikeWords(S);
    const c = { clouds: .15, rain: .7, logo: (hk[1] || hk[0]).t - .05, turn: h.L.turn.t - .15, calm: h.L.calm.t - .2, cta: h.L.cta.t - .15 };
    c.items = [0, 1, 2].map(i => (pl[i] || pl[pl.length - 1]).t - .1 + (pl[i] ? 0 : i * .9));
    c.strikes = sw.map(w => h.W('work', w) - .05);
    c.free = cta.length > 1 ? cta[cta.length - 1].t - .05 : c.cta + 1.5; c.end = h.L.cta.end + 2.8; return c;
  },
  sfx: c => [{ kind: 'rumble', at: .1 }, { kind: 'rain', at: c.rain, until: c.calm }, ...c.items.map(t => ({ kind: 'thud', at: t + .45 })),
    { kind: 'whoosh', at: c.turn }, ...c.strikes.map(t => ({ kind: 'crackle', at: t + .12 })), { kind: 'whoosh', at: c.calm }, { kind: 'whoosh', at: c.cta }],
  poster: T => T.cues.strikes[1] + .6,
  item(kind, i, label) {
    const id = 'it' + i;
    if (kind === 'phone') return `<g id="${id}"><rect x="-110" y="-56" width="220" height="112" rx="26" fill="${BT.ink}" stroke="#454C52" stroke-width="3"/><rect x="-98" y="-44" width="196" height="88" rx="16" fill="#2A2D31"/><text x="0" y="-4" text-anchor="middle" font-family="${BT.head}" font-weight="700" font-size="22" fill="#fff">${esc(label || 'Insurance Co.')}</text><circle cx="-40" cy="24" r="10" fill="#E5484D"/><circle cx="40" cy="24" r="10" fill="#2FD27A"/></g>`;
    if (kind === 'pay') return `<g id="${id}"><rect x="-120" y="-55" width="240" height="110" rx="10" fill="#EEF4E8"/><text x="-96" y="-14" font-family="${BT.head}" font-weight="800" font-size="24" fill="${BT.ink}">PAYCHECK</text><rect x="-96" y="8" width="120" height="10" rx="5" fill="#B9C7AE"/><rect x="-96" y="28" width="80" height="10" rx="5" fill="#B9C7AE"/><circle cx="76" cy="16" r="26" fill="none" stroke="#7E9A6C" stroke-width="5"/><text x="76" y="26" text-anchor="middle" font-family="${BT.head}" font-weight="800" font-size="28" fill="#3F5C2F">$</text></g>`;
    const cross = kind === 'bill' ? `<circle cx="62" cy="34" r="20" fill="${BT.accent}"/><rect x="54" y="30" width="16" height="8" rx="2" fill="#fff"/><rect x="58" y="26" width="8" height="16" rx="2" fill="#fff"/>` : '';
    return `<g id="${id}"><rect x="-100" y="-65" width="200" height="130" rx="12" fill="#fff"/><path d="M-90,-56 L0,8 L90,-56" fill="none" stroke="#C3CAD0" stroke-width="5" stroke-linejoin="round"/>${cross}</g>`;
  },
  html(T, S) {
    const U = this.UX, C = { sky: '#2B3238', cloud: '#4A545C', cloud2: '#3C454D', ground: '#1F2428' }, sc = S.screen;
    const r = seeded(11), DROPS = Array.from({ length: 70 }, () => ({ x: r() * 1180 - 50 }));
    const cloud = (id, cx, cy, s, fill) => `<g id="${id}">${[[-120, 20, 80], [-40, -30, 105], [60, -10, 95], [140, 25, 70], [10, 40, 90]].map(([dx, dy, rr]) => `<circle class="puff" cx="${cx + dx * s}" cy="${cy + dy * s}" r="${rr * s}" fill="${fill}"/>`).join('')}</g>`;
    const car = `<g id="car"><path fill="${BT.ink}" stroke="#3B4248" stroke-width="2" d="M20,100 C20,80 30,72 50,70 L90,66 C105,40 130,30 165,30 L200,30 C225,30 245,45 258,66 L280,70 C292,72 300,82 300,95 L300,104 C300,110 296,114 290,114 L30,114 C24,114 20,110 20,104 Z"/>
      <path fill="#8FA3B0" d="M112,64 C121,47 138,40 160,40 L174,40 L174,64 Z"/><path fill="#8FA3B0" d="M184,40 L198,40 C214,40 228,50 238,64 L184,64 Z"/><rect x="286" y="84" width="12" height="10" rx="3" fill="#FFE7A3"/>
      ${[80, 240].map(x => `<circle cx="${x}" cy="114" r="23" fill="#2A2D31" stroke="#454C52" stroke-width="2"/><circle cx="${x}" cy="114" r="9" fill="#9AA6AE"/>`).join('')}</g>`;
    const heads = [[sc.head, 'oe', '#fff'], [sc.turn, 'oe', '#fff'], [sc.strikes.map((s, i) => i === 2 && !/\*\*/.test(s) ? `**${s}**` : s).join('\n'), 'oe', '#fff'], [sc.calm, 'o', BT.ink]];
    return `<div id="bgc" class="bgc" style="background:${C.sky}"></div><div id="skyG" class="bgc" style="opacity:0;background:linear-gradient(${mix(BT.warm, '#FFFFFF', .4)} 0%,${BT.warm} 60%,${mix(BT.warm, '#D9C3A5', .5)} 100%)"></div>
  <svg class="svgL" viewBox="0 0 1080 1920"><defs>
      <mask id="rainMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="1920"><rect width="1080" height="1920" fill="#fff"/><path id="shield" d="${this.can()} M300,1140 H860 V1400 H300 Z" fill="#000"/></mask>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <circle id="sun" cx="800" cy="560" r="110" fill="${BT.bright}" opacity="0"/>
    ${cloud('cl1', 250, 570, 1.1, C.cloud2)}${cloud('cl2', 860, 610, .95, C.cloud2)}${cloud('cl0', 560, 660, 1.45, C.cloud)}
    <text id="cLab" x="560" y="690" text-anchor="middle" font-family="${BT.head}" font-weight="800" font-size="40" fill="#fff" opacity="0">${esc(sc.cloud || 'Insurance Co.')}</text>
    <g id="rain" mask="url(#rainMask)" stroke="#A9BBC6" stroke-width="4" stroke-linecap="round" opacity="0">${DROPS.map(d => `<path class="drop" d="M${d.x.toFixed(0)},0 l-12,48"/>`).join('')}</g>
    <path id="ground" d="M-40,1380 C300,1366 760,1394 1120,1376 V1960 H-40 Z" fill="${C.ground}"/>
    <ellipse id="pud1" cx="220" cy="1470" rx="120" ry="14" fill="#2F383F"/><ellipse id="pud2" cx="900" cy="1520" rx="90" ry="12" fill="#2F383F"/>
    <path id="shaft" d="M${U},970 V1236" stroke="${BT.ink}" stroke-width="12" stroke-linecap="round"/>
    <g transform="translate(386,1203) scale(1.3)">${car}</g>
    ${sc.items.map((it, i) => this.item(it.kind, i, it.kind === 'phone' ? sc.cloud : null)).join('')}
    <path id="umb" fill="${BT.accent}" d="${markPath(U, 820, 110)}" opacity="0"/>
    ${[0, 1, 2].map(i => `<path id="bolt${i}" d="M${U - 30 + i * 30},790 L${U - 70 + i * 40},880 L${U - 20 + i * 30},880 L${U - 50 + i * 30},958" fill="none" stroke="#FFE7A3" stroke-width="12" stroke-linejoin="round" stroke-linecap="round" filter="url(#glow)"/>`).join('')}
    <path id="hexS" fill="${BT.endBg}" d="${markPath(U, 820, 10)}" opacity="0"/>
  </svg>
  <img id="bug" class="m-bug h" src="${BT.logoLight}" alt="${esc(BT.name)}" style="top:140px">
  ${heads.map(([h, cls, col], i) => `<div id="hd${i}" class="m-hl" data-qa="text" style="top:250px;font-size:70px;color:${col}">${accentize(h, cls).replace(/\n/g, '<br>')}</div>`).join('')}
  ${sc.items.map((it, i) => `<div id="lb${i}" class="m-lab h" data-qa="text" style="${i === 1 ? 'right:70px;text-align:right' : 'left:70px'};top:${[1500, 1560, 1660][i]}px;color:#fff">${esc(it.label)}</div>`).join('')}
  ${endCard(sc)}`;
  },
  build(tl, T, $, S) {
    const Q = T.cues, { W } = MK.T(T), E = T.end, U = this.UX, kinds = S.screen.items.map(i => i.kind);
    tl.set(['#shaft', '#bolt0', '#bolt1', '#bolt2'], { drawSVG: '0%' }, 0).set('#shield', { scaleY: 0, svgOrigin: `${U} 960` }, 0);
    tl.set('#it0', { x: 560, y: -200, rotation: -12 }, 0).set('#it1', { x: 700, y: -200, rotation: 10 }, 0).set('#it2', { x: 420, y: -200, rotation: -6 }, 0);
    // 1 · the storm rolls in over the car
    tl.fromTo('#cl1', { x: -520 }, { x: 0, duration: 1.2, ease: 'power2.out' }, Q.clouds);
    tl.fromTo('#cl2', { x: 520 }, { x: 0, duration: 1.2, ease: 'power2.out' }, Q.clouds + .1);
    tl.fromTo('#cl0', { y: -560 }, { y: 0, duration: 1.1, ease: 'power3.out' }, Q.clouds + .2);
    [['#cl0', 560, 660], ['#cl1', 250, 570], ['#cl2', 860, 610]].forEach(([c, x, y], i) => tl.to(c, { scale: 1.035, svgOrigin: `${x} ${y}`, duration: 1.6 + i * .3, yoyo: true, repeat: Math.ceil(E / 1.6), ease: 'sine.inOut' }, 1.3));
    tl.to('#rain', { opacity: .85, duration: .8 }, Q.rain);
    const r = seeded(29);
    $('#rain').querySelectorAll('.drop').forEach(el => { const d = .55 + r() * .25, off = r() * 1620, n = Math.ceil(E / d) + 1;
      tl.fromTo(el, { y: 0 }, { y: 1620 * n, duration: d * n, ease: 'none', modifiers: { y: v => ((parseFloat(v) + off) % 1620 - 120) + 'px' } }, 0); });
    MK.head(tl, '#hd0', .35, Q.items[0] - .1, .08);
    M.enter(tl, '#bug', Q.logo, { y: -16, d: .4 }); M.exit(tl, '#bug', Q.items[0] - .1);
    // 2 · three problems fall: the first two hit the car and bounce off with weight, the third flutters and blows away
    const hit = (id, t, landY, dir, rot, lb) => {
      tl.to(id, { y: landY, duration: .45, ease: 'power3.in' }, t);
      tl.to('#car', { keyframes: [{ y: 3, duration: .06 }, { y: 0, duration: .35, ease: 'elastic.out(1,.4)' }] }, t + .45);
      tl.to(id, { physics2D: { velocity: 620, angle: dir > 0 ? -60 : -120, gravity: 2600 }, rotation: `+=${rot}`, duration: .62, ease: 'none' }, t + .45);
      M.enter(tl, lb, t + .5, { y: 14, d: .3 });
    };
    hit('#it0', Q.items[0], 1150, -1, -40, '#lb0');
    hit('#it1', Q.items[1], 1196, 1, 34, '#lb1');
    if (kinds[1] === 'phone') tl.to('#it1', { keyframes: [{ x: '-=5', duration: .04 }, { x: '+=10', duration: .04 }, { x: '-=5', duration: .04 }], repeat: 8, repeatDelay: .25 }, Q.items[1] + 1.1);
    tl.to('#it2', { y: 1020, duration: .9, ease: 'power1.in' }, Q.items[2]);
    tl.to('#it2', { keyframes: [{ x: 300, rotation: -18, duration: .3 }, { x: 470, rotation: 14, duration: .3 }, { x: 360, rotation: -10, duration: .3 }], ease: 'sine.inOut' }, Q.items[2]);
    tl.to('#it2', { x: -360, y: 760, rotation: -60, duration: .9, ease: 'power2.in' }, Q.items[2] + .95);
    M.enter(tl, '#lb2', Q.items[2] + .2, { y: 14, d: .3 });
    // 3 · the mark drops in and opens into an umbrella over the car
    const tU = Q.turn;
    M.fadeOut(tl, ['#lb0', '#lb1', '#lb2'], tU - .1, .2);
    tl.fromTo('#umb', { opacity: 1, y: -760 }, { opacity: 1, y: 0, duration: .5, ease: 'back.out(1.3)' }, tU);
    tl.to('#umb', { morphSVG: this.can(), duration: .5, ease: 'back.out(1.6)' }, tU + .5);
    tl.to('#shaft', { drawSVG: '100%', duration: .3, ease: 'power2.out' }, tU + .6);
    tl.to('#shield', { scaleY: 1, duration: .45, ease: 'power2.out' }, tU + .65);
    tl.to('#it0', { x: '-=700', rotation: '-=90', duration: .6, ease: 'power2.in' }, tU + .75);
    tl.to('#it1', { x: '+=700', rotation: '+=90', duration: .6, ease: 'power2.in' }, tU + .8); tl.set(['#it0', '#it1', '#it2'], { autoAlpha: 0 }, tU + 1.45);
    MK.head(tl, '#hd1', tU + .3, Q.strikes[0] - .42);
    tl.to('#cLab', { opacity: 1, duration: .35 }, W('turn', (S.screen.cloud || 'insurance').split(' ')[0]) - .1);
    // 4 · three strikes; the umbrella holds; the cloud weakens each time and breaks on the last
    const l2 = MK.lines('#hd2'); tl.set(l2, { yPercent: 105 }, 0).set('#hd2', { autoAlpha: 0 }, 0).set('#hd2', { autoAlpha: 1 }, Q.strikes[0] - .01);
    MK.linesOut(tl, l2, Q.calm - .1); tl.set('#hd2', { autoAlpha: 0 }, Q.calm + .22);
    Q.strikes.forEach((t, i) => {
      if (l2[i]) tl.to(l2[i], { yPercent: 0, duration: .45, ease: 'lr.out' }, t);
      tl.to('#bolt' + i, { drawSVG: '100%', duration: .12, ease: 'power2.in' }, t).to('#bolt' + i, { drawSVG: '100% 100%', duration: .25, ease: 'power2.out' }, t + .3).set('#bolt' + i, { opacity: 0 }, t + .56);
      tl.to(['#umb', '#shield'], { keyframes: [{ scaleY: .9, scaleX: 1.04, duration: .07 }, { scaleY: 1, scaleX: 1, duration: .5, ease: 'elastic.out(1.1,.35)' }], svgOrigin: `${U} 1150` }, t + .12);
      tl.to('#cl0 .puff', { scale: '-=0.1', duration: .5, ease: 'power2.out', transformOrigin: '50% 50%' }, t + .2);
    });
    const tB = Q.strikes[2] + .5;
    tl.to('#cl0 .puff', { x: i => [-220, -90, 90, 240, 30][i], y: i => [-40, -120, -100, -20, 90][i], opacity: 0, duration: .9, ease: 'power2.out' }, tB);
    tl.to('#cLab', { opacity: 0, duration: .3 }, tB); tl.to(['#cl1', '#cl2'], { x: i => i ? 600 : -600, duration: 1.2, ease: 'power2.in' }, tB + .2);
    tl.to('#rain', { opacity: 0, duration: .8 }, tB + .1);
    // 5 · the sky clears; the umbrella folds back into the mark
    const tC = Q.calm;
    tl.to('#skyG', { opacity: 1, duration: .9, ease: 'power1.inOut' }, tC);
    tl.to('#ground', { fill: mix(BT.warm, '#B9A182', .45), duration: .9 }, tC); tl.to(['#pud1', '#pud2'], { fill: mix(BT.warm, '#FFFFFF', .3), duration: .9 }, tC);
    tl.fromTo('#sun', { opacity: 1, y: 500 }, { opacity: 1, y: 0, duration: 1.2, ease: 'lr.out' }, tC + .3);
    tl.to('#shaft', { drawSVG: '0%', duration: .3 }, tC + .2);
    tl.to('#umb', { morphSVG: markPath(U, 820, 110), duration: .5, ease: 'lr.move' }, tC + .3);
    tl.to('#car', { keyframes: [{ y: -10, duration: .18, ease: 'power2.out' }, { y: 0, duration: .3, ease: 'bounce.out' }] }, tC + .8);
    MK.head(tl, '#hd3', tC + .35, Q.cta - .1);
    // 6 · the mark swells into the end card
    tl.set('#hexS', { attr: { d: markPath(U, 820, 110) }, opacity: 1 }, Q.cta).set('#umb', { opacity: 0 }, Q.cta);
    tl.to('#hexS', { morphSVG: markPath(540, 960, 1500), duration: .6, ease: 'power3.in' }, Q.cta);
    tl.set('#bgc', { backgroundColor: BT.endBg }, Q.cta + .6).set(['#skyG', '#hexS'], { opacity: 0 }, Q.cta + .61).set('svg.svgL > :not(#hexS)', { opacity: 0 }, Q.cta + .6);
    endCardIn(tl, Q.cta + .55, Q.free);
  },
  client: (T, S) => `<p class="lede">After a crash, it can feel like a storm. Here it is one: ${S.screen.items.map(i => esc(i.label.toLowerCase())).join(', ').replace(/, ([^,]*)$/, ' and $1')} rain down on the viewer's car. Then ${esc(BT.short)}'s brand mark drops in and opens into an umbrella, and the rain stops reaching them. Three lightning strikes (${S.screen.strikes.map(s => esc(s.replace(/\*\*/g, '').replace(/\.$/, '').toLowerCase())).join(', ')}) hit the umbrella and it holds. The storm cloud breaks apart, the sky clears, and the umbrella folds back into the mark for the call to action.</p>
  <h3>Why it works</h3><ul><li><b>The firm is named in the first seconds</b> and its logo arrives with “has you covered.”</li><li><b>A simple, universal picture:</b> the firm as protection. It reads with the sound off.</li><li><b>Dark and moody until the turn,</b> so the bright ending feels like relief.</li></ul>`,
};
