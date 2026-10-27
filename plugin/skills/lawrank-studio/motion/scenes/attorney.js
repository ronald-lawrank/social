/* attorney: an introduction card for one attorney, without a photo. A monogram badge in the firm's mark shape draws
   itself, the name and role land as they are said, one or two short lines tick in, and a signature writes itself. */
const ATY = {
  initials(name) { const w = String(name).replace(/[.,]/g, ' ').split(/\s+/).filter(x => x && !/^(esq|jr|sr|ii|iii|attorney|mr|ms|mrs|dr)$/i.test(x));
    return ((w[0] || '?')[0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase(); },
  // a hand-written-looking signature: one loop per letter, tall loops for capitals and ascenders, then an underline swash
  sig(name) {
    let seed = 7; for (const c of String(name)) seed = (seed * 31 + c.charCodeAt(0)) % 2147483647;
    const r = seeded(seed || 1), P = (x, y) => `${(x - y * .32).toFixed(1)},${y.toFixed(1)}`;   // slanted like handwriting
    let x = 0, d = `M${P(-10, 4)}`;
    [...String(name).replace(/[^A-Za-z ]/g, '')].slice(0, 18).forEach((c, i) => {
      if (c === ' ') { d += ` C${P(x + 6, 8)} ${P(x + 14, 8)} ${P(x + 22, 0)}`; x += 22; return; }
      const big = c === c.toUpperCase(), tall = big || /[bdfhklt]/.test(c);
      if (tall) { const h = big ? 104 + r() * 16 : 70 + r() * 12, w = (big ? 34 : 18) + r() * 8;
        d += ` C${P(x + w * .1, -h)} ${P(x + w * 1.1, -h)} ${P(x + w * .4, -h * .3)}`;
        d += ` C${P(x + w * .2, -h * .05)} ${P(x + w * .7, 8)} ${P(x + w, 0)}`; x += w; }
      else { const h = 22 + r() * 12, w = 16 + r() * 10, loop = /[aeo]/.test(c);
        d += loop ? ` C${P(x + w * .9, -h)} ${P(x - w * .1, -h)} ${P(x + w * .35, -2)} C${P(x + w * .6, 4)} ${P(x + w * .8, -4)} ${P(x + w, -h * .6)} C${P(x + w * 1.05, -h * .3)} ${P(x + w * 1.1, 0)} ${P(x + w * 1.25, 0)}`
          : ` C${P(x + w * .15, -h * 1.1)} ${P(x + w * .75, -h * 1.1)} ${P(x + w, 0)}`; x += loop ? w * 1.25 : w; }
    });
    d += ` C${P(x + 40, -18)} ${P(x + 40, 30)} ${P(x - 30, 30)} C${P(x * .55, 26)} ${P(x * .25, 40)} ${P(-30, 32)}`;
    return { d, w: x + 60 };
  },
};
SCENES.attorney = {
  label: 'Attorney intro', about: "An attorney's introduction card without a photo: a monogram badge draws itself, the name and role land, one or two short lines tick in, and a signature writes itself.",
  good: 'meet the attorney, who answers your call, a founder note, "I handle your case myself"', practice: 'any',
  fields: { name: "the attorney's name (as the firm writes it)", role: 'role or title (2-5 words), e.g. "Founding attorney"',
    lines: '1-2 short lines (2-6 words each), e.g. "Licensed in Texas", "Answers your calls"; each said in the line' },
  example: { say: 'Meet Sarah Collins, our founding attorney. Licensed in Texas, and she answers your calls herself.',
    name: 'Sarah Collins', role: 'Founding attorney', lines: ['Licensed in Texas', 'Answers your calls'] },
  sfx: (sc, X) => { const ts = X.times([sc.name, ...(sc.lines || [])]); return [{ kind: 'soft', at: X.tIn }, ...ts.slice(1).map(t => ({ kind: 'clink', at: t }))]; },
  html(sc, X) {
    const LK = X.LK, id = X.id, nm = LK.name, up = LK.headCase === 'upper', lines = (sc.lines || []).slice(0, 2);
    const card = nm !== 'thread', ink = card ? (nm === 'silhouette' ? LK.ink : BT.ink) : LK.ink, cardBg = nm === 'silhouette' ? LK.surface : '#FFFFFF';
    const acc = card ? readable(nm === 'silhouette' ? LK.accent : BT.accent, cardBg, 4.5) : readable(LK.accentText, LK.bg, 4.5);
    const bFill = nm === 'flat' ? LK.fillB : nm === 'silhouette' ? LK.ink : BT.accent, bInk = contrast('#FFFFFF', bFill) >= 3 ? '#FFFFFF' : BT.ink;
    const ring = nm === 'silhouette' ? LK.accent : nm === 'flat' ? BT.accent : nm === 'thread' ? LK.ink : mix(BT.accent, '#FFFFFF', .55);
    const ns = String(sc.name).length > 18 ? 70 : 86, sig = ATY.sig(sc.name), k = Math.min(1.4, 520 / sig.w);
    const tick = nm === 'silhouette' ? LK.ink : nm === 'flat' ? LK.fillB : BT.accent, tickInk = contrast('#FFFFFF', tick) >= 3 ? '#FFFFFF' : BT.ink;
    const shadow = nm === 'silhouette' ? '16px 18px 0 rgba(0,0,0,.16)' : nm === 'flat' ? `0 18px 0 ${mix(LK.bg, '#000000', .25)}` : LK.shadow;
    return `${card ? `<div id="${id}c" class="k-abs" style="left:90px;top:600px;width:900px;height:1020px;background:${cardBg};border-radius:${nm === 'silhouette' ? 0 : LK.radius + 8}px;box-shadow:${shadow}"></div>` : ''}
      ${nm === 'cards' ? `<div id="${id}cb" class="k-abs" style="left:90px;top:600px;width:900px;height:200px;border-radius:${LK.radius + 8}px ${LK.radius + 8}px 0 0;background:linear-gradient(120deg, ${mix(BT.accent, '#FFFFFF', .8)}, ${mix(BT.accent, '#FFFFFF', .93)})"></div>` : ''}
      <div id="${id}g" class="k-abs" style="left:110px;top:500px;width:860px;height:1060px;display:flex;flex-direction:column;align-items:center">
        <svg id="${id}b" width="250" height="250" viewBox="0 0 250 250" style="flex:none;overflow:visible">
          <path class="atf" d="${markPath(125, 125, 104)}" fill="${bFill}"/>
          <path class="atr" d="${markPath(125, 125, 120)}" fill="none" stroke="${ring}" stroke-width="${nm === 'thread' ? 5 : 8}"/>
          <text class="ati" x="125" y="129" text-anchor="middle" dominant-baseline="central" font-family="var(--head)" font-weight="800" font-size="92" letter-spacing="2" fill="${bInk}">${esc(ATY.initials(sc.name))}</text></svg>
        <div id="${id}n" class="k-hl" data-qa="text" style="position:relative;margin-top:44px;width:100%;text-align:center;font-size:${ns}px;color:${ink};font-weight:${LK.headWeight};${up ? 'text-transform:uppercase;' : ''}">${esc(sc.name)}</div>
        <div id="${id}r" class="k-tx" data-qa="text" style="position:relative;margin-top:18px;width:100%;text-align:center;font:700 36px/1.2 var(--head);letter-spacing:.12em;text-transform:uppercase;color:${acc}">${esc(sc.role)}</div>
        <i id="${id}dv" style="display:block;margin:44px 0 40px;width:520px;height:4px;background:${nm === 'thread' ? LK.line : mix(ink, cardBg, .82)}"></i>
        ${lines.map((l, i) => `<div class="atl" style="display:flex;align-items:center;gap:24px;margin-top:${i ? 26 : 0}px">
            <svg width="56" height="56" viewBox="0 0 56 56" style="flex:none"><circle cx="28" cy="28" r="28" fill="${tick}"/><path class="atk" d="M16,29 L25,38 L41,19" fill="none" stroke="${tickInk}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <div data-qa="text" style="font:400 44px/1.2 var(--body);color:${ink}">${esc(l)}</div></div>`).join('')}
        <svg id="${id}s" width="600" height="190" viewBox="0 0 600 190" style="flex:none;margin-top:${lines.length > 1 ? 34 : 60}px;overflow:visible">
          <path class="ats" d="${sig.d}" transform="translate(${(300 - sig.w * k / 2 + 12).toFixed(1)},128) scale(${k.toFixed(3)})" fill="none" stroke="${ink}" stroke-width="${(4.5 / k).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>
          <path class="atb" d="M70,168 H530" stroke="${nm === 'thread' ? LK.line : mix(ink, cardBg, .7)}" stroke-width="3"/></svg>
      </div>`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, nm = LK.name, $ = s => X.$(s), lines = [...$(`#${id}g`).querySelectorAll('.atl')];
    const ts = X.times([sc.name, sc.role, ...(sc.lines || []).slice(0, 2)]), tN = Math.max(X.tIn + .45, ts[0]), tR = Math.max(tN + .35, ts[1]);
    const tS = Math.min(X.tOut - 1.1, Math.max(ts[ts.length - 1] + .5, tR + .6));
    if ($(`#${id}c`)) { const st0 = $(`#${id}g`).closest('.stage').getBoundingClientRect(), k0 = st0.width / 1080, bot = ($(`#${id}s`).getBoundingClientRect().bottom - st0.top) / k0;
      $(`#${id}c`).style.height = Math.min(960, bot + 60 - 600) + 'px'; const cs = [`#${id}c`, ...($(`#${id}cb`) ? [`#${id}cb`] : [])];
      tl.set(cs, { autoAlpha: 0 }, 0).set(cs, { autoAlpha: 1, y: 160 }, X.tIn - .1).to(cs, { y: 0, duration: .6, ease: 'lr.out' }, X.tIn - .1);
      tl.to(cs, { y: -60, autoAlpha: 0, duration: .32, ease: 'lr.in' }, X.tOut + .05); }
    // the monogram: ring draws, the mark pops in, the initials rise
    const b = $(`#${id}b`), f = b.querySelector('.atf'), ri = b.querySelector('.atr'), ini = b.querySelector('.ati');
    tl.set(b, { autoAlpha: 0 }, 0).set(b, { autoAlpha: 1 }, X.tIn);
    tl.fromTo(ri, { drawSVG: '0%' }, { drawSVG: '100%', duration: .8, ease: 'power2.inOut', immediateRender: false }, X.tIn);
    tl.set(f, { autoAlpha: 0 }, 0).set(f, { autoAlpha: 1, scale: 0, svgOrigin: '125 125' }, X.tIn + .15).to(f, { scale: 1, duration: .55, ease: 'back.out(1.7)' }, X.tIn + .15);
    tl.set(ini, { autoAlpha: 0 }, 0).set(ini, { autoAlpha: 1, y: 30 }, X.tIn + .35).to(ini, { y: 0, duration: .45, ease: 'lr.out' }, X.tIn + .35);
    tl.fromTo(b, { rotation: 0 }, { rotation: 6, svgOrigin: '125 125', duration: X.tOut - X.tIn, ease: 'none', immediateRender: false }, X.tIn);
    X.head(`#${id}n`, tN);
    tl.set(`#${id}r`, { autoAlpha: 0 }, 0).set(`#${id}r`, { autoAlpha: 1, y: 24, letterSpacing: '.3em' }, tR).to(`#${id}r`, { y: 0, letterSpacing: '.12em', duration: .6, ease: 'lr.out' }, tR);
    tl.set(`#${id}dv`, { autoAlpha: 0 }, 0).set(`#${id}dv`, { autoAlpha: 1, scaleX: 0 }, tR + .15).to(`#${id}dv`, { scaleX: 1, duration: .6, ease: 'lr.out' }, tR + .15);
    lines.forEach((l, i) => { const t = Math.max(tR + .3 + i * .3, ts[2 + i]), c = l.querySelector('svg'), k = l.querySelector('.atk');
      tl.set(l, { autoAlpha: 0 }, 0).set(l, { autoAlpha: 1, x: -40 }, t).to(l, { x: 0, duration: .45, ease: 'lr.out' }, t);
      tl.fromTo(c, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: .35, ease: 'back.out(2)', immediateRender: false }, t);
      tl.fromTo(k, { drawSVG: '0%' }, { drawSVG: '100%', duration: .3, ease: 'power2.out', immediateRender: false }, t + .15); });
    // the signature writes itself
    const s = $(`#${id}s`), sp = s.querySelector('.ats'), bl = s.querySelector('.atb');
    tl.set(s, { autoAlpha: 0 }, 0).set(s, { autoAlpha: 1 }, tS - .3);
    tl.fromTo(bl, { drawSVG: '0%' }, { drawSVG: '100%', duration: .5, ease: 'lr.out', immediateRender: false }, tS - .3);
    tl.fromTo(sp, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.1, ease: 'power1.inOut', immediateRender: false }, tS);
    if (LK.thread) { const st = s.closest('.stage').getBoundingClientRect(), k = st.width / 1080, r = s.getBoundingClientRect();
      X.dot((r.right - st.left) / k - 50, (r.top - st.top) / k + 168, tS + 1.15, { r: 14 }); }
    tl.to([`#${id}g`], { y: -50, autoAlpha: 0, duration: .32, ease: 'lr.in' }, X.tOut);
  },
};
