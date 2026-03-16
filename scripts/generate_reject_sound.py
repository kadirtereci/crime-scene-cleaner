#!/usr/bin/env python3
"""Generate a short reject/buzz sound effect for wrong tool feedback."""
import struct
import math
import os

SAMPLE_RATE = 44100
DURATION = 0.15  # 150ms — short buzz
AMPLITUDE = 0.4
FREQ = 150  # low buzz frequency

num_samples = int(SAMPLE_RATE * DURATION)
samples = []

for i in range(num_samples):
    t = i / SAMPLE_RATE
    # Buzzy square-ish wave with fast decay
    envelope = max(0, 1.0 - t / DURATION)
    val = envelope * AMPLITUDE * (
        0.6 * math.sin(2 * math.pi * FREQ * t) +
        0.3 * math.sin(2 * math.pi * FREQ * 2.3 * t) +
        0.1 * math.sin(2 * math.pi * FREQ * 4.1 * t)
    )
    sample = max(-1.0, min(1.0, val))
    samples.append(int(sample * 32767))

# Write WAV
out_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "sounds", "reject.wav")
with open(out_path, "wb") as f:
    data_size = num_samples * 2
    f.write(b"RIFF")
    f.write(struct.pack("<I", 36 + data_size))
    f.write(b"WAVE")
    f.write(b"fmt ")
    f.write(struct.pack("<IHHIIHH", 16, 1, 1, SAMPLE_RATE, SAMPLE_RATE * 2, 2, 16))
    f.write(b"data")
    f.write(struct.pack("<I", data_size))
    for s in samples:
        f.write(struct.pack("<h", s))

print(f"Generated {out_path} ({num_samples} samples, {DURATION}s)")
