import { useEffect, useState } from "react";
import { usePlayer } from "../context/PlayerContext";
import { usePreview } from "../context/PreviewContext";
import { DEFAULT_SAMPLE_PASSAGE } from "../data/samplePassages";
import type { ReciterInfo } from "../data/reciters";
import ReciterCard from "./reciterCard";
import ReciterActionsSheet from "./reciterActionsSheet";

const RecitersSection: React.FC = () => {
  const { availableReciters } = usePlayer();
  const { stopPreview } = usePreview();
  // One sheet for the whole page. The reciter outlives closing it, so the
  // sheet keeps its content through the exit transition.
  const [actionsReciter, setActionsReciter] = useState<ReciterInfo | null>(null);
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const showActions = (reciter: ReciterInfo) => {
    setActionsReciter(reciter);
    setIsActionsOpen(true);
  };

  // A preview belongs to this page: leaving it shouldn't leave one playing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => stopPreview(), []);

  return (
    // Phones: 16px from the screen edges rather than the page's 32px, so the
    // cards have room for full names
    <div className="-mx-4 md:mx-0">
      <h2
        className="text-2xl font-bold mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        Reciters
      </h2>
      <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
        Tap a reciter to hear them recite {DEFAULT_SAMPLE_PASSAGE.title}.
      </p>

      {/* Columns stay wide enough for a full name; md loses width to the sidebar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
        {availableReciters.map((reciter) => (
          <ReciterCard key={reciter.id} reciter={reciter} onShowActions={showActions} />
        ))}
      </div>

      <ReciterActionsSheet
        reciter={actionsReciter}
        isOpen={isActionsOpen}
        onClose={() => setIsActionsOpen(false)}
      />
    </div>
  );
};

export default RecitersSection;
