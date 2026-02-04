import SideNavbar from "./components/sideNavbar";
import TopNavbar from "./components/topNavbar";
import Playlist from "./components/playlist";
import Surah from "./components/surah";
import RecitersSection from "./components/recitersSection";
import PlaylistDetail from "./components/playlistDetail";
import { useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import SurahPlayer from "./components/surahPlayer";
import { PlayerProvider, usePlayer } from "./context/PlayerContext";

// Import images so Vite can bundle them
import quran3Image from "./assets/quran3.png";
import quran4Image from "./assets/quran4.png";
import quran5Image from "./assets/quran5.png";

interface SurahData {
  surahName: string;
  surahNameArabic: string;
  surahNameArabicLong: string;
  surahNameTranslation: string;
  revelationPlace: string;
  totalAyah: number;
}

interface PlaylistData {
  id: number;
  mainTitle: string;
  subtitle: string;
  description: string;
  imageSrc: string;
  surahNumbers: number[]; // Surah numbers included in this playlist
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [surahs, setSurahs] = useState<SurahData[]>([]);
  const [loading, setLoading] = useState(true);
  const surahsPerPage = 16;
  const totalPages = Math.ceil(114 / surahsPerPage);

  const [currentPagemain, setCurrentPageMain] = useState("Home");
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistData | null>(null);

  const { playSurah } = usePlayer();

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://quranapi.pages.dev/api/surah.json",
        );
        const data: SurahData[] = await response.json();
        setSurahs(data);
      } catch (error) {
        console.error("Error fetching surahs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSurahs();
  }, []);

  const getCurrentPageSurahs = () => {
    const startIndex = (currentPage - 1) * surahsPerPage;
    return surahs.slice(startIndex, startIndex + surahsPerPage);
  };

  const handleMenuItemSelect = (item: string) => {
    console.log(`Menu item selected: ${item}`);
    setCurrentPageMain(item);
  };

  const playlists: PlaylistData[] = [
    {
      id: 1,
      mainTitle: "Today's Recitation",
      subtitle: "Daily Essentials",
      description:
        "Start your day with the most beautiful recitation of Al-Fatiha and selected verses.",
      imageSrc: quran5Image,
      surahNumbers: [1, 36, 67, 78, 87, 112, 113, 114], // Al-Fatiha, Ya-Sin, Al-Mulk, An-Naba, Al-A'la, Al-Ikhlas, Al-Falaq, An-Nas
    },
    {
      id: 2,
      mainTitle: "Selected Surahs",
      subtitle: "Peaceful Recitations",
      description:
        "Experience peaceful and melodious recitations with carefully selected Surahs for reflection.",
      imageSrc: quran4Image,
      surahNumbers: [18, 19, 20, 55, 56], // Al-Kahf, Maryam, Ta-Ha, Ar-Rahman, Al-Waqi'ah
    },
    {
      id: 3,
      mainTitle: "Short Surahs",
      subtitle: "For Memorization",
      description:
        "Perfect for memorization - short surahs with beautiful recitations and clear pronunciation.",
      imageSrc: quran3Image,
      surahNumbers: [93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114], // Last 22 surahs
    },
  ];

  // Helper to get playlist surahs from the loaded surah data
  const getPlaylistSurahs = (surahNumbers: number[]) => {
    return surahNumbers
      .map((num) => {
        const surah = surahs[num - 1]; // surahs array is 0-indexed
        if (surah) {
          return {
            number: num,
            name: surah.surahName,
            nameArabic: surah.surahNameArabic,
            totalAyah: surah.totalAyah,
          };
        }
        return null;
      })
      .filter((s) => s !== null);
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <SideNavbar onselectMenuItem={handleMenuItemSelect} />

      <TopNavbar />
      <div className="flex-1 flex flex-col overflow-x-hidden md:ml-[260px]">
        <main className="flex-1 px-8 py-6 pt-20 pb-28 overflow-y-auto">

          <div className="max-w-7xl">
            {/* ---------------------- */}
            {/* SHOW RECITERS PAGE     */}
            {/* ---------------------- */}
            {currentPagemain === "Reciters" && <RecitersSection />}

            {/* ---------------------- */}
            {/* SHOW PLAYLIST DETAIL   */}
            {/* ---------------------- */}
            {selectedPlaylist && (
              <PlaylistDetail
                title={selectedPlaylist.mainTitle}
                subtitle={selectedPlaylist.subtitle}
                description={selectedPlaylist.description}
                imageSrc={selectedPlaylist.imageSrc}
                surahs={getPlaylistSurahs(selectedPlaylist.surahNumbers)}
                onBack={() => setSelectedPlaylist(null)}
              />
            )}

            {/* ---------------------- */}
            {/* SHOW HOME PAGE         */}
            {/* ---------------------- */}
            {!selectedPlaylist && (currentPagemain === "Listen Now" || currentPagemain === "Home") ? (
              <>
                <h2
                  className="text-2xl font-bold mb-6"
                  style={{ color: "var(--text-primary)" }}
                >
                  Favourite Playlists
                </h2>

                <div
                  className="w-full overflow-x-auto pb-4 mb-8 md:overflow-x-visible md:pb-0 scrollbar-hide"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  <div className="flex gap-8 min-w-fit md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-6 md:min-w-0">
                    {playlists.map((playlist) => (
                      <Playlist
                        key={playlist.id}
                        mainTitle={playlist.mainTitle}
                        subtitle={playlist.subtitle}
                        description={playlist.description}
                        imageSrc={playlist.imageSrc}
                        onClick={() => setSelectedPlaylist(playlist)}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            {/* ---------------------- */}
            {/* SHOW SURAH PAGE        */}
            {/* ---------------------- */}
            {!selectedPlaylist &&
              (currentPagemain === "Browse" ||
                currentPagemain === "Listen Now" ||
                currentPagemain === "Home") && (
              <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <h2
                    className="text-2xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Quick Picks
                  </h2>

                  <div className="hidden md:flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor:
                          currentPage === 1
                            ? "transparent"
                            : "var(--sidebar-selected)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                    </button>

                    <span
                      className="text-sm px-3"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {currentPage} of {totalPages}
                    </span>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor:
                          currentPage === totalPages
                            ? "transparent"
                            : "var(--sidebar-selected)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-x-6 gap-y-1">
                  {loading
                    ? Array.from({ length: 16 }).map((_, index) => (
                        <div
                          key={index}
                          className="flex items-center p-3 rounded-lg animate-pulse"
                        >
                          <div className="w-12 h-12 rounded-md bg-gray-300 mr-4 flex-shrink-0"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-300 rounded w-1/2 mb-1"></div>
                            <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                          </div>
                        </div>
                      ))
                    : getCurrentPageSurahs().map((surah, index) => {
                        const surahNumber =
                          (currentPage - 1) * surahsPerPage + index + 1;
                        return (
                          <Surah
                            key={surahNumber}
                            number={surahNumber}
                            data={surah}
                            onClick={() =>
                              playSurah({
                                number: surahNumber,
                                name: surah.surahName,
                                nameArabic: surah.surahNameArabic,
                                totalAyah: surah.totalAyah,
                              })
                            }
                          />
                        );
                      })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Fixed bottom player */}
      <SurahPlayer />
    </div>
  );
};

// Wrap App with PlayerProvider
const AppWithProvider: React.FC = () => {
  return (
    <PlayerProvider>
      <App />
    </PlayerProvider>
  );
};

export default AppWithProvider;
