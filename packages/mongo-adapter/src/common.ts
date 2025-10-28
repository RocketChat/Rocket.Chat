import { getBSONType } from './bson';
import { BSONType } from './types';

export function assertHasValidFieldNames(doc: unknown) {
	if (doc && typeof doc === 'object') {
		JSON.stringify(doc, (key, value) => {
			assertIsValidFieldName(key);
			return value;
		});
	}
}

export function assertIsValidFieldName(key: string) {
	if (typeof key !== 'string') {
		return;
	}

	const match = key.match(/^\$|\.|\0/);
	if (match) {
		switch (match[0]) {
			case '$':
				throw new Error(`Key ${key} must not start with '$'`);
			case '.':
				throw new Error(`Key ${key} must not contain '.'`);
			case '\0':
				throw new Error(`Key ${key} must not contain null bytes`);
			default:
				throw new Error(`Key ${key} contains invalid character: ${match[0]}`);
		}
	}
}

export const isBinary = (x: unknown): x is Uint8Array => typeof x === 'object' && x !== null && x instanceof Uint8Array;

const isArguments = (x: unknown): x is IArguments => Object.prototype.toString.call(x) === '[object Arguments]';

export const clone: <T>(v: T) => T = (v: unknown) => {
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
		return v.map(clone);
	}

	if (isArguments(v)) {
		return Array.from(v, clone);
	}

	if ('clone' in v && typeof v.clone === 'function') {
		return v.clone();
	}

	return Object.fromEntries(Object.entries(v).map(([key, value]) => [key, clone(value)]));
};

export const isNumericKey = (s: string) => /^\d+$/.test(s);

export const isPlainObject = (x: unknown): x is Record<string, any> => !!x && getBSONType(x) === BSONType.Object;

export const isIndexable = (obj: unknown): obj is Record<string | number, any> => Array.isArray(obj) || isPlainObject(obj);

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

export const isEmptyArray = <T>(value: unknown): value is T[] & { length: 0 } => Array.isArray(value) && value.length === 0;

export const isTruthy = <T>(x: T | null | undefined | 0 | false | ''): x is T => Boolean(x);
