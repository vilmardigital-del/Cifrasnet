import React, { useState, useEffect } from 'react';
import { Song, UserProfile } from './types';
import { 
  loadUserProfile, 
  saveUserProfile, 
  loadCachedSongs, 
  saveCachedSong, 
  toggleFavoriteSong, 
  addToHistory, 
  saveCustomSong,
  toggleOfflineSong,
  deleteSong,
  getOfflineSongIds
} from './utils/storage';
import { subscribeToCloudSongs, subscribeToCloudProfile } from './lib/firebaseService';
import { Navbar } from './components/Navbar';
import { SongCard } from './components/SongCard';
import { ChordViewer } from './components/ChordViewer';
import { MetronomeWidget } from './components/MetronomeWidget';
import { ProfileModal } from './components/ProfileModal';
import { ImportSongModal } from './components/ImportSongModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { Music, Sparkles, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(loadUserProfile());
  const [songs, setSongs] = useState<Song[]>(loadCachedSongs());
  const [offlineIds, setOfflineIds] = useState<string[]>(getOfflineSongIds());
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Tab State: 'all' | 'favorites' | 'setlists' | 'custom'
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'setlists' | 'custom'>('all');

  // Modals
  const [showMetronome, setShowMetronome] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Offline status
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to Firebase Cloud real-time updates for songs & profile
    const unsubscribeSongs = subscribeToCloudSongs((updatedSongs) => {
      setSongs(updatedSongs);
      setOfflineIds(getOfflineSongIds());
    });

    const unsubscribeProfile = subscribeToCloudProfile((updatedProfile) => {
      setProfile(updatedProfile);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeSongs();
      unsubscribeProfile();
    };
  }, []);

  // Filter songs based on search and active tab
  const filteredSongs = songs.filter((song) => {
    if (!song) return false;
    const matchesSearch =
      !searchTerm ||
      (song.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (song.artist || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (song.genre || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'favorites') {
      return (profile?.favorites || []).includes(song.id);
    }
    if (activeTab === 'custom') {
      return (profile?.customCreatedSongs || []).some((s) => s.id === song.id);
    }
    return true;
  });

  // Toggle favorite
  const handleToggleFavorite = (songId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updatedProfile = toggleFavoriteSong(songId);
    setProfile(updatedProfile);
  };

  // Toggle offline status
  const handleToggleOffline = (song: Song, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updatedOfflineIds = toggleOfflineSong(song);
    setOfflineIds(updatedOfflineIds);
    setSongs(loadCachedSongs());
  };

  // Delete song from library
  const handleDeleteSong = (song: Song, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSongToDelete(song);
  };

  const confirmDeleteSong = () => {
    if (songToDelete) {
      deleteSong(songToDelete.id);
      const updatedSongs = loadCachedSongs();
      setSongs(updatedSongs);
      setOfflineIds(getOfflineSongIds());
      setProfile(loadUserProfile());
      if (selectedSong && selectedSong.id === songToDelete.id) {
        setSelectedSong(null);
      }
      setSongToDelete(null);
    }
  };

  // Select a song
  const handleSelectSong = (song: Song) => {
    saveCachedSong(song);
    const updatedProfile = addToHistory(song.id);
    setProfile(updatedProfile);
    setSelectedSong(song);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
  };

  // Toggle stage mode
  const handleToggleStageMode = () => {
    const updated = { ...profile, stageModeDark: !profile.stageModeDark };
    saveUserProfile(updated);
    setProfile(updated);
  };

  // Submit chord search request directly to Cifra Club
  const handleAiSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim() || isOffline) return;

    setIsAiSearching(true);
    setAiError(null);

    try {
      const res = await fetch('/api/search-chords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTerm }),
      });

      const data = await res.json();

      if (data.success && data.song) {
        const generatedSong: Song = {
          ...data.song,
          savedOfflineAt: new Date().toISOString(),
        };

        // Save song permanently (Saves to offline storage and syncs to Firebase Cloud)
        const { profile: updatedProfile, songs: updatedSongs } = saveCustomSong(generatedSong);
        setProfile(updatedProfile);
        setSongs(updatedSongs);
        handleSelectSong(generatedSong);
        setSearchTerm('');
      } else {
        setAiError(data.error || 'Não foi possível encontrar essa cifra no Cifra Club. Verifique o nome ou cole o link.');
      }
    } catch (err: any) {
      setAiError('Erro de conexão ao buscar no Cifra Club. Verifique sua rede.');
    } finally {
      setIsAiSearching(false);
    }
  };

  // Save imported / custom song
  const handleSaveCustomSong = (song: Song) => {
    const { profile: updatedProfile, songs: updatedSongs } = saveCustomSong(song);
    setProfile(updatedProfile);
    setSongs(updatedSongs);
    handleSelectSong(song);
  };

  // If a song is selected, display full performance ChordViewer
  if (selectedSong) {
    return (
      <ChordViewer
        song={selectedSong}
        isFavorite={(profile.favorites || []).includes(selectedSong.id)}
        isOfflineSaved={offlineIds.includes(selectedSong.id)}
        profile={profile}
        onToggleFavorite={handleToggleFavorite}
        onToggleOffline={handleToggleOffline}
        onDeleteSong={handleDeleteSong}
        onBack={() => {
          setSelectedSong(null);
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
        }}
        onUpdateProfile={setProfile}
        stageModeDark={profile.stageModeDark}
        onToggleStageMode={handleToggleStageMode}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      profile.stageModeDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50/50 text-zinc-900'
    }`}>
      
      {/* Navbar */}
      <Navbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAiSearchSubmit={handleAiSearchSubmit}
        isAiSearching={isAiSearching}
        profile={profile}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenMetronome={() => setShowMetronome(true)}
        onOpenImportModal={() => setShowImportModal(true)}
        onToggleStageMode={handleToggleStageMode}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOffline={isOffline}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Offline Banner Notification */}
        {isOffline && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>Você está no Modo Offline. Todas as suas cifras salvas e favoritas continuam disponíveis sem internet!</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 uppercase font-black tracking-wider text-[10px]">Ativo</span>
          </div>
        )}

        {/* AI Error Alert */}
        {aiError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </div>
            <button onClick={() => setAiError(null)} className="underline text-[11px]">Fechar</button>
          </div>
        )}

        {/* Section Title & Info */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              {activeTab === 'all' && 'Biblioteca de Cifras'}
              {activeTab === 'favorites' && 'Suas Músicas Favoritas'}
              {activeTab === 'setlists' && 'Seus Repertórios de Shows'}
              {activeTab === 'custom' && 'Cifras Personalizadas'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {filteredSongs.length} {filteredSongs.length === 1 ? 'música encontrada' : 'músicas encontradas'}
            </p>
          </div>
        </div>

        {/* Grid of Songs */}
        {filteredSongs.length === 0 ? (
          <div className={`text-center py-16 px-4 rounded-3xl border border-dashed ${
            profile.stageModeDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-300 bg-white'
          }`}>
            <Music className="w-12 h-12 text-amber-500/50 mx-auto mb-3" />
            <h3 className="text-base font-bold text-zinc-600 dark:text-zinc-300">
              Nenhuma cifra encontrada
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              {searchTerm 
                ? 'Tente buscar por outro artista/música ou use o botão "IA Cifra" para gerar a cifra desejada.'
                : 'Sua lista está vazia. Adicione músicas aos seus favoritos ou crie uma nova cifra.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSongs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                isFavorite={(profile.favorites || []).includes(song.id)}
                isOfflineSaved={offlineIds.includes(song.id)}
                onSelect={handleSelectSong}
                onToggleFavorite={handleToggleFavorite}
                onToggleOffline={handleToggleOffline}
                onDeleteSong={handleDeleteSong}
                stageModeDark={profile.stageModeDark}
              />
            ))}
          </div>
        )}

      </main>

      {/* Global Modals */}
      {showMetronome && (
        <MetronomeWidget
          onClose={() => setShowMetronome(false)}
          stageModeDark={profile.stageModeDark}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          profile={profile}
          allSongs={songs}
          onUpdateProfile={setProfile}
          onToggleFavorite={handleToggleFavorite}
          onSelectSong={handleSelectSong}
          onDeleteSong={handleDeleteSong}
          onClose={() => setShowProfileModal(false)}
          stageModeDark={profile.stageModeDark}
        />
      )}

      {showImportModal && (
        <ImportSongModal
          onSaveSong={handleSaveCustomSong}
          onClose={() => setShowImportModal(false)}
          stageModeDark={profile.stageModeDark}
        />
      )}

      {songToDelete && (
        <DeleteConfirmModal
          title="Apagar Cifra"
          itemTitle={songToDelete.title}
          description="Tem certeza que deseja apagar esta cifra? Ela será removida das suas listas e do armazenamento offline."
          onConfirm={confirmDeleteSong}
          onCancel={() => setSongToDelete(null)}
          stageModeDark={profile.stageModeDark}
        />
      )}

    </div>
  );
}
