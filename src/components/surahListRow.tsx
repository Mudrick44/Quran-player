import { PlayIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { usePlayer } from "../context/PlayerContext";
import { useSurahDuration } from "../api/fetchSurahDuration";
import { formatDuration } from "../utils/formatTime";
import NowPlayingIndicator from "./nowPlayingIndicator";

interface SurahListRowSurah {
  number: number;
  name: string;
  nameArabic: string;
  totalAyah: number;
}

interface SurahListRowProps {
  index: number;
  surah: SurahListRowSurah;
  /** This row is the loaded track — whether or not it is paused. */
  isActive: boolean;
  onPlay: () => void;
  onRemove?: () => void;
}

const SurahListRow: React.FC<SurahListRowProps> = ({
  index,
  surah,
  isActive,
  onPlay,
  onRemove,
}) => {
  const { currentReciter, isPlaying } = usePlayer();
  const duration = useSurahDuration(surah.number, currentReciter.id);

  return (
    <div
      onClick={onPlay}
      className="group flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all"
      style={{
        backgroundColor: isActive ? "var(--sidebar-selected)" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "var(--sidebar-selected)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      {/* Track number, replaced by the equalizer on the active track */}
      <div
        className="w-6 flex items-center justify-center flex-shrink-0 text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        {isActive ? <NowPlayingIndicator isAnimating={isPlaying} /> : index + 1}
      </div>

      {/* Surah Number Badge */}
      <div
        className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 text-sm font-semibold"
        style={{
          backgroundColor: isActive
            ? "var(--accent-primary)"
            : "var(--sidebar-selected)",
          color: isActive ? "white" : "var(--text-primary)",
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
              color: isActive
                ? "var(--accent-primary)"
                : "var(--text-primary)",
            }}
          >
            {surah.name}
          </h4>
          <span
            className="text-base font-arabic"
            style={{
              color: isActive
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

      {/*
        Actions sit between the name and the duration so the duration is always
        the last thing in the row — flush right, whether or not the hover-only
        buttons are visible.
      */}
      <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
        {/* Desktop-only: on touch the whole row is already the play target */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="hidden md:block p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "var(--text-primary)" }}
          aria-label={`Play ${surah.name}`}
        >
          <PlayIcon className="w-4 h-4" />
        </button>

        {/* Always visible on touch, where there is no hover to reveal it */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1.5 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--text-secondary)" }}
            aria-label={`Remove ${surah.name} from playlist`}
            title="Remove from playlist"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}

        <span
          className="text-sm tabular-nums w-12 text-right"
          style={{ color: "var(--text-secondary)" }}
        >
          {formatDuration(duration)}
        </span>
      </div>
    </div>
  );
};

export default SurahListRow;
