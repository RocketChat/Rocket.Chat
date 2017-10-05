Meteor.methods({
	setUserActiveStatus(userId, active) {
		check(userId, String);
		check(active, Boolean);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setUserActiveStatus'
			});
		}

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'edit-other-user-active-status') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setUserActiveStatus'
			});
		}

		const user = RocketChat.models.Users.findOneById(userId);

		if (user) {
			RocketChat.models.Users.setUserActive(userId, active);

			if (user.username) {
				RocketChat.models.Subscriptions.setArchivedByUsername(user.username, !active);
			}

			if (active === false) {
				RocketChat.models.Users.unsetLoginTokens(userId);
			}

			return true;
		}

		return false;
	}
});
