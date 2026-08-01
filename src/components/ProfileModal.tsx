import React, { useState } from 'react';
import { 
  X, 
  User, 
  Heart, 
  Bookmark, 
  Plus, 
  Music, 
  Trash2, 
  ListMusic, 
  Sliders, 
  Wifi, 
  Check, 
  FolderPlus
} from 'lucide-react';
import { UserProfile, Song, Instrument } from '../types';
import { createSetlist, addSongToSetlist, saveUserProfile, deleteSetlist } from '../utils/storage';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface ProfileModalProps {
  profile: UserProfile;
  allSongs: Song[];
  onUpdateProfile: (updated: UserProfile) => void;
  onToggleFavorite: (songId: string, e?: React.MouseEvent) => void;
  onSelectSong: (song: Song) => void;
  onDeleteSong: (song: Song) => void;
  onClose: () => void;
  stageModeDark: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  allSongs,
  onUpdateProfile,
  onToggleFavorite,
  onSelectSong,
  onDeleteSong,
  onClose,
  stageModeDark,
}) => {
  const [activeTab, setActiveTab] = useState<'favorites' | 'setlists' | 'custom' | 'settings'>('favorites');
  const [userName, setUserName] = useState(profile.name);
  const [instrument, setInstrument] = useState<Instrument>(profile.preferredInstrument);

  // New Setlist Form
  const [showNewSetlistForm, setShowNewSetlistForm] = useState(false);
  const [newSetlistName, setNewSetlistName] = useState('');
  const [newSetlistDesc, setNewSetlistDesc] = useState('');
  const [setlistToDelete, setSetlistToDelete] = useState<{ id: string; name: string } | null>(null);

  const favoriteSongs = allSongs.filter((s) => profile.favorites.includes(s.id));

  const handleSaveSettings = () => {
    const updated = {
      ...profile,
      name: userName || 'Músico CifraMaster',
      preferredInstrument: instrument,
    };
    saveUserProfile(updated);
    onUpdateProfile(updated);
  };

  const handleCreateSetlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetlistName.trim()) return;
    const updated = createSetlist(newSetlistName.trim(), newSetlistDesc.trim());
    onUpdateProfile(updated);
    setNewSetlistName('');
    setNewSetlistDesc('');
    setShowNewSetlistForm(false);
  };

  const handleDeleteSetlistClick = (setlistId: string, setlistName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSetlistToDelete({ id: setlistId, name: setlistName });
  };

  const confirmDeleteSetlist = () => {
    if (setlistToDelete) {
      const updated = deleteSetlist(setlistToDelete.id);
      onUpdateProfile(updated);
      setSetlistToDelete(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl shadow-2xl border relative overflow-hidden ${
          stageModeDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-zinc-950 font-black text-xl shadow-md shadow-amber-500/20">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">{profile.name}</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                <span>{profile.preferredInstrument}</span> • 
                <span className="text-amber-500 font-bold">{favoriteSongs.length} Favoritas</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-6">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'favorites'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Heart className="w-4 h-4 fill-current" />
            <span>Músicas Favoritas ({favoriteSongs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('setlists')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'setlists'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Repertórios ({profile.setlists.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'custom'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Criadas por Mim ({profile.customCreatedSongs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'settings'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Configurações</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <div className="space-y-3">
              {favoriteSongs.length === 0 ? (
                <div className="text-center py-10">
                  <Heart className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm font-bold text-zinc-500">Nenhuma música favorita ainda</p>
                  <p className="text-xs text-zinc-400 mt-1">Clique no ícone de coração em qualquer cifra para salvar no seu perfil.</p>
                </div>
              ) : (
                favoriteSongs.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => {
                      onSelectSong(song);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all hover:border-amber-500/50 ${
                      stageModeDark ? 'bg-zinc-800/60 border-zinc-800 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm">{song.title}</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{song.artist} • Tom: <span className="text-amber-500 font-bold">{song.currentKey || song.originalKey}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 font-bold text-xs">
                        Abrir Cifra
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(song.id, e);
                        }}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Remover dos favoritos"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSong(song);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Apagar cifra"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Setlists Tab */}
          {activeTab === 'setlists' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  Organize suas músicas em listas para shows, ensaios ou estudos.
                </p>
                <button
                  onClick={() => setShowNewSetlistForm(!showNewSetlistForm)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-1 hover:bg-amber-400 transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Novo Repertório</span>
                </button>
              </div>

              {/* Form to create Setlist */}
              {showNewSetlistForm && (
                <form onSubmit={handleCreateSetlist} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-amber-500 mb-1">Nome do Repertório</label>
                    <input
                      type="text"
                      value={newSetlistName}
                      onChange={(e) => setNewSetlistName(e.target.value)}
                      placeholder="Ex: Show no Bar de Sexta..."
                      className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                        stageModeDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-500 mb-1">Descrição (opcional)</label>
                    <input
                      type="text"
                      value={newSetlistDesc}
                      onChange={(e) => setNewSetlistDesc(e.target.value)}
                      placeholder="Ex: Músicas acústicas MPB e Pop"
                      className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                        stageModeDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                      }`}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewSetlistForm(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-500"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400"
                    >
                      Criar Repertório
                    </button>
                  </div>
                </form>
              )}

              {/* List of Setlists */}
              {profile.setlists.map((setlist) => {
                const songsInSetlist = allSongs.filter((s) => setlist.songIds.includes(s.id));

                return (
                  <div
                    key={setlist.id}
                    className={`p-4 rounded-2xl border ${
                      stageModeDark ? 'bg-zinc-800/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-base text-amber-500">{setlist.name}</h4>
                        {setlist.description && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{setlist.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-500">
                          {songsInSetlist.length} músicas
                        </span>
                        <button
                          onClick={(e) => handleDeleteSetlistClick(setlist.id, setlist.name, e)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Apagar repertório"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Songs preview */}
                    <div className="space-y-1.5 mt-3">
                      {songsInSetlist.map((song, i) => (
                        <div
                          key={song.id}
                          onClick={() => {
                            onSelectSong(song);
                            onClose();
                          }}
                          className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs cursor-pointer hover:border-amber-500/50"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-400 w-4">{i + 1}.</span>
                            <span className="font-bold">{song.title}</span>
                            <span className="text-zinc-400">- {song.artist}</span>
                          </div>
                          <span className="font-bold text-amber-500">{song.currentKey || song.originalKey}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom Songs Tab */}
          {activeTab === 'custom' && (
            <div className="space-y-3">
              {profile.customCreatedSongs.length === 0 ? (
                <div className="text-center py-10">
                  <Music className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm font-bold text-zinc-500">Nenhuma cifra personalizada criada ainda</p>
                  <p className="text-xs text-zinc-400 mt-1">Use o botão "+" no topo para criar ou colar suas próprias cifras.</p>
                </div>
              ) : (
                profile.customCreatedSongs.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => {
                      onSelectSong(song);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all hover:border-amber-500/50 ${
                      stageModeDark ? 'bg-zinc-800/60 border-zinc-800 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm">{song.title}</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{song.artist} • Tom: <span className="text-amber-500 font-bold">{song.originalKey}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 font-bold text-xs">
                        Ver Cifra
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSong(song);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Apagar cifra"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Nome do Músico / Perfil
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-sm font-bold border outline-none ${
                    stageModeDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Instrumento Principal
                </label>
                <select
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value as Instrument)}
                  className={`w-full px-3 py-2 rounded-xl text-sm font-bold border outline-none ${
                    stageModeDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                >
                  <option value="Violão / Guitarra">Violão / Guitarra</option>
                  <option value="Ukulele">Ukulele</option>
                  <option value="Teclado">Teclado / Piano</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveSettings}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {setlistToDelete && (
        <DeleteConfirmModal
          title="Apagar Repertório"
          itemTitle={setlistToDelete.name}
          description="Deseja mesmo apagar este repertório? As músicas continuarão salvas no app."
          onConfirm={confirmDeleteSetlist}
          onCancel={() => setSetlistToDelete(null)}
          stageModeDark={stageModeDark}
        />
      )}
    </div>
  );
};
