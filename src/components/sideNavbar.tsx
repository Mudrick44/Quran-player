import { useState } from "react";
import {
  HomeIcon,
  BookOpenIcon,
  MicrophoneIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const SideNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 1, label: "Listen Now", icon: HomeIcon },
    { id: 2, label: "Browse", icon: BookOpenIcon },
    { id: 3, label: "Reciters", icon: MicrophoneIcon },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button onClick={toggleMobileMenu} className="p-2">
          {isMobileMenuOpen ? (
            <XMarkIcon
              className="w-6 h-6"
              style={{ color: "var(--accent-primary)" }}
            />
          ) : (
            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
              <div className="w-6 h-0.5" style={{ backgroundColor: 'var(--accent-primary)' }}></div>
              <div className="w-6 h-0.5" style={{ backgroundColor: 'var(--accent-primary)' }}></div>
            </div>
          )}
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <div
        className="hidden md:flex fixed top-0 left-0 h-screen w-[260px] flex-col z-30"
        style={{
          backgroundColor: "var(--sidebar-bg)",
          borderRight: "2px solid var(--border-secondary)",
        }}
      >
        {/* Header */}
        <div className="ps-[30px] pe-[30px] pt-[17px] pb-[17px] min-h-[50px] flex flex-row justify-cente gap-2">
          <img
            src="/src/assets/quran-rehal-svgrepo-com.svg"
            alt="quran icon"
            className="w-8 h-8"
          />
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Quran Player
          </h1>
        </div>

        {/* Navigation Items */}
        <nav className="mt-2">
          {navItems.map((item) => {
            return (
              <div
                key={item.id}
                className="flex items-center ps-[30px] pe-[30px] py-3 cursor-pointer transition-colors duration-200 group hover:bg-opacity-50"
                style={
                  {
                    "--hover-bg": "var(--sidebar-selected)",
                  } as React.CSSProperties
                }
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--sidebar-selected)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <item.icon
                  className="w-5 h-5 mr-3 group-hover:scale-110 transition-all duration-200"
                  style={{ color: "var(--accent-primary)" }}
                />
                <span
                  className="font-medium text-base"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto">
          <div style={{ borderTop: "1px solid var(--border-secondary)" }}></div>
          <div className="ps-[30px] pe-[30px] py-4">
            <p
              className="text-sm text-center"
              style={{ color: "var(--text-secondary)" }}
            >
              Made with ❤️ by Mudrick
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Slides from top */}
      <div
        className={`md:hidden fixed top-0 left-0 right-0 bottom-0 h-screen z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{ backgroundColor: "var(--bg-card)" }}
      >
        {/* Mobile Header */}
        <div
          className="flex items-center justify-between ps-[30px] pe-[30px] pt-[17px] pb-[17px] min-h-[50px]"
          style={{ borderBottom: "1px solid var(--border-secondary)" }}
        >
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Quran Player
          </h1>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg transition-colors duration-200"
            style={
              { "--hover-bg": "var(--sidebar-selected)" } as React.CSSProperties
            }
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--sidebar-selected)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <XMarkIcon
              className="w-6 h-6"
              style={{ color: "var(--accent-primary)" }}
            />
          </button>
        </div>

        {/* Mobile Navigation Items */}
        <nav className="py-4">
          {navItems.map((item) => {
            return (
              <div
                key={item.id}
                className="flex items-center ps-[30px] pe-[30px] py-4 cursor-pointer transition-colors duration-200 group"
                style={
                  {
                    "--hover-bg": "var(--sidebar-selected)",
                  } as React.CSSProperties
                }
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--sidebar-selected)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
                onClick={toggleMobileMenu}
              >
                <item.icon
                  className="w-6 h-6 mr-4 group-hover:scale-110 transition-all duration-200"
                  style={{ color: "var(--accent-primary)" }}
                />
                <span
                  className="font-medium text-lg"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </nav>

        {/* Mobile Footer */}
        <div style={{ borderTop: "1px solid var(--border-secondary)" }}>
          <div className="ps-[30px] pe-[30px] py-4">
            <p
              className="text-sm text-center"
              style={{ color: "var(--text-secondary)" }}
            >
              Made with ❤️ by Mudrick
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
export default SideNavbar;
