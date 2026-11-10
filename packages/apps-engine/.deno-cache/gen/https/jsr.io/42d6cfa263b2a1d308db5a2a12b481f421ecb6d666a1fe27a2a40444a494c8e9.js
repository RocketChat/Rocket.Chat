// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { toText } from "./to_text.ts";
/**
 * Converts a
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON}-formatted
 * {@linkcode ReadableSteam} of strings or {@linkcode Uint8Array}s to an object.
 * Works the same as {@linkcode Response.json} and {@linkcode Request.json}, but
 * also extends to support streams of strings.
 *
 * @param stream A `ReadableStream` whose chunks compose a JSON.
 * @returns A promise that resolves to the parsed JSON.
 *
 * @example Usage with a stream of strings
 * ```ts
 * import { toJson } from "@std/streams/to-json";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([
 *   "[1, true",
 *   ', [], {}, "hello',
 *   '", null]',
 * ]);
 * assertEquals(await toJson(stream), [1, true, [], {}, "hello", null]);
 * ```
 *
 * @example Usage with a stream of `Uint8Array`s
 * ```ts
 * import { toJson } from "@std/streams/to-json";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([
 *   "[1, true",
 *   ', [], {}, "hello',
 *   '", null]',
 * ]).pipeThrough(new TextEncoderStream());
 * assertEquals(await toJson(stream), [1, true, [], {}, "hello", null]);
 * ```
 */ export function toJson(stream) {
  return toText(stream).then(JSON.parse);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvc3RyZWFtcy8xLjAuMTYvdG9fanNvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyB0b1RleHQgfSBmcm9tIFwiLi90b190ZXh0LnRzXCI7XG5cbi8qKlxuICogQ29udmVydHMgYVxuICoge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0pTT059LWZvcm1hdHRlZFxuICoge0BsaW5rY29kZSBSZWFkYWJsZVN0ZWFtfSBvZiBzdHJpbmdzIG9yIHtAbGlua2NvZGUgVWludDhBcnJheX1zIHRvIGFuIG9iamVjdC5cbiAqIFdvcmtzIHRoZSBzYW1lIGFzIHtAbGlua2NvZGUgUmVzcG9uc2UuanNvbn0gYW5kIHtAbGlua2NvZGUgUmVxdWVzdC5qc29ufSwgYnV0XG4gKiBhbHNvIGV4dGVuZHMgdG8gc3VwcG9ydCBzdHJlYW1zIG9mIHN0cmluZ3MuXG4gKlxuICogQHBhcmFtIHN0cmVhbSBBIGBSZWFkYWJsZVN0cmVhbWAgd2hvc2UgY2h1bmtzIGNvbXBvc2UgYSBKU09OLlxuICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIHBhcnNlZCBKU09OLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlIHdpdGggYSBzdHJlYW0gb2Ygc3RyaW5nc1xuICogYGBgdHNcbiAqIGltcG9ydCB7IHRvSnNvbiB9IGZyb20gXCJAc3RkL3N0cmVhbXMvdG8tanNvblwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3Qgc3RyZWFtID0gUmVhZGFibGVTdHJlYW0uZnJvbShbXG4gKiAgIFwiWzEsIHRydWVcIixcbiAqICAgJywgW10sIHt9LCBcImhlbGxvJyxcbiAqICAgJ1wiLCBudWxsXScsXG4gKiBdKTtcbiAqIGFzc2VydEVxdWFscyhhd2FpdCB0b0pzb24oc3RyZWFtKSwgWzEsIHRydWUsIFtdLCB7fSwgXCJoZWxsb1wiLCBudWxsXSk7XG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZSBVc2FnZSB3aXRoIGEgc3RyZWFtIG9mIGBVaW50OEFycmF5YHNcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB0b0pzb24gfSBmcm9tIFwiQHN0ZC9zdHJlYW1zL3RvLWpzb25cIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGNvbnN0IHN0cmVhbSA9IFJlYWRhYmxlU3RyZWFtLmZyb20oW1xuICogICBcIlsxLCB0cnVlXCIsXG4gKiAgICcsIFtdLCB7fSwgXCJoZWxsbycsXG4gKiAgICdcIiwgbnVsbF0nLFxuICogXSkucGlwZVRocm91Z2gobmV3IFRleHRFbmNvZGVyU3RyZWFtKCkpO1xuICogYXNzZXJ0RXF1YWxzKGF3YWl0IHRvSnNvbihzdHJlYW0pLCBbMSwgdHJ1ZSwgW10sIHt9LCBcImhlbGxvXCIsIG51bGxdKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9Kc29uKFxuICBzdHJlYW06IFJlYWRhYmxlU3RyZWFtPHN0cmluZz4gfCBSZWFkYWJsZVN0cmVhbTxVaW50OEFycmF5Pixcbik6IFByb21pc2U8dW5rbm93bj4ge1xuICByZXR1cm4gdG9UZXh0KHN0cmVhbSkudGhlbihKU09OLnBhcnNlKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBRXJDLFNBQVMsTUFBTSxRQUFRLGVBQWU7QUFFdEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBbUNDLEdBQ0QsT0FBTyxTQUFTLE9BQ2QsTUFBMkQ7RUFFM0QsT0FBTyxPQUFPLFFBQVEsSUFBSSxDQUFDLEtBQUssS0FBSztBQUN2QyJ9
// denoCacheMetadata=17555718251667968360,17157483311735290589