import { expect, test, mock, describe, beforeEach, afterEach } from "bun:test";
import "../../test-setup.ts"; // Load this before anything else!

import { useFlowerScanner } from "./useFlowerScanner";
import { getDoc, getDocs, updateDoc, setDoc } from "firebase/firestore";

mock.module("react", () => ({
  useState: (init: any) => {
    let state = init;
    const setState = mock((val: any) => {
      state = typeof val === 'function' ? val(state) : val;
    });
    return [state, setState];
  },
}));

describe("useFlowerScanner - collectFlower level up logic", () => {
  const mockSpecies = {
    id: "flower1",
    name: "Test Flower",
    scientificName: "Testus flowerus",
    family: "Testaceae",
    habitat: "Test environment",
    rarity: "common" as const,
    description: "A test flower.",
    formattedText: "Test Flower",
    icon: "Flower"
  };

  beforeEach(() => {
    (getDoc as ReturnType<typeof mock>).mockClear();
    (getDocs as ReturnType<typeof mock>).mockClear();
    (updateDoc as ReturnType<typeof mock>).mockClear();
    (setDoc as ReturnType<typeof mock>).mockClear();
  });

  afterEach(() => {
    mock.restore();
  });

  test("new discovery updates user stats and returns new level if threshold crossed", async () => {
    const { collectFlower } = useFlowerScanner();

    // Mock new discovery (empty query snap)
    (getDocs as ReturnType<typeof mock>).mockResolvedValueOnce({ empty: true, docs: [] });

    // Mock existing user close to level up (XP threshold for level 2 is 100)
    // 75 XP + 25 XP (from new discovery) = 100 XP -> Level 2
    (getDoc as ReturnType<typeof mock>).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        stats: { xp: 75, totalFound: 3, level: 1 }
      })
    });

    const refreshProfile = mock(() => Promise.resolve());

    const result = await collectFlower(
      "user123",
      mockSpecies as any,
      "base64image",
      { extract: "Wiki extract" },
      refreshProfile
    );

    // Should return the new level
    expect(result).toBe(2);

    // Verify user profile update
    expect(updateDoc).toHaveBeenCalled();
    const updateCallArgs = (updateDoc as any).mock.calls[0];
    expect(updateCallArgs[1]).toEqual({
      'stats.totalFound': 4,
      'stats.xp': 100,
      'stats.level': 2,
      unlocked_trophies: [],
      updatedAt: "timestamp"
    });
  });

  test("existing discovery doesn't update user stats", async () => {
      const { collectFlower } = useFlowerScanner();

      // Mock NOT a new discovery (not empty query snap)
      (getDocs as ReturnType<typeof mock>).mockResolvedValueOnce({ empty: false, docs: [{ id: "some_old_doc" }] });

      const refreshProfile = mock(() => Promise.resolve());

      const result = await collectFlower(
        "user123",
        mockSpecies as any,
        "base64image",
        { extract: "Wiki extract" },
        refreshProfile
      );

      // Should return null (no new level)
      expect(result).toBeNull();

      // Should not check user doc or update stats
      expect(getDoc).not.toHaveBeenCalled();
      expect(updateDoc).not.toHaveBeenCalled();
  });

  test("new discovery updates user stats but returns null if no new level reached", async () => {
    const { collectFlower } = useFlowerScanner();

    // Mock new discovery (empty query snap)
    (getDocs as ReturnType<typeof mock>).mockResolvedValueOnce({ empty: true, docs: [] });

    // Mock existing user NOT close to level up (XP threshold for level 2 is 100)
    // 10 XP + 25 XP = 35 XP -> Still Level 1
    (getDoc as ReturnType<typeof mock>).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        stats: { xp: 10, totalFound: 1, level: 1 }
      })
    });

    const refreshProfile = mock(() => Promise.resolve());

    const result = await collectFlower(
      "user123",
      mockSpecies as any,
      "base64image",
      { extract: "Wiki extract" },
      refreshProfile
    );

    // Should return null (no new level)
    expect(result).toBeNull();

    // Verify user profile update was still called
    expect(updateDoc).toHaveBeenCalled();
    const updateCallArgs = (updateDoc as any).mock.calls[0];
    expect(updateCallArgs[1]).toEqual({
      'stats.totalFound': 2,
      'stats.xp': 35,
      'stats.level': 1,
      unlocked_trophies: [],
      updatedAt: "timestamp"
    });
  });

  test("new discovery updates user stats and unlocked_trophies for milestone level", async () => {
    const { collectFlower } = useFlowerScanner();

    (getDocs as ReturnType<typeof mock>).mockResolvedValueOnce({ empty: true, docs: [] });

    // Level 5 requires 1000 XP
    // 980 XP + 25 XP = 1005 XP -> Level 5!
    (getDoc as ReturnType<typeof mock>).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        stats: { xp: 980, totalFound: 25, level: 4 }
      })
    });

    const refreshProfile = mock(() => Promise.resolve());

    const result = await collectFlower(
      "user123",
      mockSpecies as any,
      "base64image",
      { extract: "Wiki extract" },
      refreshProfile
    );

    expect(result).toBe(5);

    expect(updateDoc).toHaveBeenCalled();
    const updateCallArgs = (updateDoc as any).mock.calls[0];
    expect(updateCallArgs[1]).toEqual({
      'stats.totalFound': 26,
      'stats.xp': 1005,
      'stats.level': 5,
      unlocked_trophies: [5], // Assuming level 5 is a milestone
      updatedAt: "timestamp"
    });
  });

  test("missing user doc handles gracefully", async () => {
    const { collectFlower } = useFlowerScanner();

    (getDocs as ReturnType<typeof mock>).mockResolvedValueOnce({ empty: true, docs: [] });

    // Mock existing user doc NOT existing
    (getDoc as ReturnType<typeof mock>).mockResolvedValueOnce({
      exists: () => false,
      data: () => null
    });

    const refreshProfile = mock(() => Promise.resolve());

    const result = await collectFlower(
      "user123",
      mockSpecies as any,
      "base64image",
      { extract: "Wiki extract" },
      refreshProfile
    );

    // Should return null (no new level)
    expect(result).toBeNull();

    // Verify user profile update was NOT called
    expect(updateDoc).not.toHaveBeenCalled();
  });

  test("returns null and handles error when an exception is thrown", async () => {
    const { collectFlower } = useFlowerScanner();

    // Force an error when getDocs is called
    (getDocs as ReturnType<typeof mock>).mockRejectedValueOnce(new Error("Network error"));

    const refreshProfile = mock(() => Promise.resolve());

    const result = await collectFlower(
      "user123",
      mockSpecies as any,
      "base64image",
      { extract: "Wiki extract" },
      refreshProfile
    );

    // Should return null (no new level)
    expect(result).toBeNull();
  });
});
