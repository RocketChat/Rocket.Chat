// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Merge multiple streams into a single one, taking order into account, and each
 * stream will wait for a chunk to enqueue before the next stream can append
 * another chunk.
 *
 * If a stream ends before other ones, the others will be cancelled after the
 * last chunk of said stream is read. See the examples below for more
 * comprehensible information. If you want to continue reading the other streams
 * even after one of them ends, use {@linkcode zipReadableStreams}.
 *
 * @typeparam T The type of the chunks in the input streams.
 * @param streams An iterable of `ReadableStream`s to merge.
 * @returns A `ReadableStream` that will emit the zipped chunks
 *
 * @example Zip 2 streams with the same length
 * ```ts
 * import { earlyZipReadableStreams } from "@std/streams/early-zip-readable-streams";
 * import { assertEquals } from "@std/assert";
 *
 * const stream1 = ReadableStream.from(["1", "2", "3"]);
 * const stream2 = ReadableStream.from(["a", "b", "c"]);
 * const zippedStream = earlyZipReadableStreams(stream1, stream2);
 *
 * assertEquals(
 *   await Array.fromAsync(zippedStream),
 *   ["1", "a", "2", "b", "3", "c"],
 * );
 * ```
 *
 * @example Zip 2 streams with different length (first one is shorter)
 * ```ts
 * import { earlyZipReadableStreams } from "@std/streams/early-zip-readable-streams";
 * import { assertEquals } from "@std/assert";
 *
 * const stream1 = ReadableStream.from(["1", "2"]);
 * const stream2 = ReadableStream.from(["a", "b", "c", "d"]);
 * const zippedStream = earlyZipReadableStreams(stream1, stream2);
 *
 * // The first stream ends before the second one. When the first stream ends,
 * // the second one is cancelled and no more data is read or added to the
 * // zipped stream.
 * assertEquals(
 *   await Array.fromAsync(zippedStream),
 *   ["1", "a", "2", "b"],
 * );
 * ```
 *
 * @example Zip 2 streams with different length (first one is longer)
 * ```ts
 * import { earlyZipReadableStreams } from "@std/streams/early-zip-readable-streams";
 * import { assertEquals } from "@std/assert";
 *
 * const stream1 = ReadableStream.from(["1", "2", "3", "4"]);
 * const stream2 = ReadableStream.from(["a", "b"]);
 * const zippedStream = earlyZipReadableStreams(stream1, stream2);
 *
 * // The second stream ends before the first one. When the second stream ends,
 * // the first one is cancelled, but the chunk of "3" is already read so it
 * // is added to the zipped stream.
 * assertEquals(
 *   await Array.fromAsync(zippedStream),
 *   ["1", "a", "2", "b", "3"],
 * );
 * ```
 *
 * @example Zip 3 streams
 * ```ts
 * import { earlyZipReadableStreams } from "@std/streams/early-zip-readable-streams";
 * import { assertEquals } from "@std/assert";
 *
 * const stream1 = ReadableStream.from(["1"]);
 * const stream2 = ReadableStream.from(["a", "b"]);
 * const stream3 = ReadableStream.from(["A", "B", "C"]);
 * const zippedStream = earlyZipReadableStreams(stream1, stream2, stream3);
 *
 * assertEquals(
 *   await Array.fromAsync(zippedStream),
 *   ["1", "a", "A"],
 * );
 * ```
 */
export function earlyZipReadableStreams<T>(
  ...streams: ReadableStream<T>[]
): ReadableStream<T> {
  const readers = streams.map((stream) => stream.getReader());
  return new ReadableStream<T>({
    async pull(controller) {
      for (let i = 0; i < readers.length; ++i) {
        const { done, value } = await readers[i]!.read();
        if (done) {
          await Promise.all(
            readers.map((reader) =>
              reader.cancel(`Stream at index ${i} ended`)
            ),
          );
          controller.close();
          return;
        }
        controller.enqueue(value);
      }
    },
    async cancel(reason) {
      await Promise.all(readers.map((reader) => reader.cancel(reason)));
    },
  });
}
