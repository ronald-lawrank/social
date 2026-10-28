/* node-line: ultra-minimal schematic (line-art product-film feel). One thin line draws across the frame and bends at
   rounded corners like a circuit; a small node pops onto it as each item is said, then morphs into a framed symbol
   (dot -> circle / square / diamond, with the item's icon drawn inside) and a short label sets under it. Calm, precise,
   lots of space. Thread: hairline ink on a dotted drafting grid, the accent dot lands on the end terminal; flat: a
   chunky white line with deep-colour discs; cards: the diagram on a white drafting card; silhouette: a heavy black
   line with square black nodes and hard offset shadows. */
SCENES['node-line'] = {
  label: 'Node line', about: 'A thin line draws across the frame and bends like a schematic; a node pops onto it as each item is said and morphs into a symbol with a short label.',
  good: 'how we work, what we take care of, the parts of a process, a calm "here is the plan" beat', practice: 'any',
  fields: { head: 'optional headline above (2-5 words); **word** = accent',
    items: '[{label, icon}] 3-5 items in order (up to 4 with a head); label = 1-3 words, each said in the line (ideally starting with its first word); icon = check, doc, chat, phone, search, scale, shield, clock, users, home, map, briefcase, gavel, heart, globe, star',
    shape: 'optional: "circle", "square" or "diamond" for every node (default: they alternate)' },
  example: { say: 'First, we listen to your story. Then we gather the records, check every detail, and keep you updated.',
    head: 'The **plan**', items: [{ label: 'Listen', icon: 'chat' }, { label: 'Gather records', icon: 'doc' },
      { label: 'Check every detail', icon: 'search' }, { label: 'Keep you updated', icon: 'phone' }] },
  sfx: (sc, X) => [...X.times(sc.items.map(i => i.label)).map(t => ({ kind: 'pop', at: t })), { kind: 'soft', at: X.tIn }],

  // ---- geometry: rows of two nodes, joined by rounded corners at the sides (a serpentine, like a schematic trace)
  geo(sc, X) {
    const n = Math.max(1, Math.min(6, sc.items.length)), rows = Math.ceil(n / 2), R = 56, xl = 110, xr = 970;
    const top = sc.head ? 700 : rows > 2 ? 560 : 590, bottom = rows > 2 ? 1340 : 1270, gap = rows > 1 ? Math.min(560, (bottom - top) / (rows - 1)) : 0;
    const y0 = rows > 1 ? (top + bottom) / 2 - gap * (rows - 1) / 2 : (top + bottom) / 2, ys = [...Array(rows)].map((_, j) => y0 + j * gap);
    const nodes = sc.items.slice(0, n).map((it, i) => { const j = Math.floor(i / 2), s = i % 2, single = j === rows - 1 && n % 2 === 1;
      return { x: single ? 540 : (j % 2 ? (s ? 330 : 750) : (s ? 750 : 330)), y: ys[j] }; });
    let d = `M${xl},${ys[0]}`;
    ys.forEach((y, j) => {
      const dir = j % 2 ? -1 : 1, last = j === rows - 1;
      if (last) { d += ` H${dir > 0 ? 940 : 140}`; return; }
      const side = dir > 0 ? xr : xl, sw = dir > 0 ? 1 : 0, yn = ys[j + 1];
      d += ` H${side - R * dir} A${R},${R} 0 0 ${sw} ${side},${y + R}`;
      const ym = (y + yn) / 2, r = 26;
      if (j === 0 && yn - y - 2 * R > 5 * r) d += ` V${ym} A${r},${r} 0 1 ${sw} ${side - 2 * r * dir},${ym} A${r},${r} 0 1 ${sw} ${side},${ym}`;   // a little curl
      d += ` V${yn - R} A${R},${R} 0 0 ${sw} ${side - R * dir},${yn}`;
    });
    const lastRow = rows - 1, end = { x: lastRow % 2 ? 140 : 940, y: ys[lastRow] };
    return { n, rows, ys, nodes, d, start: { x: xl, y: ys[0] }, end, box: { y: ys[0] - 150, h: ys[lastRow] - ys[0] + 150 + 250 } };
  },
  // a symbol frame around (x, y): circle, rounded square or diamond; and the tiny dot it grows from
  shapeD(kind, x, y, R) {
    if (kind === 'square') return rr({ x: x - R * .9, y: y - R * .9, w: R * 1.8, h: R * 1.8, r: R * .3 });
    if (kind === 'diamond') return `M${x},${y - R * 1.2} L${x + R * 1.2},${y} L${x},${y + R * 1.2} L${x - R * 1.2},${y} Z`;
    return `M${x - R},${y} A${R},${R} 0 1 1 ${x + R},${y} A${R},${R} 0 1 1 ${x - R},${y} Z`;
  },
  pal(LK) {
    const nm = LK.name;
    if (nm === 'flat') { const node = LK.fillB, ico = contrast('#FFFFFF', node) >= 3 ? '#FFFFFF' : BT.ink;
      return { line: LK.ink, lw: 8, node, nodeStroke: 'none', nsw: 0, ico, icoA: ico, shadow: mix(LK.fillB, '#000000', .3), grid: mix(LK.bg, LK.ink, .16), label: LK.ink, idx: LK.accentText, term: LK.ink }; }
    if (nm === 'cards') { const ico = contrast('#FFFFFF', BT.accent) >= 3 ? '#FFFFFF' : BT.ink;
      return { line: mix(BT.ink, '#FFFFFF', .25), lw: 4, node: BT.accent, nodeStroke: 'none', nsw: 0, ico, icoA: ico, shadow: null, grid: mix(BT.ink, '#FFFFFF', .9), label: LK.surfaceInk, idx: readable(BT.accent, '#FFFFFF', 3), term: BT.ink }; }
    if (nm === 'silhouette') return { line: LK.ink, lw: 10, node: LK.ink, nodeStroke: 'none', nsw: 0, ico: LK.bg, icoA: LK.bg, shadow: 'rgba(0,0,0,.16)', grid: LK.soft, label: LK.ink, idx: LK.accentText, term: LK.ink };
    return { line: LK.ink, lw: 3, node: '#FFFFFF', nodeStroke: LK.ink, nsw: 3, ico: LK.ink, icoA: BT.accent, shadow: null, grid: mix(LK.ink, LK.bg, .82), label: LK.ink, idx: LK.accentText, term: LK.ink };
  },
  html(sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, G = SCENES['node-line'].geo(sc, X), P = SCENES['node-line'].pal(LK), me = SCENES['node-line'];
    const kinds = ['circle', 'square', 'diamond'], up = LK.headCase === 'upper', NR = nm === 'flat' ? 80 : 72;
    const kindOf = i => nm === 'silhouette' ? 'square' : sc.shape || (nm === 'flat' ? 'circle' : kinds[i % 3]);
    const box = G.box, bx = 70, bw = 940;
    // drafting frame: hairline box with corner brackets, and a dotted grid inside
    const brk = (x, y, sx, sy) => `<path class="nlB" d="M${x},${y + 34 * sy} V${y} H${x + 34 * sx}" fill="none" stroke="${P.line}" stroke-width="${Math.max(3, P.lw * .6)}"/>`;
    const frame = nm === 'cards' ? '' : `<rect id="${id}fr" x="${bx}" y="${box.y}" width="${bw}" height="${box.h}" fill="none" stroke="${P.grid}" stroke-width="2"/>
      ${brk(bx - 14, box.y - 14, 1, 1)}${brk(bx + bw + 14, box.y - 14, -1, 1)}${brk(bx - 14, box.y + box.h + 14, 1, -1)}${brk(bx + bw + 14, box.y + box.h + 14, -1, -1)}`;
    const grid = `<defs><pattern id="${id}gp" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="${nm === 'thread' ? 2.2 : 3}" fill="${P.grid}"/></pattern>
      <clipPath id="${id}gc"><rect x="${bx}" y="${box.y}" width="${bw}" height="${box.h}"/></clipPath></defs>
      <rect id="${id}gd" x="${bx}" y="${box.y}" width="${bw}" height="${box.h}" fill="url(#${id}gp)" opacity="${nm === 'flat' ? .7 : 1}"/>`;
    const sh = (d, cls) => P.shadow ? `<path class="${cls}" d="${d}" fill="${P.shadow}" transform="translate(${nm === 'flat' ? '0 10' : '10 12'})"/>` : '';
    const nodes = G.nodes.map((p, i) => {
      const it = sc.items[i], k = kindOf(i), dot = me.shapeD('circle', p.x, p.y, 11), tgt = me.shapeD(k, p.x, p.y, NR), isz = nm === 'flat' ? 80 : 72;
      return `<g class="nlN" data-i="${i}" data-t="${esc(tgt)}">
        <circle class="nlP" cx="${p.x}" cy="${p.y}" r="${NR}" fill="none" stroke="${nm === 'cards' ? BT.accent : P.line}" stroke-width="3"/>
        ${sh(dot, 'nlS')}<path class="nlF" d="${dot}" fill="${nm === 'thread' ? P.term : P.node}" stroke="${P.nodeStroke}" stroke-width="${P.nsw}"/>
        <g class="nlI"><g transform="translate(${p.x - isz / 2},${p.y - isz / 2})">${icon(it.icon || 'check', isz, P.ico, P.icoA)}</g></g></g>`;
    }).join('');
    const ticks = G.nodes.length > 1 ? G.ys.map((y, j) => { const xs = j === G.rows - 1 && G.n % 2 ? [] : [540];
      return xs.map(x => `<line class="nlT" x1="${x}" y1="${y - 16}" x2="${x}" y2="${y + 16}" stroke="${P.line}" stroke-width="${Math.max(3, P.lw * .6)}"/>`).join(''); }).join('') : '';
    const term = (p, filled, cls) => `<circle class="${cls}" cx="${p.x}" cy="${p.y}" r="${nm === 'thread' ? 11 : 15}" fill="${filled ? P.term : (nm === 'cards' ? '#FFFFFF' : LK.bg)}" stroke="${P.term}" stroke-width="${Math.max(3, P.lw * .6)}"/>`;
    const svg = `<svg id="${id}s" class="k-abs" style="left:0;top:0;overflow:visible" width="1080" height="1920" viewBox="0 0 1080 1920">
      ${grid}<g id="${id}fg">${frame}</g>
      <path id="${id}ln" d="${G.d}" fill="none" stroke="${P.line}" stroke-width="${P.lw}" stroke-linecap="${nm === 'silhouette' ? 'butt' : 'round'}" stroke-linejoin="round"/>
      ${ticks}${term(G.start, false, 'nlA')}${nm === 'thread' ? '' : term(G.end, true, 'nlZ')}${nodes}</svg>`;
    const long = sc.items.some(it => String(it.label).length > 14), lsz = long ? (sc.items.some(it => String(it.label).length > 22) ? 40 : 44) : 50;
    const labels = G.nodes.map((p, i) => `<div class="nlL k-abs" data-qa="text" style="left:${p.x - 190}px;top:${p.y + NR + 24}px;width:380px;text-align:center;overflow:hidden;padding-bottom:6px">
        <div class="nlLi"><div style="font:800 32px/1 var(--head);letter-spacing:.14em;color:${P.idx}">${String(i + 1).padStart(2, '0')}</div>
        <div style="font:${LK.headWeight} ${lsz}px/1.1 var(--head);color:${P.label};margin-top:10px;${up ? 'text-transform:uppercase;letter-spacing:.02em;' : ''}">${accentize(sc.items[i].label, 'ka')}</div></div></div>`).join('');
    const card = nm === 'cards' ? UI.card(LK, { id: id + 'c', x: 40, y: box.y - 10, w: 1000, h: box.h + 20 }) : '';
    return `${card}${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: nm === 'cards' ? box.y - 200 : 360, w: 920, size: 92, align: 'center' }) : ''}
      <div id="${id}w" class="k-abs" style="left:0;top:0;width:1080px;height:1920px">${svg}<div id="${id}l">${labels}</div></div>`;
  },
  build(tl, sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, me = SCENES['node-line'], G = me.geo(sc, X), n = G.n;
    const ts = X.times(sc.items.slice(0, n).map(i => i.label)), S = X.$(`#${id}s`), ln = X.$(`#${id}ln`);
    const nodes = [...S.querySelectorAll('.nlN')], labels = [...X.$(`#${id}l`).querySelectorAll('.nlL')], ticks = [...S.querySelectorAll('.nlT')];
    // where each node (and tick) sits along the line, as a fraction of its length
    const L = ln.getTotalLength(), N = 600, pts = [...Array(N + 1)].map((_, k) => { const q = ln.getPointAtLength(L * k / N); return [q.x, q.y]; });
    let from = 0; const frac = p => { let best = from, bd = 1e9; for (let k = from; k <= N; k++) { const dd = Math.hypot(pts[k][0] - p.x, pts[k][1] - p.y); if (dd < bd) { bd = dd; best = k; } } from = best; return best / N; };
    const fs = G.nodes.map(frac);
    const tickF = ticks.map(t => { const x = +t.getAttribute('x1'), y = (+t.getAttribute('y1') + +t.getAttribute('y2')) / 2; let best = 0, bd = 1e9;
      pts.forEach((q, k) => { const dd = Math.hypot(q[0] - x, q[1] - y); if (dd < bd) { bd = dd; best = k; } }); return best / N; });
    const tEnd = Math.min(X.tOut - .35, Math.max(ts[n - 1] + .7, X.tIn + .6));
    if (sc.head) X.head(`#${id}h`, X.tIn);
    if (nm === 'cards') { tl.set(`#${id}c`, { autoAlpha: 0 }, 0).set(`#${id}c`, { autoAlpha: 1, y: 120 }, X.tIn - .2).to(`#${id}c`, { y: 0, duration: .55, ease: 'lr.out' }, X.tIn - .2);
      tl.to(`#${id}c`, { autoAlpha: 0, y: -50, duration: .32, ease: 'lr.in' }, X.tOut + .05); }
    tl.set(S, { autoAlpha: 0 }, 0).set(S, { autoAlpha: 1 }, X.tIn - .15);
    // the drafting frame and grid: brackets snap to the corners, the hairline box draws, the dot grid fades up behind
    const brk = [...S.querySelectorAll('.nlB')];
    tl.set(brk, { drawSVG: '0%' }, 0).to(brk, { drawSVG: '100%', duration: .45, ease: 'lr.out', stagger: .05 }, X.tIn - .15);
    if (X.$(`#${id}fr`)) tl.set(`#${id}fr`, { drawSVG: '0%' }, 0).to(`#${id}fr`, { drawSVG: '100%', duration: .9, ease: 'lr.move' }, X.tIn - .1);
    tl.fromTo(`#${id}gd`, { opacity: 0 }, { opacity: nm === 'flat' ? .7 : 1, duration: .8, ease: 'power1.out', immediateRender: false }, X.tIn);
    tl.set(`#${id}gd`, { opacity: 0 }, 0);
    // the line: starts at the open terminal, then reaches each node as it's said
    const A = S.querySelector('.nlA'), Z = S.querySelector('.nlZ'), t0 = X.tIn - .05;
    tl.set(A, { autoAlpha: 0 }, 0).set(A, { autoAlpha: 1, scale: 0, svgOrigin: `${G.start.x} ${G.start.y}` }, t0).to(A, { scale: 1, duration: .35, ease: 'back.out(2.4)' }, t0);
    tl.set(ln, { drawSVG: '0% 0%' }, 0);
    let prevT = t0 + .1, prevF = 0; const segs = [];
    const reach = (f, t) => { const d = Math.max(.2, Math.min(.8, t - prevT)), s = Math.max(prevT, t - d), du = Math.max(.15, t - s);
      tl.to(ln, { drawSVG: `0% ${(f * 100).toFixed(2)}%`, duration: du, ease: 'lr.move' }, s); segs.push({ f0: prevF, f1: f, s, du }); prevT = Math.max(prevT, t); prevF = f; };
    nodes.forEach((g, i) => {
      const t = ts[i], p = G.nodes[i], F = g.querySelector('.nlF'), Sh = g.querySelector('.nlS'), I = g.querySelector('.nlI'), Pl = g.querySelector('.nlP'), lab = labels[i], li = lab.querySelector('.nlLi');
      reach(fs[i], t);
      // a dot pops on the line, then grows into its symbol frame and the icon draws inside
      tl.set(g, { autoAlpha: 0 }, 0).set(g, { autoAlpha: 1, scale: 0, svgOrigin: `${p.x} ${p.y}` }, t - .02).to(g, { scale: 1, duration: .3, ease: 'back.out(3)' }, t - .02);
      const tm = t + .18, tgt = g.dataset.t;
      tl.to(F, { morphSVG: tgt, duration: .5, ease: 'lr.out' }, tm);
      if (nm === 'thread') tl.to(F, { fill: '#FFFFFF', duration: .2, ease: 'none' }, tm);
      if (Sh) tl.to(Sh, { morphSVG: tgt, duration: .5, ease: 'lr.out' }, tm);
      const ip = I.querySelectorAll('path, circle');
      tl.set(I, { autoAlpha: 0 }, 0).set(I, { autoAlpha: 1, scale: .6, svgOrigin: `${p.x} ${p.y}` }, tm + .2).to(I, { scale: 1, duration: .45, ease: 'lr.out' }, tm + .2);
      tl.set(ip, { drawSVG: '0%' }, 0).to(ip, { drawSVG: '100%', duration: .45, ease: 'power2.out', stagger: .06 }, tm + .2);
      // a soft ring ripples out once the symbol lands (the "it's done" beat)
      tl.set(Pl, { autoAlpha: 0 }, 0).fromTo(Pl, { autoAlpha: .8, scale: 1, svgOrigin: `${p.x} ${p.y}` }, { autoAlpha: 0, scale: 1.55, duration: .9, ease: 'power2.out', immediateRender: false }, tm + .35);
      tl.set(lab, { autoAlpha: 0 }, 0).set(lab, { autoAlpha: 1 }, tm + .1).fromTo(li, { yPercent: 105 }, { yPercent: 0, duration: .5, ease: 'lr.out', immediateRender: false }, tm + .1);
      tl.set(li, { yPercent: 105 }, 0);
    });
    reach(1, tEnd);
    // the little ticks on the line appear as the drawing passes them
    ticks.forEach((tk, k) => { const g = segs.find(q => q.f1 >= tickF[k]) || segs[segs.length - 1], ta = g.s + g.du * Math.max(0, Math.min(1, (tickF[k] - g.f0) / Math.max(1e-4, g.f1 - g.f0)));
      tl.set(tk, { autoAlpha: 0 }, 0).set(tk, { autoAlpha: 1, scaleY: 0, transformOrigin: '50% 50%' }, ta).to(tk, { scaleY: 1, duration: .3, ease: 'back.out(2)' }, ta); });
    if (Z) tl.set(Z, { autoAlpha: 0 }, 0).set(Z, { autoAlpha: 1, scale: 0, svgOrigin: `${G.end.x} ${G.end.y}` }, tEnd).to(Z, { scale: 1, duration: .35, ease: 'back.out(2.4)' }, tEnd);
    if (LK.thread) X.dot(G.end.x, G.end.y, tEnd, { r: 14 });
    // calm: the whole drawing drifts a few pixels while it's on screen
    tl.fromTo(`#${id}w`, { y: 10 }, { y: -12, duration: X.t1 - X.tIn, ease: 'none', immediateRender: false }, X.tIn);
    // exit: labels drop away, symbols shrink back to points, the line retracts toward its end
    tl.to(labels.map(l => l.querySelector('.nlLi')), { yPercent: -105, duration: .26, ease: 'lr.in', stagger: .03 }, X.tOut);
    tl.set(labels, { autoAlpha: 0 }, X.tOut + .4);
    tl.to(nodes, { scale: 0, duration: .3, ease: 'lr.in', stagger: .03 }, X.tOut);
    tl.to(ln, { drawSVG: '100% 100%', duration: .4, ease: 'lr.in' }, X.tOut);
    tl.to(S, { autoAlpha: 0, duration: .25, ease: 'lr.in' }, X.tOut + .2);
  },
};
