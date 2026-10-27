/* LawRank motion looks: the visual language a composed video is drawn in. A scene never picks colours itself; it asks
   the look (LK), so every scene works in every look and in every firm's colours.

     thread      clean light world, line art, one accent dot that travels through the whole piece (Adobe CMO feel)
     flat        bold flat illustration on brand-colour fields, chunky shapes, no outlines (Skrill feel)
     cards       warm soft gradient, floating white UI cards with deep shadows, crisp UI type (product-video feel)
     silhouette  off-white paper collage, black cut-out silhouettes, accent type (Mad Men titles feel)

   Needs kit.js (BT, mix, contrast, readable). */
const LOOKS = {
  thread() {
    const bg = mix(BT.paper, '#F2F2F0', .7);
    return { name: 'thread', bg, bgCss: bg, decor: '', ink: BT.ink, sub: mix(BT.ink, bg, .38), accent: BT.accent,
      accentText: readable(BT.accent, bg, 3), surface: '#FFFFFF', surfaceInk: BT.ink, edge: '1px solid ' + mix(BT.ink, bg, .9),
      shadow: '0 22px 50px rgba(20,24,28,.10)', radius: 26, stroke: 6, line: mix(BT.ink, bg, .3), soft: mix(BT.ink, bg, .86),
      fillA: '#FFFFFF', fillB: mix(BT.ink, bg, .9), fillC: mix(BT.ink, bg, .75), headWeight: 700, headCase: 'none',
      people: mix(BT.ink, bg, .35), transition: 'thread', thread: true };
  },
  flat() {
    const dark = contrast('#FFFFFF', BT.accent) >= 3, bg = dark ? BT.accent : mix(BT.accent, '#FFFFFF', .72);
    const ink = dark ? '#FFFFFF' : BT.ink, deep = mix(BT.accent, BT.ink, .45);
    return { name: 'flat', bg, bgCss: bg, decor: `<div class="lk-dots" style="color:${mix(bg, ink, .12)}"></div>`, ink,
      sub: mix(ink, bg, .25), accent: dark ? '#FFFFFF' : deep, accentText: dark ? readable(mix(BT.accent, '#FFFFFF', .75), bg, 3) : readable(deep, bg, 3),
      surface: '#FFFFFF', surfaceInk: BT.ink, edge: 'none', shadow: '0 14px 0 ' + mix(bg, '#000000', .25),
      radius: 22, stroke: 0, line: ink, soft: mix(bg, ink, .14), fillA: '#FFFFFF', fillB: deep, fillC: mix(bg, '#FFFFFF', .45),
      headWeight: 800, headCase: 'none', people: deep, transition: 'wipe', thread: false };
  },
  cards() {
    const a = mix(BT.accent, '#FFFFFF', .86), b = mix(mix(BT.accent, '#FFB25B', .35), '#FFFFFF', .55);
    const bg = mix(a, b, .5);
    return { name: 'cards', bg, bgCss: `linear-gradient(165deg, ${a} 0%, ${b} 100%)`, decor: '<div class="lk-glow"></div>',
      ink: BT.ink, sub: mix(BT.ink, bg, .35), accent: BT.accent, accentText: readable(BT.accent, bg, 3), surface: '#FFFFFF', surfaceInk: BT.ink,
      edge: '1px solid rgba(0,0,0,.05)', shadow: '0 40px 90px rgba(30,20,10,.20), 0 8px 18px rgba(30,20,10,.08)', radius: 36, stroke: 5,
      line: mix(BT.ink, '#FFFFFF', .35), soft: mix(BT.ink, '#FFFFFF', .9), fillA: '#FFFFFF', fillB: mix(BT.accent, '#FFFFFF', .85),
      fillC: mix(BT.ink, '#FFFFFF', .8), headWeight: 700, headCase: 'none', people: mix(BT.ink, bg, .3), transition: 'stack', thread: false };
  },
  silhouette() {
    const bg = '#ECEAE4', ink = lum(BT.ink) < .03 ? BT.ink : mix(BT.ink, '#111111', .7);
    return { name: 'silhouette', bg, bgCss: bg, decor: `<div class="lk-blinds"></div><div class="lk-tone" style="color:${mix(bg, ink, .1)}"></div>`,
      ink, sub: mix(ink, bg, .3), accent: readable(BT.accent, bg, 3), accentText: readable(BT.accent, bg, 3), surface: '#F8F6F1', surfaceInk: ink,
      edge: 'none', shadow: '14px 16px 0 rgba(0,0,0,.14)', radius: 0, stroke: 0, line: ink, soft: mix(bg, ink, .12),
      fillA: ink, fillB: mix(bg, ink, .22), fillC: mix(bg, ink, .1), headWeight: 800, headCase: 'upper', people: ink, transition: 'cut', thread: false };
  },
};
const LOOK_NAMES = Object.keys(LOOKS);

// Helpers scenes build with. Every visual a scene draws goes through these, so it follows the look.
const UI = {
  // a surface card (white UI card, paper cut-out, flat panel) at absolute stage coordinates
  card(LK, { x, y, w, h, id = '', cls = '', style = '', inner = '', tilt = 0 }) {
    return `<div ${id ? `id="${id}"` : ''} class="k-card ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${LK.surface};color:${LK.surfaceInk};
      border-radius:${LK.radius}px;box-shadow:${LK.shadow};border:${LK.edge};transform:rotate(${tilt}deg);${style}">${inner}</div>`;
  },
  // a headline block in the look's type; data-qa so QA checks it. **word** = the accent phrase.
  head(LK, { id, text, x = 80, y = 330, w = 920, size = 84, align = 'left', color, accent }) {
    const up = LK.headCase === 'upper';
    return `<div id="${id}" class="k-hl" data-qa="text" style="left:${x}px;top:${y}px;width:${w}px;font-size:${size}px;text-align:${align};
      color:${color || LK.ink};font-weight:${LK.headWeight};${up ? 'text-transform:uppercase;letter-spacing:.01em;' : ''}--acc:${accent || LK.accentText}">${accentize(text, 'ka')}</div>`;
  },
  // small text (labels, captions, UI copy)
  text(LK, { id = '', text, x, y, w, size = 40, weight = 600, color, align = 'left', cls = '', upper = false, font = 'body' }) {
    return `<div ${id ? `id="${id}"` : ''} class="k-tx ${cls}" data-qa="text" style="left:${x}px;top:${y}px;width:${w}px;font-size:${size}px;font-weight:${weight};
      text-align:${align};color:${color || LK.ink};font-family:var(--${font});${upper ? 'text-transform:uppercase;letter-spacing:.08em;' : ''}">${accentize(text, 'ka')}</div>`;
  },
  icon(LK, name, size, color, accentColor) { return icon(name, size, color || LK.ink, accentColor || LK.accent); },
};
