import type { ExtendedFetchOptions, FetchOptions, OriginalFetchOptions } from './types';

const jsonParser = (options: ExtendedFetchOptions) => {
	if (!options) {
		return {};
	}

	try {
		if (typeof options.body === 'object' && !Buffer.isBuffer(options.body)) {
			options.body = JSON.stringify(options.body);
			options.headers = {
				...options.headers,
				'Content-Type': 'application/json', // force content type to be json
			};
		}
	} catch (e) {
		// Body is not JSON, do nothing
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
