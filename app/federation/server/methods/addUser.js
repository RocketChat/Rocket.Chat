import { Meteor } from 'meteor/meteor';
import { Users } from '../../../models';

import { Federation } from '../';
import { logger } from '../logger';

export function addUser(identifier) {
	if (!Meteor.userId()) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'Federation.addUser' });
	}

	if (!Federation.peerServer.enabled) {
		throw new Meteor.Error('error-federation-disabled', 'Federation disabled', { method: 'Federation.addUser' });
	}

	// Make sure the federated user still exists, and get the unique one, by email address
	const [federatedUser] = Federation.peerClient.findUsers(identifier, { usernameOnly: true });

	if (!federatedUser) {
		throw new Meteor.Error('federation-invalid-user', 'There is no user to add.');
	}

	let user = null;

	const localUser = federatedUser.getLocalUser();

	localUser.name += `@${ federatedUser.user.federation.peer }`;

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
}
