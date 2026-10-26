"""`lr client new <website>`: read the firm's site once and save everything the studio needs to remember."""
import datetime as dt
import re

from . import extract, logos, photos, store
from .crawl import SiteBlocked, crawl, download
from .util import LRError, log, say, slugify, write_bytes, write_json, write_text

DEFAULT_BRAND = {
    "colors": {"ink": "#1B1C1E", "accent": "#B5121B", "paper": "#F5F5F2", "muted": "#6C7C86", "body": "#4B5660", "line": "#D9DCDF"},
    "fonts": {"head": {"family": "Montserrat", "weight": 700}, "body": {"family": "Lato", "weight": 400}},
    "cta": {"radius": 4, "upper": True},
}


def firm_name(site, ex: extract.Extraction) -> str | None:
    if ex.firm_name:
        return ex.firm_name.strip()
    title = (site.pages[0].get("title") if site.pages else "") or ""
    parts = [p.strip() for p in re.split(r"\s[|–—:-]\s", title) if p.strip()]
    for p in parts:
        if re.search(r"\b(law|attorneys?|lawyers?|firm|llp|pllc|p\.?c\.?|legal|& associates)\b", p, re.I):
            return p
    return parts[-1] if parts else None


def _fonts(fonts: dict) -> dict:
    """Studio font spec (CSS weights) from extract's Figma-style names."""
    W = {"Thin": 100, "ExtraLight": 200, "Light": 300, "Regular": 400, "Medium": 500, "SemiBold": 600, "Bold": 700, "ExtraBold": 800, "Black": 900}
    out = {"head": {"family": fonts["head"]["family"], "weight": W.get(fonts["head"].get("bold", "Bold"), 700)},
           "body": {"family": fonts["body"]["family"], "weight": 400}}
    if fonts.get("ui"):
        out["ui"] = {"family": fonts["ui"]["family"], "weight": W.get(fonts["ui"].get("semi", "Bold"), 700)}
    return out


def pick_logo(site) -> dict | None:
    """The best logo candidate on the site: {kind: svg|raster, svg|data, where, url?}."""
    cands = []
    for i, l in enumerate(site.logos):
        try:
            if l.get("svg"):
                svg = logos.sanitize(l["svg"])
                if logos.aspect(svg) < 0.5 and l["where"] == "header" and len(site.logos) > 1:
                    continue                                    # hamburger icons and the like
                cands.append({"kind": "svg", "svg": svg, "where": l["where"], "bg": l.get("bg"), "score": 3 + (l["where"] == "header") + (logos.aspect(svg) > 1.6)})
            elif l.get("url"):
                data, ctype = download(l["url"], l.get("page"))
                if ctype == "image/svg+xml":
                    svg = logos.sanitize(data.decode("utf-8", "replace"))
                    cands.append({"kind": "svg", "svg": svg, "where": l["where"], "url": l["url"], "score": 3.5 + (l["where"] == "header")})
                else:
                    cands.append({"kind": "raster", "data": data, "where": l["where"], "url": l["url"],
                                  "score": 1 + (l["where"] == "header") + min(1, (l.get("w") or 0) / 600)})
        except Exception as e:
            say(f"  logo candidate {i} skipped: {str(e)[:80]}")
    return max(cands, key=lambda c: c["score"]) if cands else None


def logo_dark_colour(best: dict | None) -> str | None:
    if not best:
        return None
    try:
        return logos.dominant_dark(svg=best.get("svg"), raster=best.get("data"))
    except Exception:
        return None


def save_logos(best: dict | None, client: store.Client, ink: str) -> tuple[dict, list[str]]:
    """Write logo-dark.svg and logo-white.svg for the picked candidate. Returns (logo info, warnings)."""
    ldir = client.brand_dir / "logos"
    warnings = []
    if not best:
        warnings.append("No logo found on the site. Ask the firm for its vector logo (SVG or PDF) and put it in brand/logos/.")
        return {"status": "missing"}, warnings
    info = {"status": "vector" if best["kind"] == "svg" else "raster", "source": best.get("url") or f"inline SVG in the site {best['where']}"}
    if best["kind"] == "svg":
        svg = best["svg"]
        light = logos.is_light(svg)
        dark = logos.dark_version(svg, ink) if light else svg
        white = svg if light else logos.white_version(svg)
        write_text(ldir / "logo-original.svg", svg)
    else:
        svg, white = logos.wrap_raster(best["data"])
        light = logos.raster_is_light(best["data"])
        dark = svg
        if light:
            warnings.append("The site's logo is a white image, so there's no version for light backgrounds yet. Ask the firm for the full-colour vector logo.")
        warnings.append("The logo is an image, not a vector: fine for previews, but ask the firm for the SVG/PDF logo for print-sharp results and Figma.")
        write_bytes(ldir / ("logo-original" + (".png" if best["data"][:4] == b"\x89PNG" else ".jpg")), best["data"])
    has_mark = logos.write_variants(ldir, dark, white) if best["kind"] == "svg" else False
    if best["kind"] != "svg":
        write_text(ldir / "logo-dark.svg", dark); write_text(ldir / "logo-white.svg", white)
    info.update(dark="logos/logo-dark.svg", white="logos/logo-white.svg", aspect=round(logos.aspect(dark), 3), mark=has_mark)
    return info, warnings


DEFAULT_VISUAL = {"colors": DEFAULT_BRAND["colors"], "fonts": {"head": {"family": "Montserrat", "bold": "Bold"}, "body": {"family": "Lato"}},
                  "cta": DEFAULT_BRAND["cta"], "treatments": {}, "evidence": {}}


def _soft(fn, default, warnings: list, message: str):
    """Run one onboarding step; if it fails, note it in plain words, keep the details for debugging and carry on."""
    try:
        return fn()
    except Exception as e:
        from .util import log_error
        log_error(e)
        warnings.append(message)
        say(f"  {message}")
        return default


def _manual_client(url: str, dom: str, name: str | None, package: str, reason: str | None = None) -> dict:
    """A client whose site can't be scanned: placeholders for the brand, and a clear list of what to add by hand."""
    guessed = not name
    name = name or " ".join(w.capitalize() for w in re.split(r"[-_.]", dom.split(".")[0]) if w)
    c = store.create(name, url, package=package, status="needs brand")
    write_json(c.brand_dir / "brand.json", dict(DEFAULT_BRAND, name=name, short=store.short_name(name), website=dom, reliable=False,
                                                warnings=["Brand colours and fonts are placeholders: set them with `lr client set`."]))
    log(c.dir, "client new (manual)" + (f": {reason[:120]}" if reason else ""))
    return {"client": c.name, "folder": str(c.dir), "status": "needs brand", "needs_attention": True,
            **({"why": f"The site couldn't be scanned ({reason[:160]}), so the client was set up by hand instead."} if reason else {}),
            "needed": ["the firm's logo (SVG or PNG) saved in brand/logos/ as logo-dark.svg (and logo-white.svg if they have one)",
                       "a few photos of the attorneys in brand/photos/",
                       "brand colours and fonts if known: `lr client set \"%s\" brand.colors.accent=#...`" % c.name,
                       "the claims they want to use, as rows in brand/facts.xlsx"],
            "next": f"Add what you have, then run `lr client refresh \"{c.name}\"` and `lr directions \"{c.name}\"`."
                    + (f" The name '{name}' was guessed from the web address: fix it with `lr client set \"{name}\" name=\"Firm Name\"`." if guessed else "")}


def new_client(website: str, name: str | None = None, package: str = "growth", max_pages: int = 10, manual: bool = False) -> dict:
    url = store.normalize_url(website)
    dom = store.domain_of(url)
    existing = store.find_by_domain(dom)
    if existing:
        raise LRError(f"{existing.name} ({dom}) is already a client", fix=f"Use `lr client show {dom}`.")
    if package not in ("essentials", "growth", "authority"):
        raise LRError("package must be essentials, growth or authority")
    warnings = []
    if not manual:
        try:
            site = crawl(url, max_pages=max_pages)
        except SiteBlocked as e:                  # don't stop: set the client up by hand and say what's needed
            say(f"  {e}")
            return _manual_client(url, dom, name, package, reason=str(e))
    else:
        return _manual_client(url, dom, name, package)
    # each step below has a safe default: one odd page or file never stops the whole onboarding
    ex = _soft(lambda: extract.extract(site.pages, site.jsonld, firm_name=name), extract.Extraction(), warnings,
               "Facts couldn't be read from the site; add the firm's claims to brand/facts.xlsx by hand.")
    best_logo = _soft(lambda: pick_logo(site), None, warnings, "The logo couldn't be read; add it to brand/logos/ and run `lr client refresh`.")
    visual, vwarn = _soft(lambda: extract.derive_visual_identity(site.brand_read, logo_dark=logo_dark_colour(best_logo)),
                          (DEFAULT_VISUAL, []), warnings, "Brand colours and fonts couldn't be read; placeholders are in use (set them with `lr client set`).")
    warnings += vwarn
    name = name or firm_name(site, ex) or dom.split(".")[0].title()
    c = store.create(name, url, package=package, practice_area=ex.main_practice_area, status="onboarding")
    say(f"Saving {c.name} ...")

    today = dt.date.today().isoformat()
    for p in site.pages:                                   # the proof behind every fact
        write_text(c.brand_dir / "site" / f"{slugify(p['name'])[:50]}.txt", f"URL: {p['url']}\nRead: {today}\nTitle: {p.get('title')}\n\n{p['text']}")

    logo_info, lw = _soft(lambda: save_logos(best_logo, c, visual["colors"]["ink"]), ({"status": "missing"}, []), warnings,
                          "The logo couldn't be saved; add it to brand/logos/ and run `lr client refresh`.")
    warnings += lw
    say("Collecting photos ...")
    logo_refs = [l["url"] for l in site.logos if l.get("url")] + ([best_logo["data"]] if best_logo and best_logo.get("data") else [])
    pics = _soft(lambda: photos.collect(site.images, c.brand_dir / "photos", ex.people, dom, logos=tuple(logo_refs)), {}, warnings,
                 "Photos couldn't be collected; drop the firm's photos into brand/photos/ and run `lr client refresh`.")
    write_json(c.brand_dir / "photos" / "photos.json", pics)
    usable = [k for k, p in pics.items() if p["use"]]
    if not any(pics[k]["kind"] in ("person", "group") for k in usable):
        warnings.append("No usable photos of the firm's people. Ask for attorney headshots and a team photo; until then designs use type-led layouts.")

    brand = {"name": c.name, "short": store.short_name(c.name), "website": dom,
             "colors": visual["colors"], "fonts": _fonts(visual["fonts"]), "cta": visual["cta"],
             "treatments": visual["treatments"], "logo": logo_info, "evidence": visual["evidence"],
             "voice": {"tagline": ex.tagline, "positioning": ex.positioning, "notes": []},
             "practice_areas": ex.practice_areas, "offices": ex.offices, "people": ex.people, "languages": ex.languages,
             "reliable": site.brand_read.get("reliable", True), "checked": today, "warnings": warnings}
    write_json(c.brand_dir / "brand.json", brand)
    store.write_facts(c, [{"key": f.key, "text": f.text, "category": f.category, "source": f.source_url, "excerpt": f.excerpt,
                           "verified": f.verified, "needs_approval": f.requires_approval, "notes": f.note} for f in ex.facts])
    try:
        from . import board
        board.render_board(c)
    except Exception as e:                                 # the board is a nice-to-have at this point
        say(f"  brand board skipped: {e}")
    log(c.dir, f"client new {url}")
    from .summary import client_summary
    out = client_summary(c)
    out["next"] = "Check the brand board and facts, then run `lr directions` for test designs."
    return out


def refresh(c: store.Client, force: bool = False) -> dict:
    """After someone drops in photos or a logo by hand: detect people, rebuild logo variants and marks, redraw the board."""
    meta = photos.reanalyze(c.brand_dir / "photos", force=force)
    ld = c.brand_dir / "logos"
    notes = []
    if (ld / "logo-dark.svg").exists():
        dark = logos.sanitize((ld / "logo-dark.svg").read_text())
        white = logos.sanitize((ld / "logo-white.svg").read_text()) if (ld / "logo-white.svg").exists() else logos.white_version(dark)
        for f in ("mark-dark.svg", "mark-white.svg"):
            (ld / f).unlink(missing_ok=True)
        if not logos.write_variants(ld, dark, white):
            notes.append("No separate icon found in the logo: profile pictures use the full logo.")
    else:
        notes.append("No logo-dark.svg in brand/logos: add the firm's vector logo there.")
    try:
        from . import board
        board.render_board(c)
    except Exception as e:
        notes.append(f"brand board skipped: {e}")
    log(c.dir, "client refresh")
    return {"client": c.name, "photos": {k: {"kind": m["kind"], "name": m.get("name"), "people": len(m.get("faces") or []),
                                             "use": m.get("use", True)} for k, m in meta.items()}, "notes": notes}
