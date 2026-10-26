/* JOURNEY — "the way forward". A top-down map: a small bump at an intersection, then an orange route appears and the
   viewer's car follows it while the camera travels with it. Each stop pops a pin for one thing the firm does.
   The camera pulls back to show the whole road; the destination (the firm's mark shape) swells into the end card.
   Best for: process, steps, client journey, "how we approach / prepare / investigate", first call to resolution.
   Storyboard: lines hook, s1..sN (one per stop, 3-5), cta (2-3 sentences: closing line, "Talk to …", the offer).
   screen: { head: "Find the way forward.", stops: [{ icon, head }], close, end, cta, site?, disclaimer? } */
FAMILIES.journey = {
  id: 'journey', label: 'The way forward (map journey)',
  lines: S => ['hook', ...S.screen.stops.map((_, i) => 's' + (i + 1)), 'cta'],
  geo(S) {   // the route: zig-zag stops climbing to the destination; same numbers drive the HTML and the Figma build
    const N = S.screen.stops.length, D = [540, 560], stops = [];
    for (let i = 0; i < N; i++) stops.push([i % 2 ? 780 : 300, 1300 + (N - 1 - i) * 700]);
    const P0 = [540, stops[0][1] + 650], pts = [P0, ...stops, D], seg = [];
    for (let i = 0; i < pts.length - 1; i++) { const [a, b] = [pts[i], pts[i + 1]], dy = a[1] - b[1];
      seg.push([a, [a[0], a[1] - dy * .4], [b[0], b[1] + dy * .45], b]); }
    const d = seg.map((s, i) => (i ? '' : `M${s[0][0]},${s[0][1]} `) + `C${s[1][0]},${s[1][1]} ${s[2][0]},${s[2][1]} ${s[3][0]},${s[3][1]}`).join(' ');
    const pins = stops.map(([x, y]) => [x === 300 ? 520 : 560, y - 50]);
    return { N, P0, D, stops, pins, seg, d, H: P0[1] + 600, river: (stops[Math.min(1, N - 1)][1] + stops[Math.min(2, N - 1)][1]) / 2 + 160 };
  },
  cues(h, S) {
    const N = S.screen.stops.length, cta = h.L.cta.sentences, c = { crash: .95, logo: h.W('hook', S.brandWord || 'firm') - .05 };
    c.go = [h.L.s1.t - 1.2]; for (let i = 2; i <= N; i++) c.go.push(h.L['s' + i].t - .55); c.go.push(h.L.cta.t - .35);
    c.zoom = cta[0].end - .7; c.swell = (cta[1] || cta[0]).t - .2 + (cta[1] ? 0 : 1.2); c.free = cta.length > 2 ? cta[cta.length - 1].t - .05 : c.swell + 1.4;
    c.end = h.L.cta.end + 2.8; return c;
  },
  sfx: (c) => [{ kind: 'impact', at: c.crash }, ...c.go.map((g, i) => ({ kind: i ? 'chime' : 'soft', at: g + (i ? .95 : 0) })), { kind: 'whoosh', at: c.zoom }, { kind: 'whoosh', at: c.swell }],
  poster: T => T.cues.go[2] + 1.6,
  html(T, S) {
    const G = this.geo(S), r = seeded(7), blk = mix(BT.warm, BT.ink, .07), park = mix(BT.warm, '#8DB07A', .22), tree = mix(BT.warm, '#6E9A5C', .3), water = mix(BT.warm, '#7FA7C2', .32);
    const route = contrast(BT.accent, BT.warm) >= 3 ? BT.accent : BT.ink;
    let blocks = '';
    for (let y = -200; y < G.H; y += 214) for (let x = -60; x < 1140; x += 236) {
      if (y > G.P0[1] - 170 && y < G.P0[1] + 10) continue;
      const pk = r() < .14, w = 190 + (r() * 20 | 0), hh = 168;
      blocks += `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="18" fill="${pk ? park : blk}"/>`;
      if (pk) for (let k = 0; k < 4; k++) blocks += `<circle cx="${(x + 30 + r() * (w - 60)).toFixed(0)}" cy="${(y + 30 + r() * (hh - 60)).toFixed(0)}" r="${(12 + r() * 10).toFixed(0)}" fill="${tree}"/>`;
    }
    const car = (id, body) => `<g id="${id}"><rect x="-64" y="-34" width="128" height="68" rx="20" fill="${body}"/><rect x="10" y="-26" width="26" height="52" rx="8" fill="#9FB3C0"/><rect x="-46" y="-24" width="18" height="48" rx="6" fill="#9FB3C0"/><rect x="54" y="-28" width="8" height="12" rx="3" fill="#FFE7A3"/><rect x="54" y="16" width="8" height="12" rx="3" fill="#FFE7A3"/></g>`;
    const pins = S.screen.stops.map((s, i) => `<g id="pin${i}" transform="translate(${G.pins[i][0]},${G.pins[i][1]})"><g class="pinIn"><circle r="84" fill="#fff" filter="url(#sh)"/><circle class="ring" r="84" fill="none" stroke="${BT.accent}" stroke-width="6" opacity="0"/>
      <g transform="translate(-48,-48)"><g class="ic" data-move="${({ phone: 'shake', search: 'sweep', gavel: 'tap', scale: 'tilt' })[s.icon] || 'bob'}">${icon(s.icon, 96, BT.ink, BT.accent).replace('<svg ', '<svg x="0" y="0" ')}</g></g></g></g>`).join('');
    const [cx, cy] = G.P0, cross = `<rect x="-20" y="${cy - 100}" width="1120" height="80" fill="${BT.warm}"/><rect x="${cx - 40}" y="${cy - 50}" width="80" height="460" fill="${BT.warm}"/>`;
    return `<div id="bgc" class="bgc" style="background:${BT.warm}"></div>
  <svg class="svgL" viewBox="0 0 1080 1920"><defs><filter id="sh" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="${BT.ink}" flood-opacity=".18"/></filter></defs>
    <g id="zoom" transform="translate(0,0) scale(1)"><g id="world">${blocks}
      <path d="M-80,${G.river} C200,${G.river - 60} 420,${G.river - 140} 640,${G.river - 150} C860,${G.river - 160} 980,${G.river - 240} 1160,${G.river - 290}" fill="none" stroke="${water}" stroke-width="130" stroke-linecap="round"/>${cross}
      <path id="ghost" d="${G.d}" fill="none" stroke="${mix(BT.warm, BT.ink, .22)}" stroke-width="10" stroke-linecap="round" stroke-dasharray="2 26"/>
      <path id="casing" d="${G.d}" fill="none" stroke="#fff" stroke-width="34" stroke-linecap="round"/>
      <path id="routeL" d="${G.d}" fill="none" stroke="${route}" stroke-width="18" stroke-linecap="round"/>
      ${G.stops.map(([x, y], i) => `<circle id="stop${i}" cx="${x}" cy="${y}" r="20" fill="#fff" stroke="${route}" stroke-width="8" opacity="0"/>`).join('')}
      <g id="burst" stroke="${BT.accent}" stroke-width="8" stroke-linecap="round">${[[-40, -30], [-8, -50], [30, -36], [44, 4]].map(([dx, dy]) => `<path d="M${cx - 35 + dx * .4},${cy - 65 + dy * .4} L${cx - 35 + dx},${cy - 65 + dy}"/>`).join('')}</g>
      ${car('car2', BT.muted)}${car('car', BT.ink)}${pins}
      <g transform="translate(${G.D[0]},${G.D[1]})"><g id="dest"><path d="${markPath(0, 0, 92)}" fill="${BT.accent}" filter="url(#sh)"/><path id="destChk" d="M-30,2 L-8,24 L34,-22" fill="none" stroke="${BT.onAccent}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/></g></g>
    </g></g>
    <path id="hexS" fill="${BT.endBg}" d="${markPath(0, 0, 10)}" opacity="0"/>
  </svg>
  <div class="topfade" style="background:linear-gradient(${BT.warm} 0%,${BT.warm} 60%,${BT.warm}00 100%)"></div>
  <img id="bug" class="m-bug h" src="${BT.logoDark}" alt="${esc(BT.name)}">
  ${[S.screen.head, ...S.screen.stops.map(s => s.head), S.screen.close].map((h, i) => `<div id="hd${i}" class="m-hl" data-qa="text" style="color:${BT.ink}">${accentize(h)}</div>`).join('')}
  ${endCard(S.screen)}`;
  },
  build(tl, T, $, S) {
    const Q = T.cues, { L } = MK.T(T), G = this.geo(S), N = G.N;
    const NS = 'http://www.w3.org/2000/svg', lens = G.seg.map(s => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', `M${s[0]} C${s[1]} ${s[2]} ${s[3]}`); return p.getTotalLength(); });
    const tot = lens.reduce((a, b) => a + b), F = [0]; lens.forEach(l => F.push(F[F.length - 1] + l / tot));
    const CAMY = 1180, wy = y => CAMY - y;
    tl.set(['#routeL', '#casing'], { drawSVG: '0%' }, 0).set('#ghost', { opacity: 0 }, 0).set('#burst path', { drawSVG: '0%' }, 0);
    tl.set('.pinIn', { scale: 0, transformOrigin: '50% 50%' }, 0).set('#destChk', { drawSVG: '0%' }, 0);
    tl.set('#world', { y: wy(G.P0[1]) }, 0);
    tl.set('#car', { x: G.P0[0], y: G.P0[1] + 280, rotation: -90 }, 0).set('#car2', { x: -160, y: G.P0[1] - 60, rotation: 0 }, 0);
    // 1 · the bump at the intersection
    tl.to('#car', { y: G.P0[1], duration: .95, ease: 'power1.out' }, 0);
    tl.to('#car2', { x: G.P0[0] - 112, duration: .95, ease: 'power2.in' }, 0);
    tl.to('#car', { keyframes: [{ rotation: -100, x: G.P0[0] + 8, duration: .08, ease: 'power3.out' }, { rotation: -88, duration: .25, ease: 'power2.inOut' }, { rotation: -90, x: G.P0[0], duration: .35, ease: 'elastic.out(1,.5)' }] }, Q.crash);
    tl.to('#car2', { keyframes: [{ x: G.P0[0] - 144, rotation: 6, duration: .12, ease: 'power3.out' }, { rotation: 0, duration: .3 }] }, Q.crash);
    tl.to('#burst path', { drawSVG: '0% 100%', duration: .14, stagger: .02 }, Q.crash).to('#burst path', { drawSVG: '100% 100%', duration: .3, stagger: .02 }, Q.crash + .2).set('#burst', { opacity: 0 }, Q.crash + .6);
    tl.to('#car2', { x: -220, duration: .9, ease: 'power2.in' }, Q.crash + 1.0).set('#car2', { autoAlpha: 0 }, Q.crash + 1.95);
    tl.to('#ghost', { opacity: 1, duration: .5 }, Q.logo + .2);
    tl.fromTo('#ghost', { strokeDashoffset: 0 }, { strokeDashoffset: -280, duration: T.end, ease: 'none' }, 0);
    M.enter(tl, '#bug', Q.logo, { y: -16, d: .4 }); M.exit(tl, '#bug', Q.go[0] + .2);
    MK.head(tl, '#hd0', Q.logo + .3, Q.go[0] + .2);
    // 2 · stop to stop; the camera travels with the car; each stop pops its pin
    const D = Q.go.map((g, i) => i < N ? Math.min(1.7, (Q.go[i + 1] ?? g + 2) - g - .1) : 1.4);
    const stopY = i => i < N ? G.stops[i][1] : G.D[1];
    Q.go.forEach((g, i) => {
      tl.to('#car', { motionPath: { path: '#routeL', start: F[i], end: F[i + 1], autoRotate: true }, duration: D[i], ease: 'power2.inOut' }, g);
      tl.to(['#routeL', '#casing'], { drawSVG: `0% ${F[i + 1] * 100}%`, duration: D[i], ease: 'power2.inOut' }, g);
      tl.to('#world', { y: wy(stopY(i)), duration: D[i], ease: 'power2.inOut' }, g);
      if (i >= N) return;
      const t = g + D[i] - .05, lid = 's' + (i + 1);
      tl.fromTo('#stop' + i, { opacity: 0, scale: 0, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .3, ease: 'back.out(2)' }, t - .1);
      tl.to(`#pin${i} .pinIn`, { scale: 1, duration: .45, ease: 'back.out(1.8)' }, t);
      tl.fromTo(`#pin${i} .ring`, { opacity: .9, scale: 1 }, { opacity: 0, scale: 1.6, transformOrigin: '50% 50%', duration: .7, ease: 'power2.out' }, t + .15);
      const ic = $(`#pin${i} .ic`), mv = ic.dataset.move, t2 = t + .5;
      if (mv === 'shake') tl.to(ic, { keyframes: [{ rotation: -10, duration: .05 }, { rotation: 10, duration: .05 }, { rotation: -6, duration: .05 }, { rotation: 0, duration: .05 }], repeat: 2, svgOrigin: '48 48' }, t2);
      else if (mv === 'sweep') tl.to(ic, { keyframes: [{ x: -14, y: -8, duration: .35 }, { x: 10, y: 6, duration: .4 }, { x: 0, y: 0, duration: .3 }], ease: 'sine.inOut' }, t2);
      else if (mv === 'tap' || mv === 'tilt') [0, .65].forEach(k => tl.to(ic, { keyframes: [{ rotation: mv === 'tap' ? -24 : -12, duration: .18, ease: 'power2.out' }, { rotation: mv === 'tap' ? 8 : 6, duration: .1, ease: 'power3.in' }, { rotation: 0, duration: .25, ease: 'elastic.out(1,.5)' }], svgOrigin: '48 48' }, t2 + k));
      else tl.to(ic, { y: -10, duration: .22, ease: 'sine.inOut', yoyo: true, repeat: 5 }, t2);
      MK.head(tl, '#hd' + (i + 1), L[lid].t + .05, Q.go[i + 1] + (i + 1 < N ? .1 : .05));
    });
    const tArr = Q.go[N] + D[N];
    tl.to('#destChk', { drawSVG: '100%', duration: .35, ease: 'power2.out' }, tArr);
    tl.to('#dest', { keyframes: [{ scale: 1.12, duration: .1 }, { scale: 1, duration: .45, ease: 'elastic.out(1,.4)' }], svgOrigin: '0 0' }, tArr);
    MK.head(tl, '#hd' + (N + 1), L.cta.t + .05, Q.swell - .05);
    // 3 · pull back to the whole road travelled (the camera scale lives on its own layer: same order as in Figma)
    const s = Math.min(.42, 1300 / (G.P0[1] - G.D[1] + 300)), wyD = wy(G.D[1]), zx = 540 - s * 540, zy = 470 - s * (G.D[1] - 92 + wyD);
    tl.to('#zoom', { attr: { transform: `translate(${zx},${zy}) scale(${s})` }, duration: .9, ease: 'power3.inOut' }, Q.zoom);
    tl.to('.topfade', { opacity: 0, duration: .5 }, Q.zoom + .3);
    // 4 · the destination swells into the end card
    const hx = zx + s * 540, hy = zy + s * (G.D[1] + wyD);
    tl.set('#hexS', { attr: { d: markPath(hx, hy, 92 * s) }, opacity: 1 }, Q.swell);
    tl.to('#hexS', { morphSVG: markPath(540, 960, 1500), duration: .6, ease: 'power3.in' }, Q.swell);
    tl.set('#bgc', { backgroundColor: BT.endBg }, Q.swell + .6).set(['#zoom', '#hexS'], { opacity: 0 }, Q.swell + .61);
    endCardIn(tl, Q.swell + .55, Q.free);
  },
  client: (T, S) => `<p class="lede">After a crash, most people don't know what comes next. This piece turns ${esc(BT.short)}'s process into a journey on a map. After a small bump at an intersection, an orange route appears and the viewer's car follows it, the camera travelling with it. Each stop is one thing the firm does: ${S.screen.stops.map(s => esc(s.head.replace(/\*\*/g, '').replace(/\.$/, '').toLowerCase())).join('; ')}. At the end the camera pulls back to show the whole road travelled, and the destination becomes the call to action.</p>
  <h3>Why it works</h3><ul><li><b>The firm is named in the first seconds</b> and its logo appears as the route does.</li><li><b>Constant forward motion</b> keeps people watching, and every stop is one clear promise.</li><li><b>A map makes a confusing process feel guided.</b></li></ul>`,
};
