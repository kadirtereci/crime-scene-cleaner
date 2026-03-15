#!/usr/bin/env python3
"""Generate distinct music tracks per environment"""

import wave, struct, math, random, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MUSIC = os.path.join(BASE, "assets", "music")
RATE = 44100

os.makedirs(MUSIC, exist_ok=True)


def save_wav(path, samples):
    with wave.open(path, 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        for s in samples:
            s = max(-1, min(1, s))
            w.writeframes(struct.pack('<h', int(s * 32767)))


def sine(freq, dur, vol=0.5):
    return [vol * math.sin(2 * math.pi * freq * i / RATE) for i in range(int(RATE * dur))]


def square(freq, dur, vol=0.3):
    return [vol * (1 if math.sin(2 * math.pi * freq * i / RATE) >= 0 else -1) for i in range(int(RATE * dur))]


def triangle(freq, dur, vol=0.4):
    period = RATE / freq
    return [vol * (2 * abs(2 * ((i / period) % 1) - 1) - 1) for i in range(int(RATE * dur))]


def noise(dur, vol=0.2):
    return [vol * (random.random() * 2 - 1) for _ in range(int(RATE * dur))]


def env(samples, a=0.02, r=0.1):
    n = len(samples)
    ai = int(a * RATE)
    ri = int(r * RATE)
    out = []
    for i, s in enumerate(samples):
        if i < ai:
            e = i / max(ai, 1)
        elif i > n - ri:
            e = (n - i) / max(ri, 1)
        else:
            e = 1.0
        out.append(s * e)
    return out


def mix_into(target, source, offset=0):
    for i, s in enumerate(source):
        idx = offset + i
        if idx < len(target):
            target[idx] += s


def normalize(samples, peak=0.75):
    mx = max(abs(s) for s in samples) or 1
    return [s / mx * peak for s in samples]


# ═══════════════════════════════════════
# MENU — Chill, warm, welcoming
# Soft piano-like chords, slow tempo
# ═══════════════════════════════════════
def gen_menu():
    dur = 20  # seconds
    bpm = 72
    beat = 60.0 / bpm
    samples = [0.0] * int(RATE * dur)

    # Warm pad chords (C major progression: C - Am - F - G)
    chords = [
        [261.63, 329.63, 392.00],  # C E G
        [220.00, 261.63, 329.63],  # A C E
        [174.61, 220.00, 261.63],  # F A C
        [196.00, 246.94, 293.66],  # G B D
    ]

    t = 0
    ci = 0
    while t < dur:
        chord = chords[ci % len(chords)]
        chord_dur = beat * 4
        for freq in chord:
            note = env(sine(freq, chord_dur * 0.95, 0.12), a=0.08, r=0.3)
            # Add soft triangle overtone
            note2 = env(triangle(freq * 2, chord_dur * 0.9, 0.04), a=0.1, r=0.3)
            mix_into(samples, note, int(t * RATE))
            mix_into(samples, note2, int(t * RATE))
        ci += 1
        t += chord_dur

    # Gentle high melody
    melody_notes = [523, 494, 440, 494, 523, 587, 523, 494,
                    440, 392, 440, 494, 523, 494, 440, 392]
    t = beat * 2
    for note_freq in melody_notes:
        if t >= dur:
            break
        n = env(sine(note_freq, beat * 0.7, 0.08), a=0.02, r=0.15)
        mix_into(samples, n, int(t * RATE))
        t += beat

    save_wav(os.path.join(MUSIC, "menu.wav"), normalize(samples, 0.65))
    print("✓ menu.wav — chill & welcoming")


# ═══════════════════════════════════════
# APARTMENT — Sneaky, tense, minor key
# Plucked bass, suspenseful
# ═══════════════════════════════════════
def gen_apartment():
    dur = 20
    bpm = 105
    beat = 60.0 / bpm
    samples = [0.0] * int(RATE * dur)

    # Minor bass riff (Am feel): A2-C3-E3-D3
    bass_notes = [110, 130.81, 164.81, 146.83, 110, 98, 110, 130.81]
    t = 0
    bi = 0
    while t < dur:
        freq = bass_notes[bi % len(bass_notes)]
        n = env(triangle(freq, beat * 0.6, 0.3), a=0.005, r=0.08)
        mix_into(samples, n, int(t * RATE))
        bi += 1
        t += beat

    # Suspense pad (Am chord with tension)
    pad_chords = [
        [220, 261.63, 329.63],  # Am
        [220, 261.63, 311.13],  # Adim-ish tension
        [196, 246.94, 293.66],  # G
        [174.61, 220, 277.18],  # Fm (borrowed)
    ]
    t = 0
    ci = 0
    while t < dur:
        chord = pad_chords[ci % len(pad_chords)]
        cd = beat * 4
        for freq in chord:
            n = env(sine(freq, cd * 0.9, 0.06), a=0.15, r=0.3)
            mix_into(samples, n, int(t * RATE))
        ci += 1
        t += cd

    # Ticking hi-hat
    t = 0
    while t < dur:
        tick = env(noise(0.015, 0.08), a=0.001, r=0.01)
        mix_into(samples, tick, int(t * RATE))
        t += beat * 0.5

    save_wav(os.path.join(MUSIC, "apartment.wav"), normalize(samples, 0.65))
    print("✓ apartment.wav — sneaky & tense")


# ═══════════════════════════════════════
# WAREHOUSE — Heavy, industrial, dark
# Deep square wave bass, metallic hits
# ═══════════════════════════════════════
def gen_warehouse():
    dur = 20
    bpm = 95
    beat = 60.0 / bpm
    samples = [0.0] * int(RATE * dur)

    # Heavy square bass (E minor pentatonic)
    bass_notes = [82.41, 98, 110, 98, 82.41, 73.42, 82.41, 110]
    t = 0
    bi = 0
    while t < dur:
        freq = bass_notes[bi % len(bass_notes)]
        n = env(square(freq, beat * 0.5, 0.25), a=0.005, r=0.05)
        mix_into(samples, n, int(t * RATE))
        bi += 1
        t += beat

    # Dark drone
    drone1 = env(sine(82.41, dur, 0.08), a=0.5, r=1.0)
    drone2 = env(sine(123.47, dur, 0.05), a=0.5, r=1.0)
    mix_into(samples, drone1, 0)
    mix_into(samples, drone2, 0)

    # Metallic percussion
    t = 0
    pattern = [1, 0, 1, 0, 1, 1, 0, 1]  # rhythm pattern
    pi = 0
    while t < dur:
        if pattern[pi % len(pattern)]:
            hit = env(noise(0.03, 0.15), a=0.001, r=0.02)
            # Add metallic ring
            ring = env(sine(800 + random.randint(-100, 100), 0.04, 0.06), a=0.001, r=0.03)
            mix_into(samples, hit, int(t * RATE))
            mix_into(samples, ring, int(t * RATE))
        pi += 1
        t += beat * 0.5

    # Eerie high pitch every 4 beats
    t = 0
    while t < dur:
        eerieFreq = random.choice([1200, 1400, 1600])
        n = env(sine(eerieFreq, 0.3, 0.03), a=0.05, r=0.2)
        mix_into(samples, n, int(t * RATE))
        t += beat * 4

    save_wav(os.path.join(MUSIC, "warehouse.wav"), normalize(samples, 0.65))
    print("✓ warehouse.wav — heavy & industrial")


# ═══════════════════════════════════════
# OFFICE — Upbeat, funky, playful
# Bouncy bass, bright chords, snappy rhythm
# ═══════════════════════════════════════
def gen_office():
    dur = 20
    bpm = 128
    beat = 60.0 / bpm
    samples = [0.0] * int(RATE * dur)

    # Funky bass (F major / Dm groove)
    bass_pattern = [174.61, 0, 174.61, 196, 220, 0, 196, 174.61,
                    146.83, 0, 146.83, 164.81, 174.61, 0, 196, 220]
    t = 0
    bi = 0
    while t < dur:
        freq = bass_pattern[bi % len(bass_pattern)]
        if freq > 0:
            n = env(triangle(freq, beat * 0.4, 0.28), a=0.003, r=0.04)
            mix_into(samples, n, int(t * RATE))
        bi += 1
        t += beat * 0.5

    # Bright staccato chords
    chords = [
        [349.23, 440, 523.25],  # F A C
        [293.66, 349.23, 440],  # D F A
        [261.63, 329.63, 392],  # C E G
        [293.66, 370.00, 440],  # D F# A (borrowed brightness)
    ]
    t = 0
    ci = 0
    while t < dur:
        chord = chords[ci % len(chords)]
        for freq in chord:
            n = env(sine(freq, beat * 1.5, 0.07), a=0.01, r=0.15)
            mix_into(samples, n, int(t * RATE))
        ci += 1
        t += beat * 2

    # Snappy percussion — kick & snare pattern
    t = 0
    step = 0
    while t < dur:
        if step % 4 == 0:  # kick
            kick = env(sine(60, 0.08, 0.2), a=0.002, r=0.06)
            mix_into(samples, kick, int(t * RATE))
        if step % 4 == 2:  # snare
            snare = env(noise(0.04, 0.12), a=0.001, r=0.03)
            mix_into(samples, snare, int(t * RATE))
        # hihat on all beats
        hh = env(noise(0.01, 0.05), a=0.001, r=0.008)
        mix_into(samples, hh, int(t * RATE))
        step += 1
        t += beat * 0.5

    # Catchy melody riff
    melody = [523, 587, 659, 587, 523, 440, 523, 587,
              659, 698, 659, 587, 523, 587, 523, 440]
    t = beat
    for freq in melody * 2:
        if t >= dur:
            break
        n = env(sine(freq, beat * 0.35, 0.06), a=0.005, r=0.08)
        mix_into(samples, n, int(t * RATE))
        t += beat * 0.5

    save_wav(os.path.join(MUSIC, "office.wav"), normalize(samples, 0.65))
    print("✓ office.wav — upbeat & funky")


if __name__ == "__main__":
    random.seed(42)
    gen_menu()
    gen_apartment()
    gen_warehouse()
    gen_office()
    print("\n🎵 All distinct music tracks generated!")
