/* letter: an envelope slides in and opens, a letter rises out of it, its lines write in as they are said, the key line
   gets a marker highlight, and an optional stamp ("FINAL OFFER", "DENIED") slams on at the end. */
SCENES.letter = {
  label: 'Letter arrives', about: 'An envelope slides in and opens; a letter rises out, its key line is highlighted as it is said, and a stamp can slam on.',
  good: 'insurance letters, denial letters, settlement offers, "read it before you sign"', practice: 'any',
  fields: { head: 'optional headline above the letter (**word** = accent)', from: 'who sent it (e.g. "Insurance company")',
    lines: '2-4 short lines on the letter (3-7 words each), said in the line, in order',
    highlight: 'index (0-based) of the key line: a marker sweeps across it as it is said',
    stamp: 'optional 1-2 word stamp slammed on at the end (e.g. "FINAL OFFER", "DENIED"), said in the line' },
  example: { say: 'Then a letter arrives from the insurance company. They have reviewed your claim, they want a recorded statement, and they call it a final offer.',
    head: 'Read it **first.**', from: 'Insurance company', lines: ['We have reviewed your claim.', 'Please give a recorded statement.', 'This is our best offer.'],
    highlight: 1, stamp: 'Final offer' },
  sfx(sc, X) {
    const ts = X.times([...sc.lines, ...(sc.stamp ? [sc.stamp] : [])]), out = [{ kind: 'whoosh', at: X.tIn - .1 }, { kind: 'soft', at: X.tIn + .55 }];
    if (sc.stamp) out.push({ kind: 'impact', at: Math.max(ts[ts.length - 1], X.tIn + 2) + .18 });
    return out;
  },
  pal(LK) {
    const n = LK.name;
    if (n === 'flat') { const b = LK.fillB; return { pocket: b, side: mix(b, '#000000', .14), back: mix(b, '#000000', .34), flap: mix(b, '#FFFFFF', .1), seam: 'none', sw: 0, seal: '#FFFFFF', sealIn: b,
      shadow: `drop-shadow(0 14px 0 ${mix(LK.bg, '#000000', .25)})` }; }
    if (n === 'silhouette') return { pocket: LK.ink, side: mix(LK.ink, LK.bg, .1), back: mix(LK.ink, LK.bg, .4), flap: LK.ink, seam: LK.bg, sw: 3, seal: LK.accent, sealIn: LK.ink,
      shadow: 'drop-shadow(14px 16px 0 rgba(0,0,0,.14))' };
    if (n === 'cards') return { pocket: '#FFFFFF', side: mix('#FFFFFF', LK.bg, .28), back: mix(LK.bg, '#000000', .1), flap: mix('#FFFFFF', LK.bg, .12), seam: 'none', sw: 0, seal: BT.accent, sealIn: '#FFFFFF',
      shadow: 'drop-shadow(0 34px 40px rgba(30,20,10,.22))' };
    return { pocket: '#FFFFFF', side: '#FFFFFF', back: LK.fillB, flap: '#FFFFFF', seam: LK.line, sw: 4, seal: BT.accent, sealIn: '#FFFFFF', shadow: 'drop-shadow(0 18px 30px rgba(20,24,28,.10))' };
  },
  html(sc, X) {
    const LK = X.LK, n = LK.name, p = SCENES.letter.pal(LK), id = X.id, top = sc.head ? 600 : 470, up = LK.headCase === 'upper';
    const ink = LK.surfaceInk, sub = readable(mix(ink, LK.surface, .45), LK.surface, 4.6);
    const stampC = n === 'silhouette' ? (contrast('#FFFFFF', LK.accent) >= 3 ? '#FFFFFF' : LK.ink) : readable(BT.accent, LK.surface, 3.2), stampBg = n === 'silhouette' ? LK.accent : 'transparent';
    const seam = p.sw ? `stroke="${p.seam}" stroke-width="${p.sw}" stroke-linejoin="round"` : '';
    const lines = sc.lines.map((l, i) => `<div class="ltl" data-qa="text" style="position:relative;z-index:1;width:fit-content;margin-top:${i ? 22 : 0}px;font:400 46px/1.3 var(--body);color:${ink}"><span class="ltt">${esc(l)}</span></div>`).join('');
    const stampLen = String(sc.stamp || '').length;
    const stamp = sc.stamp ? `<div id="${id}st" class="k-abs" data-qa="text" style="right:46px;bottom:52px;padding:12px 30px 8px;font:800 ${stampLen > 11 ? 54 : 66}px/1.05 var(--head);letter-spacing:.06em;
        text-transform:uppercase;white-space:nowrap;color:${stampC};background:${stampBg};${n === 'silhouette' ? 'box-shadow:8px 9px 0 rgba(0,0,0,.18);' : `border:6px solid ${stampC};border-radius:${LK.radius ? 12 : 0}px;box-shadow:inset 0 0 0 5px ${LK.surface},inset 0 0 0 9px ${stampC};`}z-index:2">${esc(sc.stamp)}</div>
      <svg id="${id}sb" class="k-abs" width="420" height="300" viewBox="-210 -150 420 300" style="right:${46 - 60}px;bottom:${52 - 90}px;overflow:visible;z-index:2">
        ${[0, 1, 2, 3, 4, 5].map(k => { const a = (k / 6) * Math.PI * 2 + .3, r0 = 150, r1 = 205; return `<line x1="${(Math.cos(a) * r0).toFixed(1)}" y1="${(Math.sin(a) * r0 * .7).toFixed(1)}" x2="${(Math.cos(a) * r1).toFixed(1)}" y2="${(Math.sin(a) * r1 * .7).toFixed(1)}" stroke="${n === 'silhouette' ? LK.ink : stampC}" stroke-width="8" stroke-linecap="round"/>`; }).join('')}</svg>` : '';
    const letter = `<div id="${id}L" class="k-abs" style="left:100px;top:${top}px;width:880px;padding:56px 64px ${sc.stamp ? 230 : 150}px;background:${LK.surface};color:${ink};
        border-radius:${LK.radius ? 12 : 0}px;box-shadow:${LK.shadow};border:${LK.edge}">
        <div style="display:flex;align-items:center;gap:24px">
          <div style="width:78px;height:78px;flex:none;border-radius:${LK.radius ? '50%' : '0'};background:${n === 'silhouette' ? LK.ink : mix(ink, LK.surface, .9)};display:flex;align-items:center;justify-content:center">${UI.icon(LK, 'shield', 48, n === 'silhouette' ? LK.surface : mix(ink, LK.surface, .3), n === 'silhouette' ? LK.surface : mix(ink, LK.surface, .3))}</div>
          <div id="${id}fr" data-qa="text" style="flex:1;font:700 ${String(sc.from || '').length > 24 ? 34 : 40}px/1.15 var(--head);color:${ink};${up ? 'text-transform:uppercase;letter-spacing:.04em;' : ''}">${esc(sc.from || 'Insurance company')}</div>
          <div style="width:120px;flex:none"><div style="height:12px;border-radius:6px;background:${mix(ink, LK.surface, .86)}"></div><div style="height:12px;width:70%;margin:12px 0 0 auto;border-radius:6px;background:${mix(ink, LK.surface, .86)}"></div></div>
        </div>
        <div style="height:4px;margin:34px 0 36px;background:${n === 'silhouette' ? LK.ink : mix(ink, LK.surface, .88)}"></div>
        <div id="${id}ls" style="position:relative">${lines}</div>
        <svg id="${id}sg" class="k-abs" width="260" height="90" viewBox="0 0 260 90" style="left:56px;bottom:${sc.stamp ? 84 : 40}px;transform:scale(.8);transform-origin:0 100%;overflow:visible">
          <path d="M6,58 C26,8 44,4 46,40 S62,80 82,38 S112,2 122,44 S150,70 172,30 S206,18 216,52 C224,66 240,58 252,46" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="0" y1="84" x2="250" y2="84" stroke="${mix(ink, LK.surface, .75)}" stroke-width="3"/></svg>
        ${stamp}</div>`;
    const W = 940, H = 540;
    return `${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 330, w: 920, size: 88, align: 'center' }) : ''}
      <div id="${id}eb" class="k-abs" style="left:70px;top:1000px;width:${W}px;height:${H}px;filter:${p.shadow}">
        <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;left:0;top:0;overflow:visible">
          <rect x="0" y="0" width="${W}" height="${H}" fill="${p.back}" ${seam}/>
          <path id="${id}fo" d="M0,0 L${W},0 L${W / 2},-250 Z" fill="${p.flap}" ${seam}/></svg></div>
      <div id="${id}cl" class="k-abs" style="left:0;top:0;width:1080px;height:1920px;overflow:hidden">${letter}</div>
      <div id="${id}ef" class="k-abs" style="left:70px;top:1000px;width:${W}px;height:${H}px;filter:${p.shadow}">
        <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;left:0;top:0;overflow:visible">
          <path d="M0,0 L${W / 2},300 L0,${H} Z" fill="${p.side}" ${seam}/><path d="M${W},0 L${W / 2},300 L${W},${H} Z" fill="${p.side}" ${seam}/>
          <path d="M0,${H} L${W / 2},236 L${W},${H} Z" fill="${p.pocket}" ${seam}/>
          ${n === 'thread' ? `<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${p.seam}" stroke-width="${p.sw}"/>` : ''}
          <g id="${id}fc"><path d="M0,0 L${W},0 L${W / 2},316 Z" fill="${p.flap}" ${seam}/>
            <circle cx="${W / 2}" cy="282" r="46" fill="${p.seal}"/><circle cx="${W / 2}" cy="282" r="30" fill="none" stroke="${p.sealIn}" stroke-width="4" opacity=".7"/></g></svg></div>`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, q = s => X.$('#' + id + s), L = q('L'), st = L.closest('.stage'), k = st.getBoundingClientRect().width / 1080;
    const rel = el => { const a = el.getBoundingClientRect(), s = st.getBoundingClientRect(); return { x: (a.left - s.left) / k, y: (a.top - s.top) / k, w: a.width / k, h: a.height / k }; };
    const H = rel(L).h, r0 = sc.head ? 590 : 420, top = Math.round(r0 + Math.max(0, (1540 - r0 - H) / 2 - 30));
    L.style.top = top + 'px';
    // the envelope rests low; the letter starts inside it (hidden by the pocket and the clip) and rises to its place
    const envTop = Math.min(1320, Math.max(top + H - 450, top + 420)), start = envTop + 26 - top;
    [q('eb'), q('ef')].forEach(e => { e.style.top = envTop + 'px'; });
    const clip = q('cl'); clip.style.height = envTop + 520 + 'px';
    const env = [q('eb'), q('ef')], a = X.tIn - .15;
    if (sc.head) X.head(`#${id}h`, X.tIn);
    tl.set(env, { autoAlpha: 0 }, 0).set(env, { autoAlpha: 1, x: -1000, rotation: -9, transformOrigin: '50% 50%' }, a)
      .to(env, { x: 0, rotation: 0, duration: .6, ease: 'lr.out' }, a);
    const fc = q('fc'), fo = q('fo');
    tl.set(fo, { scaleY: 0, svgOrigin: '470 0' }, 0).set(fc, { scaleY: 1, svgOrigin: '470 0' }, 0);
    tl.to(fc, { scaleY: 0, duration: .2, ease: 'power2.in' }, a + .55).to(fo, { scaleY: 1, duration: .26, ease: 'power2.out' }, a + .75);
    // the letter rises out, then the envelope drops away (the clip follows it so the paper is revealed with it)
    const tr = a + .9, td = tr + .55, frm = q('fr'), lines = [...L.querySelectorAll('.ltl')];
    tl.set(L, { autoAlpha: 0 }, 0).set(L, { autoAlpha: 1, y: start }, tr - .01).to(L, { y: 0, duration: .65, ease: 'lr.out' }, tr);
    tl.set(frm, { autoAlpha: 0 }, 0).set(frm, { autoAlpha: 1 }, tr + .3);
    tl.to(env, { y: 1100, rotation: 4, duration: .7, ease: 'lr.in' }, td).set(env, { autoAlpha: 0 }, td + .71);
    tl.to(clip, { height: envTop + 520 + 1100, duration: .7, ease: 'lr.in' }, td).set(clip, { overflow: 'visible' }, td + .71);
    // a slow drift keeps the letter alive while it is read
    tl.fromTo(L, { rotation: 0 }, { rotation: -1, duration: Math.max(.5, X.tOut - td), ease: 'sine.inOut', immediateRender: false }, td);
    // lines write in on the words that say them
    const all = [...sc.lines, ...(sc.stamp ? [sc.stamp] : [])], ts = X.times(all), ready = td + .15;
    const lt = sc.lines.map((_, i) => Math.max(ts[i] - .15, ready + i * .3));
    lines.forEach((el, i) => {
      tl.set(el, { autoAlpha: 0 }, 0).set(el, { autoAlpha: 1, clipPath: 'inset(-10% 100% -10% 0%)', x: -8 }, lt[i])
        .to(el, { clipPath: 'inset(-10% 0% -10% 0%)', x: 0, duration: .55, ease: 'power2.out' }, lt[i]);
    });
    // the marker sweeps across the key line (a background on the inline text, so it follows every wrapped row)
    const hi = Math.max(0, Math.min(sc.lines.length - 1, sc.highlight ?? 0)), hs = lines[hi].querySelector('.ltt'), box = rel(q('ls'));
    const mk = (() => { let m = mix(BT.accent, LK.surface, .58); for (let i = 0; i < 12 && contrast(LK.surfaceInk, m) < 5; i++) m = mix(m, LK.surface, .15); return m; })();
    Object.assign(hs.style, { backgroundImage: `linear-gradient(${mk},${mk})`, backgroundRepeat: 'no-repeat', backgroundPosition: '0 88%', backgroundSize: '0% 76%',
      boxDecorationBreak: 'clone', webkitBoxDecorationBreak: 'clone', padding: '0 8px', margin: '0 -8px', borderRadius: '6px' });
    const th = Math.max(lt[hi] + .45, ts[hi] + .35);
    tl.fromTo(hs, { backgroundSize: '0% 76%' }, { backgroundSize: '100% 76%', duration: .6, ease: 'power1.inOut', immediateRender: false }, th);
    // thread: the dot lands in the margin beside the key line, like a bullet
    if (LK.thread) { const lr = rel(lines[hi]); X.dot(box.x - 32, lr.y + 31, th + .1, { r: 12 }); }
    // the signature draws under the last line
    const sg = q('sg').querySelector('path'), tsg = lt[lt.length - 1] + .5;
    tl.set(sg, { drawSVG: '0%' }, 0).to(sg, { drawSVG: '100%', duration: .6, ease: 'power1.inOut' }, tsg);
    // the stamp slams on, the paper takes the hit
    if (sc.stamp) {
      const S = q('st'), B = q('sb'), t = Math.max(ts[ts.length - 1], th + .6, tsg + .3);
      tl.set(S, { autoAlpha: 0 }, 0).set(S, { autoAlpha: .28, scale: 1.8, rotation: -20, transformOrigin: '50% 50%' }, t)
        .to(S, { scale: 1, rotation: -6, duration: .2, ease: 'power3.in' }, t).set(S, { autoAlpha: 1 }, t + .2);
      tl.to(L, { y: 12, scale: .985, duration: .07, ease: 'power1.out' }, t + .2).to(L, { y: 0, scale: 1, duration: .45, ease: 'back.out(3)' }, t + .27);
      const ls = [...B.querySelectorAll('line')];
      tl.set(B, { autoAlpha: 0 }, 0).set(B, { autoAlpha: 1 }, t + .19).set(ls, { drawSVG: '0% 0%' }, t + .19)
        .to(ls, { drawSVG: '0% 100%', duration: .16, ease: 'power2.out' }, t + .2).to(ls, { drawSVG: '100% 100%', duration: .28, ease: 'power2.in' }, t + .36)
        .set(B, { autoAlpha: 0 }, t + .65);
      if (LK.thread) { const r = rel(S); X.dot(r.x + r.w + 26, r.y + 8, t + .35, { r: 16 }); }
    }
    tl.to(L, { autoAlpha: 0, y: -70, duration: .3, ease: 'lr.in' }, X.tOut);
  },
};
