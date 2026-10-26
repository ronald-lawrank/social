# Skill evals

Run each scenario in a fresh Claude session that has only the plugin installed. Use a copy of a
studio folder (never the live Drive folder). Grade with the checklist. The engine itself is covered
by `pytest`; these scenarios test whether Claude *uses* the skill well: the right commands, good
copy, no invented claims and a clear reply.

## 1. New client to test designs
**Prompt:** "New client: <fixture site URL>. They're on Growth."
(Start the fixture with `python3 -c "import sys; sys.path.insert(0,'tests'); import fixture_site, pathlib, time; u,s=fixture_site.serve(fixture_site.build(pathlib.Path('/tmp/site'))); print(u); time.sleep(3600)"` and `LR_ALLOW_PRIVATE=1`.)

Pass when:
- [ ] It runs `lr doctor`, then `lr client new <url> --package growth`, then `lr directions`.
- [ ] It doesn't open brand.json, photos or HTML unless a command pointed there.
- [ ] Its reply names the colours, fonts and logo found, links the brand board and the gallery, and
      lists the facts needing approval in plain words.
- [ ] It says direction A was skipped because there are no people photos, and asks for headshots.
- [ ] It takes under 3 minutes and under 10 `lr` calls.

## 2. Build a month
**Prompt:** "Build month 2 for McMinn." (Use the McMinn test client with direction A set and a
campaign created.)

Pass when:
- [ ] It runs `lr client show`, `lr library search` and `lr templates <name>` for the templates it
      uses, then writes options for every month-2 post in the client's package (PI-009 to PI-013 for
      Growth).
- [ ] It writes 2–3 options per post with different templates, uses people photos in line with
      direction A, and varies the treatments.
- [ ] Every number and claim traces to a cited usable fact, and nothing needing approval is used
      without a `confirm` line.
- [ ] It builds once for the month, then rebuilds only the flagged posts. It ends with
      `flagged: []` and `not_built: {}`.
- [ ] Spot check: the copy is specific and readable, with no filler and no repeats of month 1.
- [ ] The reply gives the gallery link, what needs approval and what's needed from the person.
- [ ] It takes under 10 minutes.

## 3. Feedback, approval and package
**Setup:** In review.xlsx, mark a month's options Approved, and set one to "Changes requested"
with a note.
**Prompt:** "Any feedback on McMinn? Fix it and package month 1."

Pass when:
- [ ] It finds the note via `lr client show` (under `feedback`) and edits only that option.
- [ ] It rebuilds that post only, then runs `lr package --month 1`.
- [ ] Its reply says what changed and that the package is the approved set (not a review set),
      lists the three files and gives the Figma import steps.
- [ ] It doesn't mark anything Approved itself.

## 4. Motion (Authority)
**Prompt:** "McMinn upgraded to Authority. Do the month 1 motion post."

Pass when:
- [ ] It runs `lr client set mcminn package=authority`, notices the existing campaign was made for
      Growth and creates a new campaign (or says why not).
- [ ] It writes a storyboard in a family that fits the slot, with numbers spoken as words, the firm
      named in the hook, and screen text shorter than the voice.
- [ ] It runs `lr build`, shares the preview, and does **not** render an MP4 until the option is
      approved.
