# Writing posts

You write a post as a small JSON spec. Templates do all the design, and `lr build` renders and
checks every option. Good copy and a fitting template choice are what make a post great.

## Building a month: the fast way
1. Run `lr client show "<client>"`. Keep its `photos` (keys and who is in them), its usable `facts`
   (keys and text) and the `direction` (its name, feel, templates and treatments) in mind.
2. Run `lr library search "<monthly focus>" --client "<client>"` to see what's already been done for
   this firm. Search once more without `--client` for ideas that worked elsewhere.
3. Read the month's posts: `campaigns/<campaign>/posts/PI-0NN.json`. Each has the `plan` row (topic,
   angles, info needed, fallback) and `suggested_templates`.
4. Run `lr templates <name>,<name>,…` once for all the templates you'll use. It returns their slots,
   worked examples and the icon names.
5. Write the `options` into every post of the month, then run one build:
   `lr build "<client>" --month N`. Building all posts at once is much faster than one at a time.
6. Fix what's reported (see SKILL.md), rebuilding only those posts with `--post`.

## The spec

```json
{
  "id": "PI-017", "month": 3, "topic": "Car Accident Representation", "format": "static",
  "plan": { "...": "the plan row, already filled in. Don't edit" },
  "suggested_templates": ["photo-split", "icon-list"],
  "options": [
    {
      "key": "A",
      "template": "photo-split",
      "treatment": "dark",
      "photo": "jason",
      "copy": {
        "label": "Car accidents",
        "headline": "Hurt in a crash? We handle the insurance company.",
        "accent": "We handle the insurance company.",
        "support": "Jason McMinn and the team help injured Texans recover what they're owed.",
        "cta": "Free consultation"
      },
      "facts": ["insurance_defense", "free_consult"],
      "caption": "After a crash, the insurance company has a team working for them. You should too. ...",
      "alt": "Attorney Jason McMinn beside the headline: Hurt in a crash? We handle the insurance company."
    }
  ]
}
```

Only `options` is yours to write. The fields of each option:

| Field | What it is |
|---|---|
| `key` | `A`, `B` or `C` |
| `template` | must match the post's `format` (static, carousel, kit or motion) |
| `treatment` | `dark`, `light` or `accent`, chosen from the template's list; colours come from the brand. Follow the client's chosen direction. |
| `photo` and the other options | template options from `lr templates <name>`, such as `photo`, `cover_photo`, `photos`, `close_photo`, `footer`, `stars` or `icon` |
| `copy` | the template's slots; the character limits are hard limits |
| `facts` | the fact keys behind every claim in the copy and caption |
| `caption` | the social caption: 1–3 short paragraphs, then a call to action. No hashtag walls (at most 3). |
| `alt` | what the image shows, for screen readers, including the headline text |
| `confirm` | optional list, such as `["Justin handles the Utah cases"]`: anything else the firm should check, in plain words. These go to `check_before_posting` and the review sheet. |

`accent` must be a phrase taken word for word from the `headline` (in faq it comes from the
`question`, and in myth-fact from the `fact`). It's coloured with the brand accent, so make it the
payoff ("We handle the insurance company."), not filler.

The worked examples show shape and length; their claims belong to a test firm. Never copy a claim
from an example. Write each claim from this client's facts.

## Choosing templates
- Start from `suggested_templates`. Give each option a different template where you can, so the
  client sees real choices: for example A = photo-split, B = icon-list, C = statement.
- Use the firm's people whenever there are good photos: photo-split, portrait, poster and
  photo-story. With no people photos, use type-led templates: statement, big-type, faq, myth-fact,
  icon-list and steps.
- Across a month, mix photo-led and type-led posts and vary the treatment, so the feed doesn't
  repeat itself.
- Use carousels for anything with steps or a list (`format: carousel` posts): photo-story by
  default, big-type when photos are thin, checklist for things to save.
- Portraits need a single-person photo (`kind: person`). Covers and banners need a group photo.

## Writing copy that works
- **One idea per post.** The headline says it. Support adds one concrete detail, and the CTA says
  what to do next.
- **Headlines:** plain, specific, spoken English, 4–10 words. Write from the client's side ("Hurt
  at work?") rather than the firm's ("We are dedicated to..."). Questions and short promises of
  *service* work well; promises of *outcome* are not allowed.
- **Labels** are 1–3 words that set the topic ("Car accidents", "Know your rights").
- **CTAs:** "Free consultation" only if the `free_consult` fact is usable. Otherwise use "Talk to
  us", "Call today" or "Learn more".
- **Names:** use the attorneys' real names from `people` when their photo is used.
- **Local:** mention the city or state when the firm's offices support it.
- **Carousels:** the cover hooks ("5 things to do after a crash"). Each slide is one point: `big`
  is 1–2 words, `title` is the point, and `text` is a sentence of explanation. The close slide is the
  call to action. Use 3–6 slides, and say only what the facts support.
- Write in sentence case. Use no exclamation marks, emoji or ALL CAPS (templates handle case).
- Never shrink text to fit. If a slot is too long, rewrite it shorter.

## Claims and compliance (enforced by `lr build`)
- **Blocked:** guarantees or promises of outcomes ("guarantee", "will win", "never lose");
  superlatives ("the best", "#1", "top-rated", "leading", "premier") unless quoting an approved award; any number not in a cited fact; results without a cited, approved fact and the
  disclaimer; testimonials without an approved fact.
- **Flagged for a human** (`check_before_posting`): "expert" or "specialist", fee statements
  ("free", "no fee unless we win") without a usable fees fact, and facts still awaiting approval.
  Quoting a usable fact word for word (for example, "the free case evaluation form") is fine.
- **Results** means money amounts, or the firm saying it won, recovered or secured something.
  General education ("many claims settle; some go to trial") is not a result and needs no
  disclaimer.
- Results always carry the disclaimer slot or caption line: "Past results do not guarantee future
  outcomes."
- General legal information is fine ("Texas has a two-year deadline for most injury claims") only
  when the fact is in the client's facts. Otherwise keep it general ("Deadlines apply. Don't wait.").
- If the plan needs info the firm hasn't given (the plan's `needs_client_info`), use the `fallback`
  and add a `confirm` line asking for it.

## Test designs (new clients)
`lr directions` writes a "Test designs" campaign (posts `DIR-A` … `DIR-D`) with sample copy from the
firm's facts, and builds it. To improve the copy, edit those posts and run
`lr build "<client>" --campaign "Test designs"`. Keep the templates and treatments: they define
each direction.

## Revisions
- "Make it punchier" means a shorter headline with a stronger verb and a sharper accent phrase.
- "Use Jason's photo" means setting `"photo": "jason"` (keys from `lr client show`).
- "Try it in the light style" means `"treatment": "light"`.
- Reviewers set Status and Notes in review.xlsx. `lr client show` lists them under the campaign's
  `feedback`, and `lr build` repeats them as `reviewer_feedback`. Address each note, rebuild that
  post, and say what you changed. The rebuild sets the option's status to **Revised**, which sends
  it back to the reviewer. Only reviewers set Approved.
- If a note asks for something the facts don't support (for example, "lead with his Utah work" when
  no fact ties him to Utah), write the closest version the facts do support, cite those facts, and
  add a `confirm` line asking the firm for the missing detail. Say so in your reply.
- Editing an approved option sends it back for review. That's intended.
