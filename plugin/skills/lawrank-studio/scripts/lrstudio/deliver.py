"""`lr package`: everything a client delivery needs, in campaigns/<campaign>/exports/.

  <Firm> - <campaign> - Deck.pptx          the client deck (PowerPoint / Google Slides)
  <Firm> - <campaign> - Figma plugin.zip   every design as editable layers (import once in the Figma desktop app)
  <Firm> - <campaign> - Posts.zip          every size as PNG + captions.csv (+ approved MP4s)
Per post: its Approved option(s) if review.xlsx marks any, else every option (Rejected ones never). review.xlsx is
optional; when nothing is approved anywhere, the package is labelled a review set. Motion posts get their MP4s
rendered here if they're missing or out of date.
"""
import csv
import io
import re
import zipfile
from pathlib import Path

from . import spec, build as builder, campaign as camp, deck, figma_export, review, store
from .util import LRError, Lock, log, read_json, say, write_bytes


def parse_id(did: str, posts: set | None = None) -> tuple[str, str]:
    """'PI-001-A-4x5' / 'DIR-A-A1-4x5' / 'KIT-FB-fb-cover' -> (post id, option key). Sizes and post ids can contain
    dashes, so the post is matched against the campaign's post ids (as the build does) when they're given."""
    post = builder.post_of(did, posts) if posts else None
    if post:
        return post, did[len(post) + 1:].split("-", 1)[0]
    post, key, _ = did.rsplit("-", 2)
    return post, key


def package(c: store.Client, campaign: str | None = None, month: int | None = None) -> dict:
    d = camp.campaign_dir(c, campaign)
    statuses = review.read_sheet(d)
    approved = {k for k, v in statuses.items() if v["status"] == "Approved"}
    posts = [p for p in (read_json(f) for f in sorted((d / "posts").glob("*.json"))) if p and p.get("options")
             and (month is None or p.get("month") == month)]
    if not posts:
        raise LRError("Nothing written to package", fix="Build the campaign first (`lr build`).")
    post_ids = {f.stem for f in (d / "posts").glob("*.json")}
    review_set = not any((p["id"], o["key"]) in approved for p in posts for o in p["options"])
    from . import motion
    chosen = [(p, o) for p in posts for o in motion.pick_options(statuses, p)]
    say(f"Packaging {len(chosen)} option(s){' (review set: nothing approved yet)' if review_set else ''} ...")
    ids = ",".join(sorted({p["id"] for p, _ in chosen}))
    res = builder.build(c, campaign=d.name, posts=ids, sizes="all",           # every size of what's delivered, checked
                        options={(p["id"], o["key"]) for p, o in chosen})
    # package what's ready; anything that still fails a check is left out and listed (never the whole package refused)
    left_out = {}
    for f in res.get("flagged") or []:
        pid, key = parse_id(f["design"], post_ids)
        left_out.setdefault(f"{pid} {key}", f["fix"][:2])
    for pid, errs in (res.get("not_built") or {}).items():
        for p, o in chosen:
            if p["id"] == pid:
                left_out.setdefault(f"{pid} {o['key']}", errs[:2])
    chosen = [(p, o) for p, o in chosen if f"{p['id']} {o['key']}" not in left_out]
    if not chosen:
        raise LRError("Nothing is ready to package yet: every chosen design still needs a fix",
                      fix="Fix what's listed (as after `lr build`), then package again.", left_out=left_out)
    # MP4s for the motion options going out: rendered now if missing or out of date (no separate step needed)
    videos, not_made = [], {}
    for p, o in chosen:
        if p.get("format") == "motion" and o.get("lines") and not motion.mp4_current(c, d, p, o):
            try:
                videos.append(motion.render_mp4(c, d, p, o))
            except Exception as e:
                from .util import log_error
                log_error(e, f"video {p['id']} {o['key']}")
                not_made[f"MP4 {p['id']} {o['key']}"] = (e.fix if isinstance(e, LRError) and e.fix else f"{type(e).__name__}: {str(e)[:120]}")
    cache = read_json(d / ".build.json", {}) or {}
    exports = d / "exports"; exports.mkdir(exist_ok=True)
    safe = lambda s: re.sub(r'[<>:"/\\|?*]+', "", s).strip()
    stem = safe(f"{c.name} - {d.name}" + (f" - Month {month}" if month else "") + (" - review set" if review_set else ""))
    keep = {(p["id"], o["key"]) for p, o in chosen}
    with Lock(d, "package"):
        # posts zip: PNGs by post, captions.csv, MP4s
        buf = io.BytesIO(); rows = []
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
            for did, r in sorted(cache.items()):
                pid, key = parse_id(did, post_ids)
                if (pid, key) not in keep:
                    continue
                for im in r.get("images", []):
                    z.write(d / im, f"{pid}/{Path(im).name}")
            for p, o in chosen:
                rows.append([p["id"], p.get("month"), p.get("topic"), o["key"], o.get("template"), o.get("caption", ""), o.get("alt", "")])
                for mp4 in sorted((d / "video").glob(f"{p['id']}-{o['key']}-*.mp4")) if (d / "video").exists() else []:
                    z.write(mp4, f"{p['id']}/{mp4.name}")
            cs = io.StringIO(); w = csv.writer(cs)
            w.writerow(["Post", "Month", "Topic", "Option", "Template", "Caption", "Alt text"]); w.writerows(rows)
            z.writestr("captions.csv", cs.getvalue())
        write_bytes(exports / f"{stem} - Posts.zip", buf.getvalue())
        # Figma plugin from the 4:5 (and kit/board) previews of the chosen options
        html = []
        for did, r in sorted(cache.items()):
            if parse_id(did, post_ids) in keep and r.get("html") and r.get("template") != "motion":
                html.append((did, d / r["html"]))
        say(f"Exporting {len(html)} design(s) to Figma layers ...")
        made = {"posts": exports / f"{stem} - Posts.zip"}
        try:                                      # each file stands alone: one failing never costs the others
            designs, images = figma_export.collect(html)
            topics = {p["id"]: p.get("topic") or "" for p, _ in chosen}
            order = list(dict.fromkeys(p["id"] for p, _ in chosen))
            for g in designs:                     # grouped in Figma: one section per post, a row per option
                pid, key = parse_id(g["name"], post_ids)
                g.update(post=pid, option=key, size=g["name"][len(pid) + len(key) + 2:],
                         group=f"{pid} · {topics[pid]}" if topics.get(pid) else pid)
            sizes = {"4x5": 0, "1x1": 1, "9x16": 2}
            designs.sort(key=lambda g: (order.index(g["post"]) if g["post"] in order else len(order), g["option"],
                                        sizes.get(g["size"], 3), g["size"]))
            made["plugin"] = (figma_export.plugin_zip(f"{c.name} · {d.name}", designs, images, exports / f"{stem} - Figma plugin.zip"))
        except Exception as e:
            from .util import log_error
            log_error(e, "figma plugin"); not_made["Figma plugin"] = f"{type(e).__name__}: {str(e)[:120]}"
        # client deck: one slide per option (4:5 + story where present), captions, what to confirm
        groups = []
        facts = store.read_facts(c)
        confirm = set()
        for p, o in chosen:
            imgs = [d / im for did, r in sorted(cache.items()) if did.startswith(f"{p['id']}-{o['key']}-") for im in r.get("images", [])]
            groups.append({"title": p.get("topic", "") if p.get("direction") else f"{p['id']} · {p.get('topic', '')}",
                           "subtitle": p.get("why") if p.get("direction") else f"Option {o['key']}",
                           "images": imgs[:4], "captions": [o.get("caption", "")]})
            for k in o.get("facts", []):
                f = facts.get(k)
                if f and f["needs_approval"] and not f["approved"]:
                    confirm.add(f["text"][:160])
            for x in spec.confirm_list(o):
                confirm.add(x)
        try:
            made["deck"] = (deck.build_deck(c, d, c.brand(), groups, sorted(confirm), exports / f"{stem} - Deck.pptx",
                                           f"{c.name}: {d.name}" + (f", Month {month}" if month else "")))
        except Exception as e:
            from .util import log_error
            log_error(e, "client deck"); not_made["Client deck"] = f"{type(e).__name__}: {str(e)[:120]}"
    log(c.dir, f"package {d.name}" + (f" month {month}" if month else ""))
    return {"client": c.name, "campaign": d.name, "options": len(chosen), "review_set": review_set,
            "videos_rendered": [f"{v['post']} {v['option']}" for v in videos],
            "files": [str(made[k]) for k in ("deck", "plugin", "posts") if k in made],
            **({"not_made": not_made, "needs_attention": True,
                "not_made_note": "These files couldn't be made this time; the others are complete. Package again to retry them."}
               if not_made else {}),
            "included": [f"{p['id']} {o['key']}" for p, o in chosen],
            **({"left_out": left_out, "needs_attention": True,
                "note": "These weren't packaged because they still fail a check: fix them, rebuild, and package again to add them."}
               if left_out else {}),
            # posts going out with every option because review.xlsx approves none of theirs (only worth saying
            # when other posts do have approvals)
            "all_options_for": [] if review_set else sorted(p["id"] for p in posts
                                                             if not any((p["id"], o["key"]) in approved for o in p["options"])),
            "to_confirm": len(confirm),
            "figma_steps": "Unzip the plugin somewhere permanent, then in the Figma desktop app: Plugins > Development > "
                           "Import plugin from manifest, pick manifest.json, and run it in any file."}
