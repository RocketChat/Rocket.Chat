export type DummyResponse<T, E = 'wrapped'> =
	E extends 'wrapped' ? { body: { [k: string]: T } } : { body: T };

export const sleep = (ms: number) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
