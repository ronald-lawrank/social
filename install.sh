#!/bin/sh
# LawRank Studio installer for Mac and Linux, for AI agents other than Claude (Codex in the ChatGPT app) or a
# terminal. Claude users install the plugin instead (see TEAM_SETUP.md).
#   curl -fsSL https://raw.githubusercontent.com/ronald-lawrank/social/main/install.sh | sh
# It downloads the studio into ~/.lawrank-studio/app and runs `lr setup`, which installs the rest into
# ~/.lawrank-studio (about 1 GB) and creates the `lr` command at ~/.lawrank-studio/bin/lr.
set -eu
STATE="${LR_STATE_DIR:-$HOME/.lawrank-studio}"
ARCHIVE="${LR_ARCHIVE:-https://codeload.github.com/ronald-lawrank/social/tar.gz/refs/heads/main}"

if ! command -v python3 >/dev/null 2>&1 || ! python3 -c 'import sys; sys.exit(sys.version_info < (3, 11))'; then
  echo "LawRank Studio needs Python 3.11 or newer: install it from https://www.python.org/downloads/ and run this again." >&2
  exit 1
fi
if ! mkdir -p "$STATE" 2>/dev/null || ! touch "$STATE/.write-test" 2>/dev/null; then
  echo "Can't write to $STATE. Allow writing there (in Codex: approve writing outside the workspace) and run this again." >&2
  exit 1
fi
rm -f "$STATE/.write-test"

echo "Downloading LawRank Studio ..." >&2
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
if [ -f "$ARCHIVE" ]; then cp "$ARCHIVE" "$TMP/studio.tgz"; else curl -fsSL "$ARCHIVE" -o "$TMP/studio.tgz"; fi
mkdir "$TMP/x"
tar -xzf "$TMP/studio.tgz" -C "$TMP/x"
SRC="$(find "$TMP/x" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
if [ ! -f "$SRC/plugin/skills/lawrank-studio/scripts/lr.py" ]; then
  echo "The download didn't contain LawRank Studio; try again later." >&2
  exit 1
fi
rm -rf "$STATE/app"
mv "$SRC" "$STATE/app"

echo "Setting up (1-3 minutes) ..." >&2
python3 "$STATE/app/plugin/skills/lawrank-studio/scripts/lr.py" setup
echo "Done. The studio's command is $STATE/bin/lr" >&2
