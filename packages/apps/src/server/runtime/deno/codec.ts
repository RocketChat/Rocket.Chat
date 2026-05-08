import {
	Decoder as _Decoder,
	Encoder as _Encoder,
	ExtensionCodec,
	decode as decodeMsgpack,
	encode as encodeMsgpack,
} from '@msgpack/msgpack';

const ABAC_ATTRIBUTES_KEY = 'abacAttributes';

const registerSharedTypes = (extensionCodec: ExtensionCodec): void => {
	extensionCodec.register({
		type: 0,
		encode: (object: unknown) => {
			// We don't care about functions, but also don't want to throw an error
			if (typeof object === 'function') {
				return new Uint8Array([0]);
			}
		},

		decode: (_data: Uint8Array) => undefined,
	});

	// We need to handle Buffers because Deno needs its own decoding
	extensionCodec.register({
		type: 1,
		encode: (object: unknown) => {
			if (object instanceof Buffer) {
				return new Uint8Array(object.buffer, object.byteOffset, object.byteLength);
			}
		},

		// msgpack will reuse the Uint8Array instance, so WE NEED to copy it instead of simply creating a view
		decode: (data: Uint8Array) => Buffer.from(data),
	});
};

export type Encoder = {
	encode(data: unknown): Uint8Array;
};

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
export const newEncoder = (canReadAbacAttributes: () => boolean): Encoder => {
	const extensionCodec = new ExtensionCodec();
	registerSharedTypes(extensionCodec);

	extensionCodec.register({
		type: 2,
		encode: (object: unknown) => {
			if (typeof object !== 'object' || object === null || !(ABAC_ATTRIBUTES_KEY in object)) {
				return null;
			}

			if (canReadAbacAttributes()) {
				return null;
			}

			const rest = { ...object };
			delete (rest as Record<string, unknown>)[ABAC_ATTRIBUTES_KEY];
			return encodeMsgpack(rest, { extensionCodec });
		},
		decode: (data: Uint8Array) => decodeMsgpack(data, { extensionCodec }),
	});

	const encoder = new _Encoder({ extensionCodec });
	return { encode: (data: unknown) => encoder.encode(data) };
};

export const newDecoder = (): _Decoder => {
	const extensionCodec = new ExtensionCodec();
	registerSharedTypes(extensionCodec);

	extensionCodec.register({
		type: 2,
		encode: () => null,
		decode: (data: Uint8Array) => decodeMsgpack(data, { extensionCodec }),
	});

	return new _Decoder({ extensionCodec });
};

export type Decoder = _Decoder;
