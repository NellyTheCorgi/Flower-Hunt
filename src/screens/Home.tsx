import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ScreenType } from '../constants';
import { useFirebase } from '../context/FirebaseContext';
import { db, OperationType } from '../lib/firebase';
import { handleFirestoreError } from '../lib/firebase-errors';
import { getProgressToNextLevel, calculateLevel, getEarnedTrophies } from '../lib/levels';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { HeroStatsCard } from '../components/home/HeroStatsCard';
import { RecentActivity } from '../components/home/RecentActivity';

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

        <HeroStatsCard progressData={progressData} uniqueCount={uniqueCount} />

        {/* Removed Redundant Navigation Grid */}

        <RecentActivity loading={loading} recentFindings={recentFindings} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
