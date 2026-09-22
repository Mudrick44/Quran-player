import { useEffect, ReactNode } from "react";
import { usePresence } from "../hooks/usePresence";
import { useDragToDismiss } from "../hooks/useDragToDismiss";
import { EASE_OUT, OVERLAY_DURATION } from "../utils/motion";

interface BottomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Cap on the panel height; the body scrolls past it. */
  maxHeight?: string;
  children: ReactNode;
}

/**
 * Mobile-style action sheet: dimmed scrim, panel anchored to the bottom edge,
 * swipe-down or tap-outside to dismiss. Generic on purpose — the reciter
 * picker is just the first thing to use it.
 */
const BottomDrawer: React.FC<BottomDrawerProps> = ({
  isOpen,
  onClose,
  title,
  maxHeight = "70vh",
  children,
}) => {
  const { isMounted, isVisible } = usePresence(isOpen, OVERLAY_DURATION);
  const { offset, isDragging, handlers, reset } = useDragToDismiss(onClose);

  // Clear a left-over drag if it reopens mid exit transition
  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end" role="dialog" aria-modal="true">
      {/* Scrim */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 w-full h-full cursor-default"
        style={{
          backgroundColor: "var(--overlay)",
          opacity: isVisible ? 1 : 0,
          transition: `opacity ${OVERLAY_DURATION}ms ${EASE_OUT}`,
        }}
      />

      {/* Panel */}
      <div
        className="relative w-full rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: "var(--bg-card)",
          maxHeight,
          transform: isVisible
            ? `translateY(${offset}px)`
            : "translateY(100%)",
          transition: isDragging
            ? "none"
            : `transform ${OVERLAY_DURATION}ms ${EASE_OUT}`,
        }}
      >
        {/* Grab handle */}
        <div className="flex-shrink-0 pt-2.5 pb-1 cursor-grab" {...handlers}>
          <div
            className="mx-auto w-10 h-1 rounded-full"
            style={{ backgroundColor: "var(--text-tertiary)" }}
          />
          {title && (
            <p
              className="text-center text-[11px] uppercase tracking-[0.2em] font-medium mt-3"
              style={{ color: "var(--text-secondary)" }}
            >
              {title}
            </p>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-2 pb-8 scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomDrawer;
