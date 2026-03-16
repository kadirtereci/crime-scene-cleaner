import { ToolType } from './types';

// ── Tool Behavior Types ──────────────────────────────────────

export type ToolBehaviorMode = 'swipe' | 'apply' | 'hold';

export interface ToolBehavior {
  mode: ToolBehaviorMode;
  /** Multiplier when stationary (lower = penalizes standing still) */
  stationaryRate: number;
  /** Max speed bonus multiplier */
  maxSpeedBonus: number;
  /** Base reach (overrides TOOLS reach at runtime when speed matters) */
  baseReach: number;
  /** Max reach when moving fast (only for swipe tools with dynamic reach) */
  maxReach: number;
  /** For 'apply' mode: auto-dissolve rate per tick */
  dissolveRate?: number;
  /** For 'hold' mode: hold duration in ms to complete */
  holdDuration?: number;
}

export const TOOL_BEHAVIORS: Record<ToolType, ToolBehavior> = {
  mop: {
    mode: 'swipe',
    stationaryRate: 0.5,     // stationary mopping only 50% effective
    maxSpeedBonus: 1.3,
    baseReach: 55,
    maxReach: 70,            // reach expands with speed
  },
  scrubBrush: {
    mode: 'swipe',
    stationaryRate: 0.7,
    maxSpeedBonus: 1.5,      // bigger speed bonus than mop
    baseReach: 40,
    maxReach: 40,            // no reach expansion
  },
  trashBag: {
    mode: 'swipe',
    stationaryRate: 0.7,
    maxSpeedBonus: 1.3,
    baseReach: 50,
    maxReach: 50,            // standard, no change
  },
  spray: {
    mode: 'apply',
    stationaryRate: 1.0,
    maxSpeedBonus: 1.0,
    baseReach: 60,
    maxReach: 60,
    dissolveRate: 0.015,     // ~2.2s to fully clean
  },
  repairKit: {
    mode: 'hold',
    stationaryRate: 1.0,
    maxSpeedBonus: 1.0,
    baseReach: 45,
    maxReach: 45,
    holdDuration: 1500,      // 1.5s hold to repair
  },
};

/**
 * Calculate dynamic reach for mop based on speed.
 * Returns interpolated reach between baseReach and maxReach.
 */
export function getDynamicReach(tool: ToolType, speed: number): number {
  const behavior = TOOL_BEHAVIORS[tool];
  if (behavior.baseReach === behavior.maxReach) return behavior.baseReach;

  // Smooth interpolation: 0 speed = baseReach, speed ~15+ = maxReach
  const t = Math.min(speed / 15, 1);
  return behavior.baseReach + t * (behavior.maxReach - behavior.baseReach);
}

/**
 * Get tool-specific speed multiplier that respects behavior config.
 * Replaces the generic getSpeedMultiplier for tool-aware cleaning.
 */
export function getToolSpeedMultiplier(tool: ToolType, speed: number): number {
  const behavior = TOOL_BEHAVIORS[tool];

  if (speed < 1) return behavior.stationaryRate;

  // Smooth curve from stationaryRate → maxSpeedBonus
  const range = behavior.maxSpeedBonus - behavior.stationaryRate;
  const t = Math.min(speed / 14, 1);
  return behavior.stationaryRate + t * range;
}
