"""Read a firm's website in headless Chromium: computed brand styles, page text, navigation, JSON-LD, logos and
photos (with alt text and nearby captions, so photos can be matched to attorneys).

Safety: only http(s); every navigation, sub-resource and download is checked against private, loopback and
link-local addresses unless LR_ALLOW_PRIVATE=1 (tests crawl a fixture site on 127.0.0.1). Downloads are capped
in size and must be images.
"""
import ipaddress
import json
import os
import re
import socket
import urllib.parse
from dataclasses import dataclass, field
from pathlib import Path

from .util import LRError, say

JS_DIR = Path(__file__).resolve().parent / "js"
WANT = re.compile(r"team|attorney|lawyer|about|our-firm|people|staff|contact|location|office|result|verdict|review|"
                  r"testimonial|practice|why|espanol|spanish|areas|case", re.I)
SKIP = re.compile(r"\.(pdf|jpe?g|png|gif|webp|svg|zip|docx?)$|wp-login|/feed|/tag/|/category/|/page/\d|/blog/.+|/news/.+|mailto:|tel:", re.I)
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"
MAX_IMAGE_BYTES = 15 * 1024 * 1024
IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/svg+xml": ".svg", "image/gif": ".gif"}


class SiteBlocked(LRError):
    pass


@dataclass
class Site:
    url: str
    final_url: str = ""
    brand_read: dict = field(default_factory=dict)
    pages: list = field(default_factory=list)          # {name, url, title, h1, text, nav, meta}
    jsonld: list = field(default_factory=list)
    images: list = field(default_factory=list)         # {url, page, w, h, alt, near}
    logos: list = field(default_factory=list)          # {url | svg, page, w, h, alt, where}
    favicon: str | None = None


_host_ok: dict[str, bool] = {}


def host_allowed(host: str) -> bool:
    if os.environ.get("LR_ALLOW_PRIVATE") == "1":
        return True
    host = (host or "").strip("[]").lower()
    if not host or host == "localhost" or host.endswith((".local", ".internal", ".lan")):
        return False
    if host not in _host_ok:
        try:
            addrs = {ai[4][0] for ai in socket.getaddrinfo(host, None)}
            _host_ok[host] = bool(addrs) and all(ipaddress.ip_address(a.split("%")[0]).is_global for a in addrs)
        except (socket.gaierror, ValueError, UnicodeError):
            _host_ok[host] = False
    return _host_ok[host]


def url_allowed(url: str) -> bool:
    p = urllib.parse.urlparse(url)
    if p.scheme in ("data", "blob", "about"):
        return True
    return p.scheme in ("http", "https") and host_allowed(p.hostname or "")


def same_site(a: str, b: str) -> bool:
    strip = lambda h: (h or "")[4:] if (h or "").startswith("www.") else (h or "")
    return strip(urllib.parse.urlparse(a).hostname) == strip(urllib.parse.urlparse(b).hostname)


PAGE_JS = r"""() => {
  const txt = e => (e && (e.innerText || e.textContent) || '').trim();
  const nav = [...document.querySelectorAll('nav a, header a, [class*=menu] a, [role=navigation] a')].map(txt).filter(t => t && t.length < 80);
  const meta = n => (document.querySelector(`meta[name="${n}"], meta[property="${n}"]`) || {}).content || null;
  const links = [...document.querySelectorAll('a[href]')].map(a => [a.href.split('#')[0], txt(a).slice(0, 60)]);
  const icon = document.querySelector('link[rel~="apple-touch-icon"], link[rel~="icon"]');
  return { title: document.title, nav: [...new Set(nav)], h1: txt(document.querySelector('h1')) || null, links,
           ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent),
           text: document.body ? document.body.innerText : '', favicon: icon ? icon.href : null,
           meta: { description: meta('description') || meta('og:description'), site_name: meta('og:site_name'), og_image: meta('og:image') } };
}"""

# Photos: <img> (incl. lazy-loaded) and CSS backgrounds, at least 400 px, with alt text and the nearest caption/heading.
IMAGES_JS = r"""async () => {
  const near = el => { for (let e = el, i = 0; e && i < 5; e = e.parentElement, i++) {
      const h = e.querySelector && e.querySelector('figcaption, h1, h2, h3, h4, h5, strong, .name, [class*=name], [class*=title]');
      if (h && h.innerText && h.innerText.trim().length < 120) return h.innerText.trim(); } return ''; };
  const seen = new Map();
  for (const i of document.querySelectorAll('img')) {
    const u = i.currentSrc || i.src || i.dataset.src || i.dataset.lazySrc || '';
    if (u && !seen.has(u)) seen.set(u, { url: u, alt: i.alt || '', near: near(i), inHeader: !!i.closest('header') });
  }
  for (const e of document.querySelectorAll('section, div, figure, a, span')) {
    const m = getComputedStyle(e).backgroundImage.match(/url\("?([^")]+)/);
    if (m && !seen.has(m[1])) seen.set(m[1], { url: m[1], alt: e.getAttribute('aria-label') || '', near: near(e), inHeader: !!e.closest('header') });
  }
  const list = [...seen.values()].filter(x => !x.url.startsWith('data:') && !/\.svg($|\?)/i.test(x.url) && !/sprite|icon|badge|award|logo|seal|emblem/i.test(x.url + ' ' + x.alt));
  const sized = await Promise.all(list.map(x => new Promise(res => { const im = new Image(); im.onload = () => res(Object.assign(x, { w: im.naturalWidth, h: im.naturalHeight })); im.onerror = () => res(null); im.src = x.url; })));
  return sized.filter(x => x && Math.max(x.w, x.h) >= 400);
}"""

LOGOS_JS = r"""() => {
  const out = [];
  const sel = 'header img, [class*=logo] img, img[alt*=logo i], img[src*=logo i], img[class*=logo i], header svg, [class*=logo] svg, a[class*=logo] svg, a[href="/"] svg, a[href="/"] img';
  for (const e of [...document.querySelectorAll(sel)].slice(0, 10)) {
    const r = e.getBoundingClientRect(); if (r.width < 30 || r.height < 12) continue;
    const where = e.closest('header') ? 'header' : (e.closest('footer') ? 'footer' : 'page');
    const bg = (() => { for (let p = e; p; p = p.parentElement) { const c = getComputedStyle(p).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c; } return 'rgb(255, 255, 255)'; })();
    if (e.tagName.toLowerCase() === 'img') out.push({ url: e.currentSrc || e.src, w: e.naturalWidth, h: e.naturalHeight, alt: e.alt || '', where, bg });
    else out.push({ svg: e.outerHTML.slice(0, 300000), w: Math.round(r.width), h: Math.round(r.height), where, bg, color: getComputedStyle(e).color });
  }
  for (const e of document.querySelectorAll('footer img[src*=logo i], footer svg')) {
    const r = e.getBoundingClientRect(); if (r.width < 60) continue;
    const bg = getComputedStyle(e.closest('footer')).backgroundColor;
    if (e.tagName.toLowerCase() === 'img') out.push({ url: e.currentSrc || e.src, w: e.naturalWidth, h: e.naturalHeight, alt: e.alt || '', where: 'footer', bg });
    else out.push({ svg: e.outerHTML.slice(0, 300000), w: Math.round(r.width), h: Math.round(r.height), where: 'footer', bg, color: getComputedStyle(e).color });
  }
  return out;
}"""


def crawl(url: str, max_pages: int = 10, timeout_s: int = 30) -> Site:
    from playwright.sync_api import sync_playwright
    if not url_allowed(url):
        raise SiteBlocked(f"{url} isn't a public website address", fix="Check the URL.")
    site = Site(url=url)
    brand_js = (JS_DIR / "brand_scan.js").read_text().strip().rstrip(";")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(user_agent=UA, viewport={"width": 1440, "height": 900}, locale="en-US")
        ctx.route("**/*", lambda route: route.continue_() if url_allowed(route.request.url) else route.abort("blockedbyclient"))
        failed = []
        pg = ctx.new_page()
        pg.on("requestfailed", lambda r: failed.append((r.resource_type, urllib.parse.urlparse(r.url).hostname)))
        say(f"Reading {url} ...")
        try:
            resp = pg.goto(url, wait_until="domcontentloaded", timeout=timeout_s * 1000)
        except Exception as e:
            browser.close()
            raise SiteBlocked(f"Couldn't open {url}: {str(e).splitlines()[0][:140]}",
                              fix="Check the address. If the site blocks automated browsers, create the client with "
                                  "`lr client new <url> --name \"Firm Name\" --manual` and drop its logo and photos into the brand folder.")
        if resp is not None and resp.status >= 400:
            browser.close()
            raise SiteBlocked(f"{url} answered HTTP {resp.status} (blocked or not found)",
                              fix="If the site blocks automated browsers, use `lr client new <url> --name \"Firm Name\" --manual`.")
        for sel in ("button:has-text('Accept')", "button:has-text('Got it')", "button:has-text('Close')", "[aria-label='Close']"):
            try: pg.locator(sel).first.click(timeout=500)
            except Exception: pass
        try: pg.wait_for_load_state("networkidle", timeout=8000)
        except Exception: pass
        site.final_url = pg.url
        site.brand_read = json.loads(pg.evaluate(brand_js))
        css_blocked = sorted({h for t, h in failed if t == "stylesheet" and h})
        default_look = "Times New Roman" in (site.brand_read.get("h1") or "") or any(c.startswith("#0000EE") for c in site.brand_read.get("top", [])[:3])
        site.brand_read["reliable"] = not (css_blocked or default_look)
        if not site.brand_read["reliable"]:
            site.brand_read["why_unreliable"] = (f"stylesheets blocked from {', '.join(css_blocked)}; " if css_blocked else "") + ("page renders in browser defaults" if default_look else "")
        site.logos = [dict(l, page=pg.url) for l in pg.evaluate(LOGOS_JS)]

        queue, seen, i = [("home", pg.url)], {pg.url.rstrip("/")}, 0
        while i < len(queue) and len(site.pages) < max_pages:
            name, u = queue[i]; i += 1
            try:
                if i > 1:
                    say(f"Reading {u}")
                    pg.goto(u, wait_until="domcontentloaded", timeout=timeout_s * 1000)
                    try: pg.wait_for_load_state("networkidle", timeout=4000)
                    except Exception: pass
                pg.evaluate("window.scrollTo(0, document.body.scrollHeight)"); pg.wait_for_timeout(400)
                info = pg.evaluate(PAGE_JS)
                imgs = pg.evaluate(IMAGES_JS)
            except Exception as e:
                say(f"  skipped {u}: {str(e).splitlines()[0][:80]}")
                continue
            for raw in info.pop("ld"):
                try:
                    d = json.loads(raw)
                    items = d if isinstance(d, list) else (d.get("@graph") or [d]) if isinstance(d, dict) else []
                    site.jsonld += [x for x in items if isinstance(x, dict)]
                except ValueError:
                    pass
            if not site.favicon and info.get("favicon"):
                site.favicon = info["favicon"]
            links = info.pop("links")
            site.pages.append(dict(info, name=name, url=pg.url))
            for im in imgs:
                site.images.append(dict(im, url=urllib.parse.urljoin(pg.url, im["url"]), page=pg.url))
            if name == "home":
                ranked = []
                for href, text in links:
                    v = href.rstrip("/")
                    if not v.startswith("http") or not same_site(v, pg.url) or v in seen or SKIP.search(v):
                        continue
                    path = urllib.parse.urlparse(v).path
                    score = (3 if WANT.search(path) else 0) + (2 if WANT.search(text) else 0) - path.count("/") * 0.1
                    if score > 0:
                        seen.add(v); ranked.append((score, v))
                for _, v in sorted(ranked, key=lambda x: -x[0]):
                    queue.append((re.sub(r"[^a-z0-9]+", "-", urllib.parse.urlparse(v).path.lower()).strip("-") or "page", v))
        browser.close()
    uniq = {}
    for im in site.images:
        uniq.setdefault(im["url"].split("?")[0], im)
    site.images = sorted(uniq.values(), key=lambda x: -x["w"] * x["h"])
    return site


def download(url: str, referer: str | None = None) -> tuple[bytes, str]:
    """Fetch an image, re-checking every redirect hop against the address guard."""
    import httpx
    hops = 0
    headers = {"User-Agent": UA, **({"Referer": referer} if referer else {})}
    with httpx.Client(timeout=30, follow_redirects=False, headers=headers) as c:
        while True:
            if not url_allowed(url):
                raise LRError(f"refusing to fetch {url}")
            with c.stream("GET", url) as r:
                if r.is_redirect and hops < 5:
                    url = urllib.parse.urljoin(url, r.headers["location"]); hops += 1
                    continue
                r.raise_for_status()
                ctype = r.headers.get("content-type", "").split(";")[0].strip().lower()
                if ctype not in IMAGE_TYPES:
                    raise LRError(f"not an image ({ctype or 'no content type'})")
                buf = bytearray()
                for chunk in r.iter_bytes():
                    buf += chunk
                    if len(buf) > MAX_IMAGE_BYTES:
                        raise LRError("image larger than 15 MB")
                return bytes(buf), ctype
