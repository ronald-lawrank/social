"""Regressions from onboarding a family-law firm with a raster logo (October 2026): one test per bug."""
import base64
import io
import json
import re
import ssl
import urllib.error

import pytest

from lrstudio import campaign, extract, fonts, logos, paths, photos, render, util


def _png(im, fmt="PNG", **kw):
    b = io.BytesIO(); im.save(b, fmt, **kw)
    return b.getvalue()


# 1. fonts: an SSL/network error must not be cached as "missing"; only a real 404 is
def test_font_download_errors_are_not_cached_as_missing(tmp_path, monkeypatch):
    monkeypatch.setattr(paths, "FONTS", tmp_path)
    assert util.ssl_context().cert_store_stats()["x509_ca"] > 0          # certifi's CA bundle, not the empty system one

    def ssl_fail(url, timeout=0):
        raise urllib.error.URLError(ssl.SSLCertVerificationError("unable to get local issuer certificate"))
    monkeypatch.setattr(fonts, "fetch", ssl_fail)
    assert fonts.ensure("Jost", 700) is None
    assert not (tmp_path / "Jost.missing").exists()

    def not_found(url, timeout=0):
        raise urllib.error.HTTPError(url, 404, "Not Found", {}, None)
    monkeypatch.setattr(fonts, "fetch", not_found)
    assert fonts.ensure("Nosuchfont", 700) is None
    assert (tmp_path / "Nosuchfont.missing").read_text().startswith("404")

    (tmp_path / "Jost.missing").write_text("not found in Google Fonts")   # left by an older version after an SSL error
    monkeypatch.setattr(fonts, "fetch", lambda url, timeout=0: b"\0" * 20_000)
    path, variable = fonts.ensure("Jost", 700)
    assert variable and path.endswith("Jost-var.ttf") and not (tmp_path / "Jost.missing").exists()


# 2. font families come without the weight suffix
def test_font_family_names_lose_weight_suffixes():
    assert extract.family_name("Jost-SemiBold") == "Jost"
    assert extract.family_name("Figtree-SemiBold") == "Figtree"
    assert extract.family_name("Montserrat-BoldItalic") == "Montserrat"
    assert extract.family_name("Lato_Regular") == "Lato"
    assert extract.family_name("Figtree SemiBold") == "Figtree"
    for real in ("Archivo Black", "Playfair Display", "Source Sans 3", "Titan One"):
        assert extract.family_name(real) == real
    read = {"top": ["#0B253E x200"], "h1": "Jost-SemiBold | 600 | 48px | none | normal | #0B253E | #000000 | 0px",
            "body": "Jost-Regular | 400 | 16px | none | normal | #404040 | #000000 | 0px",
            "button": "Figtree-SemiBold | 600 | 16px | none | normal | #FFFFFF | #1C5373 | 4px"}
    v, _ = extract.derive_visual_identity(read)
    assert v["fonts"]["head"]["family"] == "Jost" and v["fonts"]["body"]["family"] == "Jost"
    assert v["fonts"]["ui"]["family"] == "Figtree"
    assert fonts.resolve("Jost-SemiBold") == ("Jost", None)                # older brand.json files still resolve


# 3. people: headings are not people, and marketing role lines aren't copied
def test_people_skip_headings_and_superlative_roles():
    text = "\n".join(["Why Hire", "Dana Reyes", "", "A Leading Austin Divorce Attorney", "Extensive Legal Experience",
                      "Protecting Parental Rights in", "Custody Disputes", "Custody matters are about the child.",
                      "Protective Orders", "© Copyright 2026 Reyes Family Law Attorney", "Letting Emotions Dictate Decisions",
                      "Not Consulting Early with an Attorney", "Areas We Serve", "Based in Austin, the attorney serves Travis County.",
                      "Sam O. Patel", "Associate Attorney"])
    ex = extract.extract([{"name": "home", "url": "https://example.com/", "title": "", "text": text, "nav": []}])
    assert [(p["name"], p["role"]) for p in ex.people] == [("Dana Reyes", "Attorney"), ("Sam O. Patel", "Associate Attorney")]


# 4. ink: the logo's navy beats the body-text grey
def test_ink_prefers_the_logos_dark_colour():
    read = {"top": ["#FFFFFF x900", "#404040 x400", "#0B253E x60", "#1C5373 x50", "#F5F5F5 x40"],
            "h1": "Jost | 700 | 48px | none | normal | #404040 | #000000 | 0px",
            "body": "Jost | 400 | 16px | none | normal | #404040 | #000000 | 0px",
            "button": "Jost | 600 | 16px | none | normal | #FFFFFF | #1C5373 | 4px"}
    assert extract.derive_visual_identity(read)[0]["colors"]["ink"] == "#404040"          # what happened before
    assert extract.derive_visual_identity(read, logo_dark="#0b253e")[0]["colors"]["ink"] == "#0B253E"
    assert extract.derive_visual_identity(read, logo_dark="#404040")[0]["colors"]["ink"] == "#404040"
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path fill="#0B253E" d="M0 0h5v5z"/><path fill="#0B253E" d="M5 5h5v5z"/><path fill="#C8963E" d="M0 5h2v2z"/></svg>'
    assert logos.dominant_dark(svg=svg) == "#0B253E"
    black = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h5v5z"/></svg>'
    assert logos.dominant_dark(svg=black) is None                               # black/grey isn't a brand colour
    assert logos.dominant_dark(raster=_navy_jpg_logo()) is not None


def _navy_jpg_logo():
    """A navy wordmark JPG on white whose top-left pixel is cream (JPEG noise), like real site logos."""
    from PIL import Image, ImageDraw
    im = Image.new("RGB", (600, 140), "white"); d = ImageDraw.Draw(im)
    d.rectangle([20, 20, 120, 120], fill=(11, 37, 62))
    for x in range(160, 580, 40):
        d.rectangle([x, 40, x + 25, 100], fill=(11, 37, 62))
    d.rectangle([0, 0, 3, 3], fill=(255, 247, 228))
    return _png(im, "JPEG", quality=85)


# 5. raster logos: the white version is the logo's alpha mask, not a white box
def test_raster_white_version_is_an_alpha_mask():
    import numpy as np
    from PIL import Image
    svg, white = logos.wrap_raster(_navy_jpg_logo())
    for out in (white, logos.white_version(svg)):            # onboarding and `lr client refresh` agree
        m = re.search(r'href="data:image/png;base64,([^"]+)"', out)
        a = np.asarray(Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert("RGBA"))
        assert (a[..., :3][a[..., 3] > 0] == 255).all()                       # only white pixels
        assert a[50, 120, 3] == 0 and a[5, 150, 3] == 0                       # gaps between the shapes are clear (no box)
        assert 0.2 < (a[..., 3] > 128).mean() < 0.8                          # the letters, not the whole frame


# 6. a changed logo file changes every design's cache key
def test_logo_change_invalidates_the_build_cache(tmp_path):
    ld = tmp_path / "brand" / "logos"; ld.mkdir(parents=True)
    (ld / "logo-dark.svg").write_text('<svg viewBox="0 0 1 1"><path fill="#000"/></svg>')
    before = render.assets_sig(tmp_path)
    assert render.assets_sig(tmp_path) == before
    (ld / "logo-dark.svg").write_text('<svg viewBox="0 0 1 1"><path fill="#0B253E"/></svg>')
    assert render.assets_sig(tmp_path) != before
    after = render.assets_sig(tmp_path)
    (ld / "mark-white.svg").write_text('<svg viewBox="0 0 1 1"/>')
    assert render.assets_sig(tmp_path) != after


# 7. test-design sample copy fits the practice area
def test_sample_copy_follows_the_practice_area():
    def words(area):
        return json.dumps(campaign.sample_copy(area)).lower()
    assert "accident" in words("Personal injury") and "accident" in words("Car accidents")
    fam = words("Family law")
    assert "divorce" in fam and not re.search(r"accident|insurer|crash", fam)
    assert "divorce" in words("Child custody")
    assert "arrest" in words("Criminal defense")
    for other in ("Immigration", "Estate planning", None):
        assert not re.search(r"accident|insurer|crash|divorce|arrest", words(other))
    for area in ("Personal injury", "Family law", "Criminal defense", None):     # every set fills every template
        assert set(campaign.sample_copy(area)) == {"faq", "help", "story", "checklist"}


# 8. banners with text, and people who aren't the firm's, are flagged for a check
def test_banners_and_unmatched_people_are_flagged_as_possibly_stock():
    import numpy as np
    from PIL import Image, ImageDraw, ImageFont
    banner = Image.new("RGB", (1200, 800), (11, 37, 62)); d = ImageDraw.Draw(banner)
    font = ImageFont.load_default(size=64)
    for i, line in enumerate(("AUSTIN", "RELOCATION LAWYER", "Schedule a consultation")):
        d.text((60, 220 + i * 110), line, fill="white", font=font)
    rng = np.random.default_rng(1)
    yy, xx = np.mgrid[0:800, 0:1200]
    photo = np.stack([(xx / 6 + yy / 9) % 255, (yy / 4) % 255, np.full_like(xx, 120)], -1) + rng.normal(0, 12, (800, 1200, 3))
    photo = Image.fromarray(np.clip(photo, 0, 255).astype("uint8")).filter(__import__("PIL.ImageFilter").ImageFilter.GaussianBlur(3))
    assert photos.text_share(_png(banner, "JPEG")) > photos.MAX_TEXT_SHARE
    assert photos.text_share(_png(photo, "JPEG")) < photos.MAX_TEXT_SHARE

    people = [{"name": "Dana Reyes", "role": "Attorney"}]
    assert "large text" in photos.stock_check("person", "Dana Reyes", [], people, 0.06)
    assert "possibly stock" in photos.stock_check("group", None, ["happy-couple-on-sofa"], people, 0.0)
    assert "possibly stock" in photos.stock_check("person", None, ["portrait-parent-holding-child"], people, 0.0)
    assert photos.stock_check("person", "Dana Reyes", [], people, 0.0) is None
    assert photos.stock_check("group", None, ["Dana Reyes with her team"], people, 0.0) is None            # no faces to compare
    assert "possibly stock" in photos.stock_check("group", None, ["Dana Reyes helps couples"], people, 0.0, face_match=False)
    assert photos.stock_check("office", None, [], people, 0.0) is None
    assert photos.stock_check("person", None, ["alimony-lft-img"], people, 0.0, face_match=True) is None   # same face as a named photo
    assert photos.match_name(["DanaReyes"], people) == "Dana Reyes"


def test_logo_is_not_collected_as_a_photo_and_embeddings_stay_in_memory(tmp_path, monkeypatch):
    import numpy as np
    from PIL import Image
    from lrstudio import crawl
    rng = np.random.default_rng(2)
    scene = _png(Image.fromarray(rng.integers(0, 255, (900, 1400, 3), dtype="uint8")).resize((1400, 900)), "JPEG")
    logo = _navy_jpg_logo()
    files = {"https://example.com/office.jpg": scene, "https://example.com/logo.jpg": logo,
             "https://cdn.example.com/logo-copy.jpg": logo}
    monkeypatch.setattr(crawl, "download", lambda url, page=None: (files[url], "image/jpeg"))
    cands = [{"url": u, "page": "https://example.com/", "alt": "", "w": 1400, "h": 900} for u in files]
    out = photos.collect(cands, tmp_path, [], "example.com", logos=("https://example.com/logo.jpg", logo))
    assert [m["image_url"] for m in out.values()] == ["https://example.com/office.jpg"]   # by URL and by picture
    assert "feature" not in json.dumps(out)                                                # only match results are saved
