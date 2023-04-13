import http from 'http';
import https from 'https';

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

function isPostOrPutWithBody(options?: Parameters<typeof fetch>[1]): boolean {
	if (!options) {
		return false;
	}
	const { method, body } = options;
	return (method?.toLowerCase() === 'POST' || method?.toLowerCase() === 'PUT') && body != null;
}

export function serverFetch(
	input: string,
	options?: Parameters<typeof fetch>[1] & {
		compress?: boolean;
		follow?: number;
		size?: number;
		// Timeout in ms
		timeout?: number;
		// Query params
		params?: Record<string, any>;
	},
	allowSelfSignedCerts?: boolean,
): ReturnType<typeof fetch> {
	const agent = getFetchAgent(input, allowSelfSignedCerts);

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), options?.timeout ?? 20000);

	const params = new URLSearchParams(options?.params).toString();
	const url = `${input}${params ? `?${params}` : ''}`;

	if (isPostOrPutWithBody(options)) {
		try {
			// Try to parse body as JSON
			JSON.parse(options?.body as string);
			// Auto set content-type to application/json but allow consumer to override it
			options && (options.headers = { 'Content-Type': 'application/json', ...options.headers });
		} catch (e) {
			// Body is not JSON, do nothing
		}
	}

	return fetch(url, {
		...options,
		...(agent ? { agent } : {}),
		...(options?.timeout ? { signal: controller.signal } : {}),
	}).finally(() => {
		if (options?.timeout && timeoutId) {
			clearTimeout(timeoutId);
		}
	});
}

export { Response } from 'node-fetch';
