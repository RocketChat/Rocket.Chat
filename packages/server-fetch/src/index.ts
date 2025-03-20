import http from 'http';
import https from 'https';

import { AbortController } from 'abort-controller';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';
import { getProxyForUrl } from 'proxy-from-env';

import { parseRequestOptions } from './parsers';
import type { ExtendedFetchOptions } from './types';

function getFetchAgent<U extends string>(
	url: U,
	allowSelfSignedCerts?: boolean,
): http.Agent | https.Agent | null | HttpsProxyAgent<U> | HttpProxyAgent<U> {
	const isHttps = /^https/.test(url);

	const proxy = getProxyForUrl(url);
	if (proxy) {
		const AgentFn = isHttps ? HttpsProxyAgent : HttpProxyAgent;
		return new AgentFn(proxy);
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

function getTimeout(timeout?: number) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout ?? 20000);

	return { controller, timeoutId };
}

export function serverFetch(input: string, options?: ExtendedFetchOptions, allowSelfSignedCerts?: boolean): ReturnType<typeof fetch> {
	const agent = getFetchAgent(input, allowSelfSignedCerts);
	const { controller, timeoutId } = getTimeout(options?.timeout);

	// Keeping the URLSearchParams since it handles other cases and type conversions
	const params = new URLSearchParams(options?.params);
	const url = new URL(input);
	if (params.toString()) {
		params.forEach((value, key) => {
			if (value) {
				url.searchParams.append(key, value);
			}
		});
	}

	return fetch(url.toString(), {
		// @ts-expect-error - This complained when types were moved to file :/
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

export { ExtendedFetchOptions };
