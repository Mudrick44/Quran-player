/**
 * Apple-Music style equalizer bars marking the active track in a list.
 *
 * Each bar gets its own duration and a negative delay so they start partway
 * through their cycle — otherwise all four move in lockstep and read as one
 * block rather than an equalizer.
 */
const BARS = [
  { height: "55%", duration: "0.9s", delay: "-0.1s" },
  { height: "100%", duration: "1.15s", delay: "-0.45s" },
  { height: "75%", duration: "0.75s", delay: "-0.7s" },
  { height: "40%", duration: "1.05s", delay: "-0.25s" },
];

interface NowPlayingIndicatorProps {
  /** Bars animate while playing and hold their pose when paused. */
  isAnimating: boolean;
  /** Any CSS colour — override when the bars sit on artwork rather than a surface. */
  color?: string;
  className?: string;
}

const NowPlayingIndicator: React.FC<NowPlayingIndicatorProps> = ({
  isAnimating,
  color = "var(--accent-primary)",
  className = "",
}) => (
  <div
    className={`flex items-end justify-center gap-[2px] h-3.5 ${className}`}
    role="img"
    aria-label={isAnimating ? "Now playing" : "Paused"}
  >
    {BARS.map((bar, index) => (
      <span
        key={index}
        className={`w-[2px] rounded-full ${isAnimating ? "eq-bar" : ""}`}
        style={{
          height: bar.height,
          backgroundColor: color,
          animationDuration: bar.duration,
          animationDelay: bar.delay,
        }}
      />
    ))}
  </div>
);

export default NowPlayingIndicator;
