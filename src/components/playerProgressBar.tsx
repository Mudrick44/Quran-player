import { usePlayer } from "../context/PlayerContext";
import { formatTime, formatRemaining } from "../utils/formatTime";

interface PlayerProgressBarProps {
  /**
   * "bar"      – scrubber only, used under the bottom pill.
   * "detailed" – scrubber plus elapsed / remaining labels, used in the sheet.
   */
  variant?: "bar" | "detailed";
  className?: string;
}

const PlayerProgressBar: React.FC<PlayerProgressBarProps> = ({
  variant = "bar",
  className = "",
}) => {
  const { currentTime, duration, seekTo } = usePlayer();

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={className}>
      <div
        className="relative h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--border-secondary)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: "var(--accent-primary)",
          }}
        />
        {/* Transparent native range sits on top so dragging/keyboard both work */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step="any"
          value={currentTime}
          onChange={(e) => seekTo(parseFloat(e.target.value))}
          aria-label={`Seek, ${formatTime(currentTime)} of ${formatTime(duration)}`}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {variant === "detailed" && (
        <div
          className="flex items-center justify-between mt-2 text-xs tabular-nums"
          style={{ color: "var(--text-secondary)" }}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatRemaining(currentTime, duration)}</span>
        </div>
      )}
    </div>
  );
};

export default PlayerProgressBar;
