import { Decoder as _Decoder, Encoder as _Encoder, decode, encode, ExtensionCodec } from '@msgpack/msgpack';

import { hasSecureFields } from '../../../lib/SecureFields';
import {
	ErrorObject,
	JsonRpcError,
	NotificationObject,
	RequestObject,
	SuccessObject,
	type Defined,
	type ID,
	type RpcParams,
} from '../../../lib/jsonrpc';

const extensionCodec = new ExtensionCodec();

const FUNCTION_DISABLER_EXT = 0;
const BUFFER_HANDLER_EXT = 1;
const SECURE_FIELDS_HANDLER_EXT = 2;
const JSONRPC_HANDLER_EXT = 3;

// Discriminants for the JSON-RPC envelope classes inside the extension payload.
const JSONRPC_REQUEST = 0;
const JSONRPC_NOTIFICATION = 1;
const JSONRPC_SUCCESS = 2;
const JSONRPC_ERROR = 3;

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
	encode: (object: unknown, context: { ignoreRoot?: boolean } = {}) => {
		// Ignoring the root object allows msgpack to take care of encoding the object's properties,
		// while we mark the root object itself as an extension type.
		if (context?.ignoreRoot) {
			context.ignoreRoot = false;

			return null;
		}

		if (hasSecureFields(object)) {
			return encode(object, { extensionCodec, context: { ignoreRoot: true } });
		}
	},

	// We don't really need to handle decoding here, as the subprocess will never send a message with secure fields
	decode: (_data: Uint8Array) => undefined,
});

/**
 * Tags the JSON-RPC envelope classes on the wire so the decoder rebuilds the exact
 * instance on the other side - this is the single place where the bridge maps between
 * the wire form and the `jsonrpc` classes, replacing a separate parse/categorization
 * step. The fields are (de)serialized through the same `extensionCodec`, so nested
 * Buffers and secure fields are still handled by their own extensions.
 */
extensionCodec.register({
	type: JSONRPC_HANDLER_EXT,
	encode: (object: unknown) => {
		if (object instanceof RequestObject) {
			return encode(
				object.params === undefined
					? [JSONRPC_REQUEST, object.id, object.method]
					: [JSONRPC_REQUEST, object.id, object.method, object.params],
				{ extensionCodec },
			);
		}

		if (object instanceof NotificationObject) {
			return encode(
				object.params === undefined ? [JSONRPC_NOTIFICATION, object.method] : [JSONRPC_NOTIFICATION, object.method, object.params],
				{ extensionCodec },
			);
		}

		if (object instanceof SuccessObject) {
			return encode([JSONRPC_SUCCESS, object.id, object.result], { extensionCodec });
		}

		if (object instanceof ErrorObject) {
			return encode([JSONRPC_ERROR, object.id, object.error.message, object.error.code, object.error.data], { extensionCodec });
		}

		return null;
	},

	decode: (data: Uint8Array) => {
		const [kind, ...rest] = decode(data, { extensionCodec }) as [number, ...unknown[]];

		switch (kind) {
			case JSONRPC_REQUEST:
				return new RequestObject(rest[0] as ID, rest[1] as string, rest[2] as RpcParams);
			case JSONRPC_NOTIFICATION:
				return new NotificationObject(rest[0] as string, rest[1] as RpcParams);
			case JSONRPC_SUCCESS:
				return new SuccessObject(rest[0] as ID, rest[1] as Defined);
			case JSONRPC_ERROR:
				return new ErrorObject(rest[0] as ID, new JsonRpcError(rest[1] as string, rest[2] as number, rest[3]));
			default:
				throw new Error(`Unknown JSON-RPC message kind: ${String(kind)}`);
		}
	},
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
