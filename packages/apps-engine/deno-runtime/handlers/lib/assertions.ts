import type { App } from '@rocket.chat/apps-engine/definition/App.ts';
import { JsonRpcError } from 'jsonrpc-lite';

export function isRecord(v: unknown): v is Record<string, unknown> {
	return !!v && typeof v === 'object';
}

export function assertAppAvailable(v: unknown): asserts v is App {
	if (v && typeof (v as App)['extendConfiguration'] === 'function') return;

	throw JsonRpcError.internalError({ err: 'App object not available' });
}

// deno-lint-ignore ban-types -- Function is the best we can do at this time
export function assertHandlerFunction(v: unknown): asserts v is Function {
	if (v instanceof Function) return;

	throw JsonRpcError.internalError({ err: `Expected handler function, got ${v}` });
}
