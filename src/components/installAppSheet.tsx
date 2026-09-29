import { ComponentType, ReactNode, SVGProps } from "react";
import {
  ArrowUpOnSquareIcon,
  PlusIcon,
  CheckIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import BottomDrawer from "./bottomDrawer";

interface InstallAppSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  canPromptInstall: boolean;
  onInstall: () => void;
}

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const Step = ({
  number,
  icon: StepIcon,
  title,
  hint,
}: {
  number: number;
  icon: Icon;
  title: ReactNode;
  hint: ReactNode;
}) => (
  <li className="flex items-center gap-4 px-4 py-3.5">
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: "var(--sidebar-selected)", color: "var(--accent-primary)" }}
    >
      <StepIcon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-[15px]" style={{ color: "var(--text-primary)" }}>
        <span style={{ color: "var(--text-tertiary)" }}>{number}.</span> {title}
      </p>
      <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
        {hint}
      </p>
    </div>
  </li>
);

const Strong = ({ children }: { children: ReactNode }) => (
  <span className="font-semibold">{children}</span>
);

/**
 * Explains how to put the app on the home screen. Android can open the
 * native install dialog; iOS has no API for it, so there we walk through
 * Share → Add to Home Screen instead.
 */
const InstallAppSheet: React.FC<InstallAppSheetProps> = ({
  isOpen,
  onClose,
  isIOS,
  canPromptInstall,
  onInstall,
}) => {
  const primaryButton =
    "w-full py-3.5 rounded-full font-semibold text-[15px] transition-transform active:scale-[0.98]";

  return (
    <BottomDrawer isOpen={isOpen} onClose={onClose} title="Install App" maxHeight="85vh">
      <div className="px-3 pb-2">
        {/* App identity */}
        <div className="flex flex-col items-center text-center pt-3 pb-6">
          <img
            src="/icons/icon-192.png"
            alt=""
            className="w-[72px] h-[72px] rounded-[18px] shadow-lg"
          />
          <h2 className="text-xl font-bold mt-4" style={{ color: "var(--text-primary)" }}>
            Quran Player
          </h2>
          <p
            className="text-sm mt-1.5 max-w-xs leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Add it to your home screen for full-screen listening, faster launch and
            lock-screen controls.
          </p>
        </div>

        {isIOS ? (
          <>
            <ol
              className="rounded-2xl overflow-hidden divide-y divide-[color:var(--border-secondary)]"
              style={{ backgroundColor: "var(--bg-secondary)" }}
            >
              <Step
                number={1}
                icon={ArrowUpOnSquareIcon}
                title={
                  <>
                    Tap the <Strong>Share</Strong> button
                  </>
                }
                hint={
                  <span className="inline-flex items-center gap-1 flex-wrap">
                    Hidden? Tap
                    <EllipsisHorizontalIcon className="w-4 h-4 inline" aria-label="More" />
                    first
                  </span>
                }
              />
              <Step
                number={2}
                icon={PlusIcon}
                title={
                  <>
                    Choose <Strong>Add to Home Screen</Strong>
                  </>
                }
                hint="Scroll down the menu if you don't see it"
              />
              <Step
                number={3}
                icon={CheckIcon}
                title={
                  <>
                    Tap <Strong>Add</Strong>
                  </>
                }
                hint="Quran Player appears on your home screen"
              />
            </ol>

            <button
              onClick={onClose}
              className={`${primaryButton} mt-6`}
              style={{ backgroundColor: "var(--sidebar-selected)", color: "var(--text-primary)" }}
            >
              Got it
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onInstall}
              disabled={!canPromptInstall}
              className={`${primaryButton} disabled:opacity-50`}
              style={{ backgroundColor: "var(--accent-primary)", color: "#ffffff" }}
            >
              Install
            </button>
            <button
              onClick={onClose}
              className={`${primaryButton} mt-2`}
              style={{ color: "var(--text-secondary)" }}
            >
              Not now
            </button>
          </>
        )}
      </div>
    </BottomDrawer>
  );
};

export default InstallAppSheet;
