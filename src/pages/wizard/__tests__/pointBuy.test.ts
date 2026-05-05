import { describe, expect, test } from 'vitest';
import {
  costOf,
  marginalCost,
  canIncrement,
  canDecrement,
  firstLevelHp,
  modifierOf,
  pointsRemaining,
  TOTAL_POINTS,
} from '../pointBuy';

describe('costOf', () => {
  test('all 8 = 0 points', () => {
    expect(costOf(8)).toBe(0);
  });
  test('15 = 9 points, 16 = 12 points', () => {
    expect(costOf(15)).toBe(9);
    expect(costOf(16)).toBe(12);
  });
  test('out of range returns -1', () => {
    expect(costOf(7)).toBe(-1);
    expect(costOf(17)).toBe(-1);
  });
});

describe('marginalCost', () => {
  test('8 to 9 costs 1', () => expect(marginalCost(8)).toBe(1));
  test('13 to 14 costs 2', () => expect(marginalCost(13)).toBe(2));
  test('15 to 16 costs 3', () => expect(marginalCost(15)).toBe(3));
  test('at 16 returns -1', () => expect(marginalCost(16)).toBe(-1));
});

describe('pointsRemaining', () => {
  test('all 8 has full 27 points', () => {
    expect(
      pointsRemaining({
        strength: 8,
        dexterity: 8,
        constitution: 8,
        intelligence: 8,
        wisdom: 8,
        charisma: 8,
      }),
    ).toBe(TOTAL_POINTS);
  });
  test('balanced 14-13-13-12-10-8 spends 23, leaves 4', () => {
    // Costs: 14=7, 13=5, 13=5, 12=4, 10=2, 8=0 = 23 total
    expect(
      pointsRemaining({
        strength: 14,
        dexterity: 13,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 8,
      }),
    ).toBe(4);
  });
});

describe('canIncrement', () => {
  test('false at MAX_SCORE', () => expect(canIncrement(16, 100)).toBe(false));
  test('false when not enough points', () => expect(canIncrement(15, 2)).toBe(false));
  test('true when affordable', () => expect(canIncrement(15, 3)).toBe(true));
});

describe('canDecrement', () => {
  test('false at MIN_SCORE', () => expect(canDecrement(8)).toBe(false));
  test('true above MIN_SCORE', () => expect(canDecrement(9)).toBe(true));
});

describe('firstLevelHp', () => {
  test('hitDie + positive Con mod', () => expect(firstLevelHp(10, 2)).toBe(12));
  test('hitDie + negative Con mod', () => expect(firstLevelHp(8, -1)).toBe(7));
  test('hitDie + zero Con mod', () => expect(firstLevelHp(6, 0)).toBe(6));
  test('returns null when hitDie is undefined', () =>
    expect(firstLevelHp(undefined, 3)).toBeNull());
  test('returns null when hitDie is 0', () => expect(firstLevelHp(0, 3)).toBeNull());
});

describe('modifierOf', () => {
  test('matches the D&D 5e chart', () => {
    expect(modifierOf(3)).toBe(-4);
    expect(modifierOf(4)).toBe(-3);
    expect(modifierOf(5)).toBe(-3);
    expect(modifierOf(6)).toBe(-2);
    expect(modifierOf(7)).toBe(-2);
    expect(modifierOf(8)).toBe(-1);
    expect(modifierOf(9)).toBe(-1);
    expect(modifierOf(10)).toBe(0);
    expect(modifierOf(11)).toBe(0);
    expect(modifierOf(12)).toBe(1);
    expect(modifierOf(13)).toBe(1);
    expect(modifierOf(14)).toBe(2);
    expect(modifierOf(15)).toBe(2);
    expect(modifierOf(16)).toBe(3);
    expect(modifierOf(17)).toBe(3);
    expect(modifierOf(18)).toBe(4);
    expect(modifierOf(19)).toBe(4);
    expect(modifierOf(20)).toBe(5);
  });
});
