# LawRank Creative Studio — rebuild plan

A Claude skill that takes a law firm's website to finished, on-brand social creative: HTML previews,
PNGs, MP4s (after approval), a Figma plugin and a client deck. The team only talks to Claude; the
machinery is hidden. Everything is remembered in the shared Google Drive folder **Claude**.

**Goals, in order:** amazing outputs · easy prompting · realistic time.

---

## 1. What the team experiences

| They say | Claude does | Rough time |
|---|---|---|
| "New client: smithinjury.com" | Scans the site, saves the brand profile, lists facts that need approval, renders test designs in 3–4 directions | 10–15 min |
| "They like direction B" | Locks the direction for that client | seconds |
| "Build month 2" | Writes all 8 posts (options A/B/C), renders every size, runs the checks, fills in the review sheet | 10–15 min |
| "Make PI-017 punchier" / "Use Jason's photo on PI-017" | Revises just that post and re-renders it | 1–2 min |
| "Render the approved videos" | Voices and renders an MP4 for each approved motion post | 2–3 min each |
| "Package month 2 for the client" | Figma plugin, client deck, PNG and MP4 folders | 3–5 min |

Approvals happen in a spreadsheet in Drive (`review.xlsx`): a reviewer sets a post's status to
**Approved**. Claude picks that up next time it runs.

**Setup per person (once, ~10 min):** Claude desktop app · Google Drive for desktop with the
**Claude** folder set to *available offline* · the LawRank Studio plugin from the org catalogue.
First run of `lr setup` installs the render tools (Chromium, ffmpeg, voice model).

---

## 2. The shared Drive folder

```
Claude/
├── LawRank Studio/
│   ├── templates/          the design library (see §5): one folder per template
│   ├── plan/               six_month_plan.csv (+ the original xlsx)
│   └── library/            library.jsonl (machine index of all approved work) + library.xlsx (human view)
└── Clients/
    └── Smith Injury Law/
        ├── client.json             name, website, practice area, package, chosen direction
        ├── brand/
        │   ├── brand.json          colours by role, fonts, button style, voice, do/don't rules
        │   ├── facts.xlsx          every fact · source page · category · needs approval · approved by
        │   ├── logos/              vector logos (white, dark, mark)
        │   ├── photos/             the firm's own photos + photos.json (who, source page, face/body boxes)
        │   ├── board.html          brand board preview (colours, type, logo, photos)
        │   └── site/               text snapshots of every page read (proof for every fact)
        ├── campaigns/
        │   └── 2026-11 Six-Month/
        │       ├── posts/PI-017.json       the post spec Claude writes (§4)
        │       ├── review.xlsx             one row per option: preview, caption, checks, Status, notes
        │       ├── index.html              gallery of every preview in the campaign
        │       ├── previews/               PI-017-A.html …   (open in any browser)
        │       ├── images/                 PI-017-A_4x5.png …
        │       ├── video/                  PI-006-A.mp4 …   (approved motion only)
        │       └── exports/                Figma plugin zip, client deck .pptx
        └── history.log             append-only: who did what, when
```

**Why these formats:** scripts read and write plain files through Drive for desktop, so photos and
videos never pass through Claude's context (fast, cheap). Spreadsheets are `.xlsx`, not native
Google Sheets, because native Sheets aren't readable as local files; Google Sheets edits `.xlsx` in
place, so reviewers still use Sheets as normal.

**Two people at once:** every post is its own file, and a build takes a short lock on its campaign
(`.lr-lock`, with the person's name). A second person building the same campaign is told who is
working on it.

---

## 3. The skill package

```
lawrank-studio/                      (Claude plugin, installed from the org catalogue)
├── .claude-plugin/plugin.json
├── skills/lawrank-studio/
│   ├── SKILL.md                     < 200 lines: routing, rules, the commands (draft: skill/SKILL.md)
│   ├── reference/                   read only when that stage comes up
│   │   ├── onboarding.md            new client: scan, brand, facts, photos
│   │   ├── writing.md               copy rules + the post spec schema + examples
│   │   ├── templates.md             what each template is for and the copy it needs
│   │   ├── motion.md                storyboards, voice, families
│   │   ├── compliance.md            attorney-advertising rules (claims, testimonials, disclaimers)
│   │   └── delivery.md              Figma import steps, client deck, packaging
│   └── scripts/lr                   one CLI, one JSON line per command
└── figma-plugin/                    source of the Figma import plugin
```

Claude only ever runs `lr <command>` and reads one short JSON line back. Everything heavy is
scripted: scanning, image work, rendering, checks, video, exports.

| Command | Does |
|---|---|
| `lr setup` / `lr doctor` | install and check the render tools |
| `lr client new <url>` | scan site → brand.json, facts.xlsx, logos, photos (+ people boxes), board.html |
| `lr client show <client>` | short summary: brand, facts needing approval, campaigns, statuses |
| `lr directions <client>` | test designs in 3–4 directions from the brand |
| `lr campaign new <client> [--plan six-month]` | campaign folder + one empty spec per plan slot, topics adapted to the practice area |
| `lr build <client> [--month 2 \| --post PI-017]` | validate specs → render HTML + PNG → checks → review.xlsx + index.html |
| `lr library search "<text>"` | approved work and templates to reuse, with repeat warnings |
| `lr video <client> [--approved]` | voice + MP4 for approved motion posts |
| `lr package <client> --month 2` | Figma plugin, client deck, PNG/MP4 folders |

---

## 4. What Claude writes: the post spec

Claude writes copy and picks templates; it never writes layout code. One file per post:

```json
{
  "id": "PI-017", "month": 3, "topic": "Car Accident Representation", "format": "static",
  "options": [
    { "key": "A", "template": "photo-split", "photo": "jason",
      "copy": { "label": "Car accidents", "headline": "Hurt in a crash? We take it from here.",
                "accent": "We take it from here.", "support": "Austin injury attorneys since 2005.",
                "cta": "Free consultation" },
      "facts": ["founded", "practice_areas", "free_consult"],
      "caption": "…", "alt": "…" }
  ]
}
```

`lr build` refuses a spec that cites an unknown fact, uses an unapproved claim without flagging it,
or leaves copy longer than the template allows, and says exactly what to change.

---

## 5. The template library (the main quality lever)

A curated, designer-approved set. Every template is an HTML file driven by the client's brand
tokens (CSS variables), with named copy slots and limits. Templates live in Drive, so a design
change reaches the whole team at once.

```
templates/photo-split/
├── template.html       layout + slots, brand via CSS variables
├── meta.json           sizes, slots + character limits, photo needs, which plan slots it suits
└── example.png         what it looks like with sample copy
```

**Version 1 set** (rebuilt from the old engine's best looks):

| Group | Templates |
|---|---|
| Statics | statement · photo-split · portrait-spotlight · proof-stat · testimonial · icon-list · steps · myth-vs-fact · faq-answer · poster |
| Carousels | photo-story (photo opener, giant word per slide) · proof-stack · big-type · checklist |
| Profile & covers | profile-mark · facebook-cover · linkedin-banner · highlight-covers |
| Motion | journey · shield · weight · flip (the four families from the old system, ported) |
| Brand | brand-board (one HTML page per client) |

Sizes: 4:5, 1:1, 9:16 for posts; the platform sizes for covers.

---

## 6. Quality checks (every render, automatic)

Run inside the browser on the real render, so what is checked is what ships:

- **People:** faces, heads and shoulders never cropped; nothing drawn over a face or chest (uses the
  face/body boxes saved per photo).
- **Text:** nothing overflows or collides; minimum sizes (headline ≥ 64 px, body ≥ 30 px at 1080
  wide); never shrink type to fit. The fix is shorter copy, another photo, or another template.
- **Contrast:** 4.5:1 small text, 3:1 large, measured against what is actually behind the text.
- **Safe zones** per size (story UI, cover crops, profile circle).
- **Variety:** options of the same post that look alike; neighbouring posts reusing an opener photo.
- **Compliance lint:** guarantees, "best/expert/specialist", results without the past-results
  disclaimer, testimonials without consent, any fact still awaiting approval.

Output is one JSON line plus a contact sheet of only the flagged designs; Claude looks at those, fixes
them, and rebuilds just those posts.

---

## 7. Motion and video

1. Claude writes a short storyboard for the motion slot (what is said, what is shown), choosing one
   of the four families.
2. Kokoro (local, free) voices the lines; cue times come from the measured speech, so animation fits
   the narration and never the other way round.
3. The preview is an HTML page with a play button, so the team can review it instantly.
4. **After approval,** HyperFrames renders the same HTML to MP4 (1080×1920, plus a 4:5 version for the
   feed), frame by frame and identical every time.

---

## 8. Figma

`lr package` exports each rendered design as layers (frames, editable text with the brand fonts,
images, vector logo) into a small Figma plugin. The team imports it once in the Figma desktop app and
builds the month's frames with one click. It's generated from the same HTML render, so Figma matches
the previews.

---

## 9. Keeping it fast and light

- SKILL.md is short; stage details load only when that stage comes up.
- Scripts return one JSON line; Claude opens files only when something fails.
- Builds are batched: a month is one command, not 48 round trips.
- Renders are cached: unchanged posts aren't re-rendered.
- Claude views images only for designs the checks flagged.
- `lr client show` gives Claude everything it needs in about 20 lines; no re-reading the site.

---

## 10. Building it

| Step | Delivers | Done when |
|---|---|---|
| 1. Foundations | `lr` CLI, Drive layout, setup/doctor, locking, history | runs in the Claude desktop app on a Mac and Windows laptop |
| 2. Onboarding | scan → brand.json, facts.xlsx, logos, photos + people boxes, brand board | 3 real firm sites onboard with correct colours, fonts and logo |
| 3. Templates + renderer + checks | version 1 template set, HTML/PNG rendering, all checks | every template passes on 3 brands, all sizes |
| 4. Campaigns | plan → specs → build → review.xlsx → revise | a full month built in ≤ 15 min |
| 5. Motion | 4 families, voice, preview, MP4 on approval | MP4s pass motion checks |
| 6. Delivery | Figma plugin, client deck, package | imports cleanly into Figma; deck opens in PowerPoint and Slides |
| 7. Pilot | one real client end to end, timing measured, team feedback | the team prefers it to the old workflow |

## Risks to check early

1. **Render tools inside the Claude desktop app.** Chromium, ffmpeg and the voice model must install
   and run there. This is step 1's first test; Claude Code is the fallback.
2. **Sites that block scanning.** Some firm sites block automated browsers; the fallback is a teammate
   saving the page or dropping in logos and photos.
3. **GSAP licence.** Free for commercial use, but it bars building a no-code animation tool that
   competes with Webflow. An internal skill making LawRank's own videos looks fine; worth a quick look.
4. **Drive sync delay.** A few seconds between laptops: fine for this work, and the lock covers
   simultaneous builds.
