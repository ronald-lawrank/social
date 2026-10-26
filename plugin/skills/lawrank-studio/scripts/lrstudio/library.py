"""The shared library: every approved option across all clients, searchable, and the repeat checks.

LawRank Studio/library/library.jsonl  one line per approved option (client, topic, template, copy, image path).
`lr library search "<text>"` finds proven work and the templates that suit a topic; builds warn when new copy reads
almost the same as earlier work (this campaign, this client's other campaigns, or another firm).
"""
import json
import math
import re
from collections import Counter
from pathlib import Path

from . import paths, store, templates
from .util import read_json, write_text

STOP = set("a an and are as at be by for from has have i in is it its of on or our that the their this to we with you your "
           "can will what when how after if not do does".split())


def _lib_file() -> Path:
    return paths.studio_dir() / "library" / "library.jsonl"


def load() -> list[dict]:
    f = _lib_file()
    if not f.exists():
        return []
    out = []
    for line in f.read_text(encoding="utf-8").splitlines():
        try:
            out.append(json.loads(line))
        except ValueError:
            continue
    return out


def flatten(option: dict) -> str:
    bits = []

    def walk(n):
        if isinstance(n, str):
            bits.append(n)
        elif isinstance(n, dict):
            for k, v in n.items():
                if k not in ("icon", "photo", "accent"):
                    walk(v)
        elif isinstance(n, list):
            for v in n:
                walk(v)
    walk(option.get("copy") or {})
    return " ".join(bits)


def tokens(text: str) -> list[str]:
    return [t for t in re.findall(r"[a-z0-9$']+", (text or "").lower()) if t not in STOP and len(t) > 1]


def shingles(text: str, n: int = 3) -> set:
    t = tokens(text)
    return {" ".join(t[i:i + n]) for i in range(max(1, len(t) - n + 1))} if t else set()


def similarity(a: str, b: str) -> float:
    sa, sb = shingles(a), shingles(b)
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def sync(c: store.Client, d: Path, rows: list[dict]):
    """Add this campaign's approved options to the library; drop ones no longer approved."""
    lib = [r for r in load() if not (r.get("client") == c.name and r.get("campaign") == d.name)]
    home = paths.home()
    for r in rows:
        if r["status"] != "Approved":
            continue
        img = d / r["image"] if r.get("image") else None
        lib.append({"client": c.name, "practice_area": c.data.get("practice_area"), "campaign": d.name, "post": r["post"],
                    "option": r["option"], "template": r["template"], "slot_type": r.get("slot_type"), "topic": r["topic"],
                    "headline": r["headline"], "text": flatten(r["option_data"]), "caption": r["caption"],
                    "image": str(img.relative_to(home)) if img and img.exists() else None})
    f = _lib_file(); f.parent.mkdir(parents=True, exist_ok=True)
    write_text(f, "".join(json.dumps(x, ensure_ascii=False) + "\n" for x in lib))


def repeats(c: store.Client, d: Path, posts: list[dict], threshold: float = 0.5) -> list[str]:
    """Options whose copy reads almost the same as other work. Messages start with '<post> <option>'."""
    mine = []
    for f in sorted((d / "posts").glob("*.json")):
        p = read_json(f) or {}
        for o in p.get("options", []):
            mine.append((p["id"], o["key"], flatten(o) + " " + (o.get("caption") or "")))
    built = {(p["id"], o["key"]) for p in posts for o in p.get("options", [])}
    lib = load()
    out = []
    for pid, key, text in mine:
        if (pid, key) not in built or len(tokens(text)) < 6:
            continue
        for pid2, key2, text2 in mine:
            if pid2 != pid and similarity(text, text2) >= threshold:
                out.append(f"{pid} {key} reads almost the same as {pid2} {key2} in this campaign: vary the angle")
                break
        for item in lib:
            if item["client"] == c.name and item["campaign"] == d.name:
                continue
            s = similarity(text, item["text"] + " " + (item.get("caption") or ""))
            if s >= threshold:
                where = "an earlier campaign for this firm" if item["client"] == c.name else f"work for another firm ({item['client']})"
                out.append(f"{pid} {key} repeats {where}: {item['post']} {item['option']} '{item['headline'][:50]}'")
                break
    return out


def search(text: str, client: str | None = None, limit: int = 8) -> dict:
    """Approved work and templates that match a topic, best first."""
    lib = load()
    if client:
        cl = store.find(client)
        lib = [x for x in lib if x["client"] == cl.name] or lib
    q = Counter(tokens(text))
    if not q:
        return {"ok": False, "error": "Search for a topic, e.g. \"after a car accident\""}
    n = max(1, len(lib))
    df = Counter(t for x in lib for t in set(tokens(x["text"] + " " + x["topic"])))

    def score(fields: str) -> float:
        tf = Counter(tokens(fields))
        return sum(min(tf[t], 3) * math.log(1 + n / (1 + df[t])) * w for t, w in q.items() if t in tf)
    hits = sorted(((score(x["topic"] + " " + x["topic"] + " " + x["text"] + " " + (x.get("caption") or "")), x) for x in lib),
                  key=lambda s: -s[0])
    work = [{"client": x["client"], "post": f"{x['campaign']} / {x['post']} {x['option']}", "template": x["template"],
             "topic": x["topic"], "headline": x["headline"], "image": x.get("image")} for s, x in hits[:limit] if s > 0]
    tpl = []
    for name, m in templates.catalog().items():
        s = sum(1 for t in q if t in tokens(m.get("use_for", "") + " " + m.get("label", "")))
        if s:
            tpl.append((s, name, m.get("use_for")))
    return {"results": work, "templates": [{"template": n_, "use_for": u} for _, n_, u in sorted(tpl, key=lambda t: -t[0])[:4]],
            "library_size": len(lib)}
