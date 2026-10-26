"""Replay exported Figma layers as HTML (absolute boxes, the same fonts) and compare with the original render.
A close match means the plugin will place every layer where the design has it."""
import html


def _css(c):
    return f"rgba({c['r'] * 255:.0f},{c['g'] * 255:.0f},{c['b'] * 255:.0f},{c['a']:.3f})" if c else "transparent"


def frame_html(frame: dict, images: dict, font_css: str) -> str:
    parts = [f"<div style='position:relative;width:{frame['w']}px;height:{frame['h']}px;overflow:hidden;background:{_css(frame['bg'])}'>"]
    for l in frame["layers"]:
        x, y, w, h = l["box"]
        pos = f"position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;"
        if l["type"] == "rect":
            if l.get("gradient"):
                g = l["gradient"]
                bg = f"linear-gradient({g['dir']}, " + ", ".join(f"{_css(s['color'])} {s['pos'] * 100:.1f}%" for s in g["stops"]) + ")"
            else:
                bg = _css(l.get("fill"))
            parts.append(f"<div style='{pos}background:{bg};border-radius:{l.get('radius') or 0}px'></div>")
        elif l["type"] == "image" and l.get("hash"):
            parts.append(f"<img style='{pos}' src='data:image/jpeg;base64,{images[l['hash']]}'>")
        elif l["type"] == "svg":
            parts.append(f"<div style='{pos}'>{l['svg']}</div>")
        elif l["type"] == "text":
            spans = []
            for r in l["runs"]:
                spans.append(f"<span style='color:{_css(r['color'])}'>{html.escape(l['chars'][r['start']:r['end']])}</span>")
            body = "".join(spans).replace("\n", "<br>") if spans else html.escape(l["chars"])
            lh = f"line-height:{l['lineHeight']}px;" if l.get("lineHeight") else ""
            ws = "white-space:nowrap;" if l.get("nowrap") else ""
            parts.append(f"<div style='{pos}width:{w + 2}px;height:auto;font-family:\"{l['family']}\";font-weight:{l['weight']};font-size:{l['size']}px;{lh}"
                         f"letter-spacing:{l['letterSpacing']}px;text-transform:{'uppercase' if l['upper'] else 'none'};text-align:{l['align'].lower()};{ws}"
                         f"{'text-decoration:line-through;' if l.get('strike') else ''}'>{body}</div>")
    parts.append("</div>")
    return f"<html><head><style>{font_css} body{{margin:0}}</style></head><body>{''.join(parts)}</body></html>"


def compare(original_png: str, replay_png: str) -> float:
    """Mean absolute difference (0-255) between two same-size renders, at reduced size."""
    import numpy as np
    from PIL import Image
    a = Image.open(original_png).convert("RGB")
    b = Image.open(replay_png).convert("RGB").resize(a.size)
    s = (a.width // 4, a.height // 4)
    return float(np.abs(np.asarray(a.resize(s), "float32") - np.asarray(b.resize(s), "float32")).mean())
