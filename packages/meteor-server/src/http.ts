/**
 * Minimal fetch-based port of the (deprecated) meteor/http package surface.
 */

export type HTTPOptions = {
	content?: string;
	data?: unknown;
	query?: string;
	params?: Record<string, string>;
	auth?: string;
	headers?: Record<string, string>;
	timeout?: number;
	followRedirects?: boolean;
};

export type HTTPResponse = {
	statusCode: number;
	content: string;
	data: unknown;
	headers: Record<string, string>;
};

const callAsync = async (method: string, url: string, options: HTTPOptions = {}): Promise<HTTPResponse> => {
	const headers: Record<string, string> = { ...options.headers };
	let body: string | undefined;

	if (options.data !== undefined) {
		body = JSON.stringify(options.data);
		headers['Content-Type'] ??= 'application/json';
	} else if (options.content !== undefined) {
		body = options.content;
	} else if (options.params) {
		body = new URLSearchParams(options.params).toString();
		headers['Content-Type'] ??= 'application/x-www-form-urlencoded';
	}

	const target = new URL(url);
	if (options.query) {
		target.search = options.query;
	}

	if (options.auth) {
		headers.Authorization = `Basic ${Buffer.from(options.auth).toString('base64')}`;
	}

	const response = await fetch(target, {
		method: method.toUpperCase(),
		headers,
		body,
		redirect: options.followRedirects === false ? 'manual' : 'follow',
		signal: options.timeout ? AbortSignal.timeout(options.timeout) : undefined,
	});

	const content = await response.text();
	let data: unknown = null;
	try {
		data = JSON.parse(content);
	} catch {
		// not JSON — matches meteor/http, which leaves data null
	}

	const result: HTTPResponse = {
		statusCode: response.status,
		content,
		data,
		headers: Object.fromEntries(response.headers.entries()),
	};

	if (response.status >= 400) {
		const error = new Error(`failed [${response.status}] ${content.slice(0, 500)}`) as Error & { response: HTTPResponse };
		error.response = result;
		throw error;
	}

	return result;
};

export const HTTP = {
	call: callAsync,
	callAsync,
	get: (url: string, options?: HTTPOptions) => callAsync('GET', url, options),
	post: (url: string, options?: HTTPOptions) => callAsync('POST', url, options),
	put: (url: string, options?: HTTPOptions) => callAsync('PUT', url, options),
	del: (url: string, options?: HTTPOptions) => callAsync('DELETE', url, options),
};
