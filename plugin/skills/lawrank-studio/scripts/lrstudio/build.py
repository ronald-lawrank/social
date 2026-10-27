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
          sizes: str | list | None = None, force: bool = False, options: set | None = None) -> dict:
    """options: only render these (post, option) pairs (packaging renders just what's being delivered)."""
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
    reviewer = review.feedback(d, {p["id"] for p in written})        # read before this build rewrites the sheet
    with Lock(d, f"build {d.name}"):
        problems, compliance_notes, designs = {}, {}, []
        for p in static_posts:
            v = spec.validate_post(p, facts, pics, c.data.get("practice_area"))
            if v["errors"]:
                problems[p["id"]] = v["errors"]
                continue
            compliance_notes[p["id"]] = v["issues"]
            if p.get("format") != "motion":
                ds = designs_for_all(p) if every else designs_for(p, size_list)
                designs += [x for x in ds if options is None or (x["post"], x["option"]) in options]
        # .build.json is the record of every drawn design in the campaign (the gallery and review sheet read it). A
        # partial build (--post, --month, packaging) merges into it; --force only redraws the designs selected here.
        stored = read_json(d / ".build.json", {}) or {}
        redraw = ({x["id"] for x in designs} | {f"{p['id']}-{o['key']}-motion" for p in motion_posts for o in p["options"]}) if force else set()
        cache = {k: v for k, v in stored.items() if k not in redraw}
        say(f"Drawing {len(designs)} design(s) for {c.name} ...")
        results = render.render(c.dir, brand, designs, d, cache=cache) if designs else []
        existing = {f.stem for f in (d / "posts").glob("*.json")}
        newcache = {k: v for k, v in stored.items() if post_of(k, existing)}      # forget deleted posts
        for r in results:
            newcache[r["id"]] = {k: v for k, v in r.items() if k != "cached"}
        from . import motion
        for p in motion_posts:                     # voiced previews (cached by storyboard); MP4s come after approval
            if p["id"] in problems:
                continue
            for o in [o for o in p["options"] if options is None or (p["id"], o["key"]) in options]:
                say(f"Motion preview {p['id']} {o['key']} ...")
                try:
                    r = motion.preview(c, d, p, o, cache)
                except Exception as e:            # voice or preview trouble: report it, keep building the rest
                    from .util import log_error
                    log_error(e, f"motion preview {p['id']} {o['key']}")
                    r = {"id": f"{p['id']}-{o['key']}-motion", "key": None, "template": "motion", "size": "9x16", "html": None,
                         "images": [], "frames": 0, "issues": [{"level": "block", "rule": "motion",
                         "msg": f"the preview couldn't be made ({type(e).__name__}: {str(e)[:120]}); rebuild this post, or try another family"}]}
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
           "check_before_posting": _to_confirm(written, compliance_notes),
           "repeats": repeats[:8], "status": status,
           "gallery": str(d / "index.html"), "review_sheet": str(d / "review.xlsx")}
    if sheet:
        out["flagged_sheet"] = str(sheet)
    if reviewer:
        out["reviewer_feedback"] = reviewer
    todo = [p["id"] for p in selected if not p.get("options")]
    if todo:
        out["todo"] = todo[:24]
        out["todo_note"] = f"{len(todo)} selected post(s) have no options written yet."
    if motion_posts:
        out["motion_previews"] = [str(d / "previews" / f"{p['id']}-{o['key']}-motion.html") for p in motion_posts if p["id"] not in problems for o in p["options"]]
        out["motion_note"] = "Previews play in a browser with sound. MP4s are rendered after approval with `lr video`."
        every_post = [read_json(f) or {} for f in sorted((d / "posts").glob("*.json"))]
        repeats = motion.variety(every_post)
        if repeats:
            out["motion_variety"] = repeats[:8]
    # ok = the build did its job (something was drawn); what still needs a look is listed, not treated as a failure
    out["ok"] = bool(designs) or not problems
    out["needs_attention"] = bool(problems or flagged)
    return out


def post_of(design_id: str, posts: set) -> str | None:
    """The post a design id belongs to. Ids are <post>-<option>-<size>, and post ids and sizes can contain dashes
    (KIT-FB-fb-cover, DIR-A-A1-4x5), so match against the campaign's post ids instead of splitting."""
    return max((p for p in posts if design_id.startswith(p + "-")), key=len, default=None)


def _to_confirm(posts: list[dict], notes: dict) -> dict:
    """Per option: compliance warnings plus the `confirm` lines the writer added, for the firm to check."""
    out = {}
    for p in posts:
        for o in p.get("options", []):
            items = [i["msg"] for i in (notes.get(p["id"]) or {}).get(o.get("key"), []) if i["level"] == "warn"] + spec.confirm_list(o)
            if items:
                out[f"{p['id']} {o.get('key')}"] = items[:4]
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
