import { useState } from "react";
import { PlusIcon, MusicalNoteIcon } from "@heroicons/react/24/outline";
import { useCustomPlaylists } from "../context/PlaylistsContext";
import type { CustomPlaylist } from "../context/PlaylistsContext";
import Playlist from "./playlist";
import PlaylistForm from "./playlistForm";
import CustomPlaylistDetail from "./customPlaylistDetail";

type View = "list" | "form" | "detail";

const MyPlaylistsPage: React.FC = () => {
  const { playlists } = useCustomPlaylists();
  const [view, setView] = useState<View>("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingPlaylist, setEditingPlaylist] = useState<CustomPlaylist | null>(null);

  const activePlaylist = playlists.find((p) => p.id === activeId) ?? null;

  const openCreate = () => {
    setEditingPlaylist(null);
    setView("form");
  };

  if (view === "form") {
    return (
      <PlaylistForm
        editingPlaylist={editingPlaylist}
        onCancel={() => setView(editingPlaylist ? "detail" : "list")}
        onSaved={(playlist) => {
          setActiveId(playlist.id);
          setEditingPlaylist(null);
          setView("detail");
        }}
      />
    );
  }

  if (view === "detail" && activePlaylist) {
    return (
      <CustomPlaylistDetail
        playlist={activePlaylist}
        onBack={() => setView("list")}
        onEdit={() => {
          setEditingPlaylist(activePlaylist);
          setView("form");
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          My Playlists
        </h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all hover:scale-105"
          style={{ backgroundColor: "var(--accent-color, #10b981)", color: "white" }}
        >
          <PlusIcon className="w-5 h-5" />
          New Playlist
        </button>
      </div>

      {playlists.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center text-center py-20"
          style={{ color: "var(--text-secondary)" }}
        >
          <MusicalNoteIcon className="w-12 h-12 mb-4 opacity-50" />
          <p className="mb-1 font-medium" style={{ color: "var(--text-primary)" }}>
            No playlists yet
          </p>
          <p className="text-sm mb-4">Create your own playlist from any surahs.</p>
          <button
            onClick={openCreate}
            className="px-5 py-2 rounded-full font-semibold transition-all hover:scale-105"
            style={{ backgroundColor: "var(--accent-color, #10b981)", color: "white" }}
          >
            Create Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map((playlist) => (
            <Playlist
              key={playlist.id}
              mainTitle={playlist.name}
              subtitle={`${playlist.surahNumbers.length} surah${
                playlist.surahNumbers.length === 1 ? "" : "s"
              }`}
              onClick={() => {
                setActiveId(playlist.id);
                setView("detail");
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPlaylistsPage;
