import { useState, ChangeEvent } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { identifyFlower as identifyFlowerAI } from '../services/geminiService';
import { fetchFlowerInfo } from '../services/wikipediaService';
import { FlowerSpecies, IdentifiedFlower, CollectedFlower, UserProfile } from '../types';
import { WikipediaInfo } from '../services/wikipediaService';
import { NORWEGIAN_FLOWERS } from '../data/flowers';
import { calculateLevel, getEarnedTrophies } from '../lib/levels';
import { FLOWER_IMAGES, ScreenType } from '../constants';

export function useFlowerScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isFound, setIsFound] = useState(false);
  const [identifiedSpecies, setIdentifiedSpecies] = useState<FlowerSpecies | null>(null);
  const [wikiInfo, setWikiInfo] = useState<WikipediaInfo | null>(null);
  const [previewImage, setPreviewImage] = useState<string>(FLOWER_IMAGES.sunflowerView);
  const [leveledUpTo, setLeveledUpTo] = useState<number | null>(null);

  const scanImage = async (compressedBase64: string): Promise<{
    species: FlowerSpecies;
    wikiInfo: any;
  } | null> => {
    setIsScanning(true);
    setError(null);
    try {
      const result: IdentifiedFlower | null = await identifyFlowerAI(compressedBase64, 'image/jpeg');

      if (!result) throw new Error('Ingen resultat fra AI');
      if (result.error) {
        setError(`Beklager, vi klarte ikke å analysere bildet: ${result.error}`);
        return null;
      }

      let species: FlowerSpecies;
      const normalizedScientificName = (result.scientificName || 'unknown')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '-');

      const dbMatch = result.id ?
        NORWEGIAN_FLOWERS.find(f => f.id === result.id) :
        NORWEGIAN_FLOWERS.find(f => f.scientificName.toLowerCase() === (result.scientificName || '').toLowerCase());

      if (dbMatch) {
        species = { ...dbMatch, formattedText: result.formattedText } as any;
      } else {
        species = {
          id: result.id || `species-${normalizedScientificName}`,
          name: result.name || 'Ukjent',
          scientificName: result.scientificName || 'Unknown',
          rarity: (result.rarity as any) || 'unknown',
          description: result.description || '',
          habitat: result.habitat || '',
          icon: 'Flower',
          family: result.family,
          formattedText: result.formattedText
        } as any;
      }

      const wikiInfo = await fetchFlowerInfo(species.scientificName || species.name);
      return { species, wikiInfo };
    } catch (err) {
      console.error('Identification error:', err);
      setError('Det oppsto en feil under bildeanalysen. Vennligst prøv igjen.');
      return null;
    } finally {
      setIsScanning(false);
    }
  };

  const collectFlower = async (
    userId: string,
    identifiedSpecies: FlowerSpecies,
    previewImage: string,
    wikiInfo: any,
    refreshProfile: () => Promise<void>
  ): Promise<number | null> => {
    setSaving(true);
    setError(null);
    try {
      const collectionsRef = collection(db, 'collections');
      const q = query(
        collectionsRef,
        where('userId', '==', userId),
        where('speciesName', '==', identifiedSpecies.name)
      );

      const querySnap = await getDocs(q);
      const collId = `${userId}_${identifiedSpecies.id}`;
      const collDocRef = doc(db, 'collections', collId);

      let location = null;
      try {
        if ('geolocation' in navigator) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            });
          });
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        }
      } catch (err) {
        console.warn('Kunne ikke hente GPS-lokasjon:', err);
      }

      const docData: any = {
        userId: userId,
        speciesId: identifiedSpecies.id,
        speciesName: identifiedSpecies.name,
        imageUrl: previewImage,
        collectedAt: serverTimestamp(),
        scientificName: identifiedSpecies.scientificName || 'Ukjent',
        family: identifiedSpecies.family || '',
        habitat: identifiedSpecies.habitat || 'Ukjent',
        rarity: identifiedSpecies.rarity || 'common',
        description: wikiInfo?.extract || identifiedSpecies.description || "Vakkert bevart i din digitale samling.",
        formattedText: identifiedSpecies.formattedText || '',
      };

      if (wikiInfo?.sourceUrl) {
        docData.wikiUrl = wikiInfo.sourceUrl;
      }

      if (location) {
        docData.location = location;
      }

      const isNewDiscovery = querySnap.empty;

      if (!querySnap.empty) {
        for (const oldDoc of querySnap.docs) {
          if (oldDoc.id !== collId) {
            await deleteDoc(doc(db, 'collections', oldDoc.id));
          }
        }
      }

      await setDoc(collDocRef, docData, { merge: true });

      let newLevelAchieved: number | null = null;
      if (isNewDiscovery) {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data() as UserProfile;
          const currentXP = userData.stats?.xp || 0;
          const currentTotalFound = userData.stats?.totalFound || 0;
          const currentLevel = userData.stats?.level || 1;

          const newXP = currentXP + 25;
          const newLevel = calculateLevel(newXP);
          const trophies = getEarnedTrophies(newLevel);

          if (newLevel > currentLevel) {
            newLevelAchieved = newLevel;
          }

          await updateDoc(userRef, {
            'stats.totalFound': currentTotalFound + 1,
            'stats.xp': newXP,
            'stats.level': newLevel,
            unlocked_trophies: trophies,
            updatedAt: serverTimestamp()
          });
        }
      }

      await refreshProfile();
      return newLevelAchieved;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'collections');
      setError('Det oppsto en feil ved lagring. Vennligst prøv igjen.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const processImage = async (dataUrl: string) => {
    setIsFound(false);
    setIdentifiedSpecies(null);
    setWikiInfo(null);
    setPreviewImage(dataUrl);

    const result = await scanImage(dataUrl);

    if (result) {
      setIdentifiedSpecies(result.species);
      setWikiInfo(result.wikiInfo);
      setIsFound(true);
    } else if (error) {
       alert(error);
    }
  };

  const handleCapture = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onerror = () => {
      alert('Klarte ikke å lese bildefilen.');
    };

    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;

      const img = new Image();
      img.onerror = () => {
        alert('Klarte ikke å behandle bildet.');
      };

      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not get canvas context');

          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          await processImage(compressedBase64);
        } catch (err) {
          console.error('Identification error:', err);
          alert('Det oppsto en feil under bildeanalysen. Vennligst prøv igjen.');
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleCollect = async (
    userId: string,
    refreshProfile: () => Promise<void>,
    onNavigate: (screen: ScreenType) => void
  ) => {
    if (!identifiedSpecies) return;

    const newLevelAchieved = await collectFlower(
      userId,
      identifiedSpecies,
      previewImage,
      wikiInfo,
      refreshProfile
    );

    if (newLevelAchieved) {
      setLeveledUpTo(newLevelAchieved);
    } else if (newLevelAchieved !== null || !error) { // if null returned and no error, means success but no level up
      onNavigate('collection');
    }
  };

  return {
    isScanning,
    saving,
    error,
    setError,
    scanImage,
    collectFlower,
    isFound,
    setIsFound,
    identifiedSpecies,
    setIdentifiedSpecies,
    wikiInfo,
    setWikiInfo,
    previewImage,
    setPreviewImage,
    leveledUpTo,
    setLeveledUpTo,
    processImage,
    handleCapture,
    handleCollect
  };
}
