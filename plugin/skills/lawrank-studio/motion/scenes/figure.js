/* figure: an illustrated person in a moment (drawn in SVG: no photos), over a layered collage that drifts in parallax.
   Poses: phone, crutches, desk, family, crossroads. Every pose is drawn once as parts (head, hair, torso, limbs, props) and
   coloured by the look: solid cut-outs (silhouette), line art (thread), flat colour (flat, cards). */
const FGM = {   // standing man, front view (8 heads)
  head: 'M256,136 C256,100 276,80 302,80 C328,80 348,100 348,136 C348,164 334,188 314,194 C306,196 298,196 290,194 C270,188 256,164 256,136Z',
  earL: 'M258,130 C248,126 244,140 248,150 C251,158 258,160 262,156Z', earR: 'M346,130 C356,126 360,140 356,150 C353,158 346,160 342,156Z',
  hair: 'M252,138 C244,98 266,68 302,68 C340,68 360,92 354,134 C352,116 346,104 334,98 C316,104 282,106 262,100 C256,110 253,122 252,138Z',
  hairBack: 'M250,140 C242,96 266,66 302,66 C340,66 362,94 354,140 C352,160 346,176 336,186 C318,192 286,192 268,186 C258,176 252,160 250,140Z',
  neck: 'M284,180 L320,180 L323,228 L281,228Z',
  torso: 'M282,222 C262,224 236,230 222,240 C210,248 206,262 207,280 C210,320 222,350 230,384 C236,410 234,430 232,452 C229,486 226,516 224,550 L292,550 L302,534 L312,550 L384,550 C380,516 376,486 372,452 C370,430 368,410 374,384 C382,350 394,320 397,280 C398,262 394,248 382,240 C368,230 342,224 322,222Z',
  coatBack: 'M282,222 C262,224 236,230 222,240 C210,248 206,262 207,280 C210,320 222,350 228,384 C232,420 230,470 226,560 L378,560 C374,470 372,420 376,384 C382,350 394,320 397,280 C398,262 394,248 382,240 C368,230 342,224 322,222Z',
  sweater: 'M284,222 C262,224 236,230 222,240 C210,248 206,262 207,280 C210,320 220,350 226,384 C230,420 230,470 228,530 C228,540 232,548 240,548 L364,548 C372,548 376,540 376,530 C374,470 374,420 378,384 C384,350 394,320 397,280 C398,262 394,248 382,240 C368,230 342,224 320,222 C312,234 292,234 284,222Z',
  shirt: 'M280,216 L302,276 L324,216 L314,211 L302,230 L290,211Z',
  tie: 'M297,230 L307,230 L311,242 L306,248 L313,368 L302,386 L291,368 L298,248 L293,242Z',
  legs: 'M226,536 L382,536 C384,580 382,620 376,660 C370,720 364,770 368,810 C372,860 378,900 380,930 L344,934 C340,900 334,860 330,816 C326,770 316,700 306,640 L300,606 L294,640 C288,700 282,770 280,816 C278,860 276,900 276,932 L240,932 C238,900 236,860 236,816 C234,770 230,700 228,640 C226,600 225,570 226,536Z',
  shoeL: 'M240,924 L277,924 C281,936 282,950 280,960 L222,960 C220,946 228,932 240,924Z',
  shoeR: 'M344,926 L380,924 C394,930 404,944 404,960 L342,960 C340,948 340,936 344,926Z',
  pocketUp: 'M228,236 C206,240 196,258 194,282 L178,392 C176,406 186,416 198,414 L222,406 L234,300Z',
  pocketLo: 'M180,394 C176,410 186,422 200,424 L236,522 L262,508 L222,402Z',
  armL: 'M228,236 C206,240 196,258 194,282 L188,410 L192,560 L222,560 L226,410 L238,300Z',
  handL: 'M191,552 C184,574 188,601 204,605 C218,608 228,594 227,573 L225,552Z',
  armR: 'M376,236 C398,240 408,258 410,282 L416,410 L412,560 L382,560 L380,410 L368,300Z',
  handR: 'M413,552 C420,574 416,601 400,605 C386,608 376,594 377,573 L379,552Z',
};
const FGcrutch = (x0, y0, x1, y1) => {   // axillary crutch from the armpit pad (x0,y0) to the tip (x1,y1)
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux, P = (t, o) => `${(x0 + dx * t + nx * o).toFixed(1)},${(y0 + dy * t + ny * o).toFixed(1)}`;
  return [
    ['prop', `M${P(0, -16)} L${P(0, 16)} L${P(.62, 7)} L${P(.97, 6)} L${P(.97, -6)} L${P(.62, -7)}Z`],
    ['prop', `M${P(-.012, -34)} C${P(-.03, -34)} ${P(-.03, 34)} ${P(-.012, 34)} L${P(.012, 34)} C${P(.03, 34)} ${P(.03, -34)} ${P(.012, -34)}Z`],
    ['prop', `M${P(.36, -24)} L${P(.36, 24)} L${P(.385, 24)} L${P(.385, -24)}Z`],
    ['prop', `M${P(.965, -11)} L${P(.965, 11)} L${P(1, 9)} L${P(1, -9)}Z`],
  ];
};
const FGR = {
  parts: {
    phone: [
      ['skin', FGM.neck], ['bottom', FGM.legs], ['shoe', FGM.shoeL], ['shoe', FGM.shoeR],
      ['top', FGM.pocketUp], ['top', FGM.pocketLo], ['top', FGM.torso], ['shirt', FGM.shirt], ['tie', FGM.tie], ['skin', FGM.earL], ['skin', FGM.head], ['hair', FGM.hair],
      ['top', 'M374,232 C396,234 412,248 420,266 L468,338 C476,352 470,368 456,372 C446,374 438,370 432,362 L384,300Z'],
      ['top', 'M432,362 C440,376 462,378 470,362 L392,166 L362,176Z'],
      ['prop', 'M344,98 L368,96 L372,180 L348,182Z'],
      ['skin', 'M354,178 C344,158 350,132 368,128 C386,126 396,144 392,164 C389,180 374,190 362,188Z'],
    ],
    crutches: [
      ...FGcrutch(204, 262, 128, 958), ...FGcrutch(400, 262, 476, 958),
      ['skin', FGM.neck],
      // standing on his right leg; the left is bent back in a cast, off the ground
      ['bottom', 'M302,540 L380,540 C384,600 380,660 372,720 C368,744 362,760 352,768 L318,768 C310,740 306,700 304,660Z'],
      ['cast', 'M318,742 L364,742 C372,770 372,812 364,838 C356,850 330,852 320,840 C312,812 312,770 318,742Z'],
      ['bottom', 'M226,536 L304,536 L306,606 C300,660 286,720 282,816 C280,860 278,900 278,932 L240,932 C238,900 236,860 236,816 C234,770 230,700 228,640 C226,600 225,570 226,536Z'],
      ['shoe', FGM.shoeL],
      ['top', FGM.sweater],
      ['top', 'M228,236 C206,240 196,258 194,282 L190,400 C190,414 200,422 212,420 L226,410 L236,300Z'],
      ['top', 'M192,404 C188,420 198,430 212,428 L194,530 L170,526Z'],
      ['skin', 'M164,512 C158,530 166,550 182,550 C196,550 204,536 200,520 L196,508Z'],
      ['top', 'M376,236 C398,240 408,258 410,282 L414,400 C414,414 404,422 392,420 L378,410 L368,300Z'],
      ['top', 'M412,404 C416,420 406,430 392,428 L410,530 L434,526Z'],
      ['skin', 'M440,512 C446,530 438,550 422,550 C408,550 400,536 404,520 L408,508Z'],
      ['skin', FGM.earL], ['skin', FGM.earR], ['skin', FGM.head], ['hair', FGM.hair],
    ],
    desk: [
      // chair
      ['prop2', 'M140,430 L160,428 L172,662 L152,664Z'], ['prop2', 'M142,640 L304,640 L304,664 L142,664Z'],
      ['prop2', 'M156,660 L170,660 L160,958 L146,958Z'], ['prop2', 'M286,660 L300,660 L312,958 L298,958Z'],
      // desk
      ['prop2', 'M352,606 L370,606 L370,958 L352,958Z'], ['prop2', 'M560,606 L578,606 L578,958 L560,958Z'],
      // the person: seated, elbow on the desk, head in hand
      ['bottom', 'M396,646 L432,650 L426,922 L394,922Z'],
      ['shoe', 'M388,914 L428,914 C452,920 470,936 472,958 L386,958Z'],
      ['bottom', 'M192,604 C192,580 212,570 236,572 L410,610 C430,614 440,632 438,650 C436,668 420,678 402,676 L222,664 C202,660 192,642 192,620Z'],
      ['top', 'M200,616 C192,560 198,500 214,452 C228,412 252,390 282,384 C308,380 330,390 342,408 C352,426 350,448 342,472 C328,522 304,572 294,616Z'],
      ['skin', 'M318,350 L350,342 L356,394 L322,402Z'],
      ['skin', 'M322,276 C330,248 360,236 388,246 C410,254 420,276 418,298 C424,306 430,314 426,318 C424,320 420,322 418,326 C420,334 418,340 410,342 C406,352 398,360 384,362 C366,366 344,358 334,344 C322,326 318,300 322,276Z'],
      ['hair', 'M316,300 C304,262 328,230 366,230 C396,230 416,248 418,270 C402,262 384,262 368,272 C354,282 346,298 342,320 C330,318 320,310 316,300Z'],
      ['prop2', 'M330,590 L594,590 L594,610 L330,610Z'],
      ['paper', 'M446,566 L560,560 L562,588 L448,590Z'], ['paper', 'M452,556 L566,554 L566,580 L452,582Z'], ['paper', 'M440,548 L552,540 L556,568 L444,574Z'],
      ['top', 'M284,402 C298,386 324,390 334,408 L436,566 C444,580 436,596 422,598 C410,600 402,594 396,586 L290,440Z'],
      ['top', 'M402,590 C406,606 434,606 438,590 L432,318 L402,318Z'],
      ['skin', 'M398,326 C390,306 400,284 420,282 C438,280 448,296 444,314 C440,330 424,338 410,334Z'],
      // lamp
      ['prop', 'M536,590 L584,590 L580,578 L540,578Z'], ['prop', 'M556,580 L564,580 L540,452 L532,454Z'],
      ['prop', 'M538,446 L500,432 L470,486 L520,500Z'],
    ],
    family: [
      // woman
      ['hair', 'M176,170 C168,112 196,84 232,84 C270,84 296,112 288,170 C286,200 292,226 286,246 L178,246 C172,226 178,200 176,170Z'],
      ['skin', 'M214,190 L250,190 L252,236 L212,236Z'],
      ['skin', 'M200,696 L222,696 L218,936 L200,936Z'], ['skin', 'M242,696 L264,696 L262,936 L244,936Z'],
      ['shoe', 'M198,928 L220,928 C224,940 224,952 222,960 L186,960 C186,946 190,934 198,928Z'], ['shoe', 'M244,928 L264,928 C272,934 278,946 278,960 L242,960 C240,950 240,938 244,928Z'],
      ['top', 'M186,240 C172,246 166,262 164,282 L156,420 L158,520 L182,520 L186,420 L196,300Z'],
      ['skin', 'M157,512 C151,532 155,556 169,560 C181,562 189,550 188,532 L185,512Z'],
      ['top', 'M206,232 C190,236 176,246 172,264 C168,300 170,340 180,384 C182,420 168,500 150,704 L314,704 C296,500 282,420 284,384 C292,340 294,300 290,264 C286,246 272,236 256,232 C248,242 214,242 206,232Z'],
      ['belt', 'M180,382 L284,382 L283,398 L181,398Z'],
      ['skin', 'M188,150 C188,116 206,96 232,96 C258,96 276,116 276,150 C276,178 260,200 240,204 C236,205 228,205 224,204 C204,200 188,178 188,150Z'],
      ['hair', 'M184,150 C184,110 206,90 234,90 C262,90 282,112 280,146 C262,134 236,126 214,124 C202,130 192,140 184,150Z'],
      ['top', 'M262,240 C280,244 290,260 292,282 L306,404 L282,408 L268,300Z'],
      ['top', 'M282,402 L306,398 L340,580 L316,586Z'],
      // child
      ['skin', 'M352,770 L374,770 L372,938 L354,938Z'], ['skin', 'M390,770 L412,770 L408,938 L392,938Z'],
      ['shoe', 'M350,930 L374,930 C378,942 378,952 376,960 L338,960 C338,946 342,936 350,930Z'], ['shoe', 'M390,930 L410,930 C420,936 426,948 426,960 L388,960 C386,950 386,940 390,930Z'],
      ['skin', 'M370,532 L392,532 L394,566 L368,566Z'],
      ['top2', 'M412,566 C426,570 432,584 432,600 L434,690 L414,690 L410,606Z'],
      ['skin', 'M414,684 C410,700 414,716 424,718 C434,718 438,706 434,690Z'],
      ['top2', 'M354,560 C342,564 334,576 334,592 L338,690 L328,780 L436,780 L426,690 L428,592 C428,576 422,564 410,560 C400,568 364,568 354,560Z'],
      ['top2', 'M358,566 C344,566 332,578 326,592 L320,600 L340,612 L356,596Z'],
      ['skin', 'M308,574 C300,590 306,610 322,614 C338,616 346,602 342,588 L332,574Z'],
      ['skin', 'M334,494 C334,462 354,444 382,444 C410,444 430,462 430,494 C430,524 410,544 382,544 C354,544 334,524 334,494Z'],
      ['hair', 'M330,496 C326,458 352,438 382,438 C414,438 436,460 432,496 C420,476 404,466 382,466 C360,466 342,476 330,496Z'],
      ['hair', 'M426,466 C448,462 462,482 456,508 C450,528 436,534 426,528 C438,512 436,492 426,482Z'],
    ],
    crossroads: [
      ['road', 'M60,960 L250,560 L260,520 L60,360 L150,360 L300,470 L450,360 L540,360 L340,520 L350,560 L540,960Z'],
      ['roadLine', 'M296,940 L298,900 M300,860 L300,820 M300,780 L300,740 M300,700 L300,670 M300,640 L300,618'],
      ['prop', 'M296,330 L306,330 L306,520 L296,520Z'], ['sign', 'M300,346 L196,352 L176,372 L196,392 L300,386Z'], ['sign', 'M302,396 L404,400 L424,420 L404,440 L302,436Z'],
      { g: 'translate(150,410) scale(.5)', parts: [
        ['skin', FGM.neck], ['bottom', FGM.legs], ['shoe', FGM.shoeL], ['shoe', FGM.shoeR], ['top', FGM.armL], ['top', FGM.armR], ['skin', FGM.handL], ['skin', FGM.handR],
        ['top', FGM.coatBack], ['skin', FGM.earL], ['skin', FGM.earR], ['hair', FGM.hairBack]] },
    ],
  },
};
Object.assign(FGR, {
  // where the thread dot lands on each pose (viewBox units)
  anchor: { phone: [400, 112], crutches: [302, 40], desk: [478, 520], family: [326, 548], crossroads: [300, 300] },
  pal(LK) {
    const n = LK.name, ink = LK.ink;
    if (n === 'silhouette') return { skin: ink, hair: ink, top: ink, top2: ink, bottom: ink, shoe: ink, prop: ink, prop2: ink, shirt: LK.bg, cast: LK.bg, paper: LK.bg,
      tie: LK.accent, belt: LK.accent, sign: LK.accent, road: LK.fillB, roadLine: LK.bg, stroke: 'none', sw: 0 };
    if (n === 'thread') return { skin: '#FFFFFF', hair: ink, top: '#FFFFFF', top2: '#FFFFFF', bottom: '#FFFFFF', shoe: ink, prop: ink, prop2: '#FFFFFF', shirt: '#FFFFFF', cast: '#FFFFFF', paper: '#FFFFFF',
      tie: BT.accent, belt: BT.accent, sign: BT.accent, road: '#FFFFFF', roadLine: ink, stroke: ink, sw: 5 };
    if (n === 'flat') return { skin: '#E8B894', hair: mix(BT.ink, '#000000', .3), top: LK.fillB, top2: '#FFFFFF', bottom: mix(BT.ink, '#000000', .15), shoe: '#141414', prop: '#141414',
      prop2: mix(LK.fillB, '#000000', .25), shirt: '#FFFFFF', cast: '#FFFFFF', paper: '#FFFFFF', tie: '#FFFFFF', belt: '#FFFFFF', sign: '#FFFFFF', road: mix(LK.bg, '#FFFFFF', .2), roadLine: '#FFFFFF', stroke: 'none', sw: 0 };
    return { skin: '#E3B896', hair: '#2C2F33', top: mix(BT.ink, '#FFFFFF', .22), top2: BT.accent, bottom: BT.ink, shoe: '#18191B', prop: '#18191B', prop2: '#CBD0D6',
      shirt: '#FFFFFF', cast: '#FFFFFF', paper: '#FFFFFF', tie: BT.accent, belt: BT.accent, sign: BT.accent, road: '#ECE6DF', roadLine: '#FFFFFF', stroke: 'none', sw: 0 };
  },
  svg(pose, P) {
    const one = x => x.g ? `<g transform="${x.g}">${x.parts.map(one).join('')}</g>`
      : x[0] === 'roadLine' ? `<path class="fgp" d="${x[1]}" fill="none" stroke="${P.roadLine}" stroke-width="8" stroke-linecap="round"/>`
      : `<path class="fgp" d="${x[1]}" fill="${P[x[0]]}" stroke="${P.stroke}" stroke-width="${P.sw}" stroke-linejoin="round"/>`;
    return (FGR.parts[pose] || FGR.parts.phone).map(one).join('');
  },
  // the collage behind the figure, in layers (depth 1 = far, 3 = near); each look has its own
  back(LK) {
    const n = LK.name, L = (d, inner, style = '') => `<div class="fgl k-abs" data-d="${d}" style="inset:0;${style}">${inner}</div>`;
    const sky = (fill, h, seed, extra = '') => { const r = seeded(seed); let x = -60, d = `M-60,1920 V${1920 - h}`;
      while (x < 1140) { const w = 70 + r() * 120, hh = h * (.45 + r() * .7); d += ` H${x.toFixed(0)} V${(1920 - hh).toFixed(0)} H${(x + w).toFixed(0)}`; x += w; }
      return `<svg class="k-abs" style="left:0;top:0" width="1080" height="1920" viewBox="0 0 1080 1920"><path d="${d} V1920Z" fill="${fill}" ${extra}/></svg>`; };
    if (n === 'silhouette') return L(1, sky(LK.fillC, 900, 7)) + L(2, sky(LK.fillB, 620, 3)) +
      L(2.5, `<div class="k-abs" style="left:250px;top:700px;width:580px;height:580px;border-radius:50%;background:${LK.accent};opacity:.9"></div>`) +
      L(3, `<div class="k-abs" style="left:0;right:0;top:1540px;height:380px;background:${LK.ink}"></div>`);
    if (n === 'thread') return L(1, `<svg class="k-abs fgd" style="left:0;top:0" width="1080" height="1920" viewBox="0 0 1080 1920" fill="none" stroke="${mix(LK.ink, LK.bg, .72)}" stroke-width="4">
        <path d="M60,1536 H1020"/><circle cx="820" cy="760" r="90"/><path d="M90,1536 V1180 H220 V1536 M240,1536 V1060 H330 V1536 M760,1536 V1120 H880 V1536 M900,1536 V1250 H1010 V1536"/>
        <path d="M130,860 c30,-40 90,-40 110,0 c40,-10 70,20 60,50 H120 c-30,0 -30,-50 10,-50Z"/></svg>`);
    if (n === 'flat') return L(1, `<div class="k-abs" style="left:-200px;top:520px;width:640px;height:640px;border-radius:50%;background:${mix(LK.bg, '#FFFFFF', .14)}"></div>
        <div class="k-abs" style="left:700px;top:1000px;width:520px;height:520px;border-radius:50%;background:${mix(LK.bg, '#000000', .1)}"></div>`) +
      L(2, `<div class="k-abs" style="left:190px;top:690px;width:700px;height:700px;border-radius:50%;background:${LK.fillC};opacity:.5"></div>`) +
      L(3, `<div class="k-abs" style="left:-100px;top:1500px;width:1280px;height:200px;border-radius:50%;background:${mix(LK.bg, '#000000', .16)}"></div>`);
    // cards: the scene sits on a big white card, small UI chips float around it at different depths
    const chip = (x, y, ic, w = 150) => `<div class="k-abs" style="left:${x}px;top:${y}px;width:${w}px;height:${w}px;border-radius:34px;background:#FFFFFF;box-shadow:${LK.shadow};display:flex;align-items:center;justify-content:center">${icon(ic, w * .42, BT.accent)}</div>`;
    return L(1, `<div class="k-abs" style="left:110px;top:620px;width:860px;height:940px;border-radius:44px;background:linear-gradient(180deg,#FFFFFF 0%,${mix(BT.accent, '#FFFFFF', .9)} 100%);box-shadow:${LK.shadow}"></div>`) +
      L(2.5, chip(40, 760, 'chat', 140) + chip(880, 980, 'doc', 150) + chip(70, 1310, 'heart', 120));
  },
});
SCENES.figure = {
  label: 'Person in a moment', about: 'An illustrated person (no photos) in a moment: on the phone, on crutches, at a desk with papers, a parent with a child, or at a fork in the road, over a layered collage that drifts in parallax, with a headline.',
  good: 'the human moment behind a case: the call, the injury, the paperwork, the family, the decision', practice: 'any',
  fields: { pose: "'phone' | 'crutches' | 'desk' | 'family' | 'crossroads'", head: 'headline above the figure (2-7 words); **phrase** = accent' },
  example: { say: "You're on the phone with the insurer again, and you still don't have answers.", pose: 'phone', head: 'Still **no answers?**' },
  sfx: (sc, X) => [{ kind: 'soft', at: X.tIn + .1 }],
  html(sc, X) {
    const LK = X.LK, id = X.id, pose = FGR.parts[sc.pose] ? sc.pose : 'phone', P = FGR.pal(LK);
    const sh = LK.name === 'silhouette' ? 'filter:drop-shadow(16px 18px 0 rgba(0,0,0,.16))' : LK.name === 'flat' ? `filter:drop-shadow(0 16px 0 ${mix(LK.bg, '#000000', .22)})` : '';
    const s = 0.94, W = 600 * s, H = 1000 * s, x = 540 - W / 2, y = 1560 - H + 18;
    return `<div id="${id}bk" class="k-abs" style="inset:0">${FGR.back(LK)}</div>
      <svg id="${id}f" class="k-abs" style="left:${x}px;top:${y}px;overflow:visible;${sh}" width="${W}" height="${H}" viewBox="0 0 600 1000">${FGR.svg(pose, P)}</svg>
      ${UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 330, w: 920, size: String(sc.head).length > 26 ? 84 : 98, align: 'center' })}`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, nm = LK.name, pose = FGR.parts[sc.pose] ? sc.pose : 'phone', f = `#${id}f`, D = X.t1 - X.tIn;
    const layers = [...X.$(`#${id}bk`).querySelectorAll('.fgl')];
    X.head(`#${id}h`, X.tIn);
    // parallax: far layers barely move, near layers travel; everything settles in from below at its own speed
    const tb = Math.max(.02, X.tIn - .25);
    layers.forEach(l => { const d = +l.dataset.d;
      tl.set(l, { autoAlpha: 0 }, 0).set(l, { autoAlpha: 1, y: 60 * d }, tb).to(l, { y: 0, duration: .7 + d * .08, ease: 'lr.out' }, tb);
      tl.fromTo(l, { x: 18 * d }, { x: -26 * d, duration: D + .3, ease: 'none', immediateRender: false }, tb);
      tl.to(l, { y: -40 * d, autoAlpha: 0, duration: .35, ease: 'lr.in' }, X.tOut); });
    if (nm === 'thread') { const ps = X.$(`#${id}bk`).querySelectorAll('.fgd *');
      tl.fromTo(ps, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.1, ease: 'power2.out', stagger: .05, immediateRender: false }, Math.max(.02, X.tIn - .1)); }
    tl.set(f, { autoAlpha: 0 }, 0);
    if (nm === 'thread') {      // the figure draws itself in line, then fills
      const ps = X.$(f).querySelectorAll('.fgp');
      tl.set(f, { autoAlpha: 1 }, X.tIn).fromTo(ps, { drawSVG: '0%', fillOpacity: 0 }, { drawSVG: '100%', duration: .9, ease: 'power2.inOut', stagger: .015, immediateRender: false }, X.tIn)
        .to(ps, { fillOpacity: 1, duration: .4, ease: 'power1.out' }, X.tIn + .8);
      const a = FGR.anchor[pose], r = X.$(f).getBoundingClientRect(), st = X.$(f).closest('.stage').getBoundingClientRect(), k = st.width / 1080;
      X.dot((r.left - st.left) / k + a[0] * r.width / k / 600, (r.top - st.top) / k + a[1] * r.height / k / 1000, X.tIn + 1.2, { r: 16 });
    } else if (nm === 'silhouette') {   // a cut-out slid in from the side
      tl.set(f, { autoAlpha: 1, x: -260, rotation: -4, transformOrigin: '50% 100%' }, X.tIn).to(f, { x: 0, rotation: 0, duration: .7, ease: 'lr.out' }, X.tIn);
    } else if (nm === 'flat') {
      tl.set(f, { autoAlpha: 1, scale: .4, transformOrigin: '50% 100%' }, X.tIn).to(f, { scale: 1, duration: .6, ease: 'back.out(1.5)' }, X.tIn);
    } else {
      tl.set(f, { autoAlpha: 1, y: 140 }, X.tIn).to(f, { y: 0, duration: .7, ease: 'lr.out' }, X.tIn);
    }
    tl.fromTo(f, { scale: 1 }, { scale: 1.03, transformOrigin: '50% 100%', duration: Math.max(.5, X.tOut - X.tIn - .7), ease: 'none', immediateRender: false }, X.tIn + .7);
    tl.to(f, { y: 80, autoAlpha: 0, duration: .32, ease: 'lr.in' }, X.tOut);
  },
};
