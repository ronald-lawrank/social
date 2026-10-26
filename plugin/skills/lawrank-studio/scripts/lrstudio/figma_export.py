"""Figma: turn rendered designs into editable layers and a development plugin that rebuilds them in one click.

The layers are read from the real rendered page (what you see is what Figma gets): text with its font, size,
spacing, colours and accent ranges; shapes and fades; photos pre-cropped exactly as shown (swap them in Figma
with "Choose image"); logos and icons as vectors. Fonts are Google fonts, which Figma has; anything missing falls
back to the closest available weight, then Inter, and the plugin says which.
"""
import base64
import hashlib
import io
import json
import re
import urllib.parse
import zipfile
from pathlib import Path

from .util import write_bytes

EXPORT_JS = r"""() => {
  const out = [];
  const px = v => parseFloat(v) || 0;
  const rgba = c => { const m = (c || '').match(/[\d.]+/g); if (!m) return null; const a = m.length > 3 ? +m[3] : 1; return a < 0.01 ? null : { r: +m[0] / 255, g: +m[1] / 255, b: +m[2] / 255, a }; };
  const INLINE = new Set(['SPAN', 'BR', 'B', 'I', 'EM', 'STRONG', 'A']);
  for (const f of document.querySelectorAll('.frame')) {
    const fr = f.getBoundingClientRect(), L = [];
    const box = e => { const r = e.getBoundingClientRect(); return [r.left - fr.left, r.top - fr.top, r.width, r.height]; };
    const grad = bgi => { const m = bgi.match(/linear-gradient\((.*)\)$/); if (!m) return null;
      const parts = m[1].split(/,(?![^(]*\))/).map(s => s.trim()); let dir = 'to bottom';
      if (/^to |deg$/.test(parts[0])) dir = parts.shift();
      const stops = parts.map(p => { const c = p.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/i), pos = p.match(/([\d.]+)%\s*$/); return { color: rgba(c ? c[0] : ''), pos: pos ? +pos[1] / 100 : null }; });
      stops.forEach((s, i) => { if (s.pos === null) s.pos = i / Math.max(1, stops.length - 1); });
      return { dir, stops: stops.filter(s => s.color || true).map(s => ({ color: s.color || { r: 0, g: 0, b: 0, a: 0 }, pos: s.pos })) }; };
    const pseudo = (e, which) => { const cs = getComputedStyle(e, which); if (!cs || cs.content === 'none' || cs.content === 'normal') return;
      const bg = rgba(cs.backgroundColor); const w = px(cs.width), h = px(cs.height);
      if (bg && w > 0 && h > 0) { const r = box(e), ml = px(cs.marginLeft); const left = cs.position === 'absolute' ? r[0] + px(cs.left) : r[0] + ml;
        const top = cs.position === 'absolute' ? r[1] + px(cs.top) : r[1] + (r[3] - h) / 2; L.push({ type: 'rect', name: 'Detail', box: [left, top, w, h], fill: bg }); } };
    const walk = e => {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return;
      if (e.tagName === 'SCRIPT' || e.tagName === 'STYLE') return;
      const r = box(e);
      if (e.tagName === 'IMG') { const ph = e.closest('.ph'); L.push({ type: 'image', name: 'Photo', src: e.currentSrc || e.src, box: ph ? box(ph) : r, img: r }); return; }
      if (e.tagName.toLowerCase() === 'svg') {
        const clone = e.cloneNode(true); const color = cs.color;
        clone.setAttribute('width', r[2]); clone.setAttribute('height', r[3]);
        let s = clone.outerHTML.replace(/currentColor/g, color);
        if (!/xmlns=/.test(s)) s = s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        L.push({ type: 'svg', name: e.closest('[data-ov=logo]') ? 'Logo' : 'Icon', svg: s, box: r }); return;
      }
      if (e !== f) {
        const bg = rgba(cs.backgroundColor), g = cs.backgroundImage && cs.backgroundImage !== 'none' ? grad(cs.backgroundImage) : null;
        if ((bg || g) && r[2] > 0 && r[3] > 0) L.push({ type: 'rect', name: e.dataset.ov === 'shade' ? 'Photo fade' : (e.className || 'Shape').toString().split(' ')[0] || 'Shape',
          box: r, fill: bg, gradient: g, radius: Math.min(px(cs.borderTopLeftRadius), r[2] / 2, r[3] / 2) });
        for (const [side, w, c] of [['top', cs.borderTopWidth, cs.borderTopColor], ['bottom', cs.borderBottomWidth, cs.borderBottomColor], ['left', cs.borderLeftWidth, cs.borderLeftColor], ['right', cs.borderRightWidth, cs.borderRightColor]]) {
          const bw = px(w), bc = rgba(c); if (!bw || !bc || cs.borderStyle === 'none') continue;
          const bb = side === 'top' ? [r[0], r[1], r[2], bw] : side === 'bottom' ? [r[0], r[1] + r[3] - bw, r[2], bw] : side === 'left' ? [r[0], r[1], bw, r[3]] : [r[0] + r[2] - bw, r[1], bw, r[3]];
          L.push({ type: 'rect', name: 'Rule', box: bb, fill: bc }); }
      }
      pseudo(e, '::before');
      const kids = [...e.childNodes];
      const hasText = kids.some(n => n.nodeType === 3 && n.textContent.trim());
      const inlineOnly = kids.every(n => n.nodeType === 3 || (n.nodeType === 1 && INLINE.has(n.tagName)));
      if (hasText && inlineOnly) {
        // one text layer, with colour ranges for accent spans
        const runs = []; let chars = '';
        const add = (txt, el) => { if (!txt) return; const c = getComputedStyle(el); runs.push({ start: chars.length, end: chars.length + txt.length, color: rgba(c.color) }); chars += txt; };
        const rec = (n, el) => { for (const k of n.childNodes) { if (k.nodeType === 3) add(k.textContent.replace(/\s+/g, ' '), el); else if (k.tagName === 'BR') { chars += '\n'; } else rec(k, k); } };
        rec(e, e);
        const after = getComputedStyle(e, '::after'); if (after.content && after.content !== 'none' && after.content !== 'normal') add(after.content.replace(/^"|"$/g, ''), e);
        const before = chars.length; chars = chars.replace(/^\s+/, ''); const cut = before - chars.length;
        runs.forEach(r => { r.start = Math.max(0, r.start - cut); r.end = Math.max(0, r.end - cut); });
        const range = document.createRange(); range.selectNodeContents(e); const tr = range.getBoundingClientRect();
        // x/width from the glyphs, y/height from the line boxes (Figma places text by line box, like CSS)
        const er = e.getBoundingClientRect(), pt = px(cs.paddingTop), pb = px(cs.paddingBottom);
        L.push({ type: 'text', name: e.dataset.slot || 'Text', box: [tr.left - fr.left, er.top + pt - fr.top, Math.max(tr.width, 1), Math.max(er.height - pt - pb, 1)],
          chars, runs, family: cs.fontFamily.split(',')[0].replace(/['"]/g, '').trim(), weight: +cs.fontWeight, size: px(cs.fontSize),
          lineHeight: cs.lineHeight === 'normal' ? null : px(cs.lineHeight), letterSpacing: px(cs.letterSpacing) || 0,
          upper: cs.textTransform === 'uppercase', align: cs.textAlign === 'center' ? 'CENTER' : (cs.textAlign === 'right' ? 'RIGHT' : 'LEFT'),
          nowrap: cs.whiteSpace === 'nowrap', strike: (cs.textDecorationLine || '').includes('line-through') });
        return;
      }
      for (const k of e.children) walk(k);
    };
    const fcs = getComputedStyle(f);
    walk(f);
    out.push({ w: fr.width, h: fr.height, bg: rgba(fcs.backgroundColor), slide: f.dataset.slide || null, layers: L });
  }
  return out;
}"""


def _crop_image(src: str, html_dir: Path, clip: list, img: list) -> bytes | None:
    """The photo exactly as shown: the clip box's pixels at 1x."""
    from PIL import Image
    p = Path(urllib.parse.unquote(urllib.parse.urlparse(src).path)) if src.startswith("file:") else (html_dir / src)
    if not p.exists():
        return None
    im = Image.open(p).convert("RGB")
    cx, cy, cw, ch = clip
    ix, iy, iw, ih = img
    sx, sy = im.width / iw, im.height / ih
    box = ((cx - ix) * sx, (cy - iy) * sy, (cx - ix + cw) * sx, (cy - iy + ch) * sy)
    out = im.crop(tuple(round(v) for v in box)).resize((max(1, round(cw)), max(1, round(ch))), Image.LANCZOS)
    buf = io.BytesIO(); out.save(buf, "JPEG", quality=88)
    return buf.getvalue()


def collect(html_files: list[tuple[str, Path]]) -> tuple[list[dict], dict]:
    """[(name, html path)] -> (designs [{name, frames}], images {hash: base64})."""
    from playwright.sync_api import sync_playwright
    designs, images = [], {}
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        for name, html in html_files:
            pg.set_viewport_size({"width": 2400, "height": 2000})
            pg.goto(html.resolve().as_uri() + "#render")
            pg.evaluate("document.fonts.ready.then(() => window.__fit && window.__fit())")
            pg.wait_for_function("[...document.images].every(i => i.complete)", timeout=20000)
            frames = pg.evaluate(EXPORT_JS)
            for fr in frames:
                for l in fr["layers"]:
                    if l["type"] == "image":
                        data = _crop_image(l["src"], html.parent, l["box"], l["img"])
                        if data:
                            h = hashlib.sha1(data).hexdigest()[:16]
                            images.setdefault(h, base64.b64encode(data).decode())
                            l["hash"] = h
                        l.pop("src", None); l.pop("img", None)
                    for k in ("box",):
                        l[k] = [round(v, 2) for v in l[k]]
            designs.append({"name": name, "frames": frames})
        b.close()
    return designs, images


PLUGIN_JS = r"""// LawRank Studio — builds this campaign's designs as editable Figma layers. Generated; don't edit.
const DATA = __DATA__;
const IMAGES = __IMAGES__;
const STYLE_NAMES = { 100: ['Thin'], 200: ['ExtraLight', 'Extra Light'], 300: ['Light'], 400: ['Regular'], 500: ['Medium'], 600: ['SemiBold', 'Semi Bold'], 700: ['Bold'], 800: ['ExtraBold', 'Extra Bold'], 900: ['Black'] };
let FONTS = null; const missing = new Set(), loaded = {};
async function font(family, weight) {
  const key = family + '|' + weight; if (loaded[key]) return loaded[key];
  if (!FONTS) FONTS = await figma.listAvailableFontsAsync();
  const styles = FONTS.filter(f => f.fontName.family === family && !/italic/i.test(f.fontName.style)).map(f => f.fontName.style);
  let pick = null;
  if (styles.length) {
    for (let d = 0; d <= 400 && !pick; d += 100) for (const w of [weight - d, weight + d]) { for (const s of (STYLE_NAMES[w] || [])) if (styles.includes(s)) { pick = { family, style: s }; break; } if (pick) break; }
    if (!pick) pick = { family, style: styles[0] };
  } else { missing.add(family); pick = { family: 'Inter', style: weight >= 600 ? (weight >= 700 ? 'Bold' : 'Semi Bold') : 'Regular' }; }
  await figma.loadFontAsync(pick); loaded[key] = pick; return pick;
}
const solid = c => ({ type: 'SOLID', color: { r: c.r, g: c.g, b: c.b }, opacity: c.a });
function gradient(g) {
  const dir = g.dir; let t;
  if (dir === 'to bottom') t = [[0, 1, 0], [-1, 0, 1]]; else if (dir === 'to top') t = [[0, -1, 1], [1, 0, 0]];
  else if (dir === 'to right') t = [[1, 0, 0], [0, 1, 0]]; else if (dir === 'to left') t = [[-1, 0, 1], [0, -1, 1]]; else t = [[0, 1, 0], [-1, 0, 1]];
  return { type: 'GRADIENT_LINEAR', gradientTransform: t, gradientStops: g.stops.map(s => ({ position: Math.max(0, Math.min(1, s.pos)), color: { r: s.color.r, g: s.color.g, b: s.color.b, a: s.color.a } })) };
}
const imgCache = {};
function imageHash(h) { if (!imgCache[h]) imgCache[h] = figma.createImage(figma.base64Decode(IMAGES[h])).hash; return imgCache[h]; }
async function layer(L, parent) {
  const [x, y, w, h] = L.box;
  if (w < 0.5 || h < 0.5) return;
  let n;
  if (L.type === 'rect') {
    n = figma.createRectangle(); n.resize(w, h);
    n.fills = L.gradient ? [gradient(L.gradient)] : (L.fill ? [solid(L.fill)] : []);
    if (L.radius) n.cornerRadius = L.radius;
  } else if (L.type === 'image') {
    n = figma.createRectangle(); n.resize(w, h);
    n.fills = L.hash ? [{ type: 'IMAGE', imageHash: imageHash(L.hash), scaleMode: 'FILL' }] : [];
  } else if (L.type === 'svg') {
    n = figma.createNodeFromSvg(L.svg); if (n.width > 0) n.rescale(w / n.width);
  } else if (L.type === 'text') {
    n = figma.createText(); const f = await font(L.family, L.weight);
    n.fontName = f; n.fontSize = L.size; n.characters = L.chars;
    if (L.lineHeight) n.lineHeight = { value: L.lineHeight, unit: 'PIXELS' };
    if (L.letterSpacing) n.letterSpacing = { value: L.letterSpacing, unit: 'PIXELS' };
    if (L.upper) n.textCase = 'UPPER';
    if (L.strike) n.textDecoration = 'STRIKETHROUGH';
    n.textAlignHorizontal = L.align;
    if (L.nowrap) n.textAutoResize = 'WIDTH_AND_HEIGHT'; else { n.textAutoResize = 'HEIGHT'; n.resize(Math.max(1, w + 2), Math.max(1, h)); }
    const base = L.runs.length ? L.runs[0].color : null;
    if (base) n.fills = [solid(base)];
    for (const r of L.runs) { const e = Math.min(L.chars.length, r.end); if (r.color && e > r.start) n.setRangeFills(r.start, e, [solid(r.color)]); }
  }
  if (!n) return;
  n.name = L.name || n.name; n.x = x; n.y = y; parent.appendChild(n);
}
async function build() {
  const page = figma.createPage(); page.name = DATA.title; figma.currentPage = page;
  let y = 0, count = 0;
  for (const d of DATA.designs) {
    let x = 0, rowH = 0;
    for (const [i, F] of d.frames.entries()) {
      const fr = figma.createFrame(); fr.name = d.frames.length > 1 ? `${d.name} · ${i + 1}` : d.name;
      fr.resize(F.w, F.h); fr.clipsContent = true; fr.fills = F.bg ? [solid(F.bg)] : [];
      fr.x = x; fr.y = y; page.appendChild(fr);
      for (const L of F.layers) await layer(L, fr);
      x += F.w + 80; rowH = Math.max(rowH, F.h); count++;
    }
    y += rowH + 160;
  }
  figma.viewport.scrollAndZoomIntoView(page.children);
  return count;
}
build().then(n => figma.closePlugin(`Built ${n} frames` + (missing.size ? `. Fonts not in Figma (Inter used): ${[...missing].join(', ')}` : '.')))
       .catch(e => figma.closePlugin('Stopped: ' + e.message));
"""


def plugin_zip(title: str, designs: list[dict], images: dict, out: Path) -> Path:
    pid = "lawrank-" + re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    manifest = {"name": title, "id": pid, "api": "1.0.0", "main": "code.js", "editorType": ["figma"],
                "documentAccess": "dynamic-page", "networkAccess": {"allowedDomains": ["none"]}}
    code = PLUGIN_JS.replace("__DATA__", json.dumps({"title": title, "designs": designs}, ensure_ascii=False)).replace("__IMAGES__", json.dumps(images))
    buf = io.BytesIO()
    folder = re.sub(r"[^\w .-]+", "", title).strip()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr(f"{folder}/manifest.json", json.dumps(manifest, indent=2))
        z.writestr(f"{folder}/code.js", code)
        z.writestr(f"{folder}/HOW TO IMPORT.txt",
                   "1. Unzip this folder somewhere it will stay (e.g. Documents/Figma plugins).\n"
                   "2. In the Figma desktop app: Menu > Plugins > Development > Import plugin from manifest... and pick manifest.json here.\n"
                   "3. Open any file and run it from Plugins > Development. It adds a page with every design as editable layers.\n"
                   "Photos are image fills: right-click > Choose image to swap one. Text uses the brand's Google fonts.\n")
    write_bytes(out, buf.getvalue())
    return out
