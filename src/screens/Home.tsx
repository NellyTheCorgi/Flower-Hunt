import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Icons, ScreenType } from '../constants';
import { useFirebase } from '../context/FirebaseContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { getProgressToNextLevel, calculateLevel, getEarnedTrophies, getTitleForLevel, getIconNameForLevel } from '../lib/levels';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface HomeProps {
  onNavigate: (screen: ScreenType) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const { profile, user } = useFirebase();
  const [recentFindings, setRecentFindings] = useState<any[]>([]);
  const [uniqueCount, setUniqueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        // Fetch recent unique findings
        const qRecent = query(
          collection(db, 'collections'),
          where('userId', '==', user.uid),
          orderBy('collectedAt', 'desc'),
          limit(20)
        );
        const recentSnapshot = await getDocs(qRecent);
        const uniqueRecent: any[] = [];
        const seenSpecies = new Set();
        
        recentSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const speciesLower = data.speciesName?.toLowerCase();
          if (speciesLower && !seenSpecies.has(speciesLower)) {
            uniqueRecent.push({ id: doc.id, ...data });
            seenSpecies.add(speciesLower);
          }
        });
        setRecentFindings(uniqueRecent.slice(0, 3));

        // Fetch all findings to count unique species
        // Simple approach: Fetch all and count unique speciesNames
        const qAll = query(
          collection(db, 'collections'),
          where('userId', '==', user.uid)
        );
        const allSnapshot = await getDocs(qAll);
        const speciesSet = new Set();
        allSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.speciesName) {
            speciesSet.add(data.speciesName.toLowerCase());
          }
        });
        setUniqueCount(speciesSet.size);
        
        // Data Migration/Sync: If user has findings but no XP, or if XP is out of sync
        // awarding 25 XP per unique species
        const expectedXP = speciesSet.size * 25;
        if (profile?.stats && (profile.stats.xp === undefined || profile.stats.xp < expectedXP)) {
          const userRef = doc(db, 'users', user.uid);
          const newLevel = calculateLevel(expectedXP);
          await updateDoc(userRef, {
            'stats.xp': expectedXP,
            'stats.level': newLevel,
            unlocked_trophies: getEarnedTrophies(newLevel),
            updatedAt: serverTimestamp()
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'collections');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const progressData = getProgressToNextLevel(profile?.stats?.xp || 0);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=2000&q=80" 
          alt="Sunflower background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]" />
      </div>

      <div className="relative z-10 p-6 pb-24 space-y-8">
        <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold font-display text-primary">Flower Hunt</h1>
          <p className="text-muted-foreground text-sm font-medium">Velkommen tilbake, {profile?.displayName?.split(' ')[0]}</p>
        </div>
      </motion.header>

      {/* Hero Stats Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-primary/40 backdrop-blur-xl border border-white/20 p-6 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group"
      >
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
            <div className="px-3 py-1 bg-white/20 rounded-full">
              <span className="text-xs font-bold uppercase tracking-wider">Level {progressData.currentLevel}</span>
            </div>
            <div className="px-3 py-1 bg-white/20 rounded-full flex items-center gap-1.5">
              {(() => {
                const Icon = Icons[getIconNameForLevel(progressData.currentLevel)] as typeof Icons.Star;
                return <Icon className="w-3 h-3 text-secondary" />;
              })()}
              <span className="text-xs font-bold uppercase tracking-wider">{getTitleForLevel(progressData.currentLevel)}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Unike arter funnet</p>
                <p className="text-4xl font-bold font-display">{uniqueCount}</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">
                  {progressData.xpInCurrentLevel} / {progressData.xpNeededForNextLevel} XP
                </p>
                <div className="w-28 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-secondary transition-all duration-1000 ease-out" 
                    style={{ width: `${progressData.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
      </motion.div>

      {/* Removed Redundant Navigation Grid */}

      {/* Recent Activity Mini-List */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-primary font-display">Siste oppdagelser</h3>
          <button onClick={() => onNavigate('collection')} className="text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors">Se alle</button>
        </div>
        <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-4 shadow-sm border border-outline-variant/30">
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recentFindings.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Begynn å skanne for å se aktivitet!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentFindings.map((item) => (
                <div key={item.id} className="flex items-center gap-4 group">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm border border-outline-variant/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                    <img src={item.imageUrl} alt={item.speciesName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-primary text-sm truncate">{item.speciesName}</h4>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      {item.collectedAt?.toDate && new Date(item.collectedAt.toDate()).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <button 
                    onClick={() => onNavigate('collection')}
                    className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icons.ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
