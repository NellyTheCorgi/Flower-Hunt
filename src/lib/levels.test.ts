import { describe, it, expect } from "bun:test";
import { getProgressToNextLevel } from "./levels";

describe("getProgressToNextLevel", () => {
  it("should calculate correctly for 0 XP (Level 1)", () => {
    const result = getProgressToNextLevel(0);
    expect(result).toEqual({
      currentLevel: 1,
      progress: 0,
      xpInCurrentLevel: 0,
      xpNeededForNextLevel: 100,
      remainingXP: 100,
    });
  });

  it("should calculate correctly for midway through Level 1", () => {
    const result = getProgressToNextLevel(50);
    expect(result).toEqual({
      currentLevel: 1,
      progress: 50,
      xpInCurrentLevel: 50,
      xpNeededForNextLevel: 100,
      remainingXP: 50,
    });
  });

  it("should calculate correctly on an exact boundary (Level 2)", () => {
    const result = getProgressToNextLevel(100);
    expect(result).toEqual({
      currentLevel: 2,
      progress: 0,
      xpInCurrentLevel: 0,
      xpNeededForNextLevel: 200,
      remainingXP: 200,
    });
  });

  it("should handle negative XP gracefully", () => {
    // Math logic implies negative XP returns Level 1, 0% progress
    const result = getProgressToNextLevel(-50);
    expect(result).toEqual({
      currentLevel: 1,
      progress: 0,
      xpInCurrentLevel: -50,
      xpNeededForNextLevel: 100,
      remainingXP: 150,
    });
  });

  it("should handle float XP", () => {
    const result = getProgressToNextLevel(150.5);
    expect(result).toEqual({
      currentLevel: 2,
      progress: 25.25,
      xpInCurrentLevel: 50.5,
      xpNeededForNextLevel: 200,
      remainingXP: 149.5,
    });
  });

  it("should calculate correctly for a large amount of XP", () => {
    // Let's pick a known level boundary: Level 10
    // Level 10 XP: (10 * 9 / 2) * 100 = 45 * 100 = 4500
    // Level 11 XP: (11 * 10 / 2) * 100 = 55 * 100 = 5500
    // Try halfway between level 10 and 11: 5000 XP
    const result = getProgressToNextLevel(5000);
    expect(result).toEqual({
      currentLevel: 10,
      progress: 50, // 500 XP out of 1000 XP needed
      xpInCurrentLevel: 500,
      xpNeededForNextLevel: 1000,
      remainingXP: 500,
    });
  });
});
