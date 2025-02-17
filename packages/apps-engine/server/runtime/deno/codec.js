"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newDecoder = exports.newEncoder = void 0;
const msgpack_1 = require("@msgpack/msgpack");
const extensionCodec = new msgpack_1.ExtensionCodec();
extensionCodec.register({
    type: 0,
    encode: (object) => {
        // We don't care about functions, but also don't want to throw an error
        if (typeof object === 'function') {
            return new Uint8Array([0]);
        }
    },
    decode: (_data) => undefined,
});
// We need to handle Buffers because Deno needs its own decoding
extensionCodec.register({
    type: 1,
    encode: (object) => {
        if (object instanceof Buffer) {
            return new Uint8Array(object.buffer, object.byteOffset, object.byteLength);
        }
    },
    // msgpack will reuse the Uint8Array instance, so WE NEED to copy it instead of simply creating a view
    decode: (data) => Buffer.from(data),
});
/**
 * The Encoder and Decoder classes perform "stateful" operations, i.e. they read from a
 * stream, store the data locally and decode it from its buffer.
 *
 * In practice, this affects the decoder when there is decode error. After an error, the decoder
 * keeps the malformed data in its buffer, and even if we try to decode from another source (e.g. different stream)
 * it will fail again as there's still data in the buffer.
 *
 * For that reason, we can't have a singleton instance of Encoder and Decoder, but rather one
 * instance for each time we create a new subprocess
 */
const newEncoder = () => new msgpack_1.Encoder({ extensionCodec });
exports.newEncoder = newEncoder;
const newDecoder = () => new msgpack_1.Decoder({ extensionCodec });
exports.newDecoder = newDecoder;
//# sourceMappingURL=codec.js.map