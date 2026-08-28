/** Shared date / duration formatting for the received-chain views. */

function isValidDate(d: Date | undefined): d is Date {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

/** `YYYY-MM-DD, HH:MM:SS` in UTC, or '' for an unparseable date. */
export function formatUtc(date: Date | undefined): string {
  if (!isValidDate(date)) return '';

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(date);
}

/** Human duration: `42s`, `7m 12s`, `2h 05m`. Negative input keeps its sign. */
export function formatDuration(seconds: number): string {
  const sign = seconds < 0 ? '-' : '';
  const total = Math.round(Math.abs(seconds));

  if (total < 90) return `${sign}${total}s`;

  const minutes = Math.floor(total / 60);
  if (minutes < 90) return `${sign}${minutes}m ${total % 60}s`;

  const hours = Math.floor(minutes / 60);
  return `${sign}${hours}h ${String(minutes % 60).padStart(2, '0')}m`;
}
