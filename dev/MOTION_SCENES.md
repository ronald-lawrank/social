# Building scenes for composed motion videos

Composed videos (`family: "scenes"`) are assembled from **scenes**, drawn in one of four **looks**, joined by
**transitions**. A scene is one beat of a video, bound to one narration line. Every scene must work in every look, in
any firm's colours, with any wording the writer gives it.

Read first, in this order:
- `plugin/skills/lawrank-studio/motion/runtime/compose.js`: the scene contract (header comment), timing, transitions.
- `plugin/skills/lawrank-studio/motion/runtime/looks.js`: the four looks (LK tokens) and the UI helpers.
- `plugin/skills/lawrank-studio/motion/runtime/kit.js`: BT (brand tokens), colour maths (mix, contrast, readable),
  `esc`, `accentize`, `icon`, `markPath`, and `MK` / `M` (motion vocabulary in `player.js`).
- The exemplar scenes: `motion/scenes/kinetic.js`, `chat.js`, `checklist.js`.

## The four looks (reference videos the team loves)
- **thread**: clean light world, line art, generous space. One accent dot travels through the whole video, landing
  on things (Adobe CMO explainer). In this look, call `X.dot(x, y, t)` at least once per scene, where the dot would
  naturally land (a tick, the end of a phrase, a pin, a button).
- **flat**: bold flat illustration on the brand colour, chunky shapes, no outlines, playful pops (Skrill explainer).
- **cards**: soft warm gradient, floating white UI cards with deep shadows, crisp product-UI feel (LicenseSeat).
- **silhouette**: off-white paper, black cut-out shapes and figures, uppercase editorial type, hard offset shadows
  (Mad Men titles).

Use the LK tokens for every colour: `LK.ink`, `LK.sub`, `LK.accent`, `LK.accentText`, `LK.surface`, `LK.surfaceInk`,
`LK.shadow`, `LK.radius`, `LK.stroke`, `LK.line`, `LK.soft`, `LK.fillA/B/C`, `LK.people`, `LK.headWeight`,
`LK.headCase`. Branch on `LK.name` where a look needs a different drawing (as kinetic does). Neutral UI greys inside
a phone or form are fine. Never hard-code a brand colour; firms range from navy to orange to green.

## Rules (the QA enforces most of them; a scene isn't done until all four looks pass)
1. **Timing from the voice.** Items appear on the word that says them: `X.times([texts])` gives each item's time.
   Use `X.tIn` and `X.tOut` for the scene's own entrance and exit. Never time things on a fixed clock alone.
2. **Text windows.** Readable text (`data-qa="text"`; UI.head and UI.text add it) is visible only inside
   `[X.tIn, X.tOut]`, so it never overlaps the next scene's text during a transition. Exit everything at `X.tOut`.
3. **Safe area.** Text stays inside x 70–1010 and y 300–1560. The logo bug sits above 300 during the first seconds,
   and the bottom is kept clear for platform UI. Nothing runs off the frame.
4. **Contrast.** Small text is 4.5:1 against what's actually behind it, and large text (40px+, or 28px bold) is
   3:1. Use `readable()` and `contrast()` from kit.js when placing text on colour.
5. **Seek-safe.** The MP4 renderer jumps between frames, so every frame must be the same whether the video played up
   to it or jumped to it:
   - Never put `autoAlpha` or `opacity` only in the `from` half of a `fromTo`.
   - Use `tl.set(el, {autoAlpha: 1, y: 80}, t).to(el, {y: 0, ...}, t)`, or a fromTo with autoAlpha in both halves.
   - Hide elements at time 0 with `tl.set(el, {autoAlpha: 0}, 0)`.
6. **Type sizes.** Body text is at least 36px; labels can go to 30px bold. Headlines are 72–110px. The video is
   watched on a phone.
7. **One idea per scene.** Something should always be moving gently (a settle, a drift, a pulse), but never more
   than one thing should demand attention at a time.
8. **Motion quality.**
   - Use the house eases: `lr.out` for entrances, `lr.in` for exits, `lr.move` for camera moves. `back.out` is for
     small pops only.
   - Entrances last 0.35–0.6s.
   - Stagger lists by voice timing, not by fixed gaps.
   - Prefer transforms (x, y, scale, rotation) and DrawSVG/MorphSVG to fades.
   - Fades alone look cheap.
9. **Self-contained.** One scene per file in `motion/scenes/<type>.js`. Put helpers inside the scene object or name
   them with a unique prefix (top-level names are shared across files). Don't edit shared files (compose.js,
   looks.js, kit.js, stage.css, motion.py); if you need something there, say so in your report.
10. **Practice.** Crash or car imagery means `practice: ['personal injury']`; everything else is `'any'`.
11. **Facts.** The example's `say` and fields must be things any firm could say: no results, ratings or "free"
    unless the field is clearly a placeholder the writer replaces with an approved fact.
12. **No assets.** No external images, fonts or files. Draw with SVG and HTML. Icons come from `icon(name, ...)` /
    `UI.icon`: check, arrow, bookmark, search, chat, doc, scale, gavel, car, truck, walk, users, home, shield,
    clock, globe, bus, phone, star, heart, map, briefcase, dollar, hospital, trophy. Silhouette figures are your own
    SVG paths.

GSAP plugins available: DrawSVG, MorphSVG, MotionPath, SplitText (`MK.lines`), Physics2D and CustomEase.

## Gotchas builders have hit
- `line` (and `type`, `in`) are reserved scene keys: `line` is the narration line id, not text to show. Name a
  second line of text `sub`.
- `sfx` runs in node without a look, so `X.LK` is undefined there: keep look-dependent code out of `sfx` and any
  helper it calls.
- Set `transformOrigin` with `tl.set(el, {transformOrigin}, 0)` rather than only inside a `fromTo`; otherwise the
  frame-jumping QA can see a different origin and report "off-frame".
- The logo sits above y 300 for the first seconds: keep busy artwork out of that strip at the scene's start.

## Scene object
```js
SCENES['my-scene'] = {
  label: 'Short name', about: 'One sentence: what the viewer sees.', good: 'what it suits', practice: 'any',
  fields: { head: '...', items: '...' },                 // documented for writers
  example: { say: 'The narration line this example goes with.', head: '...', items: [...] },
  sfx: (sc, X) => [{ kind: 'pop', at: t }],             // whoosh soft pop chime thud clink impact buzz crackle rumble
  html: (sc, X) => `...`,                               // absolute positions on the 1080x1920 stage
  build: (tl, sc, X) => { ... },
};
```
`X` gives you:
- `X.id` (prefix your element ids with it), `X.LK`, `X.S` (the storyboard), `X.$(sel)` (query inside the scene).
- Timing: `X.t0`, `X.t1`, `X.tIn`, `X.tOut`, `X.line` (words and sentences), `X.times(texts)`, `X.at(word)`,
  `X.sent(k)`.
- `X.head(sel, t, tOut)`: the masked line-by-line headline entrance.
- `X.dot(x, y, t, {r})`: the thread look's travelling dot.

## Checking your work
```
python3 dev/motion_catalog.py --scene <type>            # all four looks: page, contact sheet, QA
python3 dev/motion_catalog.py --scene <type> --look flat
```
Each run prints `ok` or `FIX` with the QA findings and writes `/tmp/lr-motion-catalog/out/<type>/<look>.png`, a
contact sheet across the scene. **Open the contact sheets and look at them.**

Ask yourself whether a creative director would put this in a paid ad. If it looks like a slideshow, a template or
a wireframe, keep going: richer drawing, better composition, a real idea in the motion.

Then try a second wording: longer items, a three-word headline, the maximum number of items. Make sure it still
lays out well.
