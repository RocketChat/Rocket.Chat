export const unwrap = <T>(value: T | null | undefined): T => {
	if (value === null || value === undefined) {
		throw new Error('Expected value to be non-null and non-undefined');
	}
	return value;
};
