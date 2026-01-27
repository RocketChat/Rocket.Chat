import type { IncomingHttpHeaders } from 'http';

type HeaderLike = IncomingHttpHeaders | Headers | Record<string, string | string[] | undefined>;

export function getHeader(headers: HeaderLike, key: string): string;

export function getHeader(headers: HeaderLike, key: string, asArray: true): string[];

export function getHeader(headers: HeaderLike, key: string, asArray = false): string | string[] {
	if (!headers) {
		return asArray ? [] : '';
	}

	let value: string | string[] | undefined;

	if (isHeadersType(headers)) {
		value = headers.get(key) ?? undefined;
	} else {
		value = headers[key];
	}

	if (Array.isArray(value)) {
		return asArray ? value : (value[0] ?? '');
	}

	if (typeof value === 'string') {
		return asArray ? [value] : value;
	}

	return asArray ? [] : '';
}

const isHeadersType = (headers: HeaderLike): headers is Headers => {
	return headers instanceof Headers;
};
