/**
 * Formats a duration in seconds, for example "2.5 s", "3 min 20 s" or "2 h 5 min".
 */
function formatDuration(seconds: number): string {
  const absoluteSeconds = Math.abs(seconds);
  const sign = seconds < 0 ? '−' : '';

  if (absoluteSeconds < 60) {
    const value = Number.isInteger(absoluteSeconds) ? absoluteSeconds : absoluteSeconds.toFixed(1);
    return `${sign}${value} s`;
  }

  if (absoluteSeconds < 3600) {
    return `${sign}${Math.floor(absoluteSeconds / 60)} min ${Math.round(absoluteSeconds % 60)} s`;
  }

  const hours = Math.floor(absoluteSeconds / 3600);
  return `${sign}${hours} h ${Math.round((absoluteSeconds % 3600) / 60)} min`;
}

function isValidDate(date: Date | undefined): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Formats the time of a date in UTC, for example "09:12:05".
 */
function formatTime(date: Date | undefined): string {
  if (!isValidDate(date)) {
    return '';
  }

  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Formats a date in UTC, for example "Tue, 24 Nov 2026, 09:12:05 UTC".
 */
function formatDateTime(date: Date | undefined): string {
  if (!isValidDate(date)) {
    return '';
  }

  const day = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);

  return `${day}, ${formatTime(date)} UTC`;
}

export const formatHelper = {
  formatDuration,
  formatTime,
  formatDateTime,
};
