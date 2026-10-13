/**
 * On-device storage for downloaded recitations, in IndexedDB.
 *
 * IndexedDB rather than the Cache API because the audio is played from a Blob
 * through an object URL: the browser then handles seeking itself, with no
 * service worker needed to answer range requests, and it works the same in a
 * browser tab and in the installed app.
 *
 * Three stores:
 * - `audio`: the MP3 Blob, keyed by `downloadKey()`
 * - `meta`:  one `DownloadRecord` per download, so listing downloads never
 *            touches the (large) audio
 * - `texts`: translations and ayah timings, so the synced translation also
 *            works offline
 */

export interface DownloadRecord {
  /** `${reciterId}-${surahNumber}` */
  key: string;
  reciterId: number;
  reciterName: string;
  surahNumber: number;
  surahName: string;
  surahNameArabic: string;
  totalAyah: number;
  /** Bytes */
  size: number;
  downloadedAt: number;
}

const DB_NAME = "quranPlayer.downloads";
const DB_VERSION = 1;
const AUDIO = "audio";
const META = "meta";
const TEXTS = "texts";

export const downloadKey = (reciterId: number, surahNumber: number) =>
  `${reciterId}-${surahNumber}`;

/** Thrown when the browser gives us no IndexedDB, e.g. some private modes. */
export class StorageUnavailableError extends Error {
  constructor() {
    super("Downloads aren't available in this browser mode.");
    this.name = "StorageUnavailableError";
  }
}

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new StorageUnavailableError());
      return;
    }

    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      reject(new StorageUnavailableError());
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AUDIO)) db.createObjectStore(AUDIO);
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: "key" });
      if (!db.objectStoreNames.contains(TEXTS)) db.createObjectStore(TEXTS);
    };
    request.onsuccess = () => {
      const db = request.result;
      // Another tab upgraded the schema: let it, and reopen on next use
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    request.onerror = () => reject(request.error ?? new StorageUnavailableError());
    request.onblocked = () => reject(new StorageUnavailableError());
  });

  // A failed open shouldn't poison every later attempt
  dbPromise.catch(() => {
    dbPromise = null;
  });

  return dbPromise;
};

const requestToPromise = <T,>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const transactionDone = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    // A quota failure surfaces here, on the transaction, not the request
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new DOMException("Transaction aborted", "AbortError"));
  });

/** Every completed download. Reads metadata only, never the audio. */
export const listDownloads = async (): Promise<DownloadRecord[]> => {
  const db = await openDb();
  const tx = db.transaction(META, "readonly");
  return requestToPromise(tx.objectStore(META).getAll() as IDBRequest<DownloadRecord[]>);
};

export const getDownloadedAudio = async (key: string): Promise<Blob | null> => {
  const db = await openDb();
  const tx = db.transaction(AUDIO, "readonly");
  const blob = await requestToPromise(tx.objectStore(AUDIO).get(key) as IDBRequest<Blob | undefined>);
  return blob ?? null;
};

/** Audio and its record are written together, so a half-saved download can't exist. */
export const saveDownload = async (record: DownloadRecord, audio: Blob) => {
  const db = await openDb();
  const tx = db.transaction([AUDIO, META], "readwrite");
  tx.objectStore(AUDIO).put(audio, record.key);
  tx.objectStore(META).put(record);
  await transactionDone(tx);
};

export const deleteDownloads = async (keys: string[]) => {
  if (keys.length === 0) return;
  const db = await openDb();
  const tx = db.transaction([AUDIO, META], "readwrite");
  for (const key of keys) {
    tx.objectStore(AUDIO).delete(key);
    tx.objectStore(META).delete(key);
  }
  await transactionDone(tx);
};

/** Translations and timings. Best effort: callers treat a failure as a miss. */
export const getText = async <T,>(key: string): Promise<T | null> => {
  try {
    const db = await openDb();
    const tx = db.transaction(TEXTS, "readonly");
    const value = await requestToPromise(tx.objectStore(TEXTS).get(key) as IDBRequest<T | undefined>);
    return value ?? null;
  } catch {
    return null;
  }
};

export const saveText = async (key: string, value: unknown) => {
  const db = await openDb();
  const tx = db.transaction(TEXTS, "readwrite");
  tx.objectStore(TEXTS).put(value, key);
  await transactionDone(tx);
};

export const isQuotaError = (error: unknown) =>
  error instanceof DOMException &&
  (error.name === "QuotaExceededError" ||
    // Firefox
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    // Safari reports a full disk as an unknown error on a write
    error.name === "UnknownError");
