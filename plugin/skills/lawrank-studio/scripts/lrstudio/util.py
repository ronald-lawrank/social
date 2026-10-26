"""Small shared helpers: one-line JSON output, errors with a fix, identity, history, locking, atomic writes."""
import datetime as dt
import getpass
import json
import os
import re
import socket
import sys
import tempfile
from pathlib import Path


class LRError(Exception):
    """A problem the person (or Claude) can act on. `fix` says what to do."""
    def __init__(self, message: str, fix: str | None = None, **extra):
        super().__init__(message)
        self.fix, self.extra = fix, extra


def emit(result: dict):
    """Every command ends with exactly one JSON line on stdout."""
    print(json.dumps(result, ensure_ascii=False, separators=(",", ":"), default=str))


def ssl_context():
    """HTTPS with certifi's CA bundle: python.org Python on macOS ships without CA certificates, so the default
    context fails every download until "Install Certificates.command" is run."""
    import ssl
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


def transient(e: Exception) -> bool:
    """Worth another try: network trouble, timeouts, rate limits and server errors (not a real 'not found')."""
    if isinstance(e, LRError):
        return False
    code = getattr(e, "code", None) or getattr(getattr(e, "response", None), "status_code", None)
    if isinstance(code, int):
        return code in (408, 425, 429) or code >= 500
    try:
        import httpx
        if isinstance(e, httpx.TransportError):
            return True
    except ImportError:
        pass
    return isinstance(e, (OSError, TimeoutError))       # urllib's URLError, timeouts, connection resets


def retry(fn, tries: int = 3, wait: float = 1.5):
    """Run fn(); on a transient error wait and try again (1.5s, then 4.5s). Other errors are raised at once."""
    import time
    for n in range(tries):
        try:
            return fn()
        except Exception as e:
            if n == tries - 1 or not transient(e):
                raise
            time.sleep(wait * (3 ** n))


def fetch(url: str, timeout: float = 30, tries: int = 3) -> bytes:
    """GET a URL (certifi-verified), retrying brief network trouble. Raises urllib.error.HTTPError on a real 4xx."""
    import urllib.request

    def once():
        req = urllib.request.Request(url, headers={"User-Agent": "lawrank-studio"})
        with urllib.request.urlopen(req, timeout=timeout, context=ssl_context()) as r:
            return r.read()
    return retry(once, tries)


def log_error(e: BaseException, where: str = "") -> str:
    """Keep the technical details of an unexpected problem for whoever fixes it; the person sees a plain message."""
    import traceback
    try:
        from . import paths
        f = paths.STATE / "logs" / "errors.log"
        f.parent.mkdir(parents=True, exist_ok=True)
        with f.open("a", encoding="utf-8") as out:
            out.write(f"\n--- {now()} {where} {' '.join(sys.argv[1:])[:200]}\n")
            out.write("".join(traceback.format_exception(type(e), e, e.__traceback__))[-6000:])
        return str(f)
    except Exception:
        return ""


def say(msg: str):
    """Progress for humans goes to stderr, so stdout stays one JSON line."""
    print(msg, file=sys.stderr, flush=True)


def now() -> str:
    return dt.datetime.now().strftime("%Y-%m-%d %H:%M")


def who() -> str:
    for v in (os.environ.get("LR_USER"), os.environ.get("USER"), os.environ.get("USERNAME")):
        if v:
            return v
    try:
        return getpass.getuser()
    except Exception:
        return "unknown"


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:60] or "item"


def safe_folder(name: str) -> str:
    """A folder name that's valid on macOS, Windows and Drive."""
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]+', " ", name).strip(" .")
    return re.sub(r"\s+", " ", name)[:80] or "Client"


def write_json(path: Path, data, indent=1):
    write_text(path, json.dumps(data, indent=indent, ensure_ascii=False))


def read_json(path: Path, default=None):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError:
        return default
    except ValueError as e:
        raise LRError(f"{path.name} isn't valid JSON ({e})", fix=f"Fix or restore {path} (Drive keeps earlier versions).")


def write_text(path: Path, text: str):
    """Write atomically so Drive never syncs a half-written file."""
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".tmp-", suffix=path.suffix)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(text)
        os.replace(tmp, path)
    except BaseException:
        Path(tmp).unlink(missing_ok=True); raise


def write_bytes(path: Path, data: bytes):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".tmp-", suffix=path.suffix)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        os.replace(tmp, path)
    except BaseException:
        Path(tmp).unlink(missing_ok=True); raise


def log(client_dir: Path, action: str, result: str = "ok"):
    """Append to the client's history.log: when, who, what."""
    line = f"{now()} | {who()} | {action} | {result}\n"
    with open(Path(client_dir) / "history.log", "a", encoding="utf-8") as f:
        f.write(line)


class Lock:
    """A short lock on a folder while a build writes into it. Stale after 30 minutes (a crashed run)."""
    STALE_MIN = 30

    def __init__(self, folder: Path, what: str):
        self.path, self.what = Path(folder) / ".lr-lock", what

    def __enter__(self):
        if self.path.exists():
            try:
                info = json.loads(self.path.read_text())
                age = (dt.datetime.now() - dt.datetime.fromisoformat(info["since"])).total_seconds() / 60
            except Exception:
                info, age = {}, self.STALE_MIN + 1
            if age < self.STALE_MIN and info.get("pid") != os.getpid() and _alive(info):
                raise LRError(f"{info.get('user', 'Someone')} is already running '{info.get('what')}' here (started {int(age)} min ago).",
                              fix="Wait for it to finish, then try again.")
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps({"user": who(), "host": socket.gethostname(), "pid": os.getpid(),
                                         "what": self.what, "since": dt.datetime.now().isoformat(timespec="seconds")}))
        return self

    def __exit__(self, *exc):
        self.path.unlink(missing_ok=True)


def _alive(info) -> bool:
    if info.get("host") != socket.gethostname():
        return True
    try:
        os.kill(int(info.get("pid", 0)), 0)
        return True
    except PermissionError:                  # the process exists but belongs to another user (macOS: pid 1)
        return True
    except (OSError, ValueError):
        return False
