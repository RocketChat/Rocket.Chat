import { Buffer } from 'node:buffer';

import { Decoder, Encoder, ExtensionCodec } from '@msgpack/msgpack';
import { App } from '@rocket.chat/apps-engine/definition/App';

import { applySecureFields, type WithSecureFields } from './secureFields';

const FUNCTION_DISABLER_EXT = 0;
const BUFFER_HANDLER_EXT = 1;
const SECURE_FIELDS_HANDLER_EXT = 2;

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

	/**
	 * The nested pass needs a decoder of its own, because the outer one sits mid-message.
	 * It gets a fresh instance rather than a pooled one: `new Decoder()` allocates no
	 * buffer, so it costs ~7 ns, while a pooled instance would keep `data` — a view into
	 * the whole outer frame — reachable until its next nested decode.
	 */
	decode: (data: Uint8Array) =>
		applySecureFields(new Decoder({ extensionCodec }).decode(data) as WithSecureFields<Record<string, unknown>>),
});

export const encoder = new Encoder({ extensionCodec });
export const decoder = new Decoder({ extensionCodec });
