import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'csc_tutorial_done';

let completedSteps: Set<string> = new Set();
let loaded = false;

export async function loadTutorialState(): Promise<Set<string>> {
  if (loaded) return completedSteps;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) completedSteps = new Set(JSON.parse(raw));
  } catch {}
  loaded = true;
  return completedSteps;
}

export async function markStepDone(stepId: string): Promise<void> {
  completedSteps.add(stepId);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify([...completedSteps]));
  } catch {}
}

export function isStepDone(stepId: string): boolean {
  return completedSteps.has(stepId);
}
