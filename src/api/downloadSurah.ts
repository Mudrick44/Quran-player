/**
 * Fetches one surah's recitation for offline listening.
 *
 * Downloads come from mp3quran's CDN (`originalUrl` in quranapi's audio index)
 * rather than the GitHub mirror we stream from: it is built to serve audio,
 * whereas pulling gigabytes from GitHub's large-file storage risks its limits.
 * Both send `Access-Control-Allow-Origin: *`, and the mirror is the fallback.
 * The CDN files are also the exact recordings the ayah timings are made for.
 */

export type DownloadErrorKind =
  /** The device went offline. Not a failure: the queue resumes when back online. */
  | "offline"
  /** Connection dropped, stalled or timed out. Worth retrying. */
  | "network"
  /** The server has no file for this surah, or refused it. */
  | "unavailable"
  /** Not enough space on the device. */
  | "storage"
  /** Downloaded, but writing it to the device failed for another reason. */
  | "save"
  /** Cancelled by the user. */
  | "aborted";

export class DownloadError extends Error {
  kind: DownloadErrorKind;

  constructor(kind: DownloadErrorKind, message: string = kind) {
    super(message);
    this.name = "DownloadError";
    this.kind = kind;
  }
}

export interface DownloadProgress {
  received: number;
  /** From Content-Length; null if the server doesn't say */
  total: number | null;
}

/** No bytes for this long and the download counts as stalled. */
const STALL_TIMEOUT_MS = 30_000;
/** Room to leave free beyond the file itself, so the app keeps working. */
const SPACE_MARGIN_BYTES = 50 * 1024 * 1024;

const audioIndexUrl = (surahNumber: number) =>
  `https://quranapi.pages.dev/api/audio/${surahNumber}.json`;

const isAbort = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";

/** Candidate URLs for a reciter's recording of a surah, best first. */
const resolveSources = async (
  surahNumber: number,
  reciterId: number,
  signal: AbortSignal
): Promise<string[]> => {
  let data: Record<string, { url?: string; originalUrl?: string }>;
  try {
    const response = await fetch(audioIndexUrl(surahNumber), { signal });
    if (!response.ok) throw new DownloadError("unavailable");
    data = await response.json();
  } catch (error) {
    if (error instanceof DownloadError) throw error;
    if (isAbort(error)) throw new DownloadError("aborted");
    throw new DownloadError(navigator.onLine ? "network" : "offline");
  }

  const entry = data[reciterId];
  const sources = [entry?.originalUrl, entry?.url].filter((url): url is string => Boolean(url));
  if (sources.length === 0) throw new DownloadError("unavailable");
  return sources;
};

/**
 * Fails early when the file plainly won't fit, instead of after downloading
 * a hundred megabytes. Browsers that can't estimate are let through; the
 * write itself is the final check.
 */
const ensureSpaceFor = async (bytes: number) => {
  try {
    const estimate = await navigator.storage?.estimate?.();
    if (!estimate?.quota) return;
    const free = estimate.quota - (estimate.usage ?? 0);
    if (free < bytes + SPACE_MARGIN_BYTES) throw new DownloadError("storage");
  } catch (error) {
    if (error instanceof DownloadError) throw error;
  }
};

const fetchAudio = async (
  url: string,
  signal: AbortSignal,
  onProgress: (progress: DownloadProgress) => void
): Promise<Blob> => {
  // Our own controller, so a stalled connection can be cut as well as a cancel
  const controller = new AbortController();
  let stalled = false;
  let stallTimer: ReturnType<typeof setTimeout> | undefined;

  const resetStallTimer = () => {
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => {
      stalled = true;
      controller.abort();
    }, STALL_TIMEOUT_MS);
  };

  const forwardAbort = () => controller.abort();
  signal.addEventListener("abort", forwardAbort);

  try {
    resetStallTimer();
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new DownloadError("unavailable", `HTTP ${response.status}`);

    const lengthHeader = Number(response.headers.get("Content-Length"));
    const total = Number.isFinite(lengthHeader) && lengthHeader > 0 ? lengthHeader : null;
    if (total) await ensureSpaceFor(total);

    onProgress({ received: 0, total });

    // Older browsers without streaming bodies: no progress, but still works
    if (!response.body) {
      const blob = await response.blob();
      onProgress({ received: blob.size, total: blob.size });
      return new Blob([blob], { type: "audio/mpeg" });
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      resetStallTimer();
      onProgress({ received, total });
    }

    if (total && received < total) throw new DownloadError("network", "Incomplete download");

    return new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
  } catch (error) {
    if (error instanceof DownloadError) throw error;
    if (signal.aborted) throw new DownloadError("aborted");
    if (stalled) throw new DownloadError("network", "Download stalled");
    throw new DownloadError(navigator.onLine ? "network" : "offline");
  } finally {
    clearTimeout(stallTimer);
    signal.removeEventListener("abort", forwardAbort);
  }
};

/**
 * Downloads a surah's audio, trying each source in turn. Throws a
 * `DownloadError` whose `kind` says what went wrong.
 */
export const downloadSurahAudio = async (
  surahNumber: number,
  reciterId: number,
  signal: AbortSignal,
  onProgress: (progress: DownloadProgress) => void
): Promise<Blob> => {
  const sources = await resolveSources(surahNumber, reciterId, signal);

  let lastError: DownloadError = new DownloadError("unavailable");
  for (const url of sources) {
    try {
      return await fetchAudio(url, signal, onProgress);
    } catch (error) {
      const downloadError = error as DownloadError;
      // These won't be fixed by trying another server
      if (["aborted", "offline", "storage"].includes(downloadError.kind)) throw downloadError;
      lastError = downloadError;
    }
  }
  throw lastError;
};

/**
 * Asks the browser not to clear downloads when the device runs low on space.
 * Browsers decide for themselves whether to grant it; it never prompts.
 */
export const requestPersistentStorage = async () => {
  try {
    if (await navigator.storage?.persisted?.()) return;
    await navigator.storage?.persist?.();
  } catch {
    // Not supported: downloads still work, just without the guarantee
  }
};
