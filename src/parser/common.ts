// src/parser/common.ts
import type { Row } from "../core/row.ts";
import type { ParseErrorDetails } from "../core/errors.ts";

export type RowCallback = (row: Row) => void;
export type SkipErrorCallback = (
  error: Error,
  lineNumber: number,
  lineContent: string,
  details?: ParseErrorDetails,
) => void;

export const EXPECTED_FIELDS = 6;
