// src/parser/state_machine_full_string.ts
import type { Row } from "../core/row.ts";
import { InternalStateMachineCore } from "./_state_machine_core.ts";
import type { RowCallback, SkipErrorCallback } from "./common.ts";

/**
 * Parses CSV data from a full string using the core state machine logic.
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
