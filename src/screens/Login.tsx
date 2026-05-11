import { useState } from 'react';
import { motion } from 'motion/react';
import { Icons, FLOWER_IMAGES } from '../constants';
import {
  loginWithGoogle,
  loginWithFacebook,
  loginWithApple,
  signUpWithEmail,
  loginWithEmail,
  resendVerificationEmail,
  logout
} from '../lib/firebase';
import { useFirebase } from '../context/FirebaseContext';

export default function Login() {
  const { user } = useFirebase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'En feil oppstod med Google-innlogging.');
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await loginWithFacebook();
    } catch (err: any) {
      setError(err.message || 'En feil oppstod med Facebook-innlogging.');
    }
  };

  const handleAppleLogin = async () => {
    try {
      await loginWithApple();
    } catch (err: any) {
      setError(err.message || 'En feil oppstod med Apple-innlogging.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setMessage('Konto opprettet! Vennligst sjekk e-posten din for bekreftelseslenke.');
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'En feil oppstod med e-post-innlogging.');
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      setMessage('Bekreftelses-e-post er sendt på nytt.');
    } catch (err: any) {
      setError(err.message || 'Kunne ikke sende bekreftelses-e-post.');
    }
  };

  const handleReloadUser = async () => {
    try {
      if (user) {
        await user.reload();
        // Since reload() mutates the user object but might not trigger a state update in the context,
        // we might just let onAuthStateChanged or the fact that they re-login handle it.
        // Or we could force a re-render. Let's force a reload by signing out and telling them to sign in, or just refresh the page.
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || 'Kunne ikke oppdatere brukerstatus.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setMessage('');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Kunne ikke logge ut.');
    }
  };

  if (user && !user.emailVerified) {
    return (
      <div className="h-screen w-full relative overflow-hidden flex flex-col items-center justify-center p-8 bg-black">
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
          className="relative z-10 w-full max-w-md flex flex-col items-center text-center text-white bg-black/40 p-8 rounded-3xl backdrop-blur-md border border-white/10"
        >
          <Icons.Mail className="w-16 h-16 mb-4 text-primary" />
          <h2 className="text-3xl font-bold mb-4">Bekreft e-post</h2>
          <p className="text-white/80 mb-8">
            Vi har sendt en bekreftelseslenke til <br/>
            <strong className="text-white">{user.email}</strong>.
            <br/>Vennligst bekreft e-postadressen din for å fortsette.
          </p>

          {message && <p className="text-green-400 mb-4 text-sm">{message}</p>}
          {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

          <button
            onClick={handleReloadUser}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl mb-4 transition-all hover:bg-primary/90"
          >
            Jeg har bekreftet
          </button>

          <button
            onClick={handleResendVerification}
            className="w-full bg-white/10 text-white font-bold py-4 rounded-xl mb-4 transition-all hover:bg-white/20"
          >
            Send lenke på nytt
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-transparent border border-white/20 text-white/60 font-bold py-4 rounded-xl transition-all hover:bg-white/10"
          >
            Logg ut
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center p-8 bg-black overflow-y-auto">
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
        <p className="text-white/60 mb-8 text-lg font-medium leading-relaxed">
          Oppdag og samle den vakre norske floraen ved hjelp av moderne AI-teknologi.
        </p>

        <div className="w-full flex flex-col gap-3 mb-8">
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            <span>Fortsett med Google</span>
          </button>

          <button
            onClick={handleFacebookLogin}
            className="w-full bg-[#1877F2] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
          >
            <span className="font-serif text-xl font-bold">f</span>
            <span>Fortsett med Facebook</span>
          </button>

          <button
            onClick={handleAppleLogin}
            className="w-full bg-black border border-white/20 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
          >
            <span className="text-xl"></span>
            <span>Fortsett med Apple</span>
          </button>
        </div>

        <div className="w-full flex items-center gap-4 mb-8">
          <div className="h-px bg-white/20 flex-1" />
          <span className="text-white/40 text-sm">eller med e-post</span>
          <div className="h-px bg-white/20 flex-1" />
        </div>

        <form onSubmit={handleEmailAuth} className="w-full flex flex-col gap-4">
          <input
            type="email"
            placeholder="E-postadresse"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 px-4 py-4 rounded-xl outline-none focus:border-primary transition-colors"
            required
          />
          <input
            type="password"
            placeholder="Passord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 px-4 py-4 rounded-xl outline-none focus:border-primary transition-colors"
            required
            minLength={6}
          />

          {error && <p className="text-red-400 text-sm text-left">{error}</p>}
          {message && <p className="text-green-400 text-sm text-left">{message}</p>}

          <button
            type="submit"
            className="w-full bg-primary text-white font-bold py-4 rounded-xl transition-all hover:bg-primary/90 mt-2"
          >
            {isSignUp ? 'Opprett konto' : 'Logg inn'}
          </button>
        </form>

        <button 
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
            setMessage('');
          }}
          className="mt-6 text-white/60 text-sm hover:text-white transition-colors"
        >
          {isSignUp ? 'Har du allerede en konto? Logg inn' : 'Ny her? Opprett en konto'}
        </button>

      </motion.div>

      {/* Decorative patterns */}
      <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
    </div>
  );
}
