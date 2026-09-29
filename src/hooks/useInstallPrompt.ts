import { useEffect, useState } from "react";

/** Chromium's install event — not in the standard DOM typings. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isStandaloneNow = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  // iOS Safari's older, non-standard flag
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

// iPadOS reports itself as a Mac, so tell them apart by touch support
const isIOSDevice = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/**
 * Whether and how the app can be installed on this device.
 *
 * Chromium browsers fire `beforeinstallprompt`, which we hold on to so a
 * button can trigger the native install dialog. iOS has no such API: the only
 * route is Share → Add to Home Screen, so there we can only explain the steps.
 */
export const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(isStandaloneNow);
  const [isIOS] = useState(isIOSDevice);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      // Stop Chrome's own mini-infobar; we show the prompt at a better moment
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  /** Opens the browser's native install dialog. Resolves true if accepted. */
  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    // The event can only be used once
    setDeferredPrompt(null);
    return outcome === "accepted";
  };

  return {
    isStandalone,
    isIOS,
    /** A native install dialog is available (Android / desktop Chromium). */
    canPromptInstall: deferredPrompt !== null,
    /** There is some way to install here, so offering it makes sense. */
    isInstallable: !isStandalone && (isIOS || deferredPrompt !== null),
    promptInstall,
  };
};
