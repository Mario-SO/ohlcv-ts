# @mso/ohlcv

A high-performance TypeScript library for fetching and parsing OHLCV (Open,
High, Low, Close, Volume) financial data in Deno. This library provides multiple
parsing strategies optimized for different use cases, from simple CSV parsing to
streaming high-performance parsers.

## 🚀 Features

- **Multiple Parsing Strategies**: Choose from 4 different parsers based on your
  performance needs
- **Streaming Support**: Memory-efficient streaming parsers for large datasets
- **Built-in Data Sources**: Pre-configured endpoints for BTC, ETH, SP500, and
  Gold data
- **Comprehensive Error Handling**: Detailed error types for robust error
  handling
- **Zero Dependencies**: Pure TypeScript implementation for Deno
- **Type Safety**: Full TypeScript support with strict typing
- **Performance Optimized**: Benchmarked parsers with different optimization
  strategies

## 📦 Installation

### Add Package

```bash
deno add jsr:@mso/ohlcv
```

### Import symbol

```typescript
import * as ohlcv from "@mso/ohlcv";
```

### Or import directly with a JSR specifier

```typescript
import * as ohlcv from "jsr:@mso/ohlcv";
```

### Import specific functions

```typescript
import { DataSource, fetchCsvAsText, parseWithSimpleSplit } from "@mso/ohlcv";
```

### Import specific modules

```typescript
import { fetchCsvAsStream } from "@mso/ohlcv/provider";
import { parseStreamOptimizedOhlcv } from "@mso/ohlcv/parser";
import type { Row } from "@mso/ohlcv/types";
```

## 🏃 Quick Start

```typescript
import { DataSource, fetchCsvAsText, parseWithSimpleSplit } from "@mso/ohlcv";

// Fetch and parse Bitcoin data
const csvData = await fetchCsvAsText(DataSource.BTC_CSV);
const rows = parseWithSimpleSplit(csvData);

console.log(`Parsed ${rows.length} rows`);
console.log("First row:", rows[0]);
// Output: { ts: 1640995200, o: 47686.81, h: 47865.45, l: 46617.24, c: 46498.76, v: 1234567 }
```

## 📊 Data Structure

The library works with a standardized `Row` interface:

```typescript
interface Row {
  ts: number; // Unix timestamp (seconds since epoch)
  o: number; // Open price
  h: number; // High price
  l: number; // Low price
  c: number; // Close price
  v: number; // Volume
}
```

## 🔄 Data Sources

Pre-configured data sources are available:

```typescript
enum DataSource {
  BTC_CSV =
    "https://raw.githubusercontent.com/Mario-SO/ohlcv/main/data/btc.csv",
  SP500_CSV =
    "https://raw.githubusercontent.com/Mario-SO/ohlcv/main/data/sp500.csv",
  ETH_CSV =
    "https://raw.githubusercontent.com/Mario-SO/ohlcv/main/data/eth.csv",
  GOLD_CSV =
    "https://raw.githubusercontent.com/Mario-SO/ohlcv/main/data/gold.csv",
}
```

## 🔧 Parsing Strategies

### 1. Simple Split Parser

Best for: Small to medium datasets, simple use cases

```typescript
import { parseWithSimpleSplit } from "@mso/ohlcv";

const rows = parseWithSimpleSplit(csvData, true); // skipHeader = true
```

### 2. State Machine Parser (Full String)

Best for: Better error handling and validation

```typescript
import { parseFullStringWithStateMachine } from "@mso/ohlcv";

const onSkipError = (error: Error, lineNumber: number, lineContent: string) => {
  console.warn(`Skipped line ${lineNumber}: ${error.message}`);
};

const rows = parseFullStringWithStateMachine(csvData, onSkipError);
```

### 3. Streaming State Machine Parser

Best for: Large datasets, memory efficiency

```typescript
import { fetchCsvAsStream, parseStreamWithStateMachine } from "@mso/ohlcv";

const stream = await fetchCsvAsStream(DataSource.BTC_CSV);
let processedRows = 0;

const totalRows = await parseStreamWithStateMachine(
  stream,
  (row: Row) => {
    processedRows++;
    // Process each row as it's parsed
    console.log(`Processing row: ${row.ts}`);
  },
  (error, lineNumber, lineContent) => {
    console.warn(`Error on line ${lineNumber}: ${error.message}`);
  },
);

console.log(`Processed ${processedRows} of ${totalRows} total rows`);
```

### 4. Optimized OHLCV Stream Parser

Best for: Maximum performance with large datasets

```typescript
import { fetchCsvAsStream, parseStreamOptimizedOhlcv } from "@mso/ohlcv";

const stream = await fetchCsvAsStream(DataSource.SP500_CSV);
const rows: Row[] = [];

const totalRows = await parseStreamOptimizedOhlcv(
  stream,
  (row: Row) => {
    rows.push(row);
  },
  true, // skipHeader
  (error, lineNumber, lineContent) => {
    console.warn(`Skipped line ${lineNumber}: ${error.message}`);
  },
);
```

## 🛠 Utility Functions

### Date Conversion

```typescript
import { yyyymmddToUnix } from "@mso/ohlcv/utils";

const timestamp = yyyymmddToUnix("2023-01-01"); // Returns Unix timestamp
```

### Error Handling

The library provides comprehensive error types:

```typescript
import {
  FetchError,
  HttpError,
  InvalidFormatError,
  InvalidTimestampError,
  ParseError,
} from "@mso/ohlcv/errors";

try {
  const data = await fetchCsvAsText(DataSource.BTC_CSV);
  const rows = parseWithSimpleSplit(data);
} catch (error) {
  if (error instanceof HttpError) {
    console.error(`HTTP Error ${error.statusCode}: ${error.statusText}`);
  } else if (error instanceof ParseError) {
    console.error(`Parse Error: ${error.message}`, error.details);
  } else if (error instanceof FetchError) {
    console.error(`Fetch Error: ${error.message}`);
  }
}
```

## 📈 Performance Benchmarking

Run the included benchmarks to compare parsing strategies:

```bash
deno bench --allow-net bench.ts
```

### Benchmark Results

Here are the performance results from running the benchmarks on a typical
system:

```
benchmark                               time/iter (avg)        iter/s      (min … max)           p75      p99     p995
--------------------------------------- ----------------------------- --------------------- --------------------------
parseWithSimpleSplit                            11.2 ms          88.9 (  9.9 ms …  11.8 ms)  11.5 ms  11.8 ms  11.8 ms
parseFullStringWithStateMachine                  7.9 ms         127.4 (  7.4 ms …   9.5 ms)   7.9 ms   9.5 ms   9.5 ms
parseStreamWithStateMachine                      7.7 ms         129.6 (  7.0 ms …   7.9 ms)   7.8 ms   7.9 ms   7.9 ms
parseStreamOptimizedOhlcv                        7.4 ms         135.1 (  7.1 ms …   7.6 ms)   7.5 ms   7.6 ms   7.6 ms

group dataset-size
parseWithSimpleSplit - Small Dataset           193.5 µs         5,167 (174.1 µs … 259.2 µs) 200.6 µs 214.5 µs 219.5 µs
parseWithSimpleSplit - Medium Dataset            1.9 ms         518.3 (  1.8 ms …   2.1 ms)   1.9 ms   2.0 ms   2.1 ms
parseWithSimpleSplit - Large Dataset            11.5 ms          86.7 ( 11.0 ms …  11.9 ms)  11.7 ms  11.9 ms  11.9 ms

summary
  parseWithSimpleSplit - Small Dataset
     9.97x faster than parseWithSimpleSplit - Medium Dataset
    59.59x faster than parseWithSimpleSplit - Large Dataset

group network-fetch
fetchCsvAsText - BTC                            17.8 ms          56.0 ( 16.2 ms …  25.9 ms)  17.9 ms  25.9 ms  25.9 ms
fetchCsvAsStream - BTC                          18.4 ms          54.3 ( 15.8 ms …  28.5 ms)  18.9 ms  28.5 ms  28.5 ms

summary
  fetchCsvAsText - BTC
     1.03x faster than fetchCsvAsStream - BTC

group end-to-end
fetchAndParse - SimpleSplit                     19.3 ms          51.7 ( 17.3 ms …  23.9 ms)  19.3 ms  23.9 ms  23.9 ms
fetchAndParse - StreamOptimized                 19.0 ms          52.5 ( 16.7 ms …  25.2 ms)  19.2 ms  25.2 ms  25.2 ms

summary
  fetchAndParse - StreamOptimized
     1.01x faster than fetchAndParse - SimpleSplit

group stress
memory-stress-test                             118.6 ms           8.4 (116.9 ms … 122.0 ms) 119.5 ms 122.0 ms 122.0 ms
```

### Performance Insights

- **🏆 parseStreamOptimizedOhlcv** is the fastest parser at **7.4ms** (135.1
  iter/s)
- **State machine parsers** outperform simple split by ~30-40%
- **Dataset size** has linear impact on performance (59x difference between
  small and large)
- **Network fetch** performance is similar for text vs stream (~1ms difference)
- **End-to-end** stream optimization provides minimal gains over simple parsing
  for network-bound operations

The library includes comprehensive benchmarks testing:

- Different parsing strategies
- Various dataset sizes
- Network fetch performance
- End-to-end processing
- Memory usage patterns

## 🎯 Use Cases

### Real-time Data Processing

```typescript
import { fetchCsvAsStream, parseStreamOptimizedOhlcv } from "@mso/ohlcv";

// Process data as it streams in
const stream = await fetchCsvAsStream(DataSource.BTC_CSV);
let latestPrice = 0;

await parseStreamOptimizedOhlcv(
  stream,
  (row: Row) => {
    latestPrice = row.c; // Update latest close price

    // Real-time processing logic here
    if (row.c > row.o) {
      console.log(`Price up: ${row.c} at ${new Date(row.ts * 1000)}`);
    }
  },
  true,
);
```

### Data Analysis

```typescript
import { DataSource, fetchCsvAsText, parseWithSimpleSplit } from "@mso/ohlcv";

const data = await fetchCsvAsText(DataSource.SP500_CSV);
const rows = parseWithSimpleSplit(data);

// Calculate moving average
const movingAverage = (data: Row[], window: number): number[] => {
  return data.slice(window - 1).map((_, index) => {
    const slice = data.slice(index, index + window);
    return slice.reduce((sum, row) => sum + row.c, 0) / window;
  });
};

const ma20 = movingAverage(rows, 20);
console.log(`20-day moving average: ${ma20[ma20.length - 1]}`);
```

### Batch Processing

```typescript
import { DataSource, fetchCsvAsText, parseWithSimpleSplit } from "@mso/ohlcv";

const dataSources = [
  DataSource.BTC_CSV,
  DataSource.ETH_CSV,
  DataSource.SP500_CSV,
];

const results = await Promise.all(
  dataSources.map(async (source) => {
    const data = await fetchCsvAsText(source);
    const rows = parseWithSimpleSplit(data);
    return {
      source,
      count: rows.length,
      latestPrice: rows[rows.length - 1]?.c || 0,
    };
  }),
);

console.log("Batch processing results:", results);
```

## 🔒 Permissions

This library requires the following Deno permissions:

```bash
# For fetching remote data
deno run --allow-net your_script.ts

# For reading local files (if needed)
deno run --allow-read your_script.ts

# For both
deno run --allow-net --allow-read your_script.ts
```

## 🧪 Running Examples

Run the built-in demo:

```bash
deno run --allow-net jsr:@mso/ohlcv
```

This will demonstrate all parsing strategies with real data.

## 📝 API Reference

### Fetching Functions

- `fetchCsvAsText(source: DataSource): Promise<string>` - Fetch CSV as complete
  string
- `fetchCsvAsStream(source: DataSource): Promise<ReadableStream<Uint8Array>>` -
  Fetch CSV as stream

### Parsing Functions

- `parseWithSimpleSplit(csvContent: string, skipHeader?: boolean): Row[]` -
  Simple line-by-line parsing
- `parseFullStringWithStateMachine(csvContent: string, onSkipError?: SkipErrorCallback): Row[]` -
  State machine parsing with error handling
- `parseStreamWithStateMachine(stream: ReadableStream<Uint8Array>, onRow: RowCallback, onSkipError?: SkipErrorCallback): Promise<number>` -
  Stream parsing with state machine
- `parseStreamOptimizedOhlcv(stream: ReadableStream<Uint8Array>, onRow: RowCallback, skipHeader?: boolean, onSkipError?: SkipErrorCallback): Promise<number>` -
  Optimized stream parsing

### Type Definitions

- `Row` - Main data structure for OHLCV data
- `RowCallback` - Function called for each parsed row
- `SkipErrorCallback` - Function called when a line is skipped due to errors

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Deno Module Registry](https://deno.land/x/ohlcv)
- [Source Code](https://github.com/Mario-SO/ohlcv-ts)
- [Data Repository](https://github.com/Mario-SO/ohlcv)

---

Built with ❤️ for the Deno community
