/* timeline: a vertical timeline of 3-5 milestones. A progress line draws down from one to the next as each is spoken,
   and each milestone lights up when it's reached. Thread: the dot rides the line and lands in each ring; flat: chunky
   numbered discs; cards: each milestone is a floating white card; silhouette: black diamonds on a heavy rule. */
SCENES.timeline = {
  label: 'Timeline', about: 'A vertical timeline: a progress line draws from milestone to milestone as each is spoken, and each one lights up.',
  good: 'how a case moves, what happens after you call, deadlines and stages, the firm\'s history', practice: 'any',
  fields: { head: 'optional headline above (2-5 words)', steps: '[{when, label}] 3-5 milestones in order; when = short marker ("Day 1", "Week 2", "Next"), label = 2-6 words; say each in the line, ideally starting with its marker' },
  example: { say: 'Day one, you call and we listen. In week one, we gather your records. Next, we build your claim. Then, we negotiate for you.',
    head: 'How it **works**', steps: [{ when: 'Day 1', label: 'You call, we listen' }, { when: 'Week 1', label: 'We gather your records' },
      { when: 'Next', label: 'We build your claim' }, { when: 'Then', label: 'We negotiate for you' }] },
  sfx: (sc, X) => SCENES.timeline.tlTimes(sc, X).map(t => ({ kind: 'clink', at: t })),
  tlTimes(sc, X) {   // the marker word ("Day", "Week", "Next") if it's said, else the label's first words
    const a = X.times(sc.steps.map(s => s.when)), b = X.times(sc.steps.map(s => s.label)), w = X.line.words.map(x => String(x.w).toLowerCase().replace(/[^a-z0-9']/g, ''));
    return sc.steps.map((s, i) => { const k = String(s.when).toLowerCase().replace(/[^a-z0-9' ]/g, '').split(' ')[0]; return Math.max(X.tIn + .15 + i * .05, w.includes(k) ? a[i] : b[i]); });
  },
  tlGeo(sc, X) {
    const n = sc.steps.length, top = (sc.head ? 640 : 480), bottom = 1500, gap = Math.min(290, (bottom - top) / (n - 1 + .55));
    return { n, top, gap, lx: X.LK.name === 'cards' ? 150 : 170, ys: sc.steps.map((s, i) => top + 26 + i * gap) };
  },
  html(sc, X) {
    const LK = X.LK, nm = LK.name, up = LK.headCase === 'upper', G = SCENES.timeline.tlGeo(sc, X), { n, lx, ys, gap } = G;
    const long = sc.steps.some(s => String(s.label).length > 24), lsz = nm === 'cards' ? (long ? 42 : 46) : long || n > 4 ? 46 : 52;
    const y0 = ys[0], y1 = ys[n - 1], lw = nm === 'flat' ? 18 : nm === 'silhouette' ? 14 : nm === 'cards' ? 8 : 6;
    const track = nm === 'flat' ? LK.soft : nm === 'silhouette' ? LK.fillB : nm === 'cards' ? mix(BT.ink, '#FFFFFF', .85) : LK.soft;
    const prog = nm === 'flat' ? LK.fillA : nm === 'silhouette' ? LK.ink : BT.accent;
    const nodes = ys.map((y, i) => {
      if (nm === 'thread') return `<g class="tlN" data-i="${i}"><circle cx="${lx}" cy="${y}" r="26" fill="${LK.bg}" stroke="${LK.line}" stroke-width="5"/><circle class="tlR" cx="${lx}" cy="${y}" r="26" fill="none" stroke="${BT.accent}" stroke-width="6"/></g>`;
      if (nm === 'flat') { const ink = contrast('#FFFFFF', LK.fillB) >= 3 ? '#FFFFFF' : BT.ink;
        return `<g class="tlN" data-i="${i}"><circle cx="${lx}" cy="${y}" r="46" fill="${LK.soft}"/><g class="tlR"><circle cx="${lx}" cy="${y + 8}" r="46" fill="${mix(LK.fillB, '#000000', .25)}"/><circle cx="${lx}" cy="${y}" r="46" fill="${LK.fillB}"/>
          <text x="${lx}" y="${y + 15}" text-anchor="middle" font-family="var(--head)" font-weight="800" font-size="44" fill="${ink}" data-qa="text">${i + 1}</text></g></g>`; }
      if (nm === 'cards') return `<g class="tlN" data-i="${i}"><circle cx="${lx}" cy="${y}" r="30" fill="#FFFFFF" stroke="${track}" stroke-width="5"/><g class="tlR"><circle cx="${lx}" cy="${y}" r="30" fill="${BT.accent}"/>
          <path class="tlK" d="M${lx - 12} ${y + 1} L${lx - 3} ${y + 10} L${lx + 13} ${y - 9}" fill="none" stroke="${contrast('#FFFFFF', BT.accent) >= 3 ? '#FFFFFF' : BT.ink}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g></g>`;
      return `<g class="tlN" data-i="${i}"><rect x="${lx - 30}" y="${y - 30}" width="60" height="60" fill="${LK.bg}" stroke="${LK.ink}" stroke-width="8" transform="rotate(45 ${lx} ${y})"/>
        <g class="tlR"><rect x="${lx - 22}" y="${y - 22}" width="60" height="60" fill="rgba(0,0,0,.14)" transform="rotate(45 ${lx + 8} ${y + 8})"/><rect x="${lx - 34}" y="${y - 34}" width="68" height="68" fill="${LK.accent}" stroke="${LK.ink}" stroke-width="8" transform="rotate(45 ${lx} ${y})"/></g></g>`;
    }).join('');
    const svg = `<svg id="${X.id}s" class="k-abs" style="left:0;top:0;overflow:visible" width="1080" height="1920">
      <line id="${X.id}tk" x1="${lx}" y1="${y0}" x2="${lx}" y2="${y1}" stroke="${track}" stroke-width="${lw}" stroke-linecap="round" ${nm === 'thread' ? 'stroke-dasharray="2 16"' : ''}/>
      <line id="${X.id}pg" x1="${lx}" y1="${y0}" x2="${lx}" y2="${y1}" stroke="${prog}" stroke-width="${lw}" stroke-linecap="${nm === 'silhouette' ? 'butt' : 'round'}"/>${nodes}</svg>`;
    const tx = lx + (nm === 'flat' ? 90 : nm === 'cards' ? 70 : 80), tw = 1000 - tx;
    const whenInk = nm === 'cards' ? readable(BT.accent, '#FFFFFF', 4.5) : nm === 'flat' ? LK.accentText : LK.accentText;
    const items = sc.steps.map((s, i) => {
      const body = `<div style="font:800 32px/1 var(--head);letter-spacing:.1em;text-transform:uppercase;color:${whenInk}">${esc(s.when)}</div>
        <div style="font:${LK.headWeight} ${lsz}px/1.12 var(--head);color:${nm === 'cards' ? LK.surfaceInk : LK.ink};margin-top:12px;${up ? 'text-transform:uppercase;' : ''}">${accentize(s.label, 'ka')}</div>`;
      if (nm === 'cards') return `<div class="tlI k-abs" data-qa="text" style="left:${tx}px;top:${ys[i] - 52}px;width:${tw}px;max-height:${gap - 18}px;padding:24px 34px;background:${LK.surface};border-radius:28px;box-shadow:${LK.shadow};border:${LK.edge}">${body}</div>`;
      return `<div class="tlI k-abs" data-qa="text" style="left:${tx}px;top:${ys[i] - 18}px;width:${tw}px">${body}</div>`;
    }).join('');
    return `${sc.head ? UI.head(LK, { id: X.id + 'h', text: sc.head, x: 80, y: 340, w: 920, size: 92 }) : ''}${svg}<div id="${X.id}i">${items}</div>`;
  },
  build(tl, sc, X) {
    const LK = X.LK, nm = LK.name, id = X.id, ts = SCENES.timeline.tlTimes(sc, X), { n, ys, lx } = SCENES.timeline.tlGeo(sc, X);
    const S = X.$(`#${id}s`), nodes = [...S.querySelectorAll('.tlN')], items = [...X.$(`#${id}i`).querySelectorAll('.tlI')];
    if (sc.head) X.head(`#${id}h`, X.tIn);
    tl.set(S, { autoAlpha: 0 }, 0).set(S, { autoAlpha: 1 }, X.tIn - .1);
    tl.set(`#${id}tk`, { drawSVG: '0%' }, 0).to(`#${id}tk`, { drawSVG: '100%', duration: .8, ease: 'lr.out' }, X.tIn - .1);
    tl.set(`#${id}pg`, { drawSVG: '0%' }, 0);
    nodes.forEach((g, i) => {
      const t = ts[i], R = g.querySelector('.tlR'), I = items[i], te = Math.max(X.tIn, t - .35);
      tl.set(g, { autoAlpha: 0 }, 0).set(g, { autoAlpha: 1, scale: 0, svgOrigin: `${lx} ${ys[i]}` }, X.tIn + i * .07).to(g, { scale: 1, duration: .4, ease: 'back.out(2)' }, X.tIn + i * .07);
      // the progress line runs to this milestone, arriving as it's said
      if (i) tl.to(`#${id}pg`, { drawSVG: `${(100 * i / (n - 1)).toFixed(2)}%`, duration: Math.max(.3, Math.min(.7, t - ts[i - 1] - .1)), ease: 'lr.move' }, t - Math.max(.3, Math.min(.7, t - ts[i - 1] - .1)));
      if (nm === 'thread') tl.set(R, { drawSVG: '0%' }, 0).to(R, { drawSVG: '100%', duration: .45, ease: 'power2.out' }, t);
      else if (nm === 'cards') { tl.set(R, { autoAlpha: 0 }, 0).set(R, { autoAlpha: 1, scale: 0, svgOrigin: `${lx} ${ys[i]}` }, t).to(R, { scale: 1, duration: .35, ease: 'back.out(2.2)' }, t);
        const K = R.querySelector('.tlK'); tl.set(K, { drawSVG: '0%' }, 0).to(K, { drawSVG: '100%', duration: .3, ease: 'power2.out' }, t + .12); }
      else { tl.set(R, { autoAlpha: 0 }, 0).set(R, { autoAlpha: 1, scale: nm === 'flat' ? 0 : 1.8, svgOrigin: `${lx} ${ys[i]}` }, t).to(R, { scale: 1, duration: .4, ease: nm === 'flat' ? 'back.out(2.2)' : 'power3.out' }, t); }
      if (LK.thread) X.dot(lx, ys[i], t, { r: 14 });
      tl.set(I, { autoAlpha: 0 }, 0).set(I, { autoAlpha: 1, x: nm === 'cards' ? 80 : -40 }, te).to(I, { x: 0, duration: .5, ease: 'lr.out' }, te);
      if (i < n - 1 && nm !== 'cards') tl.to(I, { opacity: .55, duration: .4, ease: 'power1.inOut' }, ts[i + 1]);   // the current milestone leads
    });
    tl.to(items, { autoAlpha: 0, x: 40, duration: .28, ease: 'lr.in', stagger: .03 }, X.tOut);
    tl.to(S, { autoAlpha: 0, duration: .3, ease: 'lr.in' }, X.tOut);
  },
};
