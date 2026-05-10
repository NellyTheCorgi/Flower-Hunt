import { Timestamp } from 'firebase/firestore';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'ghost' | 'unknown';

export interface FlowerSpecies {
  id: string;
  name: string;
  scientificName: string;
  family?: string;
  rarity: Rarity;
  description: string;
  habitat: string;
  icon: string;
  image?: string;
  formattedText?: string;
}

export interface UserStats {
  totalFound: number;
  uniqueSpecies: number;
  level: number;
  xp: number;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  stats: UserStats;
  unlocked_trophies?: number[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface IdentifiedFlower {
  id?: string;
  name?: string;
  scientificName?: string;
  family?: string;
  description?: string;
  habitat?: string;
  rarity?: Rarity;
  isMatch?: boolean;
  error?: string;
  formattedText?: string;
}

export interface CollectedFlower {
  id: string;
  userId: string;
  speciesId: string;
  speciesName: string;
  scientificName: string;
  family: string;
  habitat: string;
  rarity: Rarity;
  description: string;
  imageUrl: string;
  collectedAt: Timestamp;
  location?: {
    lat: number;
    lng: number;
  } | null;
  formattedText?: string;
  wikiUrl?: string;
}
