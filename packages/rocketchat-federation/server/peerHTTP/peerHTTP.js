import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { Federation } from '../federation';

import { logger } from '../logger.js';

function handleRequestError(peer, err) {
	if (err.code !== 'ENOTFOUND') {
		this.log(err);

		// Rocket.Chat API failure
		if (err.response) {
			throw err.response.data;
		}

		throw err;
	} else {
		this.log(`Trying to update local DNS cache for peer:${ peer.domain }`);

		// If there is an error, try to update the cache and do it again
		return Federation.peerDNS.updatePeerDNS(peer.domain);
	}
}

//
// Actually does the request, handling retries and everything
function doRequest(peer, method, uri, body, totalTries = 1, currentTries = 0, DNSUpdated = false) {
	try {
		return this.simpleRequest(peer, method, uri, body);
	} catch (err) {
		try {
			// Throw the error if the DNS is already up to date, so we start retrying`
			if (DNSUpdated) { throw err; }

			// This will throw an error if the error can't be handled
			// otherwise, it will return the peer, that might be
			// updated due to a DNS update
			const newPeer = handleRequestError.call(this, peer, err);

			return this.doRequest(newPeer, method, uri, body, totalTries, currentTries, true);
		} catch (err) {
			if (currentTries >= totalTries) {
				throw err;
			}

			// In here, the error was different than ENOTFOUND or the DNS was already updated,
			// which means we need to start retrying
			const milli = Math.pow(5, currentTries + 5);

			Meteor.setTimeout(function() {
				this.log(`Retrying ${ currentTries + 1 }/${ totalTries }: ${ method } - ${ uri }`);
				doRequest.call(this, peer, method, uri, body, totalTries, currentTries + 1, DNSUpdated);
			}.bind(this), milli);
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
		logger.info(`[http] ${ message }`);
	}

	//
	// Direct request
	simpleRequest(peer, method, uri, body) {
		const { url: serverBaseURL } = peer;

		const url = `${ serverBaseURL }${ uri }`;

		let data = null;

		if (method === 'POST' || method === 'PUT') {
			data = body;
		}

		this.log(`Sending request: ${ method } - ${ url }`);

		return HTTP.call(method, url, { data, timeout: 2000, headers: { 'x-federation-domain': this.config.peer.domain } });
	}

	//
	// Request trying to find DNS entries
	request(peer, method, uri, body, totalTries = 1) {
		return doRequest.call(this, peer, method, uri, body, totalTries);
	}
}

export default PeerHTTP;
