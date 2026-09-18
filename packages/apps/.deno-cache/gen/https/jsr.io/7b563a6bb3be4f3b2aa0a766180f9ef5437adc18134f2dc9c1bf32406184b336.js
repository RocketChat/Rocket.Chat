// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { DEFAULT_BUFFER_SIZE } from "./_constants.ts";
/**
 * Turns a {@linkcode Reader} into an async iterator.
 *
 * @example Usage
 * ```ts no-assert
 * import { iterateReader } from "@std/io/iterate-reader";
 *
 * using file = await Deno.open("README.md");
 * for await (const chunk of iterateReader(file)) {
 *   console.log(chunk);
 * }
 * ```
 *
 * @example Usage with buffer size
 * ```ts no-assert
 * import { iterateReader } from "@std/io/iterate-reader";
 *
 * using file = await Deno.open("README.md");
 * const iter = iterateReader(file, {
 *   bufSize: 1024 * 1024
 * });
 * for await (const chunk of iter) {
 *   console.log(chunk);
 * }
 * ```
 *
 * @param reader The reader to read from
 * @param options The options
 * @param options.bufSize The size of the buffer to use
 * @returns The async iterator of Uint8Array chunks
 */ export async function* iterateReader(reader, options) {
  const bufSize = options?.bufSize ?? DEFAULT_BUFFER_SIZE;
  const b = new Uint8Array(bufSize);
  while(true){
    const result = await reader.read(b);
    if (result === null) {
      break;
    }
    yield b.slice(0, result);
  }
}
/**
 * Turns a {@linkcode ReaderSync} into an iterator.
 *
 * @example Usage
 * ```ts
 * import { iterateReaderSync } from "@std/io/iterate-reader";
 * import { assert } from "@std/assert/assert"
 *
 * using file = Deno.openSync("README.md");
 * for (const chunk of iterateReaderSync(file)) {
 *   assert(chunk instanceof Uint8Array);
 * }
 * ```
 *
 * Second argument can be used to tune size of a buffer.
 * Default size of the buffer is 32kB.
 *
 * @example Usage with buffer size
 * ```ts
 * import { iterateReaderSync } from "@std/io/iterate-reader";
 * import { assert } from "@std/assert/assert"
 *
 * using file = await Deno.open("README.md");
 * const iter = iterateReaderSync(file, {
 *   bufSize: 1024 * 1024
 * });
 * for (const chunk of iter) {
 *   assert(chunk instanceof Uint8Array);
 * }
 * ```
 *
 * Iterator uses an internal buffer of fixed size for efficiency; it returns
 * a view on that buffer on each iteration. It is therefore caller's
 * responsibility to copy contents of the buffer if needed; otherwise the
 * next iteration will overwrite contents of previously returned chunk.
 *
 * @param reader The reader to read from
 * @param options The options
 * @returns The iterator of Uint8Array chunks
 */ export function* iterateReaderSync(reader, options) {
  const bufSize = options?.bufSize ?? DEFAULT_BUFFER_SIZE;
  const b = new Uint8Array(bufSize);
  while(true){
    const result = reader.readSync(b);
    if (result === null) {
      break;
    }
    yield b.slice(0, result);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvaW8vMC4yMjUuMy9pdGVyYXRlX3JlYWRlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI2IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBERUZBVUxUX0JVRkZFUl9TSVpFIH0gZnJvbSBcIi4vX2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHR5cGUgeyBSZWFkZXIsIFJlYWRlclN5bmMgfSBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG5leHBvcnQgdHlwZSB7IFJlYWRlciwgUmVhZGVyU3luYyB9O1xuXG4vKipcbiAqIFR1cm5zIGEge0BsaW5rY29kZSBSZWFkZXJ9IGludG8gYW4gYXN5bmMgaXRlcmF0b3IuXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIG5vLWFzc2VydFxuICogaW1wb3J0IHsgaXRlcmF0ZVJlYWRlciB9IGZyb20gXCJAc3RkL2lvL2l0ZXJhdGUtcmVhZGVyXCI7XG4gKlxuICogdXNpbmcgZmlsZSA9IGF3YWl0IERlbm8ub3BlbihcIlJFQURNRS5tZFwiKTtcbiAqIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2YgaXRlcmF0ZVJlYWRlcihmaWxlKSkge1xuICogICBjb25zb2xlLmxvZyhjaHVuayk7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZSBVc2FnZSB3aXRoIGJ1ZmZlciBzaXplXG4gKiBgYGB0cyBuby1hc3NlcnRcbiAqIGltcG9ydCB7IGl0ZXJhdGVSZWFkZXIgfSBmcm9tIFwiQHN0ZC9pby9pdGVyYXRlLXJlYWRlclwiO1xuICpcbiAqIHVzaW5nIGZpbGUgPSBhd2FpdCBEZW5vLm9wZW4oXCJSRUFETUUubWRcIik7XG4gKiBjb25zdCBpdGVyID0gaXRlcmF0ZVJlYWRlcihmaWxlLCB7XG4gKiAgIGJ1ZlNpemU6IDEwMjQgKiAxMDI0XG4gKiB9KTtcbiAqIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2YgaXRlcikge1xuICogICBjb25zb2xlLmxvZyhjaHVuayk7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gcmVhZGVyIFRoZSByZWFkZXIgdG8gcmVhZCBmcm9tXG4gKiBAcGFyYW0gb3B0aW9ucyBUaGUgb3B0aW9uc1xuICogQHBhcmFtIG9wdGlvbnMuYnVmU2l6ZSBUaGUgc2l6ZSBvZiB0aGUgYnVmZmVyIHRvIHVzZVxuICogQHJldHVybnMgVGhlIGFzeW5jIGl0ZXJhdG9yIG9mIFVpbnQ4QXJyYXkgY2h1bmtzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiogaXRlcmF0ZVJlYWRlcihcbiAgcmVhZGVyOiBSZWFkZXIsXG4gIG9wdGlvbnM/OiB7XG4gICAgYnVmU2l6ZT86IG51bWJlcjtcbiAgfSxcbik6IEFzeW5jSXRlcmFibGVJdGVyYXRvcjxVaW50OEFycmF5PiB7XG4gIGNvbnN0IGJ1ZlNpemUgPSBvcHRpb25zPy5idWZTaXplID8/IERFRkFVTFRfQlVGRkVSX1NJWkU7XG4gIGNvbnN0IGIgPSBuZXcgVWludDhBcnJheShidWZTaXplKTtcbiAgd2hpbGUgKHRydWUpIHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZWFkZXIucmVhZChiKTtcbiAgICBpZiAocmVzdWx0ID09PSBudWxsKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICB5aWVsZCBiLnNsaWNlKDAsIHJlc3VsdCk7XG4gIH1cbn1cblxuLyoqXG4gKiBUdXJucyBhIHtAbGlua2NvZGUgUmVhZGVyU3luY30gaW50byBhbiBpdGVyYXRvci5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGl0ZXJhdGVSZWFkZXJTeW5jIH0gZnJvbSBcIkBzdGQvaW8vaXRlcmF0ZS1yZWFkZXJcIjtcbiAqIGltcG9ydCB7IGFzc2VydCB9IGZyb20gXCJAc3RkL2Fzc2VydC9hc3NlcnRcIlxuICpcbiAqIHVzaW5nIGZpbGUgPSBEZW5vLm9wZW5TeW5jKFwiUkVBRE1FLm1kXCIpO1xuICogZm9yIChjb25zdCBjaHVuayBvZiBpdGVyYXRlUmVhZGVyU3luYyhmaWxlKSkge1xuICogICBhc3NlcnQoY2h1bmsgaW5zdGFuY2VvZiBVaW50OEFycmF5KTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIFNlY29uZCBhcmd1bWVudCBjYW4gYmUgdXNlZCB0byB0dW5lIHNpemUgb2YgYSBidWZmZXIuXG4gKiBEZWZhdWx0IHNpemUgb2YgdGhlIGJ1ZmZlciBpcyAzMmtCLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlIHdpdGggYnVmZmVyIHNpemVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBpdGVyYXRlUmVhZGVyU3luYyB9IGZyb20gXCJAc3RkL2lvL2l0ZXJhdGUtcmVhZGVyXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiQHN0ZC9hc3NlcnQvYXNzZXJ0XCJcbiAqXG4gKiB1c2luZyBmaWxlID0gYXdhaXQgRGVuby5vcGVuKFwiUkVBRE1FLm1kXCIpO1xuICogY29uc3QgaXRlciA9IGl0ZXJhdGVSZWFkZXJTeW5jKGZpbGUsIHtcbiAqICAgYnVmU2l6ZTogMTAyNCAqIDEwMjRcbiAqIH0pO1xuICogZm9yIChjb25zdCBjaHVuayBvZiBpdGVyKSB7XG4gKiAgIGFzc2VydChjaHVuayBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpO1xuICogfVxuICogYGBgXG4gKlxuICogSXRlcmF0b3IgdXNlcyBhbiBpbnRlcm5hbCBidWZmZXIgb2YgZml4ZWQgc2l6ZSBmb3IgZWZmaWNpZW5jeTsgaXQgcmV0dXJuc1xuICogYSB2aWV3IG9uIHRoYXQgYnVmZmVyIG9uIGVhY2ggaXRlcmF0aW9uLiBJdCBpcyB0aGVyZWZvcmUgY2FsbGVyJ3NcbiAqIHJlc3BvbnNpYmlsaXR5IHRvIGNvcHkgY29udGVudHMgb2YgdGhlIGJ1ZmZlciBpZiBuZWVkZWQ7IG90aGVyd2lzZSB0aGVcbiAqIG5leHQgaXRlcmF0aW9uIHdpbGwgb3ZlcndyaXRlIGNvbnRlbnRzIG9mIHByZXZpb3VzbHkgcmV0dXJuZWQgY2h1bmsuXG4gKlxuICogQHBhcmFtIHJlYWRlciBUaGUgcmVhZGVyIHRvIHJlYWQgZnJvbVxuICogQHBhcmFtIG9wdGlvbnMgVGhlIG9wdGlvbnNcbiAqIEByZXR1cm5zIFRoZSBpdGVyYXRvciBvZiBVaW50OEFycmF5IGNodW5rc1xuICovXG5leHBvcnQgZnVuY3Rpb24qIGl0ZXJhdGVSZWFkZXJTeW5jKFxuICByZWFkZXI6IFJlYWRlclN5bmMsXG4gIG9wdGlvbnM/OiB7XG4gICAgYnVmU2l6ZT86IG51bWJlcjtcbiAgfSxcbik6IEl0ZXJhYmxlSXRlcmF0b3I8VWludDhBcnJheT4ge1xuICBjb25zdCBidWZTaXplID0gb3B0aW9ucz8uYnVmU2l6ZSA/PyBERUZBVUxUX0JVRkZFUl9TSVpFO1xuICBjb25zdCBiID0gbmV3IFVpbnQ4QXJyYXkoYnVmU2l6ZSk7XG4gIHdoaWxlICh0cnVlKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gcmVhZGVyLnJlYWRTeW5jKGIpO1xuICAgIGlmIChyZXN1bHQgPT09IG51bGwpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHlpZWxkIGIuc2xpY2UoMCwgcmVzdWx0KTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFFckMsU0FBUyxtQkFBbUIsUUFBUSxrQkFBa0I7QUFLdEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQThCQyxHQUNELE9BQU8sZ0JBQWdCLGNBQ3JCLE1BQWMsRUFDZCxPQUVDO0VBRUQsTUFBTSxVQUFVLFNBQVMsV0FBVztFQUNwQyxNQUFNLElBQUksSUFBSSxXQUFXO0VBQ3pCLE1BQU8sS0FBTTtJQUNYLE1BQU0sU0FBUyxNQUFNLE9BQU8sSUFBSSxDQUFDO0lBQ2pDLElBQUksV0FBVyxNQUFNO01BQ25CO0lBQ0Y7SUFFQSxNQUFNLEVBQUUsS0FBSyxDQUFDLEdBQUc7RUFDbkI7QUFDRjtBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F1Q0MsR0FDRCxPQUFPLFVBQVUsa0JBQ2YsTUFBa0IsRUFDbEIsT0FFQztFQUVELE1BQU0sVUFBVSxTQUFTLFdBQVc7RUFDcEMsTUFBTSxJQUFJLElBQUksV0FBVztFQUN6QixNQUFPLEtBQU07SUFDWCxNQUFNLFNBQVMsT0FBTyxRQUFRLENBQUM7SUFDL0IsSUFBSSxXQUFXLE1BQU07TUFDbkI7SUFDRjtJQUVBLE1BQU0sRUFBRSxLQUFLLENBQUMsR0FBRztFQUNuQjtBQUNGIn0=
// denoCacheMetadata=24418520851167687,13786939575800061046