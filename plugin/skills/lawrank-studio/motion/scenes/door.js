/* door: an office door with the firm's mark on its glass. On the cue it swings open onto a warm, lit office, light
   spills across the floor, and the welcome line sits above. */
SCENES.door = {
  label: 'Office door opens', about: "An office door with the firm's mark on the glass swings open onto warm light; light spills across the floor under a welcome line.",
  good: 'welcome, "our door is open", first consultation, visiting the office, a warm close before the call to action', practice: 'any',
  fields: { head: 'the welcome line (2-6 words); **phrase** = accent', sign: "optional text on the door glass (default: the firm's short name)" },
  example: { say: 'Our door is always open. Come in, and tell us what happened.', head: 'Our door is **open.**' },
  sfx: (sc, X) => [{ kind: 'soft', at: X.tIn }, { kind: 'whoosh', at: SCENES.door.tOpen(sc, X) }, { kind: 'chime', at: SCENES.door.tOpen(sc, X) + .3 }],
  tOpen(sc, X) { const t = X.times([sc.head])[0]; return Math.min(X.tOut - 1.2, Math.max(X.tIn + 1.1, t + .9)); },
  html(sc, X) {
    const LK = X.LK, id = X.id, nm = LK.name, sign = sc.sign || BT.short, up = LK.headCase === 'upper';
    const D = { x: 290, y: 740, w: 500, h: 800 };
    const sil = nm === 'silhouette', thr = nm === 'thread';
    const wall = thr ? LK.bg : nm === 'flat' ? LK.bg : nm === 'cards' ? 'transparent' : LK.bg;
    const door = thr ? '#FFFFFF' : nm === 'flat' ? LK.fillB : nm === 'cards' ? '#FFFFFF' : LK.ink;
    const frame = thr ? '#FFFFFF' : nm === 'flat' ? mix(LK.fillB, '#000000', .3) : nm === 'cards' ? '#FFFFFF' : LK.ink;
    const edge = thr ? `stroke="${LK.ink}" stroke-width="5"` : '';
    const glass = sil ? LK.surface : thr ? mix(BT.accent, '#FFFFFF', .93) : nm === 'flat' ? mix(LK.bg, '#FFFFFF', .82) : `url(#${id}gl)`;
    const gInk = sil ? LK.ink : BT.ink, mark = sil ? LK.accent : nm === 'flat' ? LK.fillB : BT.accent;
    const warm = mix(mix(BT.accent, '#FFD48A', .7), '#FFFFFF', .45), warm2 = mix(BT.accent, '#FFB04A', .5);
    const fs = String(sign).length > 16 ? 36 : String(sign).length > 10 ? 44 : 52;
    const room = `<svg class="k-abs" style="left:${D.x}px;top:${D.y}px" width="${D.w}" height="${D.h}" viewBox="0 0 ${D.w} ${D.h}">
        <defs><radialGradient id="${id}lg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="${warm}"/><stop offset="1" stop-color="${warm2}"/></radialGradient></defs>
        <rect width="${D.w}" height="${D.h}" fill="url(#${id}lg)"/>
        <g fill="${mix(warm2, BT.ink, .35)}" opacity=".55"><rect x="150" y="150" width="200" height="250" fill="none" stroke="${mix(warm2, BT.ink, .35)}" stroke-width="12"/><rect x="244" y="150" width="12" height="250"/><rect x="150" y="270" width="200" height="12"/>
          <rect x="60" y="560" width="380" height="26"/><rect x="80" y="586" width="20" height="214"/><rect x="400" y="586" width="20" height="214"/>
          <path d="M300,560 L304,520 L352,520 L356,560Z"/><path d="M330,520 C320,480 336,440 360,430 C352,460 356,490 344,520Z"/></g></svg>`;
    const doorSvg = `<svg id="${id}d" class="k-abs" style="left:${D.x}px;top:${D.y}px;overflow:visible" width="${D.w}" height="${D.h}" viewBox="0 0 ${D.w} ${D.h}">
        <defs><linearGradient id="${id}gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${mix(BT.accent, '#FFFFFF', .9)}"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient></defs>
        <rect width="${D.w}" height="${D.h}" fill="${door}" ${edge}/>
        <rect x="60" y="70" width="${D.w - 120}" height="380" fill="${glass}" ${thr ? `stroke="${LK.ink}" stroke-width="4"` : ''}/>
        <path d="${markPath(D.w / 2, 190, 64)}" fill="${mark}"/>
        <rect x="70" y="520" width="${D.w - 140}" height="${D.h - 590}" fill="none" stroke="${thr ? LK.ink : sil ? mix(LK.ink, LK.bg, .25) : mix(door, '#000000', .14)}" stroke-width="${thr ? 4 : 6}"/>
        <rect x="${D.w - 70}" y="470" width="44" height="16" rx="8" fill="${thr ? LK.ink : sil ? LK.accent : nm === 'flat' ? '#FFFFFF' : mix(BT.ink, '#FFFFFF', .3)}"/>
        <circle cx="${D.w - 48}" cy="478" r="16" fill="${thr ? LK.ink : sil ? LK.accent : nm === 'flat' ? '#FFFFFF' : mix(BT.ink, '#FFFFFF', .3)}"/></svg>`;
    return `<div id="${id}all" class="k-abs" style="inset:0"><div id="${id}w" class="k-abs" style="inset:0">
        ${nm === 'cards' ? `<div class="k-abs" style="left:${D.x - 120}px;top:${D.y - 120}px;width:${D.w + 240}px;height:${D.h + 120}px;border-radius:40px 40px 0 0;background:rgba(255,255,255,.55);box-shadow:0 40px 90px rgba(30,20,10,.12)"></div>` : ''}
        ${sil ? `<div class="k-abs" style="left:0;right:0;top:${D.y + D.h}px;bottom:0;background:${LK.ink}"></div>` : `<div class="k-abs" style="left:0;right:0;top:${D.y + D.h}px;height:6px;background:${thr ? LK.ink : mix(LK.bg, '#000000', .18)}"></div>`}
        <div class="k-abs" style="left:${D.x - 34}px;top:${D.y - 34}px;width:${D.w + 68}px;height:${D.h + 34}px;background:${frame};${thr ? `border:5px solid ${LK.ink};border-bottom:0;` : nm === 'cards' ? 'box-shadow:0 20px 50px rgba(30,20,10,.16);' : ''}"></div>
        ${room}</div>
      <svg id="${id}sp" class="k-abs" style="left:0;top:${D.y + D.h}px;overflow:visible" width="1080" height="400"><path d="M${D.x},0 L${D.x + D.w},0 L${D.x + D.w + 380},380 L${D.x - 300},380Z" fill="${sil ? warm : warm}" opacity="${sil ? .9 : .6}"/></svg>
      <div id="${id}rays" class="k-abs" style="left:${D.x - 200}px;top:${D.y - 200}px;width:${D.w + 400}px;height:${D.h + 400}px;background:radial-gradient(closest-side, ${warm}cc, ${warm}00)"></div>
      ${doorSvg}
      <div id="${id}s" class="k-abs" data-qa="text" style="left:${D.x + 70}px;top:${D.y + 270}px;width:${D.w - 140}px;text-align:center;font:${LK.headWeight} ${fs}px/1.08 var(--head);color:${gInk};${up || sil ? 'text-transform:uppercase;letter-spacing:.04em;' : ''}">${esc(sign)}</div></div>
      ${UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 340, w: 920, size: String(sc.head).length > 24 ? 86 : 100, align: 'center' })}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, tO = SCENES.door.tOpen(sc, X), d = `#${id}d`, s = `#${id}s`, w = `#${id}w`;
    X.head(`#${id}h`, X.tIn);
    tl.set([w, d], { autoAlpha: 0 }, 0).set([w, d], { autoAlpha: 1, y: 100 }, X.tIn - .1).to([w, d], { y: 0, duration: .7, ease: 'lr.out' }, X.tIn - .1);
    tl.set(s, { autoAlpha: 0 }, 0).set(s, { autoAlpha: 1, y: 20 }, X.tIn + .4).to(s, { y: 0, duration: .45, ease: 'lr.out' }, X.tIn + .4);
    // a slow push toward the door the whole time
    tl.fromTo(`#${id}all`, { scale: 1 }, { scale: 1.06, transformOrigin: '540px 1100px', duration: X.t1 - X.tIn, ease: 'none', immediateRender: false }, X.tIn);
    // the door opens on its hinge; the sign goes with it
    tl.to(d, { rotationY: -72, transformPerspective: 2800, transformOrigin: '0% 50%', duration: 1.1, ease: 'lr.move' }, tO);
    tl.to(s, { autoAlpha: 0, x: -120, scaleX: .4, transformOrigin: '0% 50%', duration: .35, ease: 'lr.in' }, tO);
    tl.set([`#${id}sp`, `#${id}rays`], { autoAlpha: 0 }, 0);
    tl.fromTo(`#${id}sp`, { autoAlpha: 0, scaleX: .2, transformOrigin: '50% 0%' }, { autoAlpha: 1, scaleX: 1, duration: .9, ease: 'lr.out', immediateRender: false }, tO + .2);
    tl.fromTo(`#${id}rays`, { autoAlpha: 0, scale: .7 }, { autoAlpha: 1, scale: 1.05, duration: 1, ease: 'lr.out', immediateRender: false }, tO + .25);
    if (LK.thread) X.dot(540, 1100, tO + .7, { r: 22 });
    tl.to([w, d, `#${id}sp`, `#${id}rays`], { autoAlpha: 0, duration: .32, ease: 'power1.in' }, X.tOut + .05);
    tl.set(s, { autoAlpha: 0 }, X.tOut);
  },
};
