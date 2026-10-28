/* pedestal: a soft beam of light falls on an empty pedestal; an object (a case file, a shield, the scales...) floats
   down the beam, settles onto it with a small squash and a ring of light, foliage grows up around the base, and the
   headline and one line set underneath, like a product reveal. thread: white line-art plinth and plants, the dot lands
   on the plinth's rim; flat: chunky brand-tone plants and a white plinth on the brand colour; cards: a white object
   card with a deep shadow on a soft plinth; silhouette: a black cut-out plinth, black fronds and a hard-edged beam. */
SCENES.pedestal = {
  label: 'Pedestal reveal', about: 'An object floats down a beam of light onto a small pedestal, plants grow in around the base, then the headline and one line appear.',
  good: 'your case file, your rights, what we protect, a reveal of one important thing, "handled with care"', practice: 'any',
  fields: { icon: 'the object: doc, shield, scale, briefcase, home, phone, gavel, heart, users, clock, check...', head: 'headline under the pedestal (2-7 words); **phrase** = accent',
    sub: 'optional one short line under the headline (3-9 words, said in the line)' },
  example: { say: 'Your case deserves real care. We review every detail, and we keep you in the loop.', icon: 'doc', head: 'Your case, **handled with care.**',
    sub: 'We review every detail.' },
  sfx: (sc, X) => { const T = SCENES.pedestal.tm(sc, X); return [{ kind: 'whoosh', at: X.tIn }, { kind: 'thud', at: T.land }, { kind: 'chime', at: T.land + .1 }, { kind: 'soft', at: T.head }]; },
  G: { cx: 540, PT: 990, rx: 190, ry: 36, col: 170, base: 1206 },
  tm(sc, X) {
    const th = X.times([sc.head])[0], land = Math.max(X.tIn + 1.3, Math.min(th - .25, X.tOut - 2.1));
    const head = Math.min(X.tOut - 1.2, Math.max(land + .35, th));
    const sub = sc.sub ? Math.min(X.tOut - .6, Math.max(head + .5, X.times([sc.head, sc.sub])[1])) : null;
    return { land, head, sub };
  },
  pal(LK) {
    const n = LK.name, t = (c, k) => mix(c, '#FFFFFF', k);
    if (n === 'thread') return { beam: t(BT.accent, .55), beamO: .5, top: '#FFFFFF', body: '#FFFFFF', side: LK.fillB, base: LK.fillB, edge: LK.ink, sw: 5, obj: '#FFFFFF', objEdge: LK.ink, ic: LK.ink, icA: BT.accent,
      leaf: ['#FFFFFF', t(BT.accent, .8), LK.fillB], ring: BT.accent, mote: BT.accent, shade: mix(BT.ink, LK.bg, .82) };
    if (n === 'flat') return { beam: '#FFFFFF', beamO: .32, top: mix(LK.bg, '#FFFFFF', .75), body: '#FFFFFF', side: mix(LK.bg, '#FFFFFF', .55), base: LK.fillB, edge: null, sw: 0, obj: '#FFFFFF', objEdge: null, ic: LK.fillB, icA: LK.bg,
      leaf: [LK.fillB, mix(LK.fillB, '#000000', .25), mix(LK.bg, '#FFFFFF', .45)], ring: '#FFFFFF', mote: '#FFFFFF', shade: mix(LK.bg, '#000000', .25) };
    if (n === 'cards') return { beam: '#FFFFFF', beamO: .75, top: '#FFFFFF', body: t(BT.ink, .95), side: t(BT.ink, .84), base: t(BT.accent, .7), edge: null, sw: 0, obj: '#FFFFFF', objEdge: null, ic: BT.ink, icA: BT.accent,
      leaf: [t(BT.accent, .35), mix(BT.accent, BT.ink, .35), t(BT.accent, .62)], ring: BT.accent, mote: '#FFFFFF', shade: 'rgba(30,20,10,.18)' };
    return { beam: LK.surface, beamO: 1, top: LK.fillB, body: LK.ink, side: mix(LK.ink, LK.bg, .2), base: LK.ink, edge: null, sw: 0, obj: LK.ink, objEdge: null, ic: LK.surface, icA: LK.accent,
      leaf: [LK.ink, mix(LK.ink, LK.bg, .25), LK.fillB], ring: LK.accent, mote: LK.ink, shade: 'rgba(0,0,0,.18)' };
  },
  leaves() {   // [base x, base y, angle, length, width, tone, delay order]
    const G = this.G, gy = G.base + 14, r = seeded(5), out = [];
    [[290, 1], [790, -1]].forEach(([bx, s], side) => {
      for (let k = 0; k < 11; k++) { const a = s * (-74 + k * 8 + (r() - .5) * 8), len = 170 + r() * 170 - Math.abs(a) * .9, w = 34 + r() * 22;
        out.push([bx + s * (k - 5) * 10 + (r() - .5) * 20, gy, a, Math.max(90, len), w, k % 3, side * .08 + k * .045]); }
    });
    [[392, 1], [688, -1]].forEach(([bx, s]) => { for (let k = 0; k < 4; k++) out.push([bx - s * k * 12, gy, s * (-12 - k * 16), 80 + k * 14, 24, (k + 1) % 3, .3 + k * .05]); });
    return out;
  },
  leafD(len, w) { return `M0,0 C${w},${-len * .3} ${w * .7},${-len * .8} 0,${-len} C${-w * .7},${-len * .8} ${-w},${-len * .3} 0,0Z`; },
  html(sc, X) {
    const LK = X.LK, n = LK.name, id = X.id, G = this.G, C = this.pal(LK), { cx, PT, rx, ry } = G;
    const st = C.edge ? ` stroke="${C.edge}" stroke-width="${C.sw}" stroke-linejoin="round"` : '';
    const sil = n === 'silhouette';
    const beam = `<path id="${id}bm" d="M${cx - 70},0 L${cx + 70},0 L${cx + rx + 20},${PT} L${cx - rx - 20},${PT}Z" fill="${sil ? C.beam : `url(#${id}bg)`}"/>`
      + (sil ? `<path id="${id}be" d="M${cx - 70},0 L${cx - rx - 20},${PT} M${cx + 70},0 L${cx + rx + 20},${PT}" stroke="${LK.ink}" stroke-width="3" fill="none"/>` : '');
    const r = seeded(13); let motes = '';
    for (let k = 0; k < 16; k++) { const y = 80 + r() * (PT - 160), half = 70 + (rx - 50) * y / PT; motes += `<circle cx="${(cx + (r() - .5) * 2 * half * .8).toFixed(0)}" cy="${y.toFixed(0)}" r="${(3 + r() * 4).toFixed(1)}"/>`; }
    const col = G.col, colB = PT + col;
    const ped = `<g id="${id}pd">
        <ellipse cx="${cx}" cy="${G.base + 16}" rx="${rx + 150}" ry="26" fill="${C.shade}"/>
        <path d="M${cx - rx - 46},${colB} H${cx + rx + 46} V${G.base} A${rx + 46},20 0 0 1 ${cx - rx - 46},${G.base} Z" fill="${C.base}"${st}/>
        <ellipse cx="${cx}" cy="${colB}" rx="${rx + 46}" ry="20" fill="${C.base}"${st}/>
        <path d="M${cx - rx + 14},${PT} V${colB} A${rx - 14},${ry - 6} 0 0 0 ${cx + rx - 14},${colB} V${PT}Z" fill="${C.body}"${st}/>
        ${C.edge ? '' : `<path d="M${cx + rx * .35},${PT + 10} V${colB + ry - 10} A${rx - 14},${ry - 6} 0 0 0 ${cx + rx - 14},${colB} V${PT}Z" fill="${C.side}"/>`}
        <ellipse cx="${cx}" cy="${PT}" rx="${rx}" ry="${ry}" fill="${C.top}"${st}/>
        <ellipse id="${id}sh" cx="${cx}" cy="${PT + 2}" rx="${rx * .7}" ry="${ry * .55}" fill="${C.shade}"/>
        <ellipse id="${id}rg" cx="${cx}" cy="${PT}" rx="${rx}" ry="${ry}" fill="none" stroke="${C.ring}" stroke-width="6"/></g>`;
    const leaves = this.leaves().map((l, i) => `<g transform="translate(${l[0].toFixed(0)},${l[1]}) rotate(${l[2].toFixed(1)})"><g id="${id}l${i}"><path d="${this.leafD(l[3], l[4])}" fill="${C.leaf[l[5]]}"${st}/>
        <path d="M0,-6 L0,${-l[3] * .82}" stroke="${C.edge || mix(C.leaf[l[5]], '#000000', .18)}" stroke-width="${C.edge ? 3 : 4}" fill="none" stroke-linecap="round" opacity="${C.edge ? 1 : .55}"/></g></g>`).join('');
    const S = 290, oy = PT - 10 - S;
    const obj = `<div id="${id}o" class="k-abs" style="left:${cx - S / 2}px;top:${oy}px;width:${S}px;height:${S}px;background:${C.obj};border-radius:${sil ? 0 : n === 'flat' ? 30 : 44}px;
        ${C.objEdge ? `border:${LK.stroke}px solid ${C.objEdge};` : ''}box-shadow:${n === 'cards' ? '0 40px 70px rgba(30,20,10,.28), 0 8px 18px rgba(30,20,10,.12)' : sil ? '12px 14px 0 rgba(0,0,0,.16)' : n === 'flat' ? `0 12px 0 ${mix(LK.bg, '#000000', .25)}` : '0 18px 40px rgba(20,24,28,.12)'};
        display:flex;align-items:center;justify-content:center">${icon(sc.icon || 'doc', 176, C.ic, C.icA)}</div>`;
    const hs = String(sc.head).replace(/\*/g, '').length > 28 ? 72 : 84;
    return `<svg class="svgL" viewBox="0 0 1080 1920"><defs><linearGradient id="${id}bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.beam}" stop-opacity="0"/><stop offset=".55" stop-color="${C.beam}" stop-opacity="${C.beamO}"/><stop offset="1" stop-color="${C.beam}" stop-opacity="${C.beamO * .7}"/></linearGradient></defs>
        <g id="${id}bw">${beam}</g><g id="${id}mt" fill="${C.mote}" opacity="${sil ? .5 : .8}">${motes}</g>${ped}<g id="${id}lv">${leaves}</g></svg>${obj}
      ${UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 1262, w: 920, size: hs, align: 'center' })}
      ${sc.sub ? UI.text(LK, { id: id + 's', text: sc.sub, x: 110, y: 1262 + hs * 2.2 + 16, w: 860, size: 40, weight: 600, align: 'center', color: LK.sub === LK.ink ? LK.ink : readable(LK.sub, LK.bg, 4.6) }) : ''}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, G = this.G, T = this.tm(sc, X), q = s => X.q(s), { cx, PT, rx } = G;
    const bw = q(`#${id}bw`), pd = q(`#${id}pd`), o = q(`#${id}o`), sh = q(`#${id}sh`), rg = q(`#${id}rg`), mt = q(`#${id}mt`);
    // the beam opens from above, the plinth rises into it
    tl.set(bw, { autoAlpha: 0 }, 0).set(bw, { autoAlpha: 1, scaleX: 0, svgOrigin: `${cx} 0` }, X.tIn - .25).to(bw, { scaleX: 1, duration: .6, ease: 'lr.out' }, X.tIn - .25);
    tl.set(pd, { autoAlpha: 0 }, 0).set(pd, { autoAlpha: 1, y: 160 }, X.tIn - .2).to(pd, { y: 0, duration: .55, ease: 'lr.out' }, X.tIn - .2);
    tl.set(mt, { autoAlpha: 0 }, 0).set(mt, { autoAlpha: 1 }, X.tIn);
    tl.fromTo(mt, { y: 60 }, { y: -140, duration: X.tOut - X.tIn + .4, ease: 'none', immediateRender: false }, X.tIn);
    // the object floats down the beam and settles
    const dd = T.land - X.tIn;
    tl.set(o, { autoAlpha: 0 }, 0).set(o, { autoAlpha: 1, y: -760, rotation: -6 }, X.tIn).to(o, { y: 0, duration: dd, ease: 'sine.inOut' }, X.tIn)
      .to(o, { keyframes: [{ rotation: 4, duration: dd * .45, ease: 'sine.inOut' }, { rotation: 0, duration: dd * .55, ease: 'sine.inOut' }] }, X.tIn);
    tl.to(o, { keyframes: [{ scaleY: .93, scaleX: 1.05, duration: .1, ease: 'power2.out' }, { scaleY: 1, scaleX: 1, duration: .45, ease: 'elastic.out(1,.45)' }], transformOrigin: '50% 100%' }, T.land);
    tl.to(o, { y: -10, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: Math.max(0, Math.floor((X.tOut - T.land - 1) / 1.4) - 1) }, T.land + .7);
    tl.set(sh, { autoAlpha: 0 }, 0).set(sh, { autoAlpha: 1, scale: .2, svgOrigin: `${cx} ${PT}` }, X.tIn).to(sh, { scale: 1, duration: dd, ease: 'power2.in' }, X.tIn);
    tl.set(rg, { autoAlpha: 0 }, 0).set(rg, { autoAlpha: 1, scale: 1, svgOrigin: `${cx} ${PT}` }, T.land).to(rg, { scale: 1.7, autoAlpha: 0, duration: .7, ease: 'power2.out' }, T.land);
    tl.to(bw, { autoAlpha: .55, duration: .8, ease: 'power1.inOut' }, T.land + .3);
    // the plants grow in around the base, then sway
    this.leaves().forEach((l, i) => { const el = q(`#${id}l${i}`), t = T.land - .15 + l[6];
      tl.set(el, { autoAlpha: 0 }, 0).set(el, { autoAlpha: 1, scale: 0, transformOrigin: '50% 100%' }, t).to(el, { scale: 1, duration: .55, ease: 'lr.out' }, t);
      tl.to(el, { rotation: i % 2 ? 4 : -4, duration: 1.3, ease: 'sine.inOut', yoyo: true, repeat: Math.max(0, Math.floor((X.tOut - t - .6) / 1.3) - 1) }, t + .55); });
    X.head(`#${id}h`, T.head);
    if (sc.sub) { const s = q(`#${id}s`); tl.set(s, { autoAlpha: 0 }, 0).set(s, { autoAlpha: 1, y: 24 }, T.sub).to(s, { y: 0, duration: .45, ease: 'lr.out' }, T.sub); tl.to(s, { autoAlpha: 0, duration: .25, ease: 'lr.in' }, X.tOut); }
    if (LK.thread) X.dot(cx + rx, PT, T.land + .25, { r: 16 });
    tl.to(o, { autoAlpha: 0, y: -30, duration: .3, ease: 'lr.in' }, X.tOut + .05);
    tl.to([q('svg.svgL')], { autoAlpha: 0, duration: .3, ease: 'lr.in' }, X.tOut + .05);
  },
};
