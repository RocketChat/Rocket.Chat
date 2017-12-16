Meteor.methods({
	fetchKeychain(userId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'fetchKeychain' });
		}
		return RocketChat.models.Users.fetchKeychain(userId);
	}
});
