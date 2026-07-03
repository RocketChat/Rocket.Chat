export const isJSON = (value: string): boolean => {
	try {
		JSON.parse(value);
		return true;
	} catch {
		return false;
	}
};
