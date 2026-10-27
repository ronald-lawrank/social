/* compare-split: "without / with". The screen starts grey and tangled: a scribble knots itself behind crooked, jittering
   points. On the key word a divider sweeps in from the right and the calm side opens in the firm's colours, its points
   lined up with ticks. thread: grey scribble vs clean white; flat: muddy grey vs white on the brand colour; cards: a
   crumpled grey card vs a crisp white one; silhouette: black chaos vs clean paper. */
SCENES['compare-split'] = {
  label: 'Without / with', about: 'A grey, tangled "without" side; on the key word a divider sweeps across and the calm "with" side opens in brand colours.',
  good: 'with vs without a lawyer, before / after, going it alone vs with us, myths vs facts', practice: 'any',
  fields: { head: 'optional headline', left: '{title, points: 2-3} the "without" side, said first', right: '{title, points: 2-3} the "with" side; the divider sweeps when its title is said' },
  example: { say: 'On your own, you face the insurer alone and guess at what your claim is worth. With us, we handle the insurer and we fight for full value.',
    head: 'Who is **on your side?**', left: { title: 'On your own', points: ['Face the insurer alone', 'Guess at what it is worth'] },
    right: { title: 'With us', points: ['We handle the insurer', 'We fight for full value'] } },
  sfx: (sc, X) => { const T = SCENES['compare-split'].tm(sc, X); return [{ kind: 'buzz', at: T.lp[0] }, { kind: 'whoosh', at: T.sw }].concat(T.rp.map(t => ({ kind: 'chime', at: t + .1 }))); },
  tm(sc, X) {
    const L = sc.left, R = sc.right, ts = X.times([L.title, ...L.points, R.title, ...R.points]), nl = L.points.length;
    const lt = ts[0], lp = ts.slice(1, 1 + nl), sw = Math.max(lp[nl - 1] + .6, ts[1 + nl] - .25), rp = ts.slice(2 + nl).map(t => Math.max(t, sw + .5));
    return { lt, lp, sw, rp };
  },
  geo(sc) { const top = sc.head ? 580 : 440; return { top, bot: 1500, xl: 60, xr: 1020, mid: 540 }; },
  pal(LK) {
    const n = LK.name, grey = '#8E9196';
    if (n === 'thread') { const L = mix(LK.bg, grey, .28); return { lbg: L, lInk: readable(mix(BT.ink, grey, .3), L, 4.5), scr: mix(L, '#000000', .18), rbg: '#FFFFFF', rInk: LK.ink, tick: BT.accent, tickInk: '#FFFFFF', bar: BT.accent, edge: `${LK.stroke - 2}px solid ${LK.line}`, rad: 30 }; }
    if (n === 'flat') { const L = mix(mix(LK.bg, grey, .8), '#000000', .12); return { lbg: L, lInk: readable('#FFFFFF', L, 4.5), scr: mix(L, '#000000', .25), rbg: '#FFFFFF', rInk: BT.ink, tick: LK.fillB, tickInk: '#FFFFFF', bar: '#FFFFFF', edge: 'none', rad: 34 }; }
    if (n === 'cards') { const L = '#D9D8D6'; return { lbg: L, lInk: '#4A4C50', scr: '#BDBCBA', rbg: '#FFFFFF', rInk: BT.ink, tick: BT.accent, tickInk: contrast('#FFFFFF', BT.accent) >= 3 ? '#FFFFFF' : BT.ink, bar: '#FFFFFF', edge: 'none', rad: 36 }; }
    return { lbg: LK.ink, lInk: mix('#F8F6F1', LK.ink, .2), scr: mix(LK.ink, '#FFFFFF', .2), rbg: LK.surface, rInk: LK.ink, tick: LK.accent, tickInk: contrast('#FFFFFF', LK.accent) >= 3 ? '#FFFFFF' : LK.ink, bar: LK.accent, edge: `6px solid ${LK.ink}`, rad: 0 };
  },
  html(sc, X) {
    const LK = X.LK, n = LK.name, P = this.pal(LK), id = X.id, G = this.geo(sc), H = G.bot - G.top, up = LK.headCase === 'upper';
    const sh = n === 'cards' ? LK.shadow : n === 'flat' ? `0 14px 0 ${mix(LK.bg, '#000000', .25)}` : n === 'silhouette' ? '14px 16px 0 rgba(0,0,0,.16)' : '0 22px 50px rgba(20,24,28,.10)';
    const r = seeded(31); let d = `M${G.xl + 80},${G.top + H * .6}`;
    for (let k = 0; k < 16; k++) d += ` C${(G.xl + r() * 900).toFixed(0)},${(G.top + H * .42 + r() * H * .5).toFixed(0)} ${(G.xl + r() * 900).toFixed(0)},${(G.top + H * .42 + r() * H * .5).toFixed(0)} ${(G.xl + 60 + r() * 840).toFixed(0)},${(G.top + H * .45 + r() * H * .45).toFixed(0)}`;
    const mark = (ok, col, ink) => `<div class="csm" style="flex:none;width:64px;height:64px;margin-top:2px;border-radius:${n === 'silhouette' ? 0 : 50}%;background:${col};display:flex;align-items:center;justify-content:center">
      <svg width="34" height="34" viewBox="0 0 34 34"><path d="${ok ? 'M7 18 L14 25 L27 9' : 'M9 9 L25 25 M25 9 L9 25'}" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
    const col = (side, x) => { const S = sc[side], ok = side === 'right', ink = ok ? P.rInk : P.lInk;
      const pts = S.points.map((p, i) => `<div class="csp" id="${id}${side[0]}${i}" style="display:flex;gap:22px;align-items:flex-start;margin-top:${i ? 48 : 0}px">
        ${mark(ok, ok ? P.tick : mix(P.lbg, n === 'silhouette' ? '#FFFFFF' : '#000000', .14), ok ? P.tickInk : ink)}<div data-qa="text" style="font:600 44px/1.18 var(--body);color:${ink}">${esc(p)}</div></div>`).join('');
      return `<div class="k-abs" style="left:${x}px;top:${G.top + 56}px;width:400px">
        <div id="${id}${side[0]}t" data-qa="text" style="font:${LK.headWeight} ${S.title.length > 14 ? 56 : 66}px/1.05 var(--head);color:${ok ? (n === 'flat' ? readable(LK.fillB, '#FFFFFF', 4.5) : n === 'silhouette' ? LK.accentText : readable(BT.accent, '#FFFFFF', 3)) : ink};${up ? 'text-transform:uppercase;' : ''}margin-bottom:56px">${accentize(S.title, 'ka')}</div>${pts}</div>`; };
    const left = `<div id="${id}L" class="k-abs" style="left:${G.xl}px;top:${G.top}px;width:${G.xr - G.xl}px;height:${H}px;background:${P.lbg};border-radius:${P.rad}px;box-shadow:${sh};overflow:hidden">
        <svg width="${G.xr - G.xl}" height="${H}" viewBox="${G.xl} ${G.top} ${G.xr - G.xl} ${H}" style="position:absolute;left:0;top:0"><path id="${id}scr" d="${d}" fill="none" stroke="${P.scr}" stroke-width="7" stroke-linecap="round"/></svg></div>`;
    const right = `<div id="${id}R" class="k-abs" style="left:0;top:0;width:1080px;height:1920px;clip-path:inset(0px 0px 0px 1080px)">
        <div class="k-abs" style="left:${G.mid}px;top:${G.top}px;width:${G.xr - G.mid}px;height:${H}px;background:${P.rbg};border-radius:0 ${P.rad}px ${P.rad}px 0;box-shadow:${n === 'silhouette' ? 'none' : sh};${n === 'thread' ? `border:${P.edge};border-left:none;` : n === 'silhouette' ? `border:${P.edge};border-left:none;` : ''}"></div>
        <svg class="svgL" viewBox="0 0 1080 1920"><path id="${id}calm" d="M${G.mid + 50},${G.bot - 110} C${G.mid + 170},${G.bot - 110} ${G.mid + 200},${G.bot - 250} ${G.mid + 300},${G.bot - 250} S${G.xr - 110},${G.bot - 330} ${G.xr - 60},${G.bot - 360}" fill="none" stroke="${P.tick}" stroke-width="10" stroke-linecap="round"/>
          <path id="${id}calmA" d="M${G.xr - 98},${G.bot - 366} L${G.xr - 58},${G.bot - 362} L${G.xr - 70},${G.bot - 324}" fill="none" stroke="${P.tick}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${col('right', G.mid + 44)}</div>`;
    const bar = `<div id="${id}bar" class="k-abs" style="left:${G.mid - 5}px;top:${G.top - 30}px;width:10px;height:${H + 60}px;background:${P.bar};border-radius:5px;${n === 'flat' || n === 'cards' ? `box-shadow:0 6px 20px rgba(0,0,0,.18)` : ''}">
        <div style="position:absolute;left:-41px;top:${H * .78}px;width:92px;height:92px;border-radius:${n === 'silhouette' ? 0 : 50}%;background:${P.bar};display:flex;align-items:center;justify-content:center;${n === 'silhouette' ? '' : 'box-shadow:0 8px 24px rgba(0,0,0,.18)'}">
          <svg width="52" height="30" viewBox="0 0 52 30"><path d="M14 4 L4 15 L14 26 M38 4 L48 15 L38 26" fill="none" stroke="${n === 'flat' ? LK.fillB : n === 'cards' ? BT.accent : contrast('#FFFFFF', P.bar) >= 3 ? '#FFFFFF' : BT.ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div>`;
    return `${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 330, w: 920, size: 84, align: 'center' }) : ''}${left}<div id="${id}Lc">${col('left', G.xl + 40)}</div>${right}${bar}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, G = this.geo(sc), T = this.tm(sc, X), q = s => X.q(s), H = G.bot - G.top;
    if (sc.head) X.head(`#${id}h`, X.tIn);
    const L = q(`#${id}L`), R = q(`#${id}R`), bar = q(`#${id}bar`), scr = q(`#${id}scr`);
    tl.set(L, { autoAlpha: 0 }, 0).set(L, { autoAlpha: 1, y: 120, rotation: -1.5 }, X.tIn - .15).to(L, { y: 0, rotation: 0, duration: .55, ease: 'lr.out' }, X.tIn - .15);
    // the tangle knots itself while the left side is spoken, then keeps writhing
    tl.set(scr, { drawSVG: '0%' }, 0).to(scr, { drawSVG: '100%', duration: Math.max(1, T.sw - X.tIn - .2), ease: 'power1.inOut' }, X.tIn + .1);
    const lt = q(`#${id}lt`); tl.set(lt, { autoAlpha: 0 }, 0).set(lt, { autoAlpha: 1, x: -30 }, Math.max(X.tIn, T.lt - .1)).to(lt, { x: 0, duration: .45, ease: 'lr.out' }, Math.max(X.tIn, T.lt - .1));
    sc.left.points.forEach((p, i) => { const el = q(`#${id}l${i}`), t = T.lp[i], rot = [-2.5, 2, -1.5][i];
      tl.set(el, { autoAlpha: 0 }, 0).set(el, { autoAlpha: 1, x: -40, rotation: rot * 3 }, t - .05).to(el, { x: 0, rotation: rot, duration: .45, ease: 'back.out(1.6)' }, t - .05);
      // a nervous jitter that never settles
      const n = Math.max(1, Math.floor((X.tOut - t - .5) / .16));
      tl.to(el, { keyframes: Array.from({ length: Math.min(n, 60) }, (_, k) => ({ x: [3, -2, 2, -3][k % 4], rotation: rot + [.6, -.5, .4, -.6][k % 4], duration: .16, ease: 'none' })) }, t + .45); });
    // the divider sweeps across on the key word; the calm side opens behind it
    const sw = T.sw, d = .7;
    tl.set(R, { autoAlpha: 0 }, 0).set(R, { autoAlpha: 1, clipPath: 'inset(0px 0px 0px 1080px)' }, sw).to(R, { clipPath: `inset(0px 0px 0px ${G.mid}px)`, duration: d, ease: 'lr.move' }, sw);
    tl.set(bar, { autoAlpha: 0 }, 0).set(bar, { autoAlpha: 1, x: G.xr + 30 - G.mid }, sw).to(bar, { x: 0, duration: d, ease: 'lr.move' }, sw);
    tl.to(L, { filter: 'saturate(.6)', duration: .4 }, sw + .2);
    const rt = q(`#${id}rt`); tl.set(rt, { autoAlpha: 0 }, 0).set(rt, { autoAlpha: 1, y: 26 }, sw + .35).to(rt, { y: 0, duration: .45, ease: 'lr.out' }, sw + .35);
    sc.right.points.forEach((p, i) => { const el = q(`#${id}r${i}`), t = T.rp[i], m = X.$(`#${id}r${i} .csm`);
      tl.set(el, { autoAlpha: 0 }, 0).set(el, { autoAlpha: 1, y: 24 }, t).to(el, { y: 0, duration: .45, ease: 'lr.out' }, t);
      tl.fromTo(m, { scale: 0 }, { scale: 1, duration: .4, ease: 'back.out(2.2)', immediateRender: false }, t + .05);
      if (LK.thread && i === sc.right.points.length - 1) { const node = X.$(`#${id}r${i}`); X.dot(G.xr + 24, node.parentElement.offsetTop + node.offsetTop + 30, t + .25, { r: 14 }); } });
    tl.set([q(`#${id}calm`), q(`#${id}calmA`)], { drawSVG: '0%' }, 0).to(q(`#${id}calm`), { drawSVG: '100%', duration: .9, ease: 'power2.inOut' }, sw + .5).to(q(`#${id}calmA`), { drawSVG: '100%', duration: .25, ease: 'power2.out' }, sw + 1.35);
    if (LK.thread) X.dot(G.mid, G.top - 30 + H * .78 + 46, sw + d, { r: 18 });
    tl.to([q(`#${id}Lc`), R, bar], { autoAlpha: 0, duration: .26, ease: 'lr.in' }, X.tOut);
    tl.to(L, { autoAlpha: 0, y: -40, duration: .3, ease: 'lr.in' }, X.tOut + .05);
  },
};
