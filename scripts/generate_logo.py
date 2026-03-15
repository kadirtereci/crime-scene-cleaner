#!/usr/bin/env python3
"""Generate Crime Scene Cleaner logo — fingerprint being wiped clean."""

from PIL import Image, ImageDraw
import math
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(BASE, "assets", "images")

# Colors
BG_DARK = (15, 14, 23)          # #0F0E17
ACID_GREEN = (191, 255, 0)      # #BFFF00
ELECTRIC_BLUE = (0, 212, 255)   # #00D4FF
WHITE = (255, 255, 255)
CYAN_SPARKLE = (180, 255, 255)


def draw_glow_border(draw, size, center, radius, color, rings=8):
    """Draw concentric semi-transparent circles for a glow effect."""
    for i in range(rings, 0, -1):
        r = radius + i * 3
        alpha = int(30 * (rings - i + 1) / rings)
        glow_color = (*color, alpha)
        draw.ellipse(
            [center - r, center - r, center + r, center + r],
            outline=glow_color,
            width=2,
        )
    # Solid border ring
    draw.ellipse(
        [center - radius, center - radius, center + radius, center + radius],
        outline=(*color, 200),
        width=3,
    )


def draw_fingerprint(draw, cx, cy, radius, color, num_ridges=12, clip_right=True):
    """Draw concentric elliptical arcs with jitter — fingerprint ridges."""
    for i in range(num_ridges):
        t = (i + 1) / (num_ridges + 1)
        rx = int(radius * t * 0.85)
        ry = int(radius * t)

        # Jitter for organic feel
        jx = int(math.sin(i * 1.7) * radius * 0.03)
        jy = int(math.cos(i * 2.1) * radius * 0.02)

        # Draw arc as series of points
        alpha = int(180 + 60 * t)
        ridge_color = (*color, alpha)

        points = []
        # Arc from ~160 to ~380 degrees (left-biased if clipping right)
        start_angle = 140 if not clip_right else 150
        end_angle = 400 if not clip_right else 360

        for deg in range(start_angle, end_angle, 3):
            rad = math.radians(deg)
            x = cx + jx + int(rx * math.cos(rad))
            y = cy + jy + int(ry * math.sin(rad))

            # Clip to left side if needed (fade near center)
            if clip_right and x > cx + radius * 0.15:
                continue
            points.append((x, y))

        if len(points) >= 2:
            width = max(2, int(radius * 0.025))
            draw.line(points, fill=ridge_color, width=width, joint="curve")


def draw_mop_swipe(draw, cx, cy, radius, size):
    """Draw diagonal mop-swipe streak with sparkles."""
    # Diagonal swipe from upper-right to lower-left through the right portion
    swipe_width = int(radius * 0.45)

    for i in range(20):
        t = i / 20.0
        alpha = int(60 + 140 * (1 - abs(t - 0.5) * 2))
        streak_color = (*ELECTRIC_BLUE, alpha)

        # Diagonal line across right side
        x_start = cx + int(radius * 0.6) - int(i * radius * 0.04)
        y_start = cy - int(radius * 0.7) + int(i * radius * 0.08)
        x_end = cx - int(radius * 0.1) - int(i * radius * 0.04)
        y_end = cy + int(radius * 0.8) + int(i * radius * 0.08)

        draw.line(
            [(x_start, y_start), (x_end, y_end)],
            fill=streak_color,
            width=max(2, int(radius * 0.02)),
        )

    # Sparkle dots near the wipe edge
    sparkle_positions = [
        (cx + int(radius * 0.25), cy - int(radius * 0.15)),
        (cx + int(radius * 0.1), cy + int(radius * 0.2)),
        (cx + int(radius * 0.35), cy - int(radius * 0.4)),
        (cx + int(radius * 0.0), cy + int(radius * 0.45)),
        (cx + int(radius * 0.15), cy - int(radius * 0.55)),
        (cx + int(radius * 0.4), cy + int(radius * 0.1)),
    ]

    for sx, sy in sparkle_positions:
        sparkle_size = max(2, int(radius * 0.025))
        # Cross sparkle
        draw.line(
            [(sx - sparkle_size, sy), (sx + sparkle_size, sy)],
            fill=(*WHITE, 220),
            width=max(1, sparkle_size // 2),
        )
        draw.line(
            [(sx, sy - sparkle_size), (sx, sy + sparkle_size)],
            fill=(*CYAN_SPARKLE, 200),
            width=max(1, sparkle_size // 2),
        )
        # Center dot
        dot_r = max(1, sparkle_size // 3)
        draw.ellipse(
            [sx - dot_r, sy - dot_r, sx + dot_r, sy + dot_r],
            fill=(*WHITE, 255),
        )


def generate_logo(size, transparent_bg=False, simplified=False):
    """Generate logo at given size."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0) if transparent_bg else (*BG_DARK, 255))
    draw = ImageDraw.Draw(img, "RGBA")

    center = size // 2
    radius = int(size * 0.38)

    if not transparent_bg:
        # Dark disc background
        draw.ellipse(
            [center - radius, center - radius, center + radius, center + radius],
            fill=(*BG_DARK, 255),
        )
        # Glow border
        draw_glow_border(draw, size, center, radius, ACID_GREEN)

    # Fingerprint ridges (left side)
    num_ridges = 6 if simplified else 12
    draw_fingerprint(draw, center, center, radius, ACID_GREEN, num_ridges=num_ridges)

    # Mop swipe (right side)
    draw_mop_swipe(draw, center, center, radius, size)

    return img


def generate_monochrome(size):
    """Generate white-on-transparent monochrome version."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")

    center = size // 2
    radius = int(size * 0.38)

    # Border circle in white
    draw.ellipse(
        [center - radius, center - radius, center + radius, center + radius],
        outline=(*WHITE, 200),
        width=3,
    )

    # Fingerprint in white
    draw_fingerprint(draw, center, center, radius, WHITE, num_ridges=10)

    # Simplified swipe in white
    for i in range(12):
        t = i / 12.0
        alpha = int(60 + 120 * (1 - abs(t - 0.5) * 2))
        x_start = center + int(radius * 0.6) - int(i * radius * 0.04)
        y_start = center - int(radius * 0.7) + int(i * radius * 0.08)
        x_end = center - int(radius * 0.1) - int(i * radius * 0.04)
        y_end = center + int(radius * 0.8) + int(i * radius * 0.08)
        draw.line(
            [(x_start, y_start), (x_end, y_end)],
            fill=(*WHITE, alpha),
            width=max(2, int(radius * 0.02)),
        )

    # Sparkle dots in white
    sparkle_positions = [
        (center + int(radius * 0.2), center - int(radius * 0.1)),
        (center + int(radius * 0.1), center + int(radius * 0.3)),
        (center + int(radius * 0.3), center - int(radius * 0.3)),
    ]
    for sx, sy in sparkle_positions:
        s = max(2, int(radius * 0.025))
        draw.line([(sx - s, sy), (sx + s, sy)], fill=(*WHITE, 220), width=max(1, s // 2))
        draw.line([(sx, sy - s), (sx, sy + s)], fill=(*WHITE, 220), width=max(1, s // 2))

    return img


if __name__ == "__main__":
    os.makedirs(ASSETS, exist_ok=True)

    # 1. App store icon (1024x1024)
    icon = generate_logo(1024)
    icon.save(os.path.join(ASSETS, "icon.png"))
    print("  icon.png (1024x1024)")

    # 2. Splash icon (512x512)
    splash = generate_logo(512)
    splash.save(os.path.join(ASSETS, "splash-icon.png"))
    print("  splash-icon.png (512x512)")

    # 3. Favicon (48x48, simplified)
    favicon = generate_logo(48, simplified=True)
    favicon.save(os.path.join(ASSETS, "favicon.png"))
    print("  favicon.png (48x48)")

    # 4. Android adaptive icon foreground (432x432, design in inner 66%)
    android_fg = generate_logo(432, transparent_bg=True)
    android_fg.save(os.path.join(ASSETS, "android-icon-foreground.png"))
    print("  android-icon-foreground.png (432x432)")

    # 5. Android adaptive icon background (432x432, solid dark)
    android_bg = Image.new("RGBA", (432, 432), (*BG_DARK, 255))
    android_bg.save(os.path.join(ASSETS, "android-icon-background.png"))
    print("  android-icon-background.png (432x432)")

    # 6. Android monochrome (432x432, white on transparent)
    mono = generate_monochrome(432)
    mono.save(os.path.join(ASSETS, "android-icon-monochrome.png"))
    print("  android-icon-monochrome.png (432x432)")

    # 7. In-app logo (200x200, transparent bg)
    logo = generate_logo(200, transparent_bg=True)
    logo.save(os.path.join(ASSETS, "logo.png"))
    print("  logo.png (200x200)")

    print("\nAll logo variants generated!")
