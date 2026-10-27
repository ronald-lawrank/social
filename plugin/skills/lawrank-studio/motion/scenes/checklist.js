/* checklist: a card with 3-5 items; each box ticks as its item is said. The thread dot hops from box to box. */
SCENES.checklist = {
  label: 'Checklist ticks', about: 'A card lists 3-5 things; each one ticks off on the word that says it.',
  good: 'what to do after…, what to bring, steps you can take today', practice: 'any',
  fields: { head: 'headline above the list', items: '3-5 short items (2-5 words each), each said in the line, in order' },
  example: { say: 'After a crash: see a doctor, take photos, keep every bill, and call a lawyer before you sign.',
    head: 'After a crash', items: ['See a doctor', 'Take photos', 'Keep every bill', 'Call before you sign'] },
  sfx: (sc, X) => X.times(sc.items).map(t => ({ kind: 'chime', at: t + .15 })),
  html(sc, X) {
    const LK = X.LK, n = sc.items.length, rowH = n > 4 ? 150 : 172, cardH = rowH * n + 80, top = 600;
    const box = LK.name === 'silhouette' ? LK.ink : LK.name === 'flat' ? LK.fillB : BT.accent;
    const rows = sc.items.map((it, i) => `<div class="clr" style="position:absolute;left:60px;right:50px;top:${50 + i * rowH}px;height:${rowH - 30}px;display:flex;align-items:center;gap:36px">
        <svg width="84" height="84" viewBox="0 0 84 84" style="flex:none"><rect x="4" y="4" width="76" height="76" rx="${LK.radius ? 18 : 0}" fill="none" stroke="${LK.name === 'silhouette' ? LK.ink : mix(LK.surfaceInk, LK.surface, .7)}" stroke-width="6"/>
          <rect class="clf" x="4" y="4" width="76" height="76" rx="${LK.radius ? 18 : 0}" fill="${box}"/><path class="clk" d="M22 43 L36 57 L62 28" fill="none" stroke="${contrast('#FFFFFF', box) >= 3 ? '#FFFFFF' : BT.ink}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="clt" data-qa="text" style="font:${LK.headWeight} 54px/1.15 var(--head);color:${LK.surfaceInk};${LK.headCase === 'upper' ? 'text-transform:uppercase;' : ''}">${esc(it)}</div></div>`).join('');
    return `${UI.head(LK, { id: X.id + 'h', text: sc.head, x: 80, y: 360, w: 920, size: 92 })}
      ${UI.card(LK, { id: X.id + 'c', x: 70, y: top, w: 940, h: cardH, inner: rows })}`;
  },
  build(tl, sc, X) {
    const ts = X.times(sc.items), card = `#${X.id}c`, rows = [...X.$(card).querySelectorAll('.clr')];
    X.head(`#${X.id}h`, X.tIn);
    tl.set(card, { autoAlpha: 0 }, 0).set(card, { autoAlpha: 1, y: 120 }, X.tIn).to(card, { y: 0, duration: .55, ease: 'lr.out' }, X.tIn);
    const k = rows[0].closest('.stage').getBoundingClientRect().width / 1080, sr = rows[0].closest('.stage').getBoundingClientRect();
    rows.forEach((r, i) => {
      const t = ts[i], f = r.querySelector('.clf'), c = r.querySelector('.clk'), tx = r.querySelector('.clt');
      tl.set([f, c], { autoAlpha: 0 }, 0).set(tx, { autoAlpha: 0 }, 0);
      const tt = Math.max(X.tIn + .1, t - .35); tl.set(tx, { autoAlpha: 1, x: -30 }, tt).to(tx, { x: 0, duration: .4, ease: 'lr.out' }, tt);
      tl.set(f, { autoAlpha: 1, scale: 0, transformOrigin: '50% 50%' }, t).to(f, { scale: 1, duration: .3, ease: 'back.out(2)' }, t);
      tl.set(c, { autoAlpha: 1, drawSVG: '0%' }, t + .1).to(c, { drawSVG: '100%', duration: .3, ease: 'power2.out' }, t + .1);
      const b = tx.getBoundingClientRect();          // the dot lands just after the words, like a full stop
      if (X.LK.thread) X.dot((b.right - sr.left) / k + 34, (b.bottom - sr.top) / k - 22, t - .02, { r: 14 });
    });
    tl.to(card, { autoAlpha: 0, y: -60, duration: .3, ease: 'lr.in' }, X.tOut);
  },
};
