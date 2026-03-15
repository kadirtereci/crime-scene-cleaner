#!/usr/bin/env python3
"""Generate cartoon-style SFX and music using pure Python wave synthesis"""

import wave, struct, math, random, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOUNDS = os.path.join(BASE, "assets", "sounds")
MUSIC = os.path.join(BASE, "assets", "music")
RATE = 44100

os.makedirs(SOUNDS, exist_ok=True)
os.makedirs(MUSIC, exist_ok=True)


def save_wav(path, samples, rate=RATE):
    """Save float samples [-1,1] as 16-bit WAV"""
    with wave.open(path, 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        for s in samples:
            s = max(-1, min(1, s))
            w.writeframes(struct.pack('<h', int(s * 32767)))


def sine(freq, duration, volume=0.5, rate=RATE):
    n = int(rate * duration)
    return [volume * math.sin(2 * math.pi * freq * i / rate) for i in range(n)]


def noise(duration, volume=0.3, rate=RATE):
    n = int(rate * duration)
    return [volume * (random.random() * 2 - 1) for _ in range(n)]


def envelope(samples, attack=0.01, decay=0.0, sustain=1.0, release=0.1, rate=RATE):
    """ADSR envelope"""
    n = len(samples)
    a = int(attack * rate)
    r = int(release * rate)
    d = int(decay * rate)
    result = []
    for i, s in enumerate(samples):
        if i < a:
            env = i / max(a, 1)
        elif i < a + d:
            env = 1.0 - (1.0 - sustain) * (i - a) / max(d, 1)
        elif i > n - r:
            env = sustain * (n - i) / max(r, 1)
        else:
            env = sustain
        result.append(s * env)
    return result


def mix(*tracks):
    length = max(len(t) for t in tracks)
    result = [0.0] * length
    for t in tracks:
        for i, s in enumerate(t):
            result[i] += s
    # Normalize
    peak = max(abs(s) for s in result) or 1
    if peak > 0.95:
        result = [s / peak * 0.9 for s in result]
    return result


def concat(*tracks):
    result = []
    for t in tracks:
        result.extend(t)
    return result


def pad(samples, total_duration, rate=RATE):
    n = int(rate * total_duration)
    if len(samples) < n:
        samples.extend([0.0] * (n - len(samples)))
    return samples[:n]


# ═══════════════════════════════════════════
# SFX
# ═══════════════════════════════════════════

def gen_scrub():
    """Scrubbing loop — filtered noise bursts"""
    samples = []
    for _ in range(8):  # 8 short bursts for looping
        burst = noise(0.06, 0.25)
        burst = envelope(burst, attack=0.005, release=0.02)
        gap = [0.0] * int(RATE * 0.02)
        samples.extend(burst)
        samples.extend(gap)
    save_wav(os.path.join(SOUNDS, "scrub.wav"), samples)
    print("✓ scrub.wav")


def gen_stain_clean():
    """Satisfying pop — rising chirp"""
    t1 = [0.5 * math.sin(2 * math.pi * (600 + i * 3) * i / RATE) for i in range(int(RATE * 0.12))]
    t2 = sine(1200, 0.05, 0.3)
    s = concat(t1, t2)
    s = envelope(s, attack=0.005, release=0.06)
    save_wav(os.path.join(SOUNDS, "stain-clean.wav"), s)
    print("✓ stain-clean.wav")


def gen_combo_up():
    """Ascending chime — three quick notes"""
    n1 = envelope(sine(880, 0.08, 0.4), attack=0.005, release=0.03)
    n2 = envelope(sine(1100, 0.08, 0.4), attack=0.005, release=0.03)
    n3 = envelope(sine(1320, 0.12, 0.5), attack=0.005, release=0.05)
    s = concat(n1, n2, n3)
    save_wav(os.path.join(SOUNDS, "combo-up.wav"), s)
    print("✓ combo-up.wav")


def gen_tool_switch():
    """Quick click — short metallic tap"""
    s = noise(0.03, 0.4)
    t = sine(2500, 0.02, 0.3)
    s = mix(s, t)
    s = envelope(s, attack=0.002, release=0.02)
    save_wav(os.path.join(SOUNDS, "tool-switch.wav"), s)
    print("✓ tool-switch.wav")


def gen_button_tap():
    """Soft UI tap"""
    s = sine(800, 0.04, 0.3)
    s = envelope(s, attack=0.003, release=0.03)
    save_wav(os.path.join(SOUNDS, "button-tap.wav"), s)
    print("✓ button-tap.wav")


def gen_level_complete():
    """Victory fanfare — ascending arpeggio"""
    notes = [523, 659, 784, 1047]  # C5 E5 G5 C6
    parts = []
    for i, freq in enumerate(notes):
        n = envelope(sine(freq, 0.15, 0.45), attack=0.01, release=0.06)
        gap = [0.0] * int(RATE * 0.05)
        parts.extend(n)
        parts.extend(gap)
    # Final sustained chord
    chord = mix(
        envelope(sine(523, 0.4, 0.3), release=0.2),
        envelope(sine(659, 0.4, 0.25), release=0.2),
        envelope(sine(784, 0.4, 0.25), release=0.2),
        envelope(sine(1047, 0.4, 0.3), release=0.2),
    )
    parts.extend(chord)
    save_wav(os.path.join(SOUNDS, "level-complete.wav"), parts)
    print("✓ level-complete.wav")


def gen_level_fail():
    """Sad descending — two falling notes"""
    n1 = envelope(sine(440, 0.25, 0.4), release=0.1)
    gap = [0.0] * int(RATE * 0.08)
    n2 = envelope(sine(330, 0.35, 0.35), release=0.15)
    s = concat(n1, gap, n2)
    save_wav(os.path.join(SOUNDS, "level-fail.wav"), s)
    print("✓ level-fail.wav")


def gen_star_earned():
    """Sparkle ding"""
    s = mix(
        envelope(sine(1500, 0.1, 0.35), attack=0.005, release=0.05),
        envelope(sine(2000, 0.08, 0.2), attack=0.005, release=0.04),
    )
    save_wav(os.path.join(SOUNDS, "star-earned.wav"), s)
    print("✓ star-earned.wav")


def gen_timer_warning():
    """Ticking urgency — repeating beeps"""
    parts = []
    for _ in range(4):
        beep = envelope(sine(1000, 0.06, 0.35), attack=0.005, release=0.02)
        gap = [0.0] * int(RATE * 0.44)
        parts.extend(beep)
        parts.extend(gap)
    save_wav(os.path.join(SOUNDS, "timer-warning.wav"), parts)
    print("✓ timer-warning.wav")


def gen_scrub_blood():
    """Wet, sloshy scrubbing — low-frequency filtered noise with bubbly quality"""
    samples = []
    for _ in range(6):
        burst = noise(0.05, 0.3)
        # Low-freq bubbly modulation
        burst = [burst[i] * (0.5 + 0.5 * math.sin(2 * math.pi * 8 * i / RATE))
                 for i in range(len(burst))]
        # Mix in a low rumble
        low = sine(80, 0.05, 0.2)
        burst = mix(burst, low)
        burst = envelope(burst, attack=0.005, release=0.02)
        gap = [0.0] * int(RATE * 0.015)
        samples.extend(burst)
        samples.extend(gap)
    save_wav(os.path.join(SOUNDS, "scrub-blood.wav"), samples)
    print("✓ scrub-blood.wav")


def gen_scrub_glass():
    """High-pitched scraping/tinkling — high-freq sine mixed with noise"""
    samples = []
    for _ in range(5):
        hi = sine(3500, 0.04, 0.35)
        hi2 = sine(5000, 0.04, 0.15)
        n = noise(0.04, 0.15)
        burst = mix(hi, hi2, n)
        burst = envelope(burst, attack=0.003, release=0.015)
        gap = [0.0] * int(RATE * 0.02)
        samples.extend(burst)
        samples.extend(gap)
    save_wav(os.path.join(SOUNDS, "scrub-glass.wav"), samples)
    print("✓ scrub-glass.wav")


def gen_scrub_trash():
    """Rustling, crinkly — noise with rapid amplitude modulation"""
    samples = []
    for _ in range(6):
        n = noise(0.05, 0.35)
        # Rapid AM at ~30 Hz for crinkle effect
        n = [n[i] * abs(math.sin(2 * math.pi * 30 * i / RATE))
             for i in range(len(n))]
        n = envelope(n, attack=0.003, release=0.02)
        gap = [0.0] * int(RATE * 0.015)
        samples.extend(n)
        samples.extend(gap)
    save_wav(os.path.join(SOUNDS, "scrub-trash.wav"), samples)
    print("✓ scrub-trash.wav")


def gen_scrub_evidence():
    """Paper/fabric wiping — soft filtered noise, lower volume"""
    samples = []
    for _ in range(6):
        n = noise(0.05, 0.15)
        # Smooth it by averaging neighbors for a softer feel
        smoothed = []
        for i in range(len(n)):
            avg = n[i]
            if i > 0:
                avg = (avg + n[i - 1]) / 2
            smoothed.append(avg)
        smoothed = envelope(smoothed, attack=0.01, release=0.02)
        gap = [0.0] * int(RATE * 0.015)
        samples.extend(smoothed)
        samples.extend(gap)
    save_wav(os.path.join(SOUNDS, "scrub-evidence.wav"), samples)
    print("✓ scrub-evidence.wav")


def gen_scrub_furniture():
    """Wood/metal sounds — lower frequency tones mixed with noise"""
    samples = []
    for _ in range(5):
        low = sine(200, 0.06, 0.3)
        low2 = sine(350, 0.06, 0.15)
        n = noise(0.06, 0.1)
        burst = mix(low, low2, n)
        burst = envelope(burst, attack=0.005, release=0.025)
        gap = [0.0] * int(RATE * 0.02)
        samples.extend(burst)
        samples.extend(gap)
    save_wav(os.path.join(SOUNDS, "scrub-furniture.wav"), samples)
    print("✓ scrub-furniture.wav")


def gen_clean_blood():
    """Liquid absorption/slurp — descending frequency sweep"""
    n = int(RATE * 0.25)
    s = [0.4 * math.sin(2 * math.pi * (800 - i * 2.5) * i / RATE) for i in range(n)]
    # Add a bit of noise for wetness
    wet = noise(0.25, 0.1)
    s = mix(s, wet)
    s = envelope(s, attack=0.005, release=0.08)
    save_wav(os.path.join(SOUNDS, "clean-blood.wav"), s)
    print("✓ clean-blood.wav")


def gen_clean_glass():
    """Glass clinking/chime — high bright tones"""
    t1 = envelope(sine(2400, 0.08, 0.4), attack=0.002, release=0.04)
    t2 = envelope(sine(3200, 0.06, 0.25), attack=0.002, release=0.03)
    t3 = envelope(sine(4000, 0.05, 0.15), attack=0.002, release=0.03)
    s = mix(t1, t2, t3)
    save_wav(os.path.join(SOUNDS, "clean-glass.wav"), s)
    print("✓ clean-glass.wav")


def gen_clean_trash():
    """Bag closing/crumple — noise burst with envelope"""
    n = noise(0.15, 0.4)
    # AM modulation for crumple texture
    n = [n[i] * (0.6 + 0.4 * math.sin(2 * math.pi * 20 * i / RATE))
         for i in range(len(n))]
    n = envelope(n, attack=0.005, decay=0.02, sustain=0.6, release=0.06)
    save_wav(os.path.join(SOUNDS, "clean-trash.wav"), n)
    print("✓ clean-trash.wav")


def gen_clean_evidence():
    """Whoosh sound — filtered noise sweep"""
    dur = 0.3
    n = int(RATE * dur)
    s = []
    for i in range(n):
        t = i / RATE
        # Sweep a sine that acts as a filter center
        center = 400 + 2000 * (t / dur)
        sample = (random.random() * 2 - 1) * 0.3
        # Simple resonance via mixing with swept sine
        sample += 0.2 * math.sin(2 * math.pi * center * t)
        s.append(sample)
    s = envelope(s, attack=0.02, release=0.1)
    save_wav(os.path.join(SOUNDS, "clean-evidence.wav"), s)
    print("✓ clean-evidence.wav")


def gen_clean_furniture():
    """Solid thunk/click — low tone with sharp attack"""
    low = sine(120, 0.12, 0.5)
    click = noise(0.01, 0.4)
    tap = sine(300, 0.03, 0.3)
    s = mix(low, click, tap)
    s = envelope(s, attack=0.002, decay=0.02, sustain=0.4, release=0.05)
    save_wav(os.path.join(SOUNDS, "clean-furniture.wav"), s)
    print("✓ clean-furniture.wav")


# ═══════════════════════════════════════════
# MUSIC (simple looping background tracks)
# ═══════════════════════════════════════════

def gen_music_track(filename, base_freq, tempo_bpm, mood_intervals, duration_sec=16):
    """Generate a simple looping music track"""
    beat_dur = 60.0 / tempo_bpm
    samples = [0.0] * int(RATE * duration_sec)

    # Bass line
    t = 0
    while t < duration_sec:
        for interval in mood_intervals:
            if t >= duration_sec:
                break
            freq = base_freq * (2 ** (interval / 12.0))
            note = envelope(sine(freq, beat_dur * 0.8, 0.2), attack=0.01, release=0.1)
            start = int(t * RATE)
            for i, s in enumerate(note):
                idx = start + i
                if idx < len(samples):
                    samples[idx] += s
            t += beat_dur

    # Pad/chord layer (soft sustained)
    t = 0
    chord_dur = beat_dur * 4
    while t < duration_sec:
        for interval in mood_intervals[:3]:
            freq = base_freq * 2 * (2 ** (interval / 12.0))
            note = envelope(sine(freq, chord_dur * 0.9, 0.08), attack=0.05, release=0.2)
            start = int(t * RATE)
            for i, s in enumerate(note):
                idx = start + i
                if idx < len(samples):
                    samples[idx] += s
        t += chord_dur

    # Light percussion
    t = 0
    while t < duration_sec:
        tick = envelope(noise(0.01, 0.08), attack=0.001, release=0.008)
        start = int(t * RATE)
        for i, s in enumerate(tick):
            idx = start + i
            if idx < len(samples):
                samples[idx] += s
        t += beat_dur

    # Normalize
    peak = max(abs(s) for s in samples) or 1
    samples = [s / peak * 0.7 for s in samples]

    save_wav(os.path.join(MUSIC, filename), samples)
    print(f"✓ {filename}")


def gen_menu_music():
    # Chill, inviting — C major feel
    gen_music_track("menu.wav", 130.81, 90, [0, 4, 7, 12, 7, 4, 0, 5], 16)


def gen_apartment_music():
    # Slightly tense, minor key
    gen_music_track("apartment.wav", 146.83, 110, [0, 3, 7, 10, 7, 3, 0, 5], 16)


def gen_warehouse_music():
    # Darker, more industrial
    gen_music_track("warehouse.wav", 110.0, 100, [0, 3, 5, 7, 10, 7, 5, 3], 16)


def gen_office_music():
    # Upbeat, slightly jazzy
    gen_music_track("office.wav", 164.81, 120, [0, 4, 7, 11, 7, 4, 2, 5], 16)


# ═══════════════════════════════════════════

if __name__ == "__main__":
    print("🔊 Generating SFX...")
    gen_scrub()
    gen_stain_clean()
    gen_combo_up()
    gen_tool_switch()
    gen_button_tap()
    gen_level_complete()
    gen_level_fail()
    gen_star_earned()
    gen_timer_warning()
    gen_scrub_blood()
    gen_scrub_glass()
    gen_scrub_trash()
    gen_scrub_evidence()
    gen_scrub_furniture()
    gen_clean_blood()
    gen_clean_glass()
    gen_clean_trash()
    gen_clean_evidence()
    gen_clean_furniture()

    print("\n🎵 Generating Music...")
    gen_menu_music()
    gen_apartment_music()
    gen_warehouse_music()
    gen_office_music()

    print("\n🎮 All audio generated!")
