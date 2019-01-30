import { Meteor } from 'meteor/meteor';

export function findFederatedUser(email) {
	const [username, domain] = email.split('@');

	const { federationPeerClient } = Meteor;

	if (!federationPeerClient) {
		throw new Meteor.Error('federation-not-registered', 'Looks like this server is not registered to the DNS server');
	}

	const searchParameters = { domain };

	// Easter egg: adding a `~` prefix will make
	// the search happen by username and not email
	if (email.indexOf('~') === 0) {
		searchParameters.username = username.substring(1);
	} else {
		searchParameters.email = email;
	}

	return federationPeerClient.findUser(searchParameters);
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
