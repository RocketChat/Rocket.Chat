import type { WithSecureFields } from '@rocket.chat/apps/dist/lib/SecureFields';
import { hasSecureFields, kSecureFields } from '@rocket.chat/apps/dist/lib/SecureFields';
import type { App } from '@rocket.chat/apps-engine/definition/App';

import { AppObjectRegistry } from '../AppObjectRegistry';

export type { WithSecureFields } from '@rocket.chat/apps/dist/lib/SecureFields';

export function applySecureFields(object: WithSecureFields<Record<string, unknown>>) {
	const { [kSecureFields]: secureFields, ...rest } = object;

	const app = AppObjectRegistry.get<App>('app');

	if (!app) {
		throw new Error("App unavailable, can't parse object with secure fields");
	}

	secureFields.forEach(({ permission, name, value }) => {
		if (!app.getInfo().permissions?.find((p) => p.name === permission)) {
			return;
		}

		rest[name] = value;
	});

	return rest;
}

const isTraversable = (value: object): boolean =>
	!(value instanceof Date) &&
	!(value instanceof RegExp) &&
	!(value instanceof Error) &&
	!(value instanceof ArrayBuffer) &&
	!ArrayBuffer.isView(value);

function walk(value: unknown, seen: WeakSet<object>): unknown {
	if (value === null || typeof value !== 'object') {
		return value;
	}

	if (seen.has(value)) {
		return value;
	}

	seen.add(value);

	if (!isTraversable(value)) {
		return value;
	}

	if (Array.isArray(value)) {
		value.forEach((item, index) => {
			value[index] = walk(item, seen);
		});

		return value;
	}

	if (value instanceof Map) {
		value.forEach((item, key) => value.set(key, walk(item, seen)));

		return value;
	}

	if (value instanceof Set) {
		for (const item of value) {
			const walked = walk(item, seen);

			if (walked !== item) {
				value.delete(item);
				value.add(walked);
			}
		}

		return value;
	}

	let target = value as Record<string, unknown>;

	if (hasSecureFields(target)) {
		target = applySecureFields(target as WithSecureFields<Record<string, unknown>>);
		seen.add(target);
	}

	for (const key of Object.keys(target)) {
		target[key] = walk(target[key], seen);
	}

	return target;
}

/**
 * Applies secure-field descriptors found anywhere in a value received from the
 * host process.
 *
 * Messages arrive over the IPC channel as plain structured-clone output, and an
 * object carrying the secure-fields marker can sit at any depth of a request's
 * params or a response's result, so the whole value is walked and
 * {@link applySecureFields} is invoked wherever the marker shows up. Objects
 * carrying the marker are replaced (not mutated), while the rest of the
 * structure is updated in place.
 */
export function applySecureFieldsDeep<T>(value: T): T {
	return walk(value, new WeakSet()) as T;
}
