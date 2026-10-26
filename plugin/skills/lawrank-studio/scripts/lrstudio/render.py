"""Draw designs: template -> HTML preview -> PNG per frame, plus the measurements the checks need.

Every design is one HTML file (previews/<id>.html) that opens in any browser; fonts are copied next to the previews
(previews/assets/fonts) and photos are linked from the client's brand folder, so the files stay small in Drive.
"""
import hashlib
import json
import shutil
from pathlib import Path

from . import checks, fonts, templates
from .util import say, write_bytes, write_text

MEASURE_JS = r"""() => {
  const R = e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; };
  return [...document.querySelectorAll('.frame')].map(f => {
    const fr = f.getBoundingClientRect(), off = e => { const r = R(e); return [r[0] - fr.left, r[1] - fr.top, r[2], r[3]]; };
    const slots = [...f.querySelectorAll('[data-slot]')].map(e => {
      const cs = getComputedStyle(e);
      // text lines: one rect per line box, so a short last line doesn't count as a wide one
      const range = document.createRange(); range.selectNodeContents(e);
      // (vertically clipped to the element: big display type's em box reaches past its tight line height)
      const er = e.getBoundingClientRect();
      const lines = [...range.getClientRects()].map(r => { const t = Math.max(r.top, er.top), b = Math.min(r.bottom, er.bottom);
        return [r.left - fr.left, t - fr.top, r.width, Math.max(0, b - t)]; }).filter(r => r[2] > 2 && r[3] > 2);
      return { slot: e.dataset.slot, role: e.dataset.role || 'body', edge: !!e.dataset.edge, rect: off(e), lines,
               size: parseFloat(cs.fontSize), weight: parseInt(cs.fontWeight), color: cs.color,
               // only boxes that clip their content can hide text; free-flowing text is caught by the safe-area check
               overflowY: cs.overflow !== 'visible' ? e.scrollHeight - e.clientHeight : 0,
               overflowX: cs.overflow !== 'visible' ? e.scrollWidth - e.clientWidth : 0,
               text: (e.innerText || '').trim().slice(0, 200) };
    });
    const ovs = [...f.querySelectorAll('[data-ov]')].map(e => ({ type: e.dataset.ov, rect: off(e),
               opaque: e.dataset.opaque ? JSON.parse(e.dataset.opaque) : null,
               // for logos: the colour it's drawn in and the field it was designed for, to measure it on the pixels
               bg: e.dataset.ov === 'logo' ? getComputedStyle(e.closest('.frame')).getPropertyValue('--bg').trim() : null }));
    const photos = [...f.querySelectorAll('[data-photo-box]')].map(e => JSON.parse(e.dataset.photoBox));
    return { size: f.dataset.size, slide: f.dataset.slide ? +f.dataset.slide : null, treatment: f.dataset.treatment,
             w: fr.width, h: fr.height, safe: JSON.parse(f.dataset.safe), slots, ovs, photos };
  });
}"""


def _font_assets(brand: dict, previews: Path) -> tuple[str, list[str]]:
    """Copy the brand font files next to the previews and return @font-face CSS with relative URLs."""
    css, notes = fonts.face_css(brand)
    adir = previews / "assets" / "fonts"
    adir.mkdir(parents=True, exist_ok=True)

    def localize(m):
        src = Path(m.group(1))
        dst = adir / src.name
        if not dst.exists() or dst.stat().st_size != src.stat().st_size:
            shutil.copy(src, dst)
        return f"url('assets/fonts/{src.name}')"
    import re
    return re.sub(r"url\('file://([^']+)'\)", localize, css), notes


_ENGINE = None


def _engine_hash() -> bytes:
    """The code that draws and checks designs: a change here re-renders and re-checks everything once."""
    global _ENGINE
    if _ENGINE is None:
        here = Path(__file__).parent
        _ENGINE = hashlib.sha1(b"".join((here / f).read_bytes() for f in
                                        ("render.py", "checks.py", "templates.py", "photos.py", "theme.py", "fonts.py"))).digest()
    return _ENGINE


def design_key(template: str, size: str, data: dict, brand: dict, extra: str = "") -> str:
    """A fingerprint of everything that affects the drawing (for skipping unchanged designs)."""
    tdir = Path(templates.get(template)["dir"])
    h = hashlib.sha1(_engine_hash())
    shared = [f for d in templates.paths.template_dirs() for f in sorted((d / "_base").glob("*"))]
    for p in sorted(tdir.glob("*")) + shared:
        if p.is_file():
            h.update(p.read_bytes())
    h.update(json.dumps([template, size, data, brand, extra], sort_keys=True, default=str).encode())
    return h.hexdigest()[:16]


def render(client_dir: Path, brand: dict, designs: list[dict], out_dir: Path, cache: dict | None = None, flat: bool = False) -> list[dict]:
    """designs: [{id, template, size, data}]. Writes out_dir/previews/<id>.html and out_dir/images/<id>[_n].png.

    Returns per design: {id, html, images, frames (measurements), issues, key}. Designs whose key matches `cache`
    (and whose images exist) are skipped and their cached result returned.
    """
    from playwright.sync_api import sync_playwright
    previews, images = (out_dir, out_dir) if flat else (out_dir / "previews", out_dir / "images")    # flat: one folder
    previews.mkdir(parents=True, exist_ok=True); images.mkdir(parents=True, exist_ok=True)
    font_css, font_notes = _font_assets(brand, previews)
    photo_meta = (client_dir / "brand" / "photos" / "photos.json")
    photo_sig = hashlib.sha1(photo_meta.read_bytes()).hexdigest()[:8] if photo_meta.exists() else ""
    results, todo = [], []
    for d in designs:
        key = design_key(d["template"], d["size"], d["data"], brand, photo_sig)
        prev = (cache or {}).get(d["id"])
        if prev and prev.get("key") == key and all((out_dir / p).exists() for p in prev.get("images", [])):
            results.append(dict(prev, cached=True)); continue
        html, used = templates.render_html(d["template"], brand, client_dir, d["size"], d["data"], previews, font_css, title=d.get("title", d["id"]))
        write_text(previews / f"{d['id']}.html", html)
        todo.append((d, key, used))
    if todo:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(device_scale_factor=1)
            for i, (d, key, used) in enumerate(todo, 1):
                say(f"  drawing {d['id']} ({i}/{len(todo)})")
                size = templates.SIZES[d["size"]]
                page.set_viewport_size({"width": size["w"], "height": size["h"]})
                page.goto((previews / f"{d['id']}.html").resolve().as_uri() + "#render")
                page.evaluate("document.fonts.ready.then(() => window.__fit && window.__fit())")
                page.wait_for_function("[...document.images].every(i => i.complete)", timeout=20000)
                frames = page.evaluate(MEASURE_JS)
                shots = []
                els = page.query_selector_all(".frame")
                for n, el in enumerate(els):
                    name = f"{d['id']}.png" if len(els) == 1 else f"{d['id']}_{n + 1:02d}.png"
                    write_bytes(images / name, el.screenshot(type="png"))
                    shots.append(name if flat else f"images/{name}")
                issues = []
                for n, f in enumerate(frames):
                    issues += [dict(x, frame=n) for x in checks.check_frame(f, out_dir / shots[n])]
                results.append({"id": d["id"], "key": key, "template": d["template"], "size": d["size"],
                                "html": f"{d['id']}.html" if flat else f"previews/{d['id']}.html", "images": shots, "photos": used,
                                "issues": issues, "frames": len(frames)})
            browser.close()
    order = {d["id"]: i for i, d in enumerate(designs)}
    results.sort(key=lambda r: order.get(r["id"], 0))
    for r in results:
        r.setdefault("font_notes", font_notes)
    return results
