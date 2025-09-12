import SideNavbar from "./components/sideNavbar";
import TopNavbar from "./components/topNavbar";
import Playlist from "./components/playlist";
import Surah from "./components/surah";
import { useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface SurahData {
  surahName: string;
  surahNameArabic: string;
  surahNameArabicLong: string;
  surahNameTranslation: string;
  revelationPlace: string;
  totalAyah: number;
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [surahs, setSurahs] = useState<SurahData[]>([]);
  const [loading, setLoading] = useState(true);
  const surahsPerPage = 16;
  const totalPages = Math.ceil(114 / surahsPerPage); // 114 surahs total

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://quranapi.pages.dev/api/surah.json"
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
    const endIndex = startIndex + surahsPerPage;
    return surahs.slice(startIndex, endIndex);
  };

  const playlists = [
    {
      id: 1,
      mainTitle: "Today's Recitation",
      subtitle: "Sheikh Abdul Rahman Al-Sudais",
      description:
        "Start your day with the most beautiful recitation of Al-Fatiha and selected verses.",
      imageSrc: "/src/assets/quran5.png",
    },
    {
      id: 2,
      mainTitle: "Selected Surahs",
      subtitle: "Sheikh Hashim",
      description:
        "Experience the powerful and melodious voice of Sheikh Hashim with carefully selected Surahs.",
      imageSrc: "/src/assets/quran4.png",
    },
    {
      id: 3,
      mainTitle: "Full Surah Recitations",
      subtitle: "Mishary Rashid Alafasy",
      description:
        "Listen to complete Surahs with beautiful recitations and clear pronunciation.",
      imageSrc: "/src/assets/quran3.png",
    },
  ];

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <SideNavbar />
      <TopNavbar />
      <div className="flex-1 flex flex-col overflow-x-hidden md:ml-[260px]">
        <main className="flex-1 px-8 py-6 pt-20 overflow-y-auto">
          {/* Main content area */}
          <div className="max-w-7xl">
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: "var(--text-primary)" }}
            >
              Favourite Playlists
            </h2>

            {/* Playlist Grid */}
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
                    onClick={() =>
                      console.log(`${playlist.mainTitle} clicked!`)
                    }
                  />
                ))}
              </div>
            </div>

            {/* Quick Picks Section */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-2xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Quick Picks
                </h2>

                {/* Navigation Buttons */}
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
                    onMouseEnter={(e) => {
                      if (currentPage !== 1) {
                        e.currentTarget.style.backgroundColor =
                          "var(--accent-hover)";
                        e.currentTarget.style.color = "white";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== 1) {
                        e.currentTarget.style.backgroundColor =
                          "var(--sidebar-selected)";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }
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
                    onMouseEnter={(e) => {
                      if (currentPage !== totalPages) {
                        e.currentTarget.style.backgroundColor =
                          "var(--accent-hover)";
                        e.currentTarget.style.color = "white";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== totalPages) {
                        e.currentTarget.style.backgroundColor =
                          "var(--sidebar-selected)";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }
                    }}
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-x-6 gap-y-1">
                {loading
                  ? // Loading placeholder
                    Array.from({ length: 16 }).map((_, index) => (
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
                            console.log(`${surah.surahName} clicked!`)
                          }
                        />
                      );
                    })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
