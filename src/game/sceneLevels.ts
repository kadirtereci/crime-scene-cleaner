/**
 * Scene Levels — Story mode level definitions
 * IDs start at 101 to avoid collision with classic levels (1-25)
 */
import { SceneLevelConfig, MessObjectData } from './storyTypes';

/* eslint-disable @typescript-eslint/no-require-imports */
const apartmentScene = {
  cleanImage: require('../../assets/environment/apartment/clean_room.png'),
  messyImage: require('../../assets/environment/apartment/messy_room.png'),
};
/* eslint-enable @typescript-eslint/no-require-imports */

// Helper — creates a MessObjectData from minimal params
function mess(
  id: string,
  spriteId: MessObjectData['spriteId'],
  xR: number,
  yR: number,
  opts?: Partial<Pick<MessObjectData, 'width' | 'height' | 'toughness' | 'revealsClue' | 'cleanType'>>
): MessObjectData {
  // Import default values from registry at build time
  const defaults: Record<string, { w: number; h: number; clean: MessObjectData['cleanType']; tough: number }> = {
    spilled_coffee_mug: { w: 80, h: 60, clean: 'blood', tough: 1.0 },
    crushed_red_can: { w: 65, h: 50, clean: 'trash', tough: 1.0 },
    cigarette_butt: { w: 55, h: 40, clean: 'trash', tough: 0.8 },
    open_pizza_box: { w: 90, h: 68, clean: 'trash', tough: 1.2 },
    dirty_tissue: { w: 55, h: 40, clean: 'trash', tough: 0.6 },
    chips_bag: { w: 65, h: 50, clean: 'trash', tough: 0.8 },
    broken_glass_bottle: { w: 70, h: 55, clean: 'glass', tough: 1.3 },
    banana_peel: { w: 60, h: 45, clean: 'trash', tough: 0.6 },
    crumpled_paper: { w: 55, h: 45, clean: 'trash', tough: 0.5 },
    broken_plate: { w: 70, h: 55, clean: 'glass', tough: 1.2 },
    cracked_smartphone: { w: 55, h: 50, clean: 'evidence', tough: 1.5 },
    knocked_over_plant: { w: 80, h: 65, clean: 'furniture', tough: 1.3 },
    blue_paint_spill: { w: 85, h: 65, clean: 'blood', tough: 1.5 },
    tipped_trash_can: { w: 90, h: 70, clean: 'trash', tough: 1.8 },
    stack_of_papers: { w: 70, h: 55, clean: 'evidence', tough: 1.2 },
    dirty_socks: { w: 60, h: 45, clean: 'trash', tough: 0.7 },
    plastic_bottle: { w: 55, h: 50, clean: 'trash', tough: 0.7 },
    spilled_soda_can: { w: 70, h: 55, clean: 'blood', tough: 1.0 },
    broken_wood_plank: { w: 85, h: 55, clean: 'furniture', tough: 1.8 },
    tangled_earphones: { w: 65, h: 50, clean: 'evidence', tough: 1.0 },
    spoon_on_food_spill: { w: 75, h: 55, clean: 'blood', tough: 1.0 },
    trash_bags: { w: 85, h: 65, clean: 'trash', tough: 1.5 },
    face_mask: { w: 60, h: 45, clean: 'trash', tough: 0.8 },
  };

  const def = defaults[spriteId] ?? { w: 70, h: 55, clean: 'trash' as const, tough: 1.0 };

  return {
    id,
    spriteId,
    position: { x: xR, y: yR },
    width: opts?.width ?? def.w,
    height: opts?.height ?? def.h,
    dirtLevel: 1,
    cleanType: opts?.cleanType ?? def.clean,
    toughness: opts?.toughness ?? def.tough,
    revealsClue: opts?.revealsClue,
  };
}

// ═══════════════════════════════════════════════════════════
// EPISODE 1: APARTMENT CHAOS (3 levels)
// ═══════════════════════════════════════════════════════════

export const SCENE_LEVELS: SceneLevelConfig[] = [
  // ── Level 101: Pizza Party Disaster ─────────────────────
  {
    id: 101,
    name: 'Pizza Party Disaster',
    mode: 'scene',
    environment: 'apartment',
    scene: apartmentScene,
    tools: ['mop', 'trashBag'],
    timeLimit: 75,
    starThresholds: [10, 25, 40],
    episodeId: 'ep1',
    briefing: 'A "party" happened here last night. Pizza boxes, spilled drinks, and broken glass everywhere. Clean it up before the landlord\'s inspection.',
    messObjects: [
      mess('m101a', 'open_pizza_box', 0.15, 0.2),
      mess('m101b', 'spilled_coffee_mug', 0.4, 0.15, { revealsClue: 'ep1_clue1' }),
      mess('m101c', 'crushed_red_can', 0.65, 0.25),
      mess('m101d', 'chips_bag', 0.3, 0.45),
      mess('m101e', 'banana_peel', 0.55, 0.5),
      mess('m101f', 'dirty_tissue', 0.75, 0.4),
      mess('m101g', 'plastic_bottle', 0.2, 0.65),
      mess('m101h', 'crumpled_paper', 0.5, 0.7, { revealsClue: 'ep1_clue2' }),
    ],
    clues: [
      {
        id: 'ep1_clue1',
        name: 'Whiskey Bottle',
        description: 'An expensive bottle hidden behind the couch. Someone was drinking alone...',
        icon: '🥃',
        position: { x: 0.4, y: 0.15 },
        revealed: false,
        collected: false,
        episodeId: 'ep1',
        reportFragmentIndex: 0,
      },
      {
        id: 'ep1_clue2',
        name: 'Threatening Note',
        description: 'A crumpled note reads: "This is your last warning. — M"',
        icon: '📝',
        position: { x: 0.5, y: 0.7 },
        revealed: false,
        collected: false,
        episodeId: 'ep1',
        reportFragmentIndex: 1,
      },
    ],
  },

  // ── Level 102: The Morning After ────────────────────────
  {
    id: 102,
    name: 'The Morning After',
    mode: 'scene',
    environment: 'apartment',
    scene: apartmentScene,
    tools: ['mop', 'trashBag', 'scrubBrush'],
    timeLimit: 65,
    starThresholds: [8, 20, 35],
    episodeId: 'ep1',
    briefing: 'The neighbors complained about the noise. Now there\'s broken glass and suspicious stains. The cops could show up any minute.',
    messObjects: [
      mess('m102a', 'broken_glass_bottle', 0.2, 0.18),
      mess('m102b', 'broken_plate', 0.45, 0.22, { revealsClue: 'ep1_clue3' }),
      mess('m102c', 'spilled_soda_can', 0.7, 0.15),
      mess('m102d', 'face_mask', 0.15, 0.45),
      mess('m102e', 'dirty_socks', 0.4, 0.5),
      mess('m102f', 'cracked_smartphone', 0.6, 0.48, { revealsClue: 'ep1_clue4', cleanType: 'trash' }),
      mess('m102g', 'tipped_trash_can', 0.3, 0.72),
      mess('m102h', 'spoon_on_food_spill', 0.65, 0.68),
    ],
    clues: [
      {
        id: 'ep1_clue3',
        name: 'Scream Report',
        description: 'A note from the neighbor: "Heard screams at 2 AM. Called the police."',
        icon: '🔔',
        position: { x: 0.45, y: 0.22 },
        revealed: false,
        collected: false,
        episodeId: 'ep1',
        reportFragmentIndex: 1,
      },
      {
        id: 'ep1_clue4',
        name: 'Torn Photograph',
        description: 'A photograph ripped in half. Two people arguing — one matches the tenant.',
        icon: '📸',
        position: { x: 0.6, y: 0.48 },
        revealed: false,
        collected: false,
        episodeId: 'ep1',
        reportFragmentIndex: 2,
      },
    ],
  },

  // ── Level 103: Deep Clean ───────────────────────────────
  {
    id: 103,
    name: 'Deep Clean',
    mode: 'scene',
    environment: 'apartment',
    scene: apartmentScene,
    tools: ['mop', 'trashBag', 'scrubBrush', 'spray', 'repairKit'],
    timeLimit: 60,
    starThresholds: [5, 15, 30],
    episodeId: 'ep1',
    briefing: 'Final sweep. The landlord arrives in 60 seconds. Hidden evidence remains. Find everything before it\'s too late.',
    messObjects: [
      mess('m103a', 'blue_paint_spill', 0.2, 0.15, { revealsClue: 'ep1_clue5' }),
      mess('m103b', 'knocked_over_plant', 0.5, 0.2),
      mess('m103c', 'broken_wood_plank', 0.75, 0.18, { toughness: 2.0 }),
      mess('m103d', 'trash_bags', 0.15, 0.5, { revealsClue: 'ep1_clue6' }),
      mess('m103e', 'stack_of_papers', 0.45, 0.55),
      mess('m103f', 'tangled_earphones', 0.7, 0.45, { revealsClue: 'ep1_clue7' }),
      mess('m103g', 'spilled_coffee_mug', 0.3, 0.75),
      mess('m103h', 'broken_glass_bottle', 0.6, 0.72),
    ],
    clues: [
      {
        id: 'ep1_clue5',
        name: 'Wall Initials',
        description: 'Paint marks on the wall spell out "J.K." — someone was marking territory.',
        icon: '🎨',
        position: { x: 0.2, y: 0.15 },
        revealed: false,
        collected: false,
        episodeId: 'ep1',
        reportFragmentIndex: 3,
      },
      {
        id: 'ep1_clue6',
        name: 'Spare Key',
        description: 'A spare apartment key hidden under the trash bags. Unauthorized entry?',
        icon: '🔑',
        position: { x: 0.15, y: 0.5 },
        revealed: false,
        collected: false,
        episodeId: 'ep1',
        reportFragmentIndex: 3,
      },
      {
        id: 'ep1_clue7',
        name: 'Final Connection',
        description: 'Earphones still connected to a hidden recorder. Someone was taping the conversation.',
        icon: '🎙️',
        position: { x: 0.7, y: 0.45 },
        revealed: false,
        collected: false,
        episodeId: 'ep1',
        reportFragmentIndex: 4,
      },
    ],
  },
];

/**
 * Resolve mess object positions from ratios to pixels
 */
export function resolveMessObjects(
  objects: MessObjectData[],
  screenWidth: number,
  screenHeight: number,
  marginX = 30,
  marginTop = 120,
  marginBottom = 160
): MessObjectData[] {
  return objects.map((obj) => ({
    ...obj,
    position: {
      x: marginX + obj.position.x * (screenWidth - 2 * marginX),
      y: marginTop + obj.position.y * (screenHeight - marginTop - marginBottom),
    },
  }));
}

export function getSceneLevel(id: number): SceneLevelConfig | undefined {
  return SCENE_LEVELS.find((l) => l.id === id);
}

export function getEpisodeLevels(episodeId: string): SceneLevelConfig[] {
  return SCENE_LEVELS.filter((l) => l.episodeId === episodeId);
}
