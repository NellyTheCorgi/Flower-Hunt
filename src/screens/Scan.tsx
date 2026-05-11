import { useState, useRef, ChangeEvent, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import Webcam from 'react-webcam';
import { Icons, ScreenType, FLOWER_IMAGES } from '../constants';
import { FlowerSpecies } from '../types';
import { WikipediaInfo } from '../services/wikipediaService';
import { useFirebase } from '../context/FirebaseContext';
import { getTitleForLevel, getIconNameForLevel, MILESTONES } from '../lib/levels';
import { useFlowerScanner } from '../hooks/useFlowerScanner';

interface ScanProps {
  onBack: () => void;
  onNavigate: (screen: ScreenType) => void;
}

export default function Scan({ onBack, onNavigate }: ScanProps) {
  const { user, refreshProfile } = useFirebase();
  const { isScanning, saving, error, setError, scanImage, collectFlower } = useFlowerScanner();

  const [isFound, setIsFound] = useState(false);
  const [identifiedSpecies, setIdentifiedSpecies] = useState<FlowerSpecies | null>(null);
  const [wikiInfo, setWikiInfo] = useState<WikipediaInfo | null>(null);
  const [previewImage, setPreviewImage] = useState<string>(FLOWER_IMAGES.sunflowerView);
  const [leveledUpTo, setLeveledUpTo] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);

  // Automatic scanning polling
  useEffect(() => {
    // fixed

    const pollCamera = async () => {
      // Don't poll if we're already scanning, or we already found a flower
      if (isScanning || isFound || !webcamRef.current) return;

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      try {
        const result = await scanImage(imageSrc);
        if (result && !error) {
          setPreviewImage(imageSrc);
          setIdentifiedSpecies(result.species);
          setWikiInfo(result.wikiInfo);
          setIsFound(true);
        }
      } catch (e) {
        // Quietly ignore errors during polling so it just keeps trying
      }
    };

    const intervalId = setInterval(pollCamera, 4000);
    return () => clearInterval(intervalId);
  }, [isScanning, isFound, scanImage, error]);


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

  const handleCollect = async () => {
    if (!user || !identifiedSpecies) return;

    const newLevelAchieved = await collectFlower(
      user.uid,
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

  return (
    <div className="h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Live Camera Feed Background */}
      {!isFound && (
        <div className="absolute inset-0 z-0 bg-black">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.8}
            videoConstraints={{ facingMode: "environment" }}
            className="w-full h-full object-cover opacity-80"
          />
        </div>
      )}

      {/* Background decoration if found */}
      {isFound && (
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-secondary rounded-full blur-3xl" />
        </div>
      )}

      <button 
        onClick={onBack}
        className="absolute top-8 left-8 w-12 h-12 rounded-2xl bg-white/80 backdrop-blur shadow-sm border border-outline-variant/30 flex items-center justify-center text-primary active:scale-95 transition-transform z-20"
      >
        <Icons.ChevronRight className="w-6 h-6 rotate-180" />
      </button>

      <div className="text-center space-y-12 relative z-10 w-full max-w-sm px-4 mt-auto mb-12">
        {!isFound && (
          <div className="space-y-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-xl">
            <h2 className="text-3xl font-bold font-display text-primary tracking-tight">Feltkamera</h2>
            <p className="text-primary/80 text-sm max-w-[280px] mx-auto leading-relaxed">
              {isScanning ? 'Søker i norsk flora-database...' : 'Pek kameraet mot en blomst for automatisk identifisering, eller ta et bilde manuelt.'}
            </p>
          </div>
        )}

        <div className="relative flex flex-col items-center gap-8">
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleCapture}
          />
          
          {!isFound && (
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
                    <span>Ta bilde manuelt</span>
                  </>
                )}
              </motion.button>

              {/* Pulsing decoration */}
              {!isScanning && (
                <div className="absolute -inset-2 rounded-[2.5rem] bg-primary/10 animate-pulse -z-10" />
              )}
            </div>
          )}
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
                <div className="px-3 py-1 bg-secondary rounded-full flex-shrink-0 ml-2">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider">{identifiedSpecies.rarity}</span>
                </div>
              </div>

              <div className="overflow-y-auto pr-2 custom-scrollbar">
                <div className="markdown-body space-y-4 text-sm leading-relaxed text-primary/80 pb-4">
                  <Markdown>
                    {identifiedSpecies.formattedText || `**Navn:** ${identifiedSpecies.name}  \n**Latinsk navn:** *${identifiedSpecies.scientificName || 'Ukjent'}*  \n**Familie:** ${(identifiedSpecies.family || 'UKJENT').toUpperCase()}  \n**Sjeldenhetsgrad:** ${(identifiedSpecies.rarity || 'common').toUpperCase()}  \n\n**HABITAT:**  \n${identifiedSpecies.habitat || 'Ukjent'}  \n\n**STATUS:**  \nI blomst  \n\n**FELTGUIDE:**  \n${wikiInfo?.extract || identifiedSpecies.description || 'Ingen informasjon tilgjengelig.'}`}
                  </Markdown>
                  
                  {wikiInfo?.sourceUrl && (
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

              <div className="mt-8 flex gap-3 flex-shrink-0">
                <button 
                  onClick={handleCollect}
                  disabled={saving}
                  className="flex-grow bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50"
                >
                  {saving ? 'Lagrer...' : 'Samle inn'}
                </button>
                <button 
                  onClick={() => setIsFound(false)}
                  className="w-14 h-14 bg-secondary text-primary flex items-center justify-center rounded-2xl active:scale-95 transition-transform flex-shrink-0"
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
