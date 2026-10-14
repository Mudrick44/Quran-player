import { PlayIcon } from "@heroicons/react/24/solid";
import type { ReciterInfo } from "../data/reciters";
import { DEFAULT_SAMPLE_PASSAGE, type SamplePassage } from "../data/samplePassages";
import { usePreview } from "../context/PreviewContext";
import ProgressRing from "./progressRing";

interface ReciterCardProps {
  reciter: ReciterInfo;
  passage?: SamplePassage;
}

const INDICATOR_SIZE = 36;

/** First and last name, e.g. "Hani Ar Rifai" → "HR" */
const initials = (name: string) => {
  const words = name.split(" ").filter(Boolean);
  return `${words[0]?.[0] ?? ""}${words.length > 1 ? words[words.length - 1][0] : ""}`;
};

/** A reciter, with a tap to hear them recite a short passage. */
const ReciterCard: React.FC<ReciterCardProps> = ({
  reciter,
  passage = DEFAULT_SAMPLE_PASSAGE,
}) => {
  const { preview, togglePreview } = usePreview();

  const status =
    preview?.reciterId === reciter.id && preview.passageId === passage.id
      ? preview.status
      : null;
  const isActive = status === "loading" || status === "playing";

  const label =
    status === "loading"
      ? `Loading ${reciter.name} reciting ${passage.title}. Tap to cancel`
      : status === "playing"
        ? `Stop ${reciter.name} reciting ${passage.title}`
        : `Hear ${reciter.name} recite ${passage.title}`;

  return (
    <button
      type="button"
      onClick={() => togglePreview(reciter, passage)}
      className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-transform active:scale-[0.98]"
      style={{ backgroundColor: "var(--sidebar-selected)" }}
      aria-label={label}
      aria-pressed={isActive}
      title={label}
    >
      <span
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-semibold"
        style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)" }}
        aria-hidden
      >
        {initials(reciter.name)}
      </span>

      <span className="flex-1 min-w-0">
        <span className="block font-semibold truncate" style={{ color: "var(--text-primary)" }}>
          {reciter.name}
        </span>
        <span
          className="block text-sm truncate"
          style={{ color: isActive ? "var(--accent-primary)" : "var(--text-secondary)" }}
        >
          {status === "playing"
            ? `Now reciting ${passage.title}`
            : `${passage.title} · ${passage.reference}`}
        </span>
      </span>

      <span className="flex-shrink-0" style={{ color: "var(--accent-primary)" }} aria-hidden>
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
    </button>
  );
};

export default ReciterCard;
