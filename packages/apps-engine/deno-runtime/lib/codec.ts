import { Decoder, Encoder } from '@msgpack/msgpack';

import type { App as _App } from '@rocket.chat/apps-engine/definition/App.ts';

export const encoder = new Encoder({ });
export const decoder = new Decoder({ });
