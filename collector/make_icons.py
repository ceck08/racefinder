#!/usr/bin/env python3
"""Genera le icone PWA di RaceFinder dal marchio (saetta arancione su fondo scuro)."""
from PIL import Image, ImageDraw

DARK = (16, 30, 40, 255)       # --dark
ACCENT = (209, 80, 41, 255)    # #d15029
BOLT = [(48, 0), (100, 0), (69, 41), (95, 41), (29, 100), (44, 55), (12, 55)]

def bolt_points(size, scale, cx=0.5, cy=0.5):
    w = size * scale
    return [(cx * size + (x / 100 - 0.5) * w, cy * size + (y / 100 - 0.5) * w) for x, y in BOLT]

def rounded(size, radius):
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size, size], radius=radius, fill=255)
    return mask

def icon(size, scale, rounded_corners):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg = Image.new("RGBA", (size, size), DARK)
    d = ImageDraw.Draw(bg)
    d.polygon(bolt_points(size, scale), fill=ACCENT)
    if rounded_corners:
        img.paste(bg, (0, 0), rounded(size, int(size * 0.22)))
    else:
        img.paste(bg, (0, 0))
    return img

# icone standard (angoli arrotondati, saetta grande)
for px in (192, 512):
    icon(px, 0.62, True).save(f"docs/icon-{px}.png")
# maskable: fondo pieno, saetta nella safe zone
icon(512, 0.46, False).save("docs/icon-maskable-512.png")
# apple touch icon 180
icon(180, 0.62, True).save("docs/apple-touch-icon.png")
# favicon 32
icon(32, 0.68, True).save("docs/favicon-32.png")
print("icone generate")
