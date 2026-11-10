// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
/**
 * Convert the generator function into a {@linkcode TransformStream}.
 *
 * @typeparam I The type of the chunks in the source stream.
 * @typeparam O The type of the chunks in the transformed stream.
 * @param transformer A function to transform.
 * @param writableStrategy An object that optionally defines a queuing strategy for the stream.
 * @param readableStrategy An object that optionally defines a queuing strategy for the stream.
 * @returns A {@linkcode TransformStream} that transforms the source stream as defined by the provided transformer.
 *
 * @example Build a transform stream that multiplies each value by 100
 * ```ts
 * import { toTransformStream } from "@std/streams/to-transform-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([0, 1, 2])
 *   .pipeThrough(toTransformStream(async function* (src) {
 *     for await (const chunk of src) {
 *       yield chunk * 100;
 *     }
 *   }));
 *
 * assertEquals(
 *   await Array.fromAsync(stream),
 *   [0, 100, 200],
 * );
 * ```
 *
 * @example JSON Lines
 * ```ts
 * import { TextLineStream } from "@std/streams/text-line-stream";
 * import { toTransformStream } from "@std/streams/to-transform-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([
 *   '{"name": "Alice", "age": ',
 *   '30}\n{"name": "Bob", "age"',
 *   ": 25}\n",
 * ]);
 *
 * type Person = { name: string; age: number };
 *
 * // Split the stream by newline and parse each line as a JSON object
 * const jsonStream = stream.pipeThrough(new TextLineStream())
 *   .pipeThrough(toTransformStream(async function* (src) {
 *     for await (const chunk of src) {
 *       if (chunk.trim().length === 0) {
 *         continue;
 *       }
 *       yield JSON.parse(chunk) as Person;
 *     }
 *   }));
 *
 * assertEquals(
 *   await Array.fromAsync(jsonStream),
 *   [{ "name": "Alice", "age": 30 }, { "name": "Bob", "age": 25 }],
 * );
 * ```
 */ // deno-lint-ignore deno-style-guide/exported-function-args-maximum
export function toTransformStream(transformer, writableStrategy, readableStrategy) {
  const { writable, readable } = new TransformStream(undefined, writableStrategy);
  const iterable = transformer(readable);
  const iterator = iterable[Symbol.asyncIterator]?.() ?? iterable[Symbol.iterator]?.();
  return {
    writable,
    readable: new ReadableStream({
      async pull (controller) {
        let result;
        try {
          result = await iterator.next();
        } catch (error) {
          // Propagate error to stream from iterator
          // If the stream status is "errored", it will be thrown, but ignore.
          await readable.cancel(error).catch(()=>{});
          controller.error(error);
          return;
        }
        if (result.done) {
          controller.close();
          return;
        }
        controller.enqueue(result.value);
      },
      async cancel (reason) {
        // Propagate cancellation to readable and iterator
        if (typeof iterator.throw === "function") {
          try {
            await iterator.throw(reason);
          } catch  {
          /* `iterator.throw()` always throws on site. We catch it. */ }
        }
        await readable.cancel(reason);
      }
    }, readableStrategy)
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvc3RyZWFtcy8xLjAuMTYvdG9fdHJhbnNmb3JtX3N0cmVhbS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIENvbnZlcnQgdGhlIGdlbmVyYXRvciBmdW5jdGlvbiBpbnRvIGEge0BsaW5rY29kZSBUcmFuc2Zvcm1TdHJlYW19LlxuICpcbiAqIEB0eXBlcGFyYW0gSSBUaGUgdHlwZSBvZiB0aGUgY2h1bmtzIGluIHRoZSBzb3VyY2Ugc3RyZWFtLlxuICogQHR5cGVwYXJhbSBPIFRoZSB0eXBlIG9mIHRoZSBjaHVua3MgaW4gdGhlIHRyYW5zZm9ybWVkIHN0cmVhbS5cbiAqIEBwYXJhbSB0cmFuc2Zvcm1lciBBIGZ1bmN0aW9uIHRvIHRyYW5zZm9ybS5cbiAqIEBwYXJhbSB3cml0YWJsZVN0cmF0ZWd5IEFuIG9iamVjdCB0aGF0IG9wdGlvbmFsbHkgZGVmaW5lcyBhIHF1ZXVpbmcgc3RyYXRlZ3kgZm9yIHRoZSBzdHJlYW0uXG4gKiBAcGFyYW0gcmVhZGFibGVTdHJhdGVneSBBbiBvYmplY3QgdGhhdCBvcHRpb25hbGx5IGRlZmluZXMgYSBxdWV1aW5nIHN0cmF0ZWd5IGZvciB0aGUgc3RyZWFtLlxuICogQHJldHVybnMgQSB7QGxpbmtjb2RlIFRyYW5zZm9ybVN0cmVhbX0gdGhhdCB0cmFuc2Zvcm1zIHRoZSBzb3VyY2Ugc3RyZWFtIGFzIGRlZmluZWQgYnkgdGhlIHByb3ZpZGVkIHRyYW5zZm9ybWVyLlxuICpcbiAqIEBleGFtcGxlIEJ1aWxkIGEgdHJhbnNmb3JtIHN0cmVhbSB0aGF0IG11bHRpcGxpZXMgZWFjaCB2YWx1ZSBieSAxMDBcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB0b1RyYW5zZm9ybVN0cmVhbSB9IGZyb20gXCJAc3RkL3N0cmVhbXMvdG8tdHJhbnNmb3JtLXN0cmVhbVwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3Qgc3RyZWFtID0gUmVhZGFibGVTdHJlYW0uZnJvbShbMCwgMSwgMl0pXG4gKiAgIC5waXBlVGhyb3VnaCh0b1RyYW5zZm9ybVN0cmVhbShhc3luYyBmdW5jdGlvbiogKHNyYykge1xuICogICAgIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2Ygc3JjKSB7XG4gKiAgICAgICB5aWVsZCBjaHVuayAqIDEwMDtcbiAqICAgICB9XG4gKiAgIH0pKTtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoXG4gKiAgIGF3YWl0IEFycmF5LmZyb21Bc3luYyhzdHJlYW0pLFxuICogICBbMCwgMTAwLCAyMDBdLFxuICogKTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIEpTT04gTGluZXNcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBUZXh0TGluZVN0cmVhbSB9IGZyb20gXCJAc3RkL3N0cmVhbXMvdGV4dC1saW5lLXN0cmVhbVwiO1xuICogaW1wb3J0IHsgdG9UcmFuc2Zvcm1TdHJlYW0gfSBmcm9tIFwiQHN0ZC9zdHJlYW1zL3RvLXRyYW5zZm9ybS1zdHJlYW1cIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGNvbnN0IHN0cmVhbSA9IFJlYWRhYmxlU3RyZWFtLmZyb20oW1xuICogICAne1wibmFtZVwiOiBcIkFsaWNlXCIsIFwiYWdlXCI6ICcsXG4gKiAgICczMH1cXG57XCJuYW1lXCI6IFwiQm9iXCIsIFwiYWdlXCInLFxuICogICBcIjogMjV9XFxuXCIsXG4gKiBdKTtcbiAqXG4gKiB0eXBlIFBlcnNvbiA9IHsgbmFtZTogc3RyaW5nOyBhZ2U6IG51bWJlciB9O1xuICpcbiAqIC8vIFNwbGl0IHRoZSBzdHJlYW0gYnkgbmV3bGluZSBhbmQgcGFyc2UgZWFjaCBsaW5lIGFzIGEgSlNPTiBvYmplY3RcbiAqIGNvbnN0IGpzb25TdHJlYW0gPSBzdHJlYW0ucGlwZVRocm91Z2gobmV3IFRleHRMaW5lU3RyZWFtKCkpXG4gKiAgIC5waXBlVGhyb3VnaCh0b1RyYW5zZm9ybVN0cmVhbShhc3luYyBmdW5jdGlvbiogKHNyYykge1xuICogICAgIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2Ygc3JjKSB7XG4gKiAgICAgICBpZiAoY2h1bmsudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICogICAgICAgICBjb250aW51ZTtcbiAqICAgICAgIH1cbiAqICAgICAgIHlpZWxkIEpTT04ucGFyc2UoY2h1bmspIGFzIFBlcnNvbjtcbiAqICAgICB9XG4gKiAgIH0pKTtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoXG4gKiAgIGF3YWl0IEFycmF5LmZyb21Bc3luYyhqc29uU3RyZWFtKSxcbiAqICAgW3sgXCJuYW1lXCI6IFwiQWxpY2VcIiwgXCJhZ2VcIjogMzAgfSwgeyBcIm5hbWVcIjogXCJCb2JcIiwgXCJhZ2VcIjogMjUgfV0sXG4gKiApO1xuICogYGBgXG4gKi9cbi8vIGRlbm8tbGludC1pZ25vcmUgZGVuby1zdHlsZS1ndWlkZS9leHBvcnRlZC1mdW5jdGlvbi1hcmdzLW1heGltdW1cbmV4cG9ydCBmdW5jdGlvbiB0b1RyYW5zZm9ybVN0cmVhbTxJLCBPPihcbiAgdHJhbnNmb3JtZXI6IChzcmM6IFJlYWRhYmxlU3RyZWFtPEk+KSA9PiBJdGVyYWJsZTxPPiB8IEFzeW5jSXRlcmFibGU8Tz4sXG4gIHdyaXRhYmxlU3RyYXRlZ3k/OiBRdWV1aW5nU3RyYXRlZ3k8ST4sXG4gIHJlYWRhYmxlU3RyYXRlZ3k/OiBRdWV1aW5nU3RyYXRlZ3k8Tz4sXG4pOiBUcmFuc2Zvcm1TdHJlYW08SSwgTz4ge1xuICBjb25zdCB7XG4gICAgd3JpdGFibGUsXG4gICAgcmVhZGFibGUsXG4gIH0gPSBuZXcgVHJhbnNmb3JtU3RyZWFtPEksIEk+KHVuZGVmaW5lZCwgd3JpdGFibGVTdHJhdGVneSk7XG5cbiAgY29uc3QgaXRlcmFibGUgPSB0cmFuc2Zvcm1lcihyZWFkYWJsZSk7XG4gIGNvbnN0IGl0ZXJhdG9yOiBJdGVyYXRvcjxPPiB8IEFzeW5jSXRlcmF0b3I8Tz4gPVxuICAgIChpdGVyYWJsZSBhcyBBc3luY0l0ZXJhYmxlPE8+KVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0/LigpID8/XG4gICAgICAoaXRlcmFibGUgYXMgSXRlcmFibGU8Tz4pW1N5bWJvbC5pdGVyYXRvcl0/LigpO1xuICByZXR1cm4ge1xuICAgIHdyaXRhYmxlLFxuICAgIHJlYWRhYmxlOiBuZXcgUmVhZGFibGVTdHJlYW08Tz4oe1xuICAgICAgYXN5bmMgcHVsbChjb250cm9sbGVyKSB7XG4gICAgICAgIGxldCByZXN1bHQ6IEl0ZXJhdG9yUmVzdWx0PE8+O1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAvLyBQcm9wYWdhdGUgZXJyb3IgdG8gc3RyZWFtIGZyb20gaXRlcmF0b3JcbiAgICAgICAgICAvLyBJZiB0aGUgc3RyZWFtIHN0YXR1cyBpcyBcImVycm9yZWRcIiwgaXQgd2lsbCBiZSB0aHJvd24sIGJ1dCBpZ25vcmUuXG4gICAgICAgICAgYXdhaXQgcmVhZGFibGUuY2FuY2VsKGVycm9yKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgY29udHJvbGxlci5lcnJvcihlcnJvcik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXN1bHQuZG9uZSkge1xuICAgICAgICAgIGNvbnRyb2xsZXIuY2xvc2UoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKHJlc3VsdC52YWx1ZSk7XG4gICAgICB9LFxuICAgICAgYXN5bmMgY2FuY2VsKHJlYXNvbikge1xuICAgICAgICAvLyBQcm9wYWdhdGUgY2FuY2VsbGF0aW9uIHRvIHJlYWRhYmxlIGFuZCBpdGVyYXRvclxuICAgICAgICBpZiAodHlwZW9mIGl0ZXJhdG9yLnRocm93ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgaXRlcmF0b3IudGhyb3cocmVhc29uKTtcbiAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIC8qIGBpdGVyYXRvci50aHJvdygpYCBhbHdheXMgdGhyb3dzIG9uIHNpdGUuIFdlIGNhdGNoIGl0LiAqL1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhd2FpdCByZWFkYWJsZS5jYW5jZWwocmVhc29uKTtcbiAgICAgIH0sXG4gICAgfSwgcmVhZGFibGVTdHJhdGVneSksXG4gIH07XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTBEQyxHQUNELG1FQUFtRTtBQUNuRSxPQUFPLFNBQVMsa0JBQ2QsV0FBdUUsRUFDdkUsZ0JBQXFDLEVBQ3JDLGdCQUFxQztFQUVyQyxNQUFNLEVBQ0osUUFBUSxFQUNSLFFBQVEsRUFDVCxHQUFHLElBQUksZ0JBQXNCLFdBQVc7RUFFekMsTUFBTSxXQUFXLFlBQVk7RUFDN0IsTUFBTSxXQUNKLEFBQUMsUUFBNkIsQ0FBQyxPQUFPLGFBQWEsQ0FBQyxRQUNsRCxBQUFDLFFBQXdCLENBQUMsT0FBTyxRQUFRLENBQUM7RUFDOUMsT0FBTztJQUNMO0lBQ0EsVUFBVSxJQUFJLGVBQWtCO01BQzlCLE1BQU0sTUFBSyxVQUFVO1FBQ25CLElBQUk7UUFDSixJQUFJO1VBQ0YsU0FBUyxNQUFNLFNBQVMsSUFBSTtRQUM5QixFQUFFLE9BQU8sT0FBTztVQUNkLDBDQUEwQztVQUMxQyxvRUFBb0U7VUFDcEUsTUFBTSxTQUFTLE1BQU0sQ0FBQyxPQUFPLEtBQUssQ0FBQyxLQUFPO1VBQzFDLFdBQVcsS0FBSyxDQUFDO1VBQ2pCO1FBQ0Y7UUFDQSxJQUFJLE9BQU8sSUFBSSxFQUFFO1VBQ2YsV0FBVyxLQUFLO1VBQ2hCO1FBQ0Y7UUFDQSxXQUFXLE9BQU8sQ0FBQyxPQUFPLEtBQUs7TUFDakM7TUFDQSxNQUFNLFFBQU8sTUFBTTtRQUNqQixrREFBa0Q7UUFDbEQsSUFBSSxPQUFPLFNBQVMsS0FBSyxLQUFLLFlBQVk7VUFDeEMsSUFBSTtZQUNGLE1BQU0sU0FBUyxLQUFLLENBQUM7VUFDdkIsRUFBRSxPQUFNO1VBQ04sMERBQTBELEdBQzVEO1FBQ0Y7UUFDQSxNQUFNLFNBQVMsTUFBTSxDQUFDO01BQ3hCO0lBQ0YsR0FBRztFQUNMO0FBQ0YifQ==
// denoCacheMetadata=7836987067785775868,11054750435610147582