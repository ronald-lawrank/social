"""`lr client import <folder>`: bring a client over from the old LawRank template (clients/<slug>/ with brand.json,
content.json and assets/). Logos, photos (with their people boxes), colours, fonts and facts carry over."""
import json
import shutil
from pathlib import Path

from . import photos, store
from .util import LRError, log, read_json, write_json

WEIGHTS = {"Thin": 100, "ExtraLight": 200, "Light": 300, "Regular": 400, "Medium": 500, "SemiBold": 600, "Semi Bold": 600,
           "Bold": 700, "ExtraBold": 800, "Black": 900}


def import_folder(src: str, package: str = "growth") -> dict:
    d = Path(src).expanduser()
    old = read_json(d / "brand.json")
    content = read_json(d / "content.json", {}) or {}
    if not old:
        raise LRError(f"{d} has no brand.json", fix="Point at an old client folder (clients/<slug>/ inside the old template).")
    site = old.get("website") or content.get("client", {}).get("website")
    c = store.create(old.get("name") or d.name, site, package=package,
                     practice_area=content.get("client", {}).get("practiceArea") or "Personal injury", status="active",
                     imported_from="old LawRank template")
    f = old["fonts"]
    fonts = {"head": {"family": f["head"]["family"], "weight": WEIGHTS.get(f["head"].get("bold", "Bold"), 700)},
             "body": {"family": f["body"]["family"], "weight": WEIGHTS.get(f["body"].get("regular", "Regular"), 400)}}
    if f.get("ui"):
        fonts["ui"] = {"family": f["ui"]["family"], "weight": WEIGHTS.get(f["ui"].get("semi", "Bold"), 700)}
    lg = old.get("logo", {})
    for role, name in (("white", "logo-white.svg"), ("black", "logo-dark.svg")):
        if isinstance(lg.get(role), str) and (d / lg[role]).exists():
            shutil.copy(d / lg[role], c.brand_dir / "logos" / name)
    if not (c.brand_dir / "logos" / "logo-dark.svg").exists() and (c.brand_dir / "logos" / "logo-white.svg").exists():
        shutil.copy(c.brand_dir / "logos" / "logo-white.svg", c.brand_dir / "logos" / "logo-dark.svg")
    from . import logos
    ld = c.brand_dir / "logos"
    if (ld / "logo-dark.svg").exists():
        try:
            logos.write_variants(ld, logos.sanitize((ld / "logo-dark.svg").read_text()), logos.sanitize((ld / "logo-white.svg").read_text()))
        except Exception:
            pass
    meta = {}
    for key, p in (old.get("photos") or {}).items():
        srcf = d / p["file"]
        if not srcf.exists():
            continue
        dst = c.brand_dir / "photos" / f"{key}{srcf.suffix.lower()}"
        shutil.copy(srcf, dst)
        info = photos.analyze(dst.read_bytes())
        faces = [s["face"] for s in p.get("subjects", []) if s.get("face")] or info["faces"]
        meta[key] = {"file": dst.name, "kind": p.get("kind") or photos.kind_of(info), "name": p.get("name"), "use": True,
                     "w": info["w"], "h": info["h"], "faces": faces, "sharpness": info["sharpness"], "detector": "imported",
                     "source": p.get("source"), "why": "imported from the old template"}
    write_json(c.brand_dir / "photos" / "photos.json", meta)
    people = [{"name": m["name"], "role": "Attorney", "source": m.get("source")} for m in meta.values() if m.get("name")]
    brand = {"name": c.name, "short": old.get("short") or c.name.split()[0], "website": c.data["domain"],
             "colors": old["colors"], "fonts": fonts, "cta": old.get("cta", {"radius": 4, "upper": True}),
             "treatments": old.get("treatments") or {}, "logo": {"status": "vector", "dark": "logos/logo-dark.svg", "white": "logos/logo-white.svg"},
             "evidence": old.get("evidence") or {}, "voice": {"tagline": None, "positioning": None, "notes": []},
             "practice_areas": [], "offices": [], "people": people, "languages": [], "reliable": True,
             "checked": old.get("checked"), "warnings": []}
    write_json(c.brand_dir / "brand.json", brand)
    facts = []
    for key, fct in (content.get("facts") or {}).items():
        facts.append({"key": key, "text": fct.get("text", ""), "category": "imported", "source": fct.get("source"),
                      "excerpt": None, "verified": bool(fct.get("verified")), "needs_approval": bool(fct.get("approval")),
                      "notes": fct.get("note")})
    store.write_facts(c, facts)
    try:
        from . import board
        board.render_board(c)
    except Exception:
        pass
    log(c.dir, f"client import {d}")
    from .summary import client_summary
    return client_summary(c)
