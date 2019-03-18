import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { logger } from './logger';
import peerDNS from './peerDNS';

// Should skip the retry if the error is one of the below?
const errorsToSkipRetrying = [
	'error-app-prevented-sending',
];

function skipRetryOnSpecificError(err) {
	return errorsToSkipRetrying.includes(err && err.errorType);
}

// Delay method to wait a little bit before retrying
const delay = Meteor.wrapAsync(function(ms, callback) {
	Meteor.setTimeout(function() {
		callback(null);
	}, ms);
});

function doSimpleRequest(peer, method, uri, body, headers = {}) {
	this.log(`Request: ${ method } ${ uri }`);

	const { url: serverBaseURL } = peer;

	const url = `${ serverBaseURL }${ uri }`;

	let data = null;

	if (method === 'POST' || method === 'PUT') {
		data = body;
	}

	this.log(`Sending request: ${ method } - ${ uri }`);

	return HTTP.call(method, url, { data, timeout: 2000, headers: { ...headers, 'x-federation-domain': this.config.peer.domain } });
}

//
// Actually does the request, handling retries and everything
function doRequest(peer, method, uri, body, retryInfo = {}, headers = {}) {
	// Normalize retry info
	retryInfo = {
		total: retryInfo.total || 1,
		stepSize: retryInfo.stepSize || 100,
		stepMultiplier: retryInfo.stepMultiplier || 1,
		tryToUpdateDNS: retryInfo.tryToUpdateDNS === undefined ? true : retryInfo.tryToUpdateDNS,
		DNSUpdated: false,
	};

	for (let i = 0; i <= retryInfo.total; i++) {
		try {
			return doSimpleRequest.call(this, peer, method, uri, body, headers);
		} catch (err) {
			try {
				if (retryInfo.tryToUpdateDNS && !retryInfo.DNSUpdated) {
					i--;

					retryInfo.DNSUpdated = true;

					this.log(`Trying to update local DNS cache for peer:${ peer.domain }`);

					peer = peerDNS.updatePeerDNS(peer.domain);

					continue;
				}
			} catch (err) {
				if (err.response && err.response.statusCode === 404) {
					throw new Meteor.Error('federation-peer-does-not-exist', 'Peer does not exist');
				}
			}

			// Check if we need to skip due to specific error
			if (skipRetryOnSpecificError(err && err.response && err.response.data)) {
				this.log('Retry: skipping due to specific error');

				throw err;
			}

			if (i === retryInfo.total - 1) {
				// Throw the error, as we could not fulfill the request
				this.log('Retry: could not fulfill the request');

				throw err;
			}

			const timeToRetry = retryInfo.stepSize * (i + 1) * retryInfo.stepMultiplier;

			this.log(`Trying again in ${ timeToRetry / 1000 }s: ${ method } - ${ uri }`);

			// Otherwise, wait and try again
			delay(timeToRetry);
		}
	}
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
	simpleRequest(peer, method, uri, body, headers) {
		return doSimpleRequest.call(this, peer, method, uri, body, headers);
	}

	//
	// Request trying to find DNS entries
	request(peer, method, uri, body, retryInfo = {}, headers = {}) {
		return doRequest.call(this, peer, method, uri, body, retryInfo, headers);
	}
}

export default new PeerHTTP();
