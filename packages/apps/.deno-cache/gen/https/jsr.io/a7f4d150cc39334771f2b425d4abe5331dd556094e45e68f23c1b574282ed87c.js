// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { DEFAULT_CHUNK_SIZE } from "./_constants.ts";
import { isCloser } from "./_common.ts";
/**
 * Create a {@linkcode ReadableStream} of {@linkcode Uint8Array}s from a
 * {@linkcode Reader}.
 *
 * When the pull algorithm is called on the stream, a chunk from the reader
 * will be read.  When `null` is returned from the reader, the stream will be
 * closed along with the reader (if it is also a `Closer`).
 *
 * @example Usage
 * ```ts no-assert
 * import { toReadableStream } from "@std/io/to-readable-stream";
 *
 * using file = await Deno.open("./README.md", { read: true });
 * const fileStream = toReadableStream(file);
 * ```
 *
 * @param reader The reader to read from
 * @param options The options
 * @returns The readable stream
 */ export function toReadableStream(reader, options) {
  const { autoClose = true, chunkSize = DEFAULT_CHUNK_SIZE, strategy } = options ?? {};
  return new ReadableStream({
    async pull (controller) {
      const chunk = new Uint8Array(chunkSize);
      try {
        const read = await reader.read(chunk);
        if (read === null) {
          if (isCloser(reader) && autoClose) {
            reader.close();
          }
          controller.close();
          return;
        }
        controller.enqueue(chunk.subarray(0, read));
      } catch (e) {
        controller.error(e);
        if (isCloser(reader)) {
          reader.close();
        }
      }
    },
    cancel () {
      if (isCloser(reader) && autoClose) {
        reader.close();
      }
    }
  }, strategy);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvaW8vMC4yMjUuMy90b19yZWFkYWJsZV9zdHJlYW0udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNiB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgREVGQVVMVF9DSFVOS19TSVpFIH0gZnJvbSBcIi4vX2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHsgaXNDbG9zZXIgfSBmcm9tIFwiLi9fY29tbW9uLnRzXCI7XG5pbXBvcnQgdHlwZSB7IENsb3NlciwgUmVhZGVyIH0gZnJvbSBcIi4vdHlwZXMudHNcIjtcblxuLyoqIE9wdGlvbnMgZm9yIHtAbGlua2NvZGUgdG9SZWFkYWJsZVN0cmVhbX0uICovXG5leHBvcnQgaW50ZXJmYWNlIFRvUmVhZGFibGVTdHJlYW1PcHRpb25zIHtcbiAgLyoqIElmIHRoZSBgcmVhZGVyYCBpcyBhbHNvIGEgYENsb3NlcmAsIGF1dG9tYXRpY2FsbHkgY2xvc2UgdGhlIGByZWFkZXJgXG4gICAqIHdoZW4gYEVPRmAgaXMgZW5jb3VudGVyZWQsIG9yIGEgcmVhZCBlcnJvciBvY2N1cnMuXG4gICAqXG4gICAqIEBkZWZhdWx0IHt0cnVlfVxuICAgKi9cbiAgYXV0b0Nsb3NlPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogVGhlIHNpemUgb2YgY2h1bmtzIHRvIGFsbG9jYXRlIHRvIHJlYWQuXG4gICAqXG4gICAqIEBkZWZhdWx0IHsxNjY0MH1cbiAgICovXG4gIGNodW5rU2l6ZT86IG51bWJlcjtcblxuICAvKiogVGhlIHF1ZXVpbmcgc3RyYXRlZ3kgdG8gY3JlYXRlIHRoZSB7QGxpbmtjb2RlIFJlYWRhYmxlU3RyZWFtfSB3aXRoLiAqL1xuICBzdHJhdGVneT86IFF1ZXVpbmdTdHJhdGVneTxVaW50OEFycmF5Pjtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSB7QGxpbmtjb2RlIFJlYWRhYmxlU3RyZWFtfSBvZiB7QGxpbmtjb2RlIFVpbnQ4QXJyYXl9cyBmcm9tIGFcbiAqIHtAbGlua2NvZGUgUmVhZGVyfS5cbiAqXG4gKiBXaGVuIHRoZSBwdWxsIGFsZ29yaXRobSBpcyBjYWxsZWQgb24gdGhlIHN0cmVhbSwgYSBjaHVuayBmcm9tIHRoZSByZWFkZXJcbiAqIHdpbGwgYmUgcmVhZC4gIFdoZW4gYG51bGxgIGlzIHJldHVybmVkIGZyb20gdGhlIHJlYWRlciwgdGhlIHN0cmVhbSB3aWxsIGJlXG4gKiBjbG9zZWQgYWxvbmcgd2l0aCB0aGUgcmVhZGVyIChpZiBpdCBpcyBhbHNvIGEgYENsb3NlcmApLlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBuby1hc3NlcnRcbiAqIGltcG9ydCB7IHRvUmVhZGFibGVTdHJlYW0gfSBmcm9tIFwiQHN0ZC9pby90by1yZWFkYWJsZS1zdHJlYW1cIjtcbiAqXG4gKiB1c2luZyBmaWxlID0gYXdhaXQgRGVuby5vcGVuKFwiLi9SRUFETUUubWRcIiwgeyByZWFkOiB0cnVlIH0pO1xuICogY29uc3QgZmlsZVN0cmVhbSA9IHRvUmVhZGFibGVTdHJlYW0oZmlsZSk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gcmVhZGVyIFRoZSByZWFkZXIgdG8gcmVhZCBmcm9tXG4gKiBAcGFyYW0gb3B0aW9ucyBUaGUgb3B0aW9uc1xuICogQHJldHVybnMgVGhlIHJlYWRhYmxlIHN0cmVhbVxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9SZWFkYWJsZVN0cmVhbShcbiAgcmVhZGVyOiBSZWFkZXIgfCAoUmVhZGVyICYgQ2xvc2VyKSxcbiAgb3B0aW9ucz86IFRvUmVhZGFibGVTdHJlYW1PcHRpb25zLFxuKTogUmVhZGFibGVTdHJlYW08VWludDhBcnJheT4ge1xuICBjb25zdCB7XG4gICAgYXV0b0Nsb3NlID0gdHJ1ZSxcbiAgICBjaHVua1NpemUgPSBERUZBVUxUX0NIVU5LX1NJWkUsXG4gICAgc3RyYXRlZ3ksXG4gIH0gPSBvcHRpb25zID8/IHt9O1xuXG4gIHJldHVybiBuZXcgUmVhZGFibGVTdHJlYW0oe1xuICAgIGFzeW5jIHB1bGwoY29udHJvbGxlcikge1xuICAgICAgY29uc3QgY2h1bmsgPSBuZXcgVWludDhBcnJheShjaHVua1NpemUpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVhZCA9IGF3YWl0IHJlYWRlci5yZWFkKGNodW5rKTtcbiAgICAgICAgaWYgKHJlYWQgPT09IG51bGwpIHtcbiAgICAgICAgICBpZiAoaXNDbG9zZXIocmVhZGVyKSAmJiBhdXRvQ2xvc2UpIHtcbiAgICAgICAgICAgIHJlYWRlci5jbG9zZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb250cm9sbGVyLmNsb3NlKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShjaHVuay5zdWJhcnJheSgwLCByZWFkKSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnRyb2xsZXIuZXJyb3IoZSk7XG4gICAgICAgIGlmIChpc0Nsb3NlcihyZWFkZXIpKSB7XG4gICAgICAgICAgcmVhZGVyLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIGNhbmNlbCgpIHtcbiAgICAgIGlmIChpc0Nsb3NlcihyZWFkZXIpICYmIGF1dG9DbG9zZSkge1xuICAgICAgICByZWFkZXIuY2xvc2UoKTtcbiAgICAgIH1cbiAgICB9LFxuICB9LCBzdHJhdGVneSk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUVyQyxTQUFTLGtCQUFrQixRQUFRLGtCQUFrQjtBQUNyRCxTQUFTLFFBQVEsUUFBUSxlQUFlO0FBdUJ4Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW1CQyxHQUNELE9BQU8sU0FBUyxpQkFDZCxNQUFrQyxFQUNsQyxPQUFpQztFQUVqQyxNQUFNLEVBQ0osWUFBWSxJQUFJLEVBQ2hCLFlBQVksa0JBQWtCLEVBQzlCLFFBQVEsRUFDVCxHQUFHLFdBQVcsQ0FBQztFQUVoQixPQUFPLElBQUksZUFBZTtJQUN4QixNQUFNLE1BQUssVUFBVTtNQUNuQixNQUFNLFFBQVEsSUFBSSxXQUFXO01BQzdCLElBQUk7UUFDRixNQUFNLE9BQU8sTUFBTSxPQUFPLElBQUksQ0FBQztRQUMvQixJQUFJLFNBQVMsTUFBTTtVQUNqQixJQUFJLFNBQVMsV0FBVyxXQUFXO1lBQ2pDLE9BQU8sS0FBSztVQUNkO1VBQ0EsV0FBVyxLQUFLO1VBQ2hCO1FBQ0Y7UUFDQSxXQUFXLE9BQU8sQ0FBQyxNQUFNLFFBQVEsQ0FBQyxHQUFHO01BQ3ZDLEVBQUUsT0FBTyxHQUFHO1FBQ1YsV0FBVyxLQUFLLENBQUM7UUFDakIsSUFBSSxTQUFTLFNBQVM7VUFDcEIsT0FBTyxLQUFLO1FBQ2Q7TUFDRjtJQUNGO0lBQ0E7TUFDRSxJQUFJLFNBQVMsV0FBVyxXQUFXO1FBQ2pDLE9BQU8sS0FBSztNQUNkO0lBQ0Y7RUFDRixHQUFHO0FBQ0wifQ==
// denoCacheMetadata=5927752156796707930,13078050567339328800