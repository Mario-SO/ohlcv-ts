// src/core/row.ts

/**
 * Represents a single row of OHLCV (Open, High, Low, Close, Volume) financial data.
 *
 * This is the standard data structure used throughout the library for representing
 * financial market data points, typically for a specific time period (e.g., daily, hourly).
 *
 * @example
 * ```typescript
 * const row: Row = {
 *   ts: 1640995200,    // Unix timestamp for 2022-01-01
 *   o: 47686.81,       // Opening price
 *   h: 47865.45,       // Highest price
 *   l: 46617.24,       // Lowest price
 *   c: 46498.76,       // Closing price
 *   v: 1234567         // Volume traded
 * };
 * ```
 */
export interface Row {
  /** Unix timestamp in seconds since epoch (January 1, 1970, 00:00:00 UTC) */
  ts: number;
  /** Opening price for the time period */
  o: number;
  /** Highest price reached during the time period */
  h: number;
  /** Lowest price reached during the time period */
  l: number;
  /** Closing price at the end of the time period */
  c: number;
  /** Total volume traded during the time period */
  v: number;
}
