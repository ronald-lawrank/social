"""Attorney-advertising checks on copy, before anything is drawn.

These are conservative, general rules (most state bars restrict guarantees, unverifiable superlatives, "expert" or
"specialist" claims, results without a disclaimer, and testimonials without consent). They flag; a person decides.
Every number in the copy must come from a fact the option cites, so nothing is invented.
"""
import re

DISCLAIMER = "Past results do not guarantee future outcomes."
GUARANTEE = re.compile(r"\b(guarantee[ds]?|guaranteeing|promise[sd]? (?:you|to win|results)|100% (?:success|win)|will win|we always win|never lose)\b", re.I)
SUPERLATIVE = re.compile(r"\b(the best|best (?:lawyers?|attorneys?|firm)|#\s?1|number one|no\. ?1|top[- ]rated|leading|premier|unmatched|unbeatable)\b", re.I)
EXPERT = re.compile(r"\b(experts?|specialists?|speciali[sz]e[sd]?|speciali[sz]ing|certified)\b", re.I)
# A result is money, or the firm saying it won/recovered something. Educational words alone ("many claims end in a
# settlement", "a jury verdict") are not results.
RESULTS = re.compile(r"\$\s?\d|\b\d[\d,.]*\s?(million|billion)\b|\b(we|our (?:firm|team|attorneys?|lawyers?|clients?))\b[^.!?]{0,40}?"
                     r"\b(won|recovered|secured|obtained|awarded|verdicts?|settlements?)\b", re.I)
FEES = re.compile(r"\b(no fees?|free|don'?t pay|pay nothing|no cost|no charge|no upfront)\b", re.I)
NUMBER = re.compile(r"(?<![\w$])(\d[\d,.]*\+?)")
OK_NUMBERS = {"1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "24/7", "911", "101"}     # list counts, steps, 911, "Injury law 101"


def texts(option: dict):
    """(field path, text) for every piece of copy in an option, including carousel slides and the caption."""
    def walk(node, path):
        if isinstance(node, str):
            yield path, node
        elif isinstance(node, dict):
            for k, v in node.items():
                if k in ("icon", "photo", "accent"):
                    continue
                yield from walk(v, f"{path}.{k}" if path else k)
        elif isinstance(node, list):
            for i, v in enumerate(node):
                yield from walk(v, f"{path}[{i}]")
    yield from walk(option.get("copy") or {}, "copy")
    for k in ("caption", "alt"):
        if option.get(k):
            yield k, option[k]


def lint(option: dict, facts: dict, template_meta: dict) -> list[dict]:
    """[{level: block|warn, rule, msg}] for one option. facts: store.read_facts()."""
    out = []
    add = lambda level, rule, msg: out.append({"level": level, "rule": rule, "msg": msg})
    cited = [facts[k] for k in option.get("facts", []) if k in facts]
    cited_text = " ".join(f["text"] for f in cited).lower()
    all_text = " ".join(t for _, t in texts(option))

    for path, t in texts(option):
        if GUARANTEE.search(t):
            add("block", "guarantee", f"{path}: '{GUARANTEE.search(t).group(0)}' reads as a guarantee of an outcome; remove it")
        m = SUPERLATIVE.search(t)
        if m and m.group(0).lower() not in cited_text:
            add("block", "superlative", f"{path}: '{m.group(0)}' is an unverifiable comparison unless it quotes an approved award or rating fact")
        m = EXPERT.search(t)
        if m and m.group(0).lower() not in cited_text:
            add("warn", "expert", f"{path}: '{m.group(0)}' is restricted in many states unless the attorney is board certified; confirm with the firm")
        if path.startswith("copy") or path == "caption":
            for n in NUMBER.findall(t):
                n0 = n.rstrip("+.,")
                if n0 in OK_NUMBERS or not n0:
                    continue
                if n0 not in cited_text and n0.replace(",", "") not in cited_text.replace(",", ""):
                    add("block", "unverified", f"{path}: the number '{n0}' isn't in any fact this option cites; cite the fact or remove it")
    is_result = lambda f: f["category"] == "results" or (f["category"] == "imported" and RESULTS.search(f["text"]))
    hits = [(path, RESULTS.search(t).group(0)) for path, t in texts(option) if RESULTS.search(t)]
    if hits:
        where = "; ".join(f"{p}: '{m}'" for p, m in hits[:3])
        if not any(is_result(f) for f in cited):
            add("block", "results", f"{where} reads as a case result but cites no results fact: cite the approved result, or reword "
                                    "(general education like 'many claims settle' is fine)")
        elif any(is_result(f) and not f["usable"] for f in cited):
            add("warn", "approval", "cites a result the firm hasn't approved yet (check before posting)")
        if DISCLAIMER.lower()[:30] not in all_text.lower():
            add("block", "disclaimer", f"{where} is a result, so add \"{DISCLAIMER}\" (copy.disclaimer or the caption)")
    m = FEES.search(all_text)
    if m and not any(f["category"] in ("fees", "imported") and f["usable"] for f in cited) \
            and not any(m.group(0).lower() in f["text"].lower() and f["usable"] for f in cited):
        add("warn", "fees", f"'{m.group(0)}' is a fee/service promise: cite the firm's approved fee fact, or quote a usable fact that says it")
    if template_meta.get("compliance") == "testimonial" or option.get("copy", {}).get("quote"):
        if not any(f["category"] in ("testimonial", "reviews", "imported") for f in cited):
            add("block", "testimonial", "a client quote must cite the testimonial fact it comes from (verbatim, with consent)")
        elif not any(f["category"] in ("testimonial", "reviews", "imported") and f["usable"] for f in cited):
            add("warn", "approval", "the testimonial needs the firm's approval and the client's consent before posting")
    for k in option.get("facts", []):
        if k not in facts:
            add("block", "facts", f"cites '{k}', which isn't in facts.xlsx")
        elif facts[k]["status"] == "not verified":
            add("block", "facts", f"cites '{k}', which isn't verified on the site")
        elif facts[k]["status"] == "needs approval":
            add("warn", "approval", f"'{k}' needs the firm's approval before posting")
    return out
