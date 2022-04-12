import { HTTP as MeteorHTTP } from 'meteor/http';
import { EJSON } from 'meteor/ejson';

import { httpLogger } from './logger';
import { getFederationDomain } from './getFederationDomain';
import { search } from './dns';
import { encrypt } from './crypt';

export async function federationRequest(method, url, body, headers, peerKey = null) {
	let data = null;

	if ((method === 'POST' || method === 'PUT') && body) {
		data = EJSON.toJSONValue(body);

		if (peerKey) {
			data = await encrypt(data, peerKey);
		}
	}

	httpLogger.debug(`[${method}] ${url}`);

	return MeteorHTTP.call(method, url, {
		data,
		timeout: 2000,
		headers: { ...headers, 'x-federation-domain': getFederationDomain() },
	});
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
