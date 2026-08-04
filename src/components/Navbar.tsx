import React, { useState, useEffect } from 'react';
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
  Bookmark
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onAiSearchSubmit: (e: React.FormEvent) => void;
  isAiSearching: boolean;
  profile: UserProfile;
  onOpenProfile: () => void;
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
        ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
        : 'bg-white border-zinc-200 text-zinc-900 shadow-xs'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onTabChange('all')}>
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-zinc-950 font-bold shadow-md shadow-amber-500/20">
                <Music className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-lg tracking-tight font-serif">CifraMaster</h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Pro
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  Cifras & Metrônomo
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-1.5 md:hidden">
              <button
                onClick={onOpenMetronome}
                className="p-2 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors font-medium text-xs flex items-center gap-1"
                title="Metrônomo"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenProfile}
                className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Perfil"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Import Cifra Club Link or Search Form */}
          <div className="flex-1 max-w-xl flex items-center gap-2">
            <form onSubmit={onAiSearchSubmit} className="flex-1">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3.5 text-amber-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar cifra (música/artista ou link)..."
                  className={`w-full pl-10 pr-24 py-2 rounded-xl text-sm font-medium border transition-all outline-none ${
                    profile.stageModeDark
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50'
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
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border shrink-0 ${
                profile.stageModeDark
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200'
              }`}
              title="Abrir o site do Cifra Club em uma nova aba"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
              <span>Cifra Club</span>
            </a>
          </div>

          {/* Action Buttons Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {/* Offline Status */}
            <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
              isOffline
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
            }`}>
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Modo Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Online (Sincronizado)</span>
                </>
              )}
            </div>

            {/* Metronome Button */}
            <button
              onClick={onOpenMetronome}
              className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-semibold text-xs transition-all flex items-center gap-1.5 border border-amber-500/20"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Metrônomo</span>
            </button>

            {/* Add Custom Chord Button */}
            <button
              onClick={onOpenImportModal}
              className={`p-2 rounded-xl border transition-colors ${
                profile.stageModeDark
                  ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'
              }`}
              title="Nova Cifra / Importar"
            >
              <PlusCircle className="w-4 h-4" />
            </button>

            {/* Stage Dark Mode Toggle */}
            <button
              onClick={onToggleStageMode}
              className={`p-2 rounded-xl border transition-colors ${
                profile.stageModeDark
                  ? 'border-zinc-800 text-amber-400 hover:bg-zinc-800'
                  : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'
              }`}
              title={profile.stageModeDark ? 'Modo Claro' : 'Modo Palco (Escuro)'}
            >
              {profile.stageModeDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Profile Button */}
            <button
              onClick={onOpenProfile}
              className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border transition-colors ${
                profile.stageModeDark
                  ? 'border-zinc-800 text-zinc-200 hover:bg-zinc-800'
                  : 'border-zinc-200 text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 font-bold flex items-center justify-center text-xs">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'M'}
              </div>
              <span className="text-xs font-semibold max-w-[100px] truncate">{profile.name}</span>
            </button>
          </div>

        </div>

        {/* Tab Filters Navigation */}
        <div className="flex items-center gap-1 mt-3 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onTabChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
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
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'favorites'
                ? 'bg-amber-500 text-zinc-950 shadow-xs'
                : profile.stageModeDark ? 'text-zinc-400 hover:bg-zinc-900' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Favoritas ({(profile.favorites || []).length})</span>
          </button>

          <button
            onClick={() => onTabChange('setlists')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'setlists'
                ? 'bg-amber-500 text-zinc-950 shadow-xs'
                : profile.stageModeDark ? 'text-zinc-400 hover:bg-zinc-900' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Repertórios ({(profile.setlists || []).length})</span>
          </button>

          <button
            onClick={() => onTabChange('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'bg-amber-500 text-zinc-950 shadow-xs'
                : profile.stageModeDark ? 'text-zinc-400 hover:bg-zinc-900' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Minhas Cifras ({(profile.customCreatedSongs || []).length})</span>
          </button>
        </div>

      </div>
    </header>
  );
};
