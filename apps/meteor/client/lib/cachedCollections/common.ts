import { getBSONType, type FieldExpression, type Filter } from '@rocket.chat/mongo-adapter';
import { EJSON } from 'meteor/ejson';

import { MinimongoError } from './MinimongoError';

export const hasOwn = Object.prototype.hasOwnProperty;

export const { clone } = EJSON;

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

export const isIndexable = (obj: any): obj is { [index: string | number]: any } => Array.isArray(obj) || isPlainObject(obj);

export function isNumericKey(s: string) {
	return /^[0-9]+$/.test(s);
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
			(value as Filter<T>['$and'][]).forEach((element) => populateDocumentWithQueryFields(element, document));
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

export const isPlainObject = (x: any): x is Record<string, any> => x && getBSONType(x) === 3;

export function _selectorIsId(selector: unknown): selector is string {
	return typeof selector === 'string';
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
