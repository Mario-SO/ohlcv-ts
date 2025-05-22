// src/core/errors.ts

export class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface ParseErrorDetails {
  lineContent?: string;
  lineNumber?: number;
  invalidField?: "timestamp" | "open" | "high" | "low" | "close" | "volume";
  reason?: string;
}

export class ParseError extends BaseError {
  public details?: ParseErrorDetails;
  constructor(message: string, details?: ParseErrorDetails) {
    super(message);
    this.details = details;
  }
}

export class InvalidFormatError extends ParseError {}
export class InvalidTimestampError extends ParseError {}
export class InvalidOpenError extends ParseError {}
export class InvalidHighError extends ParseError {}
export class InvalidLowError extends ParseError {}
export class InvalidCloseError extends ParseError {}
export class InvalidVolumeError extends ParseError {}

export class DateError extends BaseError {}
export class InvalidDateFormatError extends DateError {}
export class DateBeforeEpochError extends DateError {}

export class FetchError extends BaseError {
  public override cause?: Error; // Added 'override' keyword
  constructor(message: string, cause?: Error) {
    super(message);
    if (cause) {
      this.cause = cause;
    }
  }
}

export class HttpError extends FetchError {
  public statusCode?: number;
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
