// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { createLPS } from "./_common.ts";

import type {
  DelimiterDisposition,
  DelimiterStreamOptions,
} from "./delimiter_stream.ts";

/**
 * Transform a stream `string` into a stream where each chunk is divided by a
 * given delimiter.
 *
 * If you are working with a stream of `Uint8Array`, consider using {@linkcode DelimiterStream}.
 *
 * If you want to split by a newline, consider using {@linkcode TextLineStream}.
 *
 * @example Comma-separated values
 * ```ts
 * import { TextDelimiterStream } from "@std/streams/text-delimiter-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([
 *   "alice,20,",
 *   ",US,",
 * ]);
 *
 * const valueStream = stream.pipeThrough(new TextDelimiterStream(","));
 *
 * assertEquals(
 *   await Array.fromAsync(valueStream),
 *   ["alice", "20", "", "US", ""],
 * );
 * ```
 *
 * @example Semicolon-separated values with suffix disposition
 * ```ts
 * import { TextDelimiterStream } from "@std/streams/text-delimiter-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([
 *   "const a = 42;;let b =",
 *   " true;",
 * ]);
 *
 * const valueStream = stream.pipeThrough(
 *   new TextDelimiterStream(";", { disposition: "suffix" }),
 * );
 *
 * assertEquals(
 *   await Array.fromAsync(valueStream),
 *   ["const a = 42;", ";", "let b = true;", ""],
 * );
 * ```
 */
export class TextDelimiterStream extends TransformStream<string, string> {
  #buf = "";
  #delimiter: string;
  #inspectIndex = 0;
  #matchIndex = 0;
  #delimLPS: Uint8Array;
  #disp: DelimiterDisposition;

  /**
   * Constructs a new instance.
   *
   * @param delimiter A delimiter to split the stream by.
   * @param options Options for the stream.
   */
  constructor(
    delimiter: string,
    options?: DelimiterStreamOptions,
  ) {
    super({
      transform: (chunk, controller) => {
        this.#handle(chunk, controller);
      },
      flush: (controller) => {
        controller.enqueue(this.#buf);
      },
    });

    this.#delimiter = delimiter;
    this.#delimLPS = createLPS(new TextEncoder().encode(delimiter));
    this.#disp = options?.disposition ?? "discard";
  }

  #handle(
    chunk: string,
    controller: TransformStreamDefaultController<string>,
  ) {
    this.#buf += chunk;
    let localIndex = 0;
    while (this.#inspectIndex < this.#buf.length) {
      if (chunk[localIndex] === this.#delimiter[this.#matchIndex]) {
        this.#inspectIndex++;
        localIndex++;
        this.#matchIndex++;
        if (this.#matchIndex === this.#delimiter.length) {
          // Full match
          const start = this.#inspectIndex - this.#delimiter.length;
          const end = this.#disp === "suffix" ? this.#inspectIndex : start;
          const copy = this.#buf.slice(0, end);
          controller.enqueue(copy);
          const shift = this.#disp === "prefix" ? start : this.#inspectIndex;
          this.#buf = this.#buf.slice(shift);
          this.#inspectIndex = this.#disp === "prefix"
            ? this.#delimiter.length
            : 0;
          this.#matchIndex = 0;
        }
      } else {
        if (this.#matchIndex === 0) {
          this.#inspectIndex++;
          localIndex++;
        } else {
          this.#matchIndex = this.#delimLPS[this.#matchIndex - 1]!;
        }
      }
    }
  }
}
