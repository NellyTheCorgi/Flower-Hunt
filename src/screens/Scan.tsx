import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { Icons, ScreenType, FLOWER_IMAGES } from '../constants';
import { NORWEGIAN_FLOWERS, FlowerSpecies } from '../data/flowers';
import { identifyFlower } from '../services/geminiService';
import { fetchFlowerInfo, WikipediaInfo } from '../services/wikipediaService';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { calculateLevel, getEarnedTrophies, getTitleForLevel, getIconNameForLevel, MILESTONES } from '../lib/levels';
import { collection, serverTimestamp, doc, updateDoc, increment, getDoc, setDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { useFirebase } from '../context/FirebaseContext';

interface ScanProps {
  onBack: () => void;
  onNavigate: (screen: ScreenType) => void;
}

export default function Scan({ onBack, onNavigate }: ScanProps) {
  const { user, refreshProfile } = useFirebase();
  const [isScanning, setIsScanning] = useState(false);
  const [isFound, setIsFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [identifiedSpecies, setIdentifiedSpecies] = useState<FlowerSpecies | null>(null);
  const [wikiInfo, setWikiInfo] = useState<WikipediaInfo | null>(null);
  const [previewImage, setPreviewImage] = useState<string>(FLOWER_IMAGES.sunflowerView);
  const [leveledUpTo, setLeveledUpTo] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setIsFound(false);
    setIdentifiedSpecies(null);
    setWikiInfo(null);

    const reader = new FileReader();
    
    // Add timeout to scanning just in case
    const scanTimeout = setTimeout(() => {
      if (isScanning) {
        setIsScanning(false);
        alert('Analysen tok for lang tid. Vennligst prøv et annet bildet eller sjekk internettforbindelsen din.');
      }
    }, 30000); // 30 seconds

    reader.onerror = () => {
      clearTimeout(scanTimeout);
      setIsScanning(false);
      alert('Klarte ikke å lese bildefilen.');
    };

    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      
      const img = new Image();
      img.onerror = () => {
        clearTimeout(scanTimeout);
        setIsScanning(false);
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
          setPreviewImage(compressedBase64);
          
          const result = await identifyFlower(compressedBase64, 'image/jpeg');
          
          clearTimeout(scanTimeout);
          
          if (!result) throw new Error('Ingen resultat fra AI');
          if (result.error) {
             alert(`Beklager, vi klarte ikke å analysere bildet: ${result.error}`);
             setIsScanning(false);
             return;
          }

          let species: FlowerSpecies;
          const normalizedScientificName = (result.scientificName || 'unknown')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]/g, '-');

          // Attempt to find match in database even if isMatch is false, based on scientific name
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

          setIdentifiedSpecies(species);
          const info = await fetchFlowerInfo(species.scientificName || species.name);
          setWikiInfo(info);
          setIsFound(true);
        } catch (err) {
          console.error('Identification error:', err);
          alert('Det oppsto en feil under bildeanalysen. Vennligst prøv igjen.');
        } finally {
          setIsScanning(false);
          clearTimeout(scanTimeout);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleCollect = async () => {
    if (!user || !identifiedSpecies) return;
    setSaving(true);

    try {
      // 1. Query for any existing entries of this species (by ID or Name) for this user
      const collectionsRef = collection(db, 'collections');
      
      // Specifically query by speciesName since that's what shows in the UI and is user-expected to be unique
      const q = query(
        collectionsRef, 
        where('userId', '==', user.uid),
        where('speciesName', '==', identifiedSpecies.name)
      );
      
      const querySnap = await getDocs(q);
      
      // The deterministic composite ID: userId_speciesId
      const collId = `${user.uid}_${identifiedSpecies.id}`;
      const collDocRef = doc(db, 'collections', collId);
      
      let location = null;
      try {
        if ('geolocation' in navigator) {
          console.log('Starter GPS-henting...');
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0
            });
          });
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('GPS lokasjon hentet suksessfullt:', location);
        }
      } catch (err) {
        console.warn('Kunne ikke hente GPS-lokasjon:', err);
      }
      
      const docData: any = {
        userId: user.uid,
        speciesId: identifiedSpecies.id,
        speciesName: identifiedSpecies.name,
        imageUrl: previewImage,
        collectedAt: serverTimestamp(),
        scientificName: identifiedSpecies.scientificName || 'Ukjent',
        family: identifiedSpecies.family || '',
        habitat: identifiedSpecies.habitat || 'Ukjent',
        rarity: identifiedSpecies.rarity || 'common',
        description: wikiInfo?.extract || identifiedSpecies.description || "Vakkert bevart i din digitale samling.",
        formattedText: (identifiedSpecies as any).formattedText || '',
      };

      if (wikiInfo?.sourceUrl) {
        docData.wikiUrl = wikiInfo.sourceUrl;
      }

      if (location) {
        docData.location = location;
      }

      const isNewDiscovery = querySnap.empty;

      // Clean up ANY document that matches this species name but has a different ID
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
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
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
        } catch (userError) {
          handleFirestoreError(userError, OperationType.UPDATE, `users/${user.uid}`);
        }
      }

      await refreshProfile();
      
      if (newLevelAchieved) {
        setLeveledUpTo(newLevelAchieved);
      } else {
        onNavigate('collection');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('users/')) {
        throw error;
      }
      handleFirestoreError(error, OperationType.WRITE, 'collections');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-secondary rounded-full blur-3xl" />
      </div>

      <button 
        onClick={onBack}
        className="absolute top-8 left-8 w-12 h-12 rounded-2xl bg-white shadow-sm border border-outline-variant/30 flex items-center justify-center text-primary active:scale-95 transition-transform"
      >
        <Icons.ChevronRight className="w-6 h-6 rotate-180" />
      </button>

      <div className="text-center space-y-12 relative z-10 w-full max-w-sm px-4">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold font-display text-primary tracking-tight">Feltkamera</h2>
          <p className="text-muted-foreground text-base max-w-[280px] mx-auto leading-relaxed">
            {isScanning ? 'Søker i norsk flora-database...' : 'Sikt på en ville-blomst og ta et bilde for å identifisere arten.'}
          </p>
        </div>

        <div className="relative flex flex-col items-center gap-8">
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleCapture}
          />
          
          <div className="relative">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className={`w-full py-5 px-10 rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl relative transition-all duration-300 font-bold text-lg min-w-[240px] ${
                isScanning ? 'bg-secondary text-primary cursor-wait' : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {isScanning ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Identifiserer...</span>
                </>
              ) : (
                <>
                  <Icons.Camera className="w-6 h-6" />
                  <span>Ta bilde av blomst</span>
                </>
              )}
            </motion.button>

            {/* Pulsing decoration */}
            {!isScanning && (
              <div className="absolute -inset-2 rounded-[2.5rem] bg-primary/10 animate-pulse -z-10" />
            )}
          </div>
          
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary/40">
            Kun direkte bildeopptak
          </p>
        </div>
      </div>

      <AnimatePresence>
        {isFound && identifiedSpecies && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 p-4 pb-10 z-50"
          >
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden max-h-[70vh] flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-primary mb-1">{identifiedSpecies.name}</h2>
                  <p className="text-sm text-muted-foreground italic font-medium">{identifiedSpecies.scientificName}</p>
                  {identifiedSpecies.family && (
                    <p className="text-[10px] text-primary/60 font-bold uppercase tracking-widest mt-1">
                      {identifiedSpecies.family}
                    </p>
                  )}
                </div>
                <div className="px-3 py-1 bg-secondary rounded-full">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider">{identifiedSpecies.rarity}</span>
                </div>
              </div>

              <div className="overflow-y-auto pr-2 custom-scrollbar">
                <div className="markdown-body space-y-4 text-sm leading-relaxed text-primary/80 pb-4">
                  <Markdown>
                    {identifiedSpecies.formattedText || `**Navn:** ${identifiedSpecies.name}  \n**Latinsk navn:** *${identifiedSpecies.scientificName || 'Ukjent'}*  \n**Familie:** ${(identifiedSpecies.family || 'UKJENT').toUpperCase()}  \n**Sjeldenhetsgrad:** ${(identifiedSpecies.rarity || 'common').toUpperCase()}  \n\n**HABITAT:**  \n${identifiedSpecies.habitat || 'Ukjent'}  \n\n**STATUS:**  \nI blomst  \n\n**FELTGUIDE:**  \n${wikiInfo?.extract || identifiedSpecies.description || 'Ingen informasjon tilgjengelig.'}`}
                  </Markdown>
                  
                  {wikiInfo && (
                    <a 
                      href={wikiInfo.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline mt-2"
                    >
                      Les mer på Wikipedia <Icons.ChevronRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={handleCollect}
                  disabled={saving}
                  className="flex-grow bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50"
                >
                  {saving ? 'Lagrer...' : 'Samle inn'}
                </button>
                <button 
                  onClick={() => setIsFound(false)}
                  className="w-14 h-14 bg-secondary text-primary flex items-center justify-center rounded-2xl active:scale-95 transition-transform"
                >
                  <Icons.Zap className="w-6 h-6" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {leveledUpTo && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ y: 50 }} animate={{ y: 0 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full border border-primary/20 space-y-6"
            >
              <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto flex items-center justify-center text-primary mb-4 relative">
                {(() => {
                  const Icon = Icons[getIconNameForLevel(leveledUpTo)] as typeof Icons.Star;
                  return <Icon className="w-12 h-12" />;
                })()}
                <div className="absolute -top-2 -right-2 bg-secondary w-8 h-8 rounded-full flex items-center justify-center font-bold text-primary">
                  {leveledUpTo}
                </div>
              </div>
              
              <div>
                <h2 className="text-3xl font-display font-bold text-primary mb-2">Level Up!</h2>
                {MILESTONES.includes(leveledUpTo) ? (
                  <p className="text-muted-foreground text-sm leading-relaxed mb-1">
                    Gratulerer! Du har oppnådd tittelen <strong className="text-foreground">{getTitleForLevel(leveledUpTo)}</strong> og låst opp et nytt trofé!
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm leading-relaxed mb-1">
                    Gratulerer! Du har nådd level {leveledUpTo} og tittelen <strong className="text-foreground">{getTitleForLevel(leveledUpTo)}</strong>.
                  </p>
                )}
              </div>
              
              <button 
                onClick={() => { setLeveledUpTo(null); onNavigate('collection'); }}
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform"
              >
                Fortsett
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
