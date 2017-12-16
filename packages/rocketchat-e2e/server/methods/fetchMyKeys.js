Meteor.methods({
	fetchMyKeys() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'fetchMyKeys' });
		}
		return RocketChat.models.Users.fetchMyKeys();
	}
});
