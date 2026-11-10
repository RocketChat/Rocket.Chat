// Copyright 2018-2025 the Deno authors. MIT license.

/**
 * Merge multiple streams into a single one, not taking order into account.
 * If a stream ends before other ones, the other will continue adding data,
 * and the finished one will not add any more data.
 *
 * @typeparam T The type of the chunks in the input/output streams.
 * @param streams An iterable of `ReadableStream`s to merge.
 * @returns A `ReadableStream` that will emit the merged chunks.
 *
 * @example Merge 2 streams
 * ```ts
 * import { mergeReadableStreams } from "@std/streams/merge-readable-streams";
 * import { assertEquals } from "@std/assert";
 *
 * const stream1 = ReadableStream.from([1, 2]);
 * const stream2 = ReadableStream.from([3, 4, 5]);
 *
 * const mergedStream = mergeReadableStreams(stream1, stream2);
 * const merged = await Array.fromAsync(mergedStream);
 * assertEquals(merged.toSorted(), [1, 2, 3, 4, 5]);
 * ```
 *
 * @example Merge 3 streams
 * ```ts
 * import { mergeReadableStreams } from "@std/streams/merge-readable-streams";
 * import { assertEquals } from "@std/assert";
 *
 * const stream1 = ReadableStream.from([1, 2]);
 * const stream2 = ReadableStream.from([3, 4, 5]);
 * const stream3 = ReadableStream.from([6]);
 *
 * const mergedStream = mergeReadableStreams(stream1, stream2, stream3);
 * const merged = await Array.fromAsync(mergedStream);
 * assertEquals(merged.toSorted(), [1, 2, 3, 4, 5, 6]);
 * ```
 */
export function mergeReadableStreams<T>(
  ...streams: ReadableStream<T>[]
): ReadableStream<T> {
  const resolvePromises = streams.map(() => Promise.withResolvers<void>());
  return new ReadableStream<T>({
    start(controller) {
      let mustClose = false;
      Promise.all(resolvePromises.map(({ promise }) => promise))
        .then(() => {
          controller.close();
        })
        .catch((error) => {
          mustClose = true;
          controller.error(error);
        });
      for (const [index, stream] of streams.entries()) {
        (async () => {
          try {
            for await (const data of stream) {
              if (mustClose) {
                break;
              }
              controller.enqueue(data);
            }
            resolvePromises[index]!.resolve();
          } catch (error) {
            resolvePromises[index]!.reject(error);
          }
        })();
      }
    },
  });
}
