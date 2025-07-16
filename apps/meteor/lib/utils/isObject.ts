/**
 * @deprecated use isObject from tools package instead
 */
export function isObject(obj: unknown): obj is object {
	const type = typeof obj;
	return type === 'function' || (type === 'object' && !!obj);
}
