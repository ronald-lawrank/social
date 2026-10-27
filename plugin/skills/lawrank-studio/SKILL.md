---
name: lawrank-studio
description: Builds LawRank law-firm social creative from a firm's website, including brand profiles, test designs, six-month campaigns, posts, carousels, covers and profile pictures, motion videos (MP4), Figma plugins and client decks. Use for any LawRank client or law-firm social work, such as a new client URL, test designs, building a month or a post (PI-017), revising a post, rendering approved videos, packaging for a client, or checking what's been done for a client.
---

# LawRank Studio

You write the words and choose the templates. The `lr` command does everything else: it scans
sites, renders, checks and packages. In this file `lr` means:

```
python3 "<this skill's folder>/scripts/lr.py"
```

Every command prints one JSON line. Act on that line; open other files only when it points you to
one. Never write HTML or CSS, and never edit templates.

## Start of every session
1. Run `lr doctor`. If it reports `"ok": false`, run `lr setup` once (about 1 minute) and continue.
   If it can't find the Drive folder, follow its `fix` (it explains Google Drive for desktop).
2. If the request names a client, run `lr client show "<client>"` first. It returns the brand,
   photos, facts awaiting approval, the chosen direction and campaign progress. Never re-scan an
   existing client.

## What the person asks for, and what to do

| Request | Do | Read first |
|---|---|---|
| A new client or a firm's URL | `lr client new <url>`, then `lr directions "<client>"` | reference/onboarding.md |
| "They chose direction B" | `lr client set "<client>" direction=B` | n/a |
| Start the six-month plan | `lr campaign new "<client>"` | reference/writing.md |
| Build a month or some posts | write the specs, then `lr build "<client>" --month N` | reference/writing.md |
| Change one post | edit `posts/<ID>.json`, then `lr build "<client>" --post <ID>` | reference/writing.md |
| Motion or video posts | `lr templates motion`, write storyboards, `lr build`, then after approval `lr video "<client>"` | reference/motion.md |
| Which voice reads, or a key for another one | `lr voice` (status), `lr voice install chatterbox`, `lr voice key elevenlabs <key>`, `lr voice use <name>` | reference/motion.md (Voices and music) |
| Package or send to the client | `lr package "<client>" --month N` | reference/delivery.md |
| Status, or "what's left" | `lr client show "<client>"` | n/a |
| The client changed package | `lr client set "<client>" package=authority`, then `lr campaign update "<client>"` | n/a |
| New photos or logo dropped in | `lr client refresh "<client>"` | reference/onboarding.md |

Order: test designs, then the client chooses a direction, then the campaign. Build a campaign only
after a direction is set (ask if it isn't).

## Writing posts (your main job)
- `lr templates` lists templates. `lr templates a,b,c` gives those templates' full slots, worked
  examples and icon names in one call. Read reference/writing.md once per session before writing
  any specs.
- Write 2–3 options per post, each with a different angle and, where possible, a different template.
- Before writing a month, run `lr library search "<topic>"` to reuse what worked and avoid repeating
  past posts.
- Every claim needs a fact key from the client's facts (`lr client show` lists the usable ones).
  Never invent results, years, ratings, fees, quotes or names. If the facts a slot needs are
  missing, use the plan row's fallback.
- Copy the firm or the team supplied is locked: never reword it or change its case.

## When `lr build` reports problems
- `not_built` lists spec errors, each naming the field and the fix. Fix those exact fields.
- `flagged` lists designs whose render failed a check (text over a face, overflow, contrast, a head
  cut off). Look at `flagged_sheet` (one image of only the flagged designs).
  - Text problems (overflow, collisions): shorten the copy, then try another template.
  - Photo problems (a face covered, a head or neck cut): use another photo, then another template.
  - Never ask for smaller text.
- `needs_attention: true` means some items above need a look; everything else was built and is fine.
- `check_before_posting` lists claims for a human to confirm, including your own `confirm` lines.
  They also go to review.xlsx. Pass these on; don't remove them.
- Rebuild only what changed: `--post ID[,ID]`. Unchanged designs come from cache.

## Rules that always apply
- Use only the firm's own photos and real logo. No stock photos and no AI-generated people.
- People come first: never put text on faces and never crop off heads. The checks enforce this.
- Results, reviews, testimonials, fees, awards and "free consultation" or "no fee" claims need
  approval in facts.xlsx. Any result carries "Past results do not guarantee future outcomes."
- Never use "guarantee", "best", "#1", "expert" or "specialist" unless the firm has approved it.
- Render MP4s only for options marked Approved in review.xlsx.

## Ending the turn
Finish the whole job first, then reply once, in plain language, short:
1. What was made (no links in the body of the reply).
2. Anything that needs the firm's approval (`check_before_posting`, `need_approval`).
3. Problems you hit and worked around, and anything still not right, as a short list, then ask
   how the person wants to handle them. Never stop halfway to ask; finish, then ask.
4. What you need from the person, such as a better photo or the vector logo.
5. Open items elsewhere in the campaign (`feedback` and `fix_list` in `lr client show`), as one line.
6. **Exactly one link, as the very last line:** the campaign gallery (`gallery` in the output, as a
   `file://` link). It holds everything: Posts, Profile & covers, and Design (with the brand board).
   Never list other HTML files (board.html, previews); for new clients, link the Test designs gallery.
Don't paste JSON, file listings or check internals.

## When something doesn't go perfectly
The studio is built to keep going: a page that won't load, a font that won't download, a photo it
can't read or one design that won't draw is skipped or replaced with a fallback, and the output says
so in plain words (`warnings`, `needs_attention`, `left_out`, `failed`). Work the same way:
- **Don't stop the job for one problem.** Finish everything else, then deal with what's listed.
- **Fix what you can yourself:** shorten copy, pick another photo or template, rebuild just that post,
  or run the command once more (brief network trouble usually clears on a retry).
- **Ask the person only for what needs a human:** a logo or photos the site didn't give, approval of
  a claim, or a choice between directions. Ask once, together, at the end.
- `"ok": false` means nothing useful could be done; a `fix` says what to do. A message saying
  "Something unexpected went wrong" means retry once; if it repeats, carry on with other work and
  mention it in your reply (the details are logged for the maintainer).
- If a command says another person is building the same campaign, wait or ask; don't delete `.lr-lock`.
- **Don't hand-patch the studio's files** (the Figma plugin, deck, gallery or templates) or write your own
  scripts to rebuild them: a patched copy works once and the next run has the same problem. Rerun the
  `lr` command; if the file is still wrong, say exactly what's wrong (with any error text) in your reply
  so the studio itself gets fixed.

## Where things are (the shared Drive folder "Claude")
- `Clients/<Firm>/`: client.json, `brand/` (brand.json, facts.xlsx, logos, photos,
  board/board.html), `campaigns/<name>/` (posts/, review.xlsx, index.html (tabs: Posts, Profile & covers, Design), previews, images, video,
  exports) and history.log.
- `LawRank Studio/`: templates (these override the bundled ones), plan/six_month_plan.csv (plus optional
  practice plans such as plan/family-law.csv) and
  library/.
