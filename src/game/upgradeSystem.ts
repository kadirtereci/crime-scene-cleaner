import { ToolType, ToolConfig, TOOLS, ToolUpgrades, UpgradeStat } from './types';

const POWER_BONUSES = [0, 0.10, 0.20, 0.35, 0.50];
const REACH_BONUSES = [0, 5, 10, 16, 22];
const SPEED_BONUSES = [0, 0.08, 0.16, 0.25, 0.35];
const UPGRADE_COSTS = [200, 500, 1000, 2000];
export const MAX_UPGRADE_LEVEL = 4;

export function getEffectiveTool(
  toolType: ToolType,
  upgrades?: ToolUpgrades
): ToolConfig {
  const base = TOOLS[toolType];
  if (!upgrades) return base;
  return {
    ...base,
    power: base.power * (1 + POWER_BONUSES[upgrades.power]),
    reach: base.reach + REACH_BONUSES[upgrades.reach],
  };
}

export function getSpeedBonus(upgrades?: ToolUpgrades): number {
  if (!upgrades) return 1;
  return 1 + SPEED_BONUSES[upgrades.speed];
}

export function getUpgradeCost(currentLevel: number): number | null {
  if (currentLevel >= MAX_UPGRADE_LEVEL) return null;
  return UPGRADE_COSTS[currentLevel];
}

export function canAfford(coins: number, currentLevel: number): boolean {
  const cost = getUpgradeCost(currentLevel);
  return cost !== null && coins >= cost;
}

export function getStatValue(
  toolType: ToolType,
  stat: UpgradeStat,
  level: number
): string {
  const base = TOOLS[toolType];
  switch (stat) {
    case 'power':
      return (base.power * (1 + POWER_BONUSES[level])).toFixed(2);
    case 'reach':
      return `${base.reach + REACH_BONUSES[level]}px`;
    case 'speed':
      return `+${Math.round(SPEED_BONUSES[level] * 100)}%`;
  }
}

export function calculateCoins(score: number, stars: number): number {
  return Math.floor(score / 10) + stars * 50;
}
