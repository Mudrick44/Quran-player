import { useEffect } from "react";
import { usePlayer } from "../context/PlayerContext";
import { usePreview } from "../context/PreviewContext";
import { DEFAULT_SAMPLE_PASSAGE } from "../data/samplePassages";
import ReciterCard from "./reciterCard";

const RecitersSection: React.FC = () => {
  const { availableReciters } = usePlayer();
  const { stopPreview } = usePreview();

  // A preview belongs to this page: leaving it shouldn't leave one playing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => stopPreview(), []);

  return (
    <>
      <h2
        className="text-2xl font-bold mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        Reciters
      </h2>
      <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
        Tap a reciter to hear them recite {DEFAULT_SAMPLE_PASSAGE.title}.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {availableReciters.map((reciter) => (
          <ReciterCard key={reciter.id} reciter={reciter} />
        ))}
      </div>
    </>
  );
};

export default RecitersSection;
