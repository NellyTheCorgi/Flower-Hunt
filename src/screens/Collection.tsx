import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { Icons, ScreenType } from '../constants';
import { db, OperationType } from '../lib/firebase';
import { handleFirestoreError } from '../lib/firebase-errors';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useFirebase } from '../context/FirebaseContext';
import { NORWEGIAN_FLOWERS } from '../data/flowers';

interface CollectionProps {
  onBack: () => void;
  onNavigate: (screen: ScreenType) => void;
}

export default function Collection({ onBack, onNavigate }: CollectionProps) {
  const { user } = useFirebase();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [wikiInfo, setWikiInfo] = useState<any | null>(null);

  useEffect(() => {
    if (selectedItem) {
      // Fetch Wiki info
      import('../services/wikipediaService').then(({ fetchFlowerInfo }) => {
        const speciesInfo = NORWEGIAN_FLOWERS.find(f => f.id === selectedItem.speciesId);
        const nameToSearch = speciesInfo?.scientificName && speciesInfo.scientificName !== 'Ukjent' 
          ? speciesInfo.scientificName 
          : (speciesInfo?.name || selectedItem.speciesName);
          
        fetchFlowerInfo(nameToSearch).then(info => {
          setWikiInfo(info);
        }).catch(err => console.error("Could not fetch wiki info", err));
      });

      // Migration: Generate and save formatted text if missing
      if (!selectedItem.formattedText) {
        import('../services/geminiService').then(({ generateFlowerText }) => {
          const speciesName = selectedItem.speciesName;
          generateFlowerText(speciesName).then(text => {
            if (text) {
              // Update local state so it appears immediately
              setSelectedItem((prev: any) => ({ ...prev, formattedText: text }));
              // Update Firestore
              import('firebase/firestore').then(({ doc, updateDoc }) => {
                const docRef = doc(db, 'collections', selectedItem.id);
                updateDoc(docRef, { formattedText: text }).catch(err => {
                  console.error("Feil ved oppdatering av dokument:", err);
                });
              });
            }
          });
        });
      }
    } else {
      setWikiInfo(null);
    }
  }, [selectedItem?.id]); // Note: changed dependency to ID only to avoid infinite loops when we update selectedItem

  useEffect(() => {
    const fetchCollection = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'collections'), 
          where('userId', '==', user.uid),
          orderBy('collectedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Deduplicate locally: Keep only the most recent discovery per species name
        // This is the most bulletproof way to prevent showing "Blåveis" twice
        const uniqueItemsMap = new Map();
        docs.forEach((item: any) => {
          // Create a stable key from the name (preferred) or ID
          const nameKey = (item.speciesName || '').toLowerCase().trim();
          const idKey = (item.speciesId || item.id || 'unknown').toLowerCase();
          
          const finalKey = nameKey || idKey;
          
          if (!uniqueItemsMap.has(finalKey)) {
            uniqueItemsMap.set(finalKey, item);
          }
        });
        
        setItems(Array.from(uniqueItemsMap.values()));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'collections');
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [user]);

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm active:scale-90 transition-transform"
        >
          <Icons.ChevronRight className="w-6 h-6 rotate-180" />
        </button>
        <h1 className="text-3xl font-bold font-display text-primary">Min Samling</h1>
      </header>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-outline-variant/50">
          <Icons.Flower className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground font-medium">Du har ikke samlet noen blomster ennå.</p>
          <button 
            onClick={() => onNavigate('scan')}
            className="mt-6 text-primary font-bold text-sm underline"
          >
            Start din første skanning
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item, idx) => {
            const species = NORWEGIAN_FLOWERS.find(f => f.id === item.speciesId);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedItem(item)}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-outline-variant/30 active:scale-95 transition-transform"
              >
                <div className="aspect-square relative">
                  <img src={item.imageUrl} alt={item.speciesName} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-full">
                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">{species?.rarity || 'common'}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-primary truncate">{item.speciesName}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                    {new Date(item.collectedAt?.toDate()).toLocaleDateString('no-NO')}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {(() => {
                const speciesInfo = NORWEGIAN_FLOWERS.find(f => f.id === selectedItem?.speciesId);
                const speciesName = selectedItem.speciesName || speciesInfo?.name || 'Ukjent';
                const scientificName = selectedItem.scientificName || speciesInfo?.scientificName || 'Ukjent';
                const family = selectedItem.family || speciesInfo?.family || '';
                const rarity = selectedItem.rarity || speciesInfo?.rarity || 'common';
                const description = selectedItem.description || speciesInfo?.description || "Vakkert bevart i din digitale samling.";
                const habitat = selectedItem.habitat || speciesInfo?.habitat || 'Ukjent';
                const wikiUrl = selectedItem.wikiUrl || wikiInfo?.sourceUrl;
                
                return (
                  <>
                    <div className="flex justify-between items-start mb-6 shrink-0">
                      <div>
                        <h2 className="text-3xl font-bold text-primary mb-1">{speciesName}</h2>
                        {scientificName && scientificName !== 'Ukjent' && (
                          <p className="text-sm text-muted-foreground italic font-medium">{scientificName}</p>
                        )}
                        {family && (
                          <p className="text-[10px] text-primary/60 font-bold uppercase tracking-widest mt-1">
                            {family}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="px-3 py-1 bg-secondary rounded-full">
                          <span className="text-[11px] font-bold text-primary uppercase tracking-wider">{rarity}</span>
                        </div>
                        <button onClick={() => setSelectedItem(null)} className="w-10 h-10 shrink-0 rounded-full bg-secondary flex items-center justify-center text-primary mt-1">
                           <Icons.ChevronRight className="w-6 h-6 rotate-90" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="overflow-y-auto pr-2 custom-scrollbar max-h-[60vh]">
                      <div className="aspect-[4/3] rounded-3xl overflow-hidden mb-6 border border-outline-variant/30 shadow-inner shrink-0 relative">
                         <img src={selectedItem.imageUrl} alt={speciesName} className="w-full h-full object-cover" />
                      </div>

                      <div className="markdown-body space-y-4 text-sm leading-relaxed text-primary/80 pb-4">
                        <Markdown>
                          {selectedItem.formattedText || `**Navn:** ${speciesName}  \n**Latinsk navn:** *${scientificName}*  \n**Familie:** ${family.toUpperCase() || 'UKJENT'}  \n**Sjeldenhetsgrad:** ${rarity.toUpperCase()}  \n\n**HABITAT:**  \n${habitat}  \n\n**STATUS:**  \nI blomst  \n\n**FELTGUIDE:**  \n${wikiInfo?.extract || description}`}
                        </Markdown>
                        
                        {wikiUrl && (
                          <a 
                            href={wikiUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline mt-2"
                          >
                            Les mer på Wikipedia <Icons.ChevronRight className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}

              <button 
                onClick={() => setSelectedItem(null)}
                className="w-full mt-4 bg-secondary text-primary font-bold py-4 rounded-2xl shrink-0"
              >
                Lukk
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
