// Brand glyphs: a two-tone line icon set drawn on a 24-unit grid. Pure: shared by the plugin and the preview harness.
//
//   b  = base strokes (the icon's colour)       a  = accent strokes (detail colour: the brand accent)
//   af = accent fills (dots, wheels, pans)       bf = base fills
//
// Tuned per brand, so the same set looks native to each firm:
//   line ends   square buttons (brand.cta.radius 0) -> square caps + mitred corners; rounded brands -> round
//   weight      follows the headline font weight (Regular 1.5 ... Black 2.3 units), or brand.icons.weight
//   detail      the accent colour comes from the rules pass (engine/08_rules.js): the brightest brand accent
//               that reads on the background; a one-colour icon is used where no accent reads.
// Large icons keep a sensible stroke: the stroke is capped in pixels so a 300 px icon doesn't turn into a slab.
// RULE: an icon never stands alone in a panel or tile. It sits next to copy, or inside a lockup (iconLockup /
// heroPanel in 28_directions.js) with a word, number or statement that gives it a job.
const ICONS = {
  check: { b: ["M5 12.5 L10 17.5 L19 6.5"] },
  arrow: { b: ["M4 12 H19", "M13 6 L19 12 L13 18"] },
  bookmark: { b: ["M6 3 H18 V21 L12 16.5 L6 21 Z"] },
  search: { b: ["M10.5 4 A6.5 6.5 0 1 1 10.49 4 Z"], a: ["M15.4 15.4 L20.5 20.5"] },
  chat: { b: ["M3.5 5 H20.5 V16 H10.5 L6 19.8 V16 H3.5 Z"], af: ["c 8.4 10.5 1.25", "c 12 10.5 1.25", "c 15.6 10.5 1.25"] },
  doc: { b: ["M6 3 H14 L19 8 V21 H6 Z", "M14 3 V8 H19"], a: ["M8.8 12.5 H16.2", "M8.8 16 H13.6"] },
  scale: { b: ["M12 5.4 V19.6", "M7.5 20 H16.5", "M4.5 7.5 H19.5", "M4.5 7.5 L2.2 13.2", "M4.5 7.5 L6.8 13.2", "M19.5 7.5 L17.2 13.2", "M19.5 7.5 L21.8 13.2"],
           af: ["M2 13.2 Q4.5 17.2 7 13.2 Z", "M17 13.2 Q19.5 17.2 22 13.2 Z", "c 12 4.1 1.5"] },
  gavel: { b: ["M13.4 3.4 L20.6 10.6", "M9.6 7.2 L16.8 14.4", "M13.4 3.4 L9.6 7.2", "M20.6 10.6 L16.8 14.4", "M3 21 H12"], a: ["M12 11.8 L4.2 19.6"] },
  car: { b: ["M3 16.4 V13 L5.3 8.3 C5.7 7.6 6.4 7.2 7.2 7.2 H16.8 C17.6 7.2 18.3 7.6 18.7 8.3 L21 13 V16.4 Z", "M4.6 12.4 H19.4"], af: ["c 7.4 16.8 2", "c 16.6 16.8 2"] },
  truck: { b: ["M2.5 6 H14 V16.4 H2.5 Z", "M14 9.6 H18.2 L21.5 13 V16.4 H14"], af: ["c 6.6 17.4 2", "c 17.4 17.4 2"] },
  walk: { b: ["M12.4 8.2 L10.5 13.8 L7.8 20.6", "M10.5 13.8 L14 16.6 L15 20.8", "M11.8 9.4 L8.4 12", "M12.6 9.6 L16.4 11.8"], af: ["c 13.3 4.6 2"] },
  users: { b: ["M9 4.8 A3.3 3.3 0 1 1 8.99 4.8 Z", "M3 20 C3 15.9 5.7 13.6 9 13.6 C12.3 13.6 15 15.9 15 20"],
           a: ["M15.4 5.2 A3 3 0 1 1 15.8 11.2", "M17.4 13.9 C19.7 14.6 21 16.7 21 19.6"] },
  home: { b: ["M3.5 11 L12 3.8 L20.5 11", "M5.8 9.4 V20 H18.2 V9.4"], a: ["M10 20 V14.6 H14 V20"] },
  shield: { b: ["M12 2.8 L19.5 5.6 V11.2 C19.5 15.8 16.4 19.4 12 21.2 C7.6 19.4 4.5 15.8 4.5 11.2 V5.6 Z"], a: ["M8.6 12 L11 14.4 L15.6 9.6"] },
  clock: { b: ["M12 3 A9 9 0 1 1 11.99 3 Z", "M12 4 V5.6", "M20 12 H18.4", "M12 20 V18.4", "M4 12 H5.6"], a: ["M12 7.6 V12 L15.4 14.1"], af: ["c 12 12 1.35"] },
  globe: { b: ["M12 3 A9 9 0 1 1 11.99 3 Z", "M12 3 C8.4 6.4 8.4 17.6 12 21", "M12 3 C15.6 6.4 15.6 17.6 12 21"], a: ["M4.2 8.6 H19.8", "M4.2 15.4 H19.8"] },
  bus: { b: ["M5 3.5 H19 C19.6 3.5 20 3.9 20 4.5 V17 H4 V4.5 C4 3.9 4.4 3.5 5 3.5 Z", "M4 11 H20"], a: ["M12 3.5 V11"], af: ["c 7.6 18.7 1.7", "c 16.4 18.7 1.7"] },
  phone: { b: ["M6.6 3.2 L9.4 3.6 L10.8 7.6 L8.9 9.1 C10 11.6 12.4 14 14.9 15.1 L16.4 13.2 L20.4 14.6 L20.8 17.4 C20.8 19.2 19.2 20.8 17.4 20.8 C9.8 20.4 3.6 14.2 3.2 6.6 C3.2 4.8 4.8 3.2 6.6 3.2 Z"],
           a: ["M14.4 3.4 C17.5 4.1 19.9 6.5 20.6 9.6", "M14 6.9 C15.6 7.4 16.6 8.4 17.1 10"] },
  star: { bf: ["M12 2.5 L14.9 8.6 L21.5 9.3 L16.6 13.8 L17.9 20.4 L12 17.1 L6.1 20.4 L7.4 13.8 L2.5 9.3 L9.1 8.6 Z"] },
  heart: { b: ["M12 20 C12 20 3.5 14.6 3.5 8.9 C3.5 6.2 5.6 4.3 8 4.3 C9.7 4.3 11.2 5.3 12 6.6 C12.8 5.3 14.3 4.3 16 4.3 C18.4 4.3 20.5 6.2 20.5 8.9 C20.5 14.6 12 20 12 20 Z"] },
  map: { b: ["M12 21.2 C12 21.2 5.2 14.6 5.2 9.8 C5.2 6 8.2 3 12 3 C15.8 3 18.8 6 18.8 9.8 C18.8 14.6 12 21.2 12 21.2 Z"], af: ["c 12 9.8 2.6"] },
  briefcase: { b: ["M3 8 H21 V19.5 H3 Z", "M9 8 V5.2 H15 V8"], a: ["M3 13 H10.4", "M13.6 13 H21"], af: ["M10.4 11.6 H13.6 V14.4 H10.4 Z"] },
  dollar: { b: ["M16.5 7.2 C15.6 6 14.2 5.5 12 5.5 C9.2 5.5 7.6 6.9 7.6 8.8 C7.6 13 16.6 10.6 16.6 15.4 C16.6 17.3 14.8 18.5 12 18.5 C9.6 18.5 8.1 17.8 7.2 16.6"], a: ["M12 3 V5.5", "M12 18.5 V21"] },
  hospital: { b: ["M4 4 H20 V20 H4 Z"], a: ["M12 8 V16", "M8 12 H16"] },
  trophy: { b: ["M7 4 H17 V9 C17 11.8 14.8 14 12 14 C9.2 14 7 11.8 7 9 Z", "M12 14 V18", "M8 20.5 H16"], a: ["M7 5.6 H4 V7.2 C4 9.2 5.3 10.5 7.3 10.7", "M17 5.6 H20 V7.2 C20 9.2 18.7 10.5 16.7 10.7"] },
};
// Older names still resolve.
Object.assign(ICONS, { handshake: ICONS.users, cross: ICONS.hospital, location: ICONS.map, people: ICONS.users, law: ICONS.scale, time: ICONS.clock });
const ICON_SHAPES = ICONS;

const _iconB = (typeof BRAND !== "undefined" ? BRAND : {});
const ICON_STYLE = (() => {
  const s = _iconB.icons || {}, sq = _iconB.cta && _iconB.cta.radius === 0;
  const wmap = { Thin: 1.2, Light: 1.35, Regular: 1.5, Medium: 1.6, SemiBold: 1.75, "Semi Bold": 1.75, Bold: 1.9, ExtraBold: 2.1, Black: 2.3 };
  const head = (_iconB.fonts && _iconB.fonts.head && _iconB.fonts.head.bold) || "Bold";
  return { cap: s.cap || (sq ? "square" : "round"), join: s.join || (sq ? "miter" : "round"), weight: s.weight || wmap[head] || 1.8 };
})();
function _iconEl(d, paint) {
  if (d.startsWith("c ")) { const [cx, cy, r] = d.slice(2).split(" "); return `<circle cx="${cx}" cy="${cy}" r="${r}" ${paint}/>`; }
  return `<path d="${d}" ${paint}/>`;
}
// sw: optional stroke weight in grid units (older callers pass 1.1-2.6); the brand weight is used when omitted,
// and thin hairline requests are lifted to at least 85% of the brand weight so big icons never look spindly.
function iconSvg(name, size, hex, sw, filled, hex2) {
  const ic = ICONS[name] || ICONS.check, acc = hex2 || hex;
  let w = sw ? Math.max(sw, ICON_STYLE.weight * 0.85) : ICON_STYLE.weight;
  const px = w * size / 24, maxPx = 3 + size * 0.04;                    // cap the drawn stroke in pixels
  if (px > maxPx) w = maxPx * 24 / size;
  const line = (c) => `fill="none" stroke="${c}" stroke-width="${w.toFixed(2)}" stroke-linecap="${ICON_STYLE.cap}" stroke-linejoin="${ICON_STYLE.join}" stroke-miterlimit="4"`;
  const fillP = (c) => `fill="${c}" stroke="none"`;
  let parts = "";
  if (filled) parts = [...(ic.b || []), ...(ic.bf || []), ...(ic.a || []), ...(ic.af || [])].map(d => _iconEl(d, fillP(hex))).join("");
  else parts = (ic.b || []).map(d => _iconEl(d, line(hex))).join("") + (ic.bf || []).map(d => _iconEl(d, fillP(hex))).join("")
    + (ic.a || []).map(d => _iconEl(d, line(acc))).join("") + (ic.af || []).map(d => _iconEl(d, fillP(acc))).join("");
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${parts}</svg>`;
}
