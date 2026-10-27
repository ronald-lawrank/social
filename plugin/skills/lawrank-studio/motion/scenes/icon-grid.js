/* icon-grid: a grid of 4-6 tiles waits, dim; each one lights up on the word that names it (its icon draws on, its label
   rises). thread: outlined tiles that ink in, the dot hops tile to tile; flat: tiles pop white on the brand colour;
   cards: ghost cards lift into crisp white UI cards; silhouette: paper outlines slam into black tiles. */
SCENES['icon-grid'] = {
  label: 'Icon grid', about: 'A grid of 4-6 dim tiles; each lights up, icon drawing on and label rising, as it is named.',
  good: 'practice areas, what we handle, cases we take, ways to reach us', practice: 'any',
  fields: { head: 'optional headline above the grid', tiles: '[{icon, label}] 4-6 tiles, each label said in the line, in order (icons: car truck walk bus users home shield clock globe phone heart map briefcase dollar hospital doc scale gavel chat search star trophy check)' },
  example: { say: 'We handle car crashes, truck accidents, slip and falls, bus accidents, work injuries and wrongful death.', head: 'What we **handle**',
    tiles: [{ icon: 'car', label: 'Car crashes' }, { icon: 'truck', label: 'Truck accidents' }, { icon: 'walk', label: 'Slip and falls' },
      { icon: 'bus', label: 'Bus accidents' }, { icon: 'briefcase', label: 'Work injuries' }, { icon: 'heart', label: 'Wrongful death' }] },
  sfx: (sc, X) => X.times(sc.tiles.map(t => t.label)).map(t => ({ kind: 'pop', at: t })),
  geo(sc) {
    const n = sc.tiles.length, rows = Math.ceil(n / 2), top = sc.head ? 590 : 440, gap = 34, w = (940 - gap) / 2;
    const h = Math.min(rows < 3 ? 400 : 320, (1520 - top - gap * (rows - 1)) / rows), y0 = top + Math.max(0, (1520 - top - rows * h - gap * (rows - 1)) / 2) * .4;
    return sc.tiles.map((_, i) => { const r = Math.floor(i / 2), last = i === n - 1 && n % 2;
      return { x: last ? 540 - w / 2 : 70 + (i % 2) * (w + gap), y: y0 + r * (h + gap), w, h }; });
  },
  pal(LK) {
    const n = LK.name;
    if (n === 'thread') return { dim: 'transparent', dimEdge: `3px dashed ${LK.soft}`, dimIc: LK.soft, lit: '#FFFFFF', litEdge: `${LK.stroke - 2}px solid ${LK.line}`, ink: LK.ink, ic: LK.ink, icA: BT.accent, disc: mix(BT.accent, '#FFFFFF', .88), shadow: '0 18px 40px rgba(20,24,28,.10)' };
    if (n === 'flat') return { dim: mix(LK.bg, LK.fillB, .45), dimEdge: 'none', dimIc: mix(LK.bg, LK.fillB, .75), lit: '#FFFFFF', litEdge: 'none', ink: BT.ink, ic: LK.fillB, icA: LK.fillB, disc: mix(LK.bg, '#FFFFFF', .8), shadow: `0 14px 0 ${mix(LK.bg, '#000000', .25)}` };
    if (n === 'cards') return { dim: 'rgba(255,255,255,.35)', dimEdge: '2px solid rgba(255,255,255,.6)', dimIc: mix(LK.bg, BT.ink, .18), lit: '#FFFFFF', litEdge: 'none', ink: BT.ink, ic: BT.ink, icA: BT.accent, disc: mix(BT.accent, '#FFFFFF', .88), shadow: LK.shadow };
    return { dim: 'transparent', dimEdge: `4px solid ${mix(LK.bg, LK.ink, .25)}`, dimIc: mix(LK.bg, LK.ink, .25), lit: LK.ink, litEdge: 'none', ink: '#F8F6F1', ic: '#F8F6F1', icA: LK.accent, disc: mix(LK.ink, '#FFFFFF', .12), shadow: '12px 14px 0 rgba(0,0,0,.18)' };
  },
  html(sc, X) {
    const LK = X.LK, n = LK.name, P = this.pal(LK), id = X.id, G = this.geo(sc), rad = n === 'silhouette' ? 0 : n === 'cards' ? 34 : n === 'flat' ? 30 : 28;
    const tiles = sc.tiles.map((t, i) => { const g = G[i], big = g.h > 290, isz = big ? 116 : 104, dsz = big ? 164 : 146;
      return `<div id="${id}t${i}" class="k-abs" style="left:${g.x}px;top:${g.y}px;width:${g.w}px;height:${g.h}px">
        <div class="igd" style="position:absolute;inset:0;border-radius:${rad}px;background:${P.dim};border:${P.dimEdge}"></div>
        <div class="igl" style="position:absolute;inset:0;border-radius:${rad}px;background:${P.lit};border:${P.litEdge};box-shadow:${P.shadow}"></div>
        <div style="position:absolute;left:0;right:0;top:${big ? 34 : 26}px;display:flex;justify-content:center">
          <div class="igc" style="width:${dsz}px;height:${dsz}px;border-radius:${n === 'silhouette' ? 0 : 50}%;background:${P.disc}"></div></div>
        <div style="position:absolute;left:0;right:0;top:${(big ? 34 : 26) + (dsz - isz) / 2}px;display:flex;justify-content:center">
          <div style="position:relative;width:${isz}px;height:${isz}px"><div class="igf" style="position:absolute;inset:0">${icon(t.icon, isz, P.dimIc, P.dimIc)}</div>
          <div class="igi" style="position:absolute;inset:0">${icon(t.icon, isz, P.ic, P.icA)}</div></div></div>
        <div class="igt" data-qa="text" style="position:absolute;left:24px;right:24px;top:${(big ? 34 : 26) + dsz + 18}px;text-align:center;
          font:${LK.headWeight} ${t.label.length > 16 ? 38 : 44}px/1.08 var(--head);color:${P.ink};${LK.headCase === 'upper' ? 'text-transform:uppercase;' : ''}">${accentize(t.label, 'ka')}</div></div>`; }).join('');
    return `${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 330, w: 920, size: 88, align: 'center' }) : ''}${tiles}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, G = this.geo(sc), ts = X.times(sc.tiles.map(t => t.label)), q = s => X.q(s);
    if (sc.head) X.head(`#${id}h`, X.tIn);
    sc.tiles.forEach((t, i) => {
      const el = q(`#${id}t${i}`), node = X.$(`#${id}t${i}`), sel = c => node.querySelector(c), ti = ts[i], g = G[i];
      const lit = sel('.igl'), disc = sel('.igc'), ic = sel('.igi'), faint = sel('.igf'), lab = sel('.igt'), strokes = ic.querySelectorAll('path,circle');
      // every tile settles in (dim) as the scene opens, staggered from the top
      const a = X.tIn - .1 + i * .06;
      tl.set(el, { autoAlpha: 0 }, 0).set(el, { autoAlpha: 1, y: 60 }, a).to(el, { y: 0, duration: .5, ease: 'lr.out' }, a);
      tl.set([lit, disc, ic], { autoAlpha: 0 }, 0).set(lab, { autoAlpha: 0 }, 0);
      // lit on its word
      if (LK.name === 'flat' || LK.name === 'silhouette') { tl.set(lit, { autoAlpha: 1, scale: LK.name === 'flat' ? .6 : 1.12 }, ti - .05).to(lit, { scale: 1, duration: .4, ease: LK.name === 'flat' ? 'back.out(1.8)' : 'power3.out' }, ti - .05); }
      else { tl.set(lit, { autoAlpha: 1, y: 16, scale: .97 }, ti - .05).to(lit, { y: 0, scale: 1, duration: .45, ease: 'lr.out' }, ti - .05); tl.to(el, { y: -8, duration: .45, ease: 'lr.out' }, ti - .05); }
      tl.set(disc, { autoAlpha: 1, scale: 0 }, ti).to(disc, { scale: 1, duration: .4, ease: 'back.out(2)' }, ti);
      tl.set(faint, { autoAlpha: 1 }, 0).set(faint, { autoAlpha: 0 }, ti + .05);
      tl.set(ic, { autoAlpha: 1 }, ti + .05).fromTo(strokes, { drawSVG: '0%' }, { drawSVG: '100%', duration: .5, ease: 'power2.out', stagger: .05, immediateRender: false }, ti + .05);
      tl.fromTo(ic, { rotation: -12, scale: .8 }, { rotation: 0, scale: 1, duration: .5, ease: 'back.out(2)', immediateRender: false }, ti + .05);
      tl.set(lab, { autoAlpha: 1, y: 24 }, ti + .08).to(lab, { y: 0, duration: .4, ease: 'lr.out' }, ti + .08);
      if (LK.thread) X.dot(g.x + g.w - 34, g.y + 34, ti + .1, { r: 14 });
      tl.to(el, { autoAlpha: 0, y: -40, duration: .3, ease: 'lr.in' }, X.tOut + Math.min(.1, i * .02));
      tl.set(lab, { autoAlpha: 0 }, X.tOut + .12);
    });
  },
};
