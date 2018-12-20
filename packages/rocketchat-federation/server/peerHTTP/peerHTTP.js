import { HTTP } from 'meteor/http';

class PeerHTTP {

	constructor(config) {
		// General
		this.config = config;
	}

	log(message) {
		console.log(`[federation-http] ${ message }`);
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
		try {
			return this.simpleRequest(peer, method, uri, body);
		} catch (err) {
			if (err.code !== 'ENOTFOUND') {
				this.log(err);

				throw new Error(`Could not send request to ${ peer.domain }`);
			}

			this.log(`Trying to update local DNS cache for peer:${ peer.domain }`);

			// If there is an error, try to update the cache and do it again
			const newPeer = Meteor.federationPeerDNS.updatePeerDNS(peer.domain);

			try {
				return this.simpleRequest(newPeer, method, uri, body);
			} catch (err) {
				this.log(err);

				throw new Error(`Could not send request to ${ peer.domain }`);
			}
		}
	}
}

export default PeerHTTP;
