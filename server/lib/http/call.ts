import { Meteor } from 'meteor/meteor';
import { URL, URLSearchParams } from 'meteor/url';

import { truncate } from '../../../lib/utils/stringUtils';
import { fetch } from './fetch';

// Code extracted from https://github.com/meteor/meteor/blob/master/packages/deprecated/http
// Modified to:
//   - Respect proxy envvars such as HTTP_PROXY and NO_PROXY
//   - Respect HTTP_DEFAULT_TIMEOUT envvar or use 20s when it is not set

const envTimeout = parseInt(process.env.HTTP_DEFAULT_TIMEOUT || '', 10);
const defaultTimeout = !isNaN(envTimeout) ? envTimeout : 20000;

export type HttpCallOptions = {
	content?: string | URLSearchParams;
	data?: Record<string, any>;
	query?: string;
	params?: Record<string, string>;
	auth?: string;
	headers?: Record<string, string>;
	timeout?: number;
	followRedirects?: boolean;
	referrer?: string;
	integrity?: string;
};

type callbackFn = {
	(error: unknown): void;
	(error: unknown, result: unknown): void;
};

// Fill in `response.data` if the content-type is JSON.
function populateData(response: Record<string, any>): void {
	// Read Content-Type header, up to a ';' if there is one.
	// A typical header might be "application/json; charset=utf-8"
	// or just "application/json".
	const contentType = (response.headers['content-type'] || ';').split(';')[0];

	// Only try to parse data as JSON if server sets correct content type.
	if (['application/json', 'text/javascript', 'application/javascript', 'application/x-javascript'].indexOf(contentType) >= 0) {
		try {
			response.data = JSON.parse(response.content);
		} catch (err) {
			response.data = null;
		}
	} else {
		response.data = null;
	}
}

function makeErrorByStatus(statusCode: string, content: string): Error {
	let message = `failed [${statusCode}]`;

	if (content) {
		message += `${truncate(content.replace(/\n/g, ' '), 500)}`;
	}

	return new Error(message);
}

function _call(httpMethod: string, url: string, options: HttpCallOptions, callback: callbackFn): void {
	const method = (httpMethod || '').toUpperCase();

	if (!/^https?:\/\//.test(url)) {
		throw new Error('url must be absolute and start with http:// or https://');
	}

	const headers: Record<string, string> = {};
	let { content } = options;

	if (!('timeout' in options)) {
		options.timeout = defaultTimeout;
	}

	if (options.data) {
		content = JSON.stringify(options.data);
		headers['Content-Type'] = 'application/json';
	}

	let paramsForUrl;
	let paramsForBody;

	if (content || method === 'GET' || method === 'HEAD') {
		paramsForUrl = options.params;
	} else {
		paramsForBody = options.params;
	}

	const newUrl = URL._constructUrl(url, options.query, paramsForUrl);

	if (options.auth) {
		if (options.auth.indexOf(':') < 0) {
			throw new Error('auth option should be of the form "username:password"');
		}

		const base64 = Buffer.from(options.auth, 'ascii').toString('base64');
		headers.Authorization = `Basic ${base64}`;
	}

	if (paramsForBody) {
		const data = new URLSearchParams();
		Object.entries(paramsForBody).forEach(([key, value]) => {
			data.append(key, value);
		});
		content = data;
		headers['Content-Type'] = 'application/x-www-form-urlencoded';
	}

	const { headers: receivedHeaders } = options;

	if (receivedHeaders) {
		Object.keys(receivedHeaders).forEach(function (key) {
			headers[key] = receivedHeaders[key];
		});
	}

	// wrap callback to add a 'response' property on an error, in case
	// we have both (http 4xx/5xx error, which has a response payload)
	const wrappedCallback = ((cb: callbackFn): { (error: unknown, response?: unknown): void } => {
		let called = false;
		return (error: unknown, response: unknown): void => {
			if (!called) {
				called = true;
				if (error && response) {
					(error as any).response = response;
				}
				cb(error, response);
			}
		};
	})(callback);

	// is false if false, otherwise always true
	const followRedirects = options.followRedirects === false ? 'manual' : 'follow';

	const requestOptions = {
		method,
		jar: false,
		timeout: options.timeout,
		body: content,
		redirect: followRedirects,
		referrer: options.referrer,
		integrity: options.integrity,
		headers,
	} as const;

	fetch(newUrl, requestOptions)
		.then(async (res) => {
			const content = await res.text();
			const response: Record<string, any> = {};
			response.statusCode = res.status;
			response.content = `${content}`;

			// fetch headers don't allow simple read using bracket notation
			// so we iterate their entries and assign them to a new Object
			response.headers = {};
			for (const entry of (res.headers as any).entries()) {
				const [key, val] = entry;
				response.headers[key] = val;
			}

			response.ok = res.ok;
			response.redirected = res.redirected;

			populateData(response);

			if (response.statusCode >= 400) {
				const error = makeErrorByStatus(response.statusCode, response.content);
				wrappedCallback(error, response);
			} else {
				wrappedCallback(undefined, response);
			}
		})
		.catch((err) => wrappedCallback(err));
}

export function httpCallAsync(httpMethod: string, url: string, options: HttpCallOptions, callback: callbackFn): void;
export function httpCallAsync(httpMethod: string, url: string, callback: callbackFn): void;
export function httpCallAsync(
	httpMethod: string,
	url: string,
	optionsOrCallback: HttpCallOptions | callbackFn = {},
	callback?: callbackFn,
): void {
	// If the options argument was ommited, adjust the arguments:
	if (!callback && typeof optionsOrCallback === 'function') {
		return _call(httpMethod, url, {}, optionsOrCallback as callbackFn);
	}

	return _call(httpMethod, url, optionsOrCallback as HttpCallOptions, callback as callbackFn);
}

export const httpCall = Meteor.wrapAsync(httpCallAsync);
