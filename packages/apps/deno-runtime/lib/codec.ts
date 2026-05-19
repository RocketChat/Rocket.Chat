import { Buffer } from 'node:buffer';

import { decode, Decoder, Encoder, ExtensionCodec } from '@msgpack/msgpack';
import type { App as _App } from '@rocket.chat/apps-engine/definition/App';

import { require } from './require.ts';
import { applySecureFields, type WithSecureFields } from './secureFields.ts';

const FUNCTION_DISABLER_EXT = 0;
const BUFFER_HANDLER_EXT = 1;
const SECURE_FIELDS_HANDLER_EXT = 2;

const { App } = require('@rocket.chat/apps-engine/definition/App.js') as {
	App: typeof _App;
};

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

export const encoder = new Encoder({ extensionCodec });
export const decoder = new Decoder({ extensionCodec });
