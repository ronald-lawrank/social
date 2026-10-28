/* mosaic: hundreds of small square tiles fly in from scattered positions and depths and snap into a grid that spells
   the scene's key word (or draws a big icon), then the whole mosaic breathes; optional label lines land as they are
   said. "The pieces of your case come together." The word is drawn on a canvas in the firm's headline font and
   sampled into tiles, so any word works. thread: ink tiles, the dot lands like a full stop; flat: white tiles with a
   chunky shadow on the brand colour; cards: ink and accent tiles on a floating white card; silhouette: black tiles
   with a hard offset shadow. An **accent** word (or the icon's detail strokes) gets the accent tiles. */
SCENES.mosaic = {
  label: 'Mosaic word', about: 'Small square tiles fly in from every direction and snap into a big word or icon, which then breathes; label lines land as they are said.',
  good: 'pieces coming together, building a case, "we put it all together", a one-word idea (TOGETHER, PROOF, JUSTICE)', practice: 'any',
  fields: { word: 'the word the tiles form: 1-2 short words, best at 4-7 letters a line (a long single word is set smaller) (**word** = accent tiles); said in the line if possible',
    icon: 'instead of a word, a big icon (scale, shield, gavel, doc, home, heart, briefcase, users, check, ...)',
    kicker: 'optional small label above the mosaic', lines: 'optional 1-3 short label lines (2-5 words) under the mosaic, each said in the line after the word, in order' },
  example: { say: 'Your case is built piece by piece: the records, the photos, and the witnesses.', word: 'Your **case**', kicker: 'Piece by piece',
    lines: ['The records', 'The photos', 'The witnesses'] },
  sfx: (sc, X) => { const T = SCENES.mosaic.tm(sc, X); return [{ kind: 'crackle', at: X.tIn }, { kind: 'thud', at: T.f }].concat(T.l.map(t => ({ kind: 'pop', at: t }))); },
  plain: s => String(s || '').replace(/\*\*/g, ''),
  tm(sc, X) {
    const lines = sc.lines || [], wt = sc.word ? X.times([this.plain(sc.word)])[0] : X.tIn + 1.4;
    const f = Math.min(X.tOut - .9, Math.max(X.tIn + 1.3, Math.min(X.tIn + 2.2, wt + .15)));
    const l = lines.length ? X.times(lines).map((t, i) => Math.min(X.tOut - .5, Math.max(t, f + .25 + i * .3))) : [];
    return { f, l };
  },
  pal(LK) {
    const n = LK.name, dark = (c, bg, need) => { let x = c; for (let i = 0; i < 20 && contrast(x, bg) < need; i++) x = mix(x, '#000000', .12); return x; };
    if (n === 'thread') return { base: LK.ink, acc: readable(BT.accent, LK.bg, 3), under: LK.bg, vary: .2, rx: .2, filter: '' };
    if (n === 'flat') { const lightBg = contrast('#FFFFFF', LK.bg) < 3, base = lightBg ? BT.ink : '#FFFFFF';
      return { base, acc: lightBg ? dark(LK.fillB, LK.bg, 3) : (contrast(BT.ink, LK.bg) >= 3 ? BT.ink : dark(LK.fillB, LK.bg, 3)), under: LK.bg, vary: .12, rx: .24,
        filter: `drop-shadow(0 9px 0 ${mix(LK.bg, '#000000', .28)})` }; }
    if (n === 'cards') return { base: BT.ink, acc: readable(BT.accent, '#FFFFFF', 3), under: '#FFFFFF', vary: .16, rx: .26, filter: '' };
    return { base: LK.ink, acc: LK.accent, under: LK.bg, vary: .1, rx: 0, filter: 'drop-shadow(8px 9px 0 rgba(0,0,0,.16))' };
  },
  _cache: {},
  // the tiles: the word (or icon) drawn on a canvas, sampled cell by cell; red = base ink, green = accent
  geo(sc, LK) {
    const key = JSON.stringify([sc.word, sc.icon, !!sc.kicker, (sc.lines || []).length, BT.head]);
    if (this._cache[key]) return this._cache[key];
    const nL = (sc.lines || []).length, kH = sc.kicker ? 120 : 0, labH = nL ? 64 + nL * 96 : 0, W = 940;
    const H = Math.min(nL ? 760 : 900, 1540 - 330 - kH - labH);
    let capPx = 200;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    g.globalCompositeOperation = 'lighter';
    if (sc.icon && !sc.word) {
      const ic = ICONS[sc.icon] || ICONS.scale, S = Math.min(W, H, 660), k = S / 24, ox = (W - S) / 2, oy = (H - S) / 2; capPx = S * .4;
      g.setTransform(k, 0, 0, k, ox, oy); g.lineWidth = 2.7; g.lineCap = 'round'; g.lineJoin = 'round';
      const draw = (list, col, fill) => (list || []).forEach(d => {
        if (d.startsWith('c ')) { const [cx, cy, r] = d.slice(2).split(' ').map(Number); g.beginPath(); g.arc(cx, cy, r + (fill ? 0 : 0), 0, 7); g.fillStyle = col; g.fill(); return; }
        const p = new Path2D(d); if (fill) { g.fillStyle = col; g.fill(p); } else { g.strokeStyle = col; g.stroke(p); } });
      draw(ic.b, '#FF0000'); draw(ic.bf, '#FF0000', 1); draw(ic.a, '#00FF00'); draw(ic.af, '#00FF00', 1);
      g.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      const toks = []; let acc = false;
      String(sc.word || 'Together').toUpperCase().split(/(\*\*)/).forEach(p => { if (p === '**') { acc = !acc; return; } p.split(/\s+/).filter(Boolean).forEach(w => toks.push({ w, acc })); });
      const font = F => `800 ${F}px "${BT.head}", "Arial Black", sans-serif`;
      g.font = font(100); const sp = 7, wd = s => [...s].reduce((a, ch) => a + g.measureText(ch).width + sp, -sp), space = g.measureText(' ').width + sp;
      // one line, or two balanced lines when the words are long together
      let rows = [toks];
      if (toks.length > 1 && toks.map(t => t.w).join(' ').length > 6) {
        let best = null; for (let i = 1; i < toks.length; i++) { const a = toks.slice(0, i), b = toks.slice(i), m = Math.max(...[a, b].map(r => r.map(t => t.w).join(' ').length)); if (!best || m < best[0]) best = [m, i]; }
        rows = [toks.slice(0, best[1]), toks.slice(best[1])];
      }
      const rw = r => r.reduce((a, t, i) => a + wd(t.w) + (i ? space : 0), 0), cap = g.measureText('H').actualBoundingBoxAscent, lg = 30;
      const F = Math.min(400, (W * .97) / (Math.max(...rows.map(rw)) / 100), (H * .96) / ((rows.length * cap + (rows.length - 1) * lg) / 100));
      const s = F / 100, tot = (rows.length * cap + (rows.length - 1) * lg) * s, widths = rows.map(rw); g.font = font(F); g.textBaseline = 'alphabetic';
      capPx = cap * s;
      rows.forEach((r, j) => { let x = (W - widths[j] * s) / 2; const y = (H - tot) / 2 + (j * (cap + lg) + cap) * s;
        r.forEach((t, i) => { if (i) x += space * s; g.fillStyle = t.acc ? '#00FF00' : '#FF0000'; [...t.w].forEach(ch => { g.fillText(ch, x, y); x += g.measureText(ch).width + sp * s; }); }); });
    }
    const D = g.getImageData(0, 0, W, H).data;
    const sample = c => { const out = [], cols = Math.floor(W / c), rws = Math.floor(H / c), ox = (W - cols * c) / 2, oy = (H - rws * c) / 2;
      for (let r = 0; r < rws; r++) for (let q = 0; q < cols; q++) { let R = 0, G = 0, n = 0;
        for (let y = Math.floor(oy + r * c) + 1; y < oy + (r + 1) * c - 1; y += 2) for (let x = Math.floor(ox + q * c) + 1; x < ox + (q + 1) * c - 1; x += 2) { const i = (y * W + x) * 4; R += D[i]; G += D[i + 1]; n++; }
        const cov = Math.max(R, G) / (255 * n); if (cov > .42) out.push({ x: ox + q * c, y: oy + r * c, q, r, a: G > R ? 1 : 0 }); }
      return out; };
    let c = Math.max(14, Math.round(capPx / 11)), T = sample(c); while (T.length > 460 && c < 64) { c += 2; T = sample(c); }
    // the mosaic and its labels, centred together in the space under the kicker
    const y0 = Math.min(...T.map(t => t.y)), y1 = Math.max(...T.map(t => t.y)) + c, x0 = Math.min(...T.map(t => t.x)), x1 = Math.max(...T.map(t => t.x)) + c;
    const block = kH + (y1 - y0) + labH, dy = 330 + kH + Math.max(0, (1540 - 330 - block) / 2) - y0, dx = 540 - (x0 + x1) / 2;
    T.forEach(t => { t.x += dx; t.y += dy; });
    const out = { c, T, box: { x0: x0 + dx, x1: x1 + dx, y0: y0 + dy, y1: y1 + dy }, labTop: y1 + dy + 64, kY: y0 + dy - kH, labEnd: y1 + dy + labH };
    this._cache[key] = out; return out;
  },
  html(sc, X) {
    if (typeof document === 'undefined') return '';
    const LK = X.LK, n = LK.name, id = X.id, P = this.pal(LK), G = this.geo(sc, LK), c = G.c, s = Math.max(c - Math.max(2, c * .14), 4), r = seeded(31);
    const tiles = G.T.map((t, i) => { const col = mix(t.a ? P.acc : P.base, P.under, r() * P.vary);
      return `<rect class="mzT" x="${(t.x + (c - s) / 2).toFixed(1)}" y="${(t.y + (c - s) / 2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" rx="${(s * P.rx).toFixed(1)}" fill="${col}"/>`; }).join('');
    // a few loose tiles around the mosaic, at other depths
    const B = G.box, rs = seeded(77), strays = []; let tries = 0;
    while (strays.length < 18 && tries++ < 400) { const sz = c * (.6 + rs() * 1.3), x = 60 + rs() * 960, y = Math.max(G.kY + (sc.kicker ? 80 : 0), 330, B.y0 - 150) + rs() * (B.y1 - B.y0 + 190);
      if (x > B.x0 - 30 && x < B.x1 + 10 && y > B.y0 - 30 && y < B.y1 + 10) continue; if (y + sz > G.labTop - 20) continue;
      strays.push(`<rect class="mzS" x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${sz.toFixed(0)}" height="${sz.toFixed(0)}" rx="${(sz * P.rx).toFixed(1)}" fill="${rs() < .3 ? P.acc : P.base}" opacity="${(.18 + rs() * .35).toFixed(2)}"/>`); }
    const card = n === 'cards' ? UI.card(LK, { id: id + 'c', x: 50, y: B.y0 - 70, w: 980, h: Math.max(B.y1 + 70, G.labEnd + 40) - (B.y0 - 70) }) : '';
    const up = LK.headCase === 'upper';
    const labs = (sc.lines || []).map((l, i) => `<div class="k-abs mzL" style="left:90px;width:fit-content;max-width:900px;top:${G.labTop + i * 96}px;min-height:80px;display:flex;align-items:center;gap:24px">
        <svg class="mzB" width="34" height="34" viewBox="0 0 34 34" style="flex:none">${n === 'thread' ? `<circle cx="17" cy="17" r="13" fill="none" stroke="${LK.line}" stroke-width="4"/>`
          : `<rect x="2" y="2" width="30" height="30" rx="${30 * P.rx}" fill="${P.acc}"/>`}</svg>
        <div class="mzX" data-qa="text" style="font:${LK.headWeight} ${String(l).length > 26 ? 42 : 50}px/1.1 var(--head);color:${LK.ink};white-space:nowrap;${up ? 'text-transform:uppercase;letter-spacing:.02em;' : ''}">${accentize(l, 'ka')}</div></div>`).join('');
    return `${card}${sc.kicker ? UI.text(LK, { id: id + 'k', text: sc.kicker, x: 90, y: G.kY + 10, w: 900, size: 40, weight: 800, color: LK.accentText, align: 'center', upper: true, font: 'head' }) : ''}
      <svg class="svgL" viewBox="0 0 1080 1920"><g id="${id}s">${strays.join('')}</g><g id="${id}g" style="filter:${P.filter || 'none'}">${tiles}</g></svg>${labs}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, G = this.geo(sc, LK), T = this.tm(sc, X), Tl = G.T, B = G.box, cx = (B.x0 + B.x1) / 2, cy = (B.y0 + B.y1) / 2;
    const grp = X.$(`#${id}g`), rects = [...grp.querySelectorAll('.mzT')], strays = [...X.$(`#${id}s`).querySelectorAll('.mzS')];
    const r = seeded(5), start = X.tIn - .2, span = Math.max(.4, T.f - .62 - start);
    // where each tile starts: pushed out from the centre, at a depth (near tiles are big and far away from home)
    const fly = Tl.map(t => { const z = r(), a = Math.atan2(t.y - cy, t.x - cx) + (r() - .5) * 1.4, d = 380 + z * 900 + r() * 200;
      return { x: Math.cos(a) * d, y: Math.max(Math.sin(a) * d, 340 - t.y), s: .25 + z * 2.6, rot: (r() - .5) * 260, at: Math.min(1, .62 * (t.x - B.x0) / Math.max(1, B.x1 - B.x0) + .38 * r()) * span }; });
    tl.set(grp, { autoAlpha: 0 }, 0).set(grp, { autoAlpha: 1 }, start);
    tl.set(rects, { x: i => fly[i].x, y: i => fly[i].y, scale: i => fly[i].s, rotation: i => fly[i].rot, opacity: 0, transformOrigin: '50% 50%' }, 0);
    tl.fromTo(rects, { opacity: 0 }, { opacity: 1, duration: .15, ease: 'none', stagger: i => fly[i].at, immediateRender: false }, start);
    tl.to(rects, { x: 0, y: 0, scale: 1, rotation: 0, duration: .62, ease: 'lr.out', stagger: i => fly[i].at }, start);
    // loose tiles drift in and keep floating
    const rs = seeded(11);
    const sf = strays.map(() => ({ x: (rs() - .5) * 700, y: (rs() - .5) * 500, d: .3 + rs() * .5, dx: (rs() - .5) * 40, dy: (rs() - .5) * 50 }));
    tl.set(strays, { x: i => sf[i].x, y: i => sf[i].y, scale: 2.2, rotation: 90, autoAlpha: 0, transformOrigin: '50% 50%' }, 0);
    strays.forEach((el, i) => { const t = start + sf[i].d * span;
      tl.set(el, { autoAlpha: 1 }, t).to(el, { x: 0, y: 0, scale: 1, rotation: 0, duration: .7, ease: 'lr.out' }, t);
      tl.to(el, { x: sf[i].dx, y: sf[i].dy, rotation: sf[i].dx / 3, duration: Math.max(.5, X.tOut - t - .7), ease: 'sine.inOut' }, t + .7); });
    // the snap: a ripple runs across the finished mosaic, then it breathes
    tl.to(rects, { scale: 1.3, duration: .16, ease: 'power2.out', yoyo: true, repeat: 1, stagger: i => .45 * (Tl[i].x - B.x0) / Math.max(1, B.x1 - B.x0) }, T.f);
    const br = X.tOut - T.f - .9;
    if (br > .4) tl.fromTo(grp, { scale: 1 }, { scale: 1.035, duration: br, ease: 'sine.inOut', svgOrigin: `${cx} ${cy}`, immediateRender: false }, T.f + .75);
    if (LK.thread) X.dot(B.x1 + 34, B.y1 - 22, T.f, { r: 20 });
    if (sc.kicker) { const K = `#${id}k`; tl.set(K, { autoAlpha: 0 }, 0).set(K, { autoAlpha: 1, y: 30 }, X.tIn).to(K, { y: 0, duration: .45, ease: 'lr.out' }, X.tIn); M.exit(tl, K, X.tOut); }
    if (LK.name === 'cards') { const C = `#${id}c`; tl.set(C, { autoAlpha: 0 }, 0).set(C, { autoAlpha: 1, y: 120, scale: .96 }, X.tIn - .25).to(C, { y: 0, scale: 1, duration: .55, ease: 'lr.out' }, X.tIn - .25);
      tl.to(C, { autoAlpha: 0, y: -50, duration: .3, ease: 'lr.in' }, X.tOut + .05); }
    // the labels: a tile bullet snaps in, the words slide after it
    const rows = [...X.$(`#${id}g`).closest('.scn').querySelectorAll('.mzL')], rel = rows.length ? MK.rel(rows[0].closest('.stage')) : null;
    rows.forEach(r => { const tx = r.querySelector('.mzX'); let f = parseFloat(getComputedStyle(tx).fontSize);   // long lines shrink to the frame
      while (58 + tx.scrollWidth > 900 && f > 32) { f -= 2; tx.style.fontSize = f + 'px'; }
      if (58 + tx.scrollWidth > 900) Object.assign(tx.style, { whiteSpace: 'normal', width: '842px' }); });
    { let y = G.labTop; rows.forEach(r => { r.style.top = y + 'px'; y += Math.max(80, r.offsetHeight) + 16; }); }
    if (rows.length) { const m = Math.min(...rows.map(r => parseFloat(getComputedStyle(r.querySelector('.mzX')).fontSize))); rows.forEach(r => { r.querySelector('.mzX').style.fontSize = m + 'px'; }); }
    if (rows.length) { const w = Math.max(...rows.map(r => 58 + r.querySelector('.mzX').scrollWidth)); rows.forEach(r => { r.style.left = Math.round(540 - w / 2) + 'px'; }); }   // one left edge, centred as a block
    rows.forEach((row, i) => { const t = T.l[i], b = row.querySelector('.mzB'), tx = row.querySelector('.mzX');
      tl.set(row, { autoAlpha: 0 }, 0).set(row, { autoAlpha: 1 }, t - .05);
      tl.set(b, { scale: 0, rotation: -90, transformOrigin: '50% 50%' }, 0).to(b, { scale: 1, rotation: 0, duration: .4, ease: 'back.out(2)' }, t - .05);
      tl.set(tx, { x: 40, clipPath: 'inset(0 100% 0 0)' }, 0).to(tx, { x: 0, clipPath: 'inset(0 0% 0 0)', duration: .5, ease: 'lr.out' }, t);
      if (LK.thread) { const q = rel(b); X.dot(q.x + q.w / 2, q.y + q.h / 2, t + .02, { r: 13 }); }
      tl.to(row, { autoAlpha: 0, y: -30, duration: .26, ease: 'lr.in' }, X.tOut + i * .03); });
    // exit: the mosaic bursts apart
    const rx = seeded(3);
    tl.to(rects, { x: i => (Tl[i].x - cx) * (1.2 + rx()), y: i => (Tl[i].y - cy) * (1.2 + rx()) - 100, rotation: () => (rx() - .5) * 200, scale: .2, opacity: 0, duration: .38, ease: 'lr.in', stagger: { each: .0004, from: 'center' } }, X.tOut);
    tl.to(strays, { autoAlpha: 0, scale: .2, duration: .3, ease: 'lr.in' }, X.tOut);
  },
};
