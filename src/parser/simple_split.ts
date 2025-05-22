// src/parser/simple_split.ts
import type { Row } from "../core/row.ts";
import { yyyymmddToUnix } from "../utils/date.ts";
import {
  DateBeforeEpochError,
  InvalidCloseError,
  InvalidDateFormatError,
  InvalidFormatError,
  InvalidHighError,
  InvalidLowError,
  InvalidOpenError,
  InvalidTimestampError,
  InvalidVolumeError,
} from "../core/errors.ts";
import { EXPECTED_FIELDS } from "./common.ts";

function parseLineToRowSimple(line: string, lineNumber?: number): Row {
  const fields = line.split(",");
  if (fields.length !== EXPECTED_FIELDS) {
    throw new InvalidFormatError(
      `Expected ${EXPECTED_FIELDS}, got ${fields.length}.`,
      { lineNumber, lineContent: line },
    );
  }
  const [dateStr, openStr, highStr, lowStr, closeStr, volumeStr] = fields.map(
    (f) => f.trim(),
  );
  let ts;
  try {
    ts = yyyymmddToUnix(dateStr);
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    if (e instanceof DateBeforeEpochError) {
      throw new DateBeforeEpochError(reason);
    }
    if (e instanceof InvalidDateFormatError) {
      throw new InvalidDateFormatError(reason);
    }
    throw new InvalidTimestampError(`Date: "${dateStr}" - ${reason}`, {
      lineNumber,
      lineContent: line,
    });
  }
  const o = +openStr;
  if (isNaN(o)) {
    throw new InvalidOpenError(`Open: "${openStr}"`, {
      lineNumber,
      lineContent: line,
    });
  }
  const h = +highStr;
  if (isNaN(h)) {
    throw new InvalidHighError(`High: "${highStr}"`, {
      lineNumber,
      lineContent: line,
    });
  }
  const l = +lowStr;
  if (isNaN(l)) {
    throw new InvalidLowError(`Low: "${lowStr}"`, {
      lineNumber,
      lineContent: line,
    });
  }
  const c = +closeStr;
  if (isNaN(c)) {
    throw new InvalidCloseError(`Close: "${closeStr}"`, {
      lineNumber,
      lineContent: line,
    });
  }
  const v = +volumeStr;
  if (isNaN(v)) {
    throw new InvalidVolumeError(`Volume: "${volumeStr}"`, {
      lineNumber,
      lineContent: line,
    });
  }

  if (o === 0 && h === 0 && l === 0 && c === 0 && v === 0) {
    throw new InvalidFormatError(`All zero values`, {
      lineNumber,
      lineContent: line,
    });
  }
  return { ts, o, h, l, c, v };
}

/**
 * Parses CSV data from a string using a simple line-by-line split.
 */
export function parseWithSimpleSplit(
  csvContent: string,
  skipHeader: boolean = true,
): Row[] {
  const lines = csvContent.split(/\r?\n/);
  const rows: Row[] = [];
  const startLine = skipHeader ? 1 : 0;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) continue;
    try {
      rows.push(parseLineToRowSimple(line, i + 1));
    } catch (e) {
      // console.warn(`SimpleSplit L${i + 1}: Skip - ${e instanceof Error ? e.message : String(e)} Line: "${line.slice(0,50)}"`);
    }
  }
  return rows;
}
