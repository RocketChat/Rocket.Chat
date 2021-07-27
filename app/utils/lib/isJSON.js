export const isJSON = (value) => {
	try {
		return !!JSON.parse(value);
	} catch {
		return false;
	}
};
