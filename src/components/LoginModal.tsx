import React, { useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import vilmarLogo from '../assets/images/vilmar_logo_1785980530881.jpg';
import { X, LogIn, LogOut, CheckCircle2, Music, Sparkles, Shield, User as UserIcon, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageModeDark?: boolean;
  onUserAuthenticated?: (user: User | null) => void;
}

export function LoginModal({ isOpen, onClose, stageModeDark = false, onUserAuthenticated }: LoginModalProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (onUserAuthenticated) {
        onUserAuthenticated(user);
      }
    });
    return () => unsubscribe();
  }, [onUserAuthenticated]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        if (onUserAuthenticated) {
          onUserAuthenticated(result.user);
        }
        onClose();
      }
    } catch (err: any) {
      console.error('Erro na autenticação do Google:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('O login foi cancelado antes de ser concluído.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('O pop-up de login foi bloqueado pelo seu navegador. Por favor, permita pop-ups.');
      } else {
        setError('Não foi possível conectar com o Google. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setCurrentUser(null);
      if (onUserAuthenticated) {
        onUserAuthenticated(null);
      }
    } catch (err) {
      console.error('Erro ao sair:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={`relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-all duration-300 ${
          stageModeDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Top Header Background Glow */}
        <div className="h-32 bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-transparent relative flex items-center justify-center overflow-hidden">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl" />
          
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
              stageModeDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'
            }`}
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Circular App Logo / Avatar */}
        <div className="relative -mt-16 flex justify-center">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 shadow-xl shadow-amber-500/30">
              <img
                src={currentUser?.photoURL || vilmarLogo}
                alt="Vilmar Digital Cifras Logo"
                className="w-full h-full object-cover rounded-full bg-zinc-900 border-2 border-zinc-950"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="absolute bottom-1 right-1 p-1.5 rounded-full bg-amber-500 text-zinc-950 font-bold border-2 border-zinc-900 shadow-md">
              <Music className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* App Title and Subtitle */}
        <div className="px-6 pt-4 pb-6 text-center">
          <h2 className="text-2xl font-black tracking-tight font-serif text-amber-500">
            Vilmar Digital Cifras
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Sua biblioteca profissional de cifras, letras e repertórios para músicos
          </p>

          {/* User Status or Login Form */}
          {currentUser ? (
            <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || 'Usuário'} 
                    className="w-10 h-10 rounded-full border border-amber-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm">{currentUser.displayName || 'Usuário Autenticado'}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block truncate">{currentUser.email}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between">
                <span className="text-[11px] text-amber-500 font-semibold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Conectado com o Google
                </span>
                <button
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              
              {/* Features checklist */}
              <div className="grid grid-cols-1 gap-2 text-left bg-zinc-100 dark:bg-zinc-800/50 p-3.5 rounded-2xl text-xs">
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Sincronize cifras e repertórios no Google Cloud</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Acesse suas músicas offline em qualquer show</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Transposição rápida de tom e rolagem automática</span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2 font-medium text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-zinc-50 text-zinc-900 font-bold border border-zinc-300 shadow-md flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="text-sm">Entrar com o Google</span>
                  </>
                )}
              </button>

              {/* Secondary Option: Guest / Visitante */}
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-500 hover:text-amber-500 transition-colors"
              >
                Continuar como Convidado
              </button>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-100/80 dark:bg-zinc-950/60 text-center border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] text-zinc-400">
            Vilmar Digital Cifras • Autenticação Segura Firebase & Google
          </p>
        </div>

      </div>
    </div>
  );
}
