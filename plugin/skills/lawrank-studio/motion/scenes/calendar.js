/* calendar: a calendar page flips down; the days cross off one by one toward the deadline (an optional counter runs
   with them), and the deadline date is circled in the accent on the word that says it; a label and caption pin to it. */
SCENES.calendar = {
  label: 'Deadline calendar', about: 'A calendar page flips in, the days cross off toward a deadline, and the deadline date is circled in the accent as it is said.',
  good: 'deadlines, "don\'t wait", time limits, the clock is running', practice: 'any',
  fields: { head: 'optional headline above the calendar (**word** = accent)', label: 'what the date is (e.g. "Filing deadline"), said in the line: the date is circled on it',
    month: 'optional month name on the page (default: none shown, just "Calendar")',
    days: 'optional number of days, counted up on the page as the days cross off (use only the firm\'s own approved number)',
    caption: 'optional short line under the label (3-7 words), said in the line' },
  example: { say: 'The clock starts the day you are hurt. Every day that passes counts toward the filing deadline. Talk to a lawyer early.',
    head: 'The clock is **running.**', label: 'Filing deadline', month: 'June', caption: 'Talk to a lawyer early.' },
  // the page: month starts on a Wednesday, 30 days; today is the 7th, the deadline is the 28th (last row)
  G: { off: 3, days: 30, today: 7, due: 28, W: 880, pad: 40, headH: 136, wkH: 58, cellH: 86 },
  plan(sc, X) {
    const ts = X.times([sc.label, ...(sc.caption ? [sc.caption] : [])]), tA = X.tIn + .75;
    const tD = Math.min(Math.max(ts[0], tA + 1.1), X.tOut - (sc.caption ? 1.3 : .9));
    return { tA, tD, tC: sc.caption ? Math.min(Math.max(ts[1], tD + .7), X.tOut - .5) : null };
  },
  sfx(sc, X) { const p = SCENES.calendar.plan(sc, X); return [{ kind: 'whoosh', at: X.tIn - .1 }, { kind: 'crackle', at: p.tA }, { kind: 'chime', at: p.tD }, { kind: 'pop', at: p.tD + .35 }]; },
  html(sc, X) {
    const LK = X.LK, n = LK.name, id = X.id, G = SCENES.calendar.G, up = LK.headCase === 'upper', ink = LK.surfaceInk;
    const cw = (G.W - 2 * G.pad) / 7, gy = G.headH + G.wkH + 12, cardH = gy + 5 * G.cellH + 30;
    const r0 = sc.head ? 600 : 440, below = 40 + 100 + (sc.caption ? 140 : 0), top = Math.round(r0 + Math.max(0, (1560 - r0 - cardH - below) / 2));
    const sub = readable(mix(ink, LK.surface, .45), LK.surface, 4.8), acc = n === 'flat' ? LK.fillB : n === 'silhouette' ? LK.accent : BT.accent;
    const band = n === 'flat' || n === 'silhouette', bandC = n === 'flat' ? LK.fillB : LK.ink, hC = band ? (contrast('#FFFFFF', bandC) >= 4.5 ? '#FFFFFF' : BT.ink) : ink;
    const slash = n === 'silhouette' ? LK.ink : n === 'flat' ? mix(LK.fillB, '#FFFFFF', .2) : mix(ink, LK.surface, .45);
    const cells = [];
    for (let d = 1; d <= G.days; d++) { const i = G.off + d - 1, cx = G.pad + (i % 7 + .5) * cw, cy = gy + (Math.floor(i / 7) + .5) * G.cellH;
      cells.push(`<div class="cdc" data-d="${d}" style="position:absolute;left:${cx - cw / 2}px;top:${cy - G.cellH / 2}px;width:${cw}px;height:${G.cellH}px">
        ${d < G.due ? `<svg class="cds" width="${cw}" height="${G.cellH}" viewBox="0 0 ${cw} ${G.cellH}" style="position:absolute;left:0;top:0"><path d="M${cw * .26},${G.cellH * .76} L${cw * .74},${G.cellH * .24}" stroke="${slash}" stroke-width="${n === 'silhouette' ? 6 : 5}" stroke-linecap="round" fill="none"/></svg>` : ''}
        <div class="cdn" data-qa="text" style="position:absolute;left:0;right:0;margin:0 auto;width:fit-content;top:0;text-align:center;font:${d === G.due ? 800 : 600} 40px/${G.cellH}px var(--head);color:${ink}">${d}</div></div>`); }
    const wk = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => `<div data-qa="text" style="position:absolute;left:${G.pad + i * cw + cw / 2 - 20}px;width:40px;top:${G.headH + 6}px;text-align:center;font:700 30px/${G.wkH}px var(--head);color:${sub}">${w}</div>`).join('');
    const di = G.off + G.due - 1, dx = G.pad + (di % 7 + .5) * cw, dy = gy + (Math.floor(di / 7) + .5) * G.cellH, R = 50;
    const onAcc = contrast('#FFFFFF', acc) >= 3 ? '#FFFFFF' : BT.ink;
    const curEl = `<div id="${id}cur" class="k-abs" style="left:${G.pad + 6}px;top:${gy + 6}px;width:${cw - 12}px;height:${G.cellH - 12}px;border-radius:${LK.radius ? 18 : 0}px;background:${mix(acc, LK.surface, .82)}"></div>`;
    const due = `<div id="${id}dd" class="k-abs" style="left:${dx - R}px;top:${dy - R}px;width:${2 * R}px;height:${2 * R}px;border-radius:${n === 'silhouette' ? 0 : '50%'};background:${acc}"></div>
      <div id="${id}dn" class="k-abs" data-qa="text" style="left:${dx - R}px;top:${dy - 28}px;width:${2 * R}px;text-align:center;font:800 44px/56px var(--head);color:${onAcc}">${G.due}</div>
      <svg id="${id}dc" class="k-abs" width="${2 * R + 60}" height="${2 * R + 50}" viewBox="0 0 ${2 * R + 60} ${2 * R + 50}" style="left:${dx - R - 30}px;top:${dy - R - 25}px;overflow:visible">
        <path d="M${R + 50},${10} C${2 * R + 52},${8} ${2 * R + 62},${R + 30} ${R + 40},${2 * R + 42} C${12},${2 * R + 48} ${-2},${R + 20} ${18},${R - 14} C${34},${12} ${R + 20},${4} ${R + 74},${22}"
          fill="none" stroke="${n === 'silhouette' ? LK.ink : acc}" stroke-width="7" stroke-linecap="round"/></svg>
`;
    const rings = [0, 1, 2].map(k => `<div class="cdr k-abs" style="left:${G.W / 2 - 220 + k * 220 - 14}px;top:-30px;width:28px;height:62px;border-radius:14px;background:${n === 'silhouette' ? LK.ink : n === 'flat' ? mix(LK.fillB, '#000000', .3) : mix(ink, LK.surface, .35)}"></div>`).join('');
    const cnt = sc.days ? `<div style="position:absolute;right:${G.pad}px;top:0;height:${G.headH}px;display:flex;align-items:center;gap:14px">
        <div id="${id}n" data-qa="text" style="font:800 72px/1 var(--head);color:${band ? hC : readable(BT.accent, LK.surface, 3)};font-variant-numeric:tabular-nums">0</div>
        <div data-qa="text" style="font:700 30px/1.05 var(--head);color:${band ? hC : sub};text-transform:uppercase;letter-spacing:.06em">days</div></div>`
      : `<div style="position:absolute;right:${G.pad}px;top:${(G.headH - 72) / 2}px">${UI.icon(LK, 'clock', 72, band ? hC : ink, band ? hC : BT.accent)}</div>`;
    const head = `<div style="position:absolute;left:0;right:0;top:0;height:${G.headH}px;${band ? `background:${bandC};` : `border-bottom:3px solid ${mix(ink, LK.surface, .88)};`}">
        <div data-qa="text" style="position:absolute;left:${G.pad + 8}px;top:0;font:${LK.headWeight} 60px/${G.headH}px var(--head);color:${hC};${up ? 'text-transform:uppercase;letter-spacing:.04em;' : ''}">${esc(sc.month || 'Calendar')}</div>${cnt}</div>`;
    const card = UI.card(LK, { id: id + 'c', x: 100, y: top, w: G.W, h: cardH, style: 'overflow:visible', inner: `<div style="position:absolute;inset:0;overflow:hidden;border-radius:inherit">${head}${wk}${curEl}${cells.join('')}</div>${due}${rings}` });
    // the label hangs under the circled date on a short line; the caption sits under it
    const pillW = Math.min(820, 150 + String(sc.label).length * 27), px = Math.max(80, Math.min(1000 - pillW, 100 + dx - pillW / 2)), py = top + cardH + 40;
    const pBg = n === 'flat' ? '#FFFFFF' : n === 'silhouette' ? LK.ink : BT.accent, pTx = n === 'flat' ? readable(LK.fillB, '#FFFFFF', 4.5) : contrast('#FFFFFF', pBg) >= 4.5 ? '#FFFFFF' : BT.ink;
    const pill = `<svg id="${id}ln" class="k-abs" width="10" height="${40 + 30}" style="left:${100 + dx - 5}px;top:${top + dy + R - 6 + 0}px;overflow:visible"><line x1="5" y1="0" x2="5" y2="${cardH - dy - R + 46}" stroke="${n === 'flat' ? '#FFFFFF' : n === 'silhouette' ? LK.ink : BT.accent}" stroke-width="5" stroke-linecap="round"/></svg>
      <div id="${id}p" class="k-abs" style="left:${px}px;top:${py}px;width:${pillW}px;height:96px;border-radius:${n === 'silhouette' ? 0 : 48}px;background:${pBg};display:flex;align-items:center;justify-content:center;gap:16px;
        box-shadow:${n === 'cards' ? LK.shadow : n === 'silhouette' ? '10px 12px 0 rgba(0,0,0,.16)' : n === 'flat' ? '0 10px 0 ' + mix(LK.bg, '#000000', .25) : '0 14px 30px rgba(20,24,28,.14)'}">
        ${UI.icon(LK, 'clock', 46, pTx, pTx)}<div data-qa="text" style="font:700 42px/1 var(--head);color:${pTx};white-space:nowrap;${up ? 'text-transform:uppercase;letter-spacing:.04em;' : ''}">${esc(sc.label)}</div></div>`;
    const cap = sc.caption ? UI.text(LK, { id: id + 'cp', text: sc.caption, x: 100, y: py + 96 + 34, w: 880, size: 44, weight: 600, align: 'center', color: LK.ink }) : '';
    return `${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 330, w: 920, size: 88, align: 'center' }) : ''}${card}${pill}${cap}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, n = LK.name, id = X.id, G = SCENES.calendar.G, q = s => X.$('#' + id + s), card = q('c'), P = SCENES.calendar.plan(sc, X);
    const cw = (G.W - 2 * G.pad) / 7, gy = G.headH + G.wkH + 12;
    if (sc.head) X.head(`#${id}h`, X.tIn);
    // the page flips down from its rings
    tl.set(card, { autoAlpha: 0 }, 0).set(card, { autoAlpha: 1, rotationX: -75, y: -40, transformPerspective: 1800, transformOrigin: '50% 0%' }, X.tIn - .12)
      .to(card, { rotationX: 0, y: 0, duration: .7, ease: 'back.out(1.3)' }, X.tIn - .12);
    // days before today are already crossed; from today the days cross off one by one, landing on the deadline
    const cells = [...card.querySelectorAll('.cdc')], cur = q('cur');
    const pos = d => { const i = G.off + d - 1; return { x: (i % 7) * cw, y: Math.floor(i / 7) * G.cellH }; };
    const run = G.due - G.today, stp = Math.min(.28, (P.tD - .2 - P.tA) / run);
    tl.set(cur, { autoAlpha: 0 }, 0).set(cur, { autoAlpha: 1, ...pos(G.today) }, P.tA - .25);
    cells.forEach(c => { const d = +c.dataset.d, s = c.querySelector('.cds path'); if (!s) return;
      if (d < G.today) { tl.set(s, { drawSVG: '100%' }, 0); return; }
      const t = P.tA + (d - G.today) * stp;
      tl.set(s, { drawSVG: '0%' }, 0).to(s, { drawSVG: '100%', duration: Math.max(.12, stp * .9), ease: 'power2.out' }, t);
      tl.to(cur, { ...pos(d + 1), duration: Math.max(.1, stp * .8), ease: 'power2.inOut' }, t + stp * .2);
    });
    if (sc.days) { const N = q('n'); tl.set(N, { textContent: 0 }, 0).to(N, { textContent: +sc.days, snap: { textContent: 1 }, duration: P.tD - P.tA, ease: 'none' }, P.tA); }
    // the deadline: the disc pops, the date turns, the circle is drawn round it by hand
    const dd = q('dd'), dn = q('dn'), dc = q('dc').querySelector('path'), tD = P.tD;
    tl.set(cur, { autoAlpha: 0 }, tD);
    tl.set([dd, dn], { autoAlpha: 0 }, 0).set(dd, { autoAlpha: 1, scale: 0, transformOrigin: '50% 50%' }, tD).to(dd, { scale: 1, duration: .38, ease: 'back.out(2.2)' }, tD)
      .set(dn, { autoAlpha: 1 }, tD + .08).set(card.querySelector(`.cdc[data-d="${G.due}"] .cdn`), { autoAlpha: 0 }, tD + .08);
    tl.set(dc, { drawSVG: '0%' }, 0).to(dc, { drawSVG: '100%', duration: .5, ease: 'power2.inOut' }, tD + .1);
    tl.to(card, { scale: 1.015, duration: .12, ease: 'power1.out', transformOrigin: '50% 50%' }, tD).to(card, { scale: 1, duration: .4, ease: 'back.out(3)' }, tD + .12);
    // the label drops on its line; the caption follows on its word
    const ln = q('ln').querySelector('line'), p = q('p');
    tl.set(ln, { drawSVG: '0%' }, 0).to(ln, { drawSVG: '100%', duration: .25, ease: 'power2.out' }, tD + .3);
    tl.set(p, { autoAlpha: 0 }, 0).set(p, { autoAlpha: 1, scale: .6, y: -20, transformOrigin: '50% 0%' }, tD + .45).to(p, { scale: 1, y: 0, duration: .42, ease: 'back.out(2)' }, tD + .45);
    if (sc.caption) { const c = q('cp'); tl.set(c, { autoAlpha: 0 }, 0).set(c, { autoAlpha: 1, y: 30 }, P.tC).to(c, { y: 0, duration: .45, ease: 'lr.out' }, P.tC); }
    // the deadline keeps pulsing gently while it is read
    for (let t = tD + .9, k = 0; t < X.tOut - .3 && k < 6; t += 1.1, k++) tl.to(dd, { scale: 1.08, duration: .3, ease: 'sine.out' }, t).to(dd, { scale: 1, duration: .5, ease: 'sine.in' }, t + .3);
    if (LK.thread) { const r = dd.getBoundingClientRect(), s = card.closest('.stage').getBoundingClientRect(), k = s.width / 1080; X.dot((r.right - s.left) / k + 30, (r.top - s.top) / k - 6, tD + .6, { r: 14 }); }
    const all = [card, q('ln'), p, ...(sc.caption ? [q('cp')] : [])];
    tl.to(all, { autoAlpha: 0, y: -70, duration: .3, ease: 'lr.in' }, X.tOut);
  },
};
