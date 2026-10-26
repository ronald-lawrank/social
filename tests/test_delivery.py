"""Step 6: Figma plugin (runs on a stand-in Figma API; layers replay to match the renders), client deck, package."""
import json
import subprocess
import zipfile
from pathlib import Path

import pytest

import figma_replay
from conftest import run
from lrstudio import figma_export, fonts, store

MCMINN_OLD = Path("/home/user/lawrank-creative-studio/engine/template/clients/mcminn")
pytestmark = pytest.mark.slow


@pytest.fixture
def built(home):
    if not MCMINN_OLD.exists():
        pytest.skip("needs the internal test client")
    run("client", "import", str(MCMINN_OLD))
    out = run("directions", "mcminn")
    assert out["ok"], out
    return store.find("mcminn")


def test_package_makes_deck_plugin_and_posts(built, tmp_path):
    out = run("package", "mcminn", "--campaign", "Test designs")
    assert out["ok"] and out["review_set"], out
    deck, plugin, posts = (Path(f) for f in out["files"])
    assert deck.exists() and deck.stat().st_size < 12_000_000
    from pptx import Presentation
    prs = Presentation(str(deck))
    assert len(prs.slides) >= 12 + 4 + 3                       # cover, board pages, one per option, confirm, next steps
    with zipfile.ZipFile(posts) as z:
        names = z.namelist()
    assert "captions.csv" in names and any(n.endswith("-9x16.png") for n in names) and any(n.endswith("-1x1.png") for n in names)
    with zipfile.ZipFile(plugin) as z:
        z.extractall(tmp_path)
    code = next(tmp_path.rglob("code.js"))
    manifest = json.loads(next(tmp_path.rglob("manifest.json")).read_text())
    assert manifest["main"] == "code.js" and manifest["networkAccess"] == {"allowedDomains": ["none"]}
    r = subprocess.run(["node", str(Path(__file__).parent / "mock_figma.js"), str(code)], capture_output=True, text=True, timeout=120)
    res = json.loads(r.stdout.strip().splitlines()[-1])
    assert res["ok"], res
    assert res["frames"] >= 12 and res["text"] > 50 and res["images"] > 0


def test_figma_layers_replay_like_the_render(built, tmp_path):
    from playwright.sync_api import sync_playwright
    d = built.campaigns_dir / "Test designs"
    cache = json.loads((d / ".build.json").read_text())
    ids = [k for k in cache if k.endswith("-4x5")]
    designs, images = figma_export.collect([(k, d / cache[k]["html"]) for k in ids])
    css, _ = fonts.face_css(built.brand(), embed=True)
    worst = 0
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        for k, dsg in zip(ids, designs):
            for n, fr in enumerate(dsg["frames"]):
                pg.set_viewport_size({"width": int(fr["w"]), "height": int(fr["h"])})
                pg.set_content(figma_replay.frame_html(fr, images, css)); pg.evaluate("document.fonts.ready")
                rp = tmp_path / f"{k}_{n}.png"; pg.screenshot(path=str(rp))
                worst = max(worst, figma_replay.compare(str(d / cache[k]["images"][n]), str(rp)))
        b.close()
    assert worst < 9, worst                                  # 0-255 mean difference at quarter size
