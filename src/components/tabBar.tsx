import { ComponentType, SVGProps } from "react";
import {
  HomeIcon,
  BookOpenIcon,
  MicrophoneIcon,
  QueueListIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  BookOpenIcon as BookOpenIconSolid,
  MicrophoneIcon as MicrophoneIconSolid,
  QueueListIcon as QueueListIconSolid,
} from "@heroicons/react/24/solid";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

interface Tab {
  /** Page key, shared with the sidebar menu. */
  id: string;
  label: string;
  icon: Icon;
  activeIcon: Icon;
}

const TABS: Tab[] = [
  { id: "Listen Now", label: "Listen Now", icon: HomeIcon, activeIcon: HomeIconSolid },
  { id: "Browse", label: "Browse", icon: BookOpenIcon, activeIcon: BookOpenIconSolid },
  { id: "Reciters", label: "Reciters", icon: MicrophoneIcon, activeIcon: MicrophoneIconSolid },
  { id: "My Playlists", label: "Playlists", icon: QueueListIcon, activeIcon: QueueListIconSolid },
];

interface TabBarProps {
  activeTab: string;
  onSelect: (tab: string) => void;
}

/**
 * iOS-style tab bar for the installed app: 49px of controls on a translucent,
 * blurred bar that extends under the home indicator. The active tab is filled
 * and tinted, the rest are outlined and neutral, as in Apple's own apps.
 */
const TabBar: React.FC<TabBarProps> = ({ activeTab, onSelect }) => (
  <nav
    className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150"
    style={{
      backgroundColor: "color-mix(in srgb, var(--bg-secondary) 82%, transparent)",
      borderTop: "0.5px solid var(--border-secondary)",
    }}
    aria-label="Main"
  >
    <div className="grid grid-cols-4 h-[49px]">
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        const TabIcon = isActive ? tab.activeIcon : tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className="flex flex-col items-center justify-center gap-[3px] pt-1 transition-opacity active:opacity-50"
            style={{ color: isActive ? "var(--accent-primary)" : "var(--text-tertiary)" }}
            aria-current={isActive ? "page" : undefined}
          >
            <TabIcon className="w-[26px] h-[26px]" />
            <span className="text-[10px] font-medium leading-none tracking-[0.01em]">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  </nav>
);

export default TabBar;
