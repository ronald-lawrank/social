/* steps-chart: blocks drop and stack into a staircase, one step on the word that names it, each step labelled; a
   marker climbs the stair as the steps are said and the top step lights up when it arrives. thread: outlined white
   slabs, the travelling dot is the marker; flat: chunky brand-tone slabs with hard shadows and a white ball; cards:
   floating white slabs with number chips and an accent ball; silhouette: black cut-out slabs with offset shadows and
   a small cut-out figure climbing them. */
SCENES['steps-chart'] = {
  label: 'Steps staircase', about: 'Blocks stack into a staircase, one labelled step per item as it is said, while a marker climbs to the top step.',
  good: 'the steps of a claim, how a case builds, what happens next, a process from first call to resolution', practice: 'any',
  fields: { head: 'optional headline above (2-6 words; **phrase** = accent)', steps: '3-5 steps (1-4 words each), each said in the line, in order; the first is the bottom step' },
  example: { say: 'A claim builds step by step: we gather the facts, file the claim, negotiate with the insurer, and if needed, go to court.',
    head: 'How a claim **builds**', steps: ['Gather the facts', 'File the claim', 'Negotiate', 'Go to court'] },
  sfx: (sc, X) => X.times(sc.steps).map(t => ({ kind: 'thud', at: t })).concat([{ kind: 'chime', at: SCENES['steps-chart'].tm(sc, X).top }]),
  tm(sc, X) { const ts = X.times(sc.steps).map(t => Math.max(X.tIn + .15, t)); return { ts, top: Math.min(X.tOut - .4, ts[ts.length - 1] + .75) }; },
  geo(sc) {
    const n = Math.max(1, Math.min(6, sc.steps.length)), top = sc.head ? 700 : 460, base = 1520, h = Math.min(n <= 3 ? 250 : 210, (base - top) / n);
    const d = n > 1 ? Math.min(190, 540 / (n - 1)) : 0;
    return sc.steps.slice(0, n).map((_, i) => ({ x: 70 + i * d, y: base - (i + 1) * h, w: 940 - i * d, h, d }));
  },
  pal(LK, n) {
    const nm = LK.name, tc = c => (contrast('#FFFFFF', c) >= contrast(BT.ink, c) ? '#FFFFFF' : BT.ink), ramp = (a, b) => i => mix(a, b, n > 1 ? i / (n - 1) : 1);
    if (nm === 'thread') return { fill: () => '#FFFFFF', edge: `${LK.stroke - 2}px solid ${LK.line}`, shadow: '0 16px 34px rgba(20,24,28,.08)', top: BT.accent, tc, rad: 18, band: i => mix(BT.accent, '#FFFFFF', .9 - .5 * (n > 1 ? i / (n - 1) : 1)), ball: BT.accent, ground: LK.line };
    if (nm === 'flat') return { fill: ramp(mix(LK.fillB, '#000000', .2), mix(LK.bg, '#FFFFFF', .62)), edge: 'none', shadow: `0 12px 0 ${mix(LK.bg, '#000000', .28)}`, top: '#FFFFFF', tc, rad: 18, band: i => 'rgba(255,255,255,.16)', ball: '#FFFFFF', ground: mix(LK.bg, '#000000', .2) };
    if (nm === 'cards') return { fill: () => '#FFFFFF', edge: 'none', shadow: LK.shadow, top: BT.accent, tc, rad: 30, band: () => mix(BT.accent, '#FFFFFF', .88), ball: BT.accent, ground: 'transparent' };
    return { fill: ramp(LK.ink, mix(LK.bg, LK.ink, .55)), edge: 'none', shadow: '12px 14px 0 rgba(0,0,0,.18)', top: LK.accent, tc, rad: 0, band: () => 'rgba(255,255,255,.08)', ball: LK.ink, ground: LK.ink };
  },
  // a small cut-out figure (silhouette look), feet at 0,0
  fig: c => `<svg width="70" height="120" viewBox="-35 -120 70 120" style="overflow:visible;transform:scale(1.15);transform-origin:50% 100%"><circle cx="2" cy="-100" r="15" fill="${c}"/>
    <path d="M-14,-80 Q2,-88 18,-80 L22,-40 L13,-40 L12,-2 L3,-2 L2,-34 L0,-2 L-9,-2 L-10,-40 L-19,-40 Z" fill="${c}"/></svg>`,
  html(sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, G = this.geo(sc), n = G.length, P = this.pal(LK, n), up = LK.headCase === 'upper';
    const slabs = G.map((g, i) => { const f = P.fill(i), c = P.tc(f), num = String(i + 1).padStart(2, '0');
      const chip = nm === 'cards' ? `<div class="spC" style="position:absolute;right:28px;top:50%;margin-top:-38px;width:76px;height:76px;border-radius:22px;background:${P.band(i)};display:flex;align-items:center;justify-content:center;font:800 36px var(--head);color:${readable(BT.accent, P.band(i), 3)}" data-qa="text">${num}</div>`
        : `<div class="spN" data-qa="text" style="position:absolute;right:34px;top:50%;transform:translateY(-50%);font:800 ${g.h > 170 ? 60 : 50}px/1 var(--head);color:${c};letter-spacing:-.02em">${num}</div>`;
      return `<div id="${id}s${i}" class="k-abs" style="left:${g.x}px;top:${g.y}px;width:${g.w}px;height:${g.h - 6}px;z-index:${10 + n - i}">
        <div class="spF" style="position:absolute;inset:0;background:${f};border:${P.edge};border-radius:${P.rad}px;box-shadow:${P.shadow};overflow:hidden">
          <div style="position:absolute;left:0;right:0;top:0;height:16px;background:${P.band(i)}"></div></div>
        <div class="spL" data-qa="text" style="position:absolute;left:36px;right:${nm === 'cards' ? 130 : 140}px;top:50%;transform:translateY(-50%);font:${LK.headWeight} 52px/1.08 var(--head);color:${c};${up ? 'text-transform:uppercase;letter-spacing:.02em;' : ''}">${esc(sc.steps[i])}</div>${chip}</div>`; }).join('');
    const g0 = G[0], ground = P.ground !== 'transparent' ? `<div id="${id}gr" class="k-abs" style="left:40px;top:${g0.y + g0.h - 10}px;width:1000px;height:${nm === 'thread' ? 4 : 12}px;background:${P.ground};border-radius:6px"></div>` : '';
    const marker = nm === 'thread' ? '' : nm === 'silhouette' ? `<div id="${id}m" class="k-abs" style="z-index:50;left:-35px;top:-120px;width:70px;height:120px">${this.fig(LK.ink)}</div>`
      : `<div id="${id}m" class="k-abs" style="z-index:50;left:-28px;top:-56px;width:56px;height:56px;border-radius:50%;background:${P.ball};box-shadow:${nm === 'flat' ? `0 8px 0 ${mix(LK.bg, '#000000', .28)}` : '0 14px 26px rgba(30,20,10,.25)'}"></div>`;
    return `${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 340, w: 920, size: 92 }) : ''}${ground}${slabs}${marker}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, G = this.geo(sc), n = G.length, P = this.pal(LK, n), T = this.tm(sc, X), ts = T.ts;
    if (sc.head) X.head(`#${id}h`, X.tIn);
    const gr = X.$(`#${id}gr`);
    if (gr) tl.set(gr, { autoAlpha: 0 }, 0).set(gr, { autoAlpha: 1, scaleX: 0, transformOrigin: '0% 50%' }, X.tIn - .1).to(gr, { scaleX: 1, duration: .6, ease: 'lr.out' }, X.tIn - .1);
    const els = G.map((_, i) => X.$(`#${id}s${i}`));
    els.forEach(el => { const L = el.querySelector('.spL'); let f = parseFloat(getComputedStyle(L).fontSize);   // labels fit their step (two lines at most)
      while ((L.scrollHeight > 2.3 * f * 1.08 || L.scrollWidth > L.clientWidth + 1 || L.offsetHeight > el.offsetHeight - 24) && f > 32) { f -= 2; L.style.fontSize = f + 'px'; } });
    { const m = Math.min(...els.map(el => parseFloat(getComputedStyle(el.querySelector('.spL')).fontSize))); els.forEach(el => { el.querySelector('.spL').style.fontSize = m + 'px'; }); }
    // each block drops onto the stack and lands on its word; the blocks under it take the hit
    els.forEach((el, i) => {
      const t = ts[i], L = el.querySelector('.spL'), N = el.querySelector('.spN, .spC'), F = el.querySelector('.spF'), fall = .34;
      const drop = Math.min(340, G[i].y - (sc.head ? 500 : 330));          // from just under the headline, never across it
      tl.set(el, { autoAlpha: 0 }, 0).set(el, { autoAlpha: 1, y: -drop, rotation: i % 2 ? 2.5 : -2.5 }, t - fall)
        .to(el, { y: 0, rotation: 0, duration: fall, ease: 'power2.in' }, t - fall)
        .to(F, { scaleY: .9, scaleX: 1.015, transformOrigin: '50% 100%', duration: .08, ease: 'power2.out' }, t)
        .to(F, { scaleY: 1, scaleX: 1, duration: .3, ease: 'back.out(3)' }, t + .08);
      if (i) tl.to(els.slice(0, i), { y: 6, duration: .08, ease: 'power2.out' }, t).to(els.slice(0, i), { y: 0, duration: .25, ease: 'power2.out' }, t + .08);
      tl.set(L, { autoAlpha: 0 }, 0).set(L, { autoAlpha: 1 }, t + .06);
      tl.set(N, { autoAlpha: 0 }, 0).set(N, { autoAlpha: 1 }, t + .1);
      tl.set(L, { clipPath: 'inset(0 100% 0 0)', x: -20 }, 0).to(L, { clipPath: 'inset(0 0% 0 0)', x: 0, duration: .45, ease: 'lr.out' }, t + .08);
      tl.set(N, { scale: 0, transformOrigin: '50% 50%' }, 0).to(N, { scale: 1, duration: .4, ease: 'back.out(2)' }, t + .15);
    });
    // the marker climbs: one hop per step, after the step lands
    const spot = i => ({ x: G[i].x + 48, y: G[i].y });
    if (LK.thread) ts.forEach((t, i) => X.dot(spot(i).x, spot(i).y - 26, t + .22, { r: 22 }));
    else {
      const Mk = `#${id}m`, s0 = spot(0);
      tl.set(Mk, { autoAlpha: 0 }, 0).set(Mk, { autoAlpha: 1, x: s0.x, y: s0.y - 300 }, ts[0] + .05).to(Mk, { y: s0.y, duration: .35, ease: 'bounce.out' }, ts[0] + .05);
      for (let i = 1; i < n; i++) { const a = spot(i - 1), b = spot(i), t = ts[i] + .12, d = .46;
        tl.to(Mk, { x: b.x, duration: d, ease: 'power1.inOut' }, t)
          .to(Mk, { y: Math.min(a.y, b.y) - 110, duration: d * .5, ease: 'power2.out' }, t).to(Mk, { y: b.y, duration: d * .5, ease: 'power2.in' }, t + d * .5);
        if (nm === 'silhouette') tl.to(Mk, { rotation: 8, duration: d * .5, ease: 'power1.out' }, t).to(Mk, { rotation: 0, duration: d * .5, ease: 'power1.in' }, t + d * .5);
        else tl.to(Mk, { scaleY: .8, scaleX: 1.15, transformOrigin: '50% 100%', duration: .08 }, t + d).to(Mk, { scaleY: 1, scaleX: 1, duration: .25, ease: 'back.out(3)' }, t + d + .08);
      }
      if (nm === 'silhouette') tl.to(Mk, { rotation: -10, duration: .2, ease: 'power2.out', transformOrigin: '50% 100%' }, T.top).to(Mk, { rotation: 0, duration: .4, ease: 'back.out(3)' }, T.top + .2);   // a little salute at the top
      else tl.to(Mk, { y: '-=60', duration: .26, ease: 'power2.out' }, T.top).to(Mk, { y: '+=60', duration: .3, ease: 'bounce.out' }, T.top + .26);   // a little jump at the top
      tl.to(Mk, { autoAlpha: 0, y: '-=40', duration: .26, ease: 'lr.in' }, X.tOut);
    }
    // arrival: the top step lights up in the accent
    const top = els[n - 1], tf = top.querySelector('.spF'), tc = P.tc(P.top);
    tl.to(tf, { backgroundColor: P.top, borderColor: P.top, duration: .35, ease: 'power1.inOut' }, T.top);
    tl.to(top.querySelectorAll('.spL, .spN'), { color: tc, duration: .35, ease: 'power1.inOut' }, T.top);
    tl.fromTo(top, { scale: 1 }, { scale: 1.04, duration: .22, ease: 'power2.out', transformOrigin: '50% 100%', yoyo: true, repeat: 1, immediateRender: false }, T.top);
    // exit: the stair drops away, top step first
    els.slice().reverse().forEach((el, k) => tl.to(el, { y: 220, autoAlpha: 0, duration: .3, ease: 'lr.in' }, X.tOut + k * .03));
    if (gr) tl.to(gr, { scaleX: 0, transformOrigin: '100% 50%', duration: .3, ease: 'lr.in' }, X.tOut);
  },
};
