// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
/** Options for {@linkcode LimitedBytesTransformStream}. */ /**
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
 */ export class LimitedBytesTransformStream extends TransformStream {
  #read = 0;
  /**
   * Constructs a new instance.
   *
   * @param size A size limit in bytes.
   * @param options Options for the stream.
   */ constructor(size, options = {
    error: false
  }){
    super({
      transform: (chunk, controller)=>{
        if (this.#read + chunk.byteLength > size) {
          if (options.error) {
            throw new RangeError(`Exceeded byte size limit of '${size}'`);
          } else {
            controller.terminate();
          }
        } else {
          this.#read += chunk.byteLength;
          controller.enqueue(chunk);
        }
      }
    });
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvc3RyZWFtcy8xLjAuMTYvbGltaXRlZF9ieXRlc190cmFuc2Zvcm1fc3RyZWFtLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKiBPcHRpb25zIGZvciB7QGxpbmtjb2RlIExpbWl0ZWRCeXRlc1RyYW5zZm9ybVN0cmVhbX0uICovXG5leHBvcnQgaW50ZXJmYWNlIExpbWl0ZWRCeXRlc1RyYW5zZm9ybVN0cmVhbU9wdGlvbnMge1xuICAvKipcbiAgICogSWYgdHJ1ZSwgYSB7QGxpbmtjb2RlIFJhbmdlRXJyb3J9IGlzIHRocm93biB3aGVuIHF1ZXVlaW5nIHRoZSBjdXJyZW50IGNodW5rXG4gICAqIHdvdWxkIGV4Y2VlZCB0aGUgc3BlY2lmaWVkIHNpemUgbGltaXQuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtmYWxzZX1cbiAgICovXG4gIGVycm9yPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBBIHtAbGlua2NvZGUgVHJhbnNmb3JtU3RyZWFtfSB0aGF0IHdpbGwgb25seSByZWFkICYgZW5xdWV1ZSBjaHVua3MgdW50aWwgdGhlXG4gKiB0b3RhbCBhbW91bnQgb2YgZW5xdWV1ZWQgZGF0YSBleGNlZWRzIGBzaXplYC4gVGhlIGxhc3QgY2h1bmsgdGhhdCB3b3VsZFxuICogZXhjZWVkIHRoZSBsaW1pdCB3aWxsIE5PVCBiZSBlbnF1ZXVlZCwgaW4gd2hpY2ggY2FzZSBhIHtAbGlua2NvZGUgUmFuZ2VFcnJvcn1cbiAqIGlzIHRocm93biB3aGVuIGBvcHRpb25zLmVycm9yYCBpcyBzZXQgdG8gdHJ1ZSwgb3RoZXJ3aXNlIHRoZSBzdHJlYW0gaXMganVzdFxuICogdGVybWluYXRlZC5cbiAqXG4gKiBAZXhhbXBsZSBgc2l6ZWAgaXMgZXF1YWwgdG8gdGhlIHRvdGFsIGJ5dGUgbGVuZ3RoIG9mIHRoZSBjaHVua3NcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBMaW1pdGVkQnl0ZXNUcmFuc2Zvcm1TdHJlYW0gfSBmcm9tIFwiQHN0ZC9zdHJlYW1zL2xpbWl0ZWQtYnl0ZXMtdHJhbnNmb3JtLXN0cmVhbVwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3Qgc3RyZWFtID0gUmVhZGFibGVTdHJlYW0uZnJvbShbXCIxMjM0XCIsIFwiNTY3OFwiXSk7XG4gKiBjb25zdCB0cmFuc2Zvcm1lZCA9IHN0cmVhbS5waXBlVGhyb3VnaChuZXcgVGV4dEVuY29kZXJTdHJlYW0oKSkucGlwZVRocm91Z2goXG4gKiAgIG5ldyBMaW1pdGVkQnl0ZXNUcmFuc2Zvcm1TdHJlYW0oOCksXG4gKiApLnBpcGVUaHJvdWdoKG5ldyBUZXh0RGVjb2RlclN0cmVhbSgpKTtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoXG4gKiAgIGF3YWl0IEFycmF5LmZyb21Bc3luYyh0cmFuc2Zvcm1lZCksXG4gKiAgIFtcIjEyMzRcIiwgXCI1Njc4XCJdLFxuICogKTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIGBzaXplYCBpcyBsZXNzIHRoYW4gdGhlIHRvdGFsIGJ5dGUgbGVuZ3RoIG9mIHRoZSBjaHVua3MsIGFuZCBhdCB0aGVcbiAqIGJvdW5kYXJ5IG9mIHRoZSBjaHVua3NcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBMaW1pdGVkQnl0ZXNUcmFuc2Zvcm1TdHJlYW0gfSBmcm9tIFwiQHN0ZC9zdHJlYW1zL2xpbWl0ZWQtYnl0ZXMtdHJhbnNmb3JtLXN0cmVhbVwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3Qgc3RyZWFtID0gUmVhZGFibGVTdHJlYW0uZnJvbShbXCIxMjM0XCIsIFwiNTY3OFwiXSk7XG4gKiBjb25zdCB0cmFuc2Zvcm1lZCA9IHN0cmVhbS5waXBlVGhyb3VnaChuZXcgVGV4dEVuY29kZXJTdHJlYW0oKSkucGlwZVRocm91Z2goXG4gKiAgIC8vIGA0YCBpcyB0aGUgYm91bmRhcnkgb2YgdGhlIGNodW5rc1xuICogICBuZXcgTGltaXRlZEJ5dGVzVHJhbnNmb3JtU3RyZWFtKDQpLFxuICogKS5waXBlVGhyb3VnaChuZXcgVGV4dERlY29kZXJTdHJlYW0oKSk7XG4gKlxuICogYXNzZXJ0RXF1YWxzKFxuICogICBhd2FpdCBBcnJheS5mcm9tQXN5bmModHJhbnNmb3JtZWQpLFxuICogICAvLyBUaGUgZmlyc3QgY2h1bmsgd2FzIHJlYWQsIGJ1dCB0aGUgc2Vjb25kIGNodW5rIHdhcyBub3RcbiAqICAgW1wiMTIzNFwiXSxcbiAqICk7XG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZSBgc2l6ZWAgaXMgbGVzcyB0aGFuIHRoZSB0b3RhbCBieXRlIGxlbmd0aCBvZiB0aGUgY2h1bmtzLCBhbmQgbm90IGF0XG4gKiB0aGUgYm91bmRhcnkgb2YgdGhlIGNodW5rc1xuICogYGBgdHNcbiAqIGltcG9ydCB7IExpbWl0ZWRCeXRlc1RyYW5zZm9ybVN0cmVhbSB9IGZyb20gXCJAc3RkL3N0cmVhbXMvbGltaXRlZC1ieXRlcy10cmFuc2Zvcm0tc3RyZWFtXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSBSZWFkYWJsZVN0cmVhbS5mcm9tKFtcIjEyMzRcIiwgXCI1Njc4XCJdKTtcbiAqIGNvbnN0IHRyYW5zZm9ybWVkID0gc3RyZWFtLnBpcGVUaHJvdWdoKG5ldyBUZXh0RW5jb2RlclN0cmVhbSgpKS5waXBlVGhyb3VnaChcbiAqICAgLy8gYDVgIGlzIG5vdCB0aGUgYm91bmRhcnkgb2YgdGhlIGNodW5rc1xuICogICBuZXcgTGltaXRlZEJ5dGVzVHJhbnNmb3JtU3RyZWFtKDUpLFxuICogKS5waXBlVGhyb3VnaChuZXcgVGV4dERlY29kZXJTdHJlYW0oKSk7XG4gKlxuICogYXNzZXJ0RXF1YWxzKFxuICogICBhd2FpdCBBcnJheS5mcm9tQXN5bmModHJhbnNmb3JtZWQpLFxuICogICAvLyBUaGUgc2Vjb25kIGNodW5rIHdhcyBub3QgcmVhZCBiZWNhdXNlIGl0IHdvdWxkIGV4Y2VlZCB0aGUgc3BlY2lmaWVkIHNpemVcbiAqICAgW1wiMTIzNFwiXSxcbiAqICk7XG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZSBUaHJvdyBlcnJvciB3aGVuIHRoZSB0b3RhbCBieXRlIGxlbmd0aCBvZiB0aGUgY2h1bmtzIGV4Y2VlZHMgdGhlXG4gKiBzcGVjaWZpZWQgc2l6ZVxuICpcbiAqIFRvIGRvIHNvLCBzZXQgYG9wdGlvbnMuZXJyb3JgIHRvIGB0cnVlYC5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgTGltaXRlZEJ5dGVzVHJhbnNmb3JtU3RyZWFtIH0gZnJvbSBcIkBzdGQvc3RyZWFtcy9saW1pdGVkLWJ5dGVzLXRyYW5zZm9ybS1zdHJlYW1cIjtcbiAqIGltcG9ydCB7IGFzc2VydFJlamVjdHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSBSZWFkYWJsZVN0cmVhbS5mcm9tKFtcIjEyMzRcIiwgXCI1Njc4XCJdKTtcbiAqIGNvbnN0IHRyYW5zZm9ybWVkID0gc3RyZWFtLnBpcGVUaHJvdWdoKG5ldyBUZXh0RW5jb2RlclN0cmVhbSgpKS5waXBlVGhyb3VnaChcbiAqICAgbmV3IExpbWl0ZWRCeXRlc1RyYW5zZm9ybVN0cmVhbSg1LCB7IGVycm9yOiB0cnVlIH0pLFxuICogKS5waXBlVGhyb3VnaChuZXcgVGV4dERlY29kZXJTdHJlYW0oKSk7XG4gKlxuICogYXdhaXQgYXNzZXJ0UmVqZWN0cyhhc3luYyAoKSA9PiB7XG4gKiAgIGF3YWl0IEFycmF5LmZyb21Bc3luYyh0cmFuc2Zvcm1lZCk7XG4gKiB9LCBSYW5nZUVycm9yKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgTGltaXRlZEJ5dGVzVHJhbnNmb3JtU3RyZWFtXG4gIGV4dGVuZHMgVHJhbnNmb3JtU3RyZWFtPFVpbnQ4QXJyYXksIFVpbnQ4QXJyYXk+IHtcbiAgI3JlYWQgPSAwO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RzIGEgbmV3IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gc2l6ZSBBIHNpemUgbGltaXQgaW4gYnl0ZXMuXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgZm9yIHRoZSBzdHJlYW0uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBzaXplOiBudW1iZXIsXG4gICAgb3B0aW9uczogTGltaXRlZEJ5dGVzVHJhbnNmb3JtU3RyZWFtT3B0aW9ucyA9IHsgZXJyb3I6IGZhbHNlIH0sXG4gICkge1xuICAgIHN1cGVyKHtcbiAgICAgIHRyYW5zZm9ybTogKGNodW5rLCBjb250cm9sbGVyKSA9PiB7XG4gICAgICAgIGlmICgodGhpcy4jcmVhZCArIGNodW5rLmJ5dGVMZW5ndGgpID4gc2l6ZSkge1xuICAgICAgICAgIGlmIChvcHRpb25zLmVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihgRXhjZWVkZWQgYnl0ZSBzaXplIGxpbWl0IG9mICcke3NpemV9J2ApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250cm9sbGVyLnRlcm1pbmF0ZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLiNyZWFkICs9IGNodW5rLmJ5dGVMZW5ndGg7XG4gICAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKGNodW5rKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFFckMseURBQXlELEdBV3pEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBK0VDLEdBQ0QsT0FBTyxNQUFNLG9DQUNIO0VBQ1IsQ0FBQSxJQUFLLEdBQUcsRUFBRTtFQUVWOzs7OztHQUtDLEdBQ0QsWUFDRSxJQUFZLEVBQ1osVUFBOEM7SUFBRSxPQUFPO0VBQU0sQ0FBQyxDQUM5RDtJQUNBLEtBQUssQ0FBQztNQUNKLFdBQVcsQ0FBQyxPQUFPO1FBQ2pCLElBQUksQUFBQyxJQUFJLENBQUMsQ0FBQSxJQUFLLEdBQUcsTUFBTSxVQUFVLEdBQUksTUFBTTtVQUMxQyxJQUFJLFFBQVEsS0FBSyxFQUFFO1lBQ2pCLE1BQU0sSUFBSSxXQUFXLENBQUMsNkJBQTZCLEVBQUUsS0FBSyxDQUFDLENBQUM7VUFDOUQsT0FBTztZQUNMLFdBQVcsU0FBUztVQUN0QjtRQUNGLE9BQU87VUFDTCxJQUFJLENBQUMsQ0FBQSxJQUFLLElBQUksTUFBTSxVQUFVO1VBQzlCLFdBQVcsT0FBTyxDQUFDO1FBQ3JCO01BQ0Y7SUFDRjtFQUNGO0FBQ0YifQ==
// denoCacheMetadata=9987766040329373042,16211959475989217229