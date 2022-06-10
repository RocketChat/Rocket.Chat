export const isEmpty = function (obj: object | any[] | string): boolean {
	if (obj == null) {
		return true;
	}
	if (Array.isArray(obj) || typeof obj === 'string') {
		return obj.length === 0;
	}
	return !Object.values(obj).some((value) => value !== null);
};
