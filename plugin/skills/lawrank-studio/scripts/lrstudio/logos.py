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
    root.set("xmlns", SVG_NS)
    out = ET.tostring(root, encoding="unicode")
    return out.replace(' xmlns="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg"', ' xmlns="http://www.w3.org/2000/svg"')


def aspect(svg: str) -> float:
    m = re.search(r'viewBox="\s*[-\d.e]+[ ,]+[-\d.e]+[ ,]+([\d.e]+)[ ,]+([\d.e]+)', svg)
    return float(m.group(1)) / max(float(m.group(2)), 1e-6) if m else 1.0


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


def white_version(svg: str) -> str:
    return _default_fill(_recolor(svg, lambda h: "#FFFFFF"), "#FFFFFF")


def dark_version(svg: str, ink: str) -> str:
    return _recolor(svg, lambda h: ink if luminance(h) > 0.8 else h)


# ---------------------------------------------------------------- raster logos
def wrap_raster(data: bytes) -> tuple[str, str | None]:
    """A PNG/JPG logo as an SVG (trimmed to its content). Returns (svg, white_svg or None when it can't be reversed)."""
    import numpy as np
    from PIL import Image
    im = Image.open(io.BytesIO(data))
    im.load()
    has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    im = im.convert("RGBA")
    if not has_alpha:                                      # a logo on a flat background: knock out that colour
        a = np.asarray(im, dtype="int16")
        distance = np.abs(a[..., :3] - a[0, 0, :3]).max(axis=2)
        im.putalpha(Image.fromarray(np.where(distance > 24, 255, 0).astype("uint8")))
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
