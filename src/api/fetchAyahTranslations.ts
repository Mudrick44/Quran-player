import { useCallback, useEffect, useState } from "react";
import { getText, saveText } from "./downloadStore";
import { cached, fetchJson } from "./fetchJson";

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

// Module-level caches so reopening the sheet or replaying a surah is instant.
const translationCache = new Map<number, Promise<string[]>>();
const timingCache = new Map<string, Promise<AyahTiming[]>>();

// Keys in the downloads store, where a downloaded surah keeps its own copy
const translationTextKey = (surahNumber: number) => `translation-${surahNumber}`;
const timingTextKey = (surahNumber: number, readId: number) => `timing-${readId}-${surahNumber}`;

const fetchTranslations = (surahNumber: number) =>
  cached(translationCache, surahNumber, async () => {
    const saved = await getText<string[]>(translationTextKey(surahNumber));
    if (saved) return saved;

    const data = (await fetchJson(`https://quranapi.pages.dev/api/${surahNumber}.json`)) as {
      english?: unknown;
    };
    if (!Array.isArray(data.english)) throw new Error("Malformed translation response");
    return data.english as string[];
  });

const fetchTimings = (surahNumber: number, readId: number) =>
  cached(timingCache, `${readId}-${surahNumber}`, async () => {
    const saved = await getText<AyahTiming[]>(timingTextKey(surahNumber, readId));
    if (saved) return saved;

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

/**
 * Keeps a copy of a surah's translation and timings alongside its downloaded
 * audio, so the synced translation works offline too. The service worker's
 * caches are capped and can evict these; the downloads store isn't.
 */
export const saveTranslationsForOffline = async (surahNumber: number, reciterId: number) => {
  const readId = MP3QURAN_READ_IDS[reciterId];

  // Each is saved on its own, so one failing doesn't lose the other
  const saves = [
    fetchTranslations(surahNumber).then((english) =>
      saveText(translationTextKey(surahNumber), english)
    ),
  ];
  if (readId) {
    saves.push(
      fetchTimings(surahNumber, readId).then((ayahTimings) =>
        saveText(timingTextKey(surahNumber, readId), ayahTimings)
      )
    );
  }

  const failed = (await Promise.allSettled(saves)).find((r) => r.status === "rejected");
  if (failed) throw (failed as PromiseRejectedResult).reason;
};

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
