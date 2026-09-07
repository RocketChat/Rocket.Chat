import { isKey } from './isKey';

export const isEmptyObject = (obj: unknown): obj is Record<PropertyKey, never> => {
	const object = Object(obj);
	for (const key in object) {
		if (isKey(object, key)) {
			return false;
		}
	}
	return true;
};
