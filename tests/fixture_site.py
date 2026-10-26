"""A small, realistic law-firm website served on 127.0.0.1 for onboarding tests (fictional firm, 555 numbers)."""
import functools
import http.server
import io
import threading
from pathlib import Path

CSS = """
:root { --navy:#12263A; --gold:#C8963E; }
body { margin:0; font-family:"Source Sans 3", Arial, sans-serif; color:#3A4652; background:#FFFFFF; }
header { background:#FFFFFF; display:flex; align-items:center; justify-content:space-between; padding:18px 40px; border-bottom:1px solid #E5E7EB; }
.logo svg .mark { fill: var(--navy); } .logo svg .word { fill: var(--navy); } .logo svg .rule { fill: var(--gold); }
nav a { margin-left:22px; color:var(--navy); text-decoration:none; font-weight:600; }
h1, h2, h3 { font-family:"Playfair Display", Georgia, serif; color:var(--navy); font-weight:700; }
h1 { font-size:56px; } .hero { background:var(--navy); color:#fff; padding:80px 40px; } .hero h1 { color:#fff; }
.btn { display:inline-block; background:var(--gold); color:#12263A; text-transform:uppercase; letter-spacing:2px;
       padding:16px 28px; border-radius:2px; font-weight:700; text-decoration:none; font-family:"Source Sans 3", sans-serif; }
section { padding:48px 40px; } .card { border:1px solid #E5E7EB; padding:20px; margin:10px 0; }
footer { background:var(--navy); color:#fff; padding:40px; } .team img { width:320px; }
"""

LOGO = """<svg class="logosvg" viewBox="0 0 300 60" width="300" height="60" xmlns="http://www.w3.org/2000/svg">
<rect class="mark" x="0" y="5" width="50" height="50" rx="6"/><rect class="rule" x="62" y="44" width="120" height="4"/>
<path class="word" d="M62 10h10v24H62zM78 10h10v24H78zM94 10h40v6H94zM94 22h30v6H94z"/><script>alert(1)</script></svg>"""

HEAD = """<!doctype html><html><head><meta charset="utf-8"><title>{title} | Harbor &amp; Vale Injury Lawyers</title>
<meta name="description" content="Tampa personal injury lawyers helping people hurt in car and truck crashes since 1998.">
<meta property="og:site_name" content="Harbor &amp; Vale Injury Lawyers">
<link rel="stylesheet" href="/style.css">
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"LegalService","name":"Harbor & Vale Injury Lawyers",
"telephone":"(813) 555-0142","address":{{"@type":"PostalAddress","streetAddress":"400 N Ashley Dr, Suite 1900","addressLocality":"Tampa","addressRegion":"FL","postalCode":"33602"}}}}</script>
</head><body><header><a class="logo" href="/">{logo}</a><nav>
<a href="/about/">About</a><a href="/attorneys/">Our Attorneys</a><a href="/practice-areas/car-accidents/">Car Accidents</a>
<a href="/practice-areas/truck-accidents/">Truck Accidents</a><a href="/practice-areas/wrongful-death/">Wrongful Death</a>
<a href="/results/">Results</a><a href="/reviews/">Reviews</a><a href="/contact/">Contact</a><a href="/blog/some-post/">Blog</a></nav></header>"""
FOOT = """<footer><p>Harbor &amp; Vale Injury Lawyers · 400 N Ashley Dr, Suite 1900<br>Tampa, FL 33602 · (813) 555-0142</p></footer></body></html>"""

PAGES = {
    "index.html": ("Home", """<div class="hero"><h1>Hurt in a crash? We fight for Tampa families.</h1>
<p>Personal injury lawyers serving Tampa Bay since 1998. Se habla español.</p><a class="btn" href="/contact/">Free consultation</a></div>
<section><h2>Car accidents, truck accidents and wrongful death</h2><p>Our car accident lawyers and truck accident attorneys handle personal injury cases across Florida.</p>
<img src="/img/office-lobby.jpg" alt="Our Tampa office lobby"><img src="/img/shutterstock-123456.jpg" alt="Stock image of a crash">
<img src="/img/tiny.jpg" alt="small badge photo"></section>
<section><p>No fee unless we win. Available 24/7.</p></section>"""),
    "about/index.html": ("About", """<section><h1>About our firm</h1><p>Harbor &amp; Vale was founded in 1998 by Dana Harbor.</p>
<p>With over 25 years of experience, we are trial lawyers who take cases to trial when insurers won't be fair.</p>
<p>We are a family-owned firm. Our mission is to treat every client like family.</p>
<img src="/img/office-front.jpg" alt="The front of our office building"></section>"""),
    "attorneys/index.html": ("Our Attorneys", """<section class="team"><h1>Our attorneys</h1>
<div class="card"><h3>Dana Harbor</h3><p>Founding Partner</p></div>
<div class="card"><h3>Miguel Vale</h3><p>Partner, Trial Attorney</p></div></section>"""),
    "practice-areas/car-accidents/index.html": ("Car Accidents", "<section><h1>Tampa car accident lawyers</h1><p>Car accident claims are our most common case.</p></section>"),
    "practice-areas/truck-accidents/index.html": ("Truck Accidents", "<section><h1>Truck accident attorneys</h1><p>18-wheeler crashes need fast evidence work.</p></section>"),
    "practice-areas/wrongful-death/index.html": ("Wrongful Death", "<section><h1>Wrongful death</h1><p>We help families after a fatal crash.</p></section>"),
    "results/index.html": ("Results", "<section><h1>Results</h1><p>$4.2 million verdict for a truck crash victim in Hillsborough County.</p><p>$1.1 million settlement for a rideshare passenger.</p></section>"),
    "reviews/index.html": ("Reviews", """<section><h1>Client reviews</h1><p>Rated 4.9 stars from 312 reviews on Google.</p>
<p>“Dana and her team answered every call and got me back on my feet after my accident.” — Former client</p></section>"""),
    "contact/index.html": ("Contact", """<section><h1>Contact us</h1><p>Tampa office<br>400 N Ashley Dr, Suite 1900<br>Tampa, FL 33602</p>
<p>Call (813) 555-0142</p><p>Orlando office<br>200 S Orange Ave<br>Orlando, FL 32801</p><p>Orlando: (407) 555-0199</p></section>"""),
    "blog/some-post/index.html": ("Blog", "<section><h1>A blog post</h1></section>"),
}


def _jpg(w, h, seed):
    from PIL import Image, ImageDraw, ImageFilter
    im = Image.new("RGB", (w, h), (40 + seed * 20, 60, 80))
    d = ImageDraw.Draw(im)
    for i in range(0, w, 37):                       # texture so it reads as a sharp photo, not a flat fill
        d.line([(i, 0), (i + h // 3, h)], fill=(120 + (i * 7 + seed * 31) % 120, 110, 90 + seed * 30), width=5)
    for i in range(0, h, 53):
        d.rectangle([w // 5, i, w // 5 + 60, i + 20], fill=(200, 190 - seed * 10, 160))
    b = io.BytesIO(); im.filter(ImageFilter.SHARPEN).save(b, "JPEG", quality=92)
    return b.getvalue()


def build(root: Path) -> Path:
    root.mkdir(parents=True, exist_ok=True)
    (root / "style.css").write_text(CSS)
    for rel, (title, body) in PAGES.items():
        p = root / rel; p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(HEAD.format(title=title, logo=LOGO) + body + FOOT)
    (root / "img").mkdir(exist_ok=True)
    (root / "img" / "office-lobby.jpg").write_bytes(_jpg(1800, 1200, 1))
    (root / "img" / "office-front.jpg").write_bytes(_jpg(1600, 1067, 2))
    (root / "img" / "shutterstock-123456.jpg").write_bytes(_jpg(1600, 1000, 3))
    (root / "img" / "tiny.jpg").write_bytes(_jpg(420, 300, 4))
    return root


class _Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve(root: Path):
    """Start a server; returns (base_url, stop)."""
    handler = functools.partial(_Quiet, directory=str(root))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return f"http://127.0.0.1:{srv.server_address[1]}/", srv.shutdown
