Meteor.methods({
	createToken({user}) {
		if (Meteor.userId() !== user._id && !RocketChat.authz.hasPermission(Meteor.userId(), 'user-generate-access-token')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'createToken' });
		}
		const token = Accounts._generateStampedLoginToken();
		Accounts._insertLoginToken(user._id, token);
		return {
			userId: user._id,
			authToken: token.token
		};
	}
});
