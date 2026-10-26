"""Install and check this laptop's tools: Python packages, Chromium, Node packages (HyperFrames, GSAP), ffmpeg,
the face and voice models, and the link to the shared Drive folder."""
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

from . import paths
from .util import LRError, fetch, say

MODEL_FILES = {
    # face detector YuNet (MIT): OpenCV Zoo build, else the author's own export (works where Git LFS hosts are blocked)
    "yunet.onnx": [
        "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
        "https://raw.githubusercontent.com/ShiqiYu/libfacedetection.train/master/onnx/yunet_s_640_640.onnx",
    ],
    # face recogniser SFace (Apache-2.0): is this the firm's attorney or a stock model?
    "sface.onnx": ["https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"],
    # voice (Kokoro-82M, Apache-2.0)
    "kokoro/kokoro-v1.0.fp16.onnx": ["https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.fp16.onnx"],
    "kokoro/voices-v1.0.bin": ["https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"],
}


def model(name: str, required: bool = True) -> Path | None:
    """Path to a model file, downloading it once into ~/.lawrank-studio/models."""
    p = paths.MODELS / name
    if p.exists() and p.stat().st_size > 100_000:   # (a Git LFS pointer is ~130 bytes: treated as missing)
        return p
    p.parent.mkdir(parents=True, exist_ok=True)
    errors = []
    for url in MODEL_FILES[name]:
        try:
            say(f"Downloading {Path(name).name} (once) ...")
            tmp = p.with_suffix(p.suffix + ".part")
            tmp.write_bytes(fetch(url, timeout=600))
            if tmp.stat().st_size > 100_000:
                tmp.rename(p); return p
        except Exception as e:
            errors.append(f"{url.split('/')[2]}: {str(e)[:80]}")
    if required:
        raise LRError(f"Couldn't download {name}: {'; '.join(errors)}", fix="Check the internet connection and run `lr setup` again.")
    return None


# ---------------------------------------------------------------- node + ffmpeg
def node_bin() -> str | None:
    return shutil.which("node")


def hyperframes_cmd() -> list[str]:
    exe = paths.NODE_DIR / "node_modules" / ".bin" / ("hyperframes.cmd" if os.name == "nt" else "hyperframes")
    if not exe.exists():
        raise LRError("The video renderer isn't installed", fix="Run `lr setup`.")
    return [str(exe)]


def node_env() -> dict:
    """PATH with ffmpeg/ffprobe (system ones first, else the npm static builds) for the video renderer."""
    env = dict(os.environ)
    extra = []
    for pkg, binname in (("ffmpeg-static", "ffmpeg"), ("ffprobe-static", "ffprobe")):
        if shutil.which(binname):
            continue
        root = paths.NODE_DIR / "node_modules" / pkg
        found = [p for p in root.rglob(binname + (".exe" if os.name == "nt" else "")) if p.is_file()] if root.exists() else []
        if found:
            if os.name != "nt":
                found[0].chmod(0o755)
            extra.append(str(found[0].parent))
    env["PATH"] = os.pathsep.join(extra + [env.get("PATH", "")])
    env["HYPERFRAMES_TELEMETRY"] = "0"
    env["DO_NOT_TRACK"] = "1"
    return env


def ffmpeg() -> str:
    env = node_env()
    exe = shutil.which("ffmpeg", path=env["PATH"])
    if not exe:
        raise LRError("ffmpeg isn't available", fix="Run `lr setup`.")
    return exe


# ---------------------------------------------------------------- setup / doctor
def _run(cmd, **kw):
    say("  $ " + " ".join(str(c) for c in cmd[:6]))
    r = subprocess.run([str(c) for c in cmd], capture_output=True, text=True, **kw)
    if r.returncode:
        raise LRError(f"{Path(str(cmd[0])).name} failed: {(r.stderr or r.stdout)[-600:]}", fix="Check the internet connection and run `lr setup` again.")
    return r.stdout


def setup(home: str | None = None, skip_models: bool = False) -> dict:
    done = []
    if home:
        h = Path(home).expanduser()
        if not paths.is_home(h):
            raise LRError(f"{h} isn't the studio folder (it needs 'LawRank Studio' and 'Clients' inside)",
                          fix="Point at the 'Claude' folder in Google Drive.")
        paths.save_settings(home=str(h)); done.append("home")
    venv = paths.STATE / "venv"
    py = venv / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    if not py.exists():
        say("Creating the studio's Python environment ...")
        _run([sys.executable, "-m", "venv", venv]); done.append("venv")
    say("Installing Python packages ...")
    _run([py, "-m", "pip", "install", "-q", "--upgrade", "pip"])
    _run([py, "-m", "pip", "install", "-q", "-r", paths.SCRIPTS / "requirements.txt"]); done.append("python packages")
    say("Installing the browser used for rendering ...")
    _run([py, "-m", "playwright", "install", "chromium"]); done.append("chromium")
    warnings = []
    if not skip_models:
        for name in MODEL_FILES:
            try:
                model(name)
            except LRError as e:
                warnings.append(str(e))
        done.append("models")
        if warnings:
            warnings.append("Faces fall back to OpenCV's built-in detector; voiceover needs the voice model (retry `lr setup`).")
    if node_bin():                                         # only MP4 rendering needs Node; everything else works without it
        paths.NODE_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copy(paths.SCRIPTS / "node" / "package.json", paths.NODE_DIR / "package.json")
        say("Installing the video renderer ...")
        _run(["npm" if os.name != "nt" else "npm.cmd", "install", "--no-audit", "--no-fund", "--loglevel=error"], cwd=paths.NODE_DIR)
        hf = hyperframes_cmd()
        subprocess.run(hf + ["telemetry", "disable"], capture_output=True, env=node_env())
        _run(hf + ["browser", "ensure"], env=node_env()); done.append("video renderer")
    else:
        warnings.append("Node.js isn't installed, so MP4 videos can't be rendered yet (everything else works). "
                        "Install Node.js 22 LTS from https://nodejs.org and run `lr setup` again.")
    res = doctor()
    res["installed"] = done
    if warnings:
        res["warnings"] = warnings
    return res


def doctor() -> dict:
    out, problems = {}, []
    for mod in ("playwright", "PIL", "numpy", "cv2", "onnxruntime", "openpyxl", "jinja2", "httpx", "pptx", "kokoro_onnx", "soundfile"):
        try:
            __import__(mod)
        except Exception:
            problems.append(f"python package {mod}")
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            p.chromium.launch().close()
        out["browser"] = "ok"
    except Exception:
        problems.append("browser (Chromium)")
    video = []                                             # MP4 rendering only; stills and previews don't need these
    if not node_bin():
        video.append("Node.js (install Node.js 22 LTS from https://nodejs.org)")
    try:
        hyperframes_cmd()
    except LRError:
        video.append("video renderer")
    try:
        ffmpeg()
    except LRError:
        video.append("ffmpeg")
    out["video"] = "ok" if not video else "not ready: " + ", ".join(video) + "; then run `lr setup`"
    out["models"] = {n.split("/")[-1]: (paths.MODELS / n).exists() for n in MODEL_FILES}
    h = paths.home(required=False)
    out["home"] = str(h) if h else None
    if not h:
        problems.append("shared Drive folder")
    out["ok"] = not problems
    if problems:
        out["missing"] = problems
        out["fix"] = ("Install Google Drive for desktop and make the 'Claude' folder available offline. "
                      if "shared Drive folder" in problems else "") + "Then run `lr setup`."
    return out
