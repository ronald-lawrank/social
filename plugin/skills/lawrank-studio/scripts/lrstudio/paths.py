"""Where things live.

STATE  ~/.lawrank-studio: this laptop's tools (venv, node packages, browser, models, fonts, settings).
HOME   the shared Drive folder "Claude" (via Google Drive for desktop): every client and the template library.
SKILL  the installed skill: bundled templates, motion families and scripts.
"""
import json
import os
from pathlib import Path

from .util import LRError

SKILL = Path(__file__).resolve().parent.parent.parent
SCRIPTS = SKILL / "scripts"
BUNDLED_TEMPLATES = SKILL / "templates"
BUNDLED_MOTION = SKILL / "motion"
STATE = Path(os.environ.get("LR_STATE_DIR", Path.home() / ".lawrank-studio"))
MODELS = STATE / "models"
FONTS = STATE / "fonts"
NODE_DIR = STATE / "node"

STUDIO_DIR = "LawRank Studio"
CLIENTS_DIR = "Clients"


class HomeNotFound(LRError):
    pass


def _settings_path() -> Path:
    return Path(os.environ.get("LR_STATE_DIR", Path.home() / ".lawrank-studio")) / "settings.json"


def settings() -> dict:
    try:
        return json.loads(_settings_path().read_text())
    except (OSError, ValueError):
        return {}


def save_settings(**kw):
    s = settings(); s.update(kw)
    _settings_path().parent.mkdir(parents=True, exist_ok=True)
    _settings_path().write_text(json.dumps(s, indent=1))


def is_home(p: Path) -> bool:
    return (p / STUDIO_DIR).is_dir() and (p / CLIENTS_DIR).is_dir()


def _drive_roots():
    """Folders where Google Drive for desktop mounts drives, on macOS and Windows."""
    h = Path.home()
    yield from sorted((h / "Library" / "CloudStorage").glob("GoogleDrive-*"))      # macOS
    for name in ("Google Drive", "GoogleDrive"):
        yield h / name
    if os.name == "nt":
        import string
        for letter in string.ascii_uppercase[3:]:
            yield Path(f"{letter}:/")


def _search(root: Path, depth: int):
    """Breadth-first search for the studio home (a folder holding 'LawRank Studio' and 'Clients')."""
    level = [root]
    for _ in range(depth + 1):
        nxt = []
        for d in level:
            try:
                if is_home(d):
                    return d
                nxt += [c for c in d.iterdir() if c.is_dir() and not c.name.startswith(".")]
            except OSError:
                continue
        level = nxt[:400]
    return None


def home(required: bool = True) -> Path | None:
    """The shared studio folder: LR_HOME, else the saved setting, else found under Google Drive for desktop."""
    for cand in (os.environ.get("LR_HOME"), settings().get("home")):
        if cand and is_home(Path(cand)):
            return Path(cand)
    for root in _drive_roots():
        if not root.exists():
            continue
        for sub in ("Shared drives", "Shared Drives", "My Drive", "."):
            base = root / sub
            if base.exists():
                found = _search(base, 4)
                if found:
                    save_settings(home=str(found))
                    return found
    if required:
        raise HomeNotFound(
            "Can't find the shared 'Claude' folder on this computer.",
            fix="Install Google Drive for desktop, sign in, and make the 'Claude' folder available offline; "
                "or run `lr setup --home \"<path to the Claude folder>\"`.")
    return None


def studio_dir() -> Path:
    return home() / STUDIO_DIR


def clients_dir() -> Path:
    return home() / CLIENTS_DIR


def template_dirs() -> list[Path]:
    """Shared templates in Drive first (designers can add or override), then the ones bundled with the skill."""
    out = []
    h = home(required=False)
    if h and (h / STUDIO_DIR / "templates").is_dir():
        out.append(h / STUDIO_DIR / "templates")
    out.append(BUNDLED_TEMPLATES)
    return out
