export const validateNameChars = (name: string | undefined): boolean => {
	if (typeof name !== 'string') {
		return false;
	}

	const invalidChars = /[<>\\/]/;
	if (invalidChars.test(name)) {
		return false;
	}

	try {
		const decodedName = decodeURI(name);
		if (invalidChars.test(decodedName)) {
			return false;
		}
	} catch (err) {
		return false;
	}

	return true;
};
