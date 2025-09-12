interface PlaylistProps {
  mainTitle: string;
  subtitle: string;
  description: string;
  imageSrc: string;
  onClick?: () => void;
}

const Playlist = ({
  mainTitle,
  subtitle,
  description,
  imageSrc,
  onClick,
}: PlaylistProps) => {
  return (
    <div
      className="group cursor-pointer w-[85vw] max-w-[420px] flex-shrink-0 md:w-auto md:flex-shrink"
      onClick={onClick}
    >
      {/* Main Title */}
      <h2
        className="text-[17px] font-bold mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        {mainTitle}
      </h2>

      {/* Subtitle */}
      <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
        {subtitle}
      </p>

      {/* Visual Card */}
      <div className="relative mb-3 overflow-hidden rounded-lg shadow-lg">
        <img
          src={imageSrc}
          alt={mainTitle}
          className="w-full h-64 object-cover"
        />

        {/* Play Button - Bottom Right Corner */}
        <div className="absolute bottom-3 right-3">
          <div className="w-12 h-12 bg-black bg-opacity-60 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg border border-opacity-20">
            <svg
              className="w-5 h-5 text-white ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Descriptive Text Overlay - Bottom of Image */}
        <div
          className="absolute bottom-0 left-0 right-0 p-4"
          style={{
            background:
              "linear-gradient(to top, var(--overlay), rgba(0,0,0,0.2), transparent)",
          }}
        >
          <p className="text-sm leading-relaxed text-white">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default Playlist;
