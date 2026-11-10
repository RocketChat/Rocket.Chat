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
 */
export function copy(src: Uint8Array, dst: Uint8Array, offset = 0): number {
  offset = Math.max(0, Math.min(offset, dst.byteLength));
  const dstBytesAvailable = dst.byteLength - offset;
  if (src.byteLength > dstBytesAvailable) {
    src = src.subarray(0, dstBytesAvailable);
  }
  dst.set(src, offset);
  return src.byteLength;
}
