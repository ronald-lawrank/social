#!/usr/bin/env python3
"""LawRank Studio command line. Run `python3 lr.py --help`.

This launcher re-runs itself inside the studio's own Python environment (~/.lawrank-studio/venv) once
`lr setup` has created it, so the commands always see the right packages whatever python3 started them.
"""
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
STATE = Path(os.environ.get("LR_STATE_DIR", Path.home() / ".lawrank-studio"))
VENV_PY = STATE / "venv" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")

if VENV_PY.exists() and Path(sys.executable).resolve() != VENV_PY.resolve() and not os.environ.get("LR_NO_VENV"):
    os.execv(str(VENV_PY), [str(VENV_PY), str(Path(__file__).resolve()), *sys.argv[1:]])

sys.path.insert(0, str(HERE))
from lrstudio.cli import main  # noqa: E402

sys.exit(main())
