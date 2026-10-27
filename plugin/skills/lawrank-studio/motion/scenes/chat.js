/* chat: a phone with a text conversation. Messages pop in as they are spoken (the insurer's on the left, the firm's
   reply on the right in the accent). Works for "what the adjuster says" and "here's how we answer". */
SCENES.chat = {
  label: 'Text conversation', about: "A phone shows a text thread; each message pops in on the word that says it, the firm's reply lands last in the accent colour.",
  good: 'insurance adjuster tactics, "they will ask you…", first contact, how we respond', practice: 'any',
  fields: { head: 'optional headline above the phone', name: 'who the thread is with (e.g. "Insurance adjuster")',
    messages: '[{from: "them"|"us", text}] 2-4 short messages, each said in the line, in order' },
  example: { say: 'The adjuster texts within days. Can we get a recorded statement? We can make you a quick offer today. We tell you to talk to us first.',
    head: 'They move **fast.**', name: 'Insurance adjuster',
    messages: [{ from: 'them', text: 'Can we get a recorded statement?' }, { from: 'them', text: 'We can make you a quick offer today.' }, { from: 'us', text: 'Talk to us first.' }] },
  sfx: (sc, X) => X.times(sc.messages.map(m => m.text)).map(t => ({ kind: 'pop', at: t })),
  html(sc, X) {
    const LK = X.LK, top = sc.head ? 560 : 420, ph = { x: 190, y: top, w: 700, h: 1000 };
    const frame = LK.name === 'silhouette' ? LK.ink : LK.name === 'flat' ? LK.fillB : '#15171A';
    const msgs = sc.messages.map((m, i) => { const us = m.from === 'us';
      const bg = us ? (LK.name === 'flat' ? LK.fillB : BT.accent) : (LK.name === 'silhouette' ? '#E4E1DA' : '#EEF0F2');
      const fg = us ? (contrast('#FFFFFF', bg) >= 4.5 ? '#FFFFFF' : BT.ink) : '#1B1D20';
      return `<div class="cmsg" id="${X.id}m${i}" data-qa="text" style="position:absolute;${us ? 'right:34px' : 'left:34px'};max-width:470px;padding:22px 28px;
        font:500 36px/1.28 var(--body);background:${bg};color:${fg};border-radius:${us ? '34px 34px 8px 34px' : '34px 34px 34px 8px'}">${esc(m.text)}</div>`; }).join('');
    return `${sc.head ? UI.head(LK, { id: X.id + 'h', text: sc.head, x: 80, y: 330, w: 920, size: 84, align: 'center' }) : ''}
      <div id="${X.id}p" class="k-abs" style="left:${ph.x}px;top:${ph.y}px;width:${ph.w}px;height:${ph.h}px;border-radius:${LK.name === 'silhouette' ? 18 : 74}px;
        background:${frame};padding:22px;box-shadow:${LK.name === 'thread' ? LK.shadow : LK.name === 'cards' ? LK.shadow : 'none'}">
        <div style="position:relative;width:100%;height:100%;border-radius:${LK.name === 'silhouette' ? 6 : 54}px;background:#FFFFFF;overflow:hidden">
          <div style="height:150px;border-bottom:1px solid #E6E8EB;display:flex;align-items:center;gap:22px;padding:30px 34px 0">
            <div style="width:74px;height:74px;border-radius:50%;background:${mix(BT.ink, '#FFFFFF', .82)}"></div>
            <div data-qa="text" style="font:700 36px var(--body);color:#1B1D20">${esc(sc.name || 'Insurance adjuster')}</div></div>
          <div id="${X.id}t" style="position:absolute;left:0;right:0;top:170px;bottom:30px">${msgs}</div>
        </div></div>`;
  },
  build(tl, sc, X) {
    const ts = X.times(sc.messages.map(m => m.text)), list = X.$(`#${X.id}t`), els = [...list.querySelectorAll('.cmsg')];
    if (sc.head) X.head(`#${X.id}h`, X.tIn);
    tl.fromTo(`#${X.id}p`, { autoAlpha: 0, y: 160 }, { autoAlpha: 1, y: 0, duration: .6, ease: 'lr.out', immediateRender: false }, X.tIn - .15);
    tl.set(`#${X.id}p`, { autoAlpha: 0 }, 0);
    // messages stack from the top; when the thread is full, older ones scroll up and out of the screen
    const k = list.closest('.stage').getBoundingClientRect().width / 1080, H = list.getBoundingClientRect().height / k;
    let y = 20; const pos = els.map(e => { const h = e.getBoundingClientRect().height / k, p = y; y += h + 22; return { p, h }; });
    els.forEach((e, i) => { e.style.top = pos[i].p + 'px'; tl.set(e, { autoAlpha: 0 }, 0);
      tl.set(e, { autoAlpha: 1, scale: .6, transformOrigin: sc.messages[i].from === 'us' ? '100% 100%' : '0% 100%' }, ts[i]).to(e, { scale: 1, duration: .38, ease: 'back.out(1.8)' }, ts[i]);
      const over = pos[i].p + pos[i].h + 20 - H;
      if (over > 0) tl.to(els.slice(0, i), { y: -over, duration: .35, ease: 'lr.move' }, ts[i] - .05);
      if (sc.messages[i].from === 'us' && X.LK.thread) { const r = e.getBoundingClientRect(), sr = list.closest('.stage').getBoundingClientRect(); X.dot((r.right - sr.left) / k + 30, (r.top - sr.top) / k + 10, ts[i] + .2, { r: 16 }); }
    });
    if (X.LK.thread && !sc.messages.some(m => m.from === 'us')) X.dot(890, 470, X.tIn + .3);
    tl.to(`#${X.id}p`, { autoAlpha: 0, y: -60, duration: .3, ease: 'lr.in' }, X.tOut);
  },
};
