import { motion } from 'motion/react';
import { Icons } from '../../constants';
import { getTitleForLevel, getIconNameForLevel } from '../../lib/levels';

interface HeroStatsCardProps {
  progressData: {
    currentLevel: number;
    xpInCurrentLevel: number;
    xpNeededForNextLevel: number;
    progress: number;
  };
  uniqueCount: number;
}

export function HeroStatsCard({ progressData, uniqueCount }: HeroStatsCardProps) {
  return (
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
  );
}
