import { Position, StainData, ToolType, ToolConfig, TOOLS, TOOL_STAIN_MAP, LevelModifiers, CleanableObjectData } from './types';
import { TOOL_BEHAVIORS, getToolSpeedMultiplier, getDynamicReach } from './toolBehaviors';

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
 * Now uses tool-specific speed multipliers from toolBehaviors (Feature 4).
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
  const behavior = TOOL_BEHAVIORS[activeTool];
  const allowedStains = TOOL_STAIN_MAP[activeTool];

  // Use tool-specific speed multiplier
  const speedMultiplier = getToolSpeedMultiplier(activeTool, speed);

  // Dynamic reach for mop (expands with speed)
  const effectiveReach = activeTool === 'mop'
    ? getDynamicReach('mop', speed) + (tool.reach - TOOLS.mop.reach) // add upgrade bonus
    : tool.reach;

  const speedBonus = opts?.speedBonus ?? 1;
  const comboBoost = opts?.comboBoost ?? 1;
  let cleaned = 0;

  const updated = stains.map((stain) => {
    if (stain.dirtLevel <= 0) return stain;

    // Check if tool can clean this type
    if (!allowedStains.includes(stain.type)) return stain;

    const dist = distance(toolPosition, stain.position);
    if (dist < stain.radius + effectiveReach) {
      // If stain needs spray pre-treatment and hasn't been sprayed yet
      if (stain.needsSpray && !stain.sprayed) {
        if (activeTool === 'spray') {
          // Spray marks it as treated but doesn't clean
          return { ...stain, sprayed: true };
        }
        // Other tools can't work on unsprayed stains
        return stain;
      }

      // Feature 4: Spray in 'apply' mode marks stains with sprayApplied for auto-dissolve
      if (behavior.mode === 'apply' && !stain.needsSpray) {
        if (!stain.sprayApplied) {
          return { ...stain, sprayApplied: true };
        }
        // If already applied, let auto-dissolve handle it
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
 * Feature 4: Auto-dissolve spray-applied stains.
 * Runs every tick regardless of active tool.
 */
export function tickSprayDissolve(stains: StainData[]): { stains: StainData[]; cleaned: number } {
  const dissolveRate = TOOL_BEHAVIORS.spray.dissolveRate ?? 0.015;
  let cleaned = 0;

  const updated = stains.map((stain) => {
    if (!stain.sprayApplied || stain.dirtLevel <= 0.01) return stain;

    const newDirt = Math.max(0, stain.dirtLevel - dissolveRate);
    if (stain.dirtLevel > 0.01 && newDirt <= 0.01) {
      cleaned++;
    }
    return { ...stain, dirtLevel: newDirt };
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
 * Feature 3: Clean object segments near tool position.
 * Same mechanics as cleanTick but for object segments.
 */
export function cleanObjectTick(
  objects: CleanableObjectData[],
  toolPosition: Position,
  activeTool: ToolType,
  speed: number = 0,
  opts?: { toolOverride?: ToolConfig; speedBonus?: number; comboBoost?: number }
): { objects: CleanableObjectData[]; cleaned: number } {
  const tool = opts?.toolOverride ?? TOOLS[activeTool];
  const allowedStains = TOOL_STAIN_MAP[activeTool];
  const speedMultiplier = getToolSpeedMultiplier(activeTool, speed);
  const effectiveReach = activeTool === 'mop'
    ? getDynamicReach('mop', speed) + (tool.reach - TOOLS.mop.reach)
    : tool.reach;
  const speedBonus = opts?.speedBonus ?? 1;
  const comboBoost = opts?.comboBoost ?? 1;
  let cleaned = 0;

  const updated = objects.map((obj) => {
    const updatedSegments = obj.segments.map((seg) => {
      if (seg.dirtLevel <= 0.01) return seg;
      if (!allowedStains.includes(seg.stainType)) return seg;

      const segPos: Position = {
        x: obj.position.x + seg.offsetX,
        y: obj.position.y + seg.offsetY,
      };
      const dist = distance(toolPosition, segPos);
      if (dist < seg.radius + effectiveReach) {
        const toughness = obj.toughness ?? 1;
        const rate = (BASE_CLEAN_RATE * tool.power * speedMultiplier * speedBonus * comboBoost) / toughness;
        const newDirt = Math.max(0, seg.dirtLevel - rate);

        if (seg.dirtLevel > 0.01 && newDirt <= 0.01) {
          cleaned++;
        }
        return { ...seg, dirtLevel: newDirt };
      }
      return seg;
    });

    return { ...obj, segments: updatedSegments };
  });

  return { objects: updated, cleaned };
}

/**
 * Feature 3: Calculate total progress including both stains and objects.
 */
export function calculateTotalProgress(stains: StainData[], objects?: CleanableObjectData[]): number {
  const stainItems = stains.length;
  const segmentItems = objects
    ? objects.reduce((sum, o) => sum + o.segments.length, 0)
    : 0;
  const total = stainItems + segmentItems;
  if (total === 0) return 1;

  const stainDirt = stains.reduce((sum, s) => sum + s.dirtLevel, 0);
  const segmentDirt = objects
    ? objects.reduce((sum, o) => sum + o.segments.reduce((ss, seg) => ss + seg.dirtLevel, 0), 0)
    : 0;

  return 1 - (stainDirt + segmentDirt) / total;
}

/**
 * Feature 3: Check if all stains AND all object segments are cleaned.
 */
export function isLevelCompleteWithObjects(stains: StainData[], objects?: CleanableObjectData[]): boolean {
  const stainsClean = stains.every((s) => s.dirtLevel <= 0.01);
  if (!objects || objects.length === 0) return stainsClean;

  const objectsClean = objects.every((o) =>
    o.segments.every((seg) => seg.dirtLevel <= 0.01)
  );
  return stainsClean && objectsClean;
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
