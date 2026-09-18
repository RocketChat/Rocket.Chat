import { Decoder } from "./Decoder.mjs";
/**
 * @deprecated No longer supported.
 */
export var defaultDecodeOptions = undefined;
/**
 * It decodes a single MessagePack object in a buffer.
 *
 * This is a synchronous decoding function.
 * See other variants for asynchronous decoding: {@link decodeAsync()}, {@link decodeStream()}, or {@link decodeArrayStream()}.
 *
 * @throws {@link RangeError} if the buffer is incomplete, including the case where the buffer is empty.
 * @throws {@link DecodeError} if the buffer contains invalid data.
 */
export function decode(buffer, options) {
    var decoder = new Decoder(options);
    return decoder.decode(buffer);
}
/**
 * It decodes multiple MessagePack objects in a buffer.
 * This is corresponding to {@link decodeMultiStream()}.
 *
 * @throws {@link RangeError} if the buffer is incomplete, including the case where the buffer is empty.
 * @throws {@link DecodeError} if the buffer contains invalid data.
 */
export function decodeMulti(buffer, options) {
    var decoder = new Decoder(options);
    return decoder.decodeMulti(buffer);
}
//# sourceMappingURL=decode.mjs.map