/**
 * Story Mode Types — Scene-based levels with mess objects, clues, and episodes
 */
import { ToolType, EnvironmentType, StainType, Position } from './types';

// ── Mess Object Types ───────────────────────────────────────

/** Identifier for a mess sprite from the mess_assets_named folder */
export type MessSpriteId =
  | 'spilled_coffee_mug'
  | 'crushed_red_can'
  | 'cigarette_butt'
  | 'open_pizza_box'
  | 'face_mask'
  | 'cereal_bowl'
  | 'dirty_tissue'
  | 'cereal_bowl_alt'
  | 'broken_toy_car'
  | 'dust_pile'
  | 'dirty_socks'
  | 'chips_bag'
  | 'blue_paint_spill'
  | 'broken_glass_bottle'
  | 'banana_peel'
  | 'broken_wood_plank'
  | 'spilled_soda_can'
  | 'crumpled_paper'
  | 'broken_pen_pencil'
  | 'tangled_earphones'
  | 'spilled_pet_food'
  | 'tangled_cable'
  | 'pet_food_bowl'
  | 'stack_of_papers'
  | 'plastic_bottle'
  | 'blue_paint_brush'
  | 'broken_plate'
  | 'work_boot'
  | 'work_boot_alt'
  | 'trash_bags'
  | 'tipped_trash_can'
  | 'spoon_on_food_spill'
  | 'cracked_smartphone'
  | 'spilled_candy'
  | 'knocked_over_plant';

/** A mess object placed on the scene */
export interface MessObjectData {
  id: string;
  spriteId: MessSpriteId;
  /** Position as ratio 0-1 (resolved to pixels at runtime) */
  position: Position;
  /** Display width in pixels */
  width: number;
  /** Display height in pixels */
  height: number;
  /** 0 = fully cleaned, 1 = fully dirty */
  dirtLevel: number;
  /** Which tool type cleans this mess */
  cleanType: StainType;
  /** Cleaning resistance (default 1) */
  toughness: number;
  /** Does this object reveal a clue when cleaned? */
  revealsClue?: string; // clue ID
}

// ── Clue Types ──────────────────────────────────────────────

export interface ClueData {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  /** Position as ratio 0-1 */
  position: Position;
  /** Has this clue been revealed (mess object above it cleaned)? */
  revealed: boolean;
  /** Has the player tapped to collect this clue? */
  collected: boolean;
  /** Which episode this clue belongs to */
  episodeId: string;
  /** Index into the episode's report fragments */
  reportFragmentIndex: number;
}

// ── Scene Background ────────────────────────────────────────

export interface SceneBackground {
  /** Clean room image (used during gameplay) */
  cleanImage: number; // require() result
  /** Messy room image (used in result screen before/after) */
  messyImage: number; // require() result
}

// ── Scene Level Config ──────────────────────────────────────

export interface SceneLevelConfig {
  id: number;
  name: string;
  mode: 'scene';
  environment: EnvironmentType;
  /** Scene background images */
  scene: SceneBackground;
  /** Mess objects to clean */
  messObjects: MessObjectData[];
  /** Hidden clues */
  clues: ClueData[];
  /** Available tools */
  tools: ToolType[];
  /** Time limit in seconds */
  timeLimit: number;
  /** Star thresholds (seconds remaining) */
  starThresholds: [number, number, number];
  /** Episode this level belongs to */
  episodeId: string;
  /** Brief story text shown at level start */
  briefing: string;
}

// ── Deduction Types ─────────────────────────────────────────

/** A multiple-choice deduction question at the end of an episode */
export interface DeductionQuestion {
  id: string;
  /** The question text */
  question: string;
  /** Which clue IDs help answer this question (shown as hints) */
  relatedClueIds: string[];
  /** Answer choices */
  choices: DeductionChoice[];
  /** ID of the correct choice */
  correctChoiceId: string;
}

export interface DeductionChoice {
  id: string;
  text: string;
  /** Feedback shown when selected (correct or incorrect) */
  feedback: string;
}

// ── Episode Types ───────────────────────────────────────────

export interface ReportFragment {
  /** Which clue IDs are needed to unlock this fragment */
  requiredClueIds: string[];
  /** The text shown when clues are found */
  text: string;
  /** Placeholder shown when clues are missing */
  placeholder: string;
}

export interface EpisodeData {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  environment: EnvironmentType;
  /** Level IDs in order */
  levelIds: number[];
  /** Report fragments assembled from clues */
  reportFragments: ReportFragment[];
  /** The full incident report (shown when all clues found) */
  fullReport: string;
  /** Deduction questions — player tries to solve the case */
  deductions: DeductionQuestion[];
}

// ── Level Result Extension ──────────────────────────────────

export interface SceneLevelResult {
  levelId: number;
  stars: number;
  score: number;
  timeUsed: number;
  maxCombo: number;
  completed: boolean;
  /** Clues collected in this level */
  collectedClueIds: string[];
}

// ── Story Progress ──────────────────────────────────────────

export interface StoryProgress {
  /** Episode ID → completed level IDs */
  episodeProgress: Record<string, number[]>;
  /** All collected clue IDs across episodes */
  collectedClues: string[];
  /** Episode IDs that have been fully completed with all clues */
  detectiveBadges: string[];
  /** Best results for scene levels */
  sceneResults: Record<number, SceneLevelResult>;
  /** Episode ID → answered deduction question IDs (correctly) */
  solvedDeductions: Record<string, string[]>;
}

export const DEFAULT_STORY_PROGRESS: StoryProgress = {
  episodeProgress: {},
  collectedClues: [],
  detectiveBadges: [],
  sceneResults: {},
  solvedDeductions: {},
};

// ── Union Type ──────────────────────────────────────────────

import { LevelConfig } from './types';

export type AnyLevelConfig = (LevelConfig & { mode?: 'classic' }) | SceneLevelConfig;

export function isSceneLevel(config: AnyLevelConfig): config is SceneLevelConfig {
  return config.mode === 'scene';
}
