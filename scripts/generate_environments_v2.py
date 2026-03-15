#!/usr/bin/env python3
"""Generate high-quality environment textures for Crime Scene Cleaner"""

from PIL import Image, ImageDraw, ImageFilter
import random
import math
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(BASE, "assets", "environment")

random.seed(55)

# ══════════════════════════════════════════════════════════════
# APARTMENT — Dark hardwood floor + moody wallpaper
# ══════════════════════════════════════════════════════════════

def gen_apartment_floor():
    W, H = 1024, 1024
    # Warm dark brown base
    img = Image.new("RGB", (W, H), (58, 42, 30))
    draw = ImageDraw.Draw(img)

    plank_h = 56
    for y in range(0, H, plank_h):
        # Fixed warm brown ratio (1.0 : 0.72 : 0.50) with brightness variation only
        brightness = random.randint(58, 78)
        base_r = brightness
        base_g = int(brightness * 0.72)
        base_b = int(brightness * 0.50)

        # Fill plank
        draw.rectangle([0, y, W, y + plank_h - 2], fill=(base_r, base_g, base_b))

        # Horizontal wood grain — multiple fine lines
        for _ in range(14):
            ly = y + random.randint(3, plank_h - 5)
            shade = random.randint(-8, 8)
            draw.line(
                [(0, ly), (W, ly)],
                fill=(base_r + shade, base_g + shade, base_b + shade),
                width=1,
            )

        # Darker grain streaks (longer, subtle)
        for _ in range(3):
            ly = y + random.randint(5, plank_h - 7)
            x_start = random.randint(0, W - 200)
            x_end = x_start + random.randint(100, 300)
            draw.line(
                [(x_start, ly), (x_end, ly)],
                fill=(base_r - 12, base_g - 10, base_b - 8),
                width=1,
            )

        # Varnish highlights (warm, subtle)
        for _ in range(2):
            vy = y + random.randint(8, plank_h - 10)
            vx_start = random.randint(0, W - 150)
            vx_end = vx_start + random.randint(60, 150)
            draw.line(
                [(vx_start, vy), (vx_end, vy)],
                fill=(base_r + 15, base_g + 12, base_b + 10),
                width=1,
            )

        # Knots (small, dark, oval)
        for _ in range(random.randint(2, 4)):
            kx = random.randint(30, W - 30)
            ky = y + random.randint(10, plank_h - 12)
            krx = random.randint(4, 7)
            kry = random.randint(3, 5)
            draw.ellipse(
                [kx - krx, ky - kry, kx + krx, ky + kry],
                fill=(base_r - 18, base_g - 14, base_b - 12),
            )
            # Ring around knot
            draw.ellipse(
                [kx - krx - 1, ky - kry - 1, kx + krx + 1, ky + kry + 1],
                outline=(base_r - 10, base_g - 8, base_b - 6),
            )

        # Plank gap (dark seam)
        draw.rectangle([0, y + plank_h - 2, W, y + plank_h], fill=(32, 22, 15))

        # Staggered vertical joints
        offset = (y // plank_h) % 2 * 160
        for x in range(offset, W, 320):
            jx = x + random.randint(-3, 3)
            draw.rectangle([jx, y, jx + 2, y + plank_h - 2], fill=(38, 26, 18))

    # Fine noise for texture
    for _ in range(6000):
        px = random.randint(0, W - 1)
        py = random.randint(0, H - 1)
        c = img.getpixel((px, py))
        n = random.randint(-6, 6)
        img.putpixel((px, py), tuple(max(0, min(255, v + n)) for v in c))

    img.save(os.path.join(ASSETS, "apartment", "floor.png"))
    print("✓ apartment/floor.png")


def gen_apartment_wall():
    W, H = 1024, 256
    # Dark moody wallpaper
    img = Image.new("RGB", (W, H), (52, 48, 58))
    draw = ImageDraw.Draw(img)

    # Subtle noise
    for x in range(0, W, 2):
        for y in range(0, H - 28, 2):
            n = random.randint(-5, 5)
            base = img.getpixel((x, y))
            img.putpixel((x, y), tuple(max(0, min(255, c + n)) for c in base))

    # Wallpaper stripe pattern (vertical, subtle)
    for x in range(0, W, 40):
        shade = random.choice([-3, -2, 0, 2, 3])
        draw.line([(x, 0), (x, H - 28)], fill=(52 + shade, 48 + shade, 58 + shade), width=1)

    # Diamond/damask pattern overlay (very subtle)
    for x in range(0, W, 80):
        for y in range(0, H - 28, 80):
            cx_d = x + 40
            cy_d = y + 40
            pts = [(cx_d, cy_d - 15), (cx_d + 10, cy_d), (cx_d, cy_d + 15), (cx_d - 10, cy_d)]
            draw.polygon(pts, outline=(56, 52, 62))

    # Crown molding line
    draw.line([(0, H - 30), (W, H - 30)], fill=(60, 55, 65), width=1)

    # Dark wood baseboard
    draw.rectangle([0, H - 28, W, H], fill=(42, 30, 22))
    draw.line([(0, H - 28), (W, H - 28)], fill=(35, 24, 16), width=2)
    # Baseboard detail
    draw.line([(0, H - 20), (W, H - 20)], fill=(48, 35, 26), width=1)

    img.save(os.path.join(ASSETS, "apartment", "wall.png"))
    print("✓ apartment/wall.png")


# ══════════════════════════════════════════════════════════════
# WAREHOUSE — Clean concrete floor + industrial brick wall
# ══════════════════════════════════════════════════════════════

def gen_warehouse_floor():
    W, H = 1024, 1024
    # Uniform medium-dark concrete
    img = Image.new("RGB", (W, H), (105, 102, 98))
    draw = ImageDraw.Draw(img)

    # Fine concrete texture noise
    for x in range(0, W, 2):
        for y in range(0, H, 2):
            n = random.randint(-6, 6)
            base = (105 + n, 102 + n, 98 + n)
            draw.rectangle([x, y, x + 1, y + 1], fill=tuple(max(0, min(255, c)) for c in base))

    # Subtle aggregate spots (tiny, not confused with stains)
    for _ in range(200):
        sx = random.randint(0, W - 1)
        sy = random.randint(0, H - 1)
        sr = random.randint(1, 3)
        shade = random.randint(-12, -4)
        draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr],
                     fill=(105 + shade, 102 + shade, 98 + shade))

    # Control joints (concrete slab lines — thin, regular)
    for x in range(0, W, 256):
        # Slightly wandering line
        pts = []
        for y in range(0, H, 8):
            pts.append((x + random.randint(-1, 1), y))
        for i in range(len(pts) - 1):
            draw.line([pts[i], pts[i + 1]], fill=(88, 85, 82), width=1)
    for y in range(0, H, 256):
        pts = []
        for x in range(0, W, 8):
            pts.append((x, y + random.randint(-1, 1)))
        for i in range(len(pts) - 1):
            draw.line([pts[i], pts[i + 1]], fill=(88, 85, 82), width=1)

    # Very fine hairline cracks (thin, not distracting)
    for _ in range(6):
        sx = random.randint(0, W)
        sy = random.randint(0, H)
        angle = random.uniform(0, math.pi * 2)
        for step in range(random.randint(30, 80)):
            sx += math.cos(angle) + random.uniform(-0.5, 0.5)
            sy += math.sin(angle) + random.uniform(-0.5, 0.5)
            angle += random.uniform(-0.1, 0.1)
            if 0 <= int(sx) < W and 0 <= int(sy) < H:
                draw.point((int(sx), int(sy)), fill=(78, 76, 72))

    # Subtle scuff marks (very light, not oil stains)
    for _ in range(5):
        sx = random.randint(50, W - 50)
        sy = random.randint(50, H - 50)
        angle = random.uniform(0, math.pi)
        length = random.randint(20, 50)
        for step in range(length):
            px = int(sx + math.cos(angle) * step)
            py = int(sy + math.sin(angle) * step)
            if 0 <= px < W and 0 <= py < H:
                draw.point((px, py), fill=(98, 95, 92))

    img.save(os.path.join(ASSETS, "warehouse", "floor.png"))
    print("✓ warehouse/floor.png")


def gen_warehouse_wall():
    W, H = 1024, 256
    # Industrial brick — muted reds/browns, not saturated
    img = Image.new("RGB", (W, H), (75, 68, 62))
    draw = ImageDraw.Draw(img)

    brick_h = 28
    brick_w = 60
    mortar = (65, 60, 55)

    # Fill mortar base
    draw.rectangle([0, 0, W, H - 32], fill=mortar)

    for row_idx, row_y in enumerate(range(0, H - 32, brick_h)):
        offset = (row_idx % 2) * (brick_w // 2)
        for col_x in range(offset - brick_w, W + brick_w, brick_w):
            # Muted brick — fixed warm ratio with brightness variation only
            brightness = random.randint(78, 108)
            r = brightness
            g = int(brightness * 0.72)
            b = int(brightness * 0.62)
            x1 = col_x + 2
            y1 = row_y + 2
            x2 = col_x + brick_w - 2
            y2 = row_y + brick_h - 2
            draw.rectangle([x1, y1, x2, y2], fill=(r, g, b))

            # Brick texture variation
            for _ in range(3):
                tx = random.randint(x1, max(x1, x2 - 1))
                ty = random.randint(y1, max(y1, y2 - 1))
                n = random.randint(-8, 8)
                draw.rectangle([tx, ty, tx + 2, ty + 1], fill=(r + n, g + n, b + n))

    # Metal baseboard
    draw.rectangle([0, H - 32, W, H], fill=(72, 74, 78))
    draw.line([(0, H - 32), (W, H - 32)], fill=(58, 60, 64), width=2)
    # Bolts
    for x in range(32, W, 80):
        draw.ellipse([x - 4, H - 24, x + 4, H - 16], fill=(62, 64, 68))
        draw.ellipse([x - 2, H - 22, x + 2, H - 18], fill=(78, 80, 84))

    img.save(os.path.join(ASSETS, "warehouse", "wall.png"))
    print("✓ warehouse/wall.png")


# ══════════════════════════════════════════════════════════════
# OFFICE — Commercial carpet tile floor + clean painted wall
# ══════════════════════════════════════════════════════════════

def gen_office_floor():
    W, H = 1024, 1024
    # Dark blue-gray carpet base
    img = Image.new("RGB", (W, H), (55, 58, 72))
    draw = ImageDraw.Draw(img)

    tile_size = 128

    for tx in range(0, W, tile_size):
        for ty in range(0, H, tile_size):
            # Per-tile slight color shift
            tile_shift = random.randint(-4, 4)
            base_r = 55 + tile_shift
            base_g = 58 + tile_shift
            base_b = 72 + tile_shift

            # Carpet fiber texture
            for x in range(tx, min(tx + tile_size, W), 3):
                for y in range(ty, min(ty + tile_size, H), 3):
                    n = random.randint(-10, 10)
                    draw.rectangle(
                        [x, y, x + 2, y + 2],
                        fill=(
                            max(0, min(255, base_r + n)),
                            max(0, min(255, base_g + n)),
                            max(0, min(255, base_b + n)),
                        ),
                    )

            # Subtle cross-hatch weave pattern
            for d in range(0, tile_size * 2, 16):
                # Forward diagonal
                x0 = tx + d
                y0 = ty
                x1 = tx
                y1 = ty + d
                draw.line(
                    [
                        (max(tx, min(tx + tile_size - 1, x0)), max(ty, min(ty + tile_size - 1, y0))),
                        (max(tx, min(tx + tile_size - 1, x1)), max(ty, min(ty + tile_size - 1, y1))),
                    ],
                    fill=(base_r - 4, base_g - 4, base_b - 4),
                    width=1,
                )

    # Carpet tile seams (subtle grid)
    for x in range(0, W, tile_size):
        draw.line([(x, 0), (x, H)], fill=(48, 50, 64), width=1)
    for y in range(0, H, tile_size):
        draw.line([(0, y), (W, y)], fill=(48, 50, 64), width=1)

    # Very subtle wear paths (lighter streaks)
    for _ in range(3):
        px = random.randint(100, W - 100)
        for y in range(0, H):
            n = random.randint(0, 5)
            if 0 <= px < W:
                c = img.getpixel((px, y))
                img.putpixel((px + random.randint(-2, 2), y),
                             tuple(min(255, v + n) for v in c))

    img.save(os.path.join(ASSETS, "office", "floor.png"))
    print("✓ office/floor.png")


def gen_office_wall():
    W, H = 1024, 256
    # Clean off-white/light gray paint
    img = Image.new("RGB", (W, H), (195, 192, 186))
    draw = ImageDraw.Draw(img)

    # Very subtle paint texture
    for x in range(0, W, 2):
        for y in range(0, H - 36, 2):
            n = random.randint(-3, 3)
            base = img.getpixel((x, y))
            img.putpixel((x, y), tuple(max(0, min(255, c + n)) for c in base))

    # Subtle horizontal paint roller lines
    for y in range(0, H - 36, 24):
        draw.line([(0, y), (W, y)], fill=(192, 189, 183), width=1)

    # Chair rail / accent line
    draw.line([(0, H - 80), (W, H - 80)], fill=(180, 177, 172), width=2)
    draw.line([(0, H - 78), (W, H - 78)], fill=(200, 197, 192), width=1)

    # White baseboard (detailed)
    draw.rectangle([0, H - 36, W, H], fill=(225, 222, 218))
    draw.line([(0, H - 36), (W, H - 36)], fill=(210, 207, 202), width=2)
    # Baseboard profile lines
    draw.line([(0, H - 30), (W, H - 30)], fill=(218, 215, 210), width=1)
    draw.line([(0, H - 24), (W, H - 24)], fill=(230, 228, 224), width=1)
    draw.line([(0, H - 14), (W, H - 14)], fill=(215, 212, 208), width=1)

    img.save(os.path.join(ASSETS, "office", "wall.png"))
    print("✓ office/wall.png")


if __name__ == "__main__":
    gen_apartment_floor()
    gen_apartment_wall()
    gen_warehouse_floor()
    gen_warehouse_wall()
    gen_office_floor()
    gen_office_wall()
    print("\n✅ All v2 environment textures generated!")
