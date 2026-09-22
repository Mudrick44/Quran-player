import { useCallback, useRef, useState } from "react";

/**
 * Swipe-down-to-dismiss for bottom-anchored overlays.
 *
 * Spread `handlers` onto the grab handle only — binding it to the whole panel
 * would fight the sliders and scrollable lists inside it.
 */
export const useDragToDismiss = (onDismiss: () => void, threshold = 100) => {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef<number | null>(null);

  const handlers = {
    onTouchStart: (event: React.TouchEvent) => {
      startY.current = event.touches[0].clientY;
      setIsDragging(true);
    },
    onTouchMove: (event: React.TouchEvent) => {
      if (startY.current === null) return;
      // Downward only — dragging up shouldn't lift the panel off its anchor
      setOffset(Math.max(0, event.touches[0].clientY - startY.current));
    },
    onTouchEnd: () => {
      startY.current = null;
      setIsDragging(false);
      if (offset > threshold) {
        // Leave the offset in place: the exit transition continues from here
        onDismiss();
      } else {
        setOffset(0);
      }
    },
  };

  /**
   * Clears a left-over offset. Overlays call this when they reopen, so a
   * reopen during the exit transition does not restore them mid-drag.
   */
  const reset = useCallback(() => setOffset(0), []);

  return { offset, isDragging, handlers, reset };
};
