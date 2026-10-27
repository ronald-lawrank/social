/* road: a perspective road running to the horizon. The camera drives forward; on each spoken step a numbered road sign
   rushes up from the horizon and plants itself at the roadside (left, right, left...), the previous one flying past.
   thread: line-art road and white signs, the dot lands on each number; flat: chunky road and hills on the brand colour;
   cards: a soft UI road with floating card signs; silhouette: black road, cut-out skyline, black signs. */
SCENES.road = {
  label: 'Road signs', about: 'The camera drives down a road to the horizon; a numbered sign rises at the roadside as each step is said.',
  good: 'the road ahead, steps of a case, what happens next, the journey from crash to recovery', practice: 'any',
  fields: { head: 'optional headline above the horizon', signs: '3-4 short labels (1-4 words each), each said in the line, in order' },
  example: { say: 'Here is the road ahead. First, we review your case. Then we investigate, we build your claim, and we negotiate for you.',
    head: 'The **road ahead**', signs: ['Review your case', 'We investigate', 'Build your claim', 'We negotiate'] },
  sfx: (sc, X) => X.times(sc.signs).map((t, i) => ({ kind: i ? 'whoosh' : 'soft', at: t - .45 })).concat(X.times(sc.signs).map(t => ({ kind: 'pop', at: t + .05 }))),
  geo(sc) { const H = sc.head ? 820 : 700; return { H, F: 600, K: .42, VX: 540 }; },
  pal(LK) {
    const n = LK.name;
    if (n === 'thread') return { ground: '#FFFFFF', road: '#FFFFFF', edge: LK.line, ew: LK.stroke, dash: LK.fillC, hillA: '#FFFFFF', hillB: '#FFFFFF', hillEdge: LK.soft,
      band: null, sun: mix(BT.accent, '#FFFFFF', .82), post: LK.line, refl: LK.fillC, panel: '#FFFFFF', panelInk: LK.ink, badge: BT.accent };
    if (n === 'flat') return { ground: mix(LK.bg, '#FFFFFF', .16), road: LK.fillB, edge: null, ew: 0, dash: '#FFFFFF', hillA: mix(LK.bg, '#000000', .12), hillB: mix(LK.bg, '#FFFFFF', .3), hillEdge: null,
      band: mix(LK.bg, '#FFFFFF', .22), sun: mix(LK.bg, '#FFFFFF', .55), post: LK.fillB, refl: '#FFFFFF', panel: '#FFFFFF', panelInk: BT.ink, badge: LK.fillB };
    if (n === 'cards') return { ground: mix(LK.bg, '#FFFFFF', .55), road: mix(BT.ink, '#FFFFFF', .74), edge: '#FFFFFF', ew: 10, dash: '#FFFFFF', hillA: mix(LK.bg, '#FFFFFF', .35), hillB: mix(LK.bg, BT.accent, .12), hillEdge: null,
      band: mix(LK.bg, '#FFFFFF', .7), sun: '#FFFFFF', post: mix(BT.ink, '#FFFFFF', .55), refl: mix(BT.ink, '#FFFFFF', .6), panel: '#FFFFFF', panelInk: BT.ink, badge: BT.accent };
    return { ground: LK.surface, road: LK.ink, edge: null, ew: 0, dash: LK.surface, hillA: LK.ink, hillB: LK.fillB, hillEdge: null,
      band: mix(LK.surface, LK.ink, .07), sun: LK.accent, post: LK.ink, refl: LK.ink, panel: LK.ink, panelInk: '#F8F6F1', badge: LK.accent };
  },
  // the world, seen from a camera that has travelled c units: centre dashes and roadside reflector posts
  world(G, c) {
    const { H, F, K, VX } = G, y = z => H + F / z, P = .7, out = [], posts = [], bands = [];
    for (let k = 0; k < 90; k++) {
      const z0 = (k + 1) * P - (c % P), z1 = z0 + P * .5; if (z0 < .3 || z0 > 50) continue;
      const ya = Math.min(2100, y(z0)), yb = y(z1), wa = (ya - H) * .024, wb = (yb - H) * .024;
      out.push(`M${VX - wa},${ya.toFixed(1)}L${VX + wa},${ya.toFixed(1)}L${VX + wb},${yb.toFixed(1)}L${VX - wb},${yb.toFixed(1)}Z`);
    }
    const B = 1.4;
    for (let k = 0; k < 60; k++) {
      const z0 = (k + 1) * B - ((c + .3) % B), z1 = z0 + B * .5; if (z0 < .25 || z0 > 45) continue;
      bands.push(`M-20,${Math.min(2100, y(z0)).toFixed(1)}H1100V${y(z1).toFixed(1)}H-20Z`);
    }
    const Q = 2.2;
    for (let k = 0; k < 30; k++) {
      const z = (k + 1) * Q - ((c + .7) % Q); if (z < .5 || z > 40) continue;
      const yy = y(z), off = (yy - H) * K * 1.25, h = (yy - H) * .085, w = Math.max(1.5, (yy - H) * .01);
      [VX - off, VX + off].forEach(x => posts.push(`M${(x - w).toFixed(1)},${yy.toFixed(1)}h${(2 * w).toFixed(1)}v${(-h).toFixed(1)}h${(-2 * w).toFixed(1)}Z`));
    }
    return { dash: out.join(''), posts: posts.join(''), bands: bands.join('') };
  },
  html(sc, X) {
    const LK = X.LK, n = LK.name, G = this.geo(sc), P = this.pal(LK), id = X.id, { H, K, VX } = G;
    const yb = 1960, hw = (yb - H) * K, road = `M${VX - 2},${H} L${VX + 2},${H} L${VX + hw},${yb} L${VX - hw},${yb}Z`;
    const edges = P.edge ? `<path d="M${VX - 1},${H} L${VX - hw},${yb} M${VX + 1},${H} L${VX + hw},${yb}" stroke="${P.edge}" stroke-width="${P.ew}" fill="none"/>` : '';
    const hills = n === 'silhouette'
      ? (() => { const r = seeded(5); let d = `M-20,${H}`; for (let x = -20; x < 1100; x += 34 + r() * 40) { const tall = r() < .45 ? 40 + r() * 90 : 14 + r() * 26; d += `V${(H - tall).toFixed(0)}h${(26 + r() * 30).toFixed(0)}V${H}`; } return `<path d="${d}V${H + 2}H-20Z" fill="${P.hillA}"/>`; })()
      : `<path d="M-40,${H} C120,${H - 90} 260,${H - 120} 420,${H - 40} C470,${H - 16} 500,${H} 540,${H} Z" fill="${P.hillB}" ${P.hillEdge ? `stroke="${P.hillEdge}" stroke-width="5"` : ''}/>
         <path d="M1120,${H} C980,${H - 150} 800,${H - 150} 660,${H - 50} C610,${H - 18} 580,${H} 540,${H} Z" fill="${P.hillA}" ${P.hillEdge ? `stroke="${P.hillEdge}" stroke-width="5"` : ''}/>`;
    const sun = n === 'thread' ? `<circle cx="790" cy="${H - 150}" r="74" fill="${P.sun}"/>` : n === 'silhouette' ? `<circle cx="780" cy="${H - 150}" r="80" fill="${P.sun}"/>` : `<circle cx="790" cy="${H - 150}" r="86" fill="${P.sun}" opacity="${n === 'cards' ? .9 : 1}"/>`;
    const groundTop = n === 'thread' ? `<line x1="-20" y1="${H}" x2="1100" y2="${H}" stroke="${LK.soft}" stroke-width="5"/>` : '';
    const signs = sc.signs.map((s, i) => this.sign(sc, X, P, i, s)).join('');
    return `<svg class="svgL" viewBox="0 0 1080 1920"><g id="${id}scape">${sun}
        <rect x="-20" y="${H}" width="1120" height="${1960 - H}" fill="${P.ground}"/><path id="${id}bands" d="" ${P.band ? `fill="${P.band}"` : `fill="none" stroke="${LK.soft}" stroke-width="3"`}/>${hills}${groundTop}
        <path d="${road}" fill="${P.road}"/>${edges}
        <path id="${id}posts" fill="${P.refl}" d=""/><path id="${id}dash" fill="${P.dash}" d=""/></g></svg>
      ${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 340, w: 920, size: 88, align: 'center' }) : ''}${signs}`;
  },
  spot(sc, i) {            // where sign i stands: its foot, alternating sides
    const L = i % 2 === 0, G = this.geo(sc);
    return { L, fx: L ? 190 : 890, fy: Math.min(1540, G.H + 700), px: L ? 372 : 708 };
  },
  sign(sc, X, P, i, label) {
    const LK = X.LK, n = LK.name, S = this.spot(sc, i), W = 600, Hh = 470, left = S.px - W / 2, top = S.fy - Hh, footX = S.fx - left;
    const dark = n === 'silhouette', badgeTx = contrast('#FFFFFF', P.badge) >= 3 ? '#FFFFFF' : BT.ink;
    const shadow = n === 'cards' ? LK.shadow : n === 'flat' ? `0 12px 0 ${mix(LK.bg, '#000000', .25)}` : n === 'silhouette' ? '12px 14px 0 rgba(0,0,0,.18)' : '0 18px 40px rgba(20,24,28,.12)';
    const legs = [footX - 20, footX + 20].map(x => `<rect x="${x - 7}" y="250" width="14" height="${Hh - 250}" rx="${n === 'silhouette' ? 0 : 5}" fill="${P.post}"/>`).join('');
    return `<div id="${X.id}s${i}" class="k-abs" style="left:${left}px;top:${top}px;width:${W}px;height:${Hh}px">
      <svg width="${W}" height="${Hh}" style="position:absolute;left:0;top:0;overflow:visible">${legs}${n === 'thread' ? `<ellipse cx="${footX}" cy="${Hh}" rx="60" ry="10" fill="${LK.soft}"/>` : ''}</svg>
      <div class="rdp" data-qa="text" style="position:absolute;left:0;right:0;bottom:${Hh - 270}px;padding:26px 30px;display:flex;align-items:center;gap:24px;background:${P.panel};
        border-radius:${n === 'silhouette' ? 0 : n === 'flat' ? 24 : 26}px;box-shadow:${shadow};${n === 'thread' ? `border:${LK.stroke - 2}px solid ${LK.line};` : ''}">
        <div class="rdb" style="flex:none;width:92px;height:92px;border-radius:${n === 'silhouette' ? 0 : 50}%;background:${P.badge};color:${badgeTx};display:flex;align-items:center;justify-content:center;font:800 44px var(--head)">${i + 1}</div>
        <div style="font:${LK.headWeight} ${label.length > 18 ? 46 : 54}px/1.08 var(--head);color:${dark ? '#F8F6F1' : P.panelInk};${LK.headCase === 'upper' ? 'text-transform:uppercase;' : ''}">${accentize(label, 'ka')}</div></div></div>`;
  },
  build(tl, sc, X) {
    const LK = X.LK, G = this.geo(sc), id = X.id, ts = X.times(sc.signs), self = this;
    if (sc.head) X.head(`#${id}h`, X.tIn);
    const scape = X.q(`#${id}scape`), dash = X.$(`#${id}dash`), posts = X.$(`#${id}posts`), bands = X.$(`#${id}bands`);
    tl.set(scape, { autoAlpha: 0 }, 0).set(scape, { autoAlpha: 1, y: 60 }, X.tIn - .2).to(scape, { y: 0, duration: .6, ease: 'lr.out' }, X.tIn - .2);
    // the camera: a slow creep, a surge before each sign. Every tween is fromTo with explicit values (seek-safe)
    const cam = { c: 0 }, draw = () => { const w = self.world(G, cam.c); dash.setAttribute('d', w.dash); posts.setAttribute('d', w.posts); bands.setAttribute('d', w.bands); };
    draw();
    let c = 0, t = X.tIn - .2;
    ts.forEach((ti, i) => {
      const s0 = Math.max(t, ti - .6);
      if (s0 > t) { tl.fromTo(cam, { c }, { c: c + (s0 - t) * .7, duration: s0 - t, ease: 'none', onUpdate: draw, immediateRender: false }, t); c += (s0 - t) * .7; }
      const d = ti + .12 - s0; tl.fromTo(cam, { c }, { c: c + 2.6, duration: d, ease: 'lr.move', onUpdate: draw, immediateRender: false }, s0); c += 2.6; t = s0 + d;
    });
    if (X.tOut + .4 > t) tl.fromTo(cam, { c }, { c: c + (X.tOut + .4 - t) * .7, duration: X.tOut + .4 - t, ease: 'none', onUpdate: draw, immediateRender: false }, t);
    // the signs: rush up from the horizon on the surge, plant at the roadside, fly past when the next one comes
    ts.forEach((ti, i) => {
      const S = this.spot(sc, i), el = X.q(`#${id}s${i}`), node = X.$(`#${id}s${i}`), W = 600, footX = S.fx - (S.px - W / 2);
      const sx = (G.VX + (S.L ? -30 : 30)) - S.fx, sy = (G.H + 14) - S.fy, a = Math.max(X.tIn, ti - .55);
      tl.set(el, { autoAlpha: 0 }, 0).set(el, { autoAlpha: 1, x: sx, y: sy, scale: .06, transformOrigin: `${footX}px 470px` }, a)
        .to(el, { x: 0, y: 0, scale: 1, duration: ti + .12 - a, ease: 'power3.in' }, a)
        .to(el, { keyframes: [{ scaleY: .92, scaleX: 1.04, duration: .08, ease: 'power2.out' }, { scaleY: 1, scaleX: 1, duration: .45, ease: 'elastic.out(1,.5)' }] }, ti + .12);
      const next = ts[i + 1];
      if (next != null) {
        const go = next - .6;
        tl.to(el, { scale: 1.06, duration: Math.max(.1, go - ti - .7), ease: 'sine.inOut' }, ti + .7);
        tl.to(el, { x: S.L ? -520 : 520, y: 420, scale: 2.2, duration: .62, ease: 'power2.in' }, go).to(el, { autoAlpha: 0, duration: .2, ease: 'power2.out' }, go + .06);
      } else {
        tl.to(el, { scale: 1.05, duration: Math.max(.2, X.tOut - ti - .6), ease: 'sine.inOut' }, ti + .6);
        tl.to(el, { autoAlpha: 0, y: 40, duration: .28, ease: 'lr.in' }, X.tOut);
      }
      if (LK.thread) { const b = node.querySelector('.rdb'), pn = node.querySelector('.rdp');
        X.dot(node.offsetLeft + pn.offsetLeft + pn.offsetWidth + 34, node.offsetTop + pn.offsetTop + pn.offsetHeight / 2, ti + .2, { r: 16 }); }
    });
    tl.to(scape, { autoAlpha: 0, duration: .3, ease: 'lr.in' }, X.tOut + .05);
  },
};
