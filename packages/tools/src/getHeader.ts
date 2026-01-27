import type { IncomingHttpHeaders } from 'http';

type HeaderLike = IncomingHttpHeaders | Headers | Record<string, string | string[] | undefined>;

export const getHeader = (headers: HeaderLike, key: string): string => {
	if (!headers) {
		return '';
	}

  if (isHeadersType(headers)) {
    return headers.get(key) ?? '';
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


function isHeadersType(headers: HeaderLike): headers is Headers{
  return headers instanceof Headers;
}
