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
 */

export * from "./buffer.ts";
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
