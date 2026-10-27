"""Campaigns: the six-month plan turned into one post spec per slot, and the test-design round (`lr directions`)."""
import csv
import datetime as dt
import re
from pathlib import Path

from . import paths, store, templates
from .util import LRError, log, read_json, slugify, write_json

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


def area_group(practice_area: str | None) -> str | None:
    """The umbrella practice for plans and sample copy: "Divorce" -> "family law", "Car accidents" -> "personal injury"."""
    from .extract import MAIN_AREA_GROUP
    a = (practice_area or "").strip()
    a = MAIN_AREA_GROUP.get(a, a).lower()
    return AREA_GROUP.get(a, a) or None


def plan_file(name: str = "six-month", practice_area: str | None = None) -> tuple[Path, bool]:
    """(the plan CSV, whether it was written for this practice). A practice-specific plan is
    plan/<practice>.csv (e.g. plan/family-law.csv) in Drive's LawRank Studio folder or the skill's data/plans/, with the same
    columns as six_month_plan.csv. Without one, the default plan (written for personal injury) is used."""
    h = paths.home(required=False)
    drive = h / paths.STUDIO_DIR / "plan" if h else None
    group = area_group(practice_area)
    if group:
        for d in (drive, paths.SKILL / "data" / "plans"):
            if d and (d / f"{slugify(group)}.csv").exists():
                return d / f"{slugify(group)}.csv", True
    f = drive / "six_month_plan.csv" if drive else None
    if not (f and f.exists()):
        f = paths.SKILL / "data" / "six_month_plan.csv"
    return f, group == "personal injury"


def plan_rows(name: str = "six-month", practice_area: str | None = None) -> list[dict]:
    """The plan from Drive (LawRank Studio/plan/) if present, else the copy bundled with the skill."""
    with open(plan_file(name, practice_area)[0], encoding="utf-8-sig") as fh:
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
    rows = plan_rows(plan, (read_json(d / "campaign.json", {}) or {}).get("practice_area") or c.data.get("practice_area"))
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
    plan_csv, fits = plan_file(plan, c.data.get("practice_area"))
    rows = [r for r in plan_rows(plan, c.data.get("practice_area")) if _included(r.get("Included in", ""), pkg)]
    authority = pkg == "authority"
    (d / "posts").mkdir(parents=True)
    for r in rows:
        post = _post_from_row(r, authority)
        write_json(d / "posts" / f"{post['id']}.json", post)
    # the profile picture + cover kit goes with every six-month build
    b = c.brand()
    line = ((b.get("voice") or {}).get("tagline") or (f"{c.data['practice_area'].capitalize()} lawyers" if c.data.get("practice_area") else "Local lawyers"))[:44]
    pics = read_json(c.brand_dir / "photos" / "photos.json", {}) or {}
    group = next((k for k, ph in pics.items() if ph.get("use", True) and ph["kind"] == "group"), None)
    people = any(ph.get("use", True) and ph["kind"] in ("person", "group") for ph in pics.values())   # covers need one
    from . import logos
    ld = c.brand_dir / "logos"
    rev = next((f for f in (ld / "mark-white.svg", ld / "logo-white.svg") if f.exists()), None)
    dark_ok = not (rev and logos.blends(rev.read_text(), b["colors"]["ink"]))   # part of the reversed logo would vanish on ink
    kit = [{"key": "P1", "template": "profile", "treatment": "light"}, {"key": "P2", "template": "profile", "treatment": "accent"},
           *([{"key": "P3", "template": "profile", "treatment": "dark"}] if dark_ok else []),
           *([{"key": "FB", "template": "facebook-cover", "copy": {"headline": line, "support": b.get("website", "")}, **({"photo": group} if group else {})},
              {"key": "LI", "template": "linkedin-banner", "copy": {"headline": line}, **({"photo": group} if group else {})}] if people else []),
           {"key": "H1", "template": "highlight", "icon": "scale", "copy": {"label": "Results"}},
           {"key": "H2", "template": "highlight", "icon": "users", "copy": {"label": "Our team"}},
           {"key": "H3", "template": "highlight", "icon": "message-circle", "copy": {"label": "FAQ"}}]
    for o in kit:
        o.setdefault("copy", {}); o.update(facts=[], caption=f"{b['name']} {o['template'].replace('-', ' ')}", alt=f"{b['name']} {o['template'].replace('-', ' ')}")
    write_json(d / "posts" / "KIT.json", {"id": "KIT", "month": 1, "week": 1, "topic": "Profile pictures and covers", "format": "kit",
                                          "slot_type": "Profile & cover kit", "options": kit})
    write_json(d / "campaign.json", {"name": name, "plan": plan, "start": start, "package": c.data.get("package"),
                                     "practice_area": c.data.get("practice_area"), "plan_file": plan_csv.name,
                                     "created": dt.datetime.now().isoformat(timespec="minutes")})
    write_json(d / "status.json", {"posts": len(rows), "written": 0, "approved": 0})
    log(c.dir, f"campaign new {name}")
    out = {"campaign": name, "folder": str(d), "posts": len(rows), "plan_file": plan_csv.name,
            "motion_posts": sum(1 for r in rows if r["Proposed format"] in MOTION_SLOTS and authority),
            "practice_area": c.data.get("practice_area"),
            "next": "Write options A/B/C into each posts/<ID>.json (see reference/writing.md), one month at a time, then `lr build --month N`."}
    if not people:
        out["kit_note"] = ("The Facebook cover and LinkedIn banner were left out of the kit: they need a photo of the firm's people. "
                           "Add photos to brand/photos, run `lr client refresh`, then add FB and LI options to posts/KIT.json.")
    if not fits and c.data.get("practice_area"):
        out["plan_note"] = (f"There's no {c.data['practice_area']} plan yet, so the default plan (written for personal injury) was "
                            "used: rewrite each post's topic and angles for this practice before writing options, or add "
                            f"plan/{slugify(area_group(c.data['practice_area']) or 'practice')}.csv in the LawRank Studio folder.")
    return out


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


# Educational sample copy for the test-design round, by practice area (the firm's own facts fill the rest).
_CLOSE = {"headline": "Questions? We're here.", "cta": "Talk to us"}
SAMPLE_COPY = {
    "personal injury": {
        "headline": ["Hurt in an accident?", "Know your options."], "tile": ["Questions after a crash?", "Ask a lawyer."],
        "faq": {"question": "Do I need a lawyer after an accident?",
                "answer": "Not always. If you were hurt or the insurer is pushing you to settle quickly, a conversation with a lawyer helps you understand your options."},
        "help": [{"icon": "message-circle", "title": "We listen", "text": "Tell us what happened"},
                 {"icon": "search", "title": "We investigate", "text": "Evidence, records and witnesses"},
                 {"icon": "scale", "title": "We fight for you", "text": "With the insurer and in court"}],
        "story": {"cover": {"label": "After an accident", "headline": "3 things to do after an accident"},
                  "slides": [{"big": "Safety", "title": "Get safe and call 911", "text": "Report the crash and get checked out."},
                             {"big": "Photos", "title": "Document everything", "text": "Photos of the scene, vehicles and injuries."},
                             {"big": "Call", "title": "Talk to a lawyer first", "text": "Before you give the insurer a statement."}]},
        "checklist": {"cover": {"label": "Save this", "headline": "What to keep after an accident"},
                      "groups": [{"title": "At the scene", "icon": "camera", "items": ["Photos of every vehicle", "Witness names", "The police report number"]},
                                 {"title": "Afterwards", "icon": "file-text", "items": ["Medical bills", "Time off work", "Letters from insurers"]}]},
    },
    "family law": {
        "headline": ["Facing divorce?", "Know your options."], "tile": ["Questions about custody?", "Ask a lawyer."],
        "faq": {"question": "Do I need a lawyer to get divorced?",
                "answer": "Not always. If you share children, a home or retirement accounts, a conversation with a lawyer helps you understand your options before you agree to anything."},
        "help": [{"icon": "message-circle", "title": "We listen", "text": "Your family, your priorities"},
                 {"icon": "file-text", "title": "We prepare", "text": "Paperwork, finances and parenting plans"},
                 {"icon": "scale", "title": "We stand with you", "text": "In negotiation and in court"}],
        "story": {"cover": {"label": "Thinking about divorce", "headline": "3 things to do before you file"},
                  "slides": [{"big": "Papers", "title": "Gather your records", "text": "Tax returns, bank statements and debts."},
                             {"big": "Kids", "title": "Put the children first", "text": "Think about routines, school and time with each parent."},
                             {"big": "Call", "title": "Talk to a lawyer early", "text": "Before you sign or agree to anything."}]},
        "checklist": {"cover": {"label": "Save this", "headline": "What to gather before a divorce"},
                      "groups": [{"title": "Money", "icon": "file-text", "items": ["Recent tax returns", "Bank and retirement statements", "Debts and loans"]},
                                 {"title": "Family", "icon": "users", "items": ["School and medical details", "Your current schedule", "Messages about the children"]}]},
    },
    "criminal defense": {
        "headline": ["Arrested or charged?", "Know your rights."], "tile": ["Questions about a charge?", "Ask a lawyer."],
        "faq": {"question": "Should I talk to the police without a lawyer?",
                "answer": "You have the right to remain silent and to ask for a lawyer. Saying \"I want to speak to a lawyer\" is enough, and it can't be held against you."},
        "help": [{"icon": "message-circle", "title": "We listen", "text": "Your side of the story"},
                 {"icon": "search", "title": "We investigate", "text": "Evidence, reports and procedure"},
                 {"icon": "scale", "title": "We defend you", "text": "In negotiation and in court"}],
        "story": {"cover": {"label": "Know your rights", "headline": "3 things to do if you're arrested"},
                  "slides": [{"big": "Calm", "title": "Stay calm and polite", "text": "Don't resist, argue or run."},
                             {"big": "Silent", "title": "Use your right to remain silent", "text": "Give your name, then ask for a lawyer."},
                             {"big": "Call", "title": "Call a lawyer", "text": "Before you answer any questions."}]},
        "checklist": {"cover": {"label": "Save this", "headline": "What to keep after an arrest"},
                      "groups": [{"title": "Paperwork", "icon": "file-text", "items": ["Bond and release papers", "Your court date", "Any citation or ticket"]},
                                 {"title": "Your notes", "icon": "camera", "items": ["What happened, written down", "Witness names", "Officer names or badge numbers"]}]},
    },
    None: {                                       # any other practice area: nothing specific to one kind of case
        "headline": ["A legal question?", "Know your options."], "tile": ["Not sure what to do next?", "Ask a lawyer."],
        "faq": {"question": "When should I talk to a lawyer?",
                "answer": "Earlier than most people think. A short conversation before you sign, reply or decide helps you understand your options."},
        "help": [{"icon": "message-circle", "title": "We listen", "text": "Tell us what's going on"},
                 {"icon": "search", "title": "We look closely", "text": "Your documents and your options"},
                 {"icon": "scale", "title": "We stand with you", "text": "From the first call to the end"}],
        "story": {"cover": {"label": "Before you decide", "headline": "3 things to do before you call a lawyer"},
                  "slides": [{"big": "Notes", "title": "Write down what happened", "text": "Dates, names and what was said."},
                             {"big": "Papers", "title": "Gather your documents", "text": "Letters, contracts and emails."},
                             {"big": "Call", "title": "Ask your questions early", "text": "Before you sign or agree to anything."}]},
        "checklist": {"cover": {"label": "Save this", "headline": "What to bring to your first meeting"},
                      "groups": [{"title": "Documents", "icon": "file-text", "items": ["Letters and notices", "Contracts or agreements", "Emails and messages"]},
                                 {"title": "Your notes", "icon": "message-circle", "items": ["A timeline of events", "Names of everyone involved", "Your questions"]}]},
    },
}
AREA_GROUP = {"divorce": "family law", "child custody": "family law", "dui / dwi": "criminal defense"}


def sample_copy(practice_area: str | None) -> dict:
    """Educational sample copy that fits the firm's main practice area (a neutral set when there isn't a match)."""
    import copy
    return copy.deepcopy(SAMPLE_COPY.get(area_group(practice_area)) or SAMPLE_COPY[None])


def fees_usable(facts: dict) -> bool:
    """A fees fact (free consultation, no fee unless...) the firm has approved: only then may copy say "free"."""
    return any(f["category"] == "fees" and f["usable"] for f in facts.values())


def consult_cta(facts: dict) -> str:
    return "Free consultation" if fees_usable(facts) else "Talk to us"


def _default_copy(c: store.Client, b: dict, facts: dict) -> dict:
    """Sample copy for test designs, from the firm's own verified facts (Claude can rewrite it before building)."""
    area = (c.data.get("practice_area") or "").lower()
    city = (b.get("offices") or [{}])[0].get("city") or ""
    support = f"{area.capitalize()} lawyers" if area else "Lawyers"
    # the firm's tagline only when it's an approved fact; otherwise a vetted question for the practice area (never
    # the page title, never an invented line)
    tl = ((b.get("voice") or {}).get("tagline") or "").strip()
    if DESCRIPTOR.match(tl):
        tl = ""                                           # "California Personal Injury Lawyer" is a page title, not a line
    approved = next((k for k, f in facts.items() if f["usable"] and ((tl and tl.lower().rstrip(".") in f["text"].lower()) or k == "tagline")), None)
    tagline = (tl if tl and approved != "tagline" else facts[approved]["text"].strip()) if approved else ""
    sample = sample_copy(c.data.get("practice_area"))
    people = [p["name"] for p in b.get("people", [])]
    usable = {k: f for k, f in facts.items() if f["usable"]}
    years = next((f for f in usable.values() if f["category"] == "history" and re.search(r"\b(19|20)\d\d\b", f["text"])), None)
    return {"tagline": tagline, "tagline_fact": approved if tagline else None, "neutral": sample["faq"]["question"],
            "area": area, "support": support, "city": city, "people": people, "years_fact": years, "sample": sample}


# a tagline that only names the place and practice ("El Segundo Car Accident Attorneys") reads as an SEO title on a post
DESCRIPTOR = re.compile(r"^(?:[A-Z][\w.'&-]*\s+){0,6}(?:lawyers?|attorneys?|law\s+(?:firm|group|offices?)|legal\s+services)\.?$", re.I)


def _sentence(s: str) -> str:
    s = s.strip()
    return s if not s or s[-1] in ".?!" else s + "."


def _headline(dc: dict, limit: int) -> str:
    """The firm's approved tagline when it fits the slot whole; otherwise the practice's neutral question."""
    return dc["tagline"] if dc["tagline"] and len(dc["tagline"]) <= limit else dc["neutral"]


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
    tagline_fact = dc["tagline_fact"]
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
                 "caption": f"{_sentence(_headline(dc, 200))} Talk to our team{loc} today.", "alt": f"{b['name']} social post: {_headline(dc, 200)}"}
            if tpl in ("photo-split", "poster", "statement"):
                o["copy"] = {"label": "Meet the firm", "headline": _headline(dc, 56), "support": f"{dc['support']}{loc}.",
                             "cta": consult_cta(facts)}
                if tpl == "poster":
                    o["copy"] = {"sticker": dc["city"] or "Local lawyers", "headline": _headline(dc, 46), "support": f"{dc['support']}{loc}."}
            elif tpl == "portrait" and person:
                o.update(photo=person)
                o["copy"] = {"label": "Meet your lawyer", "headline": _headline(dc, 52), "name": pics[person].get("name") or "Our attorney", "role": "Attorney"}
            elif tpl == "proof-stat" and dc["years_fact"]:
                yr = re.search(r"\b(19|20)\d\d\b", dc["years_fact"]["text"]).group(0)
                o["facts"] = base_facts + [dc["years_fact"]["key"]]
                o["copy"] = {"label": "Since " + yr, "stat": yr, "stat_caption": f"Serving clients{loc} since {yr}."}
            elif tpl == "proof-stat":
                o["template"], o["copy"] = "statement", {"label": "Ask a lawyer", "headline": dc["neutral"], "support": f"{dc['support']}{loc}."}
            elif tpl == "faq":
                o["copy"] = {"label": "Ask a lawyer", **dc["sample"]["faq"]}
            elif tpl == "icon-list":
                o["copy"] = {"label": "How we help", "headline": "What we do for you", "items": dc["sample"]["help"]}
            elif tpl in ("photo-story", "big-type"):
                o["copy"] = {**dc["sample"]["story"], "close": dict(_CLOSE)}
                if tpl == "photo-story":
                    o["photos"] = [k2 for k2, p in pics.items() if p.get("use", True) and p["kind"] == "person"][:3]
            elif tpl == "checklist":
                o["copy"] = {**dc["sample"]["checklist"], "close": dict(_CLOSE)}
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
