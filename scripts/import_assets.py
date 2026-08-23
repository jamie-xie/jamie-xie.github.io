#!/usr/bin/env python3
"""Re-import master assets from the Desktop folder into the repo.

Trims transparent margins, resizes for web, and compresses:
  denim.png          -> assets/denim.webp          (logo, 720px wide)
  waxtulips.png      -> assets/waxtulips.png       (seal, 320px wide)
  waxtulipsmenu.png  -> assets/waxtulipsmenu.png   (menu icon, 256px wide)

Run from anywhere:  python3 scripts/import_assets.py
Masters live in:    ~/Desktop/websites/jamie website/
"""
from pathlib import Path
from PIL import Image
import os

MASTERS = Path.home() / "Desktop" / "websites" / "jamie website"
ASSETS = Path(__file__).resolve().parent.parent / "assets"


def trim(img, pad=2):
    bbox = img.convert("RGBA").getchannel("A").getbbox()
    if not bbox:
        return img
    l, t, r, b = bbox
    return img.crop((max(0, l - pad), max(0, t - pad),
                     min(img.width, r + pad), min(img.height, b + pad)))


def shrink(img, max_w):
    if img.width > max_w:
        img = img.resize((max_w, round(img.height * max_w / img.width)),
                         Image.LANCZOS)
    return img


def main():
    logo = shrink(trim(Image.open(MASTERS / "denim.png").convert("RGBA")), 720)
    logo.save(ASSETS / "denim.webp", "WEBP", quality=88, method=6)
    print("denim.webp:", logo.size, os.path.getsize(ASSETS / "denim.webp"), "bytes")

    seal = shrink(trim(Image.open(MASTERS / "waxtulips.png").convert("RGBA")), 320)
    seal.save(ASSETS / "waxtulips.png", optimize=True)
    print("waxtulips.png:", seal.size, os.path.getsize(ASSETS / "waxtulips.png"), "bytes")

    menu = shrink(trim(Image.open(MASTERS / "waxtulipsmenu.png").convert("RGBA")), 256)
    menu.save(ASSETS / "waxtulipsmenu.png", optimize=True)
    print("waxtulipsmenu.png:", menu.size, os.path.getsize(ASSETS / "waxtulipsmenu.png"), "bytes")


if __name__ == "__main__":
    main()
