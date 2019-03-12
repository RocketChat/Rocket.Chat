import { Meteor } from 'meteor/meteor';

import peerClient from '../peerClient';
import peerServer from '../peerServer';

Meteor.methods({
	federationSearchUsers(email) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'federationSearchUsers' });
		}

		if (!peerServer.enabled) {
			throw new Meteor.Error('error-federation-disabled', 'Federation disabled', { method: 'federationAddUser' });
		}

		const federatedUsers = peerClient.findUsers(email);

		if (!federatedUsers.length) {
			throw new Meteor.Error('federation-user-not-found', `Could not find federated users using "${ email }"`);
		}

		return federatedUsers;
	},
});
