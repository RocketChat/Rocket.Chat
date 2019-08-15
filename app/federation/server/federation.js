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

// Export Federation object
export const Federation = {
	enabled: false,
	domain: '',

	errors,

	client,
	dns,
	http,
	server,
};

// Add Federation methods
Federation.methods = {
	addUser,
	loadContextEvents,
	searchUsers,
	// ping,
};

const updateSettings = _.debounce(Meteor.bindEnvironment(function() {
	Federation.domain = settings.get('FEDERATION_Domain').replace('@', '');
}), 150);

function enableOrDisable() {
	Federation.enabled = settings.get('FEDERATION_Enabled');

	logger.setup.info(`Federation is ${ Federation.enabled ? 'enabled' : 'disabled' }`);

	Federation.enabled && updateSettings();
}

// Add settings listeners
settings.get('FEDERATION_Enabled', enableOrDisable);
settings.get('FEDERATION_Domain', updateSettings);
