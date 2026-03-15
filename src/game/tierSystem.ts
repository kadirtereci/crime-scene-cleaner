// ── Tier System — visual tiers based on total upgrade level ──

export const TIER_COLORS = ['transparent', '#CD7F32', '#C0C0C0', '#FFD700', '#B9F2FF'];

/** Returns tier 0–4 based on totalLevel (0–12) */
export function getTier(totalLevel: number): number {
  if (totalLevel <= 0) return 0;
  if (totalLevel <= 3) return 1;
  if (totalLevel <= 6) return 2;
  if (totalLevel <= 9) return 3;
  return 4;
}

/** Returns the glow color for a given totalLevel */
export function getTierColor(totalLevel: number): string {
  return TIER_COLORS[getTier(totalLevel)];
}
