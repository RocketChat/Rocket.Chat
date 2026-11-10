// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
/**
 * A transform stream that only transforms from the zero-indexed `start` and
 * `end` bytes (both inclusive).
 *
 * @example Basic usage
 * ```ts
 * import { ByteSliceStream } from "@std/streams/byte-slice-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([
 *   new Uint8Array([0, 1]),
 *   new Uint8Array([2, 3, 4]),
 * ]);
 * const slicedStream = stream.pipeThrough(new ByteSliceStream(1, 3));
 *
 * assertEquals(
 *   await Array.fromAsync(slicedStream),
 *  [new Uint8Array([1]), new Uint8Array([2, 3])]
 * );
 * ```
 *
 * @example Get a range of bytes from a fetch response body
 * ```ts
 * import { ByteSliceStream } from "@std/streams/byte-slice-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const response = await fetch("https://example.com");
 * const rangedStream = response.body!
 *   .pipeThrough(new ByteSliceStream(3, 8));
 * const collected = await Array.fromAsync(rangedStream);
 * assertEquals(collected[0]?.length, 6);
 * ```
 */ export class ByteSliceStream extends TransformStream {
  #offsetStart = 0;
  #offsetEnd = 0;
  /**
   * Constructs a new instance.
   *
   * @param start The zero-indexed byte index to start reading from.
   * @param end The zero-indexed byte index to stop reading at. Inclusive.
   */ constructor(start = 0, end = Infinity){
    super({
      start: ()=>{
        if (start < 0) {
          throw new RangeError(`Cannot construct ByteSliceStream as start must be >= 0: received ${start}`);
        }
        end += 1;
      },
      transform: (chunk, controller)=>{
        this.#offsetStart = this.#offsetEnd;
        this.#offsetEnd += chunk.byteLength;
        if (this.#offsetEnd > start) {
          if (this.#offsetStart < start) {
            chunk = chunk.slice(start - this.#offsetStart);
          }
          if (this.#offsetEnd >= end) {
            chunk = chunk.slice(0, chunk.byteLength - this.#offsetEnd + end);
            controller.enqueue(chunk);
            controller.terminate();
          } else {
            controller.enqueue(chunk);
          }
        }
      }
    });
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvc3RyZWFtcy8xLjAuMTYvYnl0ZV9zbGljZV9zdHJlYW0udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNSB0aGUgRGVubyBhdXRob3JzLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBBIHRyYW5zZm9ybSBzdHJlYW0gdGhhdCBvbmx5IHRyYW5zZm9ybXMgZnJvbSB0aGUgemVyby1pbmRleGVkIGBzdGFydGAgYW5kXG4gKiBgZW5kYCBieXRlcyAoYm90aCBpbmNsdXNpdmUpLlxuICpcbiAqIEBleGFtcGxlIEJhc2ljIHVzYWdlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgQnl0ZVNsaWNlU3RyZWFtIH0gZnJvbSBcIkBzdGQvc3RyZWFtcy9ieXRlLXNsaWNlLXN0cmVhbVwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3Qgc3RyZWFtID0gUmVhZGFibGVTdHJlYW0uZnJvbShbXG4gKiAgIG5ldyBVaW50OEFycmF5KFswLCAxXSksXG4gKiAgIG5ldyBVaW50OEFycmF5KFsyLCAzLCA0XSksXG4gKiBdKTtcbiAqIGNvbnN0IHNsaWNlZFN0cmVhbSA9IHN0cmVhbS5waXBlVGhyb3VnaChuZXcgQnl0ZVNsaWNlU3RyZWFtKDEsIDMpKTtcbiAqXG4gKiBhc3NlcnRFcXVhbHMoXG4gKiAgIGF3YWl0IEFycmF5LmZyb21Bc3luYyhzbGljZWRTdHJlYW0pLFxuICogIFtuZXcgVWludDhBcnJheShbMV0pLCBuZXcgVWludDhBcnJheShbMiwgM10pXVxuICogKTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIEdldCBhIHJhbmdlIG9mIGJ5dGVzIGZyb20gYSBmZXRjaCByZXNwb25zZSBib2R5XG4gKiBgYGB0c1xuICogaW1wb3J0IHsgQnl0ZVNsaWNlU3RyZWFtIH0gZnJvbSBcIkBzdGQvc3RyZWFtcy9ieXRlLXNsaWNlLXN0cmVhbVwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcImh0dHBzOi8vZXhhbXBsZS5jb21cIik7XG4gKiBjb25zdCByYW5nZWRTdHJlYW0gPSByZXNwb25zZS5ib2R5IVxuICogICAucGlwZVRocm91Z2gobmV3IEJ5dGVTbGljZVN0cmVhbSgzLCA4KSk7XG4gKiBjb25zdCBjb2xsZWN0ZWQgPSBhd2FpdCBBcnJheS5mcm9tQXN5bmMocmFuZ2VkU3RyZWFtKTtcbiAqIGFzc2VydEVxdWFscyhjb2xsZWN0ZWRbMF0/Lmxlbmd0aCwgNik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIEJ5dGVTbGljZVN0cmVhbSBleHRlbmRzIFRyYW5zZm9ybVN0cmVhbTxVaW50OEFycmF5LCBVaW50OEFycmF5PiB7XG4gICNvZmZzZXRTdGFydCA9IDA7XG4gICNvZmZzZXRFbmQgPSAwO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RzIGEgbmV3IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gc3RhcnQgVGhlIHplcm8taW5kZXhlZCBieXRlIGluZGV4IHRvIHN0YXJ0IHJlYWRpbmcgZnJvbS5cbiAgICogQHBhcmFtIGVuZCBUaGUgemVyby1pbmRleGVkIGJ5dGUgaW5kZXggdG8gc3RvcCByZWFkaW5nIGF0LiBJbmNsdXNpdmUuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzdGFydCA9IDAsIGVuZDogbnVtYmVyID0gSW5maW5pdHkpIHtcbiAgICBzdXBlcih7XG4gICAgICBzdGFydDogKCkgPT4ge1xuICAgICAgICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXG4gICAgICAgICAgICBgQ2Fubm90IGNvbnN0cnVjdCBCeXRlU2xpY2VTdHJlYW0gYXMgc3RhcnQgbXVzdCBiZSA+PSAwOiByZWNlaXZlZCAke3N0YXJ0fWAsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBlbmQgKz0gMTtcbiAgICAgIH0sXG4gICAgICB0cmFuc2Zvcm06IChjaHVuaywgY29udHJvbGxlcikgPT4ge1xuICAgICAgICB0aGlzLiNvZmZzZXRTdGFydCA9IHRoaXMuI29mZnNldEVuZDtcbiAgICAgICAgdGhpcy4jb2Zmc2V0RW5kICs9IGNodW5rLmJ5dGVMZW5ndGg7XG4gICAgICAgIGlmICh0aGlzLiNvZmZzZXRFbmQgPiBzdGFydCkge1xuICAgICAgICAgIGlmICh0aGlzLiNvZmZzZXRTdGFydCA8IHN0YXJ0KSB7XG4gICAgICAgICAgICBjaHVuayA9IGNodW5rLnNsaWNlKHN0YXJ0IC0gdGhpcy4jb2Zmc2V0U3RhcnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGhpcy4jb2Zmc2V0RW5kID49IGVuZCkge1xuICAgICAgICAgICAgY2h1bmsgPSBjaHVuay5zbGljZSgwLCBjaHVuay5ieXRlTGVuZ3RoIC0gdGhpcy4jb2Zmc2V0RW5kICsgZW5kKTtcbiAgICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShjaHVuayk7XG4gICAgICAgICAgICBjb250cm9sbGVyLnRlcm1pbmF0ZSgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUoY2h1bmspO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHFEQUFxRDtBQUNyRCxxQ0FBcUM7QUFFckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBZ0NDLEdBQ0QsT0FBTyxNQUFNLHdCQUF3QjtFQUNuQyxDQUFBLFdBQVksR0FBRyxFQUFFO0VBQ2pCLENBQUEsU0FBVSxHQUFHLEVBQUU7RUFFZjs7Ozs7R0FLQyxHQUNELFlBQVksUUFBUSxDQUFDLEVBQUUsTUFBYyxRQUFRLENBQUU7SUFDN0MsS0FBSyxDQUFDO01BQ0osT0FBTztRQUNMLElBQUksUUFBUSxHQUFHO1VBQ2IsTUFBTSxJQUFJLFdBQ1IsQ0FBQyxpRUFBaUUsRUFBRSxPQUFPO1FBRS9FO1FBQ0EsT0FBTztNQUNUO01BQ0EsV0FBVyxDQUFDLE9BQU87UUFDakIsSUFBSSxDQUFDLENBQUEsV0FBWSxHQUFHLElBQUksQ0FBQyxDQUFBLFNBQVU7UUFDbkMsSUFBSSxDQUFDLENBQUEsU0FBVSxJQUFJLE1BQU0sVUFBVTtRQUNuQyxJQUFJLElBQUksQ0FBQyxDQUFBLFNBQVUsR0FBRyxPQUFPO1VBQzNCLElBQUksSUFBSSxDQUFDLENBQUEsV0FBWSxHQUFHLE9BQU87WUFDN0IsUUFBUSxNQUFNLEtBQUssQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFBLFdBQVk7VUFDL0M7VUFDQSxJQUFJLElBQUksQ0FBQyxDQUFBLFNBQVUsSUFBSSxLQUFLO1lBQzFCLFFBQVEsTUFBTSxLQUFLLENBQUMsR0FBRyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsQ0FBQSxTQUFVLEdBQUc7WUFDNUQsV0FBVyxPQUFPLENBQUM7WUFDbkIsV0FBVyxTQUFTO1VBQ3RCLE9BQU87WUFDTCxXQUFXLE9BQU8sQ0FBQztVQUNyQjtRQUNGO01BQ0Y7SUFDRjtFQUNGO0FBQ0YifQ==
// denoCacheMetadata=11036019546237163478,7328231602880956835