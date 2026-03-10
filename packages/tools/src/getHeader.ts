import type { IncomingHttpHeaders } from 'http';

type HeaderLike = IncomingHttpHeaders | Headers | Record<string, string | string[] | undefined>;

export const getHeader = <T extends string | string[] = string>(headers: HeaderLike, key: string): T => {
	if (!headers) {
		return '' as T;
	}

	if (headers instanceof Headers) {
		return (headers.get(key) ?? '') as T;
	}

	return (headers[key] ?? '') as T;
};
