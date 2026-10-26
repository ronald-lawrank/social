"""Step 3: templates render, and the checks catch what they should (on synthetic frames and on real renders)."""
import json
import shutil
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from lrstudio import checks, photos, render, store, templates, theme
from lrstudio.extract import contrast

MCMINN_OLD = Path("/home/user/lawrank-creative-studio/engine/template/clients/mcminn")


def frame(**kw):
    base = {"size": "4x5", "slide": None, "treatment": "dark", "w": 1080, "h": 1350, "safe": [88, 96, 88, 96],
            "slots": [], "ovs": [], "photos": []}
    base.update(kw)
    return base


def slot(name, rect, role="body", size=32, weight=400, color="rgb(255, 255, 255)", lines=None, **kw):
    return {"slot": name, "role": role, "rect": rect, "lines": lines or [rect], "size": size, "weight": weight, "color": color,
            "overflowY": 0, "overflowX": 0, "text": "x", **kw}


def png(tmp_path, color=(27, 28, 30)):
    p = tmp_path / "f.png"
    Image.new("RGB", (1080, 1350), color).save(p)
    return p


def rules(issues, level="block"):
    return {i["rule"] for i in issues if i["level"] == level}


def test_clean_frame_passes(tmp_path):
    f = frame(slots=[slot("headline", [96, 600, 800, 200], role="headline", size=84, weight=700)])
    assert checks.check_frame(f, png(tmp_path)) == []


def test_outside_safe_area_and_off_canvas(tmp_path):
    f = frame(slots=[slot("cta", [96, 1270, 300, 60], role="cta", size=28), slot("x", [1000, 600, 200, 40])])
    msgs = " ".join(i["msg"] for i in checks.check_frame(f, png(tmp_path)))
    assert "safe area" in msgs and "off the canvas" in msgs


def test_edge_band_is_allowed_at_the_edge(tmp_path):
    f = frame(slots=[slot("cta", [96, 1270, 300, 40], role="cta", size=28, edge=True)])
    assert "safe-zone" not in rules(checks.check_frame(f, png(tmp_path)))


def test_minimum_type_sizes_and_collisions(tmp_path):
    f = frame(slots=[slot("support", [96, 600, 600, 40], size=20), slot("label", [96, 610, 400, 30], role="label", size=24)])
    issues = checks.check_frame(f, png(tmp_path))
    assert "type" in rules(issues) and "collision" in rules(issues)


def test_text_over_face_and_chest(tmp_path):
    person = {"face": [500, 200, 200, 240], "chest": [340, 440, 520, 240]}
    ph = {"key": "jason", "clip": [0, 0, 1080, 800], "people": [person], "upscale": 1.2, "people_whole": True, "heads_whole": True}
    f = frame(photos=[ph], slots=[slot("headline", [450, 300, 500, 100], role="headline", size=84)])
    assert any("face" in i["msg"] for i in checks.check_frame(f, png(tmp_path)))
    f = frame(photos=[ph], slots=[slot("headline", [380, 520, 500, 100], role="headline", size=84)])
    assert any("chest" in i["msg"] for i in checks.check_frame(f, png(tmp_path)))


def test_fade_over_face_and_neck_cut(tmp_path):
    person = {"face": [500, 200, 200, 240], "chest": [340, 440, 520, 240]}
    ph = {"key": "p", "clip": [0, 0, 1080, 500], "people": [person], "upscale": 1.0, "people_whole": False, "heads_whole": True}
    f = frame(photos=[ph], ovs=[{"type": "shade", "rect": [0, 300, 1080, 200], "opaque": [0, 300, 1080, 200]}])
    msgs = " ".join(i["msg"] for i in checks.check_frame(f, png(tmp_path)))
    assert "fade darkens" in msgs and "cut at the neck" in msgs


def test_heads_cut_and_upscaling(tmp_path):
    ph = {"key": "team", "clip": [0, 0, 1080, 1350], "people": [], "upscale": 2.5, "people_whole": False, "heads_whole": False}
    msgs = " ".join(i["msg"] for i in checks.check_frame(frame(photos=[ph]), png(tmp_path)))
    assert "cuts people" in msgs and "blurry" in msgs


def test_contrast_is_measured_on_pixels(tmp_path):
    # mid-grey text on a mid-grey field fails; white on ink passes
    img = Image.new("RGB", (1080, 1350), (120, 120, 120)); p = tmp_path / "g.png"; img.save(p)
    f = frame(slots=[slot("support", [96, 600, 600, 40], color="rgb(150, 150, 150)")])
    assert "contrast" in rules(checks.check_frame(f, p))
    f = frame(slots=[slot("support", [96, 600, 600, 40], color="rgb(255, 255, 255)")])
    assert "contrast" not in rules(checks.check_frame(f, png(tmp_path)), "block")


def test_logo_visibility(tmp_path):
    img = Image.new("RGB", (1080, 1350), (235, 238, 240))
    img.paste((255, 255, 255), (100, 100, 400, 140))          # a white logo on a pale sky
    p = tmp_path / "l.png"; img.save(p)
    f = frame(ovs=[{"type": "logo", "rect": [100, 100, 300, 40], "opaque": None}])
    assert "contrast" in rules(checks.check_frame(f, p))


def test_treatments_are_readable_for_awkward_brands():
    for colors in ({"ink": "#12263A", "accent": "#C8963E", "paper": "#F7F4EE"},     # gold accent
                   {"ink": "#0B1F33", "accent": "#FFD400", "paper": "#FFFFFF"},     # yellow accent
                   {"ink": "#222222", "accent": "#2B3A55", "paper": "#F5F5F5"}):    # navy accent close to ink
        t = theme.treatments({"colors": colors})
        for name, tr in t.items():
            assert contrast(tr["fg"], tr["bg"]) >= 4.5, (colors, name)
            assert contrast(tr["fg2"], tr["bg"]) >= 4.5, (colors, name)
            assert contrast(tr["acc"], tr["bg"]) >= 3.0, (colors, name)
            assert contrast(tr["btn_fg"], tr["btn_bg"]) >= 4.5, (colors, name)


@pytest.fixture
def mcminn(home):
    if not MCMINN_OLD.exists():
        pytest.skip("needs the internal test client")
    from lrstudio import legacy
    legacy.import_folder(str(MCMINN_OLD))
    return store.find("mcminn")


SAMPLES = json.loads((Path(__file__).parent / "sample_copy.json").read_text())


@pytest.mark.slow
def test_every_template_renders_clean_for_a_real_client(mcminn, tmp_path):
    designs = []
    for name, meta in templates.catalog().items():
        if name not in SAMPLES:
            continue
        for size in meta["sizes"]:
            designs.append({"id": f"{name}-{size}", "template": name, "size": size, "data": SAMPLES[name]})
    res = render.render(mcminn.dir, mcminn.brand(), designs, tmp_path)
    blocking = {r["id"]: [i["msg"] for i in r["issues"] if i["level"] == "block"] for r in res}
    assert not any(blocking.values()), {k: v for k, v in blocking.items() if v}
    assert all((tmp_path / p).exists() for r in res for p in r["images"])
    # the carousel has a cover, its slides and a close
    story = next(r for r in res if r["id"] == "photo-story-4x5")
    assert len(story["images"]) == len(SAMPLES["photo-story"]["copy"]["slides"]) + 2


@pytest.mark.slow
def test_render_cache_skips_unchanged_designs(mcminn, tmp_path):
    d = [{"id": "s1", "template": "statement", "size": "4x5", "data": SAMPLES["statement"]}]
    first = render.render(mcminn.dir, mcminn.brand(), d, tmp_path)
    again = render.render(mcminn.dir, mcminn.brand(), d, tmp_path, cache={"s1": first[0]})
    assert again[0].get("cached")
    d[0]["data"] = dict(SAMPLES["statement"], copy=dict(SAMPLES["statement"]["copy"], headline="Something new."))
    third = render.render(mcminn.dir, mcminn.brand(), d, tmp_path, cache={"s1": first[0]})
    assert not third[0].get("cached")


@pytest.mark.slow
def test_preview_html_is_portable(mcminn, tmp_path):
    res = render.render(mcminn.dir, mcminn.brand(), [{"id": "p", "template": "portrait", "size": "4x5", "data": SAMPLES["portrait"]}], tmp_path)
    html = (tmp_path / res[0]["html"]).read_text()
    assert "file://" not in html                         # fonts copied next to the previews, photos linked relatively
    assert "assets/fonts/" in html and "../" in html


@pytest.mark.slow
def test_copy_is_escaped(mcminn, tmp_path):
    data = {"copy": {"headline": "<script>alert(1)</script> & co", "label": "x"}}
    res = render.render(mcminn.dir, mcminn.brand(), [{"id": "x", "template": "statement", "size": "4x5", "data": data}], tmp_path)
    html = (tmp_path / res[0]["html"]).read_text()
    assert "<script>alert(1)" not in html and "&lt;script&gt;" in html
