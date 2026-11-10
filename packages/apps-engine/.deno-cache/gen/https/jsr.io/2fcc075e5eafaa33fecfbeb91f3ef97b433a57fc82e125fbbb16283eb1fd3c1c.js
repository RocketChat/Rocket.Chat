// Copyright 2018-2025 the Deno authors. MIT license.
/**
 * Utilities for working with the
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Streams_API | Streams API}.
 *
 * Includes buffering and conversion.
 *
 * ```ts
 * import { toText } from "@std/streams";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from(["Hello, world!"]);
 * const text = await toText(stream);
 *
 * assertEquals(text, "Hello, world!");
 * ```
 *
 * @module
 */ export * from "./buffer.ts";
export * from "./byte_slice_stream.ts";
export * from "./concat_readable_streams.ts";
export * from "./delimiter_stream.ts";
export * from "./early_zip_readable_streams.ts";
export * from "./limited_bytes_transform_stream.ts";
export * from "./limited_transform_stream.ts";
export * from "./merge_readable_streams.ts";
export * from "./text_delimiter_stream.ts";
export * from "./text_line_stream.ts";
export * from "./to_array_buffer.ts";
export * from "./to_blob.ts";
export * from "./to_json.ts";
export * from "./to_text.ts";
export * from "./to_transform_stream.ts";
export * from "./zip_readable_streams.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvc3RyZWFtcy8xLjAuMTYvbW9kLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vKipcbiAqIFV0aWxpdGllcyBmb3Igd29ya2luZyB3aXRoIHRoZVxuICoge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TdHJlYW1zX0FQSSB8IFN0cmVhbXMgQVBJfS5cbiAqXG4gKiBJbmNsdWRlcyBidWZmZXJpbmcgYW5kIGNvbnZlcnNpb24uXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHRvVGV4dCB9IGZyb20gXCJAc3RkL3N0cmVhbXNcIjtcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICpcbiAqIGNvbnN0IHN0cmVhbSA9IFJlYWRhYmxlU3RyZWFtLmZyb20oW1wiSGVsbG8sIHdvcmxkIVwiXSk7XG4gKiBjb25zdCB0ZXh0ID0gYXdhaXQgdG9UZXh0KHN0cmVhbSk7XG4gKlxuICogYXNzZXJ0RXF1YWxzKHRleHQsIFwiSGVsbG8sIHdvcmxkIVwiKTtcbiAqIGBgYFxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG5leHBvcnQgKiBmcm9tIFwiLi9idWZmZXIudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2J5dGVfc2xpY2Vfc3RyZWFtLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9jb25jYXRfcmVhZGFibGVfc3RyZWFtcy50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vZGVsaW1pdGVyX3N0cmVhbS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vZWFybHlfemlwX3JlYWRhYmxlX3N0cmVhbXMudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL2xpbWl0ZWRfYnl0ZXNfdHJhbnNmb3JtX3N0cmVhbS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vbGltaXRlZF90cmFuc2Zvcm1fc3RyZWFtLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9tZXJnZV9yZWFkYWJsZV9zdHJlYW1zLnRzXCI7XG5leHBvcnQgKiBmcm9tIFwiLi90ZXh0X2RlbGltaXRlcl9zdHJlYW0udHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3RleHRfbGluZV9zdHJlYW0udHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3RvX2FycmF5X2J1ZmZlci50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vdG9fYmxvYi50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vdG9fanNvbi50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vdG9fdGV4dC50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vdG9fdHJhbnNmb3JtX3N0cmVhbS50c1wiO1xuZXhwb3J0ICogZnJvbSBcIi4vemlwX3JlYWRhYmxlX3N0cmVhbXMudHNcIjtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQ7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBaUJDLEdBRUQsY0FBYyxjQUFjO0FBQzVCLGNBQWMseUJBQXlCO0FBQ3ZDLGNBQWMsK0JBQStCO0FBQzdDLGNBQWMsd0JBQXdCO0FBQ3RDLGNBQWMsa0NBQWtDO0FBQ2hELGNBQWMsc0NBQXNDO0FBQ3BELGNBQWMsZ0NBQWdDO0FBQzlDLGNBQWMsOEJBQThCO0FBQzVDLGNBQWMsNkJBQTZCO0FBQzNDLGNBQWMsd0JBQXdCO0FBQ3RDLGNBQWMsdUJBQXVCO0FBQ3JDLGNBQWMsZUFBZTtBQUM3QixjQUFjLGVBQWU7QUFDN0IsY0FBYyxlQUFlO0FBQzdCLGNBQWMsMkJBQTJCO0FBQ3pDLGNBQWMsNEJBQTRCIn0=
// denoCacheMetadata=7844515785833857169,284598984315974980