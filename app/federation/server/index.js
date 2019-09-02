import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';

import './federation-settings';
import { logger } from './logger';
import { PeerClient } from './PeerClient';
import { PeerDNS } from './PeerDNS';
import { PeerHTTP } from './PeerHTTP';
import { PeerPinger } from './PeerPinger';
import { PeerServer } from './PeerServer';
import * as SettingsUpdater from './settingsUpdater';
import './methods/dashboard';
import { addUser } from './methods/addUser';
import { searchUsers } from './methods/searchUsers';
import { ping } from './methods/ping';
import { FederationKeys } from '../../models';
import { settings } from '../../settings';
import { getConfig } from './config';

const peerClient = new PeerClient();
const peerDNS = new PeerDNS();
const peerHTTP = new PeerHTTP();
const peerPinger = new PeerPinger();
const peerServer = new PeerServer();

export const Federation = {
	enabled: false,
	privateKey: null,
	publicKey: null,
	usingHub: null,
	uniqueId: null,
	localIdentifier: null,

	peerClient,
	peerDNS,
	peerHTTP,
	peerPinger,
	peerServer,
};

// Add Federation methods
Federation.methods = {
	addUser,
	searchUsers,
	ping,
};

// Generate keys

// Create unique id if needed
if (!FederationKeys.getUniqueId()) {
	FederationKeys.generateUniqueId();
}

// Create key pair if needed
if (!FederationKeys.getPublicKey()) {
	FederationKeys.generateKeys();
}

// Initializations

// Start the client, setting up all the callbacks
peerClient.start();

// Start the server, setting up all the endpoints
peerServer.start();

// Start the pinger, to check the status of all peers
peerPinger.start();

const updateSettings = _.debounce(Meteor.bindEnvironment(function() {
	const _enabled = settings.get('FEDERATION_Enabled');

	if (!_enabled) { return; }

	const config = getConfig();

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
	peerDNS.setConfig(config);

	// Set HTTP
	peerHTTP.setConfig(config);

	// Set Client
	peerClient.setConfig(config);
	peerClient.enable();

	// Set server
	peerServer.setConfig(config);
	peerServer.enable();

	// Register the client
	if (peerClient.register()) {
		SettingsUpdater.updateStatus('Running');
	} else {
		SettingsUpdater.updateNextStatusTo('Disabled, could not register with Hub');
		SettingsUpdater.updateEnabled(false);
	}
}), 150);

function enableOrDisable() {
	const _enabled = settings.get('FEDERATION_Enabled');

	// If it was enabled, and was disabled now,
	// make sure we disable everything: callbacks and endpoints
	if (Federation.enabled && !_enabled) {
		peerClient.disable();
		peerServer.disable();

		// Disable federation
		Federation.enabled = false;

		SettingsUpdater.updateStatus('Disabled');

		logger.setup.info('Shutting down...');

		return;
	}

	// If not enabled, skip
	if (!_enabled) {
		SettingsUpdater.updateStatus('Disabled');
		return;
	}

	logger.setup.info('Booting...');

	SettingsUpdater.updateStatus('Booting...');

	updateSettings();
}

// Add settings listeners
settings.get('FEDERATION_Enabled', enableOrDisable);
settings.get('FEDERATION_Domain', updateSettings);
settings.get('FEDERATION_Discovery_Method', updateSettings);
settings.get('FEDERATION_Hub_URL', updateSettings);
