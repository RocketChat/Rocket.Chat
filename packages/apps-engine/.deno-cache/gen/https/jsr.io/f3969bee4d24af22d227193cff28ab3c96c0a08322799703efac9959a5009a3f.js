// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
/** Options for {@linkcode TextLineStream}. */ /**
 * Transform a stream into a stream where each chunk is divided by a newline,
 * be it `\n` or `\r\n`. `\r` can be enabled via the `allowCR` option.
 *
 * If you want to split by a custom delimiter, consider using {@linkcode TextDelimiterStream}.
 *
 * @example JSON Lines
 * ```ts
 * import { TextLineStream } from "@std/streams/text-line-stream";
 * import { toTransformStream } from "@std/streams/to-transform-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([
 *   '{"name": "Alice", "age": ',
 *   '30}\n{"name": "Bob", "age"',
 *   ": 25}\n",
 * ]);
 *
 * type Person = { name: string; age: number };
 *
 * // Split the stream by newline and parse each line as a JSON object
 * const jsonStream = stream.pipeThrough(new TextLineStream())
 *   .pipeThrough(toTransformStream(async function* (src) {
 *     for await (const chunk of src) {
 *       if (chunk.trim().length === 0) {
 *         continue;
 *       }
 *       yield JSON.parse(chunk) as Person;
 *     }
 *   }));
 *
 * assertEquals(
 *   await Array.fromAsync(jsonStream),
 *   [{ "name": "Alice", "age": 30 }, { "name": "Bob", "age": 25 }],
 * );
 * ```
 *
 * @example Allow splitting by `\r`
 *
 * ```ts
 * import { TextLineStream } from "@std/streams/text-line-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([
 *  "CR\rLF",
 *  "\nCRLF\r\ndone",
 * ]).pipeThrough(new TextLineStream({ allowCR: true }));
 *
 * const lines = await Array.fromAsync(stream);
 *
 * assertEquals(lines, ["CR", "LF", "CRLF", "done"]);
 * ```
 */ export class TextLineStream extends TransformStream {
  #currentLine = "";
  /**
   * Constructs a new instance.
   *
   * @param options Options for the stream.
   */ constructor(options = {
    allowCR: false
  }){
    super({
      transform: (chars, controller)=>{
        chars = this.#currentLine + chars;
        while(true){
          const lfIndex = chars.indexOf("\n");
          const crIndex = options.allowCR ? chars.indexOf("\r") : -1;
          if (crIndex !== -1 && crIndex !== chars.length - 1 && (lfIndex === -1 || lfIndex - 1 > crIndex)) {
            controller.enqueue(chars.slice(0, crIndex));
            chars = chars.slice(crIndex + 1);
            continue;
          }
          if (lfIndex === -1) break;
          const endIndex = chars[lfIndex - 1] === "\r" ? lfIndex - 1 : lfIndex;
          controller.enqueue(chars.slice(0, endIndex));
          chars = chars.slice(lfIndex + 1);
        }
        this.#currentLine = chars;
      },
      flush: (controller)=>{
        if (this.#currentLine === "") return;
        const currentLine = options.allowCR && this.#currentLine.endsWith("\r") ? this.#currentLine.slice(0, -1) : this.#currentLine;
        controller.enqueue(currentLine);
      }
    });
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vanNyLmlvL0BzdGQvc3RyZWFtcy8xLjAuMTYvdGV4dF9saW5lX3N0cmVhbS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI1IHRoZSBEZW5vIGF1dGhvcnMuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vKiogT3B0aW9ucyBmb3Ige0BsaW5rY29kZSBUZXh0TGluZVN0cmVhbX0uICovXG5leHBvcnQgaW50ZXJmYWNlIFRleHRMaW5lU3RyZWFtT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBBbGxvdyBzcGxpdHRpbmcgYnkgYFxccmAuXG4gICAqXG4gICAqIEBkZWZhdWx0IHtmYWxzZX1cbiAgICovXG4gIGFsbG93Q1I/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybSBhIHN0cmVhbSBpbnRvIGEgc3RyZWFtIHdoZXJlIGVhY2ggY2h1bmsgaXMgZGl2aWRlZCBieSBhIG5ld2xpbmUsXG4gKiBiZSBpdCBgXFxuYCBvciBgXFxyXFxuYC4gYFxccmAgY2FuIGJlIGVuYWJsZWQgdmlhIHRoZSBgYWxsb3dDUmAgb3B0aW9uLlxuICpcbiAqIElmIHlvdSB3YW50IHRvIHNwbGl0IGJ5IGEgY3VzdG9tIGRlbGltaXRlciwgY29uc2lkZXIgdXNpbmcge0BsaW5rY29kZSBUZXh0RGVsaW1pdGVyU3RyZWFtfS5cbiAqXG4gKiBAZXhhbXBsZSBKU09OIExpbmVzXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgVGV4dExpbmVTdHJlYW0gfSBmcm9tIFwiQHN0ZC9zdHJlYW1zL3RleHQtbGluZS1zdHJlYW1cIjtcbiAqIGltcG9ydCB7IHRvVHJhbnNmb3JtU3RyZWFtIH0gZnJvbSBcIkBzdGQvc3RyZWFtcy90by10cmFuc2Zvcm0tc3RyZWFtXCI7XG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiQHN0ZC9hc3NlcnRcIjtcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSBSZWFkYWJsZVN0cmVhbS5mcm9tKFtcbiAqICAgJ3tcIm5hbWVcIjogXCJBbGljZVwiLCBcImFnZVwiOiAnLFxuICogICAnMzB9XFxue1wibmFtZVwiOiBcIkJvYlwiLCBcImFnZVwiJyxcbiAqICAgXCI6IDI1fVxcblwiLFxuICogXSk7XG4gKlxuICogdHlwZSBQZXJzb24gPSB7IG5hbWU6IHN0cmluZzsgYWdlOiBudW1iZXIgfTtcbiAqXG4gKiAvLyBTcGxpdCB0aGUgc3RyZWFtIGJ5IG5ld2xpbmUgYW5kIHBhcnNlIGVhY2ggbGluZSBhcyBhIEpTT04gb2JqZWN0XG4gKiBjb25zdCBqc29uU3RyZWFtID0gc3RyZWFtLnBpcGVUaHJvdWdoKG5ldyBUZXh0TGluZVN0cmVhbSgpKVxuICogICAucGlwZVRocm91Z2godG9UcmFuc2Zvcm1TdHJlYW0oYXN5bmMgZnVuY3Rpb24qIChzcmMpIHtcbiAqICAgICBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIHNyYykge1xuICogICAgICAgaWYgKGNodW5rLnRyaW0oKS5sZW5ndGggPT09IDApIHtcbiAqICAgICAgICAgY29udGludWU7XG4gKiAgICAgICB9XG4gKiAgICAgICB5aWVsZCBKU09OLnBhcnNlKGNodW5rKSBhcyBQZXJzb247XG4gKiAgICAgfVxuICogICB9KSk7XG4gKlxuICogYXNzZXJ0RXF1YWxzKFxuICogICBhd2FpdCBBcnJheS5mcm9tQXN5bmMoanNvblN0cmVhbSksXG4gKiAgIFt7IFwibmFtZVwiOiBcIkFsaWNlXCIsIFwiYWdlXCI6IDMwIH0sIHsgXCJuYW1lXCI6IFwiQm9iXCIsIFwiYWdlXCI6IDI1IH1dLFxuICogKTtcbiAqIGBgYFxuICpcbiAqIEBleGFtcGxlIEFsbG93IHNwbGl0dGluZyBieSBgXFxyYFxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBUZXh0TGluZVN0cmVhbSB9IGZyb20gXCJAc3RkL3N0cmVhbXMvdGV4dC1saW5lLXN0cmVhbVwiO1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIkBzdGQvYXNzZXJ0XCI7XG4gKlxuICogY29uc3Qgc3RyZWFtID0gUmVhZGFibGVTdHJlYW0uZnJvbShbXG4gKiAgXCJDUlxcckxGXCIsXG4gKiAgXCJcXG5DUkxGXFxyXFxuZG9uZVwiLFxuICogXSkucGlwZVRocm91Z2gobmV3IFRleHRMaW5lU3RyZWFtKHsgYWxsb3dDUjogdHJ1ZSB9KSk7XG4gKlxuICogY29uc3QgbGluZXMgPSBhd2FpdCBBcnJheS5mcm9tQXN5bmMoc3RyZWFtKTtcbiAqXG4gKiBhc3NlcnRFcXVhbHMobGluZXMsIFtcIkNSXCIsIFwiTEZcIiwgXCJDUkxGXCIsIFwiZG9uZVwiXSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFRleHRMaW5lU3RyZWFtIGV4dGVuZHMgVHJhbnNmb3JtU3RyZWFtPHN0cmluZywgc3RyaW5nPiB7XG4gICNjdXJyZW50TGluZSA9IFwiXCI7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdHMgYSBuZXcgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgZm9yIHRoZSBzdHJlYW0uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBUZXh0TGluZVN0cmVhbU9wdGlvbnMgPSB7IGFsbG93Q1I6IGZhbHNlIH0pIHtcbiAgICBzdXBlcih7XG4gICAgICB0cmFuc2Zvcm06IChjaGFycywgY29udHJvbGxlcikgPT4ge1xuICAgICAgICBjaGFycyA9IHRoaXMuI2N1cnJlbnRMaW5lICsgY2hhcnM7XG5cbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICBjb25zdCBsZkluZGV4ID0gY2hhcnMuaW5kZXhPZihcIlxcblwiKTtcbiAgICAgICAgICBjb25zdCBjckluZGV4ID0gb3B0aW9ucy5hbGxvd0NSID8gY2hhcnMuaW5kZXhPZihcIlxcclwiKSA6IC0xO1xuXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgY3JJbmRleCAhPT0gLTEgJiYgY3JJbmRleCAhPT0gKGNoYXJzLmxlbmd0aCAtIDEpICYmXG4gICAgICAgICAgICAobGZJbmRleCA9PT0gLTEgfHwgKGxmSW5kZXggLSAxKSA+IGNySW5kZXgpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUoY2hhcnMuc2xpY2UoMCwgY3JJbmRleCkpO1xuICAgICAgICAgICAgY2hhcnMgPSBjaGFycy5zbGljZShjckluZGV4ICsgMSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAobGZJbmRleCA9PT0gLTEpIGJyZWFrO1xuXG4gICAgICAgICAgY29uc3QgZW5kSW5kZXggPSBjaGFyc1tsZkluZGV4IC0gMV0gPT09IFwiXFxyXCIgPyBsZkluZGV4IC0gMSA6IGxmSW5kZXg7XG4gICAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKGNoYXJzLnNsaWNlKDAsIGVuZEluZGV4KSk7XG4gICAgICAgICAgY2hhcnMgPSBjaGFycy5zbGljZShsZkluZGV4ICsgMSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiNjdXJyZW50TGluZSA9IGNoYXJzO1xuICAgICAgfSxcbiAgICAgIGZsdXNoOiAoY29udHJvbGxlcikgPT4ge1xuICAgICAgICBpZiAodGhpcy4jY3VycmVudExpbmUgPT09IFwiXCIpIHJldHVybjtcbiAgICAgICAgY29uc3QgY3VycmVudExpbmUgPSBvcHRpb25zLmFsbG93Q1IgJiYgdGhpcy4jY3VycmVudExpbmUuZW5kc1dpdGgoXCJcXHJcIilcbiAgICAgICAgICA/IHRoaXMuI2N1cnJlbnRMaW5lLnNsaWNlKDAsIC0xKVxuICAgICAgICAgIDogdGhpcy4jY3VycmVudExpbmU7XG4gICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShjdXJyZW50TGluZSk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscURBQXFEO0FBQ3JELHFDQUFxQztBQUVyQyw0Q0FBNEMsR0FVNUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FvREMsR0FDRCxPQUFPLE1BQU0sdUJBQXVCO0VBQ2xDLENBQUEsV0FBWSxHQUFHLEdBQUc7RUFFbEI7Ozs7R0FJQyxHQUNELFlBQVksVUFBaUM7SUFBRSxTQUFTO0VBQU0sQ0FBQyxDQUFFO0lBQy9ELEtBQUssQ0FBQztNQUNKLFdBQVcsQ0FBQyxPQUFPO1FBQ2pCLFFBQVEsSUFBSSxDQUFDLENBQUEsV0FBWSxHQUFHO1FBRTVCLE1BQU8sS0FBTTtVQUNYLE1BQU0sVUFBVSxNQUFNLE9BQU8sQ0FBQztVQUM5QixNQUFNLFVBQVUsUUFBUSxPQUFPLEdBQUcsTUFBTSxPQUFPLENBQUMsUUFBUSxDQUFDO1VBRXpELElBQ0UsWUFBWSxDQUFDLEtBQUssWUFBYSxNQUFNLE1BQU0sR0FBRyxLQUM5QyxDQUFDLFlBQVksQ0FBQyxLQUFLLEFBQUMsVUFBVSxJQUFLLE9BQU8sR0FDMUM7WUFDQSxXQUFXLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxHQUFHO1lBQ2xDLFFBQVEsTUFBTSxLQUFLLENBQUMsVUFBVTtZQUM5QjtVQUNGO1VBRUEsSUFBSSxZQUFZLENBQUMsR0FBRztVQUVwQixNQUFNLFdBQVcsS0FBSyxDQUFDLFVBQVUsRUFBRSxLQUFLLE9BQU8sVUFBVSxJQUFJO1VBQzdELFdBQVcsT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEdBQUc7VUFDbEMsUUFBUSxNQUFNLEtBQUssQ0FBQyxVQUFVO1FBQ2hDO1FBRUEsSUFBSSxDQUFDLENBQUEsV0FBWSxHQUFHO01BQ3RCO01BQ0EsT0FBTyxDQUFDO1FBQ04sSUFBSSxJQUFJLENBQUMsQ0FBQSxXQUFZLEtBQUssSUFBSTtRQUM5QixNQUFNLGNBQWMsUUFBUSxPQUFPLElBQUksSUFBSSxDQUFDLENBQUEsV0FBWSxDQUFDLFFBQVEsQ0FBQyxRQUM5RCxJQUFJLENBQUMsQ0FBQSxXQUFZLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUM1QixJQUFJLENBQUMsQ0FBQSxXQUFZO1FBQ3JCLFdBQVcsT0FBTyxDQUFDO01BQ3JCO0lBQ0Y7RUFDRjtBQUNGIn0=
// denoCacheMetadata=8283189824296769579,3896305917153962316