"""Which voice reads the narration, on this laptop.

  chatterbox  the studio's voice: free, private, natural; runs here (`lr setup` installs it, about 3 GB)
  elevenlabs  most natural; exact word sync from the service (key needed, paid per character)
  openai      natural, cheap; word sync from OpenAI's transcription (key needed)
  kokoro      built in; the fallback for all of them

Keys stay on this laptop in ~/.lawrank-studio/keys.json (readable only by you), never in a client folder or the
Drive. The order when nothing is chosen: Chatterbox once installed, then ElevenLabs or OpenAI if they have a key,
then Kokoro.
"""
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

from . import paths
from .util import LRError, say

PROVIDERS = ("chatterbox", "elevenlabs", "openai", "kokoro")
ENV_KEYS = {"elevenlabs": "ELEVENLABS_API_KEY", "openai": "OPENAI_API_KEY"}
ABOUT = {"chatterbox": "Chatterbox: the studio's voice, free and private, runs on this laptop",
         "elevenlabs": "ElevenLabs: the most natural read, exact word sync (paid per character)",
         "openai": "OpenAI voices: natural and cheap, word sync from a transcription",
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
    h = paths.home(required=False)
    if h:
        out["LR_VOICES_DIR"] = str(h / paths.STUDIO_DIR / "Voices")      # a firm's own narrator sample, if they add one
    for name, var in (("chatterbox_model", "LR_CHATTERBOX_MODEL"), ("elevenlabs_voice", "LR_ELEVENLABS_VOICE"), ("elevenlabs_model", "LR_ELEVENLABS_MODEL"),
                      ("openai_voice", "LR_OPENAI_VOICE"), ("openai_tts_model", "LR_OPENAI_TTS_MODEL")):
        if s.get(name):
            out[var] = s[name]
    return out


def status() -> dict:
    av, now = available(), chosen()
    return {"ok": True, "voice": now, "about": ABOUT[now], "ready": av, "picked": paths.settings().get("voice_provider"),
            "options": {p: ABOUT[p] + ("" if av[p] else {"elevenlabs": " — add a key: lr voice key elevenlabs <key>",
                                                         "openai": " — add a key: lr voice key openai <key>",
                                                         "chatterbox": " — installing in the background (a few minutes)"
                                                         if _installing() else " — install: lr voice install chatterbox"}.get(p, ""))
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


def _uv() -> str | None:
    """uv makes the Chatterbox Python (and fetches Python 3.11 if this laptop has none). Taken from the studio's
    own Python when it isn't installed."""
    uv = shutil.which("uv")
    if uv:
        return uv
    venv = paths.STATE / "venv"
    py = venv / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    exe = venv / ("Scripts/uv.exe" if os.name == "nt" else "bin/uv")
    if not exe.exists():
        r = subprocess.run([str(py if py.exists() else sys.executable), "-m", "pip", "install", "-q", "uv"], capture_output=True, text=True)
        if r.returncode:
            return None
    return str(exe) if exe.exists() else None


CHATTERBOX = "chatterbox-tts==0.1.7"


def _installing() -> bool:
    lock = paths.STATE / "chatterbox-installing"
    try:
        pid = int(lock.read_text())
        os.kill(pid, 0)
        return True
    except (OSError, ValueError):
        return False


def install_chatterbox_background() -> str:
    """Start the Chatterbox install without waiting for it (it's a big download): setup returns at once and Kokoro
    reads until it's done. The log is ~/.lawrank-studio/chatterbox-install.log."""
    if chatterbox_python():
        return "ready"
    if _installing():
        return "installing"
    if os.environ.get("LR_NO_AUTO_INSTALL"):
        return "not installed"
    paths.STATE.mkdir(parents=True, exist_ok=True)
    venv_py = paths.STATE / "venv" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    log = open(paths.STATE / "chatterbox-install.log", "w")
    kw = {"creationflags": 0x00000008 | 0x00000200} if os.name == "nt" else {"start_new_session": True}
    p = subprocess.Popen([str(venv_py if venv_py.exists() else sys.executable), str(paths.SCRIPTS / "lr.py"), "voice", "install", "chatterbox"],
                         stdout=log, stderr=log, stdin=subprocess.DEVNULL, cwd=str(paths.SCRIPTS), **kw)
    (paths.STATE / "chatterbox-installing").write_text(str(p.pid))
    return "installing"


def install_chatterbox() -> dict:
    venv = paths.STATE / "chatterbox"
    py = venv / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    if chatterbox_python():
        return status()
    uv = _uv()
    if not uv:
        raise LRError("Chatterbox couldn't be set up (the installer, uv, didn't download)",
                      fix="Check the internet connection and run `lr voice install chatterbox` again; Kokoro reads meanwhile.")
    say("Installing Chatterbox, the studio's voice (one time, about 3 GB, a few minutes) ...")
    try:
        return _install(uv, venv, py)
    finally:
        (paths.STATE / "chatterbox-installing").unlink(missing_ok=True)


def _install(uv: str, venv: Path, py: Path) -> dict:
    try:
        subprocess.run([uv, "venv", "-q", "--allow-existing", "-p", "3.11", str(venv)], check=True, capture_output=True, text=True)
        subprocess.run([uv, "pip", "install", "-q", "--python", str(py), CHATTERBOX, "soundfile"], check=True, capture_output=True, text=True)
        say("Downloading the Chatterbox voice model ...")
        model = paths.settings().get("chatterbox_model", "standard")
        load = ("from chatterbox.tts_turbo import ChatterboxTurboTTS as M" if model == "turbo" else "from chatterbox.tts import ChatterboxTTS as M")
        subprocess.run([str(py), "-c", load + "; M.from_pretrained(device='cpu')"], check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        raise LRError("Chatterbox didn't install: " + (e.stderr or e.stdout or "")[-400:],
                      fix="Check the internet connection (it downloads from huggingface.co) and run `lr voice install chatterbox` "
                          "again; Kokoro reads meanwhile.")
    (venv / ".ready").write_text(CHATTERBOX)
    return status()
