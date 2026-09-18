// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
/**
 * Concatenate an array of byte slices into a single slice.
 *
 * @param buffers Array of byte slices to concatenate.
 * @returns A new byte slice containing all the input slices concatenated.
 *
 * @example Basic usage
 * ```ts
 * import { concat } from "@std/bytes/concat";
 * import { assertEquals } from "@std/assert";
 *
 * const a = new Uint8Array([0, 1, 2]);
 * const b = new Uint8Array([3, 4, 5]);
 *
 * assertEquals(concat([a, b]), new Uint8Array([0, 1, 2, 3, 4, 5]));
 * ```
 */ export function concat(buffers) {
  let length = 0;
  for (const buffer of buffers){
    length += buffer.length;
  }
  const output = new Uint8Array(length);
  let index = 0;
  for (const buffer of buffers){
    output.set(buffer, index);
    index += buffer.length;
  }
  return output;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvYnl0ZXMvMS4wLjYvY29uY2F0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB0eXBlIHsgVWludDhBcnJheV8gfSBmcm9tIFwiLi9fdHlwZXMudHNcIjtcbmV4cG9ydCB0eXBlIHsgVWludDhBcnJheV8gfTtcblxuLyoqXG4gKiBDb25jYXRlbmF0ZSBhbiBhcnJheSBvZiBieXRlIHNsaWNlcyBpbnRvIGEgc2luZ2xlIHNsaWNlLlxuICpcbiAqIEBwYXJhbSBidWZmZXJzIEFycmF5IG9mIGJ5dGUgc2xpY2VzIHRvIGNvbmNhdGVuYXRlLlxuICogQHJldHVybnMgQSBuZXcgYnl0ZSBzbGljZSBjb250YWluaW5nIGFsbCB0aGUgaW5wdXQgc2xpY2VzIGNvbmNhdGVuYXRlZC5cbiAqXG4gKiBAZXhhbXBsZSBCYXNpYyB1c2FnZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGNvbmNhdCB9IGZyb20gXCJAc3RkL2J5dGVzL2NvbmNhdFwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3QgYSA9IG5ldyBVaW50OEFycmF5KFswLCAxLCAyXSk7XG4gKiBjb25zdCBiID0gbmV3IFVpbnQ4QXJyYXkoWzMsIDQsIDVdKTtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoY29uY2F0KFthLCBiXSksIG5ldyBVaW50OEFycmF5KFswLCAxLCAyLCAzLCA0LCA1XSkpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb25jYXQoYnVmZmVyczogcmVhZG9ubHkgVWludDhBcnJheVtdKTogVWludDhBcnJheV8ge1xuICBsZXQgbGVuZ3RoID0gMDtcbiAgZm9yIChjb25zdCBidWZmZXIgb2YgYnVmZmVycykge1xuICAgIGxlbmd0aCArPSBidWZmZXIubGVuZ3RoO1xuICB9XG4gIGNvbnN0IG91dHB1dCA9IG5ldyBVaW50OEFycmF5KGxlbmd0aCk7XG4gIGxldCBpbmRleCA9IDA7XG4gIGZvciAoY29uc3QgYnVmZmVyIG9mIGJ1ZmZlcnMpIHtcbiAgICBvdXRwdXQuc2V0KGJ1ZmZlciwgaW5kZXgpO1xuICAgIGluZGV4ICs9IGJ1ZmZlci5sZW5ndGg7XG4gIH1cblxuICByZXR1cm4gb3V0cHV0O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFLckM7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FnQkMsR0FDRCxPQUFPLFNBQVMsT0FBTyxPQUE4QjtFQUNuRCxJQUFJLFNBQVM7RUFDYixLQUFLLE1BQU0sVUFBVSxRQUFTO0lBQzVCLFVBQVUsT0FBTyxNQUFNO0VBQ3pCO0VBQ0EsTUFBTSxTQUFTLElBQUksV0FBVztFQUM5QixJQUFJLFFBQVE7RUFDWixLQUFLLE1BQU0sVUFBVSxRQUFTO0lBQzVCLE9BQU8sR0FBRyxDQUFDLFFBQVE7SUFDbkIsU0FBUyxPQUFPLE1BQU07RUFDeEI7RUFFQSxPQUFPO0FBQ1QifQ==
// denoCacheMetadata=1798964424538129456,4726313200831866969