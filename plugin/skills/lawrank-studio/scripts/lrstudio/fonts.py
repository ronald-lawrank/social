"""Brand fonts for rendering: Google Fonts files cached in ~/.lawrank-studio/fonts, with close open substitutes for
the commercial fonts law-firm sites often use. Figma has every Google font, so the plugin uses the same families."""
import base64
import re
import urllib.error
import urllib.parse

from . import paths
from .extract import family_name
from .util import fetch, say

GF_RAW = "https://raw.githubusercontent.com/google/fonts/main/{lic}/{dir}/{file}"
# Commercial / system fonts -> the closest Google font (by proportions and feel)
SUBSTITUTES = {
    "proxima nova": "Montserrat", "gotham": "Montserrat", "gotham narrow": "Barlow Semi Condensed", "futura": "Jost",
    "futura pt": "Jost", "avenir": "Nunito Sans", "avenir next": "Nunito Sans", "helvetica": "Inter", "helvetica neue": "Inter",
    "arial": "Arimo", "brandon grotesque": "Josefin Sans", "gilroy": "Plus Jakarta Sans", "circular": "DM Sans",
    "sofia pro": "Mulish", "museo sans": "Mulish", "acumin pro": "Archivo", "trade gothic": "Archivo Narrow",
    "franklin gothic": "Libre Franklin", "din": "Barlow", "din pro": "Barlow", "segoe ui": "Open Sans",
    "trajan": "Cinzel", "trajan pro": "Cinzel", "garamond": "EB Garamond", "adobe garamond": "EB Garamond",
    "baskerville": "Libre Baskerville", "times new roman": "Tinos", "georgia": "Gelasio", "minion pro": "Crimson Pro",
    "caslon": "Libre Caslon Text", "bodoni": "Bodoni Moda", "didot": "Playfair Display", "freight text": "Source Serif 4",
    "freight display": "Playfair Display", "mrs eaves": "Libre Baskerville", "optima": "Marcellus", "copperplate": "Cinzel",
    "neue haas grotesk": "Inter", "aktiv grotesk": "Inter", "graphik": "Inter", "canela": "Playfair Display",
}


def resolve(family: str) -> tuple[str, str | None]:
    """(family to use, note if substituted)."""
    f = family_name(family)          # brand.json files written before the scan stripped "-SemiBold" etc.
    sub = SUBSTITUTES.get(f.lower())
    if sub:
        return sub, f"{f} isn't a free font; using {sub}, its closest Google font"
    return f, None


def _candidates(family: str, weight: int):
    nospace = family.replace(" ", "")
    style = {100: "Thin", 200: "ExtraLight", 300: "Light", 400: "Regular", 500: "Medium", 600: "SemiBold",
             700: "Bold", 800: "ExtraBold", 900: "Black"}.get(weight, "Regular")
    for lic in ("ofl", "apache", "ufl"):
        d = re.sub(r"[^a-z0-9]", "", family.lower())
        for f in (f"{nospace}[wght].ttf", f"{nospace}[opsz,wght].ttf", f"{nospace}[wdth,wght].ttf", f"{nospace}-{style}.ttf"):
            yield lic, d, f, f.endswith("].ttf")


def ensure(family: str, weight: int) -> tuple[str, bool] | None:
    """Local path to a TTF for family/weight (variable font if available). None if the family can't be found."""
    paths.FONTS.mkdir(parents=True, exist_ok=True)
    key = re.sub(r"[^A-Za-z0-9]", "", family)
    for p in (paths.FONTS / f"{key}-var.ttf", paths.FONTS / f"{key}-{weight}.ttf"):
        if p.exists():
            return str(p), p.name.endswith("-var.ttf")
    miss = paths.FONTS / f"{key}.missing"
    if miss.exists():
        if miss.read_text().startswith("404"):
            return None
        miss.unlink()                                # written by older versions after SSL errors too: retry once
    trouble = None
    for lic, d, f, variable in _candidates(family, weight):
        url = GF_RAW.format(lic=lic, dir=d, file=urllib.parse.quote(f))
        try:
            data = fetch(url, timeout=20)
        except urllib.error.HTTPError as e:
            if e.code != 404:
                trouble = f"HTTP {e.code}"
            continue
        except Exception as e:                       # SSL, DNS, timeout: say so, and try again next time
            trouble = str(getattr(e, "reason", None) or e)[:120]
            continue
        if len(data) > 10_000:
            p = paths.FONTS / (f"{key}-var.ttf" if variable else f"{key}-{weight}.ttf")
            p.write_bytes(data)
            say(f"  font {family} cached")
            return str(p), variable
    if trouble:
        say(f"  font {family} couldn't be downloaded ({trouble}); will retry next time")
        return None
    miss.write_text("404: not found in Google Fonts")    # every candidate was a real 404: don't ask again
    return None


def face_css(brand: dict, embed: bool = False) -> tuple[str, list[str]]:
    """@font-face rules for the brand's fonts (file:// URLs, or embedded for self-contained files) + notes."""
    css, notes, done = [], [], set()
    for role, spec in (brand.get("fonts") or {}).items():
        fam, note = resolve(spec["family"])
        if note:
            notes.append(note)
        for w in sorted({spec.get("weight", 400), 400, 600, 700} if role != "body" else {400, 600, 700}):
            if (fam, w) in done:
                continue
            got = ensure(fam, w)
            if not got:
                notes.append(f"{fam} couldn't be downloaded; a system font stands in")
                break
            path, variable = got
            src = f"data:font/ttf;base64,{base64.b64encode(open(path, 'rb').read()).decode()}" if embed else f"file://{path}"
            css.append(f"@font-face{{font-family:'{fam}';src:url('{src}');font-weight:{'100 900' if variable else w};font-display:block;}}")
            done.add((fam, w))
            if variable:
                done.update((fam, x) for x in range(100, 1000, 100))
    return "\n".join(dict.fromkeys(css)), sorted(set(notes))
