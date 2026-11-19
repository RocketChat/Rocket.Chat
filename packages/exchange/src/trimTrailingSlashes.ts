export const trimTrailingSlashes = (value: string): string => {
	let trimmed = value;

	while (trimmed.endsWith('/')) {
		trimmed = trimmed.slice(0, -1);
	}

	return trimmed;
};
