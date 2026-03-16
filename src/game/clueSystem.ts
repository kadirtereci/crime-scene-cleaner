/**
 * Clue System — manages hidden clue reveals and collection
 */
import { ClueData } from './storyTypes';

export interface ClueState {
  clues: ClueData[];
  /** IDs of clues revealed this level */
  revealedIds: Set<string>;
  /** IDs of clues collected this level */
  collectedIds: Set<string>;
}

export function createClueState(clues: ClueData[]): ClueState {
  return {
    clues: clues.map((c) => ({ ...c, revealed: false, collected: false })),
    revealedIds: new Set(),
    collectedIds: new Set(),
  };
}

/**
 * Reveal a clue (called when the mess object above it is fully cleaned)
 */
export function revealClue(state: ClueState, clueId: string): ClueState {
  if (state.revealedIds.has(clueId)) return state;

  const revealedIds = new Set(state.revealedIds);
  revealedIds.add(clueId);

  const clues = state.clues.map((c) =>
    c.id === clueId ? { ...c, revealed: true } : c
  );

  return { ...state, clues, revealedIds };
}

/**
 * Collect a clue (called when player taps a revealed clue)
 */
export function collectClue(state: ClueState, clueId: string): ClueState {
  if (state.collectedIds.has(clueId)) return state;

  const collectedIds = new Set(state.collectedIds);
  collectedIds.add(clueId);

  const clues = state.clues.map((c) =>
    c.id === clueId ? { ...c, collected: true } : c
  );

  return { ...state, clues, collectedIds };
}

/**
 * Get all revealed but not yet collected clues
 */
export function getRevealedUncollectedClues(state: ClueState): ClueData[] {
  return state.clues.filter((c) => c.revealed && !c.collected);
}

/**
 * Get all collected clue IDs
 */
export function getCollectedClueIds(state: ClueState): string[] {
  return Array.from(state.collectedIds);
}
