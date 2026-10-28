/* city-overhead: a calm top-down flat map of a neighbourhood (blocks with rooftops and their shadows, sidewalks, zebra
   crossings, round trees, a park, small cars gliding along their lanes) drifts slowly under the camera, while the
   line types itself into a caption card in a monospace face, word by word on the voice, a few words a line, with a
   block cursor. thread: white line-art map, the dot pins the card's corner; flat: brand-tone streets and white roofs;
   cards: soft neutral map under a floating white caption card; silhouette: black cut-out roofs and trees on paper. */
SCENES['city-overhead'] = {
  label: 'City overhead', about: 'A flat top-down street map drifts under the camera, cars gliding along their lanes, while the line types in word by word in a monospace caption.',
  good: 'your neighbourhood, your community, local roads, the streets you know, a calm reflective line', practice: 'any',
  fields: { caption: 'the words typed on screen (4-16 words, said in the line, in order)', kicker: 'optional small label above the caption (1-3 words)' },
  example: { say: 'We know your neighborhood, and the streets you walk and drive every day.', caption: 'We know your neighborhood, and the streets you walk every day.', kicker: 'Close to home' },
  sfx: (sc, X) => [{ kind: 'soft', at: X.tIn }].concat(SCENES['city-overhead'].tm(sc, X).ts.filter((t, i) => i % 2 === 0).map(t => ({ kind: 'clink', at: t }))),
  words: sc => String(sc.caption).replace(/\*\*/g, '').trim().split(/\s+/),
  tm(sc, X) {   // words said after the window closes would all land at once: keep them typing one by one
    const ts = X.times(this.words(sc));
    for (let i = ts.length - 2; i >= 0; i--) ts[i] = Math.max(X.tIn - .1, Math.min(ts[i], ts[i + 1] - .14));
    return { ts };
  },
  tree(x, y, r, C, st) {   // a crown of three overlapping circles with a lit side
    const c = (dx, dy, k) => `<circle cx="${(x + dx * r).toFixed(0)}" cy="${(y + dy * r).toFixed(0)}" r="${(r * k).toFixed(0)}"/>`;
    return `<g fill="${C.tree}"${st}>${c(-.32, .12, .78)}${c(.34, .18, .74)}${c(0, -.3, .78)}</g><circle cx="${(x - r * .22).toFixed(0)}" cy="${(y - r * .36).toFixed(0)}" r="${(r * .36).toFixed(0)}" fill="${C.treeHi}"/>`;
  },
  rows(ws, max) { const out = [[]]; let n = 0; ws.forEach(w => { if (n && n + 1 + w.length > max) { out.push([]); n = 0; } out[out.length - 1].push(w); n += (n ? 1 : 0) + w.length; }); return out; },
  pal(LK) {
    const n = LK.name, t = (c, k) => mix(c, '#FFFFFF', k);
    if (n === 'thread') return { ground: '#FFFFFF', road: LK.fillB, dash: '#FFFFFF', zebra: '#FFFFFF', walk: '#FFFFFF', roofA: '#FFFFFF', roofB: t(BT.accent, .86), roofC: '#FFFFFF', vent: LK.fillB,
      shadow: mix(BT.ink, LK.bg, .9), tree: t(BT.accent, .72), treeHi: t(BT.accent, .88), park: t(BT.accent, .94), car: '#FFFFFF', carAcc: BT.accent, glass: LK.fillC, edge: LK.line, sw: 3,
      box: '#FFFFFF', boxInk: LK.ink, boxEdge: `${LK.stroke - 1}px solid ${LK.ink}`, boxShadow: '0 22px 50px rgba(20,24,28,.14)', kick: readable(BT.accent, '#FFFFFF', 4.5), cur: BT.accent };
    if (n === 'flat') { const box = mix(LK.fillB, '#000000', .2); return { ground: mix(LK.bg, '#FFFFFF', .28), road: LK.fillB, dash: mix(LK.fillB, '#FFFFFF', .5), zebra: mix(LK.bg, '#FFFFFF', .7), walk: mix(LK.bg, '#FFFFFF', .28),
      roofA: '#FFFFFF', roofB: mix(LK.bg, '#FFFFFF', .62), roofC: LK.bg, vent: mix(LK.bg, '#FFFFFF', .4), shadow: mix(LK.bg, '#000000', .28), tree: mix(LK.fillB, LK.bg, .25), treeHi: mix(LK.bg, '#FFFFFF', .2),
      park: mix(LK.bg, '#FFFFFF', .45), car: '#FFFFFF', carAcc: LK.bg, glass: mix(LK.fillB, '#000000', .2), edge: null, sw: 0,
      box, boxInk: '#FFFFFF', boxEdge: 'none', boxShadow: `0 14px 0 ${mix(LK.bg, '#000000', .3)}`, kick: readable(mix(LK.bg, '#FFFFFF', .6), box, 4.5), cur: mix(LK.bg, '#FFFFFF', .3) }; }
    if (n === 'cards') return { ground: mix(LK.bg, '#FFFFFF', .3), road: mix(LK.bg, BT.ink, .16), dash: '#FFFFFF', zebra: '#FFFFFF', walk: mix(LK.bg, '#FFFFFF', .55), roofA: '#FFFFFF', roofB: t(BT.accent, .78), roofC: '#FFFFFF', vent: mix(LK.bg, BT.ink, .1),
      shadow: mix(LK.bg, BT.ink, .22), tree: t(BT.accent, .45), treeHi: t(BT.accent, .7), park: t(BT.accent, .85), car: '#FFFFFF', carAcc: BT.accent, glass: t(BT.ink, .6), edge: null, sw: 0,
      box: '#FFFFFF', boxInk: BT.ink, boxEdge: 'none', boxShadow: LK.shadow, kick: readable(BT.accent, '#FFFFFF', 4.5), cur: BT.accent };
    return { ground: LK.bg, road: LK.surface, dash: LK.ink, zebra: LK.ink, walk: LK.bg, roofA: LK.ink, roofB: mix(LK.ink, LK.bg, .3), roofC: LK.fillB, vent: mix(LK.ink, LK.bg, .45), shadow: 'rgba(0,0,0,.16)',
      tree: LK.ink, treeHi: mix(LK.ink, LK.bg, .25), park: LK.fillC, car: LK.ink, carAcc: LK.accent, glass: mix(LK.ink, LK.bg, .5), edge: null, sw: 0,
      box: LK.surface, boxInk: LK.ink, boxEdge: 'none', boxShadow: '14px 16px 0 rgba(0,0,0,.2)', kick: readable(LK.accent, LK.surface, 4.5), cur: LK.accent };
  },
  Z: 1.45,   // the map is drawn at 1.45x: big calm shapes, like a low drone
  M: { w: 1560, h: 2760, vx: [330, 800, 1270], hy: [430, 1060, 1690, 2320], sw: 128 },
  map(id, C) {
    const M = this.M, r = seeded(31), S = M.sw, R = (x, y, w, h, f, x2 = '') => `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${f}"${x2}/>`;
    const st = C.edge ? ` stroke="${C.edge}" stroke-width="${C.sw}"` : '';
    let g = R(0, 0, M.w, M.h, C.ground), roads = '', blocks = '', trees = '', zebra = '';
    // streets with a dashed centre line
    M.vx.forEach(x => { roads += R(x - S / 2, 0, S, M.h, C.road); roads += `<path d="M${x},0 V${M.h}" stroke="${C.dash}" stroke-width="5" stroke-dasharray="34 30"/>`; });
    M.hy.forEach(y => { roads += R(0, y - S / 2, M.w, S, C.road); roads += `<path d="M0,${y} H${M.w}" stroke="${C.dash}" stroke-width="5" stroke-dasharray="34 30"/>`; });
    // crossings: road surface over the centre lines, zebra stripes on each side
    M.vx.forEach(x => M.hy.forEach(y => {
      roads += R(x - S / 2, y - S / 2, S, S, C.road);
      for (let k = 0; k < 6; k++) { const o = -S / 2 + 10 + k * 20;
        zebra += R(x + o, y - S / 2 - 50, 11, 42, C.zebra) + R(x + o, y + S / 2 + 8, 11, 42, C.zebra) + R(x - S / 2 - 50, y + o, 42, 11, C.zebra) + R(x + S / 2 + 8, y + o, 42, 11, C.zebra); }
    }));
    // blocks: a sidewalk, then rooftops (with a flat cast shadow) or a park full of trees
    const xs = [-200, ...M.vx, M.w + 200], ys = [-200, ...M.hy, M.h + 200];
    for (let i = 0; i + 1 < xs.length; i++) for (let j = 0; j + 1 < ys.length; j++) {
      const x0 = xs[i] + S / 2, x1 = xs[i + 1] - S / 2, y0 = ys[j] + S / 2, y1 = ys[j + 1] - S / 2, pad = 34;
      blocks += R(x0, y0, x1 - x0, y1 - y0, C.walk, st);
      const park = (i * 3 + j * 5) % 7 === 3;
      if (park) {
        blocks += R(x0 + pad, y0 + pad, x1 - x0 - 2 * pad, y1 - y0 - 2 * pad, C.park, st);
        blocks += `<path d="M${x0 + pad},${y1 - pad} Q${(x0 + x1) / 2},${(y0 + y1) / 2} ${x1 - pad},${y0 + pad}" fill="none" stroke="${C.walk}" stroke-width="22"/>`;
        for (let k = 0; k < 9; k++) { const tx = x0 + pad + 50 + r() * (x1 - x0 - 2 * pad - 100), ty = y0 + pad + 50 + r() * (y1 - y0 - 2 * pad - 100), tr = 34 + r() * 22;
          trees += this.tree(tx, ty, tr * 1.1, C, st); }
        continue;
      }
      // split the lot into 2-3 strips, each a rooftop
      const vert = (x1 - x0) > (y1 - y0), n = 2 + Math.floor(r() * 2), L = vert ? x1 - x0 - 2 * pad : y1 - y0 - 2 * pad;
      let cut = 0; const cuts = []; for (let k = 0; k < n; k++) { const part = k === n - 1 ? L - cut : L * (.25 + r() * .3); cuts.push([cut, Math.min(part, L - cut)]); cut += part + 18; if (cut >= L - 60) break; }
      cuts.forEach(([a, len], k) => {
        if (len < 50) return;
        const bx = vert ? x0 + pad + a : x0 + pad, by = vert ? y0 + pad : y0 + pad + a, bw = vert ? len : x1 - x0 - 2 * pad, bh = vert ? y1 - y0 - 2 * pad : len;
        const roof = [C.roofA, C.roofB, C.roofC][(i + j + k) % 3];
        blocks += R(bx + 18, by + 18, bw, bh, C.shadow) + R(bx, by, bw, bh, roof, st) + R(bx + 16, by + 16, bw - 32, bh - 32, 'none', ` stroke="${C.vent}" stroke-width="4" opacity=".6"`);
        const vn = 1 + Math.floor(r() * 3); for (let v = 0; v < vn; v++) blocks += R(bx + 30 + r() * (bw - 90), by + 30 + r() * (bh - 90), 30, 30, C.vent);
      });
      // street trees along the sidewalk
      for (let tx = x0 + 70 + r() * 40; tx < x1 - 50; tx += 190 + r() * 60) { const tr = 26 + r() * 8, ty = (j % 2 ? y1 - 16 : y0 + 16); trees += this.tree(tx, ty, tr * 1.15, C, st); }
    }
    return g + roads + zebra + blocks + trees;
  },
  // cars: [lane x or y, from, to, horizontal?, accent?]
  cars: [[800 - 30, 2500, 300, 0, 1], [800 + 30, 500, 2100, 0, 0], [330 + 30, 200, 1500, 0, 0], [1270 - 30, 2200, 900, 0, 0], [1060 + 30, -100, 1200, 1, 0], [1690 - 30, 1500, 100, 1, 1], [1060 - 30, 1500, 700, 1, 0], [2320 + 30, 200, 1300, 1, 0], [800 + 30, 900, 1900, 0, 0], [1060 + 30, 300, 1300, 1, 0], [1690 + 30, 1200, 300, 1, 0], [330 - 30, 1800, 900, 0, 1]],
  car(C, acc, hz) {
    const body = acc ? C.carAcc : C.car, st = C.edge ? ` stroke="${C.edge}" stroke-width="3"` : '';
    const inner = `<rect x="-24" y="-46" width="48" height="92" rx="14" fill="${body}"${st}/><rect x="-18" y="-24" width="36" height="20" rx="5" fill="${C.glass}"/><rect x="-18" y="18" width="36" height="14" rx="4" fill="${C.glass}"/>`;
    return `<g transform="rotate(${hz ? 90 : 0})">${inner}</g>`;
  },
  html(sc, X) {
    const LK = X.LK, n = LK.name, id = X.id, C = this.pal(LK), M = this.M;
    const cars = this.cars.map((c, i) => `<g id="${id}c${i}" transform="translate(${c[3] ? c[1] : c[0]},${c[3] ? c[0] : c[1]})"><g transform="rotate(${(c[3] ? (c[2] > c[1] ? 0 : 180) : (c[2] > c[1] ? 180 : 0))})">${this.car(C, c[4], c[3])}</g></g>`).join('');
    const Z = this.Z, map = `<svg id="${id}m" class="k-abs" style="left:${Math.round(540 - M.w * Z / 2)}px;top:${Math.round(960 - M.h * Z / 2)}px" width="${M.w * Z}" height="${M.h * Z}" viewBox="0 0 ${M.w} ${M.h}">${this.map(id, C)}${cars}</svg>`;
    // the caption: laid out in full (hidden), then typed in place, so nothing reflows while it types
    const ws = this.words(sc), size = ws.join(' ').length > 64 ? 54 : 62, max = size > 58 ? 14 : 16, rows = this.rows(ws, max);
    const lh = size * 1.34, h = rows.length * lh + 96 + (sc.kicker ? 62 : 0), top = Math.round(980 - h / 2);
    const body = rows.map(r => r.map(word => `<span class="${id}wd" style="position:relative;white-space:nowrap">${[...word].map(ch => `<span class="${id}ch">${esc(ch)}</span>`).join('')}<span class="${id}cu" style="position:absolute;left:100%;top:.12em;width:.56em;height:1.05em;margin-left:.08em;background:${C.cur}"></span></span>`).join(' ')).join('<br>');
    const kick = sc.kicker ? `<div id="${id}k" data-qa="text" style="font:700 30px/1 var(--head);letter-spacing:.14em;text-transform:uppercase;color:${C.kick};margin-bottom:30px">${esc(sc.kicker)}</div>` : '';
    const box = `<div id="${id}b" class="k-abs" style="left:0;right:0;margin:0 auto;width:max-content;max-width:920px;top:${top}px;padding:48px 60px;background:${C.box};border:${C.boxEdge};border-radius:${n === 'silhouette' ? 0 : LK.radius}px;box-shadow:${C.boxShadow}">
        ${kick}<div id="${id}t" data-qa="text" style="font:600 ${size}px/${lh}px ui-monospace,'DejaVu Sans Mono','SFMono-Regular',Menlo,Consolas,monospace;color:${C.boxInk};letter-spacing:-.01em;white-space:nowrap">${body}</div></div>`;
    const fade = `<div class="k-abs" style="left:0;top:0;width:1080px;height:420px;background:linear-gradient(${LK.bg} 0%, ${LK.bg} 40%, ${LK.bg}00 100%)"></div>`;
    return `<div id="${id}mw" class="k-abs" style="inset:0;overflow:hidden">${map}</div>${fade}${box}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, q = s => X.q(s), T = this.tm(sc, X), m = q(`#${id}m`), mw = q(`#${id}mw`), b = q(`#${id}b`), t = q(`#${id}t`);
    // the slow overhead drift, across the whole scene
    const pan = Math.min(1, (X.t1 - X.t0) / 9);   // about 60px a second: a calm drift, never a whip
    tl.fromTo(m, { x: 260 * pan, y: 520 * pan, scale: 1.05, transformOrigin: '50% 50%' }, { x: -260 * pan, y: -520 * pan, scale: 1, duration: X.t1 - X.t0 + .4, ease: 'none', immediateRender: false }, X.t0);
    tl.set(mw, { autoAlpha: 0 }, 0).set(mw, { autoAlpha: 1 }, X.t0);
    if (X.i === 0) tl.set(m, { x: 260 * pan, y: 520 * pan, scale: 1.05, transformOrigin: '50% 50%' }, 0);
    this.cars.forEach((c, i) => { const el = q(`#${id}c${i}`), d = Math.abs(c[2] - c[1]), dur = X.t1 - X.t0 + .4;
      tl.fromTo(el, c[3] ? { x: c[1], y: c[0] } : { x: c[0], y: c[1] }, c[3] ? { x: c[1] + (c[2] - c[1]) * Math.min(1, dur * 130 / d), duration: dur, ease: 'none', immediateRender: false } : { y: c[1] + (c[2] - c[1]) * Math.min(1, dur * 130 / d), duration: dur, ease: 'none', immediateRender: false }, X.t0);
      if (X.i === 0) tl.set(el, c[3] ? { x: c[1], y: c[0] } : { x: c[0], y: c[1] }, 0); });
    // the caption card settles, then the line types itself in, word by word on the voice
    tl.set(b, { autoAlpha: 0 }, 0).set(b, { autoAlpha: 1, y: 60, scale: .96 }, X.tIn - .15).to(b, { y: 0, scale: 1, duration: .5, ease: 'lr.out' }, X.tIn - .15);
    if (sc.kicker) { const k = q(`#${id}k`); tl.set(k, { autoAlpha: 0 }, 0).set(k, { autoAlpha: 1, y: 14 }, X.tIn).to(k, { y: 0, duration: .4, ease: 'lr.out' }, X.tIn); }
    const wds = [...X.$(`#${id}t`).querySelectorAll(`.${id}wd`)];
    tl.set(t, { autoAlpha: 0 }, 0).set(t, { autoAlpha: 1 }, T.ts[0] - .02);
    wds.forEach((wd, i) => {
      const chs = [...wd.querySelectorAll(`.${id}ch`)], cu = wd.querySelector(`.${id}cu`), t0 = T.ts[i], step = Math.min(.045, .3 / chs.length);
      tl.set(chs, { autoAlpha: 0 }, 0); chs.forEach((ch, k) => tl.set(ch, { autoAlpha: 1 }, t0 + k * step));
      // the cursor rides at the end of the newest word; on the last word it blinks until the scene ends
      const next = i + 1 < wds.length ? T.ts[i + 1] : X.tOut;
      tl.set(cu, { autoAlpha: 0 }, 0).set(cu, { autoAlpha: 1 }, t0).set(cu, { autoAlpha: 0 }, next);
      if (i === wds.length - 1) for (let s = t0 + .5; s < X.tOut - .3; s += 1) tl.set(cu, { autoAlpha: 0 }, s).set(cu, { autoAlpha: 1 }, s + .5);
    });
    if (LK.thread) { const st = X.$(`#${id}b`).closest('.stage'), k = st.getBoundingClientRect().width / 1080, sr = st.getBoundingClientRect(), r = X.$(`#${id}b`).getBoundingClientRect();
      X.dot((r.right - sr.left) / k - 4, (r.top - sr.top) / k + 4, X.tIn + .3, { r: 18 }); }   // early: the dot must not hover over the caption while it types
    tl.to(b, { autoAlpha: 0, y: -24, duration: .28, ease: 'lr.in' }, X.tOut);
    tl.to(mw, { autoAlpha: 0, duration: .3, ease: 'lr.in' }, X.tOut + .05);
  },
};
