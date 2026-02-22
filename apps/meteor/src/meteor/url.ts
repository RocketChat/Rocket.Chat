import { hasOwn } from './utils/hasOwn.ts';

export const { URL } = globalThis;

const encodeString = (str: string | number | boolean): string => {
	return encodeURIComponent(str).replace(/\*/g, '%2A');
};

const _encodeParams = (params: any, prefix?: string): string => {
	const str: string[] = [];
	const isParamsArray = Array.isArray(params);

	for (const p in params) {
		if (hasOwn(params, p)) {
			const v = params[p];
			const k = prefix ? `${prefix}[${isParamsArray ? '' : p}]` : p;

			if (v !== null && typeof v === 'object') {
				str.push(_encodeParams(v, k));
			} else {
				const encodedKey = encodeString(k).replace(/%5B/g, '[').replace(/%5D/g, ']');

				str.push(`${encodedKey}=${encodeString(v)}`);
			}
		}
	}
	return str.join('&').replace(/%20/g, '+');
};

export const _constructUrl = (url: string, query: string | null, params?: Record<string, any>): string => {
	const [baseUrl, existingQueryString] = url.split('?', 2);

	let finalQuery = query !== null ? query : existingQueryString || '';

	if (params) {
		const encodedParams = _encodeParams(params);
		if (encodedParams) {
			finalQuery = finalQuery ? `${finalQuery}&${encodedParams}` : encodedParams;
		}
	}

	return finalQuery ? `${baseUrl}?${finalQuery}` : baseUrl;
};
