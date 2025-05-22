// src/provider/fetch.ts
import { FetchError, HttpError } from "../core/errors.ts";
import type { DataSource } from "./data_sources.ts";

/**
 * Fetches the content of a given data source as a single string.
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
