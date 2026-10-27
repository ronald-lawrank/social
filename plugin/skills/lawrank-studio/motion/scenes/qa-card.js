/* qa-card: a question types itself out (with a caret), holds a beat, then the answer rises in beneath an accent rule.
   Thread: open type, the rule draws and the dot lands at its end; flat: the question sits in a chunky speech bubble;
   cards: a message card, then an answer card with an accent edge; silhouette: a black question slab, paper answer. */
SCENES['qa-card'] = {
  label: 'Question and answer', about: 'A question types itself out, pauses, then the answer reveals beneath it with an accent rule.',
  good: 'FAQs, "do I need a lawyer if…", "how long do I have…", objections answered plainly', practice: 'any',
  fields: { question: 'the question (4-14 words), said first as its own sentence', answer: 'the answer (6-22 words), said next', label: 'optional small tag above (default "You asked")' },
  example: { say: 'Do I need a lawyer for a minor injury? Not always, but a short call can tell you where you stand.',
    question: 'Do I need a lawyer for a minor injury?', answer: 'Not always. A short call can tell you where you stand.', label: 'You asked' },
  sfx: (sc, X) => { const r = SCENES['qa-card'].qaTimes(sc, X); return [{ kind: 'soft', at: r.q0 }, { kind: 'chime', at: r.a }]; },
  qaTimes(sc, X) {
    const ss = X.line.sentences || [], two = ss.length > 1, q0 = X.tIn + .3;
    const qEnd = two ? X.sent(0).end - .1 : q0 + String(sc.question).length * .05;
    const a = Math.min(X.tOut - 1.2, Math.max(q0 + 1, two ? X.sent(1).t : X.times([sc.question, sc.answer])[1]));
    return { q0, q1: Math.min(a - .35, Math.max(q0 + .6, Math.min(qEnd, q0 + String(sc.question).length * .055))), a };
  },
  html(sc, X) {
    const LK = X.LK, nm = LK.name, up = LK.headCase === 'upper', ql = String(sc.question).length, al = String(sc.answer).length;
    const qs = ql > 60 ? 62 : ql > 38 ? 72 : 84, as = al > 90 ? 46 : 54;
    const chars = String(sc.question).split(' ').map(w => `<span style="display:inline-block;white-space:nowrap">${[...w].map(c => `<span class="qaC">${esc(c)}</span>`).join('')}</span>`).join(' ');
    const qInk = nm === 'silhouette' ? LK.surface : nm === 'flat' || nm === 'cards' ? BT.ink : LK.ink;
    const qbg = nm === 'flat' ? `background:#FFFFFF;border-radius:${LK.radius * 1.6}px;padding:56px 60px;box-shadow:0 16px 0 ${mix(LK.bg, '#000000', .25)};`
      : nm === 'cards' ? `background:${LK.surface};border-radius:${LK.radius}px;padding:44px 52px 52px;box-shadow:${LK.shadow};border:${LK.edge};`
      : nm === 'silhouette' ? `background:${LK.ink};padding:54px 56px;box-shadow:${LK.shadow};` : 'padding:0 0 10px;';
    const tail = nm === 'flat' ? `<svg class="k-abs" style="left:90px;bottom:-56px;overflow:visible" width="90" height="60"><path d="M0 0 L20 70 L80 0 Z" fill="${mix(LK.bg, '#000000', .25)}" transform="translate(0 16)"/><path d="M0 0 L20 70 L80 0 Z" fill="#FFFFFF"/></svg>` : '';
    const labInk = nm === 'cards' ? readable(BT.accent, '#FFFFFF', 4.5) : nm === 'silhouette' ? LK.surface : LK.accentText;
    const label = `<div id="${X.id}l" data-qa="text" style="display:flex;align-items:center;gap:16px;font:800 34px/1 var(--head);letter-spacing:.14em;text-transform:uppercase;color:${labInk};margin-bottom:${nm === 'thread' ? 30 : 26}px">
      ${UI.icon(LK, 'chat', 46, labInk, labInk)}${esc(sc.label || 'You asked')}</div>`;
    const caretCol = nm === 'silhouette' ? LK.accent : nm === 'flat' ? LK.fillB : BT.accent;
    const qbox = `<div id="${X.id}qb" style="position:relative;${qbg}">${nm !== 'flat' ? label : ''}
      <div id="${X.id}q" data-qa="text" style="position:relative;font:${LK.headWeight} ${qs}px/1.12 var(--head);color:${qInk};${up ? 'text-transform:uppercase;' : ''}">${chars}</div>
      <div id="${X.id}cr" class="k-abs" style="left:0;top:0;width:${nm === 'thread' ? 6 : 8}px;height:${qs * 1.02}px;background:${caretCol}"></div>${tail}</div>`;
    const aInk = nm === 'cards' ? LK.surfaceInk : LK.ink, rule = nm === 'silhouette' ? LK.accent : nm === 'flat' ? LK.fillA : BT.accent;
    const abox = nm === 'cards'
      ? `<div id="${X.id}ab" style="position:relative;margin:34px 0 0 60px;background:${LK.surface};border-radius:${LK.radius}px;padding:44px 52px 48px 64px;box-shadow:${LK.shadow};overflow:hidden">
          <div id="${X.id}r" class="k-abs" style="left:0;top:0;bottom:0;width:14px;background:${rule}"></div>
          <div id="${X.id}a" data-qa="text" style="font:500 ${as}px/1.3 var(--body);color:${aInk}">${accentize(sc.answer, 'ka')}</div></div>`
      : `<div id="${X.id}ab" style="position:relative;margin-top:${nm === 'flat' ? 110 : 60}px">
          <div id="${X.id}r" style="width:${nm === 'thread' ? 920 : 260}px;height:${nm === 'thread' ? 6 : 16}px;background:${rule};border-radius:${nm === 'silhouette' ? 0 : 8}px;margin-bottom:44px"></div>
          <div id="${X.id}a" data-qa="text" style="font:${nm === 'thread' ? 500 : 600} ${as + 4}px/1.28 var(--body);color:${aInk}">${accentize(sc.answer, 'ka')}</div></div>`;
    const qm = nm === 'thread' || nm === 'flat' ? `<svg id="${X.id}qm" class="k-abs" style="left:640px;top:1020px;overflow:visible" width="330" height="520" viewBox="0 0 132 208">
      <path class="qaM" d="M14 56 C14 26 36 8 66 8 C98 8 120 30 120 58 C120 88 96 98 80 110 C70 118 66 128 66 146 L66 160" fill="none" stroke="${nm === 'flat' ? LK.soft : LK.soft}" stroke-width="${nm === 'flat' ? 22 : 5}" stroke-linecap="round" stroke-linejoin="round"/>
      <circle class="qaD" cx="66" cy="192" r="${nm === 'flat' ? 14 : 8}" fill="${LK.soft}"/></svg>` : '';
    return `${qm}<div id="${X.id}col" class="k-abs" style="left:80px;top:${nm === 'flat' ? 400 : 440}px;width:920px">${nm === 'flat' ? label : ''}${qbox}${abox}</div>`;
  },
  build(tl, sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, { q0, q1, a } = SCENES['qa-card'].qaTimes(sc, X), QB = X.$(`#${id}qb`), Q = X.$(`#${id}q`), CR = X.$(`#${id}cr`);
    const COL = X.$(`#${id}col`), ch = COL.getBoundingClientRect().height / (Q.closest('.stage').getBoundingClientRect().width / 1080);
    COL.style.top = Math.round(Math.max(nm === 'flat' ? 400 : 430, Math.min(1500 - ch, 1000 - ch / 2))) + 'px';   // centre the pair on the stage
    const QM = X.$(`#${id}qm`); if (QM) { const ct = parseFloat(COL.style.top); Object.assign(QM.style, { left: '760px', top: Math.min(1560, ct + ch + 40) + 'px', width: '200px', height: '316px' }); const m = QM.querySelector('.qaM'), d = QM.querySelector('.qaD');
      tl.set(QM, { autoAlpha: 1 }, 0).set(m, { drawSVG: '0%' }, 0).to(m, { drawSVG: '100%', duration: 1.2, ease: 'power2.inOut' }, X.tIn).set(d, { scale: 0, transformOrigin: '50% 50%' }, 0).to(d, { scale: 1, duration: .35, ease: 'back.out(2.5)' }, X.tIn + 1.1);
      tl.to(QM, { y: -30, rotation: 4, duration: Math.max(1, X.tOut - X.tIn - 1), ease: 'sine.inOut' }, X.tIn + .5).to(QM, { autoAlpha: 0, duration: .3, ease: 'lr.in' }, X.tOut); }
    const st = Q.closest('.stage'), k = st.getBoundingClientRect().width / 1080, rel = MK.rel(st), qr = QB.getBoundingClientRect();
    // the question box arrives, then the question types itself out, the caret riding the last letter
    if (nm !== 'thread') tl.set(QB, { autoAlpha: 0 }, 0).set(QB, { autoAlpha: 1, y: 120, scale: .96, transformOrigin: '20% 100%' }, X.tIn - .15).to(QB, { y: 0, scale: 1, duration: .55, ease: nm === 'flat' ? 'back.out(1.5)' : 'lr.out' }, X.tIn - .15);
    else tl.set(QB, { autoAlpha: 0 }, 0).set(QB, { autoAlpha: 1 }, X.tIn - .15);
    const L = X.$(`#${id}l`); tl.set(L, { autoAlpha: 0 }, 0).set(L, { autoAlpha: 1, x: -30 }, X.tIn).to(L, { x: 0, duration: .45, ease: 'lr.out' }, X.tIn);
    const cs = [...Q.querySelectorAll('.qaC')], step = (q1 - q0) / Math.max(1, cs.length - 1);
    tl.set(cs, { autoAlpha: 0 }, 0).set(Q, { autoAlpha: 0 }, 0).set(Q, { autoAlpha: 1 }, q0 - .01);
    const pos = cs.map(c => { const r = c.getBoundingClientRect(); return { x: (r.right - qr.left) / k + 4, y: (r.top - qr.top) / k + (r.height / k - CR.offsetHeight) / 2 }; });
    tl.set(CR, { autoAlpha: 0 }, 0).set(CR, { autoAlpha: 1, x: pos[0].x - 30, y: pos[0].y }, q0 - .2);
    cs.forEach((c, i) => { const t = q0 + i * step; tl.set(c, { autoAlpha: 1 }, t).set(CR, { x: pos[i].x, y: pos[i].y }, t); });
    // the caret blinks while the question hangs, then leaves as the answer comes
    for (let t = q1 + .25; t < a - .1; t += .5) tl.set(CR, { autoAlpha: 0 }, t).set(CR, { autoAlpha: 1 }, t + .25);
    tl.set(CR, { autoAlpha: 0 }, a - .05);
    // the answer: the accent rule draws, the lines rise
    const AB = X.$(`#${id}ab`), R = X.$(`#${id}r`);
    tl.set(AB, { autoAlpha: 0 }, 0).set(AB, { autoAlpha: 1 }, a - .25);
    if (nm === 'cards') { tl.set(AB, { y: 120 }, a - .25).to(AB, { y: 0, duration: .55, ease: 'lr.out' }, a - .25); tl.set(R, { scaleY: 0, transformOrigin: '50% 0%' }, 0).to(R, { scaleY: 1, duration: .5, ease: 'power3.out' }, a); }
    else tl.set(R, { scaleX: 0, transformOrigin: '0% 50%' }, 0).to(R, { scaleX: 1, duration: nm === 'thread' ? .7 : .45, ease: 'power3.out' }, a - .2);
    const al = MK.lines(`#${id}a`); tl.set(al, { yPercent: 105 }, 0); MK.linesIn(tl, al, a + .05, .1);
    if (LK.thread) { const rr = rel(R); X.dot(pos[pos.length - 1].x + rel(QB).x + 26, pos[pos.length - 1].y + rel(QB).y + CR.offsetHeight * .7, q1 + .1, { r: 14 }); X.dot(rr.x + rr.w + 22, rr.y + rr.h / 2, a + .5, { r: 16 }); }
    tl.to(`#${id}col`, { y: -14, duration: Math.max(.5, X.tOut - a - .2), ease: 'sine.inOut' }, a + .2);
    tl.to(`#${id}col`, { autoAlpha: 0, y: -80, duration: .3, ease: 'lr.in' }, X.tOut);
  },
};
