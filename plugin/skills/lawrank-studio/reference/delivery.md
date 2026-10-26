# Delivery

## Review links (any time)
Every build updates `campaigns/<campaign>/index.html`: a gallery of every option with its caption,
filterable by month. Motion options play with sound. Share it as a Drive link (the file is in the
shared folder). Reviewers set Status (Draft, Approved, Changes requested or Rejected) and Notes in
`review.xlsx`, which opens in Google Sheets.

## Packaging
`lr package "<client>" [--month N] [--campaign "<name>"]` takes about 10 seconds when the designs
are cached, and longer when it renders the other sizes for the first time.

- It packages only Approved options. If nothing is approved yet, it packages every option and marks
  the package as a **review set**. Say which kind it is when you report.
- It renders every size the template offers (4:5, 1:1 and 9:16 where available; covers at their
  platform sizes).
- It writes to `campaigns/<campaign>/exports/`:
  - **`… - Deck.pptx`**: the client deck. It has a cover, the brand board, one slide per post with its
    caption, a *Please confirm* list (claims and facts awaiting the firm's approval) and next steps.
    It opens in PowerPoint, Keynote and Google Slides.
  - **`… - Figma plugin.zip`**: the designs as real, editable Figma layers (text, shapes, photos and
    logos), one page per run.
  - **`… - Posts.zip`**: every PNG at every size, the approved MP4s and `captions.csv` (post, month,
    topic, option, template, caption and alt text) for scheduling.
- The output lists what's `included` and which posts have `no_approved_option` yet. Report both.
- Designs that still fail a check are left out (`left_out`, with the reason) and everything else is
  packaged. Fix those (the same way you would after `lr build`) and package again to add them.
- If one of the three files can't be made, the others are still delivered (`not_made`); packaging
  again retries it.

## Importing into Figma (tell the person)
1. Unzip the plugin somewhere permanent (moving it later breaks the link).
2. In the Figma **desktop** app, choose Plugins > Development > Import plugin from manifest…, and
   pick `manifest.json`.
3. Open any Figma file and run the plugin from Plugins > Development. It builds a page with every
   design as editable frames. Any font Figma doesn't have is replaced with Inter, and the plugin's
   closing message names it so it can be installed.

## Test design rounds
`lr package "<client>" --campaign "Test designs"` makes a deck with each direction's designs (titled with
the direction and why it fits), so the client can choose. Once they choose, run
`lr client set "<client>" direction=<letter>`.

## What to say when delivering
Write two or three lines: what's in the package, how many posts and options, and whether it's a
review set or the approved set. Add the Figma import steps the first time. Then list the
*Please confirm* items the firm still needs to approve.
