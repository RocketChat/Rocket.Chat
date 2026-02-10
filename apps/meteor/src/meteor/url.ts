import { Package } from './package-registry.ts';
import { hasOwn } from './utils/hasOwn.ts';

export const { URL } = globalThis;

// -----------------------------------------------------------------------------
// Helper: Encode Params
// -----------------------------------------------------------------------------

/**
 * Encodes a string for URL, replacing * with %2A (Meteor specific compat).
 */
const encodeString = (str: string | number | boolean): string => {
	return encodeURIComponent(str).replace(/\*/g, '%2A');
};

/**
 * Recursively encodes parameters into a query string.
 * Supports nested objects: { a: { b: 1 } } -> "a[b]=1"
 * Supports arrays: { a: [1, 2] } -> "a[]=1&a[]=2"
 */
const _encodeParams = (params: any, prefix?: string): string => {
	const str: string[] = [];
	const isParamsArray = Array.isArray(params);

	for (const p in params) {
		if (hasOwn(params, p)) {
			const v = params[p];
			// If we have a prefix (we are inside an object/array), append the key in brackets.
			// If it's an array, the key is empty brackets "[]".
			const k = prefix ? `${prefix}[${isParamsArray ? '' : p}]` : p;

			if (v !== null && typeof v === 'object') {
				// Recursive call for nested objects
				str.push(_encodeParams(v, k));
			} else {
				// Encode the key, but restore brackets [ ] to make them readable/compatible
				// (encodeURIComponent turns '[' into '%5B')
				const encodedKey = encodeString(k).replace(/%5B/g, '[').replace(/%5D/g, ']');

				str.push(`${encodedKey}=${encodeString(v)}`);
			}
		}
	}

	// Join with ampersands and replace %20 with + (form encoding style)
	return str.join('&').replace(/%20/g, '+');
};

/**
 * Constructs a URL by assembling a base, an optional query string,
 * and an optional object of parameters.
 * * @param url - The base URL (e.g., "http://localhost/path" or "/path")
 * @param query - An optional override for the query string (rarely used, usually null)
 * @param params - An object of parameters to be encoded and appended
 */
export const _constructUrl = (url: string, query: string | null, params?: Record<string, any>): string => {
	// Split URL into [base, existingQuery]
	// This is safer than the regex logic for preserving potential fragments (#hash) if they existed,
	// though the original regex ignored hashes.
	const [baseUrl, existingQueryString] = url.split('?', 2);

	let finalQuery = query !== null ? query : existingQueryString || '';

	if (params) {
		const encodedParams = _encodeParams(params);
		if (encodedParams) {
			// If there's already a query, append with &, otherwise just use the params
			finalQuery = finalQuery ? `${finalQuery}&${encodedParams}` : encodedParams;
		}
	}

	return finalQuery ? `${baseUrl}?${finalQuery}` : baseUrl;
};

Package.url = {
	URL,
};
