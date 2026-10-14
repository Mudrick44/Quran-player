import { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";
import { useMediaSession } from "../hooks/useMediaSession";
import { useDownloads } from "./DownloadsContext";
import { useToast } from "./ToastContext";
import { downloadKey, getDownloadedAudio } from "../api/downloadStore";
import { RECITERS, type ReciterInfo } from "../data/reciters";

/** A playback failure whose message is fit to show the user. */
class PlaybackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlaybackError";
  }
}

export interface SurahInfo {
  number: number;
  name: string;
  nameArabic: string;
  totalAyah: number;
}

export type { ReciterInfo };

interface PlayerContextType {
  currentSurah: SurahInfo | null;
  currentReciter: ReciterInfo;
  availableReciters: ReciterInfo[];
  audioSrc: string;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  autoPlay: boolean;
  currentPlaylist: SurahInfo[] | null;
  surahList: SurahInfo[];
  /** Plays with the current reciter unless another is given. */
  playSurah: (surah: SurahInfo, reciter?: ReciterInfo) => void;
  playSurahFromPlaylist: (surah: SurahInfo, playlist: SurahInfo[], reciter?: ReciterInfo) => void;
  setPlaylist: (playlist: SurahInfo[] | null) => void;
  setSurahList: (surahs: SurahInfo[]) => void;
  changeReciter: (reciter: ReciterInfo) => void;
  togglePlay: () => void;
  toggleAutoPlay: () => void;
  pause: () => void;
  play: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  playNext: () => void;
  playPrevious: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

interface PlayerProviderProps {
  children: ReactNode;
}

export const PlayerProvider = ({ children }: PlayerProviderProps) => {
  const [currentSurah, setCurrentSurah] = useState<SurahInfo | null>(null);
  const [currentReciter, setCurrentReciter] = useState<ReciterInfo>(RECITERS[0]);
  const [audioSrc, setAudioSrc] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [currentPlaylist, setCurrentPlaylist] = useState<SurahInfo[] | null>(null);
  const [allSurahs, setAllSurahs] = useState<SurahInfo[]>([]);

  const { isDownloaded } = useDownloads();
  const { showToast } = useToast();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayRef = useRef(autoPlay);
  const playNextRef = useRef<() => void>(() => {});
  const reportAudioErrorRef = useRef<() => void>(() => {});
  /** Bumped on every load, so a slow load can't overwrite a newer one. */
  const loadRequestRef = useRef(0);

  // Keep refs in sync with state
  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const audio = audioRef.current;

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
      setIsLoading(false);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      // Auto-play next surah if enabled
      if (autoPlayRef.current) {
        playNextRef.current();
      }
    });

    audio.addEventListener("canplay", () => {
      setIsLoading(false);
    });

    audio.addEventListener("waiting", () => {
      setIsLoading(true);
    });

    // The stream dropped or the file couldn't be decoded
    audio.addEventListener("error", () => {
      // Clearing the source on unmount also fires this; that's not a failure
      if (!audio.getAttribute("src")) return;
      setIsPlaying(false);
      setIsLoading(false);
      reportAudioErrorRef.current();
    });

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, []);

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  /**
   * Where to play a surah from: the downloaded copy if there is one, otherwise
   * the stream. Throws a `PlaybackError` with a message for the user.
   */
  const resolveAudioSrc = async (surah: SurahInfo, reciterId: number): Promise<string> => {
    // Asks the store directly rather than the downloads list, which is still
    // empty for a moment after launch — exactly when an offline user taps play
    try {
      const blob = await getDownloadedAudio(downloadKey(reciterId, surah.number));
      if (blob) return URL.createObjectURL(blob);
    } catch (error) {
      // No storage, or a read failure: fall through to streaming if we can
      console.error("Error reading downloaded audio:", error);
    }

    if (!navigator.onLine) {
      throw new PlaybackError(
        `You're offline. Download ${surah.name} to listen without internet.`
      );
    }

    try {
      const response = await fetch(
        `https://quranapi.pages.dev/api/audio/${surah.number}.json`
      );
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const data = await response.json();

      const url =
        data[reciterId]?.url ?? (Object.values(data)[0] as { url?: string } | undefined)?.url;
      if (url) return url;
    } catch (error) {
      console.error("Error fetching audio:", error);
    }

    throw new PlaybackError(`Couldn't load ${surah.name}. Check your connection and try again.`);
  };

  /** Swaps the audio element's source, releasing the previous downloaded file. */
  const setAudioElementSrc = (src: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.src.startsWith("blob:")) URL.revokeObjectURL(audio.src);
    audio.src = src;
    setAudioSrc(src);
  };

  /** play() rejects if the source fails or the browser blocks autoplay. */
  const startPlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setIsPlaying(true);
    audio.play().catch((error: unknown) => {
      // A newer load interrupted this one; that load reports for itself
      if (error instanceof DOMException && error.name === "AbortError") return;
      setIsPlaying(false);
      setIsLoading(false);
    });
  };

  const reportPlaybackError = (error: unknown, retry: () => void) => {
    const message =
      error instanceof PlaybackError ? error.message : "Something went wrong. Please try again.";
    showToast(message, {
      tone: "error",
      // Retrying won't help offline; the message already says what will
      action: navigator.onLine ? { label: "Retry", onClick: retry } : undefined,
    });
  };

  /**
   * The surah and reciter only become current once their audio is in hand.
   * If loading fails, whatever was playing carries on under its own title,
   * instead of the player naming one surah while holding another's audio.
   */
  const playSurah = async (
    surah: SurahInfo,
    reciter: ReciterInfo = currentReciter,
    /** Becomes the active playlist on success; left alone when omitted */
    playlist?: SurahInfo[] | null
  ) => {
    const request = ++loadRequestRef.current;
    setIsLoading(true);

    try {
      const src = await resolveAudioSrc(surah, reciter.id);
      // The user picked something else while this was loading
      if (request !== loadRequestRef.current) {
        if (src.startsWith("blob:")) URL.revokeObjectURL(src);
        return;
      }
      setCurrentSurah(surah);
      if (reciter.id !== currentReciter.id) setCurrentReciter(reciter);
      if (playlist !== undefined) setCurrentPlaylist(playlist);
      // Don't show the previous track's position against this one
      setCurrentTime(0);
      setDuration(0);
      setAudioElementSrc(src);
      startPlayback();
    } catch (error) {
      if (request !== loadRequestRef.current) return;
      setIsLoading(false);
      reportPlaybackError(error, () => playSurah(surah, reciter, playlist));
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentSurah) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (!audioRef.current.src || audioRef.current.error) {
      // Nothing loaded, or the last load failed: load it again
      playSurah(currentSurah);
    } else {
      startPlayback();
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const play = () => {
    if (audioRef.current && currentSurah) startPlayback();
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleAutoPlay = () => {
    setAutoPlay((prev) => !prev);
  };

  const setPlaylist = (playlist: SurahInfo[] | null) => {
    setCurrentPlaylist(playlist);
  };

  const setSurahList = (surahs: SurahInfo[]) => {
    setAllSurahs(surahs);
  };

  const playSurahFromPlaylist = (
    surah: SurahInfo,
    playlist: SurahInfo[],
    reciter?: ReciterInfo
  ) => {
    playSurah(surah, reciter, playlist);
  };

  /** Metadata for a surah number, with a placeholder until the list loads. */
  const surahByNumber = (number: number): SurahInfo =>
    allSurahs[number - 1] ?? {
      number,
      name: `Surah ${number}`,
      nameArabic: "",
      totalAyah: currentSurah?.totalAyah ?? 0,
    };

  /**
   * Every other surah in the order next/previous would reach them, wrapping
   * around: through the active playlist, or through all 114 in order.
   */
  const surahsInDirection = (direction: 1 | -1): SurahInfo[] => {
    if (!currentSurah) return [];

    if (currentPlaylist && currentPlaylist.length > 0) {
      const currentIndex = currentPlaylist.findIndex(
        (s) => s.number === currentSurah.number
      );
      if (currentIndex !== -1) {
        const length = currentPlaylist.length;
        // A one-surah playlist repeats, as it always has
        if (length === 1) return [currentPlaylist[0]];
        return Array.from(
          { length: length - 1 },
          (_, step) => currentPlaylist[(currentIndex + direction * (step + 1) + length * 2) % length]
        );
      }
    }

    return Array.from({ length: 113 }, (_, step) => {
      const number = ((currentSurah.number - 1 + direction * (step + 1) + 114 * 2) % 114) + 1;
      return surahByNumber(number);
    });
  };

  /**
   * Online, that's simply the adjacent surah. Offline, it skips ahead to the
   * nearest one that's downloaded, so a playlist keeps going without internet.
   */
  const playAdjacent = (direction: 1 | -1) => {
    const candidates = surahsInDirection(direction);
    if (candidates.length === 0) return;

    if (navigator.onLine) {
      playSurah(candidates[0]);
      return;
    }

    const playable = candidates.find((s) => isDownloaded(currentReciter.id, s.number));
    if (playable) {
      playSurah(playable);
    } else {
      setIsPlaying(false);
      showToast(
        `You're offline and no other surahs are downloaded for ${currentReciter.name}.`,
        { tone: "error" }
      );
    }
  };

  const playNext = () => playAdjacent(1);
  const playPrevious = () => playAdjacent(-1);

  // Keep the refs in sync so the audio element's handlers can call them
  useEffect(() => {
    playNextRef.current = playNext;
    reportAudioErrorRef.current = () => {
      if (!currentSurah) return;
      const surah = currentSurah;
      showToast(
        navigator.onLine
          ? `Couldn't play ${surah.name}. Please try again.`
          : `You're offline. Download ${surah.name} to listen without internet.`,
        {
          tone: "error",
          action: navigator.onLine
            ? { label: "Retry", onClick: () => playSurah(surah) }
            : undefined,
        }
      );
    };
  });

  const changeReciter = async (reciter: ReciterInfo) => {
    const previousReciter = currentReciter;
    setCurrentReciter(reciter);

    // If a surah is currently loaded, load the new reciter's recording of it
    const audio = audioRef.current;
    if (!currentSurah || !audio) return;

    const surah = currentSurah;
    const wasPlaying = isPlaying;
    const currentPosition = audio.currentTime;
    const request = ++loadRequestRef.current;

    setIsLoading(true);

    try {
      const src = await resolveAudioSrc(surah, reciter.id);
      if (request !== loadRequestRef.current) {
        if (src.startsWith("blob:")) URL.revokeObjectURL(src);
        return;
      }

      setAudioElementSrc(src);

      // Wait for audio to be ready before seeking. Runs once — left attached,
      // it would rewind every later track to this position.
      audio.addEventListener(
        "loadedmetadata",
        () => {
          if (request !== loadRequestRef.current) return;
          // Try to resume from similar position (if within duration)
          if (currentPosition < audio.duration) {
            audio.currentTime = currentPosition;
          }
          if (wasPlaying) startPlayback();
        },
        { once: true }
      );
    } catch (error) {
      if (request !== loadRequestRef.current) return;
      setIsLoading(false);
      // Keep playing the reciter we have rather than stopping
      setCurrentReciter(previousReciter);
      showToast(
        error instanceof PlaybackError && !navigator.onLine
          ? `You're offline. Download ${surah.name} with ${reciter.name} to switch to them without internet.`
          : `Couldn't switch to ${reciter.name}. Check your connection and try again.`,
        { tone: "error" }
      );
    }
  };

  // Declared after the audio element is created, so it can attach to it
  useMediaSession({
    audioRef,
    currentSurah,
    reciterName: currentReciter.name,
    isPlaying,
    play,
    pause,
    playNext,
    playPrevious,
    seekTo,
  });

  return (
    <PlayerContext.Provider
      value={{
        currentSurah,
        currentReciter,
        availableReciters: RECITERS,
        audioSrc,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        volume,
        isMuted,
        autoPlay,
        currentPlaylist,
        surahList: allSurahs,
        playSurah,
        playSurahFromPlaylist,
        setPlaylist,
        setSurahList,
        changeReciter,
        togglePlay,
        toggleAutoPlay,
        pause,
        play,
        seekTo,
        setVolume,
        toggleMute,
        playNext,
        playPrevious,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};
