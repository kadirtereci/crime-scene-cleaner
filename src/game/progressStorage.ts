import AsyncStorage from '@react-native-async-storage/async-storage';
import { LevelResult, PlayerProgress, ToolType, ToolUpgrades, UpgradeStat, DEFAULT_TOOL_UPGRADES } from './types';
import { getUpgradeCost, calculateCoins } from './upgradeSystem';

const STORAGE_KEY = 'csc_progress';

const ALL_TOOLS: ToolType[] = ['mop', 'scrubBrush', 'trashBag', 'repairKit', 'spray'];

function defaultToolUpgrades(): Record<ToolType, ToolUpgrades> {
  const result = {} as Record<ToolType, ToolUpgrades>;
  for (const t of ALL_TOOLS) {
    result[t] = { ...DEFAULT_TOOL_UPGRADES };
  }
  return result;
}

const DEFAULT_PROGRESS: PlayerProgress = {
  results: {},
  unlockedLevel: 1,
  totalScore: 0,
  coins: 0,
  toolUpgrades: defaultToolUpgrades(),
};

/** Migrate old saves that lack coins/toolUpgrades */
function migrate(raw: Record<string, unknown>): PlayerProgress {
  return {
    results: (raw.results as PlayerProgress['results']) ?? {},
    unlockedLevel: (raw.unlockedLevel as number) ?? 1,
    totalScore: (raw.totalScore as number) ?? 0,
    coins: (raw.coins as number) ?? 0,
    toolUpgrades: (raw.toolUpgrades as Record<ToolType, ToolUpgrades>) ?? defaultToolUpgrades(),
  };
}

export async function loadProgress(): Promise<PlayerProgress> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch {}
  return { ...DEFAULT_PROGRESS, toolUpgrades: defaultToolUpgrades() };
}

export async function saveResult(result: LevelResult): Promise<PlayerProgress> {
  const progress = await loadProgress();

  const prev = progress.results[result.levelId];
  // Only overwrite if better score
  if (!prev || result.score > prev.score) {
    progress.results[result.levelId] = result;
  }

  // Unlock next level
  if (result.completed && result.levelId >= progress.unlockedLevel) {
    progress.unlockedLevel = result.levelId + 1;
  }

  // Recalculate total
  progress.totalScore = Object.values(progress.results).reduce(
    (sum, r) => sum + r.score,
    0
  );

  // Earn coins on every completion
  const coinsEarned = calculateCoins(result.score, result.stars);
  progress.coins += coinsEarned;

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return progress;
}

export async function purchaseUpgrade(
  toolType: ToolType,
  stat: UpgradeStat
): Promise<{ success: boolean; progress: PlayerProgress }> {
  const progress = await loadProgress();
  const current = progress.toolUpgrades[toolType][stat];
  const cost = getUpgradeCost(current);
  if (cost === null || progress.coins < cost) {
    return { success: false, progress };
  }
  progress.coins -= cost;
  progress.toolUpgrades[toolType][stat] = current + 1;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return { success: true, progress };
}

export async function resetProgress(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
