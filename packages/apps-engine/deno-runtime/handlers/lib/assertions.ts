import type { App } from '@rocket.chat/apps-engine/definition/App.ts';
import { JsonRpcError } from 'jsonrpc-lite';

export function isRecord(v: unknown): v is Record<string, unknown> {
	if (!v || typeof v !== 'object') {
		return false;
	}

	const prototype = Object.getPrototypeOf(v);

	return prototype === null || prototype.constructor === Object;
}

/**
 * Type guard function to check if a value is included in a readonly array
 * and narrow its type accordingly.
 */
export function isOneOf<T>(value: unknown, array: readonly T[]): value is T {
	return array.includes(value as T);
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
