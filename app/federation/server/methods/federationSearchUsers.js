import { Meteor } from 'meteor/meteor';

import peerClient from '../peerClient';

Meteor.methods({
	federationSearchUsers(identifier) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'federationSearchUsers' });
		}

		if (!peerClient.enabled) {
			throw new Meteor.Error('error-federation-disabled', 'Federation disabled', { method: 'federationSearchUsers' });
		}

		const federatedUsers = peerClient.findUsers(identifier);

		if (!federatedUsers.length) {
			throw new Meteor.Error('federation-user-not-found', `Could not find federated users using "${ identifier }"`);
		}

		return federatedUsers;
	},
});
