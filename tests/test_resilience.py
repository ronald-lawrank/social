"""Things going wrong on purpose: every command should finish with what it could do and say plainly what it couldn't."""
import time
import urllib.error
from pathlib import Path

import pytest

import fixture_site
from conftest import run
from lrstudio import paths, util

MCMINN_OLD = Path("/home/user/lawrank-creative-studio/engine/template/clients/mcminn")


@pytest.fixture(scope="module")
def site_url(tmp_path_factory):
    url, stop = fixture_site.serve(fixture_site.build(tmp_path_factory.mktemp("site")))
    yield url
    stop()


@pytest.fixture
def private_ok(monkeypatch):
    monkeypatch.setenv("LR_ALLOW_PRIVATE", "1")


def test_a_blocked_site_still_creates_the_client(home, site_url, private_ok):
    out = run("client", "new", site_url + "blocked/", "--package", "growth")       # the server answers 404
    assert out["ok"] and out["needs_attention"] and out["status"] == "needs brand"
    assert any("logo" in n for n in out["needed"]) and "refresh" in out["next"] and "guessed" in out["next"]


def test_a_mistyped_address_is_still_an_error(home):
    out = run("client", "new", "http://unreachable-firm.invalid/")
    assert not out["ok"] and "typos" in out["fix"]


def test_one_failing_onboarding_step_doesnt_stop_the_rest(home, site_url, private_ok, monkeypatch):
    from lrstudio import extract, photos
    monkeypatch.setattr(extract, "extract", lambda *a, **k: (_ for _ in ()).throw(RuntimeError("odd page")))
    monkeypatch.setattr(photos, "collect", lambda *a, **k: (_ for _ in ()).throw(OSError("disk hiccup")))
    out = run("client", "new", site_url)
    assert out["ok"], out
    assert any("facts.xlsx by hand" in w for w in out["warnings"]) and any("Photos couldn't be collected" in w for w in out["warnings"])
    assert out["brand"]["logo"] == "vector"                                         # the logo was still saved
    assert (paths.STATE / "logs" / "errors.log").exists()


def test_one_design_that_cant_be_drawn_doesnt_stop_the_others(home, monkeypatch):
    if not MCMINN_OLD.exists():
        pytest.skip("needs the internal test client")
    from lrstudio import templates
    real = templates.render_html
    monkeypatch.setattr(templates, "render_html", lambda name, *a, **k: (_ for _ in ()).throw(ValueError("broken template"))
                        if name == "faq" else real(name, *a, **k))
    run("client", "import", str(MCMINN_OLD))
    out = run("directions", "mcminn")
    assert out["ok"] and out["needs_attention"] and out["built"] >= 10
    broken = [f for f in out["flagged"] if any("couldn't be drawn" in x for x in f["fix"])]
    assert broken and len(broken) < out["built"]


def test_package_leaves_out_what_still_fails_and_delivers_the_rest(home, monkeypatch):
    if not MCMINN_OLD.exists():
        pytest.skip("needs the internal test client")
    from lrstudio import deck
    run("client", "import", str(MCMINN_OLD))
    run("directions", "mcminn")
    monkeypatch.setattr(deck, "build_deck", lambda *a, **k: (_ for _ in ()).throw(RuntimeError("pptx trouble")))
    out = run("package", "mcminn", "--campaign", "Test designs")
    assert out["ok"] and out["needs_attention"] and "Client deck" in out["not_made"]
    assert len(out["files"]) == 2 and all(Path(f).exists() for f in out["files"])  # posts zip and Figma plugin still made


def test_offline_fonts_fall_back_quickly(home, monkeypatch, tmp_path):
    from lrstudio import fonts
    monkeypatch.setattr(paths, "FONTS", tmp_path / "fonts")
    calls = []

    def offline(url, timeout=30, tries=3):
        calls.append(url)
        raise urllib.error.URLError("no network")
    monkeypatch.setattr(fonts, "fetch", offline)
    t = time.time()
    assert fonts.ensure("Some Brand Sans", 700) is None
    assert time.time() - t < 2 and len(calls) == 1                                  # gives up at once, no .missing written
    assert not list((tmp_path / "fonts").glob("*.missing"))


def test_retries_only_brief_trouble(monkeypatch):
    monkeypatch.setattr(time, "sleep", lambda s: None)
    n = []

    def flaky():
        n.append(1)
        if len(n) < 3:
            raise ConnectionResetError("reset")
        return "ok"
    assert util.retry(flaky) == "ok" and len(n) == 3
    n.clear()

    def missing():
        n.append(1)
        raise urllib.error.HTTPError("u", 404, "Not Found", {}, None)
    with pytest.raises(urllib.error.HTTPError):
        util.retry(missing)
    assert len(n) == 1                                                              # a real 404 isn't retried
    n.clear()
    with pytest.raises(util.LRError):
        util.retry(lambda: n.append(1) or (_ for _ in ()).throw(util.LRError("not an image")))
    assert len(n) == 1


def test_unexpected_errors_are_plain_and_logged(home, monkeypatch):
    from lrstudio import templates
    monkeypatch.setattr(templates, "catalog_summary", lambda: {}["boom"])
    out = run("templates")
    assert not out["ok"] and out["_code"] == 2 and "Something unexpected went wrong" in out["error"]
    assert "Try the same command once more" in out["fix"] and Path(out["log"]).exists()
    assert "KeyError" in Path(out["log"]).read_text()
