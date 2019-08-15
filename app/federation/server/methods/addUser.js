import { Meteor } from 'meteor/meteor';

import { Users } from '../../../models';

import { Federation } from '..';

export function addUser(query) {
	if (!Meteor.userId()) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'addUser' });
	}

	const user = Federation.client.getUserByUsername(query);

	if (!user) {
		throw Federation.errors.userNotFound(query);
	}

	let userId = user._id;

	try {
		// Create the local user
		userId = Users.create(user);

		// // Refresh the peers list
		// FederationPeers.refreshPeers();
	} catch (err) {
		// This might get called twice by the createDirectMessage method
		// so we need to handle the situation accordingly
		if (err.code !== 11000) {
			throw err;
		}
	}

	return Users.findOne({ _id: userId });
}
