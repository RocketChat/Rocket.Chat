// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { concat } from "jsr:@std/bytes@^1.0.6/concat";
import { DEFAULT_CHUNK_SIZE } from "./_constants.ts";
/**
 * Read {@linkcode Reader} `r` until EOF (`null`) and resolve to the content as
 * {@linkcode Uint8Array}.
 *
 * @example Usage
 * ```ts ignore
 * import { readAll } from "@std/io/read-all";
 *
 * // Example from stdin
 * const stdinContent = await readAll(Deno.stdin);
 *
 * // Example from file
 * using file = await Deno.open("my_file.txt", {read: true});
 * const myFileContent = await readAll(file);
 * ```
 *
 * @param reader The reader to read from
 * @returns The content as Uint8Array
 */ export async function readAll(reader) {
  const chunks = [];
  while(true){
    let chunk = new Uint8Array(DEFAULT_CHUNK_SIZE);
    const n = await reader.read(chunk);
    if (n === null) {
      break;
    }
    if (n < DEFAULT_CHUNK_SIZE) {
      chunk = chunk.subarray(0, n);
    }
    chunks.push(chunk);
  }
  return concat(chunks);
}
/**
 * Synchronously reads {@linkcode ReaderSync} `r` until EOF (`null`) and returns
 * the content as {@linkcode Uint8Array}.
 *
 * @example Usage
 * ```ts ignore
 * import { readAllSync } from "@std/io/read-all";
 *
 * // Example from stdin
 * const stdinContent = readAllSync(Deno.stdin);
 *
 * // Example from file
 * using file = Deno.openSync("my_file.txt", {read: true});
 * const myFileContent = readAllSync(file);
 * ```
 *
 * @param reader The reader to read from
 * @returns The content as Uint8Array
 */ export function readAllSync(reader) {
  const chunks = [];
  while(true){
    let chunk = new Uint8Array(DEFAULT_CHUNK_SIZE);
    const n = reader.readSync(chunk);
    if (n === null) {
      break;
    }
    if (n < DEFAULT_CHUNK_SIZE) {
      chunk = chunk.subarray(0, n);
    }
    chunks.push(chunk);
  }
  return concat(chunks);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvaW8vMC4yMjUuMy9yZWFkX2FsbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI2IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBjb25jYXQgfSBmcm9tIFwianNyOkBzdGQvYnl0ZXNAXjEuMC42L2NvbmNhdFwiO1xuaW1wb3J0IHsgREVGQVVMVF9DSFVOS19TSVpFIH0gZnJvbSBcIi4vX2NvbnN0YW50cy50c1wiO1xuaW1wb3J0IHR5cGUgeyBSZWFkZXIsIFJlYWRlclN5bmMgfSBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG4vKipcbiAqIFJlYWQge0BsaW5rY29kZSBSZWFkZXJ9IGByYCB1bnRpbCBFT0YgKGBudWxsYCkgYW5kIHJlc29sdmUgdG8gdGhlIGNvbnRlbnQgYXNcbiAqIHtAbGlua2NvZGUgVWludDhBcnJheX0uXG4gKlxuICogQGV4YW1wbGUgVXNhZ2VcbiAqIGBgYHRzIGlnbm9yZVxuICogaW1wb3J0IHsgcmVhZEFsbCB9IGZyb20gXCJAc3RkL2lvL3JlYWQtYWxsXCI7XG4gKlxuICogLy8gRXhhbXBsZSBmcm9tIHN0ZGluXG4gKiBjb25zdCBzdGRpbkNvbnRlbnQgPSBhd2FpdCByZWFkQWxsKERlbm8uc3RkaW4pO1xuICpcbiAqIC8vIEV4YW1wbGUgZnJvbSBmaWxlXG4gKiB1c2luZyBmaWxlID0gYXdhaXQgRGVuby5vcGVuKFwibXlfZmlsZS50eHRcIiwge3JlYWQ6IHRydWV9KTtcbiAqIGNvbnN0IG15RmlsZUNvbnRlbnQgPSBhd2FpdCByZWFkQWxsKGZpbGUpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHJlYWRlciBUaGUgcmVhZGVyIHRvIHJlYWQgZnJvbVxuICogQHJldHVybnMgVGhlIGNvbnRlbnQgYXMgVWludDhBcnJheVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZEFsbChyZWFkZXI6IFJlYWRlcik6IFByb21pc2U8VWludDhBcnJheT4ge1xuICBjb25zdCBjaHVua3M6IFVpbnQ4QXJyYXlbXSA9IFtdO1xuICB3aGlsZSAodHJ1ZSkge1xuICAgIGxldCBjaHVuayA9IG5ldyBVaW50OEFycmF5KERFRkFVTFRfQ0hVTktfU0laRSk7XG4gICAgY29uc3QgbiA9IGF3YWl0IHJlYWRlci5yZWFkKGNodW5rKTtcbiAgICBpZiAobiA9PT0gbnVsbCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChuIDwgREVGQVVMVF9DSFVOS19TSVpFKSB7XG4gICAgICBjaHVuayA9IGNodW5rLnN1YmFycmF5KDAsIG4pO1xuICAgIH1cbiAgICBjaHVua3MucHVzaChjaHVuayk7XG4gIH1cbiAgcmV0dXJuIGNvbmNhdChjaHVua3MpO1xufVxuXG4vKipcbiAqIFN5bmNocm9ub3VzbHkgcmVhZHMge0BsaW5rY29kZSBSZWFkZXJTeW5jfSBgcmAgdW50aWwgRU9GIChgbnVsbGApIGFuZCByZXR1cm5zXG4gKiB0aGUgY29udGVudCBhcyB7QGxpbmtjb2RlIFVpbnQ4QXJyYXl9LlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0cyBpZ25vcmVcbiAqIGltcG9ydCB7IHJlYWRBbGxTeW5jIH0gZnJvbSBcIkBzdGQvaW8vcmVhZC1hbGxcIjtcbiAqXG4gKiAvLyBFeGFtcGxlIGZyb20gc3RkaW5cbiAqIGNvbnN0IHN0ZGluQ29udGVudCA9IHJlYWRBbGxTeW5jKERlbm8uc3RkaW4pO1xuICpcbiAqIC8vIEV4YW1wbGUgZnJvbSBmaWxlXG4gKiB1c2luZyBmaWxlID0gRGVuby5vcGVuU3luYyhcIm15X2ZpbGUudHh0XCIsIHtyZWFkOiB0cnVlfSk7XG4gKiBjb25zdCBteUZpbGVDb250ZW50ID0gcmVhZEFsbFN5bmMoZmlsZSk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gcmVhZGVyIFRoZSByZWFkZXIgdG8gcmVhZCBmcm9tXG4gKiBAcmV0dXJucyBUaGUgY29udGVudCBhcyBVaW50OEFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkQWxsU3luYyhyZWFkZXI6IFJlYWRlclN5bmMpOiBVaW50OEFycmF5IHtcbiAgY29uc3QgY2h1bmtzOiBVaW50OEFycmF5W10gPSBbXTtcbiAgd2hpbGUgKHRydWUpIHtcbiAgICBsZXQgY2h1bmsgPSBuZXcgVWludDhBcnJheShERUZBVUxUX0NIVU5LX1NJWkUpO1xuICAgIGNvbnN0IG4gPSByZWFkZXIucmVhZFN5bmMoY2h1bmspO1xuICAgIGlmIChuID09PSBudWxsKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKG4gPCBERUZBVUxUX0NIVU5LX1NJWkUpIHtcbiAgICAgIGNodW5rID0gY2h1bmsuc3ViYXJyYXkoMCwgbik7XG4gICAgfVxuICAgIGNodW5rcy5wdXNoKGNodW5rKTtcbiAgfVxuICByZXR1cm4gY29uY2F0KGNodW5rcyk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUVyQyxTQUFTLE1BQU0sUUFBUSwrQkFBK0I7QUFDdEQsU0FBUyxrQkFBa0IsUUFBUSxrQkFBa0I7QUFHckQ7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWtCQyxHQUNELE9BQU8sZUFBZSxRQUFRLE1BQWM7RUFDMUMsTUFBTSxTQUF1QixFQUFFO0VBQy9CLE1BQU8sS0FBTTtJQUNYLElBQUksUUFBUSxJQUFJLFdBQVc7SUFDM0IsTUFBTSxJQUFJLE1BQU0sT0FBTyxJQUFJLENBQUM7SUFDNUIsSUFBSSxNQUFNLE1BQU07TUFDZDtJQUNGO0lBQ0EsSUFBSSxJQUFJLG9CQUFvQjtNQUMxQixRQUFRLE1BQU0sUUFBUSxDQUFDLEdBQUc7SUFDNUI7SUFDQSxPQUFPLElBQUksQ0FBQztFQUNkO0VBQ0EsT0FBTyxPQUFPO0FBQ2hCO0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWtCQyxHQUNELE9BQU8sU0FBUyxZQUFZLE1BQWtCO0VBQzVDLE1BQU0sU0FBdUIsRUFBRTtFQUMvQixNQUFPLEtBQU07SUFDWCxJQUFJLFFBQVEsSUFBSSxXQUFXO0lBQzNCLE1BQU0sSUFBSSxPQUFPLFFBQVEsQ0FBQztJQUMxQixJQUFJLE1BQU0sTUFBTTtNQUNkO0lBQ0Y7SUFDQSxJQUFJLElBQUksb0JBQW9CO01BQzFCLFFBQVEsTUFBTSxRQUFRLENBQUMsR0FBRztJQUM1QjtJQUNBLE9BQU8sSUFBSSxDQUFDO0VBQ2Q7RUFDQSxPQUFPLE9BQU87QUFDaEIifQ==
// denoCacheMetadata=96166093042835593,9683843795589163572