export const isJSON = (value: string): boolean => {
	try {
		return !!JSON.parse(value);
	} catch {
		return false;
	}
};
