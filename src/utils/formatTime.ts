/**
 * Time formatting shared by every player surface (bottom pill, now-playing
 * sheet, playlist rows) so they can never drift apart.
 */

/** "3:07" — falls back to "0:00" for NaN/unknown values. */
export const formatTime = (seconds: number | null | undefined) => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return "0:00";
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

/** Same as formatTime, but shows "--:--" while a duration is still loading. */
export const formatDuration = (seconds: number | null) => {
  if (seconds === null || isNaN(seconds)) return "--:--";
  return formatTime(seconds);
};

/** Countdown to the end of the track, e.g. "-0:22". */
export const formatRemaining = (currentTime: number, duration: number) => {
  if (!duration || isNaN(duration)) return "-0:00";
  return `-${formatTime(duration - currentTime)}`;
};
