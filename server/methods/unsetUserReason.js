Meteor.methods({
	unsetUserReason(userId) {
		check(userId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'unsetUserReason'
			});
		}

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'edit-other-user-active-status') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'unsetUserReason'
			});
		}

		const user = RocketChat.models.Users.findOneById(userId);

		if (user) {
			RocketChat.models.Users.unsetReason(userId);

			return true;
		}

		return false;
	}
});
