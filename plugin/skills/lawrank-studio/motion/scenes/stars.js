/* stars: five stars fill one by one, then the score counts up beneath with its label. For APPROVED ratings only.
   Thread: line-art stars draw, then fill in the accent, the dot lands on the last; flat: chunky stars spin in with a
   deep under-shadow; cards: a white review card with a source chip; silhouette: black cut-out stars, hard shadows. */
SCENES.stars = {
  label: 'Star rating', about: 'Five stars fill one by one, then the score counts up with its label and source.',
  good: 'an approved rating the firm may advertise (e.g. its average on a review site), stated exactly as approved', practice: 'any',
  fields: { head: 'optional headline above (2-5 words)', score: 'PLACEHOLDER until approved: the exact approved rating as text, e.g. "4.9"; never invent or round up',
    out: 'optional: the scale (default 5)', label: 'what the rating is (e.g. "Average client rating"); must match the approved claim',
    source: 'optional: where it comes from (e.g. "Google reviews"), required if the approval names one' },
  example: { say: 'Clients rate their experience with us five out of five.', score: '5.0', label: 'Client rating', source: 'Replace with an approved rating' },
  sfx: (sc, X) => SCENES.stars.stTimes(sc, X).ts.map(t => ({ kind: 'clink', at: t })),
  stTimes(sc, X) {
    const a = X.tIn + .35, b = Math.min(X.tOut - 1.1, a + 1.7), ts = [0, 1, 2, 3, 4].map(i => a + (b - a) * i / 4);
    return { a, b, ts };
  },
  stPath(cx, cy, R) { let d = ''; for (let i = 0; i < 10; i++) { const r = i % 2 ? R * .47 : R, ang = -Math.PI / 2 + i * Math.PI / 5; d += (i ? 'L' : 'M') + (cx + r * Math.cos(ang)).toFixed(1) + ' ' + (cy + r * Math.sin(ang)).toFixed(1); } return d + 'Z'; },
  html(sc, X) {
    const LK = X.LK, nm = LK.name, up = LK.headCase === 'upper', out = +sc.out || 5, v = Math.max(0, Math.min(out, parseFloat(sc.score) || 0)), fill = v / out * 5;
    const S = 150, gap = 26, W = 5 * S + 4 * gap, P = SCENES.stars.stPath;
    const on = nm === 'flat' ? LK.fillA : nm === 'silhouette' ? LK.ink : BT.accent, off = nm === 'flat' ? LK.soft : nm === 'silhouette' ? LK.fillC : nm === 'cards' ? mix(BT.ink, '#FFFFFF', .88) : 'none';
    const stars = [0, 1, 2, 3, 4].map(i => { const cx = i * (S + gap) + S / 2, cy = S / 2 + 8, d = P(cx, cy, S / 2), f = Math.max(0, Math.min(1, fill - i));
      const base = nm === 'thread' ? `<path class="stO" d="${d}" fill="none" stroke="${LK.line}" stroke-width="4" stroke-linejoin="round"/>`
        : `<path d="${d}" fill="${off}" stroke="${off}" stroke-width="${nm === 'silhouette' ? 0 : 12}" stroke-linejoin="round"/>`;
      const shadow = nm === 'flat' ? `<path d="${d}" transform="translate(0 10)" fill="${mix(LK.bg, '#000000', .28)}" stroke="${mix(LK.bg, '#000000', .28)}" stroke-width="12" stroke-linejoin="round"/>`
        : nm === 'silhouette' ? `<path d="${d}" transform="translate(12 14)" fill="rgba(0,0,0,.16)"/>` : '';
      return `<g class="stS" data-cx="${cx}" data-cy="${cy}">${base}<clipPath id="${X.id}cp${i}"><rect class="stC" x="${cx - S / 2 - 10}" y="0" width="${(S + 20) * f}" height="${S + 30}"/></clipPath>
        <g class="stF" clip-path="url(#${X.id}cp${i})">${shadow}<path d="${d}" fill="${on}" stroke="${on}" stroke-width="${nm === 'silhouette' ? 0 : nm === 'thread' ? 4 : 12}" stroke-linejoin="round"/></g></g>`; }).join('');
    const dec = (String(sc.score).split('.')[1] || '').length, ink = nm === 'cards' ? LK.surfaceInk : LK.ink;
    const score = `<div style="display:flex;align-items:baseline;gap:18px"><div id="${X.id}sc" data-qa="text" data-v="${v}" data-d="${dec}" style="font:800 ${nm === 'cards' ? 190 : 230}px/1 var(--head);color:${ink};font-variant-numeric:tabular-nums;letter-spacing:-.03em">${/^\d+(\.\d)?$/.test(String(sc.score)) ? `<span class="stI" data-v="${String(sc.score).split('.')[0]}">0</span>${dec ? `.<span class="stD" data-v="${String(sc.score).split('.')[1]}">0</span>` : ''}` : esc(sc.score)}</div>
      <div id="${X.id}ou" data-qa="text" style="font:700 64px/1 var(--head);color:${nm === 'cards' ? mix(LK.surfaceInk, '#FFFFFF', .35) : LK.sub}">/ ${out}</div></div>`;
    const label = `<div id="${X.id}l" data-qa="text" style="font:${LK.headWeight} 58px/1.15 var(--head);color:${ink};text-align:center;${up ? 'text-transform:uppercase;letter-spacing:.05em;' : ''}">${esc(sc.label)}</div>`;
    const srcBg = nm === 'cards' ? LK.soft : nm === 'silhouette' ? LK.ink : nm === 'flat' ? LK.fillB : 'transparent', srcInk = nm === 'silhouette' ? LK.surface : nm === 'flat' ? (contrast('#FFFFFF', LK.fillB) >= 4.5 ? '#FFFFFF' : BT.ink) : nm === 'cards' ? LK.surfaceInk : LK.sub;
    const source = sc.source ? `<div id="${X.id}so" data-qa="text" style="padding:${nm === 'thread' ? 0 : '16px 32px'};border-radius:${nm === 'silhouette' ? 0 : 40}px;background:${srcBg};color:${srcInk};font:600 38px/1.2 var(--body);text-align:center;max-width:840px">${esc(sc.source)}</div>` : '';
    const svg = `<svg id="${X.id}st" width="${W}" height="${S + 30}" viewBox="0 0 ${W} ${S + 30}" style="overflow:visible;display:block">${stars}</svg>`;
    const card = nm === 'cards' ? `background:${LK.surface};border-radius:${LK.radius}px;box-shadow:${LK.shadow};border:${LK.edge};padding:80px 40px 80px;` : '';
    const head = sc.head ? UI.head(LK, { id: X.id + 'h', text: sc.head, x: 80, y: 340, w: 920, size: 92, align: 'center' }) : '';
    return `${head}<div id="${X.id}col" class="k-abs" style="left:${nm === 'cards' ? 70 : 60}px;top:${sc.head ? 600 : 480}px;width:${nm === 'cards' ? 940 : 960}px;display:flex;flex-direction:column;align-items:center;gap:40px;${card}">
      ${svg}${score}${label}${source}</div>`;
  },
  build(tl, sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, { a, b, ts } = SCENES.stars.stTimes(sc, X), COL = X.$(`#${id}col`), rel = MK.rel(COL.closest('.stage'));
    const ch = rel(COL).h, minTop = sc.head ? 580 : 420; COL.style.top = Math.round(Math.max(minTop, Math.min(1540 - ch, 990 - ch / 2))) + 'px';
    if (sc.head) X.head(`#${id}h`, X.tIn);
    tl.set(COL, { autoAlpha: 0 }, 0).set(COL, { autoAlpha: 1 }, X.tIn - .15);
    if (nm === 'cards') tl.set(COL, { y: 150 }, X.tIn - .15).to(COL, { y: 0, duration: .6, ease: 'lr.out' }, X.tIn - .15);
    const gs = [...X.$(`#${id}st`).querySelectorAll('.stS')];
    gs.forEach((g, i) => { const cx = +g.dataset.cx, cy = +g.dataset.cy, F = g.querySelector('.stF'), O = g.querySelector('.stO'), t = ts[i];
      // each star arrives, then fills on its beat
      if (O) tl.set(O, { drawSVG: '0%' }, 0).to(O, { drawSVG: '100%', duration: .6, ease: 'power2.inOut' }, X.tIn - .1 + i * .07);
      else tl.set(g, { scale: 0, rotation: nm === 'flat' ? -40 : 0, svgOrigin: `${cx} ${cy}` }, 0).to(g, { scale: 1, rotation: 0, duration: .45, ease: 'back.out(1.8)' }, X.tIn - .1 + i * .06);
      tl.set(F, { scale: 0, svgOrigin: `${cx} ${cy}` }, 0).to(F, { scale: 1, duration: .42, ease: nm === 'silhouette' ? 'power4.out' : 'back.out(2.6)' }, t);
      if (nm === 'flat' || nm === 'thread') tl.to(g, { y: -14, duration: .16, ease: 'power2.out' }, t).to(g, { y: 0, duration: .3, ease: 'power2.in' }, t + .16);
    });
    if (LK.thread) { const sr = rel(X.$(`#${id}st`)), cx = +gs[4].dataset.cx, cy = +gs[4].dataset.cy; X.dot(sr.x + cx, sr.y + cy - 14, ts[4] + .05, { r: 18 }); }
    // the score counts up with the stars, then the label and source settle in
    // seeking skips callbacks, so the count is a property tween on each part (whole number, then the decimal)
    const SC = X.$(`#${id}sc`), SI = SC.querySelector('.stI'), SD = SC.querySelector('.stD');
    tl.set(SC, { autoAlpha: 0 }, 0).set(SC, { autoAlpha: 1, y: 40 }, a - .1).to(SC, { y: 0, duration: .5, ease: 'lr.out' }, a - .1);
    if (SI) tl.fromTo(SI, { textContent: 0 }, { textContent: +SI.dataset.v, snap: { textContent: 1 }, duration: b - a + .1, ease: 'power1.in', immediateRender: false }, a);
    if (SD) tl.fromTo(SD, { textContent: 0 }, { textContent: +SD.dataset.v, snap: { textContent: 1 }, duration: .5, ease: 'power1.out', immediateRender: false }, b - .2);
    const OU = X.$(`#${id}ou`); tl.set(OU, { autoAlpha: 0 }, 0).set(OU, { autoAlpha: 1, x: 24 }, a + .1).to(OU, { x: 0, duration: .45, ease: 'lr.out' }, a + .1);
    const L = X.$(`#${id}l`), tl2 = Math.min(b + .1, X.tOut - .8); tl.set(L, { autoAlpha: 0 }, 0).set(L, { autoAlpha: 1, y: 30 }, tl2).to(L, { y: 0, duration: .45, ease: 'lr.out' }, tl2);
    const SO = X.$(`#${id}so`); if (SO) tl.set(SO, { autoAlpha: 0 }, 0).set(SO, { autoAlpha: 1, y: 24 }, tl2 + .2).to(SO, { y: 0, duration: .45, ease: 'lr.out' }, tl2 + .2);
    tl.to(COL, { scale: 1.02, duration: Math.max(.4, X.tOut - b - .2), ease: 'sine.inOut' }, b + .2);
    tl.to(COL, { autoAlpha: 0, y: -70, duration: .3, ease: 'lr.in' }, X.tOut);
  },
};
