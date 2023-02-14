export const replacesNestedValues = (obj: Record<string, unknown>, key: string, value: unknown): Record<string, unknown> => {
	const keys = key.split('.');
	const lastKey = keys.shift();

	if (!lastKey) {
		throw new Error(`Failed to assign custom field: ${key}`);
	}

	if (keys.length && obj[lastKey] !== undefined && (typeof obj[lastKey] !== 'object' || Array.isArray(obj[lastKey]))) {
		throw new Error(`Failed to assign custom field: ${key}`);
	}

	if (keys.length === 0 && typeof obj[lastKey] === 'object') {
		throw new Error(`Failed to assign custom field: ${key}`);
	}

	return {
		...obj,
		...(keys.length === 0 && {
			[lastKey]: value,
		}),
		...(keys.length > 0 && {
			[lastKey]: replacesNestedValues(obj[lastKey] as Record<string, unknown>, keys.join('.'), value),
		}),
	};
};
