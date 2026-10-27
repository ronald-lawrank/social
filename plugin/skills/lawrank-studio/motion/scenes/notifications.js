/* notifications: a phone lock screen fills with the noise of a claim (missed calls, bills, emails), one buzz per line
   the voice says; then on the key word they all swipe away and a calm message is left on a quiet screen. */
const NTF = {
  icon(app) {           // an icon for the app name
    const a = String(app).toLowerCase();
    return /call|phone|voice/.test(a) ? 'phone' : /bill|bank|pay|card|due|\$/.test(a) ? 'dollar' : /hosp|clinic|doctor|medical|er\b/.test(a) ? 'hospital'
      : /insur|claim|adjust/.test(a) ? 'shield' : /court|calendar|deadline|remind/.test(a) ? 'clock' : /mail|letter|inbox/.test(a) ? 'doc' : 'chat';
  },
};
SCENES.notifications = {
  label: 'Notifications pile up', about: 'A phone lock screen fills with notifications (missed calls, bills, emails) as they are said, then they all swipe away and a calm message is left.',
  good: 'the overwhelm after an accident or arrest, "let us take the calls", before/after hiring a lawyer', practice: 'any',
  fields: { head: 'optional headline above the phone (2-5 words)', items: '3-4 notifications [{app, text}]: app = sender (e.g. "Phone", "Hospital billing"), text = 3-8 words; each said in the line, in order',
    clear: 'the calm message left after they clear (2-6 words), said at the end of the line' },
  example: { say: 'Missed call from the claims adjuster. Payment due for the ER visit. Need your recorded statement today. Then you call us, and it all goes quiet.',
    head: 'It **piles up.**', items: [{ app: 'Phone', text: 'Missed call: claims adjuster' }, { app: 'Hospital billing', text: 'Payment due for your ER visit' },
      { app: 'Mail', text: 'Need your recorded statement today' }], clear: 'Then you call us.' },
  sfx: (sc, X) => { const ts = X.times([...sc.items.map(i => i.text), sc.clear]); return ts.map((t, i) => ({ kind: i < sc.items.length ? 'buzz' : 'chime', at: t })); },
  html(sc, X) {
    const LK = X.LK, id = X.id, nm = LK.name, sil = nm === 'silhouette';
    const ph = { x: 180, y: sc.head ? 560 : 410, w: 720, h: sc.head ? 1000 : 1130 };
    const frame = nm === 'thread' ? '#FFFFFF' : nm === 'flat' ? LK.fillB : sil ? LK.ink : '#16181B';
    const wall = nm === 'thread' ? `linear-gradient(170deg, ${mix(BT.accent, '#FFFFFF', .9)} 0%, #FFFFFF 70%)`
      : nm === 'flat' ? mix(LK.fillB, '#000000', .18) : nm === 'cards' ? `linear-gradient(165deg, ${mix(BT.accent, BT.ink, .25)} 0%, ${mix(BT.ink, '#000000', .35)} 100%)` : LK.surface;
    const calm = nm === 'thread' ? '#FFFFFF' : nm === 'flat' ? LK.bg : nm === 'cards' ? `linear-gradient(165deg, ${mix(BT.accent, '#FFFFFF', .55)} 0%, ${mix(BT.accent, '#FFFFFF', .85)} 100%)` : LK.surface;
    const onWall = nm === 'thread' || sil ? LK.ink : '#FFFFFF', onCalm = nm === 'flat' ? LK.ink : nm === 'cards' ? BT.ink : LK.ink;
    const nBg = sil ? LK.ink : '#FFFFFF', nInk = sil ? LK.surface : '#1B1D20', nSub = sil ? mix(LK.surface, LK.ink, .3) : '#5B636B';
    const nCss = nm === 'thread' ? `border:3px solid ${LK.ink}` : nm === 'cards' ? 'box-shadow:0 18px 40px rgba(0,0,0,.28)' : nm === 'flat' ? `box-shadow:0 10px 0 ${mix(LK.fillB, '#000000', .45)}` : `box-shadow:10px 12px 0 ${LK.accent}`;
    const tiles = [mix(BT.ink, '#FFFFFF', .12), mix(BT.ink, '#FFFFFF', .3), mix(BT.ink, '#FFFFFF', .2), mix(BT.ink, '#FFFFFF', .4)];
    const items = sc.items.map((it, i) => `<div class="ntf" style="position:absolute;left:20px;right:20px;top:0;background:${nBg};border-radius:${sil ? 0 : 34}px;${nCss};padding:24px 26px 26px;display:flex;gap:20px">
        <div style="flex:none;width:68px;height:68px;border-radius:${sil ? 0 : 18}px;background:${sil ? LK.surface : tiles[i % 4]};display:flex;align-items:center;justify-content:center">${icon(NTF.icon(it.app + ' ' + it.text), 40, sil ? LK.ink : '#FFFFFF')}</div>
        <div data-qa="text" style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;gap:12px;font:700 30px/1.2 var(--head);color:${nInk}"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(it.app)}</span><span style="color:${nSub};font-weight:600">now</span></div>
          <div style="margin-top:6px;font:400 37px/1.24 var(--body);color:${nInk}">${esc(it.text)}</div></div></div>`).join('');
    const sky = sil ? `<svg class="k-abs" style="left:0;bottom:0" width="680" height="210" viewBox="0 0 680 300" preserveAspectRatio="none"><circle id="${id}sun" cx="420" cy="170" r="120" fill="${LK.accent}"/><path fill="${LK.fillB}" d="M0,300V170h50v-40h40v60h30V90h70v110h40V140h50v-60h20v-30h10v30h20v130h40V120h60v70h30V60h70v140h40v-70h60v170Z"/>
        <path fill="${LK.ink}" d="M0,300V230h70v-50h50v80h60v-30h80v-60h40v100h70v-70h90v50h50v-90h60v120h110v50Z"/></svg>` : '';
    const lock = `<svg width="34" height="44" viewBox="0 0 34 44"><rect x="3" y="18" width="28" height="23" rx="5" fill="${onWall}"/><path d="M9,19V12a8,8 0 0 1 16,0v7" fill="none" stroke="${onWall}" stroke-width="5"/></svg>`;
    const chk = nm === 'flat' ? LK.fillB : sil ? LK.ink : BT.accent;
    return `${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 340, w: 920, size: 92, align: 'center' }) : ''}
      <div id="${id}p" class="k-abs" style="left:${ph.x}px;top:${ph.y}px;width:${ph.w}px;height:${ph.h}px;border-radius:${sil ? 16 : 84}px;background:${frame};padding:20px;
        ${nm === 'thread' ? `border:6px solid ${LK.ink};` : ''}box-shadow:${nm === 'cards' ? LK.shadow : nm === 'flat' ? `0 20px 0 ${mix(LK.bg, '#000000', .28)}` : sil ? '18px 20px 0 rgba(0,0,0,.18)' : LK.shadow}">
        <div id="${id}s" style="position:relative;width:100%;height:100%;border-radius:${sil ? 4 : 64}px;background:${wall};overflow:hidden">
          ${sil ? '' : `<div id="${id}cm" class="k-abs" style="inset:0;background:${calm}"></div>`}${sky}
          <div class="k-abs" style="left:50%;top:22px;width:200px;height:52px;margin-left:-100px;border-radius:26px;background:${nm === 'thread' ? LK.ink : '#0C0D0F'}"></div>
          <div id="${id}tm" class="k-abs" style="left:0;right:0;top:96px;text-align:center">${lock}
            <div id="${id}tt" data-qa="text" style="font:300 150px/1 var(--head);color:${onWall};letter-spacing:-.02em;margin-top:6px">9:41</div></div>
          <div id="${id}l" class="k-abs" style="left:0;right:0;top:0;bottom:0">${items}</div>
          <svg id="${id}ck" class="k-abs" width="190" height="190" viewBox="0 0 190 190" style="left:50%;margin-left:-95px;top:0"><circle cx="95" cy="95" r="86" fill="${chk}"/>
            <path d="M55,98 L84,126 L138,68" fill="none" stroke="${contrast('#FFFFFF', chk) >= 3 ? '#FFFFFF' : BT.ink}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <div id="${id}c" class="k-hl" data-qa="text" style="left:40px;right:40px;top:0;text-align:center;text-wrap:balance;font-size:${sc.clear.length > 22 ? 62 : 72}px;color:${onCalm};font-weight:${LK.headWeight};
            ${LK.headCase === 'upper' ? 'text-transform:uppercase;' : ''}--acc:${nm === 'flat' ? LK.accentText : readable(BT.accent, nm === 'cards' ? mix(BT.accent, '#FFFFFF', .7) : '#FFFFFF', 3)}">${accentize(sc.clear, 'ka')}</div>
        </div></div>`;
  },
  build(tl, sc, X) {
    const LK = X.LK, id = X.id, nm = LK.name, n = sc.items.length, $ = s => X.$(s);
    const ts = X.times([...sc.items.map(i => i.text), sc.clear]), tC = Math.max(ts[n], ts[n - 1] + .9);
    const scr = $(`#${id}s`), els = [...$(`#${id}l`).querySelectorAll('.ntf')], H = scr.offsetHeight, gap = 16;
    const hs = els.map(e => e.offsetHeight), need = hs.reduce((a, b) => a + b, 0) + gap * (n - 1);
    // room for the pile: the clock shrinks when the pile needs the space
    const top = Math.max(204, Math.min(330, H - 34 - need)), tt = $(`#${id}tt`);
    if (top < 330) { tt.style.fontSize = Math.max(62, 150 - (330 - top) * .7) + 'px'; $(`#${id}tm`).style.top = Math.max(80, 96 - (330 - top) * .13) + 'px'; }
    if (sc.head) X.head(`#${id}h`, X.tIn);
    const p = `#${id}p`;
    tl.set(p, { autoAlpha: 0 }, 0).set(p, { autoAlpha: 1, y: 220 }, X.tIn - .15).to(p, { y: 0, duration: .65, ease: 'lr.out' }, X.tIn - .15);
    tl.set(`#${id}tm`, { autoAlpha: 0 }, 0).set(`#${id}tm`, { autoAlpha: 1, y: 30 }, X.tIn + .1).to(`#${id}tm`, { y: 0, duration: .5, ease: 'lr.out' }, X.tIn + .1);
    if (nm === 'silhouette') tl.set(`#${id}sun`, { y: 200 }, 0).to(`#${id}sun`, { y: 0, duration: 1.4, ease: 'lr.out' }, tC - .2);
    else tl.set(`#${id}cm`, { autoAlpha: 0 }, 0).to(`#${id}cm`, { autoAlpha: 1, duration: .6, ease: 'power1.inOut' }, tC - .2);
    // the pile: newest on top, the rest slide down to make room; the phone buzzes with each one
    els.forEach((e, i) => {
      const t = Math.max(ts[i], X.tIn + .5), tp = t - .28; tl.set(e, { autoAlpha: 0 }, 0).set(e, { autoAlpha: 1, y: top, scale: .82, transformOrigin: '50% 0%' }, t + .02)
        .to(e, { scale: 1, duration: .45, ease: 'back.out(1.6)' }, t + .02);
      let y = top + hs[i] + gap; for (let j = i - 1; j >= 0; j--) { tl.to(els[j], { y, duration: .3, ease: 'lr.move' }, tp); y += hs[j] + gap; }
      tl.to(p, { keyframes: [{ x: -7, rotation: -.6 }, { x: 7, rotation: .6 }, { x: -5, rotation: -.3 }, { x: 0, rotation: 0 }], duration: .32, ease: 'none' }, t + .02);
    });
    // quiet: they swipe away one after another, the screen calms, a check and the message
    els.forEach((e, i) => tl.to(e, { x: 420, rotation: 3, autoAlpha: 0, duration: .36, ease: 'lr.in' }, tC - .5 + (n - 1 - i) * .07));
    const tcol = nm === 'flat' ? LK.ink : nm === 'cards' ? BT.ink : LK.ink;
    if (nm !== 'thread' && nm !== 'silhouette') tl.to([tt, `#${id}tm svg *`], { color: tcol, fill: tcol, stroke: tcol, duration: .4 }, tC - .2);
    // the check and the message sit in the middle of the calm screen
    const msg = $(`#${id}c`), ck = $(`#${id}ck`), mh = msg.offsetHeight, block = 190 + 40 + mh, y0 = Math.max(top - 20, (H - block) / 2 + (nm === 'silhouette' ? 0 : 60));
    ck.style.top = y0 + 'px'; msg.style.top = (y0 + 230) + 'px';
    tl.set(ck, { autoAlpha: 0 }, 0).set(ck, { autoAlpha: 1, scale: 0, transformOrigin: '50% 50%' }, tC + .05).to(ck, { scale: 1, duration: .5, ease: 'back.out(1.8)' }, tC + .05);
    tl.fromTo(ck.querySelector('path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: .4, ease: 'power2.out', immediateRender: false }, tC + .2);
    X.head(`#${id}c`, tC + .25);
    if (LK.thread) { const sr = scr.closest('.stage').getBoundingClientRect(), k = sr.width / 1080, w = document.createTreeWalker(msg, NodeFilter.SHOW_TEXT); let last = null;
      while (w.nextNode()) if (w.currentNode.textContent.trim()) last = w.currentNode;
      const rg = document.createRange(); rg.selectNodeContents(last); const rs = [...rg.getClientRects()], q = rs[rs.length - 1];
      X.dot((q.right - sr.left) / k + 26, (q.bottom - sr.top) / k - 26, tC + .7, { r: 14 }); }
    tl.to(ck, { scale: 0, duration: .25, ease: 'lr.in' }, X.tOut);
    tl.to(p, { y: -80, autoAlpha: 0, duration: .32, ease: 'lr.in' }, X.tOut + .06);
    tl.set(tt, { autoAlpha: 0 }, X.tOut + .3);
  },
};
