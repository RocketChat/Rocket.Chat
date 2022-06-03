const getBaseUrl = (): string => {
	if (process.env.BASE_URL) {
		return process.env.BASE_URL;
	}
	if (process.env.ENTERPRISE) {
		return 'http://localhost:4000';
	}

	return 'http://localhost:3000';
};

export const verifyTestBaseUrl = (): { baseURL: string; isLocal: boolean } => {
	const baseURL = getBaseUrl();
	return {
		baseURL,
		isLocal: baseURL.startsWith('http://localhost'),
	};
};
