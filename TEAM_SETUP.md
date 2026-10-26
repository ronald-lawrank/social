# LawRank Studio: team setup (about 15 minutes, once per laptop)

## 1. Install these (once)
1. **Google Drive for desktop.** Sign in with the account that can see the shared **Claude** folder.
   In Drive's settings, right-click the **Claude** folder and choose *Available offline*. The studio
   reads and writes files there directly.
2. **Python 3.11 or newer** from https://www.python.org/downloads/. On Windows, tick "Add Python to
   PATH" during install.
3. **Node.js 22 LTS** from https://nodejs.org. This is only needed to render MP4 videos;
   everything else works without it.
4. **The Claude desktop app** from https://claude.ai/download, signed in to the LawRank organization.

## 2. Install the skill (once)
Open the Claude desktop app, go to the **Code** tab, and choose the **Claude** Drive folder as the
folder to work in. Then type these two commands, one at a time:

```
/plugin marketplace add ronald-lawrank/social
/plugin install lawrank-studio@lawrank
```

## 3. First run (once)
In the same place, type:

> Set up LawRank Studio

Claude installs the render browser, video renderer and the voice and face models into
`~/.lawrank-studio` (about 1 GB, 1–3 minutes). It finds the Drive folder automatically. If it can't
find the folder, tell Claude where it is (for example, "it's at
~/Library/CloudStorage/GoogleDrive-you@lawrank.com/Shared drives/Claude").

## Every day
Open the Claude desktop app's **Code** tab in the **Claude** Drive folder and just ask, for example:
- "New client: smithinjury.com, Growth package."
- "Show me test designs for Smith Injury."
- "They chose direction B. Build month 1."
- "Make PI-003 punchier and use Dana's photo."
- "What's waiting on approval for Smith?"
- "Smith upgraded to Authority. Do the month 1 motion posts."
- "Render the approved videos for Smith."
- "Package month 1 for Smith."

Review happens in Drive. Open `Clients/<Firm>/campaigns/<campaign>/index.html` to see everything,
and set **Status** to *Approved* (or *Changes requested* with a note) in `review.xlsx`, using
Google Sheets. Claude picks it up the next time it runs. When Claude acts on a note, the status
changes to *Revised* so it comes back to you.

## Updates
When the skill is improved, everyone runs `/plugin marketplace update lawrank` once (or Claude
picks it up automatically when it starts, depending on your settings).

## Using ChatGPT instead of Claude
The studio works the same in **Codex** (OpenAI's coding agent, part of ChatGPT; sign in with your
ChatGPT account). Same commands, same files in Drive, same gallery, Figma plugin, deck and MP4s.
Do steps 1.1–1.3 above, then:

1. Open a terminal once and paste the installer:
   - Mac: `curl -fsSL https://raw.githubusercontent.com/ronald-lawrank/social/main/install.sh | sh`
   - Windows (PowerShell): `irm https://raw.githubusercontent.com/ronald-lawrank/social/main/install.ps1 | iex`

   It installs everything into `~/.lawrank-studio` and writes `AGENTS.md` (Codex's instructions)
   into the **Claude** Drive folder. If it can't find the Drive folder, run
   `~/.lawrank-studio/bin/lr setup --home "<path to the Claude folder>"`.
2. In Codex, open the **Claude** Drive folder as the project and ask the same things you would ask
   Claude ("New client: smithinjury.com, Growth package.").
3. The first time, Codex asks for permission to run commands that use the network and write to
   `~/.lawrank-studio`. Allow it (choose the option that remembers it for this folder). If it
   says "write access wasn't granted", that's the permission it needs.

**Updates (ChatGPT users):** ask Codex to "update LawRank Studio" (it runs `lr update`), or run
`~/.lawrank-studio/bin/lr update` in a terminal.

## Good to know
- Two people can work on different clients at the same time. If two people build the same campaign
  at once, the second person is told who's working on it.
- Every action is logged in `Clients/<Firm>/history.log`.
- Drive keeps version history for every file, so mistakes can be undone from Drive.
- The skill's code is public on GitHub (github.com/ronald-lawrank/social). Client work never goes
  there: it stays in Drive.
- The six-month plan ships with the skill. To change it for everyone, put an edited
  `six_month_plan.csv` in `LawRank Studio/plan/`. To change a template for everyone, put an edited
  copy of its folder in `LawRank Studio/templates/`. A plan for one practice goes next to it as
  `plan/<practice>.csv` (e.g. `family-law.csv`, same columns); `lr campaign new` uses it for firms in
  that practice and says so when it falls back to the default (personal injury) plan. Copies in Drive override the built-in ones.
