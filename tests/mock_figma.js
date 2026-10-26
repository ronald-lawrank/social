// A stand-in for the Figma plugin API that throws where real Figma throws, for testing generated plugins.
//   node tests/mock_figma.js <code.js>   -> prints a JSON summary of what was built (or the error)
// Enforced: fonts must be loaded before text is edited; sizes >= 0.01; paints well-formed (colours 0-1);
// gradient transforms 2x3; image fills need a known hash; SVG must be one <svg> element; positions finite.
const fs = require('fs'), vm = require('vm');
const code = fs.readFileSync(process.argv[2], 'utf8');
const AVAILABLE = [
  ['Montserrat', ['Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold', 'Black']], ['Lato', ['Regular', 'Bold', 'Black']],
  ['Inter', ['Regular', 'Medium', 'Semi Bold', 'Bold']], ['Playfair Display', ['Regular', 'SemiBold', 'Bold']],
  ['Source Sans 3', ['Regular', 'SemiBold', 'Bold']],
].flatMap(([family, styles]) => styles.map(style => ({ fontName: { family, style } })));
const loaded = new Set(), images = new Set();
let ids = 0, closed = null;
const num = (v, what) => { if (!Number.isFinite(v)) throw new Error(`${what} must be a finite number (got ${v})`); };
const col = (c, a) => { for (const k of ['r', 'g', 'b']) if (!(c[k] >= 0 && c[k] <= 1)) throw new Error(`colour ${k}=${c[k]} must be 0-1`); if (a && !(c.a >= 0 && c.a <= 1)) throw new Error('alpha must be 0-1'); };
function checkPaints(p) {
  if (!Array.isArray(p)) throw new Error('fills must be an array');
  for (const f of p) {
    if (f.type === 'SOLID') { col(f.color); if (f.opacity !== undefined && !(f.opacity >= 0 && f.opacity <= 1)) throw new Error('opacity must be 0-1'); }
    else if (f.type === 'GRADIENT_LINEAR') { const t = f.gradientTransform; if (!(t.length === 2 && t.every(r => r.length === 3 && r.every(Number.isFinite)))) throw new Error('gradientTransform must be 2x3'); if (!f.gradientStops.length) throw new Error('no gradient stops'); f.gradientStops.forEach(s => { col(s.color, true); if (!(s.position >= 0 && s.position <= 1)) throw new Error('stop position 0-1'); }); }
    else if (f.type === 'IMAGE') { if (!images.has(f.imageHash)) throw new Error('image fill with an unknown hash'); }
    else throw new Error('unknown paint type ' + f.type);
  }
}
class Node {
  constructor(type) { this.type = type; this.id = '1:' + (++ids); this.children = []; this.parent = null; this.name = type; this._fills = []; this.width = 100; this.height = 100; this._x = 0; this._y = 0; }
  set x(v) { num(v, 'x'); this._x = v; } get x() { return this._x; }
  set y(v) { num(v, 'y'); this._y = v; } get y() { return this._y; }
  set fills(v) { checkPaints(v); this._fills = v; } get fills() { return this._fills; }
  set cornerRadius(v) { num(v, 'cornerRadius'); if (v < 0) throw new Error('cornerRadius >= 0'); this._r = v; }
  appendChild(c) { if (c.parent) c.parent.children = c.parent.children.filter(x => x !== c); c.parent = this; this.children.push(c); }
  resize(w, h) { if (!(w >= 0.01 && h >= 0.01)) throw new Error(`resize(${w}, ${h}): sizes must be >= 0.01`); this.width = w; this.height = h; }
  rescale(s) { if (!(s > 0) || !Number.isFinite(s)) throw new Error('rescale needs a positive scale'); this.width *= s; this.height *= s; }
}
class Text extends Node {
  constructor() { super('TEXT'); this._font = null; this._chars = ''; }
  _need() { if (!this._font || !loaded.has(this._font.family + '|' + this._font.style)) throw new Error(`Cannot write to node with unloaded font "${this._font ? this._font.family + ' ' + this._font.style : 'Inter Regular'}"`); }
  set fontName(f) { if (!loaded.has(f.family + '|' + f.style)) throw new Error(`unloaded font ${f.family} ${f.style}`); this._font = f; } get fontName() { return this._font; }
  set characters(v) { this._need(); if (typeof v !== 'string') throw new Error('characters must be a string'); this._chars = v; } get characters() { return this._chars; }
  set fontSize(v) { this._need(); num(v, 'fontSize'); if (v < 1) throw new Error('fontSize >= 1'); this._fs = v; } get fontSize() { return this._fs; }
  set lineHeight(v) { this._need(); num(v.value, 'lineHeight'); this._lh = v; }
  set letterSpacing(v) { this._need(); num(v.value, 'letterSpacing'); this._ls = v; }
  set textCase(v) { this._need(); if (!['ORIGINAL', 'UPPER', 'LOWER', 'TITLE'].includes(v)) throw new Error('bad textCase'); }
  set textDecoration(v) { this._need(); if (!['NONE', 'UNDERLINE', 'STRIKETHROUGH'].includes(v)) throw new Error('bad textDecoration'); }
  set textAlignHorizontal(v) { if (!['LEFT', 'CENTER', 'RIGHT', 'JUSTIFIED'].includes(v)) throw new Error('bad align'); }
  set textAutoResize(v) { if (!['NONE', 'WIDTH_AND_HEIGHT', 'HEIGHT', 'TRUNCATE'].includes(v)) throw new Error('bad autoresize'); }
  setRangeFills(s, e, p) { this._need(); if (!(s >= 0 && e <= this._chars.length && s < e)) throw new Error(`setRangeFills(${s}, ${e}) out of range for ${this._chars.length} characters`); checkPaints(p); }
}
const pages = [];
const figma = {
  createPage() { const p = new Node('PAGE'); pages.push(p); return p; },
  set currentPage(p) { this._cp = p; }, get currentPage() { return this._cp; },
  createFrame: () => new Node('FRAME'), createRectangle: () => new Node('RECTANGLE'), createText: () => new Text(),
  createNodeFromSvg(svg) { const s = svg.trim(); if (!/^<svg[\s>][\s\S]*<\/svg>$/.test(s)) throw new Error('createNodeFromSvg: not an SVG element'); if (/<script/i.test(s)) throw new Error('script in SVG'); const n = new Node('FRAME'); n.name = 'svg'; return n; },
  createImage(bytes) { if (!bytes || !bytes.length) throw new Error('empty image'); const h = 'img' + bytes.length + ':' + images.size; images.add(h); return { hash: h }; },
  base64Decode: s => Buffer.from(s, 'base64'),
  listAvailableFontsAsync: async () => AVAILABLE,
  loadFontAsync: async f => { if (!AVAILABLE.some(a => a.fontName.family === f.family && a.fontName.style === f.style)) throw new Error(`font ${f.family} ${f.style} isn't available`); loaded.add(f.family + '|' + f.style); },
  viewport: { scrollAndZoomIntoView() {} },
  closePlugin(msg) { closed = msg || ''; },
};
const ctx = vm.createContext({ figma, console, Buffer, Uint8Array, JSON, Math, Object, Array, String, Set, Number, Promise, Error, Map });
vm.runInContext(code, ctx);
const wait = () => new Promise(r => setTimeout(r, 20));
(async () => {
  for (let i = 0; i < 600 && closed === null; i++) await wait();
  const all = []; const walk = n => n.children.forEach(c => { all.push(c); walk(c); }); pages.forEach(walk);
  const count = t => all.filter(n => n.type === t).length;
  console.log(JSON.stringify({ closed, pages: pages.length, frames: pages.reduce((a, p) => a + p.children.length, 0),
    text: count('TEXT'), rects: count('RECTANGLE'), svgs: all.filter(n => n.name === 'svg' || n.name === 'Logo' || n.name === 'Icon').length,
    images: images.size, ok: closed !== null && closed.startsWith('Built') }));
})();
