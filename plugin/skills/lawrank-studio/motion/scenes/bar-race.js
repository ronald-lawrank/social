/* bar-race: 3-4 labelled horizontal bars grow to their relative sizes, each on the word that says it; one bar is the
   accent. Thread: line-art strokes that draw, the dot lands at the end of the accent bar; flat: chunky pills that pop;
   cards: a white panel with UI meters and icon chips; silhouette: black slabs with hard shadows on an axis rule. */
SCENES['bar-race'] = {
  label: 'Bar chart', about: 'Three or four labelled bars grow to their sizes as each is spoken; one bar is picked out in the accent colour.',
  good: 'what a claim can include, where time goes, parts of a process (relative sizes; never comparisons with other firms or results)', practice: 'any',
  fields: { head: 'optional headline above (2-6 words)', bars: '[{label, value, icon?}] 3-4 bars, each label said in the line, in order; values are relative sizes',
    highlight: 'index (0-based) of the bar in the accent colour', unit: 'optional; when given, each value is shown with it (e.g. "%"); leave out for relative sizes',
    icon: 'optional per bar (hospital, briefcase, home, heart, clock, doc, ...): shown in the cards look' },
  example: { say: 'A claim can include medical care, lost wages, repairs, and pain and suffering.', head: 'What a claim can **include**',
    bars: [{ label: 'Medical care', value: 88, icon: 'hospital' }, { label: 'Lost wages', value: 62, icon: 'briefcase' },
      { label: 'Repairs', value: 44, icon: 'home' }, { label: 'Pain and suffering', value: 74, icon: 'heart' }], highlight: 3 },
  sfx: (sc, X) => X.times(sc.bars.map(b => b.label)).map(t => ({ kind: 'pop', at: t + .1 })),
  html(sc, X) {
    const LK = X.LK, nm = LK.name, up = LK.headCase === 'upper', n = sc.bars.length, hi = sc.highlight ?? 0;
    const max = Math.max(...sc.bars.map(b => +b.value || 0), 1), top = sc.head ? (nm === 'cards' ? 610 : 640) : 480;
    const inner = nm === 'cards' ? { x: 190, w: 740 } : { x: nm === 'silhouette' ? 120 : 90, w: nm === 'silhouette' ? 860 : 900 };
    const rowH = Math.min(nm === 'cards' ? 210 : 250, (1530 - top - (nm === 'cards' ? 130 : 50)) / n), barH = nm === 'thread' ? 36 : nm === 'cards' ? 50 : 80;
    const labInk = nm === 'cards' ? LK.surfaceInk : LK.ink;
    const barCol = i => i === hi ? (nm === 'flat' ? LK.fillB : nm === 'silhouette' ? LK.accent : BT.accent)
      : nm === 'thread' ? LK.line : nm === 'flat' ? LK.fillA : nm === 'cards' ? mix(BT.ink, '#FFFFFF', .72) : LK.ink;
    const valTx = b => sc.unit ? esc(String(b.value) + sc.unit) : '';
    const rows = sc.bars.map((b, i) => {
      const w = Math.max(110, inner.w * (+b.value || 0) / max), y = top + (nm === 'cards' ? 60 : 0) + i * rowH, ly = y, by = y + (nm === 'cards' ? 72 : 74);
      const ic = nm === 'cards' && b.icon ? `<div style="position:absolute;left:-100px;top:-6px;width:84px;height:84px;border-radius:24px;background:${i === hi ? mix(BT.accent, '#FFFFFF', .86) : LK.soft};display:flex;align-items:center;justify-content:center">${UI.icon(LK, b.icon, 50, BT.ink, BT.accent)}</div>` : '';
      const lab = `<div class="brL" data-qa="text" style="position:absolute;left:${inner.x}px;top:${ly}px;width:${inner.w - (sc.unit ? 190 : 0)}px;font:${i === hi ? 800 : LK.headWeight} ${(nm === 'cards' ? 44 : 52) - (sc.bars.some(x => String(x.label).length > (sc.unit ? 20 : 26)) ? 6 : 0)}px/1.1 var(--head);color:${labInk};white-space:nowrap;overflow:visible;
        ${up ? 'text-transform:uppercase;letter-spacing:.03em;font-size:${sc.bars.some(x => String(x.label).length > (sc.unit ? 18 : 24)) ? 38 : 46}px;' : ''}">${esc(b.label)}</div>`;
      const val = sc.unit ? `<div class="brV" data-qa="text" style="position:absolute;left:${inner.x + inner.w - 160}px;top:${ly}px;width:160px;text-align:right;font:800 44px/1.1 var(--head);color:${i === hi ? (nm === 'cards' ? readable(BT.accent, '#FFFFFF', 3) : LK.accentText) : labInk}">${valTx(b)}</div>` : '';
      let bar;
      if (nm === 'thread') bar = `<svg class="k-abs" style="left:${inner.x - 20}px;top:${by - 20}px;overflow:visible" width="${inner.w + 40}" height="${barH + 40}">
          <line x1="20" y1="35" x2="${inner.w + 20}" y2="35" stroke="${LK.soft}" stroke-width="4" stroke-linecap="round"/>
          <line class="brB" x1="35" y1="35" x2="${w + 5}" y2="35" stroke="${barCol(i)}" stroke-width="${barH}" stroke-linecap="round"/></svg>`;
      else {
        const track = nm === 'silhouette' ? '' : `<div class="k-abs" style="left:${inner.x}px;top:${by}px;width:${inner.w}px;height:${barH}px;border-radius:${barH / 2}px;background:${nm === 'flat' ? LK.soft : LK.soft}"></div>`;
        const sh = nm === 'flat' ? `box-shadow:0 10px 0 ${mix(barCol(i), '#000000', .22)};` : nm === 'silhouette' ? `box-shadow:${LK.shadow};` : i === hi ? `box-shadow:0 10px 24px ${mix(BT.accent, '#FFFFFF', .4)};` : '';
        bar = `${track}<div class="brB k-abs" style="left:${inner.x}px;top:${by}px;width:${w}px;height:${barH}px;border-radius:${nm === 'silhouette' ? 0 : barH / 2}px;background:${barCol(i)};${sh}"></div>`;
      }
      return `<div class="brR" data-hi="${i === hi ? 1 : 0}">${ic ? `<div class="k-abs brI" style="left:${inner.x}px;top:${ly}px">${ic}</div>` : ''}${lab}${val}${bar}</div>`;
    }).join('');
    const head = sc.head ? UI.head(LK, { id: X.id + 'h', text: sc.head, x: 80, y: 340, w: 920, size: 88 }) : '';
    const panel = nm === 'cards' ? `<div id="${X.id}c" class="k-abs" style="left:60px;top:${top}px;width:960px;height:${(n - 1) * rowH + 60 + 72 + barH + 70}px;background:${LK.surface};border-radius:${LK.radius}px;box-shadow:${LK.shadow};border:${LK.edge}"></div>` : '';
    const grid = nm === 'thread' ? `<svg id="${X.id}g" class="k-abs" style="left:0;top:0" width="1080" height="1920">${[0, 1, 2, 3, 4].map(k => `<line class="brG" x1="${inner.x + k * inner.w / 4}" y1="${top - 30}" x2="${inner.x + k * inner.w / 4}" y2="${top + (n - 1) * rowH + 78 + barH + 30}" stroke="${LK.soft}" stroke-width="3" stroke-dasharray="${k ? '4 14' : 'none'}" stroke-linecap="round"/>`).join('')}</svg>` : '';
    const axis = nm === 'silhouette' ? `<div id="${X.id}ax" class="k-abs" style="left:${inner.x - 34}px;top:${top - 20}px;width:12px;height:${(n - 1) * rowH + 78 + barH + 40}px;background:${LK.ink}"></div>` : '';
    return `${head}${panel}${grid}${axis}<div id="${X.id}b" class="k-abs" style="left:0;top:0;width:1080px;height:1920px">${rows}</div>`;
  },
  build(tl, sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, ts = X.times(sc.bars.map(b => b.label)), rows = [...X.$(`#${id}b`).querySelectorAll('.brR')];
    const rel = MK.rel(X.$(`#${id}b`).closest('.stage')), last = ts[ts.length - 1], hiT = Math.min(X.tOut - .6, last + .7);
    if (sc.head) X.head(`#${id}h`, X.tIn);
    if (nm === 'cards') { const C = `#${id}c`; tl.set(C, { autoAlpha: 0 }, 0).set(C, { autoAlpha: 1, y: 140 }, X.tIn - .1).to(C, { y: 0, duration: .6, ease: 'lr.out' }, X.tIn - .1); tl.to(C, { autoAlpha: 0, y: -60, duration: .3, ease: 'lr.in' }, X.tOut); }
    if (nm === 'silhouette') { const A = `#${id}ax`; tl.set(A, { autoAlpha: 0 }, 0).set(A, { autoAlpha: 1, scaleY: 0, transformOrigin: '50% 0%' }, X.tIn).to(A, { scaleY: 1, duration: .6, ease: 'power3.out' }, X.tIn); tl.to(A, { scaleY: 0, transformOrigin: '50% 100%', duration: .3, ease: 'lr.in' }, X.tOut); }
    if (nm === 'thread') { const G = X.$(`#${id}g`), gl = [...G.querySelectorAll('.brG')]; tl.set(gl, { drawSVG: '0%' }, 0).to(gl, { drawSVG: '100%', duration: .7, ease: 'lr.out', stagger: .06 }, X.tIn); tl.to(G, { autoAlpha: 0, duration: .3, ease: 'lr.in' }, X.tOut); tl.set(G, { autoAlpha: 1 }, 0); }
    rows.forEach(r => { const L = r.querySelector('.brL'); let f = parseFloat(getComputedStyle(L).fontSize);   // long labels shrink to their column
      while (L.scrollWidth > L.clientWidth + 1 && f > 32) { f -= 2; L.style.fontSize = f + 'px'; } });
    { const Ls = rows.map(r => r.querySelector('.brL')), m = Math.min(...Ls.map(L => parseFloat(L.style.fontSize) || 99)); if (m < 99) Ls.forEach(L => { L.style.fontSize = m + 'px'; }); }   // one size for every row
    rows.forEach((r, i) => {
      const t = Math.max(X.tIn + .1, ts[i]), B = r.querySelector('.brB'), L = r.querySelector('.brL'), V = r.querySelector('.brV'), I = r.querySelector('.brI'), hi = r.dataset.hi === '1';
      tl.set(r, { autoAlpha: 0 }, 0).set(r, { autoAlpha: 1 }, t - .3);
      tl.set(L, { x: -40 }, 0).to(L, { x: 0, duration: .45, ease: 'lr.out' }, t - .3);
      if (I) tl.set(I, { scale: 0 }, 0).to(I, { scale: 1, duration: .4, ease: 'back.out(2)' }, t - .3);
      const grow = Math.min(.9, Math.max(.5, (ts[i + 1] ?? X.tOut) - t - .1));
      if (nm === 'thread') tl.set(B, { drawSVG: '0% 0%' }, 0).to(B, { drawSVG: '0% 100%', duration: grow, ease: 'lr.out' }, t);
      else tl.set(B, { scaleX: 0, transformOrigin: '0% 50%' }, 0).to(B, { scaleX: 1, duration: grow, ease: nm === 'flat' ? 'back.out(1.3)' : 'lr.out' }, t);
      if (V) tl.set(V, { autoAlpha: 0 }, 0).set(V, { autoAlpha: 1, y: 20 }, t + grow * .5).to(V, { y: 0, duration: .35, ease: 'lr.out' }, t + grow * .5);
      // once every bar is in, the accent bar takes the stage: the others step back, it swells
      if (!hi) tl.to(B, { opacity: nm === 'silhouette' ? .35 : .45, duration: .4, ease: 'power1.inOut' }, hiT);
      else {
        tl.to(B, { scaleY: 1.22, duration: .3, ease: 'power2.out', transformOrigin: '0% 50%' }, hiT).to(B, { scaleY: 1, duration: .5, ease: 'back.out(2)' }, hiT + .3);
        tl.to(L, { x: 12, duration: .3, ease: 'power2.out' }, hiT).to(L, { x: 0, duration: .5, ease: 'lr.out' }, hiT + .3);
        if (LK.thread) { const b = rel(B); X.dot(b.x + b.w + 6, b.y + b.h / 2, hiT, { r: 20 }); }
      }
    });
    tl.to(rows, { autoAlpha: 0, x: 60, duration: .28, ease: 'lr.in', stagger: .03 }, X.tOut);
  },
};
