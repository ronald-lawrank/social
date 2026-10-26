"""Campaigns: the six-month plan turned into one post spec per slot, and the test-design round (`lr directions`)."""
import csv
import datetime as dt
import re
from pathlib import Path

from . import paths, store, templates
from .util import LRError, log, read_json, write_json

# Which templates suit each kind of slot in the plan (Claude picks from these first; any template can be used).
SUGGEST = {
    "Firm Introduction": ["photo-split", "statement", "poster"], "Attorney Spotlight": ["portrait", "photo-split"],
    "Legal Education": ["photo-story", "big-type", "checklist"], "Consultation": ["steps", "icon-list", "faq"],
    "SEO / Practice Area": ["photo-story", "icon-list"], "Brand Storytelling": ["poster", "photo-story", "statement"],
    "Educational FAQ": ["faq", "big-type"], "Firm Differentiation": ["photo-story", "icon-list", "statement"],
    "Legal FAQ": ["faq", "myth-fact", "statement"], "Legal Myth": ["myth-fact", "big-type"],
    "SEO Distribution": ["photo-story", "big-type", "checklist"], "Educational Video": ["photo-story", "big-type"],
    "Educational Checklist": ["checklist", "icon-list"], "Practice Area": ["photo-split", "icon-list", "poster"],
    "Practice-Area Video": ["photo-story", "big-type"], "Educational Series": ["photo-story", "big-type"],
    "Attorney Authority": ["portrait", "photo-story", "statement"], "Social Proof": ["testimonial", "proof-stat"],
    "Firm Credibility": ["proof-stat", "icon-list", "statement"], "Client Experience": ["steps", "testimonial", "icon-list"],
    "Case Study": ["photo-story", "proof-stat"], "Local Presence": ["photo-split", "poster", "statement"],
    "Community": ["poster", "photo-split"], "Safety Education": ["checklist", "icon-list", "big-type"],
    "Firm Spotlight": ["photo-split", "poster", "proof-stat"], "Community Story": ["poster", "photo-story"],
    "Local Education": ["icon-list", "photo-story"], "Educational Recap": ["big-type", "checklist"],
    "Practice-Area Series": ["photo-story", "icon-list"],
}
MOTION_SLOTS = {"Video / Motion"}


def plan_rows(name: str = "six-month") -> list[dict]:
    """The plan from Drive (LawRank Studio/plan/six_month_plan.csv) if present, else the copy bundled with the skill."""
    h = paths.home(required=False)
    f = h / paths.STUDIO_DIR / "plan" / "six_month_plan.csv" if h else None
    if not (f and f.exists()):
        f = paths.SKILL / "data" / "six_month_plan.csv"
    with open(f, encoding="utf-8-sig") as fh:
        return list(csv.DictReader(fh))


def campaign_dir(c: store.Client, name: str | None = None) -> Path:
    camps = sorted((p for p in c.campaigns_dir.iterdir() if p.is_dir()), key=lambda p: p.stat().st_mtime) if c.campaigns_dir.exists() else []
    if name:
        hits = [p for p in camps if p.name.lower() == name.lower()] or [p for p in camps if name.lower() in p.name.lower()]
        if len(hits) != 1:
            raise LRError(f"No single campaign matches '{name}'", fix=f"Campaigns: {', '.join(p.name for p in camps) or 'none'}")
        return hits[0]
    real = [p for p in camps if p.name != "Test designs"]
    if not real:
        if camps:
            return camps[-1]
        raise LRError(f"{c.name} has no campaign yet", fix=f"Run: lr campaign new \"{c.name}\"")
    return real[-1]


def _included(included_in: str, package: str) -> bool:
    """The plan's 'Included in' column: 'All packages', 'Growth + Authority', 'Authority'."""
    t = included_in.lower()
    return "all" in t or not t.strip() or package in t


def _post_from_row(r: dict, authority: bool) -> dict:
    motion = r["Proposed format"] in MOTION_SLOTS and authority
    post = {"id": r["Post ID"], "month": int(r["Month"]), "week": int(r["Week"]), "monthly_focus": r["Monthly focus"],
            "slot_type": r["Post type"], "topic": r["Topic / assignment"], "format": "motion" if motion else r["Build as"],
            "plan": {"topic_as_written": r["Topic / assignment"], "included_in": r["Included in"],
                     "info_needed": r["Information needed"], "angles": r["Post ideas / possible angles"],
                     "fallback": r["Production notes / fallback"], "needs_client_info": r["Client info needed?"]},
            "suggested_templates": [] if motion else [t for t in SUGGEST.get(r["Post type"], ["statement", "photo-story"])
                                                       if (r["Build as"] == "carousel") == (t in ("photo-story", "big-type", "checklist"))]
            or SUGGEST.get(r["Post type"], []),
            "options": []}
    return post


def update_campaign(c: store.Client, campaign: str | None = None, plan: str = "six-month") -> dict:
    """After a package change: add the plan posts the package now includes and turn unwritten motion slots into motion
    (Authority). Written posts are never changed; posts the package no longer includes are listed, not deleted."""
    d = campaign_dir(c, campaign)
    pkg = c.data.get("package") or "growth"
    authority = pkg == "authority"
    rows = plan_rows(plan)
    have = {f.stem: f for f in (d / "posts").glob("*.json")}
    added, converted, extra = [], [], []
    for r in rows:
        pid = r["Post ID"]
        inc = _included(r.get("Included in", ""), pkg)
        if inc and pid not in have:
            write_json(d / "posts" / f"{pid}.json", _post_from_row(r, authority)); added.append(pid)
        elif pid in have:
            p = read_json(have[pid]) or {}
            if not inc:
                extra.append(pid)
            elif not p.get("options"):
                fresh = _post_from_row(r, authority)
                if fresh["format"] != p.get("format"):
                    write_json(have[pid], fresh); converted.append(pid)
    log(c.dir, f"campaign update {d.name}: +{len(added)} posts, {len(converted)} reformatted")
    motion = sorted(f.stem for f in (d / "posts").glob("*.json") if (read_json(f) or {}).get("format") == "motion")
    return {"campaign": d.name, "package": pkg, "added": added, "reformatted": converted, "motion_posts": motion,
            "not_in_package": extra,
            "note": "Posts already written were left as they are." + (" `not_in_package` posts stay unless you delete them." if extra else "")}


def new_campaign(c: store.Client, name: str | None = None, plan: str = "six-month", start: str | None = None) -> dict:
    start = start or dt.date.today().strftime("%Y-%m")
    if not re.fullmatch(r"\d{4}-\d{2}", start):
        raise LRError("--start must look like 2026-11")
    name = name or f"{start} Six-Month"
    d = c.campaigns_dir / name
    if d.exists():
        raise LRError(f"Campaign '{name}' already exists", fix="Build it with `lr build`, or choose another --name.")
    pkg = c.data.get("package") or "growth"
    rows = [r for r in plan_rows(plan) if _included(r.get("Included in", ""), pkg)]
    authority = pkg == "authority"
    (d / "posts").mkdir(parents=True)
    for r in rows:
        post = _post_from_row(r, authority)
        write_json(d / "posts" / f"{post['id']}.json", post)
    # the profile picture + cover kit goes with every six-month build
    b = c.brand()
    line = ((b.get("voice") or {}).get("tagline") or f"{(c.data.get('practice_area') or 'Injury').capitalize()} lawyers")[:44]
    group = next((k for k, ph in (read_json(c.brand_dir / "photos" / "photos.json", {}) or {}).items() if ph.get("use", True) and ph["kind"] == "group"), None)
    from . import logos
    ld = c.brand_dir / "logos"
    rev = next((f for f in (ld / "mark-white.svg", ld / "logo-white.svg") if f.exists()), None)
    dark_ok = not (rev and logos.blends(rev.read_text(), b["colors"]["ink"]))   # part of the reversed logo would vanish on ink
    kit = [{"key": "P1", "template": "profile", "treatment": "light"}, {"key": "P2", "template": "profile", "treatment": "accent"},
           *([{"key": "P3", "template": "profile", "treatment": "dark"}] if dark_ok else []),
           {"key": "FB", "template": "facebook-cover", "copy": {"headline": line, "support": b.get("website", "")}, **({"photo": group} if group else {})},
           {"key": "LI", "template": "linkedin-banner", "copy": {"headline": line}, **({"photo": group} if group else {})},
           {"key": "H1", "template": "highlight", "icon": "scale", "copy": {"label": "Results"}},
           {"key": "H2", "template": "highlight", "icon": "users", "copy": {"label": "Our team"}},
           {"key": "H3", "template": "highlight", "icon": "message-circle", "copy": {"label": "FAQ"}}]
    for o in kit:
        o.setdefault("copy", {}); o.update(facts=[], caption=f"{b['name']} {o['template'].replace('-', ' ')}", alt=f"{b['name']} {o['template'].replace('-', ' ')}")
    write_json(d / "posts" / "KIT.json", {"id": "KIT", "month": 1, "week": 1, "topic": "Profile pictures and covers", "format": "kit",
                                          "slot_type": "Profile & cover kit", "options": kit})
    write_json(d / "campaign.json", {"name": name, "plan": plan, "start": start, "package": c.data.get("package"),
                                     "practice_area": c.data.get("practice_area"), "created": dt.datetime.now().isoformat(timespec="minutes")})
    write_json(d / "status.json", {"posts": len(rows), "written": 0, "approved": 0})
    log(c.dir, f"campaign new {name}")
    return {"campaign": name, "folder": str(d), "posts": len(rows),
            "motion_posts": sum(1 for r in rows if r["Proposed format"] in MOTION_SLOTS and authority),
            "practice_area": c.data.get("practice_area"),
            "next": "Write options A/B/C into each posts/<ID>.json (see reference/writing.md), one month at a time, then `lr build --month N`."}


# ---------------------------------------------------------------- test designs
DIRECTIONS = {
    "A": {"name": "People first", "why": "The firm's own attorneys front and centre: warm, credible, local.",
          "set": [("photo-split", "dark"), ("portrait", "dark"), ("photo-story", "dark")]},
    "B": {"name": "Bold type", "why": "Big, confident typography in the brand colours: stands out in a busy feed, needs no photos.",
          "set": [("statement", "dark"), ("proof-stat", "accent"), ("big-type", "dark")]},
    "C": {"name": "Clean and light", "why": "Light fields, calm and editorial: reads as approachable and informative.",
          "set": [("icon-list", "light"), ("faq", "light"), ("checklist", "light")]},
    "D": {"name": "Brand colour", "why": "The accent colour leads: high recall and instantly recognisable as this firm.",
          "set": [("poster", "dark"), ("faq", "accent"), ("statement", "accent")]},
}


def _default_copy(c: store.Client, b: dict, facts: dict) -> dict:
    """Sample copy for test designs, from the firm's own verified facts (Claude can rewrite it before building)."""
    area = (c.data.get("practice_area") or "personal injury").lower()
    tagline = (b.get("voice") or {}).get("tagline") or f"Helping people after {area} cases."
    city = (b.get("offices") or [{}])[0].get("city") or ""
    people = [p["name"] for p in b.get("people", [])]
    usable = {k: f for k, f in facts.items() if f["usable"]}
    years = next((f for f in usable.values() if f["category"] == "history" and re.search(r"\b(19|20)\d\d\b", f["text"])), None)
    return {"tagline": tagline[:60], "area": area, "city": city, "people": people, "years_fact": years}


def directions(c: store.Client, only: str | None = None) -> dict:
    """A 'Test designs' campaign: 3-4 clearly different directions on the same messages, ready to build."""
    b = c.brand()
    facts = store.read_facts(c)
    pics = read_json(c.brand_dir / "photos" / "photos.json", {}) or {}
    has_people = any(p.get("use", True) and p["kind"] in ("person", "group") for p in pics.values())
    person = next((k for k, p in pics.items() if p.get("use", True) and p["kind"] == "person"), None)
    dc = _default_copy(c, b, facts)
    keys = [k for k in (only.split(",") if only else DIRECTIONS) if k in DIRECTIONS]
    if not has_people:
        keys = [k for k in keys if k != "A"]
    d = c.campaigns_dir / "Test designs"
    (d / "posts").mkdir(parents=True, exist_ok=True)
    for old in (d / "posts").glob("DIR-*.json"):          # a new round replaces the previous one
        old.unlink()
    loc = f" in {dc['city']}" if dc["city"] else ""
    tagline_fact = next((k for k, f in facts.items() if f["category"] == "messaging" and f["usable"]), None)
    area_fact = next((k for k, f in facts.items() if f["category"] == "services" and f["usable"]), None)
    base_facts = [k for k in (tagline_fact, area_fact) if k]
    made = []
    for k in keys:
        dd = DIRECTIONS[k]
        opts = []
        for i, (tpl, tr) in enumerate(dd["set"]):
            if tpl == "poster" and not has_people:           # the poster needs the firm's people; type leads instead
                tpl = "big-type"
            o = {"key": f"{k}{i + 1}", "template": tpl, "treatment": tr, "facts": base_facts,
                 "caption": f"{dc['tagline']} Talk to our team{loc} today.", "alt": f"{b['name']} social post: {dc['tagline']}"}
            if tpl in ("photo-split", "poster", "statement"):
                o["copy"] = {"label": "Meet the firm", "headline": dc["tagline"][:56], "support": f"{dc['area'].capitalize()} lawyers{loc}.",
                             "cta": "Free consultation" if any(f["category"] == "fees" and f["usable"] for f in facts.values()) else "Talk to us"}
                if tpl == "poster":
                    o["copy"] = {"sticker": dc["city"] or "Local lawyers", "headline": dc["tagline"][:46], "support": f"{dc['area'].capitalize()} lawyers{loc}."}
            elif tpl == "portrait" and person:
                o.update(photo=person)
                o["copy"] = {"label": "Meet your lawyer", "headline": "Here when you need answers.", "name": pics[person].get("name") or "Our attorney", "role": "Attorney"}
            elif tpl == "proof-stat" and dc["years_fact"]:
                yr = re.search(r"\b(19|20)\d\d\b", dc["years_fact"]["text"]).group(0)
                o["facts"] = base_facts + [dc["years_fact"]["key"]]
                o["copy"] = {"label": "Since " + yr, "stat": yr, "stat_caption": f"Serving clients{loc} since {yr}."}
            elif tpl == "proof-stat":
                o["template"], o["copy"] = "statement", {"label": "Our promise", "headline": "Straight answers. Real attention.", "support": f"{dc['area'].capitalize()} lawyers{loc}."}
            elif tpl == "faq":
                o["copy"] = {"label": "Ask a lawyer", "question": "Do I need a lawyer after an accident?",
                             "answer": "Not always. If you were hurt or the insurer is pushing you to settle quickly, a conversation with a lawyer helps you understand your options."}
            elif tpl == "icon-list":
                o["copy"] = {"label": "How we help", "headline": "What we do for you",
                             "items": [{"icon": "message-circle", "title": "We listen", "text": "Tell us what happened"},
                                       {"icon": "search", "title": "We investigate", "text": "Evidence, records and witnesses"},
                                       {"icon": "scale", "title": "We fight for you", "text": "With the insurer and in court"}]}
            elif tpl in ("photo-story", "big-type"):
                o["copy"] = {"cover": {"label": "After an accident", "headline": "3 things to do after an accident"},
                             "slides": [{"big": "Safety", "title": "Get safe and call 911", "text": "Report the crash and get checked out."},
                                        {"big": "Photos", "title": "Document everything", "text": "Photos of the scene, vehicles and injuries."},
                                        {"big": "Call", "title": "Talk to a lawyer first", "text": "Before you give the insurer a statement."}],
                             "close": {"headline": "Questions? We're here.", "cta": "Talk to us"}}
                if tpl == "photo-story":
                    o["photos"] = [k2 for k2, p in pics.items() if p.get("use", True) and p["kind"] == "person"][:3]
            elif tpl == "checklist":
                o["copy"] = {"cover": {"label": "Save this", "headline": "What to keep after an accident"},
                             "groups": [{"title": "At the scene", "icon": "camera", "items": ["Photos of every vehicle", "Witness names", "The police report number"]},
                                        {"title": "Afterwards", "icon": "file-text", "items": ["Medical bills", "Time off work", "Letters from insurers"]}],
                             "close": {"headline": "Questions? We're here.", "cta": "Talk to us"}}
            opts.append(o)
        pid = f"DIR-{k}"
        write_json(d / "posts" / f"{pid}.json", {"id": pid, "month": 0, "week": 0, "topic": f"Direction {k}: {dd['name']}",
                                                 "format": "mixed", "direction": k, "why": dd["why"], "options": opts})
        made.append(pid)
    write_json(d / "campaign.json", {"name": "Test designs", "plan": "directions", "created": dt.datetime.now().isoformat(timespec="minutes")})
    from .build import build
    res = build(c, campaign="Test designs")
    res["directions"] = {k: DIRECTIONS[k]["name"] + ": " + DIRECTIONS[k]["why"] for k in keys}
    if not has_people:
        res["note"] = "Direction A (people first) was skipped: no usable photos of the firm's people yet."
    return res
