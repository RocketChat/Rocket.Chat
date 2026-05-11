import { Decoder as _Decoder, Encoder as _Encoder, encode, ExtensionCodec } from '@msgpack/msgpack';

import { hasSecureFields } from '../../../lib/SecureFields';

const extensionCodec = new ExtensionCodec();

const FUNCTION_DISABLER_EXT = 0;
const BUFFER_HANDLER_EXT = 1;
const SECURE_FIELDS_HANDLER_EXT = 2;

extensionCodec.register({
	type: FUNCTION_DISABLER_EXT,
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
	type: BUFFER_HANDLER_EXT,
	encode: (object: unknown) => {
		if (object instanceof Buffer) {
			return new Uint8Array(object.buffer, object.byteOffset, object.byteLength);
		}
	},

	// msgpack will reuse the Uint8Array instance, so WE NEED to copy it instead of simply creating a view
	decode: (data: Uint8Array) => Buffer.from(data),
});

extensionCodec.register({
	type: SECURE_FIELDS_HANDLER_EXT,
	encode: (object: unknown, context = { ignoreNested: false }) => {
		if (context?.ignoreNested) {
			context.ignoreNested = false;
			return null;
		}

		if (hasSecureFields(object)) {
			return encode(object, { extensionCodec, context: { ignoreNested: true } });
		}
	},

	decode: (_data: Uint8Array) => undefined,
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
export const newEncoder = () => new _Encoder({ extensionCodec });
export const newDecoder = () => new _Decoder({ extensionCodec });

export type Encoder = _Encoder;
export type Decoder = _Decoder;
