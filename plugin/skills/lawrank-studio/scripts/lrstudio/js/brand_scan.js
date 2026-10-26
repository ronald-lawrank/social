// Computed brand styles of the page: ranked colours, heading/body/button styles, CSS colour/font variables,
// logo candidates, phones. Run by crawl.py in headless Chromium. Only trust a kit variable if the colour also
// ranks in `top` (Elementor ships default kit colours).
(() => {
  const cnt = {};
  document.querySelectorAll("body *").forEach(e => {
    if (e.offsetWidth * e.offsetHeight < 50) return;
    const s = getComputedStyle(e);
    [s.color, s.backgroundColor, s.borderTopColor].forEach((c, i) => { if (c && c !== "rgba(0, 0, 0, 0)" && !(i === 2 && s.borderTopWidth === "0px")) cnt[c] = (cnt[c] || 0) + 1; });
  });
  const hex = c => { const m = c.match(/\d+/g); return m ? "#" + m.slice(0, 3).map(x => (+x).toString(16).padStart(2, "0")).join("").toUpperCase() : c; };
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([c, n]) => hex(c) + " x" + n);
  const sty = sel => { const e = document.querySelector(sel); if (!e) return null; const s = getComputedStyle(e);
    return [s.fontFamily.split(",")[0].replace(/["']/g, ""), s.fontWeight, s.fontSize, s.textTransform, s.letterSpacing, hex(s.color), hex(s.backgroundColor), s.borderRadius].join(" | "); };
  const vars = [];
  for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) if (r.style) for (const p of r.style) if (p.startsWith("--") && /color|font|typo/i.test(p)) vars.push(p.replace("--e-global-", "") + ":" + r.style.getPropertyValue(p).trim().slice(0, 40)); } catch (e) {} }
  const strip = u => (u || "").split("?")[0].replace(location.origin, "");
  const logos = [...document.querySelectorAll("header img, header svg, [class*=logo] img, img[alt*=logo i], img[src*=logo i]")]
    .map(e => e.tagName === "IMG" ? strip(e.currentSrc || e.src) + ` (${e.naturalWidth}x${e.naturalHeight})` : "inline <svg> " + Math.round(e.getBoundingClientRect().width) + "w").slice(0, 8);
  const phones = [...new Set((document.body.innerText.match(/\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}/g) || []))].slice(0, 6);
  return JSON.stringify({ cms: document.querySelector("meta[name=generator]")?.content || "", top,
    h1: sty("h1"), h2: sty("h2"), body: sty("p"), button: sty("a.button, .btn, button[type=submit], .elementor-button, a[class*=btn]"),
    vars: [...new Set(vars)].slice(0, 24), logos, phones });
})();
