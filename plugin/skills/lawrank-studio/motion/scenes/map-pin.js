/* map-pin: a stylised city map (blocks, avenues, a river, parks) drawn in the look. The map settles in, a pin drops on the
   office block with a ripple, and a label card names the place. thread: a round line-art lens; flat: a chunky deep-brand
   map; cards: a maps-app card; silhouette: a black woodcut map in a hard-shadowed frame. */
SCENES['map-pin'] = {
  label: 'Map pin', about: 'A stylised city map settles in; a pin drops on the office with a ripple and a card names the place.',
  good: 'where we are, local firm, serving your neighbourhood, come and see us', practice: 'any',
  fields: { head: 'optional headline above the map', place: 'the city or neighbourhood (said in the line)', label: 'optional small label on the card, e.g. "Our office"' },
  example: { say: 'We are right here in your community. Visit our office in downtown Knoxville.', head: 'Right here, **close to home.**',
    place: 'Downtown Knoxville', label: 'Our office' },
  sfx: (sc, X) => { const t = SCENES['map-pin'].tm(sc, X); return [{ kind: 'soft', at: X.tIn }, { kind: 'thud', at: t.land }, { kind: 'pop', at: t.card }]; },
  tm(sc, X) { const tp = X.times([sc.place])[0], land = Math.max(X.tIn + .7, tp - .15); return { land, card: Math.min(X.tOut - .5, Math.max(land + .3, tp + .1)) }; },
  geo(sc) { const top = sc.head ? 560 : 500; return { x: 90, y: top, w: 900, h: 840, px: 540, py: top + 420 }; },
  pal(LK) {
    const n = LK.name;
    if (n === 'thread') return { land: '#FFFFFF', block: '#FFFFFF', edge: LK.soft, ew: 3, park: mix(LK.soft, '#FFFFFF', .4), tree: LK.soft, water: mix(BT.accent, '#FFFFFF', .9),
      bank: mix(BT.accent, '#FFFFFF', .65), road: '#FFFFFF', casing: LK.fillC, office: mix(BT.accent, '#FFFFFF', .78), pin: BT.accent, pinIn: '#FFFFFF', frame: LK.line, roof: LK.fillB, car: LK.line };
    if (n === 'flat') return { land: LK.fillB, block: mix(LK.fillB, '#FFFFFF', .12), edge: 'none', ew: 0, park: mix(LK.fillB, '#FFFFFF', .2), tree: mix(LK.fillB, '#FFFFFF', .32),
      water: mix(LK.fillB, '#000000', .25), bank: mix(LK.fillB, '#000000', .25), road: mix(LK.bg, '#FFFFFF', .2), casing: null, office: '#FFFFFF', pin: '#FFFFFF', pinIn: LK.fillB, frame: null, roof: mix(LK.fillB, '#FFFFFF', .2), car: '#FFFFFF' };
    if (n === 'cards') return { land: '#F1EFEA', block: '#E4E1DA', edge: 'none', ew: 0, park: '#D3E4C8', tree: '#B9D3A8', water: '#C8DDEB', bank: '#B5CFE0',
      road: '#FFFFFF', casing: '#D9D5CD', office: mix(BT.accent, '#FFFFFF', .7), pin: BT.accent, pinIn: '#FFFFFF', frame: null, roof: '#DAD6CE', car: mix(BT.ink, '#FFFFFF', .3) };
    return { land: LK.surface, block: LK.ink, edge: 'none', ew: 0, park: LK.fillB, tree: LK.ink, water: LK.fillC, bank: LK.ink, road: LK.surface, casing: LK.ink,
      office: LK.accent, pin: LK.accent, pinIn: LK.surface, frame: LK.ink, roof: null, car: LK.ink };
  },
  map(G, P, id) {           // stage coordinates; a grid of blocks around the office block, rotated a little
    const r = seeded(23), { px, py } = G, bw = 134, bh = 112, sx = 170, sy = 150;
    let blocks = '', parks = '', roofs = '';
    for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
      const x = px - bw / 2 + i * sx, y = py - bh / 2 + j * sy;
      if (i === 0 && j === 0) continue;
      if (r() < .13 && Math.abs(i) + Math.abs(j) > 1) {
        parks += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="${P.ew ? 14 : 16}" fill="${P.park}" ${P.ew ? `stroke="${P.edge}" stroke-width="${P.ew}"` : ''}/>`;
        for (let k = 0; k < 3; k++) parks += `<circle cx="${(x + 28 + r() * (bw - 56)).toFixed(0)}" cy="${(y + 28 + r() * (bh - 56)).toFixed(0)}" r="${(12 + r() * 8).toFixed(0)}" fill="${P.ew ? 'none' : P.tree}" ${P.ew ? `stroke="${P.tree}" stroke-width="3"` : ''}/>`;
      } else {
        const split = r() < .35;      // some blocks are two buildings
        if (P.roof && r() < .45) roofs += `<rect x="${x + 22}" y="${y + 20}" width="${bw - 44}" height="${bh - 40}" rx="6" fill="${P.ew ? 'none' : P.roof}" ${P.ew ? `stroke="${P.roof}" stroke-width="3"` : ''}/>`;
        blocks += split ? `<rect class="mpb" x="${x}" y="${y}" width="${bw * .46}" height="${bh}" rx="10"/><rect class="mpb" x="${x + bw * .54}" y="${y}" width="${bw * .46}" height="${bh}" rx="10"/>`
          : `<rect class="mpb" x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12"/>`;
      }
    }
    const ay = py + bh / 2 + (sy - bh) / 2, ax = px - bw / 2 - (sx - bw) / 2 - sx, diag = `M${px - 900},${py + 760} L${px + 900},${py - 520}`;
    const river = `M${px - 1000},${py - 300} C${px - 560},${py - 380} ${px - 300},${py - 190} ${px + 60},${py - 250} C${px + 420},${py - 310} ${px + 600},${py - 470} ${px + 1000},${py - 430}`;
    const road = d => (P.casing ? `<path d="${d}" fill="none" stroke="${P.casing}" stroke-width="54" stroke-linecap="round"/>` : '') + `<path class="mpr" d="${d}" fill="none" stroke="${P.road}" stroke-width="${P.casing ? 42 : 46}" stroke-linecap="round"/>`;
    return `<g id="${id}cam"><rect x="${px - 1300}" y="${py - 1300}" width="2600" height="2600" fill="${P.land}"/>
      <g transform="rotate(-14 ${px} ${py})">
        <g fill="${P.block}" ${P.ew ? `stroke="${P.edge}" stroke-width="${P.ew}"` : ''}>${blocks}</g>${roofs}${parks}
        <path d="${river}" fill="none" stroke="${P.bank}" stroke-width="${P.ew ? 150 : 140}" stroke-linecap="round"/>
        <path d="${river}" fill="none" stroke="${P.water}" stroke-width="${P.ew ? 142 : 116}" stroke-linecap="round"/>
        ${road(`M${px - 1100},${ay} L${px + 1100},${ay}`)}${road(`M${ax},${py - 1100} L${ax},${py + 1100}`)}${road(diag)}
        <g id="${id}cars">${[-700, -260, 380].map((d, k) => `<rect class="mpc" x="${px + d}" y="${ay - (k % 2 ? 16 : -4)}" width="34" height="18" rx="6" fill="${P.car}"/>`).join('')}</g>
        <rect id="${id}off" x="${px - bw / 2}" y="${py - bh / 2}" width="${bw}" height="${bh}" rx="12" fill="${P.office}" ${P.ew ? `stroke="${BT.accent}" stroke-width="4"` : ''}/>
      </g></g>`;
  },
  html(sc, X) {
    const LK = X.LK, n = LK.name, G = this.geo(sc), P = this.pal(LK), id = X.id;
    const { x, y, w, h, px, py } = G, cx = x + w / 2, cy = y + h / 2;
    const clip = n === 'thread' ? `<circle cx="${cx}" cy="${cy}" r="${h / 2}"/>` : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${n === 'silhouette' ? 0 : n === 'flat' ? 64 : LK.radius}"/>`;
    const sh = n === 'cards' ? `<feDropShadow dx="0" dy="34" stdDeviation="34" flood-color="#1E140A" flood-opacity=".22"/>`
      : n === 'flat' ? `<feDropShadow dx="0" dy="16" stdDeviation="0" flood-color="${mix(LK.bg, '#000000', .25)}" flood-opacity="1"/>`
      : n === 'silhouette' ? `<feDropShadow dx="16" dy="18" stdDeviation="0" flood-color="#000" flood-opacity=".16"/>` : `<feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#14181C" flood-opacity=".10"/>`;
    const frame = n === 'thread' ? `<circle cx="${cx}" cy="${cy}" r="${h / 2}" fill="none" stroke="${P.frame}" stroke-width="${LK.stroke}"/>`
      : n === 'silhouette' ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${P.frame}" stroke-width="14"/>` : '';
    const pinS = 1.55, pin = `<g id="${id}pin"><g id="${id}pinb"><path d="${pinPath(px, py, pinS)}" fill="${P.pin}" ${n === 'thread' ? `stroke="${mix(BT.accent, '#000000', .2)}" stroke-width="3"` : ''}/>
        <circle cx="${px}" cy="${py - 70 * pinS}" r="${n === 'thread' ? 26 : 22}" fill="${P.pinIn}"/></g></g>`;
    const ring = k => `<ellipse class="mpring" cx="${px}" cy="${py}" rx="70" ry="28" fill="none" stroke="${n === 'flat' ? '#FFFFFF' : n === 'silhouette' ? LK.ink : BT.accent}" stroke-width="${6 - k}"/>`;
    // label card
    const cw = 820, cxl = 540 - cw / 2, ctop = y + h - 150, dark = n === 'silhouette';
    const cbg = dark ? LK.ink : '#FFFFFF', cfg = dark ? '#F8F6F1' : (n === 'thread' ? LK.ink : BT.ink);
    const tile = n === 'flat' ? LK.fillB : n === 'silhouette' ? LK.accent : BT.accent, tileIc = contrast('#FFFFFF', tile) >= 3 ? '#FFFFFF' : BT.ink;
    const lab = sc.label ? `<div data-qa="text" style="font:700 30px/1.1 var(--body);letter-spacing:.1em;text-transform:uppercase;color:${readable(dark ? mix(BT.accent, '#FFFFFF', .35) : BT.accent, cbg, 4.5)};margin-bottom:10px">${esc(sc.label)}</div>` : '';
    const place = `<div data-qa="text" style="font:${LK.headWeight} ${sc.place.length > 22 ? 50 : 58}px/1.08 var(--head);color:${cfg};${LK.headCase === 'upper' ? 'text-transform:uppercase;' : ''}">${accentize(sc.place, 'ka')}</div>`;
    const cshadow = n === 'silhouette' ? '14px 16px 0 rgba(0,0,0,.18)' : n === 'flat' ? `0 14px 0 ${mix(LK.bg, '#000000', .25)}` : n === 'cards' ? LK.shadow : '0 24px 50px rgba(20,24,28,.14)';
    const card = `<div id="${id}card" class="k-abs" style="left:${cxl}px;top:${ctop}px;width:${cw}px;padding:34px 40px;display:flex;align-items:center;gap:34px;background:${cbg};
        border-radius:${n === 'silhouette' ? 0 : n === 'cards' ? 32 : 28}px;box-shadow:${cshadow};${n === 'thread' ? `border:1px solid ${LK.soft};` : ''}">
        <div id="${id}tile" style="flex:none;width:112px;height:112px;border-radius:${n === 'silhouette' ? 0 : 28}px;background:${tile};display:flex;align-items:center;justify-content:center">${icon('map', 68, tileIc, tileIc)}</div>
        <div style="flex:1;min-width:0">${lab}${place}</div></div>`;
    return `${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 330, w: 920, size: 84, align: 'center' }) : ''}
      <svg class="svgL" viewBox="0 0 1080 1920"><defs><clipPath id="${id}clip">${clip}</clipPath><filter id="${id}sh" x="-20%" y="-20%" width="140%" height="140%">${sh}</filter>
        <filter id="${id}psh" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#000" flood-opacity=".22"/></filter>
        </defs>
        <g id="${id}win"><g filter="url(#${id}sh)"><g clip-path="url(#${id}clip)">${this.map(G, P, id)}
          <g id="${id}rip">${ring(0)}${ring(1)}${ring(2)}</g>
          <ellipse id="${id}psd" cx="${px}" cy="${py + 2}" rx="34" ry="12" fill="#000" fill-opacity=".22"/></g></g>${frame}</g>
        <g ${n === 'silhouette' || n === 'flat' ? '' : `filter="url(#${id}psh)"`}>${pin}</g>
      </svg>${card}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, G = this.geo(sc), id = X.id, T = this.tm(sc, X), q = s => X.q(s), { px, py } = G;
    if (sc.head) X.head(`#${id}h`, X.tIn);
    // the map rises in and the camera settles onto the office from a wider, tilted view
    tl.set(q(`#${id}win`), { autoAlpha: 0 }, 0).set(q(`#${id}win`), { autoAlpha: 1, y: 140 }, X.tIn - .15).to(q(`#${id}win`), { y: 0, duration: .6, ease: 'lr.out' }, X.tIn - .15);
    tl.fromTo(q(`#${id}cam`), { scale: 1.45, rotation: 8, svgOrigin: `${px} ${py}` }, { scale: 1, rotation: 0, svgOrigin: `${px} ${py}`, duration: Math.max(1, T.land - X.tIn + .2), ease: 'lr.move', immediateRender: true }, X.tIn - .15);
    tl.to(q(`#${id}cam`), { scale: 1.08, svgOrigin: `${px} ${py}`, duration: Math.max(.5, X.tOut - T.land - .2), ease: 'sine.inOut' }, T.land + .2);
    tl.fromTo(q('.mpr'), { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: .9, ease: 'lr.out', stagger: .12, immediateRender: true }, X.tIn);
    // office block lights up, the pin drops onto it, ripples spread
    tl.fromTo(q(`#${id}off`), { scale: .6, svgOrigin: `${px} ${py}`, opacity: 0 }, { scale: 1, svgOrigin: `${px} ${py}`, opacity: 1, duration: .4, ease: 'back.out(2)', immediateRender: true }, T.land - .05);
    tl.set(q(`#${id}pin`), { autoAlpha: 0 }, 0).set(q(`#${id}pin`), { autoAlpha: 1, y: -300 }, T.land - .42).to(q(`#${id}pin`), { y: 0, duration: .42, ease: 'power3.in' }, T.land - .42);
    tl.fromTo(q(`#${id}pinb`), { scaleY: 1, scaleX: 1, svgOrigin: `${px} ${py}` }, { keyframes: [{ scaleY: .78, scaleX: 1.14, duration: .09, ease: 'power2.out' }, { scaleY: 1, scaleX: 1, duration: .5, ease: 'elastic.out(1,.45)' }], svgOrigin: `${px} ${py}`, immediateRender: true }, T.land);
    tl.fromTo(q(`#${id}psd`), { scale: .2, opacity: 0, svgOrigin: `${px} ${py}` }, { scale: 1, opacity: 1, svgOrigin: `${px} ${py}`, duration: .42, ease: 'power3.in', immediateRender: true }, T.land - .42);
    [...X.$(`#${id}rip`).querySelectorAll('.mpring')].forEach((r, k) => {
      tl.set(r, { opacity: 0 }, 0).fromTo(r, { scale: .4, opacity: .95, svgOrigin: `${px} ${py}` }, { scale: 3.2, opacity: 0, svgOrigin: `${px} ${py}`, duration: 1.3, ease: 'power2.out', immediateRender: false }, T.land + .05 + k * .22);
    });
    tl.to(q(`#${id}pin`), { y: -14, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: Math.max(0, Math.floor((X.tOut - T.land - 1) / 1.1)) }, T.land + .8);
    tl.fromTo(q('.mpc'), { x: 0 }, { x: i => [520, 380, 300][i], duration: X.tOut - X.tIn + .3, ease: 'none', immediateRender: true }, X.tIn - .15);
    if (LK.thread) X.dot(px, py - 70 * 1.55 - 14 * 0, T.land + .05, { r: 18 });
    // the card
    const card = q(`#${id}card`);
    tl.set(card, { autoAlpha: 0 }, 0).set(card, { autoAlpha: 1, y: 90, scale: .94, transformOrigin: '50% 0%' }, T.card).to(card, { y: 0, scale: 1, duration: .5, ease: 'lr.out' }, T.card);
    tl.fromTo(q(`#${id}tile`), { scale: 0, rotation: -20 }, { scale: 1, rotation: 0, duration: .45, ease: 'back.out(2)', immediateRender: true }, T.card + .12);
    // exit
    tl.to(card, { autoAlpha: 0, y: 40, duration: .28, ease: 'lr.in' }, X.tOut);
    tl.to([q(`#${id}win`), q(`#${id}pin`)], { autoAlpha: 0, duration: .3, ease: 'lr.in' }, X.tOut + .05);
  },
};
