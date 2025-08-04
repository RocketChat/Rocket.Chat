function isObject(obj: unknown): obj is object {
	const type = typeof obj;
	return type === 'function' || (type === 'object' && !!obj);
}

export function pick<T, TKey extends keyof T>(obj: T, keys: TKey[]): Pick<T, TKey> {
	if (!isObject(obj)) {
		return obj;
	}

	if (!Array.isArray(keys)) {
		return obj;
	}

	const picked: Partial<T> = {};
	for (const key of keys) {
		picked[key] = obj[key];
	}

	return picked as Pick<T, TKey>;
}
