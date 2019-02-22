import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { settings } from 'meteor/rocketchat:settings';

import { Federation } from 'meteor/rocketchat:federation';

import { logger } from './logger.js';
import PeerClient from './peerClient';
import PeerDNS from './peerDNS';
import PeerHTTP from './peerHTTP';
import PeerServer from './peerServer';
import { FederationKeys } from './models/FederationKeys';

(function generateFederationKeys() {
	// Create unique id if needed
	if (!FederationKeys.getUniqueId()) {
		FederationKeys.generateUniqueId();
	}

	// Create key pair if needed
	if (!FederationKeys.getPublicKey()) {
		FederationKeys.generateKeys();
	}
}());

// Initializations
// DNS
Federation.peerDNS = new PeerDNS();
// HTTP
Federation.peerHTTP = new PeerHTTP();
// Client
Federation.peerClient = new PeerClient();
// Start the client, setting up all the callbacks
Federation.peerClient.start();
// Server
Federation.peerServer = new PeerServer();
// Start the server, setting up all the endpoints
Federation.peerServer.start();

const updateSettings = _.debounce(Meteor.bindEnvironment(function() {
	// If it is enabled, check if the settings are there
	const _uniqueId = settings.get('FEDERATION_Unique_Id');
	const _domain = settings.get('FEDERATION_Domain');
	const _discoveryMethod = settings.get('FEDERATION_Discovery_Method');
	const _hubUrl = settings.get('FEDERATION_Hub_URL');
	const _peerUrl = settings.get('Site_Url');

	if (!_domain || !_discoveryMethod || !_hubUrl || !_peerUrl) {
		logger.error('Could not enable Federation, settings are not fully set');

		return;
	}

	logger.info('Updating settings...');

	// Normalize the config values
	const config = {
		hub: {
			active: _discoveryMethod === 'hub',
			url: _hubUrl.replace(/\/+$/, ''),
		},
		peer: {
			uniqueId: _uniqueId,
			domain: _domain.replace('@', '').trim(),
			url: _peerUrl.replace(/\/+$/, ''),
			public_key: FederationKeys.getPublicKeyString(),
		},
	};

	// If the settings are correctly set, let's update the configuration

	// Get the key pair
	Federation.privateKey = FederationKeys.getPrivateKey();
	Federation.publicKey = FederationKeys.getPublicKey();

	// Set important information
	Federation.enabled = true;
	Federation.usingHub = config.hub.active;
	Federation.uniqueId = config.peer.uniqueId;
	Federation.localIdentifier = config.peer.domain;

	// Set DNS
	Federation.peerDNS.setConfig(config);

	// Set HTTP
	Federation.peerHTTP.setConfig(config);

	// Set Client
	Federation.peerClient.setConfig(config);
	Federation.peerClient.enable();

	// Register the client
	Federation.peerClient.register();

	// Set server
	Federation.peerServer.setConfig(config);
	Federation.peerServer.enable();
}), 150);

function enableOrDisable() {
	const _enabled = settings.get('FEDERATION_Enabled');

	// If it was enabled, and was disabled now,
	// make sure we disable everything: callbacks and endpoints
	if (Federation.enabled && !_enabled) {
		Federation.peerClient.disable();
		Federation.peerServer.disable();

		// Disable federation
		Federation.enabled = false;

		logger.info('Shutting down...');

		return;
	}

	// If not enabled, skip
	if (!_enabled) { return; }

	logger.info('Booting...');

	updateSettings();
}

// Add settings listeners
settings.get('FEDERATION_Enabled', enableOrDisable);
settings.get('FEDERATION_Domain', updateSettings);
settings.get('FEDERATION_Discovery_Method', updateSettings);
settings.get('FEDERATION_Hub_URL', updateSettings);
