/* weight-lift: three labelled boxes thud onto a person one by one, and their knees buckle a little more each time. On the
   word, the firm's mark slides in under the stack and lifts it clear; the person stands up straight, arms down.
   thread: a soft line-art figure, the dot lands on the mark; flat: chunky deep-brand figure, white boxes; cards: white
   card boxes with deep shadows; silhouette: a black cut-out figure carrying black boxes. */
SCENES['weight-lift'] = {
  label: 'Weight lifted', about: "Three labelled boxes pile onto a person who bends under them; the firm's mark slides under the stack and lifts it off.",
  good: 'the burden after an accident, "we carry the weight", what we take off your plate', practice: 'any',
  fields: { head: 'optional headline', burdens: '3 short labels (1-3 words), each said in the line, in order', lift: 'what the firm does, the caption when the stack lifts (said in the line)' },
  example: { say: 'Medical bills. Insurance forms. Missed work. We take that weight off your shoulders.', head: 'Too much to **carry?**',
    burdens: ['Medical bills', 'Insurance forms', 'Missed work'], lift: 'We take that weight' },
  sfx: (sc, X) => { const T = SCENES['weight-lift'].tm(sc, X); return T.b.map(t => ({ kind: 'thud', at: t + .32 })).concat([{ kind: 'whoosh', at: T.l - .1 }, { kind: 'chime', at: T.l + .6 }]); },
  tm(sc, X) { const ts = X.times([...sc.burdens, sc.lift]); return { b: ts.slice(0, 3), l: Math.min(X.tOut - 1.1, Math.max(ts[3], ts[2] + .7)) }; },
  GR: 1440, HY: 1010,
  pose(b, up = true) {          // the figure's limbs as paths; b = how far the knees buckle (0..1)
    const P = (...p) => 'M' + p.map(q => q.map(v => v.toFixed(1)).join(',')).join(' L'), G = this.GR;
    const hip = [540, 1290 + 70 * b], sh = [540, 1150 + 84 * b], kL = [500 - 46 * b, 1368 + 16 * b], kR = [580 + 46 * b, 1368 + 16 * b];
    const arms = up ? [[[455 - 12 * b, 1078 + 78 * b], [470, this.HY + 76 * b]], [[625 + 12 * b, 1078 + 78 * b], [610, this.HY + 76 * b]]]
      : [[[478, 1226], [458, 1296]], [[602, 1226], [622, 1296]]];
    return { torso: P(sh, hip), legL: P(hip, kL, [478, G]), legR: P(hip, kR, [602, G]), armL: P(sh, ...arms[0]), armR: P(sh, ...arms[1]), head: 1088 + 90 * b, hands: this.HY + 76 * b };
  },
  pal(LK) {
    const n = LK.name;
    if (n === 'thread') return { body: LK.people, box: '#FFFFFF', boxInk: LK.ink, edge: LK.line, tape: mix(BT.accent, '#FFFFFF', .6), mark: BT.accent, onMark: '#FFFFFF', strain: BT.accent, ground: LK.soft };
    if (n === 'flat') return { body: LK.fillB, box: '#FFFFFF', boxInk: BT.ink, edge: null, tape: LK.fillC, mark: '#FFFFFF', onMark: readable(BT.accent, '#FFFFFF', 3), strain: '#FFFFFF', ground: mix(LK.bg, '#000000', .18) };
    if (n === 'cards') return { body: mix(BT.ink, '#FFFFFF', .25), box: '#FFFFFF', boxInk: BT.ink, edge: null, tape: mix(BT.accent, '#FFFFFF', .75), mark: BT.accent, onMark: contrast('#FFFFFF', BT.accent) >= 3 ? '#FFFFFF' : BT.ink, strain: BT.accent, ground: 'rgba(30,20,10,.12)' };
    return { body: LK.ink, box: LK.ink, boxInk: '#F8F6F1', edge: null, tape: LK.accent, mark: LK.accent, onMark: LK.surface, strain: LK.ink, ground: 'rgba(0,0,0,.14)' };
  },
  html(sc, X) {
    const LK = X.LK, n = LK.name, P = this.pal(LK), id = X.id, p = this.pose(0, false), G = this.GR;
    const limb = (k, w) => `<path id="${id}${k}" d="${p[k]}" fill="none" stroke="${P.body}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const fig = `<ellipse cx="540" cy="${G + 6}" rx="190" ry="20" fill="${P.ground}"/><g id="${id}fig">${limb('legL', 40)}${limb('legR', 40)}${limb('torso', 78)}${limb('armL', 36)}${limb('armR', 36)}
      <circle id="${id}hd" cx="540" cy="${p.head}" r="46" fill="${P.body}"/></g>
      <g id="${id}strain" stroke="${P.strain}" stroke-width="7" stroke-linecap="round">${[[-1, -40], [-1, 0], [1, -40], [1, 0]].map(([s, dy]) => `<path d="M${540 + s * 78},${1180 + dy} l${s * 34},${-10}"/>`).join('')}</g>`;
    const mark = `<g id="${id}mk"><path d="${markPath(720, 1036, 108)}" fill="${P.mark}" ${n === 'thread' ? `stroke="${mix(BT.accent, '#000000', .2)}" stroke-width="3"` : ''}/>
      <path d="M676,1038 L706,1068 L764,1004" fill="none" stroke="${P.onMark}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    const ws = [580, 530, 490], sh = n === 'cards' ? LK.shadow : n === 'flat' ? `0 10px 0 ${mix(LK.bg, '#000000', .25)}` : n === 'silhouette' ? '10px 12px 0 rgba(0,0,0,.18)' : '0 14px 30px rgba(20,24,28,.10)';
    const boxes = sc.burdens.map((b, k) => `<div id="${id}b${k}" class="k-abs" style="left:${540 - ws[k] / 2}px;top:${this.HY - (k + 1) * 128}px;width:${ws[k]}px;height:122px;
        background:${P.box};color:${P.boxInk};border-radius:${n === 'silhouette' ? 0 : n === 'cards' ? 22 : 14}px;box-shadow:${sh};${n === 'thread' ? `border:${LK.stroke - 2}px solid ${LK.line};` : ''}
        display:flex;align-items:center;justify-content:center;transform:rotate(${[-1.5, 2, -1][k]}deg);font:${LK.headWeight} ${b.length > 16 ? 42 : 48}px/1 var(--head);white-space:nowrap;${LK.headCase === 'upper' ? 'text-transform:uppercase;' : ''}">
        <span style="position:absolute;left:50%;top:0;width:96px;height:16px;margin-left:-48px;background:${P.tape}"></span><span data-qa="text">${esc(b)}</span></div>`).join('');
    const cap = UI.text(LK, { id: id + 'c', text: sc.lift, x: 90, y: G + 26, w: 900, size: sc.lift.length > 26 ? 42 : 50, weight: LK.headWeight, align: 'center', color: LK.accentText, font: 'head' });
    return `${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 330, w: 920, size: 84, align: 'center' }) : ''}
      <svg class="svgL" viewBox="0 0 1080 1920"><g id="${id}all">${fig}</g></svg><div id="${id}stk" class="k-abs" style="left:0;top:0;width:1080px;height:1px">${boxes}</div>
      <svg class="svgL" viewBox="0 0 1080 1920">${mark}</svg>${cap}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, q = s => X.q(s), T = this.tm(sc, X), parts = ['torso', 'legL', 'legR', 'armL', 'armR'];
    if (sc.head) X.head(`#${id}h`, X.tIn);
    const all = q(`#${id}all`), stk = q(`#${id}stk`), mk = q(`#${id}mk`), strain = q(`#${id}strain path`);
    tl.set(all, { autoAlpha: 0 }, 0).set(all, { autoAlpha: 1, y: 80 }, X.tIn - .15).to(all, { y: 0, duration: .55, ease: 'lr.out' }, X.tIn - .15);
    const to = (pp, t, d, ease) => { parts.forEach(k => tl.to(q(`#${id}${k}`), { attr: { d: pp[k] }, duration: d, ease }, t)); tl.to(q(`#${id}hd`), { attr: { cy: pp.head }, duration: d, ease }, t); };
    // arms come up, ready, just before the first box
    to(this.pose(0, true), Math.max(X.tIn + .1, T.b[0] - .45), .35, 'lr.out');
    tl.set(strain, { drawSVG: '0%' }, 0);
    T.b.forEach((t, k) => {
      const el = q(`#${id}b${k}`), bend = [.35, .68, 1][k], pp = this.pose(bend, true);
      tl.set(el, { autoAlpha: 0 }, 0).set(el, { autoAlpha: 1, y: -170 }, t - .05).to(el, { y: 0, duration: .3, ease: 'power3.in' }, t + .01);
      to(pp, t + .3, .5, 'elastic.out(1,.55)');
      tl.to(stk, { y: pp.hands - this.HY, duration: .5, ease: 'elastic.out(1,.55)' }, t + .3);
      if (k === 2) tl.to(strain, { drawSVG: '100%', duration: .25, ease: 'power2.out', stagger: .05 }, t + .45);
    });
    // a wobble while it's heavy
    const wob = Math.max(0, T.l - .5 - (T.b[2] + .9));
    if (wob > .4) tl.to(stk, { rotation: 1.6, transformOrigin: '540px 1000px', duration: wob / 2, ease: 'sine.inOut', yoyo: true, repeat: 1 }, T.b[2] + .9);
    // the mark slides in under the stack and lifts it; the person stands up
    const low = this.pose(1, true).hands;
    tl.set(mk, { autoAlpha: 0 }, 0).set(mk, { autoAlpha: 1, x: 420, y: low + 96 - 1036 }, T.l - .5).to(mk, { x: -180, duration: .45, ease: 'lr.out' }, T.l - .5);
    tl.to(mk, { x: 0, y: 0, duration: .7, ease: 'lr.move' }, T.l);
    tl.to(stk, { x: 180, y: 950 - this.HY, scale: .82, transformOrigin: `540px ${this.HY}px`, rotation: 0, duration: .7, ease: 'lr.move' }, T.l);
    tl.to(all, { x: -160, duration: .7, ease: 'lr.move' }, T.l + .05);
    tl.to(strain, { drawSVG: '100% 100%', duration: .25, ease: 'power2.in' }, T.l).set(strain, { autoAlpha: 0 }, T.l + .26);
    to(this.pose(0, false), T.l + .1, .6, 'lr.out');
    tl.to(mk, { y: -12, duration: 1, ease: 'sine.inOut', yoyo: true, repeat: Math.max(0, Math.floor((X.tOut - T.l - 1) / 1)) }, T.l + .7);
    tl.to(stk, { y: 950 - this.HY - 12, duration: 1, ease: 'sine.inOut', yoyo: true, repeat: Math.max(0, Math.floor((X.tOut - T.l - 1) / 1)) }, T.l + .7);
    const c = q(`#${id}c`); tl.set(c, { autoAlpha: 0 }, 0).set(c, { autoAlpha: 1, y: 30 }, T.l + .25).to(c, { y: 0, duration: .45, ease: 'lr.out' }, T.l + .25);
    if (LK.thread) X.dot(862, 1036, T.l + .7, { r: 16 });
    tl.to([stk, c], { autoAlpha: 0, y: '-=30', duration: .28, ease: 'lr.in' }, X.tOut);
    tl.to([all, mk], { autoAlpha: 0, duration: .3, ease: 'lr.in' }, X.tOut + .05);
  },
};
