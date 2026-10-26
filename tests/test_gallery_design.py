"""Gallery tabs (Posts | Profile & covers | Design), the build record surviving partial builds, client-appropriate
board copy, short names and practice-specific plans."""
import re
from pathlib import Path

import pytest

from conftest import run
from lrstudio import brandcopy, campaign, store, templates
from lrstudio.util import read_json, write_json

MCMINN_OLD = Path("/home/user/lawrank-creative-studio/engine/template/clients/mcminn")


@pytest.fixture
def mcminn(home):
    if not MCMINN_OLD.exists():
        pytest.skip("needs the internal test client")
    run("client", "import", str(MCMINN_OLD))
    return store.find("mcminn")


def option(key, **kw):
    o = {"key": key, "template": "statement", "treatment": "dark", "facts": ["family_owned"],
         "copy": {"label": "Meet the firm", "headline": "A family-owned firm.", "support": "Injury lawyers.", "cta": "Talk to us"},
         "caption": "A family-owned firm.", "alt": "Statement graphic."}
    o.update(kw)
    return o


def write(d, pid, opts):
    p = read_json(d / "posts" / f"{pid}.json"); p["options"] = opts; write_json(d / "posts" / f"{pid}.json", p)


def test_design_ids_with_hyphenated_sizes():
    assert templates.split_id("KIT-FB-fb-cover") == ("KIT", "FB", "fb-cover")
    assert templates.split_id("KIT-LI-li-banner") == ("KIT", "LI", "li-banner")
    assert templates.split_id("PI-001-A-4x5") == ("PI-001", "A", "4x5")
    assert templates.split_id("DIR-A-A1-4x5") == ("DIR-A", "A1", "4x5")
    assert templates.split_id("PI-006-A-motion") == ("PI-006", "A", "motion")


def test_partial_builds_keep_the_rest_of_the_gallery(mcminn):
    d = Path(run("campaign", "new", "mcminn")["folder"])
    write(d, "PI-001", [option("A")]); write(d, "PI-002", [option("A")])
    run("build", "mcminn", "--month", "1")
    first = read_json(d / ".build.json")
    assert any(k.startswith("KIT-FB") for k in first) and any(k.startswith("PI-002") for k in first)
    run("build", "mcminn", "--post", "PI-001", "--force")            # used to wipe every other post's record
    run("build", "mcminn", "--post", "PI-002")
    after = read_json(d / ".build.json")
    assert set(first) <= set(after)
    assert "not drawn yet" not in (d / "index.html").read_text()


def test_gallery_has_posts_kit_and_design_tabs(mcminn):
    run("client", "set", "mcminn", "direction=A")
    d = Path(run("campaign", "new", "mcminn")["folder"])
    write(d, "PI-001", [option("A")])
    run("build", "mcminn", "--month", "1")
    page = (d / "index.html").read_text()
    for t in ("posts", "kit", "design"):
        assert f"id='tab-{t}'" in page and f"href='#{t}'" in page
    posts_tab = page.split("id='tab-posts'")[1].split("id='tab-kit'")[0]
    kit_tab = page.split("id='tab-kit'")[1].split("id='tab-design'")[0]
    assert "PI-001" in posts_tab and "KIT ·" not in posts_tab and "KIT ·" in kit_tab
    design = page.split("id='tab-design'")[1]
    b = mcminn.brand()
    assert "People first" in design and b["colors"]["ink"] in design and ":1 ·" in design           # direction, swatches, contrast
    assert b["fonts"]["head"]["family"] in design and "1640 × 624" in design                      # typography, formats
    assert "Free consultation →" not in design and "until the firm approves its fees fact" in design  # no button offers it yet
    assert "Hablamos Espa" in design                                                              # a pending claim is named
    assert "Helping the injured" not in design or b["voice"].get("tagline")                       # no borrowed claims


def test_board_and_guide_copy_fit_the_practice_and_the_approvals(home):
    run("client", "new", "https://carrasco-family.example/", "--manual", "--name", "The Law Office of Ben Carrasco, PLLC")
    c = store.find("carrasco")
    assert c.brand()["short"] == "Ben Carrasco"
    run("client", "set", "carrasco", "practice_area=Family law")
    c = store.find("carrasco")
    cp = brandcopy.brand_copy(c)
    assert cp["headline"].startswith("Facing divorce") and cp["cta"] == "Talk to us" and not cp["free_ok"]
    assert "injured" not in cp["headline"].lower() and "family-owned" not in cp["headline"].lower()
    store.write_facts(c, [{"key": "fees", "text": "Free initial consultation.", "category": "fees", "source": None, "excerpt": None,
                           "verified": True, "needs_approval": False, "notes": None}])
    assert brandcopy.brand_copy(c)["cta"] == "Free consultation"


def test_short_names():
    cases = {"The Law Office of Ben Carrasco, PLLC": "Ben Carrasco", "McMinn Law Firm": "McMinn",
             "Harbor & Vale Injury Lawyers": "Harbor & Vale", "The Law Offices of Jane Doe": "Jane Doe", "Garcia Law Group": "Garcia"}
    for name, short in cases.items():
        assert store.short_name(name) == short


def test_practice_plans_plug_in(home):
    run("client", "new", "https://doe-family.example/", "--manual", "--name", "Doe Family Law")
    run("client", "set", "doe", "practice_area=Family law")
    out = run("campaign", "new", "doe", "--name", "Default plan")
    assert out["plan"] == "six_month_plan.csv" and "no six-month plan written for Family law" in out["plan_note"]
    plan_dir = home / "LawRank Studio" / "plan"; plan_dir.mkdir(parents=True, exist_ok=True)
    src = campaign.plan_file(None)[0].read_text(encoding="utf-8-sig").splitlines()
    rows = [src[0]] + [re.sub(r"Who We Are & Who We Help", "Divorce basics", l) for l in src[1:4]]
    (plan_dir / "six_month_plan_family-law.csv").write_text("\n".join(rows) + "\n", encoding="utf-8")
    out = run("campaign", "new", "doe", "--name", "Family plan")
    assert out["plan"] == "six_month_plan_family-law.csv" and "plan_note" not in out and out["posts"] == 3
    assert read_json(Path(out["folder"]) / "posts" / "PI-001.json")["topic"] == "Divorce basics"


def test_test_designs_use_approved_or_neutral_copy_only(mcminn):
    run("directions", "mcminn")
    opts = [o for f in sorted((mcminn.campaigns_dir / "Test designs" / "posts").glob("DIR-*.json")) for o in read_json(f)["options"]]
    heads = {o["copy"].get("headline") for o in opts if o["copy"].get("headline")}
    assert "Helping the Injured Get Justice." in heads                       # the firm's approved tagline fact
    assert all("tagline" in o["facts"] for o in opts if o["copy"].get("headline") == "Helping the Injured Get Justice.")
    assert not any(h in str(opts) for h in ("Our promise", "Straight answers", "Here when you need answers"))
    assert not any(o["copy"].get("cta") == "Free consultation" for o in opts)  # McMinn's fees fact isn't approved


def test_third_party_logos_are_never_picked(monkeypatch):
    from types import SimpleNamespace
    from lrstudio import onboard
    site = SimpleNamespace(url="https://aldersandlewellyn.com/", final_url="https://aldersandlewellyn.com/", logos=[
        {"url": "https://cdn.trustindex.io/assets/platform/Google/logo.svg", "where": "page", "alt": "", "w": 120},
        {"url": "https://aldersandlewellyn.com/wp-content/uploads/aldersandlewellyn-logo.png", "where": "header", "alt": "", "w": 400}])
    fetched = []

    def fake_download(url, referer=None):
        fetched.append(url)
        return (b"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'/>", "image/svg+xml") if url.endswith(".svg") else (b"PNG", "image/png")
    monkeypatch.setattr(onboard, "download", fake_download)
    best = onboard.pick_logo(site)
    assert best["url"].endswith("aldersandlewellyn-logo.png") and not any("trustindex" in u for u in fetched)


def test_small_text_reads_on_a_light_accent():
    from lrstudio import theme
    from lrstudio.extract import contrast
    t = theme.treatments({"colors": {"ink": "#344952", "accent": "#C9A977", "paper": "#F4F4F4"}})["accent"]
    assert contrast(t["fg"], "#C9A977") >= 4.5
