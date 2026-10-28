/* tile-collage: a collage of 4-9 colour tiles (an icon and a short word each) flips into a grid, one tile on the word
   that names it; then the camera pushes into one highlighted tile, which grows to fill the frame and carries the
   line's key message. thread: white and soft tiles with line icons, the accent tile swells into an accent field and
   the dot closes the message; flat: chunky brand tones with hard shadows, a white tile opens into a white field;
   cards: floating white UI tiles, the accent tile opens into a big accent card; silhouette: black, paper and grey
   cut-outs, an accent tile opens into a black field with paper type. */
SCENES['tile-collage'] = {
  label: 'Tile collage', about: 'A grid of colour tiles flips in, one per item as it is said; the camera pushes into one tile, which fills the frame with the key message.',
  good: 'everything we handle, all in one place, what we take care of, then the one thing that matters most', practice: 'any',
  fields: { head: 'optional headline above the grid (2-5 words; leaves with the push)',
    tiles: '[{label, icon}] 4-9 tiles, each label 1-2 short words said in the line, in order (icons: check arrow bookmark search chat doc scale gavel users home shield clock globe phone star heart map briefcase hospital)',
    focus: 'index (0-based) of the tile the camera pushes into (default: the last)', message: 'the key message the focus tile opens into (3-8 words, said in the line after the tiles; **phrase** = accent)' },
  example: { say: 'We handle the calls, the paperwork, the deadlines, the insurers, the court dates and the next steps. We walk you through every step.',
    head: 'We **handle** it', tiles: [{ label: 'Calls', icon: 'phone' }, { label: 'Paperwork', icon: 'doc' }, { label: 'Deadlines', icon: 'clock' },
      { label: 'Insurers', icon: 'shield' }, { label: 'Court dates', icon: 'gavel' }, { label: 'Next steps', icon: 'arrow' }],
    focus: 5, message: 'We walk you through **every step.**' },
  sfx: (sc, X) => { const T = SCENES['tile-collage'].tm(sc, X); return T.ts.map(t => ({ kind: 'pop', at: t })).concat([{ kind: 'whoosh', at: T.push }, { kind: 'soft', at: T.push + .6 }]); },
  rows: { 1: [[3]], 2: [[2, 1]], 3: [[2, 1], [3]], 4: [[1, 2], [2, 1]], 5: [[2, 1], [1, 1, 1]], 6: [[2, 1], [1, 1, 1], [3]], 7: [[2, 1], [1, 1, 1], [1, 2]], 8: [[2, 1], [1, 1, 1], [1, 1, 1]], 9: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] },
  plain: s => String(s || '').replace(/\*\*/g, ''),
  tm(sc, X) {
    const labs = sc.tiles.map(t => t.label || t), all = X.times(sc.message ? [...labs, this.plain(sc.message)] : labs), ts = all.slice(0, labs.length);
    const last = ts[ts.length - 1], said = sc.message ? all[labs.length] - .35 : last + .9;
    const push = Math.max(X.tIn + .8, Math.min(X.tOut - 1.5, Math.max(last + .55, said)));
    return { ts: ts.map(t => Math.min(t, push - .5)), push };
  },
  geo(sc) {
    const n = Math.max(1, Math.min(9, sc.tiles.length)), R = this.rows[n], gap = 20, top = sc.head ? 560 : 420, W = 940, cw = (W - 2 * gap) / 3;
    const ch = Math.min(R.length < 3 ? 380 : 300, (1520 - top - gap * (R.length - 1)) / R.length), y0 = top + Math.max(0, (1520 - top - R.length * ch - gap * (R.length - 1)) / 2);
    const out = []; R.forEach((row, r) => { let x = 70; row.forEach(sp => { const w = sp * cw + (sp - 1) * gap; out.push({ x, y: y0 + r * (ch + gap), w, h: ch, sp }); x += w + gap; }); });
    return out.slice(0, sc.tiles.length);
  },
  pal(LK) {
    const n = LK.name, ink = c => (contrast('#FFFFFF', c) >= contrast(BT.ink, c) ? '#FFFFFF' : BT.ink);
    const P = n === 'thread' ? { fills: ['#FFFFFF', LK.fillB, mix(BT.accent, '#FFFFFF', .88), '#FFFFFF', LK.fillB], edge: `${LK.stroke - 3}px solid ${LK.line}`, shadow: 'none', focus: BT.accent, slot: `3px dashed ${LK.soft}`, rad: 24 }
      : n === 'flat' ? { fills: [LK.fillB, LK.fillC, mix(LK.fillB, '#000000', .25), mix(LK.bg, '#FFFFFF', .7)], edge: 'none', shadow: `0 12px 0 ${mix(LK.bg, '#000000', .28)}`, focus: '#FFFFFF', slot: 'none', slotBg: mix(LK.bg, '#000000', .08), rad: 26 }
      : n === 'cards' ? { fills: ['#FFFFFF'], edge: 'none', shadow: LK.shadow, focus: BT.accent, slot: '2px solid rgba(255,255,255,.55)', slotBg: 'rgba(255,255,255,.25)', rad: 34 }
      : { fills: [LK.ink, LK.surface, LK.fillB, LK.ink, mix(LK.bg, LK.ink, .4)], edge: 'none', shadow: '12px 14px 0 rgba(0,0,0,.18)', focus: LK.accent, slot: `3px solid ${LK.soft}`, rad: 0 };
    P.ink = ink; P.panel = n === 'silhouette' ? LK.ink : P.focus; return P;
  },
  isz: g => g.h > 320 ? 136 : 116, ioff: n => n === 'cards' ? 42 : 30,
  html(sc, X) {
    const LK = X.LK, n = LK.name, id = X.id, G = this.geo(sc), P = this.pal(LK), fi = Math.min(G.length - 1, sc.focus ?? G.length - 1), up = LK.headCase === 'upper';
    const fillOf = i => i === fi ? P.focus : P.fills[(i * 2 + (i > 2 ? 1 : 0)) % P.fills.length];
    const tile = (t, g, i, extra = '') => { const f = fillOf(i), tc = P.ink(f), big = g.h > 320, isz = this.isz(g), lab = t.label || t;
      const accIc = n === 'thread' || n === 'cards' ? (i === fi ? tc : BT.accent) : tc;
      const chip = n === 'cards' ? `<div style="position:absolute;left:24px;top:24px;width:${isz + 36}px;height:${isz + 36}px;border-radius:28px;background:${i === fi ? 'rgba(255,255,255,.18)' : mix(BT.accent, '#FFFFFF', .88)}"></div>` : '';
      return `<div class="tcF" style="position:absolute;inset:0;background:${f};border-radius:${P.rad}px;${i === fi || n !== 'thread' ? '' : `border:${P.edge};`}box-shadow:${P.shadow};overflow:hidden;${extra}">
        ${chip}<div class="tcI" style="position:absolute;left:${this.ioff(n)}px;top:${this.ioff(n)}px">${icon(t.icon || 'check', isz, tc, accIc)}</div>
        <div class="tcL" data-qa="text" style="position:absolute;left:30px;right:24px;bottom:26px;font:${LK.headWeight} ${String(lab).length > 12 && g.sp < 2 ? 38 : 46}px/1.05 var(--head);color:${tc};${up ? 'text-transform:uppercase;letter-spacing:.02em;' : ''}">${esc(lab)}</div></div>`; };
    const slots = G.map(g => `<div class="tcS k-abs" style="left:${g.x}px;top:${g.y}px;width:${g.w}px;height:${g.h}px;border-radius:${P.rad}px;border:${P.slot};background:${P.slotBg || 'transparent'}"></div>`).join('');
    const tiles = sc.tiles.map((t, i) => `<div id="${id}t${i}" class="k-abs" style="left:${G[i].x}px;top:${G[i].y}px;width:${G[i].w}px;height:${G[i].h}px">${tile(t, G[i], i)}</div>`).join('');
    // the focus tile's own field: it grows from the tile to the frame and carries the message
    const pf = P.panel, ptc = P.ink(pf), ft = sc.tiles[fi] || {}, g = G[fi];
    const kc = n === 'silhouette' ? readable(BT.accent, pf, 3) === BT.accent ? BT.accent : mix(BT.accent, '#FFFFFF', .55) : ptc;
    const alt = ptc === '#FFFFFF' ? BT.ink : '#FFFFFF', macc = n === 'silhouette' ? kc : contrast(alt, pf) >= 3 ? alt : ptc;
    const msg = sc.message ? this.plain(sc.message).length : 0, msz = msg > 34 ? 84 : msg > 20 ? 96 : 110;
    const zone = n === 'cards' ? { x: 40, y: 300, w: 1000, h: 1300 } : { x: 0, y: 0, w: 1080, h: 1920 };
    const panel = `<div id="${id}z" class="k-abs" style="left:${g.x}px;top:${g.y}px;width:${g.w}px;height:${g.h}px;background:${pf};border-radius:${P.rad}px;box-shadow:${n === 'cards' ? LK.shadow : 'none'};overflow:hidden" data-zone="${zone.x},${zone.y},${zone.w},${zone.h}">
      ${n === 'silhouette' ? '<div class="lk-blinds" style="opacity:.5"></div>' : n === 'flat' ? `<div class="lk-dots" style="color:${mix(pf, BT.ink, .06)}"></div>` : ''}</div>
      <div id="${id}zi" class="k-abs" style="left:430px;width:220px;height:220px;top:${sc.message ? 560 : 760}px">${icon(ft.icon || 'check', 220, ptc, n === 'silhouette' ? kc : ptc)}</div>
      ${UI.text(LK, { id: id + 'zk', text: ft.label || '', x: 90, y: sc.message ? 840 : 1040, w: 900, size: 44, weight: 800, color: kc, align: 'center', upper: true, font: 'head' })}
      ${sc.message ? UI.head(LK, { id: id + 'zm', text: sc.message, x: 90, y: 930, w: 900, size: msz, align: 'center', color: ptc, accent: macc }) : ''}`;
    return `${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 340, w: 920, size: 92, align: 'center' }) : ''}
      <div id="${id}g" class="k-abs" style="left:0;top:0;width:1080px;height:1920px">${slots}${tiles}</div>${panel}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, n = LK.name, id = X.id, G = this.geo(sc), T = this.tm(sc, X), fi = Math.min(G.length - 1, sc.focus ?? G.length - 1), g = G[fi];
    const grid = `#${id}g`, slots = [...X.$(grid).querySelectorAll('.tcS')];
    if (sc.head) X.head(`#${id}h`, X.tIn, T.push);
    X.$(grid).querySelectorAll('.tcL').forEach(L => { let f = parseFloat(getComputedStyle(L).fontSize);   // a long word shrinks to its tile
      while ((L.scrollWidth > L.clientWidth + 1 || L.scrollHeight > 2.3 * f) && f > 30) { f -= 2; L.style.fontSize = f + 'px'; } });
    // the empty grid draws itself as the scene opens
    tl.set(slots, { autoAlpha: 0 }, 0).fromTo(slots, { autoAlpha: 0, scale: .9 }, { autoAlpha: 1, scale: 1, duration: .45, ease: 'lr.out', stagger: .04, immediateRender: false }, X.tIn - .2);
    // each tile flips in on its word, from a direction that alternates across the grid
    sc.tiles.forEach((t, i) => {
      const el = `#${id}t${i}`, node = X.$(el), lab = node.querySelector('.tcL'), ic = node.querySelector('.tcI'), a = Math.max(X.tIn, T.ts[i] - .12), k = i % 4;
      const from = [{ rotationY: -95 }, { rotationX: 95 }, { rotationY: 95 }, { rotationX: -95 }][k];
      tl.set(el, { autoAlpha: 0 }, 0).set(el, Object.assign({ autoAlpha: 1, transformPerspective: 1400, transformOrigin: ['0% 50%', '50% 0%', '100% 50%', '50% 100%'][k] }, from), a)
        .to(el, { rotationX: 0, rotationY: 0, duration: .55, ease: 'lr.out' }, a);
      tl.set(ic, { scale: .4, rotation: -20, transformOrigin: '0% 0%' }, 0).to(ic, { scale: 1, rotation: 0, duration: .45, ease: 'back.out(1.8)' }, a + .2);
      tl.set(lab, { autoAlpha: 0 }, 0).set(lab, { autoAlpha: 1, y: 26 }, a + .3).to(lab, { y: 0, duration: .4, ease: 'lr.out' }, a + .3);
      if (LK.thread) X.dot(G[i].x + G[i].w - 34, G[i].y + 34, a + .3, { r: 14 });
      if (i !== fi) tl.to(lab, { autoAlpha: 0, duration: .15, ease: 'power1.in' }, T.push);       // the push takes the words with it: text never stacks or leaves the frame
    });
    // after the last tile: the focus tile nudges up (the "this one"), then the camera pushes in and it fills the frame;
    // its icon travels with it to the middle of the new field
    const P = T.push, F = `#${id}t${fi}`, Z = `#${id}z`, [zx, zy, zw, zh] = X.$(Z).dataset.zone.split(',').map(Number), cx = g.x + g.w / 2, cy = g.y + g.h / 2;
    const fill = getComputedStyle(X.$(`${F} .tcF`)).backgroundColor, pfill = X.$(Z).style.background, rad = parseFloat(X.$(Z).style.borderRadius) || 0;
    tl.to(F, { scale: 1.05, duration: .3, ease: 'power2.out' }, P - .35);
    tl.to(grid, { scale: 1.3, duration: .8, ease: 'lr.move', transformOrigin: `${cx}px ${cy}px` }, P);
    tl.to(slots, { autoAlpha: 0, duration: .3, ease: 'power1.in' }, P);
    tl.set(Z, { autoAlpha: 0 }, 0).set(Z, { autoAlpha: 1 }, P).set(F, { autoAlpha: 0 }, P + .01);
    tl.fromTo(Z, { left: g.x - g.w * .025, top: g.y - g.h * .025, width: g.w * 1.05, height: g.h * 1.05, borderRadius: rad, backgroundColor: fill },
      { left: zx, top: zy, width: zw, height: zh, borderRadius: n === 'cards' ? 44 : 0, backgroundColor: pfill, duration: .8, ease: 'lr.move', immediateRender: false }, P);
    tl.set(grid, { autoAlpha: 0 }, P + .82);
    const ZI = `#${id}zi`, ZK = `#${id}zk`, m = P + .62, zi = X.$(ZI), off = this.ioff(n), is = this.isz(g);
    const ix = g.x - g.w * .025 + off * 1.05 - 430, iy = g.y - g.h * .025 + off * 1.05 - parseFloat(zi.style.top);
    tl.set(ZI, { autoAlpha: 0 }, 0).set(ZI, { autoAlpha: 1, x: ix, y: iy, scale: is * 1.05 / 220, transformOrigin: '0% 0%' }, P)
      .to(ZI, { x: 0, y: 0, scale: 1, duration: .8, ease: 'lr.move' }, P);
    tl.to(ZI, { scale: 1.1, x: -11, y: -11, duration: .2, ease: 'power2.out' }, P + .8).to(ZI, { scale: 1, x: 0, y: 0, duration: .4, ease: 'back.out(2)' }, P + 1);
    tl.set(ZK, { autoAlpha: 0 }, 0).set(ZK, { autoAlpha: 1, y: 24 }, m + .12).to(ZK, { y: 0, duration: .4, ease: 'lr.out' }, m + .12);
    if (sc.message) X.$(`#${id}zm`).style.textWrap = 'balance';
    let ml = null; if (sc.message) ml = X.head(`#${id}zm`, m + .25);
    // a slow push continues while the message holds
    tl.to(ZI, { y: -14, duration: Math.max(.5, X.tOut - P - 1.45), ease: 'sine.inOut' }, P + 1.4);
    if (LK.thread) {
      if (ml) { const M = X.$(`#${id}zm`), rel = MK.rel(M.closest('.stage')), b = rel(M); X.dot(Math.min(1000, b.x + b.w / 2), b.y + b.h + 70, m + .8, { r: 18 }); }
      else X.dot(540, 1300, m + .6, { r: 18 });
    }
    tl.to([ZI, ZK], { autoAlpha: 0, y: -40, duration: .28, ease: 'lr.in' }, X.tOut);
    tl.to(Z, { scale: n === 'cards' ? .96 : 1, duration: .35, ease: 'lr.in' }, X.tOut);
  },
};
