// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { copy } from "jsr:@std/bytes@^1.0.6/copy";
const MAX_SIZE = 2 ** 32 - 2;
const DEFAULT_CHUNK_SIZE = 16_640;
/**
 * A variable-sized buffer of bytes with `readable` and `writable` getters that
 * allows you to work with {@link https://developer.mozilla.org/en-US/docs/Web/API/Streams_API | Web Streams API}.
 *
 * Buffer is almost always used with some I/O like files and sockets. It allows
 * one to buffer up a download from a socket. Buffer grows and shrinks as
 * necessary.
 *
 * Buffer is NOT the same thing as Node's Buffer. Node's Buffer was created in
 * 2009 before JavaScript had the concept of ArrayBuffers. It's simply a
 * non-standard ArrayBuffer.
 *
 * ArrayBuffer is a fixed memory allocation. Buffer is implemented on top of
 * ArrayBuffer.
 *
 * Based on {@link https://golang.org/pkg/bytes/#Buffer | Go Buffer}.
 *
 * @example Buffer input bytes and convert it to a string
 * ```ts
 * import { Buffer } from "@std/streams/buffer";
 * import { toText } from "@std/streams/to-text";
 * import { assert } from "@std/assert";
 * import { assertEquals } from "@std/assert";
 *
 * // Create a new buffer
 * const buf = new Buffer();
 * assertEquals(buf.capacity, 0);
 * assertEquals(buf.length, 0);
 *
 * // Dummy input stream
 * const inputStream = ReadableStream.from([
 *   "hello, ",
 *   "world",
 *   "!",
 * ]);
 *
 * // Pipe the input stream to the buffer
 * await inputStream.pipeThrough(new TextEncoderStream()).pipeTo(buf.writable);
 * assert(buf.capacity > 0);
 * assert(buf.length > 0);
 *
 * // Convert the buffered bytes to a string
 * const result = await toText(buf.readable);
 * assertEquals(result, "hello, world!");
 * assert(buf.empty());
 * ```
 */ export class Buffer {
  #buf;
  #off = 0;
  #readable = new ReadableStream({
    type: "bytes",
    pull: (controller)=>{
      const view = new Uint8Array(controller.byobRequest.view.buffer);
      if (this.empty()) {
        // Buffer is empty, reset to recover space.
        this.reset();
        controller.close();
        controller.byobRequest.respond(0);
        return;
      }
      const nread = copy(this.#buf.subarray(this.#off), view);
      this.#off += nread;
      controller.byobRequest.respond(nread);
    },
    autoAllocateChunkSize: DEFAULT_CHUNK_SIZE
  });
  /**
   * Getter returning the instance's {@linkcode ReadableStream}.
   *
   * @returns A `ReadableStream` of the buffer.
   *
   * @example Read the content out of the buffer to stdout
   * ```ts ignore
   * import { Buffer } from "@std/streams/buffer";
   *
   * const buf = new Buffer();
   * await buf.readable.pipeTo(Deno.stdout.writable);
   * ```
   */ get readable() {
    return this.#readable;
  }
  #writable = new WritableStream({
    write: (chunk)=>{
      const m = this.#grow(chunk.byteLength);
      copy(chunk, this.#buf, m);
    }
  });
  /**
   * Getter returning the instance's {@linkcode WritableStream}.
   *
   * @returns A `WritableStream` of the buffer.
   *
   * @example Write the data from stdin to the buffer
   * ```ts ignore
   * import { Buffer } from "@std/streams/buffer";
   *
   * const buf = new Buffer();
   * await Deno.stdin.readable.pipeTo(buf.writable);
   * ```
   */ get writable() {
    return this.#writable;
  }
  /**
   * Constructs a new instance.
   *
   * @param ab An optional buffer to use as the initial buffer.
   */ constructor(ab){
    if (ab === undefined) {
      this.#buf = new Uint8Array(0);
    } else {
      this.#buf = new Uint8Array(ab);
    }
  }
  /**
   * Returns a slice holding the unread portion of the buffer.
   *
   * The slice is valid for use only until the next buffer modification (that
   * is, only until the next call to a method that mutates or consumes the
   * buffer, like reading data out via `readable`, `reset()`, or `truncate()`).
   *
   * If `options.copy` is false the slice aliases the buffer content at least
   * until the next buffer modification, so immediate changes to the slice will
   * affect the result of future reads. If `options` is not provided,
   * `options.copy` defaults to `true`.
   *
   * @param options Options for the bytes method.
   * @returns A copy or a slice of the buffer.
   *
   * @example Copy the buffer
   * ```ts
   * import { assertEquals } from "@std/assert";
   * import { assertNotEquals } from "@std/assert";
   * import { Buffer } from "@std/streams/buffer";
   *
   * const array = new Uint8Array([0, 1, 2]);
   * const buf = new Buffer(array.buffer);
   * const copied = buf.bytes();
   * assertEquals(copied.length, array.length);
   *
   * // Modify an element in the original array
   * array[1] = 99;
   * assertEquals(copied[0], array[0]);
   * // The copied buffer is not affected by the modification
   * assertNotEquals(copied[1], array[1]);
   * assertEquals(copied[2], array[2]);
   * ```
   *
   * @example Get a slice to the buffer
   * ```ts
   * import { assertEquals } from "@std/assert";
   * import { Buffer } from "@std/streams/buffer";
   *
   * const array = new Uint8Array([0, 1, 2]);
   * const buf = new Buffer(array.buffer);
   * const slice = buf.bytes({ copy: false });
   * assertEquals(slice.length, array.length);
   *
   * // Modify an element in the original array
   * array[1] = 99;
   * assertEquals(slice[0], array[0]);
   * // The slice _is_ affected by the modification
   * assertEquals(slice[1], array[1]);
   * assertEquals(slice[2], array[2]);
   * ```
   */ bytes(options = {
    copy: true
  }) {
    if (options.copy === false) return this.#buf.subarray(this.#off);
    return this.#buf.slice(this.#off);
  }
  /**
   * Returns whether the unread portion of the buffer is empty.
   *
   * @returns Whether the buffer is empty.
   *
   * @example Empty buffer
   * ```ts
   * import { assert } from "@std/assert";
   * import { Buffer } from "@std/streams/buffer";
   *
   * const buf = new Buffer();
   * assert(buf.empty());
   * ```
   *
   * @example Non-empty buffer
   * ```ts
   * import { assert } from "@std/assert";
   * import { Buffer } from "@std/streams/buffer";
   *
   * const array = new Uint8Array([42]);
   * const buf = new Buffer(array.buffer);
   * assert(!buf.empty());
   * ```
   *
   * @example Non-empty, but the content was already read
   * ```ts ignore
   * import { assert } from "@std/assert";
   * import { Buffer } from "@std/streams/buffer";
   *
   * const array = new Uint8Array([42]);
   * const buf = new Buffer(array.buffer);
   * assert(!buf.empty());
   * // Read the content out of the buffer
   * await buf.readable.pipeTo(Deno.stdout.writable);
   * // The buffer is now empty
   * assert(buf.empty());
   * ```
   */ empty() {
    return this.#buf.byteLength <= this.#off;
  }
  /**
   * A read only number of bytes of the unread portion of the buffer.
   *
   * @returns The number of bytes in the unread portion of the buffer.
   *
   * @example Basic usage
   * ```ts
   * import { assertEquals } from "@std/assert";
   * import { Buffer } from "@std/streams/buffer";
   *
   * const array = new Uint8Array([0, 1, 2]);
   * const buf = new Buffer(array.buffer);
   * assertEquals(buf.length, 3);
   * ```
   *
   * @example Length becomes 0 after the content is read
   * ```ts ignore
   * import { assertEquals } from "@std/assert";
   * import { Buffer } from "@std/streams/buffer";
   *
   * const array = new Uint8Array([42]);
   * const buf = new Buffer(array.buffer);
   * assertEquals(buf.length, 1);
   * // Read the content out of the buffer
   * await buf.readable.pipeTo(Deno.stdout.writable);
   * // The length is now 0
   * assertEquals(buf.length, 0);
   * ```
   */ get length() {
    return this.#buf.byteLength - this.#off;
  }
  /**
   * The read only capacity of the buffer's underlying byte slice, that is,
   * the total space allocated for the buffer's data.
   *
   * @returns The number of allocated bytes for the buffer.
   *
   * @example Basic usage
   * ```ts
   * import { assertEquals } from "@std/assert";
   * import { Buffer } from "@std/streams/buffer";
   *
   * const arrayBuffer = new ArrayBuffer(256);
   * const buf = new Buffer(arrayBuffer);
   * assertEquals(buf.capacity, 256);
   * ```
   */ get capacity() {
    return this.#buf.buffer.byteLength;
  }
  /**
   * Discards all but the first `n` unread bytes from the buffer but
   * continues to use the same allocated storage. It throws if `n` is
   * negative or greater than the length of the buffer.
   *
   * @param n The number of bytes to keep.
   *
   * @example Basic usage
   * ```ts
   * import { assertEquals } from "@std/assert";
   * import { Buffer } from "@std/streams/buffer";
   *
   * const array = new Uint8Array([0, 1, 2]);
   * const buf = new Buffer(array.buffer);
   * assertEquals(buf.bytes(), array);
   *
   * // Discard all but the first 2 bytes
   * buf.truncate(2);
   * assertEquals(buf.bytes(), array.slice(0, 2));
   * ```
   */ truncate(n) {
    if (n === 0) {
      this.reset();
      return;
    }
    if (n < 0 || n > this.length) {
      throw new RangeError(`Buffer truncation value "${n}" is not between 0 and ${this.length}`);
    }
    this.#reslice(this.#off + n);
  }
  /**
   * Resets to an empty buffer.
   *
   * @example Basic usage
   * ```ts
   * import { assert } from "@std/assert";
   * import { Buffer } from "@std/streams/buffer";
   *
   * const array = new Uint8Array([0, 1, 2]);
   * const buf = new Buffer(array.buffer);
   * assert(!buf.empty());
   *
   * // Reset
   * buf.reset();
   * assert(buf.empty());
   * ```
   */ reset() {
    this.#reslice(0);
    this.#off = 0;
  }
  #tryGrowByReslice(n) {
    const l = this.#buf.byteLength;
    if (n <= this.capacity - l) {
      this.#reslice(l + n);
      return l;
    }
    return -1;
  }
  #reslice(len) {
    this.#buf = new Uint8Array(this.#buf.buffer, 0, len);
  }
  #grow(n) {
    const m = this.length;
    // If buffer is empty, reset to recover space.
    if (m === 0 && this.#off !== 0) {
      this.reset();
    }
    // Fast: Try to grow by means of a reslice.
    const i = this.#tryGrowByReslice(n);
    if (i >= 0) {
      return i;
    }
    const c = this.capacity;
    if (n <= Math.floor(c / 2) - m) {
      // We can slide things down instead of allocating a new
      // ArrayBuffer. We only need m+n <= c to slide, but
      // we instead let capacity get twice as large so we
      // don't spend all our time copying.
      copy(this.#buf.subarray(this.#off), this.#buf);
    } else if (c + n > MAX_SIZE) {
      throw new RangeError(`The buffer cannot grow beyond the maximum size of ${MAX_SIZE}`);
    } else {
      // Not enough space anywhere, we need to allocate.
      const buf = new Uint8Array(Math.min(2 * c + n, MAX_SIZE));
      copy(this.#buf.subarray(this.#off), buf);
      this.#buf = buf;
    }
    // Restore this.#off and len(this.#buf).
    this.#off = 0;
    this.#reslice(Math.min(m + n, MAX_SIZE));
    return m;
  }
  /**
   * Grows the buffer's capacity, if necessary, to guarantee space for
   * another `n` bytes. After `.grow(n)`, at least `n` bytes can be written to
   * the buffer without another allocation. If `n` is negative, `.grow()` will
   * throw. If the buffer can't grow it will throw an error.
   *
   * @param n The number of bytes to grow the buffer by.
   *
   * Based on Go Lang's
   * {@link https://golang.org/pkg/bytes/#Buffer.Grow | Buffer.Grow}.
   *
   * @example Basic usage
   * ```ts
   * import { assert } from "@std/assert";
   * import { assertEquals } from "@std/assert";
   * import { Buffer } from "@std/streams/buffer";
   *
   * const buf = new Buffer();
   * assertEquals(buf.capacity, 0);
   *
   * buf.grow(200);
   * assert(buf.capacity >= 200);
   * ```
   */ grow(n) {
    if (n < 0) {
      throw new RangeError(`Cannot grow buffer as growth must be positive: received ${n}`);
    }
    const m = this.#grow(n);
    this.#reslice(m);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvc3RyZWFtcy8xLjAuMTYvYnVmZmVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGNvcHkgfSBmcm9tIFwianNyOkBzdGQvYnl0ZXNAXjEuMC42L2NvcHlcIjtcblxuY29uc3QgTUFYX1NJWkUgPSAyICoqIDMyIC0gMjtcbmNvbnN0IERFRkFVTFRfQ0hVTktfU0laRSA9IDE2XzY0MDtcblxuLyoqIE9wdGlvbnMgZm9yIHtAbGlua2NvZGUgQnVmZmVyLmJ5dGVzfS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQnVmZmVyQnl0ZXNPcHRpb25zIHtcbiAgLyoqXG4gICAqIElmIHRydWUsIHtAbGlua2NvZGUgQnVmZmVyLmJ5dGVzfSB3aWxsIHJldHVybiBhIGNvcHkgb2YgdGhlIGJ1ZmZlcmVkIGRhdGEuXG4gICAqXG4gICAqIElmIGZhbHNlLCBpdCB3aWxsIHJldHVybiBhIHNsaWNlIHRvIHRoZSBidWZmZXIncyBkYXRhLlxuICAgKlxuICAgKiBAZGVmYXVsdCB7dHJ1ZX1cbiAgICovXG4gIGNvcHk/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIEEgdmFyaWFibGUtc2l6ZWQgYnVmZmVyIG9mIGJ5dGVzIHdpdGggYHJlYWRhYmxlYCBhbmQgYHdyaXRhYmxlYCBnZXR0ZXJzIHRoYXRcbiAqIGFsbG93cyB5b3UgdG8gd29yayB3aXRoIHtAbGluayBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU3RyZWFtc19BUEkgfCBXZWIgU3RyZWFtcyBBUEl9LlxuICpcbiAqIEJ1ZmZlciBpcyBhbG1vc3QgYWx3YXlzIHVzZWQgd2l0aCBzb21lIEkvTyBsaWtlIGZpbGVzIGFuZCBzb2NrZXRzLiBJdCBhbGxvd3NcbiAqIG9uZSB0byBidWZmZXIgdXAgYSBkb3dubG9hZCBmcm9tIGEgc29ja2V0LiBCdWZmZXIgZ3Jvd3MgYW5kIHNocmlua3MgYXNcbiAqIG5lY2Vzc2FyeS5cbiAqXG4gKiBCdWZmZXIgaXMgTk9UIHRoZSBzYW1lIHRoaW5nIGFzIE5vZGUncyBCdWZmZXIuIE5vZGUncyBCdWZmZXIgd2FzIGNyZWF0ZWQgaW5cbiAqIDIwMDkgYmVmb3JlIEphdmFTY3JpcHQgaGFkIHRoZSBjb25jZXB0IG9mIEFycmF5QnVmZmVycy4gSXQncyBzaW1wbHkgYVxuICogbm9uLXN0YW5kYXJkIEFycmF5QnVmZmVyLlxuICpcbiAqIEFycmF5QnVmZmVyIGlzIGEgZml4ZWQgbWVtb3J5IGFsbG9jYXRpb24uIEJ1ZmZlciBpcyBpbXBsZW1lbnRlZCBvbiB0b3Agb2ZcbiAqIEFycmF5QnVmZmVyLlxuICpcbiAqIEJhc2VkIG9uIHtAbGluayBodHRwczovL2dvbGFuZy5vcmcvcGtnL2J5dGVzLyNCdWZmZXIgfCBHbyBCdWZmZXJ9LlxuICpcbiAqIEBleGFtcGxlIEJ1ZmZlciBpbnB1dCBieXRlcyBhbmQgY29udmVydCBpdCB0byBhIHN0cmluZ1xuICogYGBgdHNcbiAqIGltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJAc3RkL3N0cmVhbXMvYnVmZmVyXCI7XG4gKiBpbXBvcnQgeyB0b1RleHQgfSBmcm9tIFwiQHN0ZC9zdHJlYW1zL3RvLXRleHRcIjtcbiAqIGltcG9ydCB7IGFzc2VydCB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogLy8gQ3JlYXRlIGEgbmV3IGJ1ZmZlclxuICogY29uc3QgYnVmID0gbmV3IEJ1ZmZlcigpO1xuICogYXNzZXJ0RXF1YWxzKGJ1Zi5jYXBhY2l0eSwgMCk7XG4gKiBhc3NlcnRFcXVhbHMoYnVmLmxlbmd0aCwgMCk7XG4gKlxuICogLy8gRHVtbXkgaW5wdXQgc3RyZWFtXG4gKiBjb25zdCBpbnB1dFN0cmVhbSA9IFJlYWRhYmxlU3RyZWFtLmZyb20oW1xuICogICBcImhlbGxvLCBcIixcbiAqICAgXCJ3b3JsZFwiLFxuICogICBcIiFcIixcbiAqIF0pO1xuICpcbiAqIC8vIFBpcGUgdGhlIGlucHV0IHN0cmVhbSB0byB0aGUgYnVmZmVyXG4gKiBhd2FpdCBpbnB1dFN0cmVhbS5waXBlVGhyb3VnaChuZXcgVGV4dEVuY29kZXJTdHJlYW0oKSkucGlwZVRvKGJ1Zi53cml0YWJsZSk7XG4gKiBhc3NlcnQoYnVmLmNhcGFjaXR5ID4gMCk7XG4gKiBhc3NlcnQoYnVmLmxlbmd0aCA+IDApO1xuICpcbiAqIC8vIENvbnZlcnQgdGhlIGJ1ZmZlcmVkIGJ5dGVzIHRvIGEgc3RyaW5nXG4gKiBjb25zdCByZXN1bHQgPSBhd2FpdCB0b1RleHQoYnVmLnJlYWRhYmxlKTtcbiAqIGFzc2VydEVxdWFscyhyZXN1bHQsIFwiaGVsbG8sIHdvcmxkIVwiKTtcbiAqIGFzc2VydChidWYuZW1wdHkoKSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIEJ1ZmZlciB7XG4gICNidWY6IFVpbnQ4QXJyYXk7IC8vIGNvbnRlbnRzIGFyZSB0aGUgYnl0ZXMgYnVmW29mZiA6IGxlbihidWYpXVxuICAjb2ZmID0gMDsgLy8gcmVhZCBhdCBidWZbb2ZmXSwgd3JpdGUgYXQgYnVmW2J1Zi5ieXRlTGVuZ3RoXVxuICAjcmVhZGFibGU6IFJlYWRhYmxlU3RyZWFtPFVpbnQ4QXJyYXk+ID0gbmV3IFJlYWRhYmxlU3RyZWFtKHtcbiAgICB0eXBlOiBcImJ5dGVzXCIsXG4gICAgcHVsbDogKGNvbnRyb2xsZXIpID0+IHtcbiAgICAgIGNvbnN0IHZpZXcgPSBuZXcgVWludDhBcnJheShjb250cm9sbGVyLmJ5b2JSZXF1ZXN0IS52aWV3IS5idWZmZXIpO1xuICAgICAgaWYgKHRoaXMuZW1wdHkoKSkge1xuICAgICAgICAvLyBCdWZmZXIgaXMgZW1wdHksIHJlc2V0IHRvIHJlY292ZXIgc3BhY2UuXG4gICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgY29udHJvbGxlci5jbG9zZSgpO1xuICAgICAgICBjb250cm9sbGVyLmJ5b2JSZXF1ZXN0IS5yZXNwb25kKDApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBucmVhZCA9IGNvcHkodGhpcy4jYnVmLnN1YmFycmF5KHRoaXMuI29mZiksIHZpZXcpO1xuICAgICAgdGhpcy4jb2ZmICs9IG5yZWFkO1xuICAgICAgY29udHJvbGxlci5ieW9iUmVxdWVzdCEucmVzcG9uZChucmVhZCk7XG4gICAgfSxcbiAgICBhdXRvQWxsb2NhdGVDaHVua1NpemU6IERFRkFVTFRfQ0hVTktfU0laRSxcbiAgfSk7XG5cbiAgLyoqXG4gICAqIEdldHRlciByZXR1cm5pbmcgdGhlIGluc3RhbmNlJ3Mge0BsaW5rY29kZSBSZWFkYWJsZVN0cmVhbX0uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgYFJlYWRhYmxlU3RyZWFtYCBvZiB0aGUgYnVmZmVyLlxuICAgKlxuICAgKiBAZXhhbXBsZSBSZWFkIHRoZSBjb250ZW50IG91dCBvZiB0aGUgYnVmZmVyIHRvIHN0ZG91dFxuICAgKiBgYGB0cyBpZ25vcmVcbiAgICogaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIkBzdGQvc3RyZWFtcy9idWZmZXJcIjtcbiAgICpcbiAgICogY29uc3QgYnVmID0gbmV3IEJ1ZmZlcigpO1xuICAgKiBhd2FpdCBidWYucmVhZGFibGUucGlwZVRvKERlbm8uc3Rkb3V0LndyaXRhYmxlKTtcbiAgICogYGBgXG4gICAqL1xuICBnZXQgcmVhZGFibGUoKTogUmVhZGFibGVTdHJlYW08VWludDhBcnJheT4ge1xuICAgIHJldHVybiB0aGlzLiNyZWFkYWJsZTtcbiAgfVxuXG4gICN3cml0YWJsZSA9IG5ldyBXcml0YWJsZVN0cmVhbTxVaW50OEFycmF5Pih7XG4gICAgd3JpdGU6IChjaHVuaykgPT4ge1xuICAgICAgY29uc3QgbSA9IHRoaXMuI2dyb3coY2h1bmsuYnl0ZUxlbmd0aCk7XG4gICAgICBjb3B5KGNodW5rLCB0aGlzLiNidWYsIG0pO1xuICAgIH0sXG4gIH0pO1xuXG4gIC8qKlxuICAgKiBHZXR0ZXIgcmV0dXJuaW5nIHRoZSBpbnN0YW5jZSdzIHtAbGlua2NvZGUgV3JpdGFibGVTdHJlYW19LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGBXcml0YWJsZVN0cmVhbWAgb2YgdGhlIGJ1ZmZlci5cbiAgICpcbiAgICogQGV4YW1wbGUgV3JpdGUgdGhlIGRhdGEgZnJvbSBzdGRpbiB0byB0aGUgYnVmZmVyXG4gICAqIGBgYHRzIGlnbm9yZVxuICAgKiBpbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiQHN0ZC9zdHJlYW1zL2J1ZmZlclwiO1xuICAgKlxuICAgKiBjb25zdCBidWYgPSBuZXcgQnVmZmVyKCk7XG4gICAqIGF3YWl0IERlbm8uc3RkaW4ucmVhZGFibGUucGlwZVRvKGJ1Zi53cml0YWJsZSk7XG4gICAqIGBgYFxuICAgKi9cbiAgZ2V0IHdyaXRhYmxlKCk6IFdyaXRhYmxlU3RyZWFtPFVpbnQ4QXJyYXk+IHtcbiAgICByZXR1cm4gdGhpcy4jd3JpdGFibGU7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0cyBhIG5ldyBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIGFiIEFuIG9wdGlvbmFsIGJ1ZmZlciB0byB1c2UgYXMgdGhlIGluaXRpYWwgYnVmZmVyLlxuICAgKi9cbiAgY29uc3RydWN0b3IoYWI/OiBBcnJheUJ1ZmZlckxpa2UgfCBBcnJheUxpa2U8bnVtYmVyPikge1xuICAgIGlmIChhYiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLiNidWYgPSBuZXcgVWludDhBcnJheSgwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jYnVmID0gbmV3IFVpbnQ4QXJyYXkoYWIgYXMgQXJyYXlCdWZmZXIgfCBTaGFyZWRBcnJheUJ1ZmZlcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBzbGljZSBob2xkaW5nIHRoZSB1bnJlYWQgcG9ydGlvbiBvZiB0aGUgYnVmZmVyLlxuICAgKlxuICAgKiBUaGUgc2xpY2UgaXMgdmFsaWQgZm9yIHVzZSBvbmx5IHVudGlsIHRoZSBuZXh0IGJ1ZmZlciBtb2RpZmljYXRpb24gKHRoYXRcbiAgICogaXMsIG9ubHkgdW50aWwgdGhlIG5leHQgY2FsbCB0byBhIG1ldGhvZCB0aGF0IG11dGF0ZXMgb3IgY29uc3VtZXMgdGhlXG4gICAqIGJ1ZmZlciwgbGlrZSByZWFkaW5nIGRhdGEgb3V0IHZpYSBgcmVhZGFibGVgLCBgcmVzZXQoKWAsIG9yIGB0cnVuY2F0ZSgpYCkuXG4gICAqXG4gICAqIElmIGBvcHRpb25zLmNvcHlgIGlzIGZhbHNlIHRoZSBzbGljZSBhbGlhc2VzIHRoZSBidWZmZXIgY29udGVudCBhdCBsZWFzdFxuICAgKiB1bnRpbCB0aGUgbmV4dCBidWZmZXIgbW9kaWZpY2F0aW9uLCBzbyBpbW1lZGlhdGUgY2hhbmdlcyB0byB0aGUgc2xpY2Ugd2lsbFxuICAgKiBhZmZlY3QgdGhlIHJlc3VsdCBvZiBmdXR1cmUgcmVhZHMuIElmIGBvcHRpb25zYCBpcyBub3QgcHJvdmlkZWQsXG4gICAqIGBvcHRpb25zLmNvcHlgIGRlZmF1bHRzIHRvIGB0cnVlYC5cbiAgICpcbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyBmb3IgdGhlIGJ5dGVzIG1ldGhvZC5cbiAgICogQHJldHVybnMgQSBjb3B5IG9yIGEgc2xpY2Ugb2YgdGhlIGJ1ZmZlci5cbiAgICpcbiAgICogQGV4YW1wbGUgQ29weSB0aGUgYnVmZmVyXG4gICAqIGBgYHRzXG4gICAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICAgKiBpbXBvcnQgeyBhc3NlcnROb3RFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAgICogaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIkBzdGQvc3RyZWFtcy9idWZmZXJcIjtcbiAgICpcbiAgICogY29uc3QgYXJyYXkgPSBuZXcgVWludDhBcnJheShbMCwgMSwgMl0pO1xuICAgKiBjb25zdCBidWYgPSBuZXcgQnVmZmVyKGFycmF5LmJ1ZmZlcik7XG4gICAqIGNvbnN0IGNvcGllZCA9IGJ1Zi5ieXRlcygpO1xuICAgKiBhc3NlcnRFcXVhbHMoY29waWVkLmxlbmd0aCwgYXJyYXkubGVuZ3RoKTtcbiAgICpcbiAgICogLy8gTW9kaWZ5IGFuIGVsZW1lbnQgaW4gdGhlIG9yaWdpbmFsIGFycmF5XG4gICAqIGFycmF5WzFdID0gOTk7XG4gICAqIGFzc2VydEVxdWFscyhjb3BpZWRbMF0sIGFycmF5WzBdKTtcbiAgICogLy8gVGhlIGNvcGllZCBidWZmZXIgaXMgbm90IGFmZmVjdGVkIGJ5IHRoZSBtb2RpZmljYXRpb25cbiAgICogYXNzZXJ0Tm90RXF1YWxzKGNvcGllZFsxXSwgYXJyYXlbMV0pO1xuICAgKiBhc3NlcnRFcXVhbHMoY29waWVkWzJdLCBhcnJheVsyXSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZXhhbXBsZSBHZXQgYSBzbGljZSB0byB0aGUgYnVmZmVyXG4gICAqIGBgYHRzXG4gICAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICAgKiBpbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiQHN0ZC9zdHJlYW1zL2J1ZmZlclwiO1xuICAgKlxuICAgKiBjb25zdCBhcnJheSA9IG5ldyBVaW50OEFycmF5KFswLCAxLCAyXSk7XG4gICAqIGNvbnN0IGJ1ZiA9IG5ldyBCdWZmZXIoYXJyYXkuYnVmZmVyKTtcbiAgICogY29uc3Qgc2xpY2UgPSBidWYuYnl0ZXMoeyBjb3B5OiBmYWxzZSB9KTtcbiAgICogYXNzZXJ0RXF1YWxzKHNsaWNlLmxlbmd0aCwgYXJyYXkubGVuZ3RoKTtcbiAgICpcbiAgICogLy8gTW9kaWZ5IGFuIGVsZW1lbnQgaW4gdGhlIG9yaWdpbmFsIGFycmF5XG4gICAqIGFycmF5WzFdID0gOTk7XG4gICAqIGFzc2VydEVxdWFscyhzbGljZVswXSwgYXJyYXlbMF0pO1xuICAgKiAvLyBUaGUgc2xpY2UgX2lzXyBhZmZlY3RlZCBieSB0aGUgbW9kaWZpY2F0aW9uXG4gICAqIGFzc2VydEVxdWFscyhzbGljZVsxXSwgYXJyYXlbMV0pO1xuICAgKiBhc3NlcnRFcXVhbHMoc2xpY2VbMl0sIGFycmF5WzJdKTtcbiAgICogYGBgXG4gICAqL1xuICBieXRlcyhvcHRpb25zOiBCdWZmZXJCeXRlc09wdGlvbnMgPSB7IGNvcHk6IHRydWUgfSk6IFVpbnQ4QXJyYXkge1xuICAgIGlmIChvcHRpb25zLmNvcHkgPT09IGZhbHNlKSByZXR1cm4gdGhpcy4jYnVmLnN1YmFycmF5KHRoaXMuI29mZik7XG4gICAgcmV0dXJuIHRoaXMuI2J1Zi5zbGljZSh0aGlzLiNvZmYpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgd2hldGhlciB0aGUgdW5yZWFkIHBvcnRpb24gb2YgdGhlIGJ1ZmZlciBpcyBlbXB0eS5cbiAgICpcbiAgICogQHJldHVybnMgV2hldGhlciB0aGUgYnVmZmVyIGlzIGVtcHR5LlxuICAgKlxuICAgKiBAZXhhbXBsZSBFbXB0eSBidWZmZXJcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gICAqIGltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJAc3RkL3N0cmVhbXMvYnVmZmVyXCI7XG4gICAqXG4gICAqIGNvbnN0IGJ1ZiA9IG5ldyBCdWZmZXIoKTtcbiAgICogYXNzZXJ0KGJ1Zi5lbXB0eSgpKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBleGFtcGxlIE5vbi1lbXB0eSBidWZmZXJcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gICAqIGltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJAc3RkL3N0cmVhbXMvYnVmZmVyXCI7XG4gICAqXG4gICAqIGNvbnN0IGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoWzQyXSk7XG4gICAqIGNvbnN0IGJ1ZiA9IG5ldyBCdWZmZXIoYXJyYXkuYnVmZmVyKTtcbiAgICogYXNzZXJ0KCFidWYuZW1wdHkoKSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZXhhbXBsZSBOb24tZW1wdHksIGJ1dCB0aGUgY29udGVudCB3YXMgYWxyZWFkeSByZWFkXG4gICAqIGBgYHRzIGlnbm9yZVxuICAgKiBpbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAgICogaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIkBzdGQvc3RyZWFtcy9idWZmZXJcIjtcbiAgICpcbiAgICogY29uc3QgYXJyYXkgPSBuZXcgVWludDhBcnJheShbNDJdKTtcbiAgICogY29uc3QgYnVmID0gbmV3IEJ1ZmZlcihhcnJheS5idWZmZXIpO1xuICAgKiBhc3NlcnQoIWJ1Zi5lbXB0eSgpKTtcbiAgICogLy8gUmVhZCB0aGUgY29udGVudCBvdXQgb2YgdGhlIGJ1ZmZlclxuICAgKiBhd2FpdCBidWYucmVhZGFibGUucGlwZVRvKERlbm8uc3Rkb3V0LndyaXRhYmxlKTtcbiAgICogLy8gVGhlIGJ1ZmZlciBpcyBub3cgZW1wdHlcbiAgICogYXNzZXJ0KGJ1Zi5lbXB0eSgpKTtcbiAgICogYGBgXG4gICAqL1xuICBlbXB0eSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4jYnVmLmJ5dGVMZW5ndGggPD0gdGhpcy4jb2ZmO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcmVhZCBvbmx5IG51bWJlciBvZiBieXRlcyBvZiB0aGUgdW5yZWFkIHBvcnRpb24gb2YgdGhlIGJ1ZmZlci5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG51bWJlciBvZiBieXRlcyBpbiB0aGUgdW5yZWFkIHBvcnRpb24gb2YgdGhlIGJ1ZmZlci5cbiAgICpcbiAgICogQGV4YW1wbGUgQmFzaWMgdXNhZ2VcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gICAqIGltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJAc3RkL3N0cmVhbXMvYnVmZmVyXCI7XG4gICAqXG4gICAqIGNvbnN0IGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoWzAsIDEsIDJdKTtcbiAgICogY29uc3QgYnVmID0gbmV3IEJ1ZmZlcihhcnJheS5idWZmZXIpO1xuICAgKiBhc3NlcnRFcXVhbHMoYnVmLmxlbmd0aCwgMyk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZXhhbXBsZSBMZW5ndGggYmVjb21lcyAwIGFmdGVyIHRoZSBjb250ZW50IGlzIHJlYWRcbiAgICogYGBgdHMgaWdub3JlXG4gICAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICAgKiBpbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiQHN0ZC9zdHJlYW1zL2J1ZmZlclwiO1xuICAgKlxuICAgKiBjb25zdCBhcnJheSA9IG5ldyBVaW50OEFycmF5KFs0Ml0pO1xuICAgKiBjb25zdCBidWYgPSBuZXcgQnVmZmVyKGFycmF5LmJ1ZmZlcik7XG4gICAqIGFzc2VydEVxdWFscyhidWYubGVuZ3RoLCAxKTtcbiAgICogLy8gUmVhZCB0aGUgY29udGVudCBvdXQgb2YgdGhlIGJ1ZmZlclxuICAgKiBhd2FpdCBidWYucmVhZGFibGUucGlwZVRvKERlbm8uc3Rkb3V0LndyaXRhYmxlKTtcbiAgICogLy8gVGhlIGxlbmd0aCBpcyBub3cgMFxuICAgKiBhc3NlcnRFcXVhbHMoYnVmLmxlbmd0aCwgMCk7XG4gICAqIGBgYFxuICAgKi9cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLiNidWYuYnl0ZUxlbmd0aCAtIHRoaXMuI29mZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgcmVhZCBvbmx5IGNhcGFjaXR5IG9mIHRoZSBidWZmZXIncyB1bmRlcmx5aW5nIGJ5dGUgc2xpY2UsIHRoYXQgaXMsXG4gICAqIHRoZSB0b3RhbCBzcGFjZSBhbGxvY2F0ZWQgZm9yIHRoZSBidWZmZXIncyBkYXRhLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbnVtYmVyIG9mIGFsbG9jYXRlZCBieXRlcyBmb3IgdGhlIGJ1ZmZlci5cbiAgICpcbiAgICogQGV4YW1wbGUgQmFzaWMgdXNhZ2VcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gICAqIGltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJAc3RkL3N0cmVhbXMvYnVmZmVyXCI7XG4gICAqXG4gICAqIGNvbnN0IGFycmF5QnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKDI1Nik7XG4gICAqIGNvbnN0IGJ1ZiA9IG5ldyBCdWZmZXIoYXJyYXlCdWZmZXIpO1xuICAgKiBhc3NlcnRFcXVhbHMoYnVmLmNhcGFjaXR5LCAyNTYpO1xuICAgKiBgYGBcbiAgICovXG4gIGdldCBjYXBhY2l0eSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLiNidWYuYnVmZmVyLmJ5dGVMZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogRGlzY2FyZHMgYWxsIGJ1dCB0aGUgZmlyc3QgYG5gIHVucmVhZCBieXRlcyBmcm9tIHRoZSBidWZmZXIgYnV0XG4gICAqIGNvbnRpbnVlcyB0byB1c2UgdGhlIHNhbWUgYWxsb2NhdGVkIHN0b3JhZ2UuIEl0IHRocm93cyBpZiBgbmAgaXNcbiAgICogbmVnYXRpdmUgb3IgZ3JlYXRlciB0aGFuIHRoZSBsZW5ndGggb2YgdGhlIGJ1ZmZlci5cbiAgICpcbiAgICogQHBhcmFtIG4gVGhlIG51bWJlciBvZiBieXRlcyB0byBrZWVwLlxuICAgKlxuICAgKiBAZXhhbXBsZSBCYXNpYyB1c2FnZVxuICAgKiBgYGB0c1xuICAgKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAgICogaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIkBzdGQvc3RyZWFtcy9idWZmZXJcIjtcbiAgICpcbiAgICogY29uc3QgYXJyYXkgPSBuZXcgVWludDhBcnJheShbMCwgMSwgMl0pO1xuICAgKiBjb25zdCBidWYgPSBuZXcgQnVmZmVyKGFycmF5LmJ1ZmZlcik7XG4gICAqIGFzc2VydEVxdWFscyhidWYuYnl0ZXMoKSwgYXJyYXkpO1xuICAgKlxuICAgKiAvLyBEaXNjYXJkIGFsbCBidXQgdGhlIGZpcnN0IDIgYnl0ZXNcbiAgICogYnVmLnRydW5jYXRlKDIpO1xuICAgKiBhc3NlcnRFcXVhbHMoYnVmLmJ5dGVzKCksIGFycmF5LnNsaWNlKDAsIDIpKTtcbiAgICogYGBgXG4gICAqL1xuICB0cnVuY2F0ZShuOiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZiAobiA9PT0gMCkge1xuICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobiA8IDAgfHwgbiA+IHRoaXMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcbiAgICAgICAgYEJ1ZmZlciB0cnVuY2F0aW9uIHZhbHVlIFwiJHtufVwiIGlzIG5vdCBiZXR3ZWVuIDAgYW5kICR7dGhpcy5sZW5ndGh9YCxcbiAgICAgICk7XG4gICAgfVxuICAgIHRoaXMuI3Jlc2xpY2UodGhpcy4jb2ZmICsgbik7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXRzIHRvIGFuIGVtcHR5IGJ1ZmZlci5cbiAgICpcbiAgICogQGV4YW1wbGUgQmFzaWMgdXNhZ2VcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gICAqIGltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJAc3RkL3N0cmVhbXMvYnVmZmVyXCI7XG4gICAqXG4gICAqIGNvbnN0IGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoWzAsIDEsIDJdKTtcbiAgICogY29uc3QgYnVmID0gbmV3IEJ1ZmZlcihhcnJheS5idWZmZXIpO1xuICAgKiBhc3NlcnQoIWJ1Zi5lbXB0eSgpKTtcbiAgICpcbiAgICogLy8gUmVzZXRcbiAgICogYnVmLnJlc2V0KCk7XG4gICAqIGFzc2VydChidWYuZW1wdHkoKSk7XG4gICAqIGBgYFxuICAgKi9cbiAgcmVzZXQoKSB7XG4gICAgdGhpcy4jcmVzbGljZSgwKTtcbiAgICB0aGlzLiNvZmYgPSAwO1xuICB9XG5cbiAgI3RyeUdyb3dCeVJlc2xpY2UobjogbnVtYmVyKSB7XG4gICAgY29uc3QgbCA9IHRoaXMuI2J1Zi5ieXRlTGVuZ3RoO1xuICAgIGlmIChuIDw9IHRoaXMuY2FwYWNpdHkgLSBsKSB7XG4gICAgICB0aGlzLiNyZXNsaWNlKGwgKyBuKTtcbiAgICAgIHJldHVybiBsO1xuICAgIH1cbiAgICByZXR1cm4gLTE7XG4gIH1cblxuICAjcmVzbGljZShsZW46IG51bWJlcikge1xuICAgIHRoaXMuI2J1ZiA9IG5ldyBVaW50OEFycmF5KHRoaXMuI2J1Zi5idWZmZXIsIDAsIGxlbik7XG4gIH1cblxuICAjZ3JvdyhuOiBudW1iZXIpIHtcbiAgICBjb25zdCBtID0gdGhpcy5sZW5ndGg7XG4gICAgLy8gSWYgYnVmZmVyIGlzIGVtcHR5LCByZXNldCB0byByZWNvdmVyIHNwYWNlLlxuICAgIGlmIChtID09PSAwICYmIHRoaXMuI29mZiAhPT0gMCkge1xuICAgICAgdGhpcy5yZXNldCgpO1xuICAgIH1cbiAgICAvLyBGYXN0OiBUcnkgdG8gZ3JvdyBieSBtZWFucyBvZiBhIHJlc2xpY2UuXG4gICAgY29uc3QgaSA9IHRoaXMuI3RyeUdyb3dCeVJlc2xpY2Uobik7XG4gICAgaWYgKGkgPj0gMCkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICAgIGNvbnN0IGMgPSB0aGlzLmNhcGFjaXR5O1xuICAgIGlmIChuIDw9IE1hdGguZmxvb3IoYyAvIDIpIC0gbSkge1xuICAgICAgLy8gV2UgY2FuIHNsaWRlIHRoaW5ncyBkb3duIGluc3RlYWQgb2YgYWxsb2NhdGluZyBhIG5ld1xuICAgICAgLy8gQXJyYXlCdWZmZXIuIFdlIG9ubHkgbmVlZCBtK24gPD0gYyB0byBzbGlkZSwgYnV0XG4gICAgICAvLyB3ZSBpbnN0ZWFkIGxldCBjYXBhY2l0eSBnZXQgdHdpY2UgYXMgbGFyZ2Ugc28gd2VcbiAgICAgIC8vIGRvbid0IHNwZW5kIGFsbCBvdXIgdGltZSBjb3B5aW5nLlxuICAgICAgY29weSh0aGlzLiNidWYuc3ViYXJyYXkodGhpcy4jb2ZmKSwgdGhpcy4jYnVmKTtcbiAgICB9IGVsc2UgaWYgKGMgKyBuID4gTUFYX1NJWkUpIHtcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFxuICAgICAgICBgVGhlIGJ1ZmZlciBjYW5ub3QgZ3JvdyBiZXlvbmQgdGhlIG1heGltdW0gc2l6ZSBvZiAke01BWF9TSVpFfWAsXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBOb3QgZW5vdWdoIHNwYWNlIGFueXdoZXJlLCB3ZSBuZWVkIHRvIGFsbG9jYXRlLlxuICAgICAgY29uc3QgYnVmID0gbmV3IFVpbnQ4QXJyYXkoTWF0aC5taW4oMiAqIGMgKyBuLCBNQVhfU0laRSkpO1xuICAgICAgY29weSh0aGlzLiNidWYuc3ViYXJyYXkodGhpcy4jb2ZmKSwgYnVmKTtcbiAgICAgIHRoaXMuI2J1ZiA9IGJ1ZjtcbiAgICB9XG4gICAgLy8gUmVzdG9yZSB0aGlzLiNvZmYgYW5kIGxlbih0aGlzLiNidWYpLlxuICAgIHRoaXMuI29mZiA9IDA7XG4gICAgdGhpcy4jcmVzbGljZShNYXRoLm1pbihtICsgbiwgTUFYX1NJWkUpKTtcbiAgICByZXR1cm4gbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHcm93cyB0aGUgYnVmZmVyJ3MgY2FwYWNpdHksIGlmIG5lY2Vzc2FyeSwgdG8gZ3VhcmFudGVlIHNwYWNlIGZvclxuICAgKiBhbm90aGVyIGBuYCBieXRlcy4gQWZ0ZXIgYC5ncm93KG4pYCwgYXQgbGVhc3QgYG5gIGJ5dGVzIGNhbiBiZSB3cml0dGVuIHRvXG4gICAqIHRoZSBidWZmZXIgd2l0aG91dCBhbm90aGVyIGFsbG9jYXRpb24uIElmIGBuYCBpcyBuZWdhdGl2ZSwgYC5ncm93KClgIHdpbGxcbiAgICogdGhyb3cuIElmIHRoZSBidWZmZXIgY2FuJ3QgZ3JvdyBpdCB3aWxsIHRocm93IGFuIGVycm9yLlxuICAgKlxuICAgKiBAcGFyYW0gbiBUaGUgbnVtYmVyIG9mIGJ5dGVzIHRvIGdyb3cgdGhlIGJ1ZmZlciBieS5cbiAgICpcbiAgICogQmFzZWQgb24gR28gTGFuZydzXG4gICAqIHtAbGluayBodHRwczovL2dvbGFuZy5vcmcvcGtnL2J5dGVzLyNCdWZmZXIuR3JvdyB8IEJ1ZmZlci5Hcm93fS5cbiAgICpcbiAgICogQGV4YW1wbGUgQmFzaWMgdXNhZ2VcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gICAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydFwiO1xuICAgKiBpbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiQHN0ZC9zdHJlYW1zL2J1ZmZlclwiO1xuICAgKlxuICAgKiBjb25zdCBidWYgPSBuZXcgQnVmZmVyKCk7XG4gICAqIGFzc2VydEVxdWFscyhidWYuY2FwYWNpdHksIDApO1xuICAgKlxuICAgKiBidWYuZ3JvdygyMDApO1xuICAgKiBhc3NlcnQoYnVmLmNhcGFjaXR5ID49IDIwMCk7XG4gICAqIGBgYFxuICAgKi9cbiAgZ3JvdyhuOiBudW1iZXIpIHtcbiAgICBpZiAobiA8IDApIHtcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFxuICAgICAgICBgQ2Fubm90IGdyb3cgYnVmZmVyIGFzIGdyb3d0aCBtdXN0IGJlIHBvc2l0aXZlOiByZWNlaXZlZCAke259YCxcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IG0gPSB0aGlzLiNncm93KG4pO1xuICAgIHRoaXMuI3Jlc2xpY2UobSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBRXJDLFNBQVMsSUFBSSxRQUFRLDZCQUE2QjtBQUVsRCxNQUFNLFdBQVcsS0FBSyxLQUFLO0FBQzNCLE1BQU0scUJBQXFCO0FBYzNCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBOENDLEdBQ0QsT0FBTyxNQUFNO0VBQ1gsQ0FB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
// denoCacheMetadata=8226018024197245364,15016931813192525565