import { usePlayer } from "../context/PlayerContext";

interface PlayerVolumeSliderProps {
  className?: string;
}

/** Just the slider — each surface supplies its own speaker icons and layout. */
const PlayerVolumeSlider: React.FC<PlayerVolumeSliderProps> = ({ className = "" }) => {
  const { volume, isMuted, setVolume } = usePlayer();

  const level = isMuted ? 0 : volume;

  return (
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={level}
      onChange={(e) => setVolume(parseFloat(e.target.value))}
      aria-label="Volume"
      className={`player-range h-1 rounded-full appearance-none cursor-pointer ${className}`}
      style={{
        background: `linear-gradient(to right, var(--accent-primary) ${
          level * 100
        }%, var(--border-secondary) ${level * 100}%)`,
      }}
    />
  );
};

export default PlayerVolumeSlider;
