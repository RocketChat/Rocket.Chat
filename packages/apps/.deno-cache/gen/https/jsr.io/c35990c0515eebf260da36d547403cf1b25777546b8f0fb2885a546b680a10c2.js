// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
/**
 * Write all the content of the array buffer (`arr`) to the writer (`w`).
 *
 * @example Writing to stdout
 * ```ts no-assert
 * import { writeAll } from "@std/io/write-all";
 *
 * const contentBytes = new TextEncoder().encode("Hello World");
 * await writeAll(Deno.stdout, contentBytes);
 * ```
 *
 * @example Writing to file
 * ```ts ignore no-assert
 * import { writeAll } from "@std/io/write-all";
 *
 * const contentBytes = new TextEncoder().encode("Hello World");
 * using file = await Deno.open('test.file', { write: true });
 * await writeAll(file, contentBytes);
 * ```
 *
 * @param writer The writer to write to
 * @param data The data to write
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
 * @example "riting to stdout
 * ```ts no-assert
 * import { writeAllSync } from "@std/io/write-all";
 *
 * const contentBytes = new TextEncoder().encode("Hello World");
 * writeAllSync(Deno.stdout, contentBytes);
 * ```
 *
 * @example Writing to file
 * ```ts ignore no-assert
 * import { writeAllSync } from "@std/io/write-all";
 *
 * const contentBytes = new TextEncoder().encode("Hello World");
 * using file = Deno.openSync("test.file", { write: true });
 * writeAllSync(file, contentBytes);
 * ```
 *
 * @param writer The writer to write to
 * @param data The data to write
 */ export function writeAllSync(writer, data) {
  let nwritten = 0;
  while(nwritten < data.length){
    nwritten += writer.writeSync(data.subarray(nwritten));
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvaW8vMC4yMjUuMy93cml0ZV9hbGwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNiB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHR5cGUgeyBXcml0ZXIsIFdyaXRlclN5bmMgfSBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG5leHBvcnQgdHlwZSB7IFdyaXRlciwgV3JpdGVyU3luYyB9IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5cbi8qKlxuICogV3JpdGUgYWxsIHRoZSBjb250ZW50IG9mIHRoZSBhcnJheSBidWZmZXIgKGBhcnJgKSB0byB0aGUgd3JpdGVyIChgd2ApLlxuICpcbiAqIEBleGFtcGxlIFdyaXRpbmcgdG8gc3Rkb3V0XG4gKiBgYGB0cyBuby1hc3NlcnRcbiAqIGltcG9ydCB7IHdyaXRlQWxsIH0gZnJvbSBcIkBzdGQvaW8vd3JpdGUtYWxsXCI7XG4gKlxuICogY29uc3QgY29udGVudEJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiSGVsbG8gV29ybGRcIik7XG4gKiBhd2FpdCB3cml0ZUFsbChEZW5vLnN0ZG91dCwgY29udGVudEJ5dGVzKTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIFdyaXRpbmcgdG8gZmlsZVxuICogYGBgdHMgaWdub3JlIG5vLWFzc2VydFxuICogaW1wb3J0IHsgd3JpdGVBbGwgfSBmcm9tIFwiQHN0ZC9pby93cml0ZS1hbGxcIjtcbiAqXG4gKiBjb25zdCBjb250ZW50Qnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJIZWxsbyBXb3JsZFwiKTtcbiAqIHVzaW5nIGZpbGUgPSBhd2FpdCBEZW5vLm9wZW4oJ3Rlc3QuZmlsZScsIHsgd3JpdGU6IHRydWUgfSk7XG4gKiBhd2FpdCB3cml0ZUFsbChmaWxlLCBjb250ZW50Qnl0ZXMpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHdyaXRlciBUaGUgd3JpdGVyIHRvIHdyaXRlIHRvXG4gKiBAcGFyYW0gZGF0YSBUaGUgZGF0YSB0byB3cml0ZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JpdGVBbGwod3JpdGVyOiBXcml0ZXIsIGRhdGE6IFVpbnQ4QXJyYXkpIHtcbiAgbGV0IG53cml0dGVuID0gMDtcbiAgd2hpbGUgKG53cml0dGVuIDwgZGF0YS5sZW5ndGgpIHtcbiAgICBud3JpdHRlbiArPSBhd2FpdCB3cml0ZXIud3JpdGUoZGF0YS5zdWJhcnJheShud3JpdHRlbikpO1xuICB9XG59XG5cbi8qKlxuICogU3luY2hyb25vdXNseSB3cml0ZSBhbGwgdGhlIGNvbnRlbnQgb2YgdGhlIGFycmF5IGJ1ZmZlciAoYGFycmApIHRvIHRoZVxuICogd3JpdGVyIChgd2ApLlxuICpcbiAqIEBleGFtcGxlIFwicml0aW5nIHRvIHN0ZG91dFxuICogYGBgdHMgbm8tYXNzZXJ0XG4gKiBpbXBvcnQgeyB3cml0ZUFsbFN5bmMgfSBmcm9tIFwiQHN0ZC9pby93cml0ZS1hbGxcIjtcbiAqXG4gKiBjb25zdCBjb250ZW50Qnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJIZWxsbyBXb3JsZFwiKTtcbiAqIHdyaXRlQWxsU3luYyhEZW5vLnN0ZG91dCwgY29udGVudEJ5dGVzKTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIFdyaXRpbmcgdG8gZmlsZVxuICogYGBgdHMgaWdub3JlIG5vLWFzc2VydFxuICogaW1wb3J0IHsgd3JpdGVBbGxTeW5jIH0gZnJvbSBcIkBzdGQvaW8vd3JpdGUtYWxsXCI7XG4gKlxuICogY29uc3QgY29udGVudEJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiSGVsbG8gV29ybGRcIik7XG4gKiB1c2luZyBmaWxlID0gRGVuby5vcGVuU3luYyhcInRlc3QuZmlsZVwiLCB7IHdyaXRlOiB0cnVlIH0pO1xuICogd3JpdGVBbGxTeW5jKGZpbGUsIGNvbnRlbnRCeXRlcyk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gd3JpdGVyIFRoZSB3cml0ZXIgdG8gd3JpdGUgdG9cbiAqIEBwYXJhbSBkYXRhIFRoZSBkYXRhIHRvIHdyaXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUFsbFN5bmMod3JpdGVyOiBXcml0ZXJTeW5jLCBkYXRhOiBVaW50OEFycmF5KSB7XG4gIGxldCBud3JpdHRlbiA9IDA7XG4gIHdoaWxlIChud3JpdHRlbiA8IGRhdGEubGVuZ3RoKSB7XG4gICAgbndyaXR0ZW4gKz0gd3JpdGVyLndyaXRlU3luYyhkYXRhLnN1YmFycmF5KG53cml0dGVuKSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBTXJDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBc0JDLEdBQ0QsT0FBTyxlQUFlLFNBQVMsTUFBYyxFQUFFLElBQWdCO0VBQzdELElBQUksV0FBVztFQUNmLE1BQU8sV0FBVyxLQUFLLE1BQU0sQ0FBRTtJQUM3QixZQUFZLE1BQU0sT0FBTyxLQUFLLENBQUMsS0FBSyxRQUFRLENBQUM7RUFDL0M7QUFDRjtBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXVCQyxHQUNELE9BQU8sU0FBUyxhQUFhLE1BQWtCLEVBQUUsSUFBZ0I7RUFDL0QsSUFBSSxXQUFXO0VBQ2YsTUFBTyxXQUFXLEtBQUssTUFBTSxDQUFFO0lBQzdCLFlBQVksT0FBTyxTQUFTLENBQUMsS0FBSyxRQUFRLENBQUM7RUFDN0M7QUFDRiJ9
// denoCacheMetadata=11976359236074648075,9416648229442577363