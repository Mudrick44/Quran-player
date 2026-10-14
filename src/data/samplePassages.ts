/** A short passage for hearing what a reciter sounds like. */
export interface SamplePassage {
  id: string;
  title: string;
  /** e.g. "Al-Baqarah 2:255" */
  reference: string;
  surah: number;
  /** Inclusive range, played one ayah after another */
  fromAyah: number;
  toAyah: number;
}

export const AYAT_AL_KURSI: SamplePassage = {
  id: "ayat-al-kursi",
  title: "Ayat al-Kursi",
  reference: "Al-Baqarah 2:255",
  surah: 2,
  fromAyah: 255,
  toAyah: 255,
};

export const DEFAULT_SAMPLE_PASSAGE = AYAT_AL_KURSI;

export const passageAyahs = (passage: SamplePassage) =>
  Array.from(
    { length: passage.toAyah - passage.fromAyah + 1 },
    (_, i) => passage.fromAyah + i
  );
