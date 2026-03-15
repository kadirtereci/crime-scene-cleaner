// Neon-Noir Cartoon palette — leans into the "crime" theme with playful energy

export const Colors = {
  // Primary — acid green meets crime-scene energy
  primary: '#BFFF00',        // acid green
  primaryDark: '#A3D900',
  secondary: '#FF2D6F',      // hot magenta
  secondaryDark: '#D9255E',
  accent: '#00D4FF',         // electric blue
  accentDark: '#00B8DB',
  tertiary: '#FFCF48',       // warm honey

  // Feedback
  success: '#39FF7F',
  warning: '#FF9F43',
  danger: '#FF3838',

  // Backgrounds — dark with depth
  bgDark: '#0F0E17',         // deep void
  bgCard: '#1A1A2E',         // card surface
  bgElevated: '#232340',     // elevated surface
  bgCream: '#0F0E17',        // alias for compatibility
  bgWhite: '#1A1A2E',        // alias for compatibility
  bgOverlay: 'rgba(0,0,0,0.7)',

  // Text — high contrast on dark
  textPrimary: '#FFFFFE',
  textSecondary: '#A7A9BE',
  textLight: '#8A8AA8',      // improved contrast for WCAG AA (was #5C5C7A)
  textWhite: '#FFFFFE',

  // Environment accents
  envApartment: '#FF6B6B',
  envWarehouse: '#636E72',
  envOffice: '#6C5CE7',

  // Stars — honey gold
  starFilled: '#FFCF48',
  starEmpty: '#2A2A4A',

  // HUD — dark glass
  hudBg: 'rgba(15,14,23,0.88)',
  hudShadow: 'rgba(0,0,0,0.3)',

  // Tool
  toolBorder: '#00D4FF',
  toolBg: '#1A1A2E',
  toolBgActive: 'rgba(0,212,255,0.12)',

  // Crime scene tape
  tape: '#FFCF48',
  tapeText: '#0F0E17',
} as const;

export type ColorKey = keyof typeof Colors;
