"""The composed-video scene library: every scene is documented, loads, and draws in the looks without page errors."""
import json
import subprocess
import sys
from pathlib import Path

import pytest

from lrstudio import motion

ROOT = Path(__file__).resolve().parents[1]
MCMINN_OLD = Path("/home/user/lawrank-creative-studio/engine/template/clients/mcminn")


def test_every_scene_is_documented_for_writers():
    cat = motion.catalog()
    assert not cat.get("broken"), cat.get("broken")
    assert set(cat["looks"]) == {"thread", "flat", "cards", "silhouette"} and {"thread", "wipe", "stack", "cut", "tunnel", "ink"} <= set(cat["transitions"])
    for k, s in cat["scenes"].items():
        assert s["label"] and s["about"], k
        if k != "end":
            assert s["fields"] and s["example"] and s["example"].get("say"), f"{k}: needs fields and an example with its narration line"
            assert s["practice"] == "any" or isinstance(s["practice"], list), k
            assert "free" not in json.dumps(s["example"]).lower(), f"{k}: example offers something free"


def test_composed_storyboards_are_checked():
    ex = json.loads((motion.MOTION / "examples" / "scenes.json").read_text())
    assert motion.check_storyboard("PI-006", ex, "Personal injury") == []
    bad = dict(ex, look="neon", screen=dict(ex["screen"], scenes=[{"type": "nope", "line": "b1"}, {"type": "kinetic", "line": "zz", "in": "swirl"}]))
    errs = " ".join(motion.check_storyboard("PI-006", bad))
    assert '"in" must be one of' in errs
    assert "look must be" in errs and "isn't in the library" in errs and "isn't in lines" in errs and "last scene" in errs and "hook" in errs


def test_motion_variety_flags_repeats():
    ex = json.loads((motion.MOTION / "examples" / "scenes.json").read_text())
    posts = [{"id": "PI-006", "format": "motion", "month": 1, "options": [ex, dict(ex, key="B")]},
             {"id": "PI-007", "format": "motion", "month": 1, "options": [dict(ex, screen=dict(ex["screen"], scenes=[ex["screen"]["scenes"][i] for i in (0, 2, 3)]))]},
             {"id": "PI-014", "format": "motion", "month": 2, "options": [dict(ex, look="flat")]}]
    out = " ".join(motion.variety(posts))
    assert "repeats PI-006 A" in out and "share cards" in out and "PI-007 A opens like PI-006" in out and "PI-014" not in out


@pytest.mark.slow
def test_every_scene_draws_in_a_look_without_errors(tmp_path):
    """Every scene's own example, each in one look (rotating through the four), through the real preview page."""
    if not MCMINN_OLD.exists():
        pytest.skip("needs the internal test client")
    sys.path.insert(0, str(ROOT / "dev"))
    import motion_catalog as mc
    c, cat = mc.client(), motion.catalog()
    bad = {}
    for i, (k, s) in enumerate(sorted(x for x in cat["scenes"].items() if x[0] != "end")):
        look = cat["looks"][i % len(cat["looks"])]
        rep = mc.run_one(c, mc.scene_storyboard(k, s, look), tmp_path / k / f"{look}.html", s["label"], qa=False)
        if rep.get("error") or rep.get("page_errors"):
            bad[f"{k}/{look}"] = rep.get("error") or rep.get("page_errors")
    assert not bad, bad


def test_examples_a_writer_copies_pass_the_compliance_check():
    """Writers start from these examples: they must build for a firm with no facts yet, except the scenes that
    exist to show an approved fact (a number, a rating), whose examples say so."""
    sys.path.insert(0, str(ROOT / "dev"))
    import motion_catalog as mc
    cat = motion.catalog()
    needs_facts = {"counter", "stars"}
    for k, s in cat["scenes"].items():
        if k == "end":
            continue
        blocks = [i["msg"] for i in motion.lint(dict(mc.scene_storyboard(k, s, "cards"), family="scenes", key="A"), {})
                  if i["level"] == "block"]
        if k in needs_facts:
            assert "approved" in json.dumps(s["fields"]).lower() + s.get("good", "").lower(), k
        else:
            assert not blocks, (k, blocks)
    ex = json.loads((motion.MOTION / "examples" / "scenes.json").read_text())
    assert [i for i in motion.lint(ex, {}) if i["level"] == "block"] == []
