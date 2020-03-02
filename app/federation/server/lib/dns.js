import dnsResolver from 'dns';

import { Meteor } from 'meteor/meteor';

import * as federationErrors from '../functions/errors';
import { logger } from './logger';
import { isFederationEnabled } from './isFederationEnabled';
import { federationRequest } from './http';

const dnsResolveSRV = Meteor.wrapAsync(dnsResolver.resolveSrv);
const dnsResolveTXT = Meteor.wrapAsync(dnsResolver.resolveTxt);

const hubUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : 'https://hub.rocket.chat';

export function registerWithHub(peerDomain, url, publicKey) {
	const body = { domain: peerDomain, url, public_key: publicKey };

	try {
		// If there is no DNS entry for that, get from the Hub
		federationRequest('POST', `${ hubUrl }/api/v1/peers`, body);

		return true;
	} catch (err) {
		logger.dns.error(err);

		throw federationErrors.peerCouldNotBeRegisteredWithHub('dns.registerWithHub');
	}
}

export function searchHub(peerDomain) {
	try {
		// If there is no DNS entry for that, get from the Hub
		const { data: { peer } } = federationRequest('GET', `${ hubUrl }/api/v1/peers?search=${ peerDomain }`);

		if (!peer) {
			throw federationErrors.peerCouldNotBeRegisteredWithHub('dns.registerWithHub');
		}

		const { url, public_key: publicKey } = peer;

		return {
			url,
			peerDomain,
			publicKey,
		};
	} catch (err) {
		logger.dns.error(err);

		throw federationErrors.peerNotFoundUsingDNS('dns.searchHub');
	}
}

export function search(peerDomain) {
	if (!isFederationEnabled()) {
		throw federationErrors.disabled('dns.search');
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
		return searchHub(peerDomain);
	}

	// Get the public key from the TXT record
	const publicKeyTxtRecords = dnsResolveTXT(`rocketchat-public-key.${ peerDomain }`);

	// Join the TXT record, that might be split
	const publicKey = publicKeyTxtRecords[0].join('');

	// If there is no entry, throw error
	if (!publicKey) {
		return searchHub(peerDomain);
	}

	return {
		url: `${ protocol }://${ srvEntry.name }:${ srvEntry.port }`,
		peerDomain,
		publicKey,
	};
}
