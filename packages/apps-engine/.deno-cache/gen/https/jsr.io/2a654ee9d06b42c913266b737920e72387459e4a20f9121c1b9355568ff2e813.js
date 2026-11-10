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
 */ export function earlyZipReadableStreams(...streams) {
  const readers = streams.map((stream)=>stream.getReader());
  return new ReadableStream({
    async pull (controller) {
      for(let i = 0; i < readers.length; ++i){
        const { done, value } = await readers[i].read();
        if (done) {
          await Promise.all(readers.map((reader)=>reader.cancel(`Stream at index ${i} ended`)));
          controller.close();
          return;
        }
        controller.enqueue(value);
      }
    },
    async cancel (reason) {
      await Promise.all(readers.map((reader)=>reader.cancel(reason)));
    }
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvc3RyZWFtcy8xLjAuMTYvZWFybHlfemlwX3JlYWRhYmxlX3N0cmVhbXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBNZXJnZSBtdWx0aXBsZSBzdHJlYW1zIGludG8gYSBzaW5nbGUgb25lLCB0YWtpbmcgb3JkZXIgaW50byBhY2NvdW50LCBhbmQgZWFjaFxuICogc3RyZWFtIHdpbGwgd2FpdCBmb3IgYSBjaHVuayB0byBlbnF1ZXVlIGJlZm9yZSB0aGUgbmV4dCBzdHJlYW0gY2FuIGFwcGVuZFxuICogYW5vdGhlciBjaHVuay5cbiAqXG4gKiBJZiBhIHN0cmVhbSBlbmRzIGJlZm9yZSBvdGhlciBvbmVzLCB0aGUgb3RoZXJzIHdpbGwgYmUgY2FuY2VsbGVkIGFmdGVyIHRoZVxuICogbGFzdCBjaHVuayBvZiBzYWlkIHN0cmVhbSBpcyByZWFkLiBTZWUgdGhlIGV4YW1wbGVzIGJlbG93IGZvciBtb3JlXG4gKiBjb21wcmVoZW5zaWJsZSBpbmZvcm1hdGlvbi4gSWYgeW91IHdhbnQgdG8gY29udGludWUgcmVhZGluZyB0aGUgb3RoZXIgc3RyZWFtc1xuICogZXZlbiBhZnRlciBvbmUgb2YgdGhlbSBlbmRzLCB1c2Uge0BsaW5rY29kZSB6aXBSZWFkYWJsZVN0cmVhbXN9LlxuICpcbiAqIEB0eXBlcGFyYW0gVCBUaGUgdHlwZSBvZiB0aGUgY2h1bmtzIGluIHRoZSBpbnB1dCBzdHJlYW1zLlxuICogQHBhcmFtIHN0cmVhbXMgQW4gaXRlcmFibGUgb2YgYFJlYWRhYmxlU3RyZWFtYHMgdG8gbWVyZ2UuXG4gKiBAcmV0dXJucyBBIGBSZWFkYWJsZVN0cmVhbWAgdGhhdCB3aWxsIGVtaXQgdGhlIHppcHBlZCBjaHVua3NcbiAqXG4gKiBAZXhhbXBsZSBaaXAgMiBzdHJlYW1zIHdpdGggdGhlIHNhbWUgbGVuZ3RoXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZWFybHlaaXBSZWFkYWJsZVN0cmVhbXMgfSBmcm9tIFwiQHN0ZC9zdHJlYW1zL2Vhcmx5LXppcC1yZWFkYWJsZS1zdHJlYW1zXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCBzdHJlYW0xID0gUmVhZGFibGVTdHJlYW0uZnJvbShbXCIxXCIsIFwiMlwiLCBcIjNcIl0pO1xuICogY29uc3Qgc3RyZWFtMiA9IFJlYWRhYmxlU3RyZWFtLmZyb20oW1wiYVwiLCBcImJcIiwgXCJjXCJdKTtcbiAqIGNvbnN0IHppcHBlZFN0cmVhbSA9IGVhcmx5WmlwUmVhZGFibGVTdHJlYW1zKHN0cmVhbTEsIHN0cmVhbTIpO1xuICpcbiAqIGFzc2VydEVxdWFscyhcbiAqICAgYXdhaXQgQXJyYXkuZnJvbUFzeW5jKHppcHBlZFN0cmVhbSksXG4gKiAgIFtcIjFcIiwgXCJhXCIsIFwiMlwiLCBcImJcIiwgXCIzXCIsIFwiY1wiXSxcbiAqICk7XG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZSBaaXAgMiBzdHJlYW1zIHdpdGggZGlmZmVyZW50IGxlbmd0aCAoZmlyc3Qgb25lIGlzIHNob3J0ZXIpXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZWFybHlaaXBSZWFkYWJsZVN0cmVhbXMgfSBmcm9tIFwiQHN0ZC9zdHJlYW1zL2Vhcmx5LXppcC1yZWFkYWJsZS1zdHJlYW1zXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCBzdHJlYW0xID0gUmVhZGFibGVTdHJlYW0uZnJvbShbXCIxXCIsIFwiMlwiXSk7XG4gKiBjb25zdCBzdHJlYW0yID0gUmVhZGFibGVTdHJlYW0uZnJvbShbXCJhXCIsIFwiYlwiLCBcImNcIiwgXCJkXCJdKTtcbiAqIGNvbnN0IHppcHBlZFN0cmVhbSA9IGVhcmx5WmlwUmVhZGFibGVTdHJlYW1zKHN0cmVhbTEsIHN0cmVhbTIpO1xuICpcbiAqIC8vIFRoZSBmaXJzdCBzdHJlYW0gZW5kcyBiZWZvcmUgdGhlIHNlY29uZCBvbmUuIFdoZW4gdGhlIGZpcnN0IHN0cmVhbSBlbmRzLFxuICogLy8gdGhlIHNlY29uZCBvbmUgaXMgY2FuY2VsbGVkIGFuZCBubyBtb3JlIGRhdGEgaXMgcmVhZCBvciBhZGRlZCB0byB0aGVcbiAqIC8vIHppcHBlZCBzdHJlYW0uXG4gKiBhc3NlcnRFcXVhbHMoXG4gKiAgIGF3YWl0IEFycmF5LmZyb21Bc3luYyh6aXBwZWRTdHJlYW0pLFxuICogICBbXCIxXCIsIFwiYVwiLCBcIjJcIiwgXCJiXCJdLFxuICogKTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIFppcCAyIHN0cmVhbXMgd2l0aCBkaWZmZXJlbnQgbGVuZ3RoIChmaXJzdCBvbmUgaXMgbG9uZ2VyKVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGVhcmx5WmlwUmVhZGFibGVTdHJlYW1zIH0gZnJvbSBcIkBzdGQvc3RyZWFtcy9lYXJseS16aXAtcmVhZGFibGUtc3RyZWFtc1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3Qgc3RyZWFtMSA9IFJlYWRhYmxlU3RyZWFtLmZyb20oW1wiMVwiLCBcIjJcIiwgXCIzXCIsIFwiNFwiXSk7XG4gKiBjb25zdCBzdHJlYW0yID0gUmVhZGFibGVTdHJlYW0uZnJvbShbXCJhXCIsIFwiYlwiXSk7XG4gKiBjb25zdCB6aXBwZWRTdHJlYW0gPSBlYXJseVppcFJlYWRhYmxlU3RyZWFtcyhzdHJlYW0xLCBzdHJlYW0yKTtcbiAqXG4gKiAvLyBUaGUgc2Vjb25kIHN0cmVhbSBlbmRzIGJlZm9yZSB0aGUgZmlyc3Qgb25lLiBXaGVuIHRoZSBzZWNvbmQgc3RyZWFtIGVuZHMsXG4gKiAvLyB0aGUgZmlyc3Qgb25lIGlzIGNhbmNlbGxlZCwgYnV0IHRoZSBjaHVuayBvZiBcIjNcIiBpcyBhbHJlYWR5IHJlYWQgc28gaXRcbiAqIC8vIGlzIGFkZGVkIHRvIHRoZSB6aXBwZWQgc3RyZWFtLlxuICogYXNzZXJ0RXF1YWxzKFxuICogICBhd2FpdCBBcnJheS5mcm9tQXN5bmMoemlwcGVkU3RyZWFtKSxcbiAqICAgW1wiMVwiLCBcImFcIiwgXCIyXCIsIFwiYlwiLCBcIjNcIl0sXG4gKiApO1xuICogYGBgXG4gKlxuICogQGV4YW1wbGUgWmlwIDMgc3RyZWFtc1xuICogYGBgdHNcbiAqIGltcG9ydCB7IGVhcmx5WmlwUmVhZGFibGVTdHJlYW1zIH0gZnJvbSBcIkBzdGQvc3RyZWFtcy9lYXJseS16aXAtcmVhZGFibGUtc3RyZWFtc1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3Qgc3RyZWFtMSA9IFJlYWRhYmxlU3RyZWFtLmZyb20oW1wiMVwiXSk7XG4gKiBjb25zdCBzdHJlYW0yID0gUmVhZGFibGVTdHJlYW0uZnJvbShbXCJhXCIsIFwiYlwiXSk7XG4gKiBjb25zdCBzdHJlYW0zID0gUmVhZGFibGVTdHJlYW0uZnJvbShbXCJBXCIsIFwiQlwiLCBcIkNcIl0pO1xuICogY29uc3QgemlwcGVkU3RyZWFtID0gZWFybHlaaXBSZWFkYWJsZVN0cmVhbXMoc3RyZWFtMSwgc3RyZWFtMiwgc3RyZWFtMyk7XG4gKlxuICogYXNzZXJ0RXF1YWxzKFxuICogICBhd2FpdCBBcnJheS5mcm9tQXN5bmMoemlwcGVkU3RyZWFtKSxcbiAqICAgW1wiMVwiLCBcImFcIiwgXCJBXCJdLFxuICogKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZWFybHlaaXBSZWFkYWJsZVN0cmVhbXM8VD4oXG4gIC4uLnN0cmVhbXM6IFJlYWRhYmxlU3RyZWFtPFQ+W11cbik6IFJlYWRhYmxlU3RyZWFtPFQ+IHtcbiAgY29uc3QgcmVhZGVycyA9IHN0cmVhbXMubWFwKChzdHJlYW0pID0+IHN0cmVhbS5nZXRSZWFkZXIoKSk7XG4gIHJldHVybiBuZXcgUmVhZGFibGVTdHJlYW08VD4oe1xuICAgIGFzeW5jIHB1bGwoY29udHJvbGxlcikge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWFkZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGNvbnN0IHsgZG9uZSwgdmFsdWUgfSA9IGF3YWl0IHJlYWRlcnNbaV0hLnJlYWQoKTtcbiAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgICAgIHJlYWRlcnMubWFwKChyZWFkZXIpID0+XG4gICAgICAgICAgICAgIHJlYWRlci5jYW5jZWwoYFN0cmVhbSBhdCBpbmRleCAke2l9IGVuZGVkYClcbiAgICAgICAgICAgICksXG4gICAgICAgICAgKTtcbiAgICAgICAgICBjb250cm9sbGVyLmNsb3NlKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZSh2YWx1ZSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBhc3luYyBjYW5jZWwocmVhc29uKSB7XG4gICAgICBhd2FpdCBQcm9taXNlLmFsbChyZWFkZXJzLm1hcCgocmVhZGVyKSA9PiByZWFkZXIuY2FuY2VsKHJlYXNvbikpKTtcbiAgICB9LFxuICB9KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWdGQyxHQUNELE9BQU8sU0FBUyx3QkFDZCxHQUFHLE9BQTRCO0VBRS9CLE1BQU0sVUFBVSxRQUFRLEdBQUcsQ0FBQyxDQUFDLFNBQVcsT0FBTyxTQUFTO0VBQ3hELE9BQU8sSUFBSSxlQUFrQjtJQUMzQixNQUFNLE1BQUssVUFBVTtNQUNuQixJQUFLLElBQUksSUFBSSxHQUFHLElBQUksUUFBUSxNQUFNLEVBQUUsRUFBRSxFQUFHO1FBQ3ZDLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsTUFBTSxPQUFPLENBQUMsRUFBRSxDQUFFLElBQUk7UUFDOUMsSUFBSSxNQUFNO1VBQ1IsTUFBTSxRQUFRLEdBQUcsQ0FDZixRQUFRLEdBQUcsQ0FBQyxDQUFDLFNBQ1gsT0FBTyxNQUFNLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLE1BQU0sQ0FBQztVQUc5QyxXQUFXLEtBQUs7VUFDaEI7UUFDRjtRQUNBLFdBQVcsT0FBTyxDQUFDO01BQ3JCO0lBQ0Y7SUFDQSxNQUFNLFFBQU8sTUFBTTtNQUNqQixNQUFNLFFBQVEsR0FBRyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsU0FBVyxPQUFPLE1BQU0sQ0FBQztJQUMxRDtFQUNGO0FBQ0YifQ==
// denoCacheMetadata=10624261855092542427,9047056402665491915