export function objectKeys<T extends Record<string, any>>(obj: T): (keyof T)[] {
	return Object.keys(obj) as (keyof T)[];
}

export function entriesOf<T extends Record<string, any>>(obj: T): [keyof T, T[keyof T]][] {
	return Object.entries(obj) as [keyof T, T[keyof T]][];
}
