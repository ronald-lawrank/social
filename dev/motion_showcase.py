"""Motion library review page: the demo reels plus every scene in every look, from motion_catalog runs.

  python3 dev/motion_showcase.py --sheets /tmp/lr-motion-catalog/final-{look} --reels /tmp/lr-motion-catalog/reels/storyboards \
      --reel-specs <folder of reel storyboards> --out <folder>

Writes <out>/index.html, <out>/strips/<scene>-<look>.jpg (six frames across the scene) and <out>/reels/<name>.html + poster.
"""
import argparse
import html as H
import json
import shutil
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "plugin" / "skills" / "lawrank-studio" / "scripts"))
W, LH, COLS = 270, 504, 6          # one contact-sheet frame and row (motion_catalog.contact_sheet)

LOOKS = {"thread": "Clean light world; one accent dot travels through the video",
         "flat": "Bold flat colour on the brand field, chunky shapes",
         "cards": "Warm gradient with floating white cards",
         "silhouette": "Paper collage, black cut-outs, editorial type"}
GROUPS = [("Hooks and headlines", ["kinetic", "word-swap"]),
          ("Messages and paperwork", ["chat", "phone-call", "notifications", "search-bar", "letter", "form-fill", "paper-pile", "bills-add", "calendar"]),
          ("Steps, answers and proof", ["checklist", "timeline", "myth-fact", "qa-card", "counter", "bar-race", "quote", "stars"]),
          ("Places and metaphors", ["map-pin", "road", "scales", "umbrella", "weight-lift", "icon-grid", "compare-split"]),
          ("People", ["figure", "crossroads", "attorney", "door"])]


def strip(sheet: Path, out: Path):
    im = Image.open(sheet).convert("RGB").crop((0, 24, W * COLS, LH))
    im.resize((im.width * 2 // 3, im.height * 2 // 3), Image.LANCZOS).save(out, "JPEG", quality=74, optimize=True)


def poster(sheet: Path, out: Path, k: int = 2):
    im = Image.open(sheet).convert("RGB")
    c, r = k % COLS, k // COLS
    im.crop((c * W, r * LH + 24, c * W + W, r * LH + LH)).save(out, "JPEG", quality=82, optimize=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sheets", required=True, help="folder pattern with {look}")
    ap.add_argument("--reels", required=True); ap.add_argument("--reel-specs", required=True); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    from lrstudio import motion
    cat = motion.catalog()
    out = Path(a.out); (out / "strips").mkdir(parents=True, exist_ok=True); (out / "reels").mkdir(exist_ok=True)
    missing = []
    for s in cat["scenes"]:
        if s == "end":
            continue
        for lk in LOOKS:
            sh = Path(a.sheets.format(look=lk)) / s / f"{lk}.png"
            if sh.exists():
                strip(sh, out / "strips" / f"{s}-{lk}.jpg")
            else:
                missing.append(f"{s}/{lk}")
    reels = []
    for spec in sorted(Path(a.reel_specs).glob("*.json")):
        sb = json.loads(spec.read_text()); name = spec.stem
        shutil.copy(Path(a.reels) / f"{name}.html", out / "reels" / f"{name}.html")
        poster(Path(a.reels) / f"{name}.png", out / "reels" / f"{name}.jpg", k=3)
        title = name.split("-", 2)[2].replace("-", " ").capitalize()
        reels.append({"name": name, "title": title, "look": sb["look"],
                      "scenes": [cat["scenes"][x["type"]]["label"] for x in sb["screen"]["scenes"] if x["type"] != "end"]})
    page(cat, reels, out)
    print(json.dumps({"out": str(out / "index.html"), "missing": missing}))


def page(cat, reels, out):
    n = len([s for s in cat["scenes"] if s != "end"])
    reel_html = "".join(f"""<article class="reel"><a class="still" href="reels/{r['name']}.html" target="_blank" rel="noopener">
      <img src="reels/{r['name']}.jpg" alt="{H.escape(r['title'])}, a frame from the reel" loading="lazy"><span class="play">Play reel</span></a>
      <div class="rmeta"><span class="chip">{r['look']}</span><h3>{H.escape(r['title'])}</h3><p>{' · '.join(H.escape(x) for x in r['scenes'])}</p></div></article>""" for r in reels)
    rows = []
    for g, members in GROUPS:
        items = []
        for s in members:
            m = cat["scenes"].get(s)
            if not m:
                continue
            strips = "".join(f'<img class="strip" data-look="{lk}" src="strips/{s}-{lk}.jpg" alt="{H.escape(m["label"])} in the {lk} look: six moments across the scene" loading="lazy"{"" if lk == "thread" else " hidden"}>' for lk in LOOKS)
            practice = "Personal injury only" if m["practice"] not in ("any", None) else "Any practice"
            items.append(f"""<li class="scene" id="{s}"><div class="stext"><h4>{H.escape(m['label'])} <code>{s}</code></h4><p>{H.escape(m['about'] or '')}</p>
              <p class="good"><span>Good for</span> {H.escape(m['good'] or '')}</p><p class="prac">{practice}</p></div><div class="sframes">{strips}</div></li>""")
        rows.append(f'<section class="group"><h3 class="gh">{H.escape(g)} <span>{len(items)}</span></h3><ul class="scenes">{"".join(items)}</ul></section>')
    tabs = "".join(f'<button type="button" id="look-{lk}" class="tab" data-look="{lk}" aria-pressed="{"true" if lk == "thread" else "false"}"><b>{lk.capitalize()}</b><span>{H.escape(d)}</span></button>' for lk, d in LOOKS.items())
    (out / "index.html").write_text(TEMPLATE.replace("{N}", str(n)).replace("{REELS}", reel_html).replace("{TABS}", tabs).replace("{ROWS}", "".join(rows))
                                   .replace("{NT}", str(len(cat["transitions"]))))


TEMPLATE = """<title>LawRank Motion Library</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap">
<style>
/* layout: a review tool. Reels on a dark film band up top, then the scene index with a look switcher; each scene shows six moments as a strip */
:root{--bg:#F2F3EF;--panel:#FFFFFF;--fg:#16191D;--muted:#5D6570;--line:#D8DBD3;--accent:#2E58D6;--band:#14171B;--bandfg:#ECEEF0;--chip:#E6E9F7;
  --display:'Bricolage Grotesque',ui-sans-serif,system-ui,sans-serif;--body:'Instrument Sans',ui-sans-serif,system-ui,sans-serif;--mono:'JetBrains Mono',ui-monospace,Menlo,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#111316;--panel:#1A1D21;--fg:#E8EAED;--muted:#A0A8B2;--line:#2B3036;--accent:#86A2FF;--band:#0A0C0E;--bandfg:#ECEEF0;--chip:#232A3D;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#111316;--panel:#1A1D21;--fg:#E8EAED;--muted:#A0A8B2;--line:#2B3036;--accent:#86A2FF;--band:#0A0C0E;--bandfg:#ECEEF0;--chip:#232A3D;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font:16px/1.55 var(--body)}
.wrap{max-width:1180px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
header .wrap{padding-block:40px 28px;display:grid;gap:10px}
.eyebrow{font:500 12px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
h1{font:800 clamp(34px,5vw,56px)/1.02 var(--display);letter-spacing:-.02em;margin:0;text-wrap:balance}
.lede{max-width:64ch;color:var(--muted);margin:0}
.stats{display:flex;flex-wrap:wrap;gap:8px 22px;font:500 13px var(--mono);color:var(--fg);margin-top:6px}.stats b{font:800 22px var(--display);margin-right:6px}
.band{background:var(--band);color:var(--bandfg)}.band .wrap{padding-block:28px 34px;display:grid;gap:16px}
.band h2{font:700 22px var(--display);margin:0}.band .note{color:#9AA3AD;margin:0;font-size:14px;max-width:70ch}
.reels{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:18px}
.reel{display:grid;gap:10px;min-width:0}.still{position:relative;display:block;border-radius:14px;overflow:hidden;aspect-ratio:9/16;background:#222;outline:1px solid rgba(255,255,255,.08)}
.still img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s}.still:hover img{transform:scale(1.03)}
.play{position:absolute;left:10px;bottom:10px;font:600 13px var(--body);background:#fff;color:#111;padding:7px 12px;border-radius:999px}
.still:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
.rmeta h3{font:700 17px/1.2 var(--display);margin:4px 0 2px}.rmeta p{margin:0;color:#9AA3AD;font-size:13px}
.chip{font:500 11px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:#C9D3FF}
.lib .wrap{padding-block:34px 60px;display:grid;gap:22px}
.lib h2{font:700 26px var(--display);margin:0}
.tabs{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--bg);padding-block:10px}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:10;background:var(--bg)}
.tab{text-align:left;border:1px solid var(--line);background:var(--panel);color:var(--fg);border-radius:10px;padding:10px 12px;cursor:pointer;display:grid;gap:2px;font:inherit}
.tab b{font:700 15px var(--display)}.tab span{font-size:12.5px;color:var(--muted);line-height:1.35}
.tab[aria-pressed="true"]{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent);background:var(--chip)}
.tab:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.group{display:grid;gap:10px}.gh{font:700 18px var(--display);margin:8px 0 0;display:flex;gap:8px;align-items:baseline}.gh span{font:500 12px var(--mono);color:var(--muted)}
.scenes{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.scene{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px;display:grid;grid-template-columns:minmax(0,300px) minmax(0,1fr);gap:16px;align-items:center}
@media (max-width:820px){.scene{grid-template-columns:1fr}}
.stext{min-width:0}.stext h4{font:700 17px var(--display);margin:0 0 4px}.stext code{font:500 11.5px var(--mono);color:var(--muted);margin-left:4px}
.stext p{margin:0 0 6px;font-size:14px}.good span{font:500 11px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-right:4px}
.prac{font-size:12.5px!important;color:var(--muted)}
.sframes{min-width:0;overflow-x:auto}.strip{display:block;width:100%;min-width:560px;border-radius:8px}
@media (prefers-reduced-motion:reduce){.still img{transition:none}}
</style>
<header><div class="wrap"><span class="eyebrow">LawRank Studio · composed video</span><h1>Motion Library</h1>
<p class="lede">Every scene a composed video can use, in all four looks. A writer picks a look and a run of scenes, one per line of narration, and each scene changes on the voice's own words. These previews are silent and use simulated timing; real videos add the voiceover and sound.</p>
<div class="stats"><span><b>{N}</b>scenes</span><span><b>4</b>looks</span><span><b>{NT}</b>transitions</span></div></div></header>
<section class="band" aria-labelledby="reels-h"><div class="wrap"><h2 id="reels-h">Demo reels</h2>
<p class="note">Five sample videos that use all {N} scenes between them. Each opens a playable preview in a new tab: press Play, and scrub with the slider.</p>
<div class="reels">{REELS}</div></div></section>
<section class="lib" aria-labelledby="lib-h"><div class="wrap"><h2 id="lib-h">Scenes</h2><div class="tabs" role="group" aria-label="Look">{TABS}</div>{ROWS}</div></section>
<script>
(function(){var tabs=[].slice.call(document.querySelectorAll('.tab'));
function show(lk){tabs.forEach(function(t){t.setAttribute('aria-pressed',String(t.dataset.look===lk))});
[].forEach.call(document.querySelectorAll('.strip'),function(i){i.hidden=i.dataset.look!==lk});try{localStorage.setItem('ml-look',lk)}catch(e){}}
tabs.forEach(function(t){t.addEventListener('click',function(){show(t.dataset.look)})});
try{var s=localStorage.getItem('ml-look');if(s&&document.getElementById('look-'+s))show(s)}catch(e){}})();
</script>"""

if __name__ == "__main__":
    main()
