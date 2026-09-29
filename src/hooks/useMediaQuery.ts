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

/** Launched from the home screen rather than opened in a browser tab. */
export const useIsStandalone = () => {
  const matches = useMediaQuery("(display-mode: standalone)");
  // iOS Safari's older, non-standard flag
  return matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
};

/**
 * The installed app on a phone swaps the hamburger menu for a bottom tab bar,
 * as native apps do. The website and desktop keep the sidebar layout.
 */
export const useHasTabBar = () => {
  const isStandalone = useIsStandalone();
  const isDesktop = useIsDesktop();
  return isStandalone && !isDesktop;
};
