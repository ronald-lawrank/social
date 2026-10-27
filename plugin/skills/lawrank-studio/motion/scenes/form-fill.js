/* form-fill: a claim / intake form card; each field's value types itself in (caret, focus ring) as it is said, a
   progress line fills, then the submit button presses, shrinks to a circle and a tick draws. */
SCENES['form-fill'] = {
  label: 'Form fills in', about: 'A form card types each answer in as it is said, then the submit button presses and turns into a tick.',
  good: 'how to start a claim, what we ask you, intake made easy, "tell us what happened"', practice: 'any',
  fields: { head: 'optional headline above the form (**word** = accent)', title: 'the form title (2-4 words, e.g. "Tell us what happened")',
    fields: '[{label, value}] 3-4 fields; each label (1-3 words) is said in the line, in order; values are short sample answers (under 24 characters)',
    button: 'optional button label (default "Submit")' },
  example: { say: 'Getting started is simple. Your name, the date it happened, what happened, and the best number to reach you. Then hit send.',
    head: 'It starts **here.**', title: 'Tell us what happened', button: 'Send',
    fields: [{ label: 'Your name', value: 'Jordan Rivera' }, { label: 'Date it happened', value: 'Last Tuesday' },
      { label: 'What happened', value: 'Slipped on a wet floor' }, { label: 'Best number', value: '(555) 014-2290' }] },
  sfx(sc, X) {
    const p = SCENES['form-fill'].plan(sc, X);
    return [{ kind: 'whoosh', at: X.tIn - .1 }, ...p.f.map(f => ({ kind: 'clink', at: f.t1 })), { kind: 'pop', at: p.tb }, { kind: 'chime', at: p.tb + .45 }];
  },
  // when each field types (start, end) and when the button is pressed: from the voice, never overlapping
  plan(sc, X) {
    const fs = sc.fields.slice(0, 4), ts = X.times([...fs.map(f => f.label), sc.button || 'submit']), out = [];
    let prev = X.tIn + .55;
    fs.forEach((f, i) => { const t0 = Math.max(ts[i] - .05, prev + .12), d = Math.max(.45, Math.min(1.15, String(f.value).length / 19));
      out.push({ t0, t1: t0 + d }); prev = t0 + d; });
    return { f: out, tb: Math.min(Math.max(prev + .4, ts[fs.length]), X.tOut - 1) };
  },
  html(sc, X) {
    const LK = X.LK, n = LK.name, id = X.id, fs = sc.fields.slice(0, 4), up = LK.headCase === 'upper';
    const ink = LK.surfaceInk, sub = readable(mix(ink, LK.surface, .42), LK.surface, 4.8);
    const acc = n === 'flat' ? LK.fillB : n === 'silhouette' ? LK.ink : BT.accent, onAcc = contrast('#FFFFFF', acc) >= 4.5 ? '#FFFFFF' : BT.ink;
    const tick = n === 'silhouette' ? LK.accent : n === 'flat' ? LK.fillB : BT.accent;
    const inH = 84, gap = 22, blk = 38 + 8 + inH;
    const inBg = n === 'silhouette' ? 'transparent' : n === 'flat' ? mix(LK.fillB, '#FFFFFF', .9) : n === 'cards' ? '#F5F6F8' : '#FFFFFF';
    const inBd = n === 'silhouette' ? `border-bottom:5px solid ${LK.ink}` : n === 'flat' ? 'border:4px solid transparent' : n === 'cards' ? 'border:2px solid #E2E4E8' : `border:3px solid ${mix(ink, LK.surface, .8)}`;
    const rad = n === 'silhouette' ? 0 : n === 'cards' ? 18 : 14;
    const rows = fs.map((f, i) => { const v = String(f.value), size = v.length > 22 ? 36 : 42;
      return `<div class="ffr" style="position:absolute;left:48px;right:48px;top:${180 + i * (blk + gap)}px;height:${blk}px">
        <div data-qa="text" style="width:fit-content;font:700 30px/38px var(--head);color:${sub};${up ? 'text-transform:uppercase;letter-spacing:.06em;' : ''}">${esc(f.label)}</div>
        <div class="ffi" style="position:relative;margin-top:8px;height:${inH}px;border-radius:${rad}px;background:${inBg};${inBd};display:flex;align-items:center;padding:0 26px">
          <div class="ffw" style="position:relative;display:inline-block;white-space:nowrap">
            <span class="ffv" data-qa="text" style="display:inline-block;font:500 ${size}px/1 var(--body);color:${ink}">${esc(v)}</span>
            <span class="ffc" style="position:absolute;left:0;top:-6px;bottom:-8px;width:4px;margin-left:3px;background:${n === 'silhouette' ? LK.ink : BT.accent};border-radius:2px"></span></div>
          <svg class="ffk" width="44" height="44" viewBox="0 0 44 44" style="position:absolute;right:22px;top:${(inH - 44) / 2 - (n === 'silhouette' ? 0 : 3)}px">
            <circle cx="22" cy="22" r="20" fill="${tick}"/><path d="M12 22.5 L19 29 L32 15" fill="none" stroke="${contrast('#FFFFFF', tick) >= 3 ? '#FFFFFF' : BT.ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div></div>`; }).join('');
    const bY = 180 + fs.length * (blk + gap) + 14, H = bY + 104 + 48;
    const r0 = sc.head ? 584 : 420, top = Math.round(r0 + Math.max(0, (1540 - r0 - H) / 2 - 20));
    const btn = `<div style="position:absolute;left:48px;right:48px;top:${bY}px;height:104px;display:flex;justify-content:center">
        <div id="${id}b" style="position:relative;width:804px;height:104px;border-radius:${n === 'silhouette' ? 0 : 52}px;background:${acc};${n === 'cards' ? `box-shadow:0 18px 30px ${mix(BT.accent, '#000000', .3)}55;` : ''}">
          <div id="${id}bl" data-qa="text" style="position:absolute;inset:0;text-align:center;font:700 40px/104px var(--head);color:${onAcc};${up || n === 'silhouette' ? 'text-transform:uppercase;letter-spacing:.08em;' : ''}">${esc(sc.button || 'Submit')}</div>
          <svg id="${id}bk" width="104" height="104" viewBox="0 0 104 104" style="position:absolute;left:50%;top:0;margin-left:-52px"><path d="M30 53 L45 68 L75 36" fill="none" stroke="${onAcc}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div></div>`;
    const tile = n === 'silhouette' ? LK.ink : n === 'flat' ? LK.fillB : mix(BT.accent, '#FFFFFF', .86);
    const head = `<div style="position:absolute;left:48px;right:48px;top:44px;height:96px;display:flex;align-items:center;gap:28px">
        <div style="width:92px;height:92px;flex:none;border-radius:${n === 'silhouette' ? 0 : 24}px;background:${tile};display:flex;align-items:center;justify-content:center">
          ${UI.icon(LK, 'doc', 54, n === 'silhouette' || n === 'flat' ? '#FFFFFF' : readable(BT.accent, tile, 3), n === 'silhouette' ? LK.accent : n === 'flat' ? '#FFFFFF' : readable(BT.accent, tile, 3))}</div>
        <div data-qa="text" style="font:${LK.headWeight} ${String(sc.title).length > 22 ? 40 : 46}px/1.1 var(--head);color:${ink};${up ? 'text-transform:uppercase;' : ''}">${esc(sc.title || 'Claim form')}</div></div>
      <div style="position:absolute;left:0;right:0;top:${n === 'silhouette' ? 154 : 152}px;height:${n === 'silhouette' ? 6 : 4}px;background:${n === 'silhouette' ? LK.ink : mix(ink, LK.surface, .9)}">
        <div id="${id}pg" style="height:100%;width:100%;background:${n === 'silhouette' ? LK.accent : acc};transform-origin:0 50%"></div></div>`;
    return `${sc.head ? UI.head(LK, { id: id + 'h', text: sc.head, x: 80, y: 330, w: 920, size: 88, align: 'center' }) : ''}
      ${UI.card(LK, { id: id + 'c', x: 90, y: top, w: 900, h: H, inner: head + rows + btn })}
      <svg id="${id}ptr" class="k-abs" width="84" height="100" viewBox="0 0 28 33" style="left:540px;top:${top + bY + 52}px;overflow:visible;filter:drop-shadow(${n === 'silhouette' ? '5px 6px 0 rgba(0,0,0,.18)' : '0 6px 8px rgba(0,0,0,.22)'})">
        <path d="M2 2 L2 26 L8.5 20 L13 30.5 L17.5 28.6 L13.2 18.6 L22 18.4 Z" fill="${n === 'silhouette' ? LK.ink : '#FFFFFF'}" stroke="${n === 'silhouette' ? LK.surface : BT.ink}" stroke-width="2" stroke-linejoin="round"/></svg>`;
  },
  build(tl, sc, X) {
    const LK = X.LK, n = LK.name, id = X.id, q = s => X.$('#' + id + s), card = q('c'), st = card.closest('.stage'), k = st.getBoundingClientRect().width / 1080;
    const rel = el => { const a = el.getBoundingClientRect(), s = st.getBoundingClientRect(); return { x: (a.left - s.left) / k, y: (a.top - s.top) / k, w: a.width / k, h: a.height / k }; };
    const P = SCENES['form-fill'].plan(sc, X), rows = [...card.querySelectorAll('.ffr')], N = rows.length;
    if (sc.head) X.head(`#${id}h`, X.tIn);
    tl.set(card, { autoAlpha: 0 }, 0).set(card, { autoAlpha: 1, y: 150, rotation: 1.5, transformOrigin: '50% 100%' }, X.tIn - .1)
      .to(card, { y: 0, rotation: 0, duration: .6, ease: 'lr.out' }, X.tIn - .1);
    tl.to(card, { y: -14, duration: Math.max(.5, X.tOut - X.tIn - .5), ease: 'sine.inOut' }, X.tIn + .5);
    const pg = q('pg'); tl.set(pg, { scaleX: 0 }, 0);
    const focus = n === 'silhouette' ? LK.accent : n === 'flat' ? LK.fillB : BT.accent;
    rows.forEach((r, i) => {
      const { t0, t1 } = P.f[i], v = r.querySelector('.ffv'), c = r.querySelector('.ffc'), box = r.querySelector('.ffi'), kk = r.querySelector('.ffk');
      const steps = Math.max(3, String(sc.fields[i].value).length);
      // focus: the box lights up in the accent, the caret blinks in, then the answer types itself
      const ring = n === 'silhouette' ? { borderBottomColor: focus } : n === 'cards' ? { borderColor: focus, boxShadow: `0 0 0 6px ${mix(BT.accent, '#FFFFFF', .78)}` } : { borderColor: focus };
      const off = n === 'silhouette' ? { borderBottomColor: LK.ink } : n === 'cards' ? { borderColor: '#E2E4E8', boxShadow: '0 0 0 0px rgba(0,0,0,0)' } : { borderColor: getComputedStyle(box).borderTopColor };
      tl.fromTo(box, off, { ...ring, duration: .2, ease: 'power1.out', immediateRender: false }, t0 - .25).to(box, { ...off, duration: .3, ease: 'power1.in' }, t1 + .25);
      tl.set(v, { clipPath: 'inset(-20% 100% -20% 0%)' }, 0).set(c, { autoAlpha: 0, left: '0%' }, 0);
      tl.set(c, { autoAlpha: 1 }, t0 - .22).to(v, { clipPath: 'inset(-20% 0% -20% 0%)', duration: t1 - t0, ease: `steps(${steps})` }, t0)
        .to(c, { left: '100%', duration: t1 - t0, ease: `steps(${steps})` }, t0).set(c, { autoAlpha: 0 }, t1 + .3);
      tl.set(kk, { autoAlpha: 0 }, 0).set(kk, { autoAlpha: 1, scale: 0, transformOrigin: '50% 50%' }, t1 + .05).to(kk, { scale: 1, duration: .32, ease: 'back.out(2.4)' }, t1 + .05);
      tl.to(pg, { scaleX: (i + 1) / (N + 1), duration: .4, ease: 'lr.out' }, t1 + .05);
      if (LK.thread) { const b = rel(box); X.dot(b.x + b.w + 22, b.y + b.h / 2, t1 + .1, { r: 9 }); }
    });
    // submit: the button presses, its label lifts away, it shrinks to a circle and the tick draws
    const B = q('b'), bl = q('bl'), bk = q('bk').querySelector('path'), tb = P.tb;
    // a pointer glides in and clicks
    const ptr = q('ptr');
    tl.set(ptr, { autoAlpha: 0 }, 0).set(ptr, { autoAlpha: 1, x: 300, y: 260, rotation: 8 }, tb - .65).to(ptr, { x: 0, y: 0, rotation: 0, duration: .6, ease: 'lr.move' }, tb - .65)
      .to(ptr, { scale: .82, duration: .08, ease: 'power2.out', transformOrigin: '10% 10%' }, tb - .04).to(ptr, { scale: 1, duration: .2, ease: 'power2.out' }, tb + .06)
      .to(ptr, { x: 170, y: 140, duration: .5, ease: 'lr.in' }, tb + .3).set(ptr, { autoAlpha: 0 }, tb + .8);
    tl.to(B, { scale: .94, duration: .1, ease: 'power2.out' }, tb).to(B, { scale: 1, duration: .3, ease: 'back.out(3)' }, tb + .1);
    tl.to(bl, { autoAlpha: 0, y: -20, duration: .18, ease: 'lr.in' }, tb + .08);
    tl.to(B, { width: 104, duration: .4, ease: 'lr.move' }, tb + .18);
    if (n !== 'silhouette') tl.to(B, { borderRadius: 52, duration: .4 }, tb + .18);
    tl.set(bk, { drawSVG: '0%' }, 0).to(bk, { drawSVG: '100%', duration: .35, ease: 'power2.out' }, tb + .5);
    tl.to(pg, { scaleX: 1, duration: .45, ease: 'lr.out' }, tb + .3);
    if (LK.thread) { const b = rel(B); X.dot(b.x + b.w / 2 + 52 + 34, b.y + 52, tb + .55, { r: 14 }); }
    tl.to(card, { autoAlpha: 0, y: -80, duration: .3, ease: 'lr.in' }, X.tOut);
  },
};
