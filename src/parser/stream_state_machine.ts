// src/parser/stream_state_machine.ts
import { InternalStateMachineCore } from "./_state_machine_core.ts";
import type { RowCallback, SkipErrorCallback } from "./common.ts";

/**
 * Parses a CSV stream using the core state machine logic.
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
