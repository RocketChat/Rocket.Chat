import { Meteor } from 'meteor/meteor';
import { logger } from '../logger.js';

import { findFederatedUser } from './federationSearchUser';

Meteor.methods({
	federationAddUser(emailAddress) {
		// Make sure the federated user still exists
		const federatedUser = findFederatedUser(emailAddress);

		if (!federatedUser) {
			throw new Meteor.Error('federation-invalid-user', 'Federated user is not valid.');
		}

		let user = null;

		const localUser = federatedUser.getLocalUser();

		// Delete the _id
		delete localUser._id;

		try {
			// Create the local user
			user = RocketChat.models.Users.create(localUser);
		} catch (err) {
			// If the user already exists, return the existing user
			if (err.code === 11000) {
				return RocketChat.models.Users.findOne({ 'federation._id': localUser.federation._id });
			}

			logger.error(err);
		}

		return user;
	},
});
