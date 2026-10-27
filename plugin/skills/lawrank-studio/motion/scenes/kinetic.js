/* kinetic: big words land one at a time, each on the moment it's spoken. The accent phrase gets the look's treatment
   (thread: the dot lands on it; flat: a colour block; cards: a white card; silhouette: a black bar). */
const KIN = {
  norm: w => String(w).toLowerCase().replace(/\*\*/g, '').replace(/[^a-z0-9']/g, ''),
  words(text) {           // [{w, acc}] from "Hurt in a **car crash**?"
    const out = []; let acc = false;
    String(text).split(/(\*\*)/).forEach(p => { if (p === '**') { acc = !acc; return; } p.split(/\s+/).filter(Boolean).forEach(w => out.push({ w, acc })); });
    return out;
  },
  // each on-screen word -> the time it's spoken (matched in order; unmatched words are spread between neighbours)
  times(words, spoken, t0, t1) {
    const ts = []; let j = 0;
    words.forEach(x => { let k = j; while (k < spoken.length && KIN.norm(spoken[k].w) !== KIN.norm(x.w)) k++;
      if (k < spoken.length) { ts.push(spoken[k].t); j = k + 1; } else ts.push(null); });
    let last = t0;
    ts.forEach((t, i) => { if (t == null) { const nx = ts.slice(i + 1).find(v => v != null) ?? Math.min(t1, last + .6); ts[i] = last + (nx - last) / 2; } last = ts[i]; });
    return ts.map(t => Math.max(t0, Math.min(t1, t)));
  },
};
SCENES.kinetic = {
  label: 'Kinetic headline', about: 'Big words land one at a time as they are spoken; the key phrase gets the accent treatment.',
  good: 'hooks, questions, a single strong statement', practice: 'any',
  fields: { head: 'the words on screen (4-9 words, said in the line); **phrase** = accent', kicker: 'optional small label above' },
  example: { say: 'Hurt in a car crash? McMinn Law Firm can help you take the next step.', head: 'Hurt in a **car crash?**', kicker: 'McMinn Law Firm' },
  sfx: (sc, X) => [{ kind: 'soft', at: X.tIn }],
  html(sc, X) {
    const LK = X.LK, ws = KIN.words(sc.head), n = ws.length, size = n > 7 ? 104 : n > 4 ? 124 : 150;
    const up = LK.headCase === 'upper';
    const word = (x, i) => `<span class="kw${x.acc ? ' ka' : ''}" style="display:inline-block;overflow:hidden;vertical-align:top;padding:0 .02em .06em;margin:0 .1em 0 0">
      <span class="kwi" style="display:inline-block">${esc(x.w)}</span></span>`;
    const treat = LK.name === 'flat' ? `<div class="kblk k-abs" style="background:${LK.fillB};border-radius:${LK.radius / 2}px"></div>`
      : LK.name === 'silhouette' ? `<div class="kblk k-abs" style="background:${LK.ink}"></div>` : '';
    const card = LK.name === 'cards' ? UI.card(LK, { id: X.id + 'c', x: 60, y: 520, w: 960, h: 820 }) : '';
    return `${card}${treat}
      ${sc.kicker ? UI.text(LK, { id: X.id + 'k', text: sc.kicker, x: 110, y: 640, w: 860, size: 38, weight: 700, color: LK.accentText, upper: true }) : ''}
      <div id="${X.id}h" class="k-hl" data-qa="text" style="left:110px;top:740px;width:860px;font-size:${size}px;color:${LK.ink};font-weight:${LK.headWeight};
        ${up ? 'text-transform:uppercase;' : ''}--acc:${LK.name === 'silhouette' ? '#FFFFFF' : LK.accentText}">${ws.map(word).join('')}</div>`;
  },
  build(tl, sc, X) {
    const LK = X.LK, ws = KIN.words(sc.head), ts = KIN.times(ws, X.line.words, X.tIn, X.tOut - .6);
    const H = X.$(`#${X.id}h`), inner = [...H.querySelectorAll('.kwi')], spans = [...H.querySelectorAll('.kw')];
    tl.set(H, { autoAlpha: 0 }, 0).set(H, { autoAlpha: 1 }, X.tIn - .01).set(inner, { yPercent: 110 }, 0);
    inner.forEach((el, i) => { tl.set(el, { autoAlpha: 0 }, 0).set(el, { autoAlpha: 1 }, ts[i]).to(el, { yPercent: 0, duration: .42, ease: 'lr.out' }, ts[i]); });
    if (sc.kicker) { M.enter(tl, `#${X.id}k`, X.tIn, { d: .35 }); M.exit(tl, `#${X.id}k`, X.tOut); }
    if (LK.name === 'cards') { tl.fromTo(`#${X.id}c`, { autoAlpha: 0, y: 80, scale: .96 }, { autoAlpha: 1, y: 0, scale: 1, duration: .5, ease: 'lr.out', immediateRender: false }, X.tIn - .1); M.exit(tl, `#${X.id}c`, X.tOut + .05); }
    // the accent phrase: a block slides in behind it (flat, silhouette), or the dot lands after it (thread)
    const acc = spans.map((s, i) => s.classList.contains('ka') ? i : -1).filter(i => i >= 0);
    if (acc.length) {
      const ta = ts[acc[acc.length - 1]] + .25, tb = ts[acc[0]] - .12, blk = X.$('.kblk');
      if (blk) {
        const st = H.closest('.stage'), k = st.getBoundingClientRect().width / 1080, sr = st.getBoundingClientRect();
        const rs = acc.map(i => spans[i].getBoundingClientRect()), top = rs[0].top;
        const row = rs.filter(r => Math.abs(r.top - top) < 4), x0 = Math.min(...row.map(r => r.left)), x1 = Math.max(...row.map(r => r.right));
        Object.assign(blk.style, { left: (x0 - sr.left) / k - 16 + 'px', top: (top - sr.top) / k + 6 + 'px', width: (x1 - x0) / k + 26 + 'px', height: rs[0].height / k - 4 + 'px' });
        tl.set(blk, { autoAlpha: 0 }, 0).set(blk, { autoAlpha: 1 }, tb);
        tl.fromTo(blk, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: Math.max(.35, ta - tb - .2), ease: 'power2.out', immediateRender: false }, tb);
        M.fadeOut(tl, blk, X.tOut);
      }
      if (LK.thread) {
        const st = H.closest('.stage'), k = st.getBoundingClientRect().width / 1080, sr = st.getBoundingClientRect(), r = spans[acc[acc.length - 1]].getBoundingClientRect();
        X.dot((r.right - sr.left) / k + 30, (r.bottom - sr.top) / k - 30, ta, { r: 20 });
      }
    }
    if (LK.thread && !acc.length) X.dot(950, 700, X.tIn + .4);
    tl.to(inner, { yPercent: -110, duration: .22, ease: 'lr.in', stagger: .015 }, X.tOut);
    tl.set(H, { autoAlpha: 0 }, X.tOut + .4);
  },
};
