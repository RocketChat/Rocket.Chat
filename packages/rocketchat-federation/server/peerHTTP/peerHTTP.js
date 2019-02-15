import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { logger } from '../logger.js';

class PeerHTTP {

	constructor(config) {
		this.updateConfig(config);
	}

	updateConfig(config) {
		// General
		this.config = config;
	}

	log(message) {
		logger.info(`[federation-http] ${ message }`);
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
	request(peer, method, uri, body) {
		function handleError(err) {
			this.log(err);

			// Rocket.Chat API failure
			if (err.response) {
				throw err.response.data;
			}

			throw err;
		}

		try {
			return this.simpleRequest(peer, method, uri, body);
		} catch (err) {
			if (err.code !== 'ENOTFOUND') {
				handleError.call(this, err);
			}

			this.log(`Trying to update local DNS cache for peer:${ peer.domain }`);

			// If there is an error, try to update the cache and do it again
			const newPeer = Meteor.federationPeerDNS.updatePeerDNS(peer.domain);

			try {
				return this.simpleRequest(newPeer, method, uri, body);
			} catch (err) {
				handleError.call(this, err);
			}
		}
	}
}

export default PeerHTTP;
