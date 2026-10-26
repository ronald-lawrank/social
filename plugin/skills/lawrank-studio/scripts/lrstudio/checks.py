"""Design checks on what was actually drawn (measurements from the browser + the rendered pixels).

Each issue: {"rule", "level": "block"|"warn", "msg", "box": [x, y, w, h] (frame pixels, for the contact sheet)}.
Blocking issues must be fixed before a design is shown as ready; warnings are for a person to look at.
"""
import re

MIN_PX = {"headline": 50, "subhead": 34, "body": 26, "cta": 24, "label": 22, "fine": 18}     # at 1080 wide, never shrink below
SOFT_UPSCALE, MAX_UPSCALE = 1.6, 2.05


def _inter(a, b):
    x, y = max(a[0], b[0]), max(a[1], b[1])
    r, t = min(a[0] + a[2], b[0] + b[2]), min(a[1] + a[3], b[1] + b[3])
    return (r - x) * (t - y) if r > x and t > y else 0.0


def _rgb(css: str):
    m = re.findall(r"[\d.]+", css or "")
    return tuple(float(v) for v in m[:3]) if len(m) >= 3 else (0.0, 0.0, 0.0)


def _lum(rgb):
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * ch(rgb[0]) + 0.7152 * ch(rgb[1]) + 0.0722 * ch(rgb[2])


def contrast_in(png, box, text_rgb) -> float | None:
    """Worst realistic contrast between the text colour and what's behind it inside box (5th percentile of the
    background: anti-aliased text edges and the glyphs themselves are excluded)."""
    import numpy as np
    x, y, w, h = (int(round(v)) for v in box)
    x0, y0 = max(0, x), max(0, y)
    reg = png[y0:min(png.shape[0], y + h), x0:min(png.shape[1], x + w), :3].reshape(-1, 3).astype("float32")
    if reg.shape[0] < 50:
        return None
    lin = np.where(reg / 255 <= 0.03928, reg / 255 / 12.92, ((reg / 255 + 0.055) / 1.055) ** 2.4)
    L = lin @ np.array([0.2126, 0.7152, 0.0722], dtype="float32")
    Lt = _lum(text_rgb)
    ratio = (np.maximum(L, Lt) + 0.05) / (np.minimum(L, Lt) + 0.05)
    bg = np.sort(ratio)[int(len(ratio) * 0.45):]           # the glyphs and their edges are the low-contrast part
    return float(np.percentile(bg, 5)) if len(bg) else None


def check_frame(f: dict, png_path) -> list[dict]:
    issues = []
    add = lambda rule, level, msg, box=None: issues.append({"rule": rule, "level": level, "msg": msg, "box": box})
    W, H = f["w"], f["h"]
    t, r, b, l = f["safe"]
    safe = [l, t, W - l - r, H - t - b]
    slots = f["slots"]

    for s in slots:
        name = s["slot"]
        if s["overflowY"] > 2 or s["overflowX"] > 2:
            add("text", "block", f"'{name}' doesn't fit its space: shorten it", s["rect"])
        boxes = s["lines"] or [s["rect"]]
        for bx in boxes:
            if bx[0] < -1 or bx[1] < -1 or bx[0] + bx[2] > W + 1 or bx[1] + bx[3] > H + 1:
                add("text", "block", f"'{name}' runs off the canvas", bx); break
            if not s.get("edge") and (bx[0] < safe[0] - 2 or bx[1] < safe[1] - 2 or bx[0] + bx[2] > safe[0] + safe[2] + 2 or bx[1] + bx[3] > safe[1] + safe[3] + 2):
                add("safe-zone", "block", f"'{name}' sits outside the safe area (platform UI or crops will cover it)", bx); break
        need = MIN_PX.get(s["role"], 22)
        if s["text"] and s["size"] < need - 0.5:
            add("type", "block", f"'{name}' is {s['size']:.0f}px; the minimum for {s['role']} text is {need}px", s["rect"])
    for i, a in enumerate(slots):
        for c in slots[i + 1:]:
            ar = a["rect"]; cr = c["rect"]
            if _inter(ar, cr) > 0.04 * min(ar[2] * ar[3], cr[2] * cr[3]) and a["text"] and c["text"]:
                add("collision", "block", f"'{a['slot']}' and '{c['slot']}' overlap", ar)

    # people: never cut, never covered
    texty = [(s["slot"], s["rect"]) for s in slots if s["text"]] + [(o["type"], o["rect"]) for o in f["ovs"] if o["type"] not in ("shade",)]
    for ph in f["photos"]:
        if not ph["heads_whole"]:
            add("people", "block", f"photo '{ph['key']}' is too wide for this frame: it cuts people out. Use a single-person photo or a wide layout", ph["clip"])
        elif not ph["people_whole"] and not ph.get("portrait"):     # a deliberate head-and-shoulders portrait may crop there
            add("people", "warn", f"photo '{ph['key']}': shoulders are cropped at the frame edge", ph["clip"])
        if ph["upscale"] > MAX_UPSCALE:
            add("photo", "block", f"photo '{ph['key']}' is enlarged {ph['upscale']}x and will look blurry: ask the firm for a larger original", ph["clip"])
        elif ph["upscale"] > SOFT_UPSCALE:
            add("photo", "warn", f"photo '{ph['key']}' is enlarged {ph['upscale']}x: check it looks sharp", ph["clip"])
        cx, cy, cw, ch = ph["clip"]
        for n, person in enumerate(ph["people"], 1):
            face, chest = person["face"], person["chest"]
            vis = _inter(face, [cx, cy, cw, ch]) / max(1.0, face[2] * face[3])
            if 0.02 < vis < 0.97 and ph["heads_whole"]:
                add("people", "block", f"photo '{ph['key']}': person {n}'s head is cut by the frame edge", face)
            if vis <= 0.02:
                continue
            # a frame edge just under the chin leaves a floating head: cut lower (mid-chest) or show less
            chin = face[1] + face[3]
            if ph["heads_whole"] and chin - 2 < cy + ch < chin + 0.75 * face[3] and not ph.get("portrait"):
                add("people", "block", f"photo '{ph['key']}': person {n} is cut at the neck", face)
            for name, box in texty:
                if _inter(face, box) > 0.02 * face[2] * face[3]:
                    add("people", "block", f"'{name}' covers person {n}'s face in '{ph['key']}'", face)
                elif _inter(chest, box) > 0.06 * chest[2] * chest[3] and name != "logo":
                    add("people", "block", f"'{name}' covers person {n}'s chest/shoulders in '{ph['key']}'", chest)
            for o in f["ovs"]:
                if o["type"] == "shade" and o.get("opaque"):
                    if _inter(face, o["opaque"]) > 0.05 * face[2] * face[3]:
                        add("people", "block", f"a fade darkens person {n}'s face in '{ph['key']}'", face)
                    elif _inter(chest, o["opaque"]) > 0.35 * chest[2] * chest[3]:
                        add("people", "warn", f"a fade starts over person {n}'s chest in '{ph['key']}'", chest)

    # contrast, measured on the pixels
    try:
        import numpy as np
        from PIL import Image
        png = np.asarray(Image.open(png_path).convert("RGB"))
    except Exception:
        png = None
    if png is not None:
        for s in slots:
            if not s["text"] or s["slot"] in ("cta",):
                continue
            large = s["size"] >= 40 or (s["size"] >= 30 and s["weight"] >= 600)
            need = 3.0 if large else 4.5
            worst = None
            for bx in (s["lines"] or [s["rect"]]):
                c = contrast_in(png, bx, _rgb(s["color"]))
                if c is not None:
                    worst = c if worst is None else min(worst, c)
            if worst is not None and worst < need - 0.05:
                add("contrast", "block" if worst < need * 0.8 else "warn",
                    f"'{s['slot']}' contrast is {worst:.1f}:1 (needs {need:.1f}:1)", s["rect"])
    # logos must stand out from whatever is behind them (a white logo on a pale sky disappears)
    if png is not None:
        for o in f["ovs"]:
            if o["type"] != "logo":
                continue
            v = logo_visibility(png, o["rect"])
            if v is not None and v < 2.2:
                add("contrast", "block" if v < 1.6 else "warn", f"the logo barely shows against what's behind it ({v:.1f}:1)", o["rect"])
    return issues


def logo_visibility(png, box) -> float | None:
    """Contrast between the logo's own pixels and the pixels around it (a ring just outside its box)."""
    import numpy as np
    x, y, w, h = (int(round(v)) for v in box)
    H, W = png.shape[:2]
    pad = max(8, int(h * 0.6))
    x0, y0, x1, y1 = max(0, x - pad), max(0, y - pad), min(W, x + w + pad), min(H, y + h + pad)
    if x1 - x0 < 10 or y1 - y0 < 10:
        return None
    region = png[y0:y1, x0:x1, :3].astype("float32")
    mask = np.ones(region.shape[:2], bool)
    mask[max(0, y - y0):max(0, y - y0) + h, max(0, x - x0):max(0, x - x0) + w] = False
    ring, inner = region[mask], png[max(0, y):min(H, y + h), max(0, x):min(W, x + w), :3].reshape(-1, 3).astype("float32")
    if len(ring) < 20 or len(inner) < 20:
        return None

    def lum(a):
        a = a / 255
        a = np.where(a <= 0.03928, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
        return a @ np.array([0.2126, 0.7152, 0.0722])
    lr, li = lum(ring), lum(inner)
    bg = float(np.median(lr))
    # the logo's ink = the inner pixels most different from the background
    diff = np.abs(li - bg)
    ink = float(np.median(li[diff >= np.percentile(diff, 85)]))
    return (max(bg, ink) + 0.05) / (min(bg, ink) + 0.05)
