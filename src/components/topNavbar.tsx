import { useState } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

const TopNavbar = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // TODO: Implement actual theme switching logic
  };

  return (
    <div className="bg-white border-b border-[rgba(0,0,0,.15)] h-16 flex items-center justify-end px-6">
      {/* Right side - Theme Toggle */}
      <div className="flex items-center">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-[rgba(0,0,0,.05)] transition-colors duration-200"
        >
          {isDarkMode ? (
            <SunIcon className="w-6 h-6 text-[#FA233B]" />
          ) : (
            <MoonIcon className="w-6 h-6 text-[#FA233B]" />
          )}
        </button>
      </div>
    </div>
  );
};

export default TopNavbar;
