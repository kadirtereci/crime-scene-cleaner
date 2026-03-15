#!/usr/bin/env python3
"""Generate Phase 2 assets for Crime Scene Cleaner"""

from PIL import Image, ImageDraw, ImageFilter
import random
import math
import os

BASE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(BASE, "assets")
random.seed(99)

# ══════════════════════════════════════════════════════════════
# NEW STAIN TYPES
# ══════════════════════════════════════════════════════════════

def gen_trash():
    """Crumpled paper / garbage pile"""
    S = 128
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = S // 2, S // 2

    # Brown bag base
    for _ in range(4):
        ox, oy = random.randint(-18, 18), random.randint(-18, 18)
        rx, ry = random.randint(18, 32), random.randint(14, 28)
        r = random.randint(140, 175)
        g = random.randint(110, 140)
        b = random.randint(60, 90)
        draw.ellipse([cx+ox-rx, cy+oy-ry, cx+ox+rx, cy+oy+ry], fill=(r,g,b,220))

    # Crumple lines
    for _ in range(8):
        sx = cx + random.randint(-25, 25)
        sy = cy + random.randint(-25, 25)
        ex = sx + random.randint(-15, 15)
        ey = sy + random.randint(-15, 15)
        draw.line([(sx,sy),(ex,ey)], fill=(100,80,45,150), width=2)

    # Small colored bits (candy wrapper, etc)
    for _ in range(5):
        bx = cx + random.randint(-30, 30)
        by = cy + random.randint(-30, 30)
        br = random.randint(4, 8)
        color = random.choice([(220,50,50,200),(50,120,220,200),(220,200,40,200),(200,60,180,200)])
        draw.ellipse([bx-br, by-br, bx+br, by+br], fill=color)

    img = img.filter(ImageFilter.GaussianBlur(radius=1))
    img.save(os.path.join(ASSETS, "stains", "trash.png"))
    print("✓ trash.png")


def gen_evidence():
    """Yellow evidence marker + small object"""
    S = 128
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = S // 2, S // 2

    # Evidence item (small dark object - like a wallet/phone)
    draw.rounded_rectangle([cx-20, cy-12, cx+20, cy+12], radius=4, fill=(40,40,50,220))
    draw.rectangle([cx-16, cy-8, cx+16, cy+8], fill=(60,60,75,200))
    # Screen glint
    draw.rectangle([cx-12, cy-5, cx+10, cy+5], fill=(80,90,110,180))

    # Evidence marker triangle (yellow)
    marker_x = cx + 22
    marker_y = cy - 20
    points = [(marker_x, marker_y-18), (marker_x-12, marker_y+10), (marker_x+12, marker_y+10)]
    draw.polygon(points, fill=(255,220,40,230), outline=(200,170,20,255))
    # Number on marker
    draw.text((marker_x-4, marker_y-8), "1", fill=(30,30,30,255))

    img.save(os.path.join(ASSETS, "stains", "evidence.png"))
    print("✓ evidence.png")


def gen_broken_furniture():
    """Broken chair/table pieces"""
    S = 128
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = S // 2, S // 2

    # Table/chair leg pieces scattered
    wood_colors = [(130,90,50),(140,100,55),(120,80,45),(150,110,60)]

    # Main broken plank
    draw.polygon([(cx-30, cy-8),(cx+25, cy-12),(cx+28, cy+5),(cx-28, cy+8)],
                 fill=random.choice(wood_colors) + (230,))

    # Broken leg
    angle = 0.4
    for i in range(3):
        lx = cx + random.randint(-35, 35)
        ly = cy + random.randint(-25, 25)
        length = random.randint(20, 40)
        w = random.randint(5, 9)
        a = random.uniform(-0.8, 0.8)
        ex = lx + int(math.cos(a) * length)
        ey = ly + int(math.sin(a) * length)
        col = random.choice(wood_colors) + (220,)
        draw.line([(lx,ly),(ex,ey)], fill=col, width=w)

    # Splinters
    for _ in range(6):
        sx = cx + random.randint(-35, 35)
        sy = cy + random.randint(-25, 25)
        sl = random.randint(5, 15)
        sa = random.uniform(0, math.pi*2)
        ex = sx + int(math.cos(sa)*sl)
        ey = sy + int(math.sin(sa)*sl)
        draw.line([(sx,sy),(ex,ey)], fill=(120,85,40,180), width=2)

    # Nails
    for _ in range(2):
        nx = cx + random.randint(-30, 30)
        ny = cy + random.randint(-20, 20)
        draw.ellipse([nx-2,ny-2,nx+2,ny+2], fill=(160,160,170,220))
        draw.line([(nx,ny),(nx+random.randint(-6,6),ny+random.randint(-6,6))],
                  fill=(160,160,170,200), width=2)

    img = img.filter(ImageFilter.GaussianBlur(radius=0.7))
    img.save(os.path.join(ASSETS, "stains", "broken-furniture.png"))
    print("✓ broken-furniture.png")


# ══════════════════════════════════════════════════════════════
# NEW TOOLS
# ══════════════════════════════════════════════════════════════

def gen_scrub_brush():
    W, H = 64, 160
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx = W // 2

    # Handle
    draw.rounded_rectangle([cx-7, 8, cx+7, H-65], radius=4, fill=(45,120,180,255))
    # Grip lines
    for y in range(20, H-75, 6):
        draw.line([(cx-6,y),(cx+6,y)], fill=(35,100,155,150), width=1)

    # Brush head base
    draw.rounded_rectangle([cx-18, H-65, cx+18, H-35], radius=6, fill=(60,60,65,255))

    # Bristles
    for x in range(cx-16, cx+16, 3):
        bl = H - 35 + random.randint(0, 3)
        bh = H - 8 + random.randint(-5, 5)
        gray = random.randint(210, 250)
        draw.rectangle([x, bl, x+2, bh], fill=(gray, gray, gray, 230))

    img.save(os.path.join(ASSETS, "tools", "scrub-brush.png"))
    print("✓ scrub-brush.png")


def gen_trash_bag():
    W, H = 80, 120
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = W // 2, H // 2 + 10

    # Black bag body
    draw.ellipse([cx-32, cy-30, cx+32, cy+30], fill=(30,30,35,240))
    draw.ellipse([cx-28, cy-35, cx+28, cy+20], fill=(40,40,48,230))

    # Tied top
    draw.polygon([(cx-8, cy-32),(cx, cy-48),(cx+8, cy-32)], fill=(35,35,40,240))
    # Knot
    draw.ellipse([cx-5, cy-50, cx+5, cy-42], fill=(45,45,50,240))

    # Highlight/shine
    draw.arc([cx-20, cy-25, cx+5, cy+10], 200, 320, fill=(70,70,80,150), width=2)

    # Wrinkle lines
    for _ in range(4):
        sx = cx + random.randint(-20, 20)
        sy = cy + random.randint(-15, 20)
        ex = sx + random.randint(-12, 12)
        ey = sy + random.randint(-8, 8)
        draw.line([(sx,sy),(ex,ey)], fill=(22,22,28,120), width=1)

    img.save(os.path.join(ASSETS, "tools", "trash-bag.png"))
    print("✓ trash-bag.png")


def gen_repair_kit():
    W, H = 80, 100
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = W // 2, H // 2

    # Toolbox body
    draw.rounded_rectangle([cx-32, cy-15, cx+32, cy+22], radius=4, fill=(180,45,40,240))
    # Lid
    draw.rounded_rectangle([cx-34, cy-20, cx+34, cy-10], radius=3, fill=(200,55,50,240))
    # Handle
    draw.rounded_rectangle([cx-12, cy-32, cx+12, cy-18], radius=6, fill=(80,80,85,240), outline=(60,60,65,255))
    # Latch
    draw.rounded_rectangle([cx-5, cy-12, cx+5, cy-8], radius=2, fill=(220,200,50,240))
    # Cross (repair)
    draw.rectangle([cx-2, cy-2, cx+2, cy+14], fill=(240,240,240,220))
    draw.rectangle([cx-8, cy+4, cx+8, cy+8], fill=(240,240,240,220))

    img.save(os.path.join(ASSETS, "tools", "repair-kit.png"))
    print("✓ repair-kit.png")


def gen_spray():
    W, H = 56, 160
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx = W // 2

    # Bottle body
    draw.rounded_rectangle([cx-16, 50, cx+16, H-10], radius=8, fill=(60,160,120,240))
    # Label
    draw.rounded_rectangle([cx-14, 70, cx+14, 110], radius=3, fill=(240,240,240,200))
    # Skull warning icon (simplified)
    draw.ellipse([cx-6, 78, cx+6, 92], fill=(40,40,40,200))
    draw.rectangle([cx-3, 92, cx+3, 100], fill=(40,40,40,200))

    # Nozzle
    draw.rounded_rectangle([cx-10, 35, cx+10, 55], radius=3, fill=(50,50,55,240))
    # Trigger
    draw.polygon([(cx+10, 42),(cx+22, 48),(cx+20, 56),(cx+10, 52)], fill=(55,55,60,240))
    # Nozzle tip
    draw.rectangle([cx-4, 28, cx+4, 38], fill=(60,60,65,240))
    draw.ellipse([cx-5, 25, cx+5, 32], fill=(65,65,70,240))

    # Spray mist (dots)
    for _ in range(12):
        mx = cx + random.randint(-18, 18)
        my = random.randint(5, 28)
        mr = random.randint(1, 3)
        draw.ellipse([mx-mr, my-mr, mx+mr, my+mr], fill=(180,230,210,random.randint(60,130)))

    img.save(os.path.join(ASSETS, "tools", "spray.png"))
    print("✓ spray.png")


# ══════════════════════════════════════════════════════════════
# NEW ENVIRONMENTS (floor textures)
# ══════════════════════════════════════════════════════════════

def gen_warehouse_floor():
    W, H = 1024, 1024
    img = Image.new("RGB", (W, H), (130, 130, 125))
    draw = ImageDraw.Draw(img)

    # Concrete floor with cracks
    for x in range(0, W, 2):
        for y in range(0, H, 2):
            n = random.randint(-8, 8)
            base = img.getpixel((x, y))
            img.putpixel((x, y), tuple(max(0,min(255,c+n)) for c in base))

    # Oil stains (dark patches)
    for _ in range(8):
        ox = random.randint(50, W-50)
        oy = random.randint(50, H-50)
        rx = random.randint(30, 80)
        ry = random.randint(20, 70)
        draw.ellipse([ox-rx,oy-ry,ox+rx,oy+ry], fill=(95,90,85))

    # Rust patches
    for _ in range(random.randint(4, 6)):
        rx_pos = random.randint(60, W-60)
        ry_pos = random.randint(60, H-60)
        rrx = random.randint(15, 40)
        rry = random.randint(10, 30)
        rust_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        rust_draw = ImageDraw.Draw(rust_img)
        rust_draw.ellipse([rx_pos-rrx, ry_pos-rry, rx_pos+rrx, ry_pos+rry],
                          fill=(160, 90, 50, 60))
        img = Image.alpha_composite(img.convert("RGBA"), rust_img).convert("RGB")
        draw = ImageDraw.Draw(img)

    # Grid lines (warehouse floor markings)
    for x in range(0, W, 256):
        draw.line([(x,0),(x,H)], fill=(110,110,105), width=2)
    for y in range(0, H, 256):
        draw.line([(0,y),(W,y)], fill=(110,110,105), width=2)

    # Cracks
    for _ in range(10):
        sx = random.randint(0, W)
        sy = random.randint(0, H)
        for _ in range(random.randint(25, 60)):
            sx += random.randint(-4, 4)
            sy += random.randint(-2, 3)
            if 0 <= sx < W and 0 <= sy < H:
                draw.rectangle([sx,sy,sx+1,sy+1], fill=(85,82,78))

    # Drainage grate
    gx = random.randint(100, W-150)
    gy = random.randint(100, H-150)
    gw, gh = 80, 60
    draw.rectangle([gx, gy, gx+gw, gy+gh], fill=(70, 70, 68), outline=(55, 55, 52), width=2)
    for lx in range(gx+6, gx+gw-4, 8):
        draw.line([(lx, gy+4), (lx, gy+gh-4)], fill=(55, 55, 52), width=2)

    img.save(os.path.join(ASSETS, "environment", "warehouse", "floor.png"))
    print("✓ warehouse/floor.png")


def gen_office_floor():
    W, H = 1024, 1024
    # Carpet-like texture
    img = Image.new("RGB", (W, H), (70, 75, 95))
    draw = ImageDraw.Draw(img)

    # Carpet weave pattern with per-tile color variation
    tile_size = 128
    for tx in range(0, W, tile_size):
        for ty in range(0, H, tile_size):
            tile_offset = random.randint(-5, 5)
            for x in range(tx, min(tx+tile_size, W), 4):
                for y in range(ty, min(ty+tile_size, H), 4):
                    n = random.randint(-18, 18)
                    base = (70+n+tile_offset, 75+n+tile_offset, 95+n+tile_offset)
                    draw.rectangle([x, y, x+3, y+3], fill=tuple(max(0,min(255,c)) for c in base))

            # Subtle diagonal weave lines within each tile
            for d in range(0, tile_size*2, 12):
                x0 = tx + d
                y0 = ty
                x1 = tx
                y1 = ty + d
                draw.line([(max(tx,min(tx+tile_size-1,x0)), max(ty,min(ty+tile_size-1,y0))),
                           (max(tx,min(tx+tile_size-1,x1)), max(ty,min(ty+tile_size-1,y1)))],
                          fill=(65, 70, 88), width=1)

    # Subtle grid pattern (commercial carpet tiles)
    for x in range(0, W, 128):
        draw.line([(x,0),(x,H)], fill=(62,67,85), width=1)
    for y in range(0, H, 128):
        draw.line([(0,y),(W,y)], fill=(62,67,85), width=1)

    img.save(os.path.join(ASSETS, "environment", "office", "floor.png"))
    print("✓ office/floor.png")


def gen_apartment_floor():
    """The existing dark wood floor - copy & adjust for apartment labeling"""
    W, H = 1024, 1024
    img = Image.new("RGB", (W, H), (75, 55, 38))
    draw = ImageDraw.Draw(img)

    plank_h = 64
    for y in range(0, H, plank_h):
        r = random.randint(65, 85)
        g = random.randint(45, 60)
        b = random.randint(28, 42)
        draw.rectangle([0, y, W, y + plank_h - 2], fill=(r, g, b))

        # Grain lines
        for _ in range(10):
            ly = y + random.randint(3, plank_h - 5)
            shade = random.randint(-10, 10)
            draw.line([(0, ly), (W, ly)], fill=(r+shade, g+shade, b+shade), width=1)

        # Knot details
        for _ in range(random.randint(3, 5)):
            kx = random.randint(20, W-20)
            ky = y + random.randint(8, plank_h-10)
            krx = random.randint(4, 8)
            kry = random.randint(3, 6)
            draw.ellipse([kx-krx, ky-kry, kx+krx, ky+kry], fill=(r-15, g-12, b-10))

        # Varnish reflection streaks
        for _ in range(random.randint(2, 4)):
            vy = y + random.randint(5, plank_h-7)
            vx_start = random.randint(0, W-100)
            vx_end = vx_start + random.randint(40, 120)
            draw.line([(vx_start, vy), (vx_end, vy)], fill=(r+12, g+10, b+8), width=1)

        # Plank gap
        draw.rectangle([0, y+plank_h-2, W, y+plank_h], fill=(40, 28, 18))

        # Staggered plank joints
        offset = (y // plank_h) % 2 * 150
        for x in range(offset, W, 300):
            jx = x + random.randint(-3, 3)
            draw.rectangle([jx, y, jx+2, y+plank_h-2], fill=(45, 32, 20))

    # Noise
    for _ in range(5000):
        px = random.randint(0, W-1)
        py = random.randint(0, H-1)
        c = img.getpixel((px, py))
        n = random.randint(-8, 8)
        img.putpixel((px, py), tuple(max(0,min(255,v+n)) for v in c))

    img.save(os.path.join(ASSETS, "environment", "apartment", "floor.png"))
    print("✓ apartment/floor.png")


# ══════════════════════════════════════════════════════════════
# WALL BACKGROUNDS
# ══════════════════════════════════════════════════════════════

def gen_warehouse_wall():
    W, H = 1024, 256
    img = Image.new("RGB", (W, H), (90, 85, 80))
    draw = ImageDraw.Draw(img)

    # Brick pattern
    brick_h = 24
    brick_w = 56
    for row in range(0, H-28, brick_h):
        offset = (row // brick_h) % 2 * (brick_w // 2)
        for col in range(offset, W, brick_w):
            r = random.randint(100, 130)
            g = random.randint(70, 90)
            b = random.randint(60, 75)
            draw.rectangle([col+1, row+1, col+brick_w-2, row+brick_h-2], fill=(r,g,b))

    # Metal baseboard
    draw.rectangle([0, H-28, W, H], fill=(80, 82, 85))
    draw.line([(0, H-28),(W, H-28)], fill=(65,67,70), width=2)
    for x in range(0, W, 64):
        draw.ellipse([x+26, H-22, x+36, H-10], fill=(70,72,75))

    img.save(os.path.join(ASSETS, "environment", "warehouse", "wall.png"))
    print("✓ warehouse/wall.png")


def gen_office_wall():
    W, H = 1024, 256
    img = Image.new("RGB", (W, H), (200, 198, 190))
    draw = ImageDraw.Draw(img)

    for x in range(0, W, 2):
        for y in range(0, H, 2):
            n = random.randint(-5, 5)
            base = img.getpixel((x, y))
            img.putpixel((x, y), tuple(max(0,min(255,c+n)) for c in base))

    # White baseboard
    draw.rectangle([0, H-32, W, H], fill=(230, 228, 222))
    draw.line([(0, H-32),(W, H-32)], fill=(210,208,200), width=2)
    draw.line([(0, H-22),(W, H-22)], fill=(220,218,212), width=1)
    # Second decorative line
    draw.line([(0, H-12),(W, H-12)], fill=(215,213,207), width=1)

    img.save(os.path.join(ASSETS, "environment", "office", "wall.png"))
    print("✓ office/wall.png")


def gen_apartment_wall():
    W, H = 1024, 256
    img = Image.new("RGB", (W, H), (65, 60, 72))
    draw = ImageDraw.Draw(img)

    for x in range(0, W, 2):
        for y in range(0, H, 2):
            n = random.randint(-6, 6)
            base = img.getpixel((x, y))
            img.putpixel((x, y), tuple(max(0,min(255,c+n)) for c in base))

    # Wallpaper stripe pattern (subtle)
    for x in range(0, W, 48):
        draw.line([(x,0),(x,H-24)], fill=(60,55,68), width=1)

    # Dark wood baseboard
    draw.rectangle([0, H-24, W, H], fill=(45, 32, 22))
    draw.line([(0, H-24),(W, H-24)], fill=(35, 24, 15), width=2)

    img.save(os.path.join(ASSETS, "environment", "apartment", "wall.png"))
    print("✓ apartment/wall.png")


if __name__ == "__main__":
    # Stains
    gen_trash()
    gen_evidence()
    gen_broken_furniture()

    # Tools
    gen_scrub_brush()
    gen_trash_bag()
    gen_repair_kit()
    gen_spray()

    # Environments
    gen_apartment_floor()
    gen_apartment_wall()
    gen_warehouse_floor()
    gen_warehouse_wall()
    gen_office_floor()
    gen_office_wall()

    print("\n🎮 All Phase 2 assets generated!")
