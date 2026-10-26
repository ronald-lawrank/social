# New clients

## 1. Scan the site
`lr client new <website> [--package essentials|growth|authority] [--name "Firm Name"]`

This takes 1–3 minutes. It reads up to 10 pages and saves:
- **brand.json**: the colours by role (ink, accent, paper and so on, measured from the live site; the
  accent is the site's button colour), fonts (commercial fonts get the closest free match), the button
  style, tagline, practice areas, offices, people and languages.
- **facts.xlsx**: every claim found, with its source page and the exact excerpt. Claims a bar would
  care about (results, reviews, testimonials, fees, awards, "free", "24/7") are marked *Needs
  approval*.
- **logos/**: the vector logo in dark and white versions, plus the icon on its own when the logo has
  one (used for profile pictures).
- **photos/**: the firm's own photos with the people detected. Stock photos, AI images, tiny images
  and duplicates are skipped, and each reason is recorded.
- **board/board.html**: the brand board.

The default package is growth. Set it right away if you know it, because it decides which plan posts
are included.

## 2. Read the result and tell the person
From the output, report in plain words:
- the colours, fonts and logo that were found (the brand board is on the gallery's Design tab, so don't
  link it separately);
- `warnings`, such as "no logo found", "logo is an image, not a vector" or "no photos of people";
- `facts.need_approval`: the claims that need the firm's sign-off before they can be used;
- `photos_not_used`, but only if good photos were skipped.

If `brand.reliable` is false (the site hid its styles), say so and ask for the brand guide.

## 3. Test designs
`lr directions "<client>"` builds 3–4 directions, each with 3 designs, in about 10 seconds:

| Direction | Feel |
|---|---|
| A, People first | The firm's attorneys front and centre (only with people photos) |
| B, Bold type | Big confident type in brand colours; needs no photos |
| C, Clean and light | Light, calm, editorial |
| D, Brand colour | The accent colour leads |

The sample copy comes from the firm's own verified facts. Improve it if it's flat (see
reference/writing.md, "Test designs"), then rebuild. Send the gallery link, or run
`lr package "<client>" --campaign "Test designs"` for a deck and Figma plugin.
When the client picks a direction, run `lr client set "<client>" direction=B`.

## Fixing the brand by hand
- Colours and fonts: `lr client set "<client>" brand.colors.accent=#BF5700 brand.fonts.head.family="Playfair Display"`
- Voice notes the team learns: `lr client set "<client>" brand.voice.notes+="Warm, plain-spoken; never 'aggressive'"`
- Client fields: `practice_area="Family law"`, `package=authority`, `direction=C`.
- **Logo:** save the firm's SVG as `brand/logos/logo-dark.svg` (for light backgrounds) and, if they
  have one, `logo-white.svg`. Then run `lr client refresh "<client>"`.
- **Photos:** drop the firm's photos into `brand/photos/`, then run `lr client refresh "<client>"`. Each
  photo's key is its file name. To name the person in a photo or set a photo aside, edit its entry in
  `brand/photos/photos.json`: `"name": "Jason McMinn"`, `"kind": "person"` or `"group"`,
  `"use": false`. Add `"locked": true` to keep your edits through later refreshes.
- **Facts:** reviewers approve in `brand/facts.xlsx` (Approved = Yes, Approved by = their name). New
  facts the firm gives you can be added as rows with Found on site = No; they stay *not verified*
  until someone approves them.

## When the site can't be scanned
If the site blocks scanning (a firewall or bot protection), `lr client new` sets the client up by
hand automatically and lists what's `needed`. Ask the person for those items (the logo, a few photos
of the attorneys, brand colours and fonts if known, and the claims they want to use), add them as
described above, then run `lr client refresh` and `lr directions`. If any single part of the scan
fails (facts, logo, colours or photos), the rest is still saved and `warnings` says what to add.

## Clients from the old LawRank template
`lr client import "<path to old clients/<slug> folder>"` brings over the logos, photos (with their
people boxes), colours, fonts and facts.
