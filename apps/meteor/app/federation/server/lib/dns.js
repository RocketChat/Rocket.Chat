import dnsResolver from 'dns';

import { Meteor } from 'meteor/meteor';
import mem from 'mem';

import * as federationErrors from '../functions/errors';
import { dnsLogger } from './logger';
import { isFederationEnabled } from './isFederationEnabled';
import { federationRequest } from './http';

const dnsResolveSRV = Meteor.wrapAsync(dnsResolver.resolveSrv);
const dnsResolveTXT = Meteor.wrapAsync(dnsResolver.resolveTxt);

const cacheMaxAge = 3600000; // one hour
const memoizedDnsResolveSRV = mem(dnsResolveSRV, { maxAge: cacheMaxAge });
const memoizedDnsResolveTXT = mem(dnsResolveTXT, { maxAge: cacheMaxAge });

const hubUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : 'https://hub.rocket.chat';

export async function registerWithHub(peerDomain, url, publicKey) {
	const body = { domain: peerDomain, url, public_key: publicKey };

	try {
		// If there is no DNS entry for that, get from the Hub
		await federationRequest('POST', `${hubUrl}/api/v1/peers`, body);

		return true;
	} catch (err) {
		dnsLogger.error(err);

		throw federationErrors.peerCouldNotBeRegisteredWithHub('dns.registerWithHub');
	}
}

export async function searchHub(peerDomain) {
	try {
		dnsLogger.debug(`searchHub: peerDomain=${peerDomain}`);

		// If there is no DNS entry for that, get from the Hub
		const {
			data: { peer },
		} = await federationRequest('GET', `${hubUrl}/api/v1/peers?search=${peerDomain}`);

		if (!peer) {
			dnsLogger.debug(`searchHub: could not find peerDomain=${peerDomain}`);
			throw federationErrors.peerCouldNotBeRegisteredWithHub('dns.registerWithHub');
		}

		const { url, public_key: publicKey } = peer;

		dnsLogger.debug(`searchHub: found peerDomain=${peerDomain} url=${url}`);

		return {
			url,
			peerDomain,
			publicKey,
		};
	} catch (err) {
		dnsLogger.error(err);

		throw federationErrors.peerNotFoundUsingDNS('dns.searchHub');
	}
}

export function search(peerDomain) {
	if (!isFederationEnabled()) {
		throw federationErrors.disabled('dns.search');
	}

	dnsLogger.debug(`search: peerDomain=${peerDomain}`);

	let srvEntries = [];
	let protocol = '';

	// Search by HTTPS first
	try {
		dnsLogger.debug(`search: peerDomain=${peerDomain} srv=_rocketchat._https.${peerDomain}`);
		srvEntries = memoizedDnsResolveSRV(`_rocketchat._https.${peerDomain}`);
		protocol = 'https';
	} catch (err) {
		// Ignore errors when looking for DNS entries
	}

	// If there is not entry, try with http
	if (!srvEntries.length) {
		try {
			dnsLogger.debug(`search: peerDomain=${peerDomain} srv=_rocketchat._http.${peerDomain}`);
			srvEntries = memoizedDnsResolveSRV(`_rocketchat._http.${peerDomain}`);
			protocol = 'http';
		} catch (err) {
			// Ignore errors when looking for DNS entries
		}
	}

	// If there is not entry, try with tcp
	if (!srvEntries.length) {
		try {
			dnsLogger.debug(`search: peerDomain=${peerDomain} srv=_rocketchat._tcp.${peerDomain}`);
			srvEntries = memoizedDnsResolveSRV(`_rocketchat._tcp.${peerDomain}`);
			protocol = 'https'; // https is the default

			// Then, also try to get the protocol
			dnsLogger.debug(`search: peerDomain=${peerDomain} txt=rocketchat-tcp-protocol.${peerDomain}`);
			protocol = memoizedDnsResolveSRV(`rocketchat-tcp-protocol.${peerDomain}`);
			protocol = protocol[0].join('');

			if (protocol !== 'http' && protocol !== 'https') {
				protocol = null;
			}
		} catch (err) {
			// if there is an error while getting the _tcp entry, it means the config is not there
			// but if there is an error looking for the `_rocketchat_tcp_protocol` entry, it means we should use https
		}
	}

	const [srvEntry] = srvEntries;

	// If there is no entry, throw error
	if (!srvEntry || !protocol) {
		dnsLogger.debug({
			msg: 'search: could not find valid SRV entry',
			peerDomain,
			srvEntry,
			protocol,
		});
		return searchHub(peerDomain);
	}

	let publicKey = null;

	// Get the public key from the TXT record
	try {
		dnsLogger.debug(`search: peerDomain=${peerDomain} txt=rocketchat-public-key.${peerDomain}`);
		const publicKeyTxtRecords = memoizedDnsResolveTXT(`rocketchat-public-key.${peerDomain}`);

		// Join the TXT record, that might be split
		publicKey = publicKeyTxtRecords[0].join('');
	} catch (err) {
		// Ignore errors when looking for DNS entries
	}

	// If there is no entry, throw error
	if (!publicKey) {
		dnsLogger.debug(`search: could not find TXT entry for peerDomain=${peerDomain} - SRV entry found`);
		return searchHub(peerDomain);
	}

	dnsLogger.debug({ msg: 'search: found', peerDomain, srvEntry, protocol });

	return {
		url: `${protocol}://${srvEntry.name}:${srvEntry.port}`,
		peerDomain,
		publicKey,
	};
}
