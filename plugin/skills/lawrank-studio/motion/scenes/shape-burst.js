/* shape-burst: a central icon (or one word) lands with a squash and a ripple, and a burst of flat geometric confetti
   (circles, rings, triangles, plus signs, squares, squiggles) radiates out of it and settles into a slow drift around
   it, while an optional ribbon swooshes behind. thread: line-art confetti, a slim accent ribbon, the dot lands on the
   badge; flat: chunky white and deep-brand shapes with hard drop shadows; cards: a white badge with a soft shadow and
   a white paper ribbon; silhouette: black and accent cut-outs, a black ribbon with an offset shadow. */
const SBU = {
  hlines(text, LK, size = 84, w = 920) {
    const per = Math.max(6, Math.floor(w / (size * (LK.headCase === 'upper' ? .7 : .58)))), ws = String(text || '').replace(/\*\*/g, '').split(/\s+/);
    let lines = 1, cur = 0; ws.forEach(x => { if (cur && cur + 1 + x.length > per) { lines++; cur = x.length; } else cur += (cur ? 1 : 0) + x.length; }); return lines;
  },
  geo(sc, LK) {
    const hb = sc.head ? 330 + SBU.hlines(sc.head, LK) * 84 * 1.08 : 300, top = sc.head ? hb + 50 : 400;
    const subLines = sc.sub ? (String(sc.sub).length > 30 ? 2 : 1) : 0, ly = 1540 - subLines * 62, bottom = sc.sub ? ly - 40 : 1520;
    const cy = Math.round((top + bottom) / 2), half = (bottom - top) / 2, Rd = Math.round(Math.min(186, half * .42));
    return { cx: 540, cy, Rd, half, Rmax: Math.min(470, half + 60), ly, top, bottom };
  },
  pal(LK) {
    const n = LK.name, A = BT.accent, I = BT.ink;
    if (n === 'thread') return { cols: [A, LK.line, mix(A, '#FFFFFF', .45), LK.fillC, A, LK.line], outline: true, disc: '#FFFFFF', discEdge: LK.line, ic: LK.ink, icA: A,
      word: LK.ink, rib: [mix(A, '#FFFFFF', .84), A], ribW: [96, 8], ring: A };
    if (n === 'flat') return { cols: ['#FFFFFF', LK.fillB, LK.fillC, '#FFFFFF', mix(LK.fillB, '#000000', .3), LK.fillC], disc: '#FFFFFF', ic: LK.fillB, icA: LK.fillB,
      word: readable(LK.fillB, '#FFFFFF', 4.5), rib: [LK.fillB, LK.fillC], ribW: [132, 40], shadow: mix(LK.bg, '#000000', .25), ring: '#FFFFFF' };
    if (n === 'cards') return { cols: [A, I, mix(A, '#FFFFFF', .5), mix(A, '#FFB25B', .5), '#FFFFFF', mix(I, '#FFFFFF', .55)], disc: '#FFFFFF', ic: I, icA: A,
      word: I, rib: ['#FFFFFF', mix(A, '#FFFFFF', .35)], ribW: [124, 26], soft: true, ring: '#FFFFFF' };
    return { cols: [LK.ink, LK.accent, LK.ink, LK.fillB, LK.accent, LK.ink], disc: LK.ink, ic: LK.surface, icA: readable(BT.accent, LK.ink, 3),
      word: LK.surface, rib: [LK.ink, LK.accent], ribW: [118, 28], shadow: 'rgba(0,0,0,.14)', hard: true, ring: LK.ink };
  },
  // the confetti: deterministic, spread round the badge in rings, clear of the headline and the line below
  bits(G) {
    const r = seeded(97), out = [], kinds = ['circle', 'tri', 'plus', 'square', 'ring', 'squig'], N = 36;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * 360 + (r() - .5) * 9, band = i % 3, rr = G.Rd + 50 + (band + r() * .8) * (G.Rmax - G.Rd - 70) / 3;
      const ry = Math.min(rr, G.half + 20);           // squash the field vertically to stay between the texts
      out.push({ k: kinds[i % kinds.length], x: G.cx + rr * Math.cos(a * Math.PI / 180), y: G.cy + ry * Math.sin(a * Math.PI / 180), s: 16 + r() * 18 + band * 4,
        rot: r() * 360, spin: (r() < .5 ? -1 : 1) * (90 + r() * 200), c: i, dl: r() * .14 });
    }
    return out;
  },
  shape(b, col, P) {
    const { x, y, s } = b, o = P.outline && b.k !== 'circle' && b.k !== 'squig', st = `stroke="${col}" stroke-width="${o ? 6 : 9}" stroke-linejoin="round" stroke-linecap="round"`;
    const f = o ? `fill="none" ${st}` : `fill="${col}"`;
    if (b.k === 'circle') return `<circle cx="${x}" cy="${y}" r="${s * .7}" fill="${col}"/>`;
    if (b.k === 'ring') return `<circle cx="${x}" cy="${y}" r="${s * .75}" fill="none" stroke="${col}" stroke-width="${o ? 6 : 9}"/>`;
    if (b.k === 'tri') return `<path d="M${x},${y - s} L${x + s * .9},${y + s * .6} L${x - s * .9},${y + s * .6}Z" ${f}/>`;
    if (b.k === 'square') return `<rect x="${x - s * .7}" y="${y - s * .7}" width="${s * 1.4}" height="${s * 1.4}" rx="${P.hard ? 0 : 4}" ${f}/>`;
    if (b.k === 'plus') return `<path d="M${x - s},${y} H${x + s} M${x},${y - s} V${y + s}" fill="none" stroke="${col}" stroke-width="${o ? 7 : 10}" stroke-linecap="${P.hard ? 'butt' : 'round'}"/>`;
    const w = s * 2.2; return `<path d="M${x - w / 2},${y} q${w / 8},${-s * .7} ${w / 4},0 t${w / 4},0 t${w / 4},0 t${w / 4},0" fill="none" stroke="${col}" stroke-width="${o ? 6 : 8}" stroke-linecap="round"/>`;
  },
};
SCENES['shape-burst'] = {
  label: 'Shape burst', about: 'A central icon or word lands, then flat geometric confetti bursts out of it and settles into a gentle drift; a ribbon swooshes behind.',
  good: "we're here for you, celebratory or upbeat moments, a warm welcome, a promise", practice: 'any',
  fields: { head: 'optional headline above (2-7 words; **phrase** = accent)', icon: 'centre icon (heart users home shield chat phone check briefcase)',
    word: 'optional single word in the centre instead of the icon (said in the line)', sub: 'optional supporting line below (3-8 words)', ribbon: 'true (default) or false: the ribbon swoosh behind the badge' },
  example: { say: "Whatever you're facing, you don't face it alone. We're here for you, every step of the way.",
    head: "We're **here for you**", icon: 'heart', sub: 'Every step of the way' },
  sfx: (sc, X) => { const T = SCENES['shape-burst'].tm(sc, X); return [{ kind: 'thud', at: T.land }, { kind: 'pop', at: T.burst }, ...(sc.ribbon !== false ? [{ kind: 'whoosh', at: T.burst - .3 }] : []), ...(sc.sub ? [{ kind: 'soft', at: T.sub }] : [])]; },
  tm(sc, X) {
    const acc = (String(sc.head || '').match(/\*\*(.+?)\*\*/) || [])[1], cue = sc.word || acc;
    const said = cue ? X.times([cue])[0] : X.tIn + .85, burst = Math.min(X.tOut - 1.3, Math.max(X.tIn + .85, said)), land = Math.max(X.tIn + .4, burst - .9);
    const sub = sc.sub ? Math.min(X.tOut - .7, Math.max(burst + .45, X.times([sc.sub])[0])) : null;
    return { land, burst, sub };
  },
  html(sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, G = SBU.geo(sc, LK), P = SBU.pal(LK), { cx, cy, Rd } = G, up = LK.headCase === 'upper';
    const bits = SBU.bits(G).map(b => `<g class="sbb" data-x="${b.x.toFixed(1)}" data-y="${b.y.toFixed(1)}" data-r="${b.rot.toFixed(0)}" data-s="${b.spin.toFixed(0)}" data-d="${b.dl.toFixed(3)}"><g class="sbi">${SBU.shape(b, P.cols[b.c % P.cols.length], P)}</g></g>`).join('');
    const rp = `M-80,${cy + G.half * .62} C${cx - 300},${cy + G.half * .7} ${cx - 220},${cy - G.half * .05} ${cx},${cy - G.half * .08} S${cx + 330},${cy - G.half * .55} 1160,${cy - G.half * .5}`;
    const rib = sc.ribbon === false ? '' : `<g id="${id}rib">${P.shadow ? `<path class="sbr" d="${rp}" fill="none" stroke="${P.shadow}" stroke-width="${P.ribW[0]}" stroke-linecap="butt" transform="translate(${P.hard ? '14 16' : '0 14'})"/>` : ''}
        <path class="sbr" d="${rp}" fill="none" stroke="${P.rib[0]}" stroke-width="${P.ribW[0]}" stroke-linecap="${nm === 'thread' ? 'round' : 'butt'}" ${P.soft ? `filter="url(#${id}rs)"` : ''}/>
        <path class="sbr" d="${rp}" fill="none" stroke="${P.rib[1]}" stroke-width="${P.ribW[1]}" stroke-linecap="round" ${nm === 'thread' ? 'stroke-dasharray="1 0"' : ''}/></g>`;
    const ripple = [0, 1, 2].map(k => `<circle class="sbp" cx="${cx}" cy="${cy}" r="${Rd}" fill="none" stroke="${P.ring}" stroke-width="${6 - k * 1.5}"/>`).join('');
    const sq = nm === 'silhouette', discSh = nm === 'cards' ? LK.shadow : nm === 'flat' ? `0 16px 0 ${P.shadow}` : nm === 'silhouette' ? LK.shadow : '0 20px 44px rgba(20,24,28,.10)';
    const inner = sc.word && !sc.icon
      ? `<div data-qa="text" style="width:${Rd * 1.7}px;text-align:center;font:${LK.headWeight} ${Math.round(Math.max(40, Math.min(96, Rd * 1.7 / (String(sc.word).length * .64))))}px/1.05 var(--head);color:${P.word};${up ? 'text-transform:uppercase;' : ''}">${esc(String(sc.word).replace(/\*\*/g, ''))}</div>`
      : `<div id="${id}ic">${icon(sc.icon || 'heart', Math.round(Rd * 1.05), P.ic, P.icA)}</div>`;
    const disc = `<div id="${id}d" class="k-abs" style="left:${cx - Rd}px;top:${cy - Rd}px;width:${2 * Rd}px;height:${2 * Rd}px;border-radius:${sq ? 0 : 50}%;background:${P.disc};
      ${nm === 'thread' ? `border:${LK.stroke - 1}px solid ${P.discEdge};` : ''}box-shadow:${discSh};display:flex;align-items:center;justify-content:center;${sq ? 'transform:rotate(45deg);' : ''}">
      <div style="${sq ? 'transform:rotate(-45deg);' : ''}display:flex;align-items:center;justify-content:center">${inner}</div></div>`;
    const lineEl = sc.sub ? `<div id="${id}l" class="k-tx" data-qa="text" style="left:90px;top:${G.ly}px;width:900px;text-align:center;text-wrap:balance;font:${nm === 'silhouette' ? 700 : 600} 50px/1.2 var(--${nm === 'silhouette' ? 'head' : 'body'});
      color:${LK.ink};${up ? 'text-transform:uppercase;letter-spacing:.04em;font-size:44px;' : ''}">${accentize(sc.sub, 'ka')}</div>` : '';
    return `${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 330, w: 920, size: 84, align: 'center' }) : ''}
      <svg class="svgL" viewBox="0 0 1080 1920"><defs><filter id="${id}rs" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#1E140A" flood-opacity=".16"/></filter></defs>
        ${rib}<g id="${id}rip">${ripple}</g><g id="${id}f">${bits}</g></svg>${disc}${lineEl}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, G = SBU.geo(sc, LK), T = this.tm(sc, X), q = s => X.q(s), { cx, cy, Rd } = G, og = `${cx} ${cy}`, land = T.land;
    if (sc.head) X.head(`#${id}h`, X.tIn);
    // the badge drops in and lands with a squash
    const D = q(`#${id}d`), rot = nm === 'silhouette' ? 45 : 0;
    tl.set(D, { autoAlpha: 0 }, 0).set(D, { autoAlpha: 1, y: -170, scale: .45, rotation: rot - 14 }, land - .4)
      .to(D, { y: 0, scale: 1, rotation: rot, duration: .4, ease: 'power3.in' }, land - .4)
      .to(D, { keyframes: [{ scaleX: 1.14, scaleY: .84, duration: .09, ease: 'power2.out' }, { scaleX: 1, scaleY: 1, duration: .6, ease: 'elastic.out(1,.4)' }], transformOrigin: '50% 100%' }, land);
    if (X.$(`#${id}ic`)) tl.fromTo(q(`#${id}ic`), { scale: .6 }, { scale: 1, duration: .5, ease: 'back.out(2.4)', immediateRender: true }, land + .02);
    tl.to(D, { scale: 1.05, duration: Math.max(.6, X.tOut - land - 1), ease: 'sine.inOut' }, land + .75);
    if (LK.thread) X.dot(cx + Rd * .78, cy - Rd * .78, land + .12, { r: 20 });
    // ripple rings
    [...X.$(`#${id}rip`).querySelectorAll('.sbp')].forEach((r, k) => tl.set(r, { opacity: 0 }, 0)
      .fromTo(r, { scale: 1, opacity: .9, svgOrigin: og }, { scale: 1.9 + k * .35, opacity: 0, svgOrigin: og, duration: 1, ease: 'power2.out', immediateRender: false }, T.burst + .02 + k * .14));
    // the burst: every bit flies out of the centre and settles, then the field drifts slowly round
    const bits = [...X.$(`#${id}f`).querySelectorAll('.sbb')];
    bits.forEach(b => { const x = +b.dataset.x, y = +b.dataset.y, d = +b.dataset.d, inn = b.querySelector('.sbi');
      tl.set(inn, { transformOrigin: '50% 50%', rotation: 0, scale: .2 }, 0);
      tl.set(b, { autoAlpha: 0, x: cx - x, y: cy - y }, 0).set(b, { autoAlpha: 1 }, T.burst + d)
        .to(b, { x: 0, y: 0, duration: .95, ease: 'expo.out' }, T.burst + d)
        .to(inn, { scale: 1, rotation: +b.dataset.r, duration: .95, ease: 'expo.out' }, T.burst + d)
        .to(inn, { rotation: `+=${b.dataset.s}`, duration: Math.max(.6, X.tOut - T.burst - .9), ease: 'none' }, T.burst + d + .95); });
    tl.fromTo(q(`#${id}f`), { rotation: 0, scale: 1, svgOrigin: og }, { rotation: 9, scale: 1.04, svgOrigin: og, duration: Math.max(.6, X.t1 - T.burst), ease: 'sine.out', immediateRender: true }, T.burst);
    // the ribbon swooshes in behind, just ahead of the landing
    if (sc.ribbon !== false) {
      const rs = [...X.$(`#${id}rib`).querySelectorAll('.sbr')], tr = T.burst - .35;
      tl.set(rs, { autoAlpha: 0, drawSVG: '0%' }, 0);
      rs.forEach((r, k) => tl.set(r, { autoAlpha: 1 }, tr + k * .06).to(r, { drawSVG: '100%', duration: .8, ease: 'power3.inOut' }, tr + k * .06));
      tl.to(rs, { drawSVG: '100% 100%', duration: .4, ease: 'lr.in', stagger: .04 }, X.tOut - .05);
    }
    if (sc.sub) { const L = q(`#${id}l`); tl.set(L, { autoAlpha: 0 }, 0).set(L, { autoAlpha: 1, y: 40 }, T.sub).to(L, { y: 0, duration: .5, ease: 'lr.out' }, T.sub);
      tl.to(L, { autoAlpha: 0, y: -30, duration: .26, ease: 'lr.in' }, X.tOut); }
    // exit: the bits get pulled back in, the badge drops away
    bits.forEach(b => { tl.to(b, { x: cx - +b.dataset.x, y: cy - +b.dataset.y, duration: .32, ease: 'lr.in' }, X.tOut); tl.to(b.querySelector('.sbi'), { scale: 0, duration: .32, ease: 'lr.in' }, X.tOut); });
    tl.to(D, { autoAlpha: 0, scale: .5, duration: .3, ease: 'lr.in' }, X.tOut + .05);
  },
};
