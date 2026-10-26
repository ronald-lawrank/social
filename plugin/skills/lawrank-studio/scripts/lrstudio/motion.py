"""Motion: storyboard -> narration (Kokoro, local) -> cues from the measured speech -> soundtrack -> a playable preview
page (self-contained, shareable) -> after approval, a frame-exact MP4 rendered by HyperFrames (9:16 + a 4:5 feed cut).

A motion option in a post spec:
  {"key": "A", "template": "motion", "family": "journey|shield|weight|flip", "voice": "am_michael", "speed": 1.04,
   "lines": [{"id": "hook", "say": "..."}, ...], "screen": {...}, "facts": [...], "confirm": [...], "caption": "...", "alt": "..."}
The families (motion/families/*.js) are the craft; each storyboard is written fresh for the firm and the slot.
"""
import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

from . import compliance, fonts, paths, store, tools
from .util import LRError, read_json, say, write_json, write_text

MOTION = paths.BUNDLED_MOTION
VENDOR = ["gsap", "CustomEase", "MorphSVGPlugin", "DrawSVGPlugin", "SplitText", "MotionPathPlugin", "Physics2DPlugin"]
FAMILIES = sorted(p.stem for p in (MOTION / "families").glob("*.js"))
VOICES = {"af_heart": "Heart (warm female voice)", "af_bella": "Bella (bright female voice)", "af_nicole": "Nicole (soft female voice)",
          "am_michael": "Michael (warm male voice)", "am_fenrir": "Fenrir (deeper male voice)", "am_puck": "Puck (upbeat male voice)",
          "bf_emma": "Emma (British female voice)"}


def families_detail(only: list[str] | None = None) -> dict:
    """What a writer needs per family: its story, the line ids and how many sentences each takes, the screen shape,
    and a worked storyboard (from the family's header comment and motion/examples/<family>.json)."""
    out = []
    for f in FAMILIES:
        if only and f not in only:
            continue
        src = (MOTION / "families" / f"{f}.js").read_text()
        m = re.search(r"/\*(.*?)\*/", src, re.S)
        notes = re.sub(r"\s+", " ", m.group(1)).strip() if m else ""
        ex = MOTION / "examples" / f"{f}.json"
        out.append({"family": f, "how_it_works": notes, "example": json.loads(ex.read_text()) if ex.exists() else None})
    return {"families": out, "voices": VOICES,
            "rules": ["Lines are spoken in order; each screen item appears when its line (or its named word) is spoken, so give "
                      "each item its own sentence in the order shown.", "Numbers in `say` are written as words.",
                      "Name the firm in the hook.", "The examples' claims belong to a test firm: write from this client's facts."]}


def check_storyboard(pid: str, o: dict) -> list[str]:
    errs = []
    if o.get("family") not in FAMILIES:
        errs.append(f"{pid}: family must be one of {', '.join(FAMILIES)}")
    if o.get("voice", "af_heart") not in VOICES:
        errs.append(f"{pid}: voice must be one of {', '.join(VOICES)}")
    ids = [l.get("id") for l in o.get("lines", [])]
    if not ids:
        errs.append(f"{pid}: the storyboard has no lines")
    if len(ids) != len(set(ids)):
        errs.append(f"{pid}: line ids repeat")
    for l in o.get("lines", []):
        if not l.get("say"):
            errs.append(f"{pid}: line {l.get('id')} has nothing to say")
        if re.search(r"\d+(\.\d+)?\s*(million|%)|\$\d", l.get("say", "")):
            errs.append(f"{pid}: write numbers the way they're spoken in line {l['id']} (\"four point two million\")")
    sc = o.get("screen") or {}
    for k in ("end", "cta"):
        if not sc.get(k):
            errs.append(f"{pid}: screen.{k} is required")
    if not 0.9 <= float(o.get("speed", 1.04)) <= 1.15:
        errs.append(f"{pid}: speed runs from 0.9 to 1.15")
    return errs


def lint(o: dict, facts: dict) -> list[dict]:
    """Compliance on what's said and shown (the same rules as stills)."""
    pseudo = {"copy": {"screen": o.get("screen") or {}, "said": [l.get("say", "") for l in o.get("lines", [])]},
              "facts": o.get("facts", []), "caption": o.get("caption")}
    return compliance.lint(pseudo, facts, {})


def brand_for_motion(c: store.Client) -> dict:
    b = c.brand()
    logos = {}
    for role, f in (("black", "logo-dark.svg"), ("white", "logo-white.svg")):
        p = c.brand_dir / "logos" / f
        if p.exists():
            logos[role] = "data:image/svg+xml;base64," + base64.b64encode(p.read_bytes()).decode()
    logos.setdefault("black", logos.get("white")); logos.setdefault("white", logos.get("black"))
    head = fonts.resolve(b["fonts"]["head"]["family"])[0]
    body = fonts.resolve(b["fonts"]["body"]["family"])[0]
    return {"name": b["name"], "short": b.get("short") or b["name"], "website": b.get("website"), "colors": b["colors"],
            "fonts": {"head": {"family": head}, "body": {"family": body}}, "cta": b.get("cta"),
            "mark": b.get("mark") or {"shape": "square"}, "logoData": logos}


def _env():
    env = tools.node_env()
    env["LR_KOKORO_DIR"] = str(paths.MODELS / "kokoro")
    return env


def _sig(*parts) -> str:
    h = hashlib.sha1()
    for p in parts:
        h.update(p if isinstance(p, bytes) else json.dumps(p, sort_keys=True, default=str).encode())
    return h.hexdigest()[:12]


def prepare(c: store.Client, d: Path, pid: str, o: dict) -> dict:
    """Voice + cues + soundtrack for one storyboard (cached by its content)."""
    tools.model("kokoro/kokoro-v1.0.fp16.onnx"); tools.model("kokoro/voices-v1.0.bin")
    brand = brand_for_motion(c)
    sb = dict(o, brandWord=o.get("brandWord") or (brand["short"] or brand["name"]).split()[0])
    work = d / ".motion" / f"{pid}-{o['key']}"
    work.mkdir(parents=True, exist_ok=True)
    script = {"voice": o.get("voice", "af_heart"), "speed": o.get("speed", 1.04), "sentence_pause": .24, "clause_pause": .1,
              "exact_sentences": True, "lines": [{"id": l["id"], "say": l["say"], "gap": l.get("gap", .45 if i else .35)}
                                                 for i, l in enumerate(sb["lines"])]}
    vkey = _sig(script)
    env = _env()
    if read_json(work / "voice.json", {}).get("key") != vkey or not (work / "timing.json").exists():
        say(f"  voicing {pid} {o['key']} ...")
        write_json(work / "script.json", script)
        code = subprocess.run([sys.executable, str(MOTION / "voice.py"), str(work / "script.json"), str(work)], capture_output=True,
                              text=True, env=env, cwd=MOTION)
        if code.returncode:
            raise LRError(f"Voiceover failed: {code.stderr[-400:]}", fix="Run `lr setup` (voice model and packages).")
        write_json(work / "voice.json", {"key": vkey})
    T = read_json(work / "timing.json")
    write_json(work / "storyboard.json", sb)
    r = subprocess.run(["node", str(MOTION / "cues.js"), sb["family"], str(work / "timing.json"), str(work / "storyboard.json")],
                       capture_output=True, text=True, env=env)
    if r.returncode:
        raise LRError(f"{pid} {o['key']}: the storyboard doesn't fit the '{sb['family']}' family: {r.stderr.strip()[-300:]}",
                      fix="Check the line ids the family needs (reference/motion.md).")
    plan = json.loads(r.stdout)
    sys.path.insert(0, str(MOTION))
    os.environ["PATH"] = env["PATH"]
    from mix import mix
    audio = mix(work, plan, work / "audio.mp3")
    cue = dict({k: v for k, v in T.items()}, cues=plan["cues"], end=plan["end"], family=sb["family"])
    return {"brand": brand, "sb": sb, "cue": cue, "audio_uri": audio, "audio": work / "audio.mp3", "work": work,
            "clipped": T.get("clipped", []), "seconds": round(plan["end"], 1)}


def _vendor() -> str:
    return "".join(f"<script>{(MOTION / 'runtime' / 'vendor' / (v + '.min.js')).read_text()}</script>" for v in VENDOR)


def _font_css(brand_full: dict) -> str:
    css, _ = fonts.face_css(brand_full, embed=True)
    return css


def _root_css(m: dict) -> str:
    from .extract import contrast
    c = m["colors"]
    onacc = "#FFFFFF" if contrast("#FFFFFF", c["accent"]) >= 3 else c["ink"]
    return (f":root{{--head:'{m['fonts']['head']['family']}';--body:'{m['fonts']['body']['family']}';--accent:{c['accent']};"
            f"--onaccent:{onacc};--bright:{c.get('accentBright', c['accent'])};--accentText:{c['accent']}}}")


def _scripts(m: dict, sb: dict, cue: dict) -> str:
    fam = (MOTION / "families" / f"{sb['family']}.js").read_text()
    return (f"<script>const BRAND = {json.dumps(m, ensure_ascii=False)};\n{(MOTION / 'runtime' / 'icons.js').read_text()}\n"
            f"{(MOTION / 'runtime' / 'player.js').read_text()}\n{(MOTION / 'runtime' / 'kit.js').read_text()}\n{fam}\n"
            f"const SB = {json.dumps(sb, ensure_ascii=False)}, CUE = {json.dumps(cue)}, F = FAMILIES[SB.family];\n"
            f"document.documentElement.style.setProperty('--accentText', BT.accentText);</script>")


def preview_page(c: store.Client, prep: dict, title: str, out: Path):
    """The client-facing review page: phone-sized player with sound, the voiceover script and what to confirm."""
    import html as H
    m, sb = prep["brand"], prep["sb"]
    cue = dict(prep["cue"], audio=prep["audio_uri"])
    confirm = sb.get("confirm", []) + ["Your standard attorney-advertising disclaimer"]
    page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{H.escape(m['short'])} · {H.escape(title)}</title><style>{_font_css(c.brand())}{_root_css(m)}{(MOTION / 'runtime' / 'stage.css').read_text()}</style></head><body>
<header><div class="eb">{H.escape(m['name'])} · Video concept</div><h1>{H.escape(title)}</h1><p>Press Play with sound on.</p><div class="by">Prepared by LawRank</div></header>
<div id="concepts"></div>{_vendor()}{_scripts(m, sb, cue)}<script>
const mmss = t => `0:${{String(Math.floor(t)).padStart(2, '0')}}`;
const DEF = {{ id: 'card-' + SB.family, poster: T => F.poster(T), html: T => F.html(T, SB), build: (tl, T, $) => F.build(tl, T, $, SB),
  context: T => `<div class="eyebrow">Video · 9:16 for Reels, Stories and TikTok · ${{T.end.toFixed(0)}} seconds</div><h2>${{esc(SB.name || {json.dumps(title)})}}</h2>${{F.client(T, SB)}}
  <h3>Voiceover · {H.escape(VOICES.get(sb.get('voice', 'af_heart'), ''))}</h3><ol class="vo">${{T.lines.map(l => `<li><span>${{mmss(l.t)}}</span>${{esc(l.text)}}</li>`).join('')}}</ol>
  <h3>Please confirm before this runs</h3><ul class="confirm">${{{json.dumps(confirm, ensure_ascii=False)}.map(i => `<li>${{esc(i)}}</li>`).join('')}}</ul>` }};
document.fonts.ready.then(() => mount(DEF, CUE));
</script></body></html>'''
    write_text(out, page)


def composition(c: store.Client, prep: dict, folder: Path):
    """The same piece as a HyperFrames composition (stage only, audio as a file), for the MP4."""
    folder.mkdir(parents=True, exist_ok=True)
    shutil.copy(prep["audio"], folder / "audio.mp3")
    m, sb, cue = prep["brand"], prep["sb"], prep["cue"]
    end = round(cue["end"], 3)
    page = f'''<!doctype html><html><head><meta charset="utf-8"><style>{_font_css(c.brand())}{_root_css(m)}{(MOTION / 'runtime' / 'stage.css').read_text()}
html,body{{margin:0;background:#000}}#root{{position:relative;width:1080px;height:1920px;overflow:hidden}}#root .stage{{transform:none}}</style></head><body>
<div id="root" data-composition-id="root" data-width="1080" data-height="1920" data-duration="{end}">
<div class="stage" id="stage"></div>
<audio src="audio.mp3" data-start="0" data-duration="{end}"></audio>
</div>{_vendor()}{_scripts(m, sb, cue)}<script>
const stage = document.getElementById('stage'); stage.innerHTML = F.html(CUE, SB);
const $ = s => stage.querySelector(s);
const tl = gsap.timeline({{ paused: true, defaults: {{ immediateRender: false, ease: 'lr.out', duration: M.IN }} }});
F.build(tl, CUE, $, SB); tl.to({{}}, {{ duration: .01 }}, CUE.end - .01);
window.__timelines = window.__timelines || {{}}; window.__timelines.root = tl;
</script></body></html>'''
    write_text(folder / "index.html", page)


def poster(html: Path, out: Path) -> float | None:
    """A still of the piece at its poster moment (for the gallery and review sheet)."""
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1080, "height": 1920})
        pg.goto(html.resolve().as_uri())
        pg.wait_for_function("typeof PLAYERS !== 'undefined' && PLAYERS.length > 0", timeout=30000)
        pg.add_style_tag(content=".card .right,.ctrl,.scrub,header{display:none!important}.phone{position:fixed!important;left:0;top:0;"
                                 "width:1080px!important;height:1920px!important;border-radius:0!important;box-shadow:none!important}.stage{transform:none!important}")
        t = pg.evaluate("(() => { const P = PLAYERS[0]; const t = P.cue && F.poster ? F.poster(P.cue) : P.end * .6; P.show(t); return t; })()")
        out.parent.mkdir(parents=True, exist_ok=True)
        pg.screenshot(path=str(out), clip={"x": 0, "y": 0, "width": 1080, "height": 1920})
        if _nearly_blank(out):                    # caught mid-transition: the settled end card always says something
            t = pg.evaluate("(() => { const P = PLAYERS[0]; const t = Math.max(0, P.end - 1.0); P.show(t); return t; })()")
            pg.screenshot(path=str(out), clip={"x": 0, "y": 0, "width": 1080, "height": 1920})
        b.close()
    return t


def _nearly_blank(png: Path) -> bool:
    """Almost no detail: one or two flat colours (no text, no picture)."""
    from PIL import Image, ImageFilter
    import numpy as np
    im = Image.open(png).convert("L").resize((270, 480))
    edges = np.asarray(im.filter(ImageFilter.FIND_EDGES), "float32")
    return float((edges > 40).mean()) < 0.025       # measured: a mid-transition blank 0.019; sparsest real frame 0.033


QA_FIX = {
    "text-overlap": "two pieces of screen text are on screen together. Each screen item appears when its line is spoken, so "
                    "check the family's line rules (`lr templates motion`): one sentence per item, items named in order",
    "over-face": "text passes over a person: shorten that screen text",
    "face-cropped": "a face leaves its frame: use another photo",
    "mark-on-text": "the highlight stroke crosses letters: shorten the accent word",
}


def _qa_msg(i) -> str:
    """A motion QA finding in words a writer can act on."""
    if not isinstance(i, dict):
        return str(i)[:200]
    rule = i.get("rule", "")
    fix = next((v for k, v in QA_FIX.items() if rule.startswith(k)), "shorten the screen text at that moment, or split the voice line")
    if rule.startswith("competing"):
        fix = "two items compete for attention at once: give each its own spoken line"
    return f"at {i.get('t')}s: {i.get('detail', rule)} ({rule}). Fix: {fix}"[:300]


def preview(c: store.Client, d: Path, post: dict, o: dict, cache: dict) -> dict:
    """Build (or reuse) the preview for one motion option. Returns a build-cache record."""
    did = f"{post['id']}-{o['key']}-motion"
    fam_src = (MOTION / "families" / f"{o.get('family')}.js").read_bytes() if o.get("family") in FAMILIES else b""
    key = _sig(o, c.brand(), fam_src)
    prev = cache.get(did)
    if prev and prev.get("key") == key and all((d / x).exists() for x in prev.get("images", [])):
        return dict(prev, cached=True)
    prep = prepare(c, d, post["id"], o)
    html = d / "previews" / f"{did}.html"
    preview_page(c, prep, post.get("topic") or o.get("name") or did, html)
    img = d / "images" / f"{did}.png"
    poster(html, img)
    issues = []
    if prep["clipped"]:
        issues.append({"rule": "voice", "level": "block", "msg": f"the voiceover clips words in lines {', '.join(prep['clipped'])}: shorten them"})
    try:
        sys.path.insert(0, str(MOTION))
        from qa_motion import run_qa
        q = run_qa(html)
        for i in q.get("issues", [])[:6]:
            issues.append({"rule": "motion", "level": "block", "msg": _qa_msg(i)})
        for i in q.get("low_contrast", [])[:4]:
            issues.append({"rule": "contrast", "level": "block", "msg": f"low contrast in the video: {str(i)[:140]}"})
        if q.get("cta_hold") is not None and q["cta_hold"] < 2.5:
            issues.append({"rule": "motion", "level": "warn", "msg": f"the end card holds {q['cta_hold']}s; it should hold at least 2.5s"})
    except Exception as e:
        issues.append({"rule": "motion", "level": "warn", "msg": f"motion QA didn't run: {str(e)[:120]}"})
    return {"id": did, "key": key, "template": "motion", "size": "9x16", "html": f"previews/{did}.html",
            "images": [f"images/{did}.png"], "issues": issues, "frames": 1, "seconds": prep["seconds"]}


def render_mp4(c: store.Client, d: Path, post: dict, o: dict) -> dict:
    """Frame-exact MP4 via HyperFrames, plus a 4:5 feed version padded with the brand ink."""
    prep = prepare(c, d, post["id"], o)
    comp = prep["work"] / "hf"
    composition(c, prep, comp)
    vdir = d / "video"; vdir.mkdir(exist_ok=True)
    base = f"{post['id']}-{o['key']}"
    out916 = vdir / f"{base}-9x16.mp4"
    say(f"  rendering {base} ({prep['seconds']}s) ...")
    r = subprocess.run(tools.hyperframes_cmd() + ["render", str(comp), "-o", str(out916), "-q", "delivery"],
                       capture_output=True, text=True, env=tools.node_env(), timeout=1800)
    if r.returncode or not out916.exists():
        raise LRError(f"Video render failed for {base}: {(r.stderr or r.stdout)[-500:]}", fix="Run `lr doctor`; then try again.")
    ink = c.brand()["colors"]["ink"].lstrip("#")
    out45 = vdir / f"{base}-4x5.mp4"
    subprocess.run([tools.ffmpeg(), "-v", "error", "-y", "-i", str(out916), "-vf",
                    f"scale=-2:1350,pad=1080:1350:(ow-iw)/2:0:color=0x{ink}", "-c:v", "libx264", "-pix_fmt", "yuv420p",
                    "-crf", "18", "-c:a", "copy", "-movflags", "+faststart", str(out45)], check=True, env=tools.node_env())
    return {"post": post["id"], "option": o["key"], "seconds": prep["seconds"],
            "files": [str(out916.relative_to(d)), str(out45.relative_to(d))]}


def video(c: store.Client, campaign: str | None = None, posts: str | None = None) -> dict:
    """`lr video`: MP4s for options marked Approved in review.xlsx. Naming posts with --post also renders their drafts."""
    from . import campaign as camp, review
    from .util import Lock, log
    d = camp.campaign_dir(c, campaign)
    want = {p.strip().upper() for p in posts.split(",")} if posts else None
    statuses = review.read_sheet(d)
    todo, skipped = [], []
    for f in sorted((d / "posts").glob("*.json")):
        p = read_json(f) or {}
        if p.get("format") != "motion" or (want and p["id"].upper() not in want):
            continue
        for o in p.get("options", []):
            st = statuses.get((p["id"], o["key"]), {}).get("status", "Draft")
            if st == "Approved" or want:
                todo.append((p, o))
            else:
                skipped.append(f"{p['id']} {o['key']} ({st})")
    if not todo:
        raise LRError("No approved motion options to render", fix="Approve them in review.xlsx (Status = Approved), or name one with --post to render a draft.",
                      waiting=skipped[:12])
    done = []
    with Lock(d, "video"):
        for p, o in todo:
            errs = check_storyboard(p["id"], o)
            if errs:
                raise LRError("; ".join(errs))
            done.append(render_mp4(c, d, p, o))
    log(c.dir, f"video {d.name} {', '.join(x['post'] + ' ' + x['option'] for x in done)}")
    return {"client": c.name, "campaign": d.name, "videos": done, "not_approved_yet": skipped[:12], "folder": str(d / "video")}
