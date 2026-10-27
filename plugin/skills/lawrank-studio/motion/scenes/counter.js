/* counter: one big number rolls up digit by digit (an odometer) and lands on the word that says it, with its label and
   a supporting line. Thread: a ruler scrolls under it and the dot lands on the pointer; flat: a chunky slab pops behind
   it with a burst; cards: a white stat card with a filling meter and a floating note; silhouette: a black slab, paper digits. */
SCENES.counter = {
  label: 'Number counter', about: 'A big number rolls up digit by digit to its value as it is spoken, with a label and a supporting line.',
  good: 'years serving a city, number of steps, languages spoken, offices: one approved number (never results or money won)', practice: 'any',
  fields: { head: 'optional headline above (2-5 words)', value: 'the number (an approved fact the firm can state; never a result)',
    prefix: 'optional, before the number (e.g. "#")', suffix: 'optional, after the number (e.g. "+", "%")',
    label: 'what the number counts (2-5 words)', note: 'optional supporting line (4-9 words)', icon: 'optional icon for the cards look (e.g. clock, map, users)' },
  example: { say: "For over 25 years, we've served families right here in Knoxville.", head: 'Rooted **here**',
    value: 25, suffix: '+', label: 'years serving Knoxville', note: 'Local courts. Local roots.', icon: 'clock' },
  sfx: (sc, X) => { const r = SCENES.counter.cnTimes(sc, X); return [{ kind: 'soft', at: r.a }, { kind: 'clink', at: r.b }]; },
  cnTimes(sc, X) {
    const a = X.tIn + .2, said = X.times([String(sc.value), sc.label])[0];
    return { a, b: Math.min(X.tOut - 1, Math.max(a + 1.1, said + .35)) };
  },
  cnFmt(v) { const s = String(v), m = s.match(/^(-?)(\d+)(\.\d+)?$/); return m ? m[1] + m[2].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (m[3] || '') : s; },
  html(sc, X) {
    const LK = X.LK, nm = LK.name, up = LK.headCase === 'upper', val = SCENES.counter.cnFmt(sc.value);
    const all = (sc.prefix || '') + val + (sc.suffix || ''), fs = Math.round(Math.min(nm === 'cards' ? 300 : 340, 800 / (all.length * .66)));
    const numInk = nm === 'silhouette' ? LK.surface : nm === 'flat' ? (contrast('#FFFFFF', LK.fillB) >= 3 ? '#FFFFFF' : BT.ink) : nm === 'cards' ? LK.surfaceInk : LK.ink;
    const accInk = nm === 'silhouette' ? readable(BT.accent, LK.ink, 3) : nm === 'flat' ? numInk
      : nm === 'cards' ? readable(BT.accent, '#FFFFFF', 3) : LK.accentText;
    // digits: each sits in a 1-row mask over a strip 0..9 (repeated), so it can roll; the rightmost spins most
    const digs = [...val].filter(c => /\d/.test(c)).length; let di = 0;
    const cells = [...val].map(c => { if (!/\d/.test(c)) return `<span class="cnx">${esc(c)}</span>`;
      const pl = digs - 1 - di, spins = pl === 0 ? 2 : pl === 1 ? 1 : 0; di++;
      const seq = []; for (let k = 0; k < spins * 10 + +c + 1; k++) seq.push(k % 10);
      return `<span class="cnd" data-n="${seq.length - 1}" style="display:inline-block;height:1.1em;overflow:hidden;vertical-align:top">
        <span class="cns" style="display:block">${seq.map((d, k) => k === seq.length - 1 ? `<span style="display:block;height:1.1em">${d}</span>` : `<span class="cnr" data-d="${d}" style="display:block;height:1.1em"></span>`).join('')}</span></span>`; }).join('');
    const num = `<div id="${X.id}n" data-qa="text" style="position:relative;white-space:nowrap;font:${nm === 'thread' ? 700 : 800} ${fs}px/1.1 var(--head);
      color:${numInk};font-variant-numeric:tabular-nums lining-nums;letter-spacing:-.02em;display:flex;justify-content:center">
      ${sc.prefix ? `<span id="${X.id}pf" style="display:inline-block;color:${accInk}">${esc(sc.prefix)}</span>` : ''}<span style="display:inline-block">${cells}</span>${sc.suffix ? `<span id="${X.id}sf" style="display:inline-block;color:${accInk}">${esc(sc.suffix)}</span>` : ''}</div>`;
    const labInk = nm === 'cards' ? LK.surfaceInk : LK.ink;
    const lab = `<div id="${X.id}l" data-qa="text" style="font:${LK.headWeight} ${nm === 'cards' ? 52 : 58}px/1.15 var(--head);color:${labInk};text-align:center;max-width:860px;
      ${up ? 'text-transform:uppercase;letter-spacing:.04em;' : ''}">${accentize(sc.label, 'ka')}</div>`;
    const noteInk = nm === 'cards' ? mix(LK.surfaceInk, '#FFFFFF', .2) : nm === 'flat' ? LK.ink : LK.sub;
    const note = sc.note ? `<div id="${X.id}o" data-qa="text" style="font:500 42px/1.3 var(--body);color:${noteInk};text-align:center;max-width:820px">${esc(sc.note)}</div>` : '';
    const head = sc.head ? UI.head(LK, { id: X.id + 'h', text: sc.head, x: 80, y: 340, w: 920, size: 92, align: 'center' }) : '';
    const top = sc.head ? 600 : 470, H = 1500 - top;
    if (nm === 'cards') {
      const ic = sc.icon || 'check', chip = mix(BT.accent, '#FFFFFF', .88);
      return `<style>.cnr::before{content:attr(data-d)}</style>${head}<div id="${X.id}c" class="k-abs" style="left:100px;top:${top + 30}px;width:880px;padding:70px 60px 80px;background:${LK.surface};border-radius:${LK.radius}px;
          box-shadow:${LK.shadow};border:${LK.edge};display:flex;flex-direction:column;align-items:center;gap:26px">
          <div id="${X.id}i" style="width:120px;height:120px;border-radius:32px;background:${chip};display:flex;align-items:center;justify-content:center">${UI.icon(LK, ic, 72, BT.ink, BT.accent)}</div>
          ${num}${lab}
          <div style="position:relative;width:640px;height:16px;border-radius:8px;background:${LK.soft};margin-top:22px;overflow:hidden"><div id="${X.id}m" style="position:absolute;inset:0;border-radius:8px;background:${BT.accent};transform-origin:0 50%"></div></div>
        </div>
        ${sc.note ? `<div id="${X.id}nc" class="k-abs" style="left:220px;width:760px;padding:34px 40px;background:${LK.surface};border-radius:28px;box-shadow:${LK.shadow};
          display:flex;align-items:center;gap:26px">${UI.icon(LK, 'check', 54, BT.accent, BT.accent)}<div id="${X.id}o" data-qa="text" style="font:600 40px/1.25 var(--body);color:${LK.surfaceInk}">${esc(sc.note)}</div></div>` : ''}`;
    }
    let deco = '';
    if (nm === 'thread') {
      let ticks = ''; for (let i = 0; i <= 120; i++) { const x = i * 22, big = i % 5 === 0; ticks += `<line x1="${x}" y1="${big ? 0 : 14}" x2="${x}" y2="44" stroke="${big ? LK.line : LK.fillC}" stroke-width="${big ? 4 : 3}" stroke-linecap="round"/>`; }
      deco = `<div id="${X.id}r" style="position:relative;width:860px;height:110px;-webkit-mask:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent);mask:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent)">
        <svg width="860" height="110" style="position:absolute;left:0;top:0;overflow:visible"><g id="${X.id}rt" transform="translate(0,40)">${ticks}</g>
        <line x1="0" y1="84" x2="860" y2="84" stroke="${LK.fillC}" stroke-width="3"/></svg>
        <svg width="860" height="110" style="position:absolute;left:0;top:0;overflow:visible"><path id="${X.id}rp" d="M430 30 L430 96" stroke="${BT.accent}" stroke-width="7" stroke-linecap="round"/></svg></div>`;
    }
    const slab = nm === 'flat' ? `<div id="${X.id}s2" class="k-abs" style="background:${LK.fillC};border-radius:${LK.radius * 2.4}px"></div><div id="${X.id}s" class="k-abs" style="background:${LK.fillB};border-radius:${LK.radius * 2.4}px"></div>
        ${[0, 1, 2, 3, 4, 5, 6].map(i => `<div class="cnc k-abs" style="width:${[46, 30, 38, 26, 44, 32, 28][i]}px;height:${[46, 30, 38, 26, 18, 32, 28][i]}px;background:${i % 2 ? LK.fillA : LK.fillC};border-radius:${i % 3 === 0 ? '50%' : i % 3 === 1 ? '6px' : '0'}"></div>`).join('')}`
      : nm === 'silhouette' ? `<div id="${X.id}s" class="k-abs" style="background:${LK.ink};box-shadow:${LK.shadow}"></div>` : '';
    const rule = nm === 'silhouette' ? `<div id="${X.id}u" style="width:180px;height:14px;background:${LK.accent}"></div>` : '';
    return `<style>.cnr::before{content:attr(data-d)}</style>${head}${slab}<div id="${X.id}col" class="k-abs" style="left:70px;top:${top}px;width:940px;height:${H}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${nm === 'silhouette' ? 56 : nm === 'flat' ? 96 : 34}px">
      ${num}${deco}${rule}${lab}${note}</div>`;
  },
  build(tl, sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, { a, b } = SCENES.counter.cnTimes(sc, X), N = X.$(`#${id}n`);
    const st = N.closest('.stage'), rel = MK.rel(st), fs = parseFloat(getComputedStyle(N).fontSize), row = fs * 1.1, dur = b - a;
    if (sc.head) X.head(`#${id}h`, X.tIn);
    // the roll: every digit strip spins down to its final row; the rightmost digit lands last, like an odometer
    const ds = [...N.querySelectorAll('.cnd')];
    tl.set(N, { autoAlpha: 0 }, 0).set(N, { autoAlpha: 1, y: 60 }, a - .15).to(N, { y: 0, duration: .55, ease: 'lr.out' }, a - .15);
    ds.forEach((d, i) => { const s = d.querySelector('.cns'), n = +d.dataset.n, late = (ds.length - 1 - i) * .12;
      tl.set(s, { y: 0 }, 0).to(s, { y: -n * row, duration: Math.max(.6, dur - late), ease: 'power3.inOut' }, a); });
    if (sc.prefix) tl.set(`#${id}pf`, { x: -40 }, 0).to(`#${id}pf`, { x: 0, duration: .5, ease: 'lr.out' }, a - .15);
    if (sc.suffix) tl.set(`#${id}sf`, { scale: 0, transformOrigin: '20% 80%' }, 0).to(`#${id}sf`, { scale: 1, duration: .45, ease: 'back.out(2.4)' }, b - .05);
    tl.to(N, { scale: 1.035, duration: Math.max(.5, X.tOut - b - .1), ease: 'sine.inOut' }, b + .1);   // a slow settle while it holds
    // label and note follow the number
    const L = `#${id}l`, O = `#${id}o`, tl2 = Math.min(b, X.tOut - .8);
    tl.set(L, { autoAlpha: 0 }, 0).set(L, { autoAlpha: 1, y: 40 }, Math.max(X.tIn, tl2 - .5)).to(L, { y: 0, duration: .5, ease: 'lr.out' }, Math.max(X.tIn, tl2 - .5));
    const tn = Math.min(X.tOut - .7, b + .45);
    if (nm === 'cards') {
      const C = `#${id}c`; tl.set(C, { autoAlpha: 0 }, 0).set(C, { autoAlpha: 1, y: 140, rotation: -2 }, X.tIn - .1).to(C, { y: 0, rotation: 0, duration: .6, ease: 'lr.out' }, X.tIn - .1);
      tl.set(`#${id}i`, { scale: 0 }, 0).to(`#${id}i`, { scale: 1, duration: .4, ease: 'back.out(2)' }, X.tIn + .15);
      tl.set(`#${id}m`, { scaleX: 0 }, 0).to(`#${id}m`, { scaleX: 1, duration: dur, ease: 'power3.inOut' }, a);
      if (sc.note) { const nc = X.$(`#${id}nc`), cr = rel(X.$(C)); nc.style.top = (cr.y + cr.h - 40) + 'px';
        tl.set(nc, { autoAlpha: 0 }, 0).set(nc, { autoAlpha: 1, y: 90, rotation: 3 }, tn).to(nc, { y: 0, rotation: -1.5, duration: .55, ease: 'lr.out' }, tn);
        tl.to(nc, { autoAlpha: 0, y: -40, duration: .28, ease: 'lr.in' }, X.tOut); }
      tl.to(C, { autoAlpha: 0, y: -60, duration: .3, ease: 'lr.in' }, X.tOut);
      return;
    }
    if (sc.note) tl.set(O, { autoAlpha: 0 }, 0).set(O, { autoAlpha: 1, y: 30 }, tn).to(O, { y: 0, duration: .45, ease: 'lr.out' }, tn);
    const nr = rel(N);
    if (nm === 'thread') {
      tl.set(`#${id}r`, { autoAlpha: 0 }, 0).set(`#${id}r`, { autoAlpha: 1, y: 20 }, a - .1).to(`#${id}r`, { y: 0, duration: .5, ease: 'lr.out' }, a - .1);
      tl.set(`#${id}rt`, { x: 0 }, 0).to(`#${id}rt`, { x: -22 * 5 * 14, duration: dur, ease: 'power3.inOut' }, a);
      tl.set(`#${id}rp`, { drawSVG: '0%' }, 0).to(`#${id}rp`, { drawSVG: '100%', duration: .4, ease: 'lr.out' }, b - .2);
      const pr = rel(X.$(`#${id}r`)); X.dot(540, pr.y + 18, b, { r: 18 });
    }
    if (nm === 'flat' || nm === 'silhouette') {
      const S = X.$(`#${id}s`), padX = nm === 'flat' ? 90 : 70, padY = nm === 'flat' ? 40 : 30, w = Math.max(nr.w + padX * 2, 520);
      const box = { x: 540 - w / 2, y: nr.y - padY, w, h: nr.h + padY * 2 };
      Object.assign(S.style, { left: box.x + 'px', top: box.y + 'px', width: box.w + 'px', height: box.h + 'px' });
      if (nm === 'flat') {
        const S2 = X.$(`#${id}s2`); Object.assign(S2.style, { left: box.x + 26 + 'px', top: box.y + 34 + 'px', width: box.w + 'px', height: box.h + 'px' });
        tl.set([S, S2], { autoAlpha: 0 }, 0).set(S, { autoAlpha: 1, scale: .3, rotation: -8, transformOrigin: '50% 50%' }, a - .25).to(S, { scale: 1, rotation: -2, duration: .55, ease: 'back.out(1.6)' }, a - .25);
        tl.set(S2, { autoAlpha: 1, scale: .3, rotation: 6, transformOrigin: '50% 50%' }, a - .15).to(S2, { scale: 1, rotation: 3, duration: .55, ease: 'back.out(1.6)' }, a - .15);
        // a burst of chunky confetti when the number lands
        const cs = [...X.$('.cnc').parentElement.querySelectorAll('.cnc')], ang = [-160, -120, -60, -20, 30, 150, 200];
        cs.forEach((c, i) => { const r = 330 + (i % 3) * 70, ax = ang[i] * Math.PI / 180, tx = 540 + Math.cos(ax) * (box.w / 2 + 40) - 20, ty = box.y + box.h / 2 + Math.sin(ax) * (box.h / 2 + 90) - 20;
          Object.assign(c.style, { left: '520px', top: box.y + box.h / 2 - 20 + 'px' });
          tl.set(c, { autoAlpha: 0 }, 0).set(c, { autoAlpha: 1, scale: 0, x: 0, y: 0, rotation: 0 }, b - .05)
            .to(c, { scale: 1, x: tx - 520, y: ty - (box.y + box.h / 2 - 20), rotation: (i % 2 ? 1 : -1) * 140, duration: .7, ease: 'expo.out' }, b - .05)
            .to(c, { y: '+=30', rotation: '+=40', duration: Math.max(.5, X.tOut - b - .7), ease: 'sine.inOut' }, b + .65); void r; });
        tl.to(cs, { autoAlpha: 0, scale: 0, duration: .25, ease: 'lr.in' }, X.tOut);
        tl.to([S, S2], { autoAlpha: 0, scale: .9, duration: .3, ease: 'lr.in' }, X.tOut);
      } else {
        tl.set(S, { autoAlpha: 0 }, 0).set(S, { autoAlpha: 1, scaleX: 0, transformOrigin: '0% 50%' }, a - .3).to(S, { scaleX: 1, duration: .5, ease: 'power3.out' }, a - .3);
        tl.set(`#${id}u`, { scaleX: 0, transformOrigin: '0% 50%' }, 0).to(`#${id}u`, { scaleX: 1, duration: .4, ease: 'power3.out' }, b);
        tl.to(S, { scaleX: 0, transformOrigin: '100% 50%', duration: .3, ease: 'lr.in' }, X.tOut);
      }
    }
    tl.to(`#${id}col`, { autoAlpha: 0, y: -60, duration: .3, ease: 'lr.in' }, X.tOut);
  },
};
