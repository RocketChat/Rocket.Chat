// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
/** Options for {@linkcode LimitedTransformStream} */ /**
 * A {@linkcode TransformStream} that will only read & enqueue `size` amount of
 * chunks.
 *
 * If `options.error` is set, then instead of terminating the stream,
 * a {@linkcode RangeError} will be thrown when the total number of enqueued
 * chunks is about to exceed the specified size.
 *
 * @typeparam T The type the chunks in the stream.
 *
 * @example `size` is equal to the total number of chunks
 * ```ts
 * import { LimitedTransformStream } from "@std/streams/limited-transform-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from(["1234", "5678"]);
 * const transformed = stream.pipeThrough(
 *   new LimitedTransformStream(2),
 * );
 *
 * // All chunks were read
 * assertEquals(
 *   await Array.fromAsync(transformed),
 *   ["1234", "5678"],
 * );
 * ```
 *
 * @example `size` is less than the total number of chunks
 * ```ts
 * import { LimitedTransformStream } from "@std/streams/limited-transform-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from(["1234", "5678"]);
 * const transformed = stream.pipeThrough(
 *   new LimitedTransformStream(1),
 * );
 *
 * // Only the first chunk was read
 * assertEquals(
 *   await Array.fromAsync(transformed),
 *   ["1234"],
 * );
 * ```
 *
 * @example Throw a {@linkcode RangeError} when the total number of chunks is
 * about to exceed the specified limit
 *
 * Do this by setting `options.error` to `true`.
 *
 * ```ts
 * import { LimitedTransformStream } from "@std/streams/limited-transform-stream";
 * import { assertRejects } from "@std/assert";
 *
 * const stream = ReadableStream.from(["1234", "5678"]);
 * const transformed = stream.pipeThrough(
 *   new LimitedTransformStream(1, { error: true }),
 * );
 *
 * await assertRejects(async () => {
 *   await Array.fromAsync(transformed);
 * }, RangeError);
 * ```
 */ export class LimitedTransformStream extends TransformStream {
  #read = 0;
  /**
   * Constructs a new instance.
   *
   * @param size The maximum number of chunks to read.
   * @param options Options for the stream.
   */ constructor(size, options = {
    error: false
  }){
    super({
      transform: (chunk, controller)=>{
        if (this.#read + 1 > size) {
          if (options.error) {
            throw new RangeError(`Exceeded chunk limit of '${size}'`);
          } else {
            controller.terminate();
          }
        } else {
          this.#read++;
          controller.enqueue(chunk);
        }
      }
    });
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvc3RyZWFtcy8xLjAuMTYvbGltaXRlZF90cmFuc2Zvcm1fc3RyZWFtLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKiBPcHRpb25zIGZvciB7QGxpbmtjb2RlIExpbWl0ZWRUcmFuc2Zvcm1TdHJlYW19ICovXG5leHBvcnQgaW50ZXJmYWNlIExpbWl0ZWRUcmFuc2Zvcm1TdHJlYW1PcHRpb25zIHtcbiAgLyoqXG4gICAqIElmIHRydWUsIGEge0BsaW5rY29kZSBSYW5nZUVycm9yfSBpcyB0aHJvd24gd2hlbiB0aGUgdG90YWwgbnVtYmVyIG9mXG4gICAqIGVucXVldWVkIGNodW5rcyBpcyBhYm91dCB0byBleGNlZWQgdGhlIHNwZWNpZmllZCBsaW1pdC5cbiAgICpcbiAgICogQGRlZmF1bHQge2ZhbHNlfVxuICAgKi9cbiAgZXJyb3I/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIEEge0BsaW5rY29kZSBUcmFuc2Zvcm1TdHJlYW19IHRoYXQgd2lsbCBvbmx5IHJlYWQgJiBlbnF1ZXVlIGBzaXplYCBhbW91bnQgb2ZcbiAqIGNodW5rcy5cbiAqXG4gKiBJZiBgb3B0aW9ucy5lcnJvcmAgaXMgc2V0LCB0aGVuIGluc3RlYWQgb2YgdGVybWluYXRpbmcgdGhlIHN0cmVhbSxcbiAqIGEge0BsaW5rY29kZSBSYW5nZUVycm9yfSB3aWxsIGJlIHRocm93biB3aGVuIHRoZSB0b3RhbCBudW1iZXIgb2YgZW5xdWV1ZWRcbiAqIGNodW5rcyBpcyBhYm91dCB0byBleGNlZWQgdGhlIHNwZWNpZmllZCBzaXplLlxuICpcbiAqIEB0eXBlcGFyYW0gVCBUaGUgdHlwZSB0aGUgY2h1bmtzIGluIHRoZSBzdHJlYW0uXG4gKlxuICogQGV4YW1wbGUgYHNpemVgIGlzIGVxdWFsIHRvIHRoZSB0b3RhbCBudW1iZXIgb2YgY2h1bmtzXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgTGltaXRlZFRyYW5zZm9ybVN0cmVhbSB9IGZyb20gXCJAc3RkL3N0cmVhbXMvbGltaXRlZC10cmFuc2Zvcm0tc3RyZWFtXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSBSZWFkYWJsZVN0cmVhbS5mcm9tKFtcIjEyMzRcIiwgXCI1Njc4XCJdKTtcbiAqIGNvbnN0IHRyYW5zZm9ybWVkID0gc3RyZWFtLnBpcGVUaHJvdWdoKFxuICogICBuZXcgTGltaXRlZFRyYW5zZm9ybVN0cmVhbSgyKSxcbiAqICk7XG4gKlxuICogLy8gQWxsIGNodW5rcyB3ZXJlIHJlYWRcbiAqIGFzc2VydEVxdWFscyhcbiAqICAgYXdhaXQgQXJyYXkuZnJvbUFzeW5jKHRyYW5zZm9ybWVkKSxcbiAqICAgW1wiMTIzNFwiLCBcIjU2NzhcIl0sXG4gKiApO1xuICogYGBgXG4gKlxuICogQGV4YW1wbGUgYHNpemVgIGlzIGxlc3MgdGhhbiB0aGUgdG90YWwgbnVtYmVyIG9mIGNodW5rc1xuICogYGBgdHNcbiAqIGltcG9ydCB7IExpbWl0ZWRUcmFuc2Zvcm1TdHJlYW0gfSBmcm9tIFwiQHN0ZC9zdHJlYW1zL2xpbWl0ZWQtdHJhbnNmb3JtLXN0cmVhbVwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3Qgc3RyZWFtID0gUmVhZGFibGVTdHJlYW0uZnJvbShbXCIxMjM0XCIsIFwiNTY3OFwiXSk7XG4gKiBjb25zdCB0cmFuc2Zvcm1lZCA9IHN0cmVhbS5waXBlVGhyb3VnaChcbiAqICAgbmV3IExpbWl0ZWRUcmFuc2Zvcm1TdHJlYW0oMSksXG4gKiApO1xuICpcbiAqIC8vIE9ubHkgdGhlIGZpcnN0IGNodW5rIHdhcyByZWFkXG4gKiBhc3NlcnRFcXVhbHMoXG4gKiAgIGF3YWl0IEFycmF5LmZyb21Bc3luYyh0cmFuc2Zvcm1lZCksXG4gKiAgIFtcIjEyMzRcIl0sXG4gKiApO1xuICogYGBgXG4gKlxuICogQGV4YW1wbGUgVGhyb3cgYSB7QGxpbmtjb2RlIFJhbmdlRXJyb3J9IHdoZW4gdGhlIHRvdGFsIG51bWJlciBvZiBjaHVua3MgaXNcbiAqIGFib3V0IHRvIGV4Y2VlZCB0aGUgc3BlY2lmaWVkIGxpbWl0XG4gKlxuICogRG8gdGhpcyBieSBzZXR0aW5nIGBvcHRpb25zLmVycm9yYCB0byBgdHJ1ZWAuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IExpbWl0ZWRUcmFuc2Zvcm1TdHJlYW0gfSBmcm9tIFwiQHN0ZC9zdHJlYW1zL2xpbWl0ZWQtdHJhbnNmb3JtLXN0cmVhbVwiO1xuICogaW1wb3J0IHsgYXNzZXJ0UmVqZWN0cyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGNvbnN0IHN0cmVhbSA9IFJlYWRhYmxlU3RyZWFtLmZyb20oW1wiMTIzNFwiLCBcIjU2NzhcIl0pO1xuICogY29uc3QgdHJhbnNmb3JtZWQgPSBzdHJlYW0ucGlwZVRocm91Z2goXG4gKiAgIG5ldyBMaW1pdGVkVHJhbnNmb3JtU3RyZWFtKDEsIHsgZXJyb3I6IHRydWUgfSksXG4gKiApO1xuICpcbiAqIGF3YWl0IGFzc2VydFJlamVjdHMoYXN5bmMgKCkgPT4ge1xuICogICBhd2FpdCBBcnJheS5mcm9tQXN5bmModHJhbnNmb3JtZWQpO1xuICogfSwgUmFuZ2VFcnJvcik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIExpbWl0ZWRUcmFuc2Zvcm1TdHJlYW08VD4gZXh0ZW5kcyBUcmFuc2Zvcm1TdHJlYW08VCwgVD4ge1xuICAjcmVhZCA9IDA7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdHMgYSBuZXcgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSBzaXplIFRoZSBtYXhpbXVtIG51bWJlciBvZiBjaHVua3MgdG8gcmVhZC5cbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyBmb3IgdGhlIHN0cmVhbS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHNpemU6IG51bWJlcixcbiAgICBvcHRpb25zOiBMaW1pdGVkVHJhbnNmb3JtU3RyZWFtT3B0aW9ucyA9IHsgZXJyb3I6IGZhbHNlIH0sXG4gICkge1xuICAgIHN1cGVyKHtcbiAgICAgIHRyYW5zZm9ybTogKGNodW5rLCBjb250cm9sbGVyKSA9PiB7XG4gICAgICAgIGlmICgodGhpcy4jcmVhZCArIDEpID4gc2l6ZSkge1xuICAgICAgICAgIGlmIChvcHRpb25zLmVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihgRXhjZWVkZWQgY2h1bmsgbGltaXQgb2YgJyR7c2l6ZX0nYCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnRyb2xsZXIudGVybWluYXRlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuI3JlYWQrKztcbiAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUoY2h1bmspO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUVyQyxtREFBbUQsR0FXbkQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBOERDLEdBQ0QsT0FBTyxNQUFNLCtCQUFrQztFQUM3QyxDQUFBLElBQUssR0FBRyxFQUFFO0VBRVY7Ozs7O0dBS0MsR0FDRCxZQUNFLElBQVksRUFDWixVQUF5QztJQUFFLE9BQU87RUFBTSxDQUFDLENBQ3pEO0lBQ0EsS0FBSyxDQUFDO01BQ0osV0FBVyxDQUFDLE9BQU87UUFDakIsSUFBSSxBQUFDLElBQUksQ0FBQyxDQUFBLElBQUssR0FBRyxJQUFLLE1BQU07VUFDM0IsSUFBSSxRQUFRLEtBQUssRUFBRTtZQUNqQixNQUFNLElBQUksV0FBVyxDQUFDLHlCQUF5QixFQUFFLEtBQUssQ0FBQyxDQUFDO1VBQzFELE9BQU87WUFDTCxXQUFXLFNBQVM7VUFDdEI7UUFDRixPQUFPO1VBQ0wsSUFBSSxDQUFDLENBQUEsSUFBSztVQUNWLFdBQVcsT0FBTyxDQUFDO1FBQ3JCO01BQ0Y7SUFDRjtFQUNGO0FBQ0YifQ==
// denoCacheMetadata=9281831081464770770,16353664809259972603