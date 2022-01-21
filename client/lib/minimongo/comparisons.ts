export const equals = <T>(a: T, b: T): boolean => {
	if (a === b) {
		return true;
	}

	if (!a || !b) {
		return false;
	}

	if (typeof a !== 'object' || typeof b !== 'object') {
		return false;
	}

	if (a instanceof Date && b instanceof Date) {
		return a.valueOf() === b.valueOf();
	}

	if (a instanceof Uint8Array && b instanceof Uint8Array) {
		if (a.length !== b.length) {
			return false;
		}
		for (let i = 0; i < a.length; i++) {
			if (a[i] !== b[i]) {
				return false;
			}
		}
		return true;
	}

	if (Array.isArray(a)) {
		if (!Array.isArray(b)) {
			return false;
		}

		if (a.length !== b.length) {
			return false;
		}

		for (let i = 0; i < a.length; i++) {
			if (!equals(a[i], b[i])) {
				return false;
			}
		}
		return true;
	}

	if (Object.keys(b).length !== Object.keys(a).length) {
		return false;
	}

	for (const key of Object.keys(a)) {
		if (!(key in b)) {
			return false;
		}

		if (!equals((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
			return false;
		}
	}

	return true;
};

export const isObject = (value: unknown): value is object => {
	const type = typeof value;
	return !!value && (type === 'object' || type === 'function');
};

export const flatSome = <T>(x: T[] | T, f: (x: T) => boolean): boolean => {
	if (Array.isArray(x)) {
		return x.some(f);
	}

	return f(x);
};

export const some = <T>(x: T | T[], f: (x: T | T[]) => boolean): boolean => {
	if (f(x)) {
		return true;
	}

	return Array.isArray(x) && x.some(f);
};

export const isEmptyArray = <T>(value: unknown): value is T[] & { length: 0 } => Array.isArray(value) && value.length === 0;
