import { CheckIcon } from "@heroicons/react/24/solid";
import { usePlayer } from "../context/PlayerContext";

interface ReciterListProps {
  /** Called after a reciter is picked, so the host drawer can close itself. */
  onSelect?: () => void;
}

const ReciterList: React.FC<ReciterListProps> = ({ onSelect }) => {
  const { availableReciters, currentReciter, changeReciter } = usePlayer();

  return (
    <div className="space-y-1">
      {availableReciters.map((reciter) => {
        const isActive = reciter.id === currentReciter.id;
        return (
          <button
            key={reciter.id}
            onClick={() => {
              changeReciter(reciter);
              onSelect?.();
            }}
            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl text-left transition-transform active:scale-[0.98]"
            style={{
              color: isActive ? "var(--accent-primary)" : "var(--text-primary)",
              backgroundColor: isActive ? "var(--sidebar-selected)" : "transparent",
            }}
            aria-pressed={isActive}
          >
            <span className="truncate">{reciter.name}</span>
            {isActive && <CheckIcon className="w-5 h-5 flex-shrink-0" />}
          </button>
        );
      })}
    </div>
  );
};

export default ReciterList;
