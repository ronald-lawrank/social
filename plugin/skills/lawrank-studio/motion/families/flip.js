/* FLIP — "here's how we help". A fast, branded cut for the feed. Each section ends with its own shape swelling to full
   screen and becoming the next background (ink -> accent -> paper -> ink -> accent -> ink), so the colour flips are
   motivated and nothing cuts. Sections: hook, help (card -> circle), investigate (chips drop as they're named),
   proof (big number + two results; ONLY approved claims), rating (stars, score, a client quote; ONLY approved), end.
   Best for: brand ads, "why choose us", proof posts, recaps. Fastest family (0.3-0.5s shape changes).
   Storyboard lines: hook (2: the question; "Here's how <Firm> helps."), help (2), invest (1, names the chips),
   proof? (3: stat; result 1; result 2), rating? (1), cta (2: "Talk to …"; offer).
   screen: { hook: { pre, word }, after, help: [2 lines], invest, chips: [3], chipWords?, proof?: { stat, statLine,
             results: [{ n, label }] x2, disclaimer }, rating?: { score, label, quote, by }, end, cta, site?, disclaimer? } */
FAMILIES.flip = {
  id: 'flip', label: 'Here’s how we help (colour flips)',
  lines: S => ['hook', 'help', 'invest', ...(S.screen.proof ? ['proof'] : []), ...(S.screen.rating ? ['rating'] : []), 'cta'],
  G: { FULL: { x: -40, y: -40, w: 1160, h: 2000, r: 0 }, CARD1: { x: 80, y: 660, w: 920, h: 520, r: 44 }, CIRC: { x: 150, y: 540, w: 780, h: 780, r: 390 },
    MRG: { x: 90, y: 1000, w: 900, h: 420, r: 40 }, RC: { x: 80, y: 860, w: 920, h: 560, r: 40 }, RC2: { x: 80, y: 820, w: 920, h: 600, r: 40 },
    QC: { x: 80, y: 1200, w: 920, h: 360, r: 40 }, BTN: { x: 190, y: 1060, w: 700, h: 124, r: 62 } },
  chipWords: S => S.screen.chipWords || S.screen.chips.map(c => c.split(' ')[0]),
  cues(h, S) {
    const hk = h.L.hook.sentences, hp = h.L.help.sentences, cta = h.L.cta.sentences, sc = S.screen;
    const c = { flip1: (hk[1] || hk[0]).t - .15, help: h.L.help.t - .1, help2: (hp[1] || hp[0]).t - .1, flip2: h.L.invest.t - .12 };
    c.chips = this.chipWords(S).map(w => h.W('invest', w) - .05);
    const after = id => (h.L[id] ? h.L[id].t : h.L.cta.t) - .12;
    c.flip3 = after(sc.proof ? 'proof' : sc.rating ? 'rating' : 'cta');
    if (sc.proof) { const p = h.L.proof.sentences; c.r1 = (p[1] || p[0]).t - .1; c.r2 = (p[2] || p[1] || p[0]).t - .1; c.flip4 = after(sc.rating ? 'rating' : 'cta'); }
    if (sc.rating) { c.stars = h.L.rating.t + .1; c.quote = Math.min(h.L.rating.end - .6, h.L.rating.t + 1.6); c.flip5 = after('cta'); }
    c.free = (cta[1] || cta[0]).t - .05 + (cta[1] ? 0 : 1.2); c.end = h.L.cta.end + 2.8; return c;
  },
  sfx: (c, S) => [c.flip1, c.flip2, c.flip3, c.flip4, c.flip5].filter(x => x != null).map(at => ({ kind: 'whoosh', at }))
    .concat([c.help, c.help2, c.r1, c.r2].filter(x => x != null).map(at => ({ kind: 'soft', at })), c.chips.map(at => ({ kind: 'pop', at }))),
  poster: T => (T.cues.r1 ?? T.cues.chips[2]) + 1.2,
  html(T, S) {
    const G = this.G, sc = S.screen, W = '#FFFFFF', box = (id, cls, style, inner) => `<div id="${id}" class="${cls}" data-qa="text" style="${style}">${inner}</div>`;
    const star = (cx, cy, R) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * .45 : R; d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1); } return d + 'Z'; };
    const onA = BT.onAccent, accOnW = readable(BT.accent, W, 3), accOnInk = contrast(BT.bright, BT.ink) >= 3 ? BT.bright : '#FFFFFF';
    const p = sc.proof, rt = sc.rating;
    return `<div id="bgc" class="bgc" style="background:${BT.ink}"></div><div class="grain lt"></div>
  <svg class="svgL" viewBox="0 0 1080 1920">
    <path id="p0" fill="${BT.accent}" d="${rr({ x: 0, y: 0, w: 10, h: 10, r: 4 })}" opacity="0"/>
    <path id="p1" fill="${W}" d="${rr(G.CARD1)}" opacity="0"/>
    <path id="ul" fill="none" stroke="${BT.accent}" stroke-width="10" stroke-linecap="round" d="M0 0"/>
    ${sc.chips.map((_, i) => `<path id="c${i}" fill="${BT.accent}" d="${rr({ x: 0, y: 0, w: 10, h: 10, r: 4 })}" opacity="0"/>`).join('')}
    ${p ? `<path id="p3" fill="${W}" d="${rr(G.RC)}" opacity="0"/>` : ''}
    ${rt ? [0, 1, 2, 3, 4].map(i => `<path id="st${i}" fill="${onA}" d="${star(300 + i * 120, 520, 46)}" opacity="0"/>`).join('') + `<path id="p4" fill="${W}" d="${rr(G.QC)}" opacity="0"/>` : ''}
    <path id="pb" fill="${BT.accent}" d="${rr(G.BTN)}" opacity="0"/></svg>
  ${box('hk', 'm-bt', 'left:60px;right:60px;text-align:center;top:640px;font-size:150px;color:#fff', `${esc(sc.hook.pre)}<br><span id="hkC" style="position:relative;color:${onA}">${esc(sc.hook.word)}</span>`)}
  <img id="lg1" class="m-logo h" src="${onA === '#FFFFFF' ? BT.logoLight : BT.logoDark}" alt="${esc(BT.name)}" style="top:760px;left:220px;width:640px">
  ${box('hw', 'm-bt h', `left:60px;right:60px;text-align:center;top:900px;font-size:64px;font-weight:700;color:${onA}`, esc(sc.after))}
  ${box('cd1', 'm-bt', `left:${G.CARD1.x + 70}px;width:${G.CARD1.w - 140}px;top:${G.CARD1.y + 80}px;font-size:84px;color:${BT.ink}`, accentize(sc.help[0], 'oa'))}
  ${box('cd2', 'm-bt', `left:${G.CIRC.x + 90}px;width:${G.CIRC.w - 180}px;top:${G.CIRC.y + 220}px;font-size:80px;text-align:center;color:${BT.ink}`, accentize(sc.help[1], 'oa'))}
  ${box('iv', 'm-bt', `left:90px;width:900px;top:440px;font-size:84px;color:${BT.ink}`, accentize(sc.invest, 'oa'))}
  ${sc.chips.map((t, i) => box('cl' + i, 'm-chip h', `color:${onA}`, esc(t))).join('')}
  ${p ? box('big', 'm-big', `top:520px;color:#fff`, esc(p.stat).replace(/\+$/, `<span style="color:${accOnInk}">+</span>`)) + box('bigS', 'm-bt h', 'left:60px;right:60px;text-align:center;top:820px;font-size:64px;font-weight:700;color:#fff', esc(p.statLine))
      + p.results.slice(0, 2).map((r, i) => box('r' + (i + 1), 'm-rcard', `left:${(i ? G.RC2 : G.RC).x + 70}px;width:${(i ? G.RC2 : G.RC).w - 140}px;top:${(i ? G.RC2 : G.RC).y + (i ? 100 : 80)}px`, `<div class="m-rN" style="color:${accOnW}">${esc(r.n)}</div><div class="m-rT" style="color:${BT.ink}">${esc(r.label)}</div>`)).join('')
      + box('pdisc', 'm-disc h', 'color:#C9D0D5;font-weight:400', esc(p.disclaimer || 'Past results do not guarantee future outcomes.')) : ''}
  ${rt ? box('rv', 'm-rv', `top:600px;color:${onA}`, esc(rt.score)) + box('rvS', 'm-bt h', `left:60px;right:60px;text-align:center;top:920px;font-size:64px;font-weight:700;color:${onA}`, esc(rt.label))
      + box('qt', 'm-qt', `left:${G.QC.x + 70}px;width:${G.QC.w - 140}px;top:${G.QC.y + 70}px`, `<div class="m-qQ" style="color:${BT.ink}">“${esc(rt.quote)}”</div><div class="m-qN h" id="qN" style="color:${BT.muted}">${esc(rt.by)}</div>`) : ''}
  <img id="lg2" class="m-logo h" src="${BT.logoLight}" alt="${esc(BT.name)}" style="top:620px;left:220px;width:640px">
  ${box('ct', 'm-bt', `left:60px;right:60px;text-align:center;top:800px;font-size:96px;color:#fff`, accentize(sc.end, 'ct').replace('class="ct"', `id="ctM" style="color:${accOnInk}"`))}
  ${box('eBtn', 'm-btn h', `top:${G.BTN.y}px;color:${readable('#FFFFFF', BT.accent, 4.5)};border-radius:${BT.radius ? 62 : 0}px`, esc(BT.upper ? sc.cta.toUpperCase() : sc.cta))}
  ${box('eSite', 'm-site h', `top:${G.BTN.y + G.BTN.h + 60}px;color:#fff`, esc(sc.site || BT.site))}
  ${box('disc2', 'm-disc h', 'color:#fff', esc(sc.disclaimer || 'Attorney advertising.') + (p ? ' ' + esc(p.disclaimer || 'Past results do not guarantee future outcomes.') : ''))}`;
  },
  build(tl, T, $, S) {
    const G = this.G, sc = S.screen, Q = T.cues, { W } = MK.T(T), st = $('#bgc').closest('.stage'), rel = MK.rel(st);
    const ink = BT.ink, acc = BT.accent, paper = BT.warm;
    const flip = (path, color, t, d = .5) => { tl.to(path, { morphSVG: rr(G.FULL), attr: { fill: color }, duration: d, ease: 'lr.move' }, t); tl.set('#bgc', { backgroundColor: color }, t + d); tl.set(path, { opacity: 0 }, t + d + .01); };
    const sp = sel => { const l = MK.lines(sel); tl.set(l, { yPercent: 105 }, 0).set(sel, { autoAlpha: 0 }, 0); return l; };
    const show = (sel, l, t, t2, stg = .05) => { tl.set(sel, { autoAlpha: 1 }, t - .01); MK.linesIn(tl, l, t, stg); if (t2) { MK.linesOut(tl, l, t2); tl.set(sel, { autoAlpha: 0 }, t2 + .3); } };
    // measure before splitting
    const hc = rel($('#hkC')), bar = { x: hc.x - 18, y: hc.y + 12, w: hc.w + 36, h: hc.h - 18, r: 14 };
    const iv = rel($('#iv')), ulY = iv.y + iv.h + 34, ulW = Math.min(900, iv.w * .6);
    $('#ul').setAttribute('d', `M90,${ulY} H${90 + ulW}`);
    const k = st.getBoundingClientRect().width / 1080;
    const chipR = sc.chips.map((_, i) => ({ x: 90, y: ulY + 110 + i * 150, w: Math.round($('#cl' + i).getBoundingClientRect().width / k + 80), h: 116, r: 58 }));
    chipR.forEach((r, i) => Object.assign($('#cl' + i).style, { left: (r.x + 40) + 'px', top: r.y + 'px', lineHeight: r.h + 'px' }));
    const ct = rel($('#ctM') || $('#ct')), ulB = { x: ct.x, y: ct.y + ct.h - 4, w: ct.w, h: 12, r: 6 };
    const lHk = sp('#hk'), lHw = sp('#hw'), lC1 = sp('#cd1'), lC2 = sp('#cd2'), lIv = sp('#iv'), lCt = sp('#ct');
    tl.set('#ul', { drawSVG: '0%' }, 0).set('#pb', { attr: { d: rr(ulB) } }, 0);
    tl.to('.grain', { backgroundPosition: '0 -400px', duration: T.end, ease: 'none' }, 0);
    // 1 · ink: the question; an accent bar slams behind the key word and swells into the next background
    show('#hk', lHk, .12, Q.flip1, .08);
    const tw = W('hook', sc.hook.word) - .1;
    tl.set('#p0', { attr: { d: rr({ ...bar, w: 8 }) }, opacity: 1 }, tw).to('#p0', { morphSVG: rr(bar), duration: .3, ease: 'power3.out' }, tw);
    tl.fromTo('#hk', { scale: 1 }, { scale: 1.05, duration: 1.2, ease: 'none', transformOrigin: '50% 50%' }, .12);
    flip('#p0', acc, Q.flip1 + .08, .45);
    M.enter(tl, '#lg1', Q.flip1 + .4, { y: 20, d: .35 }); show('#hw', lHw, Q.flip1 + .5, Q.help - .1); M.exit(tl, '#lg1', Q.help - .1);
    // 2 · accent: a white card rises, then rounds into a circle that swells into paper
    tl.set('#p1', { attr: { d: rr(MK.strip({ ...G.CARD1, y: 1920, h: 10 })) }, opacity: 1 }, Q.help).to('#p1', { morphSVG: rr(G.CARD1), duration: .45, ease: 'lr.out' }, Q.help);
    show('#cd1', lC1, Q.help + .25, Q.help2);
    tl.to('#p1', { morphSVG: rr(G.CIRC), duration: .5, ease: 'lr.move' }, Q.help2 + .12);
    show('#cd2', lC2, Q.help2 + .45, Q.flip2);
    tl.to('#p1', { rotation: 4, transformOrigin: '50% 50%', duration: 1.2, ease: 'sine.inOut' }, Q.help2 + .6).to('#p1', { rotation: 0, duration: .2 }, Q.flip2);
    flip('#p1', paper, Q.flip2 + .1, .5);
    // 3 · paper: the headline, an underline, and a chip drops as each thing is named; the chips merge and swell
    show('#iv', lIv, Q.flip2 + .45, Q.flip3);
    tl.to('#ul', { drawSVG: '100%', duration: .35, ease: 'power2.out' }, Q.flip2 + .9);
    const from = { x: 90, y: ulY - 5, w: ulW, h: 10, r: 5 };
    Q.chips.forEach((t, i) => { tl.set('#c' + i, { attr: { d: rr(from) }, opacity: 1 }, t).to('#c' + i, { morphSVG: rr(chipR[i]), duration: .38, ease: 'back.out(1.4)' }, t); M.enter(tl, '#cl' + i, t + .18, { y: 14, d: .3 }); });
    const next3 = sc.proof ? ink : sc.rating ? acc : ink;
    tl.to('#ul', { opacity: 0, duration: .15 }, Q.flip3); M.fadeOut(tl, sc.chips.map((_, i) => '#cl' + i), Q.flip3, .14);
    sc.chips.forEach((_, i) => tl.to('#c' + i, { morphSVG: rr(G.MRG), attr: { fill: next3 }, duration: .3, ease: 'lr.move' }, Q.flip3 + .05));
    tl.set(sc.chips.slice(1).map((_, i) => '#c' + (i + 1)), { opacity: 0 }, Q.flip3 + .36); flip('#c0', next3, Q.flip3 + .36, .42);
    // 4 · ink: the big number, then two results on a card that reshapes between them (approved claims only)
    if (sc.proof) {
      const cBig = SplitText.create('#big', { type: 'chars' }).chars, lBS = sp('#bigS'), lR1 = MK.lines('#r1 .m-rN, #r1 .m-rT'), lR2 = $('#r2') ? MK.lines('#r2 .m-rN, #r2 .m-rT') : [];
      tl.set(['#big', '#r1', '#r2'].filter(s => $(s)), { autoAlpha: 0 }, 0).set([...lR1, ...lR2], { yPercent: 105 }, 0);
      tl.set('#big', { autoAlpha: 1 }, Q.flip3 + .6).fromTo(cBig, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: .4, ease: 'lr.out', stagger: .04 }, Q.flip3 + .6);
      show('#bigS', lBS, Q.flip3 + .95); M.fadeIn(tl, '#pdisc', Q.flip3 + 1.0, .3);
      tl.fromTo('#big', { scale: 1 }, { scale: 1.04, duration: 2.6, ease: 'none', transformOrigin: '50% 50%' }, Q.flip3 + .6);
      tl.to('#big', { y: -230, scale: .55, duration: .45, ease: 'lr.move' }, Q.r1).to('#bigS', { y: -305, scale: .72, duration: .45, ease: 'lr.move', transformOrigin: '50% 0%' }, Q.r1);
      tl.set('#p3', { attr: { d: rr(MK.strip({ ...G.RC, y: 1920, h: 10 })) }, opacity: 1 }, Q.r1).to('#p3', { morphSVG: rr(G.RC), duration: .45, ease: 'lr.out' }, Q.r1);
      tl.set('#r1', { autoAlpha: 1 }, Q.r1 + .25); MK.linesIn(tl, lR1, Q.r1 + .28, .08);
      let last = '#r1', lastL = lR1;
      if (lR2.length) { MK.linesOut(tl, lR1, Q.r2); tl.set('#r1', { autoAlpha: 0 }, Q.r2 + .3); tl.to('#p3', { morphSVG: rr(G.RC2), duration: .4, ease: 'lr.move' }, Q.r2 + .15);
        tl.set('#r2', { autoAlpha: 1 }, Q.r2 + .4); MK.linesIn(tl, lR2, Q.r2 + .42, .08); last = '#r2'; lastL = lR2; }
      const next4 = sc.rating ? acc : ink;
      MK.linesOut(tl, lastL, Q.flip4); tl.set(last, { autoAlpha: 0 }, Q.flip4 + .3);
      M.exit(tl, ['#big', '#bigS'], Q.flip4, { d: .2 }); M.fadeOut(tl, '#pdisc', Q.flip4, .2);
      flip('#p3', next4, Q.flip4 + .12, .5);
    }
    // 5 · accent: stars land, the score, a client's words on a white card (approved reviews only)
    if (sc.rating) {
      const t0 = sc.proof ? Q.flip4 : Q.flip3, cRv = SplitText.create('#rv', { type: 'chars' }).chars, lRv = sp('#rvS'), lQ = sp('#qt .m-qQ');
      tl.set(['#rv', '#qt'], { autoAlpha: 0 }, 0);
      [0, 1, 2, 3, 4].forEach(i => tl.fromTo('#st' + i, { opacity: 0, scale: 0, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .3, ease: 'back.out(2.2)' }, t0 + .55 + i * .08));
      tl.set('#rv', { autoAlpha: 1 }, Q.stars).fromTo(cRv, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: .4, ease: 'lr.out', stagger: .05 }, Q.stars);
      show('#rvS', lRv, Q.stars + .3);
      tl.set('#p4', { attr: { d: rr(MK.strip({ ...G.QC, y: 1920, h: 10 })) }, opacity: 1 }, Q.quote).to('#p4', { morphSVG: rr(G.QC), duration: .45, ease: 'lr.out' }, Q.quote);
      tl.set(['#qt', '#qt .m-qQ'], { autoAlpha: 1 }, Q.quote + .2); MK.linesIn(tl, lQ, Q.quote + .25); M.fadeIn(tl, '#qN', Q.quote + .5, .25);
      MK.linesOut(tl, lQ, Q.flip5); M.fadeOut(tl, '#qN', Q.flip5, .14); tl.set('#qt', { autoAlpha: 0 }, Q.flip5 + .3);
      M.exit(tl, ['#rv', '#rvS', '#st0', '#st1', '#st2', '#st3', '#st4'], Q.flip5, { d: .2 });
      flip('#p4', ink, Q.flip5 + .12, .5);
    }
    // 6 · ink: end card; the line under the accent word becomes the button
    const tE = sc.rating ? Q.flip5 : sc.proof ? Q.flip4 : Q.flip3;
    M.enter(tl, '#lg2', tE + .5, { y: 20, d: .35 }); show('#ct', lCt, tE + .55);
    tl.fromTo('#pb', { opacity: 1, scaleX: 0, transformOrigin: '0% 50%' }, { opacity: 1, scaleX: 1, duration: .3, ease: 'power2.out' }, tE + .95);
    tl.to('#pb', { morphSVG: rr(G.BTN), duration: .45, ease: 'lr.move' }, Q.free);
    M.fadeIn(tl, '#eBtn', Q.free + .35, .2); M.enter(tl, '#eSite', Q.free + .45, { d: .3 }); M.fadeIn(tl, '#disc2', Q.free + .5, .3);
  },
  client: (T, S) => `<p class="lede">A fast, branded cut built for the feed: what ${esc(BT.short)} does for you${S.screen.proof || S.screen.rating ? ', then proof' : ''}. The background changes colour with every section, and every change is motivated: the shape on screen swells to full bleed and becomes the next background, so nothing ever cuts.</p>
  <h3>Why it works</h3><ul><li><b>The firm is named in the first two seconds.</b></li><li><b>Nothing sits still:</b> every section has a second beat (a card rounding into a circle, chips dropping as they're named${S.screen.proof ? ', a card reshaping between results' : ''}).</li><li><b>Built for paid and organic:</b> one idea per section, big readable type, a clear call to action.</li></ul>`,
};
