# LawRank Studio: team setup (about 15 minutes, once per laptop)

## What you need
1. **Google Drive for desktop.** Sign in with the account that can see the shared **Claude** folder.
   In Drive's settings, right-click the **Claude** folder and choose *Available offline* (or set
   Drive to *Mirror files*). The studio reads and writes files there directly.
2. **Python 3.11 or newer** from https://www.python.org/downloads/. On a Mac, `python3` from the
   Xcode command-line tools also works.
3. **Node.js 22 LTS** from https://nodejs.org. This is only needed to render MP4 videos;
   everything else works without it.
4. **The Claude desktop app** (or Claude Code in a terminal), signed in to the LawRank organization.

## Install the skill
- **From the organization's plugin catalog (preferred).** In Claude, open Plugins / Customize,
  find **LawRank Studio** and install it.
- **From the repository (Claude Code).** Run `/plugin marketplace add <repo URL or path>`, then
  `/plugin install lawrank-studio@lawrank`.

## First run
Open Claude with the shared **Claude** Drive folder as the working folder, then type:

> Set up LawRank Studio

Claude runs `lr setup`. That installs the render browser, the video renderer and the voice and face
models into `~/.lawrank-studio` (about 1 GB, 1–3 minutes). It also finds the Drive folder
automatically. If it can't find the folder, tell Claude where it is (for example,
"it's at ~/Library/CloudStorage/GoogleDrive-you@lawrank.com/Shared drives/Claude").

## Using it
Just ask, for example:
- "New client: smithinjury.com, Growth package."
- "Show me test designs for Smith Injury."
- "They chose direction B. Build month 1."
- "Make PI-003 punchier and use Dana's photo."
- "What's waiting on approval for Smith?"
- "Render the approved videos for Smith."
- "Package month 1 for Smith."

Review happens in Drive. Open `Clients/<Firm>/campaigns/<campaign>/index.html` to see everything,
and set **Status** to *Approved* (or *Changes requested* with a note) in `review.xlsx`, using
Google Sheets. Claude picks it up the next time it runs.

## Good to know
- Two people can work on different clients at the same time. If two people build the same campaign
  at once, the second person is told who's working on it.
- Every action is logged in `Clients/<Firm>/history.log`.
- Drive keeps version history for every file, so mistakes can be undone from Drive.
