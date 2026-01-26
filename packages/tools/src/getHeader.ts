import type { IncomingHttpHeaders } from 'http';

type HeaderLike = IncomingHttpHeaders | Record<string, string | string[] | undefined>;

export const getHeader = (headers: HeaderLike, key: string): string => {
	if (!headers) {
		return '';
	}

	const value = headers[key];

	if (Array.isArray(value)) {
		return value[0] ?? '';
	}

	if (typeof value === 'string') {
		return value;
	}

	return '';
};

