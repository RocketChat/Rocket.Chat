// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
/**
 * Utilities for working with Deno's readers, writers, and web streams.
 *
 * `Reader` and `Writer` interfaces are deprecated in Deno, and so many of these
 * utilities are also deprecated. Consider using web streams instead.
 *
 * ```ts ignore
 * import { toReadableStream, toWritableStream } from "@std/io";
 *
 * await toReadableStream(Deno.stdin)
 *   .pipeTo(toWritableStream(Deno.stdout));
 * ```
 *
 * @module
 */ export * from "./buffer.ts";
export * from "./copy.ts";
export * from "./iterate_reader.ts";
export * from "./read_all.ts";
export * from "./reader_from_stream_reader.ts";
export * from "./to_readable_stream.ts";
export * from "./to_writable_stream.ts";
export * from "./types.ts";
export * from "./write_all.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvaW8vMC4yMjUuMy9tb2QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNiB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBVdGlsaXRpZXMgZm9yIHdvcmtpbmcgd2l0aCBEZW5vJ3MgcmVhZGVycywgd3JpdGVycywgYW5kIHdlYiBzdHJlYW1zLlxuICpcbiAqIGBSZWFkZXJgIGFuZCBgV3JpdGVyYCBpbnRlcmZhY2VzIGFyZSBkZXByZWNhdGVkIGluIERlbm8sIGFuZCBzbyBtYW55IG9mIHRoZXNlXG4gKiB1dGlsaXRpZXMgYXJlIGFsc28gZGVwcmVjYXRlZC4gQ29uc2lkZXIgdXNpbmcgd2ViIHN0cmVhbXMgaW5zdGVhZC5cbiAqXG4gKiBgYGB0cyBpZ25vcmVcbiAqIGltcG9ydCB7IHRvUmVhZGFibGVTdHJlYW0sIHRvV3JpdGFibGVTdHJlYW0gfSBmcm9tIFwiQHN0ZC9pb1wiO1xuICpcbiAqIGF3YWl0IHRvUmVhZGFibGVTdHJlYW0oRGVuby5zdGRpbilcbiAqICAgLnBpcGVUbyh0b1dyaXRhYmxlU3RyZWFtKERlbm8uc3Rkb3V0KSk7XG4gKiBgYGBcbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxuZXhwb3J0ICogZnJvbSBcIi4vYnVmZmVyLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9jb3B5LnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9pdGVyYXRlX3JlYWRlci50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vcmVhZF9hbGwudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3JlYWRlcl9mcm9tX3N0cmVhbV9yZWFkZXIudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3RvX3JlYWRhYmxlX3N0cmVhbS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vdG9fd3JpdGFibGVfc3RyZWFtLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi90eXBlcy50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vd3JpdGVfYWxsLnRzXCI7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUVyQzs7Ozs7Ozs7Ozs7Ozs7Q0FjQyxHQUVELGNBQWMsY0FBYztBQUM1QixjQUFjLFlBQVk7QUFDMUIsY0FBYyxzQkFBc0I7QUFDcEMsY0FBYyxnQkFBZ0I7QUFDOUIsY0FBYyxpQ0FBaUM7QUFDL0MsY0FBYywwQkFBMEI7QUFDeEMsY0FBYywwQkFBMEI7QUFDeEMsY0FBYyxhQUFhO0FBQzNCLGNBQWMsaUJBQWlCIn0=
// denoCacheMetadata=4541847119145855014,9983001548181896548