# LawRank Studio installer for Windows, for AI agents other than Claude (Codex in the ChatGPT app) or a terminal.
# Claude users install the plugin instead (see TEAM_SETUP.md).
#   irm https://raw.githubusercontent.com/ronald-lawrank/social/main/install.ps1 | iex
# It downloads the studio into %USERPROFILE%\.lawrank-studio\app and runs `lr setup`, which installs the rest and
# creates the `lr` command at %USERPROFILE%\.lawrank-studio\bin\lr.cmd.
$ErrorActionPreference = "Stop"
$State = if ($env:LR_STATE_DIR) { $env:LR_STATE_DIR } else { Join-Path $HOME ".lawrank-studio" }
$Archive = if ($env:LR_ARCHIVE) { $env:LR_ARCHIVE } else { "https://codeload.github.com/ronald-lawrank/social/zip/refs/heads/main" }

$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if (-not $py) { Write-Error "LawRank Studio needs Python 3.11 or newer: install it from https://www.python.org/downloads/ (tick 'Add Python to PATH') and run this again."; exit 1 }
& $py.Source -c "import sys; sys.exit(sys.version_info < (3, 11))"
if ($LASTEXITCODE -ne 0) { Write-Error "Python is older than 3.11: install a newer one from https://www.python.org/downloads/."; exit 1 }

try { New-Item -ItemType Directory -Force -Path $State | Out-Null; Set-Content -Path (Join-Path $State ".write-test") -Value "ok"; Remove-Item (Join-Path $State ".write-test") }
catch { Write-Error "Can't write to $State. Allow writing there (in Codex: approve writing outside the workspace) and run this again."; exit 1 }

Write-Host "Downloading LawRank Studio ..."
$Tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("lr-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $Tmp | Out-Null
try {
  $Zip = Join-Path $Tmp "studio.zip"
  if (Test-Path $Archive) { Copy-Item $Archive $Zip } else { Invoke-WebRequest -UseBasicParsing -Uri $Archive -OutFile $Zip }
  Expand-Archive -Path $Zip -DestinationPath (Join-Path $Tmp "x")
  $Src = Get-ChildItem (Join-Path $Tmp "x") -Directory | Select-Object -First 1
  if (-not (Test-Path (Join-Path $Src.FullName "plugin\skills\lawrank-studio\scripts\lr.py"))) { Write-Error "The download didn't contain LawRank Studio; try again later."; exit 1 }
  $App = Join-Path $State "app"
  if (Test-Path $App) { Remove-Item -Recurse -Force $App }
  Move-Item $Src.FullName $App
} finally { Remove-Item -Recurse -Force $Tmp -ErrorAction SilentlyContinue }

Write-Host "Setting up (1-3 minutes) ..."
& $py.Source (Join-Path $State "app\plugin\skills\lawrank-studio\scripts\lr.py") setup
Write-Host "Done. The studio's command is $State\bin\lr.cmd"
