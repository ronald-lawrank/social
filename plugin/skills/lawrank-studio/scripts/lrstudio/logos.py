"""Logos: pick the firm's real logo, clean it, and make the two versions every design needs.

  logos/logo-white.svg   for dark and accent backgrounds (all colours turned white)
  logos/logo-dark.svg    for light backgrounds (the original colours; near-white parts turned to the brand ink)

SVGs from websites are untrusted: scripts, event handlers, foreignObject and external references are removed.
A raster-only logo (PNG/JPG) is wrapped in an SVG so every template can use it, and flagged: ask the firm for the
vector file.
"""
import base64
import io
import re
import xml.etree.ElementTree as ET

from .extract import hex_rgb, luminance, rgb_hex

SVG_NS = "http://www.w3.org/2000/svg"
XLINK = "http://www.w3.org/1999/xlink"
ET.register_namespace("", SVG_NS)
ET.register_namespace("xlink", XLINK)
BAD_TAGS = {"script", "foreignObject", "iframe", "object", "embed", "audio", "video", "animate", "set", "animateTransform"}
COLOR_ATTRS = ("fill", "stroke", "stop-color", "color", "flood-color")
NAMED = {"black": "#000000", "white": "#FFFFFF", "red": "#FF0000", "navy": "#000080", "gray": "#808080", "grey": "#808080"}


def _local(tag: str) -> str:
    return tag.split("}")[-1]


def to_hex(value: str) -> str | None:
    v = (value or "").strip().lower()
    if v in NAMED:
        return NAMED[v]
    m = re.fullmatch(r"#([0-9a-f]{3}|[0-9a-f]{6})", v)
    if m:
        h = m.group(1)
        return "#" + ("".join(c * 2 for c in h) if len(h) == 3 else h).upper()
    m = re.fullmatch(r"rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+%?))?\s*\)", v)
    if m:
        a = m.group(4)
        if a is not None and (float(a.rstrip("%")) / (100 if a.endswith("%") else 1)) < 0.05:
            return None
        return rgb_hex(tuple(float(m.group(i)) for i in (1, 2, 3)))
    return None


def sanitize(svg_text: str) -> str:
    """Parse, strip anything active or external, make sure there's a viewBox. Raises ValueError if unusable."""
    svg_text = re.sub(r"<\?xml[^>]*\?>|<!DOCTYPE[^>]*>", "", svg_text, flags=re.I).strip()
    if "<!ENTITY" in svg_text:
        raise ValueError("SVG declares entities")
    root = ET.fromstring(svg_text)
    if _local(root.tag) != "svg":
        raise ValueError("not an SVG")

    def clean(el):
        for child in list(el):
            if _local(child.tag) in BAD_TAGS:
                el.remove(child); continue
            clean(child)
        for k in list(el.attrib):
            lk = _local(k).lower()
            v = el.attrib[k]
            if lk.startswith("on") or (lk == "href" and not (v.startswith("#") or v.startswith("data:image/"))):
                del el.attrib[k]
            elif lk == "style" and re.search(r"url\(\s*['\"]?(?!#)|expression|javascript:", v, re.I):
                del el.attrib[k]
    clean(root)
    for style in root.iter(f"{{{SVG_NS}}}style"):
        style.text = re.sub(r"@import[^;]+;|url\(\s*['\"]?(?!#)[^)]*\)", "", style.text or "")
    if "viewBox" not in root.attrib:
        w = re.match(r"[\d.]+", root.attrib.get("width", "") or "")
        h = re.match(r"[\d.]+", root.attrib.get("height", "") or "")
        if not (w and h):
            raise ValueError("SVG has no viewBox or size")
        root.set("viewBox", f"0 0 {w.group(0)} {h.group(0)}")
    for k in ("width", "height", "class", "style", "x", "y"):
        root.attrib.pop(k, None)
    if not root.tag.startswith("{"):                 # inline SVG copied from a page has no namespace: give it one
        root.set("xmlns", SVG_NS)
    return ET.tostring(root, encoding="unicode")


def aspect(svg: str) -> float:
    m = re.search(r'viewBox="\s*[-\d.e]+[ ,]+[-\d.e]+[ ,]+([\d.e]+)[ ,]+([\d.e]+)', svg)
    return float(m.group(1)) / max(float(m.group(2)), 1e-6) if m else 1.0


def blends(svg: str, bg: str, tol: int = 40) -> bool:
    """True when some colour in the logo is close to the background, so part of the shape would disappear on it."""
    b = [int(bg.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)]
    for h in colors(svg):
        h = h.lstrip("#")
        if len(h) >= 6 and sum(abs(int(h[i:i + 2], 16) - v) for i, v in zip((0, 2, 4), b)) < tol:
            return True
    return False


def colors(svg: str) -> list[str]:
    """Colours actually painted (attributes, inline styles, <style> rules). Unfilled shapes paint black."""
    found = []
    for attr in COLOR_ATTRS:
        found += [m for m in re.findall(rf'\b{attr}\s*[=:]\s*["\']?\s*([#\w(),. %]+)', svg)]
    hexes = [h for h in (to_hex(v) for v in found) if h]
    shapes = len(re.findall(r"<(path|rect|circle|polygon|ellipse|text|polyline)\b", svg))
    explicit = len(re.findall(r'<(path|rect|circle|polygon|ellipse|text|polyline)\b[^>]*\bfill=', svg))
    if shapes > explicit and not re.search(r'<(svg|g)\b[^>]*\bfill="(?!none)', svg):
        hexes.append("#000000")
    return hexes


def is_light(svg: str) -> bool:
    cs = colors(svg)
    return bool(cs) and sum(luminance(c) for c in cs) / len(cs) > 0.6


def _recolor(svg: str, fn) -> str:
    def sub_val(m):
        h = to_hex(m.group(2))
        return m.group(1) + (fn(h) if h else m.group(2))
    for attr in COLOR_ATTRS:
        svg = re.sub(rf'(\b{attr}\s*=\s*")([^"]+)', sub_val, svg)
        svg = re.sub(rf'(\b{attr}\s*:\s*)([#\w(),. %]+?)(?=[;"}}])', sub_val, svg)
    return svg


def _default_fill(svg: str, color: str) -> str:
    """Shapes without a fill paint black: give the root a fill so the variant colour applies to them too."""
    if re.search(r"<svg\b[^>]*\bfill=", svg):
        return re.sub(r'(<svg\b[^>]*\bfill=")[^"]*', lambda m: m.group(1) + color, svg, count=1)
    return re.sub(r"<svg\b", f'<svg fill="{color}"', svg, count=1)


def write_variants(ldir, dark: str, white: str):
    """logo-dark/white.svg plus, when the lockup has an icon, mark-dark/white.svg (for profile pictures)."""
    from .util import write_text
    write_text(ldir / "logo-dark.svg", dark)
    write_text(ldir / "logo-white.svg", white)
    try:
        md = find_mark(dark)
    except Exception:
        md = None
    if md:
        write_text(ldir / "mark-dark.svg", md)
        vb = re.search(r'viewBox="[^"]*"', md).group(0)
        write_text(ldir / "mark-white.svg", re.sub(r'viewBox="[^"]*"', vb, white, count=1))
    return bool(md)


EMBEDDED = re.compile(r'((?:xlink:)?href=")data:image/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=\s]+)(")')


def white_version(svg: str) -> str:
    """All colours white. Embedded raster images (a PNG/JPG logo wrapped in an SVG) become white alpha masks:
    recolouring can't reach their pixels, and tracing them smears the lettering."""
    if EMBEDDED.search(svg):
        return EMBEDDED.sub(lambda m: m.group(1) + "data:image/png;base64," +
                            base64.b64encode(_white_mask(base64.b64decode(m.group(3)))).decode() + m.group(4), svg)
    return _default_fill(_recolor(svg, lambda h: "#FFFFFF"), "#FFFFFF")


def dark_version(svg: str, ink: str) -> str:
    return _recolor(svg, lambda h: ink if luminance(h) > 0.8 else h)


# ---------------------------------------------------------------- raster logos
def _knocked_out(data: bytes):
    """The logo as RGBA; a logo on a flat background gets that colour made transparent."""
    import numpy as np
    from PIL import Image
    im = Image.open(io.BytesIO(data))
    im.load()
    has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    im = im.convert("RGBA")
    if not has_alpha:
        # background = the median border colour (one corner pixel of a JPG can be off by 30 levels, which left a
        # white box behind), and a soft edge so JPEG noise fades instead of smearing round the letters
        a = np.asarray(im, dtype="int16")
        border = np.concatenate([a[0, :, :3], a[-1, :, :3], a[:, 0, :3], a[:, -1, :3]])
        bg = np.median(border, axis=0)
        distance = np.abs(a[..., :3] - bg).max(axis=2)
        im.putalpha(Image.fromarray(np.clip((distance - 32) * 255 / 64, 0, 255).astype("uint8")))
    return im


def _white_mask(data: bytes) -> bytes:
    """White pixels with the logo's own alpha, as PNG bytes."""
    from PIL import Image
    im = _knocked_out(data)
    out = Image.new("RGBA", im.size, (255, 255, 255, 255)); out.putalpha(im.getchannel("A"))
    b = io.BytesIO(); out.save(b, "PNG", optimize=True)
    return b.getvalue()


def wrap_raster(data: bytes) -> tuple[str, str | None]:
    """A PNG/JPG logo as an SVG (trimmed to its content). Returns (svg, white_svg): the white one is an alpha mask."""
    from PIL import Image
    im = _knocked_out(data)
    box = im.getchannel("A").getbbox()
    if box:
        im = im.crop(box)
    if max(im.size) > 1600:
        s = 1600 / max(im.size); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    w, h = im.size

    def emb(img):
        b = io.BytesIO(); img.save(b, "PNG", optimize=True)
        return (f'<svg xmlns="{SVG_NS}" viewBox="0 0 {w} {h}"><image width="{w}" height="{h}" '
                f'href="data:image/png;base64,{base64.b64encode(b.getvalue()).decode()}"/></svg>')
    white_px = Image.new("RGBA", im.size, (255, 255, 255, 255)); white_px.putalpha(im.getchannel("A"))
    return emb(im), emb(white_px)


def _chromatic_dark(rgb) -> bool:
    """A dark colour with some hue (navy, oxblood, forest): a brand colour, not just black or charcoal text."""
    return luminance(rgb_hex(rgb)) < 0.06 and max(rgb) - min(rgb) >= 18


def dominant_dark(svg: str | None = None, raster: bytes | None = None) -> str | None:
    """The logo's main dark brand colour (e.g. navy), or None when the logo is black, grey, light or colourful only."""
    from collections import Counter
    if svg and not raster:
        m = EMBEDDED.search(svg)
        if m:
            raster = base64.b64decode(m.group(3))
        else:
            counts = Counter(h for h in colors(svg) if _chromatic_dark(hex_rgb(h)))
            return counts.most_common(1)[0][0] if counts else None
    if not raster:
        return None
    import numpy as np
    a = np.asarray(_knocked_out(raster), dtype="int32")
    px = a[..., :3][a[..., 3] > 200]
    if not len(px):
        return None
    q = px // 8                                            # group anti-aliased edges with their fill
    keys, inv, n = np.unique(q, axis=0, return_inverse=True, return_counts=True)
    for i in np.argsort(-n):
        if n[i] < 0.05 * len(px):
            break
        rgb = tuple(px[inv.ravel() == i].mean(axis=0))
        if _chromatic_dark(rgb):
            return rgb_hex(rgb)
    return None


def raster_is_light(data: bytes) -> bool:
    from PIL import Image
    import numpy as np
    a = np.asarray(Image.open(io.BytesIO(data)).convert("RGBA"), dtype="float32")
    mask = a[..., 3] > 128
    if not mask.any():
        return False
    rgb = a[..., :3][mask] / 255
    lum = (0.2126 * rgb[:, 0] + 0.7152 * rgb[:, 1] + 0.0722 * rgb[:, 2]).mean()
    return lum > 0.75


# ---------------------------------------------------------------- the mark (icon part of a lockup)
def find_mark(svg: str) -> str | None:
    """The logo's icon as its own SVG, when the lockup has one (an icon, a clear gap, then the wordmark).
    Profile pictures need the mark: a whole wordmark is unreadable in a small circle."""
    import numpy as np
    from playwright.sync_api import sync_playwright
    m = re.search(r'viewBox="\s*([-\d.e]+)[ ,]+([-\d.e]+)[ ,]+([\d.e]+)[ ,]+([\d.e]+)', svg)
    if not m or aspect(svg) < 1.8:
        return None                                   # already compact: the logo is its own mark
    vx, vy, vw, vh = (float(v) for v in m.groups())
    W = 1600
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": W, "height": int(W / aspect(svg)) + 4})
        pg.set_content(f"<html><body style='margin:0;background:#fff'><div style='width:{W}px'>{svg}</div>"
                       "<style>svg{width:100%;height:auto;display:block}</style></body></html>")
        png = pg.locator("svg").first.screenshot()
        b.close()
    from PIL import Image
    a = np.asarray(Image.open(io.BytesIO(png)).convert("L"), dtype="float32")
    ink = (a < 235).any(axis=0)                       # columns with any drawing
    cols = np.where(ink)[0]
    if len(cols) == 0:
        return None
    runs, start = [], cols[0]
    for i in range(1, len(cols)):
        if cols[i] - cols[i - 1] > 1:
            runs.append((start, cols[i - 1])); start = cols[i]
    runs.append((start, cols[-1]))
    first = runs[0]
    gap = runs[1][0] - first[1] if len(runs) > 1 else 0
    rows = np.where((a[:, first[0]:first[1] + 1] < 235).any(axis=1))[0]
    if len(runs) < 2 or gap < 0.012 * a.shape[1] or not len(rows):
        return None
    w_px, h_px = first[1] - first[0] + 1, rows[-1] - rows[0] + 1
    if not 0.55 <= w_px / h_px <= 1.6 or h_px < 0.5 * a.shape[0]:
        return None                                   # the first shape isn't an icon (e.g. a letter of the wordmark)
    k = vw / a.shape[1]
    pad = 0.02 * vh
    x0, x1 = vx + first[0] * k - pad, vx + (first[1] + 1) * k + pad
    y0, y1 = vy + rows[0] * k - pad, vy + (rows[-1] + 1) * k + pad
    return re.sub(r'viewBox="[^"]*"', f'viewBox="{x0:.2f} {y0:.2f} {x1 - x0:.2f} {y1 - y0:.2f}"', svg, count=1)
