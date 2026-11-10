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
 */ export function mergeReadableStreams(...streams) {
  const resolvePromises = streams.map(()=>Promise.withResolvers());
  return new ReadableStream({
    start (controller) {
      let mustClose = false;
      Promise.all(resolvePromises.map(({ promise })=>promise)).then(()=>{
        controller.close();
      }).catch((error)=>{
        mustClose = true;
        controller.error(error);
      });
      for (const [index, stream] of streams.entries()){
        (async ()=>{
          try {
            for await (const data of stream){
              if (mustClose) {
                break;
              }
              controller.enqueue(data);
            }
            resolvePromises[index].resolve();
          } catch (error) {
            resolvePromises[index].reject(error);
          }
        })();
      }
    }
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvc3RyZWFtcy8xLjAuMTYvbWVyZ2VfcmVhZGFibGVfc3RyZWFtcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuXG4vKipcbiAqIE1lcmdlIG11bHRpcGxlIHN0cmVhbXMgaW50byBhIHNpbmdsZSBvbmUsIG5vdCB0YWtpbmcgb3JkZXIgaW50byBhY2NvdW50LlxuICogSWYgYSBzdHJlYW0gZW5kcyBiZWZvcmUgb3RoZXIgb25lcywgdGhlIG90aGVyIHdpbGwgY29udGludWUgYWRkaW5nIGRhdGEsXG4gKiBhbmQgdGhlIGZpbmlzaGVkIG9uZSB3aWxsIG5vdCBhZGQgYW55IG1vcmUgZGF0YS5cbiAqXG4gKiBAdHlwZXBhcmFtIFQgVGhlIHR5cGUgb2YgdGhlIGNodW5rcyBpbiB0aGUgaW5wdXQvb3V0cHV0IHN0cmVhbXMuXG4gKiBAcGFyYW0gc3RyZWFtcyBBbiBpdGVyYWJsZSBvZiBgUmVhZGFibGVTdHJlYW1gcyB0byBtZXJnZS5cbiAqIEByZXR1cm5zIEEgYFJlYWRhYmxlU3RyZWFtYCB0aGF0IHdpbGwgZW1pdCB0aGUgbWVyZ2VkIGNodW5rcy5cbiAqXG4gKiBAZXhhbXBsZSBNZXJnZSAyIHN0cmVhbXNcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBtZXJnZVJlYWRhYmxlU3RyZWFtcyB9IGZyb20gXCJAc3RkL3N0cmVhbXMvbWVyZ2UtcmVhZGFibGUtc3RyZWFtc1wiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3Qgc3RyZWFtMSA9IFJlYWRhYmxlU3RyZWFtLmZyb20oWzEsIDJdKTtcbiAqIGNvbnN0IHN0cmVhbTIgPSBSZWFkYWJsZVN0cmVhbS5mcm9tKFszLCA0LCA1XSk7XG4gKlxuICogY29uc3QgbWVyZ2VkU3RyZWFtID0gbWVyZ2VSZWFkYWJsZVN0cmVhbXMoc3RyZWFtMSwgc3RyZWFtMik7XG4gKiBjb25zdCBtZXJnZWQgPSBhd2FpdCBBcnJheS5mcm9tQXN5bmMobWVyZ2VkU3RyZWFtKTtcbiAqIGFzc2VydEVxdWFscyhtZXJnZWQudG9Tb3J0ZWQoKSwgWzEsIDIsIDMsIDQsIDVdKTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIE1lcmdlIDMgc3RyZWFtc1xuICogYGBgdHNcbiAqIGltcG9ydCB7IG1lcmdlUmVhZGFibGVTdHJlYW1zIH0gZnJvbSBcIkBzdGQvc3RyZWFtcy9tZXJnZS1yZWFkYWJsZS1zdHJlYW1zXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCBzdHJlYW0xID0gUmVhZGFibGVTdHJlYW0uZnJvbShbMSwgMl0pO1xuICogY29uc3Qgc3RyZWFtMiA9IFJlYWRhYmxlU3RyZWFtLmZyb20oWzMsIDQsIDVdKTtcbiAqIGNvbnN0IHN0cmVhbTMgPSBSZWFkYWJsZVN0cmVhbS5mcm9tKFs2XSk7XG4gKlxuICogY29uc3QgbWVyZ2VkU3RyZWFtID0gbWVyZ2VSZWFkYWJsZVN0cmVhbXMoc3RyZWFtMSwgc3RyZWFtMiwgc3RyZWFtMyk7XG4gKiBjb25zdCBtZXJnZWQgPSBhd2FpdCBBcnJheS5mcm9tQXN5bmMobWVyZ2VkU3RyZWFtKTtcbiAqIGFzc2VydEVxdWFscyhtZXJnZWQudG9Tb3J0ZWQoKSwgWzEsIDIsIDMsIDQsIDUsIDZdKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VSZWFkYWJsZVN0cmVhbXM8VD4oXG4gIC4uLnN0cmVhbXM6IFJlYWRhYmxlU3RyZWFtPFQ+W11cbik6IFJlYWRhYmxlU3RyZWFtPFQ+IHtcbiAgY29uc3QgcmVzb2x2ZVByb21pc2VzID0gc3RyZWFtcy5tYXAoKCkgPT4gUHJvbWlzZS53aXRoUmVzb2x2ZXJzPHZvaWQ+KCkpO1xuICByZXR1cm4gbmV3IFJlYWRhYmxlU3RyZWFtPFQ+KHtcbiAgICBzdGFydChjb250cm9sbGVyKSB7XG4gICAgICBsZXQgbXVzdENsb3NlID0gZmFsc2U7XG4gICAgICBQcm9taXNlLmFsbChyZXNvbHZlUHJvbWlzZXMubWFwKCh7IHByb21pc2UgfSkgPT4gcHJvbWlzZSkpXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICBjb250cm9sbGVyLmNsb3NlKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICBtdXN0Q2xvc2UgPSB0cnVlO1xuICAgICAgICAgIGNvbnRyb2xsZXIuZXJyb3IoZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICAgIGZvciAoY29uc3QgW2luZGV4LCBzdHJlYW1dIG9mIHN0cmVhbXMuZW50cmllcygpKSB7XG4gICAgICAgIChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZvciBhd2FpdCAoY29uc3QgZGF0YSBvZiBzdHJlYW0pIHtcbiAgICAgICAgICAgICAgaWYgKG11c3RDbG9zZSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc29sdmVQcm9taXNlc1tpbmRleF0hLnJlc29sdmUoKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgcmVzb2x2ZVByb21pc2VzW2luZGV4XSEucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKCk7XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBRXJEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW1DQyxHQUNELE9BQU8sU0FBUyxxQkFDZCxHQUFHLE9BQTRCO0VBRS9CLE1BQU0sa0JBQWtCLFFBQVEsR0FBRyxDQUFDLElBQU0sUUFBUSxhQUFhO0VBQy9ELE9BQU8sSUFBSSxlQUFrQjtJQUMzQixPQUFNLFVBQVU7TUFDZCxJQUFJLFlBQVk7TUFDaEIsUUFBUSxHQUFHLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLEdBQUssVUFDOUMsSUFBSSxDQUFDO1FBQ0osV0FBVyxLQUFLO01BQ2xCLEdBQ0MsS0FBSyxDQUFDLENBQUM7UUFDTixZQUFZO1FBQ1osV0FBVyxLQUFLLENBQUM7TUFDbkI7TUFDRixLQUFLLE1BQU0sQ0FBQyxPQUFPLE9BQU8sSUFBSSxRQUFRLE9BQU8sR0FBSTtRQUMvQyxDQUFDO1VBQ0MsSUFBSTtZQUNGLFdBQVcsTUFBTSxRQUFRLE9BQVE7Y0FDL0IsSUFBSSxXQUFXO2dCQUNiO2NBQ0Y7Y0FDQSxXQUFXLE9BQU8sQ0FBQztZQUNyQjtZQUNBLGVBQWUsQ0FBQyxNQUFNLENBQUUsT0FBTztVQUNqQyxFQUFFLE9BQU8sT0FBTztZQUNkLGVBQWUsQ0FBQyxNQUFNLENBQUUsTUFBTSxDQUFDO1VBQ2pDO1FBQ0YsQ0FBQztNQUNIO0lBQ0Y7RUFDRjtBQUNGIn0=
// denoCacheMetadata=5167536635992590894,6266638389806007921