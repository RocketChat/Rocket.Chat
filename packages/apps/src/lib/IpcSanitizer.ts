import { App } from '@rocket.chat/apps-engine/definition/App';

/**
 * Values that V8's structured clone algorithm serializes natively and that
 * carry no risk of holding non-cloneable values, so they can cross the IPC
 * channel untouched.
 */
const isNativelyCloneable = (value: object): boolean =>
	value instanceof Date || value instanceof RegExp || value instanceof Error || value instanceof ArrayBuffer || ArrayBuffer.isView(value);

function sanitize(value: unknown, seen: WeakMap<object, unknown>): unknown {
	if (typeof value === 'function' || typeof value === 'symbol') {
		return undefined;
	}

	if (value === null || typeof value !== 'object') {
		return value;
	}

	if (value instanceof App) {
		return undefined;
	}

	if (isNativelyCloneable(value)) {
		return value;
	}

	if (seen.has(value)) {
		return seen.get(value);
	}

	if (Array.isArray(value)) {
		const result: unknown[] = new Array(value.length);
		seen.set(value, result);

		value.forEach((item, index) => {
			result[index] = sanitize(item, seen);
		});

		return result;
	}

	if (value instanceof Map) {
		const result = new Map<unknown, unknown>();
		seen.set(value, result);

		value.forEach((item, key) => result.set(sanitize(key, seen), sanitize(item, seen)));

		return result;
	}

	if (value instanceof Set) {
		const result = new Set<unknown>();
		seen.set(value, result);

		value.forEach((item) => result.add(sanitize(item, seen)));

		return result;
	}

	const result: Record<string, unknown> = {};
	seen.set(value, result);

	for (const [key, item] of Object.entries(value)) {
		result[key] = sanitize(item, seen);
	}

	return result;
}

/**
 * Makes a value safe to send over the IPC channel between the host process and
 * an app subprocess.
 *
 * The channel uses V8's structured clone algorithm (`serialization: 'advanced'`),
 * which throws a `DataCloneError` when asked to serialize a function. Accessor
 * and bridge results on the host - and app handler results on the subprocess -
 * can legitimately carry functions or whole `App` instances, so those are
 * replaced with `undefined` while everything else is preserved, including
 * `Buffer`s, `Date`s, `Map`s/`Set`s, shared references and circular structures.
 */
export function sanitizeForIpc<T>(value: T): T {
	return sanitize(value, new WeakMap()) as T;
}
