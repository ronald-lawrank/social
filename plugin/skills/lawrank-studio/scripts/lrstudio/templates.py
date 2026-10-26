"""Templates: designer-made HTML layouts with named copy slots, filled with a client's brand.

A template is a folder (in Drive under LawRank Studio/templates/, or bundled with the skill):
  template.html   Jinja HTML. Each canvas is a <div class="frame"> made with frame(); copy goes in elements with
                  data-slot="<name>" so the checks can find it.
  meta.json       label, format (static|carousel|kit|board), sizes, slots with limits, photo needs, what it suits.

Helpers available inside templates: frame, logo, photo, shade, icon, cta, stars, tvars (a treatment's colours for a
region), accent (filter), br (filter),
T (treatment colours), S (size), c (the copy), d (the whole option: photo, treatment, footer...), brand, pick_photo.
"""
import html
import json
import re
from pathlib import Path

from markupsafe import Markup

from . import paths, photos as photo_mod, theme
from .util import LRError, read_json

SIZES = {
    "4x5": {"w": 1080, "h": 1350, "safe": [88, 96, 88, 96], "label": "Feed 4:5"},
    "1x1": {"w": 1080, "h": 1080, "safe": [76, 88, 76, 88], "label": "Square 1:1"},
    "9x16": {"w": 1080, "h": 1920, "safe": [250, 88, 380, 88], "label": "Story 9:16"},
    "fb-cover": {"w": 1640, "h": 624, "safe": [48, 265, 190, 265], "label": "Facebook cover"},
    "li-banner": {"w": 2256, "h": 382, "safe": [44, 80, 44, 640], "label": "LinkedIn banner"},
    "profile": {"w": 1080, "h": 1080, "safe": [190, 190, 190, 190], "label": "Profile picture (circle)"},
    "highlight": {"w": 1080, "h": 1920, "safe": [610, 190, 610, 190], "label": "Highlight cover"},
    "board": {"w": 1920, "h": 1080, "safe": [72, 96, 72, 96], "label": "Brand board"},
}
ICON_DIR = paths.BUNDLED_TEMPLATES / "_icons"
STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>'
ARROW = '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'


# ---------------------------------------------------------------- catalog
def catalog() -> dict[str, dict]:
    """name -> meta (with 'dir'). Drive templates override bundled ones of the same name."""
    out = {}
    for root in reversed(paths.template_dirs()):
        if not root.exists():
            continue
        for d in sorted(p for p in root.iterdir() if p.is_dir() and not p.name.startswith("_")):
            meta = read_json(d / "meta.json")
            if meta and (d / "template.html").exists():
                out[d.name] = dict(meta, name=d.name, dir=str(d))
    return out


def get(name: str) -> dict:
    cat = catalog()
    if name not in cat:
        raise LRError(f"No template called '{name}'", fix=f"Templates: {', '.join(sorted(cat))}")
    return cat[name]


def split_id(did: str) -> tuple[str, str, str]:
    """'PI-001-A-4x5' -> ('PI-001', 'A', '4x5'). Sizes can contain hyphens ('KIT-FB-fb-cover', 'KIT-LI-li-banner'),
    so the size is matched against the known sizes first; post ids can too ('DIR-A-A1-4x5')."""
    for size in sorted([*SIZES, "motion"], key=len, reverse=True):
        if did.endswith("-" + size):
            post, key = did[:-len(size) - 1].rsplit("-", 1)
            return post, key, size
    post, key, size = did.rsplit("-", 2)
    return post, key, size


def detail(name: str) -> dict:
    """Everything needed to write one template: slots with limits and notes, options, sizes and a known-good example."""
    m = get(name)
    ex = next((d / name / "example.json" for d in paths.template_dirs() if (d / name / "example.json").exists()), None)
    return {"name": name, **{k: m.get(k) for k in ("label", "format", "use_for", "photo", "sizes", "treatment", "slots", "options", "compliance") if m.get(k) is not None},
            "example": json.loads(ex.read_text()) if ex else None,
            **({"icons": sorted(f.stem for f in ICON_DIR.glob("*.svg"))} if "icon" in json.dumps(m.get("slots", {})) + json.dumps(m.get("options") or {}) else {}),
            "note": "The example's photo keys belong to a test client: use this client's keys from `lr client show`."}


def catalog_summary() -> list[dict]:
    return [{"name": n, "label": m.get("label"), "format": m.get("format"), "use_for": m.get("use_for"),
             "photo": m.get("photo", "none"), "slots": {k: v.get("max") for k, v in m.get("slots", {}).items()}}
            for n, m in sorted(catalog().items())]


# ---------------------------------------------------------------- copy helpers
def accent(text, phrase=None):
    """Escape text; colour the accent phrase; keep explicit line breaks."""
    t = html.escape(str(text or ""))
    if phrase:
        p = html.escape(str(phrase))
        i = t.lower().find(p.lower())
        if i >= 0:
            t = t[:i] + f'<span class="acc">{t[i:i + len(p)]}</span>' + t[i + len(p):]
    return Markup(t.replace("\n", "<br>"))


def br(text):
    return Markup(html.escape(str(text or "")).replace("\n", "<br>"))


class Ctx:
    """Everything a template needs to draw one design: brand, treatment, size, photos, and the drawing helpers."""

    def __init__(self, brand: dict, client_dir: Path, size: str, treatment: str, html_dir: Path):
        if size not in SIZES:
            raise LRError(f"Unknown size '{size}'", fix=f"Sizes: {', '.join(SIZES)}")
        self.brand, self.client_dir, self.size, self.html_dir = brand, client_dir, size, html_dir
        self.S = dict(SIZES[size], key=size)
        self.themes = theme.treatments(brand)
        self.T = dict(self.themes.get(treatment) or self.themes["dark"], name=treatment)
        self.photos = read_json(client_dir / "brand" / "photos" / "photos.json", {}) or {}
        self.used_photos: list[str] = []
        self.logos = {}
        for v in ("white", "dark"):
            for kind in ("logo", "mark"):
                f = client_dir / "brand" / "logos" / f"{kind}-{v}.svg"
                if f.exists():
                    self.logos[v if kind == "logo" else f"mark-{v}"] = re.sub(r"<\?xml[^>]*\?>", "", f.read_text(encoding="utf-8"))

    # --- drawing helpers (return Markup) ---
    def frame(self, treatment: str | None = None, extra_class: str = "", style: str = "", safe=None, slide: int | None = None):
        t = dict(self.themes.get(treatment) or self.T, name=treatment or self.T["name"]) if treatment else self.T
        s = safe or self.S["safe"]
        attrs = {"data-size": self.size, "data-safe": json.dumps(s), "data-treatment": t["name"]}
        if slide is not None:
            attrs["data-slide"] = str(slide)
        a = " ".join(f"{k}='{v}'" for k, v in attrs.items())
        return Markup(f'<div class="frame sz-{self.size} {extra_class}" {a} style="width:{self.S["w"]}px;height:{self.S["h"]}px;'
                      f'{theme.css_vars(t)};{style}">')

    def logo(self, width: int = 300, variant: str | None = None, style: str = "", treatment: str | None = None, mark: bool = False):
        t = self.themes.get(treatment) if treatment else self.T
        v = variant or t["logo"]
        svg = (self.logos.get(f"mark-{v}") if mark else None) or self.logos.get(v) or self.logos.get("dark") or self.logos.get("white")
        if mark and self.logos.get(f"mark-{v}"):
            return Markup(f'<div class="logo" data-ov="logo" style="width:{width}px;{style}">{svg}</div>')
        if not svg:
            name = html.escape(self.brand.get("name", ""))
            return Markup(f'<div class="logo" data-ov="logo" style="width:{width}px;font-family:var(--f-head);font-weight:var(--w-head);'
                          f'font-size:{max(24, width // 9)}px;line-height:1.1;color:var(--fg);{style}">{name}</div>')
        return Markup(f'<div class="logo" data-ov="logo" style="width:{width}px;{style}">{svg}</div>')

    def pick_photo(self, kinds=("person", "group"), avoid=(), prefer=None):
        """A usable photo of the given kind(s), not already used in this design if possible."""
        usable = {k: p for k, p in self.photos.items() if p.get("use", True)}
        if prefer and prefer in usable:
            return prefer
        for k, p in usable.items():
            if p["kind"] in kinds and k not in avoid and k not in self.used_photos:
                return k
        for k, p in usable.items():
            if p["kind"] in kinds:
                return k
        return None

    def photo(self, key, x, y, w, h, fill: float = 0.0, focus_y: float = 0.12, focus_x: float = 0.5, style: str = "",
              portrait: bool = False):
        """A photo in a fixed box, cropped so people stay whole. Records face/shoulder boxes for the checks."""
        if not key:
            return Markup("")
        p = self.photos.get(key)
        if not p:
            raise LRError(f"Photo '{key}' isn't in this client's photos", fix=f"Photos: {', '.join(self.photos)}")
        c = photo_mod.crop(p, w, h, fill=fill, focus_y=focus_y, focus_x=focus_x)
        self.used_photos.append(key)
        people = []
        for fx, fy, fw, fh in p.get("faces") or []:
            face = [x + c["x"] + fx * c["w"], y + c["y"] + fy * c["h"], fw * c["w"], fh * c["h"]]
            cx = face[0] + face[2] / 2
            # shoulders just below the chin: ~2.2 head-box widths (the head box is already padded for hair)
            body = [cx - 1.1 * face[2], face[1] + face[3], 2.2 * face[2], min(1.0 * face[3], y + h - face[1] - face[3])]
            people.append({"face": [round(v, 1) for v in face], "chest": [round(v, 1) for v in body]})
        src = Path(self.client_dir / "brand" / "photos" / p["file"])
        rel = Path(_relpath(src, self.html_dir))
        info = json.dumps({"key": key, "clip": [x, y, w, h], "people": people, "upscale": c["upscale"],
                           "people_whole": c["people_whole"], "heads_whole": c["heads_whole"], "portrait": portrait})
        return Markup(f'<div class="ph" data-photo-box=\'{html.escape(info)}\' style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;{style}">'
                      f'<img src="{html.escape(rel.as_posix())}" alt="" style="left:{c["x"]}px;top:{c["y"]}px;width:{c["w"]}px;height:{c["h"]}px"></div>')

    def shade(self, x, y, w, h, direction: str = "to bottom", color: str | None = None, start: float = 0.0, end: float = 1.0):
        """A fade from transparent to the field colour. The opaque part (from `end` on) must not touch faces."""
        col = color or self.T["shade"]
        r, g, b = (int(col[i:i + 2], 16) for i in (1, 3, 5))
        grad = f"linear-gradient({direction}, rgba({r},{g},{b},0) {start * 100:.0f}%, rgba({r},{g},{b},0.82) {(start + (end - start) * 0.7) * 100:.0f}%, rgba({r},{g},{b},1) {end * 100:.0f}%)"
        # the part of the fade dark enough to hide a face: from 45% of the way through it
        if direction == "to bottom":
            o = [x, y + h * (start + (end - start) * 0.45), w, h * (1 - start - (end - start) * 0.45)]
        elif direction == "to top":
            o = [x, y, w, h * (1 - start - (end - start) * 0.45)]
        elif direction == "to right":
            o = [x + w * (start + (end - start) * 0.45), y, w * (1 - start - (end - start) * 0.45), h]
        else:
            o = [x, y, w * (1 - start - (end - start) * 0.45), h]
        return Markup(f'<div data-ov="shade" data-opaque=\'{json.dumps([round(v, 1) for v in o])}\' '
                      f'style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;background:{grad}"></div>')

    def icon(self, name: str, size: int = 56, stroke: float = 2.0, color: str = "currentColor"):
        f = ICON_DIR / f"{name}.svg"
        if not f.exists():
            f = ICON_DIR / "check.svg"
        svg = re.sub(r"<!--.*?-->", "", f.read_text(), flags=re.S)
        svg = re.sub(r'stroke-width="[\d.]+"', f'stroke-width="{stroke}"', svg)
        svg = re.sub(r'\s(width|height)="24"', "", svg, count=2).replace('class="lucide', 'class="i lucide')
        return Markup(f'<span class="icon" data-ov="icon" style="width:{size}px;height:{size}px;color:{color}">{svg}</span>')

    def cta(self, text: str, arrow: bool = True):
        return Markup(f'<div class="btn" data-slot="cta" data-role="cta">{html.escape(text or "")}{ARROW if arrow else ""}</div>')

    def stars(self, n: int = 5):
        return Markup(f'<div class="stars" data-ov="stars">{STAR * int(n or 5)}</div>')


def _relpath(target: Path, start: Path) -> str:
    import os
    return os.path.relpath(Path(target).resolve(), Path(start).resolve())


def environment(tpl_dir: Path):
    from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape
    env = Environment(loader=FileSystemLoader([str(tpl_dir), str(paths.BUNDLED_TEMPLATES / "_base")] +
                                              [str(d / "_base") for d in paths.template_dirs()]),
                      autoescape=select_autoescape(["html"]), undefined=StrictUndefined, trim_blocks=True, lstrip_blocks=True)
    env.filters["accent"] = accent
    env.filters["br"] = br
    return env


def root_vars(brand: dict) -> str:
    from .fonts import resolve
    f = brand.get("fonts") or {}
    head = resolve(f.get("head", {}).get("family", "Montserrat"))[0]
    body = resolve(f.get("body", {}).get("family", "Lato"))[0]
    ui = resolve((f.get("ui") or f.get("head") or {}).get("family", head))[0]
    cta = brand.get("cta") or {}
    c = brand["colors"]
    return (f":root{{--ink:{c['ink']};--accent:{c['accent']};--paper:{c.get('paper', '#F5F5F2')};--muted:{c.get('muted', '#6C7C86')};"
            f"--f-head:'{head}',sans-serif;--f-body:'{body}',sans-serif;--f-ui:'{ui}',sans-serif;"
            f"--w-head:{f.get('head', {}).get('weight', 700)};--w-ui:{(f.get('ui') or {}).get('weight', 700) if f.get('ui') else min(700, max(600, f.get('head', {}).get('weight', 700)))};"
            f"--radius:{min(int(cta.get('radius', 4)), 60)}px;--cta-case:{'uppercase' if cta.get('upper') else 'none'};"
            f"--cta-track:{'0.12em' if cta.get('upper') else '0.01em'};}}")


def render_html(template: str, brand: dict, client_dir: Path, size: str, data: dict, html_dir: Path,
                font_css: str, title: str = "") -> tuple[str, list[str]]:
    """The HTML for one design (all its frames). Returns (html, photo keys used)."""
    meta = get(template)
    if size not in meta.get("sizes", []):
        raise LRError(f"Template '{template}' doesn't come in {size}", fix=f"Sizes: {', '.join(meta.get('sizes', []))}")
    ctx = Ctx(brand, client_dir, size, data.get("treatment") or meta.get("treatment", "dark"), html_dir)
    env = environment(Path(meta["dir"]))
    base_css = (paths.BUNDLED_TEMPLATES / "_base" / "base.css").read_text()
    tpl_css = (Path(meta["dir"]) / "style.css").read_text() if (Path(meta["dir"]) / "style.css").exists() else ""
    body = env.get_template("template.html").render(
        d=data, c=data.get("copy") or {}, photos_list=data.get("photos_list", []), brand=brand, T=ctx.T, S=ctx.S, themes=ctx.themes, frame=ctx.frame, logo=ctx.logo, photo=ctx.photo, shade=ctx.shade,
        icon=ctx.icon, cta=ctx.cta, stars=ctx.stars, pick_photo=ctx.pick_photo,
        tvars=lambda name: Markup(theme.css_vars(ctx.themes[name])),
        photo_kind=lambda key: (ctx.photos.get(key) or {}).get("kind"), site=brand.get("website", ""), meta=meta)
    page = (f"<!doctype html><html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width'>"
            f"<title>{html.escape(title or template)}</title><style>{font_css}\n{root_vars(brand)}\n{base_css}\n{tpl_css}</style></head>"
            f"<body class='sz-{size}'><div class='deck'>{body}</div>{PREVIEW_JS}</body></html>")
    return page, ctx.used_photos


# In a browser the frames are scaled to fit the window; the renderer adds #render for 1:1 pixels.
PREVIEW_JS = """<script>
/* Giant words and numbers may shrink, only as far as needed to fit their width (never body copy). Runs once the
   brand fonts have loaded, measuring the text itself. */
window.__fit=function(){document.querySelectorAll('.word, .stat, .fitw').forEach(function(e){e.style.whiteSpace='nowrap';e.style.display='block';
if(!e.dataset.size0)e.dataset.size0=getComputedStyle(e).fontSize;var s=parseFloat(e.dataset.size0),min=s*0.4;e.style.fontSize=s+'px';
var r=document.createRange();r.selectNodeContents(e);while(r.getBoundingClientRect().width>e.clientWidth+1&&s>min){s-=2;e.style.fontSize=s+'px';}});};
document.fonts.ready.then(window.__fit);
(function(){if(location.hash==='#render'){document.body.classList.add('render');return;}
function fit(){var fr=document.querySelectorAll('.frame');var n=fr.length;var W=window.innerWidth-80;
fr.forEach(function(f){var w=f.offsetWidth,h=f.offsetHeight;var per=Math.min(n,Math.max(1,Math.floor((W+40)/(Math.min(w,W)*0.4+40))));
var s=Math.min(1,(W-(per-1)*40)/per/w);f.style.zoom=s;});}
window.addEventListener('resize',fit);fit();})();</script>"""
