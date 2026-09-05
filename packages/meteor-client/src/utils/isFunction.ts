export type UnknownFunction = (...args: unknown[]) => unknown;

export const isFunction = (value: unknown): value is UnknownFunction => {
	return typeof value === 'function';
};
