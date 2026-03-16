// ── Phase 2 Game Types ──────────────────────────────────────

export interface Position {
  x: number;
  y: number;
}

// ── Stain / Object types ────────────────────────────────────
export type StainType = 'blood' | 'glass' | 'trash' | 'evidence' | 'furniture';

/** Which tool can clean which stain */
export const TOOL_STAIN_MAP: Record<ToolType, StainType[]> = {
  mop: ['blood', 'glass'],
  scrubBrush: ['blood', 'glass'],
  trashBag: ['trash'],
  repairKit: ['furniture'],
  spray: ['blood', 'evidence'],
};

export interface StainData {
  id: string;
  type: StainType;
  position: Position;
  /** 0 = fully cleaned, 1 = fully dirty */
  dirtLevel: number;
  /** radius of the stain hitbox */
  radius: number;
  /** cleaning resistance multiplier (default 1). Higher = harder to clean */
  toughness?: number;
  /** must spray first before other tools work (needs pre-treatment) */
  needsSpray?: boolean;
  /** has this stain been sprayed? (runtime flag) */
  sprayed?: boolean;
  /** stain regrows at this rate per second if not fully cleaned (0 = no regrow) */
  regrowRate?: number;
  /** stain spreads to increase radius over time (px per second, 0 = no spread) */
  spreadRate?: number;
  /** spray has been applied for auto-dissolve (Feature 4: tool feel) */
  sprayApplied?: boolean;
}

// ── Object Cleaning types (Feature 3) ──────────────────────
export type ObjectType = 'sofa' | 'carpet' | 'table' | 'wallSection';

export interface ObjectSegment {
  id: string;
  offsetX: number;  // relative to object center
  offsetY: number;  // relative to object center
  radius: number;
  dirtLevel: number;  // 0-1
  stainType: StainType;  // reuses TOOL_STAIN_MAP for compatibility
}

export interface CleanableObjectData {
  id: string;
  type: ObjectType;
  position: Position;
  width: number;
  height: number;
  segments: ObjectSegment[];
  toughness?: number;
}

// ── Tool types ──────────────────────────────────────────────
export type ToolType = 'mop' | 'scrubBrush' | 'trashBag' | 'repairKit' | 'spray';

export interface ToolConfig {
  type: ToolType;
  name: string;
  /** cleaning speed multiplier */
  power: number;
  /** reach radius */
  reach: number;
  icon: string;
}

export const TOOLS: Record<ToolType, ToolConfig> = {
  mop: { type: 'mop', name: 'Mop', power: 1.0, reach: 55, icon: '🧹' },
  scrubBrush: { type: 'scrubBrush', name: 'Scrub Brush', power: 1.3, reach: 40, icon: '🪥' },
  trashBag: { type: 'trashBag', name: 'Trash Bag', power: 1.5, reach: 50, icon: '🗑️' },
  repairKit: { type: 'repairKit', name: 'Repair Kit', power: 0.8, reach: 45, icon: '🧰' },
  spray: { type: 'spray', name: 'Spray', power: 1.2, reach: 60, icon: '🧴' },
};

// ── Environment types ───────────────────────────────────────
export type EnvironmentType = 'apartment' | 'warehouse' | 'office';

export interface EnvironmentConfig {
  type: EnvironmentType;
  name: string;
  floorColor: string;
}

export const ENVIRONMENTS: Record<EnvironmentType, EnvironmentConfig> = {
  apartment: { type: 'apartment', name: 'Apartment', floorColor: '#3b2718' },
  warehouse: { type: 'warehouse', name: 'Warehouse', floorColor: '#82827d' },
  office: { type: 'office', name: 'Office', floorColor: '#464b5f' },
};

// ── Level config ────────────────────────────────────────────
/** Level modifiers that change gameplay rules */
export interface LevelModifiers {
  /** darkness overlay opacity 0-0.7 (0 = normal, 0.5 = very dark) */
  darkness?: number;
  /** "police sirens" — time ticks 2x faster in last N seconds */
  rushLastSeconds?: number;
  /** all stains regrow at this base rate unless overridden per-stain */
  globalRegrowRate?: number;
  /** stains spread at this rate unless overridden per-stain */
  globalSpreadRate?: number;
  /** brief description shown at level start */
  briefing?: string;
}

export interface LevelConfig {
  id: number;
  name: string;
  environment: EnvironmentType;
  stains: StainData[];
  /** cleanable objects with segments (Feature 3) */
  objects?: CleanableObjectData[];
  /** available tools for this level */
  tools: ToolType[];
  /** time limit in seconds */
  timeLimit: number;
  /** 1-3 star thresholds (seconds remaining) */
  starThresholds: [number, number, number];
  /** optional gameplay modifiers */
  modifiers?: LevelModifiers;
}

// ── Stain Colors (per-type) ────────────────────────────────
export const STAIN_COLORS: Record<StainType, string[]> = {
  blood: ['#FF3838', '#FF6B6B', '#CC2E2E'],
  glass: ['#B0E0E6', '#E0F0FF', '#87CEEB'],
  trash: ['#8B6914', '#A0522D', '#6B4226'],
  evidence: ['#FFD700', '#FFA500', '#FFCF48'],
  furniture: ['#DEB887', '#D2691E', '#BC8F5F'],
};

// ── Adaptive Music Types ────────────────────────────────────
export type MusicLayer = 'base' | 'rhythm' | 'tension' | 'climax';

export interface MusicIntensityState {
  comboTier: 'none' | 'warm' | 'hot' | 'blazing' | 'inferno';
  timePercent: number;    // 0-1 (remaining time / total time)
  isRush: boolean;
  isCleaning: boolean;
  progress: number;       // 0-1 cleaning progress
}

// ── Score & Game State ──────────────────────────────────────
export type GameState = 'playing' | 'paused' | 'won' | 'lost';

export interface LevelResult {
  levelId: number;
  stars: number; // 0-3
  score: number;
  timeUsed: number;
  maxCombo: number;
  completed: boolean;
}

// ── Upgrade System ──────────────────────────────────────────
export type UpgradeStat = 'power' | 'reach' | 'speed';

export interface ToolUpgrades {
  power: number; // 0-4
  reach: number;
  speed: number;
}

export const DEFAULT_TOOL_UPGRADES: ToolUpgrades = { power: 0, reach: 0, speed: 0 };

export interface PlayerProgress {
  /** levelId → best result */
  results: Record<number, LevelResult>;
  /** highest unlocked level */
  unlockedLevel: number;
  totalScore: number;
  /** spendable currency */
  coins: number;
  /** per-tool upgrade levels */
  toolUpgrades: Record<ToolType, ToolUpgrades>;
}
