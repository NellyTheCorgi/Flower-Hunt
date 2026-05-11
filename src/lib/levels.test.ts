/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { expect, test, describe } from "bun:test";
import { getTitleForLevel, getIconNameForLevel, TITLES, LEVEL_ICONS } from "./levels";

describe("getTitleForLevel", () => {
  test("returns the first title for level 1", () => {
    expect(getTitleForLevel(1)).toBe(TITLES[0]);
    expect(getTitleForLevel(1)).toBe("Frøspire");
  });

  test("returns the last title for level 20", () => {
    expect(getTitleForLevel(20)).toBe(TITLES[TITLES.length - 1]);
    expect(getTitleForLevel(20)).toBe("Mesterbiolog");
  });

  test("clamps level below 1 to the first title", () => {
    expect(getTitleForLevel(0)).toBe(TITLES[0]);
    expect(getTitleForLevel(-10)).toBe(TITLES[0]);
  });

  test("clamps level above 20 to the last title", () => {
    expect(getTitleForLevel(21)).toBe(TITLES[TITLES.length - 1]);
    expect(getTitleForLevel(100)).toBe(TITLES[TITLES.length - 1]);
  });
});

describe("getIconNameForLevel", () => {
  test("returns the first icon for level 1", () => {
    expect(getIconNameForLevel(1)).toBe(LEVEL_ICONS[0]);
    expect(getIconNameForLevel(1)).toBe("Sprout");
  });

  test("returns the last icon for level 20", () => {
    expect(getIconNameForLevel(20)).toBe(LEVEL_ICONS[LEVEL_ICONS.length - 1]);
    expect(getIconNameForLevel(20)).toBe("Medal");
  });

  test("clamps level below 1 to the first icon", () => {
    expect(getIconNameForLevel(0)).toBe(LEVEL_ICONS[0]);
    expect(getIconNameForLevel(-5)).toBe(LEVEL_ICONS[0]);
  });

  test("clamps level above 20 to the last icon", () => {
    expect(getIconNameForLevel(21)).toBe(LEVEL_ICONS[LEVEL_ICONS.length - 1]);
    expect(getIconNameForLevel(500)).toBe(LEVEL_ICONS[LEVEL_ICONS.length - 1]);
  });
});
