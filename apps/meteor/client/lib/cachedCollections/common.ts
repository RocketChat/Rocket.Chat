import type { FieldExpression, Filter } from '@rocket.chat/mongo-adapter';
import { EJSON } from 'meteor/ejson';

import { MinimongoError } from './MinimongoError';

export const hasOwn = Object.prototype.hasOwnProperty;

export function clone<T>(obj: T): T {
	return EJSON.clone(obj);
}

export function isEqual<T>(
	a: T,
	b: T,
	options?: {
		keyOrderSensitive?: boolean | undefined;
	},
): boolean {
	return EJSON.equals(a as any, b as any, options);
}

function insertIntoDocument(document: any, key: any, value: any) {
	Object.keys(document).forEach((existingKey) => {
		if (
			(existingKey.length > key.length && existingKey.indexOf(`${key}.`) === 0) ||
			(key.length > existingKey.length && key.indexOf(`${existingKey}.`) === 0)
		) {
			throw new Error(`cannot infer query fields to set, both paths '${existingKey}' and '${key}' are matched`);
		} else if (existingKey === key) {
			throw new Error(`cannot infer query fields to set, path '${key}' is matched twice`);
		}
	});

	document[key] = value;
}

export function isIndexable(obj: any): obj is { [index: string | number]: any } {
	return Array.isArray(obj) || _isPlainObject(obj);
}

export function isNumericKey(s: string) {
	return /^[0-9]+$/.test(s);
}

export function isOperatorObject<TOperators extends `$${string}`>(
	valueSelector: unknown,
	inconsistentOK = false,
): valueSelector is Record<TOperators, any> {
	if (!_isPlainObject(valueSelector)) {
		return false;
	}

	let theseAreOperators: boolean | undefined = undefined;
	for (const selKey of Object.keys(valueSelector)) {
		const thisIsOperator = selKey.slice(0, 1) === '$' || selKey === 'diff';

		if (theseAreOperators === undefined) {
			theseAreOperators = thisIsOperator;
		} else if (theseAreOperators !== thisIsOperator) {
			if (!inconsistentOK) {
				throw new Error(`Inconsistent operator: ${JSON.stringify(valueSelector)}`);
			}

			theseAreOperators = false;
		}
	}

	return theseAreOperators ?? true;
}

function populateDocumentWithKeyValue<T extends { _id: string }>(document: Partial<T>, key: string, value: unknown) {
	if (value && Object.getPrototypeOf(value) === Object.prototype) {
		populateDocumentWithObject(document, key, value);
	} else if (!(value instanceof RegExp)) {
		insertIntoDocument(document, key, value);
	}
}

function populateDocumentWithObject<T extends { _id: string }>(document: Partial<T>, key: string, value: FieldExpression<T>) {
	const keys = Object.keys(value);
	const unprefixedKeys = keys.filter((op) => op[0] !== '$');

	if (unprefixedKeys.length > 0 || !keys.length) {
		if (keys.length !== unprefixedKeys.length) {
			throw new Error(`unknown operator: ${unprefixedKeys[0]}`);
		}

		validateObject(value, key);
		insertIntoDocument(document, key, value);
	} else {
		entriesOf(value).forEach(([op, object]) => {
			if (op === '$eq') {
				populateDocumentWithKeyValue(document, key, object as NonNullable<FieldExpression<T>['$eq']>);
			} else if (op === '$all') {
				(object as NonNullable<FieldExpression<T>['$all']>).forEach((element: any) => populateDocumentWithKeyValue(document, key, element));
			}
		});
	}
}

export function populateDocumentWithQueryFields<T extends { _id: string }>(query: T['_id'] | Filter<T>, document: Partial<T> = {}) {
	if (_selectorIsId(query)) {
		insertIntoDocument(document, '_id', query);
		return document;
	}

	entriesOf(query).forEach(([key, value]) => {
		if (key === '$and') {
			(value as NonNullable<Filter<T>['$and']>).forEach((element) => populateDocumentWithQueryFields(element, document));
		} else if (key === '$or') {
			if ((value as NonNullable<Filter<T>['$or']>).length === 1) {
				populateDocumentWithQueryFields((value as NonNullable<Filter<T>['$or']>)[0], document);
			}
		} else if (typeof key === 'string' && key[0] !== '$') {
			populateDocumentWithKeyValue(document, key, value);
		}
	});

	return document;
}

function validateKeyInPath(key: string, path: string) {
	if (key.includes('.')) {
		throw new Error(`The dotted field '${key}' in '${path}.${key} is not valid for storage.`);
	}

	if (key[0] === '$') {
		throw new Error(`The dollar ($) prefixed field  '${path}.${key} is not valid for storage.`);
	}
}

function validateObject(object: Record<string, unknown>, path: string) {
	if (object && Object.getPrototypeOf(object) === Object.prototype) {
		Object.keys(object).forEach((key) => {
			validateKeyInPath(key, path);
			validateObject(object[key] as Record<string, unknown>, `${path}.${key}`);
		});
	}
}

export const _f = {
	_type(v: any) {
		if (typeof v === 'number') {
			return 1;
		}

		if (typeof v === 'string') {
			return 2;
		}

		if (typeof v === 'boolean') {
			return 8;
		}

		if (Array.isArray(v)) {
			return 4;
		}

		if (v === null) {
			return 10;
		}

		if (v instanceof RegExp) {
			return 11;
		}

		if (typeof v === 'function') {
			return 13;
		}

		if (v instanceof Date) {
			return 9;
		}

		if (isBinary(v)) {
			return 5;
		}

		return 3;
	},

	_equal(a: unknown, b: unknown) {
		return isEqual(a, b, { keyOrderSensitive: true });
	},

	_typeorder(t: number) {
		return [-1, 1, 2, 3, 4, 5, -1, 6, 7, 8, 0, 9, -1, 100, 2, 100, 1, 8, 1][t];
	},

	// eslint-disable-next-line complexity
	_cmp(a: unknown, b: unknown): number {
		if (a === undefined) {
			return b === undefined ? 0 : -1;
		}

		if (b === undefined) {
			return 1;
		}

		let ta = _f._type(a);
		let tb = _f._type(b);

		const oa = _f._typeorder(ta);
		const ob = _f._typeorder(tb);

		if (oa !== ob) {
			return oa < ob ? -1 : 1;
		}

		if (ta !== tb) {
			throw new MinimongoError('Missing type coercion logic in _cmp');
		}

		if (ta === 7) {
			ta = 2;
			tb = 2;
			a = (a as { toHexString(): string }).toHexString();
			b = (b as { toHexString(): string }).toHexString();
		}

		if (ta === 9) {
			ta = 1;
			tb = 1;
			a = isNaN(a as number) ? 0 : (a as Date).getTime();
			b = isNaN(b as number) ? 0 : (b as Date).getTime();
		}

		if (ta === 1) {
			return (a as number) - (b as number);
		}

		if (tb === 2) {
			if (a === b) {
				return 0;
			}

			return (a as string) < (b as string) ? -1 : 1;
		}

		if (ta === 3) {
			const toArray = (object: any) => {
				const result: any[] = [];

				Object.keys(object).forEach((key) => {
					result.push(key, object[key]);
				});

				return result;
			};

			return _f._cmp(toArray(a), toArray(b));
		}

		if (ta === 4) {
			for (let i = 0; ; i++) {
				if (i === (a as unknown[]).length) {
					return i === (b as unknown[]).length ? 0 : -1;
				}

				if (i === (b as unknown[]).length) {
					return 1;
				}

				const s = _f._cmp((a as unknown[])[i], (b as unknown[])[i]);
				if (s !== 0) {
					return s;
				}
			}
		}

		if (ta === 5) {
			if ((a as Uint8Array).length !== (b as Uint8Array).length) {
				return (a as Uint8Array).length - (b as Uint8Array).length;
			}

			for (let i = 0; i < (a as Uint8Array).length; i++) {
				if ((a as Uint8Array)[i] < (b as Uint8Array)[i]) {
					return -1;
				}

				if ((a as Uint8Array)[i] > (b as Uint8Array)[i]) {
					return 1;
				}
			}

			return 0;
		}

		if (ta === 8) {
			if (a) {
				return b ? 0 : 1;
			}

			return b ? -1 : 0;
		}

		if (ta === 10) return 0;

		if (ta === 11) throw new MinimongoError('Sorting not supported on regular expression');

		if (ta === 13) throw new MinimongoError('Sorting not supported on Javascript code');

		throw new MinimongoError('Unknown type to sort');
	},
};

export function _isPlainObject(x: any): x is Record<string, any> {
	return x && _f._type(x) === 3;
}

export function _selectorIsId(selector: unknown): selector is string | number {
	return typeof selector === 'number' || typeof selector === 'string';
}

export function isBinary(x: unknown): x is Uint8Array {
	return typeof x === 'object' && x !== null && x instanceof Uint8Array;
}

export function entriesOf<T extends Record<string, any>>(obj: T): [keyof T, T[keyof T]][] {
	return Object.entries(obj) as [keyof T, T[keyof T]][];
}

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
		throw new MinimongoError(`Key ${key} must not ${invalidCharMsg[match[0] as keyof typeof invalidCharMsg]}`);
	}
}

export type ArrayIndices = (number | 'x')[];
