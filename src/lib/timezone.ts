/**
 * Timezone and Date utilities for VectorOps
 * All dates stored canonical in UTC; displayed in target IANA timezone
 */

export const POPULAR_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +05:30)' },
  { value: 'America/New_York', label: 'America/New_York (EDT/EST -04:00/-05:00)' },
  { value: 'America/Chicago', label: 'America/Chicago (CDT/CST -05:00/-06:00)' },
  { value: 'America/Denver', label: 'America/Denver (MDT/MST -06:00/-07:00)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PDT/PST -07:00/-08:00)' },
  { value: 'Europe/London', label: 'Europe/London (BST/GMT +01:00/+00:00)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CEST/CET +02:00/+01:00)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST +04:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT +08:00)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST +10:00)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
];

/**
 * Format a UTC ISO timestamp in a specified IANA timezone
 */
export function formatInTimezone(
  utcIsoString: string,
  timeZone: string,
  format: 'datetime' | 'date' | 'time' | 'short-date' = 'datetime'
): string {
  try {
    const date = new Date(utcIsoString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const options: Intl.DateTimeFormatOptions = {
      timeZone,
    };

    if (format === 'datetime') {
      options.month = 'short';
      options.day = 'numeric';
      options.year = 'numeric';
      options.hour = 'numeric';
      options.minute = '2-digit';
      options.hour12 = true;
    } else if (format === 'date') {
      options.month = 'short';
      options.day = 'numeric';
      options.year = 'numeric';
    } else if (format === 'short-date') {
      options.month = 'numeric';
      options.day = 'numeric';
    } else if (format === 'time') {
      options.hour = 'numeric';
      options.minute = '2-digit';
      options.hour12 = true;
    }

    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (err) {
    console.error('Timezone formatting error:', err);
    return new Date(utcIsoString).toLocaleString();
  }
}

/**
 * Get short abbreviation/offset for timezone (e.g. IST, EDT)
 */
export function getTimezoneAbbreviation(utcIsoString: string, timeZone: string): string {
  try {
    const date = new Date(utcIsoString);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : timeZone;
  } catch {
    return timeZone;
  }
}

/**
 * Format money safely in USD from integer cents.
 * NEVER uses floating point arithmetic for currency.
 * e.g. 49900 -> "$499.00"
 */
export function formatUSD(cents: number): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(Math.round(cents));
  const dollars = Math.floor(absCents / 100);
  const remainingCents = absCents % 100;
  const formatted = `$${dollars.toLocaleString('en-US')}.${remainingCents.toString().padStart(2, '0')}`;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Convert user input dollars string to integer cents
 * e.g. "499" or "499.00" -> 49900
 */
export function parseDollarsToCents(amountStr: string | number): number {
  if (typeof amountStr === 'number') {
    return Math.round(amountStr * 100);
  }
  const cleaned = amountStr.replace(/[^0-9.]/g, '');
  const [dollars = '0', cents = '00'] = cleaned.split('.');
  const intDollars = parseInt(dollars, 10) || 0;
  const intCents = parseInt(cents.padEnd(2, '0').slice(0, 2), 10) || 0;
  return intDollars * 100 + intCents;
}
