/* scales: the scales of justice. Weights thud onto one pan and drag it down ("Insurance company"); then the firm's
   mark drops onto the other pan and the beam swings level on the word. thread: line-art scales, the dot settles on the
   finial; flat: chunky deep-brand scales; cards: soft solid scales with white label cards; silhouette: black cut-out. */
SCENES.scales = {
  label: 'Scales balance', about: "Weights drag one pan of the scales down; the firm's mark drops on the other pan and the beam swings level.",
  good: 'levelling the playing field, taking on the insurer, big companies vs you, fairness', practice: 'any',
  fields: { head: 'optional headline', heavy: 'label for the heavy side (said in the line), e.g. "Insurance company"',
    counter: "label for the firm's side (said in the line); default the firm's short name" },
  example: { say: 'The insurance company has a team of lawyers on its side. With your own lawyer, the scales are even again.',
    head: 'Even the **scales.**', heavy: 'Insurance company', counter: 'Your own lawyer' },
  sfx: (sc, X) => { const [a, b] = SCENES.scales.tm(sc, X); return [0, 1, 2].map(k => ({ kind: 'thud', at: a + .3 + k * .24 })).concat([{ kind: 'clink', at: b + .1 }, { kind: 'chime', at: b + .45 }]); },
  tm(sc, X) { const [a, b] = X.times([sc.heavy, sc.counter || BT.short]); return [a, Math.max(b, a + 1.2)]; },
  geo(sc) { const PY = sc.head ? 820 : 720; return { PX: 540, PY, R: 300, L: 300, A: 13, s: 1.16 }; },
  pal(LK) {
    const n = LK.name;
    if (n === 'thread') return { metal: '#FFFFFF', edge: LK.line, sw: LK.stroke, weight: LK.fillB, mark: BT.accent, onMark: '#FFFFFF', chain: LK.line };
    if (n === 'flat') return { metal: LK.fillB, edge: null, sw: 0, weight: mix(LK.fillB, '#000000', .35), mark: '#FFFFFF', onMark: readable(BT.accent, '#FFFFFF', 3), chain: LK.fillB };
    if (n === 'cards') return { metal: mix(BT.ink, '#FFFFFF', .2), edge: null, sw: 0, weight: BT.ink, mark: BT.accent, onMark: contrast('#FFFFFF', BT.accent) >= 3 ? '#FFFFFF' : BT.ink, chain: mix(BT.ink, '#FFFFFF', .35) };
    return { metal: LK.ink, edge: null, sw: 0, weight: LK.ink, mark: LK.accent, onMark: LK.surface, chain: LK.ink };
  },
  html(sc, X) {
    const LK = X.LK, n = LK.name, G = this.geo(sc), P = this.pal(LK), id = X.id, { PX, PY, R, L } = G;
    const st = P.edge ? `stroke="${P.edge}" stroke-width="${P.sw}" stroke-linejoin="round"` : '';
    const sh = n === 'cards' ? `<feDropShadow dx="0" dy="26" stdDeviation="22" flood-color="#1E140A" flood-opacity=".22"/>`
      : n === 'silhouette' ? `<feDropShadow dx="14" dy="16" stdDeviation="0" flood-color="#000" flood-opacity=".15"/>`
      : n === 'flat' ? `<feDropShadow dx="0" dy="12" stdDeviation="0" flood-color="${mix(LK.bg, '#000000', .25)}" flood-opacity="1"/>` : `<feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#14181C" flood-opacity=".08"/>`;
    const base = PY + 640;
    const post = `<path d="M${PX - 22},${PY + 10} H${PX + 22} V${base - 70} H${PX - 22} Z" fill="${P.metal}" ${st}/>
      <path d="M${PX - 150},${base} C${PX - 140},${base - 46} ${PX - 70},${base - 70} ${PX},${base - 74} C${PX + 70},${base - 70} ${PX + 140},${base - 46} ${PX + 150},${base} Z" fill="${P.metal}" ${st}/>
      <rect x="${PX - 190}" y="${base - 4}" width="380" height="30" rx="${n === 'silhouette' ? 0 : 15}" fill="${P.metal}" ${st}/>`;
    const finial = `<circle cx="${PX}" cy="${PY - 52}" r="26" fill="${P.metal}" ${st}/><path d="M${PX - 34},${PY - 26} H${PX + 34} L${PX + 22},${PY} H${PX - 22} Z" fill="${P.metal}" ${st}/>`;
    const beam = `<g id="${id}beam"><path d="M${PX - R - 14},${PY - 9} Q${PX},${PY - 34} ${PX + R + 14},${PY - 9} L${PX + R + 14},${PY + 9} Q${PX},${PY - 10} ${PX - R - 14},${PY + 9} Z" fill="${P.metal}" ${st}/>
      <circle cx="${PX - R}" cy="${PY}" r="16" fill="${P.metal}" ${st}/><circle cx="${PX + R}" cy="${PY}" r="16" fill="${P.metal}" ${st}/><circle cx="${PX}" cy="${PY - 8}" r="30" fill="${P.metal}" ${st}/>
      ${n === 'thread' ? `<circle cx="${PX}" cy="${PY - 8}" r="10" fill="${LK.line}"/>` : ''}</g>`;
    const pan = (side, inner) => { const cx = PX + side * R, py = PY + L;
      return `<g id="${id}pan${side < 0 ? 'L' : 'R'}"><path d="M${cx},${PY} L${cx - 130},${py} M${cx},${PY} L${cx + 130},${py} M${cx},${PY} L${cx},${py - 4}" stroke="${P.chain}" stroke-width="${n === 'thread' ? 4 : 6}" fill="none" ${n === 'thread' ? '' : 'stroke-dasharray="14 6"'}/>
        ${inner}<path d="M${cx - 160},${py} H${cx + 160} C${cx + 150},${py + 60} ${cx + 80},${py + 80} ${cx},${py + 80} C${cx - 80},${py + 80} ${cx - 150},${py + 60} ${cx - 160},${py} Z" fill="${P.metal}" ${st}/></g>`; };
    const wt = (cx, by, w, h, k) => `<g class="scw" id="${id}w${k}"><path d="M${cx - w * .32},${by - h} a${w * .16},${w * .16} 0 1 1 ${w * .64},0" fill="none" stroke="${P.weight}" stroke-width="${Math.round(w * .09)}" ${P.edge ? '' : ''}/>
      <path d="M${cx - w * .36},${by - h} H${cx + w * .36} L${cx + w / 2},${by} H${cx - w / 2} Z" fill="${P.weight}" ${st}/></g>`;
    const lx = PX - R, py = PY + L;
    const weights = wt(lx - 52, py, 150, 96, 0) + wt(lx + 70, py, 120, 78, 1) + wt(lx + 6, py - 96, 110, 70, 2);
    const mark = `<g id="${id}mk"><path d="${markPath(PX + R, py - 82, 82)}" fill="${P.mark}" ${n === 'thread' ? `stroke="${mix(BT.accent, '#000000', .2)}" stroke-width="3"` : ''}/>
      <path id="${id}chk" d="M${PX + R - 30},${py - 82} L${PX + R - 8},${py - 60} L${PX + R + 34},${py - 106}" fill="none" stroke="${P.onMark}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    const capY = PY + (L + 104) * G.s, chip = n === 'cards', up = LK.headCase === 'upper';
    const cap = (txt, x, k, accent) => `<div id="${id}c${k}" class="k-abs" style="left:${Math.max(70, Math.min(670, x))}px;top:${capY}px;width:340px;display:flex;justify-content:center">
      <div data-qa="text" style="${chip ? `background:#FFFFFF;box-shadow:${LK.shadow};border-radius:24px;padding:18px 26px;` : ''}${n === 'silhouette' && accent ? `background:${LK.ink};padding:12px 20px;` : ''}
        font:${LK.headWeight} ${txt.length > 18 ? 40 : 46}px/1.1 var(--head);text-align:center;${up ? 'text-transform:uppercase;' : ''}
        color:${chip ? (accent ? readable(BT.accent, '#FFFFFF', 4.5) : BT.ink) : n === 'silhouette' && accent ? '#F8F6F1' : accent ? LK.accentText : LK.ink}">${accentize(txt, 'ka')}</div></div>`;
    return `${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 330, w: 920, size: 88, align: 'center' }) : ''}
      <svg class="svgL" viewBox="${PX - PX / G.s} ${PY - PY / G.s} ${1080 / G.s} ${1920 / G.s}"><defs><filter id="${id}sh" x="-30%" y="-30%" width="160%" height="160%">${sh}</filter></defs>
        <g id="${id}all" filter="url(#${id}sh)">${post}${pan(-1, weights)}${pan(1, mark)}${beam}${finial}</g></svg>
      ${cap(sc.heavy, PX - R * G.s - 170, 0, false)}${cap(sc.counter || BT.short, PX + R * G.s - 170, 1, true)}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, G = this.geo(sc), id = X.id, q = s => X.q(s), [ta, tb] = this.tm(sc, X), { PX, PY, R, A } = G;
    if (sc.head) X.head(`#${id}h`, X.tIn);
    const all = q(`#${id}all`), beam = q(`#${id}beam`), pL = q(`#${id}panL`), pR = q(`#${id}panR`), cL = q(`#${id}c0`), cR = q(`#${id}c1`);
    tl.set(all, { autoAlpha: 0 }, 0).set(all, { autoAlpha: 1, y: 120 }, X.tIn - .15).to(all, { y: 0, duration: .6, ease: 'lr.out' }, X.tIn - .15);
    // an idle sway before anything lands
    tl.fromTo(beam, { rotation: 3, svgOrigin: `${PX} ${PY}` }, { rotation: 0, svgOrigin: `${PX} ${PY}`, duration: 1.2, ease: 'elastic.out(1,.3)', immediateRender: true }, X.tIn);
    tl.fromTo(pL, { y: -R * Math.sin(3 * Math.PI / 180) }, { y: 0, duration: 1.2, ease: 'elastic.out(1,.3)', immediateRender: true }, X.tIn);
    tl.fromTo(pR, { y: R * Math.sin(3 * Math.PI / 180) }, { y: 0, duration: 1.2, ease: 'elastic.out(1,.3)', immediateRender: true }, X.tIn);
    const tilt = (deg, t, d, ease) => { const dy = R * Math.sin(deg * Math.PI / 180);
      tl.to(beam, { rotation: -deg, svgOrigin: `${PX} ${PY}`, duration: d, ease }, t).to(pL, { y: dy, duration: d, ease }, t).to(pR, { y: -dy, duration: d, ease }, t)
        .to(cL, { y: dy * G.s, duration: d, ease }, t).to(cR, { y: -dy * G.s, duration: d, ease }, t); };
    // the weights thud in one after another; each one drags the pan further down
    [0, 1, 2].forEach(k => { const w = q(`#${id}w${k}`), t = ta + k * .24;
      tl.set(w, { autoAlpha: 0 }, 0).set(w, { autoAlpha: 1, y: -330 }, t - .05).to(w, { y: 0, duration: .35, ease: 'power3.in' }, t - .05);
      tilt(A * (k + 1) / 3, t + .3, .55, 'elastic.out(1,.55)'); });
    tl.set(cL, { autoAlpha: 0 }, 0).set(cL, { autoAlpha: 1, scale: .7 }, ta + .1).to(cL, { scale: 1, duration: .4, ease: 'back.out(2)' }, ta + .1);
    // the mark drops on the other side and the beam swings level
    const mk = q(`#${id}mk`), chk = q(`#${id}chk`);
    tl.set(mk, { autoAlpha: 0 }, 0).set(mk, { autoAlpha: 1, y: -380, rotation: -30, transformOrigin: '50% 50%' }, tb - .35)
      .to(mk, { y: 0, rotation: 0, duration: .4, ease: 'power3.in' }, tb - .35);
    tl.set(chk, { drawSVG: '0%' }, 0).to(chk, { drawSVG: '100%', duration: .35, ease: 'power2.out' }, tb + .25);
    tilt(-3, tb + .05, .3, 'power2.out'); tilt(0, tb + .35, .9, 'elastic.out(1,.4)');
    tl.set(cR, { autoAlpha: 0 }, 0).set(cR, { autoAlpha: 1, scale: .7 }, tb + .1).to(cR, { scale: 1, duration: .4, ease: 'back.out(2)' }, tb + .1);
    if (LK.thread) { X.dot(PX, PY - 52 * G.s, tb + .5, { r: 20 }); }
    tl.to([cL, cR], { autoAlpha: 0, y: '+=30', duration: .28, ease: 'lr.in' }, X.tOut);
    tl.to(all, { autoAlpha: 0, y: -40, duration: .3, ease: 'lr.in' }, X.tOut + .05);
  },
};
