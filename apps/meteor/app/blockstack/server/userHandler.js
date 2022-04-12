import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { logger } from './logger';
import { settings } from '../../settings/server';
import { generateUsernameSuggestion } from '../../lib';

// Updates or creates a user after we authenticate with Blockstack
// Clones Accounts.updateOrCreateUserFromExternalService with some modifications
export const updateOrCreateUser = (serviceData, options) => {
	const serviceConfig = ServiceConfiguration.configurations.findOne({ service: 'blockstack' });
	logger.debug('Auth config', serviceConfig);

	// Extract user data from service / token
	const { id, did } = serviceData;
	const { profile } = options;

	// Look for existing Blockstack user
	const user = Meteor.users.findOne({ 'services.blockstack.id': id });
	let userId;
	let isNew = false;

	// Use found or create a user
	if (user) {
		logger.info(`User login with Blockstack ID ${id}`);
		userId = user._id;
	} else {
		isNew = true;
		let emails = [];
		if (!Array.isArray(profile.emails)) {
			// Fix absense of emails by adding placeholder address using decentralised
			// ID at blockstack.email - a holding domain only, no MX record, does not
			// process email, may be used in future to provide decentralised email via
			// gaia, encrypting mail for DID user only. @TODO: document this approach.
			emails.push({ address: `${did}@blockstack.email`, verified: false });
		} else {
			const verified = settings.get('Accounts_Verify_Email_For_External_Accounts');
			// Reformat array of emails into expected format if they exist
			emails = profile.emails.map((address) => ({ address, verified }));
		}

		const newUser = {
			name: profile.name,
			active: true,
			emails,
			services: { blockstack: serviceData },
		};

		// Set username same as in blockstack, or suggest if none
		if (profile.name) {
			newUser.name = profile.name;
		}

		// Take profile username if exists, or generate one if enabled
		if (profile.username && profile.username !== '') {
			newUser.username = profile.username;
		} else if (serviceConfig.generateUsername === true) {
			newUser.username = generateUsernameSuggestion(newUser);
		}
		// If no username at this point it will suggest one from the name

		// Create and get created user to make a couple more mods before returning
		logger.info(`Creating user for Blockstack ID ${id}`);
		userId = Accounts.insertUserDoc({}, newUser);
		logger.debug('New user ${ userId }', newUser);
	}

	// Add login token for blockstack auth session (take expiration from response)
	// TODO: Regquired method result format ignores `.when`
	const { token } = Accounts._generateStampedLoginToken();
	const tokenExpires = serviceData.expiresAt;

	return {
		type: 'blockstack',
		userId,
		token,
		tokenExpires,
		isNew,
	};
};
