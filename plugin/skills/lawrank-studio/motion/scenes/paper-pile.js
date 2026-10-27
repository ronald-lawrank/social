/* paper-pile: documents and bills drop in one by one as they are said and land in a messy cascade, each labelled; an
   optional stamp ("DON'T SIGN YET") slams across the top sheet and the whole pile takes the hit. */
SCENES['paper-pile'] = {
  label: 'Paperwork piles up', about: 'Documents and bills drop in one at a time as they are said and stack into a messy pile; a stamp can slam across it.',
  good: 'paperwork after an accident, bills piling up, "don\'t sign anything yet", overwhelm before help', practice: 'any',
  fields: { head: 'optional headline above the pile (**word** = accent)', items: '3-5 short labels (1-3 words, e.g. "Medical bills"), each said in the line, in order',
    stamp: 'optional 1-3 word stamp slammed across the pile at the end (e.g. "DON\'T SIGN YET"), said in the line' },
  example: { say: 'The paperwork piles up fast. Medical bills, insurance letters, forms to sign, lost wages. Don\'t sign anything yet.',
    head: 'It piles **up.**', items: ['Medical bills', 'Insurance letters', 'Forms to sign', 'Lost wages'], stamp: "Don't sign yet" },
  sfx(sc, X) {
    const p = SCENES['paper-pile'].plan(sc, X);
    return [...p.t.map(t => ({ kind: 'thud', at: t })), ...(sc.stamp ? [{ kind: 'impact', at: p.ts + .2 }] : [])];
  },
  plan(sc, X) {
    const its = sc.items.slice(0, 5), ts = X.times([...its, ...(sc.stamp ? [sc.stamp] : [])]), t = [];
    let prev = X.tIn - .05;
    its.forEach((_, i) => { const x = Math.max(ts[i], prev + .32); t.push(x); prev = x; });
    return { t, ts: sc.stamp ? Math.min(Math.max(ts[its.length], prev + .55), X.tOut - .6) : null };
  },
  ico(label) {
    const l = String(label).toLowerCase();
    if (/bill|invoice|statement|cost|\$|debt|payment/.test(l)) return 'dollar';
    if (/medic|doctor|hospital|clinic|treat|er\b|x-ray|scan/.test(l)) return 'hospital';
    if (/insur|policy|claim|adjust/.test(l)) return 'shield';
    if (/wage|pay|work|job|income|salary/.test(l)) return 'briefcase';
    if (/call|phone/.test(l)) return 'phone';
    if (/court|legal|lawsuit|summons/.test(l)) return 'gavel';
    return 'doc';
  },
  geo(sc) {   // where each sheet lands: a cascade, alternating sides and tilts, sized to fit
    const n = Math.min(5, sc.items.length), r0 = sc.head ? 590 : 440, H = 500, step = Math.min(150, Math.max(116, (1600 - r0 - H) / Math.max(1, n - 1)));
    const span = (n - 1) * step + H, base = Math.round(r0 + Math.max(0, (1600 - r0 - span) / 2));
    const jx = [-46, 38, -24, 52, -36], jr = [-3.2, 2.6, -1.8, 3.4, -2.6];
    return { H, W: 700, items: sc.items.slice(0, n).map((_, i) => ({ x: 190 + jx[i], y: base + i * step, rot: jr[i] })) };
  },
  html(sc, X) {
    const LK = X.LK, n = LK.name, id = X.id, G = SCENES['paper-pile'].geo(sc), up = LK.headCase === 'upper', ink = LK.surfaceInk;
    const bar = mix(ink, LK.surface, .86), bar2 = mix(ink, LK.surface, .74);
    const sheets = G.items.map((g, i) => {
      const lab = sc.items[i], ic = SCENES['paper-pile'].ico(lab), tint = n === 'flat' && i % 2 ? mix(LK.fillC, '#FFFFFF', .55) : LK.surface;
      const band = n === 'silhouette' || (n === 'flat' && i % 2 === 0), bandC = n === 'silhouette' ? LK.ink : LK.fillB;
      const labC = band ? (contrast('#FFFFFF', bandC) >= 4.5 ? '#FFFFFF' : BT.ink) : ink;
      const tileC = band ? 'transparent' : n === 'cards' ? mix(BT.accent, '#FFFFFF', .86) : n === 'thread' ? 'transparent' : mix(LK.fillB, '#FFFFFF', .8);
      const icC = band ? labC : n === 'thread' ? ink : readable(n === 'cards' ? BT.accent : LK.fillB, tileC === 'transparent' ? LK.surface : tileC, 3);
      const rows = [.92, .78, .86, .55, .8, .66].map((w, j) => `<div style="height:16px;width:${(w * (ic === 'dollar' ? 70 : 100)).toFixed(0)}%;margin-top:${j ? 22 : 0}px;border-radius:8px;background:${bar}"></div>`).join('');
      const amounts = ic === 'dollar' ? `<div style="position:absolute;right:48px;top:158px;width:90px">${[0, 1, 2, 3, 4, 5].map(j => `<div style="height:16px;margin-top:${j ? 22 : 0}px;border-radius:8px;background:${bar2}"></div>`).join('')}</div>
          <div style="position:absolute;right:48px;bottom:40px;width:250px;height:64px;border-radius:${LK.radius ? 12 : 0}px;border:4px solid ${n === 'silhouette' ? LK.ink : bar2}"></div>` : '';
      const seal = ic !== 'dollar' ? `<svg width="190" height="60" viewBox="0 0 190 60" style="position:absolute;left:48px;bottom:44px"><path d="M4,40 C18,6 32,4 34,30 S46,56 60,28 S82,4 90,32 S112,48 128,20 S152,12 160,36 C166,46 176,40 186,32" fill="none" stroke="${bar2}" stroke-width="5" stroke-linecap="round"/></svg>` : '';
      return `<div class="ppd k-abs" style="left:${g.x}px;top:${g.y}px;width:${G.W}px;height:${G.H}px;background:${tint};border-radius:${LK.radius ? Math.min(LK.radius, 22) : 0}px;
          box-shadow:${LK.shadow};border:${LK.edge};overflow:hidden;transform:rotate(${g.rot}deg)">
          <div style="position:absolute;left:0;right:0;top:0;height:120px;${band ? `background:${bandC};` : `border-bottom:3px solid ${bar};`}display:flex;align-items:center;gap:22px;padding:0 40px">
            <div style="width:68px;height:68px;flex:none;border-radius:${LK.radius ? 18 : 0}px;background:${tileC};display:flex;align-items:center;justify-content:center">${UI.icon(LK, ic, 50, icC, n === 'thread' ? BT.accent : icC)}</div>
            <div class="ppl" data-qa="text" style="width:fit-content;font:${LK.headWeight} ${String(lab).length > 18 ? 40 : 46}px/1.05 var(--head);color:${labC};white-space:nowrap;${up ? 'text-transform:uppercase;letter-spacing:.02em;' : ''}">${esc(lab)}</div></div>
          <div style="position:absolute;left:48px;right:48px;top:158px">${rows}</div>${amounts}${seal}</div>`;
    }).join('');
    const last = G.items[G.items.length - 1], sl = String(sc.stamp || '').length, stC = n === 'silhouette' ? (contrast('#FFFFFF', LK.accent) >= 3 ? '#FFFFFF' : LK.ink) : readable(BT.accent, LK.surface, 3.2);
    const stamp = sc.stamp ? `<div id="${id}sw" class="k-abs" style="left:0;width:1080px;top:${last.y + 300 - 70}px;height:140px;display:flex;justify-content:center;align-items:center">
        <div id="${id}st" data-qa="text" style="padding:14px 34px 10px;font:800 ${sl > 13 ? 64 : 76}px/1.02 var(--head);letter-spacing:.05em;text-transform:uppercase;white-space:nowrap;color:${stC};
          ${n === 'silhouette' ? `background:${LK.accent};box-shadow:12px 14px 0 rgba(0,0,0,.2);` : `background:${mix(LK.surface, '#FFFFFF', 0)}e6;border:7px solid ${stC};border-radius:${LK.radius ? 14 : 0}px;box-shadow:inset 0 0 0 6px ${LK.surface},inset 0 0 0 11px ${stC};`}">${esc(sc.stamp)}</div></div>` : '';
    // the desk the pile lands on: a line-art tray (thread), a chunky slab (flat), a frosted panel (cards), a black cut-out (silhouette)
    const m0 = G.items[0].y - 70, m1 = Math.min(1800, last.y + G.H + 70);
    const matSt = n === 'thread' ? `background:${LK.fillB};border-radius:40px` : n === 'flat' ? `background:${LK.fillB};border-radius:44px`
      : n === 'cards' ? 'background:rgba(255,255,255,.42);border:1px solid rgba(255,255,255,.7);border-radius:56px;box-shadow:0 30px 70px rgba(30,20,10,.10)' : `background:${LK.ink};box-shadow:16px 18px 0 rgba(0,0,0,.14)`;
    const mat = `<div id="${id}m" class="k-abs" style="left:100px;top:${m0}px;width:880px;height:${m1 - m0}px;${matSt}"></div>`;
    return `${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 330, w: 920, size: 88, align: 'center' }) : ''}
      <div id="${id}p" class="k-abs" style="left:0;top:0;width:1080px;height:1920px">${mat}${sheets}${stamp}</div>`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, q = s => X.$('#' + id + s), pile = q('p'), docs = [...pile.querySelectorAll('.ppd')], G = SCENES['paper-pile'].geo(sc), P = SCENES['paper-pile'].plan(sc, X);
    const st = pile.closest('.stage'), k = st.getBoundingClientRect().width / 1080;
    if (sc.head) X.head(`#${id}h`, X.tIn);
    tl.set(pile, { autoAlpha: 1, scale: 1 }, 0);
    // a slow push-in across the scene, the camera leaning into the mess
    tl.fromTo(pile, { scale: 1, transformOrigin: '540px 1000px' }, { scale: 1.03, duration: Math.max(.5, X.tOut - X.tIn), ease: 'sine.inOut', immediateRender: false }, X.tIn);
    const mat = q('m');
    tl.set(mat, { autoAlpha: 0 }, 0).set(mat, { autoAlpha: 1, scale: .86, rotation: -7, y: 60 }, X.tIn - .1).to(mat, { scale: 1, rotation: -2, y: 0, duration: .6, ease: 'lr.out' }, X.tIn - .1);
    docs.forEach((d, i) => {
      const t = P.t[i], g = G.items[i], side = i % 2 ? 1 : -1;
      tl.set(d, { autoAlpha: 0 }, 0)
        .set(d, { autoAlpha: 1, y: -280, x: side * 80, scale: 1.12, rotation: g.rot + side * 14 }, t - .42)
        .to(d, { y: 0, x: 0, scale: 1, duration: .42, ease: 'power2.in' }, t - .42).to(d, { rotation: g.rot, duration: .5, ease: 'power2.out' }, t - .42);
      // the label prints on as the sheet lands (hidden in flight, so it never crosses the labels already there)
      const lb = d.querySelector('.ppl');
      tl.set(lb, { autoAlpha: 0 }, 0).set(lb, { autoAlpha: 1, clipPath: 'inset(-20% 100% -20% 0%)' }, t + .08).to(lb, { clipPath: 'inset(-20% 0% -20% 0%)', duration: .32, ease: 'power2.out' }, t + .08);
      // the landing: a squash, and the sheets underneath take a nudge
      tl.to(d, { scaleY: .975, scaleX: 1.01, transformOrigin: '50% 100%', duration: .07, ease: 'power1.out' }, t).to(d, { scaleY: 1, scaleX: 1, duration: .35, ease: 'back.out(3)' }, t + .07);
      docs.slice(0, i).forEach((u, j) => tl.to(u, { rotation: G.items[j].rot + (i % 2 ? .5 : -.5) * (1 - j / (i + 1)), duration: .35, ease: 'lr.out' }, t));
      if (LK.thread && !sc.stamp && i === docs.length - 1) X.dot(g.x + G.W - 30, g.y + 60, t + .3, { r: 16 });
    });
    if (sc.stamp) {
      const S = q('st'), t = P.ts;
      tl.set(S, { autoAlpha: 0 }, 0).set(S, { autoAlpha: .28, scale: 1.7, rotation: -18 }, t).to(S, { scale: 1, rotation: -7, duration: .2, ease: 'power3.in' }, t).set(S, { autoAlpha: 1 }, t + .2);
      // the whole pile takes the hit, then settles
      tl.to(docs, { y: 10, duration: .07, ease: 'power1.out' }, t + .2).to(docs, { y: 0, duration: .5, ease: 'back.out(2.6)' }, t + .27);
      tl.to(S, { y: 6, duration: .07 }, t + .2).to(S, { y: 0, duration: .45, ease: 'back.out(2.6)' }, t + .27);
      if (LK.thread) { const a = S.getBoundingClientRect(), s = st.getBoundingClientRect(); X.dot((a.right - s.left) / k + 30, (a.top - s.top) / k - 6, t + .4, { r: 16 }); }
    }
    tl.to(pile, { autoAlpha: 0, y: -70, duration: .3, ease: 'lr.in' }, X.tOut);
  },
};
