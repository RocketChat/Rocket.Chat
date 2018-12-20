import { Meteor } from 'meteor/meteor';

import PeerClient from './peerClient';
import PeerDNS from './peerDNS';
import PeerHTTP from './peerHTTP';
import PeerServer from './peerServer';

const { FederationKeys } = RocketChat.models;

(function generateFederationKeys() {
	// Create key pair if needed
	if (!FederationKeys.getPublicKey()) {
		FederationKeys.generateKeys();
	}
}());

if (!!RocketChat.settings.get('FEDERATION_Enabled') === true) {
	Meteor.startup(() => {
		console.log('[federation] Booting...');

		// Are we using the hub?
		const discoveryMethod = RocketChat.settings.get('FEDERATION_Discovery_Method');

		const peerUrl = RocketChat.settings.get('Site_Url');
		const domain = RocketChat.settings.get('FEDERATION_Domain');
		const hubUrl = RocketChat.settings.get('FEDERATION_Hub_URL');

		if (!domain) {
			console.log('[federation] Configuration is not correct, federation is NOT running.');
			console.log(`[federation] domain:${ domain }`);
			return;
		}

		if (discoveryMethod === 'hub' && !hubUrl) {
			console.log('[federation] Configuration is not correct, federation is NOT running.');
			console.log(`[federation] domain:${ domain } | hub:${ hubUrl }`);
			return;
		}

		// Get the key pair
		Meteor.federationPrivateKey = FederationKeys.getPrivateKey();
		Meteor.federationPublicKey = FederationKeys.getPublicKey();

		// Normalize the config values
		const config = {
			hub: {
				active: discoveryMethod === 'hub',
				url: hubUrl.replace(/\/+$/, ''),
			},
			peer: {
				domain: domain.replace('@', '').trim(),
				url: peerUrl.replace(/\/+$/, ''),
				public_key: FederationKeys.getPublicKeyString(),
			},
		};

		// Add global information
		Meteor.federationLocalIdentifier = config.identifier;
		Meteor.federationPeerDNS = new PeerDNS(config);
		Meteor.federationPeerHTTP = new PeerHTTP(config);
		Meteor.federationPeerClient = new PeerClient(config);
		Meteor.federationPeerServer = new PeerServer(config);

		// Register if using the hub
		if (!Meteor.federationPeerClient.register()) { return; }

		Meteor.federationPeerServer.start();
	});
}
