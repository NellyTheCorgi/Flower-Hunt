import { motion } from 'motion/react';
import { Icons, ScreenType } from '../constants';

interface BottomNavProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
}

export default function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const tabs: { type: ScreenType; icon: keyof typeof Icons; label: string }[] = [
    { type: 'home', icon: 'Home', label: 'Hjem' },
    { type: 'map', icon: 'Map', label: 'Kart' },
    { type: 'scan', icon: 'Camera', label: 'Skann' },
    { type: 'collection', icon: 'Collection', label: 'Samling' },
    { type: 'ranks', icon: 'Ranks', label: 'Toppliste' },
  ];


  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 bg-gradient-to-t from-background via-background to-transparent pointer-events-none">
      <div className="max-w-md mx-auto bg-white/90 backdrop-blur-xl border border-primary/10 rounded-[2.5rem] shadow-2xl h-16 flex items-center justify-around pointer-events-auto px-2">
        {tabs.map((tab) => {
          const isActive = currentScreen === tab.type;
          const Icon = Icons[tab.icon];

          if (tab.type === 'scan') {
            return (
              <div key={tab.type} className="relative -top-6">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onNavigate(tab.type)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                    isActive ? 'bg-primary text-white' : 'bg-primary text-white'
                  }`}
                >
                  <Icon className="w-7 h-7" />
                </motion.button>
              </div>
            );
          }

          return (
            <button
              key={tab.type}
              onClick={() => onNavigate(tab.type)}
              className="flex flex-col items-center justify-center flex-1 py-1 group relative"
            >
              <div className={`transition-all duration-300 ${
                isActive ? 'text-primary scale-110' : 'text-primary'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-bold mt-1 transition-all duration-300 ${
                isActive ? 'text-primary opacity-100' : 'text-primary/70'
              }`}>
                {tab.label}
              </span>
              
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -top-2 w-1 h-1 bg-primary rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
