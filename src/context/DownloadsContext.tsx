import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import type { SurahInfo } from "./PlayerContext";
import { useToast } from "./ToastContext";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import {
  DownloadRecord,
  StorageUnavailableError,
  deleteDownloads,
  downloadKey,
  isQuotaError,
  listDownloads,
  saveDownload,
} from "../api/downloadStore";
import {
  DownloadError,
  DownloadErrorKind,
  downloadSurahAudio,
  requestPersistentStorage,
} from "../api/downloadSurah";
import { saveTranslationsForOffline } from "../api/fetchAyahTranslations";

export interface DownloadReciter {
  id: number;
  name: string;
}

export interface QueueItem {
  key: string;
  reciterId: number;
  reciterName: string;
  surah: SurahInfo;
  status: "queued" | "downloading" | "failed";
  /** Network failures so far; retried automatically up to MAX_ATTEMPTS */
  attempts: number;
  /** User-facing reason, set when status is "failed" */
  error?: string;
}

export type DownloadState = "none" | "queued" | "downloading" | "failed" | "downloaded";

export interface DownloadStatus {
  state: DownloadState;
  /** 0–1 while downloading, null if the size isn't known yet */
  progress: number | null;
  error?: string;
}

interface DownloadsContextType {
  /** False while the stored downloads are still being read */
  isReady: boolean;
  /** False when this browser gives us no storage, e.g. some private modes */
  isSupported: boolean;
  /** Completed downloads */
  downloads: DownloadRecord[];
  /** Pending, active and failed downloads, in order */
  queue: QueueItem[];
  totalBytes: number;
  getStatus: (reciterId: number, surahNumber: number) => DownloadStatus;
  isDownloaded: (reciterId: number, surahNumber: number) => boolean;
  download: (surah: SurahInfo, reciter: DownloadReciter) => void;
  downloadMany: (surahs: SurahInfo[], reciter: DownloadReciter) => void;
  cancel: (keys: string[]) => void;
  retry: (keys: string[]) => void;
  remove: (keys: string[]) => Promise<void>;
}

const DownloadsContext = createContext<DownloadsContextType | undefined>(undefined);

const QUEUE_STORAGE_KEY = "quranPlayer.downloads.queue";
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2_000;
/** Progress re-renders every download button, so cap how often it updates. */
const PROGRESS_INTERVAL_MS = 250;

const PRIVATE_MODE_MESSAGE =
  "Downloads aren't available in private browsing. Open the app in a normal window to download.";

const messageFor = (kind: DownloadErrorKind, surahName: string) => {
  switch (kind) {
    case "storage":
      return `Not enough storage to download ${surahName}. Free up space or remove some downloads, then try again.`;
    case "unavailable":
      return `${surahName} isn't available to download right now. Please try again later.`;
    case "save":
      return `Couldn't save ${surahName} on this device. Please try again.`;
    default:
      return `Couldn't download ${surahName}. Check your connection and try again.`;
  }
};

const loadQueue = (): QueueItem[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(QUEUE_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    // Whatever was mid-download when the app closed starts again from the top
    return parsed.map((item: QueueItem) =>
      item.status === "downloading" ? { ...item, status: "queued" as const } : item
    );
  } catch {
    return [];
  }
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Tallies one burst of downloads so it can be summed up in a single message. */
interface Run {
  succeeded: string[];
  failed: { key: string; surahName: string; kind: DownloadErrorKind }[];
}

const emptyRun = (): Run => ({ succeeded: [], failed: [] });

/**
 * Downloads surahs one at a time for offline listening.
 *
 * The queue is saved as it changes, so downloads interrupted by closing the
 * app — or by iOS suspending it in the background — pick up again on the next
 * launch. Going offline pauses the queue rather than failing it, and it
 * carries on by itself when the connection returns.
 */
export const DownloadsProvider = ({ children }: { children: ReactNode }) => {
  const { showToast } = useToast();
  const isOnline = useOnlineStatus();

  const [records, setRecords] = useState<Record<string, DownloadRecord>>({});
  const [isReady, setIsReady] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [queue, setQueue] = useState<QueueItem[]>(loadQueue);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [activeProgress, setActiveProgress] = useState<number | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const runRef = useRef<Run>(emptyRun());
  const hasNotifiedOfflineRef = useRef(false);

  // Read what is already on the device
  useEffect(() => {
    listDownloads()
      .then((list) => {
        setRecords(Object.fromEntries(list.map((record) => [record.key, record])));
      })
      .catch((error) => {
        console.error("Error reading downloads:", error);
        if (error instanceof StorageUnavailableError) setIsSupported(false);
      })
      .finally(() => setIsReady(true));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch {
      // Not resumable after a restart, but downloads still run now
    }
  }, [queue]);

  // Say once that downloads are waiting on the connection, not lost
  useEffect(() => {
    if (isOnline) {
      hasNotifiedOfflineRef.current = false;
      return;
    }
    const hasPending = queue.some((item) => item.status !== "failed");
    if (hasPending && !hasNotifiedOfflineRef.current) {
      hasNotifiedOfflineRef.current = true;
      showToast("You're offline. Downloads will continue when you're back online.");
    }
  }, [isOnline, queue, showToast]);

  const updateItem = (key: string, changes: Partial<QueueItem>) =>
    setQueue((current) =>
      current.map((item) => (item.key === key ? { ...item, ...changes } : item))
    );

  const removeFromQueue = (keys: string[]) =>
    setQueue((current) => current.filter((item) => !keys.includes(item.key)));

  const retry = useCallback((keys: string[]) => {
    setQueue((current) =>
      current.map((item) =>
        keys.includes(item.key) && item.status === "failed"
          ? { ...item, status: "queued", attempts: 0, error: undefined }
          : item
      )
    );
  }, []);

  /** One message for the whole burst, instead of one per surah. */
  const summarizeRun = useCallback(() => {
    const { succeeded, failed } = runRef.current;
    runRef.current = emptyRun();
    if (succeeded.length === 0 && failed.length === 0) return;

    const failedKeys = failed.map((f) => f.key);
    const retryAction = { label: "Retry", onClick: () => retry(failedKeys) };

    if (failed.length === 0) {
      showToast(
        succeeded.length === 1
          ? `${succeeded[0]} downloaded. You can now listen offline.`
          : `${succeeded.length} surahs downloaded. You can now listen offline.`,
        { tone: "success" }
      );
      return;
    }

    if (succeeded.length === 0 && failed.length === 1) {
      showToast(messageFor(failed[0].kind, failed[0].surahName), {
        tone: "error",
        action: retryAction,
      });
      return;
    }

    const outOfSpace = failed.some((f) => f.kind === "storage");
    const total = succeeded.length + failed.length;
    showToast(
      `${succeeded.length} of ${total} surahs downloaded. ` +
        (outOfSpace
          ? "The rest didn't fit — free up space or remove some downloads, then try again."
          : `${failed.length} couldn't be downloaded — check your connection and try again.`),
      { tone: "error", action: retryAction }
    );
  }, [retry, showToast]);

  const runDownload = useCallback(
    async (item: QueueItem) => {
      const controller = new AbortController();
      controllerRef.current = controller;
      setActiveKey(item.key);
      setActiveProgress(null);
      updateItem(item.key, { status: "downloading" });

      let lastProgressAt = 0;

      try {
        const blob = await downloadSurahAudio(
          item.surah.number,
          item.reciterId,
          controller.signal,
          ({ received, total }) => {
            const now = Date.now();
            if (now - lastProgressAt < PROGRESS_INTERVAL_MS) return;
            lastProgressAt = now;
            setActiveProgress(total ? Math.min(received / total, 1) : null);
          }
        );

        const record: DownloadRecord = {
          key: item.key,
          reciterId: item.reciterId,
          reciterName: item.reciterName,
          surahNumber: item.surah.number,
          surahName: item.surah.name,
          surahNameArabic: item.surah.nameArabic,
          totalAyah: item.surah.totalAyah,
          size: blob.size,
          downloadedAt: Date.now(),
        };

        try {
          await saveDownload(record, blob);
        } catch (error) {
          throw new DownloadError(isQuotaError(error) ? "storage" : "save");
        }

        // Cancelled while it was being saved: honour the cancel
        if (controller.signal.aborted) {
          await deleteDownloads([item.key]).catch(() => {});
          return;
        }

        setRecords((current) => ({ ...current, [record.key]: record }));
        removeFromQueue([item.key]);
        runRef.current.succeeded.push(item.surah.name);
        requestPersistentStorage();

        // The audio is what matters; the translation is a bonus offline
        saveTranslationsForOffline(item.surah.number, item.reciterId).catch((error) =>
          console.warn("Translation not saved for offline use:", error)
        );
      } catch (error) {
        const kind: DownloadErrorKind =
          error instanceof DownloadError ? error.kind : "network";

        if (kind === "aborted") {
          removeFromQueue([item.key]);
        } else if (kind === "offline") {
          // Paused, not failed: picked up again when the connection returns
          updateItem(item.key, { status: "queued" });
        } else if (kind === "network" && item.attempts + 1 < MAX_ATTEMPTS) {
          await wait(RETRY_DELAY_MS * (item.attempts + 1));
          updateItem(item.key, { status: "queued", attempts: item.attempts + 1 });
        } else {
          console.error(`Download failed for ${item.key}:`, error);
          updateItem(item.key, {
            status: "failed",
            attempts: item.attempts + 1,
            error: messageFor(kind, item.surah.name),
          });
          runRef.current.failed.push({ key: item.key, surahName: item.surah.name, kind });
        }
      } finally {
        controllerRef.current = null;
        setActiveKey(null);
        setActiveProgress(null);
      }
    },
    []
  );

  // Work through the queue one surah at a time
  useEffect(() => {
    if (!isReady || !isSupported || activeKey || !isOnline) return;

    const next = queue.find((item) => item.status === "queued");
    if (next) {
      runDownload(next);
    } else {
      summarizeRun();
    }
  }, [isReady, isSupported, activeKey, isOnline, queue, runDownload, summarizeRun]);

  const isDownloaded = useCallback(
    (reciterId: number, surahNumber: number) => downloadKey(reciterId, surahNumber) in records,
    [records]
  );

  const getStatus = (reciterId: number, surahNumber: number): DownloadStatus => {
    const key = downloadKey(reciterId, surahNumber);
    if (records[key]) return { state: "downloaded", progress: 1 };

    const item = queue.find((q) => q.key === key);
    if (!item) return { state: "none", progress: null };
    if (item.status === "downloading") {
      return { state: "downloading", progress: key === activeKey ? activeProgress : null };
    }
    return { state: item.status, progress: null, error: item.error };
  };

  const enqueue = (surahs: SurahInfo[], reciter: DownloadReciter) => {
    if (!isSupported) {
      showToast(PRIVATE_MODE_MESSAGE, { tone: "error" });
      return 0;
    }

    const toAdd: QueueItem[] = [];
    const toRetry: string[] = [];

    for (const surah of surahs) {
      const key = downloadKey(reciter.id, surah.number);
      if (records[key]) continue;

      const existing = queue.find((item) => item.key === key);
      if (existing) {
        if (existing.status === "failed") toRetry.push(key);
        continue;
      }
      toAdd.push({
        key,
        reciterId: reciter.id,
        reciterName: reciter.name,
        surah,
        status: "queued",
        attempts: 0,
      });
    }

    if (toRetry.length) retry(toRetry);
    if (toAdd.length) setQueue((current) => [...current, ...toAdd]);

    const count = toAdd.length + toRetry.length;
    if (count > 0 && !isOnline) {
      hasNotifiedOfflineRef.current = true;
      showToast(
        count === 1
          ? `You're offline. ${surahs.length === 1 ? surahs[0].name : "It"} will download when you're back online.`
          : `You're offline. ${count} surahs will download when you're back online.`
      );
    }
    return count;
  };

  const download = (surah: SurahInfo, reciter: DownloadReciter) => {
    enqueue([surah], reciter);
  };

  const downloadMany = (surahs: SurahInfo[], reciter: DownloadReciter) => {
    const count = enqueue(surahs, reciter);
    if (count === 0 && isSupported && surahs.length > 0) {
      showToast("Everything here is already downloaded or on its way.");
    }
  };

  const cancel = (keys: string[]) => {
    if (activeKey && keys.includes(activeKey)) controllerRef.current?.abort();
    removeFromQueue(keys);
  };

  const remove = async (keys: string[]) => {
    try {
      await deleteDownloads(keys);
      setRecords((current) => {
        const next = { ...current };
        for (const key of keys) delete next[key];
        return next;
      });
    } catch (error) {
      console.error("Error removing downloads:", error);
      showToast("Couldn't remove the download. Please try again.", { tone: "error" });
      throw error;
    }
  };

  const downloads = Object.values(records);
  const totalBytes = downloads.reduce((sum, record) => sum + record.size, 0);

  return (
    <DownloadsContext.Provider
      value={{
        isReady,
        isSupported,
        downloads,
        queue,
        totalBytes,
        getStatus,
        isDownloaded,
        download,
        downloadMany,
        cancel,
        retry,
        remove,
      }}
    >
      {children}
    </DownloadsContext.Provider>
  );
};

export const useDownloads = () => {
  const context = useContext(DownloadsContext);
  if (context === undefined) {
    throw new Error("useDownloads must be used within a DownloadsProvider");
  }
  return context;
};
