import { Meteor } from 'meteor/meteor';
import { Users } from 'meteor/rocketchat:models';

import { logger } from '../logger';
import peerClient from '../peerClient';

Meteor.methods({
	federationAddUser(emailAddress, domainOverride) {
		// Make sure the federated user still exists, and get the unique one, by email address
		const [federatedUser] = peerClient.findUsers(emailAddress, { domainOverride, emailOnly: true });

		if (!federatedUser) {
			throw new Meteor.Error('federation-invalid-user', 'There is no user to add.');
		}

		let user = null;

		const localUser = federatedUser.getLocalUser();

		// Delete the _id
		delete localUser._id;

		try {
			// Create the local user
			user = Users.create(localUser);
		} catch (err) {
			// If the user already exists, return the existing user
			if (err.code === 11000) {
				user = Users.findOne({ 'federation._id': localUser.federation._id });
			}

			logger.error(err);
		}

		return user;
	},
});
