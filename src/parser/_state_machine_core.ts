// src/parser/_state_machine_core.ts
import type { Row } from "../core/row.ts";
import {
  type DateBeforeEpochError,
  DateError,
  InvalidCloseError,
  type InvalidDateFormatError,
  InvalidFormatError,
  InvalidHighError,
  InvalidLowError,
  InvalidOpenError,
  type InvalidTimestampError,
  InvalidVolumeError,
  ParseError,
  type ParseErrorDetails,
} from "../core/errors.ts";
import { yyyymmddToUnix } from "../utils/date.ts";
import type { RowCallback, SkipErrorCallback } from "./common.ts";
import { EXPECTED_FIELDS } from "./common.ts";

enum ParserMachineInternalState {
  WaitingForHeaderStart,
  ProcessingHeader,
  WaitingForDataRowStart,
  ProcessingField,
  SkippingLineDueToError,
}

export class InternalStateMachineCore {
  private fieldBuffer: string = "";
  private currentRow: Partial<Row> = {};
  private fieldIndex: number = 0;
  private state: ParserMachineInternalState =
    ParserMachineInternalState.WaitingForHeaderStart;
  private currentLineNumber: number = 1;
  private currentLineContentForError: string = "";
  private onRow: RowCallback;
  private onSkip?: SkipErrorCallback;
  public totalRowsProcessed: number = 0;

  constructor(
    onRowCallback: RowCallback,
    onSkipErrorCallback?: SkipErrorCallback,
  ) {
    this.onRow = onRowCallback;
    this.onSkip = onSkipErrorCallback;
  }

  private resetCurrentRowState() {
    this.fieldBuffer = "";
    this.currentRow = {};
    this.fieldIndex = 0;
  }

  private resetForNewLine() {
    this.resetCurrentRowState();
    this.currentLineContentForError = "";
  }

  private processFieldEnd(): boolean {
    const fieldValue = this.fieldBuffer.trim();
    this.fieldBuffer = "";

    if (this.state === ParserMachineInternalState.SkippingLineDueToError) {
      this.fieldIndex++;
      return false;
    }

    if (this.state === ParserMachineInternalState.ProcessingHeader) {
      this.fieldIndex++;
      if (this.fieldIndex === 1 && !fieldValue.toLowerCase().includes("date")) {
        const err = new InvalidFormatError(
          "First header field doesn't look like 'Date'",
        );
        this.onSkip?.(
          err,
          this.currentLineNumber,
          this.currentLineContentForError,
          { invalidField: "timestamp", reason: "header format" },
        );
        this.state = ParserMachineInternalState.WaitingForDataRowStart;
        this.resetCurrentRowState();
        this.fieldBuffer = fieldValue;
        return this.processFieldEnd();
      }
      return true;
    }

    if (this.state !== ParserMachineInternalState.ProcessingField) {
      const err = new ParseError(
        `State machine error - processFieldEnd in unexpected state: ${
          ParserMachineInternalState[this.state]
        }`,
      );
      this.onSkip?.(
        err,
        this.currentLineNumber,
        this.currentLineContentForError,
      );
      this.state = ParserMachineInternalState.SkippingLineDueToError;
      return false;
    }

    try {
      // let fieldName: ParseErrorDetails['invalidField']; // Removed as it's not directly used for error construction here
      switch (this.fieldIndex) {
        case 0:
          this.currentRow.ts = yyyymmddToUnix(fieldValue);
          break;
        case 1:
          this.currentRow.o = parseFloat(fieldValue);
          if (isNaN(this.currentRow.o!)) {
            throw new InvalidOpenError("Invalid open value");
          }
          break;
        case 2:
          this.currentRow.h = parseFloat(fieldValue);
          if (isNaN(this.currentRow.h!)) {
            throw new InvalidHighError("Invalid high value");
          }
          break;
        case 3:
          this.currentRow.l = parseFloat(fieldValue);
          if (isNaN(this.currentRow.l!)) {
            throw new InvalidLowError("Invalid low value");
          }
          break;
        case 4:
          this.currentRow.c = parseFloat(fieldValue);
          if (isNaN(this.currentRow.c!)) {
            throw new InvalidCloseError("Invalid close value");
          }
          break;
        case 5:
          this.currentRow.v = parseInt(fieldValue, 10);
          if (isNaN(this.currentRow.v!)) {
            throw new InvalidVolumeError("Invalid volume value");
          }
          break;
        default:
          throw new InvalidFormatError(
            `Too many fields (${this.fieldIndex + 1})`,
          );
      }
    } catch (e) {
      const errorDetails: ParseErrorDetails = {
        invalidField: this.fieldIndex === 0
          ? "timestamp"
          : this.fieldIndex === 1
          ? "open"
          : this.fieldIndex === 2
          ? "high"
          : this.fieldIndex === 3
          ? "low"
          : this.fieldIndex === 4
          ? "close"
          : this.fieldIndex === 5
          ? "volume"
          : undefined,
        reason: e instanceof Error ? e.message : String(e),
      };
      const err = e instanceof ParseError
        ? e
        : e instanceof DateError
        ? e
        : new ParseError(
          `Field ${this.fieldIndex} ("${fieldValue}") error: ${errorDetails.reason}`,
        );
      this.onSkip?.(
        err,
        this.currentLineNumber,
        this.currentLineContentForError,
        errorDetails,
      );
      this.state = ParserMachineInternalState.SkippingLineDueToError;
      return false;
    }
    this.fieldIndex++;
    return true;
  }

  private processRowEnd(): boolean {
    if (this.state === ParserMachineInternalState.SkippingLineDueToError) {
      this.state = ParserMachineInternalState.WaitingForDataRowStart;
      this.resetForNewLine();
      return false;
    }

    if (this.state === ParserMachineInternalState.ProcessingHeader) {
      this.state = ParserMachineInternalState.WaitingForDataRowStart;
      this.resetForNewLine();
      return true;
    }

    if (this.state !== ParserMachineInternalState.ProcessingField) {
      const err = new ParseError(
        `processRowEnd in unexpected state ${
          ParserMachineInternalState[this.state]
        }`,
      );
      this.onSkip?.(
        err,
        this.currentLineNumber,
        this.currentLineContentForError,
      );
      this.state = ParserMachineInternalState.WaitingForDataRowStart;
      this.resetForNewLine();
      return false;
    }

    if (
      this.fieldIndex === 0 && this.currentLineContentForError.trim() === ""
    ) {
      this.state = ParserMachineInternalState.WaitingForDataRowStart;
      this.resetForNewLine();
      return true;
    }

    if (this.fieldIndex !== EXPECTED_FIELDS) {
      if (
        !(this.fieldIndex === 1 &&
          this.currentLineContentForError.trim().replace(/,/g, "") === "")
      ) {
        const fieldCountErr = new InvalidFormatError(
          `Incorrect field count (${this.fieldIndex}), expected ${EXPECTED_FIELDS}`,
        );
        this.onSkip?.(
          fieldCountErr,
          this.currentLineNumber,
          this.currentLineContentForError,
        );
      }
      this.state = ParserMachineInternalState.WaitingForDataRowStart;
      this.resetForNewLine();
      return false;
    }

    const { ts, o, h, l, c, v } = this.currentRow;
    if (
      ts !== undefined && o !== undefined && h !== undefined &&
      l !== undefined &&
      c !== undefined && v !== undefined &&
      !(o === 0.0 && h === 0.0 && l === 0.0 && c === 0.0 && v === 0)
    ) {
      this.onRow(this.currentRow as Row);
      this.totalRowsProcessed++;
    } else {
      const zeroValErr = new InvalidFormatError(
        "All zero values or undefined essential fields after parsing",
      );
      this.onSkip?.(
        zeroValErr,
        this.currentLineNumber,
        this.currentLineContentForError,
      );
    }

    this.state = ParserMachineInternalState.WaitingForDataRowStart;
    this.resetForNewLine();
    return true;
  }

  public processChunk(chunk: string): void {
    for (let i = 0; i < chunk.length; i++) {
      const char = chunk[i];
      this.processCharInternal(char);
    }
  }

  private processCharInternal(char: string): void {
    if (char !== "\n" && char !== "\r") {
      this.currentLineContentForError += char;
    }

    switch (this.state) {
      case ParserMachineInternalState.WaitingForHeaderStart:
        if (char === "\n") {
          this.currentLineNumber++;
          this.currentLineContentForError = "";
          return;
        }
        if (char === "\r") return;
        this.state = ParserMachineInternalState.ProcessingHeader;
        this.fieldBuffer += char;
        break;
      case ParserMachineInternalState.ProcessingHeader:
      case ParserMachineInternalState.ProcessingField:
        if (char === ",") {
          if (!this.processFieldEnd()) { /* State handled */ }
        } else if (char === "\n") {
          let continueProcessingRow = true;
          if (this.fieldBuffer.length > 0 || this.fieldIndex > 0) {
            continueProcessingRow = this.processFieldEnd();
          }
          if (continueProcessingRow) {
            this.processRowEnd();
          } else {
            this.state = ParserMachineInternalState.WaitingForDataRowStart;
            this.resetForNewLine();
          }
          this.currentLineNumber++;
        } else if (char === "\r") { /* Ignore */ }
        else this.fieldBuffer += char;
        break;
      case ParserMachineInternalState.WaitingForDataRowStart:
        if (char === "\n") {
          this.currentLineNumber++;
          this.currentLineContentForError = "";
          return;
        }
        if (char === "\r") return;
        this.state = ParserMachineInternalState.ProcessingField;
        this.fieldBuffer += char;
        break;
      case ParserMachineInternalState.SkippingLineDueToError:
        if (char === "\n") {
          this.state = ParserMachineInternalState.WaitingForDataRowStart;
          this.resetForNewLine();
          this.currentLineNumber++;
        }
        break;
    }
  }

  public finalize(): void {
    if (
      this.fieldBuffer.length > 0 &&
      (this.state === ParserMachineInternalState.ProcessingField ||
        this.state === ParserMachineInternalState.ProcessingHeader)
    ) {
      if (this.processFieldEnd()) {
        if (
          (this.state === ParserMachineInternalState.ProcessingField ||
            this.state === ParserMachineInternalState.ProcessingHeader) &&
          this.fieldIndex > 0
        ) {
          this.processRowEnd();
        }
      }
    } else if (
      this.state === ParserMachineInternalState.SkippingLineDueToError &&
      this.currentLineContentForError.length > 0
    ) {
      this.onSkip?.(
        new ParseError("Incomplete errored line at EOF"),
        this.currentLineNumber,
        this.currentLineContentForError,
      );
    }
  }
}
