export const validateRegex = (regexString: string): string => {
	try {
		new RegExp(regexString);
		return regexString;
	} catch (e) {
		return '';
	}
};
