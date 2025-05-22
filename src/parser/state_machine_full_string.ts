// src/parser/state_machine_full_string.ts
import type { Row } from "../core/row.ts";
import { InternalStateMachineCore } from "./_state_machine_core.ts";
import type { RowCallback, SkipErrorCallback } from "./common.ts";

/**
 * Parses CSV data from a full string using the core state machine logic.
 * 
 * This parser uses a more sophisticated state machine approach for better
 * error handling and validation compared to the simple split method. It
 * provides detailed error reporting through the optional callback function.
 * 
 * @param csvContent - The complete CSV content as a string
 * @param onSkippedLine - Optional callback for handling parsing errors
 * @returns Array of parsed Row objects
 * 
 * @example
 * ```typescript
 * import { parseFullStringWithStateMachine } from "@mso/ohlcv";
 * 
 * const onError = (error, lineNumber, lineContent) => {
 *   console.warn(`Line ${lineNumber} failed: ${error.message}`);
 * };
 * 
 * const rows = parseFullStringWithStateMachine(csvData, onError);
 * ```
 */
export function parseFullStringWithStateMachine(
  csvContent: string,
  onSkippedLine?: SkipErrorCallback,
): Row[] {
  const rows: Row[] = [];
  const onRow: RowCallback = (row: Row) => rows.push(row);

  const parser = new InternalStateMachineCore(onRow, onSkippedLine);
  parser.processChunk(csvContent);
  parser.finalize();
  return rows;
}
