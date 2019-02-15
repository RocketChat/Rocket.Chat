import { Meteor } from 'meteor/meteor';
import { logger } from './logger.js';

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

function setupFederation() {
	const _enabled = RocketChat.settings.get('FEDERATION_Enabled');
	const _domain = RocketChat.settings.get('FEDERATION_Domain');
	const _discoveryMethod = RocketChat.settings.get('FEDERATION_Discovery_Method');
	const _hubUrl = RocketChat.settings.get('FEDERATION_Hub_URL');

	// Ignore if one of the values is not set, or federation is not enabled
	if (!_enabled || !_domain || !_discoveryMethod || !_hubUrl) { return; }

	logger.info(`[federation] ${ Meteor.federationEnabled ? 'Updating settings' : 'Booting' }...`);

	const peerUrl = RocketChat.settings.get('Site_Url');
	let domain = _domain.replace('@', '').trim();

	// Ensure domain never changes
	const localPeerDNSEntry = RocketChat.models.FederationDNSCache.findOne({ local: true });
	if (!localPeerDNSEntry) {
		RocketChat.models.FederationDNSCache.insert({ local: true, domain });
	} else if (localPeerDNSEntry.domain !== domain) {
		logger.info(`[federation] User tried to change the current domain from ${ localPeerDNSEntry.domain } to ${ domain }, currently not supported.`);

		// RocketChat.settings.set('FEDERATION_Domain', localPeerDNSEntry.domain);

		domain = localPeerDNSEntry.domain;
	}

	if (!domain) {
		logger.info('[federation] Configuration is not correct, federation is NOT running.');
		logger.info(`[federation] domain:${ domain }`);

		// RocketChat.settings.set('FEDERATION_Enabled', false);

		return;
	}

	if (_discoveryMethod === 'hub' && !_hubUrl) {
		logger.info('[federation] Configuration is not correct, federation is NOT running.');
		logger.info(`[federation] domain:${ domain } | hub:${ _hubUrl }`);

		// RocketChat.settings.set('FEDERATION_Enabled', false);

		return;
	}

	// Get the key pair
	Meteor.federationPrivateKey = FederationKeys.getPrivateKey();
	Meteor.federationPublicKey = FederationKeys.getPublicKey();

	// Normalize the config values
	const config = {
		hub: {
			active: _discoveryMethod === 'hub',
			url: _hubUrl.replace(/\/+$/, ''),
		},
		peer: {
			domain: domain.replace('@', '').trim(),
			url: peerUrl.replace(/\/+$/, ''),
			public_key: FederationKeys.getPublicKeyString(),
		},
	};

	// Update configuration
	if (Meteor.federationEnabled) {
		Meteor.federationPeerDNS.updateConfig(config);
		Meteor.federationPeerHTTP.updateConfig(config);
		Meteor.federationPeerClient.updateConfig(config);
		Meteor.federationPeerServer.updateConfig(config);

		// This means we need to register again
		if (Meteor.federationUsingHub !== (_discoveryMethod === 'hub')) {
			Meteor.federationUsingHub = _discoveryMethod === 'hub';

			Meteor.federationPeerClient.register();
		}
	} else {
		// Add global information
		Meteor.federationEnabled = true;
		Meteor.federationUsingHub = _discoveryMethod === 'hub';
		Meteor.federationLocalIdentifier = config.peer.domain;
		Meteor.federationPeerDNS = new PeerDNS(config);
		Meteor.federationPeerHTTP = new PeerHTTP(config);
		Meteor.federationPeerClient = new PeerClient(config);
		Meteor.federationPeerServer = new PeerServer(config);

		Meteor.federationPeerServer.start();

		Meteor.federationPeerClient.register();
	}
}

// Start Federation
RocketChat.settings.get('FEDERATION_Enabled', setupFederation);
RocketChat.settings.get('FEDERATION_Domain', setupFederation);
RocketChat.settings.get('FEDERATION_Discovery_Method', setupFederation);
RocketChat.settings.get('FEDERATION_Hub_URL', setupFederation);
