import { Buffer } from 'node:buffer';
import { Decoder, Encoder, ExtensionCodec } from '@msgpack/msgpack';

import type { App as _App } from '@rocket.chat/apps-engine/definition/App.ts';
import { require } from "./require.ts";

const { App } = require('@rocket.chat/apps-engine/definition/App.js') as {
    App: typeof _App;
};

const extensionCodec = new ExtensionCodec();

extensionCodec.register({
    type: 0,
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
    type: 1,
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

export const encoder = new Encoder({ extensionCodec });
export const decoder = new Decoder({ extensionCodec });
