"""Motion catalog: build composed-video scenes without the voice, for design work and review.

  python3 dev/motion_catalog.py --scene letter                 # one scene, every look: page + contact sheet + QA
  python3 dev/motion_catalog.py --scene letter --look flat     # one look
  python3 dev/motion_catalog.py --all                          # every scene x every look, plus catalog.html
  python3 dev/motion_catalog.py --storyboard sb.json           # a whole composed storyboard (lines + screen + look)

Timing is simulated (about 2.9 words a second, real sentence and line pauses) and the audio is silent, so a scene can be
checked in seconds. Uses the McMinn test client (imported into a scratch home). Output: <out>/<scene>/<look>.html,
<look>.png (a 6x2 contact sheet across the scene), <look>.qa.json; with --all also <out>/catalog.html.
"""
import argparse
import base64
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "plugin" / "skills" / "lawrank-studio" / "scripts"))
MCMINN = Path("/home/user/lawrank-creative-studio/engine/template/clients/mcminn")
WPS, SENT_PAUSE, GAP = 2.9, .34, .45


def fake_timing(lines: list[dict]) -> dict:
    """Word, sentence and line times like voice.py measures them."""
    t, out = .35, []
    for i, l in enumerate(lines):
        if i:
            t += GAP
        start, sents, words = t, [], []
        parts = [p for p in re.split(r"(?<=[.!?])\s+", l["say"].strip()) if p]
        for j, p in enumerate(parts):
            s0 = t
            for w in p.split():
                words.append({"w": w, "t": round(t, 3)})
                t += 1 / WPS + (.12 if w.endswith(",") else 0)
            sents.append({"text": p, "t": round(s0, 3), "end": round(t, 3)})
            if j < len(parts) - 1:
                t += SENT_PAUSE
        out.append({"id": l["id"], "text": l["say"], "t": round(start, 3), "d": round(t - start, 3), "end": round(t, 3),
                    "sentences": sents, "words": words, "tail_ok": True})
    return {"lines": out, "sr": 24000, "end": round(t, 3), "clipped": []}


def silent_mp3(seconds: float, work: Path) -> str:
    f = work / "silence.mp3"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", f"{seconds:.2f}",
                    "-c:a", "libmp3lame", "-b:a", "32k", str(f)], check=True)
    return "data:audio/mpeg;base64," + base64.b64encode(f.read_bytes()).decode()


def client():
    os.environ.setdefault("LR_NO_VENV", "1")
    home = Path(tempfile.gettempdir()) / "lr-motion-catalog" / "Claude"
    (home / "LawRank Studio").mkdir(parents=True, exist_ok=True); (home / "Clients").mkdir(exist_ok=True)
    os.environ["LR_HOME"] = str(home)
    from lrstudio import legacy, store
    try:
        return store.find("mcminn")
    except Exception:
        legacy.import_folder(str(MCMINN))
        return store.find("mcminn")


def build_page(c, sb: dict, out: Path, title: str) -> dict:
    from lrstudio import motion
    work = out.parent / ".work" / out.stem; work.mkdir(parents=True, exist_ok=True)
    brand = motion.brand_for_motion(c)
    sb = dict(sb, family="scenes", brandWord=sb.get("brandWord") or motion.brand_word(brand, sb))
    T = fake_timing(sb["lines"])
    (work / "timing.json").write_text(json.dumps(T)); (work / "storyboard.json").write_text(json.dumps(sb))
    r = subprocess.run(["node", str(motion.MOTION / "cues.js"), "scenes", str(work / "timing.json"), str(work / "storyboard.json")],
                       capture_output=True, text=True)
    if r.returncode:
        return {"error": r.stderr.strip()[-600:]}
    plan = json.loads(r.stdout)
    cue = dict(T, cues=plan["cues"], end=plan["end"], family="scenes")
    prep = {"brand": brand, "sb": sb, "cue": cue, "audio_uri": silent_mp3(plan["end"] + .3, work)}
    motion.preview_page(c, prep, title, out)
    return {"plan": plan}


SHEET_JS = '''async (times) => { const P = PLAYERS[0], st = P.stage; const out = [];
  for (const t of times) { P.show(t); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); out.push(t); } return out; }'''


def contact_sheet(html: Path, png: Path, times: list[float]) -> list[str]:
    """Frames across the piece in one image (6 per row), and any page errors."""
    from PIL import Image
    from playwright.sync_api import sync_playwright
    errs, frames = [], []
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1080, "height": 1920})
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(html.resolve().as_uri())
        try:
            pg.wait_for_function("typeof PLAYERS !== 'undefined' && PLAYERS.length > 0", timeout=20000)
        except Exception:
            b.close(); return errs or ["the page never started (no player)"]
        pg.add_style_tag(content=".card .right,.ctrl,.scrub,header{display:none!important}.phone{position:fixed!important;left:0;top:0;"
                                 "width:1080px!important;height:1920px!important;border-radius:0!important;box-shadow:none!important}.stage{transform:none!important}")
        for t in times:
            pg.evaluate(f"PLAYERS[0].show({t})"); pg.wait_for_timeout(30)
            f = png.parent / f".{png.stem}-f{len(frames)}-{os.getpid()}.png"; pg.screenshot(path=str(f), clip={"x": 0, "y": 0, "width": 1080, "height": 1920})
            frames.append((t, f))
        b.close()
    W, H, cols = 270, 480, 6
    rows = (len(frames) + cols - 1) // cols
    sheet = Image.new("RGB", (W * cols, (H + 24) * rows), "white")
    from PIL import ImageDraw
    d = ImageDraw.Draw(sheet)
    for k, (t, f) in enumerate(frames):
        im = Image.open(f).convert("RGB").resize((W, H)); x, y = (k % cols) * W, (k // cols) * (H + 24)
        sheet.paste(im, (x, y + 24)); d.text((x + 6, y + 5), f"{t:.1f}s", fill="black"); f.unlink()
    png.parent.mkdir(parents=True, exist_ok=True); sheet.save(png)
    return errs


def scene_storyboard(stype: str, meta: dict, look: str) -> dict:
    ex = dict(meta.get("example") or {})
    say = ex.pop("say", None) or "After a crash, McMinn Law Firm helps you take the next step."
    ex.update(type=stype, line="hook")
    return {"look": look, "voice": "am_michael", "lines": [{"id": "hook", "say": say},
            {"id": "cta", "say": "You don't have to do this alone. Talk to our team today."}],
            "screen": {"scenes": [ex, {"type": "end", "line": "cta"}], "end": "Talk to our team today.", "cta": "Talk to us",
                       "site": "mcminnlaw.com", "disclaimer": "Attorney advertising."}}


def run_one(c, sb: dict, out: Path, title: str, qa: bool = True) -> dict:
    res = build_page(c, sb, out, title)
    if "error" in res:
        return {"page": str(out), "error": res["error"]}
    cues = res["plan"]["cues"]
    t0, t1, end = cues["t0"], cues["t1"], cues["end"]
    times = []
    for a, b in zip(t0, t1):
        n = 10 if len(t0) <= 2 and a == t0[0] else 4
        times += [round(a + (b - a) * (k + .5) / n, 2) for k in range(n)]
    times = sorted(set(times + [round(end - .2, 2)]))[:24]
    errs = contact_sheet(out, out.with_suffix(".png"), times)
    rep = {"page": str(out), "sheet": str(out.with_suffix(".png")), "page_errors": errs, "seconds": round(end, 1)}
    if qa and not errs:
        sys.path.insert(0, str(ROOT / "plugin" / "skills" / "lawrank-studio" / "motion"))
        from qa_motion import run_qa
        q = run_qa(out)
        rep.update(qa_issues=q["issues"], low_contrast=q["low_contrast"], cta_hold=q["cta_hold"])
    out.with_suffix(".qa.json").write_text(json.dumps(rep, indent=1))
    return rep


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scene"); ap.add_argument("--look"); ap.add_argument("--all", action="store_true")
    ap.add_argument("--storyboard"); ap.add_argument("--no-qa", action="store_true")
    ap.add_argument("--out", default=str(Path(tempfile.gettempdir()) / "lr-motion-catalog" / "out"))
    a = ap.parse_args()
    from lrstudio import motion
    c, out, cat = client(), Path(a.out), motion.catalog()
    looks = [a.look] if a.look else cat["looks"]
    report = {}
    if a.storyboard:
        sb = json.loads(Path(a.storyboard).read_text())
        name = Path(a.storyboard).stem
        report[name] = run_one(c, sb, out / "storyboards" / f"{name}.html", name, not a.no_qa)
    else:
        names = [a.scene] if a.scene else sorted(k for k in cat["scenes"] if k != "end")
        for s in names:
            if s not in cat["scenes"]:
                sys.exit(f"unknown scene {s}; have {', '.join(sorted(cat['scenes']))}")
            for lk in looks:
                report[f"{s}/{lk}"] = run_one(c, scene_storyboard(s, cat["scenes"][s], lk), out / s / f"{lk}.html",
                                              cat["scenes"][s]["label"], not a.no_qa)
        if a.all:
            catalog_page(cat, report, out)
    for k, v in report.items():
        bad = v.get("error") or v.get("page_errors") or v.get("qa_issues") or v.get("low_contrast")
        print(f"{'FIX ' if bad else 'ok  '} {k}  {v.get('sheet', '')}")
        if bad:
            print("      " + json.dumps({x: v.get(x) for x in ("error", "page_errors", "qa_issues", "low_contrast") if v.get(x)})[:900])


def catalog_page(cat: dict, report: dict, out: Path):
    """One page to review every scene in every look: plays each one (silent), with its QA result."""
    import html as H
    rows = []
    for s, meta in sorted(cat["scenes"].items()):
        if s == "end":
            continue
        cells = "".join(f"<a href='{s}/{lk}.html'><img src='{s}/{lk}.png' loading='lazy'><span>{lk}"
                        f"{' · needs a fix' if report.get(f'{s}/{lk}', {}).get('qa_issues') else ''}</span></a>" for lk in cat["looks"])
        rows.append(f"<section><h2>{H.escape(meta['label'])} <code>{s}</code></h2><p>{H.escape(meta['about'] or '')}</p><div class='g'>{cells}</div></section>")
    (out / "catalog.html").write_text("<!doctype html><meta charset=utf-8><title>Motion scene catalog</title><style>body{font:15px system-ui;margin:24px;background:#f4f4f4}"
                                      "section{background:#fff;border-radius:12px;padding:16px;margin:16px 0}.g{display:grid;gap:10px}.g img{width:100%}"
                                      "a{color:inherit;text-decoration:none}</style><h1>Motion scene catalog</h1>" + "".join(rows))


if __name__ == "__main__":
    main()
