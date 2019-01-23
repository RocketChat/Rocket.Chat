import { Meteor } from 'meteor/meteor';

export function findFederatedUser(emailAddress) {
	const [username, domain] = emailAddress.split('@');

	const { federationPeerClient } = Meteor;

	if (!federationPeerClient) {
		throw new Meteor.Error('federation-not-registered', 'Looks like this server is not registered to the DNS server');
	}

	return federationPeerClient.findUser({ username, domain });
}

Meteor.methods({
	federationSearchUser(emailAddress) {
		if (!Meteor.userId()) {
			return false;
		}

		const federatedUser = findFederatedUser(emailAddress);

		if (!federatedUser) {
			throw new Meteor.Error('federation-user-not-found', `Could not find a federated user:"${ emailAddress }"`);
		}

		return federatedUser;
	},
});
