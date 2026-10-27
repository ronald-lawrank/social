"""Voice providers: each one ends in the same timing.json; a failing voice falls back to Kokoro and says why;
keys stay on this laptop; the music bed is generated and dips under the voice."""
import base64
import importlib.util
import json
import sys

import numpy as np
import pytest

from lrstudio import motion, paths, voices

MOTION = paths.BUNDLED_MOTION


def _mod(name):
    sys.path.insert(0, str(MOTION))
    spec = importlib.util.spec_from_file_location(f"lr_{name}", MOTION / f"{name}.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


class FakeKokoro:
    class tokenizer:
        @staticmethod
        def phonemize(w):
            return w

    def create(self, text, voice, speed=1.0, lang="en-us", is_phonemes=False, trim=True):
        sr, out = 24000, []
        for _ in [s for s in text.replace("?", ".").split(".") if s.strip()]:
            t = np.arange(int(sr * .5)) / sr
            out += [0.3 * np.sin(2 * np.pi * 220 * t), np.zeros(int(sr * .25))]
        return np.concatenate(out[:-1]).astype(np.float32), sr


def _speech(words, sr=24000, per=.3):
    """Fake speech: a tone per word, with a gap after each sentence. Returns audio and each word's start time."""
    a, times, t = [], [], .1
    a.append(np.zeros(int(sr * .1)))
    for w in words:
        times.append(t); n = int(sr * per); a.append(.3 * np.sin(2 * np.pi * 200 * np.arange(n) / sr)); t += per
        g = .35 if w[-1] in ".?!" else .04; a.append(np.zeros(int(sr * g))); t += g
    return np.concatenate(a).astype(np.float32), times


SCRIPT = {"voice": "af_heart", "speed": 1.04, "sentence_pause": .24, "exact_sentences": True,
          "lines": [{"id": "hook", "say": "Hurt in a crash? Call Ben Carrasco today."}, {"id": "cta", "say": "Talk to our team.", "gap": .45}]}


def test_elevenlabs_word_times_come_from_the_service(tmp_path, monkeypatch):
    v = _mod("voice")
    monkeypatch.setenv("ELEVENLABS_API_KEY", "test")
    calls = []

    def http(url, data=None, headers=None, timeout=120, raw=False):
        body = json.loads(data); calls.append((url, body))
        words = body["text"].split(); a, times = _speech(words)
        chars, starts = [], []
        for w, t in zip(words, times):
            for j, ch in enumerate(w):
                chars.append(ch); starts.append(t + j * .02)
            chars.append(" "); starts.append(t + .25)
        return {"audio_base64": base64.b64encode((a * 32767).astype("<i2").tobytes()).decode(),
                "alignment": {"characters": chars, "character_start_times_seconds": starts}}
    monkeypatch.setattr(v, "_http", http)
    (tmp_path / "s.json").write_text(json.dumps(dict(SCRIPT, provider="elevenlabs")))
    T = v.run(str(tmp_path / "s.json"), str(tmp_path / "out"))
    assert T["provider"] == "elevenlabs" and not T.get("fallback")
    assert "EXAVITQu4vr4xnSDxMaL" in calls[0][0] and "with-timestamps" in calls[0][0]
    hook = T["lines"][0]
    assert [s["text"] for s in hook["sentences"]] == ["Hurt in a crash?", "Call Ben Carrasco today."]
    w = {x["w"]: x["t"] for x in hook["words"]}
    # word times survive trimming the lead-in silence: "Call" starts after the 4 words and a sentence pause
    assert abs((w["Call"] - w["Hurt"]) - (4 * .3 + 3 * .04 + .35)) < .05
    assert hook["sentences"][1]["t"] == w["Call"]
    assert T["lines"][1]["t"] > hook["end"] and (tmp_path / "out" / "cta.wav").exists()


def test_openai_word_times_come_from_a_transcription(tmp_path, monkeypatch):
    v = _mod("voice")
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    said = {}

    def http(url, data=None, headers=None, timeout=120, raw=False):
        if url.endswith("/audio/speech"):
            body = json.loads(data); words = body["input"].split()
            a, times = _speech(words); said["words"], said["times"] = words, times
            assert body["voice"] == "coral" and body["response_format"] == "pcm"
            return (a * 32767).astype("<i2").tobytes()
        assert url.endswith("/audio/transcriptions") and b"timestamp_granularities" in data
        # the transcriber hears "Carrasco" as "Karasko": that word is placed between its neighbours
        heard = [{"word": "Karasko" if w == "Carrasco" else w.strip(".?!"), "start": t} for w, t in zip(said["words"], said["times"])]
        return {"words": heard}
    monkeypatch.setattr(v, "_http", http)
    (tmp_path / "s.json").write_text(json.dumps(dict(SCRIPT, provider="openai")))
    T = v.run(str(tmp_path / "s.json"), str(tmp_path / "out"))
    assert T["provider"] == "openai"
    w = [x["t"] for x in T["lines"][0]["words"]]
    assert w == sorted(w) and len(w) == 8


def test_a_voice_that_fails_falls_back_to_kokoro_and_says_why(tmp_path, monkeypatch):
    v = _mod("voice")
    monkeypatch.setattr(v, "load", FakeKokoro)
    monkeypatch.delenv("ELEVENLABS_API_KEY", raising=False)
    (tmp_path / "s.json").write_text(json.dumps(dict(SCRIPT, provider="elevenlabs")))
    T = v.run(str(tmp_path / "s.json"), str(tmp_path / "out"))
    assert T["provider"] == "kokoro" and "no ElevenLabs key" in T["fallback"][0]
    monkeypatch.delenv("LR_CHATTERBOX_PY", raising=False)
    (tmp_path / "c.json").write_text(json.dumps(dict(SCRIPT, provider="chatterbox")))
    T = v.run(str(tmp_path / "c.json"), str(tmp_path / "out2"))
    assert T["provider"] == "kokoro" and "lr voice install chatterbox" in T["fallback"][0]


def test_match_words_fills_words_the_transcriber_misheard():
    v = _mod("voice")
    out = v.match_words("Call Ben Carrasco today.", [{"w": "Call", "t": .1}, {"w": "Ben", "t": .4}, {"w": "Karasko", "t": .7},
                                                     {"w": "today", "t": 1.2}], 1.6)
    assert [x["t"] for x in out] == [.1, .4, .8, 1.2]


def test_keys_stay_on_this_laptop_and_pick_the_best_voice(tmp_path, monkeypatch):
    monkeypatch.setattr(paths, "STATE", tmp_path)
    monkeypatch.setenv("LR_STATE_DIR", str(tmp_path))
    for k in ("ELEVENLABS_API_KEY", "OPENAI_API_KEY"):
        monkeypatch.delenv(k, raising=False)
    assert voices.chosen() == "kokoro"
    voices.set_key("openai", "sk-test")
    assert voices.chosen() == "openai" and voices.env()["OPENAI_API_KEY"] == "sk-test"
    assert (tmp_path / "keys.json").stat().st_mode & 0o077 == 0
    voices.set_key("elevenlabs", "el-test")
    assert voices.chosen() == "elevenlabs"
    r = voices.use("chatterbox")
    assert r["voice"] == "elevenlabs" and "install" in r["warning"]       # picked but not installed: the best ready one reads
    voices.use("kokoro")
    assert voices.chosen() == "kokoro"
    voices.set_key("elevenlabs", "")
    assert "elevenlabs" not in json.loads((tmp_path / "keys.json").read_text())


def test_music_beds_are_generated_and_dip_under_the_voice():
    m = _mod("music")
    sr = 24000
    for mood in m.MOODS:
        x = m.bed(mood, 6, sr)
        assert len(x) == 6 * sr and np.isfinite(x).all() and .99 < np.abs(x).max() <= 1.0
        assert np.abs(x[:int(.05 * sr)]).max() < .2 and np.abs(x[-int(.05 * sr):]).max() < .05     # fades in and out
    voice = np.zeros(4 * sr, np.float32); voice[sr:2 * sr] = .3 * np.sin(np.arange(sr) / 3)
    g = m.duck(voice, sr)
    assert g[int(1.5 * sr)] < .5 and g[int(.5 * sr)] > .99 and g[int(3.9 * sr)] > .9


def test_storyboard_music_is_checked():
    ex = json.loads((MOTION / "examples" / "scenes.json").read_text())
    assert motion.check_storyboard("PI-006", dict(ex, music="hopeful")) == []
    assert "music must be" in " ".join(motion.check_storyboard("PI-006", dict(ex, music="dubstep")))
    mix = _mod("mix")
    assert mix.mood_for({"look": "silhouette"}) == "serious" and mix.mood_for({"music": "none"}) == "none"


FAKE_CHATTERBOX = '''#!{py}
import json, sys, numpy as np, soundfile as sf
from pathlib import Path
job = json.loads(Path(sys.argv[2]).read_text())
Path(job["out"], "job.seen.json").write_text(json.dumps(job))
for i, t in enumerate(job["texts"]):
    n = int(24000 * .08 * len(t.split()))
    sf.write(Path(job["out"]) / f"{{i}}.wav", (.3 * np.sin(np.arange(n) / 4)).astype("float32"), 24000)
'''


def test_chatterbox_reads_each_sentence_once_in_the_persona(tmp_path, monkeypatch):
    v = _mod("voice")
    fake = tmp_path / "py"; fake.write_text(FAKE_CHATTERBOX.format(py=sys.executable)); fake.chmod(0o755)
    monkeypatch.setenv("LR_CHATTERBOX_PY", str(fake))
    voices_dir = tmp_path / "Voices"; voices_dir.mkdir()
    (voices_dir / "am_michael.wav").write_bytes(b"x")                     # the firm's own narrator sample
    monkeypatch.setenv("LR_VOICES_DIR", str(voices_dir))
    seen = []
    real = v.ChatterboxVoice.prefetch
    monkeypatch.setattr(v.ChatterboxVoice, "prefetch", lambda self, texts: (seen.append((texts, self.reference())), real(self, texts))[1])
    for voice, ref in (("am_michael", str(voices_dir / "am_michael.wav")), ("af_heart", None)):
        (tmp_path / "s.json").write_text(json.dumps(dict(SCRIPT, voice=voice, provider="chatterbox")))
        T = v.run(str(tmp_path / "s.json"), str(tmp_path / voice))
        assert T["provider"] == "chatterbox" and not T.get("fallback")
        assert seen[-1] == (["Hurt in a crash?", "Call Ben Carrasco today.", "Talk to our team."], ref)   # one worker run
        hook = T["lines"][0]
        assert [s["text"] for s in hook["sentences"]] == ["Hurt in a crash?", "Call Ben Carrasco today."]
        assert hook["sentences"][1]["t"] > hook["sentences"][0]["end"]


def test_chatterbox_is_the_studio_voice_once_installed(tmp_path, monkeypatch):
    monkeypatch.setattr(paths, "STATE", tmp_path)
    monkeypatch.setenv("LR_STATE_DIR", str(tmp_path))
    for k in ("ELEVENLABS_API_KEY", "OPENAI_API_KEY"):
        monkeypatch.delenv(k, raising=False)
    voices.set_key("openai", "sk-test")
    assert voices.chosen() == "openai"
    py = tmp_path / "chatterbox" / "bin" / "python"; py.parent.mkdir(parents=True); py.write_text("")
    assert voices.chosen() == "openai"                                       # half-installed doesn't count
    (tmp_path / "chatterbox" / ".ready").write_text("ok")
    assert voices.chosen() == "chatterbox" and voices.install_chatterbox_background() == "ready"
    (tmp_path / "chatterbox" / ".ready").unlink()
    assert voices.install_chatterbox_background() == "not installed"        # tests never start the real download
