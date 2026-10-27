/* myth-fact: a card shows MYTH and a common belief; a line strikes the belief out, then the card flips over to FACT
   and the truth. Thread: a hand-drawn accent strike, the dot lands on the fact's tick; flat: a deep-colour myth face
   turns into a white fact face; cards: a crisp UI card with chips; silhouette: a black slab flips to paper. */
SCENES['myth-fact'] = {
  label: 'Myth vs fact', about: 'A card shows a myth; it gets struck through, then the card flips over to show the fact.',
  good: 'common misconceptions, "you don\'t need a lawyer if…", what people get wrong', practice: 'any',
  fields: { myth: 'the belief (4-12 words), said first', fact: 'the truth (4-14 words), said second, ideally as its own sentence',
    labels: 'optional {myth, fact} tag words (default "Myth" / "Fact")' },
  example: { say: 'Myth: talking to a lawyer means going to court. Fact: many questions are answered in one conversation.',
    myth: 'Talking to a lawyer means going to court.', fact: 'Many questions are answered in one conversation.' },
  sfx: (sc, X) => { const r = SCENES['myth-fact'].mfTimes(sc, X); return [{ kind: 'crackle', at: r.strike }, { kind: 'whoosh', at: r.flip - .1 }, { kind: 'chime', at: r.flip + .3 }]; },
  mfTimes(sc, X) {
    const ss = X.line.sentences || [], two = ss.length > 1, f = two ? X.sent(1).t : X.times([sc.myth, sc.fact])[1];
    const flip = Math.min(X.tOut - 1.4, Math.max(X.tIn + 1.6, f - .05));
    const strike = Math.min(flip - .75, Math.max(X.tIn + .7, (two ? X.sent(0).end : flip - .9) - .45));
    return { strike, flip };
  },
  html(sc, X) {
    const LK = X.LK, nm = LK.name, up = LK.headCase === 'upper', lb = Object.assign({ myth: 'Myth', fact: 'Fact' }, sc.labels || {});
    const box = { x: 100, y: 560, w: 880, h: 860 }, sz = t => { const n = String(t).length; return n > 80 ? 58 : n > 50 ? 68 : 82; };
    const front = { bg: nm === 'flat' ? LK.fillB : nm === 'silhouette' ? LK.ink : LK.surface };
    front.ink = contrast('#FFFFFF', front.bg) >= 4.5 ? '#FFFFFF' : nm === 'silhouette' ? LK.surface : BT.ink;
    if (nm === 'cards' || nm === 'thread') front.ink = mix(BT.ink, '#FFFFFF', .12);
    const back = { bg: nm === 'silhouette' ? LK.surface : '#FFFFFF', ink: nm === 'silhouette' ? LK.ink : BT.ink };
    const xMark = c => `<svg width="34" height="34" viewBox="0 0 34 34"><path d="M7 7 L27 27 M27 7 L7 27" stroke="${c}" stroke-width="6" stroke-linecap="${nm === 'silhouette' ? 'square' : 'round'}"/></svg>`;
    const ckMark = c => `<svg width="38" height="34" viewBox="0 0 38 34"><path class="mfK" d="M5 18 L14 27 L33 7" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const tagF = nm === 'flat' ? { bg: '#FFFFFF', ink: readable(LK.fillB, '#FFFFFF', 4.5) } : nm === 'silhouette' ? { bg: LK.surface, ink: LK.ink }
      : { bg: mix(BT.ink, '#FFFFFF', .9), ink: BT.ink };
    const tagB = nm === 'silhouette' ? { bg: LK.ink, ink: LK.surface } : { bg: BT.accent, ink: contrast('#FFFFFF', BT.accent) >= 4.5 ? '#FFFFFF' : BT.ink };
    const tag = (t, c, mark, idn) => `<div id="${idn}" style="display:inline-flex;align-items:center;gap:14px;align-self:flex-start;padding:14px 30px 14px 22px;background:${c.bg};color:${c.ink};
      border-radius:${nm === 'silhouette' ? 0 : 40}px;font:800 36px/1 var(--head);letter-spacing:.14em;text-transform:uppercase" data-qa="text">${mark(c.ink)}${esc(t)}</div>`;
    const face = (cls, bg, inner, extra = '') => `<div class="${cls}" style="position:absolute;inset:0;background:${bg};border-radius:${LK.radius}px;padding:80px 76px;display:flex;flex-direction:column;justify-content:center;gap:52px;
      backface-visibility:hidden;${extra}">${inner}</div>`;
    const txt = (idn, t, ink) => `<div id="${idn}" data-qa="text" style="position:relative;font:${LK.headWeight} ${sz(t)}px/1.14 var(--head);color:${ink};${up ? 'text-transform:uppercase;' : ''}">${esc(t)}</div>`;
    const sh = nm === 'flat' ? `0 22px 0 ${mix(LK.bg, '#000000', .28)}` : LK.shadow, edge = nm === 'thread' ? `border:${LK.edge};` : '';
    const ghost = nm === 'flat' ? `<div id="${X.id}g" class="k-abs" style="left:${box.x + 34}px;top:${box.y + 40}px;width:${box.w}px;height:${box.h}px;border-radius:${LK.radius}px;background:${LK.fillC};transform:rotate(4deg)"></div>`
      : nm === 'cards' ? `<div id="${X.id}g" class="k-abs" style="left:${box.x + 40}px;top:${box.y + 50}px;width:${box.w - 80}px;height:${box.h}px;border-radius:${LK.radius}px;background:rgba(255,255,255,.55);box-shadow:0 20px 50px rgba(30,20,10,.10)"></div>` : '';
    return `${ghost}<div id="${X.id}c" class="k-abs" style="left:${box.x}px;top:${box.y}px;width:${box.w}px;height:${box.h}px;border-radius:${LK.radius}px;box-shadow:${sh};${edge}">
      ${face('mfF', front.bg, `${tag(lb.myth, tagF, xMark, X.id + 'tf')}${txt(X.id + 'm', sc.myth, front.ink)}<svg id="${X.id}k" class="k-abs" style="left:0;top:0;overflow:visible" width="10" height="10"></svg>`)}
      ${face('mfB', back.bg, `${nm === 'cards' ? `<div style="position:absolute;left:0;right:0;top:0;height:14px;background:${BT.accent};border-radius:${LK.radius}px ${LK.radius}px 0 0"></div>` : ''}${tag(lb.fact, tagB, ckMark, X.id + 'tb')}${txt(X.id + 'f', sc.fact, back.ink)}`)}
    </div>`;
  },
  build(tl, sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, { strike, flip } = SCENES['myth-fact'].mfTimes(sc, X), C = X.$(`#${id}c`);
    const F = C.querySelector('.mfF'), B = C.querySelector('.mfB'), mt = X.$(`#${id}m`), K = X.$(`#${id}k`), rel = MK.rel(C.closest('.stage'));
    // card in
    tl.set(C, { autoAlpha: 0 }, 0).set(C, { autoAlpha: 1, y: 160, rotation: -3, transformPerspective: 2200 }, X.tIn - .15).to(C, { y: 0, rotation: 0, duration: .6, ease: 'lr.out' }, X.tIn - .15);
    const G = X.$(`#${id}g`); if (G) { tl.set(G, { autoAlpha: 0 }, 0).set(G, { autoAlpha: 1, y: 200 }, X.tIn - .05).to(G, { y: 0, duration: .6, ease: 'lr.out' }, X.tIn - .05); tl.to(G, { autoAlpha: 0, y: -40, duration: .3, ease: 'lr.in' }, X.tOut); }
    tl.set(B, { autoAlpha: 0 }, 0).set(F, { autoAlpha: 1 }, 0);
    tl.set(`#${id}tf`, { scale: 0, transformOrigin: '0% 50%' }, 0).to(`#${id}tf`, { scale: 1, duration: .4, ease: 'back.out(2)' }, X.tIn + .1);
    // the strike: one stroke through each line of the myth (measured from its glyphs before the lines are split)
    const st = C.closest('.stage'), k = st.getBoundingClientRect().width / 1080, sr = st.getBoundingClientRect(), cr = rel(C), rows = [];
    const wk = document.createTreeWalker(mt, NodeFilter.SHOW_TEXT);
    while (wk.nextNode()) { const rg = document.createRange(); rg.selectNodeContents(wk.currentNode);
      [...rg.getClientRects()].forEach(q => { const x = (q.left - sr.left) / k, y = (q.top - sr.top) / k, w = q.width / k, h = q.height / k; if (w < 2) return;
        const row = rows.find(o => Math.abs(o.y - y) < h * .5); if (row) { row.x0 = Math.min(row.x0, x); row.x1 = Math.max(row.x1, x + w); } else rows.push({ x0: x, x1: x + w, y, h }); }); }
    const ml = MK.lines(mt); tl.set(ml, { yPercent: 105 }, 0); MK.linesIn(tl, ml, X.tIn + .2);
    const scol = nm === 'silhouette' ? LK.accent : nm === 'flat' ? '#FFFFFF' : nm === 'cards' ? BT.ink : BT.accent, sw = nm === 'thread' ? 9 : nm === 'cards' ? 7 : 14;
    K.innerHTML = rows.map((r, i) => { const x0 = r.x0 - cr.x - 12, x1 = r.x1 - cr.x + 12, y = r.y - cr.y + r.h * .55, j = i % 2 ? -1 : 1;
      return nm === 'thread' ? `<path class="mfS" d="M${x0} ${y + 6 * j} C${x0 + (x1 - x0) * .3} ${y - 8 * j} ${x0 + (x1 - x0) * .65} ${y + 10 * j} ${x1} ${y - 4 * j}" fill="none" stroke="${scol}" stroke-width="${sw}" stroke-linecap="round"/>`
        : `<path class="mfS" d="M${x0} ${y} L${x1} ${y - (nm === 'cards' ? 0 : 6)}" fill="none" stroke="${scol}" stroke-width="${sw}" stroke-linecap="${nm === 'silhouette' ? 'butt' : 'round'}"/>`; }).join('');
    const ps = [...K.querySelectorAll('.mfS')], per = Math.min(.35, .7 / ps.length);
    ps.forEach((p, i) => tl.set(p, { drawSVG: '0%' }, 0).to(p, { drawSVG: '100%', duration: per, ease: 'power2.inOut' }, strike + i * per));
    tl.to(mt, { opacity: nm === 'silhouette' || nm === 'flat' ? .7 : .55, duration: .3 }, strike + ps.length * per);
    // the flip: the card turns edge-on, swaps faces, and lands on the fact
    tl.to(C, { rotationY: 90, scale: .94, duration: .26, ease: 'power2.in' }, flip - .26).set(F, { autoAlpha: 0 }, flip).set(B, { autoAlpha: 1 }, flip)
      .set(C, { rotationY: -90 }, flip).to(C, { rotationY: 0, scale: 1, duration: .5, ease: 'back.out(1.3)' }, flip);
    const fl = MK.lines(`#${id}f`); tl.set(fl, { yPercent: 105 }, 0); tl.set(`#${id}f`, { autoAlpha: 0 }, 0).set(`#${id}f`, { autoAlpha: 1 }, flip + .19);   MK.linesIn(tl, fl, flip + .2);   // no text while the card is edge-on
    const ck = X.$(`#${id}tb .mfK`); tl.set(ck, { drawSVG: '0%' }, 0).to(ck, { drawSVG: '100%', duration: .35, ease: 'power2.out' }, flip + .3);
    if (LK.thread) { const tb = rel(X.$(`#${id}tb`)); X.dot(tb.x + tb.w + 34, tb.y + tb.h / 2, flip + .45, { r: 18 }); }
    tl.to(C, { rotation: nm === 'flat' ? 1.5 : 0, y: -10, duration: Math.max(.4, X.tOut - flip - .6), ease: 'sine.inOut' }, flip + .55);
    tl.to(C, { autoAlpha: 0, y: -80, duration: .3, ease: 'lr.in' }, X.tOut);
  },
};
