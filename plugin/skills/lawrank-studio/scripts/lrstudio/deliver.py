"""`lr package`: everything a client delivery needs, in campaigns/<campaign>/exports/.

  <Firm> - <campaign> - Deck.pptx          the client deck (PowerPoint / Google Slides)
  <Firm> - <campaign> - Figma plugin.zip   every design as editable layers (import once in the Figma desktop app)
  <Firm> - <campaign> - Posts.zip          every size as PNG + captions.csv (+ approved MP4s)
Approved options only; when nothing is approved yet, every option goes in and the package is marked as a review set.
"""
import csv
import io
import re
import zipfile
from pathlib import Path

from . import spec, build as builder, campaign as camp, deck, figma_export, review, store
from .util import LRError, Lock, log, read_json, say, write_bytes


def parse_id(did: str) -> tuple[str, str]:
    """'PI-001-A-4x5' / 'DIR-A-A1-4x5' / 'PI-006-A-motion' -> (post id, option key)."""
    from .templates import split_id
    post, key, _ = split_id(did)
    return post, key


def package(c: store.Client, campaign: str | None = None, month: int | None = None) -> dict:
    d = camp.campaign_dir(c, campaign)
    statuses = review.read_sheet(d)
    approved = {k for k, v in statuses.items() if v["status"] == "Approved"}
    posts = [p for p in (read_json(f) for f in sorted((d / "posts").glob("*.json"))) if p and p.get("options")
             and (month is None or p.get("month") == month)]
    if not posts:
        raise LRError("Nothing written to package", fix="Build the campaign first (`lr build`).")
    review_set = not any((p["id"], o["key"]) in approved for p in posts for o in p["options"])
    chosen = [(p, o) for p in posts for o in p["options"] if review_set or (p["id"], o["key"]) in approved]
    say(f"Packaging {len(chosen)} option(s){' (review set: nothing approved yet)' if review_set else ''} ...")
    ids = ",".join(sorted({p["id"] for p, _ in chosen}))
    res = builder.build(c, campaign=d.name, posts=ids, sizes="all",           # every size of what's delivered, checked
                        options={(p["id"], o["key"]) for p, o in chosen})
    # package what's ready; anything that still fails a check is left out and listed (never the whole package refused)
    left_out = {}
    for f in res.get("flagged") or []:
        pid, key = parse_id(f["design"])
        left_out.setdefault(f"{pid} {key}", f["fix"][:2])
    for pid, errs in (res.get("not_built") or {}).items():
        for p, o in chosen:
            if p["id"] == pid:
                left_out.setdefault(f"{pid} {o['key']}", errs[:2])
    chosen = [(p, o) for p, o in chosen if f"{p['id']} {o['key']}" not in left_out]
    if not chosen:
        raise LRError("Nothing is ready to package yet: every chosen design still needs a fix",
                      fix="Fix what's listed (as after `lr build`), then package again.", left_out=left_out)
    cache = read_json(d / ".build.json", {}) or {}
    exports = d / "exports"; exports.mkdir(exist_ok=True)
    safe = lambda s: re.sub(r'[<>:"/\\|?*]+', "", s).strip()
    stem = safe(f"{c.name} - {d.name}" + (f" - Month {month}" if month else "") + (" - review set" if review_set else ""))
    keep = {(p["id"], o["key"]) for p, o in chosen}
    with Lock(d, "package"):
        # posts zip: PNGs by post, captions.csv, approved MP4s
        buf = io.BytesIO(); rows = []
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
            for did, r in sorted(cache.items()):
                pid, key = parse_id(did)
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
            if parse_id(did) in keep and r.get("html") and r.get("template") != "motion":
                html.append((did, d / r["html"]))
        say(f"Exporting {len(html)} design(s) to Figma layers ...")
        made, not_made = {"posts": exports / f"{stem} - Posts.zip"}, {}
        try:                                      # each file stands alone: one failing never costs the others
            designs, images = figma_export.collect(html)
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
            "files": [str(made[k]) for k in ("deck", "plugin", "posts") if k in made],
            **({"not_made": not_made, "needs_attention": True,
                "not_made_note": "These files couldn't be made this time; the others are complete. Package again to retry them."}
               if not_made else {}),
            "included": [f"{p['id']} {o['key']}" for p, o in chosen],
            **({"left_out": left_out, "needs_attention": True,
                "note": "These weren't packaged because they still fail a check: fix them, rebuild, and package again to add them."}
               if left_out else {}),
            "no_approved_option": [] if review_set else sorted({p["id"] for p in posts} - {p["id"] for p, _ in chosen}),
            "to_confirm": len(confirm),
            "figma_steps": "Unzip the plugin somewhere permanent, then in the Figma desktop app: Plugins > Development > "
                           "Import plugin from manifest, pick manifest.json, and run it in any file."}
