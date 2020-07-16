import { HTTP as MeteorHTTP } from 'meteor/http';
import { EJSON } from 'meteor/ejson';

import { logger } from './logger';
import { getFederationDomain } from './getFederationDomain';
import { search } from './dns';
import { encrypt } from './crypt';

export function federationRequest(method, url, body, headers, peerKey = null) {
	let data = null;

	if ((method === 'POST' || method === 'PUT') && body) {
		data = EJSON.toJSONValue(body);

		if (peerKey) {
			data = encrypt(data, peerKey);
		}
	}

	logger.http.debug(`[${ method }] ${ url }`);

	return MeteorHTTP.call(method, url, { data, timeout: 2000, headers: { ...headers, 'x-federation-domain': getFederationDomain() } });
}

export function federationRequestToPeer(method, peerDomain, uri, body, options = {}) {
	const ignoreErrors = peerDomain === getFederationDomain() ? false : options.ignoreErrors;

	const { url: baseUrl, publicKey } = search(peerDomain);

	let peerKey = null;

	// Only encrypt if it is not local
	if (peerDomain !== getFederationDomain()) {
		peerKey = publicKey;
	}

	let result;

	try {
		logger.http.debug(() => `federationRequestToPeer => url=${ baseUrl }${ uri }`);

		result = federationRequest(method, `${ baseUrl }${ uri }`, body, options.headers || {}, peerKey);
	} catch (err) {
		logger.http.error(`${ ignoreErrors ? '[IGNORED] ' : '' }Error ${ err }`);

		if (!ignoreErrors) {
			throw err;
		} else {
			return { success: false };
		}
	}

	return { success: true, data: result.data };
}
