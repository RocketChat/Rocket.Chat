Meteor.methods({
	fetchMyKeys() {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'fetchMyKeys' });
		}
		return RocketChat.models.Users.fetchKeysByUserId(userId);
	},
});
