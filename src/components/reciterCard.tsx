import { CheckCircleIcon, PlayIcon } from "@heroicons/react/24/solid";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import type { ReciterInfo } from "../data/reciters";
import { DEFAULT_SAMPLE_PASSAGE, type SamplePassage } from "../data/samplePassages";
import { usePlayer } from "../context/PlayerContext";
import { usePreview } from "../context/PreviewContext";
import ProgressRing from "./progressRing";

interface ReciterCardProps {
  reciter: ReciterInfo;
  passage?: SamplePassage;
  /** Opens this reciter's actions, such as making them the default */
  onShowActions: (reciter: ReciterInfo) => void;
}

const INDICATOR_SIZE = 36;

/** First and last name, e.g. "Hani Ar Rifai" → "HR" */
const initials = (name: string) => {
  const words = name.split(" ").filter(Boolean);
  return `${words[0]?.[0] ?? ""}${words.length > 1 ? words[words.length - 1][0] : ""}`;
};

/**
 * A reciter, with a tap to hear them recite a short passage and a ⋮ button
 * for their actions.
 *
 * The preview button covers the whole card, and the ⋮ button sits above it,
 * since one button can't hold another.
 */
const ReciterCard: React.FC<ReciterCardProps> = ({
  reciter,
  passage = DEFAULT_SAMPLE_PASSAGE,
  onShowActions,
}) => {
  const { preview, togglePreview } = usePreview();
  const { defaultReciter } = usePlayer();

  const status =
    preview?.reciterId === reciter.id && preview.passageId === passage.id
      ? preview.status
      : null;
  const isActive = status === "loading" || status === "playing";
  const isDefault = defaultReciter.id === reciter.id;

  const label =
    status === "loading"
      ? `Loading ${reciter.name} reciting ${passage.title}. Tap to cancel`
      : status === "playing"
        ? `Stop ${reciter.name} reciting ${passage.title}`
        : `Hear ${reciter.name} recite ${passage.title}`;

  return (
    <div
      className="relative flex items-center gap-4 p-4 rounded-xl transition-transform has-[>button:first-child:active]:scale-[0.98]"
      style={{ backgroundColor: "var(--sidebar-selected)" }}
    >
      <button
        type="button"
        onClick={() => togglePreview(reciter, passage)}
        className="absolute inset-0 rounded-xl"
        aria-label={label}
        aria-pressed={isActive}
        title={label}
      />

      <span
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-semibold pointer-events-none"
        style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)" }}
        aria-hidden
      >
        {initials(reciter.name)}
      </span>

      <div className="flex-1 min-w-0 pointer-events-none">
        <p className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>
          {reciter.name}
        </p>
        <p
          className="text-sm truncate"
          style={{ color: isActive ? "var(--accent-primary)" : "var(--text-secondary)" }}
        >
          {status === "playing"
            ? `Now reciting ${passage.title}`
            : `${passage.title} · ${passage.reference}`}
        </p>

        {isDefault && (
          <p
            className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold"
            style={{ color: "var(--accent-primary)" }}
          >
            <CheckCircleIcon className="w-4 h-4" aria-hidden />
            Default reciter
          </p>
        )}
      </div>

      <span
        className="flex-shrink-0 pointer-events-none"
        style={{ color: "var(--accent-primary)" }}
        aria-hidden
      >
        {isActive ? (
          <ProgressRing
            progress={status === "loading" ? null : (preview?.progress ?? 0)}
            size={INDICATOR_SIZE}
          />
        ) : (
          <span
            className="flex items-center justify-center rounded-full"
            style={{
              width: INDICATOR_SIZE,
              height: INDICATOR_SIZE,
              backgroundColor: "var(--accent-primary)",
              color: "white",
            }}
          >
            <PlayIcon className="w-4 h-4 ml-0.5" />
          </span>
        )}
      </span>

      <button
        type="button"
        onClick={() => onShowActions(reciter)}
        className="relative -mx-2 p-2 rounded-full flex-shrink-0 transition-transform active:scale-90"
        style={{ color: "var(--text-secondary)" }}
        aria-label={`More options for ${reciter.name}`}
        title="More options"
      >
        <EllipsisVerticalIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default ReciterCard;
