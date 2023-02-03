export const validateRegex = (regexString: string): string => {
	try {
		new RegExp(regexString);
		return regexString;
	} catch (e) {
		return '';
	}
};

export const isValidRegex = (regexString: string): boolean => {
	try {
		new RegExp(regexString);
		return true;
	} catch (e) {
		return false;
	}
};
