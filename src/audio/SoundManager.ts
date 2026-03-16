/**
 * SoundManager — singleton for SFX + adaptive multi-layer music via expo-av
 *
 * Guarantees:
 * - 4-layer adaptive music system (base, rhythm, tension, climax)
 * - Layers play simultaneously, volumes adjusted by game state
 * - Smooth volume transitions via lerp (no jarring cuts)
 * - SFX are debounced to prevent overlapping floods
 * - Backward compatible: playMusic() still works for simple cases
 */
import { Audio, AVPlaybackSource } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StainType, MusicLayer, MusicIntensityState } from '../game/types';

type SFXKey =
  | 'scrub'
  | 'stainClean'
  | 'comboUp'
  | 'toolSwitch'
  | 'buttonTap'
  | 'levelComplete'
  | 'levelFail'
  | 'starEarned'
  | 'timerWarning'
  | 'reject';

type MusicKey = 'menu' | 'apartment' | 'warehouse' | 'office';

const MUSIC_LAYERS: MusicLayer[] = ['base', 'rhythm', 'tension', 'climax'];

const PREFS_KEY = 'csc_audio_prefs';

// ── State ────────────────────────────────
let sfxSounds: Partial<Record<SFXKey, Audio.Sound>> = {};
let sfxEnabled = true;
let musicEnabled = true;
let policeLightsEnabled = true;
let initialized = false;

// ── Adaptive Music State ─────────────────
let layers: Record<MusicLayer, Audio.Sound | null> = {
  base: null, rhythm: null, tension: null, climax: null,
};
let layerVolumes: Record<MusicLayer, number> = {
  base: 0, rhythm: 0, tension: 0, climax: 0,
};
let targetVolumes: Record<MusicLayer, number> = {
  base: 0, rhythm: 0, tension: 0, climax: 0,
};
let currentMusicKey: MusicKey | null = null;
let volumeSmoothInterval: ReturnType<typeof setInterval> | null = null;
const MASTER_MUSIC_VOLUME = 0.35;
const LERP_FACTOR = 0.15;

// ── Debounce: minimum ms between same SFX ──
const SFX_COOLDOWNS: Record<SFXKey, number> = {
  scrub: 180,
  stainClean: 200,
  comboUp: 400,
  toolSwitch: 150,
  buttonTap: 100,
  levelComplete: 1000,
  levelFail: 1000,
  starEarned: 250,
  timerWarning: 2000,
  reject: 600,
};
const lastPlayed: Partial<Record<SFXKey, number>> = {};

/* eslint-disable @typescript-eslint/no-require-imports */
const sfxSources: Record<SFXKey, AVPlaybackSource> = {
  scrub: require('../../assets/sounds/scrub.wav'),
  stainClean: require('../../assets/sounds/stain-clean.wav'),
  comboUp: require('../../assets/sounds/combo-up.wav'),
  toolSwitch: require('../../assets/sounds/tool-switch.wav'),
  buttonTap: require('../../assets/sounds/button-tap.wav'),
  levelComplete: require('../../assets/sounds/level-complete.wav'),
  levelFail: require('../../assets/sounds/level-fail.wav'),
  starEarned: require('../../assets/sounds/star-earned.wav'),
  timerWarning: require('../../assets/sounds/timer-warning.wav'),
  reject: require('../../assets/sounds/reject.wav'),
};

// Stain-type-specific audio sources
const scrubSources: Record<StainType, AVPlaybackSource> = {
  blood: require('../../assets/sounds/scrub-blood.wav'),
  glass: require('../../assets/sounds/scrub-glass.wav'),
  trash: require('../../assets/sounds/scrub-trash.wav'),
  evidence: require('../../assets/sounds/scrub-evidence.wav'),
  furniture: require('../../assets/sounds/scrub-furniture.wav'),
};

const cleanSources: Record<StainType, AVPlaybackSource> = {
  blood: require('../../assets/sounds/clean-blood.wav'),
  glass: require('../../assets/sounds/clean-glass.wav'),
  trash: require('../../assets/sounds/clean-trash.wav'),
  evidence: require('../../assets/sounds/clean-evidence.wav'),
  furniture: require('../../assets/sounds/clean-furniture.wav'),
};

// Adaptive music stem sources (4 environments × 4 layers)
const musicStemSources: Record<MusicKey, Record<MusicLayer, AVPlaybackSource>> = {
  menu: {
    base: require('../../assets/music/menu_base.wav'),
    rhythm: require('../../assets/music/menu_rhythm.wav'),
    tension: require('../../assets/music/menu_tension.wav'),
    climax: require('../../assets/music/menu_climax.wav'),
  },
  apartment: {
    base: require('../../assets/music/apartment_base.wav'),
    rhythm: require('../../assets/music/apartment_rhythm.wav'),
    tension: require('../../assets/music/apartment_tension.wav'),
    climax: require('../../assets/music/apartment_climax.wav'),
  },
  warehouse: {
    base: require('../../assets/music/warehouse_base.wav'),
    rhythm: require('../../assets/music/warehouse_rhythm.wav'),
    tension: require('../../assets/music/warehouse_tension.wav'),
    climax: require('../../assets/music/warehouse_climax.wav'),
  },
  office: {
    base: require('../../assets/music/office_base.wav'),
    rhythm: require('../../assets/music/office_rhythm.wav'),
    tension: require('../../assets/music/office_tension.wav'),
    climax: require('../../assets/music/office_climax.wav'),
  },
};
/* eslint-enable @typescript-eslint/no-require-imports */

// Stain-type-specific sound instances & debounce
const scrubSounds: Partial<Record<StainType, Audio.Sound>> = {};
const cleanSounds: Partial<Record<StainType, Audio.Sound>> = {};
const lastScrubPlayed: Partial<Record<StainType, number>> = {};
const lastCleanPlayed: Partial<Record<StainType, number>> = {};
const SCRUB_COOLDOWN = 180;
const CLEAN_COOLDOWN = 200;

async function loadPrefs() {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (raw) {
      const prefs = JSON.parse(raw);
      sfxEnabled = prefs.sfx ?? true;
      musicEnabled = prefs.music ?? true;
      policeLightsEnabled = prefs.policeLights ?? true;
    }
  } catch {}
}

async function savePrefs() {
  try {
    await AsyncStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ sfx: sfxEnabled, music: musicEnabled, policeLights: policeLightsEnabled })
    );
  } catch {}
}

/** Compute target volumes from game intensity state */
function computeTargetVolumes(state: MusicIntensityState): Record<MusicLayer, number> {
  const { comboTier, timePercent, isRush, isCleaning } = state;

  // Default: idle
  let base = 0.4;
  let rhythm = 0.0;
  let tension = 0.0;
  let climax = 0.0;

  if (isRush && (comboTier === 'inferno')) {
    // Inferno + rush: maximum intensity
    base = 0.15; rhythm = 0.3; tension = 0.4; climax = 0.6;
  } else if (isRush) {
    // Rush mode
    base = 0.2; rhythm = 0.4; tension = 0.5; climax = 0.5;
  } else if (comboTier === 'blazing' || comboTier === 'inferno') {
    // High combo
    base = 0.25; rhythm = 0.5; tension = 0.3; climax = 0.3;
  } else if (timePercent < 0.4) {
    // Time running low
    base = 0.3; rhythm = 0.35; tension = 0.4; climax = 0.0;
  } else if (comboTier === 'hot') {
    // Medium combo
    base = 0.3; rhythm = 0.45; tension = 0.0; climax = 0.0;
  } else if (isCleaning || comboTier === 'warm') {
    // Actively cleaning
    base = 0.35; rhythm = 0.3; tension = 0.0; climax = 0.0;
  } else {
    // Idle
    base = 0.4; rhythm = 0.0; tension = 0.0; climax = 0.0;
  }

  return { base, rhythm, tension, climax };
}

/** Start the smooth volume interpolation interval */
function startVolumeSmoother() {
  if (volumeSmoothInterval) return;
  volumeSmoothInterval = setInterval(async () => {
    let changed = false;
    for (const layer of MUSIC_LAYERS) {
      const current = layerVolumes[layer];
      const target = targetVolumes[layer];
      if (Math.abs(current - target) > 0.005) {
        const next = current + (target - current) * LERP_FACTOR;
        layerVolumes[layer] = next;
        changed = true;
        try {
          await layers[layer]?.setVolumeAsync(next * MASTER_MUSIC_VOLUME);
        } catch {}
      } else if (current !== target) {
        layerVolumes[layer] = target;
        try {
          await layers[layer]?.setVolumeAsync(target * MASTER_MUSIC_VOLUME);
        } catch {}
      }
    }
    if (!changed) {
      // All volumes settled — keep interval running but skip work
    }
  }, 100);
}

function stopVolumeSmoother() {
  if (volumeSmoothInterval) {
    clearInterval(volumeSmoothInterval);
    volumeSmoothInterval = null;
  }
}

export const SoundManager = {
  async init() {
    if (initialized) return;
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    await loadPrefs();
    initialized = true;
  },

  // ── SFX ────────────────────────────────────

  async playSFX(key: SFXKey) {
    if (!sfxEnabled) return;

    const now = Date.now();
    const cooldown = SFX_COOLDOWNS[key] ?? 100;
    const last = lastPlayed[key] ?? 0;
    if (now - last < cooldown) return;
    lastPlayed[key] = now;

    const source = sfxSources[key];
    if (!source) return;

    try {
      if (sfxSounds[key]) {
        const status = await sfxSounds[key]!.getStatusAsync();
        if (status.isLoaded && status.isPlaying) return;
        await sfxSounds[key]!.setPositionAsync(0);
        await sfxSounds[key]!.playAsync();
      } else {
        const { sound } = await Audio.Sound.createAsync(source, { volume: 0.6 });
        sfxSounds[key] = sound;
        await sound.playAsync();
      }
    } catch {}
  },

  async playScrubSFX(stainType: StainType) {
    if (!sfxEnabled) return;

    const now = Date.now();
    const last = lastScrubPlayed[stainType] ?? 0;
    if (now - last < SCRUB_COOLDOWN) return;
    lastScrubPlayed[stainType] = now;

    const source = scrubSources[stainType];
    if (!source) { this.playSFX('scrub'); return; }

    try {
      if (scrubSounds[stainType]) {
        const status = await scrubSounds[stainType]!.getStatusAsync();
        if (status.isLoaded && status.isPlaying) return;
        await scrubSounds[stainType]!.setPositionAsync(0);
        await scrubSounds[stainType]!.playAsync();
      } else {
        const { sound } = await Audio.Sound.createAsync(source, { volume: 0.6 });
        scrubSounds[stainType] = sound;
        await sound.playAsync();
      }
    } catch {
      this.playSFX('scrub');
    }
  },

  async playCleanSFX(stainType: StainType) {
    if (!sfxEnabled) return;

    const now = Date.now();
    const last = lastCleanPlayed[stainType] ?? 0;
    if (now - last < CLEAN_COOLDOWN) return;
    lastCleanPlayed[stainType] = now;

    const source = cleanSources[stainType];
    if (!source) { this.playSFX('stainClean'); return; }

    try {
      if (cleanSounds[stainType]) {
        const status = await cleanSounds[stainType]!.getStatusAsync();
        if (status.isLoaded && status.isPlaying) return;
        await cleanSounds[stainType]!.setPositionAsync(0);
        await cleanSounds[stainType]!.playAsync();
      } else {
        const { sound } = await Audio.Sound.createAsync(source, { volume: 0.6 });
        cleanSounds[stainType] = sound;
        await sound.playAsync();
      }
    } catch {
      this.playSFX('stainClean');
    }
  },

  async stopSFX(key: SFXKey) {
    try {
      await sfxSounds[key]?.stopAsync();
    } catch {}
  },

  async stopAllSFX() {
    const keys = Object.keys(sfxSounds) as SFXKey[];
    for (const key of keys) {
      try {
        await sfxSounds[key]?.stopAsync();
      } catch {}
    }
    for (const s of Object.values(scrubSounds)) {
      try { await s?.stopAsync(); } catch {}
    }
    for (const s of Object.values(cleanSounds)) {
      try { await s?.stopAsync(); } catch {}
    }
  },

  // ── Adaptive Music System ──────────────────

  /**
   * Load and start 4 music layers simultaneously for the given environment.
   * All layers loop and play in sync; volumes are controlled independently.
   */
  async playAdaptiveMusic(environment: MusicKey) {
    if (!musicEnabled) return;

    // Same environment already playing — skip
    if (currentMusicKey === environment && layers.base) {
      try {
        const status = await layers.base.getStatusAsync();
        if (status.isLoaded && status.isPlaying) return;
      } catch {}
    }

    // Stop any existing music
    await this.stopAdaptiveMusic();

    const sources = musicStemSources[environment];
    if (!sources) return;

    // Set initial target volumes (idle state — only base audible)
    targetVolumes = { base: 0.4, rhythm: 0.0, tension: 0.0, climax: 0.0 };
    layerVolumes = { base: 0.4, rhythm: 0.0, tension: 0.0, climax: 0.0 };

    try {
      // Load all 4 layers
      const loadPromises = MUSIC_LAYERS.map(async (layer) => {
        const { sound } = await Audio.Sound.createAsync(sources[layer], {
          isLooping: true,
          volume: layerVolumes[layer] * MASTER_MUSIC_VOLUME,
        });
        layers[layer] = sound;
      });
      await Promise.all(loadPromises);

      currentMusicKey = environment;

      // Start all layers simultaneously
      const playPromises = MUSIC_LAYERS.map(async (layer) => {
        await layers[layer]?.playAsync();
      });
      await Promise.all(playPromises);

      // Start volume smoothing
      startVolumeSmoother();
    } catch {
      // Cleanup on failure
      await this.stopAdaptiveMusic();
    }
  },

  /**
   * Update music intensity based on current game state.
   * Call this periodically (every ~200ms) from the game loop.
   */
  updateMusicIntensity(state: MusicIntensityState) {
    if (!currentMusicKey) return;
    targetVolumes = computeTargetVolumes(state);
  },

  /** Stop and unload all music layers */
  async stopAdaptiveMusic() {
    stopVolumeSmoother();
    const stopPromises = MUSIC_LAYERS.map(async (layer) => {
      try {
        if (layers[layer]) {
          const s = layers[layer]!;
          layers[layer] = null;
          await s.stopAsync();
          await s.unloadAsync();
        }
      } catch {
        layers[layer] = null;
      }
    });
    await Promise.all(stopPromises);
    currentMusicKey = null;
    layerVolumes = { base: 0, rhythm: 0, tension: 0, climax: 0 };
    targetVolumes = { base: 0, rhythm: 0, tension: 0, climax: 0 };
  },

  /** Pause all music layers (keeps position) */
  async pauseAdaptiveMusic() {
    stopVolumeSmoother();
    for (const layer of MUSIC_LAYERS) {
      try {
        await layers[layer]?.pauseAsync();
      } catch {}
    }
  },

  /** Resume all music layers from where they paused */
  async resumeAdaptiveMusic() {
    if (!musicEnabled) return;
    for (const layer of MUSIC_LAYERS) {
      try {
        await layers[layer]?.playAsync();
      } catch {}
    }
    startVolumeSmoother();
  },

  // ── Backward Compatible Wrappers ───────────

  /** @deprecated Use playAdaptiveMusic instead */
  async playMusic(track: MusicKey) {
    await this.playAdaptiveMusic(track);
  },

  /** @deprecated Use stopAdaptiveMusic instead */
  async stopMusic() {
    await this.stopAdaptiveMusic();
  },

  /** @deprecated Use pauseAdaptiveMusic instead */
  async pauseMusic() {
    await this.pauseAdaptiveMusic();
  },

  /** @deprecated Use resumeAdaptiveMusic instead */
  async resumeMusic() {
    await this.resumeAdaptiveMusic();
  },

  getCurrentMusic: () => currentMusicKey,

  // ── Settings ───────────────────────────────

  isSFXEnabled: () => sfxEnabled,
  isMusicEnabled: () => musicEnabled,
  isPoliceLightsEnabled: () => policeLightsEnabled,

  async setSFXEnabled(enabled: boolean) {
    sfxEnabled = enabled;
    if (!enabled) await this.stopAllSFX();
    await savePrefs();
  },

  async setMusicEnabled(enabled: boolean) {
    musicEnabled = enabled;
    if (!enabled) await this.stopAdaptiveMusic();
    await savePrefs();
  },

  async toggleSFX() {
    await this.setSFXEnabled(!sfxEnabled);
    return sfxEnabled;
  },

  async toggleMusic() {
    await this.setMusicEnabled(!musicEnabled);
    return musicEnabled;
  },

  async setPoliceLightsEnabled(enabled: boolean) {
    policeLightsEnabled = enabled;
    await savePrefs();
  },

  async togglePoliceLights() {
    await this.setPoliceLightsEnabled(!policeLightsEnabled);
    return policeLightsEnabled;
  },
};
