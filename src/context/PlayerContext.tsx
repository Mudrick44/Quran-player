import { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";

interface SurahInfo {
  number: number;
  name: string;
  nameArabic: string;
  totalAyah: number;
}

interface ReciterInfo {
  id: number;
  name: string;
}

// Available reciters from the API
const AVAILABLE_RECITERS: ReciterInfo[] = [
  { id: 1, name: "Mishary Rashid Al Afasy" },
  { id: 2, name: "Abu Bakr Al Shatri" },
  { id: 3, name: "Nasser Al Qatami" },
  { id: 4, name: "Yasser Al Dosari" },
  { id: 5, name: "Hani Ar Rifai" },
];

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
  playSurah: (surah: SurahInfo) => void;
  playSurahFromPlaylist: (surah: SurahInfo, playlist: SurahInfo[]) => void;
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
  const [currentReciter, setCurrentReciter] = useState<ReciterInfo>({
    id: 1,
    name: "Mishary Rashid Al Afasy",
  });
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayRef = useRef(autoPlay);
  const playNextRef = useRef<() => void>(() => {});

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

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const fetchAudioUrl = async (surahNumber: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://quranapi.pages.dev/api/audio/${surahNumber}.json`
      );
      const data = await response.json();

      // Get audio for the current reciter (default to reciter 1 - Mishary)
      const reciterData = data[currentReciter.id];
      if (reciterData && reciterData.url) {
        return reciterData.url;
      }

      // Fallback to first available reciter
      const firstReciter = Object.values(data)[0] as { url: string };
      return firstReciter?.url || "";
    } catch (error) {
      console.error("Error fetching audio:", error);
      return "";
    }
  };

  const playSurah = async (surah: SurahInfo) => {
    setIsLoading(true);
    setCurrentSurah(surah);

    const url = await fetchAudioUrl(surah.number);
    if (url && audioRef.current) {
      setAudioSrc(url);
      audioRef.current.src = url;
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentSurah) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const play = () => {
    if (audioRef.current && currentSurah) {
      audioRef.current.play();
      setIsPlaying(true);
    }
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

  const playSurahFromPlaylist = (surah: SurahInfo, playlist: SurahInfo[]) => {
    setCurrentPlaylist(playlist);
    playSurah(surah);
  };

  const playNext = () => {
    if (!currentSurah) return;

    // If playing from a playlist, follow playlist order
    if (currentPlaylist && currentPlaylist.length > 0) {
      const currentIndex = currentPlaylist.findIndex(
        (s) => s.number === currentSurah.number
      );

      if (currentIndex !== -1) {
        // Get next in playlist, loop to start if at end
        const nextIndex = (currentIndex + 1) % currentPlaylist.length;
        playSurah(currentPlaylist[nextIndex]);
        return;
      }
    }

    // Sequential playback (not in playlist)
    if (currentSurah.number >= 114) {
      // Loop back to surah 1
      const firstSurah = allSurahs[0];
      if (firstSurah) {
        playSurah(firstSurah);
      } else {
        playSurah({ ...currentSurah, number: 1, name: "Al-Fatihah" });
      }
    } else {
      // Play next sequential surah with proper metadata
      const nextSurah = allSurahs[currentSurah.number]; // allSurahs is 0-indexed, so number gives us next
      if (nextSurah) {
        playSurah(nextSurah);
      } else {
        playSurah({
          ...currentSurah,
          number: currentSurah.number + 1,
          name: `Surah ${currentSurah.number + 1}`,
        });
      }
    }
  };

  const playPrevious = () => {
    if (!currentSurah) return;

    // If playing from a playlist, follow playlist order
    if (currentPlaylist && currentPlaylist.length > 0) {
      const currentIndex = currentPlaylist.findIndex(
        (s) => s.number === currentSurah.number
      );

      if (currentIndex !== -1) {
        // Get previous in playlist, loop to end if at start
        const prevIndex = currentIndex === 0
          ? currentPlaylist.length - 1
          : currentIndex - 1;
        playSurah(currentPlaylist[prevIndex]);
        return;
      }
    }

    // Sequential playback (not in playlist)
    if (currentSurah.number <= 1) {
      // Loop back to surah 114
      const lastSurah = allSurahs[113];
      if (lastSurah) {
        playSurah(lastSurah);
      } else {
        playSurah({ ...currentSurah, number: 114, name: "An-Nas" });
      }
    } else {
      // Play previous sequential surah with proper metadata
      const prevSurah = allSurahs[currentSurah.number - 2]; // -2 because 0-indexed and we want previous
      if (prevSurah) {
        playSurah(prevSurah);
      } else {
        playSurah({
          ...currentSurah,
          number: currentSurah.number - 1,
          name: `Surah ${currentSurah.number - 1}`,
        });
      }
    }
  };

  // Keep playNextRef in sync so ended handler can call it
  useEffect(() => {
    playNextRef.current = playNext;
  });

  const changeReciter = async (reciter: ReciterInfo) => {
    setCurrentReciter(reciter);

    // If a surah is currently loaded, re-fetch audio with new reciter
    if (currentSurah && audioRef.current) {
      const wasPlaying = isPlaying;
      const currentPosition = audioRef.current.currentTime;

      setIsLoading(true);

      try {
        const response = await fetch(
          `https://quranapi.pages.dev/api/audio/${currentSurah.number}.json`
        );
        const data = await response.json();

        const reciterData = data[reciter.id];
        if (reciterData && reciterData.url) {
          setAudioSrc(reciterData.url);
          audioRef.current.src = reciterData.url;

          // Wait for audio to be ready before seeking
          audioRef.current.onloadedmetadata = () => {
            if (audioRef.current) {
              // Try to resume from similar position (if within duration)
              const newDuration = audioRef.current.duration;
              if (currentPosition < newDuration) {
                audioRef.current.currentTime = currentPosition;
              }
              if (wasPlaying) {
                audioRef.current.play();
                setIsPlaying(true);
              }
            }
          };
        }
      } catch (error) {
        console.error("Error changing reciter:", error);
        setIsLoading(false);
      }
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSurah,
        currentReciter,
        availableReciters: AVAILABLE_RECITERS,
        audioSrc,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        volume,
        isMuted,
        autoPlay,
        currentPlaylist,
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
