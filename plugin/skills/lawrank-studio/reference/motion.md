# Motion posts

Authority clients get motion in the plan's 12 "Video / Motion" slots. Those posts arrive with
`"format": "motion"`; for other packages, the same slots are carousels. You write a **storyboard**;
a composed video (scene library, below) or one of the four original families does the craft. The narration is
read by the voice this laptop is set up for (see Voices and music), and the animation is timed to the measured speech.

## Flow and timing
1. Run `lr templates motion --client "<client>"`. It lists the scene library for composed videos (scenes
   that suit the firm's practice only) and the original families (journey, shield and weight open on a car
   crash, so they're offered to personal-injury firms only). It gives each family's story, its line ids (and how many sentences
   each line takes), its screen shape and a worked storyboard. Then write a storyboard option (or
   two, in different families) into the post.
   - "The month's motion post" means every motion slot in that month (Authority months have two).
     Do them all and say so.
2. Run `lr build "<client>" --post PI-006`. The first build takes about 30 seconds per option (voice
   plus preview) and is cached after that. You get a self-contained preview page that plays with
   sound, and a poster image, both shared via the gallery.
3. A reviewer marks the option Approved in review.xlsx.
4. Run `lr video "<client>"`. It renders MP4s for approved options only: a 1080×1920 (9:16) file and a
   1080×1350 feed cut, about 1 minute each. To render a draft on request, run
   `lr video "<client>" --post PI-006`.

## The storyboard

```json
{
  "key": "A", "template": "motion", "family": "journey", "voice": "am_michael", "speed": 1.04,
  "facts": ["free_consult", "insurance_defense"],
  "lines": [
    {"id": "hook", "say": "After a crash, McMinn Law Firm helps you find the way forward."},
    {"id": "s1", "say": "We listen, and explain your options in plain language."},
    {"id": "s2", "say": "We investigate what happened."},
    {"id": "s3", "say": "We handle the insurance company."},
    {"id": "cta", "say": "You don't have to find the way alone. Talk to our team today."}
  ],
  "screen": {
    "head": "Find the way forward.",
    "stops": [{"icon": "chat", "head": "We listen and explain your options."},
              {"icon": "search", "head": "We investigate what happened."},
              {"icon": "phone", "head": "We handle the insurance company."}],
    "close": "You don't have to find the way alone.",
    "end": "Talk to our team.", "cta": "Talk to us", "site": "mcminnlaw.com",
    "disclaimer": "Attorney advertising."
  },
  "confirm": [],
  "caption": "After a crash, you don't have to find the way alone. ...",
  "alt": "Animated map: a route through the city with the firm's steps as pins."
}
```

## Composed videos (`"family": "scenes"`): the default
Most motion posts should be **composed**: choose a **look**, then a run of **scenes** from the scene library, one
per narration line, ending on the end card. The parts are tested, and the combinations are endless, so no two
posts need to look alike.

- **Looks:**
  - `thread`: a clean light world where one accent dot travels through the whole piece.
  - `flat`: bold flat illustration on the brand colour.
  - `cards`: a warm gradient with floating UI cards.
  - `silhouette`: a paper collage with black silhouettes and editorial type.
- **Scenes:** `lr templates motion --client "<client>"` lists every scene with what it shows, what it's good for,
  its fields and a worked example. There are scenes for:
  - headlines and word swaps;
  - texts, calls, letters and forms;
  - checklists, timelines and steps;
  - counters, myths and Q&A;
  - maps, roads, scales, umbrellas and weights;
  - people moments, the attorney, the office door.
- **Transitions** come with the look; set `"transition"` to override (`thread`, `wipe`, `stack`, `slide`, `zoom`,
  `circle`, `flip`, `cut`, `fade`).

```json
{
  "key": "A", "template": "motion", "family": "scenes", "look": "cards", "voice": "af_heart", "speed": 1.04,
  "lines": [
    {"id": "hook", "say": "Hurt in a crash? McMinn Law Firm has a few things to tell you first."},
    {"id": "b1", "say": "The adjuster may text you within days. Can we get a recorded statement? We can offer two thousand today."},
    {"id": "b2", "say": "Before you answer, do four things: see a doctor, take photos, keep every bill, and call before you sign."},
    {"id": "cta", "say": "You don't have to handle the insurance company alone. Talk to our team today."}
  ],
  "screen": {
    "scenes": [
      {"type": "kinetic", "line": "hook", "head": "Hurt in a **car crash?**", "kicker": "Before you answer"},
      {"type": "chat", "line": "b1", "head": "They move **fast.**", "name": "Insurance adjuster",
       "messages": [{"from": "them", "text": "Can we get a recorded statement?"}, {"from": "them", "text": "We can offer $2,000 today."}]},
      {"type": "checklist", "line": "b2", "head": "Do this first", "items": ["See a doctor", "Take photos", "Keep every bill", "Call before you sign"]},
      {"type": "end", "line": "cta"}
    ],
    "end": "Talk to our team today.", "cta": "Talk to us", "site": "mcminnlaw.com", "disclaimer": "Attorney advertising."
  }
}
```
Rules for composed videos:
- **Scene timing.** The first scene goes with `hook` (the firm is named there), and the last is
  `{"type": "end", "line": "cta"}`. Each scene starts when its line starts and lasts until the next scene's line,
  so give every scene a line of at least one full sentence.
- **On-screen items.** Items appear on the words that say them, so write each item in the line, in order, in the
  same words.
- **Mix it up.** Across a campaign, vary the look, the opening scene and the run of scenes. The options of one post
  should be in different looks, so the client sees real choices. The build lists repeats under
  `motion_variety`; fix them before sending.
- **Practice fit.** Scenes with crash imagery are for personal-injury firms only, and `lr templates motion --client`
  leaves them out for other practices.

## The original families

| family | the story | best for | lines | screen |
|---|---|---|---|---|
| `journey` | A route draws through an illustrated city, with one pin per step | process, client journey, how we prepare | hook, s1…s4 (one per stop), cta | `head, stops:[{icon, head}] (3–5), close, end, cta, site?, disclaimer?` |
| `shield` | The firm's mark opens into an umbrella against a storm of problems | do I need a lawyer, dealing with insurers, who's responsible | hook, pile, turn, work, calm, cta | `head, items:[{kind: bill/phone/pay/letter, label}]×3, cloud, turn, strikes:[3], calm, end, cta` |
| `weight` | The mark slides under a pile of problems and takes the weight | what happens after a crash, common mistakes, "focus on healing" | hook, pile, turn, a1, a2, a3, life, cta | `head (mark one **word**), items:[3 labels], turn, actions:[3], life, end, cta` |
| `flip` | A fast branded cut; each shape swells into the next background | brand ads, why choose us, FAQs, proof posts | hook, help, invest, proof?, rating?, cta | `hook:{pre, word}, after, help:[2], invest, chips:[3], proof?, rating?, end, cta` |

- In `flip`, `proof` is `{stat, statLine, results:[{n, label}]×2, disclaimer}` and `rating` is
  `{score, label, quote, by}`. Use these only with approved facts.
- `journey` icons: chat, search, phone, doc, scale, gavel, car, truck, walk, users, home, shield, clock,
  globe, bus, star, heart, map, briefcase, dollar, hospital, trophy, check, arrow and bookmark.
- `**word**` in a screen headline marks the accent word.

## House rules
1. Name the firm in the first 2–3 seconds, both in the voice (the hook) and on screen.
2. Write lines to be spoken: short, natural sentences. Write numbers as words ("four point two
   million"); the checker refuses digits in `say`.
3. Each line is one idea, and the screen text says the same idea in fewer words.
4. Vary the family and the voice across the campaign; don't put the same family in two motion slots
   in a row. Voices: af_heart, af_bella, af_nicole, am_michael, am_fenrir, am_puck and bf_emma.
   For non-injury firms only flip is offered, so vary the voice and the story instead.
   `speed` runs from 0.9 to 1.15 (1.04 is natural).
5. Claims follow the same rules as stills (reference/writing.md). Results, ratings and testimonials
   need approved facts, a `confirm` line and the disclaimer.
6. If a slot's facts can't support a motion story, use the plan's fallback; don't invent one.

## Voices and music
`lr voice` shows which voice reads on this laptop. The storyboard's `voice` (af_heart, am_michael ...) names a
persona: warm female, deeper male and so on. Every voice below has its own match for each persona, so a storyboard
never changes when the voice does.

| Voice | What it's like | Set up |
|---|---|---|
| ElevenLabs | most natural; exact word sync | `lr voice key elevenlabs <key>` (the person's key, paid per character) |
| OpenAI | natural and cheap; sync from a transcription | `lr voice key openai <key>` |
| Chatterbox | free and private; runs on the laptop, slower | `lr voice install chatterbox` (one time, about 3 GB) |
| Kokoro | built in, quick, a little flat | nothing: it's the fallback for every voice |

- With nothing picked, the best ready voice reads (ElevenLabs, then OpenAI, then Chatterbox, then Kokoro).
  `lr voice use <name>` picks one. Keys stay on the laptop (`~/.lawrank-studio/keys.json`), never in a
  client folder or the Drive. If the person pastes a key, save it with `lr voice key` and don't repeat it back.
- If a voice fails (no key, no credit, no internet), the piece is read by Kokoro and the build shows a
  `voice` warning saying why. Finish the build, then tell the person in your reply.
- Music: each piece gets a soft bed that dips under the voice. It's generated by the studio, so there's
  nothing to license. Choose it with the storyboard's `music`: warm, hopeful, steady, serious or none. Left
  out, it follows the look (thread: warm, flat: hopeful, cards: steady, silhouette: serious). A firm's own
  licensed track replaces it: put `<mood>.mp3` in the Drive's "LawRank Studio/Music" folder.
  `lr voice music off` turns beds off on this laptop.

## When the build flags a motion option
The QA checks look for text overlaps, text off frame, contrast on every frame, and an end card held
for less than 2.5 seconds. Each flag gives the time, the words on screen and a fix.
- Overlaps usually mean the lines and screen items don't match one to one. Each screen item appears
  when its line (or, for flip chips, its word) is spoken, so give each item its own sentence, in
  order.
- Never speed up the voice to fit.

The gallery poster for a motion option is a still from the piece (`images/<post>-<option>-motion.png`).
If that moment is mid-transition, the end card is used instead.
