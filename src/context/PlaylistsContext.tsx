import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CustomPlaylist {
  id: string;
  name: string;
  surahNumbers: number[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "quranPlayer.customPlaylists";

const loadPlaylistsFromStorage = (): CustomPlaylist[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error loading playlists from storage:", error);
    return [];
  }
};

interface PlaylistsContextType {
  playlists: CustomPlaylist[];
  getPlaylist: (id: string) => CustomPlaylist | undefined;
  createPlaylist: (name: string, surahNumbers: number[]) => CustomPlaylist;
  renamePlaylist: (id: string, name: string) => void;
  updatePlaylistSurahs: (id: string, surahNumbers: number[]) => void;
  removeSurahFromPlaylist: (id: string, surahNumber: number) => void;
  deletePlaylist: (id: string) => void;
}

const PlaylistsContext = createContext<PlaylistsContextType | undefined>(undefined);

interface PlaylistsProviderProps {
  children: ReactNode;
}

export const PlaylistsProvider = ({ children }: PlaylistsProviderProps) => {
  const [playlists, setPlaylists] = useState<CustomPlaylist[]>(() =>
    loadPlaylistsFromStorage()
  );

  // Persist to localStorage whenever playlists change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
    } catch (error) {
      console.error("Error saving playlists to storage:", error);
    }
  }, [playlists]);

  const getPlaylist = (id: string) => playlists.find((p) => p.id === id);

  const createPlaylist = (name: string, surahNumbers: number[]) => {
    const now = Date.now();
    const newPlaylist: CustomPlaylist = {
      id: `playlist-${now}-${Math.random().toString(36).slice(2, 9)}`,
      name: name.trim() || "Untitled Playlist",
      surahNumbers,
      createdAt: now,
      updatedAt: now,
    };
    setPlaylists((prev) => [...prev, newPlaylist]);
    return newPlaylist;
  };

  const renamePlaylist = (id: string, name: string) => {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, name: name.trim() || p.name, updatedAt: Date.now() }
          : p
      )
    );
  };

  const updatePlaylistSurahs = (id: string, surahNumbers: number[]) => {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, surahNumbers, updatedAt: Date.now() } : p
      )
    );
  };

  const removeSurahFromPlaylist = (id: string, surahNumber: number) => {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              surahNumbers: p.surahNumbers.filter((n) => n !== surahNumber),
              updatedAt: Date.now(),
            }
          : p
      )
    );
  };

  const deletePlaylist = (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <PlaylistsContext.Provider
      value={{
        playlists,
        getPlaylist,
        createPlaylist,
        renamePlaylist,
        updatePlaylistSurahs,
        removeSurahFromPlaylist,
        deletePlaylist,
      }}
    >
      {children}
    </PlaylistsContext.Provider>
  );
};

export const useCustomPlaylists = () => {
  const context = useContext(PlaylistsContext);
  if (context === undefined) {
    throw new Error("useCustomPlaylists must be used within a PlaylistsProvider");
  }
  return context;
};
