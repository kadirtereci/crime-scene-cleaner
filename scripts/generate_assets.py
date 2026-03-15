#!/usr/bin/env python3
"""Generate MVP placeholder assets for Crime Scene Cleaner"""

from PIL import Image, ImageDraw, ImageFilter
import random
import math
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(BASE, "assets")

random.seed(42)


def make_dirs():
    for d in ["environment", "stains", "tools", "ui"]:
        os.makedirs(os.path.join(ASSETS, d), exist_ok=True)


# ─── Floor texture ───────────────────────────────────────────
def gen_floor():
    W, H = 512, 512
    img = Image.new("RGB", (W, H), (60, 40, 28))
    draw = ImageDraw.Draw(img)

    plank_h = 64
    for y in range(0, H, plank_h):
        # Slightly different color per plank row
        r = random.randint(50, 75)
        g = random.randint(32, 50)
        b = random.randint(20, 35)

        # Draw plank
        draw.rectangle([0, y, W, y + plank_h - 2], fill=(r, g, b))

        # Horizontal grain lines
        for _ in range(8):
            ly = y + random.randint(4, plank_h - 6)
            shade = random.randint(-15, 15)
            draw.line(
                [(0, ly), (W, ly)],
                fill=(r + shade, g + shade, b + shade),
                width=1,
            )

        # Gap between planks
        draw.rectangle([0, y + plank_h - 2, W, y + plank_h], fill=(30, 20, 12))

        # Vertical joints (staggered)
        offset = (y // plank_h) % 2 * 128
        for x in range(offset, W, 256):
            jx = x + random.randint(-5, 5)
            draw.rectangle([jx, y, jx + 2, y + plank_h - 2], fill=(35, 24, 15))

    # Add subtle noise
    for _ in range(3000):
        px = random.randint(0, W - 1)
        py = random.randint(0, H - 1)
        c = img.getpixel((px, py))
        n = random.randint(-12, 12)
        img.putpixel((px, py), (max(0, min(255, c[0] + n)),
                                 max(0, min(255, c[1] + n)),
                                 max(0, min(255, c[2] + n))))

    img.save(os.path.join(ASSETS, "environment", "floor-texture.png"))
    print("✓ floor-texture.png")


# ─── Wall background ─────────────────────────────────────────
def gen_wall():
    W, H = 512, 128
    img = Image.new("RGB", (W, H), (55, 55, 62))
    draw = ImageDraw.Draw(img)

    # Concrete-like noise
    for x in range(W):
        for y in range(H):
            n = random.randint(-10, 10)
            base = img.getpixel((x, y))
            img.putpixel((x, y), (base[0] + n, base[1] + n, base[2] + n))

    # Some cracks
    for _ in range(4):
        sx = random.randint(0, W)
        sy = random.randint(0, H)
        for step in range(random.randint(20, 60)):
            sx += random.randint(-3, 3)
            sy += random.randint(-1, 2)
            if 0 <= sx < W and 0 <= sy < H:
                draw.rectangle([sx, sy, sx + 1, sy + 1], fill=(38, 38, 42))

    # Baseboard
    draw.rectangle([0, H - 16, W, H], fill=(40, 30, 22))
    draw.line([(0, H - 16), (W, H - 16)], fill=(30, 22, 15), width=2)

    img.save(os.path.join(ASSETS, "environment", "wall-background.png"))
    print("✓ wall-background.png")


# ─── Blood stain ──────────────────────────────────────────────
def gen_blood_stain():
    S = 128
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = S // 2, S // 2

    # Main splatter - irregular ellipses
    for _ in range(6):
        ox = random.randint(-15, 15)
        oy = random.randint(-15, 15)
        rx = random.randint(15, 35)
        ry = random.randint(15, 35)
        r = random.randint(120, 180)
        g = random.randint(5, 30)
        b = random.randint(5, 25)
        a = random.randint(180, 240)
        draw.ellipse(
            [cx + ox - rx, cy + oy - ry, cx + ox + rx, cy + oy + ry],
            fill=(r, g, b, a),
        )

    # Small droplets around
    for _ in range(12):
        dx = random.randint(-45, 45)
        dy = random.randint(-45, 45)
        dr = random.randint(3, 8)
        r = random.randint(130, 170)
        draw.ellipse(
            [cx + dx - dr, cy + dy - dr, cx + dx + dr, cy + dy + dr],
            fill=(r, 10, 10, random.randint(150, 220)),
        )

    # Blur slightly for organic look
    img = img.filter(ImageFilter.GaussianBlur(radius=1.5))

    img.save(os.path.join(ASSETS, "stains", "blood-stain.png"))
    print("✓ blood-stain.png")


# ─── Broken glass ────────────────────────────────────────────
def gen_broken_glass():
    S = 128
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = S // 2, S // 2

    # Glass shards
    for _ in range(8):
        # Random triangle shard
        angle = random.uniform(0, 2 * math.pi)
        dist = random.randint(5, 35)
        px = cx + int(math.cos(angle) * dist)
        py = cy + int(math.sin(angle) * dist)

        shard_size = random.randint(8, 22)
        points = []
        base_angle = random.uniform(0, 2 * math.pi)
        for i in range(random.choice([3, 4, 5])):
            a = base_angle + i * (2 * math.pi / random.choice([3, 4, 5]))
            r = random.randint(shard_size // 2, shard_size)
            points.append((px + int(math.cos(a) * r), py + int(math.sin(a) * r)))

        # Light blue glass with alpha
        r = random.randint(180, 230)
        g = random.randint(210, 240)
        b = random.randint(235, 255)
        alpha = random.randint(120, 200)
        draw.polygon(points, fill=(r, g, b, alpha), outline=(200, 220, 240, 220))

    # Highlight spots
    for _ in range(5):
        hx = cx + random.randint(-25, 25)
        hy = cy + random.randint(-25, 25)
        hr = random.randint(2, 4)
        draw.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=(255, 255, 255, 180))

    img.save(os.path.join(ASSETS, "stains", "broken-glass.png"))
    print("✓ broken-glass.png")


# ─── Mop ──────────────────────────────────────────────────────
def gen_mop():
    W, H = 64, 192
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Handle
    handle_w = 8
    hx = W // 2
    draw.rectangle(
        [hx - handle_w // 2, 10, hx + handle_w // 2, H - 50],
        fill=(160, 120, 70, 255),
    )
    # Handle grain lines
    for y in range(15, H - 55, 8):
        draw.line(
            [(hx - handle_w // 2 + 1, y), (hx + handle_w // 2 - 1, y)],
            fill=(140, 100, 55, 100),
            width=1,
        )

    # Handle cap
    draw.ellipse([hx - 6, 6, hx + 6, 18], fill=(100, 80, 50, 255))

    # Mop head connector
    draw.rectangle([hx - 12, H - 55, hx + 12, H - 45], fill=(130, 130, 135, 255))

    # Mop head (fuzzy strands)
    mop_top = H - 48
    mop_bot = H - 5
    for x in range(hx - 24, hx + 24, 3):
        offset = random.randint(-2, 2)
        gray = random.randint(200, 240)
        draw.rectangle(
            [x + offset, mop_top, x + offset + 3, mop_bot + random.randint(-5, 5)],
            fill=(gray, gray, gray, 230),
        )

    # Slightly blur the mop head for softness
    img = img.filter(ImageFilter.GaussianBlur(radius=0.5))

    img.save(os.path.join(ASSETS, "tools", "mop.png"))
    print("✓ mop.png")


# ─── Run all ──────────────────────────────────────────────────
if __name__ == "__main__":
    make_dirs()
    gen_floor()
    gen_wall()
    gen_blood_stain()
    gen_broken_glass()
    gen_mop()
    print("\n🎮 All MVP assets generated!")
