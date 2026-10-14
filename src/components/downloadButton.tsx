import { ArrowDownCircleIcon } from "@heroicons/react/24/outline";
import {
  ArrowDownCircleIcon as ArrowDownCircleIconSolid,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";
import { usePlayer } from "../context/PlayerContext";
import type { SurahInfo } from "../context/PlayerContext";
import { useDownloads } from "../context/DownloadsContext";
import { downloadKey } from "../api/downloadStore";
import ProgressRing from "./progressRing";

interface DownloadButtonProps {
  surah: SurahInfo;
  /** Icon size in px */
  size?: number;
  className?: string;
}

const ERROR_COLOR = "#ff453a";

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
