export function omit<TObject, TKey extends keyof TObject>(obj: TObject, ...keys: TKey[]): Omit<TObject, TKey> {
	const result = { ...obj };
	keys.forEach((key) => {
		delete result[key];
	});
	return result;
}
