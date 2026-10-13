import { ArrowDownCircleIcon } from "@heroicons/react/24/outline";
import {
  ArrowDownCircleIcon as ArrowDownCircleIconSolid,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";
import { usePlayer } from "../context/PlayerContext";
import type { SurahInfo } from "../context/PlayerContext";
import { useDownloads } from "../context/DownloadsContext";
import { downloadKey } from "../api/downloadStore";

interface DownloadButtonProps {
  surah: SurahInfo;
  /** Icon size in px */
  size?: number;
  className?: string;
}

const ERROR_COLOR = "#ff453a";

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

/**
 * Download control for one surah, with the reciter currently selected.
 * Lives inside clickable rows and cards, so it never lets a tap through to
 * the play handler underneath.
 */
const DownloadButton: React.FC<DownloadButtonProps> = ({ surah, size = 22, className = "" }) => {
  const { currentReciter } = usePlayer();
  const { getStatus, download, cancel, retry } = useDownloads();

  const status = getStatus(currentReciter.id, surah.number);
  const key = downloadKey(currentReciter.id, surah.number);
  const iconStyle = { width: size, height: size };

  if (status.state === "downloaded") {
    return (
      <span
        className={`inline-flex p-1.5 flex-shrink-0 ${className}`}
        style={{ color: "var(--accent-primary)" }}
        role="img"
        aria-label={`${surah.name} is downloaded`}
        title="Downloaded — available offline"
      >
        <ArrowDownCircleIconSolid style={iconStyle} />
      </span>
    );
  }

  const { label, onClick, content } = (() => {
    switch (status.state) {
      case "queued":
        return {
          label: `Waiting to download ${surah.name}. Tap to cancel`,
          onClick: () => cancel([key]),
          content: <ProgressRing progress={0} size={size} />,
        };
      case "downloading":
        return {
          label:
            status.progress === null
              ? `Downloading ${surah.name}. Tap to cancel`
              : `Downloading ${surah.name}, ${Math.round(status.progress * 100)}%. Tap to cancel`,
          onClick: () => cancel([key]),
          content: <ProgressRing progress={status.progress} size={size} />,
        };
      case "failed":
        return {
          label: `${status.error ?? `Couldn't download ${surah.name}.`} Tap to try again`,
          onClick: () => retry([key]),
          content: <ExclamationCircleIcon style={{ ...iconStyle, color: ERROR_COLOR }} />,
        };
      default:
        return {
          label: `Download ${surah.name}`,
          onClick: () => download(surah, currentReciter),
          content: <ArrowDownCircleIcon style={iconStyle} />,
        };
    }
  })();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex p-1.5 rounded-full flex-shrink-0 transition-transform active:scale-90 ${className}`}
      style={{ color: "var(--text-secondary)" }}
      aria-label={label}
      title={label}
    >
      {content}
    </button>
  );
};

export default DownloadButton;
