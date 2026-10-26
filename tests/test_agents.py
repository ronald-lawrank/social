"""Running the studio from agents other than Claude (Codex in the ChatGPT app): AGENTS.md, the `lr` command,
`lr docs`, `lr update`, and plain permission errors instead of a stalled setup."""
import os
import subprocess
import sys

from conftest import run
from lrstudio import agents, paths, tools


def test_agents_md_is_the_skill_for_any_agent(home):
    text = agents.agents_md()
    skill = (paths.SKILL / "SKILL.md").read_text()
    assert not text.lstrip().startswith("---") and "name: lawrank-studio" not in text          # no Claude-only header
    assert "install.sh | sh" in text and "install.ps1 | iex" in text and "~/.lawrank-studio/bin/lr" in text
    assert "reference/" not in text and "`lr docs writing`" in text                         # guides via lr docs
    for rule in ("Exactly one link", "Never stop halfway to ask", "No stock photos"):           # same rules as Claude
        assert (rule in skill) == (rule in text)
    f = agents.write_agents_md(home)
    assert f and f.read_text() == text and agents.write_agents_md(home) is None              # unchanged: no rewrite


def test_lr_docs_prints_the_guides():
    out = run("docs", "writing")
    assert out["ok"] and "## The spec" in out["text"]
    out = run("docs", "nope")
    assert not out["ok"] and "onboarding" in out["fix"]


def test_the_lr_command_runs_this_copy(home):
    f = agents.install_launcher()
    assert os.access(f, os.X_OK)
    env = dict(os.environ, LR_HOME=str(home), LR_NO_VENV="1")
    r = subprocess.run([str(f), "templates"], capture_output=True, text=True, env=env, timeout=120)
    assert '"ok":true' in r.stdout


def test_setup_says_which_permission_it_needs(home, monkeypatch):
    monkeypatch.setattr(tools, "_writable", lambda folder: False)
    out = run("setup")
    assert not out["ok"] and str(paths.STATE) in out["error"] and "Codex" in out["fix"] and "approve" in out["fix"]
    out = run("doctor")
    assert "permission to write to the tools folder" in out["missing"]


def test_update_on_a_claude_plugin_copy_points_to_claude():
    out = run("update")
    assert out["ok"] and out["updated"] is False and "/plugin marketplace update lawrank" in out["note"]


def test_install_scripts_are_valid():
    root = paths.SKILL.parent.parent.parent
    assert subprocess.run(["sh", "-n", str(root / "install.sh")]).returncode == 0
    ps = (root / "install.ps1").read_text()
    assert "lr.py" in ps and "setup" in ps and "codeload.github.com/ronald-lawrank/social/zip" in ps
    assert sys.version_info >= (3, 11)
