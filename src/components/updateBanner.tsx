import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useRegisterSW } from "virtual:pwa-register/react";
import { usePresence } from "../hooks/usePresence";
import { EASE_OUT, OVERLAY_DURATION } from "../utils/motion";

const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

/**
 * Tells the user a new version has been deployed and lets them choose when to
 * reload into it, styled after an iOS notification banner.
 *
 * An installed app can stay open for days, so besides the check on launch it
 * looks for updates hourly and whenever the app comes back to the foreground.
 * "Later" hides the banner for this session; the new version then takes over
 * the next time the app is fully closed and reopened.
 */
const UpdateBanner: React.FC = () => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW: (_url, reg) => setRegistration(reg),
  });

  useEffect(() => {
    if (!registration) return;

    const checkForUpdate = () => {
      if (navigator.onLine) registration.update().catch(() => {});
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };

    const interval = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [registration]);

  const isOpen = needRefresh && !isDismissed;
  const { isMounted, isVisible } = usePresence(isOpen, OVERLAY_DURATION);

  if (!isMounted) return null;

  const handleUpdate = () => {
    setIsUpdating(true);
    // Activates the new service worker, then reloads into the new version
    updateServiceWorker(true);
  };

  return (
    <div
      className="fixed inset-x-3 top-[calc(0.5rem+env(safe-area-inset-top))] z-[80] flex justify-center pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-auto w-full max-w-md flex items-center gap-3 p-3 rounded-[22px] border shadow-2xl backdrop-blur-xl backdrop-saturate-150"
        style={{
          backgroundColor: "color-mix(in srgb, var(--bg-card) 85%, transparent)",
          borderColor: "var(--border-secondary)",
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(-120%)",
          transition: `transform ${OVERLAY_DURATION}ms ${EASE_OUT}, opacity ${OVERLAY_DURATION}ms ${EASE_OUT}`,
        }}
      >
        <img
          src="/icons/icon-192.png"
          alt=""
          className="w-10 h-10 rounded-[10px] flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <p
            className="text-[15px] font-semibold leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Update available
          </p>
          <p
            className="text-[13px] leading-snug mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            A new version is ready.
          </p>
        </div>

        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="flex-shrink-0 px-4 py-1.5 rounded-full text-[14px] font-semibold transition-transform active:scale-95 disabled:opacity-60"
          style={{ backgroundColor: "var(--accent-primary)", color: "#ffffff" }}
        >
          {isUpdating ? "Updating" : "Update"}
        </button>

        <button
          onClick={() => setIsDismissed(true)}
          className="flex-shrink-0 p-1 -ml-1 rounded-full transition-opacity active:opacity-50"
          style={{ color: "var(--text-tertiary)" }}
          aria-label="Later"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default UpdateBanner;
