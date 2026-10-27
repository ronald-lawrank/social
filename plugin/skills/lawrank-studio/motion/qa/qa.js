/* In-page QA for GSAP concepts. Steps the timeline frame by frame and checks people, text and transitions
   in rendered (client) coordinates, so it tests what a viewer actually sees. */
window.QA = (pi, fps = 30) => {
  const P = PLAYERS[pi], st = P.stage, issues = [], add = (t, rule, detail) => issues.push({ t: +t.toFixed(2), rule, detail });
  const css = document.createElement('style'); css.textContent = '.stage *{pointer-events:auto!important}'; document.head.appendChild(css);
  const effO = el => { let o = 1; for (let e = el; e && e !== st.parentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return 0; o *= +cs.opacity; } return o; };
  const inter = (a, b) => { const x = Math.max(a.left, b.left), y = Math.max(a.top, b.top), r = Math.min(a.right, b.right), bt = Math.min(a.bottom, b.bottom); return r > x && bt > y ? { left: x, top: y, right: r, bottom: bt, w: r - x, h: bt - y } : null; };
  const name = el => { const tx = (el.textContent || '').replace(/\s+/g, ' ').trim();   // the words on screen, so a writer can find them
    return tx ? '"' + (tx.length > 32 ? tx.slice(0, 30) + '…' : tx) + '"' : (el.id ? '#' + el.id : (el.className && el.className.baseVal === undefined ? '.' + String(el.className).split(' ')[0] : el.tagName.toLowerCase())); };
  const paints = el => { if (['IMG', 'svg', 'path', 'polygon', 'rect', 'circle', 'ellipse', 'line', 'text', 'use', 'g'].includes(el.tagName)) return true;
    const cs = getComputedStyle(el); if (cs.backgroundImage !== 'none') return true; const bg = cs.backgroundColor.match(/[\d.]+/g); if (bg && (bg.length < 4 || +bg[3] > 0)) return true;
    if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none') return true;
    return [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); };
  const k = st.getBoundingClientRect().width / 1080, D = P.end, N = Math.round(D * fps);
  const subs = (P.cue.subs || []);
  // text that is in the piece but never actually seen (left hidden, or still masked when its scene ends)
  const allText = [...st.querySelectorAll('[data-qa=text]')].filter(e => (e.textContent || '').trim()), shown = new Set();
  const seen = e => { if (effO(e) < .5) return false;            // the glyphs themselves, clipped by every masking ancestor
    let tot = 0, vis = 0; const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { if (!w.currentNode.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(w.currentNode);
      for (const q of rg.getClientRects()) { tot += q.width * q.height; let v = { left: q.left, top: q.top, right: q.right, bottom: q.bottom, w: q.width, h: q.height };
        for (let x = w.currentNode.parentElement; x && x !== st.parentElement && v; x = x.parentElement) if (getComputedStyle(x).overflow !== 'visible') v = inter(v, x.getBoundingClientRect());
        if (v) vis += v.w * v.h; } }
    return tot > 0 && vis > tot * .5; };
  for (let f = 0; f <= N; f++) {
    const t = Math.min(D, f / fps); P.show(t);
    if (f % 3 === 0) allText.forEach(e => { if (!shown.has(e) && seen(e)) shown.add(e); });
    // ---- 1. faces and upper bodies stay clear; 2. faces are never cropped by a frame
    st.querySelectorAll('img[data-photo]').forEach(img => {
      const o = effO(img); if (o < .05) return;
      const meta = PHOTOS[img.dataset.photo], r = img.getBoundingClientRect(), s = Math.max(r.width / meta.w, r.height / meta.h);
      const dw = meta.w * s, dh = meta.h * s, ox = r.left + (r.width - dw) / 2, oy = r.top + (r.height - dh) / 2;
      meta.subjects.forEach(sub => {
        const F = { left: ox + sub.face[0] * dw, top: oy + sub.face[1] * dh, right: ox + (sub.face[0] + sub.face[2]) * dw, bottom: oy + (sub.face[1] + sub.face[3]) * dh };
        const fw = F.right - F.left, fh = F.bottom - F.top, bx0 = ox + sub.body[0] * dw, bx1 = ox + (sub.body[0] + sub.body[2]) * dw;
        const U = { left: Math.max(bx0, F.left - fw * .6), right: Math.min(bx1, F.right + fw * .6), top: F.top, bottom: F.bottom + fh * .9 };
        // visible window of the photo (its own clipping ancestors)
        let vis = r; for (let e = img.parentElement; e && e !== st; e = e.parentElement) { if (getComputedStyle(e).overflow !== 'visible') vis = inter(vis, e.getBoundingClientRect()) || { left: 0, top: 0, right: 0, bottom: 0 }; }
        const fv = inter(F, vis); if (!fv || fv.w * fv.h < (fw * fh) * .98) add(t, 'face-cropped', `${sub.name || img.dataset.photo}: face not fully inside its frame`);
        for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
          const x = U.left + (U.right - U.left) * (i + .5) / 7, y = U.top + (U.bottom - U.top) * (j + .5) / 7;
          if (x < vis.left || x > vis.right || y < vis.top || y > vis.bottom) continue;
          for (const el of document.elementsFromPoint(x, y)) {
            if (el === img || el.contains(img)) break;
            if (!st.contains(el) || effO(el) < .03 || !paints(el)) continue;
            add(t, 'over-face', `${name(el)} over ${sub.name || img.dataset.photo}'s ${y < F.bottom ? 'face' : 'upper body'} (opacity ${effO(el).toFixed(2)})`); break;
          }
        }
      });
    });
    // ---- 2b. the thread look's travelling dot never sits on words
    const dot = st.querySelector('#thr');
    if (dot && effO(dot) > .5) { const dr = dot.getBoundingClientRect();
      if (dr.width > 2) st.querySelectorAll('[data-qa=text]').forEach(e => { if (effO(e) < .5) return; const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
        while (w.nextNode()) { if (!w.currentNode.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(w.currentNode);
          if ([...rg.getClientRects()].some(q => { const I = inter(dr, q); return I && I.w * I.h > dr.width * dr.height * .2; })) { add(t, 'dot-on-text', `the accent dot sits on ${name(e)}`); break; } } }); }
    // ---- 3. readable text never overlaps other text
    const texts = [...st.querySelectorAll('[data-qa=text]')].filter(e => effO(e) > .3).map(e => [e, e.getBoundingClientRect()]);
    for (let a = 0; a < texts.length; a++) for (let b = a + 1; b < texts.length; b++) {
      const [ea, ra] = texts[a], [eb, rb] = texts[b]; if (ea.contains(eb) || eb.contains(ea)) continue;
      const I = inter(ra, rb); if (I && I.w * I.h > 30 * k * k) add(t, 'text-overlap', `${name(ea)} overlaps ${name(eb)}`);
    }
    // ---- 4. annotation strokes never cross glyphs
    st.querySelectorAll('.mk path').forEach(p => {
      const off = parseFloat(getComputedStyle(p).strokeDashoffset); if (!(off < .98) || effO(p) < .05) return;
      const bub = p.closest('.bub'), glyphs = []; const w = document.createTreeWalker(bub, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) { const rg = document.createRange(); rg.selectNodeContents(w.currentNode); [...rg.getClientRects()].forEach(q => glyphs.push({ left: q.left + 1, right: q.right - 1, top: q.top + q.height * .18, bottom: q.bottom - q.height * .12 })); }
      const L = p.getTotalLength(), m = p.getScreenCTM(), drawn = 1 - off, pad = 2.5 * k;
      for (let i = 0; i <= 80; i++) { const q = p.getPointAtLength(L * drawn * i / 80), c = new DOMPoint(q.x, q.y).matrixTransform(m);
        if (glyphs.some(g => c.x > g.left - pad && c.x < g.right + pad && c.y > g.top - pad && c.y < g.bottom + pad)) { add(t, 'mark-on-text', `${p.closest('.hl').id} stroke crosses letters`); break; } }
    });
    // ---- 5. one phone screen, one subtitle, one note at a time
    [['.ph4 .s', 'screens'], ['.sub', 'subtitles'], ['.note', 'notes']].forEach(([sel, label]) => {
      const vis = [...st.querySelectorAll(sel)].filter(e => effO(e) > .3); if (vis.length > 1) add(t, 'competing-' + label, vis.map(name).join(' + '));
    });
  }
  allText.filter(e => !shown.has(e)).forEach(e => add(D, 'never-shown', `${name(e)} is in the video but never appears`));
  // ---- 6. every subtitle stays fully on screen while its words are spoken
  subs.forEach((s, i) => { [s.t0 + .2, (s.t0 + s.speechEnd) / 2, s.speechEnd - .05].forEach(t => { P.show(t); const e = st.querySelector('#sub' + i); if (e && effO(e) < .9) add(t, 'subtitle-early-exit', `“${s.text}” not fully visible while spoken`); }); });
  // ---- 7. the same picture whether the piece played up to a moment or jumped straight to it (the MP4 renderer seeks)
  const sig = () => [...st.querySelectorAll('*')].map(e => { const cs = getComputedStyle(e); return cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < .05 ? 0 : 1; }).join('');
  for (const f of [.15, .35, .55, .75, .92]) { const t = D * f; P.show(0); P.show(t); const a = sig(); P.show(D); P.show(t); const b = sig();
    if (a !== b) add(t, 'seek', 'the picture differs when the video jumps to this moment (an animation only works when played in order)'); }
  // ---- 8. a stable end card
  const ctaEls = [...st.querySelectorAll('.btn, .m-btn')]; let hold = 0;
  for (let t = D; t > 0; t -= .1) { P.show(t); if (ctaEls.every(e => effO(e) > .99)) hold = D - t; else break; }
  if (hold < 2.5) add(D, 'cta-hold', `end card stable for ${hold.toFixed(1)}s`);
  css.remove(); P.show(0);
  const g = {}; issues.forEach(i => { const key = i.rule + '|' + i.detail.replace(/\(opacity [\d.]+\)/, ''); (g[key] = g[key] || { rule: i.rule, detail: i.detail, t0: i.t, t1: i.t, n: 0 }); g[key].t1 = i.t; g[key].n++; });
  const lastWord = P.cue.lines[P.cue.lines.length - 1].end;
  return { id: P.id, duration: D, endHold: +(D - lastWord).toFixed(2), ctaHold: +hold.toFixed(1), clipped: P.cue.clipped || [], frames: N + 1, issues: Object.values(g) };
};
