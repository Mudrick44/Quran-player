import { useState } from "react";
import {
  PlayIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { usePlayer } from "../context/PlayerContext";
import { useCustomPlaylists } from "../context/PlaylistsContext";
import type { CustomPlaylist } from "../context/PlaylistsContext";

interface CustomPlaylistDetailProps {
  playlist: CustomPlaylist;
  onBack: () => void;
  onEdit: () => void;
}

const CustomPlaylistDetail: React.FC<CustomPlaylistDetailProps> = ({
  playlist,
  onBack,
  onEdit,
}) => {
  const { surahList, playSurahFromPlaylist, currentSurah, isPlaying } = usePlayer();
  const { removeSurahFromPlaylist, deletePlaylist } = useCustomPlaylists();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Resolve surah numbers to full metadata, preserving the playlist's order
  const surahs = playlist.surahNumbers
    .map((number) => surahList.find((s) => s.number === number))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  const handlePlayAll = () => {
    if (surahs.length > 0) {
      playSurahFromPlaylist(surahs[0], surahs);
    }
  };

  const handlePlaySurah = (surah: (typeof surahs)[number]) => {
    playSurahFromPlaylist(surah, surahs);
  };

  const handleDelete = () => {
    deletePlaylist(playlist.id);
    onBack();
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl mb-8">
        <div
          className="h-[220px] md:h-[280px] flex items-end p-6 md:p-8"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-primary), var(--sidebar-selected))",
          }}
        >
          <button
            onClick={onBack}
            className="absolute top-4 left-4 p-2 rounded-full backdrop-blur-sm transition-all hover:scale-105"
            style={{ backgroundColor: "rgba(0,0,0,0.3)", color: "white" }}
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 rounded-full backdrop-blur-sm transition-all hover:scale-105"
              style={{ backgroundColor: "rgba(0,0,0,0.3)", color: "white" }}
              aria-label="Edit playlist"
              title="Edit playlist"
            >
              <PencilSquareIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setConfirmingDelete(true)}
              className="p-2 rounded-full backdrop-blur-sm transition-all hover:scale-105"
              style={{ backgroundColor: "rgba(0,0,0,0.3)", color: "white" }}
              aria-label="Delete playlist"
              title="Delete playlist"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>

          <div>
            <p className="text-sm uppercase tracking-wider mb-2 font-medium text-white opacity-80">
              Your Playlist
            </p>
            <h1 className="text-3xl md:text-5xl font-bold mb-2 text-white">
              {playlist.name}
            </h1>
            <p className="text-base text-white opacity-80 mb-4">
              {surahs.length} surah{surahs.length === 1 ? "" : "s"}
            </p>

            <button
              onClick={handlePlayAll}
              disabled={surahs.length === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ backgroundColor: "white", color: "var(--accent-primary)" }}
            >
              <PlayIcon className="w-5 h-5" />
              Play All
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmingDelete && (
        <div
          className="flex items-center justify-between p-4 rounded-lg mb-6"
          style={{ backgroundColor: "var(--sidebar-selected)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>
            Delete "{playlist.name}"? This can't be undone.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
              style={{ backgroundColor: "#ef4444", color: "white" }}
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Surah List */}
      <div className="mb-8">
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Surahs in this Playlist
        </h2>

        {surahs.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center py-16 rounded-lg"
            style={{ backgroundColor: "var(--sidebar-selected)" }}
          >
            <p className="mb-3" style={{ color: "var(--text-secondary)" }}>
              This playlist is empty.
            </p>
            <button
              onClick={onEdit}
              className="px-5 py-2 rounded-full font-semibold transition-all hover:scale-105"
              style={{ backgroundColor: "var(--accent-color, #10b981)", color: "white" }}
            >
              Add Surahs
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {surahs.map((surah, index) => {
              const isCurrentlyPlaying =
                currentSurah?.number === surah.number && isPlaying;

              return (
                <div
                  key={surah.number}
                  className="group flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all"
                  style={{
                    backgroundColor: isCurrentlyPlaying
                      ? "var(--sidebar-selected)"
                      : "transparent",
                  }}
                  onClick={() => handlePlaySurah(surah)}
                  onMouseEnter={(e) => {
                    if (!isCurrentlyPlaying) {
                      e.currentTarget.style.backgroundColor =
                        "var(--sidebar-selected)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrentlyPlaying) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {/* Track Number / Play Icon */}
                  <div
                    className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span className="group-hover:hidden text-sm">{index + 1}</span>
                    <PlayIcon className="w-4 h-4 hidden group-hover:block" />
                  </div>

                  {/* Surah Number Badge */}
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                    style={{
                      backgroundColor: isCurrentlyPlaying
                        ? "var(--accent-color, #10b981)"
                        : "var(--sidebar-selected)",
                      color: isCurrentlyPlaying ? "white" : "var(--text-primary)",
                    }}
                  >
                    {surah.number}
                  </div>

                  {/* Surah Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className="font-medium truncate"
                        style={{
                          color: isCurrentlyPlaying
                            ? "var(--accent-color, #10b981)"
                            : "var(--text-primary)",
                        }}
                      >
                        {surah.name}
                      </h4>
                      <span
                        className="text-base font-arabic"
                        style={{
                          color: isCurrentlyPlaying
                            ? "var(--accent-color, #10b981)"
                            : "var(--text-primary)",
                        }}
                      >
                        {surah.nameArabic}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {surah.totalAyah} verses
                    </p>
                  </div>

                  {/* Remove from playlist */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSurahFromPlaylist(playlist.id, surah.number);
                    }}
                    className="p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    style={{ color: "var(--text-secondary)" }}
                    aria-label={`Remove ${surah.name} from playlist`}
                    title="Remove from playlist"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomPlaylistDetail;
