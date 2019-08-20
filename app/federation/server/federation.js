import './federationSettings';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { settings } from '../../settings';
import { logger } from './logger';
import * as errors from './errors';
import { addUser } from './methods/addUser';
import { loadContextEvents } from './methods/loadContextEvents';
import { searchUsers } from './methods/searchUsers';
import { dns } from './dns';
import { http } from './http';
import { client } from './_client';
import { server } from './_server';
import { crypt } from './crypt';
import { FederationKeys } from '../../models/server';
import { updateStatus, updateEnabled } from './settingsUpdater';

import './methods/testSetup';

// Export Federation object
export const Federation = {
	enabled: false,
	domain: '',

	errors,

	client,
	dns,
	http,
	server,
	crypt,
};

// Add Federation methods
Federation.methods = {
	addUser,
	loadContextEvents,
	searchUsers,
};

// Create key pair if needed
if (!FederationKeys.getPublicKey()) {
	FederationKeys.generateKeys();
}

const updateSettings = _.debounce(Meteor.bindEnvironment(function() {
	const _enabled = settings.get('FEDERATION_Enabled');

	if (!_enabled) {
		updateStatus('Disabled');

		return;
	}

	Federation.domain = settings.get('FEDERATION_Domain').replace('@', '');
	Federation.discoveryMethod = settings.get('FEDERATION_Discovery_Method');

	// Get the key pair
	Federation.privateKey = FederationKeys.getPrivateKey();
	Federation.publicKey = FederationKeys.getPublicKey();

	if (Federation.discoveryMethod === 'hub') {
		// Register with hub
		try {
			Federation.dns.registerWithHub(Federation.domain, settings.get('Site_Url'), FederationKeys.getPublicKeyString());
		} catch (err) {
			// Disable federation
			updateEnabled(false);

			updateStatus('Could not register with Hub');
		}
	} else {
		updateStatus('Enabled');
	}
}), 150);

function enableOrDisable() {
	Federation.enabled = settings.get('FEDERATION_Enabled');

	logger.setup.info(`Federation is ${ Federation.enabled ? 'enabled' : 'disabled' }`);

	Federation.enabled && updateSettings();
}

// Add settings listeners
settings.get('FEDERATION_Enabled', enableOrDisable);
settings.get('FEDERATION_Domain', updateSettings);
settings.get('FEDERATION_Discovery_Method', updateSettings);
