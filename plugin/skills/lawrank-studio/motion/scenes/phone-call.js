/* phone-call: an incoming call ("Insurance company calling…") rings: the phone shakes, rings pulse round the caller;
   on the spoken cue the call is declined (or forwarded to the lawyer) and a reply card pops over the phone. */
SCENES['phone-call'] = {
  label: 'Incoming call', about: 'A phone rings with an incoming call from the insurer; on the cue it is declined or forwarded, and a reply card pops up.',
  good: 'adjuster calls, "you don\'t have to talk to them", let your lawyer handle it', practice: 'any',
  fields: { head: 'optional headline above the phone (**word** = accent)', caller: 'who is calling (e.g. "Insurance company")',
    caption: 'the reply card (3-8 words, e.g. "Let your **lawyer** talk to them"), said in the line: the call is ended just before it',
    action: '"decline" (default) or "forward" (sent on to the lawyer)' },
  example: { say: 'Then the insurance company calls, again and again. You do not have to pick up. Let your lawyer talk to them.',
    caller: 'Insurance company', caption: 'Let your **lawyer** talk to them.', action: 'decline' },
  plan(sc, X) {
    const tc = X.times([sc.caller, String(sc.caption).replace(/\*\*/g, '')])[1];
    const tC = Math.min(Math.max(tc, X.tIn + 2.1), X.tOut - .8);
    return { tA: tC - .55, tC };
  },
  sfx(sc, X) {
    const p = SCENES['phone-call'].plan(sc, X), out = [];
    for (let t = X.tIn + .3; t < p.tA - .3; t += 1.1) out.push({ kind: 'buzz', at: t });
    return [...out, { kind: 'pop', at: p.tA }, { kind: 'whoosh', at: p.tC - .05 }];
  },
  geo(sc) {
    const r0 = sc.head ? 590 : 430, h = Math.min(1020, 1500 - r0), w = Math.round(Math.min(600, h * .6));
    return { r0, h, w, x: Math.round(540 - w / 2), y: r0 };
  },
  html(sc, X) {
    const LK = X.LK, n = LK.name, id = X.id, g = SCENES['phone-call'].geo(sc), fwd = sc.action === 'forward', up = LK.headCase === 'upper';
    const light = n === 'thread', frame = n === 'silhouette' ? LK.ink : n === 'flat' ? LK.fillB : n === 'thread' ? '#FFFFFF' : '#15171A';
    const scr = light ? `linear-gradient(180deg, #FFFFFF, ${mix(BT.ink, '#FFFFFF', .93)})` : n === 'silhouette' ? mix(LK.ink, '#FFFFFF', .07)
      : n === 'flat' ? `linear-gradient(180deg, ${mix(LK.fillB, '#000000', .35)}, ${mix(LK.fillB, '#000000', .62)})` : `linear-gradient(180deg, ${mix(BT.accent, '#101114', .72)}, ${mix(BT.ink, '#000000', .55)})`;
    const scrC = light ? '#FFFFFF' : n === 'silhouette' ? mix(LK.ink, '#FFFFFF', .07) : n === 'flat' ? mix(LK.fillB, '#000000', .45) : mix(BT.ink, '#000000', .45);
    const tx = light ? BT.ink : '#FFFFFF', tx2 = light ? readable(mix(BT.ink, '#FFFFFF', .4), '#FFFFFF', 4.8) : mix('#FFFFFF', scrC, .3);
    const red = n === 'silhouette' ? LK.accent : '#E5484D', grn = n === 'silhouette' ? '#F2EFE8' : '#2FB36A';
    const fwdC = n === 'silhouette' ? '#F2EFE8' : n === 'flat' ? '#FFFFFF' : BT.accent;
    const av = Math.round(g.w * .36), cx = g.w / 2 - 22, avY = Math.round(g.h * .2);
    const ring = k => `<div class="pcr k-abs" style="left:${cx - av / 2}px;top:${avY}px;width:${av}px;height:${av}px;border-radius:50%;border:${light ? 4 : 5}px solid ${light ? BT.accent : n === 'silhouette' ? LK.accent : '#FFFFFF'}"></div>`;
    const btn = (cls, c, ic, rot) => `<div class="${cls} k-abs" style="width:132px;height:132px;border-radius:50%;background:${c};display:flex;align-items:center;justify-content:center;
        ${light ? 'box-shadow:0 10px 20px rgba(20,24,28,.18);' : ''}"><div style="transform:rotate(${rot}deg);display:flex">${icon(ic, 64, contrast('#FFFFFF', c) >= 3 ? '#FFFFFF' : BT.ink, contrast('#FFFFFF', c) >= 3 ? '#FFFFFF' : BT.ink)}</div></div>`;
    const bY = g.h - 44 - 132 - 70, inner = g.w - 44;
    const screen = `<div id="${id}s" style="position:relative;width:100%;height:100%;border-radius:${n === 'silhouette' ? 6 : 58}px;background:${scr};overflow:hidden">
        <div style="position:absolute;left:50%;top:18px;width:150px;height:36px;margin-left:-75px;border-radius:18px;background:${light ? mix(BT.ink, '#FFFFFF', .85) : '#000000'}"></div>
        <div id="${id}in" data-qa="text" style="position:absolute;left:0;right:0;margin:0 auto;width:fit-content;top:${Math.round(g.h * .09)}px;text-align:center;font:600 30px/1 var(--body);color:${tx2};letter-spacing:.04em">${fwd ? 'Incoming call' : 'Incoming call'}</div>
        ${ring(0)}${ring(1)}${ring(2)}
        <div id="${id}av" class="k-abs" style="left:${cx - av / 2}px;top:${avY}px;width:${av}px;height:${av}px;border-radius:50%;background:${light ? mix(BT.ink, '#FFFFFF', .88) : n === 'silhouette' ? '#F2EFE8' : 'rgba(255,255,255,.16)'};
          display:flex;align-items:center;justify-content:center">${icon('shield', Math.round(av * .5), light ? BT.ink : n === 'silhouette' ? LK.ink : '#FFFFFF', light ? BT.accent : n === 'silhouette' ? LK.ink : '#FFFFFF')}</div>
        <div class="k-abs" style="left:28px;right:28px;top:${avY + av + 36}px;display:flex;flex-direction:column;align-items:center;gap:30px">
        <div id="${id}nm" data-qa="text" style="width:fit-content;max-width:100%;text-align:center;font:700 ${String(sc.caller).length > 26 ? 38 : String(sc.caller).length > 18 ? 44 : 52}px/1.12 var(--head);color:${tx};${up ? 'text-transform:uppercase;' : ''}">${esc(sc.caller || 'Insurance company')}</div>
        <div style="position:relative;width:100%;height:44px;flex:none">
          <div id="${id}st" data-qa="text" style="position:absolute;left:0;right:0;margin:0 auto;width:fit-content;text-align:center;font:500 36px/44px var(--body);color:${tx2}">calling<span class="pcd">.</span><span class="pcd">.</span><span class="pcd">.</span></div>
          <div id="${id}st2" data-qa="text" style="position:absolute;left:0;right:0;margin:0 auto;width:fit-content;text-align:center;font:700 36px/44px var(--body);color:${fwd ? (light ? readable(BT.accent, '#FFFFFF', 4.6) : '#FFFFFF') : (light ? readable('#E5484D', '#FFFFFF', 4.6) : n === 'silhouette' ? '#FFFFFF' : '#FF8A8D')}">${fwd ? 'Forwarded' : 'Call declined'}</div></div></div>
        <div id="${id}bd" style="position:absolute;left:${inner / 2 - 66 - 120}px;top:${bY}px">${btn('pcb', red, 'phone', 135)}</div>
        <div id="${id}ba" style="position:absolute;left:${inner / 2 - 66 + 120}px;top:${bY}px">${fwd ? btn('pcb', fwdC, 'arrow', 0) : btn('pcb', grn, 'phone', 0)}</div>
        <div id="${id}rp" class="k-abs" style="left:${inner / 2 - 66 + (fwd ? 120 : -120)}px;top:${bY}px;width:132px;height:132px;border-radius:50%;border:5px solid ${fwd ? fwdC : red}"></div></div>`;
    const phone = `<div id="${id}p" class="k-abs" style="left:${g.x}px;top:${g.y}px;width:${g.w}px;height:${g.h}px;border-radius:${n === 'silhouette' ? 18 : 80}px;background:${frame};padding:22px;
        ${light ? `border:4px solid ${LK.line};` : ''}box-shadow:${n === 'cards' ? LK.shadow : n === 'thread' ? LK.shadow : n === 'flat' ? '0 16px 0 ' + mix(LK.bg, '#000000', .25) : '16px 18px 0 rgba(0,0,0,.16)'}">${screen}</div>`;
    // the reply card pops over the lower half of the phone once the call is gone
    const cardY = g.y + g.h - 300, capC = n === 'silhouette' ? LK.surfaceInk : LK.surfaceInk;
    const tile = n === 'flat' ? LK.fillB : n === 'silhouette' ? LK.ink : BT.accent;
    const cap = UI.card(LK, { id: id + 'cc', x: 100, y: cardY, w: 880, h: 220, style: 'display:flex;align-items:center;gap:30px;padding:0 44px;overflow:visible',
      inner: `<div style="width:120px;height:120px;flex:none;border-radius:${n === 'silhouette' ? 0 : 32}px;background:${tile};display:flex;align-items:center;justify-content:center">${icon(fwd ? 'briefcase' : 'scale', 70, contrast('#FFFFFF', tile) >= 3 ? '#FFFFFF' : BT.ink, contrast('#FFFFFF', tile) >= 3 ? '#FFFFFF' : BT.ink)}</div>
        <div data-qa="text" class="k-hl" style="position:relative;font-size:${String(sc.caption).length > 34 ? 44 : 52}px;line-height:1.12;color:${capC};font-weight:${LK.headWeight};${up ? 'text-transform:uppercase;' : ''}--acc:${readable(BT.accent, LK.surface, 3)}">${accentize(sc.caption, 'ka')}</div>` });
    return `${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 330, w: 920, size: 88, align: 'center' }) : ''}${phone}${cap}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, q = s => X.$('#' + id + s), P = SCENES['phone-call'].plan(sc, X), g = SCENES['phone-call'].geo(sc), fwd = sc.action === 'forward';
    const ph = q('p'), tA = P.tA, tC = P.tC;
    if (sc.head) X.head(`#${id}h`, X.tIn);
    tl.set(ph, { autoAlpha: 0 }, 0).set(ph, { autoAlpha: 1, y: 220, rotation: -2 }, X.tIn - .15).to(ph, { y: 0, rotation: 0, duration: .6, ease: 'lr.out' }, X.tIn - .15);
    // ringing: the phone buzzes in bursts, rings pulse out of the caller, the dots tick
    const rings = [...ph.querySelectorAll('.pcr')], dots = [...ph.querySelectorAll('.pcd')], av = q('av');
    tl.set(rings, { autoAlpha: 0 }, 0);
    let k = 0;
    for (let t = X.tIn + .35; t < tA - .25; t += 1.1, k++) {
      [-3.5, 3.5, -3, 3, -2, 0].forEach((r, j) => tl.to(ph, { rotation: r, duration: .06, ease: 'none' }, t + j * .06));
      tl.to(av, { scale: 1.06, duration: .12, ease: 'power1.out' }, t).to(av, { scale: 1, duration: .3, ease: 'power1.in' }, t + .12);
    }
    k = 0;
    for (let t = X.tIn + .3; t < tA - .2; t += .55, k++) {
      const r = rings[k % 3], d = Math.min(1.5, tA - t);
      tl.fromTo(r, { autoAlpha: .7, scale: 1 }, { autoAlpha: 0, scale: 1.9, duration: d, ease: 'power1.out', immediateRender: false }, t);
    }
    tl.set(rings, { autoAlpha: 0 }, tA);
    tl.set(dots, { autoAlpha: 0 }, 0);
    for (let t = X.tIn + .2, j = 0; t < tA; t += .3, j++) tl.set(dots, { autoAlpha: (i => i <= j % 4 - 1 ? 1 : 0) }, t);
    // the cue: the button is pressed, the other one slides away, the status swaps, the caller fades back
    const bd = q('bd'), ba = q('ba'), rp = q('rp'), st = q('st'), st2 = q('st2'), hit = fwd ? ba : bd, other = fwd ? bd : ba;
    tl.to(ph, { rotation: 0, duration: .1 }, tA - .1);
    tl.to(hit, { scale: .86, duration: .1, ease: 'power2.out' }, tA).to(hit, { scale: 1, duration: .35, ease: 'back.out(3)' }, tA + .1);
    tl.set(rp, { autoAlpha: 0 }, 0).fromTo(rp, { autoAlpha: .9, scale: 1 }, { autoAlpha: 0, scale: 1.8, duration: .6, ease: 'power2.out', immediateRender: false }, tA + .05);
    tl.to(other, { y: 60, autoAlpha: 0, duration: .3, ease: 'lr.in' }, tA + .1);
    tl.to(hit, { x: (fwd ? -120 : 120), duration: .45, ease: 'lr.move' }, tA + .2);
    tl.set(st2, { autoAlpha: 0 }, 0).to(st, { autoAlpha: 0, y: -16, duration: .2, ease: 'lr.in' }, tA + .1).set(st2, { autoAlpha: 1, y: 16 }, tA + .3).to(st2, { y: 0, duration: .35, ease: 'lr.out' }, tA + .3);
    if (fwd) tl.to(av, { x: 120, scale: .7, duration: .5, ease: 'lr.move' }, tA + .2).to(av, { x: 0, scale: 1, duration: .5, ease: 'lr.out' }, tA + .75);
    else tl.to(av, { scale: .88, duration: .4, ease: 'lr.out' }, tA + .1);
    if (LK.thread) X.dot(g.x + g.w + 44, g.y + 150, tA + .55, { r: 14 });   // beside the phone, clear of the caller's name
    // the reply card pops over the phone
    const cc = q('cc');
    tl.set(cc, { autoAlpha: 0 }, 0).set(cc, { autoAlpha: 1, y: 120, scale: .9, transformOrigin: '50% 100%' }, tC).to(cc, { y: 0, scale: 1, duration: .5, ease: 'back.out(1.6)' }, tC);
    tl.to(ph, { y: -30, duration: .6, ease: 'lr.move' }, tC);
    if (LK.thread) X.dot(940, g.y + g.h - 300 + 30, tC + .45, { r: 16 });
    tl.to(ph, { autoAlpha: 0, y: -100, duration: .3, ease: 'lr.in' }, X.tOut).to(cc, { autoAlpha: 0, y: -70, duration: .3, ease: 'lr.in' }, X.tOut);
  },
};
