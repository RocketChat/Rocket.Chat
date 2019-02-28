import { Meteor } from 'meteor/meteor';
import { Federation } from '../federation';

export function findFederatedUsers(email, options = {}) {
	return Federation.peerClient.findUsers(email, options);
}

Meteor.methods({
	federationSearchUsers(email) {
		if (!Meteor.userId()) {
			return [];
		}

		const federatedUsers = findFederatedUsers(email);

		if (!federatedUsers.length) {
			throw new Meteor.Error('federation-user-not-found', `Could not find federated users using "${ email }"`);
		}

		return federatedUsers;
	},
});
