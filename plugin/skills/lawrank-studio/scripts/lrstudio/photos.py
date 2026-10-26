"""The firm's photos: who is in them, whether they're good enough, and how to crop them without hurting anyone.

photos.json (brand/photos/photos.json), one entry per photo key:
  {"file": "jason.jpg", "kind": "person|group|office", "name": "Jason McMinn", "use": true,
   "w": 1200, "h": 1500, "faces": [[x, y, w, h], ...] (0..1 of the image), "sharpness": 180,
   "source": "<page URL>", "image_url": "<original URL>", "why": "<why it was or wasn't picked>"}

crop() is the one place crop maths lives: templates call it so faces, heads and shoulders stay inside the frame.
"""
import hashlib
import io
import re
from pathlib import Path

from . import tools
from .util import read_json, say, slugify, write_bytes, write_json

STOCK = re.compile(r"shutterstock|istock|gettyimages|getty|adobestock|stock\.adobe|depositphotos|dreamstime|123rf|alamy|"
                   r"unsplash|pexels|pixabay|freepik|envato|bigstock|canstock", re.I)
AI_MADE = re.compile(r"midjourney|dall-?e|openai|stable.?diffusion|firefly|imagen|leonardo\.ai|ideogram", re.I)
MIN_SIDE = 700           # smaller photos look soft once a post enlarges them
MIN_SHARPNESS = 40       # variance of the Laplacian; under this a photo reads as blurred
MAX_UPSCALE = 2.0        # never enlarge a photo past 2x its own pixels
MAX_TEXT_SHARE = 0.03    # share of the frame covered by lines of type; above it the image is a banner or graphic
SAME_FACE = 0.30         # SFace cosine similarity: the same attorney scored 0.33-0.45 across photos, stock faces <0.2


# ---------------------------------------------------------------- detection
_detector = None


def _faces_yunet(img):
    import cv2
    global _detector
    path = tools.model("yunet.onnx", required=False)
    if not path:
        return None
    h, w = img.shape[:2]
    if _detector is None:
        _detector = cv2.FaceDetectorYN.create(str(path), "", (w, h), 0.7, 0.3, 5000)
    _detector.setInputSize((w, h))
    _, found = _detector.detect(img)
    return [] if found is None else [[float(f[0]), float(f[1]), float(f[2]), float(f[3]), float(f[-1])] for f in found]


def face_features(data: bytes) -> list | None:
    """One SFace feature vector per detected face, or None when the models aren't available."""
    import cv2
    import numpy as np
    det_path, rec_path = tools.model("yunet.onnx", required=False), tools.model("sface.onnx", required=False)
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if not (det_path and rec_path) or img is None:
        return None
    H, W = img.shape[:2]
    s = min(1.0, 1280 / max(W, H))
    img = cv2.resize(img, (round(W * s), round(H * s))) if s < 1 else img
    h, w = img.shape[:2]
    det = cv2.FaceDetectorYN.create(str(det_path), "", (w, h), 0.7, 0.3, 5000)
    rec = cv2.FaceRecognizerSF.create(str(rec_path), "")
    _, found = det.detect(img)
    return [] if found is None else [rec.feature(rec.alignCrop(img, f)) for f in found]


_recognizer = None


def same_face(a, b) -> bool:
    import cv2
    global _recognizer
    if _recognizer is None:
        _recognizer = cv2.FaceRecognizerSF.create(str(tools.model("sface.onnx")), "")
    return _recognizer.match(a, b, cv2.FaceRecognizerSF_FR_COSINE) >= SAME_FACE


def _faces_haar(img):
    import cv2
    g = cv2.equalizeHist(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
    m = max(24, min(img.shape[:2]) // 25)
    c = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    return [[float(x), float(y), float(w), float(h), 0.7] for (x, y, w, h) in c.detectMultiScale(g, 1.08, 8, minSize=(m, m))]


def analyze(data: bytes) -> dict:
    """Faces (0..1 boxes, padded to the whole head), size and sharpness of one photo."""
    import cv2
    import numpy as np
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        return {"error": "not a readable image"}
    H, W = img.shape[:2]
    s = min(1.0, 1280 / max(W, H))
    small = cv2.resize(img, (round(W * s), round(H * s))) if s < 1 else img
    found = _faces_yunet(small)
    by = "yunet"
    if found is None:
        found, by = _faces_haar(small), "opencv-haar"
    faces = []
    for x, y, w, h, conf in sorted(found, key=lambda f: -f[2] * f[3]):
        x, y, w, h = x / s, y / s, w / s, h / s
        if w < 24:
            continue
        # detector boxes cover eyes-to-chin: pad to the whole head (hair above, ears at the sides)
        px, pt, pb = 0.18 * w, 0.42 * h, 0.08 * h
        faces.append([round(max(0, x - px) / W, 4), round(max(0, y - pt) / H, 4),
                      round(min(W, x + w + px) / W - max(0, x - px) / W, 4), round(min(H, y + h + pb) / H - max(0, y - pt) / H, 4)])
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    if faces:
        fx, fy, fw, fh = faces[0]
        crop = gray[int(fy * H):int((fy + fh) * H), int(fx * W):int((fx + fw) * W)]
        gray = crop if crop.size > 400 else gray
    sharp = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    return {"w": W, "h": H, "faces": faces, "sharpness": round(sharp), "detector": by}


def text_share(data: bytes) -> float:
    """Share of the image covered by lines of type (site banners like "AUSTIN RELOCATION LAWYER" over a headshot).
    Edge map -> lines joined sideways -> boxes shaped like text lines: wide, short, dense, many vertical strokes."""
    import cv2
    import numpy as np
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_GRAYSCALE)
    if img is None:
        return 0.0
    s = 1000 / max(img.shape)
    g = cv2.resize(img, (round(img.shape[1] * s), round(img.shape[0] * s)), interpolation=cv2.INTER_AREA)
    H, W = g.shape
    grad = cv2.morphologyEx(g, cv2.MORPH_GRADIENT, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    _, bw = cv2.threshold(grad, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    bw = cv2.morphologyEx(bw, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (9, 1)))
    area = 0
    for c in cv2.findContours(bw, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
        x, y, w, h = cv2.boundingRect(c)
        if not (8 <= h <= 0.12 * H and w >= max(30, 2.5 * h)):
            continue
        roi = bw[y:y + h, x:x + w]
        fill = cv2.countNonZero(roi) / (w * h)
        strokes = np.mean([np.count_nonzero(np.diff(roi[int(h * f)] > 0)) for f in (0.3, 0.5, 0.7)]) / w
        if 0.3 <= fill <= 0.9 and strokes > 0.04:
            area += w * h
    return area / (W * H)


def stock_check(kind: str, name: str | None, texts: list, people: list[dict], text: float, face_match: bool | None = None) -> str | None:
    """Why a picked photo might not be the firm's own (stock couples and children, site banners), or None.
    face_match: whether a face matches a photo named after the firm's people (None when that can't be told: no
    named photo or no face model); then a name in the alt text or caption counts instead.
    Only a flag: a person looks, and sets "use": true in photos.json if it is the firm's."""
    if text > MAX_TEXT_SHARE:
        return "check: possibly stock or a site banner (large text regions)"
    if kind not in ("person", "group") or not people or name or face_match:
        return None
    if face_match is None and match_name(texts, people):
        return None                                       # a page about the attorney says this is them
    return "check: possibly stock (no face matched to the firm's people)"


def dhash(data: bytes) -> int:
    from PIL import Image
    g = Image.open(io.BytesIO(data)).convert("L").resize((9, 8))
    px = list(g.tobytes())
    return sum(1 << i for i in range(64) if px[(i // 8) * 9 + i % 8] > px[(i // 8) * 9 + i % 8 + 1])


def kind_of(info: dict) -> str:
    n = len(info.get("faces", []))
    if n == 0:
        return "office"
    return "person" if n == 1 else "group"


def match_name(texts: list[str], people: list[dict]) -> str | None:
    """Which attorney a photo shows, from its alt text, caption or file name."""
    blob = " ".join(t for t in texts if t).lower().replace("-", " ").replace("_", " ")
    best = None
    for p in people:
        parts = [x for x in re.split(r"\W+", p["name"].lower()) if len(x) > 1 and x not in ("jr", "sr", "esq", "iii", "ii")]
        if not parts:
            continue
        score = sum(1 for x in parts if re.search(rf"\b{re.escape(x)}\b", blob))
        if "".join(parts) in re.sub(r"\W+", "", blob):           # "DanaReyes.jpg", alt="MiguelVale"
            score = max(score, len(parts))
        if score >= min(2, len(parts)) and (not best or score > best[0]):
            best = (score, p["name"])
    return best[1] if best else None


def _key_for(kind: str, name: str | None, taken: set) -> str:
    base = slugify(name.split()[0]) if name else {"group": "team", "office": "office"}.get(kind, "person")
    key, n = base, 2
    while key in taken:
        key, n = f"{base}-{n}", n + 1
    taken.add(key)
    return key


def collect(candidates: list[dict], photos_dir: Path, people: list[dict], firm_domain: str, limit: int = 24,
            logos: tuple = ()) -> dict:
    """Download, analyse and choose photos. candidates: [{url, page, alt, near, w, h}] largest first.
    logos: the site's logo image URLs and/or bytes, never collected as photos (the header logo is often an <img>).

    Face embeddings for matching people across photos live only in memory here: photos.json gets the match (a name)."""
    from .crawl import download
    out, seen_hash, taken, checks = {}, [], set(), {}
    logo_urls = {l for l in logos if isinstance(l, str)}
    logo_hashes = [dhash(l) for l in logos if isinstance(l, bytes)]
    for c in candidates:
        if len(out) >= limit:
            break
        tag = f"{c['url']} {c.get('alt', '')}"
        if STOCK.search(tag) or AI_MADE.search(tag) or c["url"] in logo_urls:
            continue
        try:
            data, ctype = download(c["url"], c.get("page"))
        except Exception as e:
            say(f"  couldn't download {c['url'][:80]}: {str(e)[:60]}")
            continue
        info = analyze(data)
        if info.get("error"):
            continue
        h = dhash(data)
        if any(bin(h ^ o).count("1") <= 6 for o in seen_hash):
            continue                                        # same picture at another size
        if any(bin(h ^ o).count("1") <= 6 for o in logo_hashes):
            continue                                        # the logo, served under another URL or size
        seen_hash.append(h)
        kind = kind_of(info)
        name = match_name([c.get("alt"), c.get("near"), Path(c["url"]).stem], people) if kind == "person" else None
        reasons = []
        if max(info["w"], info["h"]) < MIN_SIDE:
            reasons.append(f"small ({info['w']}x{info['h']})")
        if info["sharpness"] < MIN_SHARPNESS:
            reasons.append("soft or blurred")
        if kind == "person" and info["faces"][0][2] * info["w"] < 70:
            reasons.append("face too small to crop into a portrait")
        if kind == "office" and info["w"] < 1000:
            reasons.append("small scene photo")
        key = _key_for(kind, name, taken)
        ext = ".png" if ctype == "image/png" else ".jpg"
        img = _normalized(data, ext)
        write_bytes(photos_dir / f"{key}{ext}", img)
        out[key] = {"file": f"{key}{ext}", "kind": kind, "name": name, "use": not reasons, "w": info["w"], "h": info["h"],
                    "faces": info["faces"], "sharpness": info["sharpness"], "detector": info["detector"],
                    "source": c.get("page"), "image_url": c["url"], "alt": c.get("alt") or None,
                    "why": "; ".join(reasons) if reasons else "good size and sharpness" + (f", {len(info['faces'])} people" if info["faces"] else ""),
                    "sha1": hashlib.sha1(img).hexdigest()}
        checks[key] = {"reasons": reasons, "texts": [c.get("alt"), c.get("near"), Path(c["url"]).stem], "text": text_share(data),
                       "features": face_features(data) if kind in ("person", "group") else None}
    _flag_possible_stock(out, checks, people)
    return out


def _flag_possible_stock(out: dict, checks: dict, people: list[dict]):
    """Second pass, once every photo is in: faces that match a photo already named after one of the firm's people are
    that person; the rest of the people photos, and banners with text, are flagged for a human to check."""
    refs = [(f, m["name"]) for k, m in out.items() if m.get("name") for f in (checks[k]["features"] or [])]
    for k, m in out.items():
        ch = checks[k]
        match = None
        for f in ch["features"] or []:
            match = next((n for rf, n in refs if same_face(f, rf)), None)
            if match:
                break
        if match and m["kind"] == "person" and not m.get("name"):
            m["name"] = match
        known = bool(refs) and ch["features"] is not None                    # faces can be compared for this photo
        flag = stock_check(m["kind"], m.get("name"), ch["texts"], people, ch["text"], face_match=bool(match) if known else None)
        if flag:
            ch["reasons"].append(flag)
        if ch["reasons"]:
            m.update(use=False, why="; ".join(ch["reasons"]))


def _normalized(data: bytes, ext: str) -> bytes:
    """Upright, sRGB, at most 2400 px: Drive-friendly and plenty for 1080-wide posts."""
    from PIL import Image, ImageOps
    im = ImageOps.exif_transpose(Image.open(io.BytesIO(data)))
    if max(im.size) > 2400:
        s = 2400 / max(im.size); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    buf = io.BytesIO()
    if ext == ".png":
        im.save(buf, "PNG", optimize=True)
    else:
        im.convert("RGB").save(buf, "JPEG", quality=90, optimize=True)
    return buf.getvalue()


def reanalyze(photos_dir: Path, force: bool = False) -> dict:
    """Run detection for photos added or replaced by hand (any image in photos/ missing from photos.json)."""
    meta = read_json(photos_dir / "photos.json", {}) or {}
    files = {m["file"]: k for k, m in meta.items()}
    taken = set(meta)
    for f in sorted(photos_dir.iterdir()):
        if f.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp") or f.name.startswith("."):
            continue
        key = files.get(f.name)
        if key and not force and meta[key].get("sha1") == hashlib.sha1(f.read_bytes()).hexdigest():
            continue
        data = f.read_bytes()
        info = analyze(data)
        if info.get("error"):
            continue
        if not key:
            key = _key_for(kind_of(info), None, taken) if not slugify(f.stem) or slugify(f.stem) in taken else slugify(f.stem)
            taken.add(key)
        prev = meta.get(key, {})
        meta[key] = {**prev, "file": f.name, "kind": prev.get("kind") if prev.get("locked") else kind_of(info),
                     "w": info["w"], "h": info["h"], "faces": prev.get("faces") if prev.get("locked") else info["faces"],
                     "sharpness": info["sharpness"], "detector": info["detector"], "use": prev.get("use", True),
                     "source": prev.get("source") or "added by hand", "sha1": hashlib.sha1(data).hexdigest(),
                     "name": prev.get("name"), "why": prev.get("why") or "added by hand"}
    write_json(photos_dir / "photos.json", meta)
    return meta


# ---------------------------------------------------------------- cropping
def people_box(faces: list, region: str = "shoulders") -> list | None:
    """Box (0..1 image units) that must stay whole: each head, plus shoulders below it."""
    if not faces:
        return None
    boxes = []
    for x, y, w, h in faces:
        if region == "head":
            boxes.append([x, y, x + w, y + h])
        else:                           # head + shoulders: ~2.6 head-widths wide, down to ~1.9 head-heights below the chin
            cx = x + w / 2
            boxes.append([cx - 1.3 * w, y, cx + 1.3 * w, y + h * 2.9])
    # clamp to the photo: where the photographer already cropped (e.g. at the waist) isn't ours to protect
    return [max(0.0, min(b[0] for b in boxes)), max(0.0, min(b[1] for b in boxes)),
            min(1.0, max(b[2] for b in boxes)), min(1.0, max(b[3] for b in boxes))]


def crop(meta: dict, fw: float, fh: float, fill: float = 0.0, focus_y: float = 0.12, focus_x: float = 0.5) -> dict:
    """Scale and offset for showing a photo in an fw x fh frame (CSS: width = w, left = x, top = y).

    Keeps every head and the shoulders inside the frame when the frame allows it; otherwise keeps the heads.
    fill > 0 zooms so the people take that share of the frame height (portraits), never past MAX_UPSCALE.
    focus_y: where the top of the heads should sit (share of frame height) when there's room to choose.
    focus_x: where the centre of the people should sit (share of frame width), e.g. 0.7 to leave room for text on the left.
    """
    iw, ih = meta["w"], meta["h"]
    cover = max(fw / iw, fh / ih)                       # smallest scale that fills the frame
    s = cover
    faces = meta.get("faces") or []
    keep = people_box(faces) or [0.25, 0.15, 0.75, 0.85]
    heads = people_box(faces, "head") or keep
    if fill and faces:
        want = fill * fh / ((keep[3] - keep[1]) * ih)   # people this tall
        fits = fw / ((keep[2] - keep[0]) * iw)          # but still as wide as the frame allows
        s = max(cover, min(want, fits, MAX_UPSCALE))
    W, H = iw * s, ih * s
    whole = (keep[2] - keep[0]) * W <= fw + 0.5 and (keep[3] - keep[1]) * H <= fh + 0.5
    t = keep if whole else heads
    left, right, top, bottom = t[0] * W, t[2] * W, t[1] * H, t[3] * H
    x = focus_x * fw - (left + right) / 2               # people centred on focus_x ...
    x = min(x, fw - right - 0.02 * fw) if right + x > fw else x
    x = max(x, 0.02 * fw - left)                        # ... but never pushed off either side
    y = focus_y * fh - top                              # heads at focus_y ...
    y = min(y, fh - bottom)                             # ... but shoulders (or heads) inside the bottom edge
    y = max(y, 0.03 * fh - top)                         # ... and a little headroom above the heads
    x = min(0.0, max(fw - W, x))                        # the photo always covers the frame
    y = min(0.0, max(fh - H, y))
    heads_whole = (heads[2] - heads[0]) * W <= fw + 0.5
    return {"s": round(s, 5), "x": round(x, 2), "y": round(y, 2), "w": round(W, 2), "h": round(H, 2),
            "upscale": round(s, 2), "people_whole": whole, "heads_whole": heads_whole}
