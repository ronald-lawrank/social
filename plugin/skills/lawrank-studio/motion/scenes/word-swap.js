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
    const long = Math.max(...sc.words.map(w => String(w).length)), size = long > 14 ? 86 : long > 10 ? 106 : 128, chipH = Math.round(size * 1.42);
    const hs = Math.max(String(sc.before).length, String(sc.after || '').length) > 24 ? 90 : 106;
    const chip = nm === 'thread' ? `background:#FFFFFF;border:6px solid ${LK.ink};border-radius:${chipH}px`
      : nm === 'flat' ? `background:${LK.fillB};border-radius:28px;box-shadow:0 14px 0 ${mix(LK.fillB, '#000000', .3)}`
      : nm === 'cards' ? `background:${BT.accent};border-radius:${chipH}px;box-shadow:0 26px 50px ${mix(BT.accent, '#000000', .35)}55, 0 6px 14px rgba(0,0,0,.12)`
      : `background:${LK.ink};border-radius:0;box-shadow:14px 16px 0 ${LK.accent}`;
    const wc = nm === 'thread' ? LK.accentText : nm === 'flat' ? readable('#FFFFFF', LK.fillB, 4.5)
      : nm === 'cards' ? (contrast('#FFFFFF', BT.accent) >= 3 ? '#FFFFFF' : BT.ink) : LK.bg;
    const words = sc.words.map((w, i) => `<span class="wsi" style="position:absolute;left:50%;top:0;display:inline-block;white-space:nowrap;line-height:${chipH - (nm === 'thread' ? 12 : 0)}px">${esc(w)}</span>`).join('');
    const pip = (i) => `<i class="wsp" style="display:block;width:20px;height:20px;border-radius:${nm === 'silhouette' ? 0 : 10}px;background:${nm === 'cards' ? LK.fillC : LK.soft}"></i>`;
    const ink = nm === 'cards' ? LK.surfaceInk : LK.ink, acc = nm === 'cards' ? readable(BT.accent, '#FFFFFF', 3) : LK.accentText;
    const hl = (cls, text, s) => `<div id="${id}${cls}" class="k-hl" data-qa="text" style="position:relative;width:100%;text-align:center;font-size:${s}px;color:${ink};
      font-weight:${LK.headWeight};${up ? 'text-transform:uppercase;letter-spacing:.01em;' : ''}--acc:${acc}">${accentize(text, 'ka')}</div>`;
    const box = nm === 'cards' ? `background:#FFFFFF;border-radius:${LK.radius}px;box-shadow:${LK.shadow};padding:86px 50px 74px;` : 'padding:0 10px;';
    const cur = nm === 'cards' ? `<svg id="${id}cur" class="k-abs" width="74" height="92" viewBox="0 0 74 92" style="left:0;top:0;overflow:visible;filter:drop-shadow(0 8px 12px rgba(0,0,0,.25))">
          <circle id="${id}rip" cx="8" cy="8" r="34" fill="none" stroke="${BT.accent}" stroke-width="5"/>
          <path d="M8,8 L8,70 L24,56 L36,84 L48,78 L36,52 L58,50 Z" fill="${BT.ink}" stroke="#FFFFFF" stroke-width="5" stroke-linejoin="round"/></svg>` : '';
    const deco = nm === 'flat' ? `<div id="${id}bl" class="k-abs" style="left:-140px;top:1180px;width:520px;height:520px;border-radius:50%;background:${mix(LK.bg, '#FFFFFF', .2)}"></div>
        <div id="${id}br" class="k-abs" style="left:760px;top:260px;width:420px;height:420px;border-radius:50%;background:${mix(LK.bg, '#000000', .12)}"></div>
        ${[0, 1].map(j => `<svg id="${id}z${j}" class="k-abs" width="120" height="160" viewBox="0 0 120 160" style="left:0;top:0;overflow:visible">${[[-50, 10], [0, 18], [50, 10]].map(([a, o]) => {
          const r = Math.PI * a / 180, s = j ? 1 : -1, x0 = 60 + s * 10 * Math.cos(r), y0 = 80 + 10 * Math.sin(r);
          return `<path class="wsz" d="M${(60 + s * (14) * Math.cos(r)).toFixed(1)},${(80 + 34 * Math.sin(r)).toFixed(1)} L${(60 + s * (54 + o) * Math.cos(r)).toFixed(1)},${(80 + (70 + o) * Math.sin(r)).toFixed(1)}" stroke="${LK.ink}" stroke-width="12" stroke-linecap="round" fill="none"/>`; }).join('')}</svg>`).join('')}`
      : nm === 'silhouette' ? `<div id="${id}r0" class="k-abs" style="left:250px;width:580px;height:12px;background:${LK.ink}"></div><div id="${id}r1" class="k-abs" style="left:250px;width:580px;height:12px;background:${LK.ink}"></div>`
      : nm === 'cards' ? `<div id="${id}bk" class="k-abs" style="left:120px;width:840px;background:#FFFFFF;opacity:.55;border-radius:${LK.radius}px;box-shadow:0 30px 60px rgba(30,20,10,.12);transform:rotate(-4deg)"></div>
` : '';
    return `${deco}<div id="${id}g" class="k-abs" style="left:70px;top:300px;width:940px;height:1260px;display:flex;align-items:center;justify-content:center">
      <div id="${id}k" style="position:relative;width:100%;display:flex;flex-direction:column;align-items:center;gap:${nm === 'cards' ? 40 : 46}px;${box}">
        ${hl('b', sc.before, hs)}
        <div id="${id}c" style="position:relative;height:${chipH}px;width:400px;flex:none">
          <div id="${id}cb" style="position:absolute;inset:0;${chip}"></div>
          <div id="${id}w" data-qa="text" style="position:absolute;inset:0;overflow:hidden;font:${LK.headWeight} ${size}px var(--head);color:${wc};${up ? 'text-transform:uppercase;' : ''}">${words}</div>
        </div>
        <div id="${id}p" style="display:flex;gap:16px;margin-top:-8px">${sc.words.map(pip).join('')}</div>
        ${sc.after ? hl('a', sc.after, hs) : ''}
      </div></div>${cur}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, nm = LK.name, ts = X.times(sc.after ? [...sc.words, sc.after] : sc.words);
    const chip = X.$(`#${id}c`), bg = X.$(`#${id}cb`), ws = [...X.$(`#${id}w`).querySelectorAll('.wsi')], pips = [...X.$(`#${id}p`).querySelectorAll('.wsp')];
    const wb = X.$(`#${id}w`), size = parseFloat(getComputedStyle(wb).fontSize), pad = size * .5 + (nm === 'thread' ? 12 : 0);
    ws.forEach(w => { if (w.offsetWidth + 2 * pad > 920) w.style.fontSize = Math.floor(size * (920 - 2 * pad) / w.offsetWidth) + 'px'; });   // a long option shrinks alone
    const W = ws.map(w => Math.min(920, w.offsetWidth + 2 * pad));
    chip.style.width = W[0] + 'px';
    const st = chip.closest('.stage'), k = st.getBoundingClientRect().width / 1080, cr = chip.getBoundingClientRect(), sr = st.getBoundingClientRect();
    const cy = (cr.top - sr.top) / k + cr.height / k / 2;
    const tA = sc.after ? Math.max(ts[ts.length - 1], ts[sc.words.length - 1] + .55) : null;
    X.head(`#${id}b`, X.tIn);
    const kr = X.$(`#${id}k`).getBoundingClientRect(), ky = (kr.top - sr.top) / k, kh = kr.height / k;
    if (nm === 'flat') {
      tl.fromTo([`#${id}bl`, `#${id}br`], { scale: .6 }, { scale: 1, duration: .7, ease: 'lr.out', immediateRender: false }, X.tIn - .2);
      tl.to(`#${id}bl`, { x: 40, y: -30, duration: X.t1 - X.tIn, ease: 'none' }, X.tIn).to(`#${id}br`, { x: -30, y: 40, duration: X.t1 - X.tIn, ease: 'none' }, X.tIn);
      [0, 1].forEach(j => { const z = `#${id}z${j}`, p = X.$(z).querySelectorAll('.wsz'); tl.set(z, { autoAlpha: 0 }, 0);
        ws.forEach((_, i) => { if (!i) return; const t = ts[i] + .02, x = j ? 540 + W[i] / 2 - 26 : 540 - W[i] / 2 - 94;
          tl.set(z, { autoAlpha: 1, x, y: cy - 80 }, t).fromTo(p, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: .2, ease: 'power2.out', immediateRender: false }, t)
            .to(p, { drawSVG: '100% 100%', duration: .22, ease: 'power2.in' }, t + .2).set(z, { autoAlpha: 0 }, t + .43); }); });
    }
    if (nm === 'silhouette') [0, 1].forEach(j => { const r = `#${id}r${j}`; X.$(r).style.top = (j ? ky + kh + 70 : ky - 82) + 'px';
      tl.set(r, { autoAlpha: 0 }, 0).set(r, { autoAlpha: 1, scaleX: 0, transformOrigin: j ? '100% 50%' : '0% 50%' }, X.tIn - .1 + j * .12)
        .to(r, { scaleX: 1, duration: .6, ease: 'lr.out' }, X.tIn - .1 + j * .12).to(r, { scaleX: 0, transformOrigin: j ? '0% 50%' : '100% 50%', duration: .3, ease: 'lr.in' }, X.tOut); });
    if (nm === 'cards' && sc.after) {
      const kk = X.$(`#${id}k`), a = X.$(`#${id}a`), h1 = kh, h0 = kh - a.offsetHeight - 40, top = 930 - h1 / 2;
      Object.assign(X.$(`#${id}g`).style, { alignItems: 'flex-start', paddingTop: (top - 300) + 'px' }); Object.assign(kk.style, { height: h0 + 'px', overflow: 'hidden', justifyContent: 'flex-start' });
      tl.to(kk, { height: h1, duration: .45, ease: 'lr.move' }, tA - .2);
      X.$(`#${id}bk`).dataset.h0 = h0; tl.to(`#${id}bk`, { height: h1, duration: .45, ease: 'lr.move' }, tA - .2);
    }
    if (nm === 'cards') {
      const bk = X.$(`#${id}bk`); Object.assign(bk.style, { top: ky + 30 + 'px', height: (bk.dataset.h0 || kh) + 'px' });
      tl.set(bk, { autoAlpha: 0 }, 0).set(bk, { autoAlpha: .55, y: 160, rotation: 0 }, X.tIn - .05).to(bk, { y: 0, rotation: -4, duration: .7, ease: 'lr.out' }, X.tIn - .05)
        .to(bk, { rotation: -5.5, duration: X.tOut - X.tIn - .65, ease: 'none' }, X.tIn + .65).to(bk, { autoAlpha: 0, y: -40, duration: .3, ease: 'lr.in' }, X.tOut);
      const cur = `#${id}cur`, rip = `#${id}rip`; tl.set(cur, { autoAlpha: 0 }, 0).set(rip, { autoAlpha: 0 }, 0);
      tl.set(cur, { autoAlpha: 1, x: 960, y: cy + 330 }, ts[0] + .1).to(cur, { x: 540 + W[0] / 2 + 30, y: cy + 120, duration: .5, ease: 'lr.out' }, ts[0] + .1);
      ws.forEach((_, i) => { if (!i) return; const t = ts[i], x = 540 + W[i - 1] / 2 - 30;
        tl.to(cur, { x, y: cy + 10, duration: .45, ease: 'lr.move' }, t - .5).to(cur, { scale: .82, duration: .1, ease: 'power2.in', transformOrigin: '8px 8px' }, t - .06).to(cur, { scale: 1, duration: .25, ease: 'back.out(2)' }, t + .04)
          .to(cur, { x: 540 + W[i] / 2 + 34, y: cy + 110, duration: .5, ease: 'lr.out' }, t + .3);
        tl.fromTo(rip, { autoAlpha: 1, scale: .2, transformOrigin: '8px 8px' }, { autoAlpha: 0, scale: 1.4, duration: .45, ease: 'power2.out', immediateRender: false }, t - .02); });
      tl.to(cur, { x: '+=180', y: '+=240', autoAlpha: 0, duration: .4, ease: 'lr.in' }, X.tOut - .1);
    }
    if (nm === 'cards') { tl.set(`#${id}k`, { autoAlpha: 0 }, 0).set(`#${id}k`, { autoAlpha: 1, y: 120 }, X.tIn - .15).to(`#${id}k`, { y: 0, duration: .55, ease: 'lr.out' }, X.tIn - .15);
      tl.to(`#${id}k`, { autoAlpha: 0, y: -60, duration: .3, ease: 'lr.in' }, X.tOut + .05); }
    // gentle camera drift so the frame is never still
    if (nm !== 'cards') tl.fromTo(`#${id}g`, { y: 10 }, { y: -14, duration: X.t1 - X.tIn, ease: 'none', immediateRender: false }, X.tIn);
    // the pill arrives with the first word
    const t0 = Math.max(X.tIn + .2, ts[0] - .15);
    tl.set(chip, { autoAlpha: 0 }, 0).set(chip, { autoAlpha: 1 }, t0);
    tl.fromTo(bg, { scaleX: .15, scaleY: .7 }, { scaleX: 1, scaleY: 1, duration: .5, ease: 'lr.out', immediateRender: false }, t0);
    tl.set(pips, { autoAlpha: 0 }, 0);
    pips.forEach((p, i) => tl.set(p, { autoAlpha: 1, scale: 0 }, t0 + .1 + i * .05).to(p, { scale: 1, duration: .3, ease: 'back.out(2)' }, t0 + .1 + i * .05));
    ws.forEach((w, i) => {
      const t = i ? ts[i] : t0 + .08, on = nm === 'cards' ? BT.accent : LK.accent;
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
