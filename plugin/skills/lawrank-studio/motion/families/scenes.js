/* SCENES — a composed video: you choose a look, then a sequence of scenes from the scene library, one per narration
   line, and the composer joins them with the look's transitions. Hundreds of different videos come from the same
   tested parts, so pick fresh combinations across a campaign.
   Best for: anything. Explainers, "what to do after…", insurance tactics, firm intros, myths, steps, deadlines, FAQs.
   Storyboard: lines hook, then one line per scene (any ids you like, e.g. b1..b5), then cta (2-3 sentences: closing
   line, "Talk to …", the offer). Each scene is bound to a line and starts when that line is spoken.
   screen: { scenes: [{ type, line, ...the scene's own fields }, ..., { type: "end", line: "cta" }], end, cta, site?, disclaimer? }
   Top-level: "look": thread|flat|cards|silhouette, optional "transition" (otherwise the look's own). `lr templates motion`
   lists every scene with its fields and an example. */
FAMILIES.scenes = {
  id: 'scenes', label: 'Composed from the scene library',
  lines: S => [...new Set((S.screen.scenes || []).map(s => s.line))],
  cues(h, S) {
    const P = COMPOSE.plan(S, h);
    COMPOSE._sfx = COMPOSE.sfx(S, h);
    return { t0: P.sc.map(s => s.t0), t1: P.sc.map(s => s.t1), logo: P.logo, free: P.free, end: P.end };
  },
  sfx: () => COMPOSE._sfx || [],
  poster: T => { const t0 = T.cues.t0, k = Math.min(2, t0.length - 2); return Math.min(T.cues.t1[k] - .6, t0[k] + 1.6); },
  html: (T, S) => COMPOSE.html(T, S),
  build: (tl, T, $, S) => COMPOSE.build(tl, T, $, S),
  client(T, S) {
    const parts = (S.screen.scenes || []).filter(s => s.type !== 'end').map(s => SCENES[s.type]);
    return `<p class="lede">A ${esc(S.look || 'thread')}-style piece for ${esc(BT.short)} in ${parts.length} scenes: ${parts.map(p => esc(p.label.toLowerCase())).join(', then ')}. Every scene changes on the voiceover's own words, and it closes on the firm's end card.</p>
  <h3>Why it works</h3><ul><li><b>The firm is named in the first seconds</b>, in the voice and on screen.</li><li><b>One idea per scene</b>, each landing on the word that says it.</li><li><b>The firm's own colours and type</b> throughout.</li></ul>`;
  },
};
