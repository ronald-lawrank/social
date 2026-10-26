"""The Design tab of a campaign gallery: the client's design guide, generated from brand.json, the chosen direction,
the approval state in facts.xlsx and the usable photos. Sample copy comes from brandcopy (the firm's approved words or
neutral copy for its practice area), so the guide never shows an invented claim."""
import html
import re
from collections import Counter
from pathlib import Path

from . import brandcopy, store, templates, theme
from .extract import contrast
from .util import read_json

e = html.escape

ROLES = [("ink", "Ink", "Dark fields and headlines on light fields."),
         ("accent", "Accent", "Accent fields, buttons, rules and the accent phrase on light fields."),
         ("accentBright", "Accent on dark", "Accent words and big carousel words on ink."),
         ("paper", "Paper", "Light fields."),
         ("body", "Body text", "Support copy on light fields."),
         ("muted", "Muted", "Labels, footers and small print."),
         ("line", "Line", "Dividers and hairlines on light fields.")]
PAIRS = [("#FFFFFF", "ink", "White on ink"), ("#FFFFFF", "accent", "White on accent"), ("accentBright", "ink", "Accent words on ink"),
         ("ink", "paper", "Ink on paper"), ("accent", "paper", "Accent on paper"), ("body", "paper", "Body on paper"),
         ("muted", "paper", "Muted on paper"), ("ink", "accent", "Ink on accent")]
FORMAT_RULES = {"4x5": "The main feed size. Logo top left; all text inside the safe margin.",
                "1x1": "Square crops of feed posts; support lines may drop to fit.",
                "9x16": "Stories and reels. Keep text out of the top and bottom bands, where the app covers it.",
                "fb-cover": "People on the right, one calm line on the left, clear of the profile picture.",
                "li-banner": "Headline right of the logo area; the firm's people on the right.",
                "profile": "The logo mark only (or the full logo if there's no mark), centred for the circle crop.",
                "highlight": "One icon and a short label in the centre circle."}
CSS = """
.dg{max-width:1200px;margin:0 auto;padding:4px 0 60px}
.dg section{background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:22px 24px;margin:16px 0}
.dg h2{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--dg-accent);margin:0 0 16px;display:flex;align-items:center;gap:10px}
.dg h2:before{content:'';width:24px;height:2px;background:var(--dg-accent)}
.dg h3{font-size:15px;margin:18px 0 6px}
.dg .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
.dg .logo{border:1px solid #E5E7EB;border-radius:8px;height:130px;display:grid;place-items:center;padding:24px}
.dg .logo img{max-width:100%;max-height:70px}
.dg .sw{display:flex;gap:12px;align-items:flex-start}.dg .chip{width:56px;height:56px;border-radius:6px;flex:none;border:1px solid rgba(0,0,0,.08)}
.dg .sw b{display:block}.dg .sw code{font-size:12px;color:#6B7280}.dg .sw p{margin:2px 0 0;font-size:13px;color:#4B5563}
.dg .pairs{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px;margin-top:16px}
.dg .pair{border-radius:8px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px;font-weight:600;border:1px solid rgba(0,0,0,.06)}
.dg .r{font:600 12px/1.6 -apple-system,Arial,sans-serif;padding:0 8px;border-radius:999px;background:rgba(255,255,255,.92);color:#111827;white-space:nowrap}
.dg .r.no{background:#FEE2E2;color:#991B1B}.dg .r.mid{background:#FEF3C7;color:#92400E}
.dg .type{display:grid;grid-template-columns:1.2fr 1fr;gap:28px}@media(max-width:800px){.dg .type{grid-template-columns:1fr}}
.dg .spec{font-size:12px;color:#6B7280;margin-bottom:4px}
.dg .h{font-weight:700;font-size:46px;line-height:1.05;letter-spacing:-.01em;margin:0}
.dg .lab{font-weight:600;font-size:12px;letter-spacing:.16em;text-transform:uppercase;display:flex;align-items:center;gap:10px}
.dg .lab:before{content:'';width:22px;height:2px;background:currentColor}
.dg .bd{font-size:18px;line-height:1.45;margin:0}
.dg .btn{display:inline-flex;gap:10px;align-items:center;font-weight:600;letter-spacing:.06em;font-size:14px;padding:12px 18px}
.dg .tr{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
.dg .card{border-radius:8px;padding:26px 24px;min-height:250px;display:flex;flex-direction:column;gap:12px}
.dg .card .h{font-size:30px}.dg .card p{margin:0;font-size:15px}.dg .card .tag{margin-top:auto;font-size:12px;opacity:.85;font-family:-apple-system,Arial,sans-serif}
.dg .rules{display:grid;grid-template-columns:1fr 1fr;gap:10px 28px}@media(max-width:800px){.dg .rules{grid-template-columns:1fr}}
.dg ul{margin:4px 0 0;padding-left:20px}.dg li{margin:4px 0}.dg .do li::marker{content:'\\2713  ';color:#059669}.dg .dont li::marker{content:'\\2715  ';color:#B91C1C}
.dg .photos{display:flex;gap:14px;flex-wrap:wrap}.dg .photos figure{margin:0;width:220px}
.dg .photos img{width:100%;height:160px;object-fit:cover;border-radius:6px}.dg .photos figcaption{font-size:12px;color:#6B7280;margin-top:4px}
.dg table{border-collapse:collapse;width:100%;font-size:14px}.dg td,.dg th{text-align:left;padding:7px 10px;border-bottom:1px solid #E5E7EB;vertical-align:top}
.dg th{color:#6B7280;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.06em}
.dg .note{font-size:13px;color:#6B7280}
"""


def _rel(path: Path, start: Path) -> str:
    import os
    return Path(os.path.relpath(path, start)).as_posix()


def _accent(text: str, phrase: str, color: str) -> str:
    t = e(text)
    if phrase and phrase.lower() in text.lower():
        i = text.lower().index(phrase.lower())
        t = e(text[:i]) + f"<span style='color:{color}'>" + e(text[i:i + len(phrase)]) + "</span>" + e(text[i + len(phrase):])
    return t


def _squash(t: str) -> str:
    return re.sub(r"\s+", " ", t).strip()


def _clip(t: str, n: int) -> str:
    return t if len(t) <= n else t[:n].rsplit(" ", 1)[0] + "…"


def _mix(d: Path) -> Counter:
    """Treatments actually used in the campaign's written posts (kit and test designs aside)."""
    n = Counter()
    for f in (d / "posts").glob("*.json"):
        p = read_json(f) or {}
        if p.get("format") in ("kit", "motion"):
            continue
        for o in p.get("options", []):
            try:
                n[o.get("treatment") or templates.get(o["template"]).get("treatment") or "dark"] += 1
            except Exception:
                pass
    return n


def render(c: store.Client, d: Path, font_css: str = "") -> tuple[str, str]:
    """(css, html) for the Design tab of d/index.html."""
    from .campaign import DIRECTIONS
    b = c.brand()
    C = b["colors"]
    col = lambda k: C.get(k, k) if not k.startswith("#") else k
    T = theme.treatments(b)
    facts = store.read_facts(c)
    copy = brandcopy.brand_copy(c, facts)
    F = b.get("fonts") or {}
    head = (F.get("head") or {}).get("family", "sans-serif")
    body = (F.get("body") or {}).get("family", "sans-serif")
    ui = (F.get("ui") or F.get("head") or {}).get("family", head)
    cta = b.get("cta") or {}
    radius, upper = cta.get("radius", 4), cta.get("upper", True)
    logos, photos_dir = c.brand_dir / "logos", c.brand_dir / "photos"
    css = font_css + f"\n.dg{{--dg-accent:{C['accent']}}}" + CSS + \
        f"\n.dg .h{{font-family:'{head}',sans-serif}}.dg .bd,.dg .card p{{font-family:'{body}',sans-serif}}" \
        f".dg .lab,.dg .btn{{font-family:'{ui}',sans-serif}}.dg .btn{{border-radius:{radius}px;text-transform:{'uppercase' if upper else 'none'}}}"
    out = ["<div class='dg'>"]

    # direction + treatment mix
    k = (c.data.get("direction") or "").upper()
    dd = DIRECTIONS.get(k)
    mix = _mix(d)
    total = sum(mix.values())
    if dd:
        want = Counter(tr for _, tr in dd["set"])
        target = ", ".join(f"{tr} {round(100 * n / sum(want.values()))}%" for tr, n in want.most_common())
        lead = f"<p style='margin:0 0 6px'><b>{e(k)} · {e(dd['name'])}.</b> {e(dd['why'])}</p>" \
               f"<p class='note' style='margin:0'>Treatment mix this direction leans on: {e(target)}. Vary it so the feed doesn't repeat itself."
    else:
        lead = "<p style='margin:0 0 6px'><b>No direction chosen yet.</b> Run the test designs and record the client's choice " \
               "(<code>lr client set … direction=B</code>).</p><p class='note' style='margin:0'>"
    if total:
        lead += " So far in this campaign: " + ", ".join(f"{tr} {round(100 * n / total)}%" for tr, n in mix.most_common()) + "."
    out.append(f"<section><h2>Direction</h2>{lead}</p></section>")

    # logo
    logo = b.get("logo") or {}
    tiles = []
    for name, bg, alt in (("logo-dark.svg", "#FFFFFF", "dark version"), ("logo-white.svg", C["ink"], "white version on ink"),
                          ("logo-white.svg", C["accent"], "white version on accent")):
        if (logos / name).exists():
            tiles.append(f"<div class='logo' style='background:{bg}'><img src='{e(_rel(logos / name, d))}' alt='Logo, {alt}'></div>")
    if (logos / "mark-dark.svg").exists():
        tiles.append(f"<div class='logo' style='background:#fff'><img src='{e(_rel(logos / 'mark-dark.svg', d))}' alt='Logo mark'></div>")
    dont = ["Don't recolour, stretch, outline or add effects.", "Don't place it on a busy photo without a solid band behind it."]
    if logo.get("status") == "raster":
        dont.append("The current logo is an image from the website: ask the firm for the vector logo (SVG or PDF).")
    elif logo.get("status") == "missing" or not tiles:
        dont.append("No logo yet: add the firm's logo to brand/logos/ and run lr client refresh.")
    do = ["Dark logo on white or paper; white logo on ink or the accent colour.", "Keep clear space of at least half the logo's height on every side."]
    if (logos / "mark-dark.svg").exists():
        do.append("Profile pictures use the mark on its own.")
    out.append("<section><h2>Logo</h2><div class='grid'>" + "".join(tiles) + "</div><div class='rules' style='margin-top:14px'>"
               + "<ul class='do'>" + "".join(f"<li>{e(x)}</li>" for x in do) + "</ul><ul class='dont'>"
               + "".join(f"<li>{e(x)}</li>" for x in dont) + "</ul></div></section>")

    # colour
    sw = "".join(f"<div class='sw'><div class='chip' style='background:{C[r]}'></div><div><b>{e(n)}</b><code>{e(C[r])}</code><p>{e(t)}</p></div></div>"
                 for r, n, t in ROLES if C.get(r))
    pairs = ""
    for fg, bg, label in PAIRS:
        if not (fg.startswith("#") or C.get(fg)) or not C.get(bg):
            continue
        r = contrast(col(fg), col(bg))
        ok, cls = ("Body text", "") if r >= 4.5 else (("Large type only", "mid") if r >= 3 else ("Don't use", "no"))
        pairs += f"<div class='pair' style='background:{col(bg)};color:{col(fg)}'><span>{e(label)}</span><span class='r {cls}'>{r:.1f}:1 · {ok}</span></div>"
    out.append(f"<section><h2>Colour</h2><div class='grid'>{sw}</div><h3>Text on colour (WCAG contrast)</h3><div class='pairs'>{pairs}</div>"
               "<p class='note'>Body text needs 4.5:1; headlines and big words need 3:1. The studio checks this on every render.</p></section>")

    # typography
    acc_light = T["light"]["acc"]
    out.append(
        "<section><h2>Typography</h2><div class='type'><div>"
        f"<div class='spec'>Headlines · {e(head)} {e(str((F.get('head') or {}).get('weight', 700)))} · sentence case · tight leading</div>"
        f"<p class='h' style='color:{C['ink']}'>{_accent(copy['headline'], copy['accent'], acc_light)}</p>"
        f"<div class='spec' style='margin-top:18px'>Support · {e(body)} · never smaller than 30 px on a 1080 px post</div>"
        f"<p class='bd' style='color:{T['light']['fg2']}'>{e(copy['support'])}</p></div><div>"
        f"<div class='spec'>Labels · {e(ui)} · uppercase · wide tracking</div><div class='lab' style='color:{acc_light}'>{e(copy['label'])}</div>"
        f"<div class='spec' style='margin-top:22px'>Buttons · {e(ui)} · {'uppercase' if upper else 'sentence case'} · {'square' if not radius else str(radius) + ' px'} corners</div>"
        f"<div style='display:flex;gap:10px;flex-wrap:wrap'><span class='btn' style='background:{T['light']['btn_bg']};color:{T['light']['btn_fg']}'>{e(copy['cta'])} →</span>"
        f"<span class='btn' style='background:{T['dark']['btn_bg']};color:{T['dark']['btn_fg']}'>{e(copy['cta2'])} →</span></div>"
        "<h3>Accent phrase</h3><p class='note' style='margin:0'>One phrase per headline is coloured: the payoff, copied word for word "
        "from the headline. The accent colour on light fields, the bright accent on ink, and the field's text colour on the accent field.</p>"
        "</div></div>" + (f"<p class='note'>{e('; '.join(b.get('font_notes', [])))}</p>" if b.get("font_notes") else "") + "</section>")

    # treatments
    use_for = {"dark": "Photo posts, posters and alternate carousel slides.", "accent": "Statements, FAQs and short lists.",
               "light": "Explainers, checklists and the myth half of myth-vs-fact."}
    cards = ""
    for t in ("dark", "accent", "light"):
        tt = T[t]
        share = f"{round(100 * mix[t] / total)}% of this campaign so far" if total else ""
        cards += (f"<div class='card' style='background:{tt['bg']};color:{tt['fg']}'><div class='lab' style='color:{tt['acc_small']}'>{t.title()}</div>"
                  f"<p class='h' style='color:{tt['fg']}'>{_accent(copy['headline'], copy['accent'], tt['acc'])}</p>"
                  f"<p style='color:{tt['fg2']}'>{e(use_for[t])}</p><span class='tag'>{e(share)}</span></div>")
    out.append(f"<section><h2>Treatments</h2><div class='tr'>{cards}</div><p class='note'>Text colours on each field are computed "
               "to stay readable; don't override them.</p></section>")

    # photography
    pics = read_json(photos_dir / "photos.json", {}) or {}
    usable = [(k2, p) for k2, p in pics.items() if p.get("use", True)]
    figs = ""
    for k2, p in usable[:10]:
        what = p.get("name") or p.get("kind", "photo")
        small = " Small original: keep it out of full-bleed layouts." if (p.get("w") or 2000) < 1080 else ""
        figs += (f"<figure><img loading='lazy' src='{e(_rel(photos_dir / p['file'], d))}' alt='{e(what)}'>"
                 f"<figcaption><b>{e(k2)}</b> · {e(what)}.{e(small)}</figcaption></figure>")
    set_aside = [k2 for k2, p in pics.items() if not p.get("use", True)]
    people = any(p.get("kind") in ("person", "group") for _, p in usable)
    out.append("<section><h2>Photography</h2>" + (f"<div class='photos'>{figs}</div>" if figs else
               "<p class='note'>No usable photos yet: ask the firm for attorney headshots and a team photo. Until then, designs are type-led.</p>")
               + "<div class='rules' style='margin-top:14px'><ul class='do'><li>Only the firm's own photos.</li>"
               "<li>Faces stay clear of text; heads are never cropped.</li><li>Rotate photos so the same one doesn't run twice in a row.</li>"
               + ("" if people else "<li>Use type-led templates until there are photos of the firm's people.</li>")
               + "</ul><ul class='dont'><li>No stock photos and no AI-generated people.</li><li>No site banners with text baked in.</li>"
               "<li>Don't brighten, recolour or retouch the firm's photos.</li></ul></div>"
               + (f"<p class='note'>Set aside: {e(', '.join(set_aside[:12]))} (see photos.json for why).</p>" if set_aside else "") + "</section>")

    # formats
    rows = "".join(f"<tr><td>{e(s['label'])}</td><td>{s['w']} × {s['h']}</td><td>{e(FORMAT_RULES.get(k2, ''))}</td></tr>"
                   for k2, s in templates.SIZES.items() if k2 != "board")
    out.append(f"<section><h2>Formats</h2><table><tr><th>Format</th><th>Size</th><th>Rule</th></tr>{rows}</table>"
               "<p class='note'>Carousels: a cover that hooks, one point per slide (3–6), and a close slide with the call to action.</p></section>")

    # words
    voice = (b.get("voice") or {})
    notes = voice.get("notes") or []
    pending = [f["text"] for f in facts.values() if f["status"] == "needs approval"]
    cta_list = ['"Talk to us"', '"Call today"', '"Learn more"'] + (['"Free consultation"'] if copy["free_ok"] else [])
    do = [*notes, "Plain, calm, specific. Write from the client's side rather than the firm's.",
          "Headlines 4–10 words, sentence case, no exclamation marks or emoji.",
          f"Calls to action: {', '.join(cta_list)}."]
    if copy["tagline_locked"]:
        do.append(f"The tagline is locked as written: \"{voice.get('tagline')}\".")
    city = copy["support"].split(" in ")[-1].rstrip(".") if " in " in copy["support"] else ""
    if city:
        do.append(f"Mention {city} where it fits.")
    dont = ['No "guarantee", "best", "#1", "leading", "top-rated", "expert" or "specialist".',
            "No promised outcomes: promise service, not results.",
            'Any result carries: "Past results do not guarantee future outcomes."']
    if not copy["free_ok"]:
        dont.append('No "free" consultation or "no fee" wording until the firm approves its fees fact.')
    out.append("<section><h2>Words</h2><div class='rules'><div><h3>Voice</h3><ul class='do'>" + "".join(f"<li>{e(x)}</li>" for x in do)
               + "</ul></div><div><h3>Claims (attorney advertising)</h3><ul class='dont'>" + "".join(f"<li>{e(x)}</li>" for x in dont)
               + "</ul></div></div>"
               + ("<h3>Waiting for the firm's approval</h3><ul>" + "".join(f"<li>{e(_clip(_squash(t), 150))}</li>" for t in pending[:14])
                  + "</ul><p class='note'>Approve these in brand/facts.xlsx before they appear in any post.</p>" if pending else "")
               + "<p class='note'>Captions: 1–3 short paragraphs, then a call to action. At most 3 hashtags. Every post has alt text that includes the headline.</p></section>")
    out.append("</div>")
    return css, "".join(out)
