import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { usePlayer } from "./PlayerContext";
import { useToast } from "./ToastContext";
import { fetchAyahAudio, fetchAyahAudioUrl } from "../api/fetchAyahAudio";
import type { ReciterInfo } from "../data/reciters";
import {
  DEFAULT_SAMPLE_PASSAGE,
  passageAyahs,
  type SamplePassage,
} from "../data/samplePassages";

/**
 * Short previews of a reciter's voice, on their own audio element.
 *
 * Kept apart from the player so a preview never touches the queue, the
 * now-playing view or the lock screen controls. The player pauses while a
 * preview plays and picks up where it was once the preview ends or is stopped.
 * Starting anything in the player ends the preview.
 */

/** `paused` only happens when the browser blocks playback; a tap resumes it */
export type PreviewStatus = "loading" | "playing" | "paused";

export interface Preview {
  reciterId: number;
  passageId: string;
  status: PreviewStatus;
  /** 0–1 through the whole passage */
  progress: number;
}

interface PreviewContextType {
  preview: Preview | null;
  /** Starts the preview, or stops it if it is already the one playing. */
  togglePreview: (reciter: ReciterInfo, passage?: SamplePassage) => void;
  stopPreview: () => void;
}

const PreviewContext = createContext<PreviewContextType | undefined>(undefined);

export const PreviewProvider = ({ children }: { children: ReactNode }) => {
  const { isPlaying, pause, play } = usePlayer();
  const { showToast } = useToast();
  const [preview, setPreview] = useState<Preview | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** Object URLs for the passage's ayahs, in order */
  const sourcesRef = useRef<string[]>([]);
  const ayahIndexRef = useRef(0);
  /** Whether the player was playing when the first preview started */
  const resumePlayerRef = useRef(false);
  const previewRef = useRef(preview);
  /** Bumped on every start and stop, so a slow load can't revive a stopped preview. */
  const requestRef = useRef(0);
  const isPlayerPlayingRef = useRef(isPlaying);
  const playRef = useRef(play);
  const onEndedRef = useRef<() => void>(() => {});

  useEffect(() => {
    previewRef.current = preview;
    playRef.current = play;
    isPlayerPlayingRef.current = isPlaying;
  });

  const releaseSources = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    sourcesRef.current.forEach((src) => URL.revokeObjectURL(src));
    sourcesRef.current = [];
  };

  const finish = ({ resumePlayer }: { resumePlayer: boolean }) => {
    requestRef.current++;
    releaseSources();
    setPreview(null);
    if (resumePlayer && resumePlayerRef.current) playRef.current();
    resumePlayerRef.current = false;
  };

  const playAyah = (index: number) => {
    const audio = audioRef.current;
    const src = sourcesRef.current[index];
    if (!audio || !src) return;

    ayahIndexRef.current = index;
    audio.src = src;
    audio
      .play()
      .then(() => setPreview((p) => p && { ...p, status: "playing" }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Usually the browser refusing to play without a fresh tap. Keep the
        // audio loaded so the next tap plays it straight away.
        setPreview((p) => p && { ...p, status: "paused" });
      });
  };

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      const count = sourcesRef.current.length;
      if (!count || !audio.duration) return;
      const progress = (ayahIndexRef.current + audio.currentTime / audio.duration) / count;
      setPreview((p) => p && { ...p, progress });
    });

    audio.addEventListener("ended", () => onEndedRef.current());

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      sourcesRef.current.forEach((src) => URL.revokeObjectURL(src));
      sourcesRef.current = [];
    };
  }, []);

  useEffect(() => {
    onEndedRef.current = () => {
      const next = ayahIndexRef.current + 1;
      if (next < sourcesRef.current.length) playAyah(next);
      else finish({ resumePlayer: true });
    };
  });

  // The user started something in the player: that wins over the preview
  useEffect(() => {
    if (isPlaying && previewRef.current) finish({ resumePlayer: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const startPreview = async (reciter: ReciterInfo, passage: SamplePassage) => {
    const request = ++requestRef.current;
    releaseSources();

    // Switching from one preview to another keeps the original decision
    // (read from refs: the toast's Retry calls this long after the tap)
    if (!previewRef.current) resumePlayerRef.current = isPlayerPlayingRef.current;
    if (isPlayerPlayingRef.current) pause();

    setPreview({ reciterId: reciter.id, passageId: passage.id, status: "loading", progress: 0 });

    try {
      const blobs = await Promise.all(
        passageAyahs(passage).map(async (ayah) =>
          fetchAyahAudio(await fetchAyahAudioUrl(passage.surah, ayah, reciter.id))
        )
      );
      // Stopped, or another preview started, while this was loading
      if (request !== requestRef.current) return;

      sourcesRef.current = blobs.map((blob) => URL.createObjectURL(blob));
      playAyah(0);
    } catch (error) {
      if (request !== requestRef.current) return;
      console.error("Error loading preview:", error);
      finish({ resumePlayer: true });
      showToast(
        navigator.onLine
          ? `Couldn't load ${reciter.name}'s recitation. Check your connection and try again.`
          : "You're offline. Previews you've already heard still play without internet.",
        {
          tone: "error",
          action: navigator.onLine
            ? { label: "Retry", onClick: () => startPreview(reciter, passage) }
            : undefined,
        }
      );
    }
  };

  const togglePreview = (reciter: ReciterInfo, passage: SamplePassage = DEFAULT_SAMPLE_PASSAGE) => {
    const isSame = preview?.reciterId === reciter.id && preview.passageId === passage.id;

    if (!isSame) {
      startPreview(reciter, passage);
    } else if (preview.status === "paused") {
      playAyah(ayahIndexRef.current);
    } else {
      finish({ resumePlayer: true });
    }
  };

  // Reads the ref so a caller holding an old copy, like a cleanup, still works
  const stopPreview = () => {
    if (previewRef.current) finish({ resumePlayer: true });
  };

  return (
    <PreviewContext.Provider value={{ preview, togglePreview, stopPreview }}>
      {children}
    </PreviewContext.Provider>
  );
};

export const usePreview = () => {
  const context = useContext(PreviewContext);
  if (context === undefined) {
    throw new Error("usePreview must be used within a PreviewProvider");
  }
  return context;
};
