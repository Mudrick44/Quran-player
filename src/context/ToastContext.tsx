import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { usePresence } from "../hooks/usePresence";
import { EASE_OUT, OVERLAY_DURATION } from "../utils/motion";

type ToastTone = "info" | "success" | "error";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  tone?: ToastTone;
  action?: ToastAction;
}

interface Toast extends ToastOptions {
  id: number;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/** Errors stay up longer: they usually need reading, and may have an action. */
const DURATION_MS: Record<ToastTone, number> = {
  info: 4000,
  success: 3000,
  error: 6000,
};

const TONE_ICON = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
};

const TONE_COLOR: Record<ToastTone, string> = {
  info: "var(--accent-primary)",
  success: "#30d158",
  error: "#ff453a",
};

/**
 * One message at a time, styled after an iOS notification banner like the
 * update banner. A new message replaces the current one, so a batch of
 * failures never stacks up into a wall of banners.
 */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<Toast | null>(null);
  // What was last shown, kept through the exit transition
  const [shown, setShown] = useState<Toast | null>(null);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    const next = { ...options, message, id: nextId.current++ };
    setToast(next);
    setShown(next);
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismiss, DURATION_MS[toast.tone ?? "info"]);
    return () => clearTimeout(timer);
  }, [toast, dismiss]);

  const { isMounted, isVisible } = usePresence(toast !== null, OVERLAY_DURATION);

  const tone = shown?.tone ?? "info";
  const Icon = TONE_ICON[tone];

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {isMounted && shown && (
        <div
          className="fixed inset-x-3 top-[calc(0.5rem+env(safe-area-inset-top))] z-[85] flex justify-center pointer-events-none"
          role={tone === "error" ? "alert" : "status"}
          aria-live={tone === "error" ? "assertive" : "polite"}
        >
          <div
            key={shown.id}
            className="pointer-events-auto w-full max-w-md flex items-center gap-3 p-3 pl-4 rounded-[22px] border shadow-2xl backdrop-blur-xl backdrop-saturate-150"
            style={{
              backgroundColor: "color-mix(in srgb, var(--bg-card) 85%, transparent)",
              borderColor: "var(--border-secondary)",
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(-120%)",
              transition: `transform ${OVERLAY_DURATION}ms ${EASE_OUT}, opacity ${OVERLAY_DURATION}ms ${EASE_OUT}`,
            }}
          >
            <Icon className="w-6 h-6 flex-shrink-0" style={{ color: TONE_COLOR[tone] }} aria-hidden />

            <p
              className="flex-1 min-w-0 text-[14px] leading-snug"
              style={{ color: "var(--text-primary)" }}
            >
              {shown.message}
            </p>

            {shown.action && (
              <button
                onClick={() => {
                  shown.action?.onClick();
                  dismiss();
                }}
                className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-transform active:scale-95"
                style={{ backgroundColor: "var(--accent-primary)", color: "#ffffff" }}
              >
                {shown.action.label}
              </button>
            )}

            <button
              onClick={dismiss}
              className="flex-shrink-0 p-1 -ml-1 rounded-full transition-opacity active:opacity-50"
              style={{ color: "var(--text-tertiary)" }}
              aria-label="Dismiss"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
