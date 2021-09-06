export type FromApi<T> = T extends Date
	? (Exclude<T, Date> | string)
	: T extends boolean | number | string | null | undefined
		? T
		: T extends {}
			? {
				[K in keyof T]: FromApi<T[K]>;
			}
			: null;
