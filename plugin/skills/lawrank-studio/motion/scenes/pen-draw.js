/* pen-draw: a big icon is drawn like a vector pen tool at work. A pen nib traces each stroke; anchor points (small
   squares) and bezier handles (thin lines with round knobs) appear as it passes, on a faint construction grid. On the
   cue word the drawing fills with colour (a wipe rising through it), the handles and anchors fold away, and the
   line's message sets below. Thread: hairline ink and accent handles, the dot lands on the last anchor; flat: white
   construction on the brand colour, filling white with a hard shadow; cards: drawn on a white artboard card with a
   little tool bar; silhouette: black ink, filling solid black with an offset shadow and accent detail. */
SCENES['pen-draw'] = {
  label: 'Pen draw', about: 'A big icon is drawn stroke by stroke with visible anchor points and bezier handles, like a vector pen tool, then fills with colour as the message sets below.',
  good: 'care and craft: "we build your case carefully", "every detail", "made for you", preparation', practice: 'any',
  fields: { icon: 'the icon drawn: shield, scale, doc, heart, home, check, briefcase, users, map, clock, chat, phone, search, star, globe, bookmark, gavel',
    head: 'the message set below (3-8 words), said in the line; **phrase** = accent',
    cue: 'optional: the word in the line when the drawing fills (default: the first word of head)' },
  example: { say: 'We build your case carefully, line by line. Every detail, handled with care.', icon: 'shield', head: 'Every detail, **handled with care.**' },
  sfx: (sc, X) => { const tf = SCENES['pen-draw'].tFill(sc, X); return [{ kind: 'soft', at: X.tIn }, { kind: 'chime', at: tf }]; },
  tFill(sc, X) {
    const w = String(sc.cue || String(sc.head).replace(/\*\*/g, '').split(/\s+/)[0]);
    return Math.max(X.tIn + 1.3, Math.min(X.tOut - 1.1, X.times([w])[0]));
  },
  // ---- parse the icon's path data (24-unit grid) into stage coordinates, anchors and handles
  parse(src, k, ox, oy) {
    const X = v => +(ox + v * k).toFixed(2), Y = v => +(oy + v * k).toFixed(2);
    if (src.startsWith('c ')) {          // a circle: four cubic quarters, so it gets anchors and handles like a pen-drawn circle
      const [cx, cy, r] = src.slice(2).split(' ').map(Number), m = .5523 * r;
      const P = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]], H = [[[m, 0], [0, -m]], [[0, m], [m, 0]], [[-m, 0], [0, m]], [[0, -m], [-m, 0]]];
      let d = `M${X(P[0][0])},${Y(P[0][1])}`; const anchors = [], handles = [];
      for (let i = 0; i < 4; i++) { const a = P[i], b = P[(i + 1) % 4], c1 = [a[0] + H[i][0][0], a[1] + H[i][0][1]], c2 = [b[0] + H[i][1][0], b[1] + H[i][1][1]];
        d += ` C${X(c1[0])},${Y(c1[1])} ${X(c2[0])},${Y(c2[1])} ${X(b[0])},${Y(b[1])}`; anchors.push([X(a[0]), Y(a[1])]);
        handles.push([X(a[0]), Y(a[1]), X(c1[0]), Y(c1[1])], [X(b[0]), Y(b[1]), X(c2[0]), Y(c2[1])]); }
      return { d: d + ' Z', anchors, handles, closed: true, small: r < 2.2 };
    }
    const tok = src.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
    let i = 0, cmd = '', cx = 0, cy = 0, sx = 0, sy = 0, d = '', closed = false;
    const anchors = [], handles = [], num = () => +tok[i++], add = (x, y) => { anchors.push([X(x), Y(y)]); };
    while (i < tok.length) {
      if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
      if (cmd === 'M') { cx = num(); cy = num(); sx = cx; sy = cy; d += `M${X(cx)},${Y(cy)} `; add(cx, cy); cmd = 'L'; }
      else if (cmd === 'L') { cx = num(); cy = num(); d += `L${X(cx)},${Y(cy)} `; add(cx, cy); }
      else if (cmd === 'H') { cx = num(); d += `L${X(cx)},${Y(cy)} `; add(cx, cy); }
      else if (cmd === 'V') { cy = num(); d += `L${X(cx)},${Y(cy)} `; add(cx, cy); }
      else if (cmd === 'C') { const a = [num(), num(), num(), num(), num(), num()];
        handles.push([X(cx), Y(cy), X(a[0]), Y(a[1])], [X(a[4]), Y(a[5]), X(a[2]), Y(a[3])]);
        d += `C${X(a[0])},${Y(a[1])} ${X(a[2])},${Y(a[3])} ${X(a[4])},${Y(a[5])} `; cx = a[4]; cy = a[5]; add(cx, cy); }
      else if (cmd === 'Q') { const a = [num(), num(), num(), num()];
        handles.push([X(cx), Y(cy), X(a[0]), Y(a[1])], [X(a[2]), Y(a[3]), X(a[0]), Y(a[1])]);
        d += `Q${X(a[0])},${Y(a[1])} ${X(a[2])},${Y(a[3])} `; cx = a[2]; cy = a[3]; add(cx, cy); }
      else if (cmd === 'A') { const a = [num(), num(), num(), num(), num(), num(), num()];
        d += `A${+(a[0] * k).toFixed(2)},${+(a[1] * k).toFixed(2)} ${a[2]} ${a[3]} ${a[4]} ${X(a[5])},${Y(a[6])} `; cx = a[5]; cy = a[6]; add(cx, cy); }
      else if (cmd === 'Z' || cmd === 'z') { d += 'Z '; closed = true; cx = sx; cy = sy; cmd = ''; }
      else i++;
    }
    // drop a closing anchor that repeats the first one
    if (anchors.length > 1) { const a = anchors[0], b = anchors[anchors.length - 1]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 2) anchors.pop(); }
    return { d: d.trim(), anchors, handles, closed, small: false };
  },
  parts(sc) {
    const ic = ICONS[sc.icon] || ICONS.shield, S = 560, k = S / 24, ox = 540 - S / 2, oy = SCENES['pen-draw'].CY - S / 2, me = SCENES['pen-draw'];
    const out = [];
    [['b', false], ['bf', true], ['a', false], ['af', true]].forEach(([key, solid]) => (ic[key] || []).forEach(src =>
      out.push(Object.assign(me.parse(src, k, ox, oy), { role: key[0], solid }))));
    return { list: out, k };
  },
  CY: 800,
  pal(LK) {
    const nm = LK.name;
    if (nm === 'flat') { const on = LK.ink;
      return { grid: mix(LK.bg, on, .2), guide: mix(LK.bg, on, .4), outline: on, aFill: LK.bg, aStroke: on, handle: on, knob: on,
        fill: LK.fillA, strokeB: LK.fillB, strokeA: contrast(BT.accent, '#FFFFFF') >= 2.2 ? BT.accent : LK.fillB, shadow: mix(LK.bg, '#000000', .28), sw: 1.9, pen: '#FFFFFF', penInk: BT.ink }; }
    if (nm === 'cards') return { grid: mix(BT.ink, '#FFFFFF', .93), guide: mix(BT.accent, '#FFFFFF', .55), outline: BT.ink, aFill: '#FFFFFF', aStroke: BT.accent, handle: BT.accent, knob: BT.accent,
      fill: mix(BT.accent, '#FFFFFF', .84), strokeB: BT.ink, strokeA: BT.accent, shadow: null, sw: 1.55, pen: '#FFFFFF', penInk: BT.ink };
    if (nm === 'silhouette') return { grid: mix(LK.bg, LK.ink, .1), guide: mix(LK.bg, LK.ink, .3), outline: LK.ink, aFill: LK.bg, aStroke: LK.ink, handle: LK.ink, knob: LK.ink,
      fill: LK.ink, strokeB: LK.ink, strokeA: LK.accent, shadow: 'rgba(0,0,0,.16)', sw: 2, pen: LK.ink, penInk: LK.bg };
    return { grid: mix(LK.ink, LK.bg, .9), guide: mix(BT.accent, LK.bg, .55), outline: LK.ink, aFill: '#FFFFFF', aStroke: BT.accent, handle: BT.accent, knob: BT.accent,
      fill: mix(BT.accent, LK.bg, .84), strokeB: LK.ink, strokeA: BT.accent, shadow: null, sw: 1.35, pen: '#FFFFFF', penInk: LK.ink };
  },
  html(sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, me = SCENES['pen-draw'], P = me.pal(LK), { list, k } = me.parts(sc), CY = me.CY;
    const cap = BT.radius === 0 ? 'square' : 'round', join = BT.radius === 0 ? 'miter' : 'round', W = +(P.sw * k).toFixed(1);
    // construction: a fine grid, centre lines and a guide circle, like an artboard in a vector tool
    const gx0 = 120, gx1 = 960, gy0 = CY - 420, gy1 = CY + 420, step = 70;
    let grid = ''; for (let x = gx0; x <= gx1 + 1; x += step) grid += `<line x1="${x}" y1="${gy0}" x2="${x}" y2="${gy1}"/>`; for (let y = gy0; y <= gy1 + 1; y += step) grid += `<line x1="${gx0}" y1="${y}" x2="${gx1}" y2="${y}"/>`;
    const guides = `<g id="${id}gu" fill="none" stroke="${P.guide}" stroke-width="2.5" stroke-dasharray="10 12">
      <circle class="pdG" cx="540" cy="${CY}" r="${12 * k}"/><line class="pdG" x1="540" y1="${gy0 - 30}" x2="540" y2="${gy1 + 30}"/><line class="pdG" x1="${gx0 - 30}" y1="${CY}" x2="${gx1 + 30}" y2="${CY}"/></g>`;
    const fills = list.map((p, i) => {
      const col = p.role === 'a' ? P.strokeA : P.strokeB;
      if (p.solid) return `<path d="${p.d}" fill="${col}"/>`;
      return `${p.closed && p.role === 'b' ? `<path d="${p.d}" fill="${P.fill}"/>` : ''}<path d="${p.d}" fill="none" stroke="${col}" stroke-width="${W}" stroke-linecap="${cap}" stroke-linejoin="${join}"/>`;
    }).join('');
    const shadow = P.shadow ? `<g id="${id}sh" transform="translate(${nm === 'flat' ? '0 18' : '18 20'})">${list.map(p => p.solid ? `<path d="${p.d}" fill="${P.shadow}"/>`
      : `${p.closed && p.role === 'b' ? `<path d="${p.d}" fill="${P.shadow}"/>` : ''}<path d="${p.d}" fill="none" stroke="${P.shadow}" stroke-width="${W}" stroke-linecap="${cap}" stroke-linejoin="${join}"/>`).join('')}</g>` : '';
    const outlines = list.map((p, i) => `<path class="pdO" id="${id}o${i}" d="${p.d}" fill="none" stroke="${P.outline}" stroke-width="${nm === 'thread' || nm === 'cards' ? 3 : 4}" stroke-linejoin="round"/>`).join('');
    const hs = list.map((p, i) => `<g class="pdH" data-i="${i}">${p.handles.map(h => `<g class="pdh"><line x1="${h[0]}" y1="${h[1]}" x2="${h[2]}" y2="${h[3]}" stroke="${P.handle}" stroke-width="3.5"/>
      <circle cx="${h[2]}" cy="${h[3]}" r="10.5" fill="${P.knob}"/></g>`).join('')}</g>`).join('');
    const as = list.map((p, i) => `<g class="pdA" data-i="${i}">${p.anchors.map(a => `<rect x="${a[0] - 12}" y="${a[1] - 12}" width="24" height="24" fill="${P.aFill}" stroke="${P.aStroke}" stroke-width="4"/>`).join('')}</g>`).join('');
    // the pen nib: tip at (0, 0), leaning right
    const pen = `<g id="${id}pen"><g transform="rotate(-28)" filter="${nm === 'cards' ? `url(#${id}ds)` : ''}">
      <path d="M0,0 L-20,-46 L-15,-74 L15,-74 L20,-46 Z" fill="${P.pen}" stroke="${P.penInk}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M0,0 V-34" stroke="${P.penInk}" stroke-width="4"/><circle cx="0" cy="-38" r="5.5" fill="${P.penInk}"/>
      <rect x="-19" y="-98" width="38" height="20" rx="${nm === 'silhouette' ? 0 : 5}" fill="${P.penInk}"/></g></g>`;
    const defs = `<defs><clipPath id="${id}clip"><rect id="${id}wr" x="0" y="${CY + 320}" width="1080" height="0"/></clipPath>
      ${nm === 'cards' ? `<filter id="${id}ds" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-opacity=".22"/></filter>` : ''}</defs>`;
    const svg = `<svg id="${id}s" class="k-abs" style="left:0;top:0;overflow:visible" width="1080" height="1920" viewBox="0 0 1080 1920">${defs}
      <g id="${id}gr" stroke="${P.grid}" stroke-width="2">${grid}</g>${guides}
      <g id="${id}art">${shadow ? `<g clip-path="url(#${id}clip)">${shadow}</g>` : ''}<g clip-path="url(#${id}clip)">${fills}</g>${outlines}</g>
      <g id="${id}hs">${hs}</g><g id="${id}as">${as}</g>${pen}</svg>`;
    const card = nm === 'cards' ? `${UI.card(LK, { id: id + 'c', x: 90, y: CY - 470, w: 900, h: 940 })}
      <div id="${id}tb" class="k-abs" style="left:130px;top:${CY - 440}px;display:flex;gap:10px;padding:10px;background:${mix(BT.ink, '#FFFFFF', .95)};border-radius:20px">
        ${['arrow', 'pen', 'doc'].map(t => `<div style="width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:${t === 'pen' ? BT.accent : 'transparent'}">
          ${t === 'pen' ? `<svg width="34" height="34" viewBox="-40 -100 80 104"><g transform="rotate(-28)"><path d="M0,0 L-20,-46 L-15,-74 L15,-74 L20,-46 Z" fill="none" stroke="${contrast('#FFFFFF', BT.accent) >= 3 ? '#FFFFFF' : BT.ink}" stroke-width="9" stroke-linejoin="round"/></g></svg>` : icon(t, 32, BT.ink, BT.ink)}</div>`).join('')}</div>` : '';
    const long = String(sc.head).replace(/\*\*/g, '').length > 30;
    return `${card}${svg}${UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: CY + (nm === 'cards' ? 520 : 470), w: 920, size: long ? 80 : 92, align: 'center' })}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, me = SCENES['pen-draw'], { list } = me.parts(sc), CY = me.CY, tF = me.tFill(sc, X);
    const S = X.$(`#${id}s`), pen = X.$(`#${id}pen`), outs = [...S.querySelectorAll('.pdO')], HG = [...S.querySelectorAll('.pdH')], AG = [...S.querySelectorAll('.pdA')];
    tl.set(S, { autoAlpha: 0 }, 0).set(S, { autoAlpha: 1 }, X.tIn - .2);
    if (nm === 'cards') {
      tl.set([`#${id}c`, `#${id}tb`], { autoAlpha: 0 }, 0).set(`#${id}c`, { autoAlpha: 1, y: 140 }, X.tIn - .25).to(`#${id}c`, { y: 0, duration: .55, ease: 'lr.out' }, X.tIn - .25);
      tl.set(`#${id}tb`, { autoAlpha: 1, y: 140 }, X.tIn - .2).to(`#${id}tb`, { y: 0, duration: .55, ease: 'lr.out' }, X.tIn - .2);
      tl.to([`#${id}c`, `#${id}tb`], { autoAlpha: 0, y: -50, duration: .3, ease: 'lr.in' }, X.tOut + .05);
    }
    // construction grid and guides draw in first
    const gl = [...S.querySelectorAll(`#${id}gr line`)], gd = [...S.querySelectorAll('.pdG')];
    tl.set(gl, { drawSVG: '50% 50%' }, 0).to(gl, { drawSVG: '0% 100%', duration: .6, ease: 'lr.out', stagger: .012 }, X.tIn - .2);
    tl.set(gd, { drawSVG: '0%' }, 0).to(gd, { drawSVG: '100%', duration: .7, ease: 'lr.move', stagger: .08 }, X.tIn - .1);
    // the drawing window: each stroke gets time in proportion to its length
    const lens = outs.map(o => o.getTotalLength()), tot = lens.reduce((a, b) => a + b, 0);
    const t0 = X.tIn + .15, t1 = tF - .2, span = Math.max(.6, t1 - t0 - .1 * (outs.length - 1));
    // every stroke gets a share of the window by length; the whole drawing always finishes before the fill
    const dus0 = lens.map(l => Math.max(.14, span * l / tot)), need = dus0.reduce((a, b) => a + b, 0) + .1 * (outs.length - 1), fit = Math.min(1, Math.max(.3, t1 - t0) / need);
    const dus = dus0.map(d => d * fit), gap = .1 * fit;
    tl.set(outs, { drawSVG: '0%' }, 0);
    tl.set(pen, { autoAlpha: 0 }, 0);
    let t = t0, last = null;
    outs.forEach((o, i) => {
      const du = dus[i], p = list[i];
      if (i === 0) tl.set(pen, { autoAlpha: 1, x: 900, y: CY + 380 }, t0 - .4).to(pen, { x: p.anchors[0][0], y: p.anchors[0][1], duration: .38, ease: 'lr.move' }, t0 - .4);
      else tl.to(pen, { x: p.anchors[0][0], y: p.anchors[0][1], duration: gap, ease: 'power1.inOut' }, t - gap);
      tl.to(o, { drawSVG: '100%', duration: du, ease: 'none' }, t);
      tl.to(pen, { motionPath: { path: p.d }, duration: du, ease: 'none' }, t);
      // anchors and handles appear as the pen reaches them (by distance along the stroke)
      const A = [...AG[i].children], Hh = [...HG[i].querySelectorAll('.pdh')], pts = p.anchors;
      let acc = 0; const cum = pts.map((q, j) => (acc += j ? Math.hypot(q[0] - pts[j - 1][0], q[1] - pts[j - 1][1]) : 0)), L = acc || 1;
      const at = j => t + du * Math.min(1, (p.closed && pts.length > 1 ? cum[j] / (L + Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1])) : cum[j] / L));
      A.forEach((a, j) => { const ta = at(j); tl.set(a, { autoAlpha: 0 }, 0).set(a, { autoAlpha: 1, scale: 0, svgOrigin: `${pts[j][0]} ${pts[j][1]}` }, ta).to(a, { scale: 1, duration: .25, ease: 'back.out(3)' }, ta); });
      Hh.forEach((h, j) => { const ln = h.querySelector('line'), kn = h.querySelector('circle'), x0 = +ln.getAttribute('x1'), y0 = +ln.getAttribute('y1');
        let jj = 0, bd = 1e9; pts.forEach((q, m) => { const dd = Math.hypot(q[0] - x0, q[1] - y0); if (dd < bd) { bd = dd; jj = m; } });
        const th = Math.max(t, at(jj) - .05);
        tl.set(h, { autoAlpha: 0 }, 0).set(h, { autoAlpha: 1 }, th).fromTo(ln, { drawSVG: '0%' }, { drawSVG: '100%', duration: .25, ease: 'power2.out', immediateRender: false }, th);
        tl.set(ln, { drawSVG: '0%' }, 0).fromTo(kn, { scale: 0, svgOrigin: `${ln.getAttribute('x2')} ${ln.getAttribute('y2')}` }, { scale: 1, duration: .25, ease: 'back.out(3)', immediateRender: false }, th + .15); });
      t += du + gap; last = p;
    });
    // the fill: colour rises through the drawing on the cue; handles and anchors fold away
    tl.set(`#${id}wr`, { attr: { y: CY + 320, height: 0 } }, 0).to(`#${id}wr`, { attr: { y: CY - 330, height: 650 }, duration: .7, ease: 'power2.inOut' }, tF);
    tl.to([...S.querySelectorAll('.pdh')], { autoAlpha: 0, duration: .25, ease: 'lr.in', stagger: .01 }, tF + .1);
    tl.to(AG.flatMap(g => [...g.children]), { scale: 0, duration: .25, ease: 'lr.in', stagger: .01 }, tF + .15);
    tl.to(outs, { autoAlpha: 0, duration: .3, ease: 'power1.in' }, tF + .5);
    tl.to([`#${id}gr`, `#${id}gu`], { autoAlpha: nm === 'cards' ? .5 : .35, duration: .5, ease: 'power1.inOut' }, tF + .2);
    tl.to(pen, { x: 1000, y: CY + 520, autoAlpha: 0, duration: .45, ease: 'lr.in' }, tF);
    if (LK.thread) { const a = last.anchors[last.anchors.length - 1]; X.dot(a[0], a[1], tF - .05, { r: 14 }); }
    // the finished mark settles with a small lift
    tl.to(`#${id}art`, { scale: 1.04, svgOrigin: `540 ${CY}`, duration: .5, ease: 'back.out(2)' }, tF + .55).to(`#${id}art`, { scale: 1.02, duration: Math.max(.3, X.tOut - tF - 1.05), ease: 'sine.inOut' }, tF + 1.05);
    X.head(`#${id}h`, tF + .25);
    tl.to(`#${id}art`, { scale: .9, autoAlpha: 0, duration: .32, ease: 'lr.in' }, X.tOut);
    tl.to(S, { autoAlpha: 0, duration: .3, ease: 'lr.in' }, X.tOut + .05);
  },
};
