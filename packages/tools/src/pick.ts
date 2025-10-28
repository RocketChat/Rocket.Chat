export function pick<TObject extends Record<string, any>, TKey extends keyof TObject>(
	object: TObject,
	...attributes: TKey[]
): Pick<TObject, TKey> {
	return {
		...attributes.reduce(
			(data, key) => ({
				...data,
				...(key in object ? { [key]: object[key] } : {}),
			}),
			{} as TObject,
		),
	};
}
