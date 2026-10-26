"""Colour treatments computed from the brand, so text is readable by construction (not by luck).

Three treatments every template can use: dark (ink field), light (paper field), accent (accent field). For each, the
colours of headline, support text, accent words, rules and buttons are chosen to pass WCAG contrast: 3:1 for large
text, 4.5:1 for small. When the brand accent can't reach that on a field, a lighter or darker step of it is used,
then white/ink as a last resort.
"""
import colorsys

from .extract import contrast, hex_rgb, luminance, rgb_hex

WHITE, LARGE, SMALL = "#FFFFFF", 3.0, 4.5


def shade(hexc: str, l_delta: float) -> str:
    r, g, b = (v / 255 for v in hex_rgb(hexc))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return rgb_hex(tuple(v * 255 for v in colorsys.hls_to_rgb(h, max(0.0, min(1.0, l + l_delta)), s)))


def readable(fg: str, bg: str, need: float) -> str:
    """fg, or the nearest lighter/darker step of it that reaches `need` against bg."""
    if contrast(fg, bg) >= need:
        return fg
    direction = 1 if luminance(bg) < 0.25 else -1
    for i in range(1, 20):
        c = shade(fg, direction * 0.04 * i)
        if contrast(c, bg) >= need:
            return c
    return WHITE if direction > 0 else "#111111"


def mix(a: str, b: str, t: float) -> str:
    """a blended toward b by t (0..1)."""
    ra, rb = hex_rgb(a), hex_rgb(b)
    return rgb_hex(tuple(x + (y - x) * t for x, y in zip(ra, rb)))


def treatments(brand: dict) -> dict:
    c = brand["colors"]
    ink, accent, paper = c["ink"], c["accent"], c.get("paper", "#F5F5F2")
    bright = c.get("accentBright") or accent
    on_accent = WHITE if contrast(WHITE, accent) >= LARGE else ink
    out = {}
    # dark: ink field
    out["dark"] = {"bg": ink, "fg": WHITE, "fg2": readable(mix(WHITE, ink, 0.18), ink, SMALL),
                   "acc": readable(bright, ink, LARGE), "acc_small": readable(bright, ink, SMALL),
                   "rule": readable(bright, ink, LARGE), "line": mix(WHITE, ink, 0.82),
                   "btn_bg": accent if contrast(on_accent, accent) >= SMALL else bright, "btn_fg": on_accent if contrast(on_accent, accent) >= SMALL else ink,
                   "logo": "white", "shade": ink}
    # light: paper field
    out["light"] = {"bg": paper, "fg": ink, "fg2": readable(c.get("body") or mix(ink, paper, 0.25), paper, SMALL),
                    "acc": readable(accent, paper, LARGE), "acc_small": readable(accent, paper, SMALL),
                    "rule": readable(accent, paper, LARGE), "line": mix(ink, paper, 0.85),
                    "btn_bg": ink if contrast(accent, paper) < LARGE else accent,
                    "btn_fg": WHITE if contrast(accent, paper) < LARGE else (on_accent if contrast(on_accent, accent) >= SMALL else WHITE),
                    "logo": "dark", "shade": paper}
    # accent: accent field (text in white or ink, whichever reads)
    fg = on_accent
    tr = (brand.get("treatments") or {}).get("accent") or {}
    if tr.get("head"):
        fg = c.get(tr["head"][0], fg) if isinstance(tr["head"], list) else fg
    if fg != WHITE:                                   # dark text on a light accent (e.g. gold): deepen it just enough
        fg = readable(fg, accent, SMALL)              # that small text (site, labels, answers) reads too
    out["accent"] = {"bg": accent, "fg": fg, "fg2": readable(fg, accent, SMALL), "acc": ink if fg == WHITE else WHITE,
                     "acc_small": readable(ink if fg == WHITE else WHITE, accent, SMALL),
                     "rule": fg, "line": mix(fg, accent, 0.7), "btn_bg": ink, "btn_fg": WHITE,
                     "logo": "white" if fg == WHITE else "dark", "shade": accent}
    if contrast(out["accent"]["acc"], accent) < LARGE:
        out["accent"]["acc"] = fg
    return out


def css_vars(t: dict) -> str:
    return ";".join(f"--{k.replace('_', '-')}:{v}" for k, v in t.items() if k != "logo")
