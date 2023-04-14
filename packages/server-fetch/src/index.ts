import http from 'http';
import https from 'https';

import type { BodyInit } from 'node-fetch';
import fetch from 'node-fetch';
import { getProxyForUrl } from 'proxy-from-env';
import type { HttpProxyAgent } from 'http-proxy-agent';
import { default as createHttpProxyAgent } from 'http-proxy-agent';
import type { HttpsProxyAgent } from 'https-proxy-agent';
import { default as createHttpsProxyAgent } from 'https-proxy-agent';
import { AbortController } from 'abort-controller';

function getFetchAgent(url: string, allowSelfSignedCerts?: boolean): http.Agent | https.Agent | null | HttpsProxyAgent | HttpProxyAgent {
	const isHttps = /^https/.test(url);

	const proxy = getProxyForUrl(url);
	if (proxy) {
		const agentFn = isHttps ? createHttpsProxyAgent : createHttpProxyAgent;
		return agentFn(proxy);
	}

	if (!allowSelfSignedCerts) {
		return null;
	}

	if (!isHttps) {
		return new http.Agent();
	}

	if (isHttps) {
		return new https.Agent({
			rejectUnauthorized: false,
		});
	}
	return null;
}

function isPostOrPutOrDeleteWithBody(options?: ExtendedFetchOptions): boolean {
	// No method === 'get'
	if (!options || !options.method) {
		return false;
	}
	const { method, body } = options;
	const lowerMethod = method?.toLowerCase();
	return ['post', 'put', 'delete'].includes(lowerMethod) && body != null;
}

function requestIsUrlEncoded(options: ExtendedFetchOptions): boolean {
	const contentTypeHeader = (options.headers as { [k: string]: string })['Content-Type'];
	// URL encoded request are passing URLSearchParams as body, this makes it compatible with the jsonify
	return !!contentTypeHeader && ['application/x-www-form-urlencoded'].includes(contentTypeHeader);
}

function parseRequestOptions(options?: ExtendedFetchOptions): FetchOptions {
	if (!options) {
		return {};
	}

	if (requestIsUrlEncoded(options)) {
		return options as FetchOptions;
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
}

function getTimeout(timeout?: number) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout ?? 20000);

	return { controller, timeoutId };
}

function stripTrailingSlash(str: string) {
	return str.endsWith('/') ? str.slice(0, -1) : str;
}

type FetchOptions = NonNullable<Parameters<typeof fetch>[1]>;
type FetchOptionsWithoutBody = Omit<FetchOptions, 'body'>;
type ExtendedFetchOptions = FetchOptionsWithoutBody & {
	compress?: boolean;
	follow?: number;
	size?: number;
	timeout?: number;
	params?: Record<string, any>;
	body?: BodyInit | Record<string, any>;
};

export function serverFetch(input: string, options?: ExtendedFetchOptions, allowSelfSignedCerts?: boolean): ReturnType<typeof fetch> {
	const agent = getFetchAgent(input, allowSelfSignedCerts);
	const { controller, timeoutId } = getTimeout(options?.timeout);

	const params = new URLSearchParams(options?.params);
	const url = new URL(stripTrailingSlash(input));
	if (params.toString()) {
		url.search = params.toString();
	}

	return fetch(url.toString(), {
		signal: controller.signal,
		...parseRequestOptions(options),
		...(agent ? { agent } : {}),
	}).finally(() => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	});
}

export { Response } from 'node-fetch';
