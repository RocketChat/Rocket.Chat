export const getModifiedHttpHeaders = (httpHeaders: Record<string, any>) => {
	const modifiedHttpHeaders = { ...httpHeaders };

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
