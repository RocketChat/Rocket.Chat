import type { KeyOfEach, ValueOfOptional } from '@rocket.chat/core-typings';

// The recursive function doesn't infer any types, otherwise it would not be able to call itself beyond the level that we validate
function _deepGet(object: Record<string, any>, path: string[]): any {
	if (object === undefined) {
		return undefined;
	}

	if (!object || typeof object !== 'object') {
		return null;
	}

	const [nextProp, ...pathList] = path;
	const value = object[nextProp];

	if (pathList.length) {
		return _deepGet(value, pathList);
	}

	return value;
}

// Simple attribute with no recursion
export function deepGet<TObject extends Record<string, any>, K extends KeyOfEach<TObject>>(
	object: TObject,
	path: K | [K],
): ValueOfOptional<TObject, K>;

// One recursion level
export function deepGet<TObject extends Record<string, any>, K extends KeyOfEach<TObject>, L extends KeyOfEach<Required<TObject>[K]>>(
	object: TObject,
	path: `${string & K}.${string & L}` | [K, L],
): ValueOfOptional<ValueOfOptional<TObject, K>, L>;

// Two recursion levels
export function deepGet<
	TObject extends Record<string, any>,
	K extends KeyOfEach<TObject>,
	L extends KeyOfEach<Required<TObject>[K]>,
	M extends KeyOfEach<Required<Required<TObject>[K]>[L]>,
>(
	object: TObject,
	path: `${string & K}.${string & L}.${string & M}` | [K, L, M],
): ValueOfOptional<ValueOfOptional<ValueOfOptional<TObject, K>, L>, M>;

// Three or more recursion levels, returns any
export function deepGet<
	TObject extends Record<string, any>,
	K extends KeyOfEach<TObject>,
	L extends KeyOfEach<Required<TObject>[K]>,
	M extends KeyOfEach<Required<Required<TObject>[K]>[L]>,
>(object: TObject, path: `${string & K}.${string & L}.${string & M}.${string}` | [K, L, M, ...(string | number | symbol)[]]): any;

// Implementation matches all overloads
export function deepGet<TObject extends Record<string, any>>(object: TObject, path: string | string[]): any {
	return _deepGet(object, typeof path === 'string' ? path.split('.') : path);
}
