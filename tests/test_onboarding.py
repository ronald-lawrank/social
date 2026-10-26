"""Step 2: website -> brand profile, facts, logos, photos."""
import json
from pathlib import Path

import pytest

import fixture_site
from conftest import run
from lrstudio import extract, logos, photos, store

MCMINN = Path("/home/user/lawrank-creative-studio/engine/template/clients/mcminn/assets")


@pytest.fixture(scope="module")
def site_url(tmp_path_factory):
    root = fixture_site.build(tmp_path_factory.mktemp("site"))
    url, stop = fixture_site.serve(root)
    yield url
    stop()


@pytest.fixture
def private_ok(monkeypatch):
    monkeypatch.setenv("LR_ALLOW_PRIVATE", "1")


def test_new_client_end_to_end(home, site_url, private_ok):
    out = run("client", "new", site_url)
    assert out["ok"], out
    assert out["client"] == "Harbor & Vale Injury Lawyers"
    assert out["practice_area"] == "Personal injury"
    c = store.find("harbor")
    b = json.loads((c.brand_dir / "brand.json").read_text())
    # brand read from computed CSS: navy ink, gold accent from the CTA button, Playfair/Source Sans, square-ish uppercase CTA
    assert b["colors"]["ink"] == "#12263A" and b["colors"]["accent"] == "#C8963E"
    assert b["fonts"]["head"]["family"] == "Playfair Display" and b["fonts"]["body"]["family"] == "Source Sans 3"
    assert b["cta"] == {"radius": 2, "upper": True}
    # the gold accent can't carry white text, so accent fields use ink text
    assert b["treatments"]["accent"]["head"][0] == "ink"
    # offices from the contact page + JSON-LD; both phone lines found
    cities = {o["city"] for o in b["offices"]}
    assert {"Tampa", "Orlando"} <= cities
    assert {p["name"] for p in b["people"]} >= {"Dana Harbor", "Miguel Vale"}
    assert "Spanish" in b["languages"]


def test_logo_colours_are_baked_and_scripts_removed(home, site_url, private_ok):
    run("client", "new", site_url)
    c = store.find("harbor")
    dark = (c.brand_dir / "logos" / "logo-dark.svg").read_text()
    white = (c.brand_dir / "logos" / "logo-white.svg").read_text()
    assert "<script" not in dark and "alert" not in dark
    assert "rgb(18, 38, 58)" in dark or "#12263A" in dark.upper()           # navy came from page CSS, not the SVG
    assert "rgb(200, 150, 62)" in dark or "#C8963E" in dark.upper()
    assert "#FFFFFF" in white and "rgb(18, 38, 58)" not in white


def test_facts_sources_and_approvals(home, site_url, private_ok):
    run("client", "new", site_url)
    f = store.read_facts(store.find("harbor"))
    by_cat = {}
    for k, v in f.items():
        by_cat.setdefault(v["category"], []).append(v)
    assert any("1998" in v["text"] for v in by_cat["history"])
    results = by_cat["results"]
    assert results and all(v["needs_approval"] and not v["usable"] for v in results)
    assert any("4.9" in v["text"] for v in by_cat["reviews"])
    assert by_cat["testimonial"][0]["needs_approval"]
    assert any("No fee unless we win" in v["text"] for v in by_cat["fees"])
    assert all(v["source"].startswith("http://127.0.0.1") for v in f.values())
    # every verified fact's excerpt really is on the page it cites
    assert all(v["verified"] for v in f.values() if v["category"] != "people")


def test_photo_selection_skips_stock_and_small(home, site_url, private_ok):
    run("client", "new", site_url)
    c = store.find("harbor")
    meta = json.loads((c.brand_dir / "photos" / "photos.json").read_text())
    urls = [m["image_url"] for m in meta.values()]
    assert not any("shutterstock" in u for u in urls)
    assert not any("tiny" in u and m["use"] for u, m in zip(urls, meta.values()))
    assert all(m["kind"] == "office" for m in meta.values())
    summary = run("client", "show", "harbor")
    assert "No usable photos" in " ".join(summary["warnings"])


def test_show_and_set(home, site_url, private_ok):
    run("client", "new", site_url)
    out = run("client", "set", "harbor", "direction=B", "brand.colors.accent=#B08030", "brand.voice.notes+=Plain-spoken, warm")
    assert out["ok"]
    s = run("client", "show", "harbor vale")
    assert s["direction"]["key"] == "B" and s["direction"]["name"] == "Bold type" and s["brand"]["colors"]["accent"] == "#B08030" and s["voice"]["notes"] == ["Plain-spoken, warm"]
    assert len(json.dumps(s)) < 6000      # small enough to read every session


def test_duplicate_client_and_blocked_site(home, site_url, private_ok):
    run("client", "new", site_url)
    out = run("client", "new", site_url)
    assert not out["ok"] and "already a client" in out["error"]
    out = run("client", "new", "http://unreachable-firm.invalid/")
    assert not out["ok"] and "typos" in out["fix"]


def test_private_addresses_are_refused(home, monkeypatch):
    monkeypatch.delenv("LR_ALLOW_PRIVATE", raising=False)
    out = run("client", "new", "http://localhost:8000/")
    assert not out["ok"]


def test_manual_client(home):
    out = run("client", "new", "blockedfirm.com", "--name", "Blocked Firm PLLC", "--manual")
    assert out["ok"] and out["status"] == "needs brand"


# ---------------------------------------------------------------- units
def test_svg_sanitizer():
    bad = '<svg viewBox="0 0 10 10" onload="x()"><script>x()</script><a href="https://evil"><rect width="5" height="5" fill="#123456"/></a><foreignObject/><image href="https://evil/a.png"/></svg>'
    s = logos.sanitize(bad)
    assert "script" not in s and "onload" not in s and "foreignObject" not in s and "evil" not in s and "#123456" in s
    with pytest.raises(Exception):
        logos.sanitize('<!DOCTYPE x [<!ENTITY a "b">]><svg/>')


def test_white_and_dark_versions():
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h5v5z"/><rect fill="#C8963E" width="2" height="2"/><rect style="fill:#ffffff" width="1" height="1"/></svg>'
    w = logos.white_version(svg)
    assert 'fill="#FFFFFF"' in w and "#C8963E" not in w
    d = logos.dark_version(svg, "#12263A")
    assert "#12263A" in d and "#C8963E" in d
    assert not logos.is_light(svg) and logos.is_light(w)


def test_raster_logo_on_white_is_knocked_out():
    from PIL import Image, ImageDraw
    import io
    im = Image.new("RGB", (400, 120), "white"); ImageDraw.Draw(im).rectangle([40, 30, 360, 90], fill=(18, 38, 58))
    b = io.BytesIO(); im.save(b, "PNG")
    svg, white = logos.wrap_raster(b.getvalue())
    assert 'viewBox="0 0 321 61"' in svg and white and "data:image/png" in white


def test_visual_identity_rules():
    read = {"top": ["#FFFFFF x900", "#6EC1E4 x500", "#0B1F33 x300", "#D4202B x120", "#F4F1EA x80", "#555555 x40"],
            "h1": "Lora | 600 | 48px | none | normal | #0B1F33 | #000000 | 0px",
            "body": "Inter | 400 | 18px | none | normal | #333333 | #000000 | 0px",
            "button": "Inter | 700 | 16px | uppercase | 1px | #FFFFFF | #D4202B | 999px", "reliable": True}
    v, warn = extract.derive_visual_identity(read)
    assert v["colors"]["accent"] == "#D4202B" and v["colors"]["ink"] == "#0B1F33" and v["colors"]["paper"] == "#F4F1EA"
    assert "#6EC1E4" not in v["colors"].values()                    # Elementor default ignored
    assert v["fonts"]["head"] == {"family": "Lora", "bold": "SemiBold", "semi": "SemiBold"}   # the site's own weight (600) is kept
    assert v["cta"] == {"radius": 999, "upper": True}


@pytest.mark.skipif(not MCMINN.exists(), reason="needs the internal test client's photos")
def test_faces_and_crops_on_real_photos():
    team = photos.analyze((MCMINN / "team.jpg").read_bytes())
    assert len(team["faces"]) == 3 and photos.kind_of(team) == "group"
    # a wide team photo can't fill a tall post without cutting people, but fits a wide band
    assert not photos.crop(team, 1080, 1350)["heads_whole"]
    assert photos.crop(team, 1080, 640)["people_whole"]
    jason = photos.analyze((MCMINN / "jason.jpg").read_bytes())
    assert photos.kind_of(jason) == "person"
    c = photos.crop(jason, 1080, 1350)
    assert c["people_whole"] and c["upscale"] <= 2.0
    assert photos.match_name(["Jason McMinn, founding partner"], [{"name": "Jason McMinn"}, {"name": "Justin McMinn"}]) == "Jason McMinn"
    assert photos.match_name(["mcminn-headshot"], [{"name": "Jason McMinn"}, {"name": "Justin McMinn"}]) is None
