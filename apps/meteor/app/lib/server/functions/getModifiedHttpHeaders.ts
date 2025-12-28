export const normalizeHeaders = (httpHeaders?: Headers | Record<string, string>) => {
	if (httpHeaders instanceof Headers) {
		return { ...Object.fromEntries(httpHeaders.entries()) };
	}

	return { ...httpHeaders };
};

export const getModifiedHttpHeaders = (httpHeaders: Headers | Record<string, string>) => {
	const modifiedHttpHeaders = normalizeHeaders(httpHeaders);

	if ('x-auth-token' in modifiedHttpHeaders) {
		modifiedHttpHeaders['x-auth-token'] = '[redacted]';
	}

	if (modifiedHttpHeaders.cookie) {
		const cookies = modifiedHttpHeaders.cookie.split('; ');
		const modifiedCookies = cookies.map((cookie: string) => {
			if (cookie.startsWith('rc_token=')) {
				return 'rc_token=[redacted]';
			}
			return cookie;
		});
		modifiedHttpHeaders.cookie = modifiedCookies.join('; ');
	}

	return modifiedHttpHeaders;
};
