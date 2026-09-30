import { useEffect, useRef, useState } from "react";
import { usePlayer } from "../context/PlayerContext";
import { useAyahTranslations } from "../api/fetchAyahTranslations";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

const FADE_MS = 280;

interface ShownAyah {
  ayah: number;
  text: string;
}

// Loaded in index.html; falls back to the system serif offline
const TRANSLATION_FONT = '"Cormorant Garamond", Georgia, serif';

/**
 * Shrink the type as the translation grows so most ayahs fit without
 * scrolling. Cormorant runs small, so these sit a step above the sans sizes.
 */
const textSizeFor = (length: number) => {
  if (length < 120) return "text-[2rem] leading-[1.25]";
  if (length < 260) return "text-[1.7rem] leading-[1.3]";
  if (length < 500) return "text-[1.45rem] leading-[1.35]";
  return "text-[1.25rem] leading-[1.45]";
};

/**
 * Lyrics-style English translation that fills the now-playing panel. Each
 * ayah's translation fades in while it is recited and fades out when it ends.
 */
const AyahTranslation: React.FC = () => {
  const { currentSurah, currentReciter, currentTime } = usePlayer();
  const { translations, timings, status, retry } = useAyahTranslations(
    currentSurah?.number ?? 1,
    currentReciter.id
  );
  const isOnline = useOnlineStatus();

  const [shown, setShown] = useState<ShownAyah | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ayah 0 (the opening basmala) and the pauses between ayahs map to nothing,
  // so the text clears there
  const activeAyah =
    timings.find((t) => t.ayah > 0 && currentTime >= t.start && currentTime < t.end)?.ayah ??
    null;
  const activeText = activeAyah ? translations[activeAyah - 1] : undefined;

  // Fade the old ayah out before swapping in the new one
  useEffect(() => {
    setIsVisible(false);
    if (!activeAyah || !activeText) return;

    const timer = setTimeout(() => {
      setShown({ ayah: activeAyah, text: activeText });
      setIsVisible(true);
      // A long ayah may have been scrolled — start the next one from its top
      containerRef.current?.closest(".overflow-y-auto")?.scrollTo({ top: 0 });
    }, FADE_MS);
    return () => clearTimeout(timer);
  }, [activeAyah, activeText]);

  // Don't flash the previous surah's last ayah when the track changes
  useEffect(() => {
    setShown(null);
  }, [currentSurah?.number, currentReciter.id]);

  if (!currentSurah) return null;

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col justify-center py-6 text-center"
      aria-live="polite"
    >
      {shown ? (
        <div
          className="transition-[opacity,transform,filter] ease-out motion-reduce:transition-none"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(8px)",
            filter: isVisible ? "blur(0)" : "blur(4px)",
            transitionDuration: `${FADE_MS}ms`,
          }}
        >
          <p
            className="text-[10px] uppercase tracking-[0.35em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Ayah {shown.ayah} &middot; {currentSurah.totalAyah}
          </p>
          <span
            className="block my-5 text-sm leading-none"
            style={{ color: "var(--text-tertiary)" }}
            aria-hidden
          >
            ۞
          </span>
          <p
            className={`${textSizeFor(shown.text.length)} font-normal text-balance`}
            style={{ color: "var(--text-primary)", fontFamily: TRANSLATION_FONT }}
          >
            {shown.text}
          </p>
        </div>
      ) : (
        // Before the first ayah, while loading, or if the translation can't
        // load, show the surah name so the panel is never blank
        <div>
          <span
            className="block text-4xl font-arabic"
            style={{ color: "var(--text-secondary)" }}
          >
            {currentSurah.nameArabic}
          </span>
          {status === "error" && (
            <div className="mt-6 space-y-3">
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                {isOnline
                  ? "Couldn't load the translation."
                  : "You're offline — the translation will load when you reconnect."}
              </p>
              {isOnline && (
                <button
                  onClick={retry}
                  className="px-4 py-1.5 rounded-full text-sm transition-transform active:scale-95"
                  style={{
                    color: "var(--text-primary)",
                    backgroundColor: "var(--sidebar-selected)",
                  }}
                >
                  Try again
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AyahTranslation;
