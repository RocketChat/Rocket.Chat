import http from 'http';
import https from 'https';

import { AbortController } from 'abort-controller';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch, { Response } from 'node-fetch';
import { getProxyForUrl } from 'proxy-from-env';

import { checkForSsrf } from './checkForSsrf';
import { parseRequestOptions } from './parsers';
import type { ExtendedFetchOptions } from './types';

const MAX_REDIRECTS = 5;

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

	return new https.Agent({
		rejectUnauthorized: false,
	});
}

function getTimeout(timeout?: number) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout ?? 20000);

	return { controller, timeoutId };
}

export async function serverFetch(input: string, options?: ExtendedFetchOptions, allowSelfSignedCerts?: boolean): Promise<Response> {
	let currentUrl = input;

	for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
		// eslint-disable-next-line no-await-in-loop
		if (!options?.ignoreSsrfValidation && !(await checkForSsrf(currentUrl))) {
			throw new Error(`SSRF validation failed for URL: ${currentUrl}`);
		}

		const agent = getFetchAgent(currentUrl, allowSelfSignedCerts);
		const { controller, timeoutId } = getTimeout(options?.timeout);

		const params = new URLSearchParams(options?.params);
		const url = new URL(currentUrl);

		if (params.toString()) {
			params.forEach((value, key) => {
				if (value) {
					url.searchParams.append(key, value);
				}
			});
		}

		// eslint-disable-next-line no-await-in-loop
		const response = await fetch(url.toString(), {
			// @ts-expect-error - This complained when types were moved to file :/
			signal: controller.signal,
			redirect: 'manual',
			...parseRequestOptions(options),
			...(agent ? { agent } : {}),
		}).finally(() => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		});

		if (response.status < 300 || response.status >= 400) {
			return response;
		}

		const location = response.headers.get('location');

		if (!location) {
			throw new Error('Redirect response missing Location header');
		}

		if (redirectCount === MAX_REDIRECTS) {
			throw new Error(`Too many redirects (max ${MAX_REDIRECTS})`);
		}

		currentUrl = new URL(location, currentUrl).toString();
	}

	throw new Error('Unexpected redirect handling failure');
}

export { Response };
export { ExtendedFetchOptions };
