import { describe, it, expect } from 'vitest';
import { calculateLevel, getTitleForLevel, getEarnedTrophies } from './levels';

describe('Leveling System', () => {
  describe('calculateLevel', () => {
    it('should return level 1 for 0 XP', () => {
      expect(calculateLevel(0)).toBe(1);
    });

    it('should return level 2 for 100 XP', () => {
      expect(calculateLevel(100)).toBe(2);
    });

    it('should return level 3 for 300 XP', () => {
      expect(calculateLevel(300)).toBe(3);
    });

    it('should correctly calculate higher levels', () => {
      // (10 * 9 / 2) * 100 = 4500 XP for level 10
      expect(calculateLevel(4500)).toBe(10);
    });
  });

  describe('getTitleForLevel', () => {
    it('should return Frøspire for level 1', () => {
      expect(getTitleForLevel(1)).toBe('Frøspire');
    });

    it('should return Mesterbiolog for level 20', () => {
      expect(getTitleForLevel(20)).toBe('Mesterbiolog');
    });

    it('should return Mesterbiolog for levels above 20', () => {
      expect(getTitleForLevel(25)).toBe('Mesterbiolog');
    });
  });

  describe('getEarnedTrophies', () => {
    it('should return empty list for level 1', () => {
      expect(getEarnedTrophies(1)).toEqual([]);
    });

    it('should return [5] for level 5', () => {
      expect(getEarnedTrophies(5)).toEqual([5]);
    });

    it('should return [5, 10] for level 10', () => {
      expect(getEarnedTrophies(10)).toEqual([5, 10]);
    });
  });
});
