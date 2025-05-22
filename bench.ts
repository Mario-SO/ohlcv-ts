// bench.ts
import {
  DataSource,
  fetchCsvAsStream,
  fetchCsvAsText,
  parseFullStringWithStateMachine,
  parseStreamOptimizedOhlcv,
  parseStreamWithStateMachine,
  parseWithSimpleSplit,
  type SkipErrorCallback,
} from "./mod.ts";

// Import Row type separately
import type { Row } from "./src/core/row.ts";

// Sample CSV data for testing
const SAMPLE_CSV_DATA = `Date,Open,High,Low,Close,Volume
2023-01-01,100.50,102.75,99.25,101.80,1500000
2023-01-02,101.80,103.20,100.90,102.45,1750000
2023-01-03,102.45,104.10,101.50,103.75,1600000
2023-01-04,103.75,105.30,102.80,104.20,1800000
2023-01-05,104.20,106.50,103.90,105.85,1900000
`.repeat(1000); // Repeat to create a larger dataset

// Create a ReadableStream from string data
function createStreamFromString(data: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunks = encoder.encode(data);

  return new ReadableStream({
    start(controller) {
      // Split into smaller chunks to simulate real streaming
      const chunkSize = 1024;
      for (let i = 0; i < chunks.length; i += chunkSize) {
        controller.enqueue(chunks.slice(i, i + chunkSize));
      }
      controller.close();
    },
  });
}

// Silent error handler for benchmarks
const silentSkipHandler: SkipErrorCallback = (
  _error: Error,
  _lineNumber: number,
  _lineContent: string,
) => {
  // Do nothing - we don't want logging to affect benchmark performance
};

// Benchmark: Simple Split Parser
Deno.bench("parseWithSimpleSplit", () => {
  const rows = parseWithSimpleSplit(SAMPLE_CSV_DATA);
  // Consume the result to ensure work is done
  if (rows.length === 0) throw new Error("No rows parsed");
});

// Benchmark: State Machine Full String Parser
Deno.bench("parseFullStringWithStateMachine", () => {
  const rows = parseFullStringWithStateMachine(
    SAMPLE_CSV_DATA,
    silentSkipHandler,
  );
  if (rows.length === 0) throw new Error("No rows parsed");
});

// Benchmark: Stream State Machine Parser
Deno.bench("parseStreamWithStateMachine", async () => {
  const stream = createStreamFromString(SAMPLE_CSV_DATA);
  let rowCount = 0;

  const totalRows = await parseStreamWithStateMachine(
    stream,
    (row: Row) => {
      rowCount++;
    },
    silentSkipHandler,
  );

  if (totalRows === 0) throw new Error("No rows parsed");
});

// Benchmark: Stream Optimized OHLCV Parser
Deno.bench("parseStreamOptimizedOhlcv", async () => {
  const stream = createStreamFromString(SAMPLE_CSV_DATA);
  let rowCount = 0;

  const totalRows = await parseStreamOptimizedOhlcv(
    stream,
    (row: Row) => {
      rowCount++;
    },
    true, // skipHeader
    silentSkipHandler,
  );

  if (totalRows === 0) throw new Error("No rows parsed");
});

// Benchmark group for different data sizes
const SMALL_DATA = SAMPLE_CSV_DATA.split("\n").slice(0, 100).join("\n");
const MEDIUM_DATA = SAMPLE_CSV_DATA.split("\n").slice(0, 1000).join("\n");
const LARGE_DATA = SAMPLE_CSV_DATA;

Deno.bench({
  name: "parseWithSimpleSplit - Small Dataset",
  group: "dataset-size",
  fn: () => {
    parseWithSimpleSplit(SMALL_DATA);
  },
});

Deno.bench({
  name: "parseWithSimpleSplit - Medium Dataset",
  group: "dataset-size",
  fn: () => {
    parseWithSimpleSplit(MEDIUM_DATA);
  },
});

Deno.bench({
  name: "parseWithSimpleSplit - Large Dataset",
  group: "dataset-size",
  fn: () => {
    parseWithSimpleSplit(LARGE_DATA);
  },
});

// Network fetch benchmarks (these will be slower and require network access)
Deno.bench({
  name: "fetchCsvAsText - BTC",
  group: "network-fetch",
  permissions: { net: true },
  fn: async () => {
    const text = await fetchCsvAsText(DataSource.BTC_CSV);
    if (text.length === 0) throw new Error("No data fetched");
  },
});

Deno.bench({
  name: "fetchCsvAsStream - BTC",
  group: "network-fetch",
  permissions: { net: true },
  fn: async () => {
    const stream = await fetchCsvAsStream(DataSource.BTC_CSV);
    const reader = stream.getReader();
    let totalBytes = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.length;
      }
    } finally {
      reader.releaseLock();
    }

    if (totalBytes === 0) throw new Error("No data streamed");
  },
});

// End-to-end benchmarks combining fetch + parse
Deno.bench({
  name: "fetchAndParse - SimpleSplit",
  group: "end-to-end",
  permissions: { net: true },
  fn: async () => {
    const text = await fetchCsvAsText(DataSource.BTC_CSV);
    const rows = parseWithSimpleSplit(text);
    if (rows.length === 0) throw new Error("No rows parsed");
  },
});

Deno.bench({
  name: "fetchAndParse - StreamOptimized",
  group: "end-to-end",
  permissions: { net: true },
  fn: async () => {
    const stream = await fetchCsvAsStream(DataSource.BTC_CSV);
    let rowCount = 0;

    const totalRows = await parseStreamOptimizedOhlcv(
      stream,
      (row: Row) => {
        rowCount++;
      },
      true,
      silentSkipHandler,
    );

    if (totalRows === 0) throw new Error("No rows parsed");
  },
});

// Memory usage benchmark (parsing the same data multiple times)
Deno.bench({
  name: "memory-stress-test",
  group: "stress",
  fn: () => {
    for (let i = 0; i < 10; i++) {
      const rows = parseWithSimpleSplit(SAMPLE_CSV_DATA);
      if (rows.length === 0) throw new Error("No rows parsed");
    }
  },
});
