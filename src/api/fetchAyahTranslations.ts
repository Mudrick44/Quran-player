import { useCallback, useEffect, useState } from "react";

/**
 * Per-ayah English translation, synced to the full-surah recitation.
 *
 * quranapi has the translations but no timings for its surah audio. Those
 * files are mirrors of mp3quran.net recordings, and mp3quran publishes
 * start/end times for every ayah, so we borrow its timings.
 *
 * Built for flaky mobile networks: requests time out, transient failures are
 * retried with backoff, and a failed load retries itself when the device comes
 * back online. The service worker caches both responses, so a surah that has
 * been opened once also works offline.
 */

export interface AyahTiming {
  /** 0 is the opening isti'adha/basmala before ayah 1 — it has no translation */
  ayah: number;
  /** Seconds */
  start: number;
  end: number;
}

export type TranslationStatus = "loading" | "ready" | "error";

/** Our reciter ids → mp3quran `read` ids for the same recordings */
const MP3QURAN_READ_IDS: Record<number, number> = {
  1: 123, // Mishary Rashid Al Afasy
  2: 4, // Abu Bakr Al Shatri
  3: 86, // Nasser Al Qatami
  4: 92, // Yasser Al Dosari
  5: 89, // Hani Ar Rifai
};

const REQUEST_TIMEOUT_MS = 10_000;
const RETRY_DELAYS_MS = [1_000, 3_000];

// Module-level caches so reopening the sheet or replaying a surah is instant.
// They hold promises so concurrent callers share one request; failures are
// evicted so the next attempt refetches.
const translationCache = new Map<number, Promise<string[]>>();
const timingCache = new Map<string, Promise<AyahTiming[]>>();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJson = async (url: string): Promise<unknown> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) {
      // No point burning retries while the device knows it is offline — the
      // hook retries on the `online` event instead
      if (!navigator.onLine) break;
      await wait(RETRY_DELAYS_MS[attempt - 1]);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
};

const cached = <K, V>(cache: Map<K, Promise<V>>, key: K, load: () => Promise<V>) => {
  const existing = cache.get(key);
  if (existing) return existing;

  const promise = load();
  cache.set(key, promise);
  promise.catch(() => cache.delete(key));
  return promise;
};

const fetchTranslations = (surahNumber: number) =>
  cached(translationCache, surahNumber, async () => {
    const data = (await fetchJson(`https://quranapi.pages.dev/api/${surahNumber}.json`)) as {
      english?: unknown;
    };
    if (!Array.isArray(data.english)) throw new Error("Malformed translation response");
    return data.english as string[];
  });

const fetchTimings = (surahNumber: number, readId: number) =>
  cached(timingCache, `${readId}-${surahNumber}`, async () => {
    const data = await fetchJson(
      `https://www.mp3quran.net/api/v3/ayat_timing?surah=${surahNumber}&read=${readId}`
    );
    if (!Array.isArray(data) || data.length === 0) throw new Error("Malformed timing response");
    return (data as { ayah: number; start_time: number; end_time: number }[]).map((t) => ({
      ayah: t.ayah,
      start: t.start_time / 1000,
      end: t.end_time / 1000,
    }));
  });

export function useAyahTranslations(surahNumber: number, reciterId: number) {
  const [translations, setTranslations] = useState<string[]>([]);
  const [timings, setTimings] = useState<AyahTiming[]>([]);
  const [status, setStatus] = useState<TranslationStatus>("loading");
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    const readId = MP3QURAN_READ_IDS[reciterId];
    let cancelled = false;

    setTranslations([]);
    setTimings([]);
    setStatus("loading");

    if (!readId) {
      setStatus("error");
      return;
    }

    Promise.all([fetchTranslations(surahNumber), fetchTimings(surahNumber, readId)])
      .then(([english, ayahTimings]) => {
        if (cancelled) return;
        setTranslations(english);
        setTimings(ayahTimings);
        setStatus("ready");
      })
      .catch((error) => {
        console.error("Error fetching ayah translations:", error);
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [surahNumber, reciterId, attempt]);

  // Recover by itself once the connection is back
  useEffect(() => {
    if (status !== "error") return;
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [status, retry]);

  return { translations, timings, status, retry };
}
