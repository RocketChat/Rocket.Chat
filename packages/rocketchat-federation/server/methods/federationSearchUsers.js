import { Meteor } from 'meteor/meteor';
import peerClient from '../peerClient';

Meteor.methods({
	federationSearchUsers(email) {
		if (!Meteor.userId()) {
			return [];
		}

		const federatedUsers = peerClient.findUsers(email);

		if (!federatedUsers.length) {
			throw new Meteor.Error('federation-user-not-found', `Could not find federated users using "${ email }"`);
		}

		return federatedUsers;
	},
});
