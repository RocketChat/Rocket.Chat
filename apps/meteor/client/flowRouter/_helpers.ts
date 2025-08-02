import { Meteor } from 'meteor/meteor';

function isEmpty(obj: unknown): boolean {
	if (obj === null || obj === undefined) {
		return true;
	}

	if (isArray(obj) || isString(obj) || isArguments(obj)) {
		return obj.length === 0;
	}

	return Object.keys(obj).length === 0;
}

function isObject(obj: unknown): obj is object {
	const type = typeof obj;
	return type === 'function' || (type === 'object' && !!obj);
}

function omit<T, TKey extends keyof T>(obj: T, keys: TKey[]): Omit<T, TKey> {
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

function pick<T, TKey extends keyof T>(obj: T, keys: TKey[]): Pick<T, TKey> {
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

function isArray(obj: unknown): obj is any[] {
	return Array.isArray(obj);
}

function extend<U>(source: U): U;
function extend<U, V>(source1: U, source2: V): U & V;
function extend<U, V, W>(source1: U, source2: V, source3: W): U & V & W;
function extend(...sources: any[]): any;
function extend(...sources: any[]): any {
	return Object.assign({}, ...sources);
}

function clone<T>(obj: T): T {
	if (!isObject(obj)) return obj;
	return isArray(obj) ? (obj.slice() as T) : extend(obj);
}

function isArguments(obj: unknown): obj is IArguments {
	return Object.prototype.toString.call(obj) === '[object Arguments]';
}

function isFunction(obj: unknown): obj is Function {
	return Object.prototype.toString.call(obj) === '[object Function]';
}

function isString(obj: unknown): obj is string {
	return Object.prototype.toString.call(obj) === `[object String]`;
}

function isRegExp(obj: unknown): obj is RegExp {
	return Object.prototype.toString.call(obj) === '[object RegExp]';
}

const _helpers = {
	isEmpty,
	isObject,
	omit,
	pick,
	isArray,
	extend,
	clone,
	isArguments,
	isFunction,
	isString,
	isRegExp,
};

export { _helpers };
