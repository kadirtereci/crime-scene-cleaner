#!/usr/bin/env python3
"""Remove white background from mess sprites — make them transparent PNG"""

from PIL import Image
import os

SRC = 'assets/environment/mess_assets_named'
OUT = 'assets/environment/mess_assets_named'  # overwrite in place

# White threshold — pixels with R,G,B all > this become transparent
THRESHOLD = 235
# Edge feather — gradual alpha near white edges
FEATHER_RANGE = 20  # pixels within this range of threshold get partial alpha

def remove_white_bg(img_path, out_path):
    img = Image.open(img_path).convert('RGBA')
    pixels = img.load()
    w, h = img.size
    
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            
            # How "white" is this pixel? (0 = pure black, 255 = pure white)
            whiteness = min(r, g, b)
            
            if whiteness > THRESHOLD:
                # Pure white area — fully transparent
                pixels[x, y] = (r, g, b, 0)
            elif whiteness > THRESHOLD - FEATHER_RANGE:
                # Near-white area — partial transparency for soft edges
                # Linear interpolation: at threshold → alpha=0, at threshold-feather → alpha=255
                alpha_ratio = (THRESHOLD - whiteness) / FEATHER_RANGE
                new_alpha = int(alpha_ratio * 255)
                pixels[x, y] = (r, g, b, min(a, new_alpha))
    
    img.save(out_path, 'PNG')

count = 0
for fname in sorted(os.listdir(SRC)):
    if not fname.endswith('.png'):
        continue
    path = os.path.join(SRC, fname)
    remove_white_bg(path, path)
    count += 1
    print(f'✓ {fname}')

print(f'\n✅ {count} sprites — white background removed')
