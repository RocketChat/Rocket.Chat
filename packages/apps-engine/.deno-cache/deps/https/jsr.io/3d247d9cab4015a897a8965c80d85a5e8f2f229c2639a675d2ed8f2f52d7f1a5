// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { Buffer } from "./buffer.ts";
import { writeAll } from "./write_all.ts";
import type { Reader } from "./types.ts";

/**
 * Create a {@linkcode Reader} from a {@linkcode ReadableStreamDefaultReader}.
 *
 * @example Usage
 * ```ts ignore
 * import { copy } from "@std/io/copy";
 * import { readerFromStreamReader } from "@std/io/reader-from-stream-reader";
 *
 * const res = await fetch("https://deno.land");
 *
 * const reader = readerFromStreamReader(res.body!.getReader());
 * await copy(reader, Deno.stdout);
 * ```
 *
 * @param streamReader The stream reader to read from
 * @returns The reader
 */
export function readerFromStreamReader(
  streamReader: ReadableStreamDefaultReader<Uint8Array>,
): Reader {
  const buffer = new Buffer();

  return {
    async read(p: Uint8Array): Promise<number | null> {
      if (buffer.empty()) {
        const res = await streamReader.read();
        if (res.done) {
          return null; // EOF
        }

        await writeAll(buffer, res.value);
      }

      return buffer.read(p);
    },
  };
}
