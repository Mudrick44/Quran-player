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
  playSurah: (surah: SurahInfo) => void;
  changeReciter: (reciter: ReciterInfo) => void;
  togglePlay: () => void;
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

  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      // Auto-play next surah
      playNext();
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

  const playNext = () => {
    if (currentSurah && currentSurah.number < 114) {
      // We'll need to fetch the next surah's info
      // For now, we'll just increment the number
      const nextNumber = currentSurah.number + 1;
      // This is a simplified version - in a full implementation,
      // you'd fetch the surah metadata too
      playSurah({
        ...currentSurah,
        number: nextNumber,
        name: `Surah ${nextNumber}`,
      });
    }
  };

  const playPrevious = () => {
    if (currentSurah && currentSurah.number > 1) {
      const prevNumber = currentSurah.number - 1;
      playSurah({
        ...currentSurah,
        number: prevNumber,
        name: `Surah ${prevNumber}`,
      });
    }
  };

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
        playSurah,
        changeReciter,
        togglePlay,
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
