import { PlayIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import { usePlayer } from "../context/PlayerContext";

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
  const { playSurah, currentSurah, isPlaying } = usePlayer();

  const handlePlayAll = () => {
    if (surahs.length > 0) {
      playSurah(surahs[0]);
    }
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
              backgroundColor: "var(--accent-color, #10b981)",
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
          {surahs.map((surah, index) => {
            const isCurrentlyPlaying =
              currentSurah?.number === surah.number && isPlaying;

            return (
              <div
                key={surah.number}
                onClick={() => playSurah(surah)}
                className="group flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all"
                style={{
                  backgroundColor: isCurrentlyPlaying
                    ? "var(--sidebar-selected)"
                    : "transparent",
                }}
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
                  <span className="group-hover:hidden text-sm">
                    {index + 1}
                  </span>
                  <PlayIcon className="w-4 h-4 hidden group-hover:block" />
                </div>

                {/* Surah Number Badge */}
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                  style={{
                    backgroundColor: isCurrentlyPlaying
                      ? "var(--accent-color, #10b981)"
                      : "var(--sidebar-selected)",
                    color: isCurrentlyPlaying
                      ? "white"
                      : "var(--text-primary)",
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
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {surah.totalAyah} verses
                  </p>
                </div>

                {/* Playing Indicator */}
                {isCurrentlyPlaying && (
                  <div className="flex items-center gap-1 mr-2">
                    <div
                      className="w-1 h-3 rounded-full animate-pulse"
                      style={{ backgroundColor: "var(--accent-color, #10b981)" }}
                    />
                    <div
                      className="w-1 h-4 rounded-full animate-pulse"
                      style={{
                        backgroundColor: "var(--accent-color, #10b981)",
                        animationDelay: "0.2s",
                      }}
                    />
                    <div
                      className="w-1 h-2 rounded-full animate-pulse"
                      style={{
                        backgroundColor: "var(--accent-color, #10b981)",
                        animationDelay: "0.4s",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlaylistDetail;
