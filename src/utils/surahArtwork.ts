// The API gives us no per-surah artwork, so we deal out the bundled covers
// deterministically: a surah always shows the same image, everywhere.
import quran1 from "../assets/quran1.webp";
import quran2 from "../assets/quran2.webp";
import quran3 from "../assets/quran3.webp";
import quran4 from "../assets/quran4.webp";
import quran5 from "../assets/quran5.webp";

const ARTWORK = [quran1, quran2, quran3, quran4, quran5];

export const getSurahArtwork = (surahNumber: number) =>
  ARTWORK[(Math.max(1, surahNumber) - 1) % ARTWORK.length];
