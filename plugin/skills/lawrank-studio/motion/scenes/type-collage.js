/* type-collage: an editorial type-specimen sheet. Hairline rules draw a grid; the line's key words stamp into its cells
   as they're spoken, each in a different size, weight and treatment (heavy, italic, reversed out of a block, wide
   caps), with a big typographic glyph and "Aa" specimens filling the gaps. On the final word everything clears and the
   single strongest word sets alone, big, on a bar. Thread: ink type on hairlines, the dot lands at the end of the bar;
   flat: white type on the brand colour with deep-colour blocks; cards: the sheet is a white card; silhouette: black
   type, black slabs, accent glyph block, uppercase. */
SCENES['type-collage'] = {
  label: 'Type collage', about: 'Key words stamp into an editorial type grid at different sizes and weights as they are spoken, then everything clears to the single strongest word.',
  good: 'hooks, myth-busting, a list of worries that resolves to one promise', practice: 'any',
  fields: { words: '3-6 key words or short phrases (1-2 words each), each said in the line, in order',
    final: 'the one word left at the end (1-2 words), said in the line after the others',
    glyph: 'optional: one character for the big glyph block (default "?" if the line asks a question, else "&")' },
  example: { say: 'Insurance forms. Deadlines. Phone calls. Fine print. Our team keeps it all simple.',
    words: ['Insurance forms', 'Deadlines', 'Phone calls', 'Fine print'], final: 'Simple.' },
  sfx: (sc, X) => { const T = SCENES['type-collage'].tms(sc, X); return [...T.ts.map(t => ({ kind: 'thud', at: t })), { kind: 'impact', at: T.tF }]; },
  norm: w => String(w).toLowerCase().replace(/\*\*/g, '').replace(/[^a-z0-9']/g, ''),
  tms(sc, X) {
    const me = SCENES['type-collage'], ws = sc.words.slice(0, 6), ts = X.times(ws), last = ts[ts.length - 1];
    const f = me.norm(String(sc.final).split(/\s+/)[0]), hit = X.line.words.find(w => w.t > last + .05 && f && me.norm(w.w) === f);
    const tF = Math.max(Math.min(last + .6, X.tOut - .9), Math.min(hit ? hit.t : last + .9, X.tOut - 1.2));
    // every word is on the sheet before it clears (a word said very late lands a little early)
    return { ts: ts.map((t, i) => Math.min(t, tF - .35 - (ts.length - 1 - i) * .12)), tF };
  },
  // the specimen sheet: 3 columns x 6 rows; word cells (W) in reading order, ornament cells (O)
  G: { x: 70, y: 340, w: 940, rows: 6, rh: 196 },
  cells: {
    W1: [0, 0, 3, 1, 'heavy'], O1: [0, 1, 1, 2, 'glyph'], W2: [1, 1, 2, 1, 'italic'], W3: [1, 2, 2, 1, 'ink'],
    W4: [0, 3, 2, 2, 'accent'], O2: [2, 3, 1, 1, 'spec'], W5: [2, 4, 1, 1, 'small'], W6: [0, 5, 3, 1, 'wide'],
  },
  assign(n) { return n <= 3 ? ['W1', 'W3', 'W4'] : n === 4 ? ['W1', 'W2', 'W3', 'W4'] : n === 5 ? ['W1', 'W2', 'W3', 'W4', 'W6'] : ['W1', 'W2', 'W3', 'W4', 'W5', 'W6']; },
  rect(c) { const G = SCENES['type-collage'].G, cw = G.w / 3; return { x: G.x + c[0] * cw, y: G.y + c[1] * G.rh, w: c[2] * cw, h: c[3] * G.rh }; },
  pal(LK) {
    const nm = LK.name, ink = nm === 'cards' ? LK.surfaceInk : LK.ink, paper = nm === 'cards' ? '#FFFFFF' : LK.bg;
    const gB = nm === 'flat' ? LK.fillB : nm === 'silhouette' ? LK.accent : BT.accent;
    const kB = nm === 'flat' ? LK.fillA : ink;
    return { ink, paper, rule: nm === 'flat' ? mix(LK.bg, LK.ink, .55) : nm === 'silhouette' ? LK.ink : mix(ink, paper, .55), rw: nm === 'flat' || nm === 'silhouette' ? 5 : 2.5,
      acc: nm === 'cards' ? readable(BT.accent, '#FFFFFF', 3) : LK.accentText, gB, gT: readable(nm === 'silhouette' ? LK.bg : nm === 'flat' ? '#FFFFFF' : BT.onAccent, gB, 3),
      kB, kT: readable(nm === 'flat' ? BT.ink : paper, kB, 4.5), bar: nm === 'flat' ? LK.fillB : nm === 'silhouette' ? LK.accent : BT.accent };
  },
  html(sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, me = SCENES['type-collage'], P = me.pal(LK), up = LK.headCase === 'upper';
    const words = sc.words.slice(0, 6), use = me.assign(words.length), G = me.G;
    const glyph = sc.glyph || (/\?/.test(X.line.text || '') ? '?' : '&');
    const tcase = up ? 'text-transform:uppercase;' : '';
    const style = {
      heavy: `font:900 170px/0.95 var(--head);color:${P.ink};letter-spacing:-.02em;${tcase}`,
      italic: `font:italic 400 128px/1 var(--head);color:${P.ink};letter-spacing:-.01em;${tcase}`,
      ink: `font:800 120px/1 var(--head);color:${P.kT};${tcase}`,
      accent: `font:900 190px/0.92 var(--head);color:${P.acc};letter-spacing:-.02em;white-space:normal;${tcase}`,
      small: `font:800 76px/1 var(--head);color:${P.ink};${tcase}`,
      wide: `font:300 84px/1 var(--head);color:${P.ink};text-transform:uppercase;letter-spacing:.16em`,
    };
    const cellBox = (key, inner, opts = {}) => { const c = me.cells[key], r = me.rect(c);
      return `<div class="tcC k-abs" data-k="${key}" ${opts.qa ? 'data-qa="text"' : ''} style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;overflow:hidden">
        ${opts.bg ? `<div class="tcB k-abs" style="inset:${P.rw}px 0 0 ${P.rw}px;background:${opts.bg}"></div>` : ''}${inner}</div>`; };
    const wordCell = (key, w, i) => { const kind = me.cells[key][4], pad = kind === 'wide' ? 26 : 22;
      const r = me.rect(me.cells[key]), wrap = kind === 'accent';
      return cellBox(key, `<div class="tcW k-abs" data-i="${i}" data-wrap="${wrap ? 1 : 0}" style="left:${pad + P.rw}px;${wrap ? `width:${r.w - 2 * pad - P.rw}px;` : ''}bottom:${kind === 'wide' ? 52 : 20}px;white-space:${kind === 'accent' ? 'normal' : 'nowrap'};${style[kind]}">${esc(String(w).replace(/\*\*/g, ''))}</div>`,
        { qa: true, bg: kind === 'ink' ? P.kB : null }); };
    const deco = Object.keys(me.cells).filter(k => !use.includes(k)).map(key => {
      const kind = me.cells[key][4];
      if (kind === 'glyph') return cellBox(key, `<div class="tcG k-abs" style="left:0;right:0;top:50%;margin-top:-170px;text-align:center;font:900 300px/340px var(--head);color:${P.gT}">${esc(glyph)}</div>`, { bg: P.gB });
      const txt = kind === 'italic' ? 'Aa Bb' : kind === 'ink' ? 'Aa' : kind === 'small' || kind === 'spec' ? (kind === 'spec' ? 'Aa' : '&amp;') : kind === 'wide' ? 'Aa Bb Cc Dd Ee' : 'Aa';
      const st = kind === 'spec' ? `font:900 130px/1 var(--head)` : kind === 'small' ? `font:400 120px/1 var(--head)` : kind === 'italic' ? `font:italic 300 120px/1 var(--head)` : kind === 'wide' ? `font:italic 300 64px/1 var(--head);letter-spacing:.12em` : `font:800 150px/1 var(--head)`;
      return cellBox(key, `<div class="tcD k-abs" style="left:${22 + P.rw}px;bottom:22px;white-space:nowrap;${st};color:${kind === 'ink' ? P.kT : P.ink}">${txt}</div>`, { bg: kind === 'ink' ? P.kB : null });
    }).join('');
    // the rules: every cell edge once, plus the outer box
    const seg = new Map(), add = (x1, y1, x2, y2) => seg.set([x1, y1, x2, y2].map(v => v.toFixed(1)).join(','), [x1, y1, x2, y2]);
    Object.values(me.cells).forEach(c => { const r = me.rect(c); add(r.x, r.y, r.x + r.w, r.y); add(r.x, r.y, r.x, r.y + r.h); });
    add(G.x + G.w, G.y, G.x + G.w, G.y + G.rows * G.rh); add(G.x, G.y + G.rows * G.rh, G.x + G.w, G.y + G.rows * G.rh);
    const rules = [...seg.values()].map(([x1, y1, x2, y2]) => `<line class="tcR" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`).join('');
    const card = nm === 'cards' ? UI.card(LK, { id: id + 'c', x: 40, y: G.y - 30, w: 1000, h: G.rows * G.rh + 60 }) : '';
    const fin = String(sc.final).replace(/\*\*/g, ''), fy = 820;
    const slab = nm === 'silhouette' ? `<div id="${id}fs" class="k-abs" style="left:56px;top:${fy - 40}px;width:968px;height:360px;background:${LK.ink};box-shadow:18px 18px 0 ${LK.accent}"></div>` : '';
    return `${card}<div id="${id}g" class="k-abs" style="left:0;top:0;width:1080px;height:1920px">
      <svg id="${id}r" class="k-abs" style="left:0;top:0;overflow:visible" width="1080" height="1920" stroke="${P.rule}" stroke-width="${P.rw}" stroke-linecap="square">${rules}</svg>
      ${deco}${words.map((w, i) => wordCell(use[i], w, i)).join('')}</div>
      ${slab}<div id="${id}f" class="k-abs" data-qa="text" style="left:70px;top:${fy}px;width:940px;height:280px;overflow:hidden;text-align:center">
        <div id="${id}fi" style="display:inline-block;white-space:nowrap;font:900 250px/280px var(--head);letter-spacing:-.025em;color:${nm === 'silhouette' ? LK.bg : P.ink};${tcase}">${esc(fin)}</div></div>
      <div id="${id}fb" class="k-abs" style="left:${nm === 'silhouette' ? 120 : 200}px;top:${fy + 300}px;width:${nm === 'silhouette' ? 840 : 680}px;height:${nm === 'silhouette' ? 14 : 22}px;background:${P.bar}"></div>`;
  },
  build(tl, sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, me = SCENES['type-collage'], { ts, tF } = me.tms(sc, X), G = me.G;
    const g = X.$(`#${id}g`), rules = [...X.$(`#${id}r`).querySelectorAll('.tcR')], cells = [...g.querySelectorAll('.tcC')];
    const wordCells = cells.filter(c => c.querySelector('.tcW')).sort((a, b) => +a.querySelector('.tcW').dataset.i - +b.querySelector('.tcW').dataset.i);
    const decoCells = cells.filter(c => !c.querySelector('.tcW'));
    // fit each word to its cell (a long word shrinks alone)
    wordCells.forEach(c => { const w = c.querySelector('.tcW'), wrap = w.dataset.wrap === '1', maxW = c.clientWidth - 50, maxH = c.clientHeight - 34;
      const over = () => wrap ? (w.scrollWidth > w.clientWidth + 1 || w.offsetHeight > maxH) : (w.offsetWidth > maxW || w.offsetHeight > maxH);
      let s = parseFloat(getComputedStyle(w).fontSize);
      for (let k = 0; k < 40 && over() && s > 40; k++) { s = Math.max(40, s * .95); w.style.fontSize = s + 'px'; } });
    const F = X.$(`#${id}f`), Fi = X.$(`#${id}fi`);
    { let s = 250; for (let k = 0; k < 30 && Fi.offsetWidth > 900 && s > 60; k++) { s *= .94; Fi.style.fontSize = s + 'px'; } }
    if (nm === 'cards') { tl.set(`#${id}c`, { autoAlpha: 0 }, 0).set(`#${id}c`, { autoAlpha: 1, y: 140 }, X.tIn - .25).to(`#${id}c`, { y: 0, duration: .55, ease: 'lr.out' }, X.tIn - .25);
      tl.to(`#${id}c`, { autoAlpha: 0, y: -50, duration: .3, ease: 'lr.in' }, X.tOut + .05); }
    // the rules draw first, from the top left, like a specimen sheet being ruled up
    tl.set(rules, { drawSVG: '0%' }, 0).to(rules, { drawSVG: '100%', duration: .5, ease: 'lr.out', stagger: { each: .025, from: 'start' } }, X.tIn - .2);
    // each word stamps in on its word: its block slams up, the type punches in from a bigger size with a little tilt
    wordCells.forEach((c, i) => {
      const t = ts[i], w = c.querySelector('.tcW'), B = c.querySelector('.tcB'), tilt = [-3, 2.5, -2, 3, -2.5, 2][i % 6];
      tl.set(c, { autoAlpha: 0 }, 0).set(c, { autoAlpha: 1 }, t - .08);
      if (B) tl.fromTo(B, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: .28, ease: 'power4.out', immediateRender: false }, t - .08);
      const room = (1060 - c.offsetLeft - w.offsetLeft) / Math.max(1, w.offsetWidth), sc0 = Math.max(1.06, Math.min(1.3, room));   // never punches past the frame
      tl.set(w, { transformOrigin: '0% 100%' }, 0).fromTo(w, { scale: sc0, rotation: tilt * (sc0 - 1) / .3, yPercent: 0 }, { scale: 1, rotation: 0, duration: .36, ease: 'power4.out', immediateRender: false }, t - .04);
    });
    // ornaments fill the gaps between words (the glyph block first)
    decoCells.forEach((c, k) => {
      const kind = c.dataset.k, i = Math.min(ts.length - 1, k), t = kind === 'O1' ? X.tIn + .1 : Math.min(tF - .3, (ts[i] + (ts[i + 1] ?? ts[i] + .6)) / 2 + .05);
      const B = c.querySelector('.tcB'), inner = c.querySelector('.tcG, .tcD');
      tl.set(c, { autoAlpha: 0 }, 0).set(c, { autoAlpha: 1 }, t);
      if (B) tl.fromTo(B, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: .4, ease: 'power4.out', immediateRender: false }, t);
      tl.fromTo(inner, { yPercent: 110 }, { yPercent: 0, duration: .5, ease: 'lr.out', immediateRender: false }, t + .08);
      if (kind === 'O1') tl.to(inner, { rotation: 8, duration: Math.max(.5, tF - t - .5), ease: 'sine.inOut' }, t + .6);
    });
    // a slow push-in while the sheet fills
    tl.fromTo(g, { scale: 1, transformOrigin: '50% 45%' }, { scale: 1.025, duration: Math.max(.5, tF - X.tIn), ease: 'none', immediateRender: false }, X.tIn);
    // clear: cells snap away row by row, the rules retract, then the one word sets alone
    const all = [...wordCells, ...decoCells].sort((a, b) => a.offsetTop - b.offsetTop);
    all.forEach((c, k) => { const inner = c.querySelector('.tcW, .tcG, .tcD'), te = tF - .22 + k * .015;
      tl.to(inner, { yPercent: -110, duration: .2, ease: 'lr.in' }, te); tl.to(c, { autoAlpha: 0, duration: .16, ease: 'power1.in' }, te + .02); });
    tl.to(rules, { drawSVG: '100% 100%', duration: .3, ease: 'lr.in', stagger: .008 }, tF - .2);
    const tS = tF + .14;
    tl.set(F, { autoAlpha: 0 }, 0).set(F, { autoAlpha: 1 }, tS).fromTo(Fi, { yPercent: 100 }, { yPercent: 0, duration: .5, ease: 'lr.out', immediateRender: false }, tS);
    tl.set(Fi, { yPercent: 100 }, 0);
    tl.to(Fi, { scale: 1.035, duration: Math.max(.4, X.tOut - tS - .5), ease: 'none' }, tS + .5);
    const bar = `#${id}fb`;
    tl.set(bar, { autoAlpha: 0 }, 0).set(bar, { autoAlpha: 1, scaleX: 0, transformOrigin: '0% 50%' }, tS + .2).to(bar, { scaleX: 1, duration: .5, ease: 'lr.out' }, tS + .2);
    if (nm === 'silhouette') { tl.set(`#${id}fs`, { autoAlpha: 0 }, 0).set(`#${id}fs`, { autoAlpha: 1, scaleY: 0, transformOrigin: '50% 50%' }, tS - .1).to(`#${id}fs`, { scaleY: 1, duration: .35, ease: 'power4.out' }, tS - .1);
      tl.to(`#${id}fs`, { scaleY: 0, duration: .3, ease: 'lr.in' }, X.tOut + .05); }
    if (LK.thread) { const o = me.rect(me.cells.O1); X.dot(o.x + o.w - 40, o.y + o.h - 40, X.tIn + .3, { r: 14 }); X.dot(200 + 680 + 30, 820 + 311, tS + .7, { r: 16 }); }
    tl.to(Fi, { yPercent: -100, duration: .26, ease: 'lr.in' }, X.tOut).set(F, { autoAlpha: 0 }, X.tOut + .28);
    tl.to(bar, { scaleX: 0, transformOrigin: '100% 50%', duration: .3, ease: 'lr.in' }, X.tOut);
  },
};
