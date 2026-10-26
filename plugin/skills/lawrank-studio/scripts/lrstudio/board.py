"""The brand board: brand/board/board.html (+ PNGs), rebuilt whenever the brand profile changes."""
from . import render, store
from .util import read_json


def board_copy(c: store.Client) -> dict:
    """Sample lines for the board: educational copy for the firm's practice area (no claims, so nothing to approve),
    and a call to action that only offers a free consultation once the firm has approved a fees fact."""
    from .campaign import consult_cta, sample_copy
    s = sample_copy(c.data.get("practice_area"))
    return {"headline": s["headline"], "tile": s["tile"], "cta": consult_cta(store.read_facts(c)), "cta2": "Call today"}


def render_board(c: store.Client) -> dict:
    brand = c.brand()
    photos = read_json(c.brand_dir / "photos" / "photos.json", {}) or {}
    usable = [(k, p) for k, p in photos.items() if p.get("use", True)]
    plist = []
    for i, (k, p) in enumerate(usable[:8]):
        label = (p.get("name") or p["kind"]).title() if not p.get("name") else p["name"]
        plist.append({"key": k, "x": 96 + (i % 4) * 432, "y": 170 + (i // 4) * 420, "label": f"{label} · {k}"})
    res = render.render(c.dir, brand, [{"id": "board", "template": "brand-board", "size": "board",
                                         "data": {"copy": board_copy(c), "photos_list": plist}}], c.brand_dir / "board", flat=True)
    return res[0]
