import { Decoder as _Decoder, Encoder as _Encoder, ExtensionCodec } from '@msgpack/msgpack';

import { hasSecureFields } from '../../../lib/SecureFields';

const extensionCodec = new ExtensionCodec<SecureFieldsContext>();

const FUNCTION_DISABLER_EXT = 0;
const BUFFER_HANDLER_EXT = 1;
const SECURE_FIELDS_HANDLER_EXT = 2;

/**
 * The secure fields extension marks the root object as an extension type and then
 * runs a nested pass over its properties. `ignoreRoot` is how it tells that nested
 * pass apart from the outer one.
 */
type SecureFieldsContext = { ignoreRoot?: boolean; pool: NestedEncoderPool };

/**
 * The Secure Fields extension needs to use a different instance of the encoder to
 * handle its own fields, so we keep supporting instances around to avoid paying the
 * cost of instantiating them during the encoding process itself: `new Encoder()`
 * allocates a 2 KiB buffer and measures ~1.5 us, enough to dominate a small call.
 *
 * The pool has to be reentrant. A nested pass walks the object's own properties, and
 * one of those can carry secure fields in turn, which reaches this extension again.
 * Handing an inner call the instance an outer call is still writing into would corrupt
 * both, so a busy instance is never lent twice: the pool grows one slot per level of
 * nesting and settles there.
 *
 * An `Encoder` never shrinks its buffer, so a pool holds its high-water mark for as
 * long as it lives. That is why a pool belongs to one subprocess rather than to this
 * module: one large message must not leave every other app paying for its buffer.
 * `newEncoder` hands each subprocess a pool of its own, and the msgpack context is
 * what carries that pool to the extension below.
 */
type NestedEncoder = { encoder: _Encoder<SecureFieldsContext>; context: SecureFieldsContext };

type NestedEncoderPool = { encoders: NestedEncoder[]; depth: number };

/** Only the encode side fills a pool, but both sides need a context to carry one. */
function newContext(): SecureFieldsContext {
	return { pool: { encoders: [], depth: 0 } };
}

function createNestedEncoder(pool: NestedEncoderPool): NestedEncoder {
	const context: SecureFieldsContext = { pool };

	return { encoder: new _Encoder<SecureFieldsContext>({ extensionCodec, context }), context };
}

function encodeNested(value: unknown, pool: NestedEncoderPool): Uint8Array {
	pool.encoders[pool.depth] ??= createNestedEncoder(pool);

	const nested = pool.encoders[pool.depth];

	nested.context.ignoreRoot = true;

	pool.depth += 1;

	try {
		return nested.encoder.encode(value);
	} finally {
		pool.depth -= 1;
	}
}

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
	/**
	 * This extension doesn't really change the encoding process, but by
	 * not returning null or undefined, msgpack attributes the decoding of this
	 * object to this extension, allowing us to handle secure field logic on the
	 * subprocess side, without having to iterate through all objects in search
	 * of the field.
	 */
	encode: (object: unknown, context: SecureFieldsContext) => {
		// Ignoring the root object allows msgpack to take care of encoding the object's properties,
		// while we mark the root object itself as an extension type.
		if (context.ignoreRoot) {
			context.ignoreRoot = false;

			return null;
		}

		if (hasSecureFields(object)) {
			return encodeNested(object, context.pool);
		}
	},

	// We don't really need to handle decoding here, as the subprocess will never send a message with secure fields
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
export const newEncoder = () => new _Encoder<SecureFieldsContext>({ extensionCodec, context: newContext() });
export const newDecoder = () => new _Decoder<SecureFieldsContext>({ extensionCodec, context: newContext() });

export type Encoder = _Encoder<SecureFieldsContext>;
export type Decoder = _Decoder<SecureFieldsContext>;
