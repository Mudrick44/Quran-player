import { useEffect, useState } from "react";

// Module-level cache so switching between playlists/screens doesn't refetch
// the same reciter+surah duration over and over.
const durationCache = new Map<string, number>();

export function useSurahDuration(surahNumber: number, reciterId: number) {
  const cacheKey = `${reciterId}-${surahNumber}`;
  const [duration, setDuration] = useState<number | null>(
    durationCache.get(cacheKey) ?? null
  );

  useEffect(() => {
    const key = `${reciterId}-${surahNumber}`;
    const cached = durationCache.get(key);
    if (cached !== undefined) {
      setDuration(cached);
      return;
    }

    let cancelled = false;
    setDuration(null);

    const loadDuration = async () => {
      try {
        const response = await fetch(
          `https://quranapi.pages.dev/api/audio/${surahNumber}.json`
        );
        const data = await response.json();

        const reciterData = data[reciterId];
        const url = reciterData?.url ?? (Object.values(data)[0] as { url: string } | undefined)?.url;
        if (!url || cancelled) return;

        // preload="metadata" only pulls enough of the file to read duration
        const audio = new Audio();
        audio.preload = "metadata";
        audio.src = url;
        audio.addEventListener("loadedmetadata", () => {
          if (cancelled) return;
          durationCache.set(key, audio.duration);
          setDuration(audio.duration);
        });
      } catch (error) {
        console.error("Error loading surah duration:", error);
      }
    };

    loadDuration();

    return () => {
      cancelled = true;
    };
  }, [surahNumber, reciterId]);

  return duration;
}
