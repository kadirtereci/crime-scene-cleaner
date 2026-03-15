import { Position, StainData, ToolType, ToolConfig, TOOLS, TOOL_STAIN_MAP, LevelModifiers } from './types';

/** Base cleaning rate per tick */
const BASE_CLEAN_RATE = 0.025;

/**
 * Calculate distance between two points
 */
export function distance(a: Position, b: Position): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Calculate a speed multiplier for velocity-based cleaning.
 * Stationary = 0.7 (decent passive cleaning), normal scrub = 1.0, fast swipe = 1.3.
 * The curve is gentle — movement is rewarded but standing still works fine.
 */
function getSpeedMultiplier(speed: number): number {
  if (speed < 1) return 0.7;
  // Smooth curve: 0.7 at rest → 1.0 around speed 8 → caps at 1.3
  const multiplier = 0.7 + Math.min(speed / 14, 1) * 0.6;
  return Math.min(multiplier, 1.3);
}

/**
 * Process a cleaning tick – reduces dirtLevel of stains near tool position.
 * Only cleans stains that the active tool can handle.
 * Respects toughness & needsSpray modifiers.
 * Returns { stains, cleaned } where cleaned = number of stains cleaned this tick.
 */
export function cleanTick(
  stains: StainData[],
  toolPosition: Position,
  activeTool: ToolType,
  speed: number = 0,
  opts?: { toolOverride?: ToolConfig; speedBonus?: number; comboBoost?: number }
): { stains: StainData[]; cleaned: number } {
  const tool = opts?.toolOverride ?? TOOLS[activeTool];
  const allowedStains = TOOL_STAIN_MAP[activeTool];
  const speedMultiplier = getSpeedMultiplier(speed);
  const speedBonus = opts?.speedBonus ?? 1;
  const comboBoost = opts?.comboBoost ?? 1;
  let cleaned = 0;

  const updated = stains.map((stain) => {
    if (stain.dirtLevel <= 0) return stain;

    // Check if tool can clean this type
    if (!allowedStains.includes(stain.type)) return stain;

    const dist = distance(toolPosition, stain.position);
    if (dist < stain.radius + tool.reach) {
      // If stain needs spray pre-treatment and hasn't been sprayed yet
      if (stain.needsSpray && !stain.sprayed) {
        if (activeTool === 'spray') {
          // Spray marks it as treated but doesn't clean
          return { ...stain, sprayed: true };
        }
        // Other tools can't work on unsprayed stains
        return stain;
      }

      const toughness = stain.toughness ?? 1;
      const rate = (BASE_CLEAN_RATE * tool.power * speedMultiplier * speedBonus * comboBoost) / toughness;
      const newDirt = Math.max(0, stain.dirtLevel - rate);

      if (stain.dirtLevel > 0.01 && newDirt <= 0.01) {
        cleaned++;
      }

      return { ...stain, dirtLevel: newDirt };
    }
    return stain;
  });

  return { stains: updated, cleaned };
}

/**
 * Tick stain regrowth & spread — call once per second.
 * Stains that are partially cleaned but not fully (>0.01 and <1) regrow.
 * Stains that are dirty spread (increase radius).
 */
export function tickStainEffects(
  stains: StainData[],
  modifiers?: LevelModifiers
): StainData[] {
  return stains.map((stain) => {
    let updated = stain;

    // Regrow
    const regrowRate = stain.regrowRate ?? modifiers?.globalRegrowRate ?? 0;
    if (regrowRate > 0 && stain.dirtLevel > 0.01 && stain.dirtLevel < 0.98) {
      const newDirt = Math.min(1, stain.dirtLevel + regrowRate);
      updated = { ...updated, dirtLevel: newDirt };
    }

    // Spread (radius increase)
    const spreadRate = stain.spreadRate ?? modifiers?.globalSpreadRate ?? 0;
    if (spreadRate > 0 && stain.dirtLevel > 0.3) {
      const maxRadius = stain.radius + 20; // cap growth
      const newRadius = Math.min(maxRadius, updated.radius + spreadRate);
      updated = { ...updated, radius: newRadius };
    }

    return updated;
  });
}

/**
 * Calculate overall progress (0–1) based on remaining dirt
 */
export function calculateProgress(stains: StainData[]): number {
  if (stains.length === 0) return 1;
  const totalDirt = stains.reduce((sum, s) => sum + s.dirtLevel, 0);
  const maxDirt = stains.length;
  return 1 - totalDirt / maxDirt;
}

/**
 * Check if all stains are cleaned
 */
export function isLevelComplete(stains: StainData[]): boolean {
  return stains.every((s) => s.dirtLevel <= 0.01);
}

/**
 * Calculate stars based on time remaining
 */
export function calculateStars(
  timeRemaining: number,
  thresholds: [number, number, number]
): number {
  if (timeRemaining >= thresholds[2]) return 3;
  if (timeRemaining >= thresholds[1]) return 2;
  if (timeRemaining >= thresholds[0]) return 1;
  return 1; // completed = at least 1 star
}
