/**
 * Score System
 *
 * Base points per stain cleaned: 100
 * Multiplied by combo multiplier
 * Time bonus at end of level
 */

export interface ScoreState {
  score: number;
  stainsCleaned: number;
}

export function createScoreState(): ScoreState {
  return { score: 0, stainsCleaned: 0 };
}

const BASE_STAIN_POINTS = 100;
const TIME_BONUS_PER_SECOND = 10;

export function addStainScore(
  state: ScoreState,
  comboMultiplier: number
): ScoreState {
  const points = Math.round(BASE_STAIN_POINTS * comboMultiplier);
  return {
    score: state.score + points,
    stainsCleaned: state.stainsCleaned + 1,
  };
}

export function addTimeBonus(state: ScoreState, secondsRemaining: number): ScoreState {
  const bonus = secondsRemaining * TIME_BONUS_PER_SECOND;
  return {
    ...state,
    score: state.score + bonus,
  };
}
