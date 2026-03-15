import {
  LevelConfig,
  StainData,
  StainType,
  ToolType,
  EnvironmentType,
} from './types';

const MX = 40; // margin X
const MT = 100; // margin top
const MB = 180; // margin bottom

function s(
  id: string,
  type: StainType,
  xR: number,
  yR: number,
  radius = 38,
  opts?: Partial<Pick<StainData, 'toughness' | 'needsSpray' | 'regrowRate' | 'spreadRate'>>
): StainData {
  // Store ratios as position — resolved to pixels by resolveStains()
  return {
    id,
    type,
    position: { x: xR, y: yR },
    dirtLevel: 1,
    radius,
    ...opts,
  };
}

/**
 * Resolve ratio-based stain positions to pixel coordinates for the current screen size.
 * Call this with useWindowDimensions() values at render time, not at module load.
 */
export function resolveStains(stains: StainData[], screenWidth: number, screenHeight: number): StainData[] {
  return stains.map((stain) => ({
    ...stain,
    position: {
      x: MX + stain.position.x * (screenWidth - 2 * MX),
      y: MT + stain.position.y * (screenHeight - MT - MB),
    },
  }));
}

// ═══════════════════════════════════════════════════════════
// 25 LEVELS — Each with distinct mechanics & escalating challenge
// Stains positioned in clusters/sweep paths for natural combos
// ═══════════════════════════════════════════════════════════

export const ALL_LEVELS: LevelConfig[] = [
  // ── APARTMENT (Levels 1-8) ──────────────────────────────
  // Tutorial arc: learn tools one at a time

  {
    id: 1,
    name: 'First Day',
    environment: 'apartment',
    tools: ['mop'],
    timeLimit: 60,
    starThresholds: [5, 20, 35],
    modifiers: {
      briefing: 'Your first job. A kitchen accident — or so they told you. Mop the blood.',
    },
    stains: [
      s('1a', 'blood', 0.3, 0.25),
      s('1b', 'blood', 0.45, 0.45),
      s('1c', 'blood', 0.6, 0.65),
    ],
  },
  {
    id: 2,
    name: 'Domestic Dispute',
    environment: 'apartment',
    tools: ['mop'],
    timeLimit: 55,
    starThresholds: [5, 18, 32],
    stains: [
      s('2a', 'blood', 0.2, 0.15, 38),
      s('2b', 'blood', 0.35, 0.3, 42),
      s('2c', 'glass', 0.5, 0.45, 35),
      s('2d', 'glass', 0.4, 0.6, 36),
      s('2e', 'blood', 0.25, 0.75, 40),
    ],
  },
  {
    id: 3,
    name: 'The Break-In',
    environment: 'apartment',
    tools: ['mop', 'scrubBrush'],
    timeLimit: 50,
    starThresholds: [5, 15, 28],
    modifiers: {
      briefing: 'Someone broke in through the window. Glass everywhere, perp cut himself. Scrub brush cleans glass faster!',
    },
    stains: [
      s('3a', 'glass', 0.15, 0.2, 36),
      s('3b', 'glass', 0.3, 0.15, 38),
      s('3c', 'glass', 0.5, 0.25, 40),
      s('3d', 'glass', 0.65, 0.4, 34),
      s('3e', 'glass', 0.55, 0.6, 36),
      s('3f', 'blood', 0.4, 0.75, 40),
    ],
  },
  {
    id: 4,
    name: 'House Party Gone Wrong',
    environment: 'apartment',
    tools: ['mop', 'trashBag'],
    timeLimit: 50,
    starThresholds: [5, 15, 28],
    stains: [
      s('4a', 'trash', 0.15, 0.15, 36),
      s('4b', 'trash', 0.3, 0.25, 34),
      s('4c', 'trash', 0.2, 0.4, 40),
      s('4d', 'trash', 0.35, 0.55, 36),
      s('4e', 'blood', 0.5, 0.5, 38),
      s('4f', 'blood', 0.65, 0.65, 38),
    ],
  },
  {
    id: 5,
    name: 'The Whistleblower',
    environment: 'apartment',
    tools: ['mop', 'spray'],
    timeLimit: 50,
    starThresholds: [5, 14, 26],
    modifiers: {
      briefing: 'A snitch lived here. Destroy the documents before the feds arrive. Stubborn stains.',
    },
    stains: [
      s('5a', 'evidence', 0.15, 0.2, 32),
      s('5b', 'evidence', 0.25, 0.4, 34),
      s('5c', 'evidence', 0.2, 0.6, 30),
      s('5d', 'blood', 0.45, 0.55, 40, { toughness: 1.5 }),
      s('5e', 'blood', 0.6, 0.4, 38, { toughness: 1.5 }),
    ],
  },
  {
    id: 6,
    name: 'Rage Room',
    environment: 'apartment',
    tools: ['mop', 'repairKit'],
    timeLimit: 50,
    starThresholds: [5, 15, 28],
    modifiers: {
      briefing: 'Someone lost it. Smashed all the furniture, then things got worse.',
    },
    stains: [
      s('6a', 'furniture', 0.2, 0.25, 44, { toughness: 1.8 }),
      s('6b', 'furniture', 0.35, 0.4, 46, { toughness: 1.8 }),
      s('6c', 'furniture', 0.25, 0.6, 42, { toughness: 1.5 }),
      s('6d', 'blood', 0.5, 0.55, 36),
      s('6e', 'blood', 0.65, 0.4, 38),
    ],
  },
  {
    id: 7,
    name: "The Landlord's Problem",
    environment: 'apartment',
    tools: ['mop', 'scrubBrush', 'trashBag'],
    timeLimit: 45,
    starThresholds: [4, 12, 22],
    stains: [
      s('7a', 'blood', 0.3, 0.15, 38),
      s('7b', 'glass', 0.45, 0.2, 36),
      s('7c', 'blood', 0.55, 0.15, 36),
      s('7d', 'blood', 0.4, 0.35, 42, { toughness: 1.3 }),
      s('7e', 'glass', 0.3, 0.5, 36),
      s('7f', 'trash', 0.55, 0.55, 38),
      s('7g', 'trash', 0.65, 0.7, 38),
    ],
  },
  {
    id: 8,
    name: 'Nosy Neighbors',
    environment: 'apartment',
    tools: ['mop', 'scrubBrush', 'trashBag', 'spray'],
    timeLimit: 42,
    starThresholds: [3, 10, 20],
    modifiers: {
      rushLastSeconds: 12,
      briefing: 'The neighbors called the cops. You have 42 seconds before they arrive. Every type of mess.',
    },
    stains: [
      s('8a', 'blood', 0.15, 0.15, 42, { toughness: 1.3 }),
      s('8b', 'blood', 0.3, 0.25, 44, { toughness: 1.5 }),
      s('8c', 'glass', 0.45, 0.15, 38),
      s('8d', 'glass', 0.6, 0.25, 38),
      s('8e', 'trash', 0.75, 0.45, 38),
      s('8f', 'trash', 0.65, 0.6, 36),
      s('8g', 'evidence', 0.4, 0.6, 32),
      s('8h', 'evidence', 0.25, 0.75, 30),
    ],
  },

  // ── WAREHOUSE (Levels 9-16) ─────────────────────────────
  // Mechanic arc: toughness, spreading, regrow, needsSpray

  {
    id: 9,
    name: 'New Territory',
    environment: 'warehouse',
    tools: ['mop'],
    timeLimit: 50,
    starThresholds: [5, 15, 28],
    modifiers: {
      briefing: 'Welcome to the warehouse circuit. The blood runs thicker here.',
    },
    stains: [
      s('9a', 'blood', 0.25, 0.2, 44, { toughness: 1.5 }),
      s('9b', 'blood', 0.4, 0.35, 44, { toughness: 1.5 }),
      s('9c', 'blood', 0.5, 0.55, 42, { toughness: 1.3 }),
      s('9d', 'blood', 0.35, 0.75, 40),
    ],
  },
  {
    id: 10,
    name: 'The Drop Point',
    environment: 'warehouse',
    tools: ['mop', 'trashBag'],
    timeLimit: 50,
    starThresholds: [4, 14, 26],
    stains: [
      s('10a', 'trash', 0.2, 0.15, 42, { toughness: 1.3 }),
      s('10b', 'trash', 0.25, 0.35, 40),
      s('10c', 'trash', 0.2, 0.55, 38),
      s('10d', 'trash', 0.3, 0.75, 40, { toughness: 1.5 }),
      s('10e', 'blood', 0.55, 0.6, 42, { toughness: 1.3 }),
      s('10f', 'blood', 0.65, 0.45, 44, { toughness: 1.5 }),
    ],
  },
  {
    id: 11,
    name: 'Smash & Grab',
    environment: 'warehouse',
    tools: ['scrubBrush', 'repairKit'],
    timeLimit: 48,
    starThresholds: [4, 13, 24],
    modifiers: {
      briefing: 'Thieves hit the warehouse. Broken display cases, wrecked shelving. Glass is spreading!',
    },
    stains: [
      s('11a', 'glass', 0.15, 0.2, 38),
      s('11b', 'glass', 0.25, 0.4, 40, { spreadRate: 0.3 }),
      s('11c', 'glass', 0.2, 0.6, 36, { spreadRate: 0.3 }),
      s('11d', 'furniture', 0.45, 0.55, 42, { toughness: 1.5 }),
      s('11e', 'furniture', 0.6, 0.4, 44, { toughness: 1.8 }),
      s('11f', 'furniture', 0.7, 0.6, 46, { toughness: 2.0 }),
    ],
  },
  {
    id: 12,
    name: 'Cold Storage',
    environment: 'warehouse',
    tools: ['mop', 'spray'],
    timeLimit: 45,
    starThresholds: [3, 10, 20],
    modifiers: {
      briefing: 'The freezer room. Frozen blood needs spray to thaw first. Poor visibility.',
      darkness: 0.15,
    },
    stains: [
      s('12a', 'evidence', 0.2, 0.2, 34),
      s('12b', 'blood', 0.35, 0.3, 44, { needsSpray: true, toughness: 1.5 }),
      s('12c', 'blood', 0.45, 0.45, 42, { needsSpray: true }),
      s('12d', 'blood', 0.35, 0.6, 46, { toughness: 1.8 }),
      s('12e', 'blood', 0.5, 0.75, 44, { needsSpray: true, toughness: 1.3 }),
      s('12f', 'evidence', 0.65, 0.6, 34),
    ],
  },
  {
    id: 13,
    name: 'Contraband',
    environment: 'warehouse',
    tools: ['mop', 'trashBag', 'spray'],
    timeLimit: 42,
    starThresholds: [3, 10, 20],
    modifiers: {
      rushLastSeconds: 15,
      briefing: 'Smuggling operation busted. Cops 42 seconds out. Evidence keeps resurfacing.',
    },
    stains: [
      s('13a', 'evidence', 0.15, 0.2, 32, { regrowRate: 0.04 }),
      s('13b', 'evidence', 0.28, 0.35, 34, { regrowRate: 0.04 }),
      s('13c', 'trash', 0.4, 0.15, 40, { toughness: 1.5 }),
      s('13d', 'trash', 0.55, 0.25, 38),
      s('13e', 'trash', 0.45, 0.4, 40),
      s('13f', 'blood', 0.65, 0.5, 44, { toughness: 1.5 }),
      s('13g', 'blood', 0.55, 0.65, 42, { toughness: 1.3 }),
    ],
  },
  {
    id: 14,
    name: 'Turf War',
    environment: 'warehouse',
    tools: ['mop', 'scrubBrush', 'trashBag', 'repairKit'],
    timeLimit: 45,
    starThresholds: [3, 10, 20],
    modifiers: {
      briefing: 'Gang shootout. Massive scene — blood, broken crates, shattered glass, wrecked barriers.',
    },
    stains: [
      s('14a', 'blood', 0.15, 0.1, 42, { toughness: 1.8 }),
      s('14b', 'glass', 0.3, 0.15, 38, { toughness: 1.5 }),
      s('14c', 'blood', 0.45, 0.1, 44, { toughness: 1.8 }),
      s('14d', 'glass', 0.6, 0.2, 36, { spreadRate: 0.3 }),
      s('14e', 'trash', 0.7, 0.4, 40, { toughness: 1.5 }),
      s('14f', 'trash', 0.6, 0.55, 38, { toughness: 1.3 }),
      s('14g', 'furniture', 0.4, 0.6, 48, { toughness: 2.2 }),
      s('14h', 'furniture', 0.3, 0.75, 46, { toughness: 2.0 }),
    ],
  },
  {
    id: 15,
    name: 'The Witness',
    environment: 'warehouse',
    tools: ['mop', 'scrubBrush', 'trashBag', 'spray'],
    timeLimit: 40,
    starThresholds: [3, 9, 18],
    modifiers: {
      globalRegrowRate: 0.02,
      rushLastSeconds: 12,
      briefing: 'A witness was kept here. Every trace regrows if you\'re sloppy. Rush the ending.',
    },
    stains: [
      s('15a', 'blood', 0.15, 0.15, 44, { toughness: 1.5 }),
      s('15b', 'glass', 0.25, 0.3, 38),
      s('15c', 'blood', 0.15, 0.45, 46, { toughness: 1.8 }),
      s('15d', 'glass', 0.3, 0.6, 40, { spreadRate: 0.4 }),
      s('15e', 'trash', 0.5, 0.5, 40),
      s('15f', 'trash', 0.55, 0.35, 38),
      s('15g', 'evidence', 0.75, 0.4, 32, { toughness: 1.3 }),
      s('15h', 'evidence', 0.8, 0.6, 34),
    ],
  },
  {
    id: 16,
    name: 'Lights Out',
    environment: 'warehouse',
    tools: ['mop', 'scrubBrush', 'trashBag', 'repairKit', 'spray'],
    timeLimit: 38,
    starThresholds: [2, 8, 16],
    modifiers: {
      darkness: 0.25,
      globalRegrowRate: 0.03,
      rushLastSeconds: 10,
      briefing: "Power's failing. Stains regrow. Sirens in the distance. 38 seconds. Move.",
    },
    stains: [
      s('16a', 'blood', 0.12, 0.12, 46, { toughness: 2.0, needsSpray: true }),
      s('16b', 'blood', 0.25, 0.2, 44, { toughness: 1.8 }),
      s('16c', 'glass', 0.55, 0.1, 38, { spreadRate: 0.5 }),
      s('16d', 'glass', 0.65, 0.25, 36, { spreadRate: 0.3 }),
      s('16e', 'trash', 0.8, 0.35, 42, { toughness: 1.5 }),
      s('16f', 'trash', 0.75, 0.5, 40),
      s('16g', 'evidence', 0.6, 0.6, 34, { regrowRate: 0.05 }),
      s('16h', 'evidence', 0.5, 0.75, 32, { regrowRate: 0.05 }),
      s('16i', 'furniture', 0.25, 0.6, 48, { toughness: 2.5 }),
      s('16j', 'furniture', 0.2, 0.78, 46, { toughness: 2.0 }),
    ],
  },

  // ── OFFICE (Levels 17-25) ───────────────────────────────
  // Everything combined + hardest challenges

  {
    id: 17,
    name: 'Corner Office',
    environment: 'office',
    tools: ['mop'],
    timeLimit: 45,
    starThresholds: [4, 12, 24],
    modifiers: {
      briefing: 'The CEO is dead. Board meeting in 45 seconds. Make it look like he never existed.',
    },
    stains: [
      s('17a', 'blood', 0.3, 0.2, 42, { toughness: 1.5 }),
      s('17b', 'blood', 0.5, 0.35, 44, { toughness: 1.8 }),
      s('17c', 'blood', 0.35, 0.55, 40, { toughness: 1.5 }),
      s('17d', 'blood', 0.5, 0.75, 38, { spreadRate: 0.3 }),
    ],
  },
  {
    id: 18,
    name: 'Hostile Takeover',
    environment: 'office',
    tools: ['mop', 'scrubBrush'],
    timeLimit: 42,
    starThresholds: [3, 10, 20],
    modifiers: {
      briefing: 'Boardroom negotiation got physical. Shattered conference table glass is spreading.',
    },
    stains: [
      s('18a', 'blood', 0.2, 0.15, 42, { toughness: 1.5 }),
      s('18b', 'glass', 0.35, 0.25, 38, { spreadRate: 0.5 }),
      s('18c', 'blood', 0.5, 0.35, 44, { toughness: 1.8 }),
      s('18d', 'glass', 0.4, 0.5, 40, { spreadRate: 0.5 }),
      s('18e', 'blood', 0.55, 0.65, 42, { toughness: 1.3 }),
      s('18f', 'glass', 0.4, 0.8, 36, { spreadRate: 0.4 }),
    ],
  },
  {
    id: 19,
    name: 'HR Complaint',
    environment: 'office',
    tools: ['mop', 'trashBag', 'repairKit'],
    timeLimit: 40,
    starThresholds: [3, 10, 18],
    modifiers: {
      rushLastSeconds: 12,
      briefing: 'An "incident" in HR. Smashed desks, shredded documents, and someone didn\'t make it out.',
    },
    stains: [
      s('19a', 'trash', 0.15, 0.15, 40, { toughness: 1.5 }),
      s('19b', 'trash', 0.2, 0.35, 38),
      s('19c', 'trash', 0.25, 0.55, 36, { toughness: 1.5 }),
      s('19d', 'furniture', 0.45, 0.5, 48, { toughness: 2.5 }),
      s('19e', 'furniture', 0.55, 0.65, 46, { toughness: 2.2 }),
      s('19f', 'blood', 0.7, 0.5, 40, { toughness: 1.3 }),
      s('19g', 'blood', 0.75, 0.35, 42, { toughness: 1.5 }),
    ],
  },
  {
    id: 20,
    name: 'Data Breach',
    environment: 'office',
    tools: ['spray', 'scrubBrush'],
    timeLimit: 38,
    starThresholds: [3, 9, 18],
    modifiers: {
      darkness: 0.3,
      briefing: 'Server room. Dark, cramped. Destroy the digital evidence before IT arrives.',
    },
    stains: [
      s('20a', 'evidence', 0.15, 0.2, 34, { needsSpray: true, toughness: 1.5 }),
      s('20b', 'evidence', 0.25, 0.35, 32, { needsSpray: true }),
      s('20c', 'evidence', 0.15, 0.5, 36, { needsSpray: true, regrowRate: 0.03 }),
      s('20d', 'glass', 0.5, 0.2, 38, { spreadRate: 0.4 }),
      s('20e', 'glass', 0.6, 0.35, 40),
      s('20f', 'blood', 0.55, 0.55, 42, { toughness: 1.8 }),
      s('20g', 'blood', 0.7, 0.7, 44, { toughness: 1.5 }),
    ],
  },
  {
    id: 21,
    name: 'The Mahogany Table',
    environment: 'office',
    tools: ['mop', 'scrubBrush', 'repairKit'],
    timeLimit: 38,
    starThresholds: [2, 8, 16],
    modifiers: {
      globalRegrowRate: 0.025,
      briefing: 'Premium boardroom. That table costs more than your life. Stains regrow on fine wood.',
    },
    stains: [
      s('21a', 'blood', 0.15, 0.12, 44, { toughness: 1.8 }),
      s('21b', 'glass', 0.3, 0.2, 38),
      s('21c', 'blood', 0.45, 0.15, 42, { toughness: 1.5 }),
      s('21d', 'glass', 0.6, 0.25, 40, { spreadRate: 0.5 }),
      s('21e', 'blood', 0.75, 0.15, 40, { toughness: 1.3 }),
      s('21f', 'furniture', 0.4, 0.6, 50, { toughness: 3.0 }),
      s('21g', 'furniture', 0.55, 0.75, 48, { toughness: 2.8 }),
    ],
  },
  {
    id: 22,
    name: 'Night Shift',
    environment: 'office',
    tools: ['mop', 'trashBag', 'spray'],
    timeLimit: 35,
    starThresholds: [2, 7, 14],
    modifiers: {
      darkness: 0.2,
      rushLastSeconds: 10,
      briefing: 'After hours. Security makes rounds every 35 seconds. Evidence reappears in the dark.',
    },
    stains: [
      s('22a', 'trash', 0.12, 0.12, 40, { toughness: 1.5 }),
      s('22b', 'trash', 0.25, 0.2, 38),
      s('22c', 'trash', 0.15, 0.35, 40, { toughness: 1.3 }),
      s('22d', 'blood', 0.45, 0.3, 44, { toughness: 2.0 }),
      s('22e', 'blood', 0.55, 0.45, 46, { toughness: 1.8, spreadRate: 0.3 }),
      s('22f', 'blood', 0.65, 0.6, 42, { toughness: 1.5 }),
      s('22g', 'evidence', 0.45, 0.7, 32, { regrowRate: 0.05, needsSpray: true }),
      s('22h', 'evidence', 0.35, 0.82, 34, { regrowRate: 0.05, needsSpray: true }),
    ],
  },
  {
    id: 23,
    name: 'Executive Suite',
    environment: 'office',
    tools: ['mop', 'scrubBrush', 'trashBag', 'repairKit'],
    timeLimit: 35,
    starThresholds: [2, 7, 14],
    modifiers: {
      globalRegrowRate: 0.03,
      briefing: 'The top floor. Triple homicide. Everything regrows. Finish it all or start over.',
    },
    stains: [
      s('23a', 'blood', 0.15, 0.1, 44, { toughness: 2.0 }),
      s('23b', 'glass', 0.3, 0.15, 38, { spreadRate: 0.5 }),
      s('23c', 'blood', 0.45, 0.25, 42, { toughness: 1.8 }),
      s('23d', 'glass', 0.55, 0.15, 38),
      s('23e', 'blood', 0.4, 0.4, 40, { toughness: 1.5 }),
      s('23f', 'trash', 0.65, 0.35, 40, { toughness: 1.5 }),
      s('23g', 'trash', 0.7, 0.55, 36),
      s('23h', 'furniture', 0.4, 0.65, 50, { toughness: 3.0 }),
      s('23i', 'furniture', 0.5, 0.8, 48, { toughness: 2.8 }),
    ],
  },
  {
    id: 24,
    name: 'Panic Room',
    environment: 'office',
    tools: ['mop', 'scrubBrush', 'trashBag', 'repairKit', 'spray'],
    timeLimit: 32,
    starThresholds: [2, 6, 12],
    modifiers: {
      darkness: 0.35,
      globalRegrowRate: 0.03,
      rushLastSeconds: 10,
      briefing: 'They locked themselves in but it didn\'t help. Near-total darkness. Everything fights back.',
    },
    stains: [
      s('24a', 'blood', 0.12, 0.1, 46, { toughness: 2.0, needsSpray: true }),
      s('24b', 'blood', 0.25, 0.2, 44, { toughness: 2.0 }),
      s('24c', 'glass', 0.45, 0.1, 40, { spreadRate: 0.6 }),
      s('24d', 'glass', 0.55, 0.25, 38, { spreadRate: 0.5 }),
      s('24e', 'trash', 0.75, 0.15, 42, { toughness: 1.8 }),
      s('24f', 'trash', 0.8, 0.35, 40),
      s('24g', 'evidence', 0.6, 0.55, 34, { needsSpray: true, regrowRate: 0.06 }),
      s('24h', 'evidence', 0.5, 0.7, 36, { needsSpray: true, regrowRate: 0.05 }),
      s('24i', 'furniture', 0.2, 0.55, 50, { toughness: 3.0 }),
      s('24j', 'furniture', 0.25, 0.75, 48, { toughness: 2.5 }),
    ],
  },
  {
    id: 25,
    name: 'The Last Job',
    environment: 'office',
    tools: ['mop', 'scrubBrush', 'trashBag', 'repairKit', 'spray'],
    timeLimit: 30,
    starThresholds: [1, 5, 10],
    modifiers: {
      darkness: 0.4,
      globalRegrowRate: 0.04,
      globalSpreadRate: 0.3,
      rushLastSeconds: 10,
      briefing: 'Your final contract. After this, you disappear. Total darkness. Everything spreads and regrows. 30 seconds.',
    },
    stains: [
      // TOP BAND: blood+glass mop sweep
      s('25a', 'blood', 0.1, 0.08, 48, { toughness: 2.5, needsSpray: true }),
      s('25b', 'glass', 0.25, 0.1, 40, { spreadRate: 0.7 }),
      s('25c', 'blood', 0.4, 0.08, 44, { toughness: 2.2 }),
      s('25d', 'glass', 0.55, 0.15, 38, { spreadRate: 0.5 }),
      // MIDDLE BAND: trash + evidence
      s('25e', 'trash', 0.15, 0.38, 42, { toughness: 2.0 }),
      s('25f', 'trash', 0.3, 0.42, 40, { toughness: 1.8 }),
      s('25g', 'trash', 0.45, 0.38, 38, { toughness: 1.5 }),
      s('25h', 'evidence', 0.65, 0.4, 36, { needsSpray: true, regrowRate: 0.07 }),
      s('25i', 'evidence', 0.8, 0.45, 34, { needsSpray: true, regrowRate: 0.06 }),
      // BOTTOM BAND: furniture + blood
      s('25j', 'furniture', 0.3, 0.68, 48, { toughness: 3.0 }),
      s('25k', 'furniture', 0.5, 0.72, 50, { toughness: 3.5 }),
      s('25l', 'blood', 0.7, 0.7, 42, { toughness: 2.0, spreadRate: 0.4 }),
    ],
  },
];

export function getLevel(id: number): LevelConfig | undefined {
  return ALL_LEVELS.find((l) => l.id === id);
}
