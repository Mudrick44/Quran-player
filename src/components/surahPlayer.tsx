import { useState, useRef, useEffect } from "react";
import {
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ChevronUpIcon,
  CheckIcon,
  ArrowPathRoundedSquareIcon,
} from "@heroicons/react/24/solid";
import { usePlayer } from "../context/PlayerContext";
import { useIsDesktop } from "../hooks/useMediaQuery";
import PlayerProgressBar from "./playerProgressBar";
import PlayerVolumeSlider from "./playerVolumeSlider";
import NowPlayingSheet from "./nowPlayingSheet";

const SurahPlayer: React.FC = () => {
  const {
    currentSurah,
    currentReciter,
    availableReciters,
    isPlaying,
    isLoading,
    volume,
    isMuted,
    autoPlay,
    togglePlay,
    toggleAutoPlay,
    changeReciter,
    toggleMute,
    playNext,
    playPrevious,
  } = usePlayer();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showReciterDropdown, setShowReciterDropdown] = useState(false);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDesktop = useIsDesktop();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowReciterDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // The now-playing sheet is a mobile affordance; drop it if the viewport grows
  useEffect(() => {
    if (isDesktop) setIsNowPlayingOpen(false);
  }, [isDesktop]);

  // Nothing to expand into once playback is cleared
  useEffect(() => {
    if (!currentSurah) setIsNowPlayingOpen(false);
  }, [currentSurah]);

  const openNowPlaying = () => {
    if (!isDesktop) setIsNowPlayingOpen(true);
  };

  // Don't render if no surah is selected
  if (!currentSurah) {
    return (
      <div className="fixed bottom-3 md:bottom-4 left-3 right-3 md:left-[276px] md:right-4 z-50 flex justify-center pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-4xl rounded-full backdrop-blur-lg border shadow-lg px-6 py-3 flex items-center justify-center"
          style={{
            backgroundColor: "var(--player-bg, var(--bg-secondary))",
            borderColor: "var(--border-secondary)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Select a Surah to start listening
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-3 md:bottom-4 left-3 right-3 md:left-[276px] md:right-4 z-50 flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-4xl">
          {/* Pill */}
          <div
            className="flex items-center gap-2 sm:gap-3 md:gap-4 px-3 py-2 md:px-4 md:py-2.5 rounded-full backdrop-blur-lg border shadow-lg"
            style={{
              backgroundColor: "var(--player-bg, var(--bg-secondary))",
              borderColor: "var(--border-secondary)",
            }}
          >
            {/* Playback Controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={playPrevious}
                className="p-1.5 md:p-2 rounded-full transition-colors hover:scale-105"
                style={{ color: "var(--text-secondary)" }}
                aria-label="Previous"
              >
                <BackwardIcon className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              <button
                onClick={togglePlay}
                disabled={isLoading}
                className="p-2 md:p-2.5 rounded-full transition-all hover:scale-105 disabled:opacity-70 flex-shrink-0"
                style={{
                  backgroundColor: "var(--accent-primary)",
                  color: "white",
                }}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isLoading ? (
                  <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <PauseIcon className="w-4 h-4 md:w-5 md:h-5" />
                ) : (
                  <PlayIcon className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </button>

              <button
                onClick={playNext}
                className="p-1.5 md:p-2 rounded-full transition-colors hover:scale-105"
                style={{ color: "var(--text-secondary)" }}
                aria-label="Next"
              >
                <ForwardIcon className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              <button
                onClick={toggleAutoPlay}
                className="p-1.5 md:p-2 rounded-full transition-colors hover:scale-105"
                style={{
                  color: autoPlay ? "var(--accent-primary)" : "var(--text-secondary)",
                }}
                aria-label={autoPlay ? "Disable auto-play" : "Enable auto-play"}
                title={autoPlay ? "Auto-play: On" : "Auto-play: Off"}
              >
                <ArrowPathRoundedSquareIcon className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Track Info — tapping this expands the now-playing sheet on mobile */}
            <div
              className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 cursor-pointer md:cursor-default"
              onClick={openNowPlaying}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openNowPlaying();
                }
              }}
              role={isDesktop ? undefined : "button"}
              tabIndex={isDesktop ? undefined : 0}
              aria-label={isDesktop ? undefined : `Open now playing: ${currentSurah.name}`}
            >
              {/* Surah Icon */}
              <div
                className="w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "var(--sidebar-selected)" }}
              >
                <span
                  className="text-sm md:text-base font-bold"
                  style={{ color: "var(--accent-primary)" }}
                >
                  {currentSurah.number}
                </span>
              </div>

              {/* Track Details */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4
                    className="font-semibold text-sm truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {currentSurah.name}
                  </h4>
                  <span
                    className="text-sm font-arabic hidden lg:inline"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {currentSurah.nameArabic}
                  </span>
                </div>

                {/*
                  Mobile shows the reciter as a plain label so the whole block
                  stays one tap target; the sheet handles switching reciters.
                */}
                <p
                  className="md:hidden text-xs truncate"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {currentReciter.name}
                </p>

                {/* Reciter name with dropdown (desktop) */}
                <div className="relative hidden md:block" ref={dropdownRef}>
                  <button
                    onClick={() => setShowReciterDropdown(!showReciterDropdown)}
                    className="flex items-center gap-1 text-xs truncate hover:underline cursor-pointer transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span className="truncate">{currentReciter.name}</span>
                    <ChevronUpIcon
                      className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${
                        showReciterDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Reciter Dropdown */}
                  {showReciterDropdown && (
                    <div
                      className="absolute bottom-full left-0 mb-2 w-56 rounded-lg shadow-lg border overflow-hidden z-50"
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--border-secondary)",
                      }}
                    >
                      <div
                        className="px-3 py-2 text-xs font-semibold border-b"
                        style={{
                          color: "var(--text-secondary)",
                          borderColor: "var(--border-secondary)",
                        }}
                      >
                        Select Reciter
                      </div>
                      {availableReciters.map((reciter) => (
                        <button
                          key={reciter.id}
                          onClick={() => {
                            changeReciter(reciter);
                            setShowReciterDropdown(false);
                          }}
                          className="w-full px-3 py-2.5 text-left text-sm flex items-center justify-between hover:bg-opacity-50 transition-colors"
                          style={{
                            color: "var(--text-primary)",
                            backgroundColor:
                              currentReciter.id === reciter.id
                                ? "var(--sidebar-selected)"
                                : "transparent",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "var(--sidebar-selected)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              currentReciter.id === reciter.id
                                ? "var(--sidebar-selected)"
                                : "transparent")
                          }
                        >
                          <span className="truncate">{reciter.name}</span>
                          {currentReciter.id === reciter.id && (
                            <CheckIcon
                              className="w-4 h-4 flex-shrink-0"
                              style={{ color: "var(--accent-primary)" }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Volume */}
            <div
              className="hidden md:flex items-center gap-2 flex-shrink-0"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={toggleMute}
                className="p-2 rounded-full transition-colors"
                style={{ color: "var(--text-secondary)" }}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <SpeakerXMarkIcon className="w-5 h-5" />
                ) : (
                  <SpeakerWaveIcon className="w-5 h-5" />
                )}
              </button>

              <div
                className={`flex items-center transition-all duration-200 overflow-hidden ${
                  showVolumeSlider ? "w-24 opacity-100" : "w-0 opacity-0"
                }`}
              >
                <PlayerVolumeSlider className="w-full" />
              </div>
            </div>
          </div>

          {/* Thin progress bar under the pill */}
          <PlayerProgressBar className="mt-2 mx-4 md:mx-6" />
        </div>
      </div>

      {/* Mobile-only full-screen now playing view. The sheet handles its own
          exit transition, so it stays rendered until the animation finishes. */}
      {!isDesktop && (
        <NowPlayingSheet
          isOpen={isNowPlayingOpen}
          onClose={() => setIsNowPlayingOpen(false)}
        />
      )}
    </>
  );
};

export default SurahPlayer;
