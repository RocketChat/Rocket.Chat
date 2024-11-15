// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/**
 * Write all the content of the array buffer (`arr`) to the writer (`w`).
 *
 * @example
 * ```ts
 * import { writeAll } from "https://deno.land/std@$STD_VERSION/io/write_all.ts";

 * // Example writing to stdout
 * let contentBytes = new TextEncoder().encode("Hello World");
 * await writeAll(Deno.stdout, contentBytes);
 *
 * // Example writing to file
 * contentBytes = new TextEncoder().encode("Hello World");
 * using file = await Deno.open('test.file', {write: true});
 * await writeAll(file, contentBytes);
 * ```
 */ export async function writeAll(writer, data) {
  let nwritten = 0;
  while(nwritten < data.length){
    nwritten += await writer.write(data.subarray(nwritten));
  }
}
/**
 * Synchronously write all the content of the array buffer (`arr`) to the
 * writer (`w`).
 *
 * @example
 * ```ts
 * import { writeAllSync } from "https://deno.land/std@$STD_VERSION/io/write_all.ts";
 *
 * // Example writing to stdout
 * let contentBytes = new TextEncoder().encode("Hello World");
 * writeAllSync(Deno.stdout, contentBytes);
 *
 * // Example writing to file
 * contentBytes = new TextEncoder().encode("Hello World");
 * using file = Deno.openSync('test.file', {write: true});
 * writeAllSync(file, contentBytes);
 * ```
 */ export function writeAllSync(writer, data) {
  let nwritten = 0;
  while(nwritten < data.length){
    nwritten += writer.writeSync(data.subarray(nwritten));
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIxNi4wL2lvL3dyaXRlX2FsbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgdHlwZSB7IFdyaXRlciwgV3JpdGVyU3luYyB9IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5cbi8qKlxuICogV3JpdGUgYWxsIHRoZSBjb250ZW50IG9mIHRoZSBhcnJheSBidWZmZXIgKGBhcnJgKSB0byB0aGUgd3JpdGVyIChgd2ApLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgd3JpdGVBbGwgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9pby93cml0ZV9hbGwudHNcIjtcblxuICogLy8gRXhhbXBsZSB3cml0aW5nIHRvIHN0ZG91dFxuICogbGV0IGNvbnRlbnRCeXRlcyA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkhlbGxvIFdvcmxkXCIpO1xuICogYXdhaXQgd3JpdGVBbGwoRGVuby5zdGRvdXQsIGNvbnRlbnRCeXRlcyk7XG4gKlxuICogLy8gRXhhbXBsZSB3cml0aW5nIHRvIGZpbGVcbiAqIGNvbnRlbnRCeXRlcyA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkhlbGxvIFdvcmxkXCIpO1xuICogdXNpbmcgZmlsZSA9IGF3YWl0IERlbm8ub3BlbigndGVzdC5maWxlJywge3dyaXRlOiB0cnVlfSk7XG4gKiBhd2FpdCB3cml0ZUFsbChmaWxlLCBjb250ZW50Qnl0ZXMpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3cml0ZUFsbCh3cml0ZXI6IFdyaXRlciwgZGF0YTogVWludDhBcnJheSkge1xuICBsZXQgbndyaXR0ZW4gPSAwO1xuICB3aGlsZSAobndyaXR0ZW4gPCBkYXRhLmxlbmd0aCkge1xuICAgIG53cml0dGVuICs9IGF3YWl0IHdyaXRlci53cml0ZShkYXRhLnN1YmFycmF5KG53cml0dGVuKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHdyaXRlIGFsbCB0aGUgY29udGVudCBvZiB0aGUgYXJyYXkgYnVmZmVyIChgYXJyYCkgdG8gdGhlXG4gKiB3cml0ZXIgKGB3YCkuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyB3cml0ZUFsbFN5bmMgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9pby93cml0ZV9hbGwudHNcIjtcbiAqXG4gKiAvLyBFeGFtcGxlIHdyaXRpbmcgdG8gc3Rkb3V0XG4gKiBsZXQgY29udGVudEJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiSGVsbG8gV29ybGRcIik7XG4gKiB3cml0ZUFsbFN5bmMoRGVuby5zdGRvdXQsIGNvbnRlbnRCeXRlcyk7XG4gKlxuICogLy8gRXhhbXBsZSB3cml0aW5nIHRvIGZpbGVcbiAqIGNvbnRlbnRCeXRlcyA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkhlbGxvIFdvcmxkXCIpO1xuICogdXNpbmcgZmlsZSA9IERlbm8ub3BlblN5bmMoJ3Rlc3QuZmlsZScsIHt3cml0ZTogdHJ1ZX0pO1xuICogd3JpdGVBbGxTeW5jKGZpbGUsIGNvbnRlbnRCeXRlcyk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlQWxsU3luYyh3cml0ZXI6IFdyaXRlclN5bmMsIGRhdGE6IFVpbnQ4QXJyYXkpIHtcbiAgbGV0IG53cml0dGVuID0gMDtcbiAgd2hpbGUgKG53cml0dGVuIDwgZGF0YS5sZW5ndGgpIHtcbiAgICBud3JpdHRlbiArPSB3cml0ZXIud3JpdGVTeW5jKGRhdGEuc3ViYXJyYXkobndyaXR0ZW4pKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFJckM7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FnQkMsR0FDRCxPQUFPLGVBQWUsU0FBUyxNQUFjLEVBQUUsSUFBZ0I7RUFDN0QsSUFBSSxXQUFXO0VBQ2YsTUFBTyxXQUFXLEtBQUssTUFBTSxDQUFFO0lBQzdCLFlBQVksTUFBTSxPQUFPLEtBQUssQ0FBQyxLQUFLLFFBQVEsQ0FBQztFQUMvQztBQUNGO0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBaUJDLEdBQ0QsT0FBTyxTQUFTLGFBQWEsTUFBa0IsRUFBRSxJQUFnQjtFQUMvRCxJQUFJLFdBQVc7RUFDZixNQUFPLFdBQVcsS0FBSyxNQUFNLENBQUU7SUFDN0IsWUFBWSxPQUFPLFNBQVMsQ0FBQyxLQUFLLFFBQVEsQ0FBQztFQUM3QztBQUNGIn0=