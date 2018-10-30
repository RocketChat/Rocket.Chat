Meteor.methods({
	resetUserE2EKey(userId) {
		check(userId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'resetUserE2EKey',
			});
		}

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'reset-other-user-e2e-key') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'resetUserE2EKey',
			});
		}

		RocketChat.models.Users.resetE2EKey(userId);
		return true;
	},
});
