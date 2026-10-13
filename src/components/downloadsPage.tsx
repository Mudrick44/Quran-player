import { useState } from "react";
import {
  ArrowDownCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  SignalSlashIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { PlayIcon } from "@heroicons/react/24/solid";
import { usePlayer } from "../context/PlayerContext";
import type { SurahInfo } from "../context/PlayerContext";
import { useDownloads } from "../context/DownloadsContext";
import type { QueueItem } from "../context/DownloadsContext";
import type { DownloadRecord } from "../api/downloadStore";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useIsStandalone } from "../hooks/useMediaQuery";
import { formatBytes } from "../utils/formatBytes";
import NowPlayingIndicator from "./nowPlayingIndicator";

interface DownloadsPageProps {
  isIOS: boolean;
  /** Opens the install guide, offered to iPhone users in Safari */
  onInstallApp?: () => void;
  /** Sends the user somewhere they can pick surahs to download */
  onBrowse: () => void;
}

interface ReciterGroup {
  reciterId: number;
  reciterName: string;
  records: DownloadRecord[];
  size: number;
}

const ERROR_COLOR = "#ff453a";

const toSurahInfo = (record: DownloadRecord): SurahInfo => ({
  number: record.surahNumber,
  name: record.surahName,
  nameArabic: record.surahNameArabic,
  totalAyah: record.totalAyah,
});

const groupByReciter = (downloads: DownloadRecord[]): ReciterGroup[] => {
  const groups = new Map<number, ReciterGroup>();
  for (const record of downloads) {
    const group = groups.get(record.reciterId) ?? {
      reciterId: record.reciterId,
      reciterName: record.reciterName,
      records: [],
      size: 0,
    };
    group.records.push(record);
    group.size += record.size;
    groups.set(record.reciterId, group);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      records: group.records.sort((a, b) => a.surahNumber - b.surahNumber),
    }))
    .sort((a, b) => a.reciterName.localeCompare(b.reciterName));
};

const Notice = ({
  icon: Icon,
  tone = "neutral",
  children,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tone?: "neutral" | "warning";
  children: React.ReactNode;
}) => (
  <div
    className="flex items-start gap-3 p-4 rounded-xl mb-6"
    style={{ backgroundColor: "var(--sidebar-selected)" }}
  >
    <Icon
      className="w-5 h-5 flex-shrink-0 mt-0.5"
      style={{ color: tone === "warning" ? "#ff9f0a" : "var(--text-secondary)" }}
    />
    <div className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
      {children}
    </div>
  </div>
);

const SurahBadge = ({ number, isActive }: { number: number; isActive?: boolean }) => (
  <div
    className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 text-sm font-semibold"
    style={{
      backgroundColor: isActive ? "var(--accent-primary)" : "var(--sidebar-selected)",
      color: isActive ? "white" : "var(--text-primary)",
    }}
  >
    {number}
  </div>
);

const QueueRow = ({ item, progress }: { item: QueueItem; progress: number | null }) => {
  const { cancel, retry } = useDownloads();

  const statusText =
    item.status === "failed"
      ? item.error ?? "Couldn't download. Tap retry to try again."
      : item.status === "downloading"
        ? progress === null
          ? "Downloading…"
          : `Downloading · ${Math.round(progress * 100)}%`
        : "Waiting…";

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg">
      <SurahBadge number={item.surah.number} />

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate" style={{ color: "var(--text-primary)" }}>
          {item.surah.name}
          <span className="font-normal" style={{ color: "var(--text-secondary)" }}>
            {" "}· {item.reciterName}
          </span>
        </p>
        <p
          className="text-sm"
          style={{ color: item.status === "failed" ? ERROR_COLOR : "var(--text-secondary)" }}
        >
          {statusText}
        </p>
        {item.status === "downloading" && (
          <div
            className="mt-2 h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--border-secondary)" }}
          >
            <div
              className={`h-full rounded-full ${progress === null ? "w-1/3 animate-pulse" : ""}`}
              style={{
                backgroundColor: "var(--accent-primary)",
                width: progress === null ? undefined : `${Math.round(progress * 100)}%`,
                transition: "width 250ms linear",
              }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {item.status === "failed" && (
          <button
            onClick={() => retry([item.key])}
            className="p-2 rounded-full transition-transform active:scale-90"
            style={{ color: "var(--accent-primary)" }}
            aria-label={`Retry downloading ${item.surah.name}`}
            title="Try again"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => cancel([item.key])}
          className="p-2 rounded-full transition-transform active:scale-90"
          style={{ color: "var(--text-secondary)" }}
          aria-label={
            item.status === "failed"
              ? `Dismiss ${item.surah.name}`
              : `Cancel downloading ${item.surah.name}`
          }
          title={item.status === "failed" ? "Dismiss" : "Cancel"}
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/**
 * Removing is two taps, as in iOS: the first turns the bin into a red
 * "Remove" button, the second removes. A downloaded Al-Baqarah is 100 MB+
 * to fetch again, so one stray tap shouldn't cost it.
 */
const RemoveButton = ({ label, onRemove }: { label: string; onRemove: () => Promise<void> }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  if (isConfirming) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={async () => {
            setIsRemoving(true);
            try {
              await onRemove();
            } catch {
              // The downloads context has already told the user
              setIsRemoving(false);
              setIsConfirming(false);
            }
          }}
          disabled={isRemoving}
          className="px-3 py-1.5 rounded-full text-sm font-semibold disabled:opacity-60"
          style={{ backgroundColor: ERROR_COLOR, color: "white" }}
        >
          {isRemoving ? "Removing" : "Remove"}
        </button>
        <button
          onClick={() => setIsConfirming(false)}
          className="px-3 py-1.5 rounded-full text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setIsConfirming(true);
      }}
      className="p-2 rounded-full transition-transform active:scale-90"
      style={{ color: "var(--text-secondary)" }}
      aria-label={label}
      title={label}
    >
      <TrashIcon className="w-5 h-5" />
    </button>
  );
};

const DownloadsPage: React.FC<DownloadsPageProps> = ({ isIOS, onInstallApp, onBrowse }) => {
  const { isReady, isSupported, downloads, queue, totalBytes, getStatus, remove, cancel, retry } =
    useDownloads();
  const { playSurahFromPlaylist, currentSurah, currentReciter, isPlaying } = usePlayer();
  const isOnline = useOnlineStatus();
  const isStandalone = useIsStandalone();

  const groups = groupByReciter(downloads);
  const pending = queue.filter((item) => item.status !== "failed");
  const failed = queue.filter((item) => item.status === "failed");

  const playFromGroup = (group: ReciterGroup, record: DownloadRecord) => {
    const surahs = group.records.map(toSurahInfo);
    playSurahFromPlaylist(toSurahInfo(record), surahs, {
      id: group.reciterId,
      name: group.reciterName,
    });
  };

  const sectionHeading = "text-lg font-bold";

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Downloads
        </h2>
        {downloads.length > 0 && (
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {downloads.length} surah{downloads.length === 1 ? "" : "s"} ·{" "}
            {formatBytes(totalBytes)} on this device
          </p>
        )}
      </div>

      {!isSupported && (
        <Notice icon={ExclamationTriangleIcon} tone="warning">
          Downloads aren't available in private browsing. Open the app in a normal
          window to download surahs and listen offline.
        </Notice>
      )}

      {isSupported && !isOnline && (
        <Notice icon={SignalSlashIcon}>
          You're offline. Your downloaded surahs still play
          {pending.length > 0 ? ", and waiting downloads will continue when you reconnect." : "."}
        </Notice>
      )}

      {/* Safari can clear a site's storage after 7 days without a visit; the
          installed app is exempt, so point iPhone users to it */}
      {isSupported && isIOS && !isStandalone && (
        <Notice icon={ExclamationTriangleIcon} tone="warning">
          <p>
            Downloads in Safari can be cleared if you don't open this site for a
            week. Add Quran Player to your Home Screen to keep them.
          </p>
          {onInstallApp && (
            <button
              onClick={onInstallApp}
              className="mt-2 font-semibold"
              style={{ color: "var(--accent-primary)" }}
            >
              Show me how
            </button>
          )}
        </Notice>
      )}

      {/* ---------- In progress & failed ---------- */}
      {queue.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className={sectionHeading} style={{ color: "var(--text-primary)" }}>
              {pending.length > 0 ? `Downloading (${pending.length})` : "Couldn't download"}
            </h3>
            <div className="flex items-center gap-3 text-sm font-semibold">
              {failed.length > 0 && (
                <button
                  onClick={() => retry(failed.map((item) => item.key))}
                  style={{ color: "var(--accent-primary)" }}
                >
                  Retry failed
                </button>
              )}
              {pending.length > 0 && (
                <button
                  onClick={() => cancel(pending.map((item) => item.key))}
                  style={{ color: "var(--text-secondary)" }}
                >
                  Cancel all
                </button>
              )}
            </div>
          </div>

          {pending.length > 0 && (
            <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
              Keep the app open while downloading — on phones, downloads pause in the
              background and resume when you come back.
            </p>
          )}

          <div className="space-y-1">
            {queue.map((item) => (
              <QueueRow
                key={item.key}
                item={item}
                progress={getStatus(item.reciterId, item.surah.number).progress}
              />
            ))}
          </div>
        </section>
      )}

      {/* ---------- Downloaded ---------- */}
      {isReady && downloads.length === 0 && queue.length === 0 && isSupported && (
        <div
          className="flex flex-col items-center justify-center text-center py-20"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowDownCircleIcon className="w-12 h-12 mb-4 opacity-50" />
          <p className="mb-1 font-medium" style={{ color: "var(--text-primary)" }}>
            No downloads yet
          </p>
          <p className="text-sm mb-4 max-w-sm">
            Tap the download icon next to any surah, or download a whole playlist, to
            listen without internet.
          </p>
          <button
            onClick={onBrowse}
            className="px-5 py-2 rounded-full font-semibold transition-all hover:scale-105"
            style={{ backgroundColor: "var(--accent-primary)", color: "white" }}
          >
            Browse Surahs
          </button>
        </div>
      )}

      {groups.map((group) => (
        <section key={group.reciterId} className="mb-10">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="min-w-0">
              <h3 className={`${sectionHeading} truncate`} style={{ color: "var(--text-primary)" }}>
                {group.reciterName}
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {group.records.length} surah{group.records.length === 1 ? "" : "s"} ·{" "}
                {formatBytes(group.size)}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => playFromGroup(group, group.records[0])}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
                style={{ backgroundColor: "var(--accent-primary)", color: "white" }}
              >
                <PlayIcon className="w-4 h-4" />
                Play
              </button>
              <RemoveButton
                label={`Remove all downloads for ${group.reciterName}`}
                onRemove={() => remove(group.records.map((r) => r.key))}
              />
            </div>
          </div>

          <div className="space-y-1">
            {group.records.map((record) => {
              const isActive =
                currentSurah?.number === record.surahNumber &&
                currentReciter.id === record.reciterId;

              return (
                <div
                  key={record.key}
                  onClick={() => playFromGroup(group, record)}
                  className="flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isActive ? "var(--sidebar-selected)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "var(--sidebar-selected)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div className="relative">
                    <SurahBadge number={record.surahNumber} isActive={isActive} />
                    {isActive && (
                      <div
                        className="absolute inset-0 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
                      >
                        <NowPlayingIndicator isAnimating={isPlaying} color="white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className="font-medium truncate"
                        style={{ color: isActive ? "var(--accent-primary)" : "var(--text-primary)" }}
                      >
                        {record.surahName}
                      </h4>
                      <span
                        className="text-base font-arabic"
                        style={{ color: isActive ? "var(--accent-primary)" : "var(--text-primary)" }}
                      >
                        {record.surahNameArabic}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {record.totalAyah} verses · {formatBytes(record.size)}
                    </p>
                  </div>

                  <RemoveButton
                    label={`Remove ${record.surahName} download`}
                    onRemove={() => remove([record.key])}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default DownloadsPage;
