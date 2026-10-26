---
name: lawrank-studio
description: Builds LawRank law-firm social creative from a firm's website, including brand profiles, test designs, six-month campaigns, posts, carousels, covers and profile pictures, motion videos (MP4), Figma plugins and client decks. Use for any LawRank client or law-firm social work, such as a new client URL, test designs, building a month or a post (PI-017), revising a post, rendering videos, packaging for a client, or checking what's been done for a client.
---

# LawRank Studio

Everything lives in the shared Drive folder **Claude** (see "Where things are"). Run every step with
`lr`; each command prints one JSON line. Open a file only when a command reports a problem.

## Start of every session
1. `lr doctor`. If it reports missing tools, run `lr setup` once and continue.
2. If the request names a client, run `lr client show "<client>"` before anything else. It returns
   the brand, the chosen direction, facts awaiting approval, and campaign status. Don't re-scan
   a client that already exists.

## What the person asks → what to do

| Request | Do | Read first |
|---|---|---|
| New client / a firm's URL | `lr client new <url>`, review its flags, then `lr directions <client>` | reference/onboarding.md |
| "They chose direction B" | `lr client set "<client>" direction=B` | n/a |
| Build a month / the campaign | `lr campaign new` (if none), write the specs, `lr build --month N` | reference/writing.md, reference/templates.md |
| Change one post | edit `posts/<ID>.json`, `lr build --post <ID>` | reference/writing.md |
| Videos | write storyboards for motion slots, `lr build`, then `lr video --approved` after approval | reference/motion.md |
| Package / send to client | `lr package <client> --month N` | reference/delivery.md |
| "What's the status of X" | `lr client show "<client>"` | n/a |

Build test designs before any campaign. Build a campaign only after the client has chosen a direction.

## Writing posts (your main job)
You write copy and choose templates. Templates handle all design; never write HTML or CSS.
- One spec per post: `campaigns/<campaign>/posts/<ID>.json`. Schema and examples are in reference/writing.md.
- Write options A/B/C, each a different angle and a different template where possible.
- Every claim cites a fact key from facts.xlsx. Never invent results, years, ratings, fees or quotes.
  If a slot's facts aren't available, use the plan's fallback.
- Before writing a month, run `lr library search "<topic>"` to reuse what worked and avoid repeats.
- Supplied copy is locked: never reword it or change its case.

## Fixing what the checks flag
`lr build` lists flagged designs and writes a contact sheet of only those. Look at that sheet.
Fix in this order: shorter copy → another photo or crop → another template. Never shrink text.
Rebuild only the flagged posts (`--post`).

## Rules that always apply
- Only the firm's own photos and real logo. No stock, no AI-generated people.
- People first: never crop faces, heads or shoulders; nothing on faces.
- Results, reviews, testimonials, fees, awards and "free"/"no fee" promises need approval in
  facts.xlsx; results carry "Past results do not guarantee future outcomes."
- Never use "guarantee", "best", "expert" or "specialist" unless the firm has approved it.
- MP4s only for posts marked Approved in review.xlsx.

## Ending the turn
Reply in plain language:
1. What was made, with the preview link (`index.html`).
2. Claims or facts that need the firm's approval.
3. What's needed from the person (e.g. a better photo, the vector logo).
No file dumps and no internal check output.

## Where things are
`Claude/Clients/<Firm>/`: client.json · brand/ (brand.json, facts.xlsx, logos, photos, board.html)
· campaigns/<name>/ (posts, review.xlsx, index.html, previews, images, video, exports) · history.log.
`Claude/LawRank Studio/`: templates/ · plan/six_month_plan.csv · library/.
