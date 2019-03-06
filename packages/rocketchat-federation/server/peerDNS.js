import dns from 'dns';
import { Meteor } from 'meteor/meteor';
import { FederationDNSCache } from 'meteor/rocketchat:models';

import { logger } from './logger';
import peerHTTP from './peerHTTP';
import { updateStatus } from './settingsUpdater';

const dnsResolveSRV = Meteor.wrapAsync(dns.resolveSrv);
const dnsResolveTXT = Meteor.wrapAsync(dns.resolveTxt);

class PeerDNS {
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
		const { uniqueId, domain, url, public_key } = peerConfig;

		this.log(`Registering peer with domain ${ domain }...`);

		// Attempt to register peer
		try {
			peerHTTP.request(this.HubPeer, 'POST', '/api/v1/peers', { uniqueId, domain, url, public_key }, { total: 5, stepSize: 1000, tryToUpdateDNS: false });

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
			this.updatePeerDNS(domain);

			peer = FederationDNSCache.findOneByDomain(domain);
		}

		return peer;
	}

	getPeerUsingDNS(domain) {
		this.log(`getPeerUsingDNS: ${ domain }`);

		// Try searching by DNS first
		const srvEntries = dnsResolveSRV(`_rocketchat._tcp.${ domain }`);

		const [srvEntry] = srvEntries;

		// Get the public key from the TXT record
		const txtRecords = dnsResolveTXT(domain);

		let publicKey;

		for (const txtRecord of txtRecords) {
			const joinedTxtRecord = txtRecord.join('');

			if (joinedTxtRecord.indexOf('rocketchat-public-key=') === 0) {
				publicKey = joinedTxtRecord;
				break;
			}
		}

		if (!publicKey) {
			throw new Meteor.Error('ENOTFOUND', 'Could not find public key entry on TXT records');
		}

		publicKey = publicKey.replace('rocketchat-public-key=', '');

		const protocol = srvEntry.name === 'localhost' ? 'http' : 'https';

		return {
			domain,
			url: `${ protocol }://${ srvEntry.name }:${ srvEntry.port }`,
			public_key: publicKey,
		};
	}

	getPeerUsingHub(domain) {
		this.log(`getPeerUsingHub: ${ domain }`);

		// If there is no DNS entry for that, get from the Hub
		const { data: { peer } } = peerHTTP.simpleRequest(this.HubPeer, 'GET', `/api/v1/peers?search=${ domain }`);

		return peer;
	}

	// ##############
	//
	// DNS Management
	//
	// ##############
	updatePeerDNS(domain) {
		this.log(`updatePeerDNS: ${ domain }`);

		let peer;

		try {
			peer = this.getPeerUsingDNS(domain);
		} catch (err) {
			if (err.code !== 'ENOTFOUND') {
				this.log(err);

				throw new Error(`Error trying to fetch SRV DNS entries for ${ domain }`);
			}

			peer = this.getPeerUsingHub(domain);
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

export default new PeerDNS();
