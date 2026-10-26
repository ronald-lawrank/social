"""Copy for the brand board and the design guide: the firm's own words where they're approved, otherwise neutral copy
for its practice area. Never an invented claim, and never "free" unless the firm's fees fact is approved."""
import re

from . import store


def brand_copy(c: store.Client, facts: dict | None = None) -> dict:
    from .campaign import sample_copy
    b = c.brand()
    facts = store.read_facts(c) if facts is None else facts
    usable = [f for f in facts.values() if f["usable"]]
    area = c.data.get("practice_area") or ""
    city = next((o.get("city") for o in b.get("offices") or [] if o.get("city")), "")
    tagline = ((b.get("voice") or {}).get("tagline") or "").strip()
    if not tagline:                                   # e.g. imported clients: an approved tagline fact counts too
        tf = facts.get("tagline")
        tagline = tf["text"].strip() if tf and tf["usable"] else ""
    fact = next((k for k, f in facts.items() if f["usable"] and tagline and tagline.lower().rstrip(".") in f["text"].lower()), None)
    tag_ok = bool(fact)
    st = sample_copy(area)["statement"]
    if tag_ok and len(tagline) <= 60:
        headline, accent = tagline, _payoff(tagline)
    else:
        headline, accent, fact = st["headline"], st["accent"], None
    free = any(f["category"] == "fees" and re.search(r"\bfree\b", f["text"], re.I) for f in usable)
    who = f"{area} lawyers".strip().capitalize() if area else "Lawyers"
    return {"headline": headline, "accent": accent, "tagline_locked": tag_ok, "fact": fact, "city": city,
            "neutral": st,                                  # the practice's neutral line, for slots too short for the tagline
            "support": f"{who} in {city}." if city else f"{who}.", "label": (area or "Our firm").title()[:26],
            "cta": "Free consultation" if free else "Talk to us", "cta2": "Call today", "free_ok": free}


def _payoff(text: str) -> str:
    """The phrase to colour: what follows a question, or the last few words."""
    if "?" in text.rstrip("?"):
        return text.split("?", 1)[1].strip()
    words = text.split()
    return " ".join(words[-3:]) if len(words) > 4 else text
