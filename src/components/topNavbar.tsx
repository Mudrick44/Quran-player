import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../contexts/ThemeContext";

const TopNavbar = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className="fixed top-0 right-0 z-40 h-16 flex items-center justify-end px-6 md:left-[260px] left-0"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-secondary)",
      }}
    >
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
