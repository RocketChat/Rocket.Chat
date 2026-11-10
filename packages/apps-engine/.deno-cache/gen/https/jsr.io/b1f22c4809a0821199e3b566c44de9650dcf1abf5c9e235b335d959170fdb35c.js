// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { concat } from "jsr:@std/bytes@^1.0.6/concat";
import { createLPS } from "./_common.ts";
/**
 * Divide a stream into chunks delimited by a given byte sequence.
 *
 * If you are working with a stream of `string`, consider using {@linkcode TextDelimiterStream}.
 *
 * @example
 * Divide a CSV stream by commas, discarding the commas:
 * ```ts
 * import { DelimiterStream } from "@std/streams/delimiter-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const inputStream = ReadableStream.from(["foo,bar", ",baz"]);
 *
 * const transformed = inputStream.pipeThrough(new TextEncoderStream())
 *   .pipeThrough(new DelimiterStream(new TextEncoder().encode(",")))
 *   .pipeThrough(new TextDecoderStream());
 *
 * assertEquals(await Array.fromAsync(transformed), ["foo", "bar", "baz"]);
 * ```
 *
 * @example
 * Divide a stream after semi-colons, keeping the semicolons in the output:
 * ```ts
 * import { DelimiterStream } from "@std/streams/delimiter-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const inputStream = ReadableStream.from(["foo;", "bar;baz", ";"]);
 *
 * const transformed = inputStream.pipeThrough(new TextEncoderStream())
 *   .pipeThrough(
 *     new DelimiterStream(new TextEncoder().encode(";"), {
 *       disposition: "suffix",
 *     }),
 *   ).pipeThrough(new TextDecoderStream());
 *
 * assertEquals(await Array.fromAsync(transformed), ["foo;", "bar;", "baz;"]);
 * ```
 */ export class DelimiterStream extends TransformStream {
  #bufs = [];
  #delimiter;
  #matchIndex = 0;
  #delimLPS;
  #disp;
  /**
   * Constructs a new instance.
   *
   * @param delimiter A delimiter to split the stream by.
   * @param options Options for the delimiter stream.
   */ constructor(delimiter, options = {}){
    super({
      transform: (chunk, controller)=>delimiter.length === 1 ? this.#handleChar(chunk, controller) : this.#handle(chunk, controller),
      flush: (controller)=>this.#flush(controller)
    });
    this.#delimiter = delimiter;
    this.#delimLPS = delimiter.length > 1 ? createLPS(delimiter) : null;
    this.#disp = options.disposition ?? "discard";
  }
  #handle(chunk, controller) {
    const bufs = this.#bufs;
    const length = chunk.byteLength;
    const disposition = this.#disp;
    const delimiter = this.#delimiter;
    const delimLen = delimiter.length;
    const lps = this.#delimLPS;
    let chunkStart = 0;
    let matchIndex = this.#matchIndex;
    let inspectIndex = 0;
    while(inspectIndex < length){
      if (chunk[inspectIndex] === delimiter[matchIndex]) {
        // Next byte matched our next delimiter byte
        inspectIndex++;
        matchIndex++;
        if (matchIndex === delimLen) {
          // Full match
          matchIndex = 0;
          const delimiterStartIndex = inspectIndex - delimLen;
          const delimitedChunkEnd = disposition === "suffix" ? inspectIndex : delimiterStartIndex;
          if (delimitedChunkEnd <= 0 && bufs.length === 0) {
            // Our chunk started with a delimiter and no previous chunks exist:
            // Enqueue an empty chunk.
            controller.enqueue(new Uint8Array());
            chunkStart = disposition === "prefix" ? 0 : inspectIndex;
          } else if (delimitedChunkEnd > 0 && bufs.length === 0) {
            // No previous chunks, slice from current chunk.
            controller.enqueue(chunk.subarray(chunkStart, delimitedChunkEnd));
            // Our chunk may have more than one delimiter; we must remember where
            // the next delimited chunk begins.
            chunkStart = disposition === "prefix" ? delimiterStartIndex : inspectIndex;
          } else if (delimitedChunkEnd === 0 && bufs.length > 0) {
            // Our chunk started with a delimiter, previous chunks are passed as
            // they are (with concatenation).
            if (bufs.length === 1) {
              // Concat not needed when a single buffer is passed.
              controller.enqueue(bufs[0]);
            } else {
              controller.enqueue(concat(bufs));
            }
            // Drop all previous chunks.
            bufs.length = 0;
            if (disposition !== "prefix") {
              // suffix or discard: The next chunk starts where our inspection finished.
              // We should only ever end up here with a discard disposition as
              // for a suffix disposition this branch would mean that the previous
              // chunk ended with a full match but was not enqueued.
              chunkStart = inspectIndex;
            } else {
              chunkStart = 0;
            }
          } else if (delimitedChunkEnd < 0 && bufs.length > 0) {
            // Our chunk started by finishing a partial delimiter match.
            const lastIndex = bufs.length - 1;
            const last = bufs[lastIndex];
            const lastSliceIndex = last.byteLength + delimitedChunkEnd;
            const lastSliced = last.subarray(0, lastSliceIndex);
            if (lastIndex === 0) {
              controller.enqueue(lastSliced);
            } else {
              bufs[lastIndex] = lastSliced;
              controller.enqueue(concat(bufs));
            }
            bufs.length = 0;
            if (disposition === "prefix") {
              // Must keep last bytes of last chunk.
              bufs.push(last.subarray(lastSliceIndex));
              chunkStart = 0;
            } else {
              chunkStart = inspectIndex;
            }
          } else if (delimitedChunkEnd > 0 && bufs.length > 0) {
            // Previous chunks and current chunk together form a delimited chunk.
            const chunkSliced = chunk.subarray(chunkStart, delimitedChunkEnd);
            const result = concat([
              ...bufs,
              chunkSliced
            ]);
            bufs.length = 0;
            controller.enqueue(result);
            chunkStart = disposition === "prefix" ? delimitedChunkEnd : inspectIndex;
          } else {
            throw new Error("This should be unreachable, please file a bug report against Deno at https://github.com/denoland/std/issues");
          }
        }
      } else if (matchIndex === 0) {
        // No match ongoing, keep going through the buffer.
        inspectIndex++;
      } else {
        // Ongoing match: Degrade to the previous possible match.
        // eg. If we're looking for 'AAB' and had matched 'AA' previously
        // but now got a new 'A', then we'll drop down to having matched
        // just 'A'. The while loop will turn around again and we'll rematch
        // to 'AA' and proceed onwards to try and match on 'B' again.
        matchIndex = lps[matchIndex - 1];
      }
    }
    // Save match index.
    this.#matchIndex = matchIndex;
    if (chunkStart === 0) {
      bufs.push(chunk);
    } else if (chunkStart < length) {
      // If we matched partially somewhere in the middle of our chunk
      // then the remnants should be pushed into buffers.
      bufs.push(chunk.subarray(chunkStart));
    }
  }
  /**
   * Optimized handler for a char delimited stream:
   *
   * For char delimited streams we do not need to keep track of
   * the match index, removing the need for a fair bit of work.
   */ #handleChar(chunk, controller) {
    const bufs = this.#bufs;
    const length = chunk.byteLength;
    const disposition = this.#disp;
    const delimiter = this.#delimiter[0];
    let chunkStart = 0;
    let inspectIndex = 0;
    while(inspectIndex < length){
      if (chunk[inspectIndex] === delimiter) {
        // Next byte matched our next delimiter
        inspectIndex++;
        /**
         * Always non-negative
         */ const delimitedChunkEnd = disposition === "suffix" ? inspectIndex : inspectIndex - 1;
        if (delimitedChunkEnd === 0 && bufs.length === 0) {
          // Our chunk started with a delimiter and no previous chunks exist:
          // Enqueue an empty chunk.
          controller.enqueue(new Uint8Array());
          chunkStart = disposition === "prefix" ? 0 : 1;
        } else if (delimitedChunkEnd > 0 && bufs.length === 0) {
          // No previous chunks, slice from current chunk.
          controller.enqueue(chunk.subarray(chunkStart, delimitedChunkEnd));
          // Our chunk may have more than one delimiter; we must remember where
          // the next delimited chunk begins.
          chunkStart = disposition === "prefix" ? inspectIndex - 1 : inspectIndex;
        } else if (delimitedChunkEnd === 0 && bufs.length > 0) {
          // Our chunk started with a delimiter, previous chunks are passed as
          // they are (with concatenation).
          if (bufs.length === 1) {
            // Concat not needed when a single buffer is passed.
            controller.enqueue(bufs[0]);
          } else {
            controller.enqueue(concat(bufs));
          }
          // Drop all previous chunks.
          bufs.length = 0;
          if (disposition !== "prefix") {
            // suffix or discard: The next chunk starts where our inspection finished.
            // We should only ever end up here with a discard disposition as
            // for a suffix disposition this branch would mean that the previous
            // chunk ended with a full match but was not enqueued.
            chunkStart = inspectIndex;
          }
        } else if (delimitedChunkEnd > 0 && bufs.length > 0) {
          // Previous chunks and current chunk together form a delimited chunk.
          const chunkSliced = chunk.subarray(chunkStart, delimitedChunkEnd);
          const result = concat([
            ...bufs,
            chunkSliced
          ]);
          bufs.length = 0;
          chunkStart = disposition === "prefix" ? delimitedChunkEnd : inspectIndex;
          controller.enqueue(result);
        } else {
          throw new Error("This should be unreachable, please file a bug report against Deno at https://github.com/denoland/std/issues");
        }
      } else {
        inspectIndex++;
      }
    }
    if (chunkStart === 0) {
      bufs.push(chunk);
    } else if (chunkStart < length) {
      // If we matched partially somewhere in the middle of our chunk
      // then the remnants should be pushed into buffers.
      bufs.push(chunk.subarray(chunkStart));
    }
  }
  #flush(controller) {
    const bufs = this.#bufs;
    const length = bufs.length;
    if (length === 0) {
      controller.enqueue(new Uint8Array());
    } else if (length === 1) {
      controller.enqueue(bufs[0]);
    } else {
      controller.enqueue(concat(bufs));
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvc3RyZWFtcy8xLjAuMTYvZGVsaW1pdGVyX3N0cmVhbS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBjb25jYXQgfSBmcm9tIFwianNyOkBzdGQvYnl0ZXNAXjEuMC42L2NvbmNhdFwiO1xuaW1wb3J0IHsgY3JlYXRlTFBTIH0gZnJvbSBcIi4vX2NvbW1vbi50c1wiO1xuXG4vKiogRGlzcG9zaXRpb24gb2YgdGhlIGRlbGltaXRlciBmb3Ige0BsaW5rY29kZSBEZWxpbWl0ZXJTdHJlYW1PcHRpb25zfS4gKi9cbmV4cG9ydCB0eXBlIERlbGltaXRlckRpc3Bvc2l0aW9uID1cbiAgLyoqIEluY2x1ZGUgZGVsaW1pdGVyIGluIHRoZSBmb3VuZCBjaHVuay4gKi9cbiAgfCBcInN1ZmZpeFwiXG4gIC8qKiBJbmNsdWRlIGRlbGltaXRlciBpbiB0aGUgc3Vic2VxdWVudCBjaHVuay4gKi9cbiAgfCBcInByZWZpeFwiXG4gIC8qKiBEaXNjYXJkIHRoZSBkZWxpbWl0ZXIuICovXG4gIHwgXCJkaXNjYXJkXCIgLy8gZGVsaW1pdGVyIGRpc2NhcmRlZFxuO1xuXG4vKiogT3B0aW9ucyBmb3Ige0BsaW5rY29kZSBEZWxpbWl0ZXJTdHJlYW19LiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWxpbWl0ZXJTdHJlYW1PcHRpb25zIHtcbiAgLyoqXG4gICAqIERpc3Bvc2l0aW9uIG9mIHRoZSBkZWxpbWl0ZXIuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtcImRpc2NhcmRcIn1cbiAgICovXG4gIGRpc3Bvc2l0aW9uPzogRGVsaW1pdGVyRGlzcG9zaXRpb247XG59XG5cbi8qKlxuICogRGl2aWRlIGEgc3RyZWFtIGludG8gY2h1bmtzIGRlbGltaXRlZCBieSBhIGdpdmVuIGJ5dGUgc2VxdWVuY2UuXG4gKlxuICogSWYgeW91IGFyZSB3b3JraW5nIHdpdGggYSBzdHJlYW0gb2YgYHN0cmluZ2AsIGNvbnNpZGVyIHVzaW5nIHtAbGlua2NvZGUgVGV4dERlbGltaXRlclN0cmVhbX0uXG4gKlxuICogQGV4YW1wbGVcbiAqIERpdmlkZSBhIENTViBzdHJlYW0gYnkgY29tbWFzLCBkaXNjYXJkaW5nIHRoZSBjb21tYXM6XG4gKiBgYGB0c1xuICogaW1wb3J0IHsgRGVsaW1pdGVyU3RyZWFtIH0gZnJvbSBcIkBzdGQvc3RyZWFtcy9kZWxpbWl0ZXItc3RyZWFtXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCBpbnB1dFN0cmVhbSA9IFJlYWRhYmxlU3RyZWFtLmZyb20oW1wiZm9vLGJhclwiLCBcIixiYXpcIl0pO1xuICpcbiAqIGNvbnN0IHRyYW5zZm9ybWVkID0gaW5wdXRTdHJlYW0ucGlwZVRocm91Z2gobmV3IFRleHRFbmNvZGVyU3RyZWFtKCkpXG4gKiAgIC5waXBlVGhyb3VnaChuZXcgRGVsaW1pdGVyU3RyZWFtKG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIixcIikpKVxuICogICAucGlwZVRocm91Z2gobmV3IFRleHREZWNvZGVyU3RyZWFtKCkpO1xuICpcbiAqIGFzc2VydEVxdWFscyhhd2FpdCBBcnJheS5mcm9tQXN5bmModHJhbnNmb3JtZWQpLCBbXCJmb29cIiwgXCJiYXJcIiwgXCJiYXpcIl0pO1xuICogYGBgXG4gKlxuICogQGV4YW1wbGVcbiAqIERpdmlkZSBhIHN0cmVhbSBhZnRlciBzZW1pLWNvbG9ucywga2VlcGluZyB0aGUgc2VtaWNvbG9ucyBpbiB0aGUgb3V0cHV0OlxuICogYGBgdHNcbiAqIGltcG9ydCB7IERlbGltaXRlclN0cmVhbSB9IGZyb20gXCJAc3RkL3N0cmVhbXMvZGVsaW1pdGVyLXN0cmVhbVwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3QgaW5wdXRTdHJlYW0gPSBSZWFkYWJsZVN0cmVhbS5mcm9tKFtcImZvbztcIiwgXCJiYXI7YmF6XCIsIFwiO1wiXSk7XG4gKlxuICogY29uc3QgdHJhbnNmb3JtZWQgPSBpbnB1dFN0cmVhbS5waXBlVGhyb3VnaChuZXcgVGV4dEVuY29kZXJTdHJlYW0oKSlcbiAqICAgLnBpcGVUaHJvdWdoKFxuICogICAgIG5ldyBEZWxpbWl0ZXJTdHJlYW0obmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiO1wiKSwge1xuICogICAgICAgZGlzcG9zaXRpb246IFwic3VmZml4XCIsXG4gKiAgICAgfSksXG4gKiAgICkucGlwZVRocm91Z2gobmV3IFRleHREZWNvZGVyU3RyZWFtKCkpO1xuICpcbiAqIGFzc2VydEVxdWFscyhhd2FpdCBBcnJheS5mcm9tQXN5bmModHJhbnNmb3JtZWQpLCBbXCJmb287XCIsIFwiYmFyO1wiLCBcImJhejtcIl0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBEZWxpbWl0ZXJTdHJlYW0gZXh0ZW5kcyBUcmFuc2Zvcm1TdHJlYW08VWludDhBcnJheSwgVWludDhBcnJheT4ge1xuICAjYnVmczogVWludDhBcnJheVtdID0gW107XG4gICNkZWxpbWl0ZXI6IFVpbnQ4QXJyYXk7XG4gICNtYXRjaEluZGV4ID0gMDtcbiAgI2RlbGltTFBTOiBVaW50OEFycmF5IHwgbnVsbDtcbiAgI2Rpc3A6IERlbGltaXRlckRpc3Bvc2l0aW9uO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RzIGEgbmV3IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gZGVsaW1pdGVyIEEgZGVsaW1pdGVyIHRvIHNwbGl0IHRoZSBzdHJlYW0gYnkuXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgZm9yIHRoZSBkZWxpbWl0ZXIgc3RyZWFtLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgZGVsaW1pdGVyOiBVaW50OEFycmF5LFxuICAgIG9wdGlvbnM6IERlbGltaXRlclN0cmVhbU9wdGlvbnMgPSB7fSxcbiAgKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHJhbnNmb3JtOiAoY2h1bmssIGNvbnRyb2xsZXIpID0+XG4gICAgICAgIGRlbGltaXRlci5sZW5ndGggPT09IDFcbiAgICAgICAgICA/IHRoaXMuI2hhbmRsZUNoYXIoY2h1bmssIGNvbnRyb2xsZXIpXG4gICAgICAgICAgOiB0aGlzLiNoYW5kbGUoY2h1bmssIGNvbnRyb2xsZXIpLFxuICAgICAgZmx1c2g6IChjb250cm9sbGVyKSA9PiB0aGlzLiNmbHVzaChjb250cm9sbGVyKSxcbiAgICB9KTtcblxuICAgIHRoaXMuI2RlbGltaXRlciA9IGRlbGltaXRlcjtcbiAgICB0aGlzLiNkZWxpbUxQUyA9IGRlbGltaXRlci5sZW5ndGggPiAxID8gY3JlYXRlTFBTKGRlbGltaXRlcikgOiBudWxsO1xuICAgIHRoaXMuI2Rpc3AgPSBvcHRpb25zLmRpc3Bvc2l0aW9uID8/IFwiZGlzY2FyZFwiO1xuICB9XG5cbiAgI2hhbmRsZShcbiAgICBjaHVuazogVWludDhBcnJheSxcbiAgICBjb250cm9sbGVyOiBUcmFuc2Zvcm1TdHJlYW1EZWZhdWx0Q29udHJvbGxlcjxVaW50OEFycmF5PixcbiAgKSB7XG4gICAgY29uc3QgYnVmcyA9IHRoaXMuI2J1ZnM7XG4gICAgY29uc3QgbGVuZ3RoID0gY2h1bmsuYnl0ZUxlbmd0aDtcbiAgICBjb25zdCBkaXNwb3NpdGlvbiA9IHRoaXMuI2Rpc3A7XG4gICAgY29uc3QgZGVsaW1pdGVyID0gdGhpcy4jZGVsaW1pdGVyO1xuICAgIGNvbnN0IGRlbGltTGVuID0gZGVsaW1pdGVyLmxlbmd0aDtcbiAgICBjb25zdCBscHMgPSB0aGlzLiNkZWxpbUxQUyBhcyBVaW50OEFycmF5O1xuICAgIGxldCBjaHVua1N0YXJ0ID0gMDtcbiAgICBsZXQgbWF0Y2hJbmRleCA9IHRoaXMuI21hdGNoSW5kZXg7XG4gICAgbGV0IGluc3BlY3RJbmRleCA9IDA7XG4gICAgd2hpbGUgKGluc3BlY3RJbmRleCA8IGxlbmd0aCkge1xuICAgICAgaWYgKGNodW5rW2luc3BlY3RJbmRleF0gPT09IGRlbGltaXRlclttYXRjaEluZGV4XSkge1xuICAgICAgICAvLyBOZXh0IGJ5dGUgbWF0Y2hlZCBvdXIgbmV4dCBkZWxpbWl0ZXIgYnl0ZVxuICAgICAgICBpbnNwZWN0SW5kZXgrKztcbiAgICAgICAgbWF0Y2hJbmRleCsrO1xuICAgICAgICBpZiAobWF0Y2hJbmRleCA9PT0gZGVsaW1MZW4pIHtcbiAgICAgICAgICAvLyBGdWxsIG1hdGNoXG4gICAgICAgICAgbWF0Y2hJbmRleCA9IDA7XG4gICAgICAgICAgY29uc3QgZGVsaW1pdGVyU3RhcnRJbmRleCA9IGluc3BlY3RJbmRleCAtIGRlbGltTGVuO1xuICAgICAgICAgIGNvbnN0IGRlbGltaXRlZENodW5rRW5kID0gZGlzcG9zaXRpb24gPT09IFwic3VmZml4XCJcbiAgICAgICAgICAgID8gaW5zcGVjdEluZGV4XG4gICAgICAgICAgICA6IGRlbGltaXRlclN0YXJ0SW5kZXg7XG4gICAgICAgICAgaWYgKGRlbGltaXRlZENodW5rRW5kIDw9IDAgJiYgYnVmcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIC8vIE91ciBjaHVuayBzdGFydGVkIHdpdGggYSBkZWxpbWl0ZXIgYW5kIG5vIHByZXZpb3VzIGNodW5rcyBleGlzdDpcbiAgICAgICAgICAgIC8vIEVucXVldWUgYW4gZW1wdHkgY2h1bmsuXG4gICAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUobmV3IFVpbnQ4QXJyYXkoKSk7XG4gICAgICAgICAgICBjaHVua1N0YXJ0ID0gZGlzcG9zaXRpb24gPT09IFwicHJlZml4XCIgPyAwIDogaW5zcGVjdEluZGV4O1xuICAgICAgICAgIH0gZWxzZSBpZiAoZGVsaW1pdGVkQ2h1bmtFbmQgPiAwICYmIGJ1ZnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAvLyBObyBwcmV2aW91cyBjaHVua3MsIHNsaWNlIGZyb20gY3VycmVudCBjaHVuay5cbiAgICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShjaHVuay5zdWJhcnJheShjaHVua1N0YXJ0LCBkZWxpbWl0ZWRDaHVua0VuZCkpO1xuICAgICAgICAgICAgLy8gT3VyIGNodW5rIG1heSBoYXZlIG1vcmUgdGhhbiBvbmUgZGVsaW1pdGVyOyB3ZSBtdXN0IHJlbWVtYmVyIHdoZXJlXG4gICAgICAgICAgICAvLyB0aGUgbmV4dCBkZWxpbWl0ZWQgY2h1bmsgYmVnaW5zLlxuICAgICAgICAgICAgY2h1bmtTdGFydCA9IGRpc3Bvc2l0aW9uID09PSBcInByZWZpeFwiXG4gICAgICAgICAgICAgID8gZGVsaW1pdGVyU3RhcnRJbmRleFxuICAgICAgICAgICAgICA6IGluc3BlY3RJbmRleDtcbiAgICAgICAgICB9IGVsc2UgaWYgKGRlbGltaXRlZENodW5rRW5kID09PSAwICYmIGJ1ZnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgLy8gT3VyIGNodW5rIHN0YXJ0ZWQgd2l0aCBhIGRlbGltaXRlciwgcHJldmlvdXMgY2h1bmtzIGFyZSBwYXNzZWQgYXNcbiAgICAgICAgICAgIC8vIHRoZXkgYXJlICh3aXRoIGNvbmNhdGVuYXRpb24pLlxuICAgICAgICAgICAgaWYgKGJ1ZnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgIC8vIENvbmNhdCBub3QgbmVlZGVkIHdoZW4gYSBzaW5nbGUgYnVmZmVyIGlzIHBhc3NlZC5cbiAgICAgICAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKGJ1ZnNbMF0hKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShjb25jYXQoYnVmcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRHJvcCBhbGwgcHJldmlvdXMgY2h1bmtzLlxuICAgICAgICAgICAgYnVmcy5sZW5ndGggPSAwO1xuICAgICAgICAgICAgaWYgKGRpc3Bvc2l0aW9uICE9PSBcInByZWZpeFwiKSB7XG4gICAgICAgICAgICAgIC8vIHN1ZmZpeCBvciBkaXNjYXJkOiBUaGUgbmV4dCBjaHVuayBzdGFydHMgd2hlcmUgb3VyIGluc3BlY3Rpb24gZmluaXNoZWQuXG4gICAgICAgICAgICAgIC8vIFdlIHNob3VsZCBvbmx5IGV2ZXIgZW5kIHVwIGhlcmUgd2l0aCBhIGRpc2NhcmQgZGlzcG9zaXRpb24gYXNcbiAgICAgICAgICAgICAgLy8gZm9yIGEgc3VmZml4IGRpc3Bvc2l0aW9uIHRoaXMgYnJhbmNoIHdvdWxkIG1lYW4gdGhhdCB0aGUgcHJldmlvdXNcbiAgICAgICAgICAgICAgLy8gY2h1bmsgZW5kZWQgd2l0aCBhIGZ1bGwgbWF0Y2ggYnV0IHdhcyBub3QgZW5xdWV1ZWQuXG4gICAgICAgICAgICAgIGNodW5rU3RhcnQgPSBpbnNwZWN0SW5kZXg7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjaHVua1N0YXJ0ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGRlbGltaXRlZENodW5rRW5kIDwgMCAmJiBidWZzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIC8vIE91ciBjaHVuayBzdGFydGVkIGJ5IGZpbmlzaGluZyBhIHBhcnRpYWwgZGVsaW1pdGVyIG1hdGNoLlxuICAgICAgICAgICAgY29uc3QgbGFzdEluZGV4ID0gYnVmcy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgY29uc3QgbGFzdCA9IGJ1ZnNbbGFzdEluZGV4XSE7XG4gICAgICAgICAgICBjb25zdCBsYXN0U2xpY2VJbmRleCA9IGxhc3QuYnl0ZUxlbmd0aCArIGRlbGltaXRlZENodW5rRW5kO1xuICAgICAgICAgICAgY29uc3QgbGFzdFNsaWNlZCA9IGxhc3Quc3ViYXJyYXkoMCwgbGFzdFNsaWNlSW5kZXgpO1xuICAgICAgICAgICAgaWYgKGxhc3RJbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUobGFzdFNsaWNlZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBidWZzW2xhc3RJbmRleF0gPSBsYXN0U2xpY2VkO1xuICAgICAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUoY29uY2F0KGJ1ZnMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJ1ZnMubGVuZ3RoID0gMDtcbiAgICAgICAgICAgIGlmIChkaXNwb3NpdGlvbiA9PT0gXCJwcmVmaXhcIikge1xuICAgICAgICAgICAgICAvLyBNdXN0IGtlZXAgbGFzdCBieXRlcyBvZiBsYXN0IGNodW5rLlxuICAgICAgICAgICAgICBidWZzLnB1c2gobGFzdC5zdWJhcnJheShsYXN0U2xpY2VJbmRleCkpO1xuICAgICAgICAgICAgICBjaHVua1N0YXJ0ID0gMDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNodW5rU3RhcnQgPSBpbnNwZWN0SW5kZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChkZWxpbWl0ZWRDaHVua0VuZCA+IDAgJiYgYnVmcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAvLyBQcmV2aW91cyBjaHVua3MgYW5kIGN1cnJlbnQgY2h1bmsgdG9nZXRoZXIgZm9ybSBhIGRlbGltaXRlZCBjaHVuay5cbiAgICAgICAgICAgIGNvbnN0IGNodW5rU2xpY2VkID0gY2h1bmsuc3ViYXJyYXkoY2h1bmtTdGFydCwgZGVsaW1pdGVkQ2h1bmtFbmQpO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gY29uY2F0KFsuLi5idWZzLCBjaHVua1NsaWNlZF0pO1xuICAgICAgICAgICAgYnVmcy5sZW5ndGggPSAwO1xuICAgICAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKHJlc3VsdCk7XG4gICAgICAgICAgICBjaHVua1N0YXJ0ID0gZGlzcG9zaXRpb24gPT09IFwicHJlZml4XCJcbiAgICAgICAgICAgICAgPyBkZWxpbWl0ZWRDaHVua0VuZFxuICAgICAgICAgICAgICA6IGluc3BlY3RJbmRleDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICBcIlRoaXMgc2hvdWxkIGJlIHVucmVhY2hhYmxlLCBwbGVhc2UgZmlsZSBhIGJ1ZyByZXBvcnQgYWdhaW5zdCBEZW5vIGF0IGh0dHBzOi8vZ2l0aHViLmNvbS9kZW5vbGFuZC9zdGQvaXNzdWVzXCIsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChtYXRjaEluZGV4ID09PSAwKSB7XG4gICAgICAgIC8vIE5vIG1hdGNoIG9uZ29pbmcsIGtlZXAgZ29pbmcgdGhyb3VnaCB0aGUgYnVmZmVyLlxuICAgICAgICBpbnNwZWN0SW5kZXgrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE9uZ29pbmcgbWF0Y2g6IERlZ3JhZGUgdG8gdGhlIHByZXZpb3VzIHBvc3NpYmxlIG1hdGNoLlxuICAgICAgICAvLyBlZy4gSWYgd2UncmUgbG9va2luZyBmb3IgJ0FBQicgYW5kIGhhZCBtYXRjaGVkICdBQScgcHJldmlvdXNseVxuICAgICAgICAvLyBidXQgbm93IGdvdCBhIG5ldyAnQScsIHRoZW4gd2UnbGwgZHJvcCBkb3duIHRvIGhhdmluZyBtYXRjaGVkXG4gICAgICAgIC8vIGp1c3QgJ0EnLiBUaGUgd2hpbGUgbG9vcCB3aWxsIHR1cm4gYXJvdW5kIGFnYWluIGFuZCB3ZSdsbCByZW1hdGNoXG4gICAgICAgIC8vIHRvICdBQScgYW5kIHByb2NlZWQgb253YXJkcyB0byB0cnkgYW5kIG1hdGNoIG9uICdCJyBhZ2Fpbi5cbiAgICAgICAgbWF0Y2hJbmRleCA9IGxwc1ttYXRjaEluZGV4IC0gMV0hO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBTYXZlIG1hdGNoIGluZGV4LlxuICAgIHRoaXMuI21hdGNoSW5kZXggPSBtYXRjaEluZGV4O1xuICAgIGlmIChjaHVua1N0YXJ0ID09PSAwKSB7XG4gICAgICBidWZzLnB1c2goY2h1bmspO1xuICAgIH0gZWxzZSBpZiAoY2h1bmtTdGFydCA8IGxlbmd0aCkge1xuICAgICAgLy8gSWYgd2UgbWF0Y2hlZCBwYXJ0aWFsbHkgc29tZXdoZXJlIGluIHRoZSBtaWRkbGUgb2Ygb3VyIGNodW5rXG4gICAgICAvLyB0aGVuIHRoZSByZW1uYW50cyBzaG91bGQgYmUgcHVzaGVkIGludG8gYnVmZmVycy5cbiAgICAgIGJ1ZnMucHVzaChjaHVuay5zdWJhcnJheShjaHVua1N0YXJ0KSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE9wdGltaXplZCBoYW5kbGVyIGZvciBhIGNoYXIgZGVsaW1pdGVkIHN0cmVhbTpcbiAgICpcbiAgICogRm9yIGNoYXIgZGVsaW1pdGVkIHN0cmVhbXMgd2UgZG8gbm90IG5lZWQgdG8ga2VlcCB0cmFjayBvZlxuICAgKiB0aGUgbWF0Y2ggaW5kZXgsIHJlbW92aW5nIHRoZSBuZWVkIGZvciBhIGZhaXIgYml0IG9mIHdvcmsuXG4gICAqL1xuICAjaGFuZGxlQ2hhcihcbiAgICBjaHVuazogVWludDhBcnJheSxcbiAgICBjb250cm9sbGVyOiBUcmFuc2Zvcm1TdHJlYW1EZWZhdWx0Q29udHJvbGxlcjxVaW50OEFycmF5PixcbiAgKSB7XG4gICAgY29uc3QgYnVmcyA9IHRoaXMuI2J1ZnM7XG4gICAgY29uc3QgbGVuZ3RoID0gY2h1bmsuYnl0ZUxlbmd0aDtcbiAgICBjb25zdCBkaXNwb3NpdGlvbiA9IHRoaXMuI2Rpc3A7XG4gICAgY29uc3QgZGVsaW1pdGVyID0gdGhpcy4jZGVsaW1pdGVyWzBdO1xuICAgIGxldCBjaHVua1N0YXJ0ID0gMDtcbiAgICBsZXQgaW5zcGVjdEluZGV4ID0gMDtcbiAgICB3aGlsZSAoaW5zcGVjdEluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICBpZiAoY2h1bmtbaW5zcGVjdEluZGV4XSA9PT0gZGVsaW1pdGVyKSB7XG4gICAgICAgIC8vIE5leHQgYnl0ZSBtYXRjaGVkIG91ciBuZXh0IGRlbGltaXRlclxuICAgICAgICBpbnNwZWN0SW5kZXgrKztcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFsd2F5cyBub24tbmVnYXRpdmVcbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IGRlbGltaXRlZENodW5rRW5kID0gZGlzcG9zaXRpb24gPT09IFwic3VmZml4XCJcbiAgICAgICAgICA/IGluc3BlY3RJbmRleFxuICAgICAgICAgIDogaW5zcGVjdEluZGV4IC0gMTtcbiAgICAgICAgaWYgKGRlbGltaXRlZENodW5rRW5kID09PSAwICYmIGJ1ZnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgLy8gT3VyIGNodW5rIHN0YXJ0ZWQgd2l0aCBhIGRlbGltaXRlciBhbmQgbm8gcHJldmlvdXMgY2h1bmtzIGV4aXN0OlxuICAgICAgICAgIC8vIEVucXVldWUgYW4gZW1wdHkgY2h1bmsuXG4gICAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKG5ldyBVaW50OEFycmF5KCkpO1xuICAgICAgICAgIGNodW5rU3RhcnQgPSBkaXNwb3NpdGlvbiA9PT0gXCJwcmVmaXhcIiA/IDAgOiAxO1xuICAgICAgICB9IGVsc2UgaWYgKGRlbGltaXRlZENodW5rRW5kID4gMCAmJiBidWZzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIC8vIE5vIHByZXZpb3VzIGNodW5rcywgc2xpY2UgZnJvbSBjdXJyZW50IGNodW5rLlxuICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShjaHVuay5zdWJhcnJheShjaHVua1N0YXJ0LCBkZWxpbWl0ZWRDaHVua0VuZCkpO1xuICAgICAgICAgIC8vIE91ciBjaHVuayBtYXkgaGF2ZSBtb3JlIHRoYW4gb25lIGRlbGltaXRlcjsgd2UgbXVzdCByZW1lbWJlciB3aGVyZVxuICAgICAgICAgIC8vIHRoZSBuZXh0IGRlbGltaXRlZCBjaHVuayBiZWdpbnMuXG4gICAgICAgICAgY2h1bmtTdGFydCA9IGRpc3Bvc2l0aW9uID09PSBcInByZWZpeFwiXG4gICAgICAgICAgICA/IGluc3BlY3RJbmRleCAtIDFcbiAgICAgICAgICAgIDogaW5zcGVjdEluZGV4O1xuICAgICAgICB9IGVsc2UgaWYgKGRlbGltaXRlZENodW5rRW5kID09PSAwICYmIGJ1ZnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIC8vIE91ciBjaHVuayBzdGFydGVkIHdpdGggYSBkZWxpbWl0ZXIsIHByZXZpb3VzIGNodW5rcyBhcmUgcGFzc2VkIGFzXG4gICAgICAgICAgLy8gdGhleSBhcmUgKHdpdGggY29uY2F0ZW5hdGlvbikuXG4gICAgICAgICAgaWYgKGJ1ZnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAvLyBDb25jYXQgbm90IG5lZWRlZCB3aGVuIGEgc2luZ2xlIGJ1ZmZlciBpcyBwYXNzZWQuXG4gICAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUoYnVmc1swXSEpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUoY29uY2F0KGJ1ZnMpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gRHJvcCBhbGwgcHJldmlvdXMgY2h1bmtzLlxuICAgICAgICAgIGJ1ZnMubGVuZ3RoID0gMDtcbiAgICAgICAgICBpZiAoZGlzcG9zaXRpb24gIT09IFwicHJlZml4XCIpIHtcbiAgICAgICAgICAgIC8vIHN1ZmZpeCBvciBkaXNjYXJkOiBUaGUgbmV4dCBjaHVuayBzdGFydHMgd2hlcmUgb3VyIGluc3BlY3Rpb24gZmluaXNoZWQuXG4gICAgICAgICAgICAvLyBXZSBzaG91bGQgb25seSBldmVyIGVuZCB1cCBoZXJlIHdpdGggYSBkaXNjYXJkIGRpc3Bvc2l0aW9uIGFzXG4gICAgICAgICAgICAvLyBmb3IgYSBzdWZmaXggZGlzcG9zaXRpb24gdGhpcyBicmFuY2ggd291bGQgbWVhbiB0aGF0IHRoZSBwcmV2aW91c1xuICAgICAgICAgICAgLy8gY2h1bmsgZW5kZWQgd2l0aCBhIGZ1bGwgbWF0Y2ggYnV0IHdhcyBub3QgZW5xdWV1ZWQuXG4gICAgICAgICAgICBjaHVua1N0YXJ0ID0gaW5zcGVjdEluZGV4O1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChkZWxpbWl0ZWRDaHVua0VuZCA+IDAgJiYgYnVmcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgLy8gUHJldmlvdXMgY2h1bmtzIGFuZCBjdXJyZW50IGNodW5rIHRvZ2V0aGVyIGZvcm0gYSBkZWxpbWl0ZWQgY2h1bmsuXG4gICAgICAgICAgY29uc3QgY2h1bmtTbGljZWQgPSBjaHVuay5zdWJhcnJheShjaHVua1N0YXJ0LCBkZWxpbWl0ZWRDaHVua0VuZCk7XG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0gY29uY2F0KFsuLi5idWZzLCBjaHVua1NsaWNlZF0pO1xuICAgICAgICAgIGJ1ZnMubGVuZ3RoID0gMDtcbiAgICAgICAgICBjaHVua1N0YXJ0ID0gZGlzcG9zaXRpb24gPT09IFwicHJlZml4XCJcbiAgICAgICAgICAgID8gZGVsaW1pdGVkQ2h1bmtFbmRcbiAgICAgICAgICAgIDogaW5zcGVjdEluZGV4O1xuICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShyZXN1bHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIFwiVGhpcyBzaG91bGQgYmUgdW5yZWFjaGFibGUsIHBsZWFzZSBmaWxlIGEgYnVnIHJlcG9ydCBhZ2FpbnN0IERlbm8gYXQgaHR0cHM6Ly9naXRodWIuY29tL2Rlbm9sYW5kL3N0ZC9pc3N1ZXNcIixcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbnNwZWN0SW5kZXgrKztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNodW5rU3RhcnQgPT09IDApIHtcbiAgICAgIGJ1ZnMucHVzaChjaHVuayk7XG4gICAgfSBlbHNlIGlmIChjaHVua1N0YXJ0IDwgbGVuZ3RoKSB7XG4gICAgICAvLyBJZiB3ZSBtYXRjaGVkIHBhcnRpYWxseSBzb21ld2hlcmUgaW4gdGhlIG1pZGRsZSBvZiBvdXIgY2h1bmtcbiAgICAgIC8vIHRoZW4gdGhlIHJlbW5hbnRzIHNob3VsZCBiZSBwdXNoZWQgaW50byBidWZmZXJzLlxuICAgICAgYnVmcy5wdXNoKGNodW5rLnN1YmFycmF5KGNodW5rU3RhcnQpKTtcbiAgICB9XG4gIH1cblxuICAjZmx1c2goY29udHJvbGxlcjogVHJhbnNmb3JtU3RyZWFtRGVmYXVsdENvbnRyb2xsZXI8VWludDhBcnJheT4pIHtcbiAgICBjb25zdCBidWZzID0gdGhpcy4jYnVmcztcbiAgICBjb25zdCBsZW5ndGggPSBidWZzLmxlbmd0aDtcbiAgICBpZiAobGVuZ3RoID09PSAwKSB7XG4gICAgICBjb250cm9sbGVyLmVucXVldWUobmV3IFVpbnQ4QXJyYXkoKSk7XG4gICAgfSBlbHNlIGlmIChsZW5ndGggPT09IDEpIHtcbiAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShidWZzWzBdISk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShjb25jYXQoYnVmcykpO1xuICAgIH1cbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFFckMsU0FBUyxNQUFNLFFBQVEsK0JBQStCO0FBQ3RELFNBQVMsU0FBUyxRQUFRLGVBQWU7QUFzQnpDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBcUNDLEdBQ0QsT0FBTyxNQUFNLHdCQUF3QjtFQUNuQyxDQUFBLElBQUssR0FBaUIsRUFBRSxDQUFDO0VBQ3pCLENBQUEsU0FBVSxDQUFhO0VBQ3ZCLENBQUEsVUFBVyxHQUFHLEVBQUU7RUFDaEIsQ0FBQSxRQUFTLENBQW9CO0VBQzdCLENBQUEsSUFBSyxDQUF1QjtFQUU1Qjs7Ozs7R0FLQyxHQUNELFlBQ0UsU0FBcUIsRUFDckIsVUFBa0MsQ0FBQyxDQUFDLENBQ3BDO0lBQ0EsS0FBSyxDQUFDO01BQ0osV0FBVyxDQUFDLE9BQU8sYUFDakIsVUFBVSxNQUFNLEtBQUssSUFDakIsSUFBSSxDQUFDLENBQUEsVUFBVyxDQUFDLE9BQU8sY0FDeEIsSUFBSSxDQUFDLENB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
// denoCacheMetadata=6923382202421104851,8455488142301656165