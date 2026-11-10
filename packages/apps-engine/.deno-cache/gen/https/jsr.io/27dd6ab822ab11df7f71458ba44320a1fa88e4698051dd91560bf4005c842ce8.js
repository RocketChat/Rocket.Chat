// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { concat } from "jsr:@std/bytes@^1.0.6/concat";
/**
 * Converts a {@linkcode ReadableStream} of {@linkcode Uint8Array}s to an
 * {@linkcode ArrayBuffer}. Works the same as {@linkcode Response.arrayBuffer}.
 *
 * @param readableStream A `ReadableStream` of `Uint8Array`s to convert into an `ArrayBuffer`.
 * @returns A promise that resolves with the `ArrayBuffer` containing all the data from the stream.
 *
 * @example Basic usage
 * ```ts
 * import { toArrayBuffer } from "@std/streams/to-array-buffer";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([
 *   new Uint8Array([1, 2]),
 *   new Uint8Array([3, 4, 5]),
 * ]);
 * const buf = await toArrayBuffer(stream);
 * assertEquals(buf.byteLength, 5);
 * ```
 */ export async function toArrayBuffer(readableStream) {
  const reader = readableStream.getReader();
  const chunks = [];
  while(true){
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
  }
  return concat(chunks).buffer;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvc3RyZWFtcy8xLjAuMTYvdG9fYXJyYXlfYnVmZmVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGNvbmNhdCB9IGZyb20gXCJqc3I6QHN0ZC9ieXRlc0BeMS4wLjYvY29uY2F0XCI7XG5cbi8qKlxuICogQ29udmVydHMgYSB7QGxpbmtjb2RlIFJlYWRhYmxlU3RyZWFtfSBvZiB7QGxpbmtjb2RlIFVpbnQ4QXJyYXl9cyB0byBhblxuICoge0BsaW5rY29kZSBBcnJheUJ1ZmZlcn0uIFdvcmtzIHRoZSBzYW1lIGFzIHtAbGlua2NvZGUgUmVzcG9uc2UuYXJyYXlCdWZmZXJ9LlxuICpcbiAqIEBwYXJhbSByZWFkYWJsZVN0cmVhbSBBIGBSZWFkYWJsZVN0cmVhbWAgb2YgYFVpbnQ4QXJyYXlgcyB0byBjb252ZXJ0IGludG8gYW4gYEFycmF5QnVmZmVyYC5cbiAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIGBBcnJheUJ1ZmZlcmAgY29udGFpbmluZyBhbGwgdGhlIGRhdGEgZnJvbSB0aGUgc3RyZWFtLlxuICpcbiAqIEBleGFtcGxlIEJhc2ljIHVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgdG9BcnJheUJ1ZmZlciB9IGZyb20gXCJAc3RkL3N0cmVhbXMvdG8tYXJyYXktYnVmZmVyXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSBSZWFkYWJsZVN0cmVhbS5mcm9tKFtcbiAqICAgbmV3IFVpbnQ4QXJyYXkoWzEsIDJdKSxcbiAqICAgbmV3IFVpbnQ4QXJyYXkoWzMsIDQsIDVdKSxcbiAqIF0pO1xuICogY29uc3QgYnVmID0gYXdhaXQgdG9BcnJheUJ1ZmZlcihzdHJlYW0pO1xuICogYXNzZXJ0RXF1YWxzKGJ1Zi5ieXRlTGVuZ3RoLCA1KTtcbiAqIGBgYFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdG9BcnJheUJ1ZmZlcihcbiAgcmVhZGFibGVTdHJlYW06IFJlYWRhYmxlU3RyZWFtPFVpbnQ4QXJyYXk+LFxuKTogUHJvbWlzZTxBcnJheUJ1ZmZlcj4ge1xuICBjb25zdCByZWFkZXIgPSByZWFkYWJsZVN0cmVhbS5nZXRSZWFkZXIoKTtcbiAgY29uc3QgY2h1bmtzOiBVaW50OEFycmF5W10gPSBbXTtcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIGNvbnN0IHsgZG9uZSwgdmFsdWUgfSA9IGF3YWl0IHJlYWRlci5yZWFkKCk7XG5cbiAgICBpZiAoZG9uZSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY2h1bmtzLnB1c2godmFsdWUpO1xuICB9XG5cbiAgcmV0dXJuIGNvbmNhdChjaHVua3MpLmJ1ZmZlciBhcyBBcnJheUJ1ZmZlcjtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBRXJDLFNBQVMsTUFBTSxRQUFRLCtCQUErQjtBQUV0RDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW1CQyxHQUNELE9BQU8sZUFBZSxjQUNwQixjQUEwQztFQUUxQyxNQUFNLFNBQVMsZUFBZSxTQUFTO0VBQ3ZDLE1BQU0sU0FBdUIsRUFBRTtFQUUvQixNQUFPLEtBQU07SUFDWCxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLE1BQU0sT0FBTyxJQUFJO0lBRXpDLElBQUksTUFBTTtNQUNSO0lBQ0Y7SUFFQSxPQUFPLElBQUksQ0FBQztFQUNkO0VBRUEsT0FBTyxPQUFPLFFBQVEsTUFBTTtBQUM5QiJ9
// denoCacheMetadata=14321242256120628591,8658656616628647257