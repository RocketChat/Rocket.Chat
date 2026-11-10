// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
/**
 * Concatenates multiple `ReadableStream`s into a single ordered
 * `ReadableStream`.
 *
 * Cancelling the resulting stream will cancel all the input streams.
 *
 * @typeParam T The type of the chunks in the streams.
 * @param streams An iterable of `ReadableStream`s to concat.
 * @returns A `ReadableStream` that will emit the concatenated chunks.
 *
 * @example Usage
 * ```ts
 * import { concatReadableStreams } from "@std/streams/concat-readable-streams";
 * import { assertEquals } from "@std/assert";
 *
 * const stream1 = ReadableStream.from([1, 2, 3]);
 * const stream2 = ReadableStream.from([4, 5, 6]);
 * const stream3 = ReadableStream.from([7, 8, 9]);
 *
 * assertEquals(
 *   await Array.fromAsync(concatReadableStreams(stream1, stream2, stream3)),
 *   [1, 2, 3, 4, 5, 6, 7, 8, 9],
 * );
 * ```
 */ export function concatReadableStreams(...streams) {
  let i = 0;
  return new ReadableStream({
    async pull (controller) {
      const reader = streams[i].getReader();
      const { done, value } = await reader.read();
      if (done) {
        if (streams.length === ++i) {
          return controller.close();
        }
        return await this.pull(controller);
      }
      controller.enqueue(value);
      reader.releaseLock();
    },
    async cancel (reason) {
      const promises = streams.map((stream)=>stream.cancel(reason));
      await Promise.allSettled(promises);
    }
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvc3RyZWFtcy8xLjAuMTYvY29uY2F0X3JlYWRhYmxlX3N0cmVhbXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBDb25jYXRlbmF0ZXMgbXVsdGlwbGUgYFJlYWRhYmxlU3RyZWFtYHMgaW50byBhIHNpbmdsZSBvcmRlcmVkXG4gKiBgUmVhZGFibGVTdHJlYW1gLlxuICpcbiAqIENhbmNlbGxpbmcgdGhlIHJlc3VsdGluZyBzdHJlYW0gd2lsbCBjYW5jZWwgYWxsIHRoZSBpbnB1dCBzdHJlYW1zLlxuICpcbiAqIEB0eXBlUGFyYW0gVCBUaGUgdHlwZSBvZiB0aGUgY2h1bmtzIGluIHRoZSBzdHJlYW1zLlxuICogQHBhcmFtIHN0cmVhbXMgQW4gaXRlcmFibGUgb2YgYFJlYWRhYmxlU3RyZWFtYHMgdG8gY29uY2F0LlxuICogQHJldHVybnMgQSBgUmVhZGFibGVTdHJlYW1gIHRoYXQgd2lsbCBlbWl0IHRoZSBjb25jYXRlbmF0ZWQgY2h1bmtzLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgY29uY2F0UmVhZGFibGVTdHJlYW1zIH0gZnJvbSBcIkBzdGQvc3RyZWFtcy9jb25jYXQtcmVhZGFibGUtc3RyZWFtc1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3Qgc3RyZWFtMSA9IFJlYWRhYmxlU3RyZWFtLmZyb20oWzEsIDIsIDNdKTtcbiAqIGNvbnN0IHN0cmVhbTIgPSBSZWFkYWJsZVN0cmVhbS5mcm9tKFs0LCA1LCA2XSk7XG4gKiBjb25zdCBzdHJlYW0zID0gUmVhZGFibGVTdHJlYW0uZnJvbShbNywgOCwgOV0pO1xuICpcbiAqIGFzc2VydEVxdWFscyhcbiAqICAgYXdhaXQgQXJyYXkuZnJvbUFzeW5jKGNvbmNhdFJlYWRhYmxlU3RyZWFtcyhzdHJlYW0xLCBzdHJlYW0yLCBzdHJlYW0zKSksXG4gKiAgIFsxLCAyLCAzLCA0LCA1LCA2LCA3LCA4LCA5XSxcbiAqICk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbmNhdFJlYWRhYmxlU3RyZWFtczxUPihcbiAgLi4uc3RyZWFtczogUmVhZGFibGVTdHJlYW08VD5bXVxuKTogUmVhZGFibGVTdHJlYW08VD4ge1xuICBsZXQgaSA9IDA7XG4gIHJldHVybiBuZXcgUmVhZGFibGVTdHJlYW08VD4oe1xuICAgIGFzeW5jIHB1bGwoY29udHJvbGxlcikge1xuICAgICAgY29uc3QgcmVhZGVyID0gc3RyZWFtc1tpXSEuZ2V0UmVhZGVyKCk7XG4gICAgICBjb25zdCB7IGRvbmUsIHZhbHVlIH0gPSBhd2FpdCByZWFkZXIucmVhZCgpO1xuICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgaWYgKHN0cmVhbXMubGVuZ3RoID09PSArK2kpIHtcbiAgICAgICAgICByZXR1cm4gY29udHJvbGxlci5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnB1bGwhKGNvbnRyb2xsZXIpO1xuICAgICAgfVxuICAgICAgY29udHJvbGxlci5lbnF1ZXVlKHZhbHVlKTtcbiAgICAgIHJlYWRlci5yZWxlYXNlTG9jaygpO1xuICAgIH0sXG4gICAgYXN5bmMgY2FuY2VsKHJlYXNvbikge1xuICAgICAgY29uc3QgcHJvbWlzZXMgPSBzdHJlYW1zLm1hcCgoc3RyZWFtKSA9PiBzdHJlYW0uY2FuY2VsKHJlYXNvbikpO1xuICAgICAgYXdhaXQgUHJvbWlzZS5hbGxTZXR0bGVkKHByb21pc2VzKTtcbiAgICB9LFxuICB9KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F3QkMsR0FDRCxPQUFPLFNBQVMsc0JBQ2QsR0FBRyxPQUE0QjtFQUUvQixJQUFJLElBQUk7RUFDUixPQUFPLElBQUksZUFBa0I7SUFDM0IsTUFBTSxNQUFLLFVBQVU7TUFDbkIsTUFBTSxTQUFTLE9BQU8sQ0FBQyxFQUFFLENBQUUsU0FBUztNQUNwQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLE1BQU0sT0FBTyxJQUFJO01BQ3pDLElBQUksTUFBTTtRQUNSLElBQUksUUFBUSxNQUFNLEtBQUssRUFBRSxHQUFHO1VBQzFCLE9BQU8sV0FBVyxLQUFLO1FBQ3pCO1FBQ0EsT0FBTyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUU7TUFDMUI7TUFDQSxXQUFXLE9BQU8sQ0FBQztNQUNuQixPQUFPLFdBQVc7SUFDcEI7SUFDQSxNQUFNLFFBQU8sTUFBTTtNQUNqQixNQUFNLFdBQVcsUUFBUSxHQUFHLENBQUMsQ0FBQyxTQUFXLE9BQU8sTUFBTSxDQUFDO01BQ3ZELE1BQU0sUUFBUSxVQUFVLENBQUM7SUFDM0I7RUFDRjtBQUNGIn0=
// denoCacheMetadata=16526025020965608587,17363264862782560189