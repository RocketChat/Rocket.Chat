import EJSON from 'ejson';
import { AbortController } from 'abort-controller';

import { httpLogger } from './logger';
import { getFederationDomain } from './getFederationDomain';
import { search } from './dns';
import { encrypt } from './crypt';
import { fetch } from '../../../../server/lib/http/fetch';

export async function federationRequest(method, url, body, headers, peerKey = null) {
	let data = null;

	if ((method === 'POST' || method === 'PUT') && body) {
		data = EJSON.toJSONValue(body);

		if (peerKey) {
			data = await encrypt(data, peerKey);
		}
	}

	httpLogger.debug(`[${method}] ${url}`);

	const controller = new AbortController();
	const { signal } = controller;

	const timeout = setTimeout(() => {
		controller.abort();
	}, 2000);

	try {
		const request = await fetch(url, {
			method,
			headers: { ...headers, 'x-federation-domain': getFederationDomain() },
			body: JSON.stringify(data),
			signal,
		});
		return request.json();
	} catch (e) {
		throw e;
	} finally {
		clearTimeout(timeout);
	}
}

export async function federationRequestToPeer(method, peerDomain, uri, body, options = {}) {
	const ignoreErrors = peerDomain === getFederationDomain() ? false : options.ignoreErrors;

	const { url: baseUrl, publicKey } = search(peerDomain);

	let peerKey = null;

	// Only encrypt if it is not local
	if (peerDomain !== getFederationDomain()) {
		peerKey = publicKey;
	}

	let result;

	try {
		httpLogger.debug({ msg: 'federationRequestToPeer', url: `${baseUrl}${uri}` });

		result = await federationRequest(method, `${baseUrl}${uri}`, body, options.headers || {}, peerKey);
	} catch (err) {
		httpLogger.error({ msg: `${ignoreErrors ? '[IGNORED] ' : ''}Error`, err });

		if (!ignoreErrors) {
			throw err;
		} else {
			return { success: false };
		}
	}

	return { success: true, data: result.data };
}
