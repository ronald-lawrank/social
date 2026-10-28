/* donut: a ring chart whose segments sweep in one per spoken item, each with a swatch and label in a legend below;
   the centre holds a word or an icon, and small geometric accents orbit the ring. It shows proportions qualitatively
   ("three things shape a claim"); sizes come from optional weights (equal by default), never money or results.
   thread: slim line-art ring with hairline guides, the dot lands at the end of each segment; flat: a chunky ring with a
   hard drop shadow on the brand colour; cards: the chart on a white UI card with a slider knob riding the sweep;
   silhouette: black, accent and hatched paper segments with a hard offset shadow. */
const DNT = {
  rad: a => a * Math.PI / 180,
  pt(cx, cy, r, a) { return [cx + r * Math.cos(DNT.rad(a)), cy + r * Math.sin(DNT.rad(a))]; },
  arc(cx, cy, r, a0, a1) {
    const [x0, y0] = DNT.pt(cx, cy, r, a0), [x1, y1] = DNT.pt(cx, cy, r, a1);
    return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
  },
  items(sc) { return (sc.items || []).slice(0, 5).map(it => typeof it === 'string' ? { label: it } : it); },
  hlines(text, LK, size = 84, w = 920) {   // rough line count of a headline, to place things under it
    const per = Math.max(6, Math.floor(w / (size * (LK.headCase === 'upper' ? .7 : .58)))), ws = String(text || '').replace(/\*\*/g, '').split(/\s+/);
    let lines = 1, cur = 0; ws.forEach(x => { if (cur && cur + 1 + x.length > per) { lines++; cur = x.length; } else cur += (cur ? 1 : 0) + x.length; }); return lines;
  },
  geo(sc, LK) {
    const its = DNT.items(sc), n = its.length, head = !!sc.head, hb = head ? 330 + DNT.hlines(sc.head, LK) * 84 * 1.08 : 0;
    const tot = its.reduce((s, it) => s + Math.max(.2, +it.weight || 1), 0), gap = n > 1 ? 4 : 0;
    let a = -90; const segs = its.map(it => { const span = 360 * Math.max(.2, +it.weight || 1) / tot, s = { a0: a + gap / 2, a1: a + span - gap / 2, am: a + span / 2 }; a += span; return s; });
    const len = Math.max(...its.map(it => String(it.label).replace(/\*\*/g, '').length));
    const rowH = n > 4 ? 66 : n > 3 ? 70 : 76, lfs = len > 26 ? 40 : 46, lw = Math.min(880, len * lfs * .6 + 96);
    // the legend sits at the bottom of the safe area; the ring takes the room above it (radius R to the stroke centre)
    const ly = 1548 - n * rowH, top = head ? Math.max(560, hb + 60) : 420, R = Math.round(Math.min(262, (ly - 70 - top - 170) / 2)), cy = Math.round(top + R + 110);
    return { n, cx: 540, cy, R, segs, ly, rowH, lfs, lx: 540 - lw / 2, lw };
  },
  thick(LK, R) { return Math.round(DNT.pal(LK).T * Math.min(1, R / 240)); },   // the ring's stroke, slimmer on a small ring
  pal(LK) {
    const n = LK.name, A = BT.accent, I = BT.ink;
    if (n === 'thread') return { T: 62, cap: 'round', segs: [A, LK.ink, mix(A, '#FFFFFF', .5), LK.fillC, mix(A, LK.ink, .55)], track: LK.soft, guide: LK.soft,
      ink: LK.ink, hole: 'none', knob: null, orb: [A, LK.line, mix(A, '#FFFFFF', .45), LK.fillC, LK.line], orbLine: true };
    if (n === 'flat') return { T: 118, cap: 'butt', segs: ['#FFFFFF', LK.fillB, LK.fillC, mix(LK.fillB, '#000000', .35), mix(LK.bg, '#FFFFFF', .78)], track: mix(LK.bg, '#000000', .16),
      ink: LK.ink, hole: 'none', shadow: mix(LK.bg, '#000000', .25), knob: ['#FFFFFF', LK.fillB], orb: ['#FFFFFF', LK.fillB, LK.fillC, '#FFFFFF', LK.fillB] };
    if (n === 'cards') return { T: 104, cap: 'butt', segs: [A, I, mix(A, '#FFFFFF', .55), mix(I, '#FFFFFF', .62), mix(A, '#FFB25B', .5)], track: LK.soft,
      ink: LK.surfaceInk, hole: 'none', knob: ['#FFFFFF', mix(I, '#FFFFFF', .85)], orb: [A, mix(A, '#FFFFFF', .55), I, mix(A, '#FFB25B', .5), mix(I, '#FFFFFF', .6)] };
    return { T: 112, cap: 'butt', segs: [LK.ink, LK.accent, 'url(#HATCH)', mix(LK.bg, LK.ink, .4), mix(LK.accent, LK.ink, .5)], track: LK.fillC,
      ink: LK.ink, hole: 'none', shadow: 'rgba(0,0,0,.14)', knob: [LK.surface, LK.ink], orb: [LK.ink, LK.accent, LK.ink, LK.fillB, LK.accent] };
  },
  orbiters(cx, cy, R, P, id) {     // small playful shapes on a slow orbit around the ring
    const spec = [[18, 96, 'circle', 22], [92, 112, 'tri', 30], [158, 92, 'plus', 26], [226, 108, 'ring', 22], [300, 100, 'square', 24], [250, 78, 'circle', 12], [128, 80, 'circle', 10]];
    return spec.map(([a, r, k, s], i) => {
      const [x, y] = DNT.pt(cx, cy, R + r, a), c = P.orb[i % P.orb.length], line = P.orbLine && (k === 'ring' || k === 'plus' || k === 'tri');
      const fill = line ? `fill="none" stroke="${c}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"` : `fill="${c}"`;
      let el;
      if (k === 'circle') el = `<circle cx="${x}" cy="${y}" r="${s}" ${fill}/>`;
      else if (k === 'ring') el = `<circle cx="${x}" cy="${y}" r="${s}" fill="none" stroke="${c}" stroke-width="10"/>`;
      else if (k === 'square') el = `<rect x="${x - s}" y="${y - s}" width="${2 * s}" height="${2 * s}" rx="${P.cap === 'round' ? 6 : 4}" ${fill} transform="rotate(20 ${x} ${y})"/>`;
      else if (k === 'tri') el = `<path d="M${x},${y - s} L${x + s * .9},${y + s * .6} L${x - s * .9},${y + s * .6}Z" ${fill}/>`;
      else el = `<path d="M${x - s},${y} H${x + s} M${x},${y - s} V${y + s}" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="${P.cap === 'round' ? 'round' : 'butt'}"/>`;
      return `<g class="dno" data-x="${x.toFixed(1)}" data-y="${y.toFixed(1)}">${el}</g>`;
    }).join('');
  },
};
SCENES.donut = {
  label: 'Donut chart', about: 'A ring chart sweeps in one segment per spoken item, each with a swatch and label; the centre holds a word or icon.',
  good: 'what shapes a claim, the parts of a process, what we look at: proportions shown qualitatively (never money, odds or results)', practice: 'any',
  fields: { head: 'optional headline above (2-6 words; **phrase** = accent)', center: 'optional short word for the centre (1-2 words), or use icon',
    icon: 'optional centre icon instead of a word (scale shield users doc heart home briefcase clock)',
    items: '2-5 items, each a string or {label, weight}; each label said in the line, in order (2-5 words). weight sizes the segment (default 1: equal); it is a rough emphasis, never a percentage' },
  example: { say: 'Three things shape an injury claim: how it happened, the care you needed, and how it changed your life.',
    head: 'What shapes a **claim**', icon: 'scale', items: [{ label: 'How it happened' }, { label: 'The care you needed' }, { label: 'How it changed your life' }] },
  sfx: (sc, X) => [{ kind: 'soft', at: X.tIn }, ...X.times(DNT.items(sc).map(it => it.label)).map(t => ({ kind: 'pop', at: t + .1 }))],
  html(sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, G = DNT.geo(sc, X.LK), P = DNT.pal(LK), its = DNT.items(sc), { cx, cy, R } = G, T = DNT.thick(LK, R), up = LK.headCase === 'upper';
    const segs = G.segs.map((s, i) => `<path class="dns" d="${DNT.arc(cx, cy, R, s.a0, s.a1)}" fill="none" stroke="${P.segs[i % P.segs.length].replace('HATCH', id + 'hatch')}" stroke-width="${T}" stroke-linecap="${P.cap}"/>`).join('');
    const shadow = P.shadow ? G.segs.map(s => `<path class="dnsh" d="${DNT.arc(cx, cy, R, s.a0, s.a1)}" fill="none" stroke="${P.shadow}" stroke-width="${T}"/>`).join('') : '';
    const guides = nm === 'thread' ? `<circle id="${id}g1" cx="${cx}" cy="${cy}" r="${R + T / 2 + 22}" fill="none" stroke="${P.guide}" stroke-width="3" stroke-dasharray="2 14" stroke-linecap="round"/>
        <circle id="${id}g2" cx="${cx}" cy="${cy}" r="${R - T / 2 - 22}" fill="none" stroke="${P.guide}" stroke-width="3"/>` : '';
    const track = `<circle id="${id}tr" cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${P.track}" stroke-width="${nm === 'thread' ? 6 : Math.round(T * .34)}"/>`;
    const knob = P.knob ? `<g id="${id}kn"><circle cx="${cx + R}" cy="${cy}" r="${T / 2 - 14}" fill="${P.knob[0]}" stroke="${P.knob[1]}" stroke-width="8" ${nm === 'cards' ? `filter="url(#${id}ks)"` : ''}/></g>` : '';
    // the centre: an icon, or a word fitted inside the hole
    const hole = 2 * (R - T / 2) - (nm === 'thread' ? 90 : 60);
    let centre = '';
    if (sc.icon || !sc.center) {
      const ic = sc.icon || 'scale', isz = Math.round(hole * (nm === 'silhouette' ? .5 : .62)), hs = nm === 'silhouette' ? Math.round(hole * .74) : hole, discBg = nm === 'thread' ? mix(BT.accent, '#FFFFFF', .88) : nm === 'flat' ? '#FFFFFF' : nm === 'cards' ? mix(BT.accent, '#FFFFFF', .88) : LK.ink;
      const icC = nm === 'silhouette' ? LK.surface : nm === 'flat' ? LK.fillB : BT.ink, icA = nm === 'silhouette' ? readable(BT.accent, LK.ink, 3) : nm === 'flat' ? LK.fillB : BT.accent;
      centre = `<div id="${id}cc" class="k-abs" style="left:${cx - hs / 2}px;top:${cy - hs / 2}px;width:${hs}px;height:${hs}px;box-shadow:${nm === 'silhouette' ? LK.shadow : 'none'};border-radius:${nm === 'silhouette' ? 0 : 50}%;
        background:${discBg};display:flex;align-items:center;justify-content:center">${icon(ic, isz, icC, icA)}</div>`;
    } else {
      const words = String(sc.center).split(/\s+/), longest = Math.max(...words.map(w => w.length)), fs = Math.round(Math.max(40, Math.min(86, hole / (longest * .64))));
      centre = `<div id="${id}cc" class="k-abs" data-qa="text" style="left:${cx - hole / 2}px;top:${cy - hole / 2}px;width:${hole}px;height:${hole}px;display:flex;align-items:center;justify-content:center;
        text-align:center;font:${LK.headWeight} ${fs}px/1.02 var(--head);color:${P.ink};${up ? 'text-transform:uppercase;' : ''}--acc:${nm === 'cards' ? readable(BT.accent, '#FFFFFF', 3) : LK.accentText}">${accentize(sc.center, 'ka')}</div>`;
    }
    const sw = (i) => { const c = P.segs[i % P.segs.length];
      if (c === 'url(#HATCH)') return `<svg class="dnw" width="46" height="46" viewBox="0 0 46 46" style="flex:none"><rect x="3" y="3" width="40" height="40" fill="url(#${id}hatch)" stroke="${LK.ink}" stroke-width="5"/></svg>`;
      const r = nm === 'silhouette' ? 0 : nm === 'flat' ? 12 : 23, edge = nm === 'flat' ? `box-shadow:0 6px 0 ${P.shadow};` : '';
      return `<div class="dnw" style="flex:none;width:46px;height:46px;border-radius:${r}px;background:${c};${edge}"></div>`; };
    const rows = its.map((it, i) => `<div class="dnr k-abs" style="left:${G.lx}px;top:${G.ly + i * G.rowH}px;width:${G.lw}px;height:${G.rowH - 12}px;display:flex;align-items:center;gap:30px">
        ${sw(i)}<div class="dnl" data-qa="text" style="font:${nm === 'thread' ? 600 : 700} ${G.lfs}px/1.1 var(--${nm === 'silhouette' ? 'head' : 'body'});color:${P.ink};white-space:nowrap;
        ${up ? 'text-transform:uppercase;letter-spacing:.03em;' : ''}--acc:${nm === 'cards' ? readable(BT.accent, '#FFFFFF', 3) : LK.accentText}">${accentize(it.label, 'ka')}</div></div>`).join('');
    const legendBottom = G.ly + its.length * G.rowH;
    const cTop = cy - R - 150, card = nm === 'cards' ? UI.card(LK, { id: id + 'card', x: 60, y: cTop, w: 960, h: legendBottom - cTop + 40 }) : '';
    return `${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 330, w: 920, size: 84, align: 'center' }) : ''}${card}
      <svg class="svgL" viewBox="0 0 1080 1920"><defs>
        <pattern id="${id}hatch" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="18" height="18" fill="${LK.surface}"/><rect width="8" height="18" fill="${LK.ink}"/></pattern>
        <filter id="${id}ks" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#1E140A" flood-opacity=".25"/></filter></defs>
        <g id="${id}orb">${DNT.orbiters(cx, cy, R, P, id)}</g>
        <g id="${id}ring">${guides}${track}<g id="${id}shd" transform="translate(${nm === 'flat' ? '0 14' : '14 16'})">${shadow}</g>${segs}${knob}</g></svg>
      ${centre}${rows}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, G = DNT.geo(sc, X.LK), its = DNT.items(sc), q = s => X.q(s), { cx, cy, R } = G, og = `${cx} ${cy}`;
    const ts = X.times(its.map(it => it.label)), node = X.$(`#${id}ring`).ownerSVGElement;
    if (sc.head) X.head(`#${id}h`, X.tIn);
    const a = X.tIn - .1;
    if (nm === 'cards') { const C = q(`#${id}card`); tl.set(C, { autoAlpha: 0 }, 0).set(C, { autoAlpha: 1, y: 140, rotation: -1.5 }, a - .05).to(C, { y: 0, rotation: 0, duration: .6, ease: 'lr.out' }, a - .05);
      tl.to(C, { autoAlpha: 0, y: -60, duration: .3, ease: 'lr.in' }, X.tOut); }
    // the empty track draws round, the centre pops in
    const ring = q(`#${id}ring`), tr = q(`#${id}tr`);
    tl.set(ring, { autoAlpha: 0 }, 0).set(ring, { autoAlpha: 1 }, a);
    tl.fromTo(ring, { scale: .82, rotation: -30, svgOrigin: og }, { scale: 1, rotation: 0, svgOrigin: og, duration: .7, ease: 'lr.out', immediateRender: true }, a);
    tl.fromTo(tr, { drawSVG: '0%' }, { drawSVG: '100%', duration: .7, ease: 'power2.inOut', immediateRender: true }, a);
    if (nm === 'thread') tl.fromTo([q(`#${id}g1`), q(`#${id}g2`)], { drawSVG: '0%' }, { drawSVG: '100%', duration: .9, ease: 'power2.inOut', stagger: .1, immediateRender: true }, a + .1);
    const cc = q(`#${id}cc`);
    tl.set(cc, { autoAlpha: 0 }, 0).set(cc, { autoAlpha: 1, scale: .4, rotation: -10 }, a + .25).to(cc, { scale: 1, rotation: 0, duration: .5, ease: 'back.out(1.8)' }, a + .25);
    tl.to(cc, { scale: 1.04, duration: Math.max(.6, X.tOut - a - 1), ease: 'sine.inOut' }, a + .8);
    // segments sweep on their words; a knob (or the thread dot) rides the leading edge
    const segs = [...node.querySelectorAll('.dns')], shd = [...node.querySelectorAll('.dnsh')], rows = [...node.closest('.scn').querySelectorAll('.dnr')];
    const kn = q(`#${id}kn`);
    if (X.$(`#${id}kn`)) tl.set(kn, { autoAlpha: 0, rotation: -90, svgOrigin: og }, 0);
    segs.forEach((s, i) => {
      const g = G.segs[i], t = ts[i], d = Math.max(.35, Math.min(.65, (ts[i + 1] ?? X.tOut) - t - .1));
      tl.set(s, { autoAlpha: 0, drawSVG: '0%' }, 0).set(s, { autoAlpha: 1 }, t - .05).to(s, { drawSVG: '100%', duration: d, ease: 'power2.inOut' }, t - .05);
      if (shd[i]) tl.set(shd[i], { autoAlpha: 0, drawSVG: '0%' }, 0).set(shd[i], { autoAlpha: 1 }, t - .05).to(shd[i], { drawSVG: '100%', duration: d, ease: 'power2.inOut' }, t - .05);
      if (X.$(`#${id}kn`)) { if (i === 0) tl.set(kn, { autoAlpha: 1, rotation: g.a0, svgOrigin: og }, t - .05);
        tl.to(kn, { rotation: g.a1, svgOrigin: og, duration: d, ease: 'power2.inOut' }, t - .05); }
      if (LK.thread) { const [x, y] = DNT.pt(cx, cy, R + DNT.thick(LK, R) / 2 + 22, g.a1); X.dot(x, y, t - .05 + d, { r: 16 }); }
      // the newest segment eases out from the ring while it is talked about, and back in when the next one starts
      const [px, py] = DNT.pt(0, 0, nm === 'thread' ? 12 : 18, g.am), back = i + 1 < ts.length ? ts[i + 1] - .05 : Math.min(X.tOut - .4, t + 2);
      const pair = shd[i] ? [s, shd[i]] : [s];
      tl.to(pair, { x: px, y: py, duration: .4, ease: 'lr.out' }, t - .05 + d * .6);
      if (back > t + d + .2) tl.to(pair, { x: 0, y: 0, duration: .4, ease: 'lr.move' }, back);
      // the segment's label rises into the legend, its swatch pops
      const row = rows[i], sw = row.querySelector('.dnw'), lab = row.querySelector('.dnl');
      tl.set(row, { autoAlpha: 0 }, 0).set(row, { autoAlpha: 1, x: -50 }, t).to(row, { x: 0, duration: .45, ease: 'lr.out' }, t);
      tl.fromTo(sw, { scale: 0, rotation: -45 }, { scale: 1, rotation: 0, duration: .4, ease: 'back.out(2.2)', immediateRender: true }, t + .05);
      void lab;
    });
    // a slow turn while it holds; the orbiters pop in and drift round
    const tLast = ts[ts.length - 1] + .7;
    tl.to(ring, { rotation: 6, svgOrigin: og, duration: Math.max(.5, X.tOut - tLast), ease: 'sine.inOut' }, tLast);
    const orb = q(`#${id}orb`), os = [...X.$(`#${id}orb`).querySelectorAll('.dno')];
    tl.set(orb, { autoAlpha: 0 }, 0).set(orb, { autoAlpha: 1 }, a + .2);
    os.forEach((o, i) => { const ox = o.dataset.x, oy = o.dataset.y;
      tl.fromTo(o, { scale: 0, svgOrigin: `${ox} ${oy}` }, { scale: 1, svgOrigin: `${ox} ${oy}`, duration: .45, ease: 'back.out(2.4)', immediateRender: true }, a + .3 + i * .07);
      tl.to(o, { rotation: (i % 2 ? -1 : 1) * 160, svgOrigin: `${ox} ${oy}`, duration: X.tOut - a, ease: 'none' }, a + .75); });
    tl.fromTo(orb, { rotation: -20, svgOrigin: og }, { rotation: 34, svgOrigin: og, duration: X.t1 - a, ease: 'none', immediateRender: true }, a);
    // exit
    tl.to(rows, { autoAlpha: 0, y: -30, duration: .26, ease: 'lr.in', stagger: .03 }, X.tOut);
    tl.to(cc, { autoAlpha: 0, scale: .6, duration: .26, ease: 'lr.in' }, X.tOut);
    tl.to([ring, orb], { autoAlpha: 0, scale: .94, svgOrigin: og, duration: .3, ease: 'lr.in' }, X.tOut);
  },
};
