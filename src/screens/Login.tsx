import { motion } from 'motion/react';
import { Icons, FLOWER_IMAGES } from '../constants';
import { loginWithGoogle } from '../lib/firebase';

export default function Login() {
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-screen w-full relative overflow-hidden flex flex-col items-center justify-center p-8 bg-black">
      {/* Background with overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={FLOWER_IMAGES.sunflowerView} 
          alt="Flower background" 
          className="w-full h-full object-cover opacity-60 scale-110 blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md flex flex-col items-center text-center text-white"
      >
        <div className="w-24 h-24 rounded-[2rem] bg-primary flex items-center justify-center mb-8 shadow-2xl shadow-primary/40 group overflow-hidden relative">
           <motion.div
             animate={{ rotate: 360 }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             className="absolute inset-0 opacity-20 bg-gradient-to-tr from-white to-transparent"
           />
           <Icons.Flower className="w-12 h-12 text-white relative z-10" />
        </div>

        <h1 className="text-5xl font-bold font-display mb-4 tracking-tight">Flower Hunt</h1>
        <p className="text-white/60 mb-12 text-lg font-medium leading-relaxed">
          Oppdag og samle den vakre norske floraen ved hjelp av moderne AI-teknologi.
        </p>

        <button 
          onClick={handleLogin}
          className="w-full bg-white text-black font-bold py-5 rounded-2xl flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          <span>Logg inn med Google</span>
        </button>

        <p className="mt-8 text-white/40 text-[11px] uppercase tracking-[0.2em] font-bold">
          Start ditt eventyr i dag
        </p>
      </motion.div>

      {/* Decorative patterns */}
      <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
    </div>
  );
}
