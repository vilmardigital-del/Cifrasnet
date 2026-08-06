import { Song, UserProfile, Setlist } from '../types';
import { POPULAR_SONGS } from '../data/popularSongs';
import { syncSongToCloud, deleteSongFromCloud, syncProfileToCloud } from '../lib/firebaseService';

const PROFILE_STORAGE_KEY = 'ciframaster_user_profile_v1';
const OFFLINE_SONGS_KEY = 'ciframaster_cached_songs_v1';
const DELETED_SONGS_KEY = 'ciframaster_deleted_songs_v1';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Vilmar',
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

export function trimStorageQuota(): void {
  try {
    const raw = localStorage.getItem(OFFLINE_SONGS_KEY);
    if (!raw) return;
    const cached: Song[] = JSON.parse(raw);

    // Keep custom, cifra and modified songs that are not default popular songs
    const filtered = cached.filter((s) => {
      if (s.id.startsWith('custom_') || s.id.startsWith('cifra_')) return true;
      const defaultPop = POPULAR_SONGS.find((p) => p.id === s.id);
      if (!defaultPop) return true;
      return s.chordsText !== defaultPop.chordsText || JSON.stringify(s.chordsUsed) !== JSON.stringify(defaultPop.chordsUsed);
    });

    const customOnly = filtered.filter((s) => s.id.startsWith('custom_') || s.id.startsWith('cifra_'));
    const others = filtered.filter((s) => !s.id.startsWith('custom_') && !s.id.startsWith('cifra_')).slice(-5);
    const trimmed = [...customOnly, ...others];

    localStorage.setItem(OFFLINE_SONGS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to trim offline cache:', e);
  }
}

export function saveUserProfile(profile: UserProfile, syncCloud: boolean = true): void {
  if (syncCloud) {
    try {
      syncProfileToCloud(profile);
    } catch (err) {
      console.warn('Cloud profile sync warning:', err);
    }
  }

  const trySetItem = (key: string, data: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  };

  // 1. Direct save attempt
  if (trySetItem(PROFILE_STORAGE_KEY, profile)) {
    return;
  }

  console.warn('LocalStorage quota exceeded for profile. Trimming cache...');

  // 2. Trim offline songs cache first
  trimStorageQuota();
  if (trySetItem(PROFILE_STORAGE_KEY, profile)) {
    return;
  }

  // 3. Try slim profile (truncating oversized custom song text in profile payload)
  const slimCustom = (profile.customCreatedSongs || []).map((s) => ({
    ...s,
    chordsText: s.chordsText && s.chordsText.length > 1000 ? s.chordsText.slice(0, 1000) + '\n...' : s.chordsText,
  }));
  const slimProfile: UserProfile = {
    ...profile,
    customCreatedSongs: slimCustom,
    history: (profile.history || []).slice(0, 10),
  };

  if (trySetItem(PROFILE_STORAGE_KEY, slimProfile)) {
    return;
  }

  // 4. Aggressively clear cached songs except custom ones
  try {
    const raw = localStorage.getItem(OFFLINE_SONGS_KEY);
    if (raw) {
      const cached: Song[] = JSON.parse(raw);
      const customOnly = cached.filter((s) => s.id.startsWith('custom_'));
      localStorage.setItem(OFFLINE_SONGS_KEY, JSON.stringify(customOnly));
    }
  } catch (e) {
    try {
      localStorage.removeItem(OFFLINE_SONGS_KEY);
    } catch (_) {}
  }

  if (trySetItem(PROFILE_STORAGE_KEY, slimProfile)) {
    return;
  }

  // 5. Emergency minimal profile payload
  const minimalProfile: UserProfile = {
    ...profile,
    customCreatedSongs: (profile.customCreatedSongs || []).map((s) => ({
      ...s,
      chordsText: s.chordsText ? s.chordsText.slice(0, 200) : '',
    })),
    history: (profile.history || []).slice(0, 5),
  };

  if (!trySetItem(PROFILE_STORAGE_KEY, minimalProfile)) {
    console.warn('Could not save profile to localStorage even with minimal payload.');
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
    // If it's an unmodified default popular song, no need to duplicate in localStorage
    const defaultPop = POPULAR_SONGS.find((p) => p.id === song.id);
    if (
      defaultPop &&
      defaultPop.chordsText === song.chordsText &&
      JSON.stringify(defaultPop.chordsUsed) === JSON.stringify(song.chordsUsed)
    ) {
      if (syncCloud) {
        syncSongToCloud(song);
      }
      return;
    }

    const raw = localStorage.getItem(OFFLINE_SONGS_KEY);
    const cached: Song[] = raw ? JSON.parse(raw) : [];
    const existingIdx = cached.findIndex((s) => s.id === song.id);
    const updated = { ...song, savedOfflineAt: new Date().toISOString() };

    if (existingIdx >= 0) {
      cached[existingIdx] = updated;
    } else {
      cached.push(updated);
    }

    try {
      localStorage.setItem(OFFLINE_SONGS_KEY, JSON.stringify(cached));
    } catch (setItemErr) {
      console.warn('localStorage quota reached while saving song. Trimming offline cache...', setItemErr);
      trimStorageQuota();
      try {
        localStorage.setItem(OFFLINE_SONGS_KEY, JSON.stringify(cached.slice(-10)));
      } catch (innerErr) {
        console.warn('Could not write to localStorage even after trimming:', innerErr);
      }
    }

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
