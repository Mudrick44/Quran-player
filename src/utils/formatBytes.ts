/** "820 KB", "14.2 MB", "1.6 GB" — for download sizes and storage used. */
export const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent < 2 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`;
};
