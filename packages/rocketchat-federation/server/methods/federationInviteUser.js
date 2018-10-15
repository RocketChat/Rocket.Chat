Meteor.methods({
	federationInviteUser(email) {
		if (!Meteor.userId()) {
			return false;
		}

		let user = RocketChat.models.Users.findOneByEmailAddress(email);

		if (user) {
			throw new Meteor.Error('federation-user-already-exists', `A user with the email "${ email }" already exists`);
		}

		const { peerClient } = Meteor;

		if (!peerClient) {
			throw new Meteor.Error('federation-not-registered', 'Looks like this server is not registered to the DNS server');
		}

		const federatedUser = peerClient.findUser({ email });

		if (!federatedUser) {
			throw new Meteor.Error('federation-user-not-found', `Could not find a federated user with the email "${ email }"`);
		}

		user = federatedUser.user;

		// Create the local user
		user = RocketChat.models.Users.create(user);

		return user;
	},
});
