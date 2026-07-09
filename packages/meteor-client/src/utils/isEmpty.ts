import { hasOwn } from './hasOwn.ts';

export function isEmpty<T>(obj: T): boolean {
	if (obj == null) {
		return true;
	}

	if (Array.isArray(obj) || typeof obj === 'string') {
		return obj.length === 0;
	}

	for (const key in obj) {
		if (hasOwn(obj, key)) {
			return false;
		}
	}

	return true;
}
