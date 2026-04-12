export const censorUrl = (url: string): string => {
	try {
		const parsed = new URL(url);

		if (parsed.username) {
			parsed.username = '****';
		}
		if (parsed.password) {
			parsed.password = '****';
		}

		return parsed.toString();
	} catch {
		return url;
	}
};
