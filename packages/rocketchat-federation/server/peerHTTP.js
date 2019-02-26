import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { Federation } from './federation';

import { logger } from './logger.js';

// Should skip the retry if the error is one of the below?
const errorsToSkipRetrying = [
	'error-app-prevented-sending'
]

function skipRetryOnSpecificError(err) {
	return !!errorsToSkipRetrying[err.errorType];
}

// Delay method to wait a little bit before retrying
function delay(timeToWait) {
	return new Promise(function(resolve) {
		setTimeout(function() {
    	resolve();
		}, timeToWait);
	});
}

async function doSimpleRequest(peer, method, uri, body) {
	this.log(`Request: ${method} ${uri}`);

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
async function doRequest(peer, method, uri, body, retryInfo = {}) {
	// Normalize retry info
	retryInfo = {
		total: retryInfo.total || 1,
		stepSize: retryInfo.stepSize || 100,
		stepMultiplier: retryInfo.stepMultiplier || 1,
		tryToUpdateDNS: retryInfo.tryToUpdateDNS === undefined ? true : retryInfo.tryToUpdateDNS,
		DNSUpdated: false,
	}

	// Add one extra retry if we are going to try to update the DNS
	retryInfo.total += retryInfo.tryToUpdateDNS ? 1 : 0;

	for (let i = 0; i < retryInfo.total; i++) {
		try {
			return await doSimpleRequest.call(this, peer, method, uri, body);
		} catch (err) {
			if (retryInfo.tryToUpdateDNS && !retryInfo.DNSUpdated) {
				retryInfo.DNSUpdated = true;

				this.log(`Trying to update local DNS cache for peer:${ peer.domain }`);

				// peer = await updatePeerDNSPromise();
				peer = Meteor.bindEnvironment(function() {
					Federation.peerDNS.updatePeerDNS(peer.domain);
				});

				continue;
			}

			// Check if we need to skip due to specific error
			if (skipRetryOnSpecificError(err)) {
				this.log(`Retry: skipping due to specific error`);

				throw err;
			}

			// If this is the last try, throw the error
			if (i === retryInfo.total - 1) {
				this.log(`Retry: could not fulfill the request`);

				throw err;
			}

			this.log(`Retrying ${ i + 1 }/${ retryInfo.total }: ${ method } - ${ uri }`);

			// Otherwise, wait and try again
			await delay(retryInfo.stepSize * (i + 1) * retryInfo.stepMultiplier)
		}
	}

	return null;

	// try {
	// 	return this.simpleRequest(peer, method, uri, body);
	// } catch (err) {
	// 	try {
	// 		// Throw the error if the DNS is already up to date, so we start retrying`
	// 		if (DNSUpdated) { throw err; }
	//
	// 		// This will throw an error if the error can't be handled
	// 		// otherwise, it will return the peer, that might be
	// 		// updated due to a DNS update
	// 		const newPeer = handleRequestError.call(this, peer, err);
	//
	// 		const result = this.doRequest(newPeer, method, uri, body, retryInfo, true);
	//
	// 		// Call the callback, if needed
	// 		retryInfo.callback && retryInfo.callback(null, result);
	//
	// 		return result;
	// 	} catch (err) {
	// 		if (skipRetryOnSpecificError(err)) {
	// 			this.log(`Retry: skipping due to specific error`);
	//
	// 			retryInfo.callback && retryInfo.callback(err);
	// 			return;
	// 		}
	//
	// 		if (retryInfo.current >= retryInfo.total) {
	// 			this.log(`Retry: could not fulfill the request`);
	//
	// 			retryInfo.callback && retryInfo.callback(err);
	// 			return;
	// 		}
	//
	// 		// In here, the error was different than ENOTFOUND or the DNS was already updated,
	// 		// which means we need to start retrying
	// 		const milli = retryInfo.stepSize * (retryInfo.current + 1) * retryInfo.stepMultiplier;
	//
	// 		Meteor.setTimeout(function() {
	// 			this.log(`Retrying ${ retryInfo.current + 1 }/${ retryInfo.total }: ${ method } - ${ uri }`);
	//
	// 			retryInfo.current += 1;
	//
	// 			doRequest.call(this, peer, method, uri, body, retryInfo, DNSUpdated);
	// 		}.bind(this), milli);
	// 	}
	// }
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
		logger.info(message);
	}

	//
	// Direct request
	simpleRequest(peer, method, uri, body) {
		return Promise.await(doSimpleRequest.call(this, peer, method, uri, body));
	}

	//
	// Request trying to find DNS entries
	request(peer, method, uri, body, retryInfo = {}) {
		return Promise.await(doRequest.call(this, peer, method, uri, body, retryInfo));
	}
}

export default PeerHTTP;
