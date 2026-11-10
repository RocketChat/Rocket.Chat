// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
/**
 * Converts a {@linkcode ReadableStream} of {@linkcode Uint8Array}s to a
 * {@linkcode Blob}. Works the same as {@linkcode Response.blob}.
 *
 * @param stream A `ReadableStream` of `Uint8Array`s to convert into a `Blob`.
 * @returns A `Promise` that resolves to the `Blob`.
 *
 * @example Basic usage
 * ```ts
 * import { toBlob } from "@std/streams/to-blob";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([
 *   new Uint8Array([1, 2]),
 *   new Uint8Array([3, 4, 5]),
 * ]);
 * const blob = await toBlob(stream);
 * assertEquals(blob.size, 5);
 * ```
 */ export async function toBlob(stream) {
  return await new Response(stream).blob();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvc3RyZWFtcy8xLjAuMTYvdG9fYmxvYi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIENvbnZlcnRzIGEge0BsaW5rY29kZSBSZWFkYWJsZVN0cmVhbX0gb2Yge0BsaW5rY29kZSBVaW50OEFycmF5fXMgdG8gYVxuICoge0BsaW5rY29kZSBCbG9ifS4gV29ya3MgdGhlIHNhbWUgYXMge0BsaW5rY29kZSBSZXNwb25zZS5ibG9ifS5cbiAqXG4gKiBAcGFyYW0gc3RyZWFtIEEgYFJlYWRhYmxlU3RyZWFtYCBvZiBgVWludDhBcnJheWBzIHRvIGNvbnZlcnQgaW50byBhIGBCbG9iYC5cbiAqIEByZXR1cm5zIEEgYFByb21pc2VgIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIGBCbG9iYC5cbiAqXG4gKiBAZXhhbXBsZSBCYXNpYyB1c2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IHRvQmxvYiB9IGZyb20gXCJAc3RkL3N0cmVhbXMvdG8tYmxvYlwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3Qgc3RyZWFtID0gUmVhZGFibGVTdHJlYW0uZnJvbShbXG4gKiAgIG5ldyBVaW50OEFycmF5KFsxLCAyXSksXG4gKiAgIG5ldyBVaW50OEFycmF5KFszLCA0LCA1XSksXG4gKiBdKTtcbiAqIGNvbnN0IGJsb2IgPSBhd2FpdCB0b0Jsb2Ioc3RyZWFtKTtcbiAqIGFzc2VydEVxdWFscyhibG9iLnNpemUsIDUpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0b0Jsb2IoXG4gIHN0cmVhbTogUmVhZGFibGVTdHJlYW08VWludDhBcnJheT4sXG4pOiBQcm9taXNlPEJsb2I+IHtcbiAgcmV0dXJuIGF3YWl0IG5ldyBSZXNwb25zZShzdHJlYW0pLmJsb2IoKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBRXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBbUJDLEdBQ0QsT0FBTyxlQUFlLE9BQ3BCLE1BQWtDO0VBRWxDLE9BQU8sTUFBTSxJQUFJLFNBQVMsUUFBUSxJQUFJO0FBQ3hDIn0=
// denoCacheMetadata=4995499017682146407,8203574511129523589