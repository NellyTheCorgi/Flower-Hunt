import { expect, test, describe } from 'bun:test';
import {
  calculateLevel,
  getXPForLevel,
  getEarnedTrophies,
  getTitleForLevel,
  getIconNameForLevel,
  getNextLevelXP,
  getProgressToNextLevel,
  TITLES,
  LEVEL_ICONS,
  MILESTONES
} from './levels';

describe('Leveling System', () => {
  describe('calculateLevel', () => {
    test('returns 1 for xp <= 0', () => {
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(-100)).toBe(1);
    });

    test('calculates correct level for given xp', () => {
      // Base logic: Total XP = (Level * (Level - 1) / 2) * 100
      // L1 = 0
      // L2 = (2 * 1 / 2) * 100 = 100
      // L3 = (3 * 2 / 2) * 100 = 300
      // L4 = (4 * 3 / 2) * 100 = 600
      // L5 = (5 * 4 / 2) * 100 = 1000

      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(99)).toBe(1);
      expect(calculateLevel(100)).toBe(2);
      expect(calculateLevel(299)).toBe(2);
      expect(calculateLevel(300)).toBe(3);
      expect(calculateLevel(599)).toBe(3);
      expect(calculateLevel(600)).toBe(4);
      expect(calculateLevel(1000)).toBe(5);
    });
  });

  describe('getXPForLevel', () => {
    test('returns 0 for level <= 1', () => {
      expect(getXPForLevel(1)).toBe(0);
      expect(getXPForLevel(0)).toBe(0);
      expect(getXPForLevel(-5)).toBe(0);
    });

    test('returns correct xp for given level', () => {
      expect(getXPForLevel(2)).toBe(100);
      expect(getXPForLevel(3)).toBe(300);
      expect(getXPForLevel(4)).toBe(600);
      expect(getXPForLevel(5)).toBe(1000);
    });
  });

  describe('getEarnedTrophies', () => {
    test('returns correct milestones for given level', () => {
      expect(getEarnedTrophies(1)).toEqual([]);
      expect(getEarnedTrophies(4)).toEqual([]);
      expect(getEarnedTrophies(5)).toEqual([5]);
      expect(getEarnedTrophies(9)).toEqual([5]);
      expect(getEarnedTrophies(10)).toEqual([5, 10]);
      expect(getEarnedTrophies(15)).toEqual([5, 10, 15]);
      expect(getEarnedTrophies(20)).toEqual([5, 10, 15, 20]);
      expect(getEarnedTrophies(25)).toEqual([5, 10, 15, 20]);
    });
  });

  describe('getTitleForLevel', () => {
    test('returns correct title for valid levels', () => {
      expect(getTitleForLevel(1)).toBe(TITLES[0]);
      expect(getTitleForLevel(2)).toBe(TITLES[1]);
      expect(getTitleForLevel(20)).toBe(TITLES[19]);
    });

    test('handles out of bounds levels', () => {
      expect(getTitleForLevel(0)).toBe(TITLES[0]);
      expect(getTitleForLevel(-5)).toBe(TITLES[0]);
      expect(getTitleForLevel(21)).toBe(TITLES[19]);
      expect(getTitleForLevel(100)).toBe(TITLES[19]);
    });
  });

  describe('getIconNameForLevel', () => {
    test('returns correct icon for valid levels', () => {
      expect(getIconNameForLevel(1)).toBe(LEVEL_ICONS[0]);
      expect(getIconNameForLevel(2)).toBe(LEVEL_ICONS[1]);
      expect(getIconNameForLevel(20)).toBe(LEVEL_ICONS[19]);
    });

    test('handles out of bounds levels', () => {
      expect(getIconNameForLevel(0)).toBe(LEVEL_ICONS[0]);
      expect(getIconNameForLevel(-5)).toBe(LEVEL_ICONS[0]);
      expect(getIconNameForLevel(21)).toBe(LEVEL_ICONS[19]);
      expect(getIconNameForLevel(100)).toBe(LEVEL_ICONS[19]);
    });
  });

  describe('getNextLevelXP', () => {
    test('returns correct xp for next level', () => {
      expect(getNextLevelXP(1)).toBe(100); // L2
      expect(getNextLevelXP(2)).toBe(300); // L3
      expect(getNextLevelXP(3)).toBe(600); // L4
    });
  });

  describe('getProgressToNextLevel', () => {
    test('calculates correct progress data', () => {
      // 150 XP is L2 (100 XP), L3 is 300 XP.
      // Current level = 2
      // Next level = 3
      // currentLevelXP = 100
      // nextLevelXP = 300
      // xpInCurrentLevel = 50
      // xpNeededForNextLevel = 200
      // progress = (50 / 200) * 100 = 25%
      // remainingXP = 150

      const progress = getProgressToNextLevel(150);

      expect(progress.currentLevel).toBe(2);
      expect(progress.xpInCurrentLevel).toBe(50);
      expect(progress.xpNeededForNextLevel).toBe(200);
      expect(progress.progress).toBe(25);
      expect(progress.remainingXP).toBe(150);
    });

    test('handles exact level xp correctly', () => {
      // 300 XP is exactly L3
      const progress = getProgressToNextLevel(300);

      expect(progress.currentLevel).toBe(3);
      expect(progress.xpInCurrentLevel).toBe(0);
      expect(progress.xpNeededForNextLevel).toBe(300); // L4 is 600, 600 - 300 = 300
      expect(progress.progress).toBe(0);
      expect(progress.remainingXP).toBe(300);
    });

    test('handles 0 xp correctly', () => {
      const progress = getProgressToNextLevel(0);

      expect(progress.currentLevel).toBe(1);
      expect(progress.xpInCurrentLevel).toBe(0);
      expect(progress.xpNeededForNextLevel).toBe(100);
      expect(progress.progress).toBe(0);
      expect(progress.remainingXP).toBe(100);
    });
  });
});
