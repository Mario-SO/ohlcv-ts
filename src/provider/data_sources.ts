// src/provider/data_sources.ts

/**
 * Pre-configured data sources for fetching OHLCV financial data.
 * 
 * These URLs point to CSV files containing historical financial data
 * in the standard OHLCV format (Date, Open, High, Low, Close, Volume).
 * 
 * @example
 * ```typescript
 * import { DataSource, fetchCsvAsText } from "@mso/ohlcv";
 * 
 * // Fetch Bitcoin historical data
 * const btcData = await fetchCsvAsText(DataSource.BTC_CSV);
 * 
 * // Fetch S&P 500 historical data  
 * const sp500Data = await fetchCsvAsText(DataSource.SP500_CSV);
 * ```
 */
export enum DataSource {
  /** Bitcoin (BTC) historical price data in CSV format */
  BTC_CSV =
    "https://raw.githubusercontent.com/Mario-SO/ohlcv/main/data/btc.csv",
  /** S&P 500 index historical data in CSV format */
  SP500_CSV =
    "https://raw.githubusercontent.com/Mario-SO/ohlcv/main/data/sp500.csv",
  /** Ethereum (ETH) historical price data in CSV format */
  ETH_CSV =
    "https://raw.githubusercontent.com/Mario-SO/ohlcv/main/data/eth.csv",
  /** Gold (XAU) historical price data in CSV format */
  GOLD_CSV =
    "https://raw.githubusercontent.com/Mario-SO/ohlcv/main/data/gold.csv",
}
