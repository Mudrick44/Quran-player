import { useEffect, useState } from "react";
import { getArtworkForSurah, Artwork } from "../api/fetchArtwork";
import { getSurahArtwork } from "../utils/surahArtwork";

/**
 * Resolves cover art for a surah.
 *
 * The bundled image is returned immediately so something is always on screen,
 * and the museum artwork replaces it once it resolves. If the API is offline,
 * blocked, or the object fails the content filter, the bundled image simply
 * stays — there is no broken or empty state.
 */
export const useSurahArtwork = (surahNumber: number, enabled = true) => {
  const [artwork, setArtwork] = useState<Artwork | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setArtwork(null);

    getArtworkForSurah(surahNumber)
      .then((result) => {
        if (!cancelled) setArtwork(result);
      })
      .catch(() => {
        // Fallback is already showing
      });

    return () => {
      cancelled = true;
    };
  }, [surahNumber, enabled]);

  return {
    src: artwork?.imageUrl ?? getSurahArtwork(surahNumber),
    /** Credit line for the museum piece, or null while showing the fallback. */
    credit: artwork
      ? [artwork.title, artwork.date].filter(Boolean).join(", ")
      : null,
    isFallback: artwork === null,
  };
};
