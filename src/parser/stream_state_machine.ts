// src/parser/stream_state_machine.ts
import { InternalStateMachineCore } from "./_state_machine_core.ts";
import type { RowCallback, SkipErrorCallback } from "./common.ts";

/**
 * Parses a CSV stream using the core state machine logic.
 *
 * This streaming parser processes CSV data as it arrives, making it memory-efficient
 * for large datasets. It uses the same robust state machine logic as the full string
 * parser but processes data incrementally through a ReadableStream.
 *
 * @param stream - ReadableStream of CSV data as Uint8Array chunks
 * @param onRow - Callback function called for each successfully parsed row
 * @param onSkip - Optional callback for handling parsing errors
 * @returns Promise resolving to the total number of rows processed
 *
 * @example
 * ```typescript
 * import { fetchCsvAsStream, parseStreamWithStateMachine, DataSource } from "@mso/ohlcv";
 *
 * const stream = await fetchCsvAsStream(DataSource.BTC_CSV);
 * let count = 0;
 *
 * const total = await parseStreamWithStateMachine(
 *   stream,
 *   (row) => {
 *     count++;
 *     console.log(`Row ${count}: ${row.c}`);
 *   },
 *   (error, lineNum, content) => {
 *     console.warn(`Parse error at line ${lineNum}: ${error.message}`);
 *   }
 * );
 *
 * console.log(`Processed ${total} total rows`);
 * ```
 */
export async function parseStreamWithStateMachine(
  stream: ReadableStream<Uint8Array>,
  onRow: RowCallback,
  onSkip?: SkipErrorCallback,
): Promise<number> {
  const decoder = new TextDecoder();
  const parser = new InternalStateMachineCore(onRow, onSkip);
  const reader = stream.getReader();

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.processChunk(decoder.decode(value, { stream: true }));
    }
    const remaining = decoder.decode();
    if (remaining) parser.processChunk(remaining);
    parser.finalize();
    return parser.totalRowsProcessed;
  } finally {
    reader.releaseLock();
  }
}
