import type { App as _App } from '@rocket.chat/apps-engine/definition/App.ts';
import { JsonRpcError } from 'jsonrpc-lite';

import { require } from '../../lib/require.ts';
const { App } = require('@rocket.chat/apps-engine/definition/App.js') as {
	App: typeof _App;
};

export function assertAppAvailable(v: unknown): asserts v is _App {
	if (v instanceof App) return;

	throw JsonRpcError.internalError({ err: 'App object not available' });
}

// deno-lint-ignore ban-types -- Function is the best we can do at this time
export function assertHandlerFunction(v: unknown): asserts v is Function {
	if (v instanceof Function) return;

	throw JsonRpcError.internalError({ err: `Expected handler function, got ${v}` });
}
