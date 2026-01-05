import http from 'http';
import https from 'https';

import { AbortController } from 'abort-controller';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch, { Response } from 'node-fetch';
import { getProxyForUrl } from 'proxy-from-env';

import { checkForSsrfWithIp } from './checkForSsrf';
import { parseRequestOptions } from './parsers';
import type { ExtendedFetchOptions } from './types';

const MAX_REDIRECTS = 5;

function getFetchAgent<U extends string>(
	url: U,
	allowSelfSignedCerts?: boolean,
	originalHostname?: string,
): http.Agent | https.Agent | null | HttpsProxyAgent<U> | HttpProxyAgent<U> {
	const isHttps = /^https/.test(url);

	const proxy = getProxyForUrl(url);
	if (proxy) {
		const AgentFn = isHttps ? HttpsProxyAgent : HttpProxyAgent;
		return new AgentFn(proxy);
	}

	if (!isHttps) {
		return new http.Agent();
	}

	const agentOptions: https.AgentOptions = {};

	if (originalHostname) {
		agentOptions.servername = originalHostname;
		agentOptions.rejectUnauthorized = true;
	} else if (allowSelfSignedCerts) {
		agentOptions.rejectUnauthorized = false;
	} else {
		return null;
	}

	return new https.Agent(agentOptions);
}

function getTimeout(timeout?: number) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout ?? 20000);

	return { controller, timeoutId };
}

const extractHostname = (urlString: string): string | null => {
	try {
		const { hostname } = new URL(urlString);
		if (hostname.startsWith('[') && hostname.endsWith(']')) {
			return hostname.slice(1, -1);
		}
		return hostname;
	} catch {
		return null;
	}
};

const buildPinnedUrl = (originalUrl: string, resolvedIp: string): string => {
	try {
		const url = new URL(originalUrl);

		let ipAddress: string;

		const ipv4WithPortMatch = resolvedIp.match(/^(\d+\.\d+\.\d+\.\d+)(?::(\d+))$/);
		if (ipv4WithPortMatch) {
			ipAddress = ipv4WithPortMatch[1];
		} else if (resolvedIp.includes(':') && !resolvedIp.includes('.')) {
			const ipv6WithPortMatch = resolvedIp.match(/^(\[[0-9a-fA-F:]+\])(?::(\d+))$/);
			if (ipv6WithPortMatch) {
				ipAddress = ipv6WithPortMatch[1];
			} else {
				ipAddress = resolvedIp.startsWith('[') && resolvedIp.endsWith(']') ? resolvedIp : `[${resolvedIp}]`;
			}
		} else {
			// IPv4 without port
			ipAddress = resolvedIp;
		}

		url.hostname = ipAddress;

		return url.toString();
	} catch {
		return originalUrl;
	}
};

export async function serverFetch(input: string, options?: ExtendedFetchOptions, allowSelfSignedCerts?: boolean): Promise<Response> {
	let currentUrl = input;

	for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
		let pinnedUrl = currentUrl;
		let originalHostname: string | undefined;
		let resolvedIp: string | undefined;

		if (!options?.ignoreSsrfValidation && process.env.TEST_MODE !== 'true') {
			// eslint-disable-next-line no-await-in-loop
			const ssrfResult = await checkForSsrfWithIp(currentUrl);
			if (!ssrfResult.allowed) {
				throw new Error(`SSRF validation failed for URL: ${currentUrl}`);
			}
			resolvedIp = ssrfResult.resolvedIp;

			if (resolvedIp) {
				const extractedHostname = extractHostname(currentUrl);

				if (extractedHostname) {
					originalHostname = extractedHostname;
					const isDirectIp = /^(\d+\.\d+\.\d+\.\d+|\[?[0-9a-fA-F:]+]?)$/.test(extractedHostname);

					if (!isDirectIp) {
						pinnedUrl = buildPinnedUrl(currentUrl, resolvedIp);
					}
				}
			}
		}

		const agent = getFetchAgent(pinnedUrl, allowSelfSignedCerts, originalHostname);
		const { controller, timeoutId } = getTimeout(options?.timeout);

		const params = new URLSearchParams(options?.params);
		const url = new URL(pinnedUrl);

		if (params.toString()) {
			params.forEach((value, key) => {
				if (value) {
					url.searchParams.append(key, value);
				}
			});
		}

		const parsedOptions = parseRequestOptions(options) || {};
		const existingHeaders = parsedOptions.headers || {};
		const headers: Record<string, string> = {};

		if (existingHeaders && typeof existingHeaders === 'object') {
			if (existingHeaders instanceof Headers) {
				existingHeaders.forEach((value, key) => {
					headers[key] = value;
				});
			} else if (Array.isArray(existingHeaders)) {
				existingHeaders.forEach(([key, value]) => {
					headers[key] = Array.isArray(value) ? value.join(', ') : value;
				});
			} else {
				Object.assign(headers, existingHeaders);
			}
		}

		if (originalHostname && resolvedIp) {
			const isDirectIp = /^(\d+\.\d+\.\d+\.\d+|\[?[0-9a-fA-F:]+]?)$/.test(originalHostname);
			if (!isDirectIp) {
				try {
					const originalUrl = new URL(currentUrl);
					const hostHeader = originalUrl.port ? `${originalHostname}:${originalUrl.port}` : originalHostname;
					headers.Host = hostHeader;
				} catch {
					headers.Host = originalHostname;
				}
			}
		}

		// eslint-disable-next-line no-await-in-loop
		const response = await fetch(url.toString(), {
			// @ts-expect-error - This complained when types were moved to file :/
			signal: controller.signal,
			redirect: 'manual',
			...parsedOptions,
			headers,
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
