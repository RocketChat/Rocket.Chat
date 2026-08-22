import { Buffer } from 'node:buffer';

import { decode, Decoder, encode, Encoder, ExtensionCodec } from '@msgpack/msgpack';
import { App } from '@rocket.chat/apps-engine/definition/App';

import { ErrorObject, JsonRpcError, NotificationObject, RequestObject, SuccessObject, type Defined, type ID, type RpcParams } from './jsonrpc';
import { applySecureFields, type WithSecureFields } from './secureFields';

const FUNCTION_DISABLER_EXT = 0;
const BUFFER_HANDLER_EXT = 1;
const SECURE_FIELDS_HANDLER_EXT = 2;
const JSONRPC_HANDLER_EXT = 3;

// Discriminants for the JSON-RPC envelope classes inside the extension payload.
const JSONRPC_REQUEST = 0;
const JSONRPC_NOTIFICATION = 1;
const JSONRPC_SUCCESS = 2;
const JSONRPC_ERROR = 3;

const extensionCodec = new ExtensionCodec();

extensionCodec.register({
	type: FUNCTION_DISABLER_EXT,
	encode: (object: unknown) => {
		// We don't care about functions, but also don't want to throw an error
		if (typeof object === 'function' || object instanceof App) {
			return new Uint8Array(0);
		}

		return null;
	},
	decode: (_data: Uint8Array) => undefined,
});

// Since Deno doesn't have Buffer by default, we need to use Uint8Array
extensionCodec.register({
	type: BUFFER_HANDLER_EXT,
	encode: (object: unknown) => {
		if (object instanceof Buffer) {
			return new Uint8Array(object.buffer, object.byteOffset, object.byteLength);
		}

		return null;
	},
	// msgpack will reuse the Uint8Array instance, so WE NEED to copy it instead of simply creating a view
	decode: (data: Uint8Array) => {
		return Buffer.from(data);
	},
});

extensionCodec.register({
	type: SECURE_FIELDS_HANDLER_EXT,
	encode: (_object: unknown) => null,
	decode: (data: Uint8Array) => applySecureFields(decode(data, { extensionCodec }) as WithSecureFields<Record<string, unknown>>),
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

export const encoder = new Encoder({ extensionCodec });
export const decoder = new Decoder({ extensionCodec });
