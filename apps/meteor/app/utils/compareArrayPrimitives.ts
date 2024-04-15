export const compareArrayPrimitives = (a: any[], b: any[]) => {
	if (!Array.isArray(a) || !Array.isArray(b)) {
		return false;
	}

	if (a === b) {
		return true;
	}

	if (a.length !== b.length) {
		return false;
	}

	for (let i = 0; i < a.length; i++) {
		if (a[i] instanceof Array && b[i] instanceof Array) {
			if (!compareArrayPrimitives(a[i], b[i])) {
				return false;
			}
		} else if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
};
