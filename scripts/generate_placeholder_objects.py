"""Generate simple placeholder PNG images for game objects."""

from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "objects")
os.makedirs(OUTPUT_DIR, exist_ok=True)

OBJECTS = [
    {"name": "sofa.png", "width": 120, "height": 60, "color": "#5D3A1A", "label": "SOFA"},
    {"name": "carpet.png", "width": 100, "height": 80, "color": "#6B2020", "label": "CARPET"},
    {"name": "table.png", "width": 90, "height": 70, "color": "#4A3010", "label": "TABLE"},
    {"name": "wall-section.png", "width": 80, "height": 100, "color": "#4A4A4A", "label": "WALL"},
]

for obj in OBJECTS:
    img = Image.new("RGBA", (obj["width"], obj["height"]), obj["color"])
    draw = ImageDraw.Draw(img)

    # Use default font
    font = ImageFont.load_default()

    # Center the text
    bbox = draw.textbbox((0, 0), obj["label"], font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (obj["width"] - text_w) / 2
    y = (obj["height"] - text_h) / 2

    draw.text((x, y), obj["label"], fill="white", font=font)

    path = os.path.join(OUTPUT_DIR, obj["name"])
    img.save(path)
    print(f"Created {path}")

print("Done.")
