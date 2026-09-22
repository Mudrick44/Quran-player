import { useMemo } from "react";
import { usePlayer } from "../context/PlayerContext";
import SurahListRow from "./surahListRow";

/** How far ahead to look when playing sequentially rather than from a playlist. */
const SEQUENTIAL_LOOKAHEAD = 20;

interface NowPlayingQueueProps {
  /** Called after the user picks a track, so the sheet can return to the artwork. */
  onSelect?: () => void;
}

/**
 * "Up Next" for whatever the player is currently doing: the rest of the active
 * playlist (wrapping, the way playNext does), or the next surahs in order.
 */
const NowPlayingQueue: React.FC<NowPlayingQueueProps> = ({ onSelect }) => {
  const {
    currentSurah,
    currentPlaylist,
    surahList,
    playSurah,
    playSurahFromPlaylist,
    setPlaylist,
  } = usePlayer();

  const upNext = useMemo(() => {
    if (!currentSurah) return [];

    if (currentPlaylist && currentPlaylist.length > 0) {
      const index = currentPlaylist.findIndex((s) => s.number === currentSurah.number);
      if (index === -1) return currentPlaylist;
      // Mirror playNext: continue through the playlist, then wrap to the start.
      return [...currentPlaylist.slice(index + 1), ...currentPlaylist.slice(0, index)];
    }

    if (surahList.length === 0) return [];
    return Array.from({ length: Math.min(SEQUENTIAL_LOOKAHEAD, surahList.length - 1) }, (_, i) =>
      // currentSurah.number is 1-based, so it already points at the next entry
      surahList[(currentSurah.number + i) % surahList.length]
    ).filter(Boolean);
  }, [currentSurah, currentPlaylist, surahList]);

  const handlePlay = (surah: (typeof upNext)[number]) => {
    if (currentPlaylist && currentPlaylist.length > 0) {
      playSurahFromPlaylist(surah, currentPlaylist);
    } else {
      // Quick Picks / sequential mode keeps no playlist context
      setPlaylist(null);
      playSurah(surah);
    }
    onSelect?.();
  };

  if (upNext.length === 0) {
    return (
      <p className="text-sm text-center py-10" style={{ color: "var(--text-secondary)" }}>
        Nothing queued up.
      </p>
    );
  }

  return (
    <div className="space-y-1 pb-2">
      {upNext.map((surah, index) => (
        <SurahListRow
          key={`${surah.number}-${index}`}
          index={index}
          surah={surah}
          isActive={false}
          onPlay={() => handlePlay(surah)}
        />
      ))}
    </div>
  );
};

export default NowPlayingQueue;
