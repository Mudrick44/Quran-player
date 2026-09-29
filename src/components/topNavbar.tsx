import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../contexts/ThemeContext";

interface TopNavbarProps {
  /**
   * Page title for the installed app, where there is no menu button. Passing
   * it also switches the bar to the iOS navigation bar style.
   */
  title?: string;
}

/** Roughly where the page's own heading has scrolled out of view. */
const TITLE_REVEAL_OFFSET = 48;

const TopNavbar = ({ title }: TopNavbarProps) => {
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const isNavigationBar = Boolean(title);

  // As on iOS, the bar only takes over the title once the page heading has
  // scrolled away, so the two never show at the same time
  useEffect(() => {
    if (!isNavigationBar) return;
    const handleScroll = () => setIsScrolled(window.scrollY > TITLE_REVEAL_OFFSET);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isNavigationBar]);

  return (
    <div
      className={`fixed top-0 right-0 z-40 h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] flex items-center justify-between px-6 md:left-[260px] left-0 ${
        isNavigationBar ? "backdrop-blur-xl backdrop-saturate-150" : ""
      }`}
      style={
        isNavigationBar
          ? {
              backgroundColor: "color-mix(in srgb, var(--bg-secondary) 82%, transparent)",
              // The hairline appears with the title, once content is underneath
              borderBottom: `0.5px solid ${isScrolled ? "var(--border-secondary)" : "transparent"}`,
              transition: "border-color 200ms ease",
            }
          : {
              backgroundColor: "var(--bg-secondary)",
              borderBottom: "1px solid var(--border-secondary)",
            }
      }
    >
      {/* Left side - Page title (the hamburger sits here otherwise) */}
      {title ? (
        <h1
          className="text-[17px] font-semibold truncate transition-opacity duration-200"
          style={{ color: "var(--text-primary)", opacity: isScrolled ? 1 : 0 }}
        >
          {title}
        </h1>
      ) : (
        <span />
      )}

      {/* Right side - Theme Toggle */}
      <div className="flex items-center">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors duration-200 flex items-center justify-center"
          style={
            { "--hover-bg": "var(--sidebar-selected)" } as React.CSSProperties
          }
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--sidebar-selected)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          {theme === "dark" ? (
            <SunIcon
              className="w-6 h-6"
              style={{ color: "var(--accent-primary)" }}
            />
          ) : (
            <MoonIcon
              className="w-6 h-6"
              style={{ color: "var(--accent-primary)" }}
            />
          )}
        </button>
      </div>
    </div>
  );
};

export default TopNavbar;
