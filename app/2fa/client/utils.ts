export const reportError = <E>(error: E, callback?: (error?: E) => void): void => {
	if (callback) {
		callback(error);
		return;
	}

	throw error;
};
