import http from 'http';
import https from 'https';

import { Logger } from '@rocket.chat/logger';
import { AbortController } from 'abort-controller';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch, { Response } from 'node-fetch';
import { getProxyForUrl } from 'proxy-from-env';

import { checkForSsrfWithIp } from './checkForSsrf';
import { parseRequestOptions } from './parsers';
import type { ExtendedFetchOptions } from './types';

const MAX_REDIRECTS = 5;
const redirectStatus = new Set([301, 302, 303, 307, 308]);

const logger = new Logger('ExternalRequest');

function checkDirectIp(ip: string): boolean {
	return /^(\d+\.\d+\.\d+\.\d+|\[?[0-9a-fA-F:]+]?)$/.test(ip);
}

function extractHostname(urlString: string): string | null {
	try {
		const { hostname } = new URL(urlString);
		if (hostname.startsWith('[') && hostname.endsWith(']')) {
			return hostname.slice(1, -1);
		}
		return hostname;
	} catch {
		return null;
	}
}

function buildPinnedUrl(originalUrl: string, resolvedIp: string): string {
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
}

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
		// For self-signed certificates, do not disable certificate validation.
		// Instead, fall back to the default HTTPS agent behavior (full validation).
		return null;
	} else {
		return null;
	}

	return new https.Agent(agentOptions);
}

async function getFetchAgentWithValidation<U extends string>(
	url: U,
	allowSelfSignedCerts?: boolean,
	ignoreSsrfValidation?: boolean,
): Promise<{
	agent: http.Agent | https.Agent | null | HttpsProxyAgent<U> | HttpProxyAgent<U>;
	pinnedUrl: string;
	originalHostname?: string;
	resolvedIp?: string;
}> {
	let pinnedUrl: string = url;
	let originalHostname: string | undefined;
	let resolvedIp: string | undefined;

	if (!ignoreSsrfValidation) {
		// eslint-disable-next-line no-await-in-loop
		const ssrfResult = await checkForSsrfWithIp(url);
		if (!ssrfResult.allowed) {
			logger.error({ msg: 'SSRF validation failed for URL', url });
			throw new Error('error-ssrf-validation-failed');
		}

		resolvedIp = ssrfResult.resolvedIp;
		const extractedHostname = extractHostname(url);

		if (extractedHostname) {
			originalHostname = extractedHostname;

			if (!checkDirectIp(extractedHostname)) {
				pinnedUrl = buildPinnedUrl(url, resolvedIp);
			}
		}
	} else {
		logger.debug({ msg: 'Request not using SSRF validation', url: pinnedUrl });
	}

	return { agent: getFetchAgent(pinnedUrl, allowSelfSignedCerts, originalHostname), pinnedUrl, originalHostname, resolvedIp };
}

function getTimeout(timeout?: number) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout ?? 20000);

	return { controller, timeoutId };
}

function followRedirect(response: fetch.Response, redirectCount = 0) {
	const location = response.headers.get('location');

	if (!location) {
		logger.error({ msg: 'Malformed redirect response', status: response.status });
		throw new Error('redirect-response-location-header-missing');
	}

	if (redirectCount === MAX_REDIRECTS) {
		logger.error({ msg: 'Redirect count reached the maximum amount of redirects allowed', MAX_REDIRECTS, status: response.status });
		throw new Error('error-too-many-redirects');
	}

	logger.debug({ msg: 'Following redirect', redirectCount, location, status: response.status });
	return location;
}

export async function serverFetch(input: string, options?: ExtendedFetchOptions, allowSelfSignedCerts?: boolean): Promise<Response> {
	let currentUrl = input;
	const { controller, timeoutId } = getTimeout(options?.timeout);

	try {
		for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
			// eslint-disable-next-line no-await-in-loop
			const { agent, pinnedUrl, originalHostname, resolvedIp } = await getFetchAgentWithValidation(
				currentUrl,
				allowSelfSignedCerts,
				options?.ignoreSsrfValidation,
			);

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
				if (!checkDirectIp(originalHostname)) {
					try {
						const originalUrl = new URL(currentUrl);
						headers.Host = originalUrl.port ? `${originalHostname}:${originalUrl.port}` : originalHostname;
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
			});

			if (!redirectStatus.has(response.status)) {
				return response;
			}

			currentUrl = new URL(followRedirect(response, redirectCount), currentUrl).toString();

			// https://github.com/node-fetch/node-fetch/issues/1673 - body not consumed == open socket
			void response.arrayBuffer();
		}
	} finally {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	}

	throw new Error('error-processing-request');
}

export { Response };
export { ExtendedFetchOptions };
