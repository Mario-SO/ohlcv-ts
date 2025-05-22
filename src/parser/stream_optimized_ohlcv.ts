// src/parser/stream_optimized_ohlcv.ts
import type { Row } from "../core/row.ts";
import { yyyymmddToUnix } from "../utils/date.ts";
import type { RowCallback, SkipErrorCallback } from "./common.ts";
import { InvalidFormatError, ParseError } from "../core/errors.ts";

const reusableOptimizedRow: Partial<Row> = {};

function parseOhlcvLineOptimizedInternal(line: string): Row | null {
  let p1 = -1, p2 = -1, p3 = -1, p4 = -1, p5 = -1;
  let commaCount = 0;

  for (let i = 0; i < line.length; ++i) {
    // comma acii
    if (line.charCodeAt(i) === 44) {
      commaCount++;
      if (commaCount === 1) p1 = i;
      else if (commaCount === 2) p2 = i;
      else if (commaCount === 3) p3 = i;
      else if (commaCount === 4) p4 = i;
      else if (commaCount === 5) {
        p5 = i;
        break;
      }
    }
  }

  if (commaCount !== 5) return null;

  try {
    reusableOptimizedRow.ts = yyyymmddToUnix(line.substring(0, p1));
    reusableOptimizedRow.o = +line.substring(p1 + 1, p2);
    reusableOptimizedRow.h = +line.substring(p2 + 1, p3);
    reusableOptimizedRow.l = +line.substring(p3 + 1, p4);
    reusableOptimizedRow.c = +line.substring(p4 + 1, p5);
    reusableOptimizedRow.v = +line.substring(p5 + 1);

    if (
      isNaN(reusableOptimizedRow.ts) || isNaN(reusableOptimizedRow.o) ||
      isNaN(reusableOptimizedRow.h) ||
      isNaN(reusableOptimizedRow.l) || isNaN(reusableOptimizedRow.c) ||
      isNaN(reusableOptimizedRow.v)
    ) {
      return null;
    }
    if (
      reusableOptimizedRow.o === 0 && reusableOptimizedRow.h === 0 &&
      reusableOptimizedRow.l === 0 &&
      reusableOptimizedRow.c === 0 && reusableOptimizedRow.v === 0 &&
      reusableOptimizedRow.ts !== 0
    ) {
      return null;
    }

    return {
      ts: reusableOptimizedRow.ts as number,
      o: reusableOptimizedRow.o as number,
      h: reusableOptimizedRow.h as number,
      l: reusableOptimizedRow.l as number,
      c: reusableOptimizedRow.c as number,
      v: reusableOptimizedRow.v as number,
    };
  } catch (e) {
    // Catch potential errors from yyyymmddToUnix specifically if needed for logging
    // if (e instanceof DateError) { console.warn(`Optimized date parse error: ${e.message} on line ${line}`);}
    return null;
  }
}

export async function parseStreamOptimizedOhlcv(
  stream: ReadableStream<Uint8Array>,
  onRow: RowCallback,
  skipHeader: boolean = true,
  onSkipLine?: SkipErrorCallback,
): Promise<number> {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  let lineBuffer = "";
  let rowCount = 0;
  let isFirstNonEmptyLine = true;
  let currentLineNumber = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      lineBuffer += decoder.decode(value, { stream: true });

      let newlineIndex;
      while ((newlineIndex = lineBuffer.indexOf("\n")) >= 0) {
        currentLineNumber++;
        const line = lineBuffer.substring(0, newlineIndex).trimEnd(); // Handle \r
        lineBuffer = lineBuffer.substring(newlineIndex + 1);

        if (line.length === 0) continue;

        if (skipHeader && isFirstNonEmptyLine) {
          isFirstNonEmptyLine = false;
          onSkipLine?.(
            new ParseError("Skipped header"),
            currentLineNumber,
            line,
          );
          continue;
        }
        isFirstNonEmptyLine = false;

        const parsedRow = parseOhlcvLineOptimizedInternal(line);
        if (parsedRow) {
          onRow(parsedRow);
          rowCount++;
        } else {
          onSkipLine?.(
            new InvalidFormatError("Line did not match optimized OHLCV format"),
            currentLineNumber,
            line,
          );
        }
      }
    }
    const lastLine = lineBuffer.trimEnd();
    if (lastLine.length > 0) {
      currentLineNumber++;
      if (!(skipHeader && isFirstNonEmptyLine)) {
        const parsedRow = parseOhlcvLineOptimizedInternal(lastLine);
        if (parsedRow) {
          onRow(parsedRow);
          rowCount++;
        } else {
          onSkipLine?.(
            new InvalidFormatError(
              "Last line did not match optimized OHLCV format",
            ),
            currentLineNumber,
            lastLine,
          );
        }
      } else {
        onSkipLine?.(
          new ParseError("Skipped header (was last line)"),
          currentLineNumber,
          lastLine,
        );
      }
    }
    const remainingDecoderContent = decoder.decode();
    if (remainingDecoderContent.trim().length > 0) {
      currentLineNumber++;
      const line = remainingDecoderContent.trim();
      if (!isFirstNonEmptyLine || !skipHeader) {
        const parsedRow = parseOhlcvLineOptimizedInternal(line);
        if (parsedRow) {
          onRow(parsedRow);
          rowCount++;
        } else {onSkipLine?.(
            new InvalidFormatError("Final decoder content did not match"),
            currentLineNumber,
            line,
          );}
      }
    }
  } finally {
    reader.releaseLock();
  }
  return rowCount;
}
