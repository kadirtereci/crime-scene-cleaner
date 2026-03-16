/**
 * Episode System — manages story episodes, incident reports, and detective badges
 */
import { EpisodeData, ReportFragment, StoryProgress, DEFAULT_STORY_PROGRESS } from './storyTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORY_KEY = 'csc_story_progress';

// ═══════════════════════════════════════════════════════════
// EPISODE DEFINITIONS
// ═══════════════════════════════════════════════════════════

export const EPISODES: EpisodeData[] = [
  {
    id: 'ep1',
    name: 'Apartment Chaos',
    subtitle: 'A wild party leaves more than just a mess...',
    icon: '🏚️',
    environment: 'apartment',
    levelIds: [101, 102, 103],
    reportFragments: [
      {
        requiredClueIds: ['ep1_clue1'],
        text: 'A half-empty bottle of expensive whiskey was hidden behind the couch. The host was drinking alone before the guests arrived.',
        placeholder: 'Something was hidden behind the couch. But what...?',
      },
      {
        requiredClueIds: ['ep1_clue2', 'ep1_clue3'],
        text: 'A cracked smartphone with a threatening message: "Pay up or else." The neighbor reported hearing screams at 2 AM.',
        placeholder: 'A broken device was found. The message on it remains unknown...',
      },
      {
        requiredClueIds: ['ep1_clue4'],
        text: 'A torn photograph shows two people arguing. One of them matches the tenant description.',
        placeholder: 'Something torn was found under the mess. Its significance is unclear...',
      },
      {
        requiredClueIds: ['ep1_clue5', 'ep1_clue6'],
        text: 'Paint stains on the wall spell out initials: "J.K." — someone was marking territory. A spare key found under the trash suggests unauthorized entry.',
        placeholder: 'Marks on the wall and an object under the trash hint at something more...',
      },
      {
        requiredClueIds: ['ep1_clue7'],
        text: 'CONCLUSION: The "party" was a cover. The tenant owed money to a dangerous lender. When they couldn\'t pay, things escalated. The tenant fled at midnight, leaving everything behind.',
        placeholder: 'The full story remains unclear. More clues are needed to piece together what happened...',
      },
    ],
    fullReport: 'INCIDENT REPORT — Apartment 4B\n\nThe tenant, identified by initials "J.K.", hosted a fake party to cover a violent confrontation with a loan shark. A threatening message on a cracked phone confirms the debt. The whiskey bottle suggests the tenant was drinking to calm nerves before the meeting. The argument escalated — furniture was destroyed, a photograph was torn in rage. The tenant fled at midnight using a spare key to lock the door behind them, leaving the mess as evidence of the night\'s events.',
    deductions: [
      {
        id: 'ep1_q1',
        question: 'Why was the apartment trashed?',
        relatedClueIds: ['ep1_clue1', 'ep1_clue2', 'ep1_clue3'],
        choices: [
          { id: 'a', text: 'A wild college party got out of hand', feedback: 'The threatening note and screams at 2 AM suggest something darker than a party...' },
          { id: 'b', text: 'A violent confrontation over an unpaid debt', feedback: 'Correct! The threatening note "Pay up or else" and the 2 AM screams point to a debt-related confrontation.' },
          { id: 'c', text: 'A burglary gone wrong', feedback: 'Nothing was stolen — the mess was caused by a fight, not a break-in.' },
          { id: 'd', text: 'The tenant was moving out in a hurry', feedback: 'The hidden whiskey and threatening note suggest the tenant wasn\'t just moving...' },
        ],
        correctChoiceId: 'b',
      },
      {
        id: 'ep1_q2',
        question: 'Who is "J.K."?',
        relatedClueIds: ['ep1_clue4', 'ep1_clue5'],
        choices: [
          { id: 'a', text: 'The landlord who owns the building', feedback: 'The landlord wouldn\'t spray-paint their own walls.' },
          { id: 'b', text: 'A neighbor who was complaining about noise', feedback: 'The neighbor called the police — they wouldn\'t mark the walls with their own initials.' },
          { id: 'c', text: 'The tenant who lived in the apartment', feedback: 'Correct! The initials on the wall and the matching face in the torn photo identify J.K. as the tenant.' },
          { id: 'd', text: 'A delivery person who was at the door', feedback: 'There\'s no evidence of any delivery or outside visitor marking the walls.' },
        ],
        correctChoiceId: 'c',
      },
      {
        id: 'ep1_q3',
        question: 'What happened to the tenant after the incident?',
        relatedClueIds: ['ep1_clue6', 'ep1_clue7'],
        choices: [
          { id: 'a', text: 'They called the police and waited', feedback: 'The hidden recorder suggests secrecy, not cooperation with police.' },
          { id: 'b', text: 'They were taken to the hospital', feedback: 'No medical evidence was found at the scene.' },
          { id: 'c', text: 'They\'re still hiding somewhere in the building', feedback: 'The spare key was used to lock the door from outside — the tenant left the building.' },
          { id: 'd', text: 'They fled at midnight, locking the door with a spare key', feedback: 'Correct! The spare key under the trash and the recorder suggest the tenant planned an escape, documenting evidence before fleeing.' },
        ],
        correctChoiceId: 'd',
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════
// REPORT BUILDING
// ═══════════════════════════════════════════════════════════

export interface BuiltReport {
  fragments: { text: string; isRevealed: boolean }[];
  completionPercent: number;
  isComplete: boolean;
}

/**
 * Build an incident report from collected clues
 */
export function buildIncidentReport(
  episode: EpisodeData,
  collectedClueIds: string[]
): BuiltReport {
  const collectedSet = new Set(collectedClueIds);
  let revealedCount = 0;

  const fragments = episode.reportFragments.map((frag) => {
    const hasAll = frag.requiredClueIds.every((id) => collectedSet.has(id));
    if (hasAll) revealedCount++;
    return {
      text: hasAll ? frag.text : frag.placeholder,
      isRevealed: hasAll,
    };
  });

  const total = episode.reportFragments.length;
  return {
    fragments,
    completionPercent: total > 0 ? Math.round((revealedCount / total) * 100) : 0,
    isComplete: revealedCount === total,
  };
}

// ═══════════════════════════════════════════════════════════
// PERSISTENCE
// ═══════════════════════════════════════════════════════════

export async function loadStoryProgress(): Promise<StoryProgress> {
  try {
    const raw = await AsyncStorage.getItem(STORY_KEY);
    if (raw) return { ...DEFAULT_STORY_PROGRESS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_STORY_PROGRESS };
}

export async function saveStoryProgress(progress: StoryProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(STORY_KEY, JSON.stringify(progress));
  } catch {}
}

export async function saveSceneLevelResult(
  levelId: number,
  episodeId: string,
  stars: number,
  score: number,
  timeUsed: number,
  maxCombo: number,
  collectedClueIds: string[]
): Promise<StoryProgress> {
  const progress = await loadStoryProgress();

  // Update scene result
  const existing = progress.sceneResults[levelId];
  if (!existing || score > existing.score) {
    progress.sceneResults[levelId] = {
      levelId,
      stars,
      score,
      timeUsed,
      maxCombo,
      completed: true,
      collectedClueIds,
    };
  }

  // Update episode progress
  if (!progress.episodeProgress[episodeId]) {
    progress.episodeProgress[episodeId] = [];
  }
  if (!progress.episodeProgress[episodeId].includes(levelId)) {
    progress.episodeProgress[episodeId].push(levelId);
  }

  // Update collected clues
  for (const clueId of collectedClueIds) {
    if (!progress.collectedClues.includes(clueId)) {
      progress.collectedClues.push(clueId);
    }
  }

  // Check detective badge — requires all clues AND all deductions solved
  const episode = EPISODES.find((e) => e.id === episodeId);
  if (episode) {
    const report = buildIncidentReport(episode, progress.collectedClues);
    const solved = progress.solvedDeductions[episodeId] ?? [];
    const allDeductionsSolved = episode.deductions.every((d) => solved.includes(d.id));
    if (report.isComplete && allDeductionsSolved && !progress.detectiveBadges.includes(episodeId)) {
      progress.detectiveBadges.push(episodeId);
    }
  }

  await saveStoryProgress(progress);
  return progress;
}

export function getEpisode(id: string): EpisodeData | undefined {
  return EPISODES.find((e) => e.id === id);
}

export function isEpisodeUnlocked(episodeIndex: number, progress: StoryProgress): boolean {
  if (episodeIndex === 0) return true;
  const prevEpisode = EPISODES[episodeIndex - 1];
  if (!prevEpisode) return false;
  const completedLevels = progress.episodeProgress[prevEpisode.id] ?? [];
  return completedLevels.length >= prevEpisode.levelIds.length;
}

/**
 * Save a correctly answered deduction and check for detective badge
 */
export async function saveDeductionAnswer(
  episodeId: string,
  questionId: string
): Promise<StoryProgress> {
  const progress = await loadStoryProgress();

  if (!progress.solvedDeductions[episodeId]) {
    progress.solvedDeductions[episodeId] = [];
  }
  if (!progress.solvedDeductions[episodeId].includes(questionId)) {
    progress.solvedDeductions[episodeId].push(questionId);
  }

  // Check detective badge — all clues + all deductions
  const episode = EPISODES.find((e) => e.id === episodeId);
  if (episode) {
    const report = buildIncidentReport(episode, progress.collectedClues);
    const solved = progress.solvedDeductions[episodeId] ?? [];
    const allDeductionsSolved = episode.deductions.every((d) => solved.includes(d.id));
    if (report.isComplete && allDeductionsSolved && !progress.detectiveBadges.includes(episodeId)) {
      progress.detectiveBadges.push(episodeId);
    }
  }

  await saveStoryProgress(progress);
  return progress;
}
