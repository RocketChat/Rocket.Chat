import dnsResolver from 'dns';

import { Meteor } from 'meteor/meteor';

import { logger } from './logger';

import { Federation } from '.';

const dnsResolveSRV = Meteor.wrapAsync(dnsResolver.resolveSrv);
const dnsResolveTXT = Meteor.wrapAsync(dnsResolver.resolveTxt);

class DNS {
	search(peerDomain) {
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

		// If there is not entry, throw error
		if (!srvEntry) {
			throw Federation.errors.peerNotFoundUsingDNS('dns.search');
		}

		// Get the public key from the TXT record
		const publicKeyTxtRecords = dnsResolveTXT(`rocketchat-public-key.${ peerDomain }`);

		// Join the TXT record, that might be split
		const publicKey = publicKeyTxtRecords[0].join('');

		return {
			url: `${ protocol }://${ srvEntry.name }:${ srvEntry.port }`,
			peerDomain,
			publicKey,
		};
	}
}

export const dns = new DNS();
