import { Meteor } from 'meteor/meteor';
import PeerClient from '../peerClient';

export function findFederatedUser(email) {
	const [username, domain] = email.split('@');

	const searchParameters = { domain };

	// Easter egg: adding a `~` prefix will make
	// the search happen by username and not email
	if (email.indexOf('~') === 0) {
		searchParameters.username = username.substring(1);
	} else {
		searchParameters.email = email;
	}

	return PeerClient.findUser(searchParameters);
}

Meteor.methods({
	federationSearchUser(email) {
		if (!Meteor.userId()) {
			return false;
		}

		const federatedUser = findFederatedUser(email);

		if (!federatedUser) {
			throw new Meteor.Error('federation-user-not-found', `Could not find a federated user:"${ email }"`);
		}

		return federatedUser;
	},
});
