/* quote: huge quotation marks draw in, the quote reveals line by line as it is spoken, then the attribution lands.
   Thread: line-art marks drawn in the accent, the dot lands on the attribution rule; flat: chunky marks pop and tilt;
   cards: a white card with an accent badge and an initials avatar; silhouette: black cut-out marks with a hard shadow. */
SCENES.quote = {
  label: 'Quote', about: 'Huge quotation marks draw in, the quote reveals line by line as it is spoken, then the attribution appears.',
  good: "the firm's own words (an attorney's promise, the firm's values), or an approved client review", practice: 'any',
  fields: { quote: 'the words (6-24 words), said in the line; a client review only if it is approved for use', by: 'who said it (a name, or "Our attorneys")', role: 'optional second line (e.g. "Founding attorney", "Client review")' },
  example: { say: 'We treat every client like a neighbor, because here, you are one.', quote: 'We treat every client like a **neighbor**, because here, you are one.',
    by: 'Our attorneys', role: 'In their own words' },
  sfx: (sc, X) => { const r = SCENES.quote.quTimes(sc, X); return [{ kind: 'soft', at: X.tIn }, { kind: 'pop', at: r.by }]; },
  quTimes(sc, X) {
    const q0 = X.tIn + .35, w = X.line.words, last = w.length ? w[w.length - 1].t : X.tOut - 1;
    return { q0, q1: Math.max(q0 + .5, Math.min(X.tOut - 1.4, last - .6)), by: Math.min(X.tOut - 1.4, Math.max(q0 + 1, last - .1)) };
  },
  quMark: '<path d="M38 4 C18 10 4 26 4 48 C4 64 14 74 27 74 C39 74 47 66 47 55 C47 44 39 37 29 37 C26 37 24 37.5 22 38.5 C24 26 31 17 42 12 Z"/><path transform="translate(54 0)" d="M38 4 C18 10 4 26 4 48 C4 64 14 74 27 74 C39 74 47 66 47 55 C47 44 39 37 29 37 C26 37 24 37.5 22 38.5 C24 26 31 17 42 12 Z"/>',
  html(sc, X) {
    const LK = X.LK, nm = LK.name, up = LK.headCase === 'upper', n = String(sc.quote).replace(/\*\*/g, '').length;
    const qs = (n > 110 ? 54 : n > 70 ? 64 : 76) - (up ? 6 : 0), ink = nm === 'cards' ? LK.surfaceInk : LK.ink;
    const mk = (w, fill, stroke, sw) => `<svg id="${X.id}mk" width="${w}" height="${w * 78 / 105}" viewBox="-2 0 107 78" style="overflow:visible;display:block">
      <g fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round">${SCENES.quote.quMark}</g></svg>`;
    let marks;
    if (nm === 'thread') marks = mk(250, 'none', BT.accent, 2.2);
    else if (nm === 'flat') marks = `<div style="position:relative">${mk(270, LK.fillB, 'none', 0)}</div>`;
    else if (nm === 'cards') marks = `<div id="${X.id}bd" style="width:150px;height:150px;border-radius:44px;background:${BT.accent};display:flex;align-items:center;justify-content:center;box-shadow:0 18px 40px ${mix(BT.accent, '#FFFFFF', .4)}">${mk(84, contrast('#FFFFFF', BT.accent) >= 3 ? '#FFFFFF' : BT.ink, 'none', 0)}</div>`;
    else marks = `<div style="filter:drop-shadow(14px 16px 0 rgba(0,0,0,.16))">${mk(290, LK.ink, 'none', 0)}</div>`;
    const quote = `<div id="${X.id}q" data-qa="text" style="font:${nm === 'thread' ? 600 : LK.headWeight} ${qs}px/1.18 var(--head);color:${ink};${up ? 'text-transform:uppercase;' : ''}">${accentize(sc.quote, 'ka')}</div>`;
    const initials = String(sc.by).split(/\s+/).filter(w => /^[A-Z]/.test(w)).map(w => w[0]).slice(0, 2).join('') || String(sc.by)[0].toUpperCase();
    const ruleC = nm === 'silhouette' ? LK.accent : nm === 'flat' ? LK.fillA : BT.accent, subInk = nm === 'cards' ? mix(LK.surfaceInk, '#FFFFFF', .3) : LK.sub;
    const lead = nm === 'cards' ? `<div id="${X.id}av" style="width:96px;height:96px;border-radius:50%;background:${mix(BT.accent, '#FFFFFF', .85)};display:flex;align-items:center;justify-content:center;font:800 40px var(--head);color:${readable(BT.accent, mix(BT.accent, '#FFFFFF', .85), 4.5)};flex:none">${/^(our|the|a)\b/i.test(sc.by) ? UI.icon(LK, 'users', 54, BT.ink, BT.accent) : esc(initials)}</div>`
      : `<div id="${X.id}r" style="width:${nm === 'thread' ? 90 : 110}px;height:${nm === 'thread' ? 5 : 12}px;background:${ruleC};border-radius:${nm === 'silhouette' ? 0 : 6}px;flex:none"></div>`;
    const by = `<div id="${X.id}by" style="display:flex;align-items:center;gap:30px">${lead}<div>
        <div data-qa="text" style="font:800 44px/1.15 var(--head);color:${ink};${up ? 'text-transform:uppercase;letter-spacing:.06em;' : ''}">${esc(sc.by)}</div>
        ${sc.role ? `<div data-qa="text" style="font:600 36px/1.3 var(--body);color:${subInk};margin-top:4px;${up ? 'text-transform:uppercase;letter-spacing:.08em;font-size:32px;font-weight:700;' : ''}">${esc(sc.role)}</div>` : ''}</div></div>`;
    const wrap = nm === 'cards' ? `background:${LK.surface};border-radius:${LK.radius}px;box-shadow:${LK.shadow};border:${LK.edge};padding:0 64px 64px;` : '';
    const mWrap = nm === 'cards' ? `margin:-75px 0 46px;` : `margin:0 0 ${nm === 'thread' ? 40 : 30}px -6px;`;
    return `<style>#${X.id}q .ka{color:${nm === 'cards' ? readable(BT.accent, '#FFFFFF', 3) : nm === 'flat' ? LK.ink : LK.accentText}}${nm === 'flat' ? `#${X.id}q .ka{box-shadow:inset 0 -.22em 0 ${LK.fillB}}` : ''}</style><div id="${X.id}col" class="k-abs" style="left:${nm === 'cards' ? 70 : 90}px;top:520px;width:${nm === 'cards' ? 940 : 900}px;${wrap}">
      <div id="${X.id}mw" style="position:relative;${mWrap}">${marks}</div>${quote}<div style="height:${nm === 'cards' ? 56 : 70}px"></div>${by}</div>`;
  },
  build(tl, sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, { q0, q1, by } = SCENES.quote.quTimes(sc, X), COL = X.$(`#${id}col`), st = COL.closest('.stage'), rel = MK.rel(st);
    const ch = rel(COL).h; COL.style.top = Math.round(Math.max(nm === 'cards' ? 470 : 380, Math.min(1530 - ch, 980 - ch / 2))) + 'px';
    const MW = X.$(`#${id}mw`), paths = [...MW.querySelectorAll('path')];
    tl.set(COL, { autoAlpha: 0 }, 0).set(COL, { autoAlpha: 1 }, X.tIn - .15);
    if (nm === 'cards') tl.set(COL, { y: 140 }, X.tIn - .15).to(COL, { y: 0, duration: .6, ease: 'lr.out' }, X.tIn - .15);
    // the marks: drawn (thread), popped and tilted (flat, cards), or dropped like a cut-out (silhouette)
    if (nm === 'thread') { tl.set(paths, { drawSVG: '0%' }, 0).to(paths, { drawSVG: '100%', duration: .9, ease: 'power2.inOut', stagger: .18 }, X.tIn - .1); }
    else if (nm === 'silhouette') { tl.set(MW, { y: -60, rotation: -6, transformOrigin: '30% 80%' }, 0).to(MW, { y: 0, rotation: 0, duration: .45, ease: 'power4.out' }, X.tIn); }
    else { tl.set(paths, { scale: 0, rotation: -25, transformOrigin: '50% 50%' }, 0).to(paths, { scale: 1, rotation: 0, duration: .5, ease: 'back.out(2)', stagger: .1 }, X.tIn); if (nm === 'cards') tl.set(`#${id}bd`, { scale: .4, rotation: -12 }, 0).to(`#${id}bd`, { scale: 1, rotation: -6, duration: .5, ease: 'back.out(1.8)' }, X.tIn); }
    tl.to(MW, { y: '-=14', duration: Math.max(1, X.tOut - X.tIn - .8), ease: 'sine.inOut' }, X.tIn + .7);
    // the quote, line by line across the time it's spoken
    const Q = X.$(`#${id}q`), ls = MK.lines(Q), g = ls.length > 1 ? (q1 - q0) / (ls.length - 1) : 0;
    tl.set(ls, { yPercent: 105 }, 0).set(Q, { autoAlpha: 0 }, 0).set(Q, { autoAlpha: 1 }, q0 - .01);
    ls.forEach((l, i) => tl.to(l, { yPercent: 0, duration: .55, ease: 'lr.out' }, q0 + i * Math.min(g, .9)));
    // the attribution
    const B = X.$(`#${id}by`); tl.set(B, { autoAlpha: 0 }, 0).set(B, { autoAlpha: 1, x: -40 }, by).to(B, { x: 0, duration: .5, ease: 'lr.out' }, by);
    const R = X.$(`#${id}r`); if (R) tl.set(R, { scaleX: 0, transformOrigin: '0% 50%' }, 0).to(R, { scaleX: 1, duration: .5, ease: 'power3.out' }, by + .05);
    const AV = X.$(`#${id}av`); if (AV) tl.set(AV, { scale: 0 }, 0).to(AV, { scale: 1, duration: .4, ease: 'back.out(2)' }, by);
    if (LK.thread) { const rr = rel(R); X.dot(rr.x - 20, rr.y + rr.h / 2, by + .3, { r: 14 }); }
    tl.to(COL, { autoAlpha: 0, y: -70, duration: .3, ease: 'lr.in' }, X.tOut);
  },
};
