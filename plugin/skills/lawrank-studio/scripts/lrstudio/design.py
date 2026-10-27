"""The Design tab of a campaign's gallery (index.html): colours, logo, typography, treatments, photos, formats and words,
generated from brand.json, client.json (direction) and the approvals in facts.xlsx, so it never drifts from what the
engine draws. Rewritten with the gallery on every build; its CSS is scoped to #tab-design.

Sample copy here is educational copy for the practice area or the firm's own facts; it never makes a claim."""
import html
import os
import re
import shutil
from collections import Counter
from pathlib import Path

from . import campaign, compliance, fonts, store, templates, theme
from .extract import contrast
from .util import read_json

e = html.escape
HEX = re.compile(r"#[0-9a-fA-F]{3,8}")

ROLES = [("ink", "Ink", "Dark fields, headlines on light, the dark logo."),
         ("accent", "Accent", "Accent fields, buttons, rules and accent words on light."),
         ("accentBright", "Accent on dark", "Accent words and big carousel words on ink. Never on the accent field."),
         ("paper", "Paper", "Light fields: myth-vs-fact, checklists, light cards."),
         ("body", "Body text", "Support copy on light fields."),
         ("muted", "Muted", "Secondary details: labels, footers, small print."),
         ("line", "Line", "Dividers and hairlines on light fields.")]
PAIRS = [("#FFFFFF", "ink", "White on ink"), ("#FFFFFF", "accent", "White on accent"), ("ink", "accent", "Ink on accent"),
         ("accentBright", "ink", "Accent words on ink"), ("ink", "paper", "Ink on paper"), ("accent", "paper", "Accent on paper"),
         ("body", "paper", "Body on paper"), ("muted", "paper", "Muted on paper"), ("accentBright", "accent", "Accent-on-dark on accent")]
TREATMENT_USE = {"dark": "Ink field: posters, statements, alternate carousel slides.",
                 "light": "Paper field: myth-vs-fact, checklists, FAQs and calm educational posts.",
                 "accent": "Accent field: the most recognisable look; statements, FAQs, icon lists."}

CSS = """
*{box-sizing:border-box}
:scope{display:block;max-width:1200px;margin:0 auto;color:#111827;font:15px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Arial,sans-serif}
section{background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:22px 24px;margin:16px 0}
h2{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin:0 0 16px;display:flex;align-items:center;gap:10px}
h2:before{content:'';width:24px;height:2px;background:var(--accent)}h3{font-size:15px;margin:18px 0 6px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
.logo{border:1px solid #E5E7EB;border-radius:8px;height:130px;display:grid;place-items:center;padding:24px}.logo img{max-width:100%;max-height:70px}
.logo span{font-size:12px;color:#6B7280}
.sw{display:flex;gap:12px;align-items:flex-start}.chip{width:56px;height:56px;border-radius:6px;flex:none;border:1px solid rgba(0,0,0,.08)}
.sw b{display:block}.sw code{font-size:12px;color:#6B7280}.sw p{margin:2px 0 0;font-size:13px;color:#4B5563}
.pairs{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px;margin-top:16px}
.pair{border-radius:8px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px;font-weight:600;line-height:1.3;border:1px solid rgba(0,0,0,.06)}
.r{flex:none;font:600 12px/1.6 -apple-system,Arial,sans-serif;padding:2px 9px;border-radius:999px;background:rgba(255,255,255,.9);color:#111827;white-space:nowrap}
.r.no{background:#FEE2E2;color:#991B1B}.r.mid{background:#FEF3C7;color:#92400E}
.type{display:grid;grid-template-columns:1.2fr 1fr;gap:28px}@media(max-width:800px){.type{grid-template-columns:1fr}}
.spec{font-size:12px;color:#6B7280;margin-bottom:4px}
.h{font-family:var(--f-head);font-weight:var(--w-head);color:var(--ink);font-size:46px;line-height:1.05;letter-spacing:-.01em;margin:0}
.h em{font-style:normal;color:var(--acc-light)}
.lab{font-family:var(--f-ui);font-weight:600;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--acc-light);display:flex;align-items:center;gap:10px}
.lab:before{content:'';width:22px;height:2px;background:currentColor}
.bd{font-family:var(--f-body);color:var(--body);font-size:18px;line-height:1.45}
.btn{display:inline-flex;gap:10px;align-items:center;font-family:var(--f-ui);font-weight:600;letter-spacing:.06em;font-size:14px;padding:12px 18px}
.tr{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
.card{border-radius:8px;padding:26px 24px;min-height:250px;display:flex;flex-direction:column;gap:12px}
.card .h{font-size:30px;color:inherit}.card .lab{color:inherit}.card p{font-family:var(--f-body);margin:0;font-size:15px}
.card .tag{margin-top:auto;font:12px/1.4 -apple-system,Arial,sans-serif;opacity:.85}
.rules{display:grid;grid-template-columns:1fr 1fr;gap:10px 28px}@media(max-width:800px){.rules{grid-template-columns:1fr}}
ul{margin:4px 0 0;padding-left:20px}li{margin:4px 0}.do li::marker{content:'✓  ';color:#059669}.dont li::marker{content:'✕  ';color:#B91C1C}
.photos{display:flex;gap:14px;flex-wrap:wrap}.photos figure{margin:0;width:220px}.photos img{width:100%;height:170px;object-fit:cover;border-radius:6px;background:#eee}
.photos figcaption{font-size:12px;color:#6B7280;margin-top:4px}
table{border-collapse:collapse;width:100%;font-size:14px}td,th{text-align:left;padding:7px 10px;border-bottom:1px solid #E5E7EB;vertical-align:top}
th{color:#6B7280;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.06em}
.note{font-size:13px;color:#6B7280}.boards{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:12px}
.boards img{width:100%;border-radius:6px;border:1px solid #E5E7EB}.pend{background:#FEF3C7;border-radius:6px;padding:2px 6px}
"""


def scope(css: str, root: str) -> str:
    """Prefix every selector with `root` (":scope" means root itself), so the guide's styles can't touch the gallery.
    @font-face stays global; @media blocks are scoped inside."""
    out, i = [], 0
    while i < len(css):
        j = css.find("{", i)
        if j < 0:
            break
        sel = css[i:j].strip()
        depth, k = 1, j + 1
        while depth:
            depth += {"{": 1, "}": -1}.get(css[k], 0); k += 1
        body = css[j + 1:k - 1]
        if sel.startswith("@media"):
            out.append(f"{sel}{{{scope(body, root)}}}")
        elif sel.startswith("@"):
            out.append(f"{sel}{{{body}}}")
        else:
            sels = [x.strip() for x in sel.split(",")]
            out.append(",".join(root if x == ":scope" else x.replace(":scope", root) if x.startswith(":scope") else f"{root} {x}"
                                for x in sels) + f"{{{body}}}")
        i = k
    return "\n".join(out)


def _hex(v, default="#000000") -> str:
    return v if isinstance(v, str) and HEX.fullmatch(v) else default


def _rel(target: Path, start: Path) -> str:
    """A link from the gallery to a file. Files outside the campaign folder (logos, photos, board, fonts) are copied
    into previews/assets/brand/ so the gallery works on its own: shared, zipped or opened in an agent's viewer."""
    target, start = Path(target), Path(start)
    try:
        target.resolve().relative_to(start.resolve())
    except ValueError:
        local = start / "previews" / "assets" / "brand" / target.parent.name / target.name
        try:
            if not local.exists() or local.stat().st_mtime < target.stat().st_mtime:
                local.parent.mkdir(parents=True, exist_ok=True)
                try:                                          # a screen-size copy of photos keeps Drive light
                    if target.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp") or target.parent.name not in ("photos", "board"):
                        raise ValueError
                    from PIL import Image
                    im = Image.open(target); im.thumbnail((1400, 1400))
                    im.save(local, quality=85) if local.suffix.lower() in (".jpg", ".jpeg") else im.save(local)
                except Exception:
                    shutil.copy2(target, local)
            target = local
        except OSError:
            pass                                           # fall back to linking the original
    return Path(os.path.relpath(target, start)).as_posix()


def _font_faces(brand: dict, c: store.Client, d: Path) -> tuple[str, dict]:
    """@font-face rules pointing at font files a build already copied (no downloads here), and the families in use."""
    fams, css = {}, []
    dirs = [d / "previews" / "assets" / "fonts", c.brand_dir / "board" / "assets" / "fonts"]
    for role, spec in (brand.get("fonts") or {}).items():
        fam = fonts.resolve(spec.get("family") or "")[0] if spec.get("family") else ""
        fams[role] = (fam, int(spec.get("weight") or (700 if role == "head" else 400)))
        key = re.sub(r"[^A-Za-z0-9]", "", fam)
        for fd in dirs:
            hits = sorted(fd.glob(f"{key}-*.ttf")) if key and fd.exists() else []
            for f in hits:
                w = f.stem.rsplit("-", 1)[-1]
                css.append(f"@font-face{{font-family:'{fam}';src:url('{_rel(f, d)}');font-weight:{'100 900' if w == 'var' else w}}}")
            if hits:
                break
    return "\n".join(dict.fromkeys(css)), fams


def _treatment_mix(rows: list[dict], direction: str | None) -> tuple[Counter, dict]:
    """How often each treatment is used across the campaign's written options (the kit aside), and by which templates."""
    mix, used = Counter(), {}
    for r in rows:
        if r.get("format") == "kit":
            continue
        o = r.get("option_data") or {}
        try:
            t = o.get("treatment") or templates.get(r["template"]).get("treatment", "dark")
        except Exception:
            t = o.get("treatment") or "dark"
        mix[t] += 1
        used.setdefault(t, Counter())[r["template"]] += 1
    if not mix and direction:
        from .campaign import DIRECTIONS
        for tpl, t in (DIRECTIONS.get(direction) or {}).get("set", []):
            mix[t] += 1
            used.setdefault(t, Counter())[tpl] += 1
    return mix, used


def panel(c: store.Client, d: Path, rows: list[dict]) -> tuple[str, str]:
    """(CSS, HTML) for the Design tab."""
    from .campaign import DIRECTIONS, consult_cta, fees_usable, sample_copy
    b = c.brand()
    C = {k: _hex(v) for k, v in (b.get("colors") or {}).items() if isinstance(v, str) and HEX.fullmatch(v)}
    C.setdefault("ink", "#111827"); C.setdefault("accent", "#1D4ED8"); C.setdefault("paper", "#F5F5F2")
    C.setdefault("body", "#374151"); C.setdefault("muted", "#6B7280")
    T = theme.treatments(dict(b, colors=dict(b.get("colors") or {}, **C)))
    facts = store.read_facts(c)
    area = c.data.get("practice_area") or ""
    sample = sample_copy(area)
    city = next((o.get("city") for o in b.get("offices") or [] if o.get("city")), "")
    cta = consult_cta(facts)
    face_css, fams = _font_faces(b, c, d)
    fam = lambda role: fams.get(role, fams.get("body", ("", 400)))
    stack = lambda role: (f"'{fam(role)[0]}'," if fam(role)[0] else "") + "-apple-system,Arial,sans-serif"
    radius = int((b.get("cta") or {}).get("radius", 4) or 0)
    upper = (b.get("cta") or {}).get("upper", True)
    root = (f":scope{{--ink:{C['ink']};--accent:{C['accent']};--paper:{C['paper']};--body:{T['light']['fg2']};"
            f"--acc-light:{T['light']['acc']};--f-head:{stack('head')};--f-body:{stack('body')};--f-ui:{stack('ui')};"
            f"--w-head:{fam('head')[1]}}}")
    S = []

    # ---- direction
    direction = c.data.get("direction")
    dd = DIRECTIONS.get(direction or "")
    mix, used = _treatment_mix(rows, direction)
    total = sum(mix.values())
    mix_txt = ", ".join(f"{round(100 * n / total)}% {t}" for t, n in mix.most_common()) if total else ""
    S.append("<section><h2>Direction</h2>" + (
        f"<p style='margin:0 0 6px'><b>{e(direction)}: {e(dd['name'])}.</b> {e(dd['why'])}</p>" if dd else
        "<p style='margin:0 0 6px'>No direction chosen yet: pick one from the test designs and set it with "
        f"<code>lr client set \"{e(c.name)}\" direction=B</code>.</p>")
        + (f"<p class='note' style='margin:0'>Treatment mix {'in this campaign' if rows else 'for this direction'}: {e(mix_txt)}"
           f" ({total} option{'s' if total != 1 else ''}).</p>" if total else "") + "</section>")

    # ---- brand board (here, so the gallery is the one page to share; no separate board link)
    boards = sorted((c.brand_dir / "board").glob("board_*.png"))
    if boards:
        S.append("<section><h2>Brand board</h2><div class='boards'>" + "".join(
            f"<img loading='lazy' src='{e(_rel(f, d))}' alt='Brand board, page {n}'>" for n, f in enumerate(boards, 1)) + "</div></section>")

    # ---- logo
    ld = c.brand_dir / "logos"
    have = {f.stem for f in ld.glob("*.svg")} if ld.exists() else set()
    def logo_tile(bg, variant, alt):
        f = ld / f"logo-{variant}.svg"
        if not f.exists():
            f = next((ld / f"logo-{v}.svg" for v in ("dark", "white") if (ld / f"logo-{v}.svg").exists()), None)
        inner = f"<img src='{e(_rel(f, d))}' alt='{e(alt)}'>" if f else "<span>No logo file yet</span>"
        return f"<div class='logo' style='background:{bg}'>{inner}</div>"
    acc_logo = T["accent"]["logo"]
    logo = b.get("logo") or {}
    dont = ["Don't recolour, stretch, outline or add effects.", "Don't place it on a photo without a solid band behind it."]
    if logo.get("status") == "raster":
        dont.append("The current logo is traced from an image on the site: ask the firm for the SVG or PDF logo.")
    if not have:
        dont.append("No logo file yet: add the firm's logo to brand/logos/ and run `lr client refresh`.")
    do = [f"Dark logo on white or paper; white logo on ink; {acc_logo} logo on the accent field.",
          "Keep clear space of at least half the logo's height on every side.",
          "Profile pictures use the mark on its own." if {"mark-dark", "mark-white"} & have else
          "There's no separate mark, so profile pictures use the full logo."]
    S.append("<section><h2>Logo</h2><div class='grid'>" + logo_tile("#FFFFFF", "dark", "Logo, dark version")
             + logo_tile(C["ink"], "white", "Logo, white version on ink") + logo_tile(C["accent"], acc_logo, f"Logo, {acc_logo} version on accent")
             + "</div><div class='rules' style='margin-top:14px'><ul class='do'>" + "".join(f"<li>{e(x)}</li>" for x in do)
             + "</ul><ul class='dont'>" + "".join(f"<li>{e(x)}</li>" for x in dont) + "</ul></div></section>")

    # ---- colour
    sw = "".join(f"<div class='sw'><div class='chip' style='background:{C[k]}'></div><div><b>{n}</b><code>{C[k]}</code>"
                 f"<p>{e(t)}</p></div></div>" for k, n, t in ROLES if k in C)
    col = lambda k: C.get(k, k) if not k.startswith("#") else k
    pr = ""
    for fg, bg, label in PAIRS:
        if (not fg.startswith("#") and fg not in C) or bg not in C:
            continue
        r = contrast(col(fg), col(bg))
        ok, cls = ("Body text", "ok") if r >= 4.5 else (("Large type only", "mid") if r >= 3 else ("Don't use", "no"))
        pr += (f"<div class='pair' style='background:{col(bg)};color:{col(fg)}'><span>{e(label)}</span>"
               f"<span class='r {cls}'>{r:.1f}:1 · {ok}</span></div>")
    S.append(f"<section><h2>Colour</h2><div class='grid'>{sw}</div><h3>Text on colour (WCAG contrast)</h3><div class='pairs'>{pr}</div>"
             "<p class='note'>Body text needs 4.5:1; headlines and big words need 3:1. Designs use the treatment colours below, "
             "which are computed to pass, and the checks enforce it on every render.</p></section>")

    # ---- typography
    lead, accent = sample["headline"]
    label = " ".join(x for x in (city, area.lower()) if x) or "Section label"
    def btn(text, t):
        return (f"<span class='btn' style='background:{T[t]['btn_bg']};color:{T[t]['btn_fg']};border-radius:{radius}px;"
                f"{'text-transform:uppercase;' if upper else ''}'>{e(text)} →</span>")
    S.append("<section><h2>Typography</h2><div class='type'><div>"
             f"<div class='spec'>Headlines · {e(fam('head')[0] or 'system font')} {fam('head')[1]} · sentence case · tight leading</div>"
             f"<p class='h'>{e(lead)} <em>{e(accent)}</em></p>"
             f"<div class='spec' style='margin-top:18px'>Support · {e(fam('body')[0] or 'system font')} {fam('body')[1]} · never smaller than 30 px on a 1080 px post</div>"
             "<p class='bd' style='margin:0'>Support copy explains the headline in plain, readable sentences: one idea, no jargon.</p></div>"
             f"<div><div class='spec'>Labels · {e(fam('ui')[0] or 'system font')} SemiBold · uppercase · wide tracking</div><div class='lab'>{e(label)}</div>"
             f"<div class='spec' style='margin-top:22px'>Buttons · {e(fam('ui')[0] or 'system font')} SemiBold{' · uppercase' if upper else ''}"
             f" · {'square corners' if radius == 0 else f'{radius} px corners'}</div>"
             f"<div style='display:flex;gap:10px;flex-wrap:wrap'>{btn(cta, 'light')}{btn('Call today', 'dark')}</div>"
             "<h3>Accent phrase</h3><p class='note' style='margin:0'>One phrase per headline is coloured: the payoff, copied word for word "
             f"from the headline (\"<em style='color:var(--acc-light);font-style:normal'>{e(accent)}</em>\"). The accent colour on light fields, "
             "the bright accent on ink, and white or ink on the accent field.</p></div></div>"
             + "".join(f"<p class='note'>{e(n)}</p>" for n in _font_notes(b)) + "</section>")

    # ---- treatments
    tl, ta = sample["tile"]
    cards = ""
    for t in ("dark", "light", "accent"):
        tt = T[t]
        share = f"{round(100 * mix[t] / total)}% of options" if mix[t] else ""
        tpls = ", ".join(k for k, _ in used.get(t, Counter()).most_common(4))
        cards += (f"<div class='card' style='background:{tt['bg']};color:{tt['fg']}'><div class='lab' style='color:{tt['acc_small']}'>{t.capitalize()}</div>"
                  f"<p class='h'>{e(tl)} <em style='font-style:normal;color:{tt['acc']}'>{e(ta)}</em></p>"
                  f"<p style='color:{tt['fg2']}'>{e(TREATMENT_USE[t])}</p>"
                  f"<span class='tag'>{e(' · '.join(x for x in (share, tpls) if x) or 'Not used yet')}</span></div>")
    S.append(f"<section><h2>Treatments</h2><div class='tr'>{cards}</div><p class='note'>Text colours on each field are computed "
             "from the brand colours so they stay readable.</p></section>")

    # ---- photography
    pics = read_json(c.brand_dir / "photos" / "photos.json", {}) or {}
    usable = [(k, p) for k, p in pics.items() if p.get("use", True)]
    figs = ""
    for k, p in usable[:12]:
        w, h = p.get("w") or 0, p.get("h") or 0
        bits = [k, p.get("name") or p.get("kind") or "photo"]
        if w and h:
            bits.append(f"{w}×{h}")
        cap = " · ".join(str(x) for x in bits)
        if w and max(w, h) < 1000:
            cap += f". Small original ({max(w, h)} px): keep it out of full-bleed layouts."
        figs += (f"<figure><img loading='lazy' src='{e(_rel(c.brand_dir / 'photos' / p.get('file', k + '.jpg'), d))}' alt='{e(p.get('name') or k)}'>"
                 f"<figcaption>{e(cap)}</figcaption></figure>")
    people = any(p.get("kind") in ("person", "group") for _, p in usable)
    S.append("<section><h2>Photography</h2>" + (f"<div class='photos'>{figs}</div>" if figs else
             "<p class='note'>No usable photos yet: designs use type-led layouts. Ask the firm for attorney headshots and a team photo.</p>")
             + "<div class='rules' style='margin-top:14px'><ul class='do'><li>Only the firm's own photos"
             + (" of its people" if people else "") + ".</li><li>Faces stay clear of text; heads are never cropped.</li>"
             "<li>Rotate photos so the same one doesn't run twice in a row.</li></ul><ul class='dont'>"
             "<li>No stock photos (gavels, handshakes, posed models) and no AI-generated people.</li>"
             "<li>No site banners with text baked in, and no cut-out photos.</li><li>Don't brighten, recolour or retouch people.</li></ul></div></section>")

    # ---- formats
    cat = templates.catalog()
    trs = ""
    for key, s in templates.SIZES.items():
        if key == "board":
            continue
        tpls = sorted(n for n, m in cat.items() if key in m.get("sizes", []) and n != "brand-board")
        top, right, bottom, left = s["safe"]
        trs += (f"<tr><td>{e(s['label'])}</td><td>{s['w']} × {s['h']}</td><td>{top} / {right} / {bottom} / {left} px</td>"
                f"<td>{e(', '.join(tpls))}</td></tr>")
    S.append("<section><h2>Formats</h2><table><tr><th>Format</th><th>Size</th><th>Safe margin (top / right / bottom / left)</th>"
             f"<th>Templates</th></tr>{trs}</table><p class='note'>Text stays inside the safe margin; the logo sits top left.</p></section>")

    # ---- words
    v = b.get("voice") or {}
    voice = ["Plain, calm and direct: write from the client's side of the problem.",
             "Headlines 4–10 words, sentence case, no exclamation marks or emoji."]
    if city:
        voice.append(f"Mention {city} where it fits.")
    voice += [str(n) for n in v.get("notes") or [] if n]
    voice.append(f"Calls to action: \"{cta}\", \"Call today\", \"Schedule a consultation\".")
    if v.get("tagline") and not campaign.DESCRIPTOR.match(v["tagline"].strip()):
        voice.append(f"Use the tagline exactly as written: \"{v['tagline']}\".")
    rules = ["No \"guarantee\", \"best\", \"#1\", \"leading\", \"top-rated\", \"expert\" or \"specialist\" unless an approved fact says so.",
             "No promised outcomes: promise service, not results.",
             "Every number comes from a fact the post cites.",
             f"Any result carries: \"{compliance.DISCLAIMER}\""]
    if not fees_usable(facts):
        rules.insert(2, "No \"free\" or \"no fee\" offers until the firm approves a fees fact.")
    pending = [f for f in facts.values() if f.get("needs_approval") and not f.get("approved")]
    pend = "".join(f"<li><span class='pend'>{e(f['category'])}</span> {e(f['text'] if len(f['text']) <= 110 else f['text'][:108].rstrip() + '…')}</li>" for f in pending[:12])
    S.append("<section><h2>Words</h2><div class='rules'><div><h3>Voice</h3><ul class='do'>" + "".join(f"<li>{e(x)}</li>" for x in voice)
             + "</ul></div><div><h3>Claims (attorney advertising)</h3><ul class='dont'>" + "".join(f"<li>{e(x)}</li>" for x in rules)
             + "</ul>" + (f"<h3>Waiting for the firm's approval ({len(pending)})</h3><ul>{pend}</ul>"
                          "<p class='note'>Approve them in brand/facts.xlsx before any post uses them.</p>" if pending else "")
             + "</div></div><p class='note'>Captions: 1–3 short paragraphs, then a call to action. At most 3 hashtags. "
             "Alt text includes the headline.</p></section>")

    return face_css + "\n" + scope(root + "\n" + CSS, "#tab-design"), "".join(S)


def _font_notes(b: dict) -> list[str]:
    """Which brand fonts are stand-ins for commercial ones."""
    return list(dict.fromkeys(n for n in (fonts.resolve(s.get("family") or "")[1] for s in (b.get("fonts") or {}).values()
                                          if s.get("family")) if n))
