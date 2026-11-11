const isObject = (value: unknown): value is Record<string | number | symbol, unknown> => typeof value === 'object' && value !== null;

const compareObjects = (a: Record<string | number | symbol, unknown>, b: Record<string | number | symbol, unknown>) => {
	const keysA = Object.keys(a);
	const keysB = Object.keys(b);

	if (keysA.length !== keysB.length) {
		return false;
	}

	return !keysA.some((key) => !b.hasOwnProperty(key) || a[key] !== b[key]);
};

export const shallowEqual = (a: unknown, b: unknown) => {
	if (a === b) {
		return true;
	}

	if (Number.isNaN(a) && Number.isNaN(b)) {
		return true;
	}

	if (!isObject(a) || !isObject(b)) {
		return false;
	}

	return compareObjects(a, b);
};
