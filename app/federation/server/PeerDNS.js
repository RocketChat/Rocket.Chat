import dns from 'dns';

import { Meteor } from 'meteor/meteor';


import { logger } from './logger';
import { updateStatus } from './settingsUpdater';
import { FederationDNSCache } from '../../models';

import { Federation } from '.';

const dnsResolveSRV = Meteor.wrapAsync(dns.resolveSrv);
const dnsResolveTXT = Meteor.wrapAsync(dns.resolveTxt);

export class PeerDNS {
	constructor() {
		this.config = {};
	}

	setConfig(config) {
		// General
		this.config = config;

		// Setup HubPeer
		const { hub: { url } } = config;
		this.HubPeer = { url };
	}

	log(message) {
		logger.dns.info(message);
	}

	// ########
	//
	// Register
	//
	// ########
	register(peerConfig) {
		const { uniqueId, domain, url, public_key, cloud_token } = peerConfig;

		this.log(`Registering peer with domain ${ domain }...`);

		let headers;
		if (cloud_token && cloud_token !== '') {
			headers = { Authorization: `Bearer ${ cloud_token }` };
		}

		// Attempt to register peer
		try {
			Federation.peerHTTP.request(this.HubPeer, 'POST', '/api/v1/peers', { uniqueId, domain, url, public_key }, { total: 5, stepSize: 1000, tryToUpdateDNS: false }, headers);

			this.log('Peer registered!');

			updateStatus('Running, registered to Hub');

			return true;
		} catch (err) {
			this.log(err);

			this.log('Could not register peer');

			return false;
		}
	}

	// #############
	//
	// Peer Handling
	//
	// #############
	searchPeer(domain) {
		this.log(`searchPeer: ${ domain }`);

		let peer = FederationDNSCache.findOneByDomain(domain);

		// Try to lookup at the DNS Cache
		if (!peer) {
			try {
				this.updatePeerDNS(domain);

				peer = FederationDNSCache.findOneByDomain(domain);
			} catch (err) {
				this.log(`Could not find peer for domain ${ domain }`);
			}
		}

		return peer;
	}

	getPeerUsingDNS(domain) {
		this.log(`getPeerUsingDNS: ${ domain }`);

		// Try searching by DNS first
		const srvEntries = dnsResolveSRV(`_rocketchat._tcp.${ domain }`);

		const [srvEntry] = srvEntries;

		// Get the protocol from the TXT record, if exists
		let protocol = 'https';

		try {
			const protocolTxtRecords = dnsResolveTXT(`rocketchat-protocol.${ domain }`);

			protocol = protocolTxtRecords[0][0] === 'http' ? 'http' : 'https';
		} catch (err) {
			// Ignore the error if the rocketchat-protocol TXT entry does not exist
		}


		// Get the public key from the TXT record
		const publicKeyTxtRecords = dnsResolveTXT(`rocketchat-public-key.${ domain }`);

		// Get the first TXT record, this subdomain should have only a single record
		const publicKeyTxtRecord = publicKeyTxtRecords[0];

		// If there is no record, skip
		if (!publicKeyTxtRecord) {
			throw new Meteor.Error('ENOTFOUND', 'Could not find public key entry on TXT records');
		}

		const publicKey = publicKeyTxtRecord.join('');

		return {
			domain,
			url: `${ protocol }://${ srvEntry.name }:${ srvEntry.port }`,
			public_key: publicKey,
		};
	}

	getPeerUsingHub(domain) {
		this.log(`getPeerUsingHub: ${ domain }`);

		// If there is no DNS entry for that, get from the Hub
		const { data: { peer } } = Federation.peerHTTP.simpleRequest(this.HubPeer, 'GET', `/api/v1/peers?search=${ domain }`);

		return peer;
	}

	// ##############
	//
	// DNS Management
	//
	// ##############
	updatePeerDNS(domain) {
		this.log(`updatePeerDNS: ${ domain }`);

		let peer = null;

		try {
			peer = this.getPeerUsingDNS(domain);
		} catch (err) {
			if (['ENODATA', 'ENOTFOUND'].indexOf(err.code) === -1) {
				this.log(err);

				throw new Error(`Error trying to fetch SRV DNS entries for ${ domain }`);
			}

			try {
				peer = this.getPeerUsingHub(domain);
			} catch (err) {
				throw new Error(`Could not find a peer with domain ${ domain } using the hub`);
			}
		}

		this.updateDNSCache.call(this, peer);

		return peer;
	}

	updateDNSEntry(peer) {
		this.log('updateDNSEntry');

		const { domain } = peer;

		delete peer._id;

		// Make sure public_key has no line breaks
		peer.public_key = peer.public_key.replace(/\n|\r/g, '');

		return FederationDNSCache.upsert({ domain }, peer);
	}

	updateDNSCache(peers) {
		this.log('updateDNSCache');

		peers = Array.isArray(peers) ? peers : [peers];

		for (const peer of peers) {
			this.updateDNSEntry.call(this, peer);
		}
	}
}
