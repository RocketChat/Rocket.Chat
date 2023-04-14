import type { ExtendedFetchOptions, FetchOptions, OriginalFetchOptions } from './types';

function isPostOrPutOrDeleteWithBody(options?: ExtendedFetchOptions): boolean {
	// No method === 'get'
	if (!options || !options.method) {
		return false;
	}
	const { method, body } = options;
	const lowerMethod = method?.toLowerCase();
	return ['post', 'put', 'delete'].includes(lowerMethod) && body != null;
}

const jsonParser = (options: ExtendedFetchOptions) => {
	if (!options) {
		return {};
	}

	if (isPostOrPutOrDeleteWithBody(options)) {
		try {
			if (options && typeof options.body === 'object') {
				options.body = JSON.stringify(options.body);
				options.headers = {
					'Content-Type': 'application/json',
					...options.headers,
				};
			}
		} catch (e) {
			// Body is not JSON, do nothing
		}
	}

	return options as FetchOptions;
};

const urlencodedParser = (options: ExtendedFetchOptions) => {
	return options as FetchOptions;
};

const parsers: Record<string, (...args: any[]) => FetchOptions> = {
	'application/x-www-form-urlencoded': urlencodedParser,
	'application/json': jsonParser,
	'default': jsonParser,
};

export function parseRequestOptions(options?: ExtendedFetchOptions): OriginalFetchOptions {
	if (!options) {
		return {};
	}

	const headers = (options.headers as { [k: string]: string }) ?? {};

	const contentTypeHeader = headers['Content-Type'] || headers['content-type'];

	return parsers[contentTypeHeader.toLowerCase() ?? 'default'](options);
}
