import SideNavbar from "./components/sideNavbar";
import TopNavbar from "./components/topNavbar";
import Playlist from "./components/playlist";
import Surah from "./components/surah";
import RecitersSection from "./components/recitersSection";
import PlaylistDetail from "./components/playlistDetail";
import MyPlaylistsPage from "./components/myPlaylistsPage";
import { useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import SurahPlayer from "./components/surahPlayer";
import InstallAppSheet from "./components/installAppSheet";
import { useInstallPrompt } from "./hooks/useInstallPrompt";
import { useIsDesktop, useHasTabBar } from "./hooks/useMediaQuery";
import TabBar from "./components/tabBar";
import UpdateBanner from "./components/updateBanner";
import { PlayerProvider, usePlayer } from "./context/PlayerContext";
import { PlaylistsProvider } from "./context/PlaylistsContext";

// Import images so Vite can bundle them
import quran3Image from "./assets/quran3.webp";
import quran4Image from "./assets/quran4.webp";
import quran5Image from "./assets/quran5.webp";

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

const INSTALL_DISMISSED_KEY = "quranPlayer.installPrompt.dismissedAt";
const INSTALL_SNOOZE = 14 * 24 * 60 * 60 * 1000; // 14 days

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [surahs, setSurahs] = useState<SurahData[]>([]);
  const [loading, setLoading] = useState(true);
  const surahsPerPage = 16;
  const totalPages = Math.ceil(114 / surahsPerPage);

  const [currentPagemain, setCurrentPageMain] = useState("Home");
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistData | null>(null);

  const { playSurah, setSurahList, setPlaylist, currentSurah, isPlaying } = usePlayer();

  const { isIOS, isInstallable, canPromptInstall, promptInstall } = useInstallPrompt();
  const [isInstallSheetOpen, setIsInstallSheetOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const hasTabBar = useHasTabBar();

  // Offer installing once on phones, a moment after arriving rather than on
  // top of the first paint. A dismissal holds for two weeks.
  useEffect(() => {
    if (!isInstallable || isDesktop) return;

    try {
      const dismissedAt = Number(localStorage.getItem(INSTALL_DISMISSED_KEY));
      if (dismissedAt && Date.now() - dismissedAt < INSTALL_SNOOZE) return;
    } catch {
      // Storage unavailable: still worth offering
    }

    const timer = setTimeout(() => setIsInstallSheetOpen(true), 5000);
    return () => clearTimeout(timer);
  }, [isInstallable, isDesktop]);

  const closeInstallSheet = () => {
    setIsInstallSheetOpen(false);
    try {
      localStorage.setItem(INSTALL_DISMISSED_KEY, String(Date.now()));
    } catch {
      // Worst case it is offered again next visit
    }
  };

  const handleInstall = async () => {
    await promptInstall();
    setIsInstallSheetOpen(false);
  };

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://quranapi.pages.dev/api/surah.json",
        );
        const data: SurahData[] = await response.json();
        setSurahs(data);

        // Pass surah data to PlayerContext for proper metadata in playNext/playPrevious
        const surahInfoList = data.map((surah, index) => ({
          number: index + 1,
          name: surah.surahName,
          nameArabic: surah.surahNameArabic,
          totalAyah: surah.totalAyah,
        }));
        setSurahList(surahInfoList);
      } catch (error) {
        console.error("Error fetching surahs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSurahs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentPageSurahs = () => {
    const startIndex = (currentPage - 1) * surahsPerPage;
    return surahs.slice(startIndex, startIndex + surahsPerPage);
  };

  const handleMenuItemSelect = (item: string) => {
    console.log(`Menu item selected: ${item}`);
    // Clear any open curated playlist so it doesn't keep rendering
    // underneath whichever tab the user just switched to
    setSelectedPlaylist(null);
    setCurrentPageMain(item);
  };

  // "Home" is the initial page and the same screen as Listen Now
  const activeTab = currentPagemain === "Home" ? "Listen Now" : currentPagemain;

  // As on iOS: tapping the current tab returns to its top, switching tabs
  // starts the new one at the top
  const handleTabSelect = (tab: string) => {
    const isReselect = tab === activeTab;
    handleMenuItemSelect(tab);
    window.scrollTo({ top: 0, behavior: isReselect ? "smooth" : "instant" });
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
      <SideNavbar
        onselectMenuItem={handleMenuItemSelect}
        onInstallApp={isInstallable ? () => setIsInstallSheetOpen(true) : undefined}
        showMobileMenu={!hasTabBar}
      />

      <TopNavbar title={hasTabBar ? activeTab : undefined} />
      <div className="flex-1 flex flex-col overflow-x-hidden md:ml-[260px]">
        <main
          className={`flex-1 px-8 py-6 pt-[calc(5rem+env(safe-area-inset-top))] overflow-y-auto ${
            // Room for the mini player, plus the tab bar when there is one
            hasTabBar
              ? "pb-[calc(49px+6rem+env(safe-area-inset-bottom))]"
              : "pb-[calc(7rem+env(safe-area-inset-bottom))]"
          }`}
        >

          <div className="max-w-7xl">
            {/* ---------------------- */}
            {/* SHOW RECITERS PAGE     */}
            {/* ---------------------- */}
            {currentPagemain === "Reciters" && <RecitersSection />}

            {/* ---------------------- */}
            {/* SHOW MY PLAYLISTS PAGE */}
            {/* ---------------------- */}
            {currentPagemain === "My Playlists" && <MyPlaylistsPage />}

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
                  className="w-full overflow-x-auto pb-4 md:overflow-x-visible md:pb-0 scrollbar-hide"
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

                {/* Swipe indicator - Mobile only */}
                <div className="flex md:hidden items-center justify-center gap-1.5 mt-2 mb-8">
                  {playlists.map((_, index) => (
                    <div
                      key={index}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: "var(--text-tertiary)" }}
                    />
                  ))}
                  <span
                    className="text-xs ml-2"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Swipe to explore
                  </span>
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
                            isActive={currentSurah?.number === surahNumber}
                            isPlaying={isPlaying}
                            onClick={() => {
                              // Clear playlist context when playing from Quick Picks (sequential mode)
                              setPlaylist(null);
                              playSurah({
                                number: surahNumber,
                                name: surah.surahName,
                                nameArabic: surah.surahNameArabic,
                                totalAyah: surah.totalAyah,
                              });
                            }}
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

      {hasTabBar && <TabBar activeTab={activeTab} onSelect={handleTabSelect} />}

      <UpdateBanner />

      <InstallAppSheet
        isOpen={isInstallSheetOpen}
        onClose={closeInstallSheet}
        isIOS={isIOS}
        canPromptInstall={canPromptInstall}
        onInstall={handleInstall}
      />
    </div>
  );
};

// Wrap App with PlayerProvider
const AppWithProvider: React.FC = () => {
  return (
    <PlayerProvider>
      <PlaylistsProvider>
        <App />
      </PlaylistsProvider>
    </PlayerProvider>
  );
};

export default AppWithProvider;
