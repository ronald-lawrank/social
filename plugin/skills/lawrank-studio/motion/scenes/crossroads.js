/* crossroads: a person seen from behind where the road forks; two signposts name the options as they are said, and on
   the key word the chosen one lights up, its path draws in the accent and the person steps toward it. */
const XRB = {
  neck: 'M284,180 L320,180 L323,228 L281,228Z',
  legs: 'M226,536 L382,536 C384,580 382,620 376,660 C370,720 364,770 368,810 C372,860 378,900 380,930 L344,934 C340,900 334,860 330,816 C326,770 316,700 306,640 L300,606 L294,640 C288,700 282,770 280,816 C278,860 276,900 276,932 L240,932 C238,900 236,860 236,816 C234,770 230,700 228,640 C226,600 225,570 226,536Z',
  shoeL: 'M240,924 L277,924 C281,936 282,950 280,960 L222,960 C220,946 228,932 240,924Z',
  shoeR: 'M344,926 L380,924 C394,930 404,944 404,960 L342,960 C340,948 340,936 344,926Z',
  armL: 'M228,236 C206,240 196,258 194,282 L188,410 L192,560 L222,560 L226,410 L238,300Z',
  armR: 'M376,236 C398,240 408,258 410,282 L416,410 L412,560 L382,560 L380,410 L368,300Z',
  handL: 'M191,552 C184,574 188,601 204,605 C218,608 228,594 227,573 L225,552Z',
  handR: 'M413,552 C420,574 416,601 400,605 C386,608 376,594 377,573 L379,552Z',
  coatBack: 'M282,222 C262,224 236,230 222,240 C210,248 206,262 207,280 C210,320 222,350 228,384 C232,420 230,470 226,560 L378,560 C374,470 372,420 376,384 C382,350 394,320 397,280 C398,262 394,248 382,240 C368,230 342,224 322,222Z',
  earL: 'M258,130 C248,126 244,140 248,150 C251,158 258,160 262,156Z',
  earR: 'M346,130 C356,126 360,140 356,150 C353,158 346,160 342,156Z',
  hairBack: 'M250,140 C242,96 266,66 302,66 C340,66 362,94 354,140 C352,160 346,176 336,186 C318,192 286,192 268,186 C258,176 252,160 250,140Z',
};
SCENES.crossroads = {
  label: 'Crossroads', about: 'A person seen from behind stands where the road forks; two signposts name the options, and on the key word one lights up and its path draws toward it.',
  good: 'two choices (settle or fight, wait or act, do it alone or call us), decisions after an accident or charge', practice: 'any',
  fields: { head: 'optional headline (2-6 words)', left: 'left option (1-3 words), said in the line', right: 'right option (1-3 words), said in the line',
    choose: "'left' | 'right': the option that lights up (when the voice says it again, or at the end of the line)" },
  example: { say: 'You can handle it alone, or you can call a lawyer. Call a lawyer, and you have someone on your side.',
    head: 'Two roads.', left: 'Handle it alone', right: 'Call a lawyer', choose: 'right' },
  sfx: (sc, X) => { const ts = X.times([sc.left, sc.right, sc.choose === 'left' ? sc.left : sc.right]); return [{ kind: 'pop', at: ts[0] }, { kind: 'pop', at: ts[1] }, { kind: 'chime', at: Math.max(ts[2], ts[1] + .7) }]; },
  pal(LK) {
    const n = LK.name, ink = LK.ink;
    if (n === 'silhouette') return { skin: ink, hair: ink, top: ink, bottom: ink, shoe: ink, stroke: 'none', sw: 0, road: LK.fillB, edge: 'none', line: LK.bg, board: LK.surface, boardInk: ink, on: ink, onInk: LK.bg, post: ink };
    if (n === 'thread') return { skin: '#FFFFFF', hair: ink, top: '#FFFFFF', bottom: '#FFFFFF', shoe: ink, stroke: ink, sw: 10, road: '#FFFFFF', edge: ink, line: mix(ink, LK.bg, .5), board: '#FFFFFF', boardInk: ink, on: BT.accent, onInk: contrast('#FFFFFF', BT.accent) >= 3 ? '#FFFFFF' : BT.ink, post: ink };
    if (n === 'flat') return { skin: '#E8B894', hair: mix(BT.ink, '#000000', .3), top: LK.fillB, bottom: mix(BT.ink, '#000000', .15), shoe: '#141414', stroke: 'none', sw: 0, road: mix(LK.bg, '#FFFFFF', .2), edge: 'none', line: '#FFFFFF',
      board: '#FFFFFF', boardInk: BT.ink, on: LK.fillB, onInk: readable('#FFFFFF', LK.fillB, 4.5), post: LK.fillB };
    return { skin: '#E3B896', hair: '#2C2F33', top: mix(BT.ink, '#FFFFFF', .22), bottom: BT.ink, shoe: '#18191B', stroke: 'none', sw: 0, road: '#FFFFFF', edge: 'none', line: mix(BT.accent, '#FFFFFF', .6),
      board: '#FFFFFF', boardInk: BT.ink, on: BT.accent, onInk: contrast('#FFFFFF', BT.accent) >= 3 ? '#FFFFFF' : BT.ink, post: mix(BT.ink, '#FFFFFF', .55) };
  },
  html(sc, X) {
    const LK = X.LK, id = X.id, nm = LK.name, P = SCENES.crossroads.pal(LK), up = LK.headCase === 'upper';
    const person = [['skin', XRB.neck], ['bottom', XRB.legs], ['shoe', XRB.shoeL], ['shoe', XRB.shoeR], ['top', XRB.armL], ['top', XRB.armR], ['skin', XRB.handL], ['skin', XRB.handR],
      ['top', XRB.coatBack], ['skin', XRB.earL], ['skin', XRB.earR], ['hair', XRB.hairBack]].map(([r, d]) => `<path d="${d}" fill="${P[r]}" stroke="${P.stroke}" stroke-width="${P.sw}" stroke-linejoin="round"/>`).join('');
    const road = 'M290,1580 L468,1214 C440,1120 360,1050 238,996 L338,972 C430,1016 500,1080 540,1146 C580,1080 650,1016 742,972 L842,996 C720,1050 640,1120 612,1214 L790,1580Z';
    const sh = nm === 'silhouette' ? 'drop-shadow(12px 14px 0 rgba(0,0,0,.16))' : nm === 'flat' ? `drop-shadow(0 12px 0 ${mix(LK.bg, '#000000', .25)})` : nm === 'cards' ? 'drop-shadow(0 26px 30px rgba(30,20,10,.18))' : 'none';
    const sign = (side, text) => { const L = side === 'left', x = L ? 70 : 590, w = 420, h = 160, fs = String(text).length > 14 ? 42 : 50;
      const d = L ? `M40,0 H${w} V${h} H40 L0,${h / 2}Z` : `M0,0 H${w - 40} L${w},${h / 2} L${w - 40},${h} H0Z`;
      return `<div id="${id}${side}" class="k-abs" style="left:${x}px;top:700px;width:${w}px;height:${h + 150}px">
        <div class="k-abs" style="left:${w / 2 - 9}px;top:${h - 10}px;width:18px;height:170px;background:${P.post}"></div>
        <svg class="k-abs xrb" style="left:0;top:0;overflow:visible;filter:${sh}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${d}" fill="${P.board}" stroke="${P.edge === 'none' ? 'none' : P.edge}" stroke-width="6" stroke-linejoin="round"/>
          <path class="xron" d="${d}" fill="${P.on}"/></svg>
        <div class="k-abs xrt" data-qa="text" style="left:${L ? 56 : 24}px;width:${w - 80}px;top:0;height:${h}px;display:flex;align-items:center;justify-content:center;text-align:center;
          font:${LK.headWeight} ${fs}px/1.08 var(--head);color:${P.boardInk};${up ? 'text-transform:uppercase;' : ''}">${esc(text)}</div>
        <div class="k-abs xrt2" style="left:${L ? 56 : 24}px;width:${w - 80}px;top:0;height:${h}px;display:flex;align-items:center;justify-content:center;text-align:center;
          font:${LK.headWeight} ${fs}px/1.08 var(--head);color:${P.onInk};${up ? 'text-transform:uppercase;' : ''}"${side === (sc.choose === 'left' ? 'left' : 'right') ? ' data-qa="text"' : ''}>${esc(text)}</div></div>`; };   // the lit copy only counts where it lights
    const sky = nm === 'silhouette' ? `<div class="k-abs" style="left:290px;top:700px;width:500px;height:500px;border-radius:50%;background:${LK.accent};opacity:.85"></div>`
      : nm === 'flat' ? `<div class="k-abs" style="left:240px;top:620px;width:600px;height:600px;border-radius:50%;background:${mix(LK.bg, '#FFFFFF', .14)}"></div>`
      : nm === 'cards' ? `<div class="k-abs" style="left:140px;top:640px;width:800px;height:800px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,255,255,.75),rgba(255,255,255,0))"></div>` : '';
    return `<div id="${id}sk" class="k-abs" style="inset:0">${sky}</div>
      <svg id="${id}r" class="k-abs" style="left:0;top:0;overflow:visible" width="1080" height="1920" viewBox="0 0 1080 1920">
        <path class="xrrd" d="${road}" fill="${P.road}" stroke="${P.edge === 'none' ? 'none' : P.edge}" stroke-width="5" stroke-linejoin="round" ${nm === 'cards' ? 'style="filter:drop-shadow(0 20px 30px rgba(30,20,10,.12))"' : ''}/>
        <path id="${id}pl" d="M540,1560 L540,1250 C534,1130 420,1040 288,984" fill="none" stroke="${P.line}" stroke-width="10" stroke-dasharray="2 26" stroke-linecap="round"/>
        <path id="${id}pr" d="M540,1560 L540,1250 C546,1130 660,1040 792,984" fill="none" stroke="${P.line}" stroke-width="10" stroke-dasharray="2 26" stroke-linecap="round"/>
        <path id="${id}cl" d="M540,1500 L540,1250 C534,1130 420,1040 288,984" fill="none" stroke="${nm === 'flat' ? '#FFFFFF' : nm === 'silhouette' ? LK.accent : BT.accent}" stroke-width="16" stroke-linecap="round"/>
        <path id="${id}cr" d="M540,1500 L540,1250 C546,1130 660,1040 792,984" fill="none" stroke="${nm === 'flat' ? '#FFFFFF' : nm === 'silhouette' ? LK.accent : BT.accent}" stroke-width="16" stroke-linecap="round"/></svg>
      ${sign('left', sc.left)}${sign('right', sc.right)}
      <svg id="${id}m" class="k-abs" style="left:${540 - 120}px;top:${1580 - 384}px;overflow:visible;${nm === 'silhouette' ? 'filter:drop-shadow(10px 12px 0 rgba(0,0,0,.16))' : ''}" width="240" height="400" viewBox="0 0 600 1000">${person}</svg>
      ${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 340, w: 920, size: 96, align: 'center' }) : ''}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, nm = LK.name, ch = sc.choose === 'left' ? 'left' : 'right', other = ch === 'left' ? 'right' : 'left';
    const ts = X.times([sc.left, sc.right, ch === 'left' ? sc.left : sc.right]), tC = Math.max(ts[2], ts[1] + .7);
    if (sc.head) X.head(`#${id}h`, X.tIn);
    const r = `#${id}r`, m = `#${id}m`;
    tl.set([r, `#${id}sk`], { autoAlpha: 0 }, 0).set([r, `#${id}sk`], { autoAlpha: 1, y: 120 }, X.tIn - .1).to([r, `#${id}sk`], { y: 0, duration: .7, ease: 'lr.out' }, X.tIn - .1);
    tl.fromTo(`#${id}sk`, { scale: .92, transformOrigin: '50% 60%' }, { scale: 1.04, duration: X.t1 - X.tIn, ease: 'none', immediateRender: false }, X.tIn);
    tl.set([`#${id}pl`, `#${id}pr`], { drawSVG: '0%' }, 0).to([`#${id}pl`, `#${id}pr`], { drawSVG: '100%', duration: .9, ease: 'power2.inOut' }, X.tIn + .2);
    tl.set([`#${id}cl`, `#${id}cr`], { autoAlpha: 0, drawSVG: '0%' }, 0);
    tl.set(m, { autoAlpha: 0 }, 0).set(m, { autoAlpha: 1, y: 90 }, X.tIn + .1).to(m, { y: 0, duration: .6, ease: 'lr.out' }, X.tIn + .1);
    ['left', 'right'].forEach((s, i) => { const el = `#${id}${s}`, t = Math.max(X.tIn + .3, ts[i] - .1), q = X.$(el);
      tl.set(el, { autoAlpha: 0 }, 0).set(el, { autoAlpha: 1, y: 60, rotation: i ? 4 : -4, transformOrigin: '50% 100%' }, t).to(el, { y: 0, rotation: 0, duration: .55, ease: 'back.out(1.6)' }, t);
      tl.set(q.querySelectorAll('.xron, .xrt2'), { autoAlpha: 0 }, 0); });
    // the choice: the chosen board lights up, the other steps back, the path draws, the person takes a step
    const C = X.$(`#${id}${ch}`), O = `#${id}${other}`;
    tl.set(C.querySelectorAll('.xron'), { autoAlpha: 1, scaleX: 0, transformOrigin: ch === 'left' ? '100% 50%' : '0% 50%' }, tC).to(C.querySelectorAll('.xron'), { scaleX: 1, duration: .4, ease: 'lr.out' }, tC);
    tl.set(C.querySelector('.xrt2'), { autoAlpha: 1 }, tC + .18).set(C.querySelector('.xrt'), { autoAlpha: 0 }, tC + .18);
    tl.fromTo(C, { scale: 1 }, { scale: 1.08, duration: .5, ease: 'back.out(2)', immediateRender: false }, tC);
    tl.to(O, { autoAlpha: .35, scale: .94, duration: .4, ease: 'lr.out' }, tC);
    tl.to(`#${id}p${other[0]}`, { autoAlpha: .3, duration: .4 }, tC);
    tl.set(`#${id}c${ch[0]}`, { autoAlpha: 1 }, tC + .1).to(`#${id}c${ch[0]}`, { drawSVG: '100%', duration: .9, ease: 'power2.inOut' }, tC + .1);
    tl.to(m, { x: ch === 'left' ? -30 : 30, y: -40, scale: .9, transformOrigin: '50% 100%', duration: 1.2, ease: 'lr.move' }, tC + .3);
    if (LK.thread) X.dot(ch === 'left' ? 90 : 990, 780, tC + .3, { r: 18 });
    tl.to([`#${id}left`, `#${id}right`], { y: -60, autoAlpha: 0, duration: .3, ease: 'lr.in' }, X.tOut);
    tl.to([r, m, `#${id}sk`], { y: 80, autoAlpha: 0, duration: .32, ease: 'lr.in' }, X.tOut + .04);
  },
};
