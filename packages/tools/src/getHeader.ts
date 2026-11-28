import type { IncomingHttpHeaders } from 'node:http';

type HeaderLike = IncomingHttpHeaders | Headers | Record<string, string | string[] | undefined>;

export const getHeader = <T extends string | string[] = string>(headers: HeaderLike, key: string): T => {
	if (!headers) {
		return '' as T;
	}

	if (headers instanceof Headers) {
		return (headers.get(key) ?? '') as T;
	}

	if (Object.hasOwn(headers, key) && headers[key] !== undefined) {
		return headers[key] as T;
	}

	const lowerKey = key.toLowerCase();
	if (Object.hasOwn(headers, lowerKey) && headers[lowerKey] !== undefined) {
		return headers[lowerKey] as T;
	}

	const matchedKey = Object.keys(headers).find((k) => k.toLowerCase() === lowerKey && headers[k] !== undefined);
	if (matchedKey !== undefined) {
		return headers[matchedKey] as T;
	}

	return '' as T;
};
