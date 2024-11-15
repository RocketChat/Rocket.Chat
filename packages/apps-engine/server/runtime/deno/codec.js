"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decoder = exports.encoder = void 0;
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
exports.encoder = new msgpack_1.Encoder({ extensionCodec });
exports.decoder = new msgpack_1.Decoder({ extensionCodec });
//# sourceMappingURL=codec.js.map