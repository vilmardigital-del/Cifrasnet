import { Song, UserProfile, Setlist } from '../types';
import { POPULAR_SONGS } from '../data/popularSongs';
import { syncSongToCloud, deleteSongFromCloud, syncProfileToCloud } from '../lib/firebaseService';

const PROFILE_STORAGE_KEY = 'ciframaster_user_profile_v1';
const OFFLINE_SONGS_KEY = 'ciframaster_cached_songs_v1';
const DELETED_SONGS_KEY = 'ciframaster_deleted_songs_v1';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Músico CifraMaster',
  preferredInstrument: 'Violão / Guitarra',
  stageModeDark: false,
  favorites: ['anunciacao-alceu-valenca', 'evidencias-chitaozinho-xororo'],
  customCreatedSongs: [],
  history: ['anunciacao-alceu-valenca', 'pais-e-filhos-legiao-urbana'],
  setlists: [
    {
      id: 'setlist_bar_sexta',
      name: 'Show no Bar - Sexta',
      description: 'Repertório acústico MPB & Pop Rock',
      songIds: ['anunciacao-alceu-valenca', 'pais-e-filhos-legiao-urbana', 'metamorfose-ambulante-raul-seixas', 'nao-quero-dinheiro-tim-maia'],
      createdAt: new Date().toISOString(),
    },
  ],
};

export function getDeletedSongIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_SONGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveDeletedSongIds(ids: string[]): void {
  try {
    localStorage.setItem(DELETED_SONGS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Error saving deleted song ids:', e);
  }
}

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      saveUserProfile(DEFAULT_PROFILE);
      return DEFAULT_PROFILE;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : DEFAULT_PROFILE.favorites,
      customCreatedSongs: Array.isArray(parsed.customCreatedSongs) ? parsed.customCreatedSongs : DEFAULT_PROFILE.customCreatedSongs,
      history: Array.isArray(parsed.history) ? parsed.history : DEFAULT_PROFILE.history,
      setlists: Array.isArray(parsed.setlists) ? parsed.setlists : DEFAULT_PROFILE.setlists,
    };
  } catch (e) {
    console.error('Error loading profile:', e);
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile, syncCloud: boolean = true): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    if (syncCloud) {
      syncProfileToCloud(profile);
    }
  } catch (e) {
    console.error('Error saving profile:', e);
  }
}

export function getOfflineSongIds(): string[] {
  try {
    const raw = localStorage.getItem(OFFLINE_SONGS_KEY);
    const cached: Song[] = raw ? JSON.parse(raw) : [];
    return cached.map((s) => s.id);
  } catch (e) {
    return [];
  }
}

export function loadCachedSongs(): Song[] {
  try {
    const deletedIds = getDeletedSongIds();
    const raw = localStorage.getItem(OFFLINE_SONGS_KEY);
    const cached: Song[] = raw ? JSON.parse(raw) : [];
    const offlineSet = new Set(cached.map((s) => s.id));

    const songMap = new Map<string, Song>();

    // Add default popular songs (if not deleted)
    POPULAR_SONGS.forEach((s) => {
      if (!deletedIds.includes(s.id)) {
        // If it's also saved in offline cache, mark savedOfflineAt
        const cachedItem = cached.find((c) => c.id === s.id);
        songMap.set(s.id, {
          ...s,
          savedOfflineAt: cachedItem ? cachedItem.savedOfflineAt || new Date().toISOString() : s.savedOfflineAt,
        });
      }
    });

    // Add custom & cached songs (if not deleted)
    cached.forEach((s) => {
      if (!deletedIds.includes(s.id)) {
        songMap.set(s.id, {
          ...s,
          savedOfflineAt: s.savedOfflineAt || new Date().toISOString(),
        });
      }
    });

    return Array.from(songMap.values());
  } catch (e) {
    return POPULAR_SONGS;
  }
}

export function saveCachedSong(song: Song, syncCloud: boolean = true): void {
  try {
    const raw = localStorage.getItem(OFFLINE_SONGS_KEY);
    const cached: Song[] = raw ? JSON.parse(raw) : [];
    const existingIdx = cached.findIndex((s) => s.id === song.id);
    const updated = { ...song, savedOfflineAt: new Date().toISOString() };

    if (existingIdx >= 0) {
      cached[existingIdx] = updated;
    } else {
      cached.push(updated);
    }

    localStorage.setItem(OFFLINE_SONGS_KEY, JSON.stringify(cached));

    if (syncCloud) {
      syncSongToCloud(updated);
    }
  } catch (e) {
    console.error('Error caching song:', e);
  }
}

export function removeSongOffline(songId: string): Song[] {
  try {
    const raw = localStorage.getItem(OFFLINE_SONGS_KEY);
    const cached: Song[] = raw ? JSON.parse(raw) : [];
    const updated = cached.filter((s) => s.id !== songId);
    localStorage.setItem(OFFLINE_SONGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error removing song offline:', e);
  }
  return loadCachedSongs();
}

export function toggleOfflineSong(song: Song): string[] {
  const offlineIds = getOfflineSongIds();
  const isSaved = offlineIds.includes(song.id);

  if (isSaved) {
    removeSongOffline(song.id);
  } else {
    saveCachedSong(song);
  }
  return getOfflineSongIds();
}

export function saveAllSongsOffline(songs: Song[]): Song[] {
  songs.forEach((song) => saveCachedSong(song));
  return loadCachedSongs();
}

export function deleteSong(songId: string): { profile: UserProfile; songs: Song[] } {
  // 1. Mark as deleted in deleted song ids list
  const deletedIds = getDeletedSongIds();
  if (!deletedIds.includes(songId)) {
    saveDeletedSongIds([...deletedIds, songId]);
  }

  // 2. Remove from offline cached storage & cloud
  removeSongOffline(songId);
  deleteSongFromCloud(songId);

  // 3. Update profile references
  const profile = loadUserProfile();
  const updatedFavorites = profile.favorites.filter((id) => id !== songId);
  const updatedHistory = profile.history.filter((id) => id !== songId);
  const updatedCustomSongs = profile.customCreatedSongs.filter((s) => s.id !== songId);
  const updatedSetlists = profile.setlists.map((sl) => ({
    ...sl,
    songIds: sl.songIds.filter((id) => id !== songId),
  }));

  const updatedProfile: UserProfile = {
    ...profile,
    favorites: updatedFavorites,
    history: updatedHistory,
    customCreatedSongs: updatedCustomSongs,
    setlists: updatedSetlists,
  };

  saveUserProfile(updatedProfile);

  return {
    profile: updatedProfile,
    songs: loadCachedSongs(),
  };
}

export function deleteSetlist(setlistId: string): UserProfile {
  const profile = loadUserProfile();
  const updatedSetlists = profile.setlists.filter((s) => s.id !== setlistId);
  const updated = { ...profile, setlists: updatedSetlists };
  saveUserProfile(updated);
  return updated;
}

export function toggleFavoriteSong(songId: string): UserProfile {
  const profile = loadUserProfile();
  const currentFavs = Array.isArray(profile.favorites) ? profile.favorites : [];
  const isFav = currentFavs.includes(songId);

  let newFavs: string[];
  if (isFav) {
    newFavs = currentFavs.filter((id) => id !== songId);
  } else {
    newFavs = [songId, ...currentFavs];
  }

  const updatedProfile = { ...profile, favorites: newFavs };
  saveUserProfile(updatedProfile);
  return updatedProfile;
}

export function addToHistory(songId: string): UserProfile {
  const profile = loadUserProfile();
  const filtered = profile.history.filter((id) => id !== songId);
  const updatedHistory = [songId, ...filtered].slice(0, 20); // Keep last 20
  const updated = { ...profile, history: updatedHistory };
  saveUserProfile(updated);
  return updated;
}

export function saveCustomSong(song: Song): { profile: UserProfile; songs: Song[] } {
  const profile = loadUserProfile();
  const cachedSongs = loadCachedSongs();

  const existingIdx = profile.customCreatedSongs.findIndex((s) => s.id === song.id);
  let updatedCustom: Song[];

  if (existingIdx >= 0) {
    updatedCustom = [...profile.customCreatedSongs];
    updatedCustom[existingIdx] = song;
  } else {
    updatedCustom = [song, ...profile.customCreatedSongs];
  }

  const updatedProfile = {
    ...profile,
    customCreatedSongs: updatedCustom,
    favorites: profile.favorites.includes(song.id) ? profile.favorites : [song.id, ...profile.favorites],
  };

  saveUserProfile(updatedProfile);
  saveCachedSong(song);

  return { profile: updatedProfile, songs: loadCachedSongs() };
}

export function createSetlist(name: string, description?: string, songIds: string[] = []): UserProfile {
  const profile = loadUserProfile();
  const newSetlist: Setlist = {
    id: `setlist_${Date.now()}`,
    name,
    description,
    songIds,
    createdAt: new Date().toISOString(),
  };

  const updated = {
    ...profile,
    setlists: [newSetlist, ...profile.setlists],
  };

  saveUserProfile(updated);
  return updated;
}

export function addSongToSetlist(setlistId: string, songId: string): UserProfile {
  const profile = loadUserProfile();
  const setlist = profile.setlists.find((s) => s.id === setlistId);
  if (!setlist) return profile;

  if (setlist.songIds.includes(songId)) return profile;

  const updatedSetlists = profile.setlists.map((s) => {
    if (s.id === setlistId) {
      return { ...s, songIds: [...s.songIds, songId] };
    }
    return s;
  });

  const updated = { ...profile, setlists: updatedSetlists };
  saveUserProfile(updated);
  return updated;
}
