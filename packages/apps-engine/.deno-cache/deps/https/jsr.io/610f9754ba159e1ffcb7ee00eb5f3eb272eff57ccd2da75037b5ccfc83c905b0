// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { DEFAULT_BUFFER_SIZE } from "./_constants.ts";
import { writeAll } from "./write_all.ts";
import type { Reader, Writer } from "./types.ts";

/**
 * Copies from `src` to `dst` until either EOF (`null`) is read from `src` or
 * an error occurs. It resolves to the number of bytes copied or rejects with
 * the first error encountered while copying.
 *
 * @example Usage
 * ```ts ignore
 * import { copy } from "@std/io/copy";
 *
 * const source = await Deno.open("my_file.txt");
 * const bytesCopied1 = await copy(source, Deno.stdout);
 * const destination = await Deno.create("my_file_2.txt");
 * const bytesCopied2 = await copy(source, destination);
 * ```
 *
 * @param src The source to copy from
 * @param dst The destination to copy to
 * @param options Can be used to tune size of the buffer. Default size is 32kB
 * @returns Number of bytes copied
 */
export async function copy(
  src: Reader,
  dst: Writer,
  options?: {
    bufSize?: number;
  },
): Promise<number> {
  let n = 0;
  const b = new Uint8Array(options?.bufSize ?? DEFAULT_BUFFER_SIZE);
  while (true) {
    const result = await src.read(b);
    if (result === null) break;
    await writeAll(dst, b.subarray(0, result));
    n += result;
  }
  return n;
}
