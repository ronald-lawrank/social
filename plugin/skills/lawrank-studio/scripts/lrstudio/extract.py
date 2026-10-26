"""Turn a website crawl into brand intelligence: colour and font roles, practice areas, offices, people and facts.

Pure functions over the crawl output (no database, no network), so every rule is unit-tested.

Verification rule (used everywhere facts are created): a fact is `verified` only when its `excerpt` occurs verbatim
in the text of the page it cites. Categories that attorney-advertising rules care about (results, reviews/ratings,
testimonials, awards, fees and service promises, phone numbers for social) are additionally `requires_approval`.
"""
import colorsys, re
from collections import Counter
from dataclasses import dataclass, field

ELEMENTOR_DEFAULTS = {"#6EC1E4", "#54595F", "#7A7A7A", "#61CE70"}
APPROVAL_CATEGORIES = {"results", "reviews", "testimonial", "awards", "fees", "phones", "promise"}

PRACTICE_AREAS = {
    "Personal injury": r"personal injur",
    "Car accidents": r"car (accident|crash|wreck)|auto(mobile)? accident",
    "Truck accidents": r"truck(ing)? (accident|crash)|18[- ]wheeler|semi[- ]truck|commercial vehicle",
    "Motorcycle accidents": r"motorcycle",
    "Pedestrian accidents": r"pedestrian",
    "Bicycle accidents": r"bicycle|cyclist",
    "Wrongful death": r"wrongful death",
    "Medical malpractice": r"medical malpractice|medical negligence",
    "Premises liability": r"premises liability|slip and fall|slip-and-fall",
    "Workers' compensation": r"workers'? comp",
    "Brain injury": r"brain injur|tbi\b",
    "Dog bites": r"dog bite",
    "Product liability": r"product liability|defective product",
    "Divorce": r"\bdivorce",
    "Child custody": r"custody",
    "Family law": r"family law",
    "Criminal defense": r"criminal defen[cs]e",
    "DUI / DWI": r"\bdui\b|\bdwi\b|drunk driving",
    "Employment law": r"employment law|wrongful termination|discrimination|wage (and|&) hour",
    "Estate planning": r"estate planning|wills? and trusts|probate",
    "Immigration": r"immigration|visa|green card",
    "Bankruptcy": r"bankruptcy|chapter (7|13)",
    "Social Security disability": r"social security disability|ssdi",
    "Business law": r"business law|corporate law|contract dispute",
    "Real estate": r"real estate law|real estate litigation",
    "Appeals": r"\bappeals?\b|appellate",
}
MAIN_AREA_GROUP = {   # which umbrella a specific area belongs to, for choosing the main practice area
    "Car accidents": "Personal injury", "Truck accidents": "Personal injury", "Motorcycle accidents": "Personal injury",
    "Pedestrian accidents": "Personal injury", "Bicycle accidents": "Personal injury", "Wrongful death": "Personal injury",
    "Premises liability": "Personal injury", "Brain injury": "Personal injury", "Dog bites": "Personal injury",
    "Product liability": "Personal injury", "Medical malpractice": "Personal injury",
    "Divorce": "Family law", "Child custody": "Family law", "DUI / DWI": "Criminal defense",
}
STATES = ("AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR "
          "PA RI SC SD TN TX UT VT VA WA WV WI WY DC").split()
PHONE = re.compile(r"\(?\b(\d{3})\)?[ .-](\d{3})[ .-](\d{4})\b")
ADDRESS = re.compile(r"(?<![\d-])\b(\d{2,6}[ \t]+[A-Z0-9][\w.'-]*(?:[ \t]+[\w.'#-]+){0,6}?,?(?:[ \t]+(?:Suite|Ste\.?|Unit|#)[ \t]*[\w-]+,?)?)[ \t]*"
                     r"(?:\n|,)\s*([A-Z][a-zA-Z.'-]+(?:\s[A-Z][a-zA-Z.'-]+){0,3}),\s*(" + "|".join(STATES) + r")\s+(\d{5})(?:-\d{4})?")
ROLE_WORDS = re.compile(r"\b(attorney|lawyer|partner|founder|founding|associate|of counsel|managing|esq\.?|shareholder|principal)\b", re.I)
NAME = re.compile(r"^(?:[A-Z][a-z]+\.?|[A-Z]\.)(?:\s(?:[A-Z][a-z'’-]+|[A-Z]\.)){1,3}(?:,?\s(?:Jr\.|Sr\.|III|II|Esq\.))?$")
# Words that make a Title Case line a heading, not a person ("Why Hire", "Custody Disputes", "Areas We Serve").
NOT_NAME = set("""why hire how what who when where which our your my we us me you meet team choose choosing areas area serve
serving served frequently asked questions question contact call get free view all read more learn see next back menu
protective orders order custody disputes dispute divorce divorces family child children support spousal maintenance
modification modifications enforcement agreement agreements prenuptial postnuptial marital rights grandparents
grandparent adoption adoptions paternity relocation mediation property division uncontested contested collaborative
military parental protecting visitation alimony criminal defense injury injuries accident accidents personal wrongful
death estate planning wills trusts probate immigration bankruptcy business employment appeals reviews review
testimonials testimonial results case cases client clients practice services service office offices blog news articles
resources faq consultation schedule privacy policy terms disclaimer sitemap copyright reserved home about welcome
helping help guide steps process experience trusted local county""".split())
ROLE_CANON = {"esq": "Attorney", "esq.": "Attorney", "founding": "Founding Attorney", "founder": "Founder", "managing": "Managing Attorney"}
AWARDS = re.compile(r"super lawyers|best lawyers|avvo|martindale|av preeminent|million dollar advocates|top 100|"
                    r"national trial lawyers|rising star|lawyers of distinction|board certified|expertise\.com", re.I)


@dataclass
class FactDraft:
    key: str
    category: str
    text: str
    source_url: str
    excerpt: str
    verified: bool = True
    requires_approval: bool = False
    note: str | None = None


@dataclass
class Extraction:
    facts: list = field(default_factory=list)
    practice_areas: list = field(default_factory=list)
    main_practice_area: str | None = None
    offices: list = field(default_factory=list)
    people: list = field(default_factory=list)
    languages: list = field(default_factory=list)
    tagline: str | None = None
    positioning: str | None = None
    firm_name: str | None = None


# ---------------------------------------------------------------- colours and type
def hex_rgb(h: str):
    h = h.lstrip("#")
    if len(h) == 3: h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgb_hex(rgb):
    return "#" + "".join(f"{max(0, min(255, round(v))):02X}" for v in rgb)


def luminance(h: str) -> float:
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = hex_rgb(h)
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def contrast(a: str, b: str) -> float:
    x, y = luminance(a), luminance(b)
    return (max(x, y) + 0.05) / (min(x, y) + 0.05)


def saturation(h: str) -> float:
    r, g, b = (v / 255 for v in hex_rgb(h))
    _, l, s = colorsys.rgb_to_hls(r, g, b)
    return s if 0.08 < l < 0.92 else 0.0


def ranked_colors(brand_read: dict) -> list[tuple[str, int]]:
    out = []
    for item in brand_read.get("top", []):
        m = re.match(r"(#[0-9A-Fa-f]{6})\s+x(\d+)", item)
        if m and m.group(1).upper() not in ELEMENTOR_DEFAULTS:
            out.append((m.group(1).upper(), int(m.group(2))))
    return out


def parse_style(s: str | None) -> dict | None:
    """'Montserrat | 700 | 48px | none | normal | #1B1C1E | #000000 | 0px' -> dict (brand_scan.js format)."""
    if not s:
        return None
    p = [x.strip() for x in s.split("|")]
    if len(p) < 8:
        return None
    return {"family": p[0], "weight": p[1], "size": p[2], "transform": p[3], "tracking": p[4], "color": p[5],
            "background": p[6], "radius": p[7]}


WEIGHT_STYLE = {"100": "Thin", "200": "ExtraLight", "300": "Light", "400": "Regular", "500": "Medium", "600": "SemiBold",
                "700": "Bold", "800": "ExtraBold", "900": "Black"}
# Font files are often named "Family-Weight" (PostScript names), and the scan reports that name: strip the style part.
_STYLE = r"(?:Thin|Hairline|(?:Extra|Ultra)?Light|Book|Regular|Normal|Roman|Medium|(?:Semi|Demi)Bold|(?:Extra|Ultra)?Bold|Heavy|Black|Italic|Oblique|Variable|VF|\d00)"
_STYLE_DASH = re.compile(rf"[-_](?:{_STYLE})+(?:[-_]?(?:{_STYLE}))*$", re.I)
# with a space only the unambiguous ones: "Archivo Black" and "Titan One" are real family names
_STYLE_SPACE = re.compile(r"\s+(?:(?:Extra|Ultra)Light|Light|Thin|Regular|Medium|(?:Semi|Demi|Extra|Ultra)Bold|Italic|Oblique)(?:\s*Italic)?$", re.I)


def family_name(name: str) -> str:
    """'Jost-SemiBold' -> 'Jost', 'Figtree SemiBold Italic' -> 'Figtree', 'Archivo Black' stays."""
    f = (name or "").strip().strip("'\"")
    for _ in range(3):
        g = _STYLE_SPACE.sub("", _STYLE_DASH.sub("", f)).strip()
        if g == f or not g:
            break
        f = g
    return f


GENERIC_FONTS = {"serif", "sans-serif", "system-ui", "-apple-system", "arial", "helvetica", "times new roman", "times", "georgia"}


def derive_visual_identity(brand_read: dict, logo_dark: str | None = None) -> tuple[dict, list[str]]:
    """Colour roles, fonts and CTA style for brand.json from the computed-CSS read. Returns (data, warnings).

    logo_dark: the logo's main dark colour (logos.dominant_dark). The most frequent dark CSS colour is often just the
    body text grey; the logo's navy/oxblood is the brand, so it wins as ink when it differs from the body text."""
    warnings = []
    if brand_read.get("reliable") is False:
        warnings.append("The site's stylesheets didn't load during the scan; colours and fonts below are unreliable. "
                        "Check them against the live site. " + (brand_read.get("why_unreliable") or ""))
    colors = ranked_colors(brand_read)
    h1, body, button = (parse_style(brand_read.get(k)) for k in ("h1", "body", "button"))
    darks = [c for c, _ in colors if luminance(c) < 0.06]
    lights = [c for c, _ in colors if luminance(c) > 0.8 and c != "#FFFFFF"]
    sats = sorted(((c, n) for c, n in colors if saturation(c) > 0.35), key=lambda x: -x[1])
    accent = None
    if button and button["background"] not in ("#000000", "#FFFFFF") and saturation(button["background"]) > 0.3:
        accent = button["background"]                       # the site's own CTA colour is the strongest signal
    elif sats:
        accent = sats[0][0]
    if not accent:
        accent = "#B5121B"; warnings.append("No saturated brand colour found; accent is a placeholder. Set it by hand.")
    ink = darks[0] if darks else (h1["color"] if h1 and luminance(h1["color"]) < 0.06 else "#1B1C1E")
    body_text = body["color"].upper() if body and body["color"].startswith("#") else None
    if logo_dark and logo_dark.upper() != body_text:
        ink = logo_dark.upper()
    elif not darks:
        warnings.append("No dark brand colour found; ink falls back to near-black.")
    paper = lights[0] if lights else "#F5F5F5"
    mids = [c for c, _ in colors if 0.1 < luminance(c) < 0.45 and saturation(c) < 0.25]
    muted = mids[0] if mids else "#6C7C86"
    body_col = body["color"] if body and 0.0 < luminance(body["color"]) < 0.25 else muted
    out = {"ink": ink, "accent": accent, "paper": paper, "muted": muted, "body": body_col, "line": "#D9DCDF"}
    if contrast(accent, ink) < 3:                         # accent text on the dark field must read: brighten it
        r, g, b = (v / 255 for v in hex_rgb(accent)); hh, ll, ss = colorsys.rgb_to_hls(r, g, b)
        for step in range(1, 12):
            cand = rgb_hex(tuple(v * 255 for v in colorsys.hls_to_rgb(hh, min(0.85, ll + 0.05 * step), ss)))
            if contrast(cand, ink) >= 3:
                out["accentBright"] = cand; break
    treatments = {}
    if contrast("#FFFFFF", accent) < 3:
        treatments = {"accent": {"head": ["ink", 1], "body": ["ink", 1]}}
        warnings.append(f"White text on the accent {accent} is below 3:1; accent fields use ink text.")

    def font(st, fallback):
        fam = family_name(st["family"]) if st else ""
        if not fam or fam.lower() in GENERIC_FONTS:
            return fallback, False
        return fam, True
    head_fam, ok_h = font(h1, "Montserrat")
    body_fam, ok_b = font(body, "Lato")
    if not ok_h: warnings.append("Headline font not identified (generic or missing); Montserrat is a placeholder.")
    if not ok_b: warnings.append("Body font not identified (generic or missing); Lato is a placeholder.")
    hw = WEIGHT_STYLE.get(str(h1["weight"]) if h1 else "700", "Bold")
    if hw in ("Thin", "ExtraLight", "Light", "Regular", "Medium"):
        hw = "Bold"                                         # social headlines need weight; the site's light h1 is noted
    fonts = {"head": {"family": head_fam, "bold": hw, "semi": "SemiBold"}, "body": {"family": body_fam, "regular": "Regular"}}
    if button:
        bf, okf = font(button, head_fam)
        if okf and bf not in (head_fam, body_fam):
            fonts["ui"] = {"family": bf, "semi": WEIGHT_STYLE.get(str(button["weight"]), "Bold")}
    cta = {"radius": 999, "upper": False}
    if button:
        m = re.match(r"([\d.]+)px", button["radius"] or "")
        cta = {"radius": min(999, round(float(m.group(1)))) if m else 0, "upper": button["transform"] == "uppercase"}
    evidence = {"colors": "Computed CSS frequency on the home page: " + ", ".join(f"{c} ×{n}" for c, n in colors[:6])
                + (f"; ink {ink} is the logo's main dark colour" if ink == (logo_dark or "").upper() else ""),
                "fonts": f"h1: {brand_read.get('h1')}; body: {brand_read.get('body')}",
                "cta": f"button: {brand_read.get('button')}"}
    return {"colors": out, "fonts": fonts, "cta": cta, "treatments": treatments, "evidence": evidence}, warnings


# ---------------------------------------------------------------- facts
def _sentences(text: str):
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        for s in re.split(r"(?<=[.!?])\s+(?=[A-Z\"“])", line):
            s = s.strip()
            if 3 <= len(s) <= 400:
                yield s


def _key(base: str, used: set) -> str:
    k = re.sub(r"[^a-z0-9]+", "_", base.lower()).strip("_")[:60] or "fact"
    out, n = k, 2
    while out in used:
        out, n = f"{k}_{n}", n + 1
    used.add(out)
    return out


def _looks_like_name(l: str) -> bool:
    if not NAME.match(l) or len(l) > 40 or ROLE_WORDS.search(l):
        return False
    if re.search(r"\b(Law|Firm|Group|LLP|PLLC|LLC|PC|Street|Avenue|Road|Suite|The)\b", l):
        return False
    if any(w in NOT_NAME for w in re.findall(r"[a-z]+", l.lower())):
        return False
    words = [w for w in re.sub(r",?\s(Jr\.|Sr\.|III|II|Esq\.)$", "", l).split()]
    if len(words) > 3 and not any(re.fullmatch(r"[A-Z]\.", w) for w in words):
        return False                                        # four capitalised words without an initial is a heading
    return not any(re.search(rx, l, re.I) for rx in PRACTICE_AREAS.values())


def _role(line: str) -> str:
    """The role as a plain title. Page copy like "A Leading Austin Divorce Attorney" is marketing (and "leading" is a
    blocked superlative), so it becomes just "Attorney"."""
    from .compliance import EXPERT, SUPERLATIVE
    line = line.strip(" ,-–|")
    if len(line) <= 40 and not SUPERLATIVE.search(line) and not EXPERT.search(line) and not re.match(r"(a|an|the|your|our)\b", line, re.I):
        return line
    words = [w.lower() for w in ROLE_WORDS.findall(line)]
    w = words[0] if words else "attorney"
    return ROLE_CANON.get(w, w.title())


def extract(pages: list[dict], jsonld: list[dict] | None = None, firm_name: str | None = None) -> Extraction:
    """pages: [{name, url, title, text, nav: [link texts], meta: {description, og_site_name}}] (home first)."""
    ex = Extraction(firm_name=firm_name)
    used: set = set()
    seen_text: set = set()

    def add(base, category, text, page, excerpt, **kw):
        norm = re.sub(r"\W+", " ", text.lower()).strip()
        if norm in seen_text:
            return None
        seen_text.add(norm)
        f = FactDraft(key=_key(base, used), category=category, text=text, source_url=page["url"], excerpt=excerpt,
                      verified=excerpt in page["text"] or excerpt in " ".join(page.get("nav", [])),
                      requires_approval=category in APPROVAL_CATEGORIES, **kw)
        ex.facts.append(f)
        return f

    home = pages[0] if pages else {"text": "", "url": "", "nav": [], "meta": {}}
    meta = home.get("meta") or {}
    ex.firm_name = firm_name or meta.get("og_site_name") or None
    for d in jsonld or []:
        if not ex.firm_name and d.get("@type") in ("LegalService", "Attorney", "LawFirm", "Organization", "LocalBusiness") and d.get("name"):
            ex.firm_name = d["name"]

    # tagline / positioning
    h1 = (home.get("h1") or "").strip()
    if h1 and 3 <= len(h1) <= 140:
        ex.tagline = h1
        add("tagline", "messaging", h1, home, h1)
    if meta.get("description") and 20 <= len(meta["description"]) <= 300:
        ex.positioning = meta["description"].strip()

    # practice areas: navigation links count most, then home text, then all text
    hits = Counter()
    for p in pages:
        nav = " \n ".join(p.get("nav", []))
        for area, rx in PRACTICE_AREAS.items():
            n_nav = len(re.findall(rx, nav, re.I))
            n_txt = len(re.findall(rx, p["text"], re.I))
            if n_nav or n_txt:
                hits[area] += 3 * n_nav + n_txt * (2 if p is home else 1)
    ex.practice_areas = [a for a, n in hits.most_common() if n >= 2]
    umbrella = Counter()
    for a, n in hits.items():
        umbrella[MAIN_AREA_GROUP.get(a, a)] += n
    if umbrella:
        ex.main_practice_area = umbrella.most_common(1)[0][0]
    if ex.practice_areas:
        src = next((p for p in pages if any(re.search(PRACTICE_AREAS[ex.practice_areas[0]], t, re.I) for t in p.get("nav", []))), home)
        nav_hits = [t for t in src.get("nav", []) if any(re.search(PRACTICE_AREAS[a], t, re.I) for a in ex.practice_areas)]
        if nav_hits:
            add("practice_areas", "services", "Practice areas listed on the site: " + ", ".join(dict.fromkeys(nav_hits)) + ".",
                src, nav_hits[0])

    # offices (addresses) and phones with the line they belong to
    for p in pages:
        for m in ADDRESS.finditer(p["text"]):
            street, city, st, zp = (m.group(i).strip(" ,") for i in range(1, 5))
            if any(o["city"] == city and o["street"] == street for o in ex.offices):
                continue
            ex.offices.append({"city": city, "state": st, "street": street, "zip": zp, "source": p["url"]})
    for d in jsonld or []:
        a = d.get("address") if isinstance(d.get("address"), dict) else None
        if a and a.get("addressLocality") and not any(o["city"] == a["addressLocality"] for o in ex.offices):
            ex.offices.append({"city": a["addressLocality"], "state": a.get("addressRegion", ""), "street": a.get("streetAddress", ""),
                               "zip": a.get("postalCode", ""), "source": home["url"], "phone": d.get("telephone")})
    if ex.offices:
        pg = next((p for p in pages if p["url"] == ex.offices[0]["source"]), home)
        excerpt = ex.offices[0]["street"]
        add("offices", "locations", "Offices: " + "; ".join(f"{o['street']}, {o['city']}, {o['state']} {o['zip']}".strip() for o in ex.offices) + ".",
            pg, excerpt)
    phones: dict[str, dict] = {}
    for p in pages:
        for line in p["text"].splitlines():
            for m in PHONE.finditer(line):
                num = f"({m.group(1)}) {m.group(2)}-{m.group(3)}"
                ctx = re.sub(r"\s*[·|,:–-]?\s*$", "", line.replace(m.group(0), "").strip())[:160] or m.group(0)
                if num not in phones:
                    phones[num] = {"number": num, "context": ctx, "page": p, "raw": m.group(0)}
    for o in ex.offices:
        for num, ph in phones.items():
            if o["city"].lower() in ph["context"].lower():
                o.setdefault("phone", num)
    if phones:
        first = next(iter(phones.values()))
        listed = "; ".join(f"{n} ({ph['context'][:60]})" if ph["context"] != ph["raw"] else n for n, ph in phones.items())
        add("phones", "phones", f"Phone numbers on the site: {listed}.", first["page"], first["raw"],
            note="Confirm which number(s) appear on social.")

    # sentence-level facts
    rules = [
        ("founded", "history", re.compile(r"\b(founded|established|since|serving .{0,40} since|opened)\b.{0,60}\b(19[5-9]\d|20[0-2]\d)\b", re.I)),
        ("experience", "history", re.compile(r"\b\d{1,3}\+?\s*(years|yrs)\b.{0,40}\b(experience|practice|serving|fighting|combined)", re.I)),
        ("results", "results", re.compile(r"\$\s?\d[\d,.]*\s*(million|billion|k\b)?|\b(verdict|settlement|recovered|recovery|won)\b.{0,40}\$", re.I)),
        ("reviews", "reviews", re.compile(r"\b\d(\.\d)?\s*(stars?|/\s*5|out of 5)\b|\b\d[\d,]*\+?\s*(five[- ]star |5[- ]star )?(reviews|ratings)\b", re.I)),
        ("fees", "fees", re.compile(r"no fee unless|no fees? unless|don'?t pay unless|no win,? no fee|contingency fee|free consultation|free case (review|evaluation)|no upfront", re.I)),
        ("availability", "promise", re.compile(r"\b24/7\b|24 hours a day|available around the clock|we come to you|home or hospital visits?", re.I)),
        ("languages", "languages", re.compile(r"se habla español|hablamos español|habla español|\bspanish[- ]speaking|\bwe speak (spanish|vietnamese|korean|chinese|portuguese)", re.I)),
        ("awards", "awards", AWARDS),
        ("trial", "differentiator", re.compile(r"\b(trial lawyers?|trial attorneys?|go to trial|take cases? to trial|courtroom experience)\b", re.I)),
        ("family_owned", "differentiator", re.compile(r"family[- ]owned|family firm", re.I)),
        ("mission", "messaging", re.compile(r"\b(our mission|we believe|we fight|we are committed|our commitment)\b", re.I)),
    ]
    for p in pages:
        for s in _sentences(p["text"]):
            if PHONE.search(s) and len(s) < 40:
                continue
            for base, cat, rx in rules:
                if rx.search(s):
                    if cat == "languages":
                        lang = "Spanish" if re.search(r"espa|spanish", s, re.I) else re.search(r"speak (\w+)", s, re.I).group(1).title()
                        if lang not in ex.languages: ex.languages.append(lang)
                    add(base, cat, s, p, s); break

    # testimonials: quoted passages on review/testimonial pages
    for p in pages:
        if not re.search(r"review|testimonial|client", p["url"] + " " + p.get("title", ""), re.I):
            continue
        for m in re.finditer(r"[\"“]([^\"”]{30,400})[\"”]", p["text"]):
            add("testimonial", "testimonial", m.group(1).strip(), p, m.group(1).strip(),
                note="Verbatim client words: use only with the client's written consent and the firm's approval.")

    # people: a name line followed (within two lines) by a short role line
    for p in pages:
        lines = [l.strip() for l in p["text"].splitlines() if l.strip()]
        for i, l in enumerate(lines):
            if not _looks_like_name(l) or (i + 1 < len(lines) and _looks_like_name(lines[i + 1])):
                continue                                    # a heading over the real name ("Why Hire" / "Dana Reyes")
            role_line = next((x for x in lines[i + 1:i + 3] if ROLE_WORDS.search(x) and len(x) <= 70 and not re.search(r"[?©]", x)), None)
            if role_line and not any(x["name"] == l for x in ex.people):
                ex.people.append({"name": l, "role": _role(role_line), "source": p["url"]})
    for d in jsonld or []:
        for person in (d.get("employee") or d.get("member") or []) if isinstance(d.get("employee") or d.get("member"), list) else []:
            if isinstance(person, dict) and person.get("name") and not any(x["name"] == person["name"] for x in ex.people):
                ex.people.append({"name": person["name"], "role": person.get("jobTitle", "Attorney"), "source": home["url"]})
    if ex.people:
        src = next((p for p in pages if p["url"] == ex.people[0]["source"]), home)
        add("attorneys", "people", "Attorneys: " + "; ".join(f"{x['name']} ({x['role']})" for x in ex.people[:12]) + ".", src, ex.people[0]["name"])

    # conflicting numbers in the same category (e.g. "20 years" vs "40 years"): neither is trusted until a human picks
    by_cat: dict[str, list] = {}
    for f in ex.facts:
        if f.category == "history" and f.key.startswith("experience"):
            by_cat.setdefault("experience", []).append(f)
    exp = by_cat.get("experience", [])
    years = {re.search(r"\d{1,3}", f.text).group(0) for f in exp}
    if len(years) > 1:
        for f in exp:
            f.verified = False
            f.note = f"Conflicting experience claims on the site ({', '.join(sorted(years))} years): confirm which is right."
    return ex
