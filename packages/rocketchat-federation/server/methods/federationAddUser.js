import { Meteor } from 'meteor/meteor';

import { findFederatedUser } from './federationSearchUser';

Meteor.methods({
	federationAddUser(emailAddress) {
		// Make sure the federated user still exists
		const federatedUser = findFederatedUser(emailAddress);

		if (!federatedUser) {
			throw new Meteor.Error('federation-invalid-user', 'Federated user is not valid.');
		}

		let user = null;

		try {
			const localUser = federatedUser.getLocalUser();

			// Delete the _id
			delete localUser._id;

			// Create the local user
			user = RocketChat.models.Users.create(localUser);
		} catch (err) {
			console.log(err);
		}

		return user;
	},
});
