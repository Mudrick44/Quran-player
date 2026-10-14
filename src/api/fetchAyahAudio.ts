import { cached, fetchJson } from "./fetchJson";

/**
 * Audio for single ayahs. quranapi's per-ayah endpoint lists one recording per
 * reciter, under the same reciter ids as the full-surah audio.
 */

const urlCache = new Map<string, Promise<string>>();

export const fetchAyahAudioUrl = (surah: number, ayah: number, reciterId: number) =>
  cached(urlCache, `${reciterId}-${surah}-${ayah}`, async () => {
    const data = (await fetchJson(`https://quranapi.pages.dev/api/${surah}/${ayah}.json`)) as {
      audio?: Record<string, { url?: string }>;
    };
    const url = data.audio?.[reciterId]?.url;
    if (!url) throw new Error(`No recording of ${surah}:${ayah} for reciter ${reciterId}`);
    return url;
  });

/**
 * The whole file in one plain request, rather than letting the audio element
 * stream it with range requests. Ayahs are small, and a full 200 response is
 * what the service worker can cache for offline replays.
 */
export const fetchAyahAudio = async (url: string): Promise<Blob> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.blob();
};
