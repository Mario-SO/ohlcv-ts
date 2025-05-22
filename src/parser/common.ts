// src/parser/common.ts
import type { Row } from "../core/row.ts";
import type { ParseErrorDetails } from "../core/errors.ts";

/**
 * Callback function that is called for each successfully parsed row.
 * 
 * Used in streaming parsers to process OHLCV data as it's parsed,
 * enabling real-time processing of large datasets without loading
 * everything into memory.
 * 
 * @param row - The parsed OHLCV data row
 * 
 * @example
 * ```typescript
 * const onRow: RowCallback = (row) => {
 *   console.log(`Price at ${new Date(row.ts * 1000)}: ${row.c}`);
 *   // Process each row as it's parsed
 * };
 * ```
 */
export type RowCallback = (row: Row) => void;

/**
 * Callback function that is called when a line fails to parse.
 * 
 * Allows custom handling of parsing errors, such as logging,
 * counting failures, or implementing fallback parsing strategies.
 * 
 * @param error - The error that occurred during parsing
 * @param lineNumber - The line number (1-indexed) where the error occurred
 * @param lineContent - The raw content of the line that failed to parse
 * @param details - Optional additional details about the parsing error
 * 
 * @example
 * ```typescript
 * const onSkipError: SkipErrorCallback = (error, lineNumber, lineContent) => {
 *   console.warn(`Skipped line ${lineNumber}: ${error.message}`);
 *   console.warn(`Content: ${lineContent.slice(0, 50)}...`);
 * };
 * ```
 */
export type SkipErrorCallback = (
  error: Error,
  lineNumber: number,
  lineContent: string,
  details?: ParseErrorDetails,
) => void;

/**
 * The expected number of fields in a valid OHLCV CSV line.
 * 
 * Format: Date,Open,High,Low,Close,Volume (6 fields total)
 */
export const EXPECTED_FIELDS = 6;
