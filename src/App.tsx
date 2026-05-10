import { useState } from 'react';
import { Icons, ScreenType } from './constants';
import Home from './screens/Home';
import Scan from './screens/Scan';
import Collection from './screens/Collection';
import Map from './screens/Map';
import Ranks from './screens/Ranks';
import Profile from './screens/Profile';
import Login from './screens/Login';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import BottomNav from './components/BottomNav';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { user, loading } = useFirebase();
  const [screen, setScreen] = useState<ScreenType>('home');

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <Home onNavigate={setScreen} />;
      case 'scan':
        return <Scan onBack={() => setScreen('home')} onNavigate={setScreen} />;
      case 'collection':
        return <Collection onBack={() => setScreen('home')} onNavigate={setScreen} />;
      case 'map':
        return <Map onBack={() => setScreen('home')} onNavigate={setScreen} />;
      case 'ranks':
        return <Ranks onBack={() => setScreen('home')} onNavigate={setScreen} />;
      case 'profile':
        return <Profile onBack={() => setScreen('home')} onNavigate={setScreen} />;
      default:
        return <Home onNavigate={setScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden pb-24">
      <div className="relative z-50">
        <AnimatePresence>
          {screen !== 'profile' && screen !== 'scan' && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setScreen('profile')}
              className="fixed top-6 right-6 w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-primary/10 flex items-center justify-center text-primary"
            >
              <Icons.User className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {renderScreen()}
      <BottomNav currentScreen={screen} onNavigate={setScreen} />
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
