import http from 'http';
import https from 'https';

import { fetch as nodeFetch } from 'meteor/fetch';
import { default as createHttpProxyAgent, HttpProxyAgent } from 'http-proxy-agent';
import { default as createHttpsProxyAgent, HttpsProxyAgent } from 'https-proxy-agent';
import { getProxyForUrl } from 'proxy-from-env';

export function getFetchAgent(
	url: string,
	allowSelfSignedCerts?: boolean,
): http.Agent | https.Agent | null | HttpsProxyAgent | HttpProxyAgent {
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

export function fetch(
	input: string,
	options?: Parameters<typeof nodeFetch>[1],
	allowSelfSignedCerts?: boolean,
): ReturnType<typeof nodeFetch> {
	const agent = getFetchAgent(input, allowSelfSignedCerts);

	return nodeFetch(input, {
		...options,
		...(agent ? { agent } : {}),
	});
}
