import { useEffect, useState } from "react";

/**
 * Keeps an overlay mounted while its exit transition plays.
 *
 * `isMounted` decides whether to render at all; `isVisible` is the flag the
 * component transitions against (it flips on one frame *after* mount, so the
 * browser has a start value to animate from).
 */
export const usePresence = (isOpen: boolean, exitDuration = 320) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      return;
    }

    setIsVisible(false);
    const timer = window.setTimeout(() => setIsMounted(false), exitDuration);
    return () => window.clearTimeout(timer);
  }, [isOpen, exitDuration]);

  useEffect(() => {
    if (!isMounted || !isOpen) return;

    // Double rAF: the first frame commits the closed styles, the second starts
    // the transition. A single frame can be coalesced into the same paint.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setIsVisible(true));
    });

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [isMounted, isOpen]);

  return { isMounted, isVisible };
};
