# LawRank Studio

A Claude plugin that turns a law firm's website into on-brand social creative: test designs, the
six-month plan (posts, carousels, profile and cover kit), voiced motion pieces, MP4s after approval,
an editable Figma plugin and a client deck. The team only talks to Claude, and everything is saved in
the shared Google Drive folder **Claude**.

- Team setup: [TEAM_SETUP.md](TEAM_SETUP.md)
- Install (Claude Code / the desktop app's Code tab):
  `/plugin marketplace add ronald-lawrank/social` then `/plugin install lawrank-studio@lawrank`
- Install for ChatGPT / Codex: `curl -fsSL https://raw.githubusercontent.com/ronald-lawrank/social/main/install.sh | sh`
  (Windows: `irm https://raw.githubusercontent.com/ronald-lawrank/social/main/install.ps1 | iex`). Setup writes
  `AGENTS.md` (generated from SKILL.md) into the Drive folder, so both agents follow the same instructions.
- Design and decisions: [PLAN.md](PLAN.md)

## Layout

```
.claude-plugin/marketplace.json     lets Claude Code install the plugin from this repo
plugin/
  .claude-plugin/plugin.json
  skills/lawrank-studio/
    SKILL.md                        what Claude reads: routing, rules, commands
    reference/                      read when that stage comes up (onboarding, writing, motion, delivery)
    scripts/lr.py                   the one command (`lr`), re-runs itself in ~/.lawrank-studio/venv
    scripts/lrstudio/               the engine (Python)
    templates/<name>/               template.html (Jinja) + meta.json (slots, sizes) + example.json
    motion/                         the four motion families, runtime, voice, mix and motion QA
    data/six_month_plan.csv         the plan (a copy in Drive at LawRank Studio/plan/ overrides it)
install.sh, install.ps1            one-line installers for Codex/ChatGPT users (into ~/.lawrank-studio/app)
tests/                              pytest; a fictional firm site and an imported test client
dev/samples.py                      renders every template with its example copy, for design review
```

## How it works
- **One HTML source per design.** Templates are Jinja HTML whose colours come from the brand's
  computed treatments (dark, light, accent) and are readable by construction. Playwright renders the
  PNG. The same rendered DOM is exported as Figma layers, and HyperFrames renders the MP4 for motion.
- **Checks run on the real render:** the browser measures overflow, safe zones, minimum type sizes,
  collisions, text over faces, cut-off heads and necks, upscaling, pixel contrast and logo
  visibility. Copy is linted for attorney-advertising rules before rendering.
- **State is plain files in Drive:** brand.json, facts.xlsx (approvals), photos.json, post specs,
  review.xlsx (status and notes), library.jsonl. Builds are cached by content hash, so only changed
  designs re-render.

## Developing

```
export LR_STATE_DIR=$PWD/.cache/state LR_NO_VENV=1     # use system python + a local state dir
python3 plugin/skills/lawrank-studio/scripts/lr.py setup --skip-models
python3 -m pytest -q tests                             # ~5 min; -m "not slow" skips motion rendering
python3 dev/samples.py                                 # contact sheet of every template
```

Adding a template: create `templates/<name>/` with `template.html`, `meta.json` and `example.json`,
run `dev/samples.py` and look at the sheet. The render tests cover every template with its example.
Templates in Drive (`LawRank Studio/templates/`) override the bundled ones without a plugin update.

## Third-party pieces (all free for commercial use)
Playwright/Chromium (Apache-2.0), HyperFrames (Apache-2.0), GSAP 3 and its plugins (GSAP standard
no-charge licence), Kokoro-82M voice via kokoro-onnx (Apache-2.0 / MIT), OpenCV and the YuNet face
model (Apache-2.0 / MIT), Lucide icons (ISC), Google Fonts (OFL), ffmpeg via ffmpeg-static (GPL; run
as a separate program), python-pptx (MIT) and openpyxl (MIT).
