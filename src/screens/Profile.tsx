import { motion } from 'motion/react';
import { Icons, ScreenType } from '../constants';
import { auth } from '../lib/firebase';
import { useFirebase } from '../context/FirebaseContext';
import { getProgressToNextLevel, getTitleForLevel, getIconNameForLevel, MILESTONES } from '../lib/levels';

interface ProfileProps {
  onBack: () => void;
  onNavigate: (screen: ScreenType) => void;
}

export default function Profile({ onBack, onNavigate }: ProfileProps) {
  const { profile } = useFirebase();
  const progressData = getProgressToNextLevel(profile?.stats?.xp || 0);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="flex items-center gap-4 mb-12">
        <button 
          onClick={onBack}
          className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm"
        >
          <Icons.ChevronRight className="w-6 h-6 rotate-180" />
        </button>
        <h1 className="text-3xl font-bold font-display text-primary">Min Profil</h1>
      </header>

      <div className="flex flex-col items-center mb-12">
        <div className="w-32 h-32 rounded-[2.5rem] bg-secondary p-1 border-4 border-white shadow-xl mb-6 relative overflow-hidden group">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover rounded-[2.2rem]" />
          ) : (
            <Icons.User className="w-full h-full text-primary/20 p-4" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
             <Icons.Settings className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-primary mb-1">{profile?.displayName}</h2>
        <p className="text-primary/60 font-bold uppercase tracking-widest text-xs mb-1">{getTitleForLevel(progressData.currentLevel)}</p>
        <p className="text-muted-foreground font-medium text-sm mb-6">{profile?.email}</p>
        
        <div className="w-full max-w-xs bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Nivå {progressData.currentLevel}</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{profile?.stats?.xp} TOTAL XP</span>
          </div>
          <div className="w-full h-2 bg-secondary/30 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressData.progress}%` }}
              className="h-full bg-primary"
            />
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-2 font-medium">
            {progressData.remainingXP} XP til nivå {progressData.currentLevel + 1}
          </p>
        </div>
      </div>

      <div className="mb-12">
        <h3 className="text-xl font-bold font-display text-primary mb-6">Troférom</h3>
        <div className="grid grid-cols-4 gap-4">
          {MILESTONES.map((milestone) => {
             const isUnlocked = profile?.unlocked_trophies?.includes(milestone);
             return (
               <div key={milestone} className="flex flex-col items-center gap-2">
                 <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl relative transition-all ${isUnlocked ? 'bg-secondary text-primary shadow-md' : 'bg-outline-variant/20 text-muted-foreground/30 grayscale'}`}>
                   {(() => {
                     const Icon = Icons[getIconNameForLevel(milestone)] as typeof Icons.Star;
                     return <Icon className="w-8 h-8" />;
                   })()}
                   <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${isUnlocked ? 'bg-primary text-white' : 'bg-outline-variant text-white'}`}>
                     {milestone}
                   </div>
                 </div>
                 <span className={`text-[9px] uppercase tracking-widest font-bold text-center ${isUnlocked ? 'text-primary' : 'text-muted-foreground/50'}`}>
                   {isUnlocked ? getTitleForLevel(milestone) : 'Låst'}
                 </span>
               </div>
             );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <button className="w-full bg-white p-6 rounded-3xl shadow-sm border border-outline-variant/30 flex items-center justify-between group">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                 <Icons.Settings className="w-5 h-5" />
              </div>
              <span className="font-bold text-primary">Innstillinger</span>
           </div>
           <Icons.ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </button>

        <button className="w-full bg-white p-6 rounded-3xl shadow-sm border border-outline-variant/30 flex items-center justify-between group">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                 <Icons.Info className="w-5 h-5" />
              </div>
              <span className="font-bold text-primary">Om appen</span>
           </div>
           <Icons.ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </button>

        <button 
          onClick={handleLogout}
          className="w-full bg-red-50 p-6 rounded-3xl shadow-sm border border-red-100 flex items-center justify-between group mt-12"
        >
           <div className="flex items-center gap-4 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                 <Icons.LogOut className="w-5 h-5" />
              </div>
              <span className="font-bold">Logg ut</span>
           </div>
        </button>
      </div>
    </div>
  );
}
