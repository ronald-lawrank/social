"""Tests run the real scripts against a temporary studio folder laid out like the shared Drive folder."""
import os
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ROOT / "plugin" / "skills" / "lawrank-studio" / "scripts"
sys.path.insert(0, str(SCRIPTS))
os.environ["LR_NO_VENV"] = "1"
# Reuse downloaded models/fonts between runs (they are large); everything else is per test.
SHARED_STATE = Path(os.environ.get("LR_TEST_STATE", ROOT / ".cache" / "state"))
os.environ.setdefault("LR_STATE_DIR", str(SHARED_STATE))


@pytest.fixture
def home(tmp_path, monkeypatch):
    h = tmp_path / "Claude"
    (h / "LawRank Studio" / "templates").mkdir(parents=True)
    (h / "Clients").mkdir()
    monkeypatch.setenv("LR_HOME", str(h))
    monkeypatch.setenv("LR_USER", "tester")
    return h


def run(*argv):
    """Run `lr ...` in-process and return its JSON line."""
    import io, json, contextlib
    from lrstudio.cli import main
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        code = main(list(argv))
    lines = [l for l in buf.getvalue().splitlines() if l.strip()]
    assert len(lines) == 1, f"expected one JSON line, got: {buf.getvalue()!r}"
    out = json.loads(lines[0]); out["_code"] = code
    return out
