/**
 * Combo System
 *
 * When a stain is cleaned, the combo counter increases.
 * If no stain is cleaned for COMBO_TIMEOUT ms, combo resets.
 * Combo gives score multiplier + cleaning speed boost at high combos.
 */

const COMBO_TIMEOUT = 2000; // ms

// ── Combo tiers ─────────────────────────
export type ComboTier = 'none' | 'warm' | 'hot' | 'blazing' | 'inferno';

export function getComboTier(count: number): ComboTier {
  if (count < 2) return 'none';
  if (count < 4) return 'warm';
  if (count < 7) return 'hot';
  if (count < 10) return 'blazing';
  return 'inferno';
}

/** Cleaning rate bonus from high combos */
export function comboCleanBoost(count: number): number {
  if (count < 3) return 1.0;
  if (count < 6) return 1.1;
  if (count < 9) return 1.2;
  return 1.3;
}

export interface ComboState {
  count: number;
  multiplier: number;
  lastCleanTime: number;
  maxCombo: number;
}

export function createComboState(): ComboState {
  return { count: 0, multiplier: 1, lastCleanTime: 0, maxCombo: 0 };
}

export function onStainCleaned(state: ComboState, now: number): ComboState {
  const timeSinceLast = now - state.lastCleanTime;

  if (timeSinceLast < COMBO_TIMEOUT && state.lastCleanTime > 0) {
    // Combo continues
    const newCount = state.count + 1;
    const multiplier = 1 + newCount * 0.25; // 1x, 1.25x, 1.5x, 1.75x ...
    return {
      count: newCount,
      multiplier,
      lastCleanTime: now,
      maxCombo: Math.max(state.maxCombo, newCount),
    };
  }

  // Combo reset
  return {
    count: 1,
    multiplier: 1,
    lastCleanTime: now,
    maxCombo: Math.max(state.maxCombo, 1),
  };
}

export function tickCombo(state: ComboState, now: number): ComboState {
  if (state.count > 0 && now - state.lastCleanTime > COMBO_TIMEOUT) {
    return { ...state, count: 0, multiplier: 1 };
  }
  return state;
}
