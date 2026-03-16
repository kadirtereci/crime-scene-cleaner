/**
 * Scene Cleaning System — cleaning mechanics for mess objects (rectangular hitbox)
 */
import { Position, ToolType, ToolConfig, TOOLS, TOOL_STAIN_MAP } from './types';
import { MessObjectData } from './storyTypes';

const BASE_CLEAN_RATE = 0.022;

/**
 * Distance from point to rectangle center, accounting for rect dimensions.
 * Returns 0 if point is inside the rectangle.
 */
export function rectDistance(
  point: Position,
  rectCenter: Position,
  rectWidth: number,
  rectHeight: number
): number {
  const halfW = rectWidth / 2;
  const halfH = rectHeight / 2;

  const dx = Math.max(0, Math.abs(point.x - rectCenter.x) - halfW);
  const dy = Math.max(0, Math.abs(point.y - rectCenter.y) - halfH);

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Process a cleaning tick for mess objects.
 * Uses rectangular hitbox instead of circular.
 */
export function cleanMessTick(
  messObjects: MessObjectData[],
  toolPosition: Position,
  activeTool: ToolType,
  opts?: { toolOverride?: ToolConfig; speedBonus?: number; comboBoost?: number }
): { messObjects: MessObjectData[]; cleaned: number } {
  const tool = opts?.toolOverride ?? TOOLS[activeTool];
  const allowedStains = TOOL_STAIN_MAP[activeTool];
  const speedBonus = opts?.speedBonus ?? 1;
  const comboBoost = opts?.comboBoost ?? 1;
  let cleaned = 0;

  const updated = messObjects.map((obj) => {
    if (obj.dirtLevel <= 0) return obj;

    // Check if tool can clean this mess type
    if (!allowedStains.includes(obj.cleanType)) return obj;

    const dist = rectDistance(toolPosition, obj.position, obj.width, obj.height);
    if (dist < tool.reach) {
      const rate = (BASE_CLEAN_RATE * tool.power * speedBonus * comboBoost) / obj.toughness;
      const newDirt = Math.max(0, obj.dirtLevel - rate);

      if (obj.dirtLevel > 0.01 && newDirt <= 0.01) {
        cleaned++;
      }

      return { ...obj, dirtLevel: newDirt };
    }
    return obj;
  });

  return { messObjects: updated, cleaned };
}

/**
 * Calculate scene progress (0-1)
 */
export function calculateSceneProgress(messObjects: MessObjectData[]): number {
  if (messObjects.length === 0) return 1;
  const totalDirt = messObjects.reduce((sum, o) => sum + o.dirtLevel, 0);
  return 1 - totalDirt / messObjects.length;
}

/**
 * Check if all mess objects are cleaned
 */
export function isSceneLevelComplete(messObjects: MessObjectData[]): boolean {
  return messObjects.every((o) => o.dirtLevel <= 0.01);
}

/**
 * Get mess objects in range of tool (for scrub jitter detection)
 */
export function getMessInRange(
  messObjects: MessObjectData[],
  toolPosition: Position,
  activeTool: ToolType,
  toolReach?: number
): Set<string> {
  const reach = toolReach ?? TOOLS[activeTool].reach;
  const allowedStains = TOOL_STAIN_MAP[activeTool];
  const inRange = new Set<string>();

  for (const obj of messObjects) {
    if (obj.dirtLevel <= 0.01) continue;
    if (!allowedStains.includes(obj.cleanType)) continue;
    const dist = rectDistance(toolPosition, obj.position, obj.width, obj.height);
    if (dist < reach) {
      inRange.add(obj.id);
    }
  }

  return inRange;
}
