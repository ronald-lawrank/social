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

# Inside a venv, sys.prefix is the venv folder. (Comparing interpreter paths fails on macOS python.org installs, where the
# venv's python is a symlink to the very same binary as the system python3.)
in_venv = Path(sys.prefix).resolve() == (STATE / "venv").resolve()
if VENV_PY.exists() and not in_venv and not os.environ.get("LR_NO_VENV"):
    args = [str(VENV_PY), str(Path(__file__).resolve()), *sys.argv[1:]]
    if os.name == "nt":                        # execv on Windows detaches the console; run and pass the exit code back
        import subprocess
        sys.exit(subprocess.call(args))
    os.execv(str(VENV_PY), args)

sys.path.insert(0, str(HERE))
from lrstudio.cli import main  # noqa: E402

sys.exit(main())
