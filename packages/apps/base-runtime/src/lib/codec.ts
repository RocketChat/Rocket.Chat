import { Buffer } from 'node:buffer';

import { Decoder, Encoder, ExtensionCodec } from '@msgpack/msgpack';
import { App } from '@rocket.chat/apps-engine/definition/App';

import { applySecureFields, type WithSecureFields } from './secureFields';

const FUNCTION_DISABLER_EXT = 0;
const BUFFER_HANDLER_EXT = 1;
const SECURE_FIELDS_HANDLER_EXT = 2;

const extensionCodec = new ExtensionCodec();

/**
 * msgpack's module-level `decode()` builds a whole `Decoder`, with its 2 KiB buffer,
 * on every call. The extension below calls it once per object that carries secure
 * fields, and that setup measured at ~1.4 us - enough to dominate a small bridge
 * call, which is most of this bridge's traffic. Leasing a long-lived instance instead
 * removes the setup and leaves only the work.
 *
 * The lease has to be reentrant. The nested pass walks the object's own fields, and
 * one of those can carry secure fields in turn, which deserializes again. Handing an
 * inner call the instance an outer call is still reading from would corrupt both, so
 * a busy instance is never lent twice: the pool grows one slot per level of nesting
 * and settles there.
 *
 * `Decoder#decode` resets its state on entry, so an instance stays usable after a
 * call that threw.
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
