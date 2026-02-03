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
} from "@heroicons/react/24/solid";
import { usePlayer } from "../context/PlayerContext";

const SurahPlayer: React.FC = () => {
  const {
    currentSurah,
    currentReciter,
    availableReciters,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    changeReciter,
    seekTo,
    setVolume,
    toggleMute,
    playNext,
    playPrevious,
  } = usePlayer();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showReciterDropdown, setShowReciterDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    seekTo(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Don't render if no surah is selected
  if (!currentSurah) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-lg"
        style={{
          backgroundColor: "var(--player-bg, var(--bg-secondary))",
          borderColor: "var(--border-color, rgba(255,255,255,0.1))",
        }}
      >
        <div className="flex items-center justify-center px-4 py-4 md:py-5">
          <p
            className="text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Select a Surah to start listening
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-lg"
      style={{
        backgroundColor: "var(--player-bg, var(--bg-secondary))",
        borderColor: "var(--border-color, rgba(255,255,255,0.1))",
      }}
    >
      {/* Progress bar - Full width at top */}
      <div className="absolute top-0 left-0 right-0 h-1 group cursor-pointer">
        <div
          className="h-full transition-all"
          style={{ backgroundColor: "var(--border-color, rgba(255,255,255,0.1))" }}
        >
          <div
            className="h-full transition-all"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: "var(--accent-color, #10b981)",
            }}
          />
        </div>
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleProgressChange}
          className="absolute top-0 left-0 w-full h-1 opacity-0 cursor-pointer"
        />
      </div>

      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
        {/* Left: Track Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-none md:w-1/4">
          {/* Album Art / Surah Icon */}
          <div
            className="w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--sidebar-selected)" }}
          >
            <span
              className="text-lg md:text-xl font-bold"
              style={{ color: "var(--accent-color, #10b981)" }}
            >
              {currentSurah.number}
            </span>
          </div>

          {/* Track Details */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4
                className="font-semibold text-sm md:text-base truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {currentSurah.name}
              </h4>
              <span
                className="text-sm md:text-base font-arabic hidden sm:inline"
                style={{ color: "var(--text-primary)" }}
              >
                {currentSurah.nameArabic}
              </span>
            </div>

            {/* Reciter name with dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowReciterDropdown(!showReciterDropdown)}
                className="flex items-center gap-1 text-xs md:text-sm truncate hover:underline cursor-pointer transition-colors"
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
                    borderColor: "var(--border-color, rgba(255,255,255,0.1))",
                  }}
                >
                  <div
                    className="px-3 py-2 text-xs font-semibold border-b"
                    style={{
                      color: "var(--text-secondary)",
                      borderColor: "var(--border-color, rgba(255,255,255,0.1))",
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
                          style={{ color: "var(--accent-color, #10b981)" }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: Controls */}
        <div className="flex flex-col items-center gap-1 md:gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Previous */}
            <button
              onClick={playPrevious}
              disabled={currentSurah.number <= 1}
              className="p-2 rounded-full transition-colors hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Previous"
            >
              <BackwardIcon className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="p-3 md:p-4 rounded-full transition-all hover:scale-105 disabled:opacity-70"
              style={{
                backgroundColor: "var(--accent-color, #10b981)",
                color: "white",
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <PauseIcon className="w-5 h-5 md:w-6 md:h-6" />
              ) : (
                <PlayIcon className="w-5 h-5 md:w-6 md:h-6" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={playNext}
              disabled={currentSurah.number >= 114}
              className="p-2 rounded-full transition-colors hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Next"
            >
              <ForwardIcon className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Time Display - Desktop */}
          <div
            className="hidden md:flex items-center gap-2 text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <div
              className="w-64 lg:w-96 h-1 rounded-full cursor-pointer relative group"
              style={{ backgroundColor: "var(--border-color, rgba(255,255,255,0.1))" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: "var(--accent-color, #10b981)",
                }}
              />
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleProgressChange}
                className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-3 opacity-0 cursor-pointer"
              />
            </div>
            <span className="w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume */}
        <div className="hidden md:flex items-center gap-2 justify-end flex-1 md:w-1/4">
          <div
            className="relative flex items-center gap-2"
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
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--accent-color, #10b981) ${
                    (isMuted ? 0 : volume) * 100
                  }%, var(--border-color, rgba(255,255,255,0.1)) ${
                    (isMuted ? 0 : volume) * 100
                  }%)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Mobile: Time Display */}
        <div
          className="md:hidden text-xs text-right min-w-[3rem]"
          style={{ color: "var(--text-secondary)" }}
        >
          {formatTime(currentTime)}
        </div>
      </div>
    </div>
  );
};

export default SurahPlayer;
