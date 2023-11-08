export type DummyResponse<T, E = 'wrapped'> =
	E extends 'wrapped' ? { body: { [k: string]: T } } : { body: T };

export type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
	[Property in Key]-?: Type[Property];
};

export const sleep = (ms: number) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export const parseMethodResponse = (response: any) => {
	if (response.message) {
		return JSON.parse(response.message);
	}

	return {};
}