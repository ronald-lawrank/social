"""Which voice reads the narration, on this laptop.

  elevenlabs  most natural; exact word sync from the service (key needed, paid per character)
  openai      natural, cheap; word sync from OpenAI's transcription (key needed)
  chatterbox  free, private, runs here (one-time install, about 3 GB; slower)
  kokoro      built in; the fallback for all of them

Keys stay on this laptop in ~/.lawrank-studio/keys.json (readable only by you), never in a client folder or the
Drive. The order when nothing is chosen: ElevenLabs if it has a key, then OpenAI, then Chatterbox, then Kokoro.
"""
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

from . import paths
from .util import LRError, say

PROVIDERS = ("elevenlabs", "openai", "chatterbox", "kokoro")
ENV_KEYS = {"elevenlabs": "ELEVENLABS_API_KEY", "openai": "OPENAI_API_KEY"}
ABOUT = {"elevenlabs": "ElevenLabs: the most natural read, exact word sync (paid per character)",
         "openai": "OpenAI voices: natural and cheap, word sync from a transcription",
         "chatterbox": "Chatterbox: free and private, runs on this laptop (slower)",
         "kokoro": "Kokoro: built in, quick, a little flat (the fallback for every voice)"}


def _keys_path() -> Path:
    return paths.STATE / "keys.json"


def keys() -> dict:
    try:
        k = json.loads(_keys_path().read_text())
    except (OSError, ValueError):
        k = {}
    for p, env in ENV_KEYS.items():                   # a key in the environment wins
        if os.environ.get(env):
            k[p] = os.environ[env]
    return k


def set_key(provider: str, key: str) -> dict:
    if provider not in ENV_KEYS:
        raise LRError(f"{provider} doesn't take a key", fix="Keys are for: " + ", ".join(ENV_KEYS))
    k = {}
    try:
        k = json.loads(_keys_path().read_text())
    except (OSError, ValueError):
        pass
    key = (key or "").strip()
    if key:
        k[provider] = key
    else:
        k.pop(provider, None)
    _keys_path().parent.mkdir(parents=True, exist_ok=True)
    _keys_path().write_text(json.dumps(k, indent=1))
    try:
        os.chmod(_keys_path(), 0o600)
    except OSError:
        pass
    return status()


def chatterbox_python() -> Path | None:
    venv = paths.STATE / "chatterbox"
    py = venv / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    return py if py.exists() and (venv / ".ready").exists() else None


def available() -> dict:
    k = keys()
    return {"elevenlabs": bool(k.get("elevenlabs")), "openai": bool(k.get("openai")),
            "chatterbox": bool(chatterbox_python()), "kokoro": True}


def chosen() -> str:
    """The voice to use now: the one picked with `lr voice use`, if it's ready, else the best one that is."""
    av, pick = available(), paths.settings().get("voice_provider")
    if pick in av and av[pick]:
        return pick
    return next(p for p in PROVIDERS if av[p])


def env(provider: str | None = None) -> dict:
    """What voice.py needs to reach the chosen voice."""
    out, k = {}, keys()
    for p, var in ENV_KEYS.items():
        if k.get(p):
            out[var] = k[p]
    py = chatterbox_python()
    if py:
        out["LR_CHATTERBOX_PY"] = str(py)
    s = paths.settings()
    for name, var in (("elevenlabs_voice", "LR_ELEVENLABS_VOICE"), ("elevenlabs_model", "LR_ELEVENLABS_MODEL"),
                      ("openai_voice", "LR_OPENAI_VOICE"), ("openai_tts_model", "LR_OPENAI_TTS_MODEL")):
        if s.get(name):
            out[var] = s[name]
    return out


def status() -> dict:
    av, now = available(), chosen()
    return {"ok": True, "voice": now, "about": ABOUT[now], "ready": av, "picked": paths.settings().get("voice_provider"),
            "options": {p: ABOUT[p] + ("" if av[p] else {"elevenlabs": " — add a key: lr voice key elevenlabs <key>",
                                                         "openai": " — add a key: lr voice key openai <key>",
                                                         "chatterbox": " — install: lr voice install chatterbox"}.get(p, ""))
                        for p in PROVIDERS},
            "music": "on" if paths.settings().get("music", True) else "off"}


def use(provider: str) -> dict:
    if provider not in PROVIDERS:
        raise LRError(f"unknown voice {provider}", fix="Choose one of: " + ", ".join(PROVIDERS))
    paths.save_settings(voice_provider=provider)
    res = status()
    if res["voice"] != provider:
        res["warning"] = f"{provider} isn't ready on this laptop yet, so {res['voice']} reads until it is: " + res["options"][provider]
    return res


def set_music(on: bool) -> dict:
    paths.save_settings(music=on)
    return status()


def _python_for_torch() -> list[str]:
    """Chatterbox needs a Python that torch supports (3.10-3.12). uv fetches one if this laptop has none."""
    for v in ("3.11", "3.12", "3.10"):
        exe = shutil.which(f"python{v}")
        if exe:
            return [exe]
    if sys.version_info[:2] in ((3, 10), (3, 11), (3, 12)):
        return [sys.executable]
    return []


def install_chatterbox() -> dict:
    venv = paths.STATE / "chatterbox"
    uv = shutil.which("uv")
    base = _python_for_torch()
    say("Installing Chatterbox (one time, about 3 GB) ...")
    try:
        if uv:
            subprocess.run([uv, "venv", "-q", "-p", base[0] if base else "3.11", str(venv)], check=True, capture_output=True, text=True)
            pip = [uv, "pip", "install", "-q", "--python", str(venv / ("Scripts/python.exe" if os.name == "nt" else "bin/python"))]
        elif base:
            subprocess.run(base + ["-m", "venv", str(venv)], check=True, capture_output=True, text=True)
            pip = [str(venv / ("Scripts/python.exe" if os.name == "nt" else "bin/python")), "-m", "pip", "install", "-q"]
        else:
            raise LRError("Chatterbox needs Python 3.10, 3.11 or 3.12 on this laptop",
                          fix="Install Python 3.11 from python.org (or `brew install uv`), then run `lr voice install chatterbox` again.")
        subprocess.run(pip + ["chatterbox-tts", "soundfile"], check=True, capture_output=True, text=True)
        py = venv / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
        say("Downloading the Chatterbox voice model ...")
        subprocess.run([str(py), "-c", "from chatterbox.tts import ChatterboxTTS; ChatterboxTTS.from_pretrained(device='cpu')"],
                       check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        raise LRError("Chatterbox didn't install: " + (e.stderr or e.stdout or "")[-400:],
                      fix="Check the internet connection and run `lr voice install chatterbox` again; Kokoro keeps reading meanwhile.")
    (venv / ".ready").write_text("ok")
    return status()
