"""Motion QA on the real page, frame by frame (Playwright):
  people   nothing over a face or upper body, no face cropped (qa/qa.js; families with photos)
  text     no readable text over other text; nothing runs off the frame
  contrast every piece of text against what is actually behind it (screenshot every 0.2s): 4.5:1 small, 3:1 large
  hold     the end card holds still >= 2.5s
Returns {issues: [...], low_contrast: [...], frames, cta_hold}."""
import asyncio, io, numpy as np
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright
HERE = Path(__file__).resolve().parent
EDGE = '''(() => { const P = PLAYERS[0], st = P.stage, sr = st.getBoundingClientRect(), out = [];
  const effO = el => { let o = 1; for (let e = el; e && e !== st.parentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return 0; o *= +cs.opacity; } return o; };
  for (let f = 0; f <= P.end * 15; f++) { const t = f / 15; P.show(t);
    st.querySelectorAll('[data-qa=text]').forEach(e => { const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) { const n = w.currentNode, p = n.parentElement; if (!n.textContent.trim() || effO(p) < .6) continue;
        const rg = document.createRange(); rg.selectNodeContents(n);
        for (const q of rg.getClientRects()) if (q.right > sr.right + 1 || q.left < sr.left - 1) { out.push([+t.toFixed(2), n.textContent.trim().slice(0, 30)]); break; } } }); }
  P.show(0); return out; })()'''
CONTRAST = '''(t) => { const P = PLAYERS[0], st = P.stage; P.show(t); const out = [];
  const effO = el => { let o = 1; for (let e = el; e && e !== st.parentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return 0; o *= +cs.opacity; } return o; };
  const w = document.createTreeWalker(st, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) { const n = w.currentNode, p = n.parentElement; if (!n.textContent.trim() || effO(p) < .97) continue;
    const rg = document.createRange(); rg.selectNodeContents(n); const cs = getComputedStyle(p);
    for (const q of (p instanceof SVGElement ? [p.getBoundingClientRect()] : rg.getClientRects())) if (q.width > 4 && q.height > 4) out.push({ text: n.textContent.trim().slice(0, 40), x: q.left, y: q.top, w: q.width, h: q.height, color: (p instanceof SVGElement ? cs.fill : cs.color), size: (p instanceof SVGElement ? q.height * .75 : parseFloat(cs.fontSize)), weight: +cs.fontWeight }); }
  const r = st.getBoundingClientRect(); return { items: out, stage: [r.left, r.top, r.width, r.height], k: r.width / 1080 }; }'''
def lum(c):
    c = np.array(c[:3]) / 255; c = np.where(c <= .03928, c / 12.92, ((c + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]
def ratio(a, b): la, lb = sorted([lum(a), lum(b)], reverse=True); return (la + .05) / (lb + .05)

async def _run(html):
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1300, 'height': 1300})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(Path(html).resolve().as_uri()); await pg.wait_for_timeout(1500)
        await pg.evaluate("document.querySelector('.phone').scrollIntoView()")
        await pg.add_script_tag(path=str(HERE / 'qa' / 'qa.js'))
        await pg.evaluate("window.PHOTOS = window.PHOTOS || {}")
        # the picture itself must stay visible all the way through (a stray selector can collapse the whole player)
        hidden = await pg.evaluate('''(() => { const P = PLAYERS[0], bad = []; for (let t = 0; t <= P.end; t += .5) { P.show(t);
          const r = P.stage.getBoundingClientRect(); if (r.width < 100 || r.height < 100) bad.push(+t.toFixed(1)); } P.show(0); return bad; })()''')
        r = await pg.evaluate('QA(0, 30)'); edge = await pg.evaluate(EDGE)
        end = await pg.evaluate('PLAYERS[0].end'); bad = {}; t = 0.0
        while t <= end:
            d = await pg.evaluate(CONTRAST, t); img = np.array(Image.open(io.BytesIO(await pg.screenshot())).convert('RGB')); H, Wd = img.shape[:2]
            sx, sy, sw, sh = d['stage']
            for it in d['items']:
                cx, cy = it['x'] + it['w'] / 2, it['y'] + it['h'] / 2
                if not (sx <= cx <= sx + sw and sy <= cy <= sy + sh): continue
                col = [int(float(v)) for v in it['color'][it['color'].find('(') + 1:-1].split(',')[:3]]
                x0, y0, x1, y1 = int(it['x']), int(it['y']), int(it['x'] + it['w']), int(it['y'] + it['h'])
                inner = img[max(0, y0):y1, max(0, x0):x1].reshape(-1, 3)
                if len(inner) < 20: continue
                a, b_, c_, d_ = max(0, y0 - 4), min(H, y1 + 4), max(0, x0 - 4), min(Wd, x1 + 4)
                ring = np.concatenate([img[a:max(0, y0 - 1), c_:d_].reshape(-1, 3), img[min(H, y1 + 1):b_, c_:d_].reshape(-1, 3), img[a:b_, c_:max(0, x0 - 1)].reshape(-1, 3), img[a:b_, min(Wd, x1 + 1):d_].reshape(-1, 3)])
                patch = np.concatenate([ring, ring, inner]); q = (patch // 8) * 8; far = q[np.abs(q.astype(int) - col).sum(1) > 60]
                if len(far) < 10: continue
                vals, cnt = np.unique(far, axis=0, return_counts=True); bg = vals[cnt.argmax()] + 4
                large = (it['size'] / d['k'] >= 40) or (it['size'] / d['k'] >= 28 and it['weight'] >= 700)
                rr = ratio(col, bg)
                if rr < (3.0 if large else 4.5): bad.setdefault(it['text'], []).append((round(t, 2), round(rr, 2)))
            t += .2
        await b.close()
    def streak(v):
        best = run = 1
        for x, y in zip(v, v[1:]): run = run + 1 if y[0] - x[0] < .21 else 1; best = max(best, run)
        return best
    low = [{'text': k, 't0': v[0][0], 't1': v[-1][0], 'ratio': min(x[1] for x in v)} for k, v in bad.items() if streak(v) >= 3]
    issues = [f"{i['rule']}: {i['detail']} ({i['t0']}-{i['t1']}s)" for i in r['issues']] + [f'off-frame: "{e[1]}" at {e[0]}s' for e in edge[:5]] + [f'page error: {e}' for e in errs] + ([f'stage invisible at {hidden[:5]}s (a page element was animated by a family selector)'] if hidden else [])
    return {'frames': r['frames'], 'cta_hold': r['ctaHold'], 'issues': issues, 'low_contrast': low}

def run_qa(html): return asyncio.run(_run(html))
