import { Buffer } from 'node:buffer';

import { Decoder, Encoder, ExtensionCodec } from '@msgpack/msgpack';
import { App } from '@rocket.chat/apps-engine/definition/App';

import { applySecureFields, type WithSecureFields } from './secureFields';

const FUNCTION_DISABLER_EXT = 0;
const BUFFER_HANDLER_EXT = 1;
const SECURE_FIELDS_HANDLER_EXT = 2;

const extensionCodec = new ExtensionCodec();

/**
 * The Secure Fields extension needs to use a different instance of the decoder to
 * handle its own fields, so we keep supporting instances around to avoid paying the
 * cost of instantiating them during the decoding process itself.
 */
const nestedDecoders: Decoder[] = [];
let nestedDecoderDepth = 0;

function decodeNested(data: Uint8Array): unknown {
	nestedDecoders[nestedDecoderDepth] ??= new Decoder({ extensionCodec });

	const decoder = nestedDecoders[nestedDecoderDepth];

	nestedDecoderDepth += 1;

	try {
		return decoder.decode(data);
	} finally {
		nestedDecoderDepth -= 1;
	}
}

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
	decode: (data: Uint8Array) => applySecureFields(decodeNested(data) as WithSecureFields<Record<string, unknown>>),
});

export const encoder = new Encoder({ extensionCodec });
export const decoder = new Decoder({ extensionCodec });
