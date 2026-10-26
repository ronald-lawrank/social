/* LawRank motion kit: shared by every motion family (HTML preview). Pure helpers + brand tokens.
   Needs BRAND (brand.json + logo data URIs, injected by motion/page.py) and ICONS/iconSvg (engine/05_icons.js). */
gsap.registerPlugin(MorphSVGPlugin, DrawSVGPlugin, SplitText, MotionPathPlugin, Physics2DPlugin);
const FAMILIES = {};

// ---------- colour + contrast (the same maths as the stills engine: WCAG relative luminance)
const hex2rgb = h => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const rgb2hex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const lum = h => { const c = hex2rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
const mix = (a, b, t) => rgb2hex(hex2rgb(a).map((v, i) => v + (hex2rgb(b)[i] - v) * t));
// darken a colour until it reaches `need` contrast against `bg` (used for button labels, small accent text)
const readable = (c, bg, need = 4.5) => { let x = c; for (let i = 0; i < 20 && contrast(x, bg) < need; i++) x = mix(x, lum(bg) > .4 ? '#000000' : '#FFFFFF', .12); return x; };

// ---------- brand tokens every family uses. A family never hard-codes a firm's colour.
const BT = (() => {
  const c = BRAND.colors, ink = c.ink, accent = c.accent, bright = c.accentBright || accent, paper = c.paper || '#F5F5F5';
  const onAccent = contrast('#FFFFFF', accent) >= 3 ? '#FFFFFF' : ink;              // large type on the accent
  const endBg = contrast('#FFFFFF', accent) >= 3 ? accent : ink;                     // end card: accent if white reads on it
  const warm = mix(paper, '#E9DFD2', .65);                                           // illustrated scenes sit on a warm paper
  return {
    ink, accent, bright, paper, warm, muted: c.muted || mix(ink, paper, .45), line: c.line || mix(ink, paper, .82),
    onAccent, endBg, endText: contrast('#FFFFFF', endBg) >= 3 ? '#FFFFFF' : ink,
    accentText: readable(accent, warm, 3),                                            // accent words in large headlines
    btnBg: '#FFFFFF', btnText: readable(accent, '#FFFFFF', 4.5),                       // CTA on the end card
    head: BRAND.fonts.head.family, body: BRAND.fonts.body.family,
    upper: BRAND.cta ? BRAND.cta.upper !== false : true, radius: BRAND.cta ? BRAND.cta.radius ?? 0 : 0,
    shape: (BRAND.mark && BRAND.mark.shape) || 'square',
    logoDark: BRAND.logoData.black, logoLight: BRAND.logoData.white,
    short: BRAND.short || BRAND.name, name: BRAND.name, site: BRAND.website,
  };
})();

// ---------- the firm's brand shape (brand.mark.shape): hex, circle, square (rounded), shield, diamond.
// Every family uses it where the McMinn proof used the hexagon: the destination, the umbrella, the end swell.
const markPath = (cx, cy, R, kind = BT.shape) => {
  const poly = (n, rot) => { let d = ''; for (let i = 0; i < n; i++) { const a = rot + i * 2 * Math.PI / n; d += (i ? 'L' : 'M') + (cx + R * Math.cos(a)).toFixed(1) + ',' + (cy + R * Math.sin(a)).toFixed(1); } return d + 'Z'; };
  if (kind === 'hex') return poly(6, -Math.PI / 2);
  if (kind === 'diamond') return poly(4, -Math.PI / 2);
  if (kind === 'circle') return `M${cx - R},${cy} A${R},${R} 0 1 1 ${cx + R},${cy} A${R},${R} 0 1 1 ${cx - R},${cy}Z`;
  if (kind === 'shield') return `M${cx},${cy - R} L${cx + R * .86},${cy - R * .6} V${cy + R * .05} C${cx + R * .86},${cy + R * .55} ${cx + R * .4},${cy + R * .85} ${cx},${cy + R} C${cx - R * .4},${cy + R * .85} ${cx - R * .86},${cy + R * .55} ${cx - R * .86},${cy + R * .05} V${cy - R * .6}Z`;
  const r = R * .82, k = R * .22; return rr({ x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, r: k });   // square
};

// ---------- geometry helpers for MorphSVG
const rr = ({ x, y, w, h, r }) => { r = Math.min(r, w / 2, h / 2); return `M${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h - r}A${r},${r} 0 0 1 ${x + w - r},${y + h}H${x + r}A${r},${r} 0 0 1 ${x},${y + h - r}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z`; };
const tailL = (b, sc = 1) => `M${b.x + 70},${b.y + b.h - 2}L${b.x + 70 - 52 * sc},${b.y + b.h + 44 * sc}L${b.x + 120},${b.y + b.h - 2}Z`;
const tailR = (b, sc = 1) => `M${b.x + b.w - 70},${b.y + b.h - 2}L${b.x + b.w - 70 + 52 * sc},${b.y + b.h + 44 * sc}L${b.x + b.w - 120},${b.y + b.h - 2}Z`;
const pinPath = (cx, by, s = 1) => `M${cx},${by}C${cx - 10 * s},${by - 30 * s} ${cx - 34 * s},${by - 44 * s} ${cx - 34 * s},${by - 70 * s}A${34 * s},${34 * s} 0 1 1 ${cx + 34 * s},${by - 70 * s}C${cx + 34 * s},${by - 44 * s} ${cx + 10 * s},${by - 30 * s} ${cx},${by}Z`;
const seeded = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
// "**word**" in on-screen copy marks the one accent word or phrase
const accentize = (s, cls = 'o') => esc(s).replace(/\*\*(.+?)\*\*/g, `<span class="${cls}">$1</span>`);
const icon = (name, size, color, accentColor) => iconSvg(name, size, color, null, false, accentColor || color);

// ---------- timeline helpers
const MK = {
  rel(st) { return el => { const k = st.getBoundingClientRect().width / 1080, a = el.getBoundingClientRect(), s = st.getBoundingClientRect(); return { x: (a.left - s.left) / k, y: (a.top - s.top) / k, w: a.width / k, h: a.height / k }; }; },
  T(T) { const L = Object.fromEntries(T.lines.map(l => [l.id, l])); return { L, S: (lid, i) => L[lid].sentences[i], W: (lid, w) => (L[lid].words.find(x => x.w.toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(w.toLowerCase())) || L[lid].words[0]).t }; },
  lines(sel) { return SplitText.create(sel, { type: 'lines', mask: 'lines' }).lines; },
  linesIn(tl, lines, t, st = .07) { return tl.to(lines, { yPercent: 0, duration: .5, ease: 'lr.out', stagger: st }, t); },
  linesOut(tl, lines, t) { return tl.to(lines, { yPercent: -105, duration: .2, ease: 'lr.in', stagger: .02 }, t); },
  strip(r, edge = 'bottom', n = 8) { return edge === 'bottom' ? { x: r.x, y: r.y + r.h - n, w: r.w, h: n, r: Math.min(4, r.r ?? 4) } : { x: r.x + r.w - n, y: r.y, w: n, h: r.h, r: 4 }; },
  // masked headline: hidden until its words are on screen (keeps QA honest: no invisible text boxes overlapping)
  head(tl, sel, t, t2, stg = .07) { const l = MK.lines(sel); tl.set(l, { yPercent: 105 }, 0).set(sel, { autoAlpha: 0 }, 0).set(sel, { autoAlpha: 1 }, t - .01); MK.linesIn(tl, l, t, stg);
    if (t2) { MK.linesOut(tl, l, t2); tl.set(sel, { autoAlpha: 0 }, t2 + .32); } return l; },
};

// ---------- shared stage pieces
// End card used by every family: logo, headline, CTA button, site, disclaimer. Placed with absolute coordinates.
const endCard = (S, { top = 600, bg = BT.endBg } = {}) => {
  const light = contrast('#FFFFFF', bg) >= 3, logo = light ? BT.logoLight : BT.logoDark, tc = light ? '#FFFFFF' : BT.ink;
  const btnBg = light ? '#FFFFFF' : BT.accent, btnTx = light ? readable(BT.accent, '#FFFFFF', 4.5) : readable('#FFFFFF', BT.accent, 4.5);
  const cta = BT.upper ? S.cta.toUpperCase() : S.cta;
  return `<img id="eLogo" class="m-logo h" src="${logo}" alt="${esc(BT.name)}" style="top:${top}px">
  <div id="eHead" class="m-head" data-qa="text" style="top:${top + 190}px;color:${tc};font-size:${S.end.replace(/\*\*/g, '').length > 18 ? 72 : 86}px">${accentize(S.end, 'oe')}</div>
  <div id="eBtn" class="m-btn h" data-qa="text" style="top:${top + 410}px;background:${btnBg};color:${btnTx};border-radius:${BT.radius ? 62 : 0}px">${esc(cta)}</div>
  <div id="eSite" class="m-site h" data-qa="text" style="top:${top + 594}px;color:${tc}">${esc(S.site || BT.site)}</div>
  <div id="disc" class="m-disc h" data-qa="text" style="color:${tc}">${esc(S.disclaimer || 'Attorney advertising.')}</div>`;
};
const endCardIn = (tl, t, tFree) => {
  M.enter(tl, '#eLogo', t, { d: .35 }); MK.head(tl, '#eHead', t + .15);
  M.enter(tl, '#eBtn', tFree, { y: 20, d: .35 }); M.enter(tl, '#eSite', tFree + .12, { d: .3 }); M.fadeIn(tl, '#disc', tFree + .2, .3);
};
