// http://stackoverflow.com/a/26990347 function isSet() from Gajus
export const isSetNotNull = async (fn: () => unknown) => {
	let value;
	try {
		value = await fn();
	} catch (e) {
		value = null;
	}
	return value !== null && value !== undefined;
};
