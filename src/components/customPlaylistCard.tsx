import type { CustomPlaylist } from "../context/PlaylistsContext";
import { usePlaylistCover } from "../hooks/usePlaylistCover";
import Playlist from "./playlist";

interface CustomPlaylistCardProps {
  playlist: CustomPlaylist;
  onClick: () => void;
}

/**
 * Wraps the presentational Playlist card so each user playlist can resolve its
 * own cover art. The artwork hook needs a component of its own — it cannot be
 * called from inside a `.map()` callback.
 *
 * The cover is taken from the playlist's first surah, so it stays stable as
 * long as that surah does.
 */
const CustomPlaylistCard: React.FC<CustomPlaylistCardProps> = ({
  playlist,
  onClick,
}) => {
  const { src: cover } = usePlaylistCover(playlist);
  const count = playlist.surahNumbers.length;

  return (
    <Playlist
      mainTitle={playlist.name}
      subtitle={`${count} surah${count === 1 ? "" : "s"}`}
      imageSrc={cover}
      onClick={onClick}
    />
  );
};

export default CustomPlaylistCard;
