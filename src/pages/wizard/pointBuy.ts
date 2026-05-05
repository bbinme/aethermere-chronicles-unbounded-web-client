export const TOTAL_POINTS = 27;
export const MIN_SCORE = 8;
export const MAX_SCORE = 16;

const COST_TABLE = [0, 1, 2, 3, 4, 5, 7, 9, 12]; // index = score - 8

export type AbilityKey =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma';

export const ABILITY_KEYS: readonly AbilityKey[] = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
];

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
};

export function costOf(score: number): number {
  if (score < MIN_SCORE || score > MAX_SCORE) return -1;
  return COST_TABLE[score - MIN_SCORE];
}

export function marginalCost(currentScore: number): number {
  if (currentScore >= MAX_SCORE) return -1;
  return costOf(currentScore + 1) - costOf(currentScore);
}

export function pointsSpent(scores: Record<AbilityKey, number>): number {
  return ABILITY_KEYS.reduce((sum, k) => sum + costOf(scores[k]), 0);
}

export function pointsRemaining(scores: Record<AbilityKey, number>): number {
  return TOTAL_POINTS - pointsSpent(scores);
}

export function canIncrement(score: number, remaining: number): boolean {
  if (score >= MAX_SCORE) return false;
  return marginalCost(score) <= remaining;
}

export function canDecrement(score: number): boolean {
  return score > MIN_SCORE;
}

export function modifierOf(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * 1st-level HP per 5e: max hit-die roll + Constitution modifier.
 * Returns null when hitDie is missing or 0 — caller hides the HP figure.
 */
export function firstLevelHp(
  hitDie: number | undefined,
  conMod: number,
): number | null {
  if (!hitDie) return null;
  return hitDie + conMod;
}

export function applyBonuses(
  base: Record<AbilityKey, number>,
  plus2: AbilityKey | '',
  plus1: AbilityKey | '',
): Record<AbilityKey, number> {
  const result = { ...base };
  if (plus2) result[plus2] += 2;
  if (plus1) result[plus1] += 1;
  return result;
}
