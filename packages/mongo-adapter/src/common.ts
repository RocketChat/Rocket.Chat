import { getBSONType } from './bson';
import { BSONType } from './types';

const invalidCharMsg = {
	'$': "start with '$'",
	'.': "contain '.'",
	'\0': 'contain null bytes',
};

export function assertHasValidFieldNames(doc: unknown) {
	if (doc && typeof doc === 'object') {
		JSON.stringify(doc, (key, value) => {
			assertIsValidFieldName(key);
			return value;
		});
	}
}

export function assertIsValidFieldName(key: string) {
	let match;
	if (typeof key === 'string' && (match = key.match(/^\$|\.|\0/))) {
		throw new Error(`Key ${key} must not ${invalidCharMsg[match[0] as keyof typeof invalidCharMsg]}`);
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
		return Array.from(v).map(clone);
	}

	if ('clone' in v && typeof v.clone === 'function') {
		return v.clone();
	}

	return Object.fromEntries(Object.entries(v).map(([key, value]) => [key, clone(value)]));
};

export const isNumericKey = (s: string) => /^\d+$/.test(s);

export const isPlainObject = (x: unknown): x is Record<string, any> => !!x && getBSONType(x) === BSONType.Object;

export const isIndexable = (obj: unknown): obj is Record<string | number, any> => Array.isArray(obj) || isPlainObject(obj);
