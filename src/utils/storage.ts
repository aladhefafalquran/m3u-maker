import type { AudioTrack, PlaylistItem } from '../types';

const DB_NAME = 'M3UMakerDB';
const DB_VERSION = 1;
const TRACKS_STORE = 'tracks';
const PLAYLIST_STORE = 'playlist';

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(TRACKS_STORE)) {
                db.createObjectStore(TRACKS_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(PLAYLIST_STORE)) {
                db.createObjectStore(PLAYLIST_STORE, { keyPath: 'playlistId' });
            }
        };
    });
};

export const saveTrack = async (track: AudioTrack): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(TRACKS_STORE, 'readwrite');
        const store = transaction.objectStore(TRACKS_STORE);
        const request = store.put(track);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
};

export const saveTracks = async (tracks: AudioTrack[]): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(TRACKS_STORE, 'readwrite');
        const store = transaction.objectStore(TRACKS_STORE);
        tracks.forEach(track => store.put(track));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getTracksFromDB = async (): Promise<AudioTrack[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(TRACKS_STORE, 'readonly');
        const store = transaction.objectStore(TRACKS_STORE);
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
};

export const savePlaylist = async (playlist: PlaylistItem[]): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PLAYLIST_STORE, 'readwrite');
        const store = transaction.objectStore(PLAYLIST_STORE);
        // Clear existing playlist to ensure order/removals are reflected
        store.clear().onsuccess = () => {
            playlist.forEach(item => store.put(item));
        };
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getPlaylist = async (): Promise<PlaylistItem[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PLAYLIST_STORE, 'readonly');
        const store = transaction.objectStore(PLAYLIST_STORE);
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
};
