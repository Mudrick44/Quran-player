import { useEffect, useState } from "react";
import {
  ChevronDownIcon,
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  QueueListIcon,
  ArrowPathRoundedSquareIcon,
  MicrophoneIcon,
} from "@heroicons/react/24/solid";
import { usePlayer } from "../context/PlayerContext";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { usePresence } from "../hooks/usePresence";
import { useDragToDismiss } from "../hooks/useDragToDismiss";
import { useSurahArtwork } from "../hooks/useSurahArtwork";
import { EASE_OUT, OVERLAY_DURATION } from "../utils/motion";
import PlayerProgressBar from "./playerProgressBar";
import PlayerVolumeSlider from "./playerVolumeSlider";
import NowPlayingQueue from "./nowPlayingQueue";
import BottomDrawer from "./bottomDrawer";
import ReciterList from "./reciterList";

/** The swappable middle region. Add a panel here to extend the sheet. */
type Panel = "artwork" | "queue";

const PANEL_LABELS: Record<Panel, string> = {
  artwork: "Now Playing",
  queue: "Up Next",
};

interface NowPlayingSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Full-screen now-playing view for mobile. Rendered only below the `md`
 * breakpoint by SurahPlayer, which owns the open/closed state.
 */
const NowPlayingSheet: React.FC<NowPlayingSheetProps> = ({ isOpen, onClose }) => {
  const {
    currentSurah,
    currentReciter,
    isPlaying,
    isLoading,
    togglePlay,
    playNext,
    playPrevious,
    autoPlay,
    toggleAutoPlay,
    isMuted,
    volume,
    toggleMute,
    currentPlaylist,
  } = usePlayer();

  const [panel, setPanel] = useState<Panel>("artwork");
  const [isReciterDrawerOpen, setIsReciterDrawerOpen] = useState(false);

  const artwork = useSurahArtwork(currentSurah?.number ?? 1);
  const { isMounted, isVisible } = usePresence(isOpen, OVERLAY_DURATION);
  const { offset, isDragging, handlers, reset } = useDragToDismiss(onClose, 110);

  useBodyScrollLock(isMounted);

  // Reopen on the artwork rather than wherever the user left off, and clear a
  // left-over drag if it reopens mid exit transition
  useEffect(() => {
    if (isOpen) {
      reset();
      return;
    }
    setPanel("artwork");
    setIsReciterDrawerOpen(false);
  }, [isOpen, reset]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      // The drawer handles Escape itself while it is open
      if (event.key === "Escape" && !isReciterDrawerOpen) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isReciterDrawerOpen, onClose]);

  if (!isMounted || !currentSurah) return null;

  const iconButtonStyle = { color: "var(--text-secondary)" };
  const pressable = "transition-transform active:scale-90";

  return (
    <div
      className="md:hidden fixed inset-0 z-[60] flex flex-col"
      style={{
        backgroundColor: "var(--bg-primary)",
        transform: isVisible ? `translateY(${offset}px)` : "translateY(100%)",
        transition: isDragging ? "none" : `transform ${OVERLAY_DURATION}ms ${EASE_OUT}`,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Now playing"
    >
      {/* ---------- Header / drag handle ---------- */}
      <div className="flex-shrink-0 px-4 pt-3 pb-1" {...handlers}>
        <div
          className="mx-auto w-10 h-1 rounded-full mb-3"
          style={{ backgroundColor: "var(--text-tertiary)" }}
        />
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className={`p-2 -ml-2 rounded-full ${pressable}`}
            style={iconButtonStyle}
            aria-label="Close now playing"
          >
            <ChevronDownIcon className="w-6 h-6" />
          </button>

          <p
            className="text-[11px] uppercase tracking-[0.2em] font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            {PANEL_LABELS[panel]}
          </p>

          <button
            onClick={toggleAutoPlay}
            className={`p-2 -mr-2 rounded-full ${pressable}`}
            style={{
              color: autoPlay ? "var(--accent-primary)" : "var(--text-secondary)",
            }}
            aria-label={autoPlay ? "Disable auto-play" : "Enable auto-play"}
            aria-pressed={autoPlay}
          >
            <ArrowPathRoundedSquareIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ---------- Swappable panel (keyed so switching cross-fades) ---------- */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-3 scrollbar-hide">
        <div key={panel} className="animate-panel-in min-h-full">
          {panel === "artwork" ? (
            /* min-h-full + my-auto centres the art without clipping it in
               landscape, where the square can be taller than the panel */
            <div className="min-h-full flex justify-center py-2">
              <div className="relative my-auto w-full max-w-[380px] aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={artwork.src}
                  alt=""
                  className="w-full h-full object-cover transition-opacity duration-500"
                />
                <div
                  className="absolute inset-x-0 top-0 px-4 py-3 text-center"
                  style={{
                    background: "linear-gradient(to bottom, rgba(0,0,0,.6), transparent)",
                  }}
                >
                  <span className="text-[11px] uppercase tracking-[0.35em] text-white/90">
                    {currentSurah.name}
                  </span>
                </div>
                <div
                  className="absolute inset-x-0 bottom-0 px-4 py-4 text-center"
                  style={{
                    background: "linear-gradient(to top, rgba(0,0,0,.65), transparent)",
                  }}
                >
                  <span className="text-2xl font-arabic text-white block">
                    {currentSurah.nameArabic}
                  </span>
                  {artwork.credit && (
                    <span className="block mt-1 text-[10px] text-white/60 truncate">
                      {artwork.credit} · The Met
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <NowPlayingQueue onSelect={() => setPanel("artwork")} />
          )}
        </div>
      </div>

      {/* ---------- Controls (persist across panels) ---------- */}
      <div className="flex-shrink-0 px-6 pt-5 pb-8">
        {/* Track info */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2
              className="text-lg font-bold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {currentSurah.name}
            </h2>
            <p className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
              {currentReciter.name} &middot; {currentSurah.totalAyah} verses
              {currentPlaylist ? " · Playlist" : ""}
            </p>
          </div>

          <button
            onClick={() => setIsReciterDrawerOpen(true)}
            className={`p-2.5 rounded-full flex-shrink-0 ${pressable}`}
            style={{
              color: isReciterDrawerOpen
                ? "var(--accent-primary)"
                : "var(--text-secondary)",
              backgroundColor: "var(--sidebar-selected)",
            }}
            aria-label="Change reciter"
            aria-haspopup="dialog"
            aria-expanded={isReciterDrawerOpen}
          >
            <MicrophoneIcon className="w-5 h-5" />
          </button>
        </div>

        <PlayerProgressBar variant="detailed" />

        {/* Transport */}
        <div className="flex items-center justify-center gap-12 mt-5 mb-6">
          <button
            onClick={playPrevious}
            className={pressable}
            style={iconButtonStyle}
            aria-label="Previous"
          >
            <BackwardIcon className="w-9 h-9" />
          </button>

          <button
            onClick={togglePlay}
            disabled={isLoading}
            className={`disabled:opacity-60 ${pressable}`}
            style={{ color: "var(--text-primary)" }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isLoading ? (
              <div
                className="w-12 h-12 border-[3px] rounded-full animate-spin"
                style={{
                  borderColor: "var(--text-tertiary)",
                  borderTopColor: "transparent",
                }}
              />
            ) : isPlaying ? (
              <PauseIcon className="w-12 h-12" />
            ) : (
              <PlayIcon className="w-12 h-12" />
            )}
          </button>

          <button
            onClick={playNext}
            className={pressable}
            style={iconButtonStyle}
            aria-label="Next"
          >
            <ForwardIcon className="w-9 h-9" />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className={`flex-shrink-0 ${pressable}`}
            style={iconButtonStyle}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <SpeakerXMarkIcon className="w-4 h-4" />
            ) : (
              <SpeakerWaveIcon className="w-4 h-4" />
            )}
          </button>
          <PlayerVolumeSlider className="flex-1" />
          <SpeakerWaveIcon
            className="w-5 h-5 flex-shrink-0"
            style={iconButtonStyle}
            aria-hidden
          />
        </div>

        {/* Queue toggle */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() =>
              setPanel((current) => (current === "queue" ? "artwork" : "queue"))
            }
            className={`p-2 rounded-lg ${pressable}`}
            style={{
              color: panel === "queue" ? "var(--accent-primary)" : "var(--text-secondary)",
            }}
            aria-label="Show queue"
            aria-pressed={panel === "queue"}
          >
            <QueueListIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      <BottomDrawer
        isOpen={isReciterDrawerOpen}
        onClose={() => setIsReciterDrawerOpen(false)}
        title="Reciter"
      >
        <ReciterList onSelect={() => setIsReciterDrawerOpen(false)} />
      </BottomDrawer>
    </div>
  );
};

export default NowPlayingSheet;
