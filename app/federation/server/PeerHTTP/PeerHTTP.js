import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { logger } from '../logger';
import { Federation } from '../';

import { skipRetryOnSpecificError, delay } from './utils';

export class PeerHTTP {
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
		const { url: serverBaseURL } = peer;

		const url = `${ serverBaseURL }${ uri }`;

		let data = null;

		if (method === 'POST' || method === 'PUT') {
			data = body;
		}

		this.log(`Sending request: ${ method } - ${ url }`);

		return HTTP.call(method, url, {
			data,
			timeout: 2000,
			headers: { ...headers, 'x-federation-domain': this.config.peer.domain },
		});
	}

	//
	// Request trying to find DNS entries
	request(peer, method, uri, body, retryInfo = {}, headers = {}) {
		// Normalize retry info
		retryInfo = {
			total: retryInfo.total || 1,
			stepSize: retryInfo.stepSize || 100,
			stepMultiplier: retryInfo.stepMultiplier || 1,
			tryToUpdateDNS:
				retryInfo.tryToUpdateDNS === undefined
					? true
					: retryInfo.tryToUpdateDNS,
			DNSUpdated: false,
		};

		for (let i = 0; i <= retryInfo.total; i++) {
			try {
				return this.simpleRequest(peer, method, uri, body, headers);
			} catch (err) {
				try {
					if (retryInfo.tryToUpdateDNS && !retryInfo.DNSUpdated) {
						i--;

						retryInfo.DNSUpdated = true;

						this.log(
							`Trying to update local DNS cache for peer:${ peer.domain }`
						);

						peer = Federation.peerDNS.updatePeerDNS(peer.domain);

						continue;
					}
				} catch (err) {
					if (err.response && err.response.statusCode === 404) {
						throw new Meteor.Error(
							'federation-peer-does-not-exist',
							'Peer does not exist'
						);
					}
				}

				// Check if we need to skip due to specific error
				const {
					skip: skipOnSpecificError,
					error: specificError,
				} = skipRetryOnSpecificError(err);
				if (skipOnSpecificError) {
					this.log(`Retry: skipping due to specific error: ${ specificError }`);

					throw err;
				}

				if (i === retryInfo.total - 1) {
					// Throw the error, as we could not fulfill the request
					this.log('Retry: could not fulfill the request');

					throw err;
				}

				const timeToRetry =
					retryInfo.stepSize * (i + 1) * retryInfo.stepMultiplier;

				this.log(`Trying again in ${ timeToRetry / 1000 }s: ${ method } - ${ uri }`);

				// Otherwise, wait and try again
				delay(timeToRetry);
			}
		}
	}
}
