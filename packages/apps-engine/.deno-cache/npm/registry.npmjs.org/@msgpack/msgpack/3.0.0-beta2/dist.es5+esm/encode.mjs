import { Encoder } from "./Encoder.mjs";
/**
 * @deprecated No longer supported.
 */
export var defaultEncodeOptions = undefined;
/**
 * It encodes `value` in the MessagePack format and
 * returns a byte buffer.
 *
 * The returned buffer is a slice of a larger `ArrayBuffer`, so you have to use its `#byteOffset` and `#byteLength` in order to convert it to another typed arrays including NodeJS `Buffer`.
 */
export function encode(value, options) {
    var encoder = new Encoder(options);
    return encoder.encodeSharedRef(value);
}
//# sourceMappingURL=encode.mjs.map