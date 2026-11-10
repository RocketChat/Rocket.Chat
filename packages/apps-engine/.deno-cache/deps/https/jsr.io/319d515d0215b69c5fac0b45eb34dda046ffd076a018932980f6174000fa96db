// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/** Options for {@linkcode LimitedBytesTransformStream}. */
export interface LimitedBytesTransformStreamOptions {
  /**
   * If true, a {@linkcode RangeError} is thrown when queueing the current chunk
   * would exceed the specified size limit.
   *
   * @default {false}
   */
  error?: boolean;
}

/**
 * A {@linkcode TransformStream} that will only read & enqueue chunks until the
 * total amount of enqueued data exceeds `size`. The last chunk that would
 * exceed the limit will NOT be enqueued, in which case a {@linkcode RangeError}
 * is thrown when `options.error` is set to true, otherwise the stream is just
 * terminated.
 *
 * @example `size` is equal to the total byte length of the chunks
 * ```ts
 * import { LimitedBytesTransformStream } from "@std/streams/limited-bytes-transform-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from(["1234", "5678"]);
 * const transformed = stream.pipeThrough(new TextEncoderStream()).pipeThrough(
 *   new LimitedBytesTransformStream(8),
 * ).pipeThrough(new TextDecoderStream());
 *
 * assertEquals(
 *   await Array.fromAsync(transformed),
 *   ["1234", "5678"],
 * );
 * ```
 *
 * @example `size` is less than the total byte length of the chunks, and at the
 * boundary of the chunks
 * ```ts
 * import { LimitedBytesTransformStream } from "@std/streams/limited-bytes-transform-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from(["1234", "5678"]);
 * const transformed = stream.pipeThrough(new TextEncoderStream()).pipeThrough(
 *   // `4` is the boundary of the chunks
 *   new LimitedBytesTransformStream(4),
 * ).pipeThrough(new TextDecoderStream());
 *
 * assertEquals(
 *   await Array.fromAsync(transformed),
 *   // The first chunk was read, but the second chunk was not
 *   ["1234"],
 * );
 * ```
 *
 * @example `size` is less than the total byte length of the chunks, and not at
 * the boundary of the chunks
 * ```ts
 * import { LimitedBytesTransformStream } from "@std/streams/limited-bytes-transform-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from(["1234", "5678"]);
 * const transformed = stream.pipeThrough(new TextEncoderStream()).pipeThrough(
 *   // `5` is not the boundary of the chunks
 *   new LimitedBytesTransformStream(5),
 * ).pipeThrough(new TextDecoderStream());
 *
 * assertEquals(
 *   await Array.fromAsync(transformed),
 *   // The second chunk was not read because it would exceed the specified size
 *   ["1234"],
 * );
 * ```
 *
 * @example Throw error when the total byte length of the chunks exceeds the
 * specified size
 *
 * To do so, set `options.error` to `true`.
 *
 * ```ts
 * import { LimitedBytesTransformStream } from "@std/streams/limited-bytes-transform-stream";
 * import { assertRejects } from "@std/assert";
 *
 * const stream = ReadableStream.from(["1234", "5678"]);
 * const transformed = stream.pipeThrough(new TextEncoderStream()).pipeThrough(
 *   new LimitedBytesTransformStream(5, { error: true }),
 * ).pipeThrough(new TextDecoderStream());
 *
 * await assertRejects(async () => {
 *   await Array.fromAsync(transformed);
 * }, RangeError);
 * ```
 */
export class LimitedBytesTransformStream
  extends TransformStream<Uint8Array, Uint8Array> {
  #read = 0;

  /**
   * Constructs a new instance.
   *
   * @param size A size limit in bytes.
   * @param options Options for the stream.
   */
  constructor(
    size: number,
    options: LimitedBytesTransformStreamOptions = { error: false },
  ) {
    super({
      transform: (chunk, controller) => {
        if ((this.#read + chunk.byteLength) > size) {
          if (options.error) {
            throw new RangeError(`Exceeded byte size limit of '${size}'`);
          } else {
            controller.terminate();
          }
        } else {
          this.#read += chunk.byteLength;
          controller.enqueue(chunk);
        }
      },
    });
  }
}
