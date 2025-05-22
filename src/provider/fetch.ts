// src/provider/fetch.ts
import { FetchError, HttpError } from "../core/errors.ts";
import type { DataSource } from "./data_sources.ts";

/**
 * Fetches the content of a given data source as a single string.
 *
 * Downloads the entire CSV file into memory as a string. This is the simplest
 * fetching method, suitable for small to medium datasets that can fit in memory.
 * For large files, consider using `fetchCsvAsStream` instead.
 *
 * @param source - The data source URL or enum value to fetch from
 * @returns Promise resolving to the complete CSV content as a string
 *
 * @throws {HttpError} When the HTTP request fails (404, 500, etc.)
 * @throws {FetchError} When the network request fails for other reasons
 *
 * @example
 * ```typescript
 * import { DataSource, fetchCsvAsText } from "@mso/ohlcv";
 *
 * try {
 *   const csvData = await fetchCsvAsText(DataSource.BTC_CSV);
 *   console.log(`Downloaded ${csvData.length} characters`);
 * } catch (error) {
 *   if (error instanceof HttpError) {
 *     console.error(`HTTP ${error.statusCode}: ${error.statusText}`);
 *   }
 * }
 * ```
 */
export async function fetchCsvAsText(source: DataSource): Promise<string> {
  const url = source as string;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new HttpError(
        "Failed to fetch text",
        response.status,
        response.statusText,
      );
    }
    return await response.text();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new FetchError(
      `fetchCsvAsText failed for ${url}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Fetches the content of a given data source as a ReadableStream.
 *
 * Returns a stream of the CSV data, allowing for memory-efficient processing
 * of large files. The data arrives as chunks that can be processed incrementally
 * without loading the entire file into memory. Use with streaming parsers.
 *
 * @param source - The data source URL or enum value to fetch from
 * @returns Promise resolving to a ReadableStream of Uint8Array chunks
 *
 * @throws {HttpError} When the HTTP request fails (404, 500, etc.)
 * @throws {FetchError} When the network request fails or response body is null
 *
 * @example
 * ```typescript
 * import { DataSource, fetchCsvAsStream, parseStreamOptimizedOhlcv } from "@mso/ohlcv";
 *
 * try {
 *   const stream = await fetchCsvAsStream(DataSource.SP500_CSV);
 *
 *   const rowCount = await parseStreamOptimizedOhlcv(
 *     stream,
 *     (row) => console.log(`Price: ${row.c}`),
 *     true
 *   );
 *
 *   console.log(`Processed ${rowCount} rows`);
 * } catch (error) {
 *   console.error("Stream processing failed:", error);
 * }
 * ```
 */
export async function fetchCsvAsStream(
  source: DataSource,
): Promise<ReadableStream<Uint8Array>> {
  const url = source as string;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new HttpError(
        "Failed to fetch stream",
        response.status,
        response.statusText,
      );
    }
    if (!response.body) {
      throw new FetchError(`Response body is null for ${url}. Cannot stream.`);
    }
    return response.body;
  } catch (error) {
    if (error instanceof HttpError || error instanceof FetchError) throw error;
    throw new FetchError(
      `fetchCsvAsStream failed for ${url}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      error instanceof Error ? error : undefined,
    );
  }
}
