/* search-bar: a search field types the viewer's question letter by letter; the search runs, and the firm's answer drops
   into a card below it (with the firm's mark), followed by a couple of faint results rows. */
SCENES['search-bar'] = {
  label: 'Search and answer', about: "A search field types a question letter by letter; a card drops below it with the firm's plain-English answer.",
  good: 'questions people google ("how long do I have to file?"), myths, FAQs, "you searched for…"', practice: 'any',
  fields: { query: 'the question typed in the search field (3-10 words), said in the line', answer: 'the answer (6-18 words), said in the line after the question',
    label: 'optional small label above the field (e.g. "At 2 a.m. you search:")' },
  example: { say: 'How long do I have to file a claim? It depends on your state, so ask a lawyer early, before the deadline passes.',
    query: 'How long do I have to file a claim?', answer: 'It depends on your state. Ask a lawyer early, before the deadline passes.', label: 'You search:' },
  sfx: (sc, X) => { const [tq, ta] = X.times([sc.query, sc.answer]); return [{ kind: 'soft', at: X.tIn }, { kind: 'clink', at: Math.max(tq, X.tIn + .3) + Math.min(1.6, sc.query.length * .05) + .1 }, { kind: 'whoosh', at: ta - .05 }]; },
  html(sc, X) {
    const LK = X.LK, id = X.id, nm = LK.name, up = LK.headCase === 'upper';
    const sil = nm === 'silhouette', flat = nm === 'flat';
    const barBg = '#FFFFFF', barInk = BT.ink, rad = sil ? 0 : nm === 'flat' ? 30 : 90;
    const barCss = nm === 'thread' ? `border:5px solid ${LK.ink};box-shadow:none` : sil ? `border:6px solid ${LK.ink};box-shadow:${LK.shadow}` : `box-shadow:${LK.shadow}`;
    const btnBg = flat ? LK.fillB : sil ? LK.ink : BT.accent, btnFg = contrast('#FFFFFF', btnBg) >= 3 ? '#FFFFFF' : BT.ink;
    const cardBg = sil ? LK.ink : '#FFFFFF', cardInk = sil ? LK.bg : BT.ink, cardSub = sil ? mix(LK.bg, LK.ink, .3) : mix(BT.ink, '#FFFFFF', .4);
    const cardCss = nm === 'thread' ? `border:3px solid ${mix(LK.ink, LK.bg, .75)};box-shadow:${LK.shadow}` : sil ? `box-shadow:14px 16px 0 ${LK.accent}` : `box-shadow:${LK.shadow}`;
    const badge = sil ? LK.accent : flat ? LK.fillB : BT.accent, badgeFg = contrast('#FFFFFF', badge) >= 3 ? '#FFFFFF' : BT.ink;
    const chars = [...String(sc.query)].map(c => `<span class="sbc">${c === ' ' ? ' ' : esc(c)}</span>`).join('');
    const skel = (i) => `<div class="sbs" style="display:flex;align-items:center;gap:26px;padding:26px 34px;${nm === 'cards' ? `background:#FFFFFF;border-radius:28px;box-shadow:0 18px 40px rgba(30,20,10,.10);` : ''}">
        <i style="display:block;width:64px;height:64px;flex:none;border-radius:${sil ? 0 : 16}px;background:${nm === 'cards' ? LK.soft : LK.soft}"></i>
        <div style="flex:1"><i style="display:block;height:20px;width:${78 - i * 18}%;border-radius:10px;background:${nm === 'cards' ? LK.fillC : LK.fillC}"></i>
        <i style="display:block;height:16px;width:${52 + i * 12}%;margin-top:16px;border-radius:8px;background:${nm === 'cards' ? LK.soft : LK.soft}"></i></div></div>`;
    const glass = flat ? `<svg id="${id}mg" class="k-abs" width="560" height="560" viewBox="0 0 560 560" style="left:620px;top:1180px">
        <circle cx="220" cy="220" r="160" fill="none" stroke="${LK.fillB}" stroke-width="56" opacity=".55"/><path d="M335,335 L500,500" stroke="${LK.fillB}" stroke-width="80" stroke-linecap="round" opacity=".55"/></svg>
        <div id="${id}bl" class="k-abs" style="left:-160px;top:140px;width:460px;height:460px;border-radius:50%;background:${mix(LK.bg, '#FFFFFF', .16)}"></div>` : '';
    return `${glass}<div id="${id}g" class="k-abs" style="left:70px;top:330px;width:940px;height:1230px;display:flex;flex-direction:column;justify-content:center;gap:34px">
      ${sc.label ? `<div id="${id}l" class="k-tx" data-qa="text" style="position:relative;font:700 40px var(--head);color:${LK.name === 'flat' ? LK.ink : LK.accentText};${up ? 'text-transform:uppercase;letter-spacing:.08em;' : ''}">${accentize(sc.label, 'ka')}</div>` : ''}
      <div id="${id}b" style="position:relative;background:${barBg};border-radius:${rad}px;${barCss};padding:40px 150px 40px 116px;min-height:176px;display:flex;align-items:center">
        <div style="position:absolute;left:40px;top:50%;margin-top:-29px;line-height:0">${icon('search', 58, mix(BT.ink, '#FFFFFF', .35))}</div>
        <div id="${id}q" data-qa="text" style="position:relative;font:400 ${sc.query.length > 40 ? 48 : 54}px/1.3 var(--body);color:${barInk};width:100%">${chars}<i id="${id}ct" style="position:absolute;left:0;top:0;width:5px;height:${sc.query.length > 40 ? 62 : 70}px;background:${BT.accent};border-radius:3px"></i></div>
        <div id="${id}bt" style="position:absolute;right:22px;top:50%;margin-top:-57px;width:114px;height:114px;border-radius:${sil ? 0 : 50}px;background:${btnBg};display:flex;align-items:center;justify-content:center">${icon('arrow', 54, btnFg)}</div>
        <i id="${id}ld" style="position:absolute;left:${rad ? 60 : 0}px;right:${rad ? 60 : 0}px;bottom:-5px;height:7px;border-radius:4px;background:${flat ? LK.fillB : BT.accent}"></i>
      </div>
      <div id="${id}c" style="position:relative;background:${cardBg};border-radius:${sil ? 0 : LK.radius}px;${cardCss};padding:46px 54px 56px">
        <div style="display:flex;align-items:center;gap:22px">
          <svg width="90" height="90" viewBox="0 0 78 78" style="flex:none"><path d="${markPath(39, 39, 37)}" fill="${badge}"/>
            <text x="39" y="40" text-anchor="middle" dominant-baseline="central" font-family="var(--head)" font-weight="800" font-size="34" fill="${badgeFg}">${esc(String(BT.short).trim()[0] || '')}</text></svg>
          <div data-qa="text" style="font:700 40px/1.15 var(--head);color:${cardInk}">${esc(BT.name)}</div>
        </div>
        <div id="${id}a" class="k-hl" data-qa="text" style="position:relative;margin-top:30px;font:${sil ? 700 : 400} ${sc.answer.length > 90 ? 50 : 60}px/1.28 var(--${sil ? 'head' : 'body'});color:${cardInk};${up ? 'text-transform:uppercase;' : ''}--acc:${sil ? LK.accent : readable(BT.accent, '#FFFFFF', 4.5)}">${accentize(sc.answer, 'ka')}</div>
        <i id="${id}u" style="display:block;margin-top:34px;height:6px;width:180px;border-radius:3px;background:${badge}"></i>
      </div>
      <div id="${id}r" style="position:relative;display:flex;flex-direction:column;gap:${nm === 'cards' ? 22 : 0}px;margin-top:-6px">${skel(0)}${skel(1)}</div>
    </div>`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, nm = LK.name, $ = s => X.$(s);
    const q = $(`#${id}q`), chars = [...q.querySelectorAll('.sbc')], ct = $(`#${id}ct`), bar = $(`#${id}b`), card = $(`#${id}c`), rows = [...$(`#${id}r`).querySelectorAll('.sbs')];
    const [tq0, ta0] = X.times([sc.query, sc.answer]);
    const tq = Math.max(X.tIn + .45, tq0), D = Math.min(sc.query.length * .05, Math.max(.7, ta0 - tq - .7)), tEnd = tq + D, ta = Math.max(ta0, tEnd + .55);
    const st = q.closest('.stage'), k = st.getBoundingClientRect().width / 1080, sr = st.getBoundingClientRect();
    // caret positions after each letter (layout px inside the field)
    const P = chars.map(c => ({ x: c.offsetLeft + c.offsetWidth, y: c.offsetTop + (c.offsetHeight - ct.offsetHeight) / 2 }));
    if (sc.label) { tl.set(`#${id}l`, { autoAlpha: 0 }, 0).set(`#${id}l`, { autoAlpha: 1, x: -30 }, X.tIn).to(`#${id}l`, { x: 0, duration: .45, ease: 'lr.out' }, X.tIn); M.exit(tl, `#${id}l`, X.tOut); }
    tl.set(bar, { autoAlpha: 0 }, 0).set(bar, { autoAlpha: 1, y: 70, scale: .94 }, X.tIn).to(bar, { y: 0, scale: 1, duration: .55, ease: 'lr.out' }, X.tIn);
    // typing: each letter appears in turn, the caret rides after it and blinks while waiting
    tl.set(chars, { autoAlpha: 0 }, 0).set(ct, { autoAlpha: 0, x: 0, y: (chars[0].offsetHeight - ct.offsetHeight) / 2 }, 0).set(ct, { autoAlpha: 1 }, X.tIn + .3);
    for (let b = X.tIn + .55; b < tq - .2; b += .5) tl.set(ct, { autoAlpha: 0 }, b).set(ct, { autoAlpha: 1 }, b + .25);
    chars.forEach((c, i) => { const t = tq + D * i / chars.length; tl.set(c, { autoAlpha: 1 }, t).set(ct, { x: P[i].x + 3, y: P[i].y }, t); });
    for (let b = tEnd + .35; b < X.tOut - .2; b += .55) tl.set(ct, { autoAlpha: 0 }, b).set(ct, { autoAlpha: 1 }, b + .28);
    // search: the button is pressed, a progress line runs along the field
    const bt = `#${id}bt`, ld = `#${id}ld`;
    tl.fromTo(bt, { scale: 1 }, { scale: .84, duration: .1, ease: 'power2.in', immediateRender: false }, tEnd + .08).to(bt, { scale: 1, duration: .35, ease: 'back.out(2.5)' }, tEnd + .18);
    tl.set(ld, { autoAlpha: 0 }, 0).set(ld, { autoAlpha: 1, scaleX: 0, transformOrigin: '0% 50%' }, tEnd + .12)
      .to(ld, { scaleX: 1, duration: Math.max(.3, ta - tEnd - .2), ease: 'power1.inOut' }, tEnd + .12).to(ld, { autoAlpha: 0, duration: .2 }, ta);
    // the answer drops in
    tl.set(card, { autoAlpha: 0 }, 0).set(card, { autoAlpha: 1, y: -60, scaleY: .9, transformOrigin: '50% 0%' }, ta - .05).to(card, { y: 0, scaleY: 1, duration: .6, ease: 'lr.out' }, ta - .05);
    X.head(`#${id}a`, ta + .12, X.tOut);
    tl.set(`#${id}u`, { autoAlpha: 0 }, 0).set(`#${id}u`, { autoAlpha: 1, scaleX: 0, transformOrigin: '0% 50%' }, ta + .4).to(`#${id}u`, { scaleX: 1, duration: .6, ease: 'lr.out' }, ta + .4);
    tl.set(rows, { autoAlpha: 0 }, 0);
    rows.forEach((r, i) => tl.set(r, { autoAlpha: 1, y: 50 }, ta + .3 + i * .12).to(r, { y: 0, duration: .5, ease: 'lr.out' }, ta + .3 + i * .12).to(r, { autoAlpha: 0, duration: .25 }, X.tOut - .05));
    if (nm === 'flat') { tl.fromTo(`#${id}mg`, { rotation: -14, scale: .7, transformOrigin: '40% 40%' }, { rotation: 6, scale: 1, duration: X.t1 - X.tIn, ease: 'power1.out', immediateRender: false }, X.tIn);
      tl.fromTo(`#${id}bl`, { scale: .6 }, { scale: 1.05, duration: X.t1 - X.tIn, ease: 'power1.out', immediateRender: false }, X.tIn); }
    if (LK.thread) { const ur = $(`#${id}u`).getBoundingClientRect(); X.dot((ur.right - sr.left) / k + 34, (ur.top - sr.top) / k + 3, ta + .9, { r: 16 }); }
    tl.to(bar, { y: -50, autoAlpha: 0, duration: .3, ease: 'lr.in' }, X.tOut);
    tl.to(card, { y: -50, autoAlpha: 0, duration: .3, ease: 'lr.in' }, X.tOut + .06);
    tl.set(chars, { autoAlpha: 0 }, X.tOut + .3);
  },
};
