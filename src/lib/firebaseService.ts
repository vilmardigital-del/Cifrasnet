import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { Song, UserProfile } from '../types';
import { saveCachedSong, saveUserProfile, loadUserProfile, loadCachedSongs, getDeletedSongIds } from '../utils/storage';

const SONGS_COLLECTION = 'songs';
const PROFILES_COLLECTION = 'profiles';
const DEFAULT_PROFILE_ID = 'default_user';

/**
 * Sync a single song to Firebase Firestore (works offline & online).
 */
export async function syncSongToCloud(song: Song): Promise<void> {
  try {
    const songDocRef = doc(db, SONGS_COLLECTION, song.id);
    const payload = {
      ...song,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(songDocRef, payload, { merge: true });
  } catch (error) {
    console.warn('Firestore sync song error (will retry offline):', error);
  }
}

/**
 * Delete a song from Firebase Firestore.
 */
export async function deleteSongFromCloud(songId: string): Promise<void> {
  try {
    const songDocRef = doc(db, SONGS_COLLECTION, songId);
    await deleteDoc(songDocRef);
  } catch (error) {
    console.warn('Firestore delete song error (will retry offline):', error);
  }
}

/**
 * Sync user profile (favorites, history, custom songs list) to Cloud.
 */
export async function syncProfileToCloud(profile: UserProfile): Promise<void> {
  try {
    const profileDocRef = doc(db, PROFILES_COLLECTION, DEFAULT_PROFILE_ID);
    const payload = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(profileDocRef, payload, { merge: true });
  } catch (error) {
    console.warn('Firestore sync profile error:', error);
  }
}

/**
 * Subscribe to real-time Cloud updates for songs library.
 * Integrates directly with local storage for instant offline access.
 */
export function subscribeToCloudSongs(onSongsUpdated: (songs: Song[]) => void) {
  try {
    const songsQuery = query(collection(db, SONGS_COLLECTION));
    
    return onSnapshot(
      songsQuery,
      (snapshot) => {
        const deletedIds = getDeletedSongIds();
        const cloudSongsMap = new Map<string, Song>();

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as Song;
          if (data && data.id && !deletedIds.includes(data.id)) {
            cloudSongsMap.set(data.id, data);
            saveCachedSong(data, false); // Cache in localStorage for offline access without re-sync loop
          }
        });

        // Merge cloud songs with existing local songs
        const allCached = loadCachedSongs();
        const mergedMap = new Map<string, Song>();

        allCached.forEach((s) => {
          if (!deletedIds.includes(s.id)) {
            mergedMap.set(s.id, s);
          }
        });

        cloudSongsMap.forEach((s, id) => {
          mergedMap.set(id, s);
        });

        const updatedList = Array.from(mergedMap.values());
        onSongsUpdated(updatedList);
      },
      (error) => {
        console.warn('Firestore snapshot listener error (offline mode active):', error);
      }
    );
  } catch (err) {
    console.warn('Could not initialize cloud snapshot listener:', err);
    return () => {};
  }
}

/**
 * Subscribe to real-time Cloud updates for user profile.
 */
export function subscribeToCloudProfile(onProfileUpdated: (profile: UserProfile) => void) {
  try {
    const profileDocRef = doc(db, PROFILES_COLLECTION, DEFAULT_PROFILE_ID);
    return onSnapshot(
      profileDocRef,
      (docSnap) => {
        if (docSnap.exists() && !docSnap.metadata.hasPendingWrites) {
          const cloudData = docSnap.data();
          const currentLocal = loadUserProfile();
          const mergedProfile: UserProfile = {
            ...currentLocal,
            ...cloudData,
            favorites: Array.isArray(cloudData.favorites) ? cloudData.favorites : currentLocal.favorites || [],
            history: Array.isArray(cloudData.history) ? cloudData.history : currentLocal.history || [],
            customCreatedSongs: Array.isArray(cloudData.customCreatedSongs) ? cloudData.customCreatedSongs : currentLocal.customCreatedSongs || [],
            setlists: Array.isArray(cloudData.setlists) ? cloudData.setlists : currentLocal.setlists || [],
          };
          saveUserProfile(mergedProfile, false); // false prevents infinite re-sync loop
          onProfileUpdated(mergedProfile);
        }
      },
      (error) => {
        console.warn('Firestore profile snapshot error:', error);
      }
    );
  } catch (err) {
    return () => {};
  }
}
