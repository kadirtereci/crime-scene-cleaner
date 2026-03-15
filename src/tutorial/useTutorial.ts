import { useState, useEffect, useCallback } from 'react';
import { TutorialStep, getStepsForLevel } from './tutorialSteps';
import { loadTutorialState, markStepDone, isStepDone } from './tutorialStorage';

export function useTutorial(levelId: number, toolCount: number) {
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await loadTutorialState();
      const allSteps = getStepsForLevel(levelId, toolCount);
      const pending = allSteps.filter((s) => !isStepDone(s.id));
      setSteps(pending);
      setCurrentIndex(0);
      setReady(true);
    })();
  }, [levelId, toolCount]);

  const currentStep = steps[currentIndex] ?? null;
  const isActive = ready && currentStep !== null;

  const next = useCallback(async () => {
    if (currentStep) {
      await markStepDone(currentStep.id);
    }
    setCurrentIndex((i) => i + 1);
  }, [currentStep]);

  const skip = useCallback(async () => {
    for (const s of steps) {
      await markStepDone(s.id);
    }
    setSteps([]);
    setCurrentIndex(0);
  }, [steps]);

  return { currentStep, isActive, next, skip };
}
