"""`lr client show`: everything Claude needs about a client in a few lines, so it never re-reads the site."""
import json

from . import review, store
from .util import LRError, log, read_json, write_json

SETTABLE = {"direction", "practice_area", "package", "status", "name", "notes"}


def client_summary(c: store.Client) -> dict:
    b = read_json(c.brand_dir / "brand.json", {}) or {}
    facts = store.read_facts(c)
    pics = read_json(c.brand_dir / "photos" / "photos.json", {}) or {}
    camps = []
    if c.campaigns_dir.exists():
        for d in sorted(p for p in c.campaigns_dir.iterdir() if p.is_dir()):
            st = read_json(d / "status.json", {}) or {}
            sheet = review.read_sheet(d)                  # live: reviewers change review.xlsx between builds
            if sheet:
                st["approved_options"] = sum(v["status"] == "Approved" for v in sheet.values())
                st["posts_with_an_approved_option"] = len({k[0] for k, v in sheet.items() if v["status"] == "Approved"})
                st["changes_requested"] = sum(v["status"] == "Changes requested" for v in sheet.values())
                fb = review.feedback(d, sheet=sheet)
                if fb:
                    st["feedback"] = dict(list(fb.items())[:12])
            camps.append({"name": d.name, **st})
    return {
        "client": c.name, "folder": str(c.dir), "website": c.data.get("domain"),
        "practice_area": c.data.get("practice_area"), "package": c.data.get("package"),
        "direction": _direction(c.data.get("direction")), "status": c.data.get("status"),
        "brand": {"colors": b.get("colors"), "fonts": {k: v.get("family") for k, v in (b.get("fonts") or {}).items()},
                  "cta": b.get("cta"), "logo": (b.get("logo") or {}).get("status"), "reliable": b.get("reliable")},
        "voice": b.get("voice"),
        "people": [p.get("name") for p in b.get("people", [])][:12],
        "offices": [f"{o.get('city')}, {o.get('state')}" for o in b.get("offices", [])],
        "photos": {k: f"{p['kind']}{' · ' + p['name'] if p.get('name') else ''}" for k, p in pics.items() if p.get("use")},
        "photos_not_used": {k: p.get("why") for k, p in pics.items() if not p.get("use")},
        "facts": {"usable": {k: f["text"][:140] for k, f in sorted(facts.items()) if f["usable"]},
                  "need_approval": {k: f["text"][:110] for k, f in facts.items() if f["status"] == "needs approval"},
                  "not_verified": sorted(k for k, f in facts.items() if f["status"] == "not verified")},
        "campaigns": camps,
        "warnings": b.get("warnings", []),
        "board": str(c.brand_dir / "board" / "board.html") if (c.brand_dir / "board" / "board.html").exists() else None,
    }


def _direction(k):
    """The chosen test-design direction spelled out, so writing can follow it."""
    from .campaign import DIRECTIONS
    d = DIRECTIONS.get((k or "").upper())
    if not d:
        return k
    return {"key": k.upper(), "name": d["name"], "why": d["why"],
            "templates_and_treatments": [f"{t} ({tr})" for t, tr in d["set"]]}


def set_fields(c: store.Client, pairs: list[str]) -> dict:
    """key=value pairs. Client fields (direction, practice_area, package, ...) or brand fields with a 'brand.' prefix,
    e.g. brand.colors.accent=#BF5700  brand.fonts.head.family="Playfair Display"  brand.voice.notes+=Warm, plain-spoken"""
    if not pairs:
        raise LRError("Nothing to set", fix="e.g. lr client set <client> direction=B")
    brand = read_json(c.brand_dir / "brand.json", {}) or {}
    changed = []
    for pair in pairs:
        if "=" not in pair:
            raise LRError(f"'{pair}' isn't key=value")
        key, value = pair.split("=", 1)
        append = key.endswith("+")
        key = key.rstrip("+")
        try:
            val = json.loads(value)
        except ValueError:
            val = value
        if key.startswith("brand."):
            node, parts = brand, key[6:].split(".")
            for p in parts[:-1]:
                node = node.setdefault(p, {})
            if append:
                node.setdefault(parts[-1], []).append(val)
            else:
                node[parts[-1]] = val
        elif key in SETTABLE:
            if key == "package" and val not in ("essentials", "growth", "authority"):
                raise LRError("package must be essentials, growth or authority")
            c.data[key] = val
        else:
            raise LRError(f"Can't set '{key}'", fix=f"Settable: {', '.join(sorted(SETTABLE))}, or brand.<path>")
        changed.append(key)
    c.save()
    if any(k.startswith("brand.") for k in changed):
        write_json(c.brand_dir / "brand.json", brand)
        try:
            from . import board
            board.render_board(c)
        except Exception:
            pass
    log(c.dir, "client set " + " ".join(changed))
    return {"client": c.name, "changed": changed}
