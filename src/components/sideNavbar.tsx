import React, { useState } from "react";
import {
  HomeIcon,
  BookOpenIcon,
  MicrophoneIcon,
  Bars3Icon,
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
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-lg bg-[rgba(60,60,67,0.03)] border border-[rgba(0,0,0,.15)]"
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="w-6 h-6 text-[#FA233B]" />
          ) : (
            <Bars3Icon className="w-6 h-6 text-[#FA233B]" />
          )}
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden md:flex border-r-2 border-[rgba(0,0,0,.15)] h-screen w-[260px] bg-[rgba(60,60,67,0.03)] flex-col">
        {/* Header */}
        <div className="ps-[30px] pe-[30px] pt-[17px] pb-[17px] min-h-[50px]">
          <h1 className="text-[rgba(0,0,0,.88)] text-xl font-semibold">
            Quran Player
          </h1>
        </div>

        {/* Navigation Items */}
        <nav className="mt-2">
          {navItems.map((item) => {
            return (
              <div
                key={item.id}
                className="flex items-center ps-[30px] pe-[30px] py-3 hover:bg-[rgba(0,0,0,.05)] cursor-pointer transition-colors duration-200 group"
              >
                <item.icon className="w-5 h-5 mr-3 text-[#FA233B] group-hover:text-[#dc2626] group-hover:scale-110 transition-all duration-200" />
                <span className="text-[rgba(0,0,0,.88)] font-medium text-base">
                  {item.label}
                </span>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto">
          <div className="border-t border-[rgba(0,0,0,.15)]"></div>
          <div className="ps-[30px] pe-[30px] py-4">
            <p className="text-[rgba(0,0,0,.6)] text-sm text-center">
              Made with ❤️ by Mudrick
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Slides from top */}
      <div
        className={`md:hidden fixed top-0 left-0 right-0 bottom-0 h-screen bg-[#2e2e2e] z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between ps-[30px] pe-[30px] pt-[17px] pb-[17px] min-h-[50px] border-b border-[rgba(255,255,255,.15)]">
          <h1 className="text-white text-xl font-semibold">Quran Player</h1>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg hover:bg-[rgba(255,255,255,.1)]"
          >
            <XMarkIcon className="w-6 h-6 text-[#FA233B]" />
          </button>
        </div>

        {/* Mobile Navigation Items */}
        <nav className="py-4">
          {navItems.map((item) => {
            return (
              <div
                key={item.id}
                className="flex items-center ps-[30px] pe-[30px] py-4 hover:bg-[rgba(255,255,255,.1)] cursor-pointer transition-colors duration-200 group"
                onClick={toggleMobileMenu}
              >
                <item.icon className="w-6 h-6 mr-4 text-[#FA233B] group-hover:text-[#dc2626] group-hover:scale-110 transition-all duration-200" />
                <span className="text-white font-medium text-lg">
                  {item.label}
                </span>
              </div>
            );
          })}
        </nav>

        {/* Mobile Footer */}
        <div className="border-t border-[rgba(255,255,255,.15)]">
          <div className="ps-[30px] pe-[30px] py-4">
            <p className="text-[rgba(255,255,255,.6)] text-sm text-center">
              Made with ❤️ by Mudrick
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
export default SideNavbar;
