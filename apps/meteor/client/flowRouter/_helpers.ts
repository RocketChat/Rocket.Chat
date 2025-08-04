import { Meteor } from 'meteor/meteor';

function isObject(obj: unknown): obj is object {
	const type = typeof obj;
	return type === 'function' || (type === 'object' && !!obj);
}

export function omit<T, TKey extends keyof T>(obj: T, keys: TKey[]): Omit<T, TKey> {
	if (!isObject(obj)) {
		Meteor._debug('[ostrio:flow-router-extra] [_helpers.omit] First argument must be an Object');
		return obj;
	}

	if (!Array.isArray(keys)) {
		Meteor._debug('[ostrio:flow-router-extra] [_helpers.omit] Second argument must be an Array');
		return obj;
	}

	const copy = clone(obj);
	for (const key of keys) {
		delete copy[key];
	}

	return copy;
}

export function pick<T, TKey extends keyof T>(obj: T, keys: TKey[]): Pick<T, TKey> {
	if (!isObject(obj)) {
		Meteor._debug('[ostrio:flow-router-extra] [_helpers.omit] First argument must be an Object');
		return obj;
	}

	if (!Array.isArray(keys)) {
		Meteor._debug('[ostrio:flow-router-extra] [_helpers.omit] Second argument must be an Array');
		return obj;
	}

	const picked: Partial<T> = {};
	for (const key of keys) {
		picked[key] = obj[key];
	}

	return picked as Pick<T, TKey>;
}

export function clone<T>(obj: T): T {
	if (!isObject(obj)) return obj;
	return Array.isArray(obj) ? (obj.slice() as T) : Object.assign({}, obj);
}
