export const isInvalidJSONValue = (value: unknown): boolean => {
	if (typeof value !== 'string' || value === '') {
		return false;
	}

	try {
		JSON.parse(value);
		return false;
	} catch (_e) {
		return true;
	}
};
