/* word-swap: one sentence with a slot. The word in the slot rolls to the next option the moment the voice says it,
   inside a pill that resizes to fit (product-video feel). Pips under the pill count the options. */
SCENES['word-swap'] = {
  label: 'Word swap', about: 'A sentence with one highlighted slot; the word in the slot rolls to the next option each time the voice says it.',
  good: 'everything we take off your plate, a list of services in one line, "we handle the…"', practice: 'any',
  fields: { before: 'the words before the slot (2-6 words)', words: '2-4 options for the slot (1-2 words each), each said in the line, in order',
    after: 'optional words after the slot (2-6 words); **phrase** = accent' },
  example: { say: 'We handle the calls, the paperwork, and the deadlines, so you can focus on healing.',
    before: 'We handle the', words: ['calls', 'paperwork', 'deadlines'], after: 'so you can **heal.**' },
  sfx: (sc, X) => X.times(sc.words).map(t => ({ kind: 'pop', at: t })),
  html(sc, X) {
    const LK = X.LK, id = X.id, nm = LK.name, up = LK.headCase === 'upper';
    const long = Math.max(...sc.words.map(w => String(w).length)), size = long > 14 ? 78 : long > 10 ? 94 : 112, chipH = Math.round(size * 1.42);
    const hs = String(sc.before).length > 26 ? 80 : 92;
    const chip = nm === 'thread' ? `background:#FFFFFF;border:6px solid ${LK.ink};border-radius:${chipH}px`
      : nm === 'flat' ? `background:${LK.fillB};border-radius:28px;box-shadow:0 14px 0 ${mix(LK.fillB, '#000000', .3)}`
      : nm === 'cards' ? `background:${BT.accent};border-radius:${chipH}px;box-shadow:0 26px 50px ${mix(BT.accent, '#000000', .35)}55, 0 6px 14px rgba(0,0,0,.12)`
      : `background:${LK.ink};border-radius:0;box-shadow:14px 16px 0 ${LK.accent}`;
    const wc = nm === 'thread' ? LK.accentText : nm === 'flat' ? readable('#FFFFFF', LK.fillB, 4.5)
      : nm === 'cards' ? (contrast('#FFFFFF', BT.accent) >= 3 ? '#FFFFFF' : BT.ink) : LK.bg;
    const words = sc.words.map((w, i) => `<span class="wsi" style="position:absolute;left:50%;top:0;display:inline-block;white-space:nowrap;line-height:${chipH - (nm === 'thread' ? 12 : 0)}px">${esc(w)}</span>`).join('');
    const pip = (i) => `<i class="wsp" style="display:block;width:${nm === 'silhouette' ? 18 : 16}px;height:${nm === 'silhouette' ? 18 : 16}px;border-radius:${nm === 'silhouette' ? 0 : 9}px;background:${nm === 'cards' ? LK.fillC : LK.soft}"></i>`;
    const ink = nm === 'cards' ? LK.surfaceInk : LK.ink, acc = nm === 'cards' ? readable(BT.accent, '#FFFFFF', 3) : LK.accentText;
    const hl = (cls, text, s) => `<div id="${id}${cls}" class="k-hl" data-qa="text" style="position:relative;width:100%;text-align:center;font-size:${s}px;color:${ink};
      font-weight:${LK.headWeight};${up ? 'text-transform:uppercase;letter-spacing:.01em;' : ''}--acc:${acc}">${accentize(text, 'ka')}</div>`;
    const box = nm === 'cards' ? `background:#FFFFFF;border-radius:${LK.radius}px;box-shadow:${LK.shadow};padding:86px 50px 74px;` : 'padding:0 10px;';
    const deco = nm === 'flat' ? `<div id="${id}bl" class="k-abs" style="left:-140px;top:1180px;width:520px;height:520px;border-radius:50%;background:${LK.fillC};opacity:.35"></div>
        <div id="${id}br" class="k-abs" style="left:760px;top:260px;width:420px;height:420px;border-radius:50%;background:${LK.fillB};opacity:.22"></div>`
      : nm === 'silhouette' ? `<div id="${id}bl" class="k-abs" style="left:70px;top:470px;width:16px;height:980px;background:${LK.ink}"></div>` : '';
    return `${deco}<div id="${id}g" class="k-abs" style="left:70px;top:300px;width:940px;height:1260px;display:flex;align-items:center;justify-content:center">
      <div id="${id}k" style="position:relative;width:100%;display:flex;flex-direction:column;align-items:center;gap:${nm === 'cards' ? 40 : 46}px;${box}">
        ${hl('b', sc.before, hs)}
        <div id="${id}c" style="position:relative;height:${chipH}px;width:400px;flex:none">
          <div id="${id}cb" style="position:absolute;inset:0;${chip}"></div>
          <div id="${id}w" data-qa="text" style="position:absolute;inset:0;overflow:hidden;font:${LK.headWeight} ${size}px var(--head);color:${wc};${up ? 'text-transform:uppercase;' : ''}">${words}</div>
        </div>
        <div id="${id}p" style="display:flex;gap:16px;margin-top:-8px">${sc.words.map(pip).join('')}</div>
        ${sc.after ? hl('a', sc.after, hs) : ''}
      </div></div>`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, nm = LK.name, ts = X.times(sc.after ? [...sc.words, sc.after] : sc.words);
    const chip = X.$(`#${id}c`), bg = X.$(`#${id}cb`), ws = [...X.$(`#${id}w`).querySelectorAll('.wsi')], pips = [...X.$(`#${id}p`).querySelectorAll('.wsp')];
    const size = parseFloat(getComputedStyle(X.$(`#${id}w`)).fontSize), pad = size * .5 + (nm === 'thread' ? 12 : 0);
    const W = ws.map(w => Math.min(940, w.offsetWidth + 2 * pad));
    chip.style.width = W[0] + 'px';
    const st = chip.closest('.stage'), k = st.getBoundingClientRect().width / 1080, cr = chip.getBoundingClientRect(), sr = st.getBoundingClientRect();
    const cy = (cr.top - sr.top) / k + cr.height / k / 2;
    const tA = sc.after ? Math.max(ts[ts.length - 1], ts[sc.words.length - 1] + .55) : null;
    X.head(`#${id}b`, X.tIn);
    if (X.$(`#${id}bl`)) {
      if (nm === 'silhouette') tl.set(`#${id}bl`, { autoAlpha: 0 }, 0).set(`#${id}bl`, { autoAlpha: 1, scaleY: 0, transformOrigin: '50% 0%' }, X.tIn - .1).to(`#${id}bl`, { scaleY: 1, duration: .6, ease: 'lr.out' }, X.tIn - .1).to(`#${id}bl`, { scaleY: 0, transformOrigin: '50% 100%', duration: .3, ease: 'lr.in' }, X.tOut);
      else { tl.fromTo([`#${id}bl`, `#${id}br`], { scale: .6 }, { scale: 1, duration: .7, ease: 'lr.out', immediateRender: false }, X.tIn - .2);
        tl.to(`#${id}bl`, { x: 40, y: -30, duration: X.tOut - X.tIn, ease: 'none' }, X.tIn).to(`#${id}br`, { x: -30, y: 40, duration: X.tOut - X.tIn, ease: 'none' }, X.tIn); }
    }
    if (nm === 'cards') { tl.set(`#${id}k`, { autoAlpha: 0 }, 0).set(`#${id}k`, { autoAlpha: 1, y: 120 }, X.tIn - .15).to(`#${id}k`, { y: 0, duration: .55, ease: 'lr.out' }, X.tIn - .15);
      tl.to(`#${id}k`, { autoAlpha: 0, y: -60, duration: .3, ease: 'lr.in' }, X.tOut + .05); }
    // gentle camera drift so the frame is never still
    tl.fromTo(`#${id}g`, { y: 10 }, { y: -14, duration: X.t1 - X.tIn, ease: 'none', immediateRender: false }, X.tIn);
    // the pill arrives with the first word
    const t0 = Math.max(X.tIn + .2, ts[0] - .15);
    tl.set(chip, { autoAlpha: 0 }, 0).set(chip, { autoAlpha: 1 }, t0);
    tl.fromTo(bg, { scaleX: .15, scaleY: .7 }, { scaleX: 1, scaleY: 1, duration: .5, ease: 'lr.out', immediateRender: false }, t0);
    tl.set(pips, { autoAlpha: 0 }, 0);
    pips.forEach((p, i) => tl.set(p, { autoAlpha: 1, scale: 0 }, t0 + .1 + i * .05).to(p, { scale: 1, duration: .3, ease: 'back.out(2)' }, t0 + .1 + i * .05));
    ws.forEach((w, i) => {
      const t = i ? ts[i] : t0 + .08, on = nm === 'cards' ? (contrast('#FFFFFF', BT.accent) >= 3 ? '#FFFFFF' : BT.ink) : nm === 'flat' ? LK.accent : nm === 'silhouette' ? LK.accent : LK.accent;
      tl.set(w, { autoAlpha: 0, xPercent: -50 }, 0).set(w, { autoAlpha: 1, yPercent: 105 }, t - .01).to(w, { yPercent: 0, duration: .46, ease: 'lr.out' }, t);
      const tEnd = i < ws.length - 1 ? ts[i + 1] : X.tOut;
      if (i < ws.length - 1) tl.to(w, { yPercent: -105, duration: .3, ease: 'lr.in' }, tEnd - .02).set(w, { autoAlpha: 0 }, tEnd + .3);
      else tl.to(w, { yPercent: -105, duration: .26, ease: 'lr.in' }, X.tOut).set(w, { autoAlpha: 0 }, X.tOut + .27);
      if (i) {
        tl.to(chip, { width: W[i], duration: .46, ease: 'lr.move' }, t - .04);
        if (nm === 'flat') tl.fromTo(chip, { rotation: i % 2 ? -3 : 3 }, { rotation: 0, duration: .5, ease: 'back.out(2.4)', immediateRender: false }, t);
        else tl.fromTo(bg, { scale: 1.06 }, { scale: 1, duration: .45, ease: 'back.out(2)', immediateRender: false }, t);
      }
      tl.to(pips[i], { backgroundColor: on, scale: 1.25, duration: .25, ease: 'lr.out' }, t);
      if (i) tl.to(pips[i - 1], { backgroundColor: nm === 'cards' ? LK.fillC : LK.soft, scale: 1, duration: .25, ease: 'lr.out' }, t);
      if (LK.thread) X.dot(540 + W[i] / 2 + 44, cy, t + .12, { r: 15 });
    });
    if (sc.after) X.head(`#${id}a`, tA);
    tl.to(pips, { autoAlpha: 0, scale: 0, duration: .25, ease: 'lr.in', stagger: .03 }, X.tOut);
    tl.to(bg, { scaleX: .1, autoAlpha: 0, duration: .3, ease: 'lr.in' }, X.tOut + .08);
  },
};
