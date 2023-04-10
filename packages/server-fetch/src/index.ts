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

export function serverFetch(
	input: string,
	options?: Parameters<typeof fetch>[1] & { compress?: boolean; follow?: number; size?: number; timeout?: number },
	allowSelfSignedCerts?: boolean,
): ReturnType<typeof fetch> {
	const agent = getFetchAgent(input, allowSelfSignedCerts);

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), options?.timeout ?? 20000);

	return fetch(input, {
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
