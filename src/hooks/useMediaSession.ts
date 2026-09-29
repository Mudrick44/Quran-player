import { useEffect, useRef, RefObject } from "react";
import type { SurahInfo } from "../context/PlayerContext";
import { useSurahArtwork } from "./useSurahArtwork";

interface MediaSessionOptions {
  audioRef: RefObject<HTMLAudioElement | null>;
  currentSurah: SurahInfo | null;
  reciterName: string;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seekTo: (time: number) => void;
}

const APP_ICON = { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" };

/**
 * Lock-screen, notification-shade and headphone controls.
 *
 * Seek-forward/backward handlers are deliberately not registered: when they
 * are, iOS swaps the next/previous track buttons for ±10s skip buttons, and
 * moving between surahs is the more useful control here.
 */
export const useMediaSession = ({
  audioRef,
  currentSurah,
  reciterName,
  isPlaying,
  ...actions
}: MediaSessionOptions) => {
  const supported = typeof navigator !== "undefined" && "mediaSession" in navigator;
  const artwork = useSurahArtwork(currentSurah?.number ?? 1, supported && !!currentSurah);

  // Handlers are registered once, so read the latest actions through a ref
  const actionsRef = useRef(actions);
  useEffect(() => {
    actionsRef.current = actions;
  });

  useEffect(() => {
    if (!supported) return;

    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => actionsRef.current.play()],
      ["pause", () => actionsRef.current.pause()],
      ["stop", () => actionsRef.current.pause()],
      ["nexttrack", () => actionsRef.current.playNext()],
      ["previoustrack", () => actionsRef.current.playPrevious()],
      [
        "seekto",
        (details) => {
          if (details.seekTime !== undefined) actionsRef.current.seekTo(details.seekTime);
        },
      ],
    ];

    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Older browsers throw for actions they don't know
      }
    }

    return () => {
      for (const [action] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // See above
        }
      }
    };
  }, [supported]);

  // What the lock screen shows
  useEffect(() => {
    if (!supported) return;

    if (!currentSurah) {
      navigator.mediaSession.metadata = null;
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSurah.name,
      artist: reciterName,
      album: "Quran Player",
      artwork: [{ src: new URL(artwork.src, document.baseURI).href }, APP_ICON],
    });
  }, [supported, currentSurah, reciterName, artwork.src]);

  useEffect(() => {
    if (!supported) return;
    navigator.mediaSession.playbackState = currentSurah
      ? isPlaying
        ? "playing"
        : "paused"
      : "none";
  }, [supported, currentSurah, isPlaying]);

  // Keeps the lock-screen scrubber accurate. The OS extrapolates between
  // updates, so this only needs to run when the timeline jumps.
  useEffect(() => {
    const audio = audioRef.current;
    if (!supported || !audio) return;

    const updatePosition = () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: Math.min(audio.currentTime, audio.duration),
        });
      } catch {
        // Throws on out-of-range values mid source change
      }
    };

    const events = ["loadedmetadata", "play", "pause", "seeked", "ratechange"];
    events.forEach((event) => audio.addEventListener(event, updatePosition));
    return () => events.forEach((event) => audio.removeEventListener(event, updatePosition));
  }, [supported, audioRef]);
};
