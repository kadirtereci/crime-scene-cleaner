#!/usr/bin/env python3
"""Generate high-quality stain assets (256x256) for Crime Scene Cleaner"""

from PIL import Image, ImageDraw, ImageFilter
import random
import math
import os

BASE = os.path.dirname(os.path.abspath(__file__))
STAINS = os.path.join(BASE, "assets", "stains")
os.makedirs(STAINS, exist_ok=True)

random.seed(77)

S = 256  # all stains are 256x256


def gen_blood_stain():
    """Multi-layered blood splatter with wet sheen, drips, coagulation edges"""
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = S // 2, S // 2

    # Layer 1: Large base pools (dark, dried blood)
    for _ in range(5):
        ox = random.randint(-20, 20)
        oy = random.randint(-20, 20)
        rx = random.randint(30, 55)
        ry = random.randint(25, 50)
        r = random.randint(80, 110)
        g = random.randint(5, 20)
        b = random.randint(5, 15)
        draw.ellipse([cx+ox-rx, cy+oy-ry, cx+ox+rx, cy+oy+ry], fill=(r, g, b, 220))

    # Layer 2: Medium splats (brighter red, overlapping)
    for _ in range(8):
        ox = random.randint(-30, 30)
        oy = random.randint(-30, 30)
        rx = random.randint(15, 35)
        ry = random.randint(12, 30)
        r = random.randint(140, 190)
        g = random.randint(10, 35)
        b = random.randint(8, 25)
        draw.ellipse([cx+ox-rx, cy+oy-ry, cx+ox+rx, cy+oy+ry], fill=(r, g, b, 200))

    # Layer 3: Drip trails radiating outward
    for _ in range(6):
        angle = random.uniform(0, math.pi * 2)
        start_dist = random.randint(25, 40)
        length = random.randint(30, 65)
        sx = cx + int(math.cos(angle) * start_dist)
        sy = cy + int(math.sin(angle) * start_dist)
        for step in range(length):
            px = sx + int(math.cos(angle) * step)
            py = sy + int(math.sin(angle) * step)
            # Drip gets thinner
            width = max(1, int(5 * (1 - step / length)))
            r = random.randint(120, 170)
            draw.ellipse([px-width, py-width, px+width, py+width],
                        fill=(r, 15, 10, int(200 * (1 - step / length))))

    # Layer 4: Splatter droplets (small scattered dots)
    for _ in range(25):
        dx = random.randint(-85, 85)
        dy = random.randint(-85, 85)
        dr = random.randint(2, 7)
        r = random.randint(130, 200)
        alpha = random.randint(140, 230)
        draw.ellipse([cx+dx-dr, cy+dy-dr, cx+dx+dr, cy+dy+dr], fill=(r, 12, 10, alpha))

    # Layer 5: Wet sheen highlights (subtle lighter spots)
    sheen = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sheen_draw = ImageDraw.Draw(sheen)
    for _ in range(4):
        sx = cx + random.randint(-25, 25)
        sy = cy + random.randint(-25, 25)
        srx = random.randint(8, 18)
        sry = random.randint(6, 14)
        sheen_draw.ellipse([sx-srx, sy-sry, sx+srx, sy+sry], fill=(255, 180, 180, 35))
    img = Image.alpha_composite(img, sheen)

    # Layer 6: Dark coagulation edges
    edge = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    edge_draw = ImageDraw.Draw(edge)
    for _ in range(12):
        ox = random.randint(-35, 35)
        oy = random.randint(-35, 35)
        rx = random.randint(20, 45)
        ry = random.randint(18, 40)
        # Draw only outline ring
        edge_draw.ellipse([cx+ox-rx, cy+oy-ry, cx+ox+rx, cy+oy+ry],
                         outline=(60, 5, 5, 80), width=2)
    img = Image.alpha_composite(img, edge)

    img = img.filter(ImageFilter.GaussianBlur(radius=1.8))
    img.save(os.path.join(STAINS, "blood-stain.png"))
    print("✓ blood-stain.png (256x256)")


def gen_broken_glass():
    """Sharp glass shards with reflections, cracks, glints"""
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = S // 2, S // 2

    # Crack lines radiating from center
    for _ in range(8):
        angle = random.uniform(0, math.pi * 2)
        length = random.randint(40, 80)
        x, y = cx, cy
        for step in range(length):
            x += math.cos(angle) + random.uniform(-0.5, 0.5)
            y += math.sin(angle) + random.uniform(-0.5, 0.5)
            if 0 <= x < S and 0 <= y < S:
                draw.rectangle([int(x), int(y), int(x)+1, int(y)+1],
                              fill=(200, 220, 240, 120))

    # Large shards
    for _ in range(10):
        angle = random.uniform(0, math.pi * 2)
        dist = random.randint(8, 50)
        px = cx + int(math.cos(angle) * dist)
        py = cy + int(math.sin(angle) * dist)

        shard_size = random.randint(14, 32)
        n_vertices = random.choice([3, 4, 5])
        base_angle = random.uniform(0, math.pi * 2)
        points = []
        for i in range(n_vertices):
            a = base_angle + i * (2 * math.pi / n_vertices) + random.uniform(-0.3, 0.3)
            r = random.randint(shard_size // 3, shard_size)
            points.append((px + int(math.cos(a) * r), py + int(math.sin(a) * r)))

        # Glass: slightly blue-tinted, semi-transparent
        r = random.randint(185, 235)
        g = random.randint(215, 245)
        b = random.randint(240, 255)
        alpha = random.randint(130, 210)
        draw.polygon(points, fill=(r, g, b, alpha), outline=(210, 230, 250, 230))

    # Small shards scattered wider
    for _ in range(12):
        angle = random.uniform(0, math.pi * 2)
        dist = random.randint(30, 80)
        px = cx + int(math.cos(angle) * dist)
        py = cy + int(math.sin(angle) * dist)
        shard_size = random.randint(4, 10)
        points = []
        base_angle = random.uniform(0, math.pi * 2)
        for i in range(3):
            a = base_angle + i * (2 * math.pi / 3)
            rv = random.randint(shard_size // 2, shard_size)
            points.append((px + int(math.cos(a) * rv), py + int(math.sin(a) * rv)))
        alpha = random.randint(100, 180)
        draw.polygon(points, fill=(200, 225, 250, alpha))

    # Bright glints / reflections
    for _ in range(10):
        gx = cx + random.randint(-45, 45)
        gy = cy + random.randint(-45, 45)
        gr = random.randint(2, 5)
        draw.ellipse([gx-gr, gy-gr, gx+gr, gy+gr], fill=(255, 255, 255, 200))

    # Cross-shaped bright glints on large shards
    for _ in range(4):
        gx = cx + random.randint(-30, 30)
        gy = cy + random.randint(-30, 30)
        draw.line([(gx-4, gy), (gx+4, gy)], fill=(255, 255, 255, 180), width=1)
        draw.line([(gx, gy-4), (gx, gy+4)], fill=(255, 255, 255, 180), width=1)

    img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
    img.save(os.path.join(STAINS, "broken-glass.png"))
    print("✓ broken-glass.png (256x256)")


def gen_trash():
    """Detailed garbage pile: crumpled paper, cans, wrappers, stains"""
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = S // 2, S // 2

    # Base garbage pile shape (irregular brown mass)
    for _ in range(6):
        ox = random.randint(-25, 25)
        oy = random.randint(-25, 25)
        rx = random.randint(25, 45)
        ry = random.randint(20, 38)
        r = random.randint(130, 165)
        g = random.randint(100, 135)
        b = random.randint(55, 85)
        draw.ellipse([cx+ox-rx, cy+oy-ry, cx+ox+rx, cy+oy+ry], fill=(r, g, b, 220))

    # Crumpled paper pieces (white/beige rectangles, rotated)
    for _ in range(4):
        px = cx + random.randint(-35, 35)
        py = cy + random.randint(-30, 30)
        pw = random.randint(12, 25)
        ph = random.randint(15, 30)
        angle = random.uniform(-0.6, 0.6)
        points = []
        for corner in [(-pw, -ph), (pw, -ph), (pw, ph), (-pw, ph)]:
            rx = corner[0] * math.cos(angle) - corner[1] * math.sin(angle)
            ry = corner[0] * math.sin(angle) + corner[1] * math.cos(angle)
            points.append((int(px + rx), int(py + ry)))
        gray = random.randint(200, 240)
        draw.polygon(points, fill=(gray, gray-10, gray-20, 200))
        # Crumple lines on paper
        for _ in range(2):
            lx = px + random.randint(-pw, pw)
            ly = py + random.randint(-ph, ph)
            draw.line([(lx, ly), (lx+random.randint(-8, 8), ly+random.randint(-8, 8))],
                     fill=(gray-40, gray-50, gray-60, 120), width=1)

    # Crushed can
    can_x = cx + random.randint(-25, 25)
    can_y = cy + random.randint(-15, 15)
    can_color = random.choice([(210, 40, 40), (40, 120, 210), (40, 180, 80)])
    draw.ellipse([can_x-12, can_y-8, can_x+12, can_y+8], fill=can_color + (220,))
    draw.ellipse([can_x-10, can_y-6, can_x+10, can_y+6], fill=tuple(c+30 for c in can_color) + (180,))
    # Can opening
    draw.ellipse([can_x-5, can_y-3, can_x+5, can_y+3], fill=(50, 50, 50, 180))

    # Candy wrappers / small colored bits
    for _ in range(6):
        bx = cx + random.randint(-45, 45)
        by = cy + random.randint(-40, 40)
        bw = random.randint(5, 12)
        bh = random.randint(3, 8)
        color = random.choice([
            (220, 50, 50, 210), (50, 150, 220, 210),
            (220, 200, 40, 210), (200, 60, 180, 210),
            (60, 200, 120, 210), (255, 140, 0, 210),
        ])
        draw.ellipse([bx-bw, by-bh, bx+bw, by+bh], fill=color)

    # Stain ring under pile
    stain = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    stain_draw = ImageDraw.Draw(stain)
    stain_draw.ellipse([cx-50, cy-40, cx+50, cy+40], fill=(100, 80, 40, 50))
    img = Image.alpha_composite(stain, img)

    # Grime texture overlay
    for _ in range(300):
        px = cx + random.randint(-55, 55)
        py = cy + random.randint(-45, 45)
        if 0 <= px < S and 0 <= py < S:
            n = random.randint(-20, 20)
            c = img.getpixel((px, py))
            if c[3] > 50:
                img.putpixel((px, py), (
                    max(0, min(255, c[0]+n)),
                    max(0, min(255, c[1]+n)),
                    max(0, min(255, c[2]+n)),
                    c[3]))

    img = img.filter(ImageFilter.GaussianBlur(radius=0.8))
    img.save(os.path.join(STAINS, "trash.png"))
    print("✓ trash.png (256x256)")


def gen_evidence():
    """Evidence marker with detailed items: phone, shell casings, documents"""
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = S // 2, S // 2

    # Evidence item 1: Phone/device
    phone_x, phone_y = cx - 15, cy + 5
    draw.rounded_rectangle([phone_x-18, phone_y-12, phone_x+18, phone_y+12],
                          radius=4, fill=(30, 30, 38, 230))
    draw.rounded_rectangle([phone_x-16, phone_y-10, phone_x+16, phone_y+10],
                          radius=3, fill=(50, 50, 60, 220))
    # Screen
    draw.rounded_rectangle([phone_x-13, phone_y-7, phone_x+13, phone_y+7],
                          radius=2, fill=(70, 85, 110, 200))
    # Screen glint
    draw.line([(phone_x-10, phone_y-5), (phone_x+5, phone_y-5)], fill=(100, 115, 140, 150), width=1)

    # Evidence item 2: Shell casings
    for i in range(3):
        sx = cx + 20 + i * 10 + random.randint(-3, 3)
        sy = cy - 15 + random.randint(-5, 5)
        draw.ellipse([sx-3, sy-5, sx+3, sy+5], fill=(185, 165, 80, 230))
        draw.ellipse([sx-2, sy-4, sx+2, sy-2], fill=(205, 185, 100, 200))
        draw.ellipse([sx-2, sy+3, sx+2, sy+5], fill=(160, 140, 60, 220))

    # Evidence item 3: Small document/note
    doc_x, doc_y = cx - 25, cy - 18
    doc_angle = 0.15
    doc_w, doc_h = 16, 22
    points = []
    for corner in [(-doc_w, -doc_h), (doc_w, -doc_h), (doc_w, doc_h), (-doc_w, doc_h)]:
        rx = corner[0] * math.cos(doc_angle) - corner[1] * math.sin(doc_angle)
        ry = corner[0] * math.sin(doc_angle) + corner[1] * math.cos(doc_angle)
        points.append((int(doc_x + rx), int(doc_y + ry)))
    draw.polygon(points, fill=(235, 230, 220, 220))
    # Text lines on document
    for i in range(4):
        ly = doc_y - 12 + i * 7
        draw.line([(doc_x-10, ly), (doc_x+8+random.randint(-3, 0), ly)],
                 fill=(60, 60, 70, 120), width=1)

    # Evidence marker (bright yellow, prominent)
    marker_x = cx + 30
    marker_y = cy - 30
    # Triangle body
    points = [(marker_x, marker_y-24), (marker_x-16, marker_y+12), (marker_x+16, marker_y+12)]
    draw.polygon(points, fill=(255, 220, 30, 240))
    # Black outline
    draw.polygon(points, outline=(180, 150, 10, 255))
    # Exclamation mark
    draw.rectangle([marker_x-2, marker_y-14, marker_x+2, marker_y+0], fill=(30, 30, 30, 230))
    draw.ellipse([marker_x-2, marker_y+3, marker_x+2, marker_y+7], fill=(30, 30, 30, 230))

    # Blood spot near evidence
    for _ in range(3):
        bx = cx + random.randint(-30, 30)
        by = cy + random.randint(10, 30)
        br = random.randint(3, 8)
        draw.ellipse([bx-br, by-br, bx+br, by+br], fill=(150, 20, 15, 120))

    img.save(os.path.join(STAINS, "evidence.png"))
    print("✓ evidence.png (256x256)")


def gen_broken_furniture():
    """Detailed broken furniture: wood grain, splinters, nails, fabric"""
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = S // 2, S // 2

    wood_colors = [
        (140, 95, 55), (150, 105, 60), (125, 85, 48),
        (160, 115, 65), (130, 88, 50),
    ]

    # Main broken plank (large, with wood grain)
    plank_color = random.choice(wood_colors)
    plank_points = [(cx-45, cy-10), (cx+40, cy-15), (cx+42, cy+8), (cx-42, cy+12)]
    draw.polygon(plank_points, fill=plank_color + (235,))
    # Wood grain lines
    for i in range(8):
        gy = cy - 8 + i * 3
        shade = random.randint(-15, 10)
        draw.line([(cx-42, gy), (cx+38, gy)],
                 fill=(plank_color[0]+shade, plank_color[1]+shade, plank_color[2]+shade, 160), width=1)
    # Jagged break edge
    for x in range(cx+35, cx+45):
        by = cy + random.randint(-12, 10)
        draw.rectangle([x, by, x+2, by+2], fill=(plank_color[0]-20, plank_color[1]-15, plank_color[2]-10, 200))

    # Broken legs (3 scattered pieces)
    for i in range(3):
        lx = cx + random.randint(-50, 50)
        ly = cy + random.randint(-35, 35)
        length = random.randint(28, 50)
        width = random.randint(6, 11)
        angle = random.uniform(-0.8, 0.8)
        col = random.choice(wood_colors) + (225,)

        ex = lx + int(math.cos(angle) * length)
        ey = ly + int(math.sin(angle) * length)

        # Draw thick line as leg
        draw.line([(lx, ly), (ex, ey)], fill=col, width=width)
        # Grain on leg
        for gi in range(3):
            frac = 0.2 + gi * 0.3
            gx = int(lx + (ex-lx)*frac)
            gy_l = int(ly + (ey-ly)*frac)
            draw.line([(gx-3, gy_l-1), (gx+3, gy_l+1)],
                     fill=(col[0]-20, col[1]-15, col[2]-10, 140), width=1)

    # Splinters (thin sharp pieces)
    for _ in range(10):
        sx = cx + random.randint(-50, 50)
        sy = cy + random.randint(-35, 35)
        sl = random.randint(8, 22)
        sa = random.uniform(0, math.pi * 2)
        ex = sx + int(math.cos(sa) * sl)
        ey = sy + int(math.sin(sa) * sl)
        col = random.choice(wood_colors)
        draw.line([(sx, sy), (ex, ey)], fill=col + (190,), width=2)
        # Pointed tip
        draw.line([(ex, ey), (ex+int(math.cos(sa)*4), ey+int(math.sin(sa)*4))],
                 fill=col + (140,), width=1)

    # Nails with shadows
    for _ in range(3):
        nx = cx + random.randint(-40, 40)
        ny = cy + random.randint(-25, 25)
        # Nail shadow
        draw.ellipse([nx-1, ny+1, nx+3, ny+5], fill=(0, 0, 0, 40))
        # Nail head
        draw.ellipse([nx-3, ny-3, nx+3, ny+3], fill=(170, 170, 180, 230))
        draw.ellipse([nx-2, ny-2, nx+2, ny+2], fill=(190, 190, 200, 200))
        # Nail body
        nail_angle = random.uniform(-0.5, 0.5)
        draw.line([(nx, ny), (nx+int(math.cos(nail_angle)*12), ny+int(math.sin(nail_angle)*12))],
                 fill=(160, 160, 175, 210), width=2)

    # Fabric scrap (from upholstery)
    fx = cx + random.randint(-20, 20)
    fy = cy + random.randint(10, 30)
    fabric_color = random.choice([(100, 60, 60), (60, 80, 100), (80, 100, 60)])
    for _ in range(3):
        fox = fx + random.randint(-12, 12)
        foy = fy + random.randint(-8, 8)
        frx = random.randint(8, 15)
        fry = random.randint(5, 10)
        draw.ellipse([fox-frx, foy-fry, fox+frx, foy+fry], fill=fabric_color + (160,))

    # Sawdust scatter
    for _ in range(40):
        dx = cx + random.randint(-60, 60)
        dy = cy + random.randint(-45, 45)
        dr = random.randint(1, 3)
        col = random.choice(wood_colors)
        draw.ellipse([dx-dr, dy-dr, dx+dr, dy+dr], fill=col + (random.randint(80, 150),))

    img = img.filter(ImageFilter.GaussianBlur(radius=0.6))
    img.save(os.path.join(STAINS, "broken-furniture.png"))
    print("✓ broken-furniture.png (256x256)")


if __name__ == "__main__":
    gen_blood_stain()
    gen_broken_glass()
    gen_trash()
    gen_evidence()
    gen_broken_furniture()
    print("\n✅ All v2 stain assets generated (256x256)!")
