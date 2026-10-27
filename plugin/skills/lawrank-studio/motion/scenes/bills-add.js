/* bills-add: a printer feeds out a long bill; each line prints as it is said (the paper unrolls down to it), then a
   double rule, and the total line gets a marker highlight and a hand-drawn underline. */
SCENES['bills-add'] = {
  label: 'Bills add up', about: 'A long bill prints out line by line as each cost is said, and the total at the bottom is underlined and highlighted.',
  good: 'medical bills, costs after an injury, "it adds up", what a claim should cover', practice: 'any',
  fields: { head: 'optional headline above the printer (**word** = accent)',
    items: '[{label, amount?}] 3-5 lines (label 1-3 words, said in the line, in order); amounts are optional (only approved or clearly sample figures)',
    total: 'optional total line (2-5 words, e.g. "It adds up fast"), said in the line; default "Total"' },
  example: { say: 'The bills add up fast. The ambulance, the ER visit, the scans, physical therapy, and time off work. It adds up.',
    head: 'It all **adds up.**', items: [{ label: 'Ambulance' }, { label: 'ER visit' }, { label: 'Scans' }, { label: 'Physical therapy' }, { label: 'Time off work' }], total: 'It adds up.' },
  plan(sc, X) {
    const its = sc.items.slice(0, 5), ts = X.times([...its.map(i => i.label), sc.total || 'total']), t = [];
    let prev = X.tIn + .35;
    its.forEach((_, i) => { const x = Math.max(ts[i] - .1, prev + .3); t.push(x); prev = x; });
    return { t, tT: Math.min(Math.max(ts[its.length], prev + .55), X.tOut - 1.1) };
  },
  sfx(sc, X) { const p = SCENES['bills-add'].plan(sc, X); return [{ kind: 'whoosh', at: X.tIn - .1 }, ...p.t.map(t => ({ kind: 'clink', at: t })), { kind: 'chime', at: p.tT + .3 }]; },
  geo(sc) {
    const n = Math.min(5, sc.items.length), hdr = 136, rowH = 96, totH = 160, H = hdr + n * rowH + 26 + totH, prH = 132;
    const r0 = sc.head ? 600 : 440, top = Math.round(r0 + Math.max(0, (1580 - r0 - prH - H + 30) / 2));
    return { n, hdr, rowH, totH, H, prH, top, r0, slot: top + prH - 34, W: 800, x: 140 };
  },
  html(sc, X) {
    const LK = X.LK, n = LK.name, id = X.id, g = SCENES['bills-add'].geo(sc), up = LK.headCase === 'upper';
    const paper = n === 'silhouette' ? LK.surface : '#FFFFFF', ink = n === 'silhouette' ? LK.ink : BT.ink, sub = readable(mix(ink, paper, .45), paper, 4.8), bar = mix(ink, paper, .85);
    const rows = sc.items.slice(0, g.n).map((it, i) => `<div class="bar k-abs" style="left:52px;right:52px;top:${g.hdr + i * g.rowH}px;height:${g.rowH}px;display:flex;align-items:center;gap:18px">
        <div class="bal" data-qa="text" style="flex:none;font:600 46px/1 var(--body);color:${ink};${up ? 'text-transform:uppercase;letter-spacing:.03em;font-size:42px;' : ''}">${esc(it.label)}</div>
        <div style="flex:1;height:0;border-bottom:4px dotted ${mix(ink, paper, .7)};margin-top:18px"></div>
        ${it.amount ? `<div data-qa="text" style="flex:none;font:600 46px/1 var(--body);color:${ink};font-variant-numeric:tabular-nums">${esc(it.amount)}</div>` : `<div style="flex:none;width:110px;height:20px;border-radius:10px;background:${bar}"></div>`}</div>`).join('');
    const mk = (() => { let m = mix(BT.accent, paper, .55); for (let i = 0; i < 12 && contrast(ink, m) < 5.2; i++) m = mix(m, paper, .15); return m; })();
    const tY = g.hdr + g.n * g.rowH + 26, ulC = n === 'silhouette' ? LK.accent : n === 'flat' ? LK.fillB : BT.accent;
    const total = `<div class="k-abs" style="left:52px;right:52px;top:${tY}px;height:${g.totH}px">
        <div id="${id}r1" style="position:absolute;left:0;right:0;top:0;height:5px;background:${ink}"></div><div id="${id}r2" style="position:absolute;left:0;right:0;top:12px;height:5px;background:${ink}"></div>
        <div id="${id}tt" data-qa="text" style="position:absolute;left:0;right:0;top:42px;font:800 ${String(sc.total || '').length > 18 ? 52 : 62}px/1.15 var(--head);color:${ink};${up ? 'text-transform:uppercase;' : ''}">
          <span id="${id}ts" style="background-image:linear-gradient(${mk},${mk});background-repeat:no-repeat;background-position:0 86%;background-size:0% 70%;padding:0 10px;margin:0 -10px;border-radius:6px;-webkit-box-decoration-break:clone;box-decoration-break:clone">${esc(sc.total || 'Total')}</span></div>
        <svg id="${id}ul" width="696" height="40" viewBox="0 0 696 40" style="position:absolute;left:0;bottom:-4px;overflow:visible">
          <path d="M4,14 C170,6 380,4 690,10" fill="none" stroke="${ulC}" stroke-width="7" stroke-linecap="round"/><path d="M30,30 C230,22 440,22 650,26" fill="none" stroke="${ulC}" stroke-width="6" stroke-linecap="round"/></svg></div>`;
    const header = `<div class="k-abs" style="left:52px;right:52px;top:34px;height:60px;display:flex;align-items:center;gap:20px">
        ${UI.icon(LK, 'dollar', 52, ink, n === 'silhouette' ? LK.accent : n === 'flat' ? LK.fillB : BT.accent)}
        <div style="flex:1"><div style="height:16px;width:62%;border-radius:8px;background:${mix(ink, paper, .7)}"></div><div style="height:12px;width:40%;margin-top:12px;border-radius:6px;background:${bar}"></div></div>
        <div style="width:96px;height:16px;border-radius:8px;background:${bar}"></div></div>
      <div class="k-abs" style="left:52px;right:52px;top:${g.hdr - 18}px;height:0;border-bottom:4px dashed ${mix(ink, paper, .75)}"></div>`;
    const zig = (() => { let d = 'M0,0 '; const k = 20; for (let x = 0; x <= g.W; x += k) d += `L${x + k / 2},16 L${Math.min(g.W, x + k)},0 `; return d + `L${g.W},-2 L0,-2Z`; })();
    const shadow = n === 'silhouette' ? 'drop-shadow(12px 14px 0 rgba(0,0,0,.16))' : n === 'flat' ? `drop-shadow(0 12px 0 ${mix(LK.bg, '#000000', .25)})` : n === 'cards' ? 'drop-shadow(0 30px 40px rgba(30,20,10,.20))' : 'drop-shadow(0 16px 24px rgba(20,24,28,.12))';
    // the printer: a slab with a slot and a status light, drawn in the look
    const prC = n === 'flat' ? LK.fillB : n === 'silhouette' ? LK.ink : '#FFFFFF', slotC = n === 'flat' ? mix(LK.fillB, '#000000', .45) : n === 'silhouette' ? mix(LK.ink, '#FFFFFF', .22) : mix(BT.ink, '#FFFFFF', .2);
    const printer = `<div id="${id}pr" class="k-abs" style="left:90px;top:${g.top}px;width:900px;height:${g.prH}px;border-radius:${n === 'silhouette' ? 0 : 36}px;background:${prC};
        ${n === 'thread' ? `border:4px solid ${LK.line};` : ''}box-shadow:${n === 'cards' ? LK.shadow : n === 'flat' ? '0 14px 0 ' + mix(LK.bg, '#000000', .25) : n === 'silhouette' ? LK.shadow : '0 18px 40px rgba(20,24,28,.10)'};z-index:2">
        <div style="position:absolute;left:60px;right:60px;bottom:26px;height:14px;border-radius:7px;background:${slotC}"></div>
        <div id="${id}led" style="position:absolute;right:56px;top:30px;width:22px;height:22px;border-radius:50%;background:${n === 'silhouette' ? LK.accent : n === 'flat' ? '#FFFFFF' : BT.accent}"></div>
        <div style="position:absolute;left:56px;top:34px;width:150px;height:14px;border-radius:7px;background:${n === 'flat' ? mix(LK.fillB, '#FFFFFF', .25) : n === 'silhouette' ? mix(LK.ink, '#FFFFFF', .25) : mix(BT.ink, '#FFFFFF', .85)}"></div></div>`;
    return `${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 330, w: 920, size: 88, align: 'center' }) : ''}
      <div id="${id}g" class="k-abs" style="left:0;top:0;width:1080px;height:1920px">
      <div id="${id}w" class="k-abs" style="left:${g.x}px;top:${g.slot}px;width:${g.W}px;height:${g.H + 20}px;filter:${shadow};z-index:1">
        <div id="${id}rc" class="k-abs" style="left:0;top:0;width:${g.W}px;height:${g.H}px;background:${paper}">${header}${rows}${total}</div>
        <svg id="${id}zg" class="k-abs" width="${g.W}" height="18" viewBox="0 -2 ${g.W} 18" style="left:0;top:0"><path d="${zig}" fill="${paper}"/></svg></div>
      ${printer}</div>`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, q = s => X.$('#' + id + s), g = SCENES['bills-add'].geo(sc), P = SCENES['bills-add'].plan(sc, X);
    const pr = q('pr'), w = q('w'), rc = q('rc'), zg = q('zg'), rows = [...rc.querySelectorAll('.bar')];
    if (sc.head) X.head(`#${id}h`, X.tIn);
    tl.set(pr, { autoAlpha: 0 }, 0).set(pr, { autoAlpha: 1, y: -120, scale: .96 }, X.tIn - .15).to(pr, { y: 0, scale: 1, duration: .5, ease: 'lr.out' }, X.tIn - .15);
    // the paper unrolls down to each line as it prints: a clip on the bill, the torn edge riding the bottom
    const G = q('g'), avail = 1580 - g.r0, cam = h => Math.max(0, g.r0 + Math.max(0, (avail - g.prH - h) / 2) - g.top);
    tl.set(G, { y: cam(0) }, 0);
    const reveal = (h, t, d = .35) => { tl.to(rc, { clipPath: `inset(0px 0px ${g.H - h}px 0px)`, duration: d, ease: 'lr.out' }, t).to(zg, { y: h, duration: d, ease: 'lr.out' }, t)
      .to(G, { y: cam(h), duration: d + .15, ease: 'lr.move' }, t); };
    tl.set(w, { autoAlpha: 0 }, 0).set(w, { autoAlpha: 1 }, X.tIn + .2).set(rc, { clipPath: `inset(0px 0px ${g.H}px 0px)` }, 0).set(zg, { y: 0 }, 0);
    reveal(g.hdr, X.tIn + .25, .5);
    const buzz = t => tl.to(pr, { y: 3, duration: .05, ease: 'none' }, t).to(pr, { y: 0, duration: .12, ease: 'power1.out' }, t + .05);
    rows.forEach((r, i) => {
      const t = P.t[i]; reveal(g.hdr + (i + 1) * g.rowH, t); buzz(t);
      tl.set(r, { autoAlpha: 0 }, 0).set(r, { autoAlpha: 1, x: -14 }, t + .05).to(r, { x: 0, duration: .35, ease: 'lr.out' }, t + .05);
    });
    // the total: the double rule, the line, the marker, the underline
    const tT = P.tT, tt = q('tt'), ts = q('ts'), ul = [...q('ul').querySelectorAll('path')];
    reveal(g.H, tT, .5); buzz(tT);
    tl.set([q('r1'), q('r2')], { scaleX: 0, transformOrigin: '0% 50%' }, 0).to([q('r1'), q('r2')], { scaleX: 1, duration: .35, ease: 'lr.out', stagger: .07 }, tT);
    tl.set(tt, { autoAlpha: 0 }, 0).set(tt, { autoAlpha: 1, y: 16 }, tT + .12).to(tt, { y: 0, duration: .4, ease: 'lr.out' }, tT + .12);
    tl.fromTo(ts, { backgroundSize: '0% 70%' }, { backgroundSize: '100% 70%', duration: .5, ease: 'power1.inOut', immediateRender: false }, tT + .45);
    tl.set(ul, { drawSVG: '0%' }, 0).to(ul[0], { drawSVG: '100%', duration: .45, ease: 'power2.inOut' }, tT + .8).to(ul[1], { drawSVG: '100%', duration: .4, ease: 'power2.inOut' }, tT + 1.05);
    tl.to(q('led'), { scale: 1.5, duration: .15, ease: 'power1.out' }, tT + .8).to(q('led'), { scale: 1, duration: .4, ease: 'back.out(3)' }, tT + .95);
    // the bill sways gently on its way out of the printer
    tl.fromTo(w, { rotation: 0 }, { rotation: .8, transformOrigin: '50% 0%', duration: Math.max(.5, X.tOut - X.tIn - .4), ease: 'sine.inOut', immediateRender: false }, X.tIn + .4);
    if (LK.thread) X.dot(g.x + 52 + 696 + 26, g.slot + g.H - 40, tT + 1.15, { r: 14 });
    tl.to([pr, w], { autoAlpha: 0, y: -70, duration: .3, ease: 'lr.in' }, X.tOut);
  },
};
