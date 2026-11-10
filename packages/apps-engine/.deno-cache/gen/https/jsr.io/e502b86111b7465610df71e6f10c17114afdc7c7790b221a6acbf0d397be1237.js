// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
/**
 * Merge multiple streams into a single one, taking order into account, and
 * each stream will wait for a chunk to enqueue before the next stream can
 * append another chunk.
 *
 * If a stream ends before other ones, the others will continue adding data in
 * order, and the finished one will not add any more data. If you want to cancel
 * the other streams when one of them ends, use {@linkcode earlyZipReadableStreams}.
 *
 * @typeparam T The type of the chunks in the input/output streams.
 * @param streams An iterable of `ReadableStream`s to merge.
 * @returns A `ReadableStream` that will emit the zipped chunks.
 *
 * @example Zip 2 streams with the same length
 * ```ts
 * import { zipReadableStreams } from "@std/streams/zip-readable-streams";
 * import { assertEquals } from "@std/assert";
 *
 * const stream1 = ReadableStream.from(["1", "2", "3"]);
 * const stream2 = ReadableStream.from(["a", "b", "c"]);
 * const zippedStream = zipReadableStreams(stream1, stream2);
 *
 * assertEquals(
 *   await Array.fromAsync(zippedStream),
 *   ["1", "a", "2", "b", "3", "c"],
 * );
 * ```
 *
 * @example Zip 2 streams with different length (first one is shorter)
 * ```ts
 * import { zipReadableStreams } from "@std/streams/zip-readable-streams";
 * import { assertEquals } from "@std/assert";
 *
 * const stream1 = ReadableStream.from(["1", "2"]);
 * const stream2 = ReadableStream.from(["a", "b", "c", "d"]);
 * const zippedStream = zipReadableStreams(stream1, stream2);
 *
 * assertEquals(
 *   await Array.fromAsync(zippedStream),
 *   ["1", "a", "2", "b", "c", "d"],
 * );
 * ```
 *
 * @example Zip 2 streams with different length (first one is longer)
 * ```ts
 * import { zipReadableStreams } from "@std/streams/zip-readable-streams";
 * import { assertEquals } from "@std/assert";
 *
 * const stream1 = ReadableStream.from(["1", "2", "3", "4"]);
 * const stream2 = ReadableStream.from(["a", "b"]);
 * const zippedStream = zipReadableStreams(stream1, stream2);
 *
 * assertEquals(
 *   await Array.fromAsync(zippedStream),
 *   ["1", "a", "2", "b", "3", "4"],
 * );
 * ```
 *
 * @example Zip 3 streams
 * ```ts
 * import { zipReadableStreams } from "@std/streams/zip-readable-streams";
 * import { assertEquals } from "@std/assert";
 *
 * const stream1 = ReadableStream.from(["1"]);
 * const stream2 = ReadableStream.from(["a", "b"]);
 * const stream3 = ReadableStream.from(["A", "B", "C"]);
 * const zippedStream = zipReadableStreams(stream1, stream2, stream3);
 *
 * assertEquals(
 *   await Array.fromAsync(zippedStream),
 *   ["1", "a", "A", "b", "B", "C"],
 * );
 * ```
 */ export function zipReadableStreams(...streams) {
  const readers = new Set(streams.map((s)=>s.getReader()));
  return new ReadableStream({
    async start (controller) {
      try {
        let resolved = 0;
        while(resolved !== streams.length){
          for (const reader of readers){
            const { value, done } = await reader.read();
            if (!done) {
              controller.enqueue(value);
            } else {
              resolved++;
              readers.delete(reader);
            }
          }
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    }
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvc3RyZWFtcy8xLjAuMTYvemlwX3JlYWRhYmxlX3N0cmVhbXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBNZXJnZSBtdWx0aXBsZSBzdHJlYW1zIGludG8gYSBzaW5nbGUgb25lLCB0YWtpbmcgb3JkZXIgaW50byBhY2NvdW50LCBhbmRcbiAqIGVhY2ggc3RyZWFtIHdpbGwgd2FpdCBmb3IgYSBjaHVuayB0byBlbnF1ZXVlIGJlZm9yZSB0aGUgbmV4dCBzdHJlYW0gY2FuXG4gKiBhcHBlbmQgYW5vdGhlciBjaHVuay5cbiAqXG4gKiBJZiBhIHN0cmVhbSBlbmRzIGJlZm9yZSBvdGhlciBvbmVzLCB0aGUgb3RoZXJzIHdpbGwgY29udGludWUgYWRkaW5nIGRhdGEgaW5cbiAqIG9yZGVyLCBhbmQgdGhlIGZpbmlzaGVkIG9uZSB3aWxsIG5vdCBhZGQgYW55IG1vcmUgZGF0YS4gSWYgeW91IHdhbnQgdG8gY2FuY2VsXG4gKiB0aGUgb3RoZXIgc3RyZWFtcyB3aGVuIG9uZSBvZiB0aGVtIGVuZHMsIHVzZSB7QGxpbmtjb2RlIGVhcmx5WmlwUmVhZGFibGVTdHJlYW1zfS5cbiAqXG4gKiBAdHlwZXBhcmFtIFQgVGhlIHR5cGUgb2YgdGhlIGNodW5rcyBpbiB0aGUgaW5wdXQvb3V0cHV0IHN0cmVhbXMuXG4gKiBAcGFyYW0gc3RyZWFtcyBBbiBpdGVyYWJsZSBvZiBgUmVhZGFibGVTdHJlYW1gcyB0byBtZXJnZS5cbiAqIEByZXR1cm5zIEEgYFJlYWRhYmxlU3RyZWFtYCB0aGF0IHdpbGwgZW1pdCB0aGUgemlwcGVkIGNodW5rcy5cbiAqXG4gKiBAZXhhbXBsZSBaaXAgMiBzdHJlYW1zIHdpdGggdGhlIHNhbWUgbGVuZ3RoXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgemlwUmVhZGFibGVTdHJlYW1zIH0gZnJvbSBcIkBzdGQvc3RyZWFtcy96aXAtcmVhZGFibGUtc3RyZWFtc1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3Qgc3RyZWFtMSA9IFJlYWRhYmxlU3RyZWFtLmZyb20oW1wiMVwiLCBcIjJcIiwgXCIzXCJdKTtcbiAqIGNvbnN0IHN0cmVhbTIgPSBSZWFkYWJsZVN0cmVhbS5mcm9tKFtcImFcIiwgXCJiXCIsIFwiY1wiXSk7XG4gKiBjb25zdCB6aXBwZWRTdHJlYW0gPSB6aXBSZWFkYWJsZVN0cmVhbXMoc3RyZWFtMSwgc3RyZWFtMik7XG4gKlxuICogYXNzZXJ0RXF1YWxzKFxuICogICBhd2FpdCBBcnJheS5mcm9tQXN5bmMoemlwcGVkU3RyZWFtKSxcbiAqICAgW1wiMVwiLCBcImFcIiwgXCIyXCIsIFwiYlwiLCBcIjNcIiwgXCJjXCJdLFxuICogKTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIFppcCAyIHN0cmVhbXMgd2l0aCBkaWZmZXJlbnQgbGVuZ3RoIChmaXJzdCBvbmUgaXMgc2hvcnRlcilcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB6aXBSZWFkYWJsZVN0cmVhbXMgfSBmcm9tIFwiQHN0ZC9zdHJlYW1zL3ppcC1yZWFkYWJsZS1zdHJlYW1zXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCBzdHJlYW0xID0gUmVhZGFibGVTdHJlYW0uZnJvbShbXCIxXCIsIFwiMlwiXSk7XG4gKiBjb25zdCBzdHJlYW0yID0gUmVhZGFibGVTdHJlYW0uZnJvbShbXCJhXCIsIFwiYlwiLCBcImNcIiwgXCJkXCJdKTtcbiAqIGNvbnN0IHppcHBlZFN0cmVhbSA9IHppcFJlYWRhYmxlU3RyZWFtcyhzdHJlYW0xLCBzdHJlYW0yKTtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoXG4gKiAgIGF3YWl0IEFycmF5LmZyb21Bc3luYyh6aXBwZWRTdHJlYW0pLFxuICogICBbXCIxXCIsIFwiYVwiLCBcIjJcIiwgXCJiXCIsIFwiY1wiLCBcImRcIl0sXG4gKiApO1xuICogYGBgXG4gKlxuICogQGV4YW1wbGUgWmlwIDIgc3RyZWFtcyB3aXRoIGRpZmZlcmVudCBsZW5ndGggKGZpcnN0IG9uZSBpcyBsb25nZXIpXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgemlwUmVhZGFibGVTdHJlYW1zIH0gZnJvbSBcIkBzdGQvc3RyZWFtcy96aXAtcmVhZGFibGUtc3RyZWFtc1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3Qgc3RyZWFtMSA9IFJlYWRhYmxlU3RyZWFtLmZyb20oW1wiMVwiLCBcIjJcIiwgXCIzXCIsIFwiNFwiXSk7XG4gKiBjb25zdCBzdHJlYW0yID0gUmVhZGFibGVTdHJlYW0uZnJvbShbXCJhXCIsIFwiYlwiXSk7XG4gKiBjb25zdCB6aXBwZWRTdHJlYW0gPSB6aXBSZWFkYWJsZVN0cmVhbXMoc3RyZWFtMSwgc3RyZWFtMik7XG4gKlxuICogYXNzZXJ0RXF1YWxzKFxuICogICBhd2FpdCBBcnJheS5mcm9tQXN5bmMoemlwcGVkU3RyZWFtKSxcbiAqICAgW1wiMVwiLCBcImFcIiwgXCIyXCIsIFwiYlwiLCBcIjNcIiwgXCI0XCJdLFxuICogKTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIFppcCAzIHN0cmVhbXNcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB6aXBSZWFkYWJsZVN0cmVhbXMgfSBmcm9tIFwiQHN0ZC9zdHJlYW1zL3ppcC1yZWFkYWJsZS1zdHJlYW1zXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCBzdHJlYW0xID0gUmVhZGFibGVTdHJlYW0uZnJvbShbXCIxXCJdKTtcbiAqIGNvbnN0IHN0cmVhbTIgPSBSZWFkYWJsZVN0cmVhbS5mcm9tKFtcImFcIiwgXCJiXCJdKTtcbiAqIGNvbnN0IHN0cmVhbTMgPSBSZWFkYWJsZVN0cmVhbS5mcm9tKFtcIkFcIiwgXCJCXCIsIFwiQ1wiXSk7XG4gKiBjb25zdCB6aXBwZWRTdHJlYW0gPSB6aXBSZWFkYWJsZVN0cmVhbXMoc3RyZWFtMSwgc3RyZWFtMiwgc3RyZWFtMyk7XG4gKlxuICogYXNzZXJ0RXF1YWxzKFxuICogICBhd2FpdCBBcnJheS5mcm9tQXN5bmMoemlwcGVkU3RyZWFtKSxcbiAqICAgW1wiMVwiLCBcImFcIiwgXCJBXCIsIFwiYlwiLCBcIkJcIiwgXCJDXCJdLFxuICogKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gemlwUmVhZGFibGVTdHJlYW1zPFQ+KFxuICAuLi5zdHJlYW1zOiBSZWFkYWJsZVN0cmVhbTxUPltdXG4pOiBSZWFkYWJsZVN0cmVhbTxUPiB7XG4gIGNvbnN0IHJlYWRlcnMgPSBuZXcgU2V0KHN0cmVhbXMubWFwKChzKSA9PiBzLmdldFJlYWRlcigpKSk7XG4gIHJldHVybiBuZXcgUmVhZGFibGVTdHJlYW08VD4oe1xuICAgIGFzeW5jIHN0YXJ0KGNvbnRyb2xsZXIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCByZXNvbHZlZCA9IDA7XG4gICAgICAgIHdoaWxlIChyZXNvbHZlZCAhPT0gc3RyZWFtcy5sZW5ndGgpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IHJlYWRlciBvZiByZWFkZXJzKSB7XG4gICAgICAgICAgICBjb25zdCB7IHZhbHVlLCBkb25lIH0gPSBhd2FpdCByZWFkZXIucmVhZCgpO1xuICAgICAgICAgICAgaWYgKCFkb25lKSB7XG4gICAgICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZSh2YWx1ZSEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZWQrKztcbiAgICAgICAgICAgICAgcmVhZGVycy5kZWxldGUocmVhZGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29udHJvbGxlci5jbG9zZSgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb250cm9sbGVyLmVycm9yKGUpO1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F5RUMsR0FDRCxPQUFPLFNBQVMsbUJBQ2QsR0FBRyxPQUE0QjtFQUUvQixNQUFNLFVBQVUsSUFBSSxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBTSxFQUFFLFNBQVM7RUFDdEQsT0FBTyxJQUFJLGVBQWtCO0lBQzNCLE1BQU0sT0FBTSxVQUFVO01BQ3BCLElBQUk7UUFDRixJQUFJLFdBQVc7UUFDZixNQUFPLGFBQWEsUUFBUSxNQUFNLENBQUU7VUFDbEMsS0FBSyxNQUFNLFVBQVUsUUFBUztZQUM1QixNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sT0FBTyxJQUFJO1lBQ3pDLElBQUksQ0FBQyxNQUFNO2NBQ1QsV0FBVyxPQUFPLENBQUM7WUFDckIsT0FBTztjQUNMO2NBQ0EsUUFBUSxNQUFNLENBQUM7WUFDakI7VUFDRjtRQUNGO1FBQ0EsV0FBVyxLQUFLO01BQ2xCLEVBQUUsT0FBTyxHQUFHO1FBQ1YsV0FBVyxLQUFLLENBQUM7TUFDbkI7SUFDRjtFQUNGO0FBQ0YifQ==
// denoCacheMetadata=7953897312559012795,15196476058273000977