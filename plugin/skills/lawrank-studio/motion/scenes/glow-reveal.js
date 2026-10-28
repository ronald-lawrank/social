/* glow-reveal: a dark field with a glowing core and three elliptical orbit rings, sparks running round them. As the
   line builds, the rings tighten round the core; on the key word they snap in, the core flares, the rings burst
   outward and the word is left standing in the light. thread: a deep ink panel on the paper, the dot lands under the
   word like a full stop; flat: a big round dark portal on the brand colour; cards: a dark glass card floating on the
   gradient; silhouette: a black cut-out panel, hard-edged paper rings and a paper sunburst (no soft glow). */
SCENES['glow-reveal'] = {
  label: 'Glow reveal', about: 'A glowing core with orbit rings tightens on a dark field, then flares and reveals the key word in light.',
  good: 'a light in a hard time, hooks, one strong word (clarity, answers, help, hope), a turning point', practice: 'any',
  fields: { head: 'optional headline above (2-7 words); **phrase** = accent', word: 'the key word revealed in light (1-2 words, said in the line)',
    sub: 'optional short line under the word (2-7 words, said after it)' },
  example: { say: 'When everything feels dark, you deserve clarity. Clear answers from people who care.', head: 'When everything **feels dark,**', word: 'Clarity',
    sub: 'Clear answers from people who care' },
  sfx: (sc, X) => { const T = SCENES['glow-reveal'].tm(sc, X); return [{ kind: 'soft', at: X.tIn }, { kind: 'whoosh', at: T.flare - .35 }, { kind: 'impact', at: T.flare }, { kind: 'chime', at: T.flare + .15 }]; },
  C: { x: 540, y: 1010 },
  tm(sc, X) {
    const tw = X.times([sc.word])[0], flare = Math.min(X.tOut - 1.1, Math.max(X.tIn + 1.5, tw));
    const sub = sc.sub ? Math.min(X.tOut - .55, Math.max(flare + .55, X.times([sc.word, sc.sub])[1])) : null;
    return { flare, sub };
  },
  pal(LK) {
    const n = LK.name, deep = mix(BT.ink, '#000000', .35), glow = mix(BT.accent, '#FFFFFF', .25), hot = mix(BT.accent, '#FFFFFF', .7);
    if (n === 'silhouette') return { field: LK.ink, ring: LK.surface, glow: LK.accent, hot: LK.surface, word: LK.surface, sub: mix(LK.surface, LK.ink, .12), ray: mix(LK.ink, LK.surface, .16), soft: false };
    if (n === 'flat') { const f = mix(mix(BT.accent, BT.ink, .55), '#000000', .35); return { field: f, ring: mix(BT.accent, '#FFFFFF', .55), glow, hot, word: '#FFFFFF', sub: mix('#FFFFFF', f, .15), ray: mix(BT.accent, '#FFFFFF', .4), soft: true }; }
    return { field: n === 'cards' ? `linear-gradient(170deg, ${deep} 0%, ${mix(mix(BT.accent, BT.ink, .7), '#000000', .3)} 100%)` : deep, base: deep,
      ring: mix(BT.accent, '#FFFFFF', .55), glow, hot, word: '#FFFFFF', sub: mix('#FFFFFF', deep, .15), ray: mix(BT.accent, '#FFFFFF', .4), soft: true };
  },
  rings: [{ rx: 340, ry: 92, rot: -16 }, { rx: 300, ry: 76, rot: 28 }, { rx: 370, ry: 120, rot: 78 }],
  ory: sc => String(sc.word).replace(/\*/g, '').length > 12 ? 215 : 150,   // the orbit left round the word clears two lines
  ell: (rx, ry) => `M${-rx},0 A${rx},${ry} 0 1 0 ${rx},0 A${rx},${ry} 0 1 0 ${-rx},0`,
  html(sc, X) {
    const LK = X.LK, n = LK.name, id = X.id, C = this.C, Q = this.pal(LK), up = LK.headCase === 'upper';
    // the dark stage, in the look's own form
    const field = n === 'flat' ? `<div id="${id}f" class="k-abs" style="left:${C.x - 490}px;top:${C.y - 490}px;width:980px;height:980px;border-radius:50%;background:${Q.field};box-shadow:0 18px 0 ${mix(LK.bg, '#000000', .25)};overflow:hidden">
          <div class="lk-dots" style="color:${mix(Q.field, '#FFFFFF', .1)}"></div></div>`
      : `<div id="${id}f" class="k-abs" style="left:60px;top:600px;width:960px;height:880px;background:${Q.field};border-radius:${n === 'silhouette' ? 0 : LK.radius + 4}px;
          box-shadow:${n === 'silhouette' ? '16px 18px 0 rgba(0,0,0,.18)' : n === 'cards' ? '0 50px 100px rgba(20,12,6,.35), 0 10px 24px rgba(20,12,6,.18)' : '0 26px 60px rgba(10,12,16,.22)'};overflow:hidden">
          ${n === 'silhouette' ? '<div class="lk-blinds" style="opacity:.6"></div>' : ''}</div>`;
    const r = seeded(17); let stars = '';
    for (let k = 0; k < 46; k++) { const a = r() * Math.PI * 2, d = 160 + r() * 330; stars += `<circle cx="${(C.x + Math.cos(a) * d * 1.05).toFixed(0)}" cy="${(C.y + Math.sin(a) * d * .82).toFixed(0)}" r="${(1.5 + r() * 3).toFixed(1)}"/>`; }
    const blur = Q.soft ? `filter="url(#${id}bl)"` : '';
    const rings = this.rings.map((g, i) => `<g transform="translate(${C.x},${C.y}) rotate(${g.rot})"><g id="${id}r${i}">
        ${Q.soft ? `<path d="${this.ell(g.rx, g.ry)}" fill="none" stroke="${Q.glow}" stroke-width="16" opacity=".45" ${blur} class="${id}rg"/>` : ''}
        <path class="${id}rl" d="${this.ell(g.rx, g.ry)}" fill="none" stroke="${Q.ring}" stroke-width="${Q.soft ? 4 : 7}"/>
        <circle id="${id}k${i}" r="${Q.soft ? 9 : 11}" fill="${Q.hot}"/></g></g>`).join('');
    const rays = Array.from({ length: 14 }, (_, k) => { const a = k * Math.PI * 2 / 14, b = a + .07, R = 900;
      return `<path d="M0,0 L${(Math.cos(a - .07) * R).toFixed(0)},${(Math.sin(a - .07) * R).toFixed(0)} L${(Math.cos(b) * R).toFixed(0)},${(Math.sin(b) * R).toFixed(0)}Z"/>`; }).join('');
    const clip = n === 'flat' ? `<circle cx="${C.x}" cy="${C.y}" r="490"/>` : `<rect x="60" y="600" width="960" height="880" rx="${n === 'silhouette' ? 0 : LK.radius + 4}"/>`;
    const svg = `<svg class="svgL" viewBox="0 0 1080 1920"><defs>
        <filter id="${id}bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
        <radialGradient id="${id}hg"><stop offset="0" stop-color="${Q.glow}" stop-opacity=".75"/><stop offset=".4" stop-color="${Q.glow}" stop-opacity=".25"/><stop offset="1" stop-color="${Q.glow}" stop-opacity="0"/></radialGradient>
        <radialGradient id="${id}cg"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".35" stop-color="${Q.hot}"/><stop offset=".7" stop-color="${Q.glow}" stop-opacity=".7"/><stop offset="1" stop-color="${Q.glow}" stop-opacity="0"/></radialGradient>
        <radialGradient id="${id}rg" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="620"><stop offset="0" stop-color="${Q.ray}" stop-opacity=".5"/><stop offset="1" stop-color="${Q.ray}" stop-opacity="0"/></radialGradient>
        <clipPath id="${id}cp">${clip}</clipPath></defs>
      <g clip-path="url(#${id}cp)">
        <g id="${id}st" fill="${Q.ring}">${stars}</g>
        <g id="${id}ry" transform="translate(${C.x},${C.y})"><g fill="${Q.soft ? `url(#${id}rg)` : Q.ray}">${rays}</g></g>
        ${Q.soft ? `<circle id="${id}halo" cx="${C.x}" cy="${C.y}" r="440" fill="url(#${id}hg)"/>`
          : `<g id="${id}halo" fill="none" stroke="${Q.glow}" stroke-width="6">${[150, 210, 270].map(rr => `<circle cx="${C.x}" cy="${C.y}" r="${rr}"/>`).join('')}</g>`}
        ${rings}
        <g id="${id}core" transform="translate(${C.x},${C.y})">${Q.soft ? `<circle r="150" fill="url(#${id}cg)"/><circle r="42" fill="#FFFFFF"/>`
          : `<circle r="70" fill="${Q.glow}"/><circle r="40" fill="${Q.hot}"/>`}</g>
        <g transform="translate(${C.x},${C.y}) rotate(-8)"><g id="${id}ao"><path id="${id}ap" d="${this.ell(450, this.ory(sc))}" fill="none" stroke="${Q.ring}" stroke-width="${Q.soft ? 3 : 6}" opacity="${Q.soft ? .8 : 1}"/>
          <circle id="${id}ak" r="${Q.soft ? 10 : 12}" fill="${Q.hot}"/></g></g>
        <circle id="${id}fl" cx="${C.x}" cy="${C.y}" r="100" fill="${Q.soft ? `url(#${id}cg)` : Q.glow}"/>
      </g></svg>`;
    const w = String(sc.word).replace(/\*/g, ''), size = w.length <= 7 ? 168 : w.length <= 10 ? 132 : w.length <= 14 ? 104 : 84;
    const word = `<div id="${id}w" class="k-hl" data-qa="text" style="left:110px;width:860px;top:${C.y - size * .56}px;text-align:center;font-size:${size}px;line-height:1.05;font-weight:800;
        color:${Q.word};${up ? 'text-transform:uppercase;letter-spacing:.02em;' : 'letter-spacing:-.01em;'}${Q.soft ? `text-shadow:0 0 34px ${mix(BT.accent, '#FFFFFF', .3)}, 0 0 80px ${mix(BT.accent, '#FFFFFF', .2)}` : ''}">${esc(w)}</div>`;
    const sub = sc.sub ? UI.text(LK, { id: id + 's', text: sc.sub, x: 150, y: n === 'flat' ? C.y + 220 : C.y + 250, w: 780, size: 40, weight: 600, align: 'center', color: Q.sub }) : '';
    return `${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 330, w: 920, size: String(sc.head).replace(/\*/g, '').length > 26 ? 78 : 88, align: 'center' }) : ''}
      ${field}${svg}${word}${sub}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, C = this.C, T = this.tm(sc, X), q = s => X.q(s), F = T.flare;
    if (sc.head) X.head(`#${id}h`, X.tIn);
    const f = q(`#${id}f`), core = q(`#${id}core`), halo = q(`#${id}halo`), fl = q(`#${id}fl`), ry = q(`#${id}ry`), st = q(`#${id}st`), w = q(`#${id}w`);
    const rs = this.rings.map((g, i) => q(`#${id}r${i}`)), ks = this.rings.map((g, i) => q(`#${id}k${i}`));
    tl.set(f, { autoAlpha: 0 }, 0).set(f, { autoAlpha: 1, y: 120 }, X.tIn - .25).to(f, { y: 0, duration: .55, ease: 'lr.out' }, X.tIn - .25);
    // stars drift in, twinkle
    tl.set(st, { autoAlpha: 0 }, 0).to(st, { autoAlpha: 1, duration: .6, ease: 'power1.out' }, X.tIn);
    tl.fromTo(st, { rotation: 0, svgOrigin: `${C.x} ${C.y}` }, { rotation: 14, svgOrigin: `${C.x} ${C.y}`, duration: X.tOut - X.tIn, ease: 'none', immediateRender: false }, X.tIn);
    // the core lights up and breathes; the halo swells with it
    tl.set([core, halo], { autoAlpha: 0 }, 0).set(core, { autoAlpha: 1, scale: 0, transformOrigin: '50% 50%' }, X.tIn).to(core, { scale: 1, duration: .55, ease: 'back.out(1.8)' }, X.tIn);
    tl.set(halo, { autoAlpha: 1, scale: .4, transformOrigin: '50% 50%' }, X.tIn + .1).to(halo, { scale: 1, duration: .9, ease: 'lr.out' }, X.tIn + .1);
    const br = Math.max(1, Math.floor((F - .3 - (X.tIn + .6)) / .6));
    tl.to(core, { scale: 1.12, duration: .6, ease: 'sine.inOut', yoyo: true, repeat: br - 1 }, X.tIn + .6);
    // the rings draw on, orbit and tighten as the line builds
    rs.forEach((r, i) => {
      const t = X.tIn + .15 + i * .18, g = this.rings[i];
      tl.set(r, { autoAlpha: 0 }, 0).set(r, { autoAlpha: 1, scale: 1.25, transformOrigin: '50% 50%' }, t);
      tl.fromTo(q(`#${id}r${i} .${id}rl`), { drawSVG: '0%' }, { drawSVG: '100%', duration: .7, ease: 'power2.out', immediateRender: false }, t);
      tl.set(q(`#${id}r${i} .${id}rg`), { autoAlpha: 0 }, 0).to(q(`#${id}r${i} .${id}rg`), { autoAlpha: 1, duration: .5, ease: 'power1.out' }, t + .4);
      tl.to(r, { scale: .78, rotation: i % 2 ? 12 : -12, duration: F - .3 - t, ease: 'power1.in' }, t);
      tl.to(r, { scale: .32, duration: .3, ease: 'power3.in' }, F - .3);
      tl.to(r, { scale: 2.4, autoAlpha: 0, duration: .6, ease: 'power2.out' }, F);
      tl.set(ks[i], { autoAlpha: 0 }, 0).set(ks[i], { autoAlpha: 1 }, t + .3)
        .to(ks[i], { motionPath: { path: this.ell(g.rx, g.ry), start: i * .3, end: i * .3 + Math.max(1, Math.round((F - t) / 1.6)) }, duration: F - t, ease: 'power1.in' }, t + .01);
    });
    // the flare: the core swells, light floods out, rays turn, the word is left standing in the light
    tl.to(core, { scale: 1.7, duration: .3, ease: 'power3.in' }, F - .3).to(core, { scale: LK.name === 'silhouette' ? 0 : .6, duration: .5, ease: 'lr.out' }, F);
    tl.set(fl, { autoAlpha: 0 }, 0).set(fl, { autoAlpha: 1, scale: .2, transformOrigin: '50% 50%' }, F - .05).to(fl, { scale: 9, autoAlpha: 0, duration: .55, ease: 'power2.out' }, F - .05);
    tl.set(ry, { autoAlpha: 0 }, 0).set(ry, { autoAlpha: 1, scale: .3, rotation: -20, transformOrigin: '50% 50%' }, F)
      .to(ry, { scale: 1, rotation: 0, duration: .7, ease: 'lr.out' }, F).to(ry, { rotation: 18, duration: Math.max(.5, X.tOut - F - .7), ease: 'none' }, F + .7);
    if (LK.name === 'silhouette') tl.to(halo, { scale: 2.4, autoAlpha: 0, duration: .5, ease: 'lr.out' }, F); else tl.to(halo, { scale: 1.25, duration: .6, ease: 'lr.out' }, F);
    const ao = q(`#${id}ao`), ak = q(`#${id}ak`), rest = Math.max(.6, X.tOut - F - .3);
    tl.set(ao, { autoAlpha: 0 }, 0).set(ao, { autoAlpha: 1 }, F + .25).fromTo(q(`#${id}ap`), { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: .8, ease: 'lr.out', immediateRender: false }, F + .25);
    tl.to(ak, { motionPath: { path: this.ell(450, this.ory(sc)), start: .25, end: .25 + Math.max(.5, rest / 3.2) }, duration: rest, ease: 'none' }, F + .25);
    tl.set(w, { autoAlpha: 0 }, 0).set(w, { autoAlpha: 1, scale: .72 }, F + .02).to(w, { scale: 1, duration: .6, ease: 'lr.out' }, F + .02);
    tl.to(w, { scale: 1.04, duration: Math.max(.5, X.tOut - F - .6), ease: 'none' }, F + .62);
    if (sc.sub) { const s = q(`#${id}s`); tl.set(s, { autoAlpha: 0 }, 0).set(s, { autoAlpha: 1, y: 26 }, T.sub).to(s, { y: 0, duration: .45, ease: 'lr.out' }, T.sub); tl.to(s, { autoAlpha: 0, duration: .25, ease: 'lr.in' }, X.tOut); }
    if (LK.thread) {   // a full stop under the word, clear of its last line
      const wel = X.$(`#${id}w`), stg = wel.closest('.stage'), k = stg.getBoundingClientRect().width / 1080, b = (wel.getBoundingClientRect().bottom - stg.getBoundingClientRect().top) / k;
      X.dot(C.x, Math.min(C.y + 230, b + 50), F + .4, { r: 14 }); }
    tl.to(w, { autoAlpha: 0, scale: 1.1, duration: .28, ease: 'lr.in' }, X.tOut);
    tl.to([f, q('svg.svgL')], { autoAlpha: 0, duration: .3, ease: 'lr.in' }, X.tOut + .05);
  },
};
