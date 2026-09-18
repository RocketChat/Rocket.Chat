// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { copy } from "jsr:@std/bytes@^1.0.6/copy";
// MIN_READ is the minimum ArrayBuffer size passed to a read call by
// buffer.ReadFrom. As long as the Buffer has at least MIN_READ bytes beyond
// what is required to hold the contents of r, readFrom() will not grow the
// underlying buffer.
const MIN_READ = 32 * 1024;
const MAX_SIZE = 2 ** 32 - 2;
/**
 * A variable-sized buffer of bytes with `read()` and `write()` methods.
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
 * @example Usage
 * ```ts
 * import { Buffer } from "@std/io/buffer";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const buf = new Buffer();
 * await buf.write(new TextEncoder().encode("Hello, "));
 * await buf.write(new TextEncoder().encode("world!"));
 *
 * const data = new Uint8Array(13);
 * await buf.read(data);
 *
 * assertEquals(new TextDecoder().decode(data), "Hello, world!");
 * ```
 */ export class Buffer {
  #buf;
  #off = 0;
  /**
   * Constructs a new instance with the specified {@linkcode ArrayBuffer} as its
   * initial contents.
   *
   * @param ab The ArrayBuffer to use as the initial contents of the buffer.
   */ constructor(ab){
    if (ab === undefined) {
      this.#buf = new Uint8Array(0);
    } else if (ab instanceof SharedArrayBuffer) {
      // Note: This is necessary to avoid type error
      this.#buf = new Uint8Array(ab);
    } else {
      this.#buf = new Uint8Array(ab);
    }
  }
  /**
   * Returns a slice holding the unread portion of the buffer.
   *
   * The slice is valid for use only until the next buffer modification (that
   * is, only until the next call to a method like `read()`, `write()`,
   * `reset()`, or `truncate()`). If `options.copy` is false the slice aliases the buffer content at
   * least until the next buffer modification, so immediate changes to the
   * slice will affect the result of future reads.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * await buf.write(new TextEncoder().encode("Hello, world!"));
   *
   * const slice = buf.bytes();
   * assertEquals(new TextDecoder().decode(slice), "Hello, world!");
   * ```
   *
   * @param options The options for the slice.
   * @returns A slice holding the unread portion of the buffer.
   */ bytes(options = {
    copy: true
  }) {
    if (options.copy === false) return this.#buf.subarray(this.#off);
    return this.#buf.slice(this.#off);
  }
  /**
   * Returns whether the unread portion of the buffer is empty.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * assertEquals(buf.empty(), true);
   * await buf.write(new TextEncoder().encode("Hello, world!"));
   * assertEquals(buf.empty(), false);
   * ```
   *
   * @returns `true` if the unread portion of the buffer is empty, `false`
   *          otherwise.
   */ empty() {
    return this.#buf.byteLength <= this.#off;
  }
  /**
   * A read only number of bytes of the unread portion of the buffer.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * await buf.write(new TextEncoder().encode("Hello, world!"));
   *
   * assertEquals(buf.length, 13);
   * ```
   *
   * @returns The number of bytes of the unread portion of the buffer.
   */ get length() {
    return this.#buf.byteLength - this.#off;
  }
  /**
   * The read only capacity of the buffer's underlying byte slice, that is,
   * the total space allocated for the buffer's data.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * assertEquals(buf.capacity, 0);
   * await buf.write(new TextEncoder().encode("Hello, world!"));
   * assertEquals(buf.capacity, 13);
   * ```
   *
   * @returns The capacity of the buffer.
   */ get capacity() {
    return this.#buf.buffer.byteLength;
  }
  /**
   * Discards all but the first `n` unread bytes from the buffer but
   * continues to use the same allocated storage. It throws if `n` is
   * negative or greater than the length of the buffer.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * await buf.write(new TextEncoder().encode("Hello, world!"));
   * buf.truncate(6);
   * assertEquals(buf.length, 6);
   * ```
   *
   * @param n The number of bytes to keep.
   */ truncate(n) {
    if (n === 0) {
      this.reset();
      return;
    }
    if (n < 0 || n > this.length) {
      throw new Error("Buffer truncation out of range");
    }
    this.#reslice(this.#off + n);
  }
  /**
   * Resets the contents
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * await buf.write(new TextEncoder().encode("Hello, world!"));
   * buf.reset();
   * assertEquals(buf.length, 0);
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
    if (len > this.#buf.buffer.byteLength) {
      throw new RangeError("Length is greater than buffer capacity");
    }
    this.#buf = new Uint8Array(this.#buf.buffer, 0, len);
  }
  /**
   * Reads the next `p.length` bytes from the buffer or until the buffer is
   * drained. Returns the number of bytes read. If the buffer has no data to
   * return, the return is EOF (`null`).
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * await buf.write(new TextEncoder().encode("Hello, world!"));
   *
   * const data = new Uint8Array(5);
   * const res = await buf.read(data);
   *
   * assertEquals(res, 5);
   * assertEquals(new TextDecoder().decode(data), "Hello");
   * ```
   *
   * @param p The buffer to read data into.
   * @returns The number of bytes read.
   */ readSync(p) {
    if (this.empty()) {
      // Buffer is empty, reset to recover space.
      this.reset();
      if (p.byteLength === 0) {
        // this edge case is tested in 'bufferReadEmptyAtEOF' test
        return 0;
      }
      return null;
    }
    const nread = copy(this.#buf.subarray(this.#off), p);
    this.#off += nread;
    return nread;
  }
  /**
   * Reads the next `p.length` bytes from the buffer or until the buffer is
   * drained. Resolves to the number of bytes read. If the buffer has no
   * data to return, resolves to EOF (`null`).
   *
   * NOTE: This methods reads bytes synchronously; it's provided for
   * compatibility with `Reader` interfaces.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * await buf.write(new TextEncoder().encode("Hello, world!"));
   *
   * const data = new Uint8Array(5);
   * const res = await buf.read(data);
   *
   * assertEquals(res, 5);
   * assertEquals(new TextDecoder().decode(data), "Hello");
   * ```
   *
   * @param p The buffer to read data into.
   * @returns The number of bytes read.
   */ read(p) {
    const rr = this.readSync(p);
    return Promise.resolve(rr);
  }
  /**
   * Writes the given data to the buffer.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * const data = new TextEncoder().encode("Hello, world!");
   * buf.writeSync(data);
   *
   * const slice = buf.bytes();
   * assertEquals(new TextDecoder().decode(slice), "Hello, world!");
   * ```
   *
   * @param p The data to write to the buffer.
   * @returns The number of bytes written.
   */ writeSync(p) {
    const m = this.#grow(p.byteLength);
    return copy(p, this.#buf, m);
  }
  /**
   * Writes the given data to the buffer. Resolves to the number of bytes
   * written.
   *
   * > [!NOTE]
   * > This methods writes bytes synchronously; it's provided for compatibility
   * > with the {@linkcode Writer} interface.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * const data = new TextEncoder().encode("Hello, world!");
   * await buf.write(data);
   *
   * const slice = buf.bytes();
   * assertEquals(new TextDecoder().decode(slice), "Hello, world!");
   * ```
   *
   * @param p The data to write to the buffer.
   * @returns The number of bytes written.
   */ write(p) {
    const n = this.writeSync(p);
    return Promise.resolve(n);
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
      throw new Error(`The buffer cannot be grown beyond the maximum size of "${MAX_SIZE}"`);
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
  /** Grows the buffer's capacity, if necessary, to guarantee space for
   * another `n` bytes. After `.grow(n)`, at least `n` bytes can be written to
   * the buffer without another allocation. If `n` is negative, `.grow()` will
   * throw. If the buffer can't grow it will throw an error.
   *
   * Based on Go Lang's
   * {@link https://golang.org/pkg/bytes/#Buffer.Grow | Buffer.Grow}.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * buf.grow(10);
   * assertEquals(buf.capacity, 10);
   * ```
   *
   * @param n The number of bytes to grow the buffer by.
   */ grow(n) {
    if (n < 0) {
      throw new Error("Buffer growth cannot be negative");
    }
    const m = this.#grow(n);
    this.#reslice(m);
  }
  /**
   * Reads data from `r` until EOF (`null`) and appends it to the buffer,
   * growing the buffer as needed. It resolves to the number of bytes read.
   * If the buffer becomes too large, `.readFrom()` will reject with an error.
   *
   * Based on Go Lang's
   * {@link https://golang.org/pkg/bytes/#Buffer.ReadFrom | Buffer.ReadFrom}.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * const r = new Buffer(new TextEncoder().encode("Hello, world!"));
   * const n = await buf.readFrom(r);
   *
   * assertEquals(n, 13);
   * ```
   *
   * @param r The reader to read from.
   * @returns The number of bytes read.
   */ async readFrom(r) {
    let n = 0;
    const tmp = new Uint8Array(MIN_READ);
    while(true){
      const shouldGrow = this.capacity - this.length < MIN_READ;
      // read into tmp buffer if there's not enough room
      // otherwise read directly into the internal buffer
      const buf = shouldGrow ? tmp : new Uint8Array(this.#buf.buffer, this.length);
      const nread = await r.read(buf);
      if (nread === null) {
        return n;
      }
      // write will grow if needed
      if (shouldGrow) this.writeSync(buf.subarray(0, nread));
      else this.#reslice(this.length + nread);
      n += nread;
    }
  }
  /** Reads data from `r` until EOF (`null`) and appends it to the buffer,
   * growing the buffer as needed. It returns the number of bytes read. If the
   * buffer becomes too large, `.readFromSync()` will throw an error.
   *
   * Based on Go Lang's
   * {@link https://golang.org/pkg/bytes/#Buffer.ReadFrom | Buffer.ReadFrom}.
   *
   * @example Usage
   * ```ts
   * import { Buffer } from "@std/io/buffer";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const buf = new Buffer();
   * const r = new Buffer(new TextEncoder().encode("Hello, world!"));
   * const n = buf.readFromSync(r);
   *
   * assertEquals(n, 13);
   * ```
   *
   * @param r The reader to read from.
   * @returns The number of bytes read.
   */ readFromSync(r) {
    let n = 0;
    const tmp = new Uint8Array(MIN_READ);
    while(true){
      const shouldGrow = this.capacity - this.length < MIN_READ;
      // read into tmp buffer if there's not enough room
      // otherwise read directly into the internal buffer
      const buf = shouldGrow ? tmp : new Uint8Array(this.#buf.buffer, this.length);
      const nread = r.readSync(buf);
      if (nread === null) {
        return n;
      }
      // write will grow if needed
      if (shouldGrow) this.writeSync(buf.subarray(0, nread));
      else this.#reslice(this.length + nread);
      n += nread;
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvaW8vMC4yMjUuMy9idWZmZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNiB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW1wb3J0IHsgY29weSB9IGZyb20gXCJqc3I6QHN0ZC9ieXRlc0BeMS4wLjYvY29weVwiO1xuaW1wb3J0IHR5cGUgeyBSZWFkZXIsIFJlYWRlclN5bmMsIFdyaXRlciwgV3JpdGVyU3luYyB9IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5cbi8vIE1JTl9SRUFEIGlzIHRoZSBtaW5pbXVtIEFycmF5QnVmZmVyIHNpemUgcGFzc2VkIHRvIGEgcmVhZCBjYWxsIGJ5XG4vLyBidWZmZXIuUmVhZEZyb20uIEFzIGxvbmcgYXMgdGhlIEJ1ZmZlciBoYXMgYXQgbGVhc3QgTUlOX1JFQUQgYnl0ZXMgYmV5b25kXG4vLyB3aGF0IGlzIHJlcXVpcmVkIHRvIGhvbGQgdGhlIGNvbnRlbnRzIG9mIHIsIHJlYWRGcm9tKCkgd2lsbCBub3QgZ3JvdyB0aGVcbi8vIHVuZGVybHlpbmcgYnVmZmVyLlxuY29uc3QgTUlOX1JFQUQgPSAzMiAqIDEwMjQ7XG5jb25zdCBNQVhfU0laRSA9IDIgKiogMzIgLSAyO1xuXG4vKipcbiAqIEEgdmFyaWFibGUtc2l6ZWQgYnVmZmVyIG9mIGJ5dGVzIHdpdGggYHJlYWQoKWAgYW5kIGB3cml0ZSgpYCBtZXRob2RzLlxuICpcbiAqIEJ1ZmZlciBpcyBhbG1vc3QgYWx3YXlzIHVzZWQgd2l0aCBzb21lIEkvTyBsaWtlIGZpbGVzIGFuZCBzb2NrZXRzLiBJdCBhbGxvd3NcbiAqIG9uZSB0byBidWZmZXIgdXAgYSBkb3dubG9hZCBmcm9tIGEgc29ja2V0LiBCdWZmZXIgZ3Jvd3MgYW5kIHNocmlua3MgYXNcbiAqIG5lY2Vzc2FyeS5cbiAqXG4gKiBCdWZmZXIgaXMgTk9UIHRoZSBzYW1lIHRoaW5nIGFzIE5vZGUncyBCdWZmZXIuIE5vZGUncyBCdWZmZXIgd2FzIGNyZWF0ZWQgaW5cbiAqIDIwMDkgYmVmb3JlIEphdmFTY3JpcHQgaGFkIHRoZSBjb25jZXB0IG9mIEFycmF5QnVmZmVycy4gSXQncyBzaW1wbHkgYVxuICogbm9uLXN0YW5kYXJkIEFycmF5QnVmZmVyLlxuICpcbiAqIEFycmF5QnVmZmVyIGlzIGEgZml4ZWQgbWVtb3J5IGFsbG9jYXRpb24uIEJ1ZmZlciBpcyBpbXBsZW1lbnRlZCBvbiB0b3Agb2ZcbiAqIEFycmF5QnVmZmVyLlxuICpcbiAqIEJhc2VkIG9uIHtAbGluayBodHRwczovL2dvbGFuZy5vcmcvcGtnL2J5dGVzLyNCdWZmZXIgfCBHbyBCdWZmZXJ9LlxuICpcbiAqIEBleGFtcGxlIFVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIkBzdGQvaW8vYnVmZmVyXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnQvZXF1YWxzXCI7XG4gKlxuICogY29uc3QgYnVmID0gbmV3IEJ1ZmZlcigpO1xuICogYXdhaXQgYnVmLndyaXRlKG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkhlbGxvLCBcIikpO1xuICogYXdhaXQgYnVmLndyaXRlKG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIndvcmxkIVwiKSk7XG4gKlxuICogY29uc3QgZGF0YSA9IG5ldyBVaW50OEFycmF5KDEzKTtcbiAqIGF3YWl0IGJ1Zi5yZWFkKGRhdGEpO1xuICpcbiAqIGFzc2VydEVxdWFscyhuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUoZGF0YSksIFwiSGVsbG8sIHdvcmxkIVwiKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgQnVmZmVyIGltcGxlbWVudHMgV3JpdGVyLCBXcml0ZXJTeW5jLCBSZWFkZXIsIFJlYWRlclN5bmMge1xuICAjYnVmOiBVaW50OEFycmF5OyAvLyBjb250ZW50cyBhcmUgdGhlIGJ5dGVzIGJ1ZltvZmYgOiBsZW4oYnVmKV1cbiAgI29mZiA9IDA7IC8vIHJlYWQgYXQgYnVmW29mZl0sIHdyaXRlIGF0IGJ1ZltidWYuYnl0ZUxlbmd0aF1cblxuICAvKipcbiAgICogQ29uc3RydWN0cyBhIG5ldyBpbnN0YW5jZSB3aXRoIHRoZSBzcGVjaWZpZWQge0BsaW5rY29kZSBBcnJheUJ1ZmZlcn0gYXMgaXRzXG4gICAqIGluaXRpYWwgY29udGVudHMuXG4gICAqXG4gICAqIEBwYXJhbSBhYiBUaGUgQXJyYXlCdWZmZXIgdG8gdXNlIGFzIHRoZSBpbml0aWFsIGNvbnRlbnRzIG9mIHRoZSBidWZmZXIuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhYj86IEFycmF5QnVmZmVyTGlrZSB8IEFycmF5TGlrZTxudW1iZXI+KSB7XG4gICAgaWYgKGFiID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuI2J1ZiA9IG5ldyBVaW50OEFycmF5KDApO1xuICAgIH0gZWxzZSBpZiAoYWIgaW5zdGFuY2VvZiBTaGFyZWRBcnJheUJ1ZmZlcikge1xuICAgICAgLy8gTm90ZTogVGhpcyBpcyBuZWNlc3NhcnkgdG8gYXZvaWQgdHlwZSBlcnJvclxuICAgICAgdGhpcy4jYnVmID0gbmV3IFVpbnQ4QXJyYXkoYWIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiNidWYgPSBuZXcgVWludDhBcnJheShhYik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBzbGljZSBob2xkaW5nIHRoZSB1bnJlYWQgcG9ydGlvbiBvZiB0aGUgYnVmZmVyLlxuICAgKlxuICAgKiBUaGUgc2xpY2UgaXMgdmFsaWQgZm9yIHVzZSBvbmx5IHVudGlsIHRoZSBuZXh0IGJ1ZmZlciBtb2RpZmljYXRpb24gKHRoYXRcbiAgICogaXMsIG9ubHkgdW50aWwgdGhlIG5leHQgY2FsbCB0byBhIG1ldGhvZCBsaWtlIGByZWFkKClgLCBgd3JpdGUoKWAsXG4gICAqIGByZXNldCgpYCwgb3IgYHRydW5jYXRlKClgKS4gSWYgYG9wdGlvbnMuY29weWAgaXMgZmFsc2UgdGhlIHNsaWNlIGFsaWFzZXMgdGhlIGJ1ZmZlciBjb250ZW50IGF0XG4gICAqIGxlYXN0IHVudGlsIHRoZSBuZXh0IGJ1ZmZlciBtb2RpZmljYXRpb24sIHNvIGltbWVkaWF0ZSBjaGFuZ2VzIHRvIHRoZVxuICAgKiBzbGljZSB3aWxsIGFmZmVjdCB0aGUgcmVzdWx0IG9mIGZ1dHVyZSByZWFkcy5cbiAgICpcbiAgICogQGV4YW1wbGUgVXNhZ2VcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIkBzdGQvaW8vYnVmZmVyXCI7XG4gICAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydC9lcXVhbHNcIjtcbiAgICpcbiAgICogY29uc3QgYnVmID0gbmV3IEJ1ZmZlcigpO1xuICAgKiBhd2FpdCBidWYud3JpdGUobmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiSGVsbG8sIHdvcmxkIVwiKSk7XG4gICAqXG4gICAqIGNvbnN0IHNsaWNlID0gYnVmLmJ5dGVzKCk7XG4gICAqIGFzc2VydEVxdWFscyhuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUoc2xpY2UpLCBcIkhlbGxvLCB3b3JsZCFcIik7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gb3B0aW9ucyBUaGUgb3B0aW9ucyBmb3IgdGhlIHNsaWNlLlxuICAgKiBAcmV0dXJucyBBIHNsaWNlIGhvbGRpbmcgdGhlIHVucmVhZCBwb3J0aW9uIG9mIHRoZSBidWZmZXIuXG4gICAqL1xuICBieXRlcyhvcHRpb25zID0geyBjb3B5OiB0cnVlIH0pOiBVaW50OEFycmF5IHtcbiAgICBpZiAob3B0aW9ucy5jb3B5ID09PSBmYWxzZSkgcmV0dXJuIHRoaXMuI2J1Zi5zdWJhcnJheSh0aGlzLiNvZmYpO1xuICAgIHJldHVybiB0aGlzLiNidWYuc2xpY2UodGhpcy4jb2ZmKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIHVucmVhZCBwb3J0aW9uIG9mIHRoZSBidWZmZXIgaXMgZW1wdHkuXG4gICAqXG4gICAqIEBleGFtcGxlIFVzYWdlXG4gICAqIGBgYHRzXG4gICAqIGltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJAc3RkL2lvL2J1ZmZlclwiO1xuICAgKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnQvZXF1YWxzXCI7XG4gICAqXG4gICAqIGNvbnN0IGJ1ZiA9IG5ldyBCdWZmZXIoKTtcbiAgICogYXNzZXJ0RXF1YWxzKGJ1Zi5lbXB0eSgpLCB0cnVlKTtcbiAgICogYXdhaXQgYnVmLndyaXRlKG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkhlbGxvLCB3b3JsZCFcIikpO1xuICAgKiBhc3NlcnRFcXVhbHMoYnVmLmVtcHR5KCksIGZhbHNlKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEByZXR1cm5zIGB0cnVlYCBpZiB0aGUgdW5yZWFkIHBvcnRpb24gb2YgdGhlIGJ1ZmZlciBpcyBlbXB0eSwgYGZhbHNlYFxuICAgKiAgICAgICAgICBvdGhlcndpc2UuXG4gICAqL1xuICBlbXB0eSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4jYnVmLmJ5dGVMZW5ndGggPD0gdGhpcy4jb2ZmO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcmVhZCBvbmx5IG51bWJlciBvZiBieXRlcyBvZiB0aGUgdW5yZWFkIHBvcnRpb24gb2YgdGhlIGJ1ZmZlci5cbiAgICpcbiAgICogQGV4YW1wbGUgVXNhZ2VcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIkBzdGQvaW8vYnVmZmVyXCI7XG4gICAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydC9lcXVhbHNcIjtcbiAgICpcbiAgICogY29uc3QgYnVmID0gbmV3IEJ1ZmZlcigpO1xuICAgKiBhd2FpdCBidWYud3JpdGUobmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiSGVsbG8sIHdvcmxkIVwiKSk7XG4gICAqXG4gICAqIGFzc2VydEVxdWFscyhidWYubGVuZ3RoLCAxMyk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbnVtYmVyIG9mIGJ5dGVzIG9mIHRoZSB1bnJlYWQgcG9ydGlvbiBvZiB0aGUgYnVmZmVyLlxuICAgKi9cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLiNidWYuYnl0ZUxlbmd0aCAtIHRoaXMuI29mZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgcmVhZCBvbmx5IGNhcGFjaXR5IG9mIHRoZSBidWZmZXIncyB1bmRlcmx5aW5nIGJ5dGUgc2xpY2UsIHRoYXQgaXMsXG4gICAqIHRoZSB0b3RhbCBzcGFjZSBhbGxvY2F0ZWQgZm9yIHRoZSBidWZmZXIncyBkYXRhLlxuICAgKlxuICAgKiBAZXhhbXBsZSBVc2FnZVxuICAgKiBgYGB0c1xuICAgKiBpbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiQHN0ZC9pby9idWZmZXJcIjtcbiAgICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0L2VxdWFsc1wiO1xuICAgKlxuICAgKiBjb25zdCBidWYgPSBuZXcgQnVmZmVyKCk7XG4gICAqIGFzc2VydEVxdWFscyhidWYuY2FwYWNpdHksIDApO1xuICAgKiBhd2FpdCBidWYud3JpdGUobmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiSGVsbG8sIHdvcmxkIVwiKSk7XG4gICAqIGFzc2VydEVxdWFscyhidWYuY2FwYWNpdHksIDEzKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjYXBhY2l0eSBvZiB0aGUgYnVmZmVyLlxuICAgKi9cbiAgZ2V0IGNhcGFjaXR5KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuI2J1Zi5idWZmZXIuYnl0ZUxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNjYXJkcyBhbGwgYnV0IHRoZSBmaXJzdCBgbmAgdW5yZWFkIGJ5dGVzIGZyb20gdGhlIGJ1ZmZlciBidXRcbiAgICogY29udGludWVzIHRvIHVzZSB0aGUgc2FtZSBhbGxvY2F0ZWQgc3RvcmFnZS4gSXQgdGhyb3dzIGlmIGBuYCBpc1xuICAgKiBuZWdhdGl2ZSBvciBncmVhdGVyIHRoYW4gdGhlIGxlbmd0aCBvZiB0aGUgYnVmZmVyLlxuICAgKlxuICAgKiBAZXhhbXBsZSBVc2FnZVxuICAgKiBgYGB0c1xuICAgKiBpbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiQHN0ZC9pby9idWZmZXJcIjtcbiAgICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0L2VxdWFsc1wiO1xuICAgKlxuICAgKiBjb25zdCBidWYgPSBuZXcgQnVmZmVyKCk7XG4gICAqIGF3YWl0IGJ1Zi53cml0ZShuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJIZWxsbywgd29ybGQhXCIpKTtcbiAgICogYnVmLnRydW5jYXRlKDYpO1xuICAgKiBhc3NlcnRFcXVhbHMoYnVmLmxlbmd0aCwgNik7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gbiBUaGUgbnVtYmVyIG9mIGJ5dGVzIHRvIGtlZXAuXG4gICAqL1xuICB0cnVuY2F0ZShuOiBudW1iZXIpIHtcbiAgICBpZiAobiA9PT0gMCkge1xuICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobiA8IDAgfHwgbiA+IHRoaXMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCdWZmZXIgdHJ1bmNhdGlvbiBvdXQgb2YgcmFuZ2VcIik7XG4gICAgfVxuICAgIHRoaXMuI3Jlc2xpY2UodGhpcy4jb2ZmICsgbik7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXRzIHRoZSBjb250ZW50c1xuICAgKlxuICAgKiBAZXhhbXBsZSBVc2FnZVxuICAgKiBgYGB0c1xuICAgKiBpbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiQHN0ZC9pby9idWZmZXJcIjtcbiAgICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0L2VxdWFsc1wiO1xuICAgKlxuICAgKiBjb25zdCBidWYgPSBuZXcgQnVmZmVyKCk7XG4gICAqIGF3YWl0IGJ1Zi53cml0ZShuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJIZWxsbywgd29ybGQhXCIpKTtcbiAgICogYnVmLnJlc2V0KCk7XG4gICAqIGFzc2VydEVxdWFscyhidWYubGVuZ3RoLCAwKTtcbiAgICogYGBgXG4gICAqL1xuICByZXNldCgpIHtcbiAgICB0aGlzLiNyZXNsaWNlKDApO1xuICAgIHRoaXMuI29mZiA9IDA7XG4gIH1cblxuICAjdHJ5R3Jvd0J5UmVzbGljZShuOiBudW1iZXIpIHtcbiAgICBjb25zdCBsID0gdGhpcy4jYnVmLmJ5dGVMZW5ndGg7XG4gICAgaWYgKG4gPD0gdGhpcy5jYXBhY2l0eSAtIGwpIHtcbiAgICAgIHRoaXMuI3Jlc2xpY2UobCArIG4pO1xuICAgICAgcmV0dXJuIGw7XG4gICAgfVxuICAgIHJldHVybiAtMTtcbiAgfVxuXG4gICNyZXNsaWNlKGxlbjogbnVtYmVyKSB7XG4gICAgaWYgKGxlbiA+IHRoaXMuI2J1Zi5idWZmZXIuYnl0ZUxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJMZW5ndGggaXMgZ3JlYXRlciB0aGFuIGJ1ZmZlciBjYXBhY2l0eVwiKTtcbiAgICB9XG4gICAgdGhpcy4jYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy4jYnVmLmJ1ZmZlciwgMCwgbGVuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWFkcyB0aGUgbmV4dCBgcC5sZW5ndGhgIGJ5dGVzIGZyb20gdGhlIGJ1ZmZlciBvciB1bnRpbCB0aGUgYnVmZmVyIGlzXG4gICAqIGRyYWluZWQuIFJldHVybnMgdGhlIG51bWJlciBvZiBieXRlcyByZWFkLiBJZiB0aGUgYnVmZmVyIGhhcyBubyBkYXRhIHRvXG4gICAqIHJldHVybiwgdGhlIHJldHVybiBpcyBFT0YgKGBudWxsYCkuXG4gICAqXG4gICAqIEBleGFtcGxlIFVzYWdlXG4gICAqIGBgYHRzXG4gICAqIGltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJAc3RkL2lvL2J1ZmZlclwiO1xuICAgKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnQvZXF1YWxzXCI7XG4gICAqXG4gICAqIGNvbnN0IGJ1ZiA9IG5ldyBCdWZmZXIoKTtcbiAgICogYXdhaXQgYnVmLndyaXRlKG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkhlbGxvLCB3b3JsZCFcIikpO1xuICAgKlxuICAgKiBjb25zdCBkYXRhID0gbmV3IFVpbnQ4QXJyYXkoNSk7XG4gICAqIGNvbnN0IHJlcyA9IGF3YWl0IGJ1Zi5yZWFkKGRhdGEpO1xuICAgKlxuICAgKiBhc3NlcnRFcXVhbHMocmVzLCA1KTtcbiAgICogYXNzZXJ0RXF1YWxzKG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShkYXRhKSwgXCJIZWxsb1wiKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBwIFRoZSBidWZmZXIgdG8gcmVhZCBkYXRhIGludG8uXG4gICAqIEByZXR1cm5zIFRoZSBudW1iZXIgb2YgYnl0ZXMgcmVhZC5cbiAgICovXG4gIHJlYWRTeW5jKHA6IFVpbnQ4QXJyYXkpOiBudW1iZXIgfCBudWxsIHtcbiAgICBpZiAodGhpcy5lbXB0eSgpKSB7XG4gICAgICAvLyBCdWZmZXIgaXMgZW1wdHksIHJlc2V0IHRvIHJlY292ZXIgc3BhY2UuXG4gICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICBpZiAocC5ieXRlTGVuZ3RoID09PSAwKSB7XG4gICAgICAgIC8vIHRoaXMgZWRnZSBjYXNlIGlzIHRlc3RlZCBpbiAnYnVmZmVyUmVhZEVtcHR5QXRFT0YnIHRlc3RcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgbnJlYWQgPSBjb3B5KHRoaXMuI2J1Zi5zdWJhcnJheSh0aGlzLiNvZmYpLCBwKTtcbiAgICB0aGlzLiNvZmYgKz0gbnJlYWQ7XG4gICAgcmV0dXJuIG5yZWFkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlYWRzIHRoZSBuZXh0IGBwLmxlbmd0aGAgYnl0ZXMgZnJvbSB0aGUgYnVmZmVyIG9yIHVudGlsIHRoZSBidWZmZXIgaXNcbiAgICogZHJhaW5lZC4gUmVzb2x2ZXMgdG8gdGhlIG51bWJlciBvZiBieXRlcyByZWFkLiBJZiB0aGUgYnVmZmVyIGhhcyBub1xuICAgKiBkYXRhIHRvIHJldHVybiwgcmVzb2x2ZXMgdG8gRU9GIChgbnVsbGApLlxuICAgKlxuICAgKiBOT1RFOiBUaGlzIG1ldGhvZHMgcmVhZHMgYnl0ZXMgc3luY2hyb25vdXNseTsgaXQncyBwcm92aWRlZCBmb3JcbiAgICogY29tcGF0aWJpbGl0eSB3aXRoIGBSZWFkZXJgIGludGVyZmFjZXMuXG4gICAqXG4gICAqIEBleGFtcGxlIFVzYWdlXG4gICAqIGBgYHRzXG4gICAqIGltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJAc3RkL2lvL2J1ZmZlclwiO1xuICAgKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnQvZXF1YWxzXCI7XG4gICAqXG4gICAqIGNvbnN0IGJ1ZiA9IG5ldyBCdWZmZXIoKTtcbiAgICogYXdhaXQgYnVmLndyaXRlKG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkhlbGxvLCB3b3JsZCFcIikpO1xuICAgKlxuICAgKiBjb25zdCBkYXRhID0gbmV3IFVpbnQ4QXJyYXkoNSk7XG4gICAqIGNvbnN0IHJlcyA9IGF3YWl0IGJ1Zi5yZWFkKGRhdGEpO1xuICAgKlxuICAgKiBhc3NlcnRFcXVhbHMocmVzLCA1KTtcbiAgICogYXNzZXJ0RXF1YWxzKG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShkYXRhKSwgXCJIZWxsb1wiKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBwIFRoZSBidWZmZXIgdG8gcmVhZCBkYXRhIGludG8uXG4gICAqIEByZXR1cm5zIFRoZSBudW1iZXIgb2YgYnl0ZXMgcmVhZC5cbiAgICovXG4gIHJlYWQocDogVWludDhBcnJheSk6IFByb21pc2U8bnVtYmVyIHwgbnVsbD4ge1xuICAgIGNvbnN0IHJyID0gdGhpcy5yZWFkU3luYyhwKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXcml0ZXMgdGhlIGdpdmVuIGRhdGEgdG8gdGhlIGJ1ZmZlci5cbiAgICpcbiAgICogQGV4YW1wbGUgVXNhZ2VcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIkBzdGQvaW8vYnVmZmVyXCI7XG4gICAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydC9lcXVhbHNcIjtcbiAgICpcbiAgICogY29uc3QgYnVmID0gbmV3IEJ1ZmZlcigpO1xuICAgKiBjb25zdCBkYXRhID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiSGVsbG8sIHdvcmxkIVwiKTtcbiAgICogYnVmLndyaXRlU3luYyhkYXRhKTtcbiAgICpcbiAgICogY29uc3Qgc2xpY2UgPSBidWYuYnl0ZXMoKTtcbiAgICogYXNzZXJ0RXF1YWxzKG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShzbGljZSksIFwiSGVsbG8sIHdvcmxkIVwiKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBwIFRoZSBkYXRhIHRvIHdyaXRlIHRvIHRoZSBidWZmZXIuXG4gICAqIEByZXR1cm5zIFRoZSBudW1iZXIgb2YgYnl0ZXMgd3JpdHRlbi5cbiAgICovXG4gIHdyaXRlU3luYyhwOiBVaW50OEFycmF5KTogbnVtYmVyIHtcbiAgICBjb25zdCBtID0gdGhpcy4jZ3JvdyhwLmJ5dGVMZW5ndGgpO1xuICAgIHJldHVybiBjb3B5KHAsIHRoaXMuI2J1ZiwgbSk7XG4gIH1cblxuICAvKipcbiAgICogV3JpdGVzIHRoZSBnaXZlbiBkYXRhIHRvIHRoZSBidWZmZXIuIFJlc29sdmVzIHRvIHRoZSBudW1iZXIgb2YgYnl0ZXNcbiAgICogd3JpdHRlbi5cbiAgICpcbiAgICogPiBbIU5PVEVdXG4gICAqID4gVGhpcyBtZXRob2RzIHdyaXRlcyBieXRlcyBzeW5jaHJvbm91c2x5OyBpdCdzIHByb3ZpZGVkIGZvciBjb21wYXRpYmlsaXR5XG4gICAqID4gd2l0aCB0aGUge0BsaW5rY29kZSBXcml0ZXJ9IGludGVyZmFjZS5cbiAgICpcbiAgICogQGV4YW1wbGUgVXNhZ2VcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIkBzdGQvaW8vYnVmZmVyXCI7XG4gICAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydC9lcXVhbHNcIjtcbiAgICpcbiAgICogY29uc3QgYnVmID0gbmV3IEJ1ZmZlcigpO1xuICAgKiBjb25zdCBkYXRhID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiSGVsbG8sIHdvcmxkIVwiKTtcbiAgICogYXdhaXQgYnVmLndyaXRlKGRhdGEpO1xuICAgKlxuICAgKiBjb25zdCBzbGljZSA9IGJ1Zi5ieXRlcygpO1xuICAgKiBhc3NlcnRFcXVhbHMobmV3IFRleHREZWNvZGVyKCkuZGVjb2RlKHNsaWNlKSwgXCJIZWxsbywgd29ybGQhXCIpO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHAgVGhlIGRhdGEgdG8gd3JpdGUgdG8gdGhlIGJ1ZmZlci5cbiAgICogQHJldHVybnMgVGhlIG51bWJlciBvZiBieXRlcyB3cml0dGVuLlxuICAgKi9cbiAgd3JpdGUocDogVWludDhBcnJheSk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3QgbiA9IHRoaXMud3JpdGVTeW5jKHApO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobik7XG4gIH1cblxuICAjZ3JvdyhuOiBudW1iZXIpIHtcbiAgICBjb25zdCBtID0gdGhpcy5sZW5ndGg7XG4gICAgLy8gSWYgYnVmZmVyIGlzIGVtcHR5LCByZXNldCB0byByZWNvdmVyIHNwYWNlLlxuICAgIGlmIChtID09PSAwICYmIHRoaXMuI29mZiAhPT0gMCkge1xuICAgICAgdGhpcy5yZXNldCgpO1xuICAgIH1cbiAgICAvLyBGYXN0OiBUcnkgdG8gZ3JvdyBieSBtZWFucyBvZiBhIHJlc2xpY2UuXG4gICAgY29uc3QgaSA9IHRoaXMuI3RyeUdyb3dCeVJlc2xpY2Uobik7XG4gICAgaWYgKGkgPj0gMCkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICAgIGNvbnN0IGMgPSB0aGlzLmNhcGFjaXR5O1xuICAgIGlmIChuIDw9IE1hdGguZmxvb3IoYyAvIDIpIC0gbSkge1xuICAgICAgLy8gV2UgY2FuIHNsaWRlIHRoaW5ncyBkb3duIGluc3RlYWQgb2YgYWxsb2NhdGluZyBhIG5ld1xuICAgICAgLy8gQXJyYXlCdWZmZXIuIFdlIG9ubHkgbmVlZCBtK24gPD0gYyB0byBzbGlkZSwgYnV0XG4gICAgICAvLyB3ZSBpbnN0ZWFkIGxldCBjYXBhY2l0eSBnZXQgdHdpY2UgYXMgbGFyZ2Ugc28gd2VcbiAgICAgIC8vIGRvbid0IHNwZW5kIGFsbCBvdXIgdGltZSBjb3B5aW5nLlxuICAgICAgY29weSh0aGlzLiNidWYuc3ViYXJyYXkodGhpcy4jb2ZmKSwgdGhpcy4jYnVmKTtcbiAgICB9IGVsc2UgaWYgKGMgKyBuID4gTUFYX1NJWkUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYFRoZSBidWZmZXIgY2Fubm90IGJlIGdyb3duIGJleW9uZCB0aGUgbWF4aW11bSBzaXplIG9mIFwiJHtNQVhfU0laRX1cImAsXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBOb3QgZW5vdWdoIHNwYWNlIGFueXdoZXJlLCB3ZSBuZWVkIHRvIGFsbG9jYXRlLlxuICAgICAgY29uc3QgYnVmID0gbmV3IFVpbnQ4QXJyYXkoTWF0aC5taW4oMiAqIGMgKyBuLCBNQVhfU0laRSkpO1xuICAgICAgY29weSh0aGlzLiNidWYuc3ViYXJyYXkodGhpcy4jb2ZmKSwgYnVmKTtcbiAgICAgIHRoaXMuI2J1ZiA9IGJ1ZjtcbiAgICB9XG4gICAgLy8gUmVzdG9yZSB0aGlzLiNvZmYgYW5kIGxlbih0aGlzLiNidWYpLlxuICAgIHRoaXMuI29mZiA9IDA7XG4gICAgdGhpcy4jcmVzbGljZShNYXRoLm1pbihtICsgbiwgTUFYX1NJWkUpKTtcbiAgICByZXR1cm4gbTtcbiAgfVxuXG4gIC8qKiBHcm93cyB0aGUgYnVmZmVyJ3MgY2FwYWNpdHksIGlmIG5lY2Vzc2FyeSwgdG8gZ3VhcmFudGVlIHNwYWNlIGZvclxuICAgKiBhbm90aGVyIGBuYCBieXRlcy4gQWZ0ZXIgYC5ncm93KG4pYCwgYXQgbGVhc3QgYG5gIGJ5dGVzIGNhbiBiZSB3cml0dGVuIHRvXG4gICAqIHRoZSBidWZmZXIgd2l0aG91dCBhbm90aGVyIGFsbG9jYXRpb24uIElmIGBuYCBpcyBuZWdhdGl2ZSwgYC5ncm93KClgIHdpbGxcbiAgICogdGhyb3cuIElmIHRoZSBidWZmZXIgY2FuJ3QgZ3JvdyBpdCB3aWxsIHRocm93IGFuIGVycm9yLlxuICAgKlxuICAgKiBCYXNlZCBvbiBHbyBMYW5nJ3NcbiAgICoge0BsaW5rIGh0dHBzOi8vZ29sYW5nLm9yZy9wa2cvYnl0ZXMvI0J1ZmZlci5Hcm93IHwgQnVmZmVyLkdyb3d9LlxuICAgKlxuICAgKiBAZXhhbXBsZSBVc2FnZVxuICAgKiBgYGB0c1xuICAgKiBpbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiQHN0ZC9pby9idWZmZXJcIjtcbiAgICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0L2VxdWFsc1wiO1xuICAgKlxuICAgKiBjb25zdCBidWYgPSBuZXcgQnVmZmVyKCk7XG4gICAqIGJ1Zi5ncm93KDEwKTtcbiAgICogYXNzZXJ0RXF1YWxzKGJ1Zi5jYXBhY2l0eSwgMTApO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIG4gVGhlIG51bWJlciBvZiBieXRlcyB0byBncm93IHRoZSBidWZmZXIgYnkuXG4gICAqL1xuICBncm93KG46IG51bWJlcikge1xuICAgIGlmIChuIDwgMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQnVmZmVyIGdyb3d0aCBjYW5ub3QgYmUgbmVnYXRpdmVcIik7XG4gICAgfVxuICAgIGNvbnN0IG0gPSB0aGlzLiNncm93KG4pO1xuICAgIHRoaXMuI3Jlc2xpY2UobSk7XG4gIH1cblxuICAvKipcbiAgICogUmVhZHMgZGF0YSBmcm9tIGByYCB1bnRpbCBFT0YgKGBudWxsYCkgYW5kIGFwcGVuZHMgaXQgdG8gdGhlIGJ1ZmZlcixcbiAgICogZ3Jvd2luZyB0aGUgYnVmZmVyIGFzIG5lZWRlZC4gSXQgcmVzb2x2ZXMgdG8gdGhlIG51bWJlciBvZiBieXRlcyByZWFkLlxuICAgKiBJZiB0aGUgYnVmZmVyIGJlY29tZXMgdG9vIGxhcmdlLCBgLnJlYWRGcm9tKClgIHdpbGwgcmVqZWN0IHdpdGggYW4gZXJyb3IuXG4gICAqXG4gICAqIEJhc2VkIG9uIEdvIExhbmcnc1xuICAgKiB7QGxpbmsgaHR0cHM6Ly9nb2xhbmcub3JnL3BrZy9ieXRlcy8jQnVmZmVyLlJlYWRGcm9tIHwgQnVmZmVyLlJlYWRGcm9tfS5cbiAgICpcbiAgICogQGV4YW1wbGUgVXNhZ2VcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIkBzdGQvaW8vYnVmZmVyXCI7XG4gICAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydC9lcXVhbHNcIjtcbiAgICpcbiAgICogY29uc3QgYnVmID0gbmV3IEJ1ZmZlcigpO1xuICAgKiBjb25zdCByID0gbmV3IEJ1ZmZlcihuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJIZWxsbywgd29ybGQhXCIpKTtcbiAgICogY29uc3QgbiA9IGF3YWl0IGJ1Zi5yZWFkRnJvbShyKTtcbiAgICpcbiAgICogYXNzZXJ0RXF1YWxzKG4sIDEzKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSByIFRoZSByZWFkZXIgdG8gcmVhZCBmcm9tLlxuICAgKiBAcmV0dXJucyBUaGUgbnVtYmVyIG9mIGJ5dGVzIHJlYWQuXG4gICAqL1xuICBhc3luYyByZWFkRnJvbShyOiBSZWFkZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGxldCBuID0gMDtcbiAgICBjb25zdCB0bXAgPSBuZXcgVWludDhBcnJheShNSU5fUkVBRCk7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGNvbnN0IHNob3VsZEdyb3cgPSB0aGlzLmNhcGFjaXR5IC0gdGhpcy5sZW5ndGggPCBNSU5fUkVBRDtcbiAgICAgIC8vIHJlYWQgaW50byB0bXAgYnVmZmVyIGlmIHRoZXJlJ3Mgbm90IGVub3VnaCByb29tXG4gICAgICAvLyBvdGhlcndpc2UgcmVhZCBkaXJlY3RseSBpbnRvIHRoZSBpbnRlcm5hbCBidWZmZXJcbiAgICAgIGNvbnN0IGJ1ZiA9IHNob3VsZEdyb3dcbiAgICAgICAgPyB0bXBcbiAgICAgICAgOiBuZXcgVWludDhBcnJheSh0aGlzLiNidWYuYnVmZmVyLCB0aGlzLmxlbmd0aCk7XG5cbiAgICAgIGNvbnN0IG5yZWFkID0gYXdhaXQgci5yZWFkKGJ1Zik7XG4gICAgICBpZiAobnJlYWQgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG47XG4gICAgICB9XG5cbiAgICAgIC8vIHdyaXRlIHdpbGwgZ3JvdyBpZiBuZWVkZWRcbiAgICAgIGlmIChzaG91bGRHcm93KSB0aGlzLndyaXRlU3luYyhidWYuc3ViYXJyYXkoMCwgbnJlYWQpKTtcbiAgICAgIGVsc2UgdGhpcy4jcmVzbGljZSh0aGlzLmxlbmd0aCArIG5yZWFkKTtcblxuICAgICAgbiArPSBucmVhZDtcbiAgICB9XG4gIH1cblxuICAvKiogUmVhZHMgZGF0YSBmcm9tIGByYCB1bnRpbCBFT0YgKGBudWxsYCkgYW5kIGFwcGVuZHMgaXQgdG8gdGhlIGJ1ZmZlcixcbiAgICogZ3Jvd2luZyB0aGUgYnVmZmVyIGFzIG5lZWRlZC4gSXQgcmV0dXJucyB0aGUgbnVtYmVyIG9mIGJ5dGVzIHJlYWQuIElmIHRoZVxuICAgKiBidWZmZXIgYmVjb21lcyB0b28gbGFyZ2UsIGAucmVhZEZyb21TeW5jKClgIHdpbGwgdGhyb3cgYW4gZXJyb3IuXG4gICAqXG4gICAqIEJhc2VkIG9uIEdvIExhbmcnc1xuICAgKiB7QGxpbmsgaHR0cHM6Ly9nb2xhbmcub3JnL3BrZy9ieXRlcy8jQnVmZmVyLlJlYWRGcm9tIHwgQnVmZmVyLlJlYWRGcm9tfS5cbiAgICpcbiAgICogQGV4YW1wbGUgVXNhZ2VcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIkBzdGQvaW8vYnVmZmVyXCI7XG4gICAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCJAc3RkL2Fzc2VydC9lcXVhbHNcIjtcbiAgICpcbiAgICogY29uc3QgYnVmID0gbmV3IEJ1ZmZlcigpO1xuICAgKiBjb25zdCByID0gbmV3IEJ1ZmZlcihuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJIZWxsbywgd29ybGQhXCIpKTtcbiAgICogY29uc3QgbiA9IGJ1Zi5yZWFkRnJvbVN5bmMocik7XG4gICAqXG4gICAqIGFzc2VydEVxdWFscyhuLCAxMyk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gciBUaGUgcmVhZGVyIHRvIHJlYWQgZnJvbS5cbiAgICogQHJldHVybnMgVGhlIG51bWJlciBvZiBieXRlcyByZWFkLlxuICAgKi9cbiAgcmVhZEZyb21TeW5jKHI6IFJlYWRlclN5bmMpOiBudW1iZXIge1xuICAgIGxldCBuID0gMDtcbiAgICBjb25zdCB0bXAgPSBuZXcgVWludDhBcnJheShNSU5fUkVBRCk7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGNvbnN0IHNob3VsZEdyb3cgPSB0aGlzLmNhcGFjaXR5IC0gdGhpcy5sZW5ndGggPCBNSU5fUkVBRDtcbiAgICAgIC8vIHJlYWQgaW50byB0bXAgYnVmZmVyIGlmIHRoZXJlJ3Mgbm90IGVub3VnaCByb29tXG4gICAgICAvLyBvdGhlcndpc2UgcmVhZCBkaXJlY3RseSBpbnRvIHRoZSBpbnRlcm5hbCBidWZmZXJcbiAgICAgIGNvbnN0IGJ1ZiA9IHNob3VsZEdyb3dcbiAgICAgICAgPyB0bXBcbiAgICAgICAgOiBuZXcgVWludDhBcnJheSh0aGlzLiNidWYuYnVmZmVyLCB0aGlzLmxlbmd0aCk7XG5cbiAgICAgIGNvbnN0IG5yZWFkID0gci5yZWFkU3luYyhidWYpO1xuICAgICAgaWYgKG5yZWFkID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBuO1xuICAgICAgfVxuXG4gICAgICAvLyB3cml0ZSB3aWxsIGdyb3cgaWYgbmVlZGVkXG4gICAgICBpZiAoc2hvdWxkR3JvdykgdGhpcy53cml0ZVN5bmMoYnVmLnN1YmFycmF5KDAsIG5yZWFkKSk7XG4gICAgICBlbHNlIHRoaXMuI3Jlc2xpY2UodGhpcy5sZW5ndGggKyBucmVhZCk7XG5cbiAgICAgIG4gKz0gbnJlYWQ7XG4gICAgfVxuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUVyQyxTQUFTLElBQUksUUFBUSw2QkFBNkI7QUFHbEQsb0VBQW9FO0FBQ3BFLDRFQUE0RTtBQUM1RSwyRUFBMkU7QUFDM0UscUJBQXFCO0FBQ3JCLE1BQU0sV0FBVyxLQUFLO0FBQ3RCLE1BQU0sV0FBVyxLQUFLLEtBQUs7QUFFM0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQThCQyxHQUNELE9BQU8sTUFBTTtFQUNYLENBQUEsR0FBSSxDQUFhO0VBQ2pCLENBQUEsR0FBSSxHQUFHLEVBQUU7RUFFVDs7Ozs7R0FLQyxHQUNELFlBQVksRUFBd0MsQ0FBRTtJQUNwRCxJQUFJLE9BQU8sV0FBVztNQUNwQixJQUFJLENBQUMsQ0FBQSxHQUFJLEdBQUcsSUFBSSxXQUFXO0lBQzdCLE9BQU8sSUFBSSxjQUFjLG1CQUFtQjtNQUMxQyw4Q0FBOEM7TUFDOUMsSUFBSSxDQUFDLENBQUEsR0FBSSxHQUFHLElBQUksV0FBVztJQUM3QixPQUFPO01BQ0wsSUFBSSxDQUFDLENBQUEsR0FBSSxHQUFHLElBQUksV0FBVztJQUM3QjtFQUNGO0VBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBdUJDLEdBQ0QsTUFBTSxVQUFVO0lBQUUs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
// denoCacheMetadata=9392486403866016327,16110111103866631353