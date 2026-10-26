# Motion posts

Authority clients get motion in the plan's 12 "Video / Motion" slots. Those posts arrive with
`"format": "motion"`; for other packages, the same slots are carousels. You write a **storyboard**
and one of four tested animation families does the craft. The narration is a free local voice, and
the animation is timed to the measured speech.

## Flow and timing
1. Run `lr templates motion`. It gives each family's story, its line ids (and how many sentences
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

## The families

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
   `speed` runs from 0.9 to 1.15 (1.04 is natural).
5. Claims follow the same rules as stills (reference/writing.md). Results, ratings and testimonials
   need approved facts, a `confirm` line and the disclaimer.
6. If a slot's facts can't support a motion story, use the plan's fallback; don't invent one.

## When the build flags a motion option
The QA checks look for text overlaps, text off frame, contrast on every frame, and an end card held
for less than 2.5 seconds. Each flag gives the time, the words on screen and a fix.
- Overlaps usually mean the lines and screen items don't match one to one. Each screen item appears
  when its line (or, for flip chips, its word) is spoken, so give each item its own sentence, in
  order.
- Never speed up the voice to fit.

The gallery poster for a motion option is a still from the piece (`images/<post>-<option>-motion.png`).
If that moment is mid-transition, the end card is used instead.
