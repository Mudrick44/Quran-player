import { useEffect } from "react";

/** Stops the page behind a full-screen overlay from scrolling while it's open. */
export const useBodyScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (!locked) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [locked]);
};
