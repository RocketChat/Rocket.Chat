import { getBSONType } from '@rocket.chat/mongo-adapter';

import { entriesOf } from '../../lib/objectUtils';

export const hasOwn = Object.prototype.hasOwnProperty;

const isBinary = (x: unknown): x is Uint8Array => typeof x === 'object' && x !== null && x instanceof Uint8Array;

const isArguments = (x: unknown): x is IArguments => Object.prototype.toString.call(x) === '[object Arguments]';

const cloneValue = (v: unknown): unknown => {
	if (typeof v !== 'object') {
		return v;
	}

	if (v === null) {
		return null;
	}

	if (v instanceof Date) {
		return new Date(v.getTime());
	}

	if (v instanceof RegExp) {
		return v;
	}

	if (isBinary(v)) {
		const ret = new Uint8Array(new ArrayBuffer(v.length));
		for (let i = 0; i < v.length; i++) {
			ret[i] = v[i];
		}
		return ret;
	}

	if (Array.isArray(v)) {
		return v.map((item: unknown) => cloneValue(item));
	}

	if (isArguments(v)) {
		return Array.from(v, (item: unknown) => cloneValue(item));
	}

	if ('clone' in v && typeof v.clone === 'function') {
		return (v as { clone: () => unknown }).clone();
	}

	return Object.fromEntries(entriesOf(v).map(([key, value]) => [key, cloneValue(value)]));
};

export const clone = <T>(v: T): T => cloneValue(v) as T;

export const equals = <T>(a: T, b: T): boolean => {
	if (a === b) {
		return true;
	}

	if (!a || !b) {
		return false;
	}

	if (typeof a !== 'object' || typeof b !== 'object') {
		return false;
	}

	if (a instanceof Date && b instanceof Date) {
		return a.valueOf() === b.valueOf();
	}

	if (a instanceof Uint8Array && b instanceof Uint8Array) {
		if (a.length !== b.length) {
			return false;
		}
		for (let i = 0; i < a.length; i++) {
			if (a[i] !== b[i]) {
				return false;
			}
		}
		return true;
	}

	if (Array.isArray(a)) {
		if (!Array.isArray(b)) {
			return false;
		}

		if (a.length !== b.length) {
			return false;
		}

		for (let i = 0; i < a.length; i++) {
			if (!equals(a[i], b[i])) {
				return false;
			}
		}
		return true;
	}

	if (Object.keys(b).length !== Object.keys(a).length) {
		return false;
	}

	for (const key of Object.keys(a)) {
		if (!(key in b)) {
			return false;
		}

		if (!equals((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
			return false;
		}
	}

	return true;
};

export const isPlainObject = (x: any): x is Record<string, any> => Boolean(x) && getBSONType(x) === 3;

const invalidCharMsg = {
	'$': "start with '$'",
	'.': "contain '.'",
	'\0': 'contain null bytes',
};

export function assertHasValidFieldNames(doc: unknown) {
	if (doc && typeof doc === 'object') {
		JSON.stringify(doc, (key, value: unknown) => {
			assertIsValidFieldName(key);
			return value;
		});
	}
}

function assertIsValidFieldName(key: string) {
	let match;
	if (typeof key === 'string' && (match = key.match(/^\$|\.|\0/))) {
		throw new Error(`Key ${key} must not ${invalidCharMsg[match[0] as keyof typeof invalidCharMsg]}`);
	}
}
