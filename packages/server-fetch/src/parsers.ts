import type { ExtendedFetchOptions, FetchOptions, OriginalFetchOptions } from './types';

function isPostOrPutOrDeleteWithBody(options?: ExtendedFetchOptions): boolean {
	// No method === 'get'
	if (!options?.method) {
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
			if (options && typeof options.body === 'object' && !Buffer.isBuffer(options.body)) {
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

const getParser = (contentTypeHeader?: string): ((options: ExtendedFetchOptions) => FetchOptions) => {
	switch (contentTypeHeader) {
		case 'application/json':
			return jsonParser;
		case 'application/x-www-form-urlencoded':
			return urlencodedParser;
		default:
			return jsonParser;
	}
};

export function parseRequestOptions(options?: ExtendedFetchOptions): OriginalFetchOptions {
	if (!options) {
		return {};
	}

	const headers = (options.headers as { [k: string]: string }) ?? {};

	const contentTypeHeader = headers['Content-Type'] || headers['content-type'];

	return getParser(contentTypeHeader?.toLowerCase())(options);
}
