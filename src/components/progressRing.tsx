/**
 * Circular progress with a stop square in the middle, as in Apple Music.
 * Without a known size it spins instead.
 */
const ProgressRing = ({ progress, size }: { progress: number | null; size: number }) => {
  const stroke = 2;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = progress ?? 0.25;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={progress === null ? "animate-spin" : undefined}
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--text-tertiary)"
        strokeOpacity={0.4}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--accent-primary)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - fraction)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 250ms linear" }}
      />
      <rect
        x={size / 2 - size * 0.14}
        y={size / 2 - size * 0.14}
        width={size * 0.28}
        height={size * 0.28}
        rx={1}
        fill="var(--accent-primary)"
      />
    </svg>
  );
};

export default ProgressRing;
