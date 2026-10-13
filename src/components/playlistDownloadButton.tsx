import { ArrowDownCircleIcon, ArrowPathIcon, CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { usePlayer } from "../context/PlayerContext";
import type { SurahInfo } from "../context/PlayerContext";
import { useDownloads } from "../context/DownloadsContext";
import { downloadKey } from "../api/downloadStore";

interface PlaylistDownloadButtonProps {
  surahs: SurahInfo[];
  /**
   * Matches the playlist's Play All button: "outline" sits next to an accent
   * button on a page background, "light" next to a white one on artwork.
   */
  variant?: "outline" | "light";
}

/**
 * Downloads every surah in a playlist with the current reciter. The label
 * tracks progress across the whole playlist, and failures can be retried
 * from here without hunting for them row by row.
 */
const PlaylistDownloadButton: React.FC<PlaylistDownloadButtonProps> = ({
  surahs,
  variant = "outline",
}) => {
  const { currentReciter } = usePlayer();
  const { getStatus, downloadMany, cancel, retry } = useDownloads();

  const statuses = surahs.map((surah) => ({
    key: downloadKey(currentReciter.id, surah.number),
    ...getStatus(currentReciter.id, surah.number),
  }));

  const total = surahs.length;
  const downloaded = statuses.filter((s) => s.state === "downloaded").length;
  const pending = statuses.filter((s) => s.state === "queued" || s.state === "downloading");
  const failed = statuses.filter((s) => s.state === "failed");
  const isComplete = total > 0 && downloaded === total;
  const isDownloading = pending.length > 0;

  const buttonStyle =
    variant === "light"
      ? { backgroundColor: "rgba(255,255,255,0.18)", color: "white" }
      : { backgroundColor: "var(--sidebar-selected)", color: "var(--text-primary)" };

  const baseClass =
    "flex items-center gap-2 px-5 py-3 rounded-full font-semibold transition-all backdrop-blur-sm";

  if (isComplete) {
    return (
      <div className={baseClass} style={buttonStyle} role="status">
        <CheckCircleIcon className="w-5 h-5" style={{ color: variant === "light" ? "white" : "var(--accent-primary)" }} />
        Downloaded
      </div>
    );
  }

  if (isDownloading) {
    return (
      <div className="flex items-center gap-1">
        <div className={baseClass} style={buttonStyle} role="status" aria-live="polite">
          <div
            className="w-4 h-4 border-2 rounded-full animate-spin"
            style={{ borderColor: "currentColor", borderTopColor: "transparent" }}
            aria-hidden
          />
          Downloading {downloaded + 1 > total ? total : downloaded + 1} of {total}
        </div>
        <button
          onClick={() => cancel(pending.map((s) => s.key))}
          className="p-3 rounded-full transition-all hover:scale-105 backdrop-blur-sm"
          style={buttonStyle}
          aria-label="Cancel playlist download"
          title="Cancel download"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    );
  }

  if (failed.length > 0) {
    return (
      <button
        onClick={() => retry(failed.map((s) => s.key))}
        className={`${baseClass} hover:scale-105`}
        style={buttonStyle}
        title={`${failed.length} couldn't be downloaded`}
      >
        <ArrowPathIcon className="w-5 h-5" />
        Retry {failed.length} failed
      </button>
    );
  }

  return (
    <button
      onClick={() => downloadMany(surahs, currentReciter)}
      disabled={total === 0}
      className={`${baseClass} hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
      style={buttonStyle}
      aria-label={`Download ${downloaded > 0 ? "the rest of " : ""}this playlist with ${currentReciter.name}`}
    >
      <ArrowDownCircleIcon className="w-5 h-5" />
      {downloaded > 0 ? `Download ${total - downloaded} more` : "Download"}
    </button>
  );
};

export default PlaylistDownloadButton;
