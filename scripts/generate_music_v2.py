#!/usr/bin/env python3
"""Generate layered music stems (base/rhythm/tension/climax) per environment.

Each environment produces 4 WAV files that play simultaneously in-game.
Volumes are adjusted dynamically based on game state.
"""

import wave, struct, math, random, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MUSIC = os.path.join(BASE, "assets", "music")
RATE = 44100

os.makedirs(MUSIC, exist_ok=True)
random.seed(42)

# ═══════════════════════════════════════════════════════════════════════════════
# Tier 1 — DSP Primitives
# ═══════════════════════════════════════════════════════════════════════════════

# Harmonic presets: list of (harmonic_number, amplitude)
WARM_PAD = [(1, 1.0), (2, 0.5), (3, 0.2), (5, 0.08), (7, 0.03)]
PLUCK = [(1, 1.0), (2, 0.7), (3, 0.5), (4, 0.35), (5, 0.2), (6, 0.12), (8, 0.05)]
SOFT_SQUARE = [(1, 1.0), (3, 0.33), (5, 0.2), (7, 0.14), (9, 0.11)]
ORGAN = [(1, 1.0), (2, 0.8), (3, 0.6), (4, 0.3), (6, 0.15), (8, 0.08)]
BELL = [(1, 1.0), (2.76, 0.5), (4.07, 0.3), (5.58, 0.15), (6.99, 0.08)]


def osc(freq, dur, harmonics, detune_cents=0):
    """Additive synthesis with optional chorus-like detune."""
    n = int(RATE * dur)
    out = [0.0] * n
    detune_ratio = 2 ** (detune_cents / 1200.0)
    for h_num, h_amp in harmonics:
        f = freq * h_num
        # Center voice
        for i in range(n):
            out[i] += h_amp * math.sin(2 * math.pi * f * i / RATE)
        # Detuned voices for chorus effect
        if detune_cents > 0:
            f_up = f * detune_ratio
            f_dn = f / detune_ratio
            for i in range(n):
                out[i] += h_amp * 0.4 * math.sin(2 * math.pi * f_up * i / RATE)
                out[i] += h_amp * 0.4 * math.sin(2 * math.pi * f_dn * i / RATE)
    # Normalize additive result
    peak = max(abs(s) for s in out) or 1.0
    return [s / peak for s in out]


def adsr(samples, a=0.01, d=0.05, s_level=0.7, r=0.1):
    """Full ADSR envelope."""
    n = len(samples)
    ai = int(a * RATE)
    di = int(d * RATE)
    ri = int(r * RATE)
    si = max(0, n - ai - di - ri)
    out = [0.0] * n
    for i in range(n):
        if i < ai:
            e = i / max(ai, 1)
        elif i < ai + di:
            e = 1.0 - (1.0 - s_level) * ((i - ai) / max(di, 1))
        elif i < ai + di + si:
            e = s_level
        else:
            remaining = n - (ai + di + si)
            pos = i - (ai + di + si)
            e = s_level * (1.0 - pos / max(remaining, 1))
        out[i] = samples[i] * max(0.0, e)
    return out


def lowpass(samples, cutoff_hz):
    """Single-pole IIR lowpass filter."""
    rc = 1.0 / (2.0 * math.pi * cutoff_hz)
    dt = 1.0 / RATE
    alpha = dt / (rc + dt)
    out = [0.0] * len(samples)
    out[0] = samples[0] * alpha
    for i in range(1, len(samples)):
        out[i] = out[i - 1] + alpha * (samples[i] - out[i - 1])
    return out


def crossfade_loop(samples, fade_ms=500):
    """Crossfade the tail into the head for seamless looping."""
    fade_n = int(RATE * fade_ms / 1000)
    fade_n = min(fade_n, len(samples) // 4)
    out = list(samples)
    for i in range(fade_n):
        t = i / fade_n
        # Fade in the head, fade out the tail
        tail_idx = len(out) - fade_n + i
        out[i] = out[i] * t + out[tail_idx] * (1.0 - t)
    # Trim tail that was crossfaded
    return out[:len(out) - fade_n]


def save_wav(path, samples):
    """Write mono 16-bit WAV using batch struct.pack."""
    clamped = [max(-1.0, min(1.0, s)) for s in samples]
    packed = struct.pack(f'<{len(clamped)}h', *[int(s * 32767) for s in clamped])
    with wave.open(path, 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(packed)


def mix_into(target, source, offset=0):
    """Mix source into target at sample offset."""
    end = min(len(source), len(target) - offset)
    for i in range(max(0, end)):
        target[offset + i] += source[i]


def normalize(samples, peak=0.7):
    """Normalize to given peak amplitude."""
    mx = max(abs(s) for s in samples) or 1.0
    return [s / mx * peak for s in samples]


def noise(dur, vol=0.2):
    """White noise generator."""
    return [vol * (random.random() * 2 - 1) for _ in range(int(RATE * dur))]


# ═══════════════════════════════════════════════════════════════════════════════
# Tier 2 — Musical Abstractions
# ═══════════════════════════════════════════════════════════════════════════════

def sequence_pattern(base_notes, bars, variation_pct=0.05):
    """Return note sequence with slight random pitch variation each repeat."""
    seq = []
    for bar in range(bars):
        for note in base_notes:
            if note == 0:
                seq.append(0)
            else:
                variation = 1.0 + random.uniform(-variation_pct, variation_pct)
                seq.append(note * variation)
    return seq


def voice_chord(root, intervals, inversion=0):
    """Return chord frequencies with voice leading inversions.

    intervals: list of semitone offsets from root (e.g. [0, 4, 7] for major)
    inversion: rotate the chord notes up by this many positions
    """
    semitones = intervals[inversion:] + intervals[:inversion]
    freqs = []
    octave_shift = 0
    for i, st in enumerate(semitones):
        if i > 0 and st <= semitones[i - 1] if i < len(intervals) else False:
            octave_shift = 1
        freqs.append(root * (2 ** ((st + octave_shift * 12) / 12.0)))
    return freqs


def note_freq(name):
    """Convert note name like 'A2', 'C3', 'E3' to frequency."""
    note_map = {
        'C': -9, 'D': -7, 'E': -5, 'F': -4, 'G': -2, 'A': 0, 'B': 2
    }
    letter = name[0]
    sharp = '#' in name
    octave = int(name[-1])
    semitone = note_map[letter] + (1 if sharp else 0)
    # A4 = 440 Hz
    return 440.0 * (2 ** ((semitone + (octave - 4) * 12) / 12.0))


def generate_rhythm(pattern, beat_dur, bars, fill_every=4):
    """Generate rhythm from pattern with fills and velocity humanization.

    pattern: list of (type, velocity) tuples where type is 'kick', 'snare',
             'hihat', 'rest'. One entry per subdivision.
    Returns list of samples.
    """
    total_steps = len(pattern) * bars
    total_dur = total_steps * beat_dur
    out = [0.0] * int(RATE * total_dur)

    t = 0.0
    for bar in range(bars):
        is_fill = (bar + 1) % fill_every == 0
        for step_idx, (hit_type, vel) in enumerate(pattern):
            v = vel * random.uniform(0.85, 1.0)  # humanize velocity
            pos = int(t * RATE)

            if hit_type == 'kick':
                hit = adsr(osc(55, 0.1, [(1, 1.0)]), a=0.002, d=0.04, s_level=0.3, r=0.05)
                hit = [s * v for s in hit]
                mix_into(out, hit, pos)
            elif hit_type == 'snare':
                n = noise(0.05, v * 0.6)
                body = adsr(osc(180, 0.05, [(1, 1.0)]), a=0.001, d=0.02, s_level=0.2, r=0.02)
                body = [s * v for s in body]
                mix_into(out, n, pos)
                mix_into(out, body, pos)
            elif hit_type == 'hihat':
                dur_ms = 0.03 if not is_fill else 0.06
                hh = noise(dur_ms, v * 0.3)
                hh = lowpass(hh, 8000)
                mix_into(out, hh, pos)
            # 'rest' = silence

            t += beat_dur

    return out


def apply_dynamics(samples, curve='swell'):
    """Apply macro-level volume curve over the entire loop."""
    n = len(samples)
    out = [0.0] * n
    for i in range(n):
        t = i / n
        if curve == 'swell':
            # Gentle swell: rise to middle, slight dip, rise again
            e = 0.7 + 0.3 * math.sin(math.pi * t)
        elif curve == 'crescendo':
            e = 0.5 + 0.5 * t
        elif curve == 'decrescendo':
            e = 1.0 - 0.4 * t
        elif curve == 'breathing':
            e = 0.6 + 0.4 * math.sin(2 * math.pi * t * 2)
        else:
            e = 1.0
        out[i] = samples[i] * e
    return out


def make_silent_stem(num_samples):
    """Generate a near-silent ambient hum (file must exist)."""
    out = [0.0] * num_samples
    # Tiny 60Hz hum, barely audible
    for i in range(num_samples):
        out[i] = 0.005 * math.sin(2 * math.pi * 60 * i / RATE)
    return out


def ensure_length(samples, target_len):
    """Pad or trim samples to exact target length."""
    if len(samples) >= target_len:
        return samples[:target_len]
    return samples + [0.0] * (target_len - len(samples))


def finalize_stem(samples, target_len):
    """Apply crossfade_loop, ensure length, and normalize."""
    samples = ensure_length(samples, target_len)
    samples = crossfade_loop(samples)
    samples = ensure_length(samples, target_len)
    return normalize(samples, 0.7)


# ═══════════════════════════════════════════════════════════════════════════════
# Tier 3 — Track Composers
# ═══════════════════════════════════════════════════════════════════════════════

def gen_menu():
    """Menu: 72 BPM, 48 seconds. Chill, warm, welcoming."""
    bpm = 72
    dur = 48
    beat = 60.0 / bpm
    num_samples = int(RATE * dur)

    # --- BASE: Warm pad, C major -> Am7 -> Fmaj7 -> G7, chorus detune ---
    base = [0.0] * num_samples
    chord_roots = [261.63, 220.00, 174.61, 196.00]  # C4, A3, F3, G3
    chord_intervals = [
        [0, 4, 7],       # C major
        [0, 3, 7, 10],   # Am7
        [0, 4, 7, 11],   # Fmaj7
        [0, 4, 7, 10],   # G7
    ]
    t = 0.0
    ci = 0
    while t < dur:
        root = chord_roots[ci % len(chord_roots)]
        intervals = chord_intervals[ci % len(chord_intervals)]
        chord_dur = beat * 4
        for st in intervals:
            freq = root * (2 ** (st / 12.0))
            tone = osc(freq, min(chord_dur * 0.95, dur - t), WARM_PAD, detune_cents=8)
            tone = adsr(tone, a=0.15, d=0.2, s_level=0.7, r=0.4)
            tone = [s * 0.15 for s in tone]
            mix_into(base, tone, int(t * RATE))
        ci += 1
        t += chord_dur

    base = apply_dynamics(base, 'swell')
    print("  [menu] base")

    # --- RHYTHM: Light brush percussion + slow walking bass ---
    rhythm = [0.0] * num_samples
    # Walking bass with triangle-ish tone
    bass_notes = sequence_pattern([130.81, 146.83, 164.81, 146.83], int(dur / (beat * 4)), 0.02)
    t = 0.0
    for note in bass_notes:
        if t >= dur:
            break
        if note > 0:
            tone = osc(note, beat * 0.7, [(1, 1.0), (3, 0.15)], detune_cents=0)
            tone = adsr(tone, a=0.01, d=0.1, s_level=0.4, r=0.15)
            tone = lowpass(tone, 400)
            tone = [s * 0.2 for s in tone]
            mix_into(rhythm, tone, int(t * RATE))
        t += beat

    # Brush hits
    t = 0.0
    while t < dur:
        brush = noise(0.02, 0.04)
        brush = lowpass(brush, 3000)
        mix_into(rhythm, brush, int(t * RATE))
        t += beat * 0.5

    print("  [menu] rhythm")

    # --- TENSION: Silent (near-silent ambient hum) ---
    tension = make_silent_stem(num_samples)
    print("  [menu] tension")

    # --- CLIMAX: Silent (near-silent ambient hum) ---
    climax = make_silent_stem(num_samples)
    print("  [menu] climax")

    return 'menu', num_samples, base, rhythm, tension, climax


def gen_apartment():
    """Apartment: 105 BPM, 48 seconds. Sneaky noir."""
    bpm = 105
    dur = 48
    beat = 60.0 / bpm
    num_samples = int(RATE * dur)

    # --- BASE: Minor drone (Am), filtered pad, vinyl noise texture ---
    base = [0.0] * num_samples
    # Am drone pad
    drone_freqs = [110.0, 164.81, 220.0]  # A2, E3, A3
    for freq in drone_freqs:
        tone = osc(freq, dur, WARM_PAD, detune_cents=5)
        tone = adsr(tone, a=0.5, d=0.3, s_level=0.6, r=1.0)
        tone = lowpass(tone, 800)
        tone = [s * 0.12 for s in tone]
        mix_into(base, tone, 0)
    # Vinyl noise texture
    vinyl = noise(dur, 0.015)
    vinyl = lowpass(vinyl, 1500)
    mix_into(base, vinyl, 0)
    base = apply_dynamics(base, 'breathing')
    print("  [apartment] base")

    # --- RHYTHM: Plucked bass riff, ticking hi-hat, ghost notes ---
    rhythm = [0.0] * num_samples
    bass_pattern = [110.0, 130.81, 164.81, 146.83]  # A2-C3-E3-D3
    bass_seq = sequence_pattern(bass_pattern, int(dur / (beat * len(bass_pattern))) + 1, 0.03)
    t = 0.0
    for note in bass_seq:
        if t >= dur:
            break
        if note > 0:
            tone = osc(note, beat * 0.5, PLUCK)
            tone = adsr(tone, a=0.005, d=0.08, s_level=0.3, r=0.1)
            tone = [s * 0.25 for s in tone]
            mix_into(rhythm, tone, int(t * RATE))
        t += beat

    # Ticking hi-hat
    t = 0.0
    while t < dur:
        vel = 0.06 if int(t / beat) % 2 == 0 else 0.03  # ghost notes on off-beats
        tick = noise(0.015, vel)
        tick = lowpass(tick, 6000)
        mix_into(rhythm, tick, int(t * RATE))
        t += beat * 0.5

    print("  [apartment] rhythm")

    # --- TENSION: Tremolo strings, heartbeat kick, eerie scale tones ---
    tension = [0.0] * num_samples
    # Tremolo pad (amplitude modulation)
    trem_pad = osc(220.0, dur, WARM_PAD, detune_cents=3)
    trem_pad = adsr(trem_pad, a=0.3, d=0.2, s_level=0.6, r=0.5)
    for i in range(len(trem_pad)):
        tremolo = 0.5 + 0.5 * math.sin(2 * math.pi * 5.0 * i / RATE)
        trem_pad[i] *= tremolo * 0.1
    mix_into(tension, trem_pad, 0)

    # Heartbeat-like low kick (60Hz, 0.1s, repeating)
    t = 0.0
    while t < dur:
        kick = osc(60, 0.1, [(1, 1.0)])
        kick = adsr(kick, a=0.005, d=0.04, s_level=0.3, r=0.05)
        kick = [s * 0.15 for s in kick]
        mix_into(tension, kick, int(t * RATE))
        # Double beat like a heartbeat
        mix_into(tension, [s * 0.7 for s in kick], int((t + 0.2) * RATE))
        t += beat * 4

    # Eerie scale tones
    eerie_notes = [329.63, 311.13, 293.66, 277.18]  # E4, Eb4, D4, C#4
    t = beat * 2
    ei = 0
    while t < dur:
        freq = eerie_notes[ei % len(eerie_notes)]
        tone = osc(freq, beat * 2, BELL)
        tone = adsr(tone, a=0.1, d=0.3, s_level=0.2, r=0.5)
        tone = [s * 0.04 for s in tone]
        mix_into(tension, tone, int(t * RATE))
        ei += 1
        t += beat * 6

    print("  [apartment] tension")

    # --- CLIMAX: Double-time percussion, aggressive bass, dissonant stabs ---
    climax = [0.0] * num_samples
    # Double-time kick + snare
    t = 0.0
    step = 0
    while t < dur:
        if step % 2 == 0:
            kick = osc(50, 0.08, [(1, 1.0)])
            kick = adsr(kick, a=0.002, d=0.03, s_level=0.3, r=0.04)
            kick = [s * 0.3 for s in kick]
            mix_into(climax, kick, int(t * RATE))
        if step % 2 == 1:
            snare = noise(0.05, 0.2)
            body = osc(180, 0.04, [(1, 1.0)])
            body = [s * 0.15 for s in body]
            mix_into(climax, snare, int(t * RATE))
            mix_into(climax, body, int(t * RATE))
        step += 1
        t += beat * 0.5

    # Aggressive bass
    agg_bass = [110.0, 130.81, 110.0, 98.0]
    agg_seq = sequence_pattern(agg_bass, int(dur / (beat * len(agg_bass))) + 1, 0.02)
    t = 0.0
    for note in agg_seq:
        if t >= dur:
            break
        if note > 0:
            tone = osc(note, beat * 0.4, SOFT_SQUARE)
            tone = adsr(tone, a=0.003, d=0.05, s_level=0.5, r=0.05)
            tone = [s * 0.25 for s in tone]
            mix_into(climax, tone, int(t * RATE))
        t += beat

    # Dissonant chord stabs every 4 beats
    t = 0.0
    while t < dur:
        for freq in [220, 233.08, 329.63]:  # Am with b9
            stab = osc(freq, beat * 0.3, SOFT_SQUARE)
            stab = adsr(stab, a=0.005, d=0.05, s_level=0.4, r=0.1)
            stab = [s * 0.1 for s in stab]
            mix_into(climax, stab, int(t * RATE))
        t += beat * 4

    print("  [apartment] climax")

    return 'apartment', num_samples, base, rhythm, tension, climax


def gen_warehouse():
    """Warehouse: 95 BPM, 56 seconds. Dark industrial."""
    bpm = 95
    dur = 56
    beat = 60.0 / bpm
    num_samples = int(RATE * dur)

    # --- BASE: Deep drone (E2 + B2), breathing amplitude modulation ---
    base = [0.0] * num_samples
    drone_e = osc(82.41, dur, WARM_PAD, detune_cents=5)
    drone_b = osc(123.47, dur, WARM_PAD, detune_cents=5)
    drone_e = adsr(drone_e, a=1.0, d=0.5, s_level=0.7, r=2.0)
    drone_b = adsr(drone_b, a=1.0, d=0.5, s_level=0.5, r=2.0)
    # Breathing LFO
    for i in range(num_samples):
        lfo = 0.5 + 0.5 * math.sin(2 * math.pi * 0.15 * i / RATE)
        if i < len(drone_e):
            base[i] += drone_e[i] * 0.15 * lfo
        if i < len(drone_b):
            base[i] += drone_b[i] * 0.1 * lfo

    print("  [warehouse] base")

    # --- RHYTHM: Band-limited square bass (E minor pentatonic), metallic percussion ---
    rhythm = [0.0] * num_samples
    # E minor pentatonic: E2, G2, A2, B2, D3
    bass_notes = [82.41, 98.00, 110.00, 123.47, 146.83, 110.00, 98.00, 82.41]
    bass_seq = sequence_pattern(bass_notes, int(dur / (beat * len(bass_notes))) + 1, 0.03)
    t = 0.0
    for note in bass_seq:
        if t >= dur:
            break
        if note > 0:
            tone = osc(note, beat * 0.5, SOFT_SQUARE)
            tone = adsr(tone, a=0.005, d=0.06, s_level=0.4, r=0.08)
            tone = lowpass(tone, 600)
            tone = [s * 0.25 for s in tone]
            mix_into(rhythm, tone, int(t * RATE))
        t += beat

    # Metallic percussion (noise + high sine ring)
    t = 0.0
    pattern = [1, 0, 1, 0, 1, 1, 0, 1]
    pi_idx = 0
    while t < dur:
        if pattern[pi_idx % len(pattern)]:
            hit = noise(0.03, 0.12)
            hit = adsr(hit, a=0.001, d=0.01, s_level=0.3, r=0.015)
            ring_freq = 800 + random.randint(-100, 100)
            ring = osc(ring_freq, 0.05, BELL)
            ring = adsr(ring, a=0.001, d=0.02, s_level=0.2, r=0.02)
            ring = [s * 0.06 for s in ring]
            mix_into(rhythm, hit, int(t * RATE))
            mix_into(rhythm, ring, int(t * RATE))
        pi_idx += 1
        t += beat * 0.5

    print("  [warehouse] rhythm")

    # --- TENSION: Rising filtered noise, accelerating tick pattern ---
    tension = [0.0] * num_samples
    # Rising filtered noise (cutoff increases over time)
    raw_noise = noise(dur, 0.04)
    for i in range(num_samples):
        progress = i / num_samples
        cutoff = 80 + progress * 2500  # 80Hz -> 2580Hz (starts quieter)
        # Approximate rising filter with per-sample alpha
        rc = 1.0 / (2.0 * math.pi * cutoff)
        dt = 1.0 / RATE
        alpha = dt / (rc + dt)
        if i == 0:
            tension[i] = raw_noise[i] * alpha
        else:
            tension[i] = tension[i - 1] + alpha * (raw_noise[i] - tension[i - 1])

    # Accelerating tick pattern
    tick_interval = beat * 2
    t = 0.0
    while t < dur:
        tick = noise(0.008, 0.04)
        mix_into(tension, tick, int(t * RATE))
        progress = t / dur
        tick_interval = beat * 2 * (1.0 - progress * 0.7)  # speeds up
        t += max(tick_interval, beat * 0.25)

    tension = apply_dynamics(tension, 'crescendo')
    print("  [warehouse] tension")

    # --- CLIMAX: Heavy kick+snare, distorted bass octaves, chaotic percussion ---
    climax = [0.0] * num_samples
    # Heavy kick + snare
    t = 0.0
    step = 0
    while t < dur:
        if step % 4 == 0 or step % 4 == 3:  # kick
            kick = osc(45, 0.1, [(1, 1.0), (2, 0.3)])
            kick = adsr(kick, a=0.002, d=0.04, s_level=0.3, r=0.05)
            kick = [s * 0.35 for s in kick]
            mix_into(climax, kick, int(t * RATE))
        if step % 4 == 2:  # snare
            snare = noise(0.06, 0.25)
            body = osc(160, 0.04, [(1, 1.0)])
            body = [s * 0.2 for s in body]
            mix_into(climax, snare, int(t * RATE))
            mix_into(climax, body, int(t * RATE))
        step += 1
        t += beat * 0.5

    # Distorted bass octaves with clipping
    bass_oct = [82.41, 82.41, 164.82, 82.41, 98.00, 98.00, 196.00, 98.00]
    bass_seq = sequence_pattern(bass_oct, int(dur / (beat * len(bass_oct))) + 1, 0.02)
    t = 0.0
    for note in bass_seq:
        if t >= dur:
            break
        if note > 0:
            tone = osc(note, beat * 0.45, SOFT_SQUARE)
            tone = adsr(tone, a=0.003, d=0.05, s_level=0.5, r=0.05)
            # Soft clipping for distortion
            tone = [max(-0.6, min(0.6, s * 1.5)) for s in tone]
            tone = [s * 0.3 for s in tone]
            mix_into(climax, tone, int(t * RATE))
        t += beat

    # Chaotic percussion
    t = 0.0
    while t < dur:
        if random.random() > 0.3:
            dur_hit = random.uniform(0.01, 0.04)
            vol_hit = random.uniform(0.05, 0.15)
            hit = noise(dur_hit, vol_hit)
            freq_ring = random.uniform(500, 2000)
            ring = osc(freq_ring, dur_hit, BELL)
            ring = [s * 0.03 for s in ring]
            mix_into(climax, hit, int(t * RATE))
            mix_into(climax, ring, int(t * RATE))
        t += beat * 0.25

    print("  [warehouse] climax")

    return 'warehouse', num_samples, base, rhythm, tension, climax


def gen_office():
    """Office: 128 BPM, 45 seconds. Funky upbeat."""
    bpm = 128
    dur = 45
    beat = 60.0 / bpm
    num_samples = int(RATE * dur)

    # --- BASE: Funky organ pad, bright major chords (F-Dm-C-D) ---
    base = [0.0] * num_samples
    chord_data = [
        (174.61, [0, 4, 7]),      # F major
        (146.83, [0, 3, 7]),      # Dm
        (130.81, [0, 4, 7]),      # C major
        (146.83, [0, 4, 7]),      # D major
    ]
    t = 0.0
    ci = 0
    while t < dur:
        root, intervals = chord_data[ci % len(chord_data)]
        chord_dur = beat * 4
        for st in intervals:
            freq = root * (2 ** (st / 12.0))
            tone = osc(freq, min(chord_dur * 0.9, dur - t), ORGAN, detune_cents=4)
            tone = adsr(tone, a=0.05, d=0.1, s_level=0.6, r=0.2)
            tone = [s * 0.12 for s in tone]
            mix_into(base, tone, int(t * RATE))
        ci += 1
        t += chord_dur

    base = apply_dynamics(base, 'swell')
    print("  [office] base")

    # --- RHYTHM: Syncopated bass, kick-snare-hihat groove ---
    rhythm = [0.0] * num_samples
    # Syncopated bass (F-Dm-C-D roots)
    bass_pattern = [174.61, 0, 174.61, 196.00, 220.00, 0, 196.00, 174.61,
                    146.83, 0, 146.83, 164.81, 130.81, 0, 146.83, 164.81]
    bass_seq = sequence_pattern(bass_pattern, int(dur / (beat * 0.5 * len(bass_pattern))) + 1, 0.02)
    t = 0.0
    for note in bass_seq:
        if t >= dur:
            break
        if note > 0:
            tone = osc(note, beat * 0.35, PLUCK)
            tone = adsr(tone, a=0.003, d=0.05, s_level=0.35, r=0.04)
            tone = [s * 0.22 for s in tone]
            mix_into(rhythm, tone, int(t * RATE))
        t += beat * 0.5

    # Kick-snare-hihat groove
    t = 0.0
    step = 0
    while t < dur:
        if step % 4 == 0:  # kick
            kick = osc(55, 0.08, [(1, 1.0)])
            kick = adsr(kick, a=0.002, d=0.03, s_level=0.3, r=0.04)
            kick = [s * 0.25 for s in kick]
            mix_into(rhythm, kick, int(t * RATE))
        if step % 4 == 2:  # snare
            snare = noise(0.04, 0.15)
            mix_into(rhythm, snare, int(t * RATE))
        # hihat on every 8th note
        hh = noise(0.012, 0.05)
        hh = lowpass(hh, 7000)
        mix_into(rhythm, hh, int(t * RATE))
        step += 1
        t += beat * 0.5

    print("  [office] rhythm")

    # --- TENSION: Staccato 8th-note chords, urgent melody riff ---
    tension = [0.0] * num_samples
    # Staccato chords (short sine bursts)
    stac_chords = [
        [349.23, 440.00, 523.25],  # F
        [293.66, 349.23, 440.00],  # Dm
        [261.63, 329.63, 392.00],  # C
        [293.66, 370.00, 440.00],  # D
    ]
    t = 0.0
    ci = 0
    beat_count = 0
    while t < dur:
        chord = stac_chords[ci % len(stac_chords)]
        for freq in chord:
            tone = osc(freq, beat * 0.25, [(1, 1.0), (2, 0.3)])
            tone = adsr(tone, a=0.003, d=0.02, s_level=0.4, r=0.03)
            tone = [s * 0.08 for s in tone]
            mix_into(tension, tone, int(t * RATE))
        beat_count += 1
        if beat_count % 4 == 0:
            ci += 1
        t += beat * 0.5

    # Urgent melody riff
    melody = [523.25, 587.33, 659.26, 587.33, 523.25, 440.00, 523.25, 587.33,
              659.26, 698.46, 659.26, 587.33, 523.25, 587.33, 523.25, 440.00]
    t = beat
    mi = 0
    while t < dur:
        freq = melody[mi % len(melody)]
        tone = osc(freq, beat * 0.3, PLUCK)
        tone = adsr(tone, a=0.005, d=0.04, s_level=0.3, r=0.06)
        tone = [s * 0.07 for s in tone]
        mix_into(tension, tone, int(t * RATE))
        mi += 1
        t += beat * 0.5

    print("  [office] tension")

    # --- CLIMAX: Full funk band — fills, open hihats, octave bass ---
    climax = [0.0] * num_samples
    # Octave bass
    bass_oct = [174.61, 0, 349.23, 174.61, 196.00, 0, 392.00, 196.00,
                146.83, 0, 293.66, 146.83, 164.81, 0, 329.63, 164.81]
    bass_seq = sequence_pattern(bass_oct, int(dur / (beat * 0.5 * len(bass_oct))) + 1, 0.02)
    t = 0.0
    for note in bass_seq:
        if t >= dur:
            break
        if note > 0:
            tone = osc(note, beat * 0.3, PLUCK)
            tone = adsr(tone, a=0.003, d=0.04, s_level=0.4, r=0.04)
            tone = [s * 0.2 for s in tone]
            mix_into(climax, tone, int(t * RATE))
        t += beat * 0.5

    # Full drum pattern with fills
    t = 0.0
    step = 0
    bar_step = 0
    while t < dur:
        bar_num = int(step / 8)
        bar_step = step % 8
        is_fill_bar = (bar_num + 1) % 4 == 0

        # Kick
        if bar_step in [0, 3, 4, 6] or (is_fill_bar and bar_step in [0, 1, 2, 3, 4, 5, 6, 7]):
            kick = osc(50, 0.07, [(1, 1.0)])
            kick = adsr(kick, a=0.002, d=0.03, s_level=0.3, r=0.03)
            kick = [s * 0.25 for s in kick]
            mix_into(climax, kick, int(t * RATE))

        # Snare
        if bar_step in [2, 6] or (is_fill_bar and bar_step >= 4):
            snare = noise(0.04, 0.18)
            body = osc(180, 0.03, [(1, 1.0)])
            body = [s * 0.12 for s in body]
            mix_into(climax, snare, int(t * RATE))
            mix_into(climax, body, int(t * RATE))

        # Open hihats (longer noise bursts)
        hh_dur = 0.06 if bar_step % 2 == 0 else 0.02
        hh_vol = 0.07 if bar_step % 2 == 0 else 0.04
        hh = noise(hh_dur, hh_vol)
        hh = lowpass(hh, 9000)
        mix_into(climax, hh, int(t * RATE))

        step += 1
        t += beat * 0.5

    # Chord stabs for funk feel
    t = 0.0
    ci = 0
    while t < dur:
        chord = stac_chords[ci % len(stac_chords)] if ci < len(stac_chords) * 100 else stac_chords[0]
        root_idx = ci % len(stac_chords)
        chord = [
            [349.23, 440.00, 523.25],
            [293.66, 349.23, 440.00],
            [261.63, 329.63, 392.00],
            [293.66, 370.00, 440.00],
        ][root_idx]
        for freq in chord:
            tone = osc(freq, beat * 0.15, ORGAN)
            tone = adsr(tone, a=0.003, d=0.02, s_level=0.3, r=0.02)
            tone = [s * 0.06 for s in tone]
            mix_into(climax, tone, int(t * RATE))
        ci += 1
        t += beat * 2

    print("  [office] climax")

    return 'office', num_samples, base, rhythm, tension, climax


# ═══════════════════════════════════════════════════════════════════════════════
# Main — Generate all stems and clean up old files
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    generators = [gen_menu, gen_apartment, gen_warehouse, gen_office]
    stem_names = ['base', 'rhythm', 'tension', 'climax']

    for gen_fn in generators:
        env_name, num_samples, base, rhythm, tension_stem, climax = gen_fn()
        stems = [base, rhythm, tension_stem, climax]

        for stem, stem_name in zip(stems, stem_names):
            finalized = finalize_stem(stem, num_samples)
            path = os.path.join(MUSIC, f"{env_name}_{stem_name}.wav")
            save_wav(path, finalized)
            print(f"    -> saved {env_name}_{stem_name}.wav")

        print(f"  [{env_name}] all 4 stems done\n")

    # Delete old single-layer files
    old_files = ['menu.wav', 'apartment.wav', 'warehouse.wav', 'office.wav']
    for old in old_files:
        old_path = os.path.join(MUSIC, old)
        if os.path.exists(old_path):
            os.remove(old_path)
            print(f"  Deleted old file: {old}")

    print("\nAll 16 layered music stems generated successfully!")
