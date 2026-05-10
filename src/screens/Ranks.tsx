import { motion } from 'motion/react';
import { Icons, ScreenType } from '../constants';
import { getTitleForLevel, getIconNameForLevel } from '../lib/levels';

interface RanksProps {
  onBack: () => void;
  onNavigate: (screen: ScreenType) => void;
}

const LEADERBOARD = [
  { name: 'Kine', level: 14, found: 28, isSelf: true },
  { name: 'Morten', level: 12, found: 24, isSelf: false },
  { name: 'Stine', level: 11, found: 21, isSelf: false },
  { name: 'Harald', level: 9, found: 18, isSelf: false },
  { name: 'Ingrid', level: 8, found: 15, isSelf: false },
];

export default function Ranks({ onBack }: RanksProps) {
  return (
    <div className="min-h-screen relative p-0 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/f/f9/Convallaria_majalis_inflorescence_-_Keila.jpg" 
          alt="Lily of the valley background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/40" />
      </div>
      
      <div className="p-6 relative z-10">
        <header className="flex items-center gap-4 mb-12">
          <button 
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-white/40 backdrop-blur-xl flex items-center justify-center text-primary shadow-lg border border-white/60"
          >
            <Icons.ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="text-3xl font-bold font-display text-primary drop-shadow-md relative z-10">Toppliste</h1>
        </header>

        <div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-8 text-primary mb-12 relative overflow-hidden shadow-xl border border-white/60">
          <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center mb-4 border-2 border-white/60 shadow-sm">
                  <Icons.Ranks className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold font-display mb-1 drop-shadow-sm">Ukens Klatrer</h2>
              <p className="text-primary/80 text-sm font-medium mb-6 drop-shadow-sm">Du er i topp 15% denne uken!</p>
              <div className="px-6 py-2 bg-secondary/90 backdrop-blur-sm rounded-full shadow-md border border-white/40">
                <span className="text-primary font-bold text-xs uppercase tracking-widest drop-shadow-sm">+250 XP i dag</span>
              </div>
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/40 rounded-full -mr-20 -mt-20 blur-3xl z-0" />
        </div>

        <div className="space-y-3">
          {LEADERBOARD.map((user, idx) => (
            <motion.div 
              key={user.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-5 rounded-3xl flex items-center justify-between border backdrop-blur-xl shadow-lg ${user.isSelf ? 'bg-secondary/70 border-primary/20' : 'bg-white/40 border-white/60'}`}
            >
              <div className="flex items-center gap-4 relative z-10">
                  <span className="font-bold text-lg text-primary w-4 text-center drop-shadow-sm">{idx + 1}</span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-md ${idx < 3 ? 'bg-primary text-secondary' : 'bg-white text-primary'}`}>
                    {(() => {
                      const Icon = Icons[getIconNameForLevel(user.level)] as typeof Icons.Star;
                      return <Icon className="w-5 h-5" />;
                    })()}
                  </div>
                  <div>
                    <h4 className={`font-bold drop-shadow-sm text-primary`}>{user.name}</h4>
                    <p className={`text-[10px] font-bold uppercase tracking-widest drop-shadow-sm text-primary/80`}>{getTitleForLevel(user.level)} • Nv {user.level}</p>
                  </div>
              </div>
              <div className="text-right relative z-10">
                  <p className="text-lg font-bold text-primary drop-shadow-sm">{user.found}</p>
                  <p className="text-[10px] text-primary/80 font-bold uppercase tracking-widest drop-shadow-sm">Arter</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
