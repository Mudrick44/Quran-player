import { CheckCircleIcon, StarIcon } from "@heroicons/react/24/outline";
import type { ReciterInfo } from "../data/reciters";
import { usePlayer } from "../context/PlayerContext";
import { useToast } from "../context/ToastContext";
import BottomDrawer from "./bottomDrawer";

interface ReciterActionsSheetProps {
  /** Kept while closing, so the sheet doesn't empty mid exit transition */
  reciter: ReciterInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

/** What can be done with one reciter, opened from their card's ⋮ button. */
const ReciterActionsSheet: React.FC<ReciterActionsSheetProps> = ({
  reciter,
  isOpen,
  onClose,
}) => {
  const { defaultReciter, setDefaultReciter } = usePlayer();
  const { showToast } = useToast();

  const isDefault = reciter?.id === defaultReciter.id;

  const makeDefault = () => {
    if (!reciter) return;
    setDefaultReciter(reciter);
    onClose();
    showToast(`${reciter.name} is now your default reciter.`, { tone: "success" });
  };

  return (
    <BottomDrawer isOpen={isOpen} onClose={onClose} title={reciter?.name}>
      {isDefault ? (
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ color: "var(--text-secondary)" }}
        >
          <CheckCircleIcon className="w-6 h-6 flex-shrink-0" style={{ color: "var(--accent-primary)" }} />
          <span>Your default reciter</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={makeDefault}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-transform active:scale-[0.98]"
          style={{ color: "var(--text-primary)" }}
        >
          <StarIcon className="w-6 h-6 flex-shrink-0" style={{ color: "var(--accent-primary)" }} />
          <span>Set as Default Reciter</span>
        </button>
      )}
    </BottomDrawer>
  );
};

export default ReciterActionsSheet;
