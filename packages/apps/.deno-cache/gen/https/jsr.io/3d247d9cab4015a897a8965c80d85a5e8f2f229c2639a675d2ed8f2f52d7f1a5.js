// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { Buffer } from "./buffer.ts";
import { writeAll } from "./write_all.ts";
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
 */ export function readerFromStreamReader(streamReader) {
  const buffer = new Buffer();
  return {
    async read (p) {
      if (buffer.empty()) {
        const res = await streamReader.read();
        if (res.done) {
          return null; // EOF
        }
        await writeAll(buffer, res.value);
      }
      return buffer.read(p);
    }
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvaW8vMC4yMjUuMy9yZWFkZXJfZnJvbV9zdHJlYW1fcmVhZGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjYgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCIuL2J1ZmZlci50c1wiO1xuaW1wb3J0IHsgd3JpdGVBbGwgfSBmcm9tIFwiLi93cml0ZV9hbGwudHNcIjtcbmltcG9ydCB0eXBlIHsgUmVhZGVyIH0gZnJvbSBcIi4vdHlwZXMudHNcIjtcblxuLyoqXG4gKiBDcmVhdGUgYSB7QGxpbmtjb2RlIFJlYWRlcn0gZnJvbSBhIHtAbGlua2NvZGUgUmVhZGFibGVTdHJlYW1EZWZhdWx0UmVhZGVyfS5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBjb3B5IH0gZnJvbSBcIkBzdGQvaW8vY29weVwiO1xuICogaW1wb3J0IHsgcmVhZGVyRnJvbVN0cmVhbVJlYWRlciB9IGZyb20gXCJAc3RkL2lvL3JlYWRlci1mcm9tLXN0cmVhbS1yZWFkZXJcIjtcbiAqXG4gKiBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vZGVuby5sYW5kXCIpO1xuICpcbiAqIGNvbnN0IHJlYWRlciA9IHJlYWRlckZyb21TdHJlYW1SZWFkZXIocmVzLmJvZHkhLmdldFJlYWRlcigpKTtcbiAqIGF3YWl0IGNvcHkocmVhZGVyLCBEZW5vLnN0ZG91dCk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gc3RyZWFtUmVhZGVyIFRoZSBzdHJlYW0gcmVhZGVyIHRvIHJlYWQgZnJvbVxuICogQHJldHVybnMgVGhlIHJlYWRlclxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZGVyRnJvbVN0cmVhbVJlYWRlcihcbiAgc3RyZWFtUmVhZGVyOiBSZWFkYWJsZVN0cmVhbURlZmF1bHRSZWFkZXI8VWludDhBcnJheT4sXG4pOiBSZWFkZXIge1xuICBjb25zdCBidWZmZXIgPSBuZXcgQnVmZmVyKCk7XG5cbiAgcmV0dXJuIHtcbiAgICBhc3luYyByZWFkKHA6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPG51bWJlciB8IG51bGw+IHtcbiAgICAgIGlmIChidWZmZXIuZW1wdHkoKSkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBzdHJlYW1SZWFkZXIucmVhZCgpO1xuICAgICAgICBpZiAocmVzLmRvbmUpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDsgLy8gRU9GXG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB3cml0ZUFsbChidWZmZXIsIHJlcy52YWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBidWZmZXIucmVhZChwKTtcbiAgICB9LFxuICB9O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFFckMsU0FBUyxNQUFNLFFBQVEsY0FBYztBQUNyQyxTQUFTLFFBQVEsUUFBUSxpQkFBaUI7QUFHMUM7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FnQkMsR0FDRCxPQUFPLFNBQVMsdUJBQ2QsWUFBcUQ7RUFFckQsTUFBTSxTQUFTLElBQUk7RUFFbkIsT0FBTztJQUNMLE1BQU0sTUFBSyxDQUFhO01BQ3RCLElBQUksT0FBTyxLQUFLLElBQUk7UUFDbEIsTUFBTSxNQUFNLE1BQU0sYUFBYSxJQUFJO1FBQ25DLElBQUksSUFBSSxJQUFJLEVBQUU7VUFDWixPQUFPLE1BQU0sTUFBTTtRQUNyQjtRQUVBLE1BQU0sU0FBUyxRQUFRLElBQUksS0FBSztNQUNsQztNQUVBLE9BQU8sT0FBTyxJQUFJLENBQUM7SUFDckI7RUFDRjtBQUNGIn0=
// denoCacheMetadata=6403758060635110981,18186856484457619652