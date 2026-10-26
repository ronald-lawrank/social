"""Motion regressions from onboarding a family-law firm (October 2026): the voiceover crashed on released kokoro-onnx,
the car-crash families were offered to every practice, and the logo cue word came out as "The"."""
import importlib.util
import json
import os
import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest

from lrstudio import motion, paths

VOICE_PY = paths.BUNDLED_MOTION / "voice.py"


def _voice_module():
    spec = importlib.util.spec_from_file_location("lr_voice", VOICE_PY)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


class Kokoro047:
    """The released kokoro-onnx 0.4.7 signature: no sentence_pause / clause_pause."""
    class tokenizer:
        @staticmethod
        def phonemize(w):
            return w

    def create(self, text, voice, speed=1.0, lang="en-us", is_phonemes=False, trim=True):
        sr, out = 24000, []
        for _ in [s for s in text.split(".") if s.strip()]:
            t = np.arange(int(sr * .5)) / sr
            out += [0.3 * np.sin(2 * np.pi * 220 * t), np.zeros(int(sr * .25))]
        return np.concatenate(out[:-1]).astype(np.float32), sr


def test_voice_only_passes_arguments_kokoro_accepts(tmp_path, monkeypatch):
    voice = _voice_module()
    assert voice.create_args(Kokoro047(), voice="af_heart", speed=1.0, lang="en-us", sentence_pause=.3, clause_pause=.1) == \
        {"voice": "af_heart", "speed": 1.0, "lang": "en-us"}
    monkeypatch.setattr(voice, "load", Kokoro047)
    for exact in (False, True):
        script = tmp_path / f"script{exact}.json"
        script.write_text(json.dumps({"voice": "af_heart", "speed": 1.04, "sentence_pause": .24, "clause_pause": .1,
                                      "exact_sentences": exact, "lines": [{"id": "hook", "say": "Facing divorce. Talk to Ben Carrasco."}]}))
        T = voice.run(str(script), str(tmp_path / f"out{exact}"))
        assert T["lines"][0]["id"] == "hook" and len(T["lines"][0]["sentences"]) == 2 and (tmp_path / f"out{exact}" / "hook.wav").exists()


def _kokoro_dir():
    for d in (paths.MODELS / "kokoro", Path.home() / ".lawrank-studio" / "models" / "kokoro"):
        if (d / "kokoro-v1.0.fp16.onnx").exists() and (d / "voices-v1.0.bin").exists():
            return d
    return None


def test_voice_py_reads_a_one_line_script_with_the_installed_kokoro(tmp_path):
    kd = _kokoro_dir()
    if not kd:
        pytest.skip("needs the Kokoro voice model (lr setup)")
    script = tmp_path / "script.json"
    script.write_text(json.dumps({"voice": "af_heart", "speed": 1.04, "sentence_pause": .24, "clause_pause": .1, "exact_sentences": True,
                                  "lines": [{"id": "hook", "say": "Facing divorce? Ben Carrasco can help."}]}))
    r = subprocess.run([sys.executable, str(VOICE_PY), str(script), str(tmp_path / "out")], capture_output=True, text=True,
                       env=dict(os.environ, LR_KOKORO_DIR=str(kd)), timeout=300)
    assert r.returncode == 0, r.stderr[-600:]
    T = json.loads((tmp_path / "out" / "timing.json").read_text())
    assert T["lines"][0]["d"] > 1 and (tmp_path / "out" / "hook.wav").stat().st_size > 10_000


def test_car_crash_families_are_for_injury_firms_only():
    assert motion.fits_practice("journey", "Personal injury") and motion.fits_practice("journey", "Car accidents")
    assert not motion.fits_practice("journey", "Family law") and motion.fits_practice("flip", "Family law")
    assert motion.fits_practice("weight", None)                                   # unknown practice: no filter
    fam = motion.families_detail(None, "Family law")
    assert [f["family"] for f in fam["families"]] == ["flip"]
    assert set(fam["not_for_this_practice"]) == {"journey", "shield", "weight"} and "flip" in fam["practice_note"]
    every = motion.families_detail()
    assert {f["family"]: f["practice"] for f in every["families"]}["shield"] == "personal injury only"
    o = {"family": "journey", "lines": [{"id": "hook", "say": "Hi."}], "screen": {"end": "x", "cta": "y"}}
    assert any("car crash" in e for e in motion.check_storyboard("FL-006", o, "Family law"))
    assert not any("car crash" in e for e in motion.check_storyboard("PI-006", o, "Personal injury"))


def test_the_logo_cue_word_is_a_spoken_part_of_the_firm_name():
    o = {"lines": [{"id": "hook", "say": "Facing divorce? Call Ben Carrasco today."}]}
    assert motion.brand_word({"short": "The", "name": "The Law Office of Ben Carrasco, PLLC"}, o) == "Carrasco"
    assert motion.brand_word({"short": "Ben Carrasco", "name": "x"}, o) == "Carrasco"
    assert motion.brand_word({"short": "McMinn"}, {"lines": [{"id": "hook", "say": "Hurt? Call the firm."}]}) == "McMinn"
