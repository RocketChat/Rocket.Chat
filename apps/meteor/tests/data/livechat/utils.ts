export type DummyResponse<T, E = 'wrapped'> =
	E extends 'wrapped' ? { body: { [k: string]: T } } : { body: T };
