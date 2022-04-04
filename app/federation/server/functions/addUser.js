import { Meteor } from 'meteor/meteor';

import * as federationErrors from './errors';
import { Users } from '../../../models/server';
import { FederationServers } from '../../../models/server/raw';
import { getUserByUsername } from '../handler';

export async function addUser(query) {
	if (!Meteor.userId()) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'addUser' });
	}

	const user = await getUserByUsername(query);

	if (!user) {
		throw federationErrors.userNotFound(query);
	}

	let userId = user._id;

	try {
		// Create the local user
		userId = Users.create(user);

		// Refresh the servers list
		await FederationServers.refreshServers();
	} catch (err) {
		// This might get called twice by the createDirectMessage method
		// so we need to handle the situation accordingly
		if (err.code !== 11000) {
			throw err;
		}
	}

	return Users.findOne({ _id: userId });
}
