export interface TutorialStep {
  id: string;
  message: string;
  /** where to show the tooltip */
  position: 'top' | 'center' | 'bottom';
  emoji: string;
}

export const LEVEL_1_STEPS: TutorialStep[] = [
  {
    id: 'drag-clean',
    message: 'Drag your finger over stains to clean them!',
    position: 'center',
    emoji: '👆',
  },
  {
    id: 'progress-bar',
    message: 'Clean every stain before time runs out!',
    position: 'top',
    emoji: '⏱',
  },
  {
    id: 'combo-hint',
    message: 'Clean stains quickly for combos & bonus points!',
    position: 'center',
    emoji: '🔥',
  },
];

export const TOOL_INTRO_STEP: TutorialStep = {
  id: 'tool-intro',
  message: 'New tools! Tap to switch — different stains need different tools.',
  position: 'bottom',
  emoji: '🧰',
};

export function getStepsForLevel(levelId: number, toolCount: number): TutorialStep[] {
  if (levelId === 1) return LEVEL_1_STEPS;
  if (levelId === 3 && toolCount > 1) return [TOOL_INTRO_STEP];
  return [];
}
