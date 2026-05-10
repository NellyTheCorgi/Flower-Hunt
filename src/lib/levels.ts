
import { Icons } from '../constants';

/**
 * Leveling system for the Flora Explorer app
 * Formula: Total XP = (Level * (Level - 1) / 2) * 100
 * Inverse: Level = floor((1 + sqrt(1 + 0.08 * XP)) / 2)
 */

export const TITLES = [
  "Frøspire", // 1
  "Bladsamler", // 2
  "Knoppskyter", // 3
  "Eng-entusiast", // 4
  "Hobbygartner", // 5 (Milestone)
  "Naturvenn", // 6
  "Flora-læring", // 7
  "Stifinner", // 8
  "Skogsvandrer", // 9
  "Feltbotaniker", // 10 (Milestone)
  "Myrforsker", // 11
  "Fjellklatrer", // 12
  "Linne-lærling", // 13
  "Urtekjenner", // 14
  "Planteverner", // 15 (Milestone)
  "Økosystem-vokter", // 16
  "Arveprins/prinsesse", // 17
  "Ekspert-observatør", // 18
  "Flora-mentor", // 19
  "Mesterbiolog" // 20 (Milestone)
];

export const LEVEL_ICONS = [
  "Sprout", // 1
  "Leaf", // 2
  "Clover", // 3
  "Flower2", // 4
  "Droplets", // 5
  "Bird", // 6
  "BookOpenCheck", // 7
  "Compass", // 8
  "Mountain", // 9
  "Microscope", // 10
  "Waves", // 11
  "Sunrise", // 12
  "PenTool", // 13
  "FlaskConical", // 14
  "ShieldCheck", // 15
  "Globe", // 16
  "Crown", // 17
  "Telescope", // 18
  "Users", // 19
  "Medal", // 20
] as const;

export const MILESTONES = [5, 10, 15, 20];

export const getTitleForLevel = (level: number): string => {
  const index = Math.min(Math.max(level - 1, 0), Math.max(TITLES.length - 1, 0));
  return TITLES[index] || "Eventyrer";
};

export const getIconNameForLevel = (level: number): keyof typeof Icons => {
  const index = Math.min(Math.max(level - 1, 0), Math.max(LEVEL_ICONS.length - 1, 0));
  return LEVEL_ICONS[index] as keyof typeof Icons || "Star";
};

export const getEarnedTrophies = (level: number): number[] => {
  return MILESTONES.filter(m => m <= level);
};

export const calculateLevel = (xp: number): number => {
  if (xp <= 0) return 1;
  return Math.floor((1 + Math.sqrt(1 + 0.08 * xp)) / 2);
};

export const getXPForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return (level * (level - 1) / 2) * 100;
};

export const getNextLevelXP = (currentLevel: number): number => {
  return getXPForLevel(currentLevel + 1);
};

export const getProgressToNextLevel = (xp: number) => {
  const currentLevel = calculateLevel(xp);
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getNextLevelXP(currentLevel);
  
  const xpInCurrentLevel = xp - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  
  const progress = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100));
  
  return {
    currentLevel,
    progress,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    remainingXP: nextLevelXP - xp
  };
};
