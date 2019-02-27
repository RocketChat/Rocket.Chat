import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { Federation } from './federation';

import { logger } from './logger.js';

// Should skip the retry if the error is one of the below?
const errorsToSkipRetrying = [
	'error-app-prevented-sending',
];

function skipRetryOnSpecificError(err) {
	return !!errorsToSkipRetrying[err.errorType];
}

// Delay method to wait a little bit before retrying
const delay = Meteor.wrapAsync(function(ms, callback) {
	Meteor.setTimeout(function() {
		callback(null);
	}, ms);
});

function doSimpleRequest(peer, method, uri, body) {
	this.log(`Request: ${ method } ${ uri }`);

	const { url: serverBaseURL } = peer;

	const url = `${ serverBaseURL }${ uri }`;

	let data = null;

	if (method === 'POST' || method === 'PUT') {
		data = body;
	}

	this.log(`Sending request: ${ method } - ${ uri }`);

	return HTTP.call(method, url, { data, timeout: 2000, headers: { 'x-federation-domain': this.config.peer.domain } });
}

//
// Actually does the request, handling retries and everything
function doRequest(peer, method, uri, body, retryInfo = {}) {
	// Normalize retry info
	retryInfo = {
		total: retryInfo.total || 1,
		stepSize: retryInfo.stepSize || 100,
		stepMultiplier: retryInfo.stepMultiplier || 1,
		tryToUpdateDNS: retryInfo.tryToUpdateDNS === undefined ? true : retryInfo.tryToUpdateDNS,
		DNSUpdated: false,
	};

	// Should we try one extra time, due to DNS update?
	retryInfo.oneExtra = retryInfo.tryToUpdateDNS ? 0 : 1;

	for (let i = 0; i < retryInfo.total; i++) {
		try {
			return doSimpleRequest.call(this, peer, method, uri, body);
		} catch (err) {
			try {
				if (retryInfo.tryToUpdateDNS && !retryInfo.DNSUpdated) {
					retryInfo.DNSUpdated = true;

					this.log(`Trying to update local DNS cache for peer:${ peer.domain }`);

					peer = Federation.peerDNS.updatePeerDNS(peer.domain);

					continue;
				}
			} catch (err) {
				if (err.response && err.response.statusCode === 404) {
					throw new Meteor.Error('federation-peer-does-not-exist', 'Peer does not exist');
				}
			}

			// Check if we need to skip due to specific error
			if (skipRetryOnSpecificError(err)) {
				this.log('Retry: skipping due to specific error');

				throw err;
			}

			// If this is the last try, throw the error
			if (i === retryInfo.total - retryInfo.oneExtra) {
				this.log('Retry: could not fulfill the request');

				throw err;
			}

			this.log(`Retrying ${ i + retryInfo.oneExtra }/${ retryInfo.total }: ${ method } - ${ uri }`);

			// Otherwise, wait and try again
			delay(retryInfo.stepSize * (i + 1) * retryInfo.stepMultiplier);
		}
	}

	return null;
}

class PeerHTTP {
	constructor() {
		this.config = {};
	}

	setConfig(config) {
		// General
		this.config = config;
	}

	log(message) {
		logger.http.info(message);
	}

	//
	// Direct request
	simpleRequest(peer, method, uri, body) {
		return doSimpleRequest.call(this, peer, method, uri, body);
	}

	//
	// Request trying to find DNS entries
	request(peer, method, uri, body, retryInfo = {}) {
		return doRequest.call(this, peer, method, uri, body, retryInfo);
	}
}

export default PeerHTTP;
