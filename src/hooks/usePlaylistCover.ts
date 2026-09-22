import { useEffect } from "react";
import { useCustomPlaylists } from "../context/PlaylistsContext";
import type { CustomPlaylist } from "../context/PlaylistsContext";
import { useSurahArtwork } from "./useSurahArtwork";

/**
 * Cover art for a user-created playlist, derived from its first surah.
 *
 * Once resolved, the URL is written back to the playlist in localStorage, so
 * later sessions render the banner straight from storage with no API call and
 * keep it even if the Met is unreachable.
 */
export const usePlaylistCover = (playlist: CustomPlaylist) => {
  const { setPlaylistCover } = useCustomPlaylists();

  const firstSurah = playlist.surahNumbers[0];
  const hasStoredCover = Boolean(playlist.coverImage);

  // Nothing to resolve if it is already stored, or the playlist is empty
  const artwork = useSurahArtwork(
    firstSurah ?? 1,
    !hasStoredCover && firstSurah !== undefined
  );

  useEffect(() => {
    if (hasStoredCover || artwork.isFallback || !artwork.src) return;
    setPlaylistCover(playlist.id, artwork.src);
  }, [hasStoredCover, artwork.isFallback, artwork.src, playlist.id, setPlaylistCover]);

  return {
    /** undefined for an empty playlist, so the caller can show its gradient. */
    src: firstSurah === undefined ? undefined : playlist.coverImage ?? artwork.src,
  };
};
