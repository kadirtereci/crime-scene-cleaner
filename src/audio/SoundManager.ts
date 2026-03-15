/**
 * SoundManager — singleton for SFX + music via expo-av
 * 
 * Guarantees:
 * - Only ONE music track plays at a time (stop previous before starting next)
 * - SFX are debounced to prevent overlapping floods
 * - Each SFX has a cooldown to avoid cacophony
 */
import { Audio, AVPlaybackSource } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StainType } from '../game/types';

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

const PREFS_KEY = 'csc_audio_prefs';

// ── State ────────────────────────────────
let sfxSounds: Partial<Record<SFXKey, Audio.Sound>> = {};
let musicSound: Audio.Sound | null = null;
let currentMusicKey: MusicKey | null = null;
let sfxEnabled = true;
let musicEnabled = true;
let policeLightsEnabled = true;
let initialized = false;

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

// Stain-type-specific sound instances & debounce
const scrubSounds: Partial<Record<StainType, Audio.Sound>> = {};
const cleanSounds: Partial<Record<StainType, Audio.Sound>> = {};
const lastScrubPlayed: Partial<Record<StainType, number>> = {};
const lastCleanPlayed: Partial<Record<StainType, number>> = {};
const SCRUB_COOLDOWN = 180;
const CLEAN_COOLDOWN = 200;

const musicSources: Record<MusicKey, AVPlaybackSource> = {
  menu: require('../../assets/music/menu.wav'),
  apartment: require('../../assets/music/apartment.wav'),
  warehouse: require('../../assets/music/warehouse.wav'),
  office: require('../../assets/music/office.wav'),
};
/* eslint-enable @typescript-eslint/no-require-imports */

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

  /**
   * Play a sound effect with debounce protection.
   * Won't replay the same SFX until its cooldown has passed.
   */
  async playSFX(key: SFXKey) {
    if (!sfxEnabled) return;

    // Debounce check
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
        if (status.isLoaded && status.isPlaying) {
          // Already playing — skip to avoid overlap
          return;
        }
        await sfxSounds[key]!.setPositionAsync(0);
        await sfxSounds[key]!.playAsync();
      } else {
        const { sound } = await Audio.Sound.createAsync(source, { volume: 0.6 });
        sfxSounds[key] = sound;
        await sound.playAsync();
      }
    } catch {}
  },

  /**
   * Play stain-type-specific scrub sound (while actively cleaning).
   * Falls back to generic 'scrub' if type-specific sound fails.
   */
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

  /**
   * Play stain-type-specific completion sound (when a stain is fully cleaned).
   * Falls back to generic 'stainClean' if type-specific sound fails.
   */
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

  /** Stop ALL currently playing SFX */
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

  /**
   * Play a music track. Automatically stops any currently playing music first.
   * Only one music track plays at any time.
   * If the same track is already playing, does nothing.
   */
  async playMusic(track: MusicKey) {
    if (!musicEnabled) return;

    // Same track already playing — skip
    if (currentMusicKey === track && musicSound) {
      try {
        const status = await musicSound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) return;
      } catch {}
    }

    // Stop whatever is playing first
    await this.stopMusic();

    const source = musicSources[track];
    if (!source) return;

    try {
      const { sound } = await Audio.Sound.createAsync(source, {
        isLooping: true,
        volume: 0.3,
      });
      musicSound = sound;
      currentMusicKey = track;
      await sound.playAsync();
    } catch {}
  },

  /** Stop and unload current music track */
  async stopMusic() {
    try {
      if (musicSound) {
        const s = musicSound;
        musicSound = null;
        currentMusicKey = null;
        await s.stopAsync();
        await s.unloadAsync();
      }
    } catch {
      musicSound = null;
      currentMusicKey = null;
    }
  },

  async pauseMusic() {
    try {
      await musicSound?.pauseAsync();
    } catch {}
  },

  async resumeMusic() {
    if (!musicEnabled) return;
    try {
      await musicSound?.playAsync();
    } catch {}
  },

  /** Which music track is currently active */
  getCurrentMusic: () => currentMusicKey,

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
    if (!enabled) await this.stopMusic();
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
