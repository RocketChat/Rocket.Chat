export const isRelativeURL = (str: string): boolean => {
	// Scheme-based URLs are absolute (e.g. https:, data:, javascript:).
	if (/^[a-z][a-z\d+\-.]*:/i.test(str)) {
		return false;
	}

	// URLs starting with // are protocol-relative, not path-relative.
	if (str.startsWith('//')) {
		return false;
	}

	if (str === '/' || str === '') {
		return false;
	}

	return true;
};
