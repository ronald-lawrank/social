/* umbrella: life's problems hang over a home like storm clouds, rain pouring down. On the word, the firm's mark pops up
   over the house and opens into an umbrella; the rain stops reaching the house and each problem drops, hits the canopy
   and bounces away. thread: line art, the dot lands on the umbrella tip; flat: chunky white house on the brand colour;
   cards: floating notification cards over a soft house; silhouette: black cut-outs with a lit window. */
SCENES.umbrella = {
  label: 'Umbrella cover', about: "Problems rain down over a house; the firm's mark opens into an umbrella above it and the problems bounce off.",
  good: 'protection, "we handle it", the insurer and the bills, peace of mind, what we take off your plate', practice: 'any',
  fields: { head: 'optional headline', problems: '3 short problem labels (or {icon, label}), each said in the line, in order', shelter: 'optional label under the house, e.g. "Your family" (said in the line)' },
  example: { say: 'Medical bills, insurance calls, lost work. We cover your family from the storm.', head: "We've got you **covered.**",
    problems: ['Medical bills', 'Insurance calls', 'Lost work'], shelter: 'Your family' },
  sfx: (sc, X) => { const T = SCENES.umbrella.tm(sc, X); return T.p.map(t => ({ kind: 'thud', at: t + .3 })).concat([{ kind: 'whoosh', at: T.u }], T.hit.map(t => ({ kind: 'pop', at: t }))); },
  tm(sc, X) {
    const tx = sc.problems.map(p => p.label || p), ts = X.times(sc.shelter ? [...tx, sc.shelter] : tx);
    const p = ts.slice(0, 3), u = Math.min(X.tOut - 1.6, Math.max(p[2] + .6, sc.shelter ? ts[3] - .35 : (p[2] + X.tOut) / 2 - .4));
    const g = Math.max(.32, Math.min(.42, (X.tOut - u - 1.1) / 3)), hit = [0, 1, 2].map(k => u + .7 + k * g);
    return { p, u, hit, g };
  },
  ico(p) { if (p.icon) return p.icon; const w = String(p.label || p).toLowerCase();
    return /bill|cost|money|pay|debt/.test(w) ? 'dollar' : /call|phone|adjust|insur/.test(w) ? 'phone' : /doctor|medic|hospital|injur|pain/.test(w) ? 'hospital'
      : /work|job|wage|income/.test(w) ? 'briefcase' : /car|repair|crash/.test(w) ? 'car' : /time|deadline|wait/.test(w) ? 'clock' : /letter|form|paper/.test(w) ? 'doc' : 'chat'; },
  G: { cx: 540, apex: 968, rim: 1132, hw: 330, roof: 1215, base: 1450 },
  can(G) { const { cx, apex, rim, hw } = G, n = 6, w = 2 * hw / n; let d = `M${cx - hw},${rim} C${cx - hw},${apex + 40} ${cx - hw * .5},${apex} ${cx},${apex} C${cx + hw * .5},${apex} ${cx + hw},${apex + 40} ${cx + hw},${rim}`;
    for (let k = n - 1; k >= 0; k--) d += ` Q${cx - hw + (k + .5) * w},${rim - 26} ${cx - hw + k * w},${rim}`; return d + 'Z'; },
  pal(LK) {
    const n = LK.name;
    if (n === 'thread') return { house: '#FFFFFF', roof: '#FFFFFF', edge: LK.line, sw: LK.stroke, win: mix(BT.accent, '#FFFFFF', .7), can: BT.accent, rib: mix(BT.accent, '#000000', .25), rain: LK.fillC, chip: '#FFFFFF', chipInk: LK.ink, tile: LK.fillB, tileIc: LK.ink };
    if (n === 'flat') return { house: '#FFFFFF', roof: LK.fillB, edge: null, sw: 0, win: LK.fillC, can: '#FFFFFF', rib: mix(LK.bg, '#FFFFFF', .55), rain: mix(LK.bg, '#FFFFFF', .45), chip: LK.fillB, chipInk: '#FFFFFF', tile: mix(LK.fillB, '#FFFFFF', .14), tileIc: '#FFFFFF' };
    if (n === 'cards') return { house: '#FFFFFF', roof: mix(BT.ink, '#FFFFFF', .2), edge: null, sw: 0, win: mix(BT.accent, '#FFFFFF', .72), can: BT.accent, rib: mix(BT.accent, '#000000', .2), rain: mix(BT.ink, LK.bg, .7), chip: '#FFFFFF', chipInk: BT.ink, tile: mix(BT.ink, '#FFFFFF', .92), tileIc: BT.ink };
    return { house: LK.ink, roof: LK.ink, edge: null, sw: 0, win: LK.accent, can: LK.accent, rib: mix(LK.accent, '#000000', .3), rain: LK.ink, chip: LK.ink, chipInk: '#F8F6F1', tile: mix(LK.ink, '#FFFFFF', .14), tileIc: '#F8F6F1' };
  },
  spots: [{ pos: 'left:80px', y: 548 }, { pos: 'right:70px', y: 688 }, { pos: 'left:0;right:0;margin:0 auto;width:fit-content', y: 828 }],
  html(sc, X) {
    const LK = X.LK, n = LK.name, G = this.G, P = this.pal(LK), id = X.id, { cx, apex, rim, roof, base } = G;
    const st = P.edge ? `stroke="${P.edge}" stroke-width="${P.sw}" stroke-linejoin="round"` : '';
    const sh = n === 'cards' ? `<feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#1E140A" flood-opacity=".2"/>` : n === 'silhouette' ? `<feDropShadow dx="14" dy="16" stdDeviation="0" flood-color="#000" flood-opacity=".15"/>`
      : n === 'flat' ? `<feDropShadow dx="0" dy="12" stdDeviation="0" flood-color="${mix(LK.bg, '#000000', .25)}" flood-opacity="1"/>` : `<feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#14181C" flood-opacity=".08"/>`;
    // rain: two identical tiles stacked so the loop is seamless
    const r = seeded(9); let drops = '';
    for (let k = 0; k < 70; k++) { const x = (r() * 1120 - 20).toFixed(0), y = (r() * 900).toFixed(0), l = 40 + r() * 40; drops += `<path d="M${x},${y} l-10,${l.toFixed(0)}"/>`; }
    const rain = `<g id="${id}rain" stroke="${P.rain}" stroke-width="${n === 'flat' ? 6 : 4}" stroke-linecap="round" opacity="${n === 'silhouette' ? .55 : .9}">${drops}<g transform="translate(0,-900)">${drops}</g></g>`;
    const hx = cx - 170, hw = 340;
    const house = `<g id="${id}house" transform="translate(${cx},${base}) scale(1.15) translate(${-cx},${-base})"><path d="M${hx + 24},${roof + 70} V${base} H${hx + hw - 24} V${roof + 70}" fill="${P.house}" ${st}/>
      <path d="M${hx - 20},${roof + 92} L${cx},${roof - 40} L${hx + hw + 20},${roof + 92} Z" fill="${P.roof}" ${st}/>
      <rect x="${hx + 230}" y="${roof - 10}" width="34" height="60" fill="${P.roof}" ${st}/>
      <rect id="${id}win" x="${hx + 66}" y="${roof + 130}" width="76" height="76" rx="${n === 'silhouette' ? 0 : 8}" fill="${P.win}" ${st}/>
      <rect x="${hx + 196}" y="${roof + 128}" width="80" height="${base - roof - 128}" rx="${n === 'silhouette' ? 0 : 8}" fill="${n === 'silhouette' ? LK.surface : P.roof}" ${st}/>
      <path d="M${hx - 70},${base} H${hx + hw + 70}" stroke="${n === 'flat' ? LK.fillB : n === 'thread' ? LK.line : P.roof}" stroke-width="${n === 'thread' ? LK.stroke : 12}" stroke-linecap="round"/></g>`;
    const can = this.can(G), ribs = [-.62, -.22, .22, .62].map(f => `<path d="M${cx},${apex} Q${cx + f * 160},${apex + 40} ${cx + f * G.hw * 1.02},${rim - 10}"/>`).join('');
    const umb = `<g id="${id}umb"><path id="${id}shaft" d="M${cx},${apex - 30} V${roof - 70} q0,34 -30,34 q-26,0 -26,-26" fill="none" stroke="${n === 'thread' ? LK.line : n === 'flat' ? LK.fillB : n === 'cards' ? BT.ink : LK.ink}" stroke-width="12" stroke-linecap="round"/>
      <path id="${id}can" d="${markPath(cx, apex + 60, 70)}" fill="${P.can}" ${n === 'thread' ? `stroke="${P.rib}" stroke-width="4"` : ''}/>
      <g id="${id}ribs" fill="none" stroke="${P.rib}" stroke-width="5" stroke-linecap="round">${ribs}</g></g>`;
    const chips = sc.problems.map((p, i) => { const s = this.spots[i], lab = p.label || p;
      return `<div id="${id}p${i}" class="k-abs" data-qa="text" style="${s.pos};top:${s.y}px;max-width:640px;display:flex;align-items:center;gap:20px;padding:14px 28px 14px 14px;background:${P.chip};color:${P.chipInk};
        border-radius:${n === 'silhouette' ? 0 : 999}px;box-shadow:${n === 'cards' ? LK.shadow : n === 'flat' ? `0 10px 0 ${mix(LK.bg, '#000000', .3)}` : n === 'silhouette' ? '10px 12px 0 rgba(0,0,0,.18)' : '0 14px 30px rgba(20,24,28,.12)'};${n === 'thread' ? `border:${LK.stroke - 2}px solid ${LK.line};` : ''}
        font:${LK.headWeight} ${LK.headCase === 'upper' ? 38 : 42}px/1.05 var(--head);white-space:nowrap;${LK.headCase === 'upper' ? 'text-transform:uppercase;' : ''}">
        <div style="flex:none;width:76px;height:76px;border-radius:${n === 'silhouette' ? 0 : 50}%;background:${P.tile};display:flex;align-items:center;justify-content:center">${icon(this.ico(p), 46, P.tileIc, n === 'flat' || n === 'silhouette' ? P.tileIc : BT.accent)}</div>${esc(lab)}</div>`; }).join('');
    const cap = sc.shelter ? UI.text(LK, { id: id + 's', text: sc.shelter, x: 140, y: base + 28, w: 800, size: 50, weight: LK.headWeight, align: 'center', color: LK.ink, font: 'head' }) : '';
    return `${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 330, w: 920, size: 84, align: 'center' }) : ''}
      <svg class="svgL" viewBox="0 0 1080 1920"><defs><filter id="${id}sh" x="-30%" y="-30%" width="160%" height="160%">${sh}</filter>
        <clipPath id="${id}rc"><rect x="-20" y="560" width="1120" height="${base - 560}"/></clipPath>
        <mask id="${id}rm" maskUnits="userSpaceOnUse" x="-20" y="0" width="1120" height="1920"><rect x="-20" y="0" width="1120" height="1920" fill="#fff"/>
          <path id="${id}dry" d="M${cx - G.hw},${rim - 30} H${cx + G.hw} L${cx + G.hw + 30},${base + 10} H${cx - G.hw - 30} Z" fill="#000" opacity="0"/></mask></defs>
        <g clip-path="url(#${id}rc)"><g mask="url(#${id}rm)">${rain}</g></g>
        <g id="${id}scene" filter="url(#${id}sh)">${house}${umb}</g></svg>${chips}${cap}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, G = this.G, id = X.id, q = s => X.q(s), T = this.tm(sc, X), { cx, apex } = G;
    if (sc.head) X.head(`#${id}h`, X.tIn);
    const scene = q(`#${id}scene`), rain = q(`#${id}rain`);
    tl.set(scene, { autoAlpha: 0 }, 0).set(scene, { autoAlpha: 1, y: 100 }, X.tIn - .15).to(scene, { y: 0, duration: .55, ease: 'lr.out' }, X.tIn - .15);
    // rain, falling the whole scene; under the canopy it stops once the umbrella is open
    const dur = X.tOut - X.tIn + .6, loops = Math.ceil(dur / .7);
    tl.set(rain, { autoAlpha: 0 }, 0).to(rain, { autoAlpha: 1, duration: .5, ease: 'power1.out' }, X.tIn);
    tl.fromTo(rain, { y: 0 }, { y: 900, duration: .7, ease: 'none', repeat: loops - 1, immediateRender: false }, X.tIn - .1);
    tl.to(rain, { autoAlpha: .35, duration: .6, ease: 'power1.inOut' }, T.hit[2] + .3);
    tl.set(q(`#${id}dry`), { opacity: 0 }, 0).to(q(`#${id}dry`), { opacity: 1, duration: .35, ease: 'power1.out' }, T.u + .3);
    // the problems arrive like storm clouds on their words, then hang there, heavy
    sc.problems.forEach((p, i) => {
      const el = q(`#${id}p${i}`), t = T.p[i], s = this.spots[i];
      tl.set(el, { autoAlpha: 0 }, 0).set(el, { autoAlpha: 1, y: -16, scale: .5, rotation: i % 2 ? 8 : -8 }, t - .1).to(el, { y: 0, scale: 1, rotation: 0, duration: .5, ease: 'back.out(1.6)' }, t - .1);
      const order = [2, 1, 0].indexOf(i), th = T.hit[order], reps = Math.floor((th - .35 - t - .45) / .9);
      if (reps >= 1) tl.to(el, { y: 14, duration: .9, ease: 'sine.inOut', yoyo: true, repeat: reps - 1 }, t + .45);
      // the drop onto the canopy and the bounce off it, away from the house
      const node = X.$(`#${id}p${i}`);
      const w = node.offsetWidth, h = node.offsetHeight, mid = node.offsetLeft + w / 2, out = i === 1 ? 1 : -1;
      const hitY = apex + 30 + Math.pow((mid - cx) / G.hw, 2) * 120 - h - s.y;
      tl.to(el, { y: hitY, rotation: out * 4, duration: .3, ease: 'power2.in' }, th - .3);
      tl.to(el, { x: out * 260, y: hitY - 120, rotation: out * 28, duration: .55, ease: 'power1.out' }, th).to(el, { autoAlpha: 0, duration: .14, ease: 'power2.out' }, th);
    });
    // the mark pops up over the house and opens into the umbrella
    const can = q(`#${id}can`), umb = q(`#${id}umb`);
    tl.set(umb, { autoAlpha: 0 }, 0).set(umb, { autoAlpha: 1 }, T.u - .4);
    tl.fromTo(can, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: .35, ease: 'back.out(2)', immediateRender: false }, T.u - .4);
    tl.to(can, { morphSVG: this.can(G), duration: .45, ease: 'lr.out' }, T.u);
    tl.set(q(`#${id}shaft`), { drawSVG: '0%' }, 0).to(q(`#${id}shaft`), { drawSVG: '100%', duration: .4, ease: 'power2.out' }, T.u + .1);
    tl.set(q(`#${id}ribs path`), { drawSVG: '0%' }, 0).to(q(`#${id}ribs path`), { drawSVG: '100%', duration: .35, ease: 'power2.out', stagger: .04 }, T.u + .3);
    T.hit.forEach(t => tl.to(umb, { keyframes: [{ y: 10, duration: .08, ease: 'power2.out' }, { y: 0, duration: .4, ease: 'elastic.out(1,.4)' }] }, t));
    tl.fromTo(q(`#${id}win`), { opacity: .5 }, { opacity: 1, duration: .5, ease: 'power1.out', immediateRender: false }, T.u + .5);
    if (sc.shelter) { const s = q(`#${id}s`); tl.set(s, { autoAlpha: 0 }, 0).set(s, { autoAlpha: 1, y: 30 }, T.u + .2).to(s, { y: 0, duration: .45, ease: 'lr.out' }, T.u + .2); tl.to(s, { autoAlpha: 0, duration: .25, ease: 'lr.in' }, X.tOut); }
    if (LK.thread) X.dot(cx + 360, apex + 170, T.u + .35, { r: 16 });   // at the canopy tip, clear of the falling chips
    tl.to([scene, rain], { autoAlpha: 0, duration: .3, ease: 'lr.in' }, X.tOut + .05);
  },
};
