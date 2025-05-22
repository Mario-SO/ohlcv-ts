// src/core/errors.ts

/**
 * Base error class for all library-specific errors.
 * 
 * Provides consistent error handling with proper prototype chain setup
 * for instanceof checks to work correctly across different environments.
 */
export class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Details about a parsing error, providing context about what went wrong.
 * 
 * @example
 * ```typescript
 * const details: ParseErrorDetails = {
 *   lineContent: "2023-01-01,invalid,100,90,95,1000",
 *   lineNumber: 42,
 *   invalidField: "open",
 *   reason: "Expected number, got 'invalid'"
 * };
 * ```
 */
export interface ParseErrorDetails {
  /** The raw content of the line that failed to parse */
  lineContent?: string;
  /** The line number (1-indexed) where the error occurred */
  lineNumber?: number;
  /** Which field in the OHLCV data was invalid */
  invalidField?: "timestamp" | "open" | "high" | "low" | "close" | "volume";
  /** Human-readable explanation of why the parsing failed */
  reason?: string;
}

/**
 * General parsing error that occurs when CSV data cannot be processed.
 * 
 * This is the base class for all parsing-related errors and includes
 * optional details about the specific parsing failure.
 * 
 * @example
 * ```typescript
 * throw new ParseError("Invalid CSV format", {
 *   lineNumber: 5,
 *   lineContent: "malformed,data,line",
 *   reason: "Expected 6 fields, got 3"
 * });
 * ```
 */
export class ParseError extends BaseError {
  /** Additional details about the parsing error */
  public details?: ParseErrorDetails;
  constructor(message: string, details?: ParseErrorDetails) {
    super(message);
    this.details = details;
  }
}

/**
 * Error thrown when the overall format of a CSV line is invalid.
 * 
 * Examples: wrong number of fields, all zero values, etc.
 */
export class InvalidFormatError extends ParseError {}

/**
 * Error thrown when a timestamp field cannot be parsed.
 * 
 * This includes invalid date formats, dates before epoch, etc.
 */
export class InvalidTimestampError extends ParseError {}

/**
 * Error thrown when the opening price field is invalid.
 * 
 * Typically occurs when the value is not a valid number.
 */
export class InvalidOpenError extends ParseError {}

/**
 * Error thrown when the high price field is invalid.
 * 
 * Typically occurs when the value is not a valid number.
 */
export class InvalidHighError extends ParseError {}

/**
 * Error thrown when the low price field is invalid.
 * 
 * Typically occurs when the value is not a valid number.
 */
export class InvalidLowError extends ParseError {}

/**
 * Error thrown when the closing price field is invalid.
 * 
 * Typically occurs when the value is not a valid number.
 */
export class InvalidCloseError extends ParseError {}

/**
 * Error thrown when the volume field is invalid.
 * 
 * Typically occurs when the value is not a valid number.
 */
export class InvalidVolumeError extends ParseError {}

/**
 * Base error class for all date-related operations.
 * 
 * Used for errors in date parsing, validation, and conversion functions.
 */
export class DateError extends BaseError {}

/**
 * Error thrown when a date string is not in the expected YYYY-MM-DD format.
 * 
 * @example
 * ```typescript
 * // These would throw InvalidDateFormatError:
 * yyyymmddToUnix("2023/01/01");  // Wrong separator
 * yyyymmddToUnix("23-01-01");    // Wrong year format
 * yyyymmddToUnix("2023-13-01");  // Invalid month
 * ```
 */
export class InvalidDateFormatError extends DateError {}

/**
 * Error thrown when attempting to parse a date before the Unix epoch (1970-01-01).
 * 
 * Since Unix timestamps start at January 1, 1970, earlier dates cannot be represented.
 * 
 * @example
 * ```typescript
 * // This would throw DateBeforeEpochError:
 * yyyymmddToUnix("1969-12-31");
 * ```
 */
export class DateBeforeEpochError extends DateError {}

/**
 * Base error class for all network fetch operations.
 * 
 * Used when fetching CSV data from remote sources fails.
 */
export class FetchError extends BaseError {
  /** The underlying error that caused the fetch to fail */
  public override cause?: Error;
  constructor(message: string, cause?: Error) {
    super(message);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Error thrown when an HTTP request fails with a specific status code.
 * 
 * This provides detailed information about HTTP failures, including
 * status codes and status text for debugging network issues.
 * 
 * @example
 * ```typescript
 * // Thrown when fetching returns 404:
 * new HttpError("Failed to fetch", 404, "Not Found")
 * ```
 */
export class HttpError extends FetchError {
  /** HTTP status code (e.g., 404, 500, 403) */
  public statusCode?: number;
  /** HTTP status text (e.g., "Not Found", "Internal Server Error") */
  public statusText?: string;
  constructor(messagePrefix: string, statusCode?: number, statusText?: string) {
    const fullMessage = `${messagePrefix}${
      statusCode ? `: ${statusCode}` : ""
    }${statusText ? ` ${statusText}` : ""}`;
    super(fullMessage);
    this.statusCode = statusCode;
    this.statusText = statusText;
  }
}
