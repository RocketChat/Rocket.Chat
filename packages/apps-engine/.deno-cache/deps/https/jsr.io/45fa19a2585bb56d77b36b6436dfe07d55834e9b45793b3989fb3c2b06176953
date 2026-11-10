// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Converts a {@linkcode ReadableSteam} of strings or {@linkcode Uint8Array}s
 * to a single string. Works the same as {@linkcode Response.text} and
 * {@linkcode Request.text}, but also extends to support streams of strings.
 *
 * @param stream A `ReadableStream` to convert into a `string`.
 * @returns A `Promise` that resolves to the `string`.
 *
 * @example Basic usage with a stream of strings
 * ```ts
 * import { toText } from "@std/streams/to-text";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from(["Hello, ", "world!"]);
 * assertEquals(await toText(stream), "Hello, world!");
 * ```
 *
 * @example Basic usage with a stream of `Uint8Array`s
 * ```ts
 * import { toText } from "@std/streams/to-text";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from(["Hello, ", "world!"])
 *   .pipeThrough(new TextEncoderStream());
 * assertEquals(await toText(stream), "Hello, world!");
 * ```
 */
export async function toText(
  stream: ReadableStream<string> | ReadableStream<Uint8Array>,
): Promise<string> {
  const textDecoder = new TextDecoder();
  const reader = stream.getReader();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    result += typeof value === "string"
      ? value
      : textDecoder.decode(value, { stream: true });
  }
  result += textDecoder.decode();
  return result;
}
