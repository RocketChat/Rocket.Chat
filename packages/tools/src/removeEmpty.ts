type NonEmpty<T> = {
	[K in keyof T]: Exclude<T[K], null | undefined>;
};

export function removeEmpty<T extends Record<string, any>>(obj: T): NonEmpty<T> {
	return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null)) as NonEmpty<T>;
}
