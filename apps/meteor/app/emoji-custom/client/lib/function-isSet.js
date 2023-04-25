export const isSetNotNull = function (fn) {
	let value;
	try {
		value = fn();
	} catch (e) {
		value = null;
	}
	return value !== null && value !== undefined;
};
