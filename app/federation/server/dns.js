import dnsResolver from 'dns';

import { Meteor } from 'meteor/meteor';

import { logger } from './logger';

import { Federation } from '.';

const dnsResolveSRV = Meteor.wrapAsync(dnsResolver.resolveSrv);
const dnsResolveTXT = Meteor.wrapAsync(dnsResolver.resolveTxt);

class DNS {
	constructor() {
		this.hubUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : 'https://hub.rocket.chat';
	}

	registerWithHub(peerDomain, url, publicKey) {
		console.log('registerWithHub ->', peerDomain, url, publicKey);
		const body = { domain: peerDomain, url, public_key: publicKey };

		try {
			// If there is no DNS entry for that, get from the Hub
			Federation.http.request('POST', `${ this.hubUrl }/api/v1/peers`, body);

			return true;
		} catch (err) {
			logger.dns.error(err);

			throw Federation.errors.peerCouldNotBeRegisteredWithHub('dns.registerWithHub');
		}
	}

	searchHub(peerDomain) {
		console.log('searchHub ->', peerDomain);
		try {
			// If there is no DNS entry for that, get from the Hub
			const { data: { peer } } = Federation.http.request('GET', `${ this.hubUrl }/api/v1/peers?search=${ peerDomain }`);

			if (!peer) {
				throw Federation.errors.peerCouldNotBeRegisteredWithHub('dns.registerWithHub');
			}

			const { url, public_key: publicKey } = peer;

			return {
				url,
				peerDomain,
				publicKey,
			};
		} catch (err) {
			logger.dns.error(err);

			throw Federation.errors.peerNotFoundUsingDNS('dns.searchHub');
		}
	}

	search(peerDomain) {
		console.log('search ->', peerDomain);
		if (!Federation.enabled) {
			throw Federation.errors.disabled('dns.search');
		}

		logger.dns.debug(`search: ${ peerDomain }`);

		let srvEntries = [];
		let protocol = '';

		// Search by HTTPS first
		try {
			srvEntries = dnsResolveSRV(`_rocketchat._https.${ peerDomain }`);
			protocol = 'https';
		} catch (err) {
			// Ignore errors when looking for DNS entries
		}

		// If there is not entry, try with http
		if (!srvEntries.length) {
			try {
				srvEntries = dnsResolveSRV(`_rocketchat._http.${ peerDomain }`);
				protocol = 'http';
			} catch (err) {
				// Ignore errors when looking for DNS entries
			}
		}

		const [srvEntry] = srvEntries;

		// If there is no entry, throw error
		if (!srvEntry) {
			return this.searchHub(peerDomain);
		}

		// Get the public key from the TXT record
		const publicKeyTxtRecords = dnsResolveTXT(`rocketchat-public-key.${ peerDomain }`);

		// Join the TXT record, that might be split
		const publicKey = publicKeyTxtRecords[0].join('');

		// If there is no entry, throw error
		if (!publicKey) {
			return this.searchHub(peerDomain);
		}

		return {
			url: `${ protocol }://${ srvEntry.name }:${ srvEntry.port }`,
			peerDomain,
			publicKey,
		};
	}
}

export const dns = new DNS();
