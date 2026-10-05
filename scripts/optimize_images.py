#!/usr/bin/env python3
"""Generate web derivatives for every asset listed in public/data/portfolio.json.

For each asset `src` (e.g. assets/portfolio/menu/001.png) this writes resized
WebP copies next to the public root:

    public/assets/web/menu/001-960.webp
    public/assets/web/menu/001-1920.webp   (file name = actual pixel width)

and records `width`, `height` and the generated `web` widths back into the
asset entry, so the site can reserve layout space (no CLS) and serve srcset.

Originals are never modified. Resizing / re-encoding only — no crop, no colour
correction (embedded ICC profiles are carried over).

Usage:  pip install pillow && python3 scripts/optimize_images.py
"""

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
DATA = PUBLIC / "data" / "portfolio.json"
WIDTHS = (960, 1920)
QUALITY = 84


def web_path(src: str, width: int) -> Path:
    rel = Path(src).relative_to("assets/portfolio")
    return PUBLIC / "assets" / "web" / rel.parent / f"{rel.stem}-{width}.webp"


def process(asset: dict) -> None:
    source = PUBLIC / asset["src"]
    if not source.exists():
        print(f"  missing: {asset['src']}")
        return

    with Image.open(source) as im:
        icc = im.info.get("icc_profile")
        im = im.convert("RGBA") if im.mode in ("P", "LA", "RGBA") else im.convert("RGB")
        if im.mode == "RGBA" and im.getchannel("A").getextrema()[0] == 255:
            im = im.convert("RGB")
        width, height = im.size
        asset["width"], asset["height"] = width, height

        made = []
        for target in WIDTHS:
            # Never upscale: once the full width has been written, stop.
            if made and made[-1] == width:
                break
            w = min(target, width)
            out = web_path(asset["src"], w)
            out.parent.mkdir(parents=True, exist_ok=True)
            if not out.exists() or out.stat().st_mtime < source.stat().st_mtime:
                h = round(height * w / width)
                resized = im if w == width else im.resize((w, h), Image.LANCZOS)
                kwargs = {"quality": QUALITY, "method": 6}
                if icc:
                    kwargs["icc_profile"] = icc
                resized.save(out, "WEBP", **kwargs)
            made.append(w)
        asset["web"] = made


def main() -> None:
    data = json.loads(DATA.read_text())
    for project in data["projects"]:
        for asset in project.get("assets", []):
            process(asset)
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print("done")


if __name__ == "__main__":
    main()
