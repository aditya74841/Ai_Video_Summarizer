/**
 * Client-Side IndexedDB Storage & Auto-Cleanup Utility
 * Lightweight, zero-dependency Promise wrapper around native IndexedDB
 */

export interface CachedSummary {
  videoId: string;
  title: string;
  transcript?: string;
  summary: string;
  createdAt: number; // timestamp in ms
  youtubeUrl?: string;
  duration?: number;
}

const DB_NAME = "VideoSummarizerDB";
const DB_VERSION = 1;
const STORE_NAME = "summaries";

/**
 * Initialize IndexedDB instance safely in browser environment
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "videoId" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to open IndexedDB"));
    };
  });
};

/**
 * Save or update a video summary record in IndexedDB
 */
export const saveSummary = async (record: CachedSummary): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("IndexedDB save warning:", err);
  }
};

/**
 * Get all cached summaries sorted by most recent timestamp
 */
export const getAllSummaries = async (): Promise<CachedSummary[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results: CachedSummary[] = request.result || [];
        // Sort descending by creation date
        results.sort((a, b) => b.createdAt - a.createdAt);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("IndexedDB getAll warning:", err);
    return [];
  }
};

/**
 * Get a single cached summary by videoId
 */
export const getSummaryById = async (videoId: string): Promise<CachedSummary | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(videoId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("IndexedDB getById warning:", err);
    return null;
  }
};

/**
 * Delete a specific summary record from IndexedDB
 */
export const deleteSummary = async (videoId: string): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(videoId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("IndexedDB delete warning:", err);
  }
};

/**
 * Automatically purges any records older than specified retention period (Default: 7 Days)
 * Runs silently in the background
 */
export const cleanupStaleSummaries = async (daysRetention: number = 7): Promise<number> => {
  try {
    const db = await initDB();
    const allSummaries = await getAllSummaries();
    const cutoffTime = Date.now() - daysRetention * 24 * 60 * 60 * 1000;

    const staleRecords = allSummaries.filter((item) => item.createdAt < cutoffTime);

    if (staleRecords.length === 0) return 0;

    for (const record of staleRecords) {
      await deleteSummary(record.videoId);
    }

    return staleRecords.length;
  } catch (err) {
    console.warn("IndexedDB cleanup warning:", err);
    return 0;
  }
};
