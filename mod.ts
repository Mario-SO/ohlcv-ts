// mod.ts - Main public API for the library

// Core types
export type { Row } from "./src/core/row.ts";
export * from "./src/core/errors.ts";

// Provider functions and types
export { DataSource } from "./src/provider/data_sources.ts";
export { fetchCsvAsStream, fetchCsvAsText } from "./src/provider/fetch.ts";

// Parser functions
export { parseWithSimpleSplit } from "./src/parser/simple_split.ts";
export { parseFullStringWithStateMachine } from "./src/parser/state_machine_full_string.ts";
export { parseStreamWithStateMachine } from "./src/parser/stream_state_machine.ts";
export { parseStreamOptimizedOhlcv } from "./src/parser/stream_optimized_ohlcv.ts";
export type { RowCallback, SkipErrorCallback } from "./src/parser/common.ts";

// Utilities
export { yyyymmddToUnix } from "./src/utils/date.ts";

// --- Example Usage (for `deno run --allow-net mod.ts`) ---
import { DataSource } from "./src/provider/data_sources.ts";
import { fetchCsvAsStream, fetchCsvAsText } from "./src/provider/fetch.ts";
import { parseWithSimpleSplit } from "./src/parser/simple_split.ts";
import { parseFullStringWithStateMachine } from "./src/parser/state_machine_full_string.ts";
import { parseStreamWithStateMachine } from "./src/parser/stream_state_machine.ts";
import { parseStreamOptimizedOhlcv } from "./src/parser/stream_optimized_ohlcv.ts";
import type { Row } from "./src/core/row.ts";
import type { SkipErrorCallback } from "./src/parser/common.ts";

async function runLibraryDemo() {
  console.log("OHLCV Fetch & Parse Library Demo");
  console.log("=================================");

  const onSkipDemo: SkipErrorCallback = (
    error: Error,
    lineNumber: number,
    lineContent: string,
  ) => {
    console.warn(
      `DEMO_SKIP L${lineNumber}: ${error.message.split("\n")[0]} - Line: "${
        lineContent.slice(0, 40)
      }..."`,
    );
  };

  try {
    // 1. Fetch as text, parse with SimpleSplit
    console.log("\n1. Fetching BTC as text, parsing with SimpleSplit...");
    const btcText = await fetchCsvAsText(DataSource.BTC_CSV);
    const rowsSimple = parseWithSimpleSplit(btcText);
    console.log(
      `   SimpleSplit parsed ${rowsSimple.length} rows. First:`,
      rowsSimple.length > 0 ? rowsSimple[0] : "N/A",
    );

    // 2. Parse same text with StateMachine (full string)
    console.log("\n2. Parsing BTC text with StateMachine (full string)...");
    const rowsSM = parseFullStringWithStateMachine(btcText, onSkipDemo);
    console.log(
      `   StateMachine (full string) parsed ${rowsSM.length} rows. First:`,
      rowsSM.length > 0 ? rowsSM[0] : "N/A",
    );

    // 3. Fetch SP500 as stream, parse with StreamStateMachine
    console.log(
      "\n3. Fetching SP500 as stream, parsing with StreamStateMachine...",
    );
    let streamSMCount = 0;
    let firstStreamSMRow: Row | null = null;
    const streamSMTotal = await fetchCsvAsStream(DataSource.SP500_CSV)
      .then((stream: ReadableStream<Uint8Array>) =>
        parseStreamWithStateMachine(stream, (row: Row) => {
          streamSMCount++;
          if (streamSMCount === 1) firstStreamSMRow = row;
        }, onSkipDemo)
      );
    console.log(
      `   StreamStateMachine parsed ${streamSMTotal} rows (counted ${streamSMCount}). First:`,
      firstStreamSMRow || "N/A",
    );

    // 4. Fetch GOLD as stream, parse with StreamOptimizedOHLCV
    console.log(
      "\n4. Fetching GOLD as stream, parsing with StreamOptimizedOHLCV...",
    );
    let streamOptCount = 0;
    let firstStreamOptRow: Row | null = null;
    const streamOptTotal = await fetchCsvAsStream(DataSource.GOLD_CSV)
      .then((stream: ReadableStream<Uint8Array>) =>
        parseStreamOptimizedOhlcv(
          stream,
          (row: Row) => {
            streamOptCount++;
            if (streamOptCount === 1) firstStreamOptRow = row;
          },
          true,
          onSkipDemo,
        )
      );
    console.log(
      `   StreamOptimizedOHLCV parsed ${streamOptTotal} rows (counted ${streamOptCount}). First:`,
      firstStreamOptRow || "N/A",
    );
  } catch (e) {
    if (e instanceof Error) {
      console.error("\nDEMO FAILED:", e.constructor.name, e.message);
    } else {
      console.error("\nDEMO FAILED (Unknown Error):", e);
    }
  }
}

if (import.meta.main) {
  runLibraryDemo();
}
