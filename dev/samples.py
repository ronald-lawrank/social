"""Render every template at every size for one client with sample copy, plus a contact sheet. For design review.

    python3 dev/samples.py "<client>" OUT_DIR [template,template]
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "plugin/skills/lawrank-studio/scripts"))
from lrstudio import render, store, templates  # noqa: E402



SAMPLE = {p.parent.name: json.loads(p.read_text()) for p in (Path(__file__).resolve().parent.parent / "plugin/skills/lawrank-studio/templates").glob("*/example.json")}


def main():
    client, out = store.find(sys.argv[1]), Path(sys.argv[2])
    only = sys.argv[3].split(",") if len(sys.argv) > 3 else None
    brand = client.brand()
    designs = []
    for name, meta in templates.catalog().items():
        if only and name not in only or name not in SAMPLE:
            continue
        for size in meta["sizes"]:
            for tr in ([meta.get("treatment", "dark")] if not only else meta.get("options", {}).get("treatment", [meta.get("treatment", "dark")])):
                designs.append({"id": f"{name}-{size}-{tr}", "template": name, "size": size, "data": dict(SAMPLE[name], treatment=tr)})
    res = render.render(client.dir, brand, designs, out)
    for r in res:
        bad = [i["msg"] for i in r["issues"] if i["level"] == "block"]
        warn = [i["msg"] for i in r["issues"] if i["level"] == "warn"]
        print(f"{r['id']:34} {'BLOCK ' + '; '.join(bad) if bad else 'ok'}{'  | warn: ' + '; '.join(warn) if warn else ''}")
    sheet(out, res)


def sheet(out, res, width=2400):
    from PIL import Image, ImageDraw
    rows, row, x, h = [], [], 0, 0
    thumbs = []
    for r in res:
        for p in r["images"]:
            im = Image.open(out / p).convert("RGB")
            s = 560 / im.height
            thumbs.append((r["id"], im.resize((int(im.width * s), 560)), any(i["level"] == "block" for i in r["issues"])))
    for t in thumbs:
        if x + t[1].width > width and row:
            rows.append(row); row, x = [], 0
        row.append(t); x += t[1].width + 24
    rows.append(row)
    H = len(rows) * 610 + 20
    sheet = Image.new("RGB", (width, H), (233, 234, 236)); d = ImageDraw.Draw(sheet)
    y = 10
    for row in rows:
        x = 10
        for name, im, bad in row:
            sheet.paste(im, (x, y + 30)); d.text((x, y + 8), name, fill=(200, 0, 0) if bad else (40, 40, 40))
            if bad:
                d.rectangle([x - 3, y + 27, x + im.width + 2, y + 30 + im.height + 2], outline=(220, 0, 0), width=4)
            x += im.width + 24
        y += 610
    sheet.save(out / "sheet.jpg", quality=85)
    print("sheet:", out / "sheet.jpg")


if __name__ == "__main__":
    main()
