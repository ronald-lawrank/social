/* shape-house: a home (or a small skyline) built from big flat geometric shapes, a quarter circle swinging in from the
   corner, a half-circle sun rising, rectangles sliding in and locking together one by one on the rhythm of the voice,
   while a small glass marble rolls along the ground. thread: white shapes with ink outlines and one accent roof, the
   dot lands on the roof's apex; flat: chunky tones of the brand on a deep panel; cards: a white card holding soft
   brand tints; silhouette: black cut-outs on paper with an accent sun. */
SCENES['shape-house'] = {
  label: 'Shape house', about: 'Big flat shapes (half circles, quarter circles, rectangles) slide in and lock together into a home or a skyline while a glass marble rolls past.',
  good: 'protecting your home and family, your community, what you have built, a local firm', practice: 'any',
  fields: { head: 'headline (3-8 words); **phrase** = accent', scene: "'home' (default: a house, a tree, a path) or 'city' (a small skyline)",
    sub: 'optional short line under the picture (2-7 words, said in the line)' },
  example: { say: 'Your home is where your family feels safe. We are here to help you protect it.', head: 'Protecting your **home and family.**', scene: 'home',
    sub: 'Here to help you protect it' },
  sfx: (sc, X) => { const T = SCENES['shape-house'].tm(sc, X); return T.ts.filter((t, i) => i % 3 === 1).map(t => ({ kind: 'soft', at: t + .1 }))
    .concat([{ kind: 'thud', at: T.lock + .15 }, { kind: 'chime', at: T.lock + .3 }]); },
  P: { x: 60, y: 630, w: 960, h: 830, G: 650 },
  pal(LK) {
    const n = LK.name, t = (c, k) => mix(c, '#FFFFFF', k), o = {};
    if (n === 'thread') Object.assign(o, { panel: '#FFFFFF', sun: t(BT.accent, .8), B: t(BT.accent, .93), C: LK.ink, D: LK.ink, gnd: LK.fillB, path: '#FFFFFF', roof: BT.accent,
      house: '#FFFFFF', win: t(BT.accent, .72), tree: t(BT.accent, .8), top: LK.fillB, edge: LK.ink, sw: 5 });
    else if (n === 'flat') Object.assign(o, { panel: LK.fillB, sun: mix(LK.bg, '#FFFFFF', .55), B: LK.bg, C: mix(LK.fillB, '#000000', .32), D: mix(LK.fillB, '#000000', .32), gnd: mix(LK.bg, '#FFFFFF', .22),
      path: mix(LK.bg, '#FFFFFF', .62), roof: LK.bg, house: '#FFFFFF', win: mix(LK.bg, '#FFFFFF', .55), tree: LK.bg, top: mix(LK.bg, '#FFFFFF', .3) });
    else if (n === 'cards') Object.assign(o, { panel: '#FFFFFF', sun: t(BT.accent, .6), B: t(BT.accent, .84), C: mix(BT.ink, BT.accent, .2), D: mix(BT.ink, BT.accent, .2), gnd: t(BT.accent, .72),
      path: t(BT.accent, .92), roof: BT.accent, house: '#FFFFFF', win: t(BT.accent, .72), tree: t(BT.accent, .5), top: t(BT.accent, .9) });
    else Object.assign(o, { panel: LK.surface, sun: LK.accent, B: LK.fillC, C: LK.ink, D: LK.ink, gnd: LK.fillB, path: LK.fillC, roof: LK.ink, house: LK.ink, win: LK.accent, tree: LK.fillB, top: LK.fillB });
    return Object.assign(o, { tree2: mix(o.tree, '#000000', .14) });
  },
  // pieces in panel coordinates (960 x 830, ground at G). m: how each arrives (slide from dx/dy, swing about an origin, grow from an origin)
  pieces(sc, C) {
    const G = this.P.G, W = this.P.w, H = this.P.h, qc = (cx, cy, r, a0, a1) => { const p = a => [cx + r * Math.cos(a), cy + r * Math.sin(a)].map(v => v.toFixed(1)).join(',');
      return `M${cx},${cy} L${p(a0)} A${r},${r} 0 0 1 ${p(a1)} Z`; }, half = (cx, cy, r, dn) => `M${cx - r},${cy} A${r},${r} 0 0 ${dn ? 0 : 1} ${cx + r},${cy} Z`;
    const S = (d, f) => `<path d="${d}" fill="${f}"/>`, R = (x, y, w, h, f, rx = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}"/>`;
    const base = [
      { svg: S(qc(0, 0, 360, 0, Math.PI / 2), C.B), m: { rot: -90, o: '0 0' } },
      { svg: R(W - 220, 0, 220, G, C.C) + S(`M${W},80 A160,160 0 0 0 ${W},400 Z`, C.sun), m: { dx: 260 } },
      { svg: S(half(W / 2 + 70, 0, 120, 1), C.top), m: { dy: -140 } },
      { svg: S(half(W / 2 - 40, G, 340), C.sun), m: { s: 0, o: `${W / 2 - 40} ${G}` } },
      { svg: R(-10, G, W + 20, H - G + 10, C.gnd) + S(half(120, G, 140), C.D), m: { dy: 240 } },
    ];
    if ((sc.scene || 'home') === 'city') {
      const bl = [[80, 120, 270, C.C], [212, 104, 400, C.house, 1], [328, 140, 300, C.B], [480, 112, 460, C.C], [604, 132, 240, C.house, 1], [748, 110, 340, C.tree]];
      const win = (x, w, h, f) => { let s = ''; for (let yy = G - h + 36; yy < G - 44; yy += 58) for (let xx = x + 22; xx < x + w - 30; xx += 36) s += R(xx, yy, 18, 32, f, 2); return s; };
      return base.concat(bl.map(([x, w, h, f, wl], i) => ({ svg: R(x, G - h, w, h, f) + (i === 1 ? S(`M${x},${G - h} L${x + w / 2},${G - h - 100} L${x + w},${G - h}Z`, C.roof) : '')
        + (i === 3 ? R(x + w / 2 - 5, G - h - 80, 10, 82, f) + `<circle cx="${x + w / 2}" cy="${G - h - 84}" r="13" fill="${C.roof}"/>` : '') + (wl ? win(x, w, h, C.win) : '')
        + (i === 2 ? S(half(x + w / 2, G - h, w / 2), f) : ''), m: { dy: h + 280 }, top: [x + w / 2, G - h - (i === 1 ? 100 : i === 3 ? 84 : 0)] })))
        .concat([{ svg: `<circle cx="${W - 330}" cy="150" r="56" fill="${C.roof}"/>`, m: { s: 0, o: `${W - 330} 150`, pop: 1 } }]);
    }
    const hx = 270, hw = 380, top = 400, cx = hx + hw / 2, tx = hx + hw + 128;
    return base.concat([
      { svg: S(`M${cx - 50},${G} L${cx + 50},${G} L${cx + 130},${H + 10} L${cx - 130},${H + 10}Z`, C.path), m: { s: 0, sy: 1, o: `${cx} ${G}` } },
      { svg: R(hx + 268, 250, 50, 130, C.D), m: { dy: 200 } },
      { svg: R(hx, top, hw, G - top, C.house), m: { dy: 460 } },
      { svg: S(`M${hx - 40},${top + 12} L${cx},${top - 190} L${hx + hw + 40},${top + 12}Z`, C.roof), m: { dy: -620 }, top: [cx, top - 190] },
      { svg: R(cx - 42, G - 150, 84, 150, C.D) + `<circle cx="${cx + 22}" cy="${G - 74}" r="7" fill="${C.house}"/>`, m: { s: 0, sy: 1, o: `${cx} ${G}` } },
      { svg: R(hx + 42, top + 60, 86, 86, C.win) + R(hx + hw - 128, top + 60, 86, 86, C.win), m: { s: 0, o: `${cx} ${top + 103}`, pop: 1 } },
      { svg: R(tx - 8, G - 90, 16, 90, C.D) + `<circle cx="${tx}" cy="${G - 150}" r="80" fill="${C.tree}"/>` + S(half(tx, G - 150, 80, 1), C.tree2), m: { s: 0, o: `${tx} ${G}`, pop: 1 } },
    ]);
  },
  tm(sc, X) {
    const n = this.pieces(sc, {}).length, a = X.tIn + .05;   // pieces({}): sfx runs in node, without a look
    const b = Math.min(X.tOut - 1.1, a + Math.min(3.4, Math.max(1.8, (X.tOut - a) * .58)));
    const ws = X.line.words.map(w => w.t).filter(t => t >= a - .01 && t <= b + .01), ts = [];
    for (let i = 0; i < n; i++) {
      const g = a + (b - a) * i / Math.max(1, n - 1);
      let t = ws.length ? ws.reduce((p, c) => Math.abs(c - g) < Math.abs(p - g) ? c : p) : g;
      if (i && t < ts[i - 1] + .1) t = ts[i - 1] + .1;
      ts.push(t);
    }
    const sub = sc.sub ? Math.min(X.tOut - .6, Math.max(ts[n - 1] + .3, X.times([sc.sub])[0])) : null;
    return { ts, lock: ts[n - 1] + .45, sub };
  },
  html(sc, X) {
    const LK = X.LK, n = LK.name, id = X.id, P = this.P, C = this.pal(LK), ps = this.pieces(sc, C);
    const st = C.edge ? ` stroke="${C.edge}" stroke-width="${C.sw}" stroke-linejoin="round"` : '';
    const ball = n === 'silhouette' ? `<circle r="34" fill="${LK.ink}"/><path d="M-20,-8 A22,22 0 0 1 4,-24" fill="none" stroke="${LK.surface}" stroke-width="7" stroke-linecap="round"/>`
      : `<circle r="34" fill="url(#${id}gl)"${n === 'thread' ? ` stroke="${LK.ink}" stroke-width="4"` : ''}/><ellipse cx="-11" cy="-14" rx="11" ry="7" fill="#FFFFFF" opacity=".95" transform="rotate(-30 -11 -14)"/>
        <path d="M-22,14 A26,26 0 0 0 18,22" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity=".7"/>`;
    const svg = `<svg class="k-abs" style="left:0;top:0" width="${P.w}" height="${P.h}" viewBox="0 0 ${P.w} ${P.h}">
      <defs><radialGradient id="${id}gl" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".55" stop-color="${mix(BT.accent, '#FFFFFF', .6)}" stop-opacity=".85"/>
        <stop offset="1" stop-color="${mix(BT.accent, BT.ink, .35)}" stop-opacity=".95"/></radialGradient></defs>
      <g id="${id}all"${st}>${ps.map((p, i) => `<g id="${id}p${i}">${p.svg}</g>`).join('')}
      <g id="${id}ball" transform="translate(-60,${P.G - 34})">${ball}</g></g></svg>`;
    const sh = n === 'silhouette' ? '16px 18px 0 rgba(0,0,0,.16)' : n === 'flat' ? `0 16px 0 ${mix(LK.bg, '#000000', .25)}` : LK.shadow;
    const border = n === 'thread' ? `border:5px solid ${LK.ink};` : '';
    return `${UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 330, w: 920, size: ((n) => n > 40 ? 72 : n > 28 ? 80 : 92)(String(sc.head).replace(/\*/g, '').length), align: 'center' })}
      <div id="${id}pn" class="k-card" style="left:${P.x}px;top:${P.y}px;width:${P.w}px;height:${P.h}px;background:${C.panel};border-radius:${n === 'silhouette' ? 0 : LK.radius}px;box-shadow:${sh};${border}">${svg}</div>
      ${sc.sub ? UI.text(LK, { id: id + 's', text: sc.sub, x: 90, y: P.y + P.h + 26, w: 900, size: 42, weight: 700, align: 'center', color: LK.ink, font: 'head' }) : ''}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, P = this.P, ps = this.pieces(sc, this.pal(LK)), T = this.tm(sc, X), q = s => X.q(s), pn = q(`#${id}pn`);
    X.head(`#${id}h`, X.tIn);
    tl.set(pn, { autoAlpha: 0 }, 0).set(pn, { autoAlpha: 1, y: 140 }, X.tIn - .2).to(pn, { y: 0, duration: .55, ease: 'lr.out' }, X.tIn - .2);
    // each shape arrives on a word and locks into place
    ps.forEach((p, i) => {
      const el = q(`#${id}p${i}`), m = p.m, t = T.ts[i];
      tl.set(el, { autoAlpha: 0 }, 0);
      if (m.rot != null) tl.set(el, { autoAlpha: 1, rotation: m.rot, svgOrigin: m.o }, t).to(el, { rotation: 0, duration: .6, ease: 'lr.out' }, t);
      else if (m.s != null && !m.dy) tl.set(el, { autoAlpha: 1, scale: m.sy ? 1 : 0, scaleY: 0, svgOrigin: m.o }, t).to(el, { scale: 1, scaleY: 1, duration: m.pop ? .4 : .5, ease: m.pop ? 'back.out(2)' : 'lr.out' }, t);
      else tl.set(el, { autoAlpha: 1, x: m.dx || 0, y: m.dy || 0 }, t).to(el, { x: 0, y: 0, duration: .5, ease: 'lr.out' }, t);
    });
    // the lock: everything settles with one small bump, then a slow push in
    const all = q(`#${id}all`);
    tl.to(all, { keyframes: [{ scale: 1.015, duration: .12, ease: 'power2.out' }, { scale: 1, duration: .5, ease: 'elastic.out(1,.5)' }], svgOrigin: `${P.w / 2} ${P.G}` }, T.lock);
    tl.to(all, { scale: 1.04, svgOrigin: `${P.w / 2} ${P.G}`, duration: Math.max(.5, X.tOut - T.lock - .6), ease: 'none' }, T.lock + .62);
    // the glass marble rolls along the ground the whole time, slowing as the house locks
    const ball = q(`#${id}ball`);
    tl.fromTo(ball, { x: -60, y: P.G - 34 }, { x: P.w * .2, duration: T.lock - X.tIn, ease: 'power1.out', immediateRender: false }, X.tIn)
      .to(ball, { x: P.w + 60, duration: Math.max(.8, X.tOut - T.lock + .3), ease: 'power1.in' }, T.lock);
    if (sc.sub) { const s = q(`#${id}s`); tl.set(s, { autoAlpha: 0 }, 0).set(s, { autoAlpha: 1, y: 30 }, T.sub).to(s, { y: 0, duration: .45, ease: 'lr.out' }, T.sub); tl.to(s, { autoAlpha: 0, duration: .25, ease: 'lr.in' }, X.tOut); }
    if (LK.thread) { const tp = ps.map(p => p.top).filter(Boolean).sort((a, b) => a[1] - b[1])[0]; X.dot(P.x + tp[0], P.y + tp[1] - 26, T.lock, { r: 18 }); }
    tl.to(pn, { autoAlpha: 0, y: -30, duration: .3, ease: 'lr.in' }, X.tOut + .05);
  },
};
