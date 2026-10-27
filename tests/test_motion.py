"""Step 5: motion storyboards -> voiced preview -> MP4 only after approval."""
import json
import shutil
import subprocess
from pathlib import Path

import pytest
from openpyxl import load_workbook

from conftest import run
from lrstudio import motion, store, tools
from lrstudio.util import read_json, write_json

MCMINN_OLD = Path("/home/user/lawrank-creative-studio/engine/template/clients/mcminn")


def storyboard():
    old = json.loads((MCMINN_OLD / "content.json").read_text())["motion"][0]
    o = {k: v for k, v in old.items() if k not in ("id", "title")}
    o.update(key="A", template="motion", caption="After a crash, McMinn Law Firm helps you find the way forward.",
             alt="Animated map of the steps the firm takes.")
    return o


def test_storyboard_rules():
    o = {"family": "journey", "voice": "am_michael", "lines": [{"id": "hook", "say": "We recovered $4.2 million."}],
         "screen": {"end": "x"}}
    errs = " ".join(motion.check_storyboard("PI-006", o))
    assert "spoken" in errs and "screen.cta" in errs
    assert "family must be" in " ".join(motion.check_storyboard("PI-006", dict(o, family="nope")))
    issues = motion.lint({"lines": [{"id": "hook", "say": "We guarantee a win."}], "screen": {"end": "Best lawyers in Texas"}}, {})
    assert {i["rule"] for i in issues} >= {"guarantee", "superlative"}


@pytest.mark.slow
def test_preview_then_mp4_without_waiting_for_approval(home):
    if not MCMINN_OLD.exists() or not tools.model("kokoro/voices-v1.0.bin", required=False):
        pytest.skip("needs the internal test client and the voice model")
    run("client", "import", str(MCMINN_OLD))
    run("client", "set", "mcminn", "package=authority")
    camp = run("campaign", "new", "mcminn")
    d = Path(camp["folder"])
    p = read_json(d / "posts" / "PI-006.json"); assert p["format"] == "motion"
    p["options"] = [storyboard()]; write_json(d / "posts" / "PI-006.json", p)
    out = run("build", "mcminn", "--post", "PI-006")
    assert out["ok"], out
    assert (d / "previews" / "PI-006-A-motion.html").exists() and (d / "images" / "PI-006-A-motion.png").exists()
    html = (d / "previews" / "PI-006-A-motion.html").read_text()
    assert "data:audio/mpeg;base64," in html and "file://" not in html          # one self-contained, shareable file
    again = run("build", "mcminn", "--post", "PI-006")
    assert again["redrawn"] == 0                                                  # cached: no re-voicing
    vid = run("video", "mcminn")                                                 # no review.xlsx step needed
    assert vid["ok"] and len(vid["videos"]) == 1 and len(vid["videos"][0]["files"]) == 2
    for f in vid["videos"][0]["files"]:
        probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_name,width,height", "-of", "json", str(d / f)],
                               capture_output=True, text=True, env=tools.node_env())
        streams = json.loads(probe.stdout)["streams"]
        assert {s["codec_name"] for s in streams} == {"h264", "aac"}
        assert (streams[0]["width"], streams[0]["height"]) in ((1080, 1920), (1080, 1350))
    again = run("video", "mcminn")
    assert not again["videos"] and again["up_to_date"] == ["PI-006 A"]          # kept, not rendered twice
    pkg = run("package", "mcminn", "--month", "1")
    assert pkg["ok"] and not pkg["videos_rendered"]                              # already current: packaged as is
    import zipfile
    posts_zip = next(f for f in pkg["files"] if f.endswith("Posts.zip"))
    assert {"PI-006/PI-006-A-9x16.mp4", "PI-006/PI-006-A-4x5.mp4"} <= set(zipfile.ZipFile(posts_zip).namelist())


def test_the_options_that_go_out_without_or_with_review_xlsx():
    post = {"id": "PI-006", "options": [{"key": "A"}, {"key": "B"}, {"key": "C"}]}
    keys = lambda st: [o["key"] for o in motion.pick_options(st, post)]
    assert keys({}) == ["A", "B", "C"]                                            # no sheet, or nothing marked: all of them
    assert keys({("PI-006", "B"): {"status": "Approved"}}) == ["B"]               # the approved one wins
    assert keys({("PI-006", "C"): {"status": "Rejected"}}) == ["A", "B"]          # rejected never goes out


def test_families_are_documented_through_lr():
    out = run("templates", "motion")
    fams = {f["family"]: f for f in out["families"]}
    assert set(fams) == {"journey", "shield", "weight", "flip", "scenes"}
    assert {"kinetic", "chat", "checklist", "end"} <= set(fams["scenes"]["scenes"]) and set(fams["scenes"]["looks"]) == {"thread", "flat", "cards", "silhouette"}
    for f in fams.values():
        assert "screen" in f["how_it_works"] and f["example"]["lines"] and not motion.check_storyboard("X", f["example"])
        assert "free" not in json.dumps(f["example"]).lower()
