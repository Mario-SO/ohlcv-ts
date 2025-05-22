// src/utils/date.ts
import {
  DateBeforeEpochError,
  InvalidDateFormatError,
} from "../core/errors.ts";

/**
 * Parses a date string in `YYYY-MM-DD` format (UTC) to seconds since Unix epoch.
 * 
 * Converts a date string in ISO date format to a Unix timestamp (seconds since
 * January 1, 1970, 00:00:00 UTC). The input date is treated as UTC midnight.
 * 
 * @param dateStr - Date string in YYYY-MM-DD format (e.g., "2023-01-01")
 * @returns Unix timestamp in seconds (not milliseconds)
 * 
 * @throws {InvalidDateFormatError} When the date string format is invalid
 * @throws {DateBeforeEpochError} When the date is before 1970-01-01
 * 
 * @example
 * ```typescript
 * import { yyyymmddToUnix } from "@mso/ohlcv/utils";
 * 
 * const timestamp = yyyymmddToUnix("2023-01-01");
 * console.log(timestamp); // 1672531200
 * 
 * const date = new Date(timestamp * 1000);
 * console.log(date.toISOString()); // "2023-01-01T00:00:00.000Z"
 * ```
 */
export function yyyymmddToUnix(dateStr: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new InvalidDateFormatError(
      `Invalid date format: "${dateStr}". Expected YYYY-MM-DD.`,
    );
  }

  const parts = dateStr.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new InvalidDateFormatError(
      `Non-numeric components in date: "${dateStr}".`,
    );
  }

  if (year < 1970) {
    throw new DateBeforeEpochError(
      `Date ${dateStr} is before Unix epoch (1970-01-01).`,
    );
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new InvalidDateFormatError(
      `Invalid date components in "${dateStr}".`,
    );
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new InvalidDateFormatError(
      `Invalid date: "${dateStr}" (e.g., February 30th).`,
    );
  }

  return Math.floor(date.getTime() / 1000);
}
