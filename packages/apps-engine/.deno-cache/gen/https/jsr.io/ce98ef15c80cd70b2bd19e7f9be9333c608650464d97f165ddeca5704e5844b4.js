// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { createLPS } from "./_common.ts";
/**
 * Transform a stream `string` into a stream where each chunk is divided by a
 * given delimiter.
 *
 * If you are working with a stream of `Uint8Array`, consider using {@linkcode DelimiterStream}.
 *
 * If you want to split by a newline, consider using {@linkcode TextLineStream}.
 *
 * @example Comma-separated values
 * ```ts
 * import { TextDelimiterStream } from "@std/streams/text-delimiter-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([
 *   "alice,20,",
 *   ",US,",
 * ]);
 *
 * const valueStream = stream.pipeThrough(new TextDelimiterStream(","));
 *
 * assertEquals(
 *   await Array.fromAsync(valueStream),
 *   ["alice", "20", "", "US", ""],
 * );
 * ```
 *
 * @example Semicolon-separated values with suffix disposition
 * ```ts
 * import { TextDelimiterStream } from "@std/streams/text-delimiter-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([
 *   "const a = 42;;let b =",
 *   " true;",
 * ]);
 *
 * const valueStream = stream.pipeThrough(
 *   new TextDelimiterStream(";", { disposition: "suffix" }),
 * );
 *
 * assertEquals(
 *   await Array.fromAsync(valueStream),
 *   ["const a = 42;", ";", "let b = true;", ""],
 * );
 * ```
 */ export class TextDelimiterStream extends TransformStream {
  #buf = "";
  #delimiter;
  #inspectIndex = 0;
  #matchIndex = 0;
  #delimLPS;
  #disp;
  /**
   * Constructs a new instance.
   *
   * @param delimiter A delimiter to split the stream by.
   * @param options Options for the stream.
   */ constructor(delimiter, options){
    super({
      transform: (chunk, controller)=>{
        this.#handle(chunk, controller);
      },
      flush: (controller)=>{
        controller.enqueue(this.#buf);
      }
    });
    this.#delimiter = delimiter;
    this.#delimLPS = createLPS(new TextEncoder().encode(delimiter));
    this.#disp = options?.disposition ?? "discard";
  }
  #handle(chunk, controller) {
    this.#buf += chunk;
    let localIndex = 0;
    while(this.#inspectIndex < this.#buf.length){
      if (chunk[localIndex] === this.#delimiter[this.#matchIndex]) {
        this.#inspectIndex++;
        localIndex++;
        this.#matchIndex++;
        if (this.#matchIndex === this.#delimiter.length) {
          // Full match
          const start = this.#inspectIndex - this.#delimiter.length;
          const end = this.#disp === "suffix" ? this.#inspectIndex : start;
          const copy = this.#buf.slice(0, end);
          controller.enqueue(copy);
          const shift = this.#disp === "prefix" ? start : this.#inspectIndex;
          this.#buf = this.#buf.slice(shift);
          this.#inspectIndex = this.#disp === "prefix" ? this.#delimiter.length : 0;
          this.#matchIndex = 0;
        }
      } else {
        if (this.#matchIndex === 0) {
          this.#inspectIndex++;
          localIndex++;
        } else {
          this.#matchIndex = this.#delimLPS[this.#matchIndex - 1];
        }
      }
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvc3RyZWFtcy8xLjAuMTYvdGV4dF9kZWxpbWl0ZXJfc3RyZWFtLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjUgdGhlIERlbm8gYXV0aG9ycy4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB7IGNyZWF0ZUxQUyB9IGZyb20gXCIuL19jb21tb24udHNcIjtcblxuaW1wb3J0IHR5cGUge1xuICBEZWxpbWl0ZXJEaXNwb3NpdGlvbixcbiAgRGVsaW1pdGVyU3RyZWFtT3B0aW9ucyxcbn0gZnJvbSBcIi4vZGVsaW1pdGVyX3N0cmVhbS50c1wiO1xuXG4vKipcbiAqIFRyYW5zZm9ybSBhIHN0cmVhbSBgc3RyaW5nYCBpbnRvIGEgc3RyZWFtIHdoZXJlIGVhY2ggY2h1bmsgaXMgZGl2aWRlZCBieSBhXG4gKiBnaXZlbiBkZWxpbWl0ZXIuXG4gKlxuICogSWYgeW91IGFyZSB3b3JraW5nIHdpdGggYSBzdHJlYW0gb2YgYFVpbnQ4QXJyYXlgLCBjb25zaWRlciB1c2luZyB7QGxpbmtjb2RlIERlbGltaXRlclN0cmVhbX0uXG4gKlxuICogSWYgeW91IHdhbnQgdG8gc3BsaXQgYnkgYSBuZXdsaW5lLCBjb25zaWRlciB1c2luZyB7QGxpbmtjb2RlIFRleHRMaW5lU3RyZWFtfS5cbiAqXG4gKiBAZXhhbXBsZSBDb21tYS1zZXBhcmF0ZWQgdmFsdWVzXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgVGV4dERlbGltaXRlclN0cmVhbSB9IGZyb20gXCJAc3RkL3N0cmVhbXMvdGV4dC1kZWxpbWl0ZXItc3RyZWFtXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSBSZWFkYWJsZVN0cmVhbS5mcm9tKFtcbiAqICAgXCJhbGljZSwyMCxcIixcbiAqICAgXCIsVVMsXCIsXG4gKiBdKTtcbiAqXG4gKiBjb25zdCB2YWx1ZVN0cmVhbSA9IHN0cmVhbS5waXBlVGhyb3VnaChuZXcgVGV4dERlbGltaXRlclN0cmVhbShcIixcIikpO1xuICpcbiAqIGFzc2VydEVxdWFscyhcbiAqICAgYXdhaXQgQXJyYXkuZnJvbUFzeW5jKHZhbHVlU3RyZWFtKSxcbiAqICAgW1wiYWxpY2VcIiwgXCIyMFwiLCBcIlwiLCBcIlVTXCIsIFwiXCJdLFxuICogKTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIFNlbWljb2xvbi1zZXBhcmF0ZWQgdmFsdWVzIHdpdGggc3VmZml4IGRpc3Bvc2l0aW9uXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgVGV4dERlbGltaXRlclN0cmVhbSB9IGZyb20gXCJAc3RkL3N0cmVhbXMvdGV4dC1kZWxpbWl0ZXItc3RyZWFtXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSBSZWFkYWJsZVN0cmVhbS5mcm9tKFtcbiAqICAgXCJjb25zdCBhID0gNDI7O2xldCBiID1cIixcbiAqICAgXCIgdHJ1ZTtcIixcbiAqIF0pO1xuICpcbiAqIGNvbnN0IHZhbHVlU3RyZWFtID0gc3RyZWFtLnBpcGVUaHJvdWdoKFxuICogICBuZXcgVGV4dERlbGltaXRlclN0cmVhbShcIjtcIiwgeyBkaXNwb3NpdGlvbjogXCJzdWZmaXhcIiB9KSxcbiAqICk7XG4gKlxuICogYXNzZXJ0RXF1YWxzKFxuICogICBhd2FpdCBBcnJheS5mcm9tQXN5bmModmFsdWVTdHJlYW0pLFxuICogICBbXCJjb25zdCBhID0gNDI7XCIsIFwiO1wiLCBcImxldCBiID0gdHJ1ZTtcIiwgXCJcIl0sXG4gKiApO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBUZXh0RGVsaW1pdGVyU3RyZWFtIGV4dGVuZHMgVHJhbnNmb3JtU3RyZWFtPHN0cmluZywgc3RyaW5nPiB7XG4gICNidWYgPSBcIlwiO1xuICAjZGVsaW1pdGVyOiBzdHJpbmc7XG4gICNpbnNwZWN0SW5kZXggPSAwO1xuICAjbWF0Y2hJbmRleCA9IDA7XG4gICNkZWxpbUxQUzogVWludDhBcnJheTtcbiAgI2Rpc3A6IERlbGltaXRlckRpc3Bvc2l0aW9uO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RzIGEgbmV3IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gZGVsaW1pdGVyIEEgZGVsaW1pdGVyIHRvIHNwbGl0IHRoZSBzdHJlYW0gYnkuXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgZm9yIHRoZSBzdHJlYW0uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBkZWxpbWl0ZXI6IHN0cmluZyxcbiAgICBvcHRpb25zPzogRGVsaW1pdGVyU3RyZWFtT3B0aW9ucyxcbiAgKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHJhbnNmb3JtOiAoY2h1bmssIGNvbnRyb2xsZXIpID0+IHtcbiAgICAgICAgdGhpcy4jaGFuZGxlKGNodW5rLCBjb250cm9sbGVyKTtcbiAgICAgIH0sXG4gICAgICBmbHVzaDogKGNvbnRyb2xsZXIpID0+IHtcbiAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKHRoaXMuI2J1Zik7XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy4jZGVsaW1pdGVyID0gZGVsaW1pdGVyO1xuICAgIHRoaXMuI2RlbGltTFBTID0gY3JlYXRlTFBTKG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShkZWxpbWl0ZXIpKTtcbiAgICB0aGlzLiNkaXNwID0gb3B0aW9ucz8uZGlzcG9zaXRpb24gPz8gXCJkaXNjYXJkXCI7XG4gIH1cblxuICAjaGFuZGxlKFxuICAgIGNodW5rOiBzdHJpbmcsXG4gICAgY29udHJvbGxlcjogVHJhbnNmb3JtU3RyZWFtRGVmYXVsdENvbnRyb2xsZXI8c3RyaW5nPixcbiAgKSB7XG4gICAgdGhpcy4jYnVmICs9IGNodW5rO1xuICAgIGxldCBsb2NhbEluZGV4ID0gMDtcbiAgICB3aGlsZSAodGhpcy4jaW5zcGVjdEluZGV4IDwgdGhpcy4jYnVmLmxlbmd0aCkge1xuICAgICAgaWYgKGNodW5rW2xvY2FsSW5kZXhdID09PSB0aGlzLiNkZWxpbWl0ZXJbdGhpcy4jbWF0Y2hJbmRleF0pIHtcbiAgICAgICAgdGhpcy4jaW5zcGVjdEluZGV4Kys7XG4gICAgICAgIGxvY2FsSW5kZXgrKztcbiAgICAgICAgdGhpcy4jbWF0Y2hJbmRleCsrO1xuICAgICAgICBpZiAodGhpcy4jbWF0Y2hJbmRleCA9PT0gdGhpcy4jZGVsaW1pdGVyLmxlbmd0aCkge1xuICAgICAgICAgIC8vIEZ1bGwgbWF0Y2hcbiAgICAgICAgICBjb25zdCBzdGFydCA9IHRoaXMuI2luc3BlY3RJbmRleCAtIHRoaXMuI2RlbGltaXRlci5sZW5ndGg7XG4gICAgICAgICAgY29uc3QgZW5kID0gdGhpcy4jZGlzcCA9PT0gXCJzdWZmaXhcIiA/IHRoaXMuI2luc3BlY3RJbmRleCA6IHN0YXJ0O1xuICAgICAgICAgIGNvbnN0IGNvcHkgPSB0aGlzLiNidWYuc2xpY2UoMCwgZW5kKTtcbiAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUoY29weSk7XG4gICAgICAgICAgY29uc3Qgc2hpZnQgPSB0aGlzLiNkaXNwID09PSBcInByZWZpeFwiID8gc3RhcnQgOiB0aGlzLiNpbnNwZWN0SW5kZXg7XG4gICAgICAgICAgdGhpcy4jYnVmID0gdGhpcy4jYnVmLnNsaWNlKHNoaWZ0KTtcbiAgICAgICAgICB0aGlzLiNpbnNwZWN0SW5kZXggPSB0aGlzLiNkaXNwID09PSBcInByZWZpeFwiXG4gICAgICAgICAgICA/IHRoaXMuI2RlbGltaXRlci5sZW5ndGhcbiAgICAgICAgICAgIDogMDtcbiAgICAgICAgICB0aGlzLiNtYXRjaEluZGV4ID0gMDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuI21hdGNoSW5kZXggPT09IDApIHtcbiAgICAgICAgICB0aGlzLiNpbnNwZWN0SW5kZXgrKztcbiAgICAgICAgICBsb2NhbEluZGV4Kys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy4jbWF0Y2hJbmRleCA9IHRoaXMuI2RlbGltTFBTW3RoaXMuI21hdGNoSW5kZXggLSAxXSE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxREFBcUQ7QUFDckQscUNBQXFDO0FBRXJDLFNBQVMsU0FBUyxRQUFRLGVBQWU7QUFPekM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTZDQyxHQUNELE9BQU8sTUFBTSw0QkFBNEI7RUFDdkMsQ0FBQSxHQUFJLEdBQUcsR0FBRztFQUNWLENBQUEsU0FBVSxDQUFTO0VBQ25CLENBQUEsWUFBYSxHQUFHLEVBQUU7RUFDbEIsQ0FBQSxVQUFXLEdBQUcsRUFBRTtFQUNoQixDQUFBLFFBQVMsQ0FBYTtFQUN0QixDQUFBLElBQUssQ0FBdUI7RUFFNUI7Ozs7O0dBS0MsR0FDRCxZQUNFLFNBQWlCLEVBQ2pCLE9BQWdDLENBQ2hDO0lBQ0EsS0FBSyxDQUFDO01BQ0osV0FBVyxDQUFDLE9BQU87UUFDakIsSUFBSSxDQUFDLENBQUEsTUFBTyxDQUFDLE9BQU87TUFDdEI7TUFDQSxPQUFPLENBQUM7UUFDTixXQUFXLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQSxHQUFJO01BQzlCO0lBQ0Y7SUFFQSxJQUFJLENBQUMsQ0FBQSxTQUFVLEdBQUc7SUFDbEIsSUFBSSxDQUFDLENBQUEsUUFBUyxHQUFHLFVBQVUsSUFBSSxjQUFjLE1BQU0sQ0FBQztJQUNwRCxJQUFJLENBQUMsQ0FBQSxJQUFLLEdBQUcsU0FBUyxlQUFlO0VBQ3ZDO0VBRUEsQ0FBQSxNQUFPLENBQ0wsS0FBYSxFQUNiLFVBQW9EO0lBRXBELElBQUksQ0FBQyxDQUFBLEdBQUksSUFBSTtJQUNiLElBQUksYUFBYTtJQUNqQixNQUFPLElBQUksQ0FBQyxDQUFBLFlBQWEsR0FBRyxJQUFJLENBQUMsQ0FBQSxHQUFJLENBQUMsTUFBTSxDQUFFO01BQzVDLElBQUksS0FBSyxDQUFDLFdBQVcsS0FBSyxJQUFJLENBQUMsQ0FBQSxTQUFVLENBQUMsSUFBSSxDQUFDLENBQUEsVUFBVyxDQUFDLEVBQUU7UUFDM0QsSUFBSSxDQUFDLENBQUEsWUFBYTtRQUNsQjtRQUNBLElBQUksQ0FBQyxDQUFBLFVBQVc7UUFDaEIsSUFBSSxJQUFJLENBQUMsQ0FBQSxVQUFXLEtBQUssSUFBSSxDQUFDLENBQUEsU0FBVSxDQUFDLE1BQU0sRUFBRTtVQUMvQyxhQUFhO1VBQ2IsTUFBTSxRQUFRLElBQUksQ0FBQyxDQUFBLFlBQWEsR0FBRyxJQUFJLENBQUMsQ0FBQSxTQUFVLENBQUMsTUFBTTtVQUN6RCxNQUFNLE1BQU0sSUFBSSxDQUFDLENBQUEsSUFBSyxLQUFLLFdBQVcsSUFBSSxDQUFDLENBQUEsWUFBYSxHQUFHO1VBQzNELE1BQU0sT0FBTyxJQUFJLENBQUMsQ0FBQSxHQUFJLENBQUMsS0FBSyxDQUFDLEdBQUc7VUFDaEMsV0FBVyxPQUFPLENBQUM7VUFDbkIsTUFBTSxRQUFRLElBQUksQ0FBQyxDQUFBLElBQUssS0FBSyxXQUFXLFFBQVEsSUFBSSxDQUFDLENBQUEsWUFBYTtVQUNsRSxJQUFJLENBQUMsQ0FBQSxHQUFJLEdBQUcsSUFBSSxDQUFDLENBQUEsR0FBSSxDQUFDLEtBQUssQ0FBQztVQUM1QixJQUFJLENBQUMsQ0FBQSxZQUFhLEdBQUcsSUFBSSxDQUFDLENBQUEsSUFBSyxLQUFLLFdBQ2hDLElBQUksQ0FBQyxDQUFBLFNBQVUsQ0FBQyxNQUFNLEdBQ3RCO1VBQ0osSUFBSSxDQUFDLENBQUEsVUFBVyxHQUFHO1FBQ3JCO01BQ0YsT0FBTztRQUNMLElBQUksSUFBSSxDQUFDLENBQUEsVUFBVyxLQUFLLEdBQUc7VUFDMUIsSUFBSSxDQUFDLENBQUEsWUFBYTtVQUNsQjtRQUNGLE9BQU87VUFDTCxJQUFJLENBQUMsQ0FBQSxVQUFXLEdBQUcsSUFBSSxDQUFDLENBQUEsUUFBUyxDQUFDLElBQUksQ0FBQyxDQUFBLFVBQVcsR0FBRyxFQUFFO1FBQ3pEO01BQ0Y7SUFDRjtFQUNGO0FBQ0YifQ==
// denoCacheMetadata=4299948649538119436,11113890129726622873