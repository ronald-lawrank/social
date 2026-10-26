"""`lr build`: validate the specs, draw what changed, check it, and update the review sheet, gallery and library."""
from pathlib import Path

from . import campaign as camp, library, render, review, spec, store, templates
from .util import LRError, Lock, log, read_json, say, write_json

DRAFT_SIZES = {"static": ["4x5"], "carousel": ["4x5"], "kit": None, "board": None}
ALL_SIZES = {"static": ["4x5", "1x1", "9x16"], "carousel": ["4x5", "1x1"], "kit": None}


def _posts(d: Path, month=None, posts=None) -> list[dict]:
    want = {p.strip().upper() for p in posts.split(",")} if posts else None
    out = []
    for f in sorted((d / "posts").glob("*.json")):
        p = read_json(f)
        if not p:
            continue
        if want and p["id"].upper() not in want:
            continue
        if month is not None and p.get("month") != month:
            continue
        out.append(p)
    if want and not out:
        raise LRError(f"No post matches {posts}", fix="Post ids look like PI-017")
    return out


def designs_for(post: dict, sizes: list[str] | None) -> list[dict]:
    out = []
    for o in post.get("options", []):
        meta = templates.get(o["template"])
        fmt = meta["format"]
        want = sizes or (DRAFT_SIZES.get(fmt) or meta["sizes"])
        for size in [s for s in want if s in meta["sizes"]] or meta["sizes"][:1]:
            out.append({"id": f"{post['id']}-{o['key']}-{size}", "post": post["id"], "option": o["key"], "template": o["template"],
                        "size": size, "data": o, "title": f"{post['id']} {o['key']} · {post.get('topic', '')}"})
    return out


def build(c: store.Client, campaign: str | None = None, month: int | None = None, posts: str | None = None,
          sizes: str | list | None = None, force: bool = False) -> dict:
    d = camp.campaign_dir(c, campaign)
    every = sizes == "all"                                       # no --sizes: the draft size (4:5) for fast review
    size_list = None if sizes in (None, "all") else (sizes.split(",") if isinstance(sizes, str) else list(sizes))
    brand = c.brand()
    facts = store.read_facts(c)
    pics = read_json(c.brand_dir / "photos" / "photos.json", {}) or {}
    selected = _posts(d, month, posts)
    written = [p for p in selected if p.get("options")]
    motion_posts = [p for p in written if p.get("format") == "motion"]
    static_posts = written
    if not written:
        raise LRError("None of the selected posts have options written yet",
                      fix=f"Write options into {d / 'posts'}/<ID>.json first (reference/writing.md).",
                      todo=[p["id"] for p in selected][:12])
    with Lock(d, f"build {d.name}"):
        problems, compliance_notes, designs = {}, {}, []
        for p in static_posts:
            v = spec.validate_post(p, facts, pics)
            if v["errors"]:
                problems[p["id"]] = v["errors"]
                continue
            compliance_notes[p["id"]] = v["issues"]
            if p.get("format") != "motion":
                designs += designs_for_all(p) if every else designs_for(p, size_list)
        cache = {} if force else (read_json(d / ".build.json", {}) or {})
        say(f"Drawing {len(designs)} design(s) for {c.name} ...")
        results = render.render(c.dir, brand, designs, d, cache=cache) if designs else []
        existing = {f.stem for f in (d / "posts").glob("*.json")}
        newcache = {k: v for k, v in cache.items() if k.rsplit("-", 2)[0] in existing}      # forget deleted posts
        for r in results:
            newcache[r["id"]] = {k: v for k, v in r.items() if k != "cached"}
        from . import motion
        for p in motion_posts:                     # voiced previews (cached by storyboard); MP4s come after approval
            if p["id"] in problems:
                continue
            for o in p["options"]:
                say(f"Motion preview {p['id']} {o['key']} ...")
                r = motion.preview(c, d, p, o, cache)
                newcache[r["id"]] = {k: v for k, v in r.items() if k != "cached"}
                designs.append({"id": r["id"], "post": p["id"], "option": o["key"], "template": "motion", "size": "9x16", "data": o, "result": r})
                results.append(r)
        write_json(d / ".build.json", newcache)
        by_id = {r["id"]: r for r in results}
        for x in designs:
            x.setdefault("result", by_id.get(x["id"], {}))
        # test directions deliberately share messages so the looks can be compared
        repeats = [] if d.name == "Test designs" else library.repeats(c, d, static_posts)
        rows = review.update(c, d, static_posts, designs, compliance_notes, repeats)
        flagged = [x for x in designs if any(i["level"] == "block" for i in x["result"].get("issues", []))]
        sheet = review.flagged_sheet(d, flagged) if flagged else None
        review.gallery(c, d, rows)
        status = review.status(d, rows)
        library.sync(c, d, rows)
        log(c.dir, f"build {d.name}" + (f" month {month}" if month else "") + (f" {posts}" if posts else ""),
            "ok" if not flagged and not problems else f"{len(flagged)} flagged, {len(problems)} not built")
    out = {"client": c.name, "campaign": d.name, "built": len(designs), "redrawn": sum(1 for r in results if not r.get("cached")),
           "flagged": [{"design": x["id"], "fix": [i["msg"] for i in x["result"]["issues"] if i["level"] == "block"][:4]} for x in flagged][:20],
           "not_built": {k: v[:6] for k, v in problems.items()},
           "check_before_posting": {f"{pid} {k}": [i["msg"] for i in iss if i["level"] == "warn"][:3]
                                    for pid, opts in compliance_notes.items() for k, iss in opts.items() if any(i["level"] == "warn" for i in iss)},
           "repeats": repeats[:8], "status": status,
           "gallery": str(d / "index.html"), "review_sheet": str(d / "review.xlsx")}
    if sheet:
        out["flagged_sheet"] = str(sheet)
    todo = [p["id"] for p in selected if not p.get("options")]
    if todo:
        out["todo"] = todo[:24]
        out["todo_note"] = f"{len(todo)} selected post(s) have no options written yet."
    if motion_posts:
        out["motion_previews"] = [str(d / "previews" / f"{p['id']}-{o['key']}-motion.html") for p in motion_posts if p["id"] not in problems for o in p["options"]]
        out["motion_note"] = "Previews play in a browser with sound. MP4s are rendered after approval with `lr video`."
    out["ok"] = not problems and not flagged
    return out


def designs_for_all(post: dict) -> list[dict]:
    out = []
    for o in post.get("options", []):
        meta = templates.get(o["template"])
        sizes = ALL_SIZES.get(meta["format"]) or meta["sizes"]
        for size in [s for s in sizes if s in meta["sizes"]]:
            out.append({"id": f"{post['id']}-{o['key']}-{size}", "post": post["id"], "option": o["key"], "template": o["template"],
                        "size": size, "data": o, "title": f"{post['id']} {o['key']} · {post.get('topic', '')}"})
    return out
