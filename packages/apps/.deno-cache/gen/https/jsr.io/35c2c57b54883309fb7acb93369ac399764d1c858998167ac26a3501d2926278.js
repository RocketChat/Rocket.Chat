// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { writeAll } from "./write_all.ts";
import { isCloser } from "./_common.ts";
/**
 * Create a {@linkcode WritableStream} from a {@linkcode Writer}.
 *
 * @example Usage
 * ```ts no-assert
 * import { toWritableStream } from "@std/io/to-writable-stream";
 *
 * const a = toWritableStream(Deno.stdout); // Same as `Deno.stdout.writable`
 * ```
 *
 * @param writer The writer to write to
 * @param options The options
 * @returns The writable stream
 */ export function toWritableStream(writer, options) {
  const { autoClose = true } = options ?? {};
  return new WritableStream({
    async write (chunk, controller) {
      try {
        await writeAll(writer, chunk);
      } catch (e) {
        controller.error(e);
        if (isCloser(writer) && autoClose) {
          writer.close();
        }
      }
    },
    close () {
      if (isCloser(writer) && autoClose) {
        writer.close();
      }
    },
    abort () {
      if (isCloser(writer) && autoClose) {
        writer.close();
      }
    }
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvaW8vMC4yMjUuMy90b193cml0YWJsZV9zdHJlYW0udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNiB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgd3JpdGVBbGwgfSBmcm9tIFwiLi93cml0ZV9hbGwudHNcIjtcbmltcG9ydCB0eXBlIHsgV3JpdGVyIH0gZnJvbSBcIi4vdHlwZXMudHNcIjtcbmltcG9ydCB7IGlzQ2xvc2VyIH0gZnJvbSBcIi4vX2NvbW1vbi50c1wiO1xuXG4vKiogT3B0aW9ucyBmb3Ige0BsaW5rY29kZSB0b1dyaXRhYmxlU3RyZWFtfS4gKi9cbi8vIGRlbm8tbGludC1pZ25vcmUgZGVuby1zdHlsZS1ndWlkZS9uYW1pbmctY29udmVudGlvblxuZXhwb3J0IGludGVyZmFjZSB0b1dyaXRhYmxlU3RyZWFtT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBJZiB0aGUgYHdyaXRlcmAgaXMgYWxzbyBhIGBDbG9zZXJgLCBhdXRvbWF0aWNhbGx5IGNsb3NlIHRoZSBgd3JpdGVyYFxuICAgKiB3aGVuIHRoZSBzdHJlYW0gaXMgY2xvc2VkLCBhYm9ydGVkLCBvciBhIHdyaXRlIGVycm9yIG9jY3Vycy5cbiAgICpcbiAgICogQGRlZmF1bHQge3RydWV9XG4gICAqL1xuICBhdXRvQ2xvc2U/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIHtAbGlua2NvZGUgV3JpdGFibGVTdHJlYW19IGZyb20gYSB7QGxpbmtjb2RlIFdyaXRlcn0uXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIG5vLWFzc2VydFxuICogaW1wb3J0IHsgdG9Xcml0YWJsZVN0cmVhbSB9IGZyb20gXCJAc3RkL2lvL3RvLXdyaXRhYmxlLXN0cmVhbVwiO1xuICpcbiAqIGNvbnN0IGEgPSB0b1dyaXRhYmxlU3RyZWFtKERlbm8uc3Rkb3V0KTsgLy8gU2FtZSBhcyBgRGVuby5zdGRvdXQud3JpdGFibGVgXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gd3JpdGVyIFRoZSB3cml0ZXIgdG8gd3JpdGUgdG9cbiAqIEBwYXJhbSBvcHRpb25zIFRoZSBvcHRpb25zXG4gKiBAcmV0dXJucyBUaGUgd3JpdGFibGUgc3RyZWFtXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b1dyaXRhYmxlU3RyZWFtKFxuICB3cml0ZXI6IFdyaXRlcixcbiAgb3B0aW9ucz86IHRvV3JpdGFibGVTdHJlYW1PcHRpb25zLFxuKTogV3JpdGFibGVTdHJlYW08VWludDhBcnJheT4ge1xuICBjb25zdCB7IGF1dG9DbG9zZSA9IHRydWUgfSA9IG9wdGlvbnMgPz8ge307XG5cbiAgcmV0dXJuIG5ldyBXcml0YWJsZVN0cmVhbSh7XG4gICAgYXN5bmMgd3JpdGUoY2h1bmssIGNvbnRyb2xsZXIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHdyaXRlQWxsKHdyaXRlciwgY2h1bmspO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb250cm9sbGVyLmVycm9yKGUpO1xuICAgICAgICBpZiAoaXNDbG9zZXIod3JpdGVyKSAmJiBhdXRvQ2xvc2UpIHtcbiAgICAgICAgICB3cml0ZXIuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgY2xvc2UoKSB7XG4gICAgICBpZiAoaXNDbG9zZXIod3JpdGVyKSAmJiBhdXRvQ2xvc2UpIHtcbiAgICAgICAgd3JpdGVyLmNsb3NlKCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBhYm9ydCgpIHtcbiAgICAgIGlmIChpc0Nsb3Nlcih3cml0ZXIpICYmIGF1dG9DbG9zZSkge1xuICAgICAgICB3cml0ZXIuY2xvc2UoKTtcbiAgICAgIH1cbiAgICB9LFxuICB9KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBRXJDLFNBQVMsUUFBUSxRQUFRLGlCQUFpQjtBQUUxQyxTQUFTLFFBQVEsUUFBUSxlQUFlO0FBY3hDOzs7Ozs7Ozs7Ozs7O0NBYUMsR0FDRCxPQUFPLFNBQVMsaUJBQ2QsTUFBYyxFQUNkLE9BQWlDO0VBRWpDLE1BQU0sRUFBRSxZQUFZLElBQUksRUFBRSxHQUFHLFdBQVcsQ0FBQztFQUV6QyxPQUFPLElBQUksZUFBZTtJQUN4QixNQUFNLE9BQU0sS0FBSyxFQUFFLFVBQVU7TUFDM0IsSUFBSTtRQUNGLE1BQU0sU0FBUyxRQUFRO01BQ3pCLEVBQUUsT0FBTyxHQUFHO1FBQ1YsV0FBVyxLQUFLLENBQUM7UUFDakIsSUFBSSxTQUFTLFdBQVcsV0FBVztVQUNqQyxPQUFPLEtBQUs7UUFDZDtNQUNGO0lBQ0Y7SUFDQTtNQUNFLElBQUksU0FBUyxXQUFXLFdBQVc7UUFDakMsT0FBTyxLQUFLO01BQ2Q7SUFDRjtJQUNBO01BQ0UsSUFBSSxTQUFTLFdBQVcsV0FBVztRQUNqQyxPQUFPLEtBQUs7TUFDZDtJQUNGO0VBQ0Y7QUFDRiJ9
// denoCacheMetadata=4934807272299825841,2564029365967064111