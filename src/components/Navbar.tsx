import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import vilmarLogo from '../assets/images/vilmar_logo_1785980530881.jpg';
import { 
  Search, 
  Music, 
  Heart, 
  Wifi, 
  WifiOff, 
  Moon, 
  Sun, 
  User, 
  PlusCircle, 
  Clock, 
  Globe,
  ExternalLink,
  SlidersHorizontal,
  Bookmark,
  LogIn
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onAiSearchSubmit: (e: React.FormEvent) => void;
  isAiSearching: boolean;
  profile: UserProfile;
  onOpenProfile: () => void;
  onOpenLogin: () => void;
  currentUser: FirebaseUser | null;
  onOpenMetronome: () => void;
  onOpenImportModal: () => void;
  onToggleStageMode: () => void;
  activeTab: 'all' | 'favorites' | 'setlists' | 'custom';
  onTabChange: (tab: 'all' | 'favorites' | 'setlists' | 'custom') => void;
  isOffline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchTerm,
  onSearchChange,
  onAiSearchSubmit,
  isAiSearching,
  profile,
  onOpenProfile,
  onOpenLogin,
  currentUser,
  onOpenMetronome,
  onOpenImportModal,
  onToggleStageMode,
  activeTab,
  onTabChange,
  isOffline,
}) => {
  return (
    <header className={`sticky top-0 z-40 transition-colors duration-200 border-b ${
      profile.stageModeDark 
        ? 'bg-zinc-950/95 border-zinc-800 text-zinc-100 backdrop-blur-md' 
        : 'bg-white/95 border-zinc-200 text-zinc-900 shadow-xs backdrop-blur-md'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
        
        {/* Main Header Row */}
        <div className="flex items-center justify-between gap-3">
          
          {/* 1. Brand Logo & Name */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group shrink-0" 
            onClick={() => onTabChange('all')}
            title="Ir para a página inicial"
          >
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-amber-500 shadow-md shadow-amber-500/20 shrink-0 bg-zinc-900">
              <img 
                src={vilmarLogo} 
                alt="Vilmar Digital Cifras Logo" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight font-serif text-amber-500 leading-none">
                  Vilmar Digital
                </h1>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Cifras
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                Repertório & Metrônomo
              </p>
            </div>
          </div>

          {/* 2. Center Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-lg items-center gap-2 mx-2">
            <form onSubmit={onAiSearchSubmit} className="flex-1">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3.5 text-amber-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar cifra (música, artista ou colar link)..."
                  className={`w-full pl-10 pr-24 py-2 rounded-xl text-xs font-medium border transition-all outline-none ${
                    profile.stageModeDark
                      ? 'bg-zinc-900/90 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                  }`}
                />
                <button
                  type="submit"
                  disabled={isAiSearching || !searchTerm.trim() || isOffline}
                  className={`absolute right-1.5 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    isOffline
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                      : 'bg-amber-500 text-zinc-950 hover:bg-amber-400 active:scale-95 disabled:opacity-50'
                  }`}
                  title={isOffline ? 'Busca online indisponível offline' : 'Buscar ou importar cifra'}
                >
                  <Search className="w-3.5 h-3.5" />
                  {isAiSearching ? '...' : 'Buscar'}
                </button>
              </div>
            </form>

            <a
              href="https://www.cifraclub.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className={`px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all border shrink-0 ${
                profile.stageModeDark
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
              }`}
              title="Abrir Cifra Club"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden xl:inline">Cifra Club</span>
            </a>
          </div>

          {/* 3. Action Tools Group */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Nova Cifra */}
            <button
              onClick={onOpenImportModal}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 border active:scale-95 ${
                profile.stageModeDark
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200'
              }`}
              title="Criar ou Importar Cifra Nova"
            >
              <PlusCircle className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Nova Cifra</span>
            </button>

            {/* Login Google / User Auth */}
            <button
              onClick={onOpenLogin}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 border cursor-pointer active:scale-95 ${
                currentUser
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                  : 'bg-amber-500 text-zinc-950 border-amber-500 hover:bg-amber-400 shadow-xs'
              }`}
              title="Autenticação com o Google"
            >
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Google User" className="w-4 h-4 rounded-full border border-amber-500" referrerPolicy="no-referrer" />
              ) : (
                <LogIn className="w-4 h-4 shrink-0" />
              )}
              <span className="hidden sm:inline">
                {currentUser ? (currentUser.displayName?.split(' ')[0] || 'Conectado') : 'Entrar Google'}
              </span>
            </button>

            {/* Perfil */}
            <button
              onClick={onOpenProfile}
              className={`flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-colors active:scale-95 ${
                profile.stageModeDark
                  ? 'border-zinc-800 text-zinc-200 bg-zinc-900 hover:bg-zinc-800'
                  : 'border-zinc-200 text-zinc-800 bg-zinc-100 hover:bg-zinc-200'
              }`}
              title="Meu Perfil"
            >
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 font-bold flex items-center justify-center text-xs">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'V'}
              </div>
              <span className="text-xs font-semibold max-w-[80px] truncate hidden md:inline">{profile.name}</span>
            </button>

          </div>

        </div>

        {/* Search Bar for Mobile/Tablet */}
        <div className="mt-2.5 lg:hidden flex items-center gap-2">
          <form onSubmit={onAiSearchSubmit} className="flex-1">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 text-amber-500 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar música, artista ou colar link..."
                className={`w-full pl-10 pr-20 py-2 rounded-xl text-xs font-medium border transition-all outline-none ${
                  profile.stageModeDark
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-amber-500/50'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-amber-500'
                }`}
              />
              <button
                type="submit"
                disabled={isAiSearching || !searchTerm.trim() || isOffline}
                className={`absolute right-1 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                  isOffline
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                    : 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                }`}
              >
                {isAiSearching ? '...' : 'Buscar'}
              </button>
            </div>
          </form>

          <a
            href="https://www.cifraclub.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className={`px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all border shrink-0 ${
              profile.stageModeDark
                ? 'bg-zinc-900 text-zinc-300 border-zinc-800'
                : 'bg-zinc-100 text-zinc-700 border-zinc-200'
            }`}
            title="Abrir Cifra Club"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
          </a>
        </div>

        {/* Tab Filters Navigation Bar */}
        <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
          
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => onTabChange('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : profile.stageModeDark ? 'text-zinc-400 hover:bg-zinc-900' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Todas as Cifras</span>
            </button>

            <button
              onClick={() => onTabChange('favorites')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'favorites'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : profile.stageModeDark ? 'text-zinc-400 hover:bg-zinc-900' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current text-rose-500" />
              <span>Favoritas ({(profile.favorites || []).length})</span>
            </button>

            <button
              onClick={() => onTabChange('setlists')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'setlists'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : profile.stageModeDark ? 'text-zinc-400 hover:bg-zinc-900' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-blue-500" />
              <span>Repertórios ({(profile.setlists || []).length})</span>
            </button>

            <button
              onClick={() => onTabChange('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'custom'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : profile.stageModeDark ? 'text-zinc-400 hover:bg-zinc-900' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Minhas Cifras ({(profile.customCreatedSongs || []).length})</span>
            </button>
          </div>

          {/* Online/Offline Status Indicator */}
          <div className="hidden sm:flex items-center shrink-0">
            <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border ${
              isOffline
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
            }`}>
              {isOffline ? (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>Modo Offline</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online (Firebase Cloud)</span>
                </>
              )}
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
