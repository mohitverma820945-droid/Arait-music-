import type { Track } from '../types/music';

const DB_NAME = 'AraitMusicOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'downloaded_tracks';

export interface DownloadedTrackRecord {
  id: string;
  track: Track;
  audioBlob: Blob;
  downloadedAt: number;
  sizeBytes: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveTrackOffline(track: Track): Promise<DownloadedTrackRecord> {
  const streamUrl = track.playback_url_or_provider_reference;
  if (!streamUrl) throw new Error('No audio stream available to download');

  // Fetch audio stream as Blob with server proxy fallback for 100% download reliability
  let res: Response;
  try {
    res = await fetch(streamUrl);
    if (!res.ok) throw new Error(`Status ${res.status}`);
  } catch {
    res = await fetch(
      `/api/audio/download?url=${encodeURIComponent(streamUrl)}&title=${encodeURIComponent(
        track.title
      )}&artist=${encodeURIComponent(track.artist)}`
    );
  }

  if (!res.ok) throw new Error(`Download failed with status ${res.status}`);
  const audioBlob = await res.blob();

  const record: DownloadedTrackRecord = {
    id: track.id,
    track,
    audioBlob,
    downloadedAt: Date.now(),
    sizeBytes: audioBlob.size
  };

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const putReq = store.put(record);

    putReq.onsuccess = () => resolve(record);
    putReq.onerror = () => reject(putReq.error);
  });
}

export async function getAllDownloadedTracks(): Promise<DownloadedTrackRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const records: DownloadedTrackRecord[] = req.result || [];
      // Sort newest downloads first
      records.sort((a, b) => b.downloadedAt - a.downloadedAt);
      resolve(records);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function isTrackDownloaded(trackId: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(trackId);

    req.onsuccess = () => resolve(!!req.result);
    req.onerror = () => resolve(false);
  });
}

export async function removeDownloadedTrack(trackId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(trackId);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export function createBlobUrlForTrack(record: DownloadedTrackRecord): Track {
  const blobUrl = URL.createObjectURL(record.audioBlob);
  return {
    ...record.track,
    playback_url_or_provider_reference: blobUrl,
    is_offline: true
  } as Track & { is_offline?: boolean };
}
