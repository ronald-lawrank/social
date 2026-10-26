"""Post specs: the files Claude writes (campaigns/<campaign>/posts/<ID>.json) and their validation.

{
  "id": "PI-017", "month": 3, "week": 1, "topic": "Car Accident Representation", "format": "static",
  "plan": {...the plan row, for reference...},
  "options": [
    {"key": "A", "template": "photo-split", "treatment": "dark", "photo": "jason",
     "copy": {"label": "...", "headline": "...", "accent": "...", "support": "...", "cta": "..."},
     "facts": ["founded", "practice_areas"], "caption": "...", "alt": "..."}
  ]
}
Validation is strict and specific: every message names the field and what to change.
"""
from . import compliance, templates

FORMAT_OF = {"static": {"static"}, "carousel": {"carousel"}, "kit": {"kit"}, "motion": {"motion"},
             "mixed": {"static", "carousel"}}     # test-design rounds show a direction's statics and carousel together


def confirm_list(o: dict) -> list[str]:
    """`confirm` as a list of lines (a single string is accepted as one line)."""
    v = o.get("confirm") or []
    return [v] if isinstance(v, str) else [str(x) for x in v]


def _is_leaf(spec: dict) -> bool:
    return isinstance(spec, dict) and ("item" not in spec) and not any(isinstance(v, dict) for v in spec.values())


def check_slots(value, spec: dict, path: str, errs: list):
    """Recursively check copy against a template's slot spec (limits, required, list sizes)."""
    for name, s in spec.items():
        if not isinstance(s, dict):
            continue
        v = value.get(name) if isinstance(value, dict) else None
        here = f"{path}.{name}"
        if "item" in s:
            items = v or []
            if not isinstance(items, list):
                errs.append(f"{here} must be a list"); continue
            if s.get("min") and len(items) < s["min"]:
                errs.append(f"{here} needs at least {s['min']} (has {len(items)})")
            if s.get("max") and len(items) > s["max"]:
                errs.append(f"{here} takes at most {s['max']} (has {len(items)}): split the post or cut one")
            for i, it in enumerate(items):
                item = s["item"]
                if _is_leaf(item) and isinstance(it, str):
                    if item.get("max") and len(it) > item["max"]:
                        errs.append(f"{here}[{i}] is {len(it)} characters; max {item['max']}: shorten it")
                elif isinstance(it, dict):
                    check_slots(it, item, f"{here}[{i}]", errs)
        elif _is_leaf(s):
            if v in (None, "") and s.get("required"):
                errs.append(f"{here} is required"); continue
            if isinstance(v, str) and s.get("max") and len(v) > s["max"]:
                errs.append(f"{here} is {len(v)} characters; max {s['max']}: shorten it (never shrink the type)")
        else:
            if v is None and any(isinstance(x, dict) and x.get("required") for x in s.values()):
                errs.append(f"{here} is required"); continue
            check_slots(v or {}, s, here, errs)


def validate_option(post: dict, o: dict, facts: dict, photos: dict) -> tuple[list[str], list[dict]]:
    """(errors that stop the render, compliance issues [{level, rule, msg}])."""
    errs = []
    where = f"{post.get('id')} option {o.get('key', '?')}"
    tname = o.get("template")
    if not tname:
        return [f"{where}: no template chosen"], []
    try:
        meta = templates.get(tname)
    except Exception as e:
        return [f"{where}: {e}"], []
    fmt = post.get("format", "static")
    if meta["format"] not in FORMAT_OF.get(fmt, {fmt}):
        errs.append(f"{where}: '{tname}' is a {meta['format']} template but the post is a {fmt}")
    tr = o.get("treatment")
    allowed = (meta.get("options") or {}).get("treatment")
    if tr and isinstance(allowed, list) and tr not in allowed:
        errs.append(f"{where}: treatment '{tr}' isn't offered by {tname} ({', '.join(allowed)})")
    slot_errs = []
    check_slots(o.get("copy") or {}, meta.get("slots", {}), "copy", slot_errs)
    errs += [f"{where}: {e}" for e in slot_errs]
    acc = (o.get("copy") or {}).get("accent")
    of = ((meta.get("slots") or {}).get("accent") or {}).get("of", "headline")
    head = (o.get("copy") or {}).get(of) or ""
    if acc and head and acc.lower() not in head.lower():
        errs.append(f"{where}: copy.accent '{acc}' isn't part of the {of}")
    keys = [o.get("photo"), o.get("cover_photo"), o.get("close_photo"), *(o.get("photos") or []),
            *[s.get("photo") for s in (o.get("copy") or {}).get("slides", []) if isinstance(s, dict)]]
    for k in [k for k in keys if k]:
        if k not in photos:
            errs.append(f"{where}: photo '{k}' doesn't exist (photos: {', '.join(photos) or 'none'})")
        elif not photos[k].get("use", True):
            errs.append(f"{where}: photo '{k}' was set aside ({photos[k].get('why')}); pick another")
    need = meta.get("photo")
    if need == "person" and o.get("photo") and photos.get(o["photo"], {}).get("kind") != "person":
        errs.append(f"{where}: {tname} needs a single-person photo; '{o['photo']}' is a {photos.get(o['photo'], {}).get('kind')}")
    if need in ("person", "people") and not o.get("photo") and not o.get("cover_photo") and not any(p.get("use", True) and p["kind"] in ("person", "group") for p in photos.values()):
        errs.append(f"{where}: {tname} needs a photo of the firm's people and there are none; use a type-led template")
    if not o.get("caption"):
        errs.append(f"{where}: caption is missing")
    if not o.get("alt"):
        errs.append(f"{where}: alt text is missing (describe the image for screen readers)")
    issues = compliance.lint(o, facts, meta)
    return errs, issues


def validate_post(post: dict, facts: dict, photos: dict, practice_area: str | None = None) -> dict:
    out = {"errors": [], "issues": {}}
    if post.get("format") == "motion":
        from . import motion
        for o in post.get("options", []):
            out["errors"] += [f"{post['id']} option {o.get('key')}: {e}" for e in motion.check_storyboard(post["id"], o, practice_area)]
            iss = motion.lint(o, facts)
            out["issues"][o.get("key")] = iss
            out["errors"] += [f"{post['id']} option {o.get('key')}: {x['msg']}" for x in iss if x["level"] == "block"]
            if not o.get("caption"):
                out["errors"].append(f"{post['id']} option {o.get('key')}: caption is missing")
        return out
    keys = [o.get("key") for o in post.get("options", [])]
    if len(keys) != len(set(keys)):
        out["errors"].append(f"{post.get('id')}: option keys repeat ({', '.join(map(str, keys))})")
    for o in post.get("options", []):
        e, i = validate_option(post, o, facts, photos)
        out["errors"] += e
        out["issues"][o.get("key")] = i
        out["errors"] += [f"{post.get('id')} option {o.get('key')}: {x['msg']}" for x in i if x["level"] == "block"]
    return out
