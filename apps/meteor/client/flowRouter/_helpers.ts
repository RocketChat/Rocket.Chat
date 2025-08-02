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

	if (!isArray(keys)) {
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

	if (!isArray(keys)) {
		Meteor._debug('[ostrio:flow-router-extra] [_helpers.omit] Second argument must be an Array');
		return obj;
	}

	const picked: Partial<T> = {};
	for (const key of keys) {
		picked[key] = obj[key];
	}

	return picked as Pick<T, TKey>;
}

export function isArray(obj: unknown): obj is any[] {
	return Array.isArray(obj);
}

export function extend<U>(source: U): U;
export function extend<U, V>(source1: U, source2: V): U & V;
export function extend<U, V, W>(source1: U, source2: V, source3: W): U & V & W;
export function extend(...sources: any[]): any;
export function extend(...sources: any[]): any {
	return Object.assign({}, ...sources);
}

export function clone<T>(obj: T): T {
	if (!isObject(obj)) return obj;
	return isArray(obj) ? (obj.slice() as T) : extend(obj);
}

export function isFunction(obj: unknown): obj is Function {
	return Object.prototype.toString.call(obj) === '[object Function]';
}
