import { useState } from "react";
import { ArrowLeftIcon, MagnifyingGlassIcon, CheckIcon } from "@heroicons/react/24/outline";
import { usePlayer } from "../context/PlayerContext";
import { useCustomPlaylists } from "../context/PlaylistsContext";
import type { CustomPlaylist } from "../context/PlaylistsContext";

interface PlaylistFormProps {
  editingPlaylist: CustomPlaylist | null;
  onSaved: (playlist: CustomPlaylist) => void;
  onCancel: () => void;
}

const PlaylistForm: React.FC<PlaylistFormProps> = ({
  editingPlaylist,
  onSaved,
  onCancel,
}) => {
  const { surahList } = usePlayer();
  const { createPlaylist, renamePlaylist, updatePlaylistSurahs } = useCustomPlaylists();

  const [name, setName] = useState(editingPlaylist?.name ?? "");
  const [selected, setSelected] = useState<Set<number>>(
    new Set(editingPlaylist?.surahNumbers ?? [])
  );
  const [search, setSearch] = useState("");

  const filteredSurahs = surahList.filter((surah) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      surah.name.toLowerCase().includes(query) ||
      surah.nameArabic.includes(query) ||
      String(surah.number).includes(query)
    );
  });

  const toggleSurah = (number: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(number)) {
        next.delete(number);
      } else {
        next.add(number);
      }
      return next;
    });
  };

  const canSave = name.trim().length > 0 && selected.size > 0;

  const handleSave = () => {
    if (!canSave) return;
    const surahNumbers = Array.from(selected).sort((a, b) => a - b);

    if (editingPlaylist) {
      renamePlaylist(editingPlaylist.id, name);
      updatePlaylistSurahs(editingPlaylist.id, surahNumbers);
      onSaved({ ...editingPlaylist, name: name.trim(), surahNumbers });
    } else {
      const created = createPlaylist(name, surahNumbers);
      onSaved(created);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onCancel}
          className="p-2 rounded-full transition-colors"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Cancel"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {editingPlaylist ? "Edit Playlist" : "Create Playlist"}
        </h2>
      </div>

      {/* Name input */}
      <div className="mb-6">
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--text-secondary)" }}
        >
          Playlist name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Night Recitations"
          className="w-full px-4 py-3 rounded-lg outline-none"
          style={{
            backgroundColor: "var(--sidebar-selected)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* Search + selected count */}
      <div className="flex items-center justify-between mb-3 gap-4">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search surahs..."
            className="w-full pl-9 pr-3 py-2 rounded-lg outline-none text-sm"
            style={{
              backgroundColor: "var(--sidebar-selected)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <span
          className="text-sm whitespace-nowrap"
          style={{ color: "var(--text-secondary)" }}
        >
          {selected.size} selected
        </span>
      </div>

      {/* Surah checklist */}
      <div
        className="rounded-lg overflow-y-auto mb-6"
        style={{ maxHeight: "480px", border: "1px solid var(--border-secondary)" }}
      >
        {surahList.length === 0 ? (
          <p className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            Loading surahs...
          </p>
        ) : filteredSurahs.length === 0 ? (
          <p className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            No surahs match "{search}".
          </p>
        ) : (
          filteredSurahs.map((surah) => {
            const isSelected = selected.has(surah.number);
            return (
              <div
                key={surah.number}
                onClick={() => toggleSurah(surah.number)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                style={{
                  backgroundColor: isSelected
                    ? "var(--sidebar-selected)"
                    : "transparent",
                  borderBottom: "1px solid var(--border-secondary)",
                }}
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isSelected
                      ? "var(--accent-color, #10b981)"
                      : "transparent",
                    border: isSelected ? "none" : "1px solid var(--text-tertiary)",
                  }}
                >
                  {isSelected && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                </div>

                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0"
                  style={{
                    backgroundColor: "var(--accent-primary)",
                    color: "white",
                  }}
                >
                  {surah.number}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {surah.name}
                    </h4>
                    <span
                      className="text-sm font-arabic"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {surah.nameArabic}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {surah.totalAyah} verses
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="px-6 py-3 rounded-full font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{ backgroundColor: "var(--accent-color, #10b981)", color: "white" }}
        >
          Save Playlist
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 rounded-full font-semibold transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PlaylistForm;
