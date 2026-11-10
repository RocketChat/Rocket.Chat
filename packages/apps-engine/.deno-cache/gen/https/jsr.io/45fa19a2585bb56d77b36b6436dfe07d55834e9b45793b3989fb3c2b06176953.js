// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
/**
 * Converts a {@linkcode ReadableSteam} of strings or {@linkcode Uint8Array}s
 * to a single string. Works the same as {@linkcode Response.text} and
 * {@linkcode Request.text}, but also extends to support streams of strings.
 *
 * @param stream A `ReadableStream` to convert into a `string`.
 * @returns A `Promise` that resolves to the `string`.
 *
 * @example Basic usage with a stream of strings
 * ```ts
 * import { toText } from "@std/streams/to-text";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from(["Hello, ", "world!"]);
 * assertEquals(await toText(stream), "Hello, world!");
 * ```
 *
 * @example Basic usage with a stream of `Uint8Array`s
 * ```ts
 * import { toText } from "@std/streams/to-text";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from(["Hello, ", "world!"])
 *   .pipeThrough(new TextEncoderStream());
 * assertEquals(await toText(stream), "Hello, world!");
 * ```
 */ export async function toText(stream) {
  const textDecoder = new TextDecoder();
  const reader = stream.getReader();
  let result = "";
  while(true){
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    result += typeof value === "string" ? value : textDecoder.decode(value, {
      stream: true
    });
  }
  result += textDecoder.decode();
  return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvc3RyZWFtcy8xLjAuMTYvdG9fdGV4dC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIENvbnZlcnRzIGEge0BsaW5rY29kZSBSZWFkYWJsZVN0ZWFtfSBvZiBzdHJpbmdzIG9yIHtAbGlua2NvZGUgVWludDhBcnJheX1zXG4gKiB0byBhIHNpbmdsZSBzdHJpbmcuIFdvcmtzIHRoZSBzYW1lIGFzIHtAbGlua2NvZGUgUmVzcG9uc2UudGV4dH0gYW5kXG4gKiB7QGxpbmtjb2RlIFJlcXVlc3QudGV4dH0sIGJ1dCBhbHNvIGV4dGVuZHMgdG8gc3VwcG9ydCBzdHJlYW1zIG9mIHN0cmluZ3MuXG4gKlxuICogQHBhcmFtIHN0cmVhbSBBIGBSZWFkYWJsZVN0cmVhbWAgdG8gY29udmVydCBpbnRvIGEgYHN0cmluZ2AuXG4gKiBAcmV0dXJucyBBIGBQcm9taXNlYCB0aGF0IHJlc29sdmVzIHRvIHRoZSBgc3RyaW5nYC5cbiAqXG4gKiBAZXhhbXBsZSBCYXNpYyB1c2FnZSB3aXRoIGEgc3RyZWFtIG9mIHN0cmluZ3NcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB0b1RleHQgfSBmcm9tIFwiQHN0ZC9zdHJlYW1zL3RvLXRleHRcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGNvbnN0IHN0cmVhbSA9IFJlYWRhYmxlU3RyZWFtLmZyb20oW1wiSGVsbG8sIFwiLCBcIndvcmxkIVwiXSk7XG4gKiBhc3NlcnRFcXVhbHMoYXdhaXQgdG9UZXh0KHN0cmVhbSksIFwiSGVsbG8sIHdvcmxkIVwiKTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIEJhc2ljIHVzYWdlIHdpdGggYSBzdHJlYW0gb2YgYFVpbnQ4QXJyYXlgc1xuICogYGBgdHNcbiAqIGltcG9ydCB7IHRvVGV4dCB9IGZyb20gXCJAc3RkL3N0cmVhbXMvdG8tdGV4dFwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3Qgc3RyZWFtID0gUmVhZGFibGVTdHJlYW0uZnJvbShbXCJIZWxsbywgXCIsIFwid29ybGQhXCJdKVxuICogICAucGlwZVRocm91Z2gobmV3IFRleHRFbmNvZGVyU3RyZWFtKCkpO1xuICogYXNzZXJ0RXF1YWxzKGF3YWl0IHRvVGV4dChzdHJlYW0pLCBcIkhlbGxvLCB3b3JsZCFcIik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRvVGV4dChcbiAgc3RyZWFtOiBSZWFkYWJsZVN0cmVhbTxzdHJpbmc+IHwgUmVhZGFibGVTdHJlYW08VWludDhBcnJheT4sXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCB0ZXh0RGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigpO1xuICBjb25zdCByZWFkZXIgPSBzdHJlYW0uZ2V0UmVhZGVyKCk7XG4gIGxldCByZXN1bHQgPSBcIlwiO1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgY29uc3QgeyBkb25lLCB2YWx1ZSB9ID0gYXdhaXQgcmVhZGVyLnJlYWQoKTtcblxuICAgIGlmIChkb25lKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICByZXN1bHQgKz0gdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiXG4gICAgICA/IHZhbHVlXG4gICAgICA6IHRleHREZWNvZGVyLmRlY29kZSh2YWx1ZSwgeyBzdHJlYW06IHRydWUgfSk7XG4gIH1cbiAgcmVzdWx0ICs9IHRleHREZWNvZGVyLmRlY29kZSgpO1xuICByZXR1cm4gcmVzdWx0O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBMEJDLEdBQ0QsT0FBTyxlQUFlLE9BQ3BCLE1BQTJEO0VBRTNELE1BQU0sY0FBYyxJQUFJO0VBQ3hCLE1BQU0sU0FBUyxPQUFPLFNBQVM7RUFDL0IsSUFBSSxTQUFTO0VBRWIsTUFBTyxLQUFNO0lBQ1gsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxNQUFNLE9BQU8sSUFBSTtJQUV6QyxJQUFJLE1BQU07TUFDUjtJQUNGO0lBRUEsVUFBVSxPQUFPLFVBQVUsV0FDdkIsUUFDQSxZQUFZLE1BQU0sQ0FBQyxPQUFPO01BQUUsUUFBUTtJQUFLO0VBQy9DO0VBQ0EsVUFBVSxZQUFZLE1BQU07RUFDNUIsT0FBTztBQUNUIn0=
// denoCacheMetadata=3644793562765507648,12552937295274001464