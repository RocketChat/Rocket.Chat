import { hasOwn } from './hasOwn';

export const isEmptyObject = (obj: any): obj is Record<PropertyKey, never> => {
	for (const key in Object(obj)) {
		if (hasOwn(obj, key)) {
			return false;
		}
	}
	return true;
};
