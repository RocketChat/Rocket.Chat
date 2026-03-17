import qs from 'qs'; // Using qs specifically to keep express compatibility

export function parseQueryParams(url: string) {
	return qs.parse(url, { arrayLimit: 500, throwOnLimitExceeded: true });
}
