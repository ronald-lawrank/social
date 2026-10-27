/* LawRank motion composer: a video assembled from scenes (motion/scenes/*.js), in one look (runtime/looks.js), joined by
   transitions. Each scene is bound to one narration line and lasts until the next scene's line starts, so the
   picture always follows the voice.

   Scene contract (every file in motion/scenes/ registers one or more):
     SCENES['letter'] = {
       label: 'Letter arrives',                       // short name (catalog, docs)
       about: 'An envelope slides in and opens...',   // one sentence: what the viewer sees
       good: 'insurance letters, denial letters',     // what it suits
       practice: 'any' | ['personal injury', ...],   // practices it fits (crash imagery = personal injury only)
       fields: { head: 'headline', ... },             // what the storyboard gives the scene (documented for writers)
       example: { line: 's1', head: '...', ... },     // a worked scene object (used by the catalog and docs)
       sfx: (sc, X) => [{ kind: 'pop', at: X.at('letter') }],   // optional; kinds: whoosh soft pop chime thud clink impact buzz crackle rumble
       html: (sc, X) => '<div ...>',                  // markup inside the scene layer (1080x1920, absolute positions)
       build: (tl, sc, X) => { ... },                 // GSAP animation on the shared timeline, inside [X.t0, X.t1]
     };
   Rules a scene must keep (QA enforces them):
     - Draw with the look: LK.ink, LK.surface, LK.accent, UI.card/UI.head/UI.text/UI.icon. Never hard-code a colour.
     - Readable text uses data-qa="text" (UI.head/UI.text do it) and stays inside x 70..1010, y 300..1560.
     - Text is only visible inside [X.tIn, X.tOut], so it never meets the next scene's text during a transition.
     - Every element enters on a cue from the voice (X.at('word'), X.sent(k).t, X.tIn), never on a fixed clock alone.
     - In the thread look, call X.dot(x, y, t) at least once: the accent dot travels between scenes. */
globalThis.SCENES = globalThis.SCENES || {};
globalThis.TRANSITIONS = globalThis.TRANSITIONS || {};

const COMPOSE = {
  LEAD: .3, MIN: 1.4,
  // ---- timing (pure: runs in node for the sound plan, and in the page)
  plan(S, h) {
    const list = S.screen.scenes || [], n = list.length;
    if (n < 2) throw new Error('a composed video needs at least two scenes (the last is the end card)');
    if (list[n - 1].type !== 'end') throw new Error('the last scene must be { "type": "end", "line": "cta" }');
    const sc = list.map((s, i) => {
      if (!SCENES[s.type]) throw new Error(`scene ${i + 1}: unknown type '${s.type}'`);
      if (!h.L[s.line]) throw new Error(`scene ${i + 1} (${s.type}) uses line '${s.line}', which isn't in lines`);
      const start = s.at ? h.W(s.line, s.at) : h.L[s.line].t;
      return { i, type: s.type, line: s.line, t0: i ? start - COMPOSE.LEAD : 0 };
    });
    const last = h.L[list[n - 1].line], end = last.end + 2.8;
    sc.forEach((s, i) => { s.t1 = i + 1 < n ? sc[i + 1].t0 : end; });
    sc.forEach((s, i) => { if (s.t1 - s.t0 < COMPOSE.MIN) throw new Error(`scene ${i + 1} (${s.type}) is on screen ${(s.t1 - s.t0).toFixed(1)}s: give its line more words, or merge it with the next scene`); });
    const cta = last.sentences, free = cta.length > 1 ? cta[cta.length - 1].t - .05 : sc[n - 1].t0 + 1.5;
    const first = h.L[list[0].line], logo = Math.max(.3, (first.words.find(w => w.w.toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(String(S.brandWord || '').toLowerCase())) || first.words[0] || { t: .4 }).t - .05);
    return { sc, end, free: Math.min(free, end - 2.6), logo };
  },
  X(S, h, s, P) {          // what a scene sees: its window and its words (pure part)
    const L = h.L[s.line], i = s.i;
    return { i, id: 'scn' + i, t0: s.t0, t1: s.t1, end: P.end, free: P.free, line: L, last: i === P.sc.length - 1,
      tIn: s.t0 + (i ? .32 : .2), tOut: s.t1 - .42,
      at: (w, lid = s.line) => h.W(lid, w), sent: (k, lid = s.line) => { const ss = h.L[lid].sentences; return ss[Math.min(k, ss.length - 1)]; },
      words: (lid = s.line) => h.L[lid].words,
      // when each on-screen item is said: the first word of each text, matched in order in the line; items the voice
      // doesn't say word for word are spread between their neighbours. Times stay inside [tIn, tOut - .5].
      times: (texts, lid = s.line) => COMPOSE.times(texts, h.L[lid].words, s.t0 + (i ? .32 : .2), s.t1 - .92) };
  },
  norm: w => String(w).toLowerCase().replace(/\*\*/g, '').replace(/[^a-z0-9']/g, ''),
  times(texts, spoken, a, b) {
    const ts = []; let j = 0;
    const N = spoken.map(x => COMPOSE.norm(x.w));
    texts.forEach(tx => { const ws = String(tx).trim().split(/\s+/).map(COMPOSE.norm).filter(Boolean);
      const find = two => { for (let k = j; k < N.length; k++) if (N[k] === ws[0] && (!two || N[k + 1] === ws[1])) return k; return -1; };
      const k = ws.length ? (ws.length > 1 && find(true) >= 0 ? find(true) : find(false)) : -1;
      if (k >= 0) { ts.push(spoken[k].t); j = k + 1; } else ts.push(null); });
    const known = ts.map((t, i) => [t, i]).filter(x => x[0] != null);
    ts.forEach((t, i) => { if (t != null) return;
      const p = [...known].reverse().find(x => x[1] < i), n = known.find(x => x[1] > i);
      const t0 = p ? p[0] : a, i0 = p ? p[1] : -1, t1 = n ? n[0] : b, i1 = n ? n[1] : texts.length;
      ts[i] = t0 + (t1 - t0) * (i - i0) / (i1 - i0); });
    return ts.map(t => Math.max(a, Math.min(b, t)));
  },
  sfx(S, h) {
    const P = COMPOSE.plan(S, h), out = [];
    P.sc.forEach((s, i) => {
      const X = COMPOSE.X(S, h, s, P), sc = S.screen.scenes[i];
      if (i) out.push({ kind: 'whoosh', at: s.t0 });
      if (SCENES[s.type].sfx) (SCENES[s.type].sfx(sc, X) || []).forEach(f => f && Number.isFinite(f.at) && out.push(f));
    });
    return out;
  },

  // ---- the page (browser only)
  hpack(T) {               // timing helpers from the measured narration in the page
    const L = Object.fromEntries(T.lines.map(l => [l.id, l])), norm = w => w.toLowerCase().replace(/[^a-z0-9']/g, '');
    return { L, S: (lid, k) => L[lid].sentences[k], W: (lid, w) => (L[lid].words.find(x => norm(x.w).startsWith(norm(w))) || L[lid].words[0]).t };
  },
  look(S) { const f = LOOKS[S.look] || LOOKS.thread; return f(); },
  html(T, S) {
    const LK = COMPOSE.look(S), h = COMPOSE.hpack(T), P = COMPOSE.plan(S, h);
    const logo = contrast(BT.ink, LK.bg) >= 3 ? BT.logoDark : BT.logoLight;
    const layers = P.sc.map((s, i) => { const X = Object.assign(COMPOSE.X(S, h, s, P), { LK, S, q: sel => `#scn${i} ${sel}` });
      return `<div class="scn" id="scn${i}">${SCENES[s.type].html(S.screen.scenes[i], X)}</div>`; }).join('');
    return `<div id="lkbg" class="bgc" style="background:${LK.bgCss}">${LK.decor}</div>${layers}
      <div id="kwipe" class="k-wipe" style="background:${LK.name === 'flat' ? LK.fillB : BT.accent}"></div>
      <svg class="svgL" viewBox="0 0 1080 1920"><circle id="thrBig" cx="540" cy="960" r="40" fill="${BT.accent}" opacity="0"/>
        <circle id="thr" cx="0" cy="0" r="22" fill="${BT.accent}" opacity="0"/></svg>
      <img id="bug" class="m-bug h" src="${logo}" alt="${esc(BT.name)}">`;
  },
  build(tl, T, $, S) {
    const LK = COMPOSE.look(S), h = COMPOSE.hpack(T), P = COMPOSE.plan(S, h), dots = [], thread = LK.thread || S.thread;
    tl.set('#kwipe', { autoAlpha: 0 }, 0);
    P.sc.forEach((s, i) => {
      const sc = S.screen.scenes[i], lay = '#scn' + i;
      const X = Object.assign(COMPOSE.X(S, h, s, P), { LK, S, $: sel => $(`${lay} ${sel}`), q: sel => `${lay} ${sel}`,
        dot: (x, y, t, o = {}) => dots.push({ x, y, t, r: o.r || 22, i }),
        head: (sel, t, tOut) => MK.head(tl, sel, t, tOut === undefined ? X.tOut : tOut) });
      if (i === 0) tl.set(lay, { autoAlpha: 1 }, 0);
      else { tl.set(lay, { autoAlpha: 0 }, 0); (TRANSITIONS[sc.in || S.transition || LK.transition] || TRANSITIONS.fade)(tl, '#scn' + (i - 1), lay, s.t0 + COMPOSE.LEAD * .5, LK); }
      SCENES[s.type].build(tl, sc, X);
    });
    // the firm, on screen in the first seconds (house rule), clear of every scene's text zone
    M.enter(tl, '#bug', P.logo, { y: -16, d: .4 }); M.exit(tl, '#bug', Math.min(P.sc[1].t0 - .1, P.logo + 3.2));
    // the thread: one accent dot travelling between the points the scenes give it
    if (thread && dots.length) {
      dots.sort((a, b) => a.t - b.t);
      tl.set('#thr', { x: dots[0].x, y: dots[0].y, attr: { r: dots[0].r }, opacity: 0 }, 0).to('#thr', { opacity: 1, duration: .3 }, Math.max(0, dots[0].t - .3));
      for (let k = 1; k < dots.length; k++) {
        const a = dots[k - 1], b = dots[k], d = Math.min(.75, Math.max(.25, b.t - a.t - .05));
        tl.to('#thr', { x: b.x, y: b.y, attr: { r: b.r }, duration: d, ease: 'lr.move' }, b.t - d);
      }
      tl.to('#thr', { opacity: 0, duration: .2 }, P.sc[P.sc.length - 1].t0);
    }
  },
};

// ---- transitions between scene layers: (tl, outgoing, incoming, t, LK). t = the moment the new scene takes over.
Object.assign(TRANSITIONS, {
  cut(tl, A, B, t) { tl.set(A, { autoAlpha: 0 }, t).set(B, { autoAlpha: 1 }, t); },
  fade(tl, A, B, t) { tl.to(A, { autoAlpha: 0, duration: .25, ease: 'power1.in' }, t - .25).fromTo(B, { autoAlpha: 0 }, { autoAlpha: 1, duration: .3, ease: 'power1.out', immediateRender: false }, t); },
  slide(tl, A, B, t) {
    tl.to(A, { x: -1080, duration: .55, ease: 'lr.move' }, t - .3).set(A, { autoAlpha: 0, x: 0 }, t + .26);
    tl.set(B, { autoAlpha: 1, x: 1080 }, t - .3).to(B, { x: 0, duration: .55, ease: 'lr.move' }, t - .3);
  },
  stack(tl, A, B, t) {
    tl.to(A, { scale: .92, autoAlpha: .35, duration: .55, ease: 'lr.move', transformOrigin: '50% 40%' }, t - .3).set(A, { autoAlpha: 0, scale: 1 }, t + .26);
    tl.set(B, { autoAlpha: 1, y: 1920 }, t - .3).to(B, { y: 0, duration: .55, ease: 'lr.move' }, t - .3);
  },
  zoom(tl, A, B, t) {
    tl.to(A, { scale: 1.14, autoAlpha: 0, duration: .32, ease: 'power2.in', transformOrigin: '50% 50%' }, t - .3).set(A, { scale: 1 }, t + .05);
    tl.fromTo(B, { autoAlpha: 0, scale: .86, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: .45, ease: 'lr.out', immediateRender: false }, t);
  },
  wipe(tl, A, B, t) {
    tl.set('#kwipe', { autoAlpha: 1, xPercent: -100 }, t - .31).to('#kwipe', { xPercent: 0, duration: .3, ease: 'power3.in' }, t - .3);
    tl.set(A, { autoAlpha: 0 }, t).set(B, { autoAlpha: 1 }, t).to('#kwipe', { xPercent: 100, duration: .38, ease: 'power3.out' }, t);
    tl.set('#kwipe', { autoAlpha: 0 }, t + .39);
  },
  circle(tl, A, B, t) {
    tl.set(B, { autoAlpha: 1, clipPath: 'circle(0px at 540px 960px)' }, t - .25).to(B, { clipPath: 'circle(1200px at 540px 960px)', duration: .55, ease: 'power2.inOut' }, t - .25);
    tl.set(A, { autoAlpha: 0 }, t + .3).set(B, { clipPath: 'none' }, t + .31);
  },
  flip(tl, A, B, t) {
    tl.to(A, { rotationY: 90, duration: .28, ease: 'power2.in', transformPerspective: 2400, transformOrigin: '50% 50%' }, t - .28).set(A, { autoAlpha: 0, rotationY: 0 }, t);
    tl.set(B, { autoAlpha: 1, rotationY: -90, transformPerspective: 2400, transformOrigin: '50% 50%' }, t).to(B, { rotationY: 0, duration: .32, ease: 'power2.out' }, t);
  },
  thread(tl, A, B, t) {
    tl.set('#thrBig', { opacity: 1, scale: 0, svgOrigin: '540 960' }, t - .33).to('#thrBig', { scale: 32, duration: .32, ease: 'power3.in' }, t - .32);
    tl.set(A, { autoAlpha: 0 }, t).set(B, { autoAlpha: 1 }, t);
    tl.to('#thrBig', { scale: 0, duration: .36, ease: 'power3.out' }, t).set('#thrBig', { opacity: 0 }, t + .37);
  },
});
const TRANSITION_NAMES = Object.keys(TRANSITIONS);

// ---- the end card: every composed video closes on it (bound to the "cta" line)
SCENES.end = {
  label: 'End card', about: "The firm's logo, the closing line, the call-to-action button and the website, held still for the last seconds.",
  good: 'every video (always the last scene)', practice: 'any', fields: {}, example: { type: 'end', line: 'cta' },
  // the close follows the look: an accent field (thread, flat), a white card on the gradient (cards), black (silhouette)
  html(sc, X) {
    const LK = X.LK;
    if (LK.name === 'cards') return `<div class="bgc" style="background:${LK.bgCss}">${LK.decor}</div>${UI.card(LK, { id: 'eCard', x: 90, y: 470, w: 900, h: 1060 })}${endCard(X.S.screen, { bg: '#FFFFFF' })}`;
    if (LK.name === 'silhouette') return `<div class="bgc" style="background:${LK.ink}"></div><div class="lk-blinds" style="opacity:.5"></div>${endCard(X.S.screen, { bg: LK.ink })}`;
    if (LK.name === 'flat') return `<div class="bgc" style="background:${BT.endBg}"></div><div class="lk-dots" style="color:${mix(BT.endBg, BT.endText, .12)}"></div>${endCard(X.S.screen, {})}`;
    return `<div class="bgc" style="background:${BT.endBg}"></div>${endCard(X.S.screen, {})}`;
  },
  build(tl, sc, X) {
    if (X.LK.name === 'cards') { tl.set('#eCard', { autoAlpha: 0 }, 0).set('#eCard', { autoAlpha: 1, y: 140 }, X.tIn - .2).to('#eCard', { y: 0, duration: .55, ease: 'lr.out' }, X.tIn - .2); }
    endCardIn(tl, X.tIn, Math.max(X.tIn + .5, X.free));
  },
};
