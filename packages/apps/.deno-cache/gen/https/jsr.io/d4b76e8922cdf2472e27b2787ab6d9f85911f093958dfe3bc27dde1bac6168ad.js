// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
/**
 * Copy bytes from the source array to the destination array and returns the
 * number of bytes copied.
 *
 * If the source array is larger than what the `dst` array can hold, only the
 * amount of bytes that fit in the `dst` array are copied.
 *
 * @param src Source array to copy from.
 * @param dst Destination array to copy to.
 * @param offset Offset in the destination array to start copying to. Defaults
 * to 0.
 * @returns Number of bytes copied.
 *
 * @example Basic usage
 * ```ts
 * import { copy } from "@std/bytes/copy";
 * import { assertEquals } from "@std/assert";
 *
 * const src = new Uint8Array([9, 8, 7]);
 * const dst = new Uint8Array([0, 1, 2, 3, 4, 5]);
 *
 * assertEquals(copy(src, dst), 3);
 * assertEquals(dst, new Uint8Array([9, 8, 7, 3, 4, 5]));
 * ```
 *
 * @example Copy with offset
 * ```ts
 * import { copy } from "@std/bytes/copy";
 * import { assertEquals } from "@std/assert";
 *
 * const src = new Uint8Array([1, 1, 1, 1]);
 * const dst = new Uint8Array([0, 0, 0, 0]);
 *
 * assertEquals(copy(src, dst, 1), 3);
 * assertEquals(dst, new Uint8Array([0, 1, 1, 1]));
 * ```
 * Defining an offset will start copying at the specified index in the
 * destination array.
 */ export function copy(src, dst, offset = 0) {
  offset = Math.max(0, Math.min(offset, dst.byteLength));
  const dstBytesAvailable = dst.byteLength - offset;
  if (src.byteLength > dstBytesAvailable) {
    src = src.subarray(0, dstBytesAvailable);
  }
  dst.set(src, offset);
  return src.byteLength;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvYnl0ZXMvMS4wLjYvY29weS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKipcbiAqIENvcHkgYnl0ZXMgZnJvbSB0aGUgc291cmNlIGFycmF5IHRvIHRoZSBkZXN0aW5hdGlvbiBhcnJheSBhbmQgcmV0dXJucyB0aGVcbiAqIG51bWJlciBvZiBieXRlcyBjb3BpZWQuXG4gKlxuICogSWYgdGhlIHNvdXJjZSBhcnJheSBpcyBsYXJnZXIgdGhhbiB3aGF0IHRoZSBgZHN0YCBhcnJheSBjYW4gaG9sZCwgb25seSB0aGVcbiAqIGFtb3VudCBvZiBieXRlcyB0aGF0IGZpdCBpbiB0aGUgYGRzdGAgYXJyYXkgYXJlIGNvcGllZC5cbiAqXG4gKiBAcGFyYW0gc3JjIFNvdXJjZSBhcnJheSB0byBjb3B5IGZyb20uXG4gKiBAcGFyYW0gZHN0IERlc3RpbmF0aW9uIGFycmF5IHRvIGNvcHkgdG8uXG4gKiBAcGFyYW0gb2Zmc2V0IE9mZnNldCBpbiB0aGUgZGVzdGluYXRpb24gYXJyYXkgdG8gc3RhcnQgY29weWluZyB0by4gRGVmYXVsdHNcbiAqIHRvIDAuXG4gKiBAcmV0dXJucyBOdW1iZXIgb2YgYnl0ZXMgY29waWVkLlxuICpcbiAqIEBleGFtcGxlIEJhc2ljIHVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgY29weSB9IGZyb20gXCJAc3RkL2J5dGVzL2NvcHlcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGNvbnN0IHNyYyA9IG5ldyBVaW50OEFycmF5KFs5LCA4LCA3XSk7XG4gKiBjb25zdCBkc3QgPSBuZXcgVWludDhBcnJheShbMCwgMSwgMiwgMywgNCwgNV0pO1xuICpcbiAqIGFzc2VydEVxdWFscyhjb3B5KHNyYywgZHN0KSwgMyk7XG4gKiBhc3NlcnRFcXVhbHMoZHN0LCBuZXcgVWludDhBcnJheShbOSwgOCwgNywgMywgNCwgNV0pKTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIENvcHkgd2l0aCBvZmZzZXRcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBjb3B5IH0gZnJvbSBcIkBzdGQvYnl0ZXMvY29weVwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3Qgc3JjID0gbmV3IFVpbnQ4QXJyYXkoWzEsIDEsIDEsIDFdKTtcbiAqIGNvbnN0IGRzdCA9IG5ldyBVaW50OEFycmF5KFswLCAwLCAwLCAwXSk7XG4gKlxuICogYXNzZXJ0RXF1YWxzKGNvcHkoc3JjLCBkc3QsIDEpLCAzKTtcbiAqIGFzc2VydEVxdWFscyhkc3QsIG5ldyBVaW50OEFycmF5KFswLCAxLCAxLCAxXSkpO1xuICogYGBgXG4gKiBEZWZpbmluZyBhbiBvZmZzZXQgd2lsbCBzdGFydCBjb3B5aW5nIGF0IHRoZSBzcGVjaWZpZWQgaW5kZXggaW4gdGhlXG4gKiBkZXN0aW5hdGlvbiBhcnJheS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvcHkoc3JjOiBVaW50OEFycmF5LCBkc3Q6IFVpbnQ4QXJyYXksIG9mZnNldCA9IDApOiBudW1iZXIge1xuICBvZmZzZXQgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihvZmZzZXQsIGRzdC5ieXRlTGVuZ3RoKSk7XG4gIGNvbnN0IGRzdEJ5dGVzQXZhaWxhYmxlID0gZHN0LmJ5dGVMZW5ndGggLSBvZmZzZXQ7XG4gIGlmIChzcmMuYnl0ZUxlbmd0aCA+IGRzdEJ5dGVzQXZhaWxhYmxlKSB7XG4gICAgc3JjID0gc3JjLnN1YmFycmF5KDAsIGRzdEJ5dGVzQXZhaWxhYmxlKTtcbiAgfVxuICBkc3Quc2V0KHNyYywgb2Zmc2V0KTtcbiAgcmV0dXJuIHNyYy5ieXRlTGVuZ3RoO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBc0NDLEdBQ0QsT0FBTyxTQUFTLEtBQUssR0FBZSxFQUFFLEdBQWUsRUFBRSxTQUFTLENBQUM7RUFDL0QsU0FBUyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLFFBQVEsSUFBSSxVQUFVO0VBQ3BELE1BQU0sb0JBQW9CLElBQUksVUFBVSxHQUFHO0VBQzNDLElBQUksSUFBSSxVQUFVLEdBQUcsbUJBQW1CO0lBQ3RDLE1BQU0sSUFBSSxRQUFRLENBQUMsR0FBRztFQUN4QjtFQUNBLElBQUksR0FBRyxDQUFDLEtBQUs7RUFDYixPQUFPLElBQUksVUFBVTtBQUN2QiJ9
// denoCacheMetadata=17751190445216573841,6288497576967904983