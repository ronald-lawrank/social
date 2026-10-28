/* orbit: the client (or the firm) at the centre, with 3-6 satellite bubbles (icon + short label) that fly out along
   their spokes as each is named and then orbit slowly on an ellipse, labels always upright. The layout is solved up
   front: the start angle is chosen so no label ever meets another label, a bubble, the centre or the safe-area edge at
   any point of the orbit. thread: line-art bubbles, dashed spokes, the dot lands on the centre; flat: white bubbles with
   hard shadows on the brand colour; cards: white UI bubbles and label chips with soft shadows; silhouette: black
   cut-out bubbles, ink spokes and uppercase labels with offset shadows. */
const ORB = {
  hlines(text, LK, size = 84, w = 920) {
    const per = Math.max(6, Math.floor(w / (size * (LK.headCase === 'upper' ? .7 : .58)))), ws = String(text || '').replace(/\*\*/g, '').split(/\s+/);
    let lines = 1, cur = 0; ws.forEach(x => { if (cur && cur + 1 + x.length > per) { lines++; cur = x.length; } else cur += (cur ? 1 : 0) + x.length; }); return lines;
  },
  items(sc) { return (sc.items || []).slice(0, 6).map(it => typeof it === 'string' ? { label: it, icon: 'check' } : it); },
  geo(sc, LK) {
    const its = ORB.items(sc), n = its.length, up = LK.headCase === 'upper', chip = LK.name === 'cards';
    const fs = up ? (n > 5 ? 30 : n > 4 ? 32 : 34) : n > 5 ? 35 : n > 4 ? 38 : 42, rb = n > 5 ? 66 : n > 4 ? 74 : 82, cw = up ? .74 : .62, LW = 300;
    const pad = chip ? 40 : 8, cwPx = fs * cw, maxC = LW - pad;
    const labs = its.map(it => {   // greedy word wrap with an estimated glyph width, so the solver knows each label's real box
      const ws = String(it.label).replace(/\*\*/g, '').split(/\s+/), rows = [];
      ws.forEach(w => { const last = rows[rows.length - 1]; if (last && (last.length + 1 + w.length) * cwPx <= maxC) rows[rows.length - 1] = last + ' ' + w; else rows.push(w); });
      return { w: Math.min(LW, Math.max(...rows.map(r => r.length)) * cwPx + pad + 6), h: rows.length * fs * 1.12 + (chip ? 20 : 0), lines: rows.length }; });
    const lh = Math.max(...labs.map(l => l.h)), hb = sc.head ? 330 + ORB.hlines(sc.head, LK) * 84 * 1.08 : 300, top = sc.head ? hb + 36 : 380;
    const Ry = Math.round(Math.min(430, (1555 - top - 2 * rb - 14 - lh) / 2)), cx = 540, cy = Math.round(top + rb + Ry);
    const Rc = Math.round(Math.min(132, Ry * .36)), gap = rb + 14;
    // solve the layout: for each orbit width, sweep and start angle, score every sampled moment of the orbit (labels in
    // the safe area, never on another label, a bubble or the centre); keep the cleanest, then the widest sweep, the
    // narrowest orbit and the most symmetric start
    const hit = (p, q, pad = 10) => p[0] < q[2] + pad && q[0] < p[2] + pad && p[1] < q[3] + pad && q[1] < p[3] + pad;
    const C = [cx - Rc - 6, cy - Rc - 6, cx + Rc + 6, cy + Rc + 6];
    const score = (a0, Rx, sweep) => { let bad = 0;
      const box = (a, i) => { const x = cx + Rx * Math.cos(a * Math.PI / 180), y = cy + Ry * Math.sin(a * Math.PI / 180), L = labs[i];
        return { b: [x - rb, y - rb, x + rb, y + rb], l: [x - L.w / 2, y + gap, x + L.w / 2, y + gap + L.h] }; };
      for (let k = 0; k <= 4; k++) { const off = sweep * k / 4, B = its.map((_, i) => box(a0 + off + i * 360 / n, i));
        B.forEach((p, i) => { if (p.l[0] < 70 || p.l[2] > 1010 || p.l[3] > 1560 || p.b[1] < top - 4) bad += 10; if (hit(p.l, C)) bad += 5;
          B.forEach((o, j) => { if (j <= i) return; if (hit(p.l, o.l, 14)) bad += 10; if (hit(p.b, o.b, 8)) bad += 6; });
          B.forEach((o, j) => { if (j !== i && hit(p.l, o.b, 6)) bad += 3; }); }); }
      return bad; };
    let best = null;
    for (const sweep of [16, 8, 0]) for (const Rx of [310, 335, 360]) for (let s = 0; s < 360 / n; s += 2) {
      const a0 = -90 - sweep / 2 + s, v = score(a0, Rx, sweep), sym = Math.min(s, 360 / n - s);
      if (!best || v < best.v) best = { a0, v, sym, Rx, sweep };
      else if (v === best.v && sweep === best.sweep && Rx === best.Rx && sym < best.sym) best = { a0, v, sym, Rx, sweep }; }
    return { n, cx, cy, Rx: best.Rx, Ry, rb, Rc, fs, labs, gap, sweep: best.sweep, a0: best.a0, score: best.v, angles: its.map((_, i) => best.a0 + i * 360 / n), top };
  },
  pal(LK) {
    const n = LK.name, A = BT.accent, I = BT.ink;
    if (n === 'thread') return { bub: '#FFFFFF', bubEdge: `${LK.stroke - 2}px solid ${LK.line}`, ic: LK.ink, icA: A, shadow: '0 16px 34px rgba(20,24,28,.10)', spoke: LK.fillC,
      track: LK.soft, core: '#FFFFFF', coreEdge: `${LK.stroke}px solid ${A}`, coreIc: LK.ink, coreA: A, ring: A, lab: LK.ink, chip: null, word: LK.ink };
    if (n === 'flat') { const sh = mix(LK.bg, '#000000', .25);
      return { bub: '#FFFFFF', bubEdge: 'none', ic: LK.fillB, icA: LK.fillB, shadow: `0 10px 0 ${sh}`, spoke: mix(LK.bg, '#FFFFFF', .45), track: mix(LK.bg, '#000000', .14),
        core: LK.fillB, coreEdge: 'none', coreIc: contrast('#FFFFFF', LK.fillB) >= 3 ? '#FFFFFF' : BT.ink, coreA: contrast('#FFFFFF', LK.fillB) >= 3 ? '#FFFFFF' : BT.ink, coreSh: `0 14px 0 ${sh}`,
        ring: '#FFFFFF', lab: LK.ink, chip: null, word: contrast('#FFFFFF', LK.fillB) >= 3 ? '#FFFFFF' : BT.ink }; }
    if (n === 'cards') return { bub: '#FFFFFF', bubEdge: 'none', ic: I, icA: A, shadow: '0 22px 44px rgba(30,20,10,.16), 0 4px 10px rgba(30,20,10,.06)', spoke: mix(A, '#FFFFFF', .45),
      track: 'rgba(255,255,255,.75)', core: A, coreEdge: '10px solid #FFFFFF', coreIc: contrast('#FFFFFF', A) >= 3 ? '#FFFFFF' : I, coreA: contrast('#FFFFFF', A) >= 3 ? '#FFFFFF' : I,
      coreSh: LK.shadow, ring: '#FFFFFF', lab: I, chip: '#FFFFFF', word: contrast('#FFFFFF', A) >= 3 ? '#FFFFFF' : I };
    return { bub: LK.ink, bubEdge: 'none', ic: LK.surface, icA: readable(BT.accent, LK.ink, 3), shadow: '8px 10px 0 rgba(0,0,0,.16)', spoke: LK.ink, track: LK.fillB,
      core: LK.accent, coreEdge: `10px solid ${LK.ink}`, coreIc: contrast('#FFFFFF', LK.accent) >= 3 ? '#FFFFFF' : LK.ink, coreA: contrast('#FFFFFF', LK.accent) >= 3 ? '#FFFFFF' : LK.ink,
      coreSh: LK.shadow, ring: LK.ink, lab: LK.ink, chip: null, word: contrast('#FFFFFF', LK.accent) >= 3 ? '#FFFFFF' : LK.ink };
  },
  // a position on the orbit as CSS: the angle lives in --a (degrees) and the reach in --k (0 at the centre, 1 on the orbit)
  pos(G) { return `translate(calc(cos(var(--a) * 1deg) * ${G.Rx}px * var(--k)), calc(sin(var(--a) * 1deg) * ${G.Ry}px * var(--k)))`; },
};
SCENES.orbit = {
  label: 'Orbit', about: 'The client sits at the centre; 3-6 service bubbles fly out along their spokes as each is named, then orbit slowly with upright labels.',
  good: 'everything we handle around you, one team, what we take care of, the people on your side', practice: 'any',
  fields: { head: 'optional headline above (2-6 words; **phrase** = accent)', icon: 'centre icon (users home heart shield briefcase scale), or use word',
    word: 'optional short word for the centre instead of the icon (1 word, e.g. "You")',
    items: '3-6 satellites [{icon, label}], each label said in the line, in order (1-3 words; icons: phone hospital doc clock gavel chat shield users home car map briefcase search scale heart globe)' },
  example: { say: 'One team works all around you: insurance calls, medical records, paperwork, deadlines and court dates.',
    head: 'One team, **all around you**', word: 'You',
    items: [{ icon: 'phone', label: 'Insurance calls' }, { icon: 'hospital', label: 'Medical records' }, { icon: 'doc', label: 'Paperwork' }, { icon: 'clock', label: 'Deadlines' }, { icon: 'gavel', label: 'Court dates' }] },
  sfx: (sc, X) => [{ kind: 'soft', at: X.tIn }, ...X.times(ORB.items(sc).map(it => it.label)).map(t => ({ kind: 'pop', at: t }))],
  html(sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, G = ORB.geo(sc, LK), P = ORB.pal(LK), its = ORB.items(sc), { cx, cy, Rx, Ry, rb, Rc } = G, up = LK.headCase === 'upper';
    const sq = nm === 'silhouette' ? '50%' : '50%';
    const spoke = (a) => `<div class="obk k-abs" style="--a:${a};--k:0;left:${cx}px;top:${cy - 2}px;height:${nm === 'silhouette' ? 5 : 4}px;transform-origin:0 50%;
        width:calc(hypot(cos(var(--a) * 1deg) * ${Rx}px, sin(var(--a) * 1deg) * ${Ry}px) * var(--k));transform:rotate(atan2(sin(var(--a) * 1deg) * ${Ry}px, cos(var(--a) * 1deg) * ${Rx}px));
        background:${nm === 'silhouette' ? P.spoke : `repeating-linear-gradient(90deg, ${P.spoke} 0 16px, transparent 16px 28px)`};"></div>`;
    const sats = its.map((it, i) => { const L = G.labs[i];
      const lab = `<div class="obt" data-qa="text" style="display:inline-block;max-width:${L.w}px;text-align:center;font:${LK.headWeight} ${G.fs}px/1.12 var(--head);color:${P.lab};
        ${up ? 'text-transform:uppercase;letter-spacing:.03em;' : ''}${P.chip ? `background:${P.chip};padding:10px 20px;border-radius:999px;box-shadow:0 10px 24px rgba(30,20,10,.12);` : ''}--acc:${P.chip ? readable(BT.accent, '#FFFFFF', 3) : LK.accentText}">${accentize(it.label, 'ka')}</div>`;
      return `<div class="obs k-abs" style="--a:${G.angles[i]};--k:0;left:${cx}px;top:${cy}px;width:0;height:0;transform:${ORB.pos(G)}">
        <div class="obb k-abs" style="left:${-rb}px;top:${-rb}px;width:${2 * rb}px;height:${2 * rb}px;border-radius:${sq};background:${P.bub};border:${P.bubEdge};box-shadow:${P.shadow};
          display:flex;align-items:center;justify-content:center">${icon(it.icon || 'check', Math.round(rb * 1.04), P.ic, P.icA)}</div>
        <div class="obl k-abs" style="left:-170px;top:${G.gap}px;width:340px;text-align:center">${lab}</div></div>`; }).join('');
    const core = sc.word && !sc.icon
      ? `<div data-qa="text" style="font:${LK.headWeight} ${Math.round(Math.max(40, Math.min(84, Rc * 1.5 / (String(sc.word).length * .62))))}px/1 var(--head);color:${P.word};${up ? 'text-transform:uppercase;' : ''}">${esc(String(sc.word).replace(/\*\*/g, ''))}</div>`
      : icon(sc.icon || 'users', Math.round(Rc * 1.05), P.coreIc, P.coreA);
    const rings = [1.35, 1.7].map((k, j) => `<ellipse class="obr" cx="${cx}" cy="${cy}" rx="${Rc * k}" ry="${Rc * k}" fill="none" stroke="${P.ring}" stroke-width="${j ? 2 : 3}" opacity="${j ? .35 : .55}"/>`).join('');
    return `${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 330, w: 920, size: 84, align: 'center' }) : ''}
      <svg class="svgL" viewBox="0 0 1080 1920"><ellipse id="${id}tr" cx="${cx}" cy="${cy}" rx="${Rx}" ry="${Ry}" fill="none" stroke="${P.track}" stroke-width="${nm === 'thread' ? 3 : nm === 'silhouette' ? 4 : 6}" ${nm === 'thread' ? 'stroke-dasharray="3 12" stroke-linecap="round"' : ''}/>
        <ellipse id="${id}tr2" cx="${cx}" cy="${cy}" rx="${Rx * .62}" ry="${Ry * .62}" fill="none" stroke="${P.track}" stroke-width="2" opacity=".7"/>
        <g id="${id}rg">${rings}</g></svg>
      ${its.map((_, i) => spoke(G.angles[i])).join('')}
      <div id="${id}c" class="k-abs" style="left:${cx - Rc}px;top:${cy - Rc}px;width:${2 * Rc}px;height:${2 * Rc}px;border-radius:50%;background:${P.core};border:${P.coreEdge};box-shadow:${P.coreSh || P.shadow};
        box-sizing:border-box;display:flex;align-items:center;justify-content:center">${core}</div>${sats}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, G = ORB.geo(sc, LK), its = ORB.items(sc), q = s => X.q(s), { cx, cy, Rc } = G, scn = X.$(`#${id}c`).closest('.scn');
    const ts = X.times(its.map(it => it.label)), a = X.tIn - .1;
    if (sc.head) X.head(`#${id}h`, X.tIn);
    // the centre lands, its rings breathe; the orbit track draws round
    const C = q(`#${id}c`);
    tl.set(C, { autoAlpha: 0 }, 0).set(C, { autoAlpha: 1, scale: .3 }, a).to(C, { scale: 1, duration: .55, ease: 'back.out(1.7)' }, a);
    tl.to(C, { scale: 1.05, duration: Math.max(.6, X.tOut - a - .8), ease: 'sine.inOut' }, a + .6);
    tl.fromTo([q(`#${id}tr`), q(`#${id}tr2`)], { drawSVG: '0%' }, { drawSVG: '100%', duration: 1, ease: 'power2.inOut', stagger: .12, immediateRender: true }, a);
    [...X.$(`#${id}rg`).querySelectorAll('.obr')].forEach((r, k) => tl.fromTo(r, { scale: .7, opacity: 0, svgOrigin: `${cx} ${cy}` }, { scale: 1.12, opacity: k ? .35 : .55, svgOrigin: `${cx} ${cy}`, duration: 1.2, ease: 'sine.out', immediateRender: true }, a + .2 + k * .15)
      .to(r, { scale: 1, duration: Math.max(.6, X.tOut - a - 1.6), ease: 'sine.inOut' }, a + 1.4 + k * .15));
    if (LK.thread) X.dot(cx + Rc * .72, cy - Rc * .72, a + .45, { r: 18 });
    // each satellite flies out along its spoke on its word, then everything orbits slowly (labels stay upright)
    const sats = [...scn.querySelectorAll('.obs')], spokes = [...scn.querySelectorAll('.obk')], dur = X.t1 - a;
    sats.forEach((s, i) => { const t = ts[i], ang = G.angles[i], b = s.querySelector('.obb'), l = s.querySelector('.obt'), k = spokes[i];
      tl.set([s, k], { '--a': ang, '--k': 0 }, 0).set(s, { autoAlpha: 0 }, 0).set(k, { autoAlpha: 0 }, 0).set(l, { autoAlpha: 0 }, 0);
      tl.to([s, k], { '--a': ang + G.sweep, duration: dur, ease: 'none' }, a);
      tl.set([s, k], { autoAlpha: 1 }, t - .1).to([s, k], { '--k': 1, duration: .55, ease: 'lr.out' }, t - .1);
      tl.fromTo(b, { scale: .3, rotation: -25 }, { scale: 1, rotation: 0, duration: .5, ease: 'back.out(2)', immediateRender: true }, t - .1);
      tl.set(l, { autoAlpha: 1, y: 22 }, t + .15).to(l, { y: 0, duration: .4, ease: 'lr.out' }, t + .15);
      if (LK.name !== 'silhouette') tl.fromTo(k, { backgroundPositionX: '0px' }, { backgroundPositionX: `${-28 * Math.round(dur * 2)}px`, duration: dur, ease: 'none', immediateRender: true }, a); });
    // exit: satellites fall back into the centre
    tl.to(scn.querySelectorAll('.obt'), { autoAlpha: 0, y: -14, duration: .14, ease: 'lr.in' }, X.tOut);
    tl.to([...sats, ...spokes], { '--k': 0, duration: .34, ease: 'lr.in' }, X.tOut + .12);
    tl.to([...sats, ...spokes], { autoAlpha: 0, duration: .1 }, X.tOut + .36);
    tl.to(C, { scale: 0, autoAlpha: 0, duration: .3, ease: 'lr.in' }, X.tOut + .12);
    tl.to([q(`#${id}tr`), q(`#${id}tr2`), q(`#${id}rg`)], { autoAlpha: 0, duration: .3, ease: 'lr.in' }, X.tOut);
  },
};
