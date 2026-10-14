export interface ReciterInfo {
  id: number;
  name: string;
}

/**
 * Every reciter quranapi has recordings for. Ids are quranapi's: they key the
 * audio for each surah and ayah, and downloads are stored under them.
 */
export const RECITERS: ReciterInfo[] = [
  { id: 1, name: "Mishary Rashid Al Afasy" },
  { id: 2, name: "Abu Bakr Al Shatri" },
  { id: 3, name: "Nasser Al Qatami" },
  { id: 4, name: "Yasser Al Dosari" },
  { id: 5, name: "Hani Ar Rifai" },
];
