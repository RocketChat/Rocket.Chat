export function ensureArray<T>(param: T | Array<T>): Array<T> {
	const emptyArray: Array<T> = [];
	return emptyArray.concat(param);
}
