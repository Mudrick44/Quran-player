import { PlayIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { usePlayer } from "../context/PlayerContext";
import { useSurahDuration } from "../api/fetchSurahDuration";

interface SurahListRowSurah {
  number: number;
  name: string;
  nameArabic: string;
  totalAyah: number;
}

interface SurahListRowProps {
  index: number;
  surah: SurahListRowSurah;
  isCurrentlyPlaying: boolean;
  onPlay: () => void;
  onRemove?: () => void;
}

const formatDuration = (seconds: number | null) => {
  if (seconds === null || isNaN(seconds)) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const SurahListRow: React.FC<SurahListRowProps> = ({
  index,
  surah,
  isCurrentlyPlaying,
  onPlay,
  onRemove,
}) => {
  const { currentReciter } = usePlayer();
  const duration = useSurahDuration(surah.number, currentReciter.id);

  return (
    <div
      onClick={onPlay}
      className="group flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all"
      style={{
        backgroundColor: isCurrentlyPlaying ? "var(--sidebar-selected)" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!isCurrentlyPlaying) {
          e.currentTarget.style.backgroundColor = "var(--sidebar-selected)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isCurrentlyPlaying) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      {/* Track number, replaced by a "now playing" dot */}
      <div
        className="w-6 flex items-center justify-center flex-shrink-0 text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        {isCurrentlyPlaying ? (
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--accent-primary)" }}
          />
        ) : (
          index + 1
        )}
      </div>

      {/* Surah Number Badge */}
      <div
        className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 text-sm font-semibold"
        style={{
          backgroundColor: isCurrentlyPlaying
            ? "var(--accent-primary)"
            : "var(--sidebar-selected)",
          color: isCurrentlyPlaying ? "white" : "var(--text-primary)",
        }}
      >
        {surah.number}
      </div>

      {/* Surah Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4
            className="font-medium truncate"
            style={{
              color: isCurrentlyPlaying
                ? "var(--accent-primary)"
                : "var(--text-primary)",
            }}
          >
            {surah.name}
          </h4>
          <span
            className="text-base font-arabic"
            style={{
              color: isCurrentlyPlaying
                ? "var(--accent-primary)"
                : "var(--text-primary)",
            }}
          >
            {surah.nameArabic}
          </span>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {surah.totalAyah} verses
        </p>
      </div>

      {/* Duration, hover play button, optional remove */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span
          className="text-sm tabular-nums w-12 text-right"
          style={{ color: "var(--text-secondary)" }}
        >
          {formatDuration(duration)}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "var(--text-primary)" }}
          aria-label={`Play ${surah.name}`}
        >
          <PlayIcon className="w-4 h-4" />
        </button>

        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--text-secondary)" }}
            aria-label={`Remove ${surah.name} from playlist`}
            title="Remove from playlist"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SurahListRow;
