import { PlayIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import { usePlayer } from "../context/PlayerContext";
import SurahListRow from "./surahListRow";

interface PlaylistSurah {
  number: number;
  name: string;
  nameArabic: string;
  totalAyah: number;
}

interface PlaylistDetailProps {
  title: string;
  subtitle: string;
  description: string;
  imageSrc: string;
  surahs: PlaylistSurah[];
  onBack: () => void;
}

const PlaylistDetail: React.FC<PlaylistDetailProps> = ({
  title,
  subtitle,
  description,
  imageSrc,
  surahs,
  onBack,
}) => {
  const { playSurahFromPlaylist, currentSurah } = usePlayer();

  const handlePlayAll = () => {
    if (surahs.length > 0) {
      playSurahFromPlaylist(surahs[0], surahs);
    }
  };

  const handlePlaySurah = (surah: PlaylistSurah) => {
    playSurahFromPlaylist(surah, surahs);
  };

  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <div className="relative h-[300px] md:h-[400px] overflow-hidden rounded-xl mb-8">
        {/* Background Image with Gradient Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${imageSrc})`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, var(--bg-primary) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)",
          }}
        />

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 p-2 rounded-full backdrop-blur-sm transition-all hover:scale-105"
          style={{
            backgroundColor: "rgba(0,0,0,0.4)",
            color: "white",
          }}
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <p
            className="text-sm uppercase tracking-wider mb-2 font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Playlist
          </p>
          <h1
            className="text-3xl md:text-5xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h1>
          <p
            className="text-base md:text-lg mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {subtitle}
          </p>
          <p
            className="text-sm max-w-2xl hidden md:block"
            style={{ color: "var(--text-tertiary)" }}
          >
            {description}
          </p>

          {/* Play Button */}
          <button
            onClick={handlePlayAll}
            className="mt-4 flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all hover:scale-105"
            style={{
              backgroundColor: "var(--accent-primary)",
              color: "white",
            }}
          >
            <PlayIcon className="w-5 h-5" />
            Play All
          </button>
        </div>
      </div>

      {/* Surah List Section */}
      <div className="mb-8">
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Surahs in this Playlist
        </h2>

        <div className="space-y-1">
          {surahs.map((surah, index) => (
            <SurahListRow
              key={surah.number}
              index={index}
              surah={surah}
              isActive={currentSurah?.number === surah.number}
              onPlay={() => handlePlaySurah(surah)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlaylistDetail;
