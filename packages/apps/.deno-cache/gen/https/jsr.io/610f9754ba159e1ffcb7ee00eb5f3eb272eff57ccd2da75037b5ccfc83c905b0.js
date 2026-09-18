// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { DEFAULT_BUFFER_SIZE } from "./_constants.ts";
import { writeAll } from "./write_all.ts";
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
 */ export async function copy(src, dst, options) {
  let n = 0;
  const b = new Uint8Array(options?.bufSize ?? DEFAULT_BUFFER_SIZE);
  while(true){
    const result = await src.read(b);
    if (result === null) break;
    await writeAll(dst, b.subarray(0, result));
    n += result;
  }
  return n;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvaW8vMC4yMjUuMy9jb3B5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjYgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IERFRkFVTFRfQlVGRkVSX1NJWkUgfSBmcm9tIFwiLi9fY29uc3RhbnRzLnRzXCI7XG5pbXBvcnQgeyB3cml0ZUFsbCB9IGZyb20gXCIuL3dyaXRlX2FsbC50c1wiO1xuaW1wb3J0IHR5cGUgeyBSZWFkZXIsIFdyaXRlciB9IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5cbi8qKlxuICogQ29waWVzIGZyb20gYHNyY2AgdG8gYGRzdGAgdW50aWwgZWl0aGVyIEVPRiAoYG51bGxgKSBpcyByZWFkIGZyb20gYHNyY2Agb3JcbiAqIGFuIGVycm9yIG9jY3Vycy4gSXQgcmVzb2x2ZXMgdG8gdGhlIG51bWJlciBvZiBieXRlcyBjb3BpZWQgb3IgcmVqZWN0cyB3aXRoXG4gKiB0aGUgZmlyc3QgZXJyb3IgZW5jb3VudGVyZWQgd2hpbGUgY29weWluZy5cbiAqXG4gKiBAZXhhbXBsZSBVc2FnZVxuICogYGBgdHMgaWdub3JlXG4gKiBpbXBvcnQgeyBjb3B5IH0gZnJvbSBcIkBzdGQvaW8vY29weVwiO1xuICpcbiAqIGNvbnN0IHNvdXJjZSA9IGF3YWl0IERlbm8ub3BlbihcIm15X2ZpbGUudHh0XCIpO1xuICogY29uc3QgYnl0ZXNDb3BpZWQxID0gYXdhaXQgY29weShzb3VyY2UsIERlbm8uc3Rkb3V0KTtcbiAqIGNvbnN0IGRlc3RpbmF0aW9uID0gYXdhaXQgRGVuby5jcmVhdGUoXCJteV9maWxlXzIudHh0XCIpO1xuICogY29uc3QgYnl0ZXNDb3BpZWQyID0gYXdhaXQgY29weShzb3VyY2UsIGRlc3RpbmF0aW9uKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBzcmMgVGhlIHNvdXJjZSB0byBjb3B5IGZyb21cbiAqIEBwYXJhbSBkc3QgVGhlIGRlc3RpbmF0aW9uIHRvIGNvcHkgdG9cbiAqIEBwYXJhbSBvcHRpb25zIENhbiBiZSB1c2VkIHRvIHR1bmUgc2l6ZSBvZiB0aGUgYnVmZmVyLiBEZWZhdWx0IHNpemUgaXMgMzJrQlxuICogQHJldHVybnMgTnVtYmVyIG9mIGJ5dGVzIGNvcGllZFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29weShcbiAgc3JjOiBSZWFkZXIsXG4gIGRzdDogV3JpdGVyLFxuICBvcHRpb25zPzoge1xuICAgIGJ1ZlNpemU/OiBudW1iZXI7XG4gIH0sXG4pOiBQcm9taXNlPG51bWJlcj4ge1xuICBsZXQgbiA9IDA7XG4gIGNvbnN0IGIgPSBuZXcgVWludDhBcnJheShvcHRpb25zPy5idWZTaXplID8/IERFRkFVTFRfQlVGRkVSX1NJWkUpO1xuICB3aGlsZSAodHJ1ZSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNyYy5yZWFkKGIpO1xuICAgIGlmIChyZXN1bHQgPT09IG51bGwpIGJyZWFrO1xuICAgIGF3YWl0IHdyaXRlQWxsKGRzdCwgYi5zdWJhcnJheSgwLCByZXN1bHQpKTtcbiAgICBuICs9IHJlc3VsdDtcbiAgfVxuICByZXR1cm4gbjtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBRXJDLFNBQVMsbUJBQW1CLFFBQVEsa0JBQWtCO0FBQ3RELFNBQVMsUUFBUSxRQUFRLGlCQUFpQjtBQUcxQzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW1CQyxHQUNELE9BQU8sZUFBZSxLQUNwQixHQUFXLEVBQ1gsR0FBVyxFQUNYLE9BRUM7RUFFRCxJQUFJLElBQUk7RUFDUixNQUFNLElBQUksSUFBSSxXQUFXLFNBQVMsV0FBVztFQUM3QyxNQUFPLEtBQU07SUFDWCxNQUFNLFNBQVMsTUFBTSxJQUFJLElBQUksQ0FBQztJQUM5QixJQUFJLFdBQVcsTUFBTTtJQUNyQixNQUFNLFNBQVMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxHQUFHO0lBQ2xDLEtBQUs7RUFDUDtFQUNBLE9BQU87QUFDVCJ9
// denoCacheMetadata=16953701918442356963,15801615535276621075