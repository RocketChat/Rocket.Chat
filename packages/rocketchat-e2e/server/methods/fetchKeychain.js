Meteor.methods({
	fetchKeychain(userId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'fetchKeychain' });
		}
		RocketChat.models.Users.fetchKeychain(userId);
	}
});
