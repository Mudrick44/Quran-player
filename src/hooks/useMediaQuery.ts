import { useEffect, useState } from "react";

/**
 * Tracks a CSS media query from JS. Used to gate mobile-only UI so it is never
 * mounted on desktop, rather than merely hidden with `md:hidden`.
 */
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches);

    setMatches(mediaQueryList.matches);
    mediaQueryList.addEventListener("change", handleChange);
    return () => mediaQueryList.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
};

/** Matches Tailwind's `md` breakpoint, the same one the layout uses. */
export const useIsDesktop = () => useMediaQuery("(min-width: 768px)");
