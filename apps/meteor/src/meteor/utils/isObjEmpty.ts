import { hasOwn } from './hasOwn';

export const isObjEmpty = (obj: any) => {
	for (const key in Object(obj)) {
		if (hasOwn(obj, key)) {
			return false;
		}
	}
	return true;
};
